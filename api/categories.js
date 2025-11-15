const mysql = require('mysql2/promise');

// Resolve database configuration from env vars or DATABASE_URL
function resolveDbConfig() {
    const url = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.RAILWAY_DATABASE_URL;
    if (url) {
        try {
            const u = new URL(url);
            return {
                host: u.hostname || 'localhost',
                user: decodeURIComponent(u.username || 'root'),
                password: decodeURIComponent(u.password || ''),
                database: (u.pathname || '').replace(/^\//, '') || (process.env.MYSQLDATABASE || process.env.DB_NAME || 'noor_pro_academic'),
                port: Number(u.port || process.env.MYSQLPORT || process.env.DB_PORT || 3306),
                charset: 'utf8mb4'
            };
        } catch (e) {
            // fall through to env-based config
        }
    }
    return {
        host: process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST || 'localhost',
        user: process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || 'root',
        password: process.env.DB_PASS || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '',
        database: process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DB || 'noor_pro_academic',
        port: Number(process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306),
        charset: 'utf8mb4'
    };
}

const dbConfig = resolveDbConfig();

// Create database connection
async function createConnection() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        return connection;
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}

// Get all categories
async function getCategories(req, res) {
    let connection;
    try {
        connection = await createConnection();
        
        // Count both relational category_id and legacy textual category matches to keep counts consistent
        const query = `
            SELECT 
                cc.id,
                cc.category_name,
                cc.category_name_ar,
                cc.description,
                cc.icon,
                cc.color,
                cc.display_order,
                cc.is_active,
                (
                    SELECT COUNT(*) FROM courses c
                    WHERE c.status = 'active'
                      AND (
                        c.category_id = cc.id
                        OR (c.category_id IS NULL AND LOWER(c.category) IN (LOWER(cc.category_name), LOWER(cc.category_name_ar)))
                      )
                ) AS courses_count
            FROM course_categories cc
            WHERE cc.is_active = 1
            ORDER BY cc.display_order ASC, cc.category_name_ar ASC
        `;
        
        const [rows] = await connection.execute(query);
        
        res.json({
            success: true,
            data: rows,
            message: 'تم جلب التصنيفات بنجاح'
        });
        
    } catch (error) {
        console.error('Error fetching categories from DB, attempting fallback:', error);
        // Graceful fallback to static JSON file
        try {
            const fs = require('fs');
            const path = require('path');
            const jsonPath = path.join(__dirname, 'categories.json');
            const raw = fs.readFileSync(jsonPath, 'utf8');
            const parsed = JSON.parse(raw);
            if (parsed && parsed.success && parsed.data) {
                return res.json({
                    success: true,
                    data: parsed.data,
                    message: 'تم جلب التصنيفات (بيانات ثابتة بسبب مشكلة قاعدة البيانات)'
                });
            }
            return res.status(500).json({
                success: false,
                message: 'خطأ في جلب التصنيفات',
                error: error.message
            });
        } catch (fallbackErr) {
            console.error('Categories JSON fallback failed:', fallbackErr);
            return res.status(500).json({
                success: false,
                message: 'خطأ في جلب التصنيفات',
                error: error.message
            });
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Get courses by category ID
async function getCoursesByCategory(req, res) {
    let connection;
    try {
        const categoryId = req.params.id;
        
        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: 'معرف التصنيف مطلوب'
            });
        }
        
        connection = await createConnection();
        
        // First, get category info
        const categoryQuery = `
            SELECT id, category_name, category_name_ar, description, icon, color
            FROM course_categories 
            WHERE id = ? AND is_active = 1
        `;
        
        const [categoryRows] = await connection.execute(categoryQuery, [categoryId]);
        
        if (categoryRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'التصنيف غير موجود'
            });
        }
        
        // Then, get courses for this category
        // Support both relational category_id and legacy textual category
        const categoryName = categoryRows[0].category_name;
        const categoryNameAr = categoryRows[0].category_name_ar;

        // Build synonym list for legacy textual matching (handles common variants)
        const synonyms = [categoryName, categoryNameAr];
        const cnLower = String(categoryName).toLowerCase();
        switch (cnLower) {
            case 'hr_diploma':
                // Accept common English variants used in admin/inputs
                synonyms.push('hr diplomas', 'hr_diplomas');
                break;
            case 'hr_short':
                // Accept common English variants used in admin/inputs
                synonyms.push('hr short', 'hr_short');
                break;
            default:
                // No additional synonyms for other categories for now
                break;
        }
        const inPlaceholders = synonyms.map(() => 'LOWER(?)').join(', ');

        const coursesQuery = `
            SELECT 
                c.id,
                c.course_code,
                COALESCE(c.title, c.course_name) AS course_name,
                c.description,
                c.credits,
                c.duration_weeks,
                c.duration,
                c.start_date,
                c.end_date,
                c.capacity,
                c.price,
                c.level_name,
                c.details,
                c.instructor_name,
                c.max_students,
                c.youtube_link,
                c.status,
                c.created_at,
                COUNT(e.id) as enrolled_students
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'enrolled'
            WHERE (
                c.category_id = ? 
                OR (c.category_id IS NULL AND LOWER(c.category) IN (${inPlaceholders}))
            ) AND c.status = 'active'
            GROUP BY c.id
            ORDER BY course_name ASC
        `;
        const [coursesRows] = await connection.execute(coursesQuery, [categoryId, ...synonyms]);
        
        res.json({
            success: true,
            data: {
                category: categoryRows[0],
                courses: coursesRows
            },
            message: 'تم جلب المقررات بنجاح'
        });
        
    } catch (error) {
        console.error('Error fetching courses by category:', error);
        // Safe fallback: avoid 500, return sample-filtered or empty list
        const fs = require('fs');
        const path = require('path');
        const catIdNum = Number(req.params.id);

        // Static mapping (no dependency on categories.json)
        const idToKey = {
            1: 'english',
            2: 'hr',
            3: 'technical',
            4: 'speaking',
            5: 'grammar',
            6: 'hr diplomas'
        };
        const legacyKey = idToKey[catIdNum] || null;

        let normalizedCourses = [];
        try {
            const samplePath = path.join(__dirname, '..', 'sample-courses.json');
            const sampleRaw = fs.readFileSync(samplePath, 'utf8');
            const sampleCourses = JSON.parse(sampleRaw);
            const filtered = legacyKey
                ? sampleCourses.filter(c => String(c.category).toLowerCase() === legacyKey)
                : [];
            normalizedCourses = filtered.map(c => ({
                id: c.id,
                course_code: c.course_code,
                course_name: c.title,
                description: c.description,
                credits: c.credits || 3,
                duration_weeks: c.duration_weeks || null,
                duration: c.duration || null,
                start_date: c.start_date || null,
                end_date: c.end_date || null,
                capacity: c.max_students || null,
                price: c.price || '0',
                level_name: c.level_name || null,
                details: c.details || null,
                instructor_name: c.instructor_name || null,
                max_students: c.max_students || null,
                youtube_link: c.youtube_link || null,
                status: 'active',
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                enrolled_students: 0
            }));
        } catch (fallbackErr) {
            console.warn('Sample data fallback failed, returning empty list:', fallbackErr.message);
        }

        const categoryNameMap = {
            1: { en: 'English Language', ar: 'اللغة الإنجليزية' },
            2: { en: 'Human Resources', ar: 'الموارد البشرية' },
            3: { en: 'Technology', ar: 'التقنية' },
            4: { en: 'Speaking Skills', ar: 'Speaking' },
            5: { en: 'English Grammar', ar: 'Grammar' },
            6: { en: 'HR Diplomas', ar: 'HR diplomas' }
        };
        const names = categoryNameMap[catIdNum] || { en: 'Category', ar: 'تصنيف' };

        return res.json({
            success: true,
            data: {
                category: { id: catIdNum, category_name: names.en, category_name_ar: names.ar },
                courses: normalizedCourses
            },
            message: normalizedCourses.length > 0 ? 'تم جلب المقررات من بيانات تجريبية' : 'لا توجد مقررات في هذا التصنيف حالياً'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Add new category (Admin only)
async function addCategory(req, res) {
    let connection;
    try {
        const { category_name, category_name_ar, description, icon, color, display_order } = req.body;
        
        if (!category_name || !category_name_ar) {
            return res.status(400).json({
                success: false,
                message: 'اسم التصنيف مطلوب باللغتين العربية والإنجليزية'
            });
        }
        
        connection = await createConnection();
        
        const query = `
            INSERT INTO course_categories 
            (category_name, category_name_ar, description, icon, color, display_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `;
        
        const [result] = await connection.execute(query, [
            category_name,
            category_name_ar,
            description || null,
            icon || 'fas fa-book',
            color || '#007bff',
            display_order || 999
        ]);
        
        res.json({
            success: true,
            data: { id: result.insertId },
            message: 'تم إضافة التصنيف بنجاح'
        });
        
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إضافة التصنيف',
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Update category (Admin only)
async function updateCategory(req, res) {
    let connection;
    try {
        const categoryId = req.params.id;
        const { category_name, category_name_ar, description, icon, color, display_order, is_active } = req.body;
        
        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: 'معرف التصنيف مطلوب'
            });
        }
        
        connection = await createConnection();
        
        const query = `
            UPDATE course_categories 
            SET category_name = ?, category_name_ar = ?, description = ?, 
                icon = ?, color = ?, display_order = ?, is_active = ?
            WHERE id = ?
        `;
        
        const [result] = await connection.execute(query, [
            category_name,
            category_name_ar,
            description,
            icon,
            color,
            display_order,
            is_active ? 1 : 0,
            categoryId
        ]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'التصنيف غير موجود'
            });
        }
        
        res.json({
            success: true,
            message: 'تم تحديث التصنيف بنجاح'
        });
        
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث التصنيف',
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Delete category (Admin only)
async function deleteCategory(req, res) {
    let connection;
    try {
        const categoryId = req.params.id;
        
        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: 'معرف التصنيف مطلوب'
            });
        }
        
        connection = await createConnection();
        
        // Check if category has courses
        const checkQuery = 'SELECT COUNT(*) as count FROM courses WHERE category_id = ?';
        const [checkResult] = await connection.execute(checkQuery, [categoryId]);
        
        if (checkResult[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن حذف التصنيف لأنه يحتوي على مقررات'
            });
        }
        
        const deleteQuery = 'DELETE FROM course_categories WHERE id = ?';
        const [result] = await connection.execute(deleteQuery, [categoryId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'التصنيف غير موجود'
            });
        }
        
        res.json({
            success: true,
            message: 'تم حذف التصنيف بنجاح'
        });
        
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف التصنيف',
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

module.exports = {
    getCategories,
    getCoursesByCategory,
    addCategory,
    updateCategory,
    deleteCategory
};