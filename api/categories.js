const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'noor_pro_academic',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4'
};

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
                COUNT(c.id) as courses_count
            FROM course_categories cc
            LEFT JOIN courses c ON cc.id = c.category_id AND c.status = 'active'
            WHERE cc.is_active = 1
            GROUP BY cc.id
            ORDER BY cc.display_order ASC, cc.category_name_ar ASC
        `;
        
        const [rows] = await connection.execute(query);
        
        res.json({
            success: true,
            data: rows,
            message: 'تم جلب التصنيفات بنجاح'
        });
        
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب التصنيفات',
            error: error.message
        });
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
                OR LOWER(c.category) IN (LOWER(?), LOWER(?))
            ) AND c.status = 'active'
            GROUP BY c.id
            ORDER BY course_name ASC
        `;
        
        const categoryName = categoryRows[0].category_name;
        const categoryNameAr = categoryRows[0].category_name_ar;
        const [coursesRows] = await connection.execute(coursesQuery, [categoryId, categoryName, categoryNameAr]);
        
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
        // Graceful fallback to sample data if DB connection fails
        try {
            const fs = require('fs');
            const path = require('path');
            const samplePath = path.join(__dirname, '..', 'sample-courses.json');
            const raw = fs.readFileSync(samplePath, 'utf8');
            const sampleCourses = JSON.parse(raw);

            // Static category mapping fallback (mirrors database.sql inserts)
            const categoryMap = {
                1: { id: 1, category_name: 'english', category_name_ar: 'اللغة الإنجليزية', icon: 'fas fa-language', color: '#28a745' },
                2: { id: 2, category_name: 'speaking', category_name_ar: 'المخاطبة', icon: 'fas fa-microphone', color: '#17a2b8' },
                3: { id: 3, category_name: 'grammar', category_name_ar: 'القواعد', icon: 'fas fa-book', color: '#6f42c1' },
                4: { id: 4, category_name: 'hr_diploma', category_name_ar: 'دبلومات الموارد البشرية', icon: 'fas fa-graduation-cap', color: '#fd7e14' },
                5: { id: 5, category_name: 'hr_short', category_name_ar: 'دورات الموارد البشرية القصيرة', icon: 'fas fa-briefcase', color: '#20c997' },
                6: { id: 6, category_name: 'programming', category_name_ar: 'البرمجة', icon: 'fas fa-code', color: '#007bff' },
                7: { id: 7, category_name: 'web_development', category_name_ar: 'تطوير المواقع', icon: 'fas fa-globe', color: '#dc3545' },
                8: { id: 8, category_name: 'database', category_name_ar: 'قواعد البيانات', icon: 'fas fa-database', color: '#6c757d' },
                9: { id: 9, category_name: 'ai', category_name_ar: 'الذكاء الاصطناعي', icon: 'fas fa-robot', color: '#e83e8c' },
                10: { id: 10, category_name: 'security', category_name_ar: 'أمن المعلومات', icon: 'fas fa-shield-alt', color: '#343a40' }
            };

            const cid = parseInt(req.params.id, 10);
            const categoryInfo = categoryMap[cid];

            if (!categoryInfo) {
                return res.status(404).json({ success: false, message: 'التصنيف غير موجود (وضع تجريبي)' });
            }

            const filtered = sampleCourses.filter(c => {
                const cat = (c.category || '').toLowerCase();
                return cat === categoryInfo.category_name.toLowerCase() || cat === (categoryInfo.category_name_ar || '').toLowerCase();
            });

            return res.json({
                success: true,
                data: {
                    category: categoryInfo,
                    courses: filtered
                },
                message: 'تم جلب المقررات (بيانات تجريبية بسبب مشكلة قاعدة البيانات)'
            });
        } catch (fallbackErr) {
            console.error('Fallback failed for categories API:', fallbackErr);
            res.status(500).json({
                success: false,
                message: 'خطأ في جلب المقررات',
                error: error.message
            });
        }
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