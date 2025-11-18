const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
// Helper to normalize boolean-like values sent from frontend or DB
function toBoolean(val) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const v = val.trim().toLowerCase();
    return v === '1' || v === 'true' || v === 'yes' || v === 'on';
  }
  return false;
}

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

// Check if a column exists in a table (MySQL)
async function columnExists(connection, tableName, columnName) {
    try {
        const [rows] = await connection.execute(
            'SELECT COUNT(*) AS cnt FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1',
            [tableName, columnName]
        );
        return (rows[0] && Number(rows[0].cnt) > 0);
    } catch (e) {
        // If information_schema is unavailable for any reason, assume missing to be safe
        return false;
    }
}

// Get a single course by ID
async function getCourseById(req, res) {
    try {
        const connection = await createConnection();
        const courseId = req.params.id;
        
        const query = 'SELECT * FROM courses WHERE id = ?';
        const params = [courseId];
        
        const [rows] = await connection.execute(query, params);
        await connection.end();
        
        if (rows.length > 0) {
            if ('is_featured' in rows[0]) {
                rows[0].is_featured = toBoolean(rows[0].is_featured);
            }
            res.json({
                success: true,
                message: 'تم جلب بيانات الدورة بنجاح',
                course: rows[0]
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'لم يتم العثور على الدورة'
            });
        }
        
    } catch (error) {
        try {
            const samplePath = path.join(__dirname, '..', 'sample-courses.json');
            const raw = fs.readFileSync(samplePath, 'utf8');
            const sampleCourses = JSON.parse(raw);
            const courseId = req.params.id;
            const course = sampleCourses.find(c => String(c.id) === String(courseId));
            
            if (course) {
                res.json({
                    success: true,
                    message: 'تم جلب بيانات الدورة بنجاح من الملف الاحتياطي',
                    course: course
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'لم يتم العثور على الدورة في الملف الاحتياطي'
                });
            }
        } catch (e) {
            res.status(500).json({
                success: false,
                message: 'فشل الاتصال بقاعدة البيانات ولم يتم العثور على الملف الاحتياطي',
                error: e.message
            });
        }
    }
}

// Get all courses
async function getCourses(req, res) {
    try {
        const connection = await createConnection();
        const courseId = req.query.id;
        const search = req.query.search || '';
        
        let query, params;
        
        if (courseId) {
            query = 'SELECT * FROM courses WHERE id = ?';
            params = [courseId];
        } else {
            query = `SELECT * FROM courses WHERE 
                     title LIKE ? OR 
                     course_code LIKE ? OR 
                     instructor_name LIKE ? 
                     ORDER BY id DESC`;
            const searchParam = `%${search}%`;
            params = [searchParam, searchParam, searchParam];
        }
        
        const [rows] = await connection.execute(query, params);
        await connection.end();
        
        const normalized = rows.map(c => ({
            ...c,
            is_featured: toBoolean(c.is_featured)
        }));
        
        res.json({
            success: true,
            message: 'تم جلب البيانات بنجاح',
            courses: normalized
        });
        
    } catch (error) {
        try {
            const samplePath = path.join(__dirname, '..', 'sample-courses.json');
            const raw = fs.readFileSync(samplePath, 'utf8');
            const sampleCourses = JSON.parse(raw);
            const courseId = req.query.id;
            let result = sampleCourses;
            if (courseId) {
                result = sampleCourses.filter(c => String(c.id) === String(courseId));
            } else if (req.query.search) {
                const term = req.query.search.toLowerCase();
                result = sampleCourses.filter(c =>
                    (c.title || '').toLowerCase().includes(term) ||
                    (c.course_code || '').toLowerCase().includes(term) ||
                    (c.instructor_name || '').toLowerCase().includes(term)
                );
            }
            res.json({ success: true, message: 'استخدام بيانات تجريبية', courses: result.map(c => ({...c, is_featured: toBoolean(c.is_featured)})) });
        } catch (fallbackErr) {
            console.error('Error fetching courses (and fallback failed):', fallbackErr);
            res.status(500).json({
                success: false,
                message: 'خطأ في جلب البيانات: ' + (error.message || fallbackErr.message)
            });
        }
    }
}

