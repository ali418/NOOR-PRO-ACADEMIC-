const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

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
            res.json({ success: true, message: 'استخدام بيانات تجريبية', courses: result });
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
            instructor_name,
            max_students,
            youtube_link,
            category,
            category_id,
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

        const query = `INSERT INTO courses (
            course_code, title, description, credits, duration_weeks, 
            instructor_name, max_students, youtube_link, category, 
            price, level_name, start_date, course_icon, badge_text, category_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
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
            badge_text || null,
            resolvedCategoryId || null
        ];
        
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
                course_icon,
                badge_text
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
                youtube_link: youtube_link || ''
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
            category_id,
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

        const query = `UPDATE courses SET 
            title = ?, description = ?, credits = ?, duration_weeks = ?,
            instructor_name = ?, max_students = ?, status = ?, youtube_link = ?,
            category = ?, price = ?, level_name = ?, start_date = ?,
            course_icon = ?, badge_text = ?, category_id = ?
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
            resolvedCategoryId || null,
            id
        ];
        
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
                course_icon,
                badge_text
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
                course_icon: course_icon ?? sampleCourses[idx].course_icon,
                badge_text: badge_text ?? sampleCourses[idx].badge_text
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
    addCourse,
    updateCourse,
    deleteCourse
};