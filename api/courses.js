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
        
        res.json({
            success: true,
            message: 'تم جلب البيانات بنجاح',
            courses: rows
        });
        
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب البيانات: ' + error.message
        });
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
            instructor_name,
            max_students,
            youtube_link,
            category,
            price,
            level_name,
            start_date,
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
        
        const query = `INSERT INTO courses (
            course_code, title, description, credits, duration_weeks, 
            instructor_name, max_students, youtube_link, category, 
            price, level_name, start_date, course_icon, badge_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [
            course_code,
            courseTitle,
            description || null,
            credits || 3,
            duration_weeks || 16,
            instructor_name || null,
            max_students || 30,
            youtube_link || null,
            category || 'general',
            price || '0',
            level_name || 'مبتدئ',
            start_date || null,
            course_icon || 'fas fa-book',
            badge_text || null
        ];
        
        const [result] = await connection.execute(query, params);
        await connection.end();
        
        res.json({
            success: true,
            message: 'تم إضافة المقرر بنجاح',
            course_id: result.insertId
        });
        
    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إضافة المقرر: ' + error.message
        });
    }
}

// Update course
async function updateCourse(req, res) {
    try {
        const connection = await createConnection();
        const {
            id,
            title,
            course_name, // for backward compatibility
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
            course_icon,
            badge_text
        } = req.body;
        
        if (!id) {
            await connection.end();
            return res.status(400).json({
                success: false,
                message: 'معرف المقرر مطلوب'
            });
        }
        
        // Use title or course_name for backward compatibility
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
        
        const query = `UPDATE courses SET 
            title = ?, description = ?, credits = ?, duration_weeks = ?,
            instructor_name = ?, max_students = ?, status = ?, youtube_link = ?,
            category = ?, price = ?, level_name = ?, start_date = ?,
            course_icon = ?, badge_text = ?
            WHERE id = ?`;
        
        const params = [
            courseTitle,
            description || null,
            credits || 3,
            duration_weeks || 16,
            instructor_name || null,
            max_students || 30,
            status || 'active',
            youtube_link || null,
            category || 'general',
            price || '0',
            level_name || 'مبتدئ',
            start_date || null,
            course_icon || 'fas fa-book',
            badge_text || null,
            id
        ];
        
        await connection.execute(query, params);
        await connection.end();
        
        res.json({
            success: true,
            message: 'تم تحديث بيانات المقرر بنجاح'
        });
        
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث المقرر: ' + error.message
        });
    }
}

// Delete course
async function deleteCourse(req, res) {
    try {
        const connection = await createConnection();
        const { id } = req.body;
        
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
        
        res.json({
            success: true,
            message: 'تم حذف المقرر بنجاح'
        });
        
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف المقرر: ' + error.message
        });
    }
}

module.exports = {
    getCourses,
    addCourse,
    updateCourse,
    deleteCourse
};