// Add new course
async function addCourse(req, res) {
    try {
        const connection = await createConnection();
        const {
            course_code,
            title,
            course_name, // for backward compatibility
            description,
            credits,
            duration_weeks,
            duration,
            instructor_name,
            max_students,
            status,
            youtube_link,
            category,
            category_id,
            price,
            level_name,
            start_date,
            end_date,
            course_icon,
            badge_text
        } = req.body;
        
        // Use title or course_name for backward compatibility
        const courseTitle = title || course_name || '';
        
        if (!course_code || !courseTitle) {
            return res.status(400).json({
                success: false,
                message: 'رمز المقرر والعنوان مطلوبان'
            });
        }
        
        // Check for duplicate course code
        const [existing] = await connection.execute(
            'SELECT id FROM courses WHERE course_code = ?',
            [course_code]
        );
        
        if (existing.length > 0) {
            await connection.end();
            return res.status(400).json({
                success: false,
                message: 'رمز المقرر موجود مسبقاً'
            });
        }
        
        // Resolve category_id from provided input or textual category
        let resolvedCategoryId = category_id || null;
        if (!resolvedCategoryId && category) {
            try {
                const [catRows] = await connection.execute(
                    'SELECT id FROM course_categories WHERE LOWER(category_name) = LOWER(?) OR LOWER(category_name_ar) = LOWER(?) LIMIT 1',
                    [category, category]
                );
                if (catRows.length > 0) {
                    resolvedCategoryId = catRows[0].id;
                }
            } catch (e) {
                // ignore mapping error, keep null
            }
        }

        // Determine textual category for legacy compatibility (used when category_id column is missing, and to keep data consistent)
        let categoryText = category || null;
        if (!categoryText && resolvedCategoryId) {
            try {
                const [catInfo] = await connection.execute(
                    'SELECT category_name, category_name_ar FROM course_categories WHERE id = ? LIMIT 1',
                    [resolvedCategoryId]
                );
                if (catInfo.length > 0) {
                    categoryText = catInfo[0].category_name || catInfo[0].category_name_ar || null;
                }
            } catch (_) {
                // ignore, fallback to general later
            }
        }
        if (!categoryText) categoryText = 'general';

        const hasCategoryId = await columnExists(connection, 'courses', 'category_id');
        const hasPriceSDG = await columnExists(connection, 'courses', 'price_sdg');
        let hasIsFeatured = await columnExists(connection, 'courses', 'is_featured');
        const isFeatured = toBoolean(req.body.is_featured);
        if (!hasIsFeatured) {
            try {
                await connection.execute('ALTER TABLE courses ADD COLUMN is_featured TINYINT(1) DEFAULT 0');
                hasIsFeatured = true;
            } catch (_) {}
        }
        let query, params;
        if (hasCategoryId) {
            const valuesCount = (hasPriceSDG ? 20 : 19) + (hasIsFeatured ? 1 : 0);
            query = `INSERT INTO courses (
                course_code, course_name, title, description, credits, duration_weeks, duration,
                instructor_name, max_students, status, youtube_link, category, 
                price${hasPriceSDG ? ', price_sdg' : ''}, level_name, start_date, end_date, course_icon, badge_text, category_id${hasIsFeatured ? ', is_featured' : ''}
            ) VALUES (${Array.from({length: valuesCount}).map(() => '?').join(', ')})`;
            params = [
                course_code,
                courseTitle, // course_name
                courseTitle,
                description || null,
                credits || 3,
                duration_weeks || 16,
                duration || null,
                instructor_name || null,
                max_students || 30,
                status || 'active',
                youtube_link || null,
                categoryText,
                price || '0',
                ...(hasPriceSDG ? [req.body.price_sdg || null] : []),
                level_name || 'مبتدئ',
                start_date || null,
                end_date || null,
                course_icon || 'fas fa-book',
                badge_text || null,
                resolvedCategoryId || null,
                ...(hasIsFeatured ? [isFeatured ? 1 : 0] : [])
            ];
        } else {
            const valuesCount = (hasPriceSDG ? 18 : 17) + (hasIsFeatured ? 1 : 0);
            query = `INSERT INTO courses (
                course_code, course_name, title, description, credits, duration_weeks, duration,
                instructor_name, max_students, status, youtube_link, category, 
                price${hasPriceSDG ? ', price_sdg' : ''}, level_name, start_date, end_date, course_icon, badge_text${hasIsFeatured ? ', is_featured' : ''}
            ) VALUES (${Array.from({length: valuesCount}).map(() => '?').join(', ')})`;
            params = [
                course_code,
                courseTitle, // course_name
                courseTitle,
                description || null,
                credits || 3,
                duration_weeks || 16,
                duration || null,
                instructor_name || null,
                max_students || 30,
                status || 'active',
                youtube_link || null,
                categoryText,
                price || '0',
                ...(hasPriceSDG ? [req.body.price_sdg || null] : []),
                level_name || 'مبتدئ',
                start_date || null,
                end_date || null,
                course_icon || 'fas fa-book',
                badge_text || null,
                ...(hasIsFeatured ? [isFeatured ? 1 : 0] : [])
            ];
        }
        
        const [result] = await connection.execute(query, params);
        await connection.end();
        
        res.json({
            success: true,
            message: 'تم إضافة المقرر بنجاح',
            course_id: result.insertId
        });
        
    } catch (error) {
        try {
            const samplePath = path.join(__dirname, '..', 'sample-courses.json');
            const raw = fs.readFileSync(samplePath, 'utf8');
            const sampleCourses = JSON.parse(raw);
            const {
                course_code,
                title,
                course_name,
                description,
                duration_weeks,
                instructor_name,
                youtube_link,
                category,
                price,
                level_name,
                start_date,
                end_date,
                course_icon,
                badge_text,
                is_featured
            } = req.body;
            const newId = sampleCourses.length > 0 ? Math.max(...sampleCourses.map(c => parseInt(c.id))) + 1 : 1;
            const code = course_code || `CRS-${newId.toString().padStart(3, '0')}`;
            const courseToAdd = {
                id: newId,
                title: title || course_name || 'مقرر جديد',
                course_code: code,
                description: description || 'وصف المقرر',
                instructor_name: instructor_name || 'مدرس',
                duration_weeks: duration_weeks || 8,
                credits: 3,
                max_students: 25,
                category: category || 'general',
                price: price || '0',
                level_name: level_name || 'مبتدئ',
                start_date: start_date || new Date().toISOString().split('T')[0],
                course_icon: course_icon || 'fas fa-book',
                badge_text: badge_text || null,
                youtube_link: youtube_link || '',
                end_date: end_date || null,
                is_featured: toBoolean(is_featured)
            };
            sampleCourses.push(courseToAdd);
            fs.writeFileSync(samplePath, JSON.stringify(sampleCourses, null, 2));
            res.json({ success: true, message: 'تم إضافة المقرر بنجاح (بيانات تجريبية)', course_id: newId });
        } catch (fallbackErr) {
            console.error('Error adding course (and fallback failed):', fallbackErr);
            res.status(500).json({ success: false, message: 'خطأ في إضافة المقرر: ' + (error.message || fallbackErr.message) });
        }
    }
}

