const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database config (aligned with courses.js)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'noor_pro_academic',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4'
};

async function createConnection() {
  const connection = await mysql.createConnection(dbConfig);
  return connection;
}

// Ensure MySQL table exists before operations
async function ensureMySqlEnrollmentTable(conn) {
  const ddl = `
    CREATE TABLE IF NOT EXISTS enrollment_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      course_id VARCHAR(100) NOT NULL,
      course_name VARCHAR(255) NOT NULL,
      course_price DECIMAL(10,2) NULL,
      payment_method VARCHAR(100) NULL,
      payment_details JSON NULL,
      receipt_file VARCHAR(255) NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      request_number VARCHAR(100),
      submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      approval_date DATETIME NULL,
      notes JSON NULL,
      welcome_message TEXT NULL,
      whatsapp_link VARCHAR(255) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  try {
    await conn.execute(ddl);
  } catch (e) {
    // Some MySQL versions/drivers may not support JSON; fallback to TEXT
    if (String(e.message || '').toLowerCase().includes('unknown column type') ||
        String(e.message || '').toLowerCase().includes('json')) {
      const ddlText = `
        CREATE TABLE IF NOT EXISTS enrollment_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          course_id VARCHAR(100) NOT NULL,
          course_name VARCHAR(255) NOT NULL,
          course_price DECIMAL(10,2) NULL,
          payment_method VARCHAR(100) NULL,
          payment_details TEXT NULL,
          receipt_file VARCHAR(255) NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          request_number VARCHAR(100),
          submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          approval_date DATETIME NULL,
          notes TEXT NULL,
          welcome_message TEXT NULL,
          whatsapp_link VARCHAR(255) NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await conn.execute(ddlText);
    } else {
      throw e;
    }
  }
}

// Fallback JSON storage when DB is unavailable
const fallbackPath = path.join(__dirname, '..', 'enrollment-requests.json');

