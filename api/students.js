const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database for students API.');
    }
});

// GET - جلب جميع الطلاب
router.get('/', (req, res) => {
    const query = `
        SELECT id, student_id, first_name, last_name, email, phone, 
               date_of_birth, gender, address, enrollment_date, status,
               created_at, updated_at
        FROM students 
        ORDER BY created_at DESC
    `;
    
    db.all(query, (err, rows) => {
        if (err) {
            console.error('Error fetching students:', err.message);
            res.status(500).json({
                success: false,
                message: 'خطأ في جلب بيانات الطلاب'
            });
        } else {
            res.json({
                success: true,
                data: rows
            });
        }
    });
});

// POST - إضافة طالب جديد
router.post('/', (req, res) => {
    const {
        student_id, first_name, last_name, email, phone,
        date_of_birth, gender, address, enrollment_date
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!student_id || !first_name || !last_name || !email) {
        return res.status(400).json({
            success: false,
            message: 'البيانات المطلوبة مفقودة'
        });
    }

    const query = `
        INSERT INTO students (
            student_id, first_name, last_name, email, phone,
            date_of_birth, gender, address, enrollment_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `;

    const params = [
        student_id, first_name, last_name, email, phone || '',
        date_of_birth || null, gender || 'male', address || '',
        enrollment_date || new Date().toISOString().split('T')[0]
    ];

    db.run(query, params, function(err) {
        if (err) {
            console.error('Error adding student:', err.message);
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).json({
                    success: false,
                    message: 'رقم الطالب موجود مسبقاً'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'خطأ في إضافة الطالب'
                });
            }
        } else {
            res.json({
                success: true,
                message: 'تم إضافة الطالب بنجاح',
                data: { id: this.lastID }
            });
        }
    });
});

// PUT - تحديث بيانات طالب
router.put('/', (req, res) => {
    const {
        id, first_name, last_name, email, phone,
        date_of_birth, gender, address, status
    } = req.body;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'معرف الطالب مطلوب'
        });
    }

    const query = `
        UPDATE students SET
            first_name = ?, last_name = ?, email = ?, phone = ?,
            date_of_birth = ?, gender = ?, address = ?, status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    const params = [
        first_name, last_name, email, phone || '',
        date_of_birth, gender, address || '', status || 'active', id
    ];

    db.run(query, params, function(err) {
        if (err) {
            console.error('Error updating student:', err.message);
            res.status(500).json({
                success: false,
                message: 'خطأ في تحديث بيانات الطالب'
            });
        } else if (this.changes === 0) {
            res.status(404).json({
                success: false,
                message: 'الطالب غير موجود'
            });
        } else {
            res.json({
                success: true,
                message: 'تم تحديث بيانات الطالب بنجاح'
            });
        }
    });
});

// DELETE - حذف طالب
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'معرف الطالب مطلوب'
        });
    }

    const query = 'DELETE FROM students WHERE id = ?';

    db.run(query, [id], function(err) {
        if (err) {
            console.error('Error deleting student:', err.message);
            res.status(500).json({
                success: false,
                message: 'خطأ في حذف الطالب'
            });
        } else if (this.changes === 0) {
            res.status(404).json({
                success: false,
                message: 'الطالب غير موجود'
            });
        } else {
            res.json({
                success: true,
                message: 'تم حذف الطالب بنجاح'
            });
        }
    });
});

// GET - جلب طالب واحد
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT id, student_id, first_name, last_name, email, phone,
               date_of_birth, gender, address, enrollment_date, status,
               created_at, updated_at
        FROM students 
        WHERE id = ?
    `;

    db.get(query, [id], (err, row) => {
        if (err) {
            console.error('Error fetching student:', err.message);
            res.status(500).json({
                success: false,
                message: 'خطأ في جلب بيانات الطالب'
            });
        } else if (!row) {
            res.status(404).json({
                success: false,
                message: 'الطالب غير موجود'
            });
        } else {
            res.json({
                success: true,
                data: row
            });
        }
    });
});

module.exports = router;