// Update course
async function updateCourse(req, res) {
    try {
        const connection = await createConnection();
        await connection.execute('SET NAMES utf8mb4');
        const {
            id,
            title,
            course_name, // for backward compatibility
            description,
            credits,
            duration_weeks,
            duration,
            instructor_name,
            max_students,
            status,
            youtube_link,
            category,
            category_id,
            price,
            level_name,
            start_date,
            end_date,
            course_icon,
            badge_text,
            is_featured
        } = req.body;
        
        if (!id) {
            await connection.end();
            return res.status(400).json({
                success: false,
                message: 'معرف المقرر مطلوب'
            });
        }
        
        const courseTitle = title || course_name || '';
        
        if (!courseTitle) {
            await connection.end();
            return res.status(400).json({
                success: false,
                message: 'عنوان المقرر مطلوب'
            });
        }
        
        // Check if course exists
        const [existing] = await connection.execute(
            'SELECT id FROM courses WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'المقرر غير موجود'
            });
        }
        
        // Sanitize price to extract only the numerical value
        let sanitizedPrice = '0';
        if (price) {
            const priceMatch = String(price).match(/(\d+(\.\d+)?)/);
            if (priceMatch) {
                sanitizedPrice = priceMatch[1];
            }
        }

        const hasCategoryId = await columnExists(connection, 'courses', 'category_id');
        const hasPriceSDG = await columnExists(connection, 'courses', 'price_sdg');
        let hasIsFeatured = await columnExists(connection, 'courses', 'is_featured');
        const isFeatured = toBoolean(is_featured);
        if (!hasIsFeatured) {
            try {
                await connection.execute('ALTER TABLE courses ADD COLUMN is_featured TINYINT(1) DEFAULT 0');
                hasIsFeatured = true;
            } catch (_) {}
        }
        const resolvedCategoryId = (category_id !== undefined && category_id !== null && !isNaN(parseInt(category_id)))
            ? parseInt(category_id)
            : null;
        let query, params;
        if (hasCategoryId) {
            query = `UPDATE courses SET 
                course_name = ?, title = ?, description = ?, credits = ?, duration_weeks = ?, duration = ?,
                instructor_name = ?, max_students = ?, status = ?, youtube_link = ?,
                category = ?, price = ?${hasPriceSDG ? ', price_sdg = ?' : ''}, level_name = ?, start_date = ?, end_date = ?,
                course_icon = ?, badge_text = ?, category_id = ?${hasIsFeatured ? ', is_featured = ?' : ''}
                WHERE id = ?`;
            params = [
                courseTitle, // course_name
                courseTitle,
                description || null,
                credits || 3,
                duration_weeks || 16,
                duration || null,
                instructor_name || null,
                max_students || 30,
                status || 'active',
                youtube_link || null,
                category || 'general',
                sanitizedPrice,
                ...(hasPriceSDG ? [req.body.price_sdg || null] : []),
                level_name || 'مبتدئ',
                start_date || null,
                end_date || null,
                course_icon || 'fas fa-book',
                badge_text || null,
                resolvedCategoryId,
                ...(hasIsFeatured ? [isFeatured ? 1 : 0] : []),
                id
            ];
        } else {
            query = `UPDATE courses SET 
                course_name = ?, title = ?, description = ?, credits = ?, duration_weeks = ?, duration = ?,
                instructor_name = ?, max_students = ?, status = ?, youtube_link = ?,
                category = ?, price = ?${hasPriceSDG ? ', price_sdg = ?' : ''}, level_name = ?, start_date = ?, end_date = ?,
                course_icon = ?, badge_text = ?${hasIsFeatured ? ', is_featured = ?' : ''}
                WHERE id = ?`;
            params = [
                courseTitle, // course_name
                courseTitle,
                description || null,
                credits || 3,
                duration_weeks || 16,
                duration || null,
                instructor_name || null,
                max_students || 30,
                status || 'active',
                youtube_link || null,
                category || 'general',
                sanitizedPrice,
                ...(hasPriceSDG ? [req.body.price_sdg || null] : []),
                level_name || 'مبتدئ',
                start_date || null,
                end_date || null,
                course_icon || 'fas fa-book',
                badge_text || null,
                ...(hasIsFeatured ? [isFeatured ? 1 : 0] : []),
                id
            ];
        }
        
        await connection.execute(query, params);
        await connection.end();
        
        res.json({
            success: true,
            message: 'تم تحديث بيانات المقرر بنجاح'
        });
        
    } catch (error) {
        try {
            const samplePath = path.join(__dirname, '..', 'sample-courses.json');
            const raw = fs.readFileSync(samplePath, 'utf8');
            const sampleCourses = JSON.parse(raw);
            const {
                id,
                title,
                course_name,
                description,
                credits,
                duration_weeks,
                instructor_name,
                max_students,
                status,
                youtube_link,
                category,
                price,
                level_name,
                start_date,
                end_date,
                course_icon,
                badge_text,
                is_featured
            } = req.body;
            if (!id) return res.status(400).json({ success: false, message: 'معرف المقرر مطلوب' });
            const idx = sampleCourses.findIndex(c => String(c.id) === String(id));
            if (idx === -1) return res.status(404).json({ success: false, message: 'المقرر غير موجود' });
            sampleCourses[idx] = {
                ...sampleCourses[idx],
                title: title || course_name || sampleCourses[idx].title,
                description: description ?? sampleCourses[idx].description,
                credits: credits ?? sampleCourses[idx].credits,
                duration_weeks: duration_weeks ?? sampleCourses[idx].duration_weeks,
                instructor_name: instructor_name ?? sampleCourses[idx].instructor_name,
                max_students: max_students ?? sampleCourses[idx].max_students,
                status: (status ?? sampleCourses[idx].status) || 'active',
                youtube_link: youtube_link ?? sampleCourses[idx].youtube_link,
                category: category ?? sampleCourses[idx].category,
                price: price ?? sampleCourses[idx].price,
                level_name: level_name ?? sampleCourses[idx].level_name,
                start_date: start_date ?? sampleCourses[idx].start_date,
                end_date: end_date ?? sampleCourses[idx].end_date,
                course_icon: course_icon ?? sampleCourses[idx].course_icon,
                badge_text: badge_text ?? sampleCourses[idx].badge_text,
                is_featured: (typeof is_featured !== 'undefined') ? toBoolean(is_featured) : sampleCourses[idx].is_featured
            };
            fs.writeFileSync(samplePath, JSON.stringify(sampleCourses, null, 2));
            res.json({ success: true, message: 'تم تحديث بيانات المقرر (بيانات تجريبية)' });
        } catch (fallbackErr) {
            console.error('Error updating course (and fallback failed):', fallbackErr);
            res.status(500).json({ success: false, message: 'خطأ في تحديث المقرر: ' + (error.message || fallbackErr.message) });
        }
    }
}