function readFallback() {
  try {
    if (!fs.existsSync(fallbackPath)) return [];
    const data = fs.readFileSync(fallbackPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeFallback(items) {
  try {
    fs.writeFileSync(fallbackPath, JSON.stringify(items, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

function mapRowToEnrollment(row) {
  let paymentDetails = {};
  try {
    if (row.payment_details) {
      paymentDetails = JSON.parse(row.payment_details);
    } else if (row.notes) {
      // try parse notes as JSON
      paymentDetails = JSON.parse(row.notes);
    }
  } catch (_) {
    paymentDetails = {};
  }

  return {
    id: String(row.id),
    studentName: row.student_name,
    email: row.email,
    phone: row.phone,
    courseId: row.course_id,
    courseName: row.course_name,
    coursePrice: row.course_price || null,
    paymentMethod: row.payment_method || null,
    paymentDetails,
    receiptFile: row.receipt_file || null,
    status: row.status,
    submissionDate: row.submission_date,
    approvalDate: row.approval_date || null,
    welcomeMessage: row.welcome_message || null,
    whatsappLink: row.whatsapp_link || null,
    notes: row.notes || null
  };
}

// ---------- SQLite helpers (fallback persistence) ----------
const sqliteDbPath = path.join(__dirname, '..', 'database.db');
function getSqliteDb() {
  return new sqlite3.Database(sqliteDbPath);
}

function ensureSqliteEnrollmentTable(db) {
  const ddl = `
    CREATE TABLE IF NOT EXISTS enrollment_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      course_id TEXT NOT NULL,
      course_name TEXT NOT NULL,
      course_price REAL,
      payment_method TEXT,
      payment_details TEXT,
      receipt_file TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      request_number TEXT,
      submission_date TEXT DEFAULT (datetime('now')),
      approval_date TEXT,
      notes TEXT,
      welcome_message TEXT,
      whatsapp_link TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `;
  return new Promise((resolve, reject) => {
    db.run(ddl, (err) => {
      if (err) reject(err); else resolve(true);
    });
  });
}

function sqliteAll(sql, params = []) {
  const db = getSqliteDb();
  return new Promise(async (resolve, reject) => {
    try {
      await ensureSqliteEnrollmentTable(db);
      db.all(sql, params, (err, rows) => {
        db.close();
        if (err) reject(err); else resolve(rows);
      });
    } catch (e) {
      db.close();
      reject(e);
    }
  });
}

function sqliteRun(sql, params = []) {
  const db = getSqliteDb();
  return new Promise(async (resolve, reject) => {
    try {
      await ensureSqliteEnrollmentTable(db);
      db.run(sql, params, function(err) {
        db.close();
        if (err) reject(err); else resolve({ lastID: this.lastID, changes: this.changes });
      });
    } catch (e) {
      db.close();
      reject(e);
    }
  });
}

// GET /api/enrollments
async function getEnrollments(req, res) {
  try {
    const conn = await createConnection();
    await ensureMySqlEnrollmentTable(conn);
    const [rows] = await conn.execute(
      'SELECT * FROM enrollment_requests ORDER BY submission_date DESC'
    );
    await conn.end();
    const data = rows.map(mapRowToEnrollment);
    return res.json({ success: true, message: 'تم جلب البيانات (MySQL)', data });
  } catch (error) {
    // Fallback to SQLite
    try {
      const rows = await sqliteAll('SELECT * FROM enrollment_requests ORDER BY submission_date DESC');
      const data = rows.map(mapRowToEnrollment);
      return res.json({ success: true, message: 'تم جلب البيانات (SQLite)', data });
    } catch (e) {
      // Fallback to file
      const items = readFallback();
      return res.json({ success: true, message: 'تم جلب البيانات من التخزين المؤقت', data: items });
    }
  }
}

// Helper to insert into DB
async function insertEnrollment(conn, payload) {
  const requestNumber = 'REQ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const submissionDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const notes = payload.notes ? JSON.stringify(payload.notes) : null;
  const paymentDetails = payload.payment_details ? JSON.stringify(payload.payment_details) : null;

  const [result] = await conn.execute(
    `INSERT INTO enrollment_requests (
        student_name, email, phone, course_id, course_name,
        course_price, payment_method, payment_details, receipt_file,
        status, request_number, submission_date, notes
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.student_name,
      payload.email,
      payload.phone,
      String(payload.course_id),
      payload.course_name,
      payload.course_price || null,
      payload.payment_method || null,
      paymentDetails,
      payload.receipt_file || null,
      payload.status || 'pending',
      requestNumber,
      submissionDate,
      notes
    ]
  );
  return { id: result.insertId, request_number: requestNumber };
}

// POST /api/enrollments
// Supports two modes:
// 1) Form/JSON add enrollment (no action or action === 'add')
// 2) Admin action update_status
async function postEnrollments(req, res) {
  const body = req.body || {};
  const action = body.action;

  if (action === 'update_status') {
    const id = body.id;
    const status = body.status;
    const additionalData = body.additionalData || {};
    if (!id || !status) {
      return res.status(400).json({ success: false, message: 'المعرف والحالة مطلوبة' });
    }
    // Try DB first
    try {
      const conn = await createConnection();
      await ensureMySqlEnrollmentTable(conn);
      const fields = ['status = ?'];
      const params = [status];
      if (additionalData.approvalDate) {
        fields.push('approval_date = ?');
        params.push(additionalData.approvalDate);
      }
      if (additionalData.welcomeMessage) {
        fields.push('welcome_message = ?');
        params.push(additionalData.welcomeMessage);
      }
      if (additionalData.whatsappLink) {
        fields.push('whatsapp_link = ?');
        params.push(additionalData.whatsappLink);
      }
      if (additionalData.notes) {
        // store notes JSON or text
        fields.push('notes = ?');
        params.push(typeof additionalData.notes === 'object' ? JSON.stringify(additionalData.notes) : additionalData.notes);
      }
      params.push(id);
      await conn.execute(`UPDATE enrollment_requests SET ${fields.join(', ')} WHERE id = ?`, params);
      await conn.end();
      return res.json({ success: true, message: 'تم تحديث الحالة (MySQL)' });
    } catch (error) {
      // Fallback to SQLite
      try {
        const fields = ['status = ?'];
        const params = [status];
        if (additionalData.approvalDate) { fields.push('approval_date = ?'); params.push(additionalData.approvalDate); }
        if (additionalData.welcomeMessage) { fields.push('welcome_message = ?'); params.push(additionalData.welcomeMessage); }
        if (additionalData.whatsappLink) { fields.push('whatsapp_link = ?'); params.push(additionalData.whatsappLink); }
        if (additionalData.notes) { fields.push('notes = ?'); params.push(typeof additionalData.notes === 'object' ? JSON.stringify(additionalData.notes) : additionalData.notes); }
        params.push(id);
        const result = await sqliteRun(`UPDATE enrollment_requests SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params);
        if (result.changes > 0) {
          return res.json({ success: true, message: 'تم تحديث الحالة (SQLite)' });
        }
      } catch (sqliteErr) {
        // Fallback to file
        const items = readFallback();
        const idx = items.findIndex(i => String(i.id) === String(id));
        if (idx !== -1) {
          items[idx].status = status;
          items[idx].approvalDate = additionalData.approvalDate || items[idx].approvalDate || null;
          items[idx].welcomeMessage = additionalData.welcomeMessage || items[idx].welcomeMessage || null;
          items[idx].whatsappLink = additionalData.whatsappLink || items[idx].whatsappLink || null;
          if (additionalData.notes) items[idx].notes = additionalData.notes;
          writeFallback(items);
          return res.json({ success: true, message: 'تم تحديث الحالة (تخزين مؤقت)' });
        }
        return res.status(404).json({ success: false, message: 'لم يتم العثور على الطلب' });
      }
    }
  }

  // Add enrollment
  try {
    const payload = normalizeIncomingEnrollment(body);

    // معالجة صورة الإيصال (إن وجدت)
    let receiptPath = null;
    try {
      if (req.files && req.files.receiptFile) {
        const file = req.files.receiptFile;
        const ext = path.extname(file.name).toLowerCase();
        const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
        if (!allowed.includes(ext)) {
          return res.status(400).json({ success: false, message: 'صيغة الملف غير مدعومة' });
        }
        const safeName = `receipt_${Date.now()}_${Math.floor(Math.random()*10000)}${ext}`;
        const uploadDir = path.join(__dirname, '..', 'uploads', 'receipts');
        fs.mkdirSync(uploadDir, { recursive: true });
        const fullPath = path.join(uploadDir, safeName);
        await file.mv(fullPath);
        receiptPath = `/uploads/receipts/${safeName}`;
      }
    } catch (fileErr) {
      // إذا فشل رفع الملف، لا توقف العملية بالكامل
      console.error('خطأ في رفع الإيصال:', fileErr.message);
    }

    // تجميع معلومات إضافية للإدخال
    const course_price = body.coursePrice || (payload.notes && payload.notes.coursePrice) || null;
    const payment_method = body.paymentMethod || (payload.notes && payload.notes.paymentMethod) || null;
    const payment_details = {
      amount: body.paymentAmount || null,
      transactionId: body.transactionId || null
    };

    const dbPayload = {
      ...payload,
      course_price,
      payment_method,
      payment_details,
      receipt_file: receiptPath
    };

    try {
      const conn = await createConnection();
      await ensureMySqlEnrollmentTable(conn);
      const { id, request_number } = await insertEnrollment(conn, dbPayload);
      await conn.end();
      return res.json({ success: true, message: 'تم إضافة الطلب (MySQL)', id, request_number, receipt_file: receiptPath });
    } catch (dbErr) {
      // Fallback to SQLite
      try {
        const requestNumber = 'REQ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const submissionDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const notes = dbPayload.notes ? JSON.stringify(dbPayload.notes) : null;
        const paymentDetails = dbPayload.payment_details ? JSON.stringify(dbPayload.payment_details) : null;
        const sql = `INSERT INTO enrollment_requests (
          student_name, email, phone, course_id, course_name,
          course_price, payment_method, payment_details, receipt_file,
          status, request_number, submission_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [
          dbPayload.student_name,
          dbPayload.email,
          dbPayload.phone,
          String(dbPayload.course_id),
          dbPayload.course_name,
          dbPayload.course_price || null,
          dbPayload.payment_method || null,
          paymentDetails,
          dbPayload.receipt_file || null,
          dbPayload.status || 'pending',
          requestNumber,
          submissionDate,
          notes
        ];
        const result = await sqliteRun(sql, params);
        return res.json({ success: true, message: 'تم إضافة الطلب (SQLite)', id: result.lastID, request_number: requestNumber, receipt_file: receiptPath });
      } catch (sqliteErr) {
        // Fallback to file
        const items = readFallback();
        const nextId = items.length > 0 ? Math.max(...items.map(i => parseInt(i.id))) + 1 : 1;
        const entry = {
          id: String(nextId),
          studentName: payload.student_name,
          email: payload.email,
          phone: payload.phone,
          courseId: String(payload.course_id),
          courseName: payload.course_name,
          status: payload.status || 'pending',
          submissionDate: new Date().toISOString(),
          notes: payload.notes || null,
          receiptFile: receiptPath || null
        };
        items.push(entry);
        writeFallback(items);
        return res.json({ success: true, message: 'تم إضافة الطلب (تخزين مؤقت)', id: entry.id, receipt_file: receiptPath });
      }
    }
  } catch (e) {
    return res.status(400).json({ success: false, message: 'بيانات غير صالحة: ' + e.message });
  }
}

// DELETE /api/enrollments
async function deleteEnrollment(req, res) {
  const id = req.query.id || (req.body && req.body.id);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف الطلب مطلوب' });
  }
  try {
    const conn = await createConnection();
    await ensureMySqlEnrollmentTable(conn);
    await conn.execute('DELETE FROM enrollment_requests WHERE id = ?', [id]);
    await conn.end();
    return res.json({ success: true, message: 'تم حذف الطلب (MySQL)' });
  } catch (error) {
    // Fallback to SQLite
    try {
      const result = await sqliteRun('DELETE FROM enrollment_requests WHERE id = ?', [id]);
      if (result.changes > 0) {
        return res.json({ success: true, message: 'تم حذف الطلب (SQLite)' });
      }
    } catch (sqliteErr) {
      const items = readFallback();
      const idx = items.findIndex(i => String(i.id) === String(id));
      if (idx !== -1) {
        const deleted = items.splice(idx, 1);
        writeFallback(items);
        return res.json({ success: true, message: 'تم حذف الطلب (تخزين مؤقت)', data: deleted[0] });
      }
    }
    return res.status(404).json({ success: false, message: 'لم يتم العثور على الطلب' });
  }
}

function normalizeIncomingEnrollment(body) {
  // Support both form-based naming and our EnrollmentSystem structure
  const student_name = body.student_name || body.fullName || body.studentName || '';
  const email = body.email || '';
  const phone = body.phone || '';
  const course_id = body.course_id || body.courseId || body.course || '';
  const course_name = body.course_name || body.courseTitle || '';
  const notes = {
    address: body.address || null,
    birthDate: body.birthDate || null,
    education: body.education || null,
    experience: body.experience || null,
    paymentMethod: body.paymentMethod || null,
    coursePrice: body.coursePrice || null
  };
  if (!student_name || !email || !phone || !course_id || !course_name) {
    throw new Error('الاسم والبريد والهاتف ومعرف واسم الكورس مطلوبة');
  }
  return { student_name, email, phone, course_id, course_name, status: 'pending', notes };
}

module.exports = {
  getEnrollments,
  postEnrollments,
  deleteEnrollment
};