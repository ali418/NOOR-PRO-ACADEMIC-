const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const path = require('path');

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

async function createConnection() {
  const connection = await mysql.createConnection(dbConfig);
  return connection;
}

// GET - جلب جميع الطلاب
router.get('/', async (req, res) => {
    const query = `
        SELECT id, student_id, first_name, last_name, email, phone, 
               date_of_birth, gender, address, enrollment_date, status,
               created_at, updated_at
        FROM students 
        ORDER BY created_at DESC
    `;
    
    let connection;
    try {
        connection = await createConnection();
        const [rows] = await connection.execute(query);
        res.json({
            success: true,
            data: rows
        });
    } catch (err) {
        console.error('Error fetching students:', err.message);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب بيانات الطلاب'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// POST - إضافة طالب جديد
router.post('/', async (req, res) => {
    const {
        id, firstName, lastName, email, phone,
        birthDate, gender, address, registrationDate
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!id || !firstName || !lastName || !email) {
        return res.status(400).json({
            success: false,
            message: 'البيانات المطلوبة مفقودة'
        });
    }

    const query = `
        INSERT INTO students (
            student_id, first_name, last_name, email, phone,
            date_of_birth, gender, address, enrollment_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        id, firstName, lastName, email, phone || '',
        birthDate || null, gender || 'male', address || '',
        registrationDate || new Date().toISOString().split('T')[0], 'active'
    ];

    let connection;
    try {
        connection = await createConnection();
        const [result] = await connection.execute(query, params);
        res.json({
            success: true,
            message: 'تم إضافة الطالب بنجاح',
            data: { id: result.insertId }
        });
    } catch (err) {
        console.error('Error adding student:', err.message);
        if (err.message.includes('UNIQUE constraint failed') || err.code === 'ER_DUP_ENTRY') {
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
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// PUT - تحديث بيانات طالب
router.put('/', async (req, res) => {
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

    let connection;
    try {
        connection = await createConnection();
        const [result] = await connection.execute(query, params);
        if (result.affectedRows === 0) {
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
    } catch (err) {
        console.error('Error updating student:', err.message);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث بيانات الطالب'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// DELETE - حذف طالب
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'معرف الطالب مطلوب'
        });
    }

    const query = 'DELETE FROM students WHERE id = ?';

    let connection;
    try {
        connection = await createConnection();
        const [result] = await connection.execute(query, [id]);
        if (result.affectedRows === 0) {
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
    } catch (err) {
        console.error('Error deleting student:', err.message);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف الطالب'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// GET - جلب طالب واحد
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT id, student_id, first_name, last_name, email, phone,
               date_of_birth, gender, address, enrollment_date, status,
               created_at, updated_at
        FROM students 
        WHERE id = ?
    `;

    let connection;
    try {
        connection = await createConnection();
        const [rows] = await connection.execute(query, [id]);
        if (rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'الطالب غير موجود'
            });
        } else {
            res.json({
                success: true,
                data: rows[0]
            });
        }
    } catch (err) {
        console.error('Error fetching student:', err.message);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب بيانات الطالب'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

module.exports = router;