// Delete course
async function deleteCourse(req, res) {
    try {
        const connection = await createConnection();
        const id = req.query.id || (req.body && req.body.id);
        
        if (!id) {
            await connection.end();
            return res.status(400).json({
                success: false,
                message: 'معرف المقرر مطلوب'
            });
        }
        
        // Check if course exists
        const [existing] = await connection.execute(
            'SELECT id FROM courses WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'المقرر غير موجود'
            });
        }
        
        // Check for enrollments
        const [enrollments] = await connection.execute(
            'SELECT id FROM enrollments WHERE course_id = ?',
            [id]
        );
        
        if (enrollments.length > 0) {
            await connection.end();
            return res.status(400).json({
                success: false,
                message: 'لا يمكن حذف المقرر لوجود طلاب مسجلين فيه'
            });
        }
        
        await connection.execute('DELETE FROM courses WHERE id = ?', [id]);
        await connection.end();

        // Mirror deletion into sample data to keep fallback consistent
        try {
            const samplePath = path.join(__dirname, '..', 'sample-courses.json');
            const raw = fs.readFileSync(samplePath, 'utf8');
            const sampleCourses = JSON.parse(raw);
            const idx = sampleCourses.findIndex(c => String(c.id) === String(id));
            if (idx !== -1) {
                sampleCourses.splice(idx, 1);
                fs.writeFileSync(samplePath, JSON.stringify(sampleCourses, null, 2));
            }
        } catch (mirrorErr) {
            // Non-fatal: log and continue
            console.warn('Mirror delete to sample failed:', mirrorErr.message || mirrorErr);
        }

        res.json({
            success: true,
            message: 'تم حذف المقرر بنجاح'
        });
        
    } catch (error) {
        try {
            const samplePath = path.join(__dirname, '..', 'sample-courses.json');
            const raw = fs.readFileSync(samplePath, 'utf8');
            const sampleCourses = JSON.parse(raw);
            const id = req.query.id || (req.body && req.body.id);
            if (!id) return res.status(400).json({ success: false, message: 'معرف المقرر مطلوب' });
            const idx = sampleCourses.findIndex(c => String(c.id) === String(id));
            if (idx === -1) return res.status(404).json({ success: false, message: 'المقرر غير موجود' });
            sampleCourses.splice(idx, 1);
            fs.writeFileSync(samplePath, JSON.stringify(sampleCourses, null, 2));
            res.json({ success: true, message: 'تم حذف المقرر (بيانات تجريبية)' });
        } catch (fallbackErr) {
            console.error('Error deleting course (and fallback failed):', fallbackErr);
            res.status(500).json({ success: false, message: 'خطأ في حذف المقرر: ' + (error.message || fallbackErr.message) });
        }
    }
}

module.exports = {
    getCourses,
    getCourseById,
    addCourse,
    updateCourse,
    deleteCourse
};