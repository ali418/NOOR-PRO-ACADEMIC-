const mysql = require('mysql2/promise');
const fs = require('fs');
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
  try {
    await connection.query("SET NAMES utf8mb4");
  } catch (_) {}
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

// GET /api/enrollments
async function getEnrollments(req, res) {
  let conn;
  try {
    conn = await createConnection();
    await ensureMySqlEnrollmentTable(conn);
    const [rows] = await conn.execute(
      'SELECT * FROM enrollment_requests ORDER BY submission_date DESC'
    );
    const data = rows.map(mapRowToEnrollment);
    return res.json({ success: true, message: 'تم جلب البيانات بنجاح', data });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء جلب البيانات' });
  } finally {
    if (conn) await conn.end();
  }
}

// Helper to insert into DB
function isDeadlockError(e) {
  const msg = String(e && e.message || '').toLowerCase();
  return (e && (e.code === 'ER_LOCK_DEADLOCK' || e.errno === 1213)) || msg.includes('deadlock found');
}

async function insertEnrollment(conn, payload) {
  const requestNumber = 'REQ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const submissionDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const notes = payload.notes ? JSON.stringify(payload.notes) : null;
  const paymentDetails = payload.payment_details ? JSON.stringify(payload.payment_details) : null;

  const sql = `INSERT INTO enrollment_requests (
    student_name, email, phone, course_id, course_name,
    course_price, payment_method, payment_details, receipt_file,
    status, request_number, submission_date, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [
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
  ];

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const [result] = await conn.execute(sql, params);
      return { id: result.insertId, request_number: requestNumber };
    } catch (e) {
      if (isDeadlockError(e) && attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 50 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
}

// POST /api/enrollments
// Supports two modes:
// 1) Form/JSON add enrollment (no action or action === 'add')
// 2) Admin action update_status
async function postEnrollments(req, res) {
  const body = req.body || {};
  const action = body.action;
  let conn;

  try {
    conn = await createConnection();
    await ensureMySqlEnrollmentTable(conn);

    if (action === 'update_status') {
      const id = body.id;
      const status = body.status;
      const additionalData = body.additionalData || {};
      if (!id || !status) {
        return res.status(400).json({ success: false, message: 'المعرف والحالة مطلوبة' });
      }
      
      const fields = ['status = ?'];
      const params = [status];
      if (additionalData.approvalDate) {
        fields.push('approval_date = ?');
        const formattedDate = new Date(additionalData.approvalDate).toISOString().slice(0, 19).replace('T', ' ');
        params.push(formattedDate);
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
        fields.push('notes = ?');
        params.push(typeof additionalData.notes === 'object' ? JSON.stringify(additionalData.notes) : additionalData.notes);
      }
      params.push(id);

      await conn.execute(`UPDATE enrollment_requests SET ${fields.join(', ')} WHERE id = ?`, params);
      return res.json({ success: true, message: 'تم تحديث الحالة بنجاح' });

    } else {
      // Add enrollment
      const payload = normalizeIncomingEnrollment(body);

      // --- Fetch course title and price from the database (do not trust frontend) ---
      const [courseRows] = await conn.execute('SELECT title, course_name, price FROM courses WHERE id = ?', [payload.course_id]);
      let courseTitle = null;
      let real_course_price = null;
      if (courseRows.length > 0) {
        courseTitle = courseRows[0].title || courseRows[0].course_name || null;
        real_course_price = courseRows[0].price;
      } else {
        // Fallback to sample courses file to keep dev/test flow working
        try {
          const samplePath = path.join(__dirname, '..', 'sample-courses.json');
          const raw = fs.readFileSync(samplePath, 'utf8');
          const sampleCourses = JSON.parse(raw);
          const found = sampleCourses.find(c => String(c.id) === String(payload.course_id));
          if (!found) {
            return res.status(404).json({ success: false, message: 'لم يتم العثور على الدورة التدريبية المحددة' });
          }
          courseTitle = found.title || null;
          real_course_price = found.price || null;
        } catch (fallbackErr) {
          return res.status(404).json({ success: false, message: 'لم يتم العثور على الدورة التدريبية المحددة' });
        }
      }

      // Sanitize the price to extract only the number
      if (typeof real_course_price === 'string') {
        const priceMatch = real_course_price.match(/(\d+(\.\d+)?)/);
        if (priceMatch) {
          real_course_price = parseFloat(priceMatch[1]);
        } else {
          real_course_price = 0; // Or handle as an error
        }
      }

      // Ensure course title is set (fallback to empty string)
      courseTitle = courseTitle || '';
      // --- END: trusted course details from backend ---

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
        console.error('خطأ في رفع الإيصال:', fileErr.message);
      }

      const payment_method = body.paymentMethod || (payload.notes && payload.notes.paymentMethod) || null;
      const payment_details = {
        amount: body.paymentAmount || null,
        transactionId: body.transactionId || null
      };

      const dbPayload = {
        ...payload,
        course_name: courseTitle,
        course_price: real_course_price, // Use the price from the database
        payment_method,
        payment_details,
        receipt_file: receiptPath
      };

      const { id, request_number } = await insertEnrollment(conn, dbPayload);
      return res.json({ success: true, message: 'تم إضافة الطلب بنجاح', id, request_number, receipt_file: receiptPath });
    }
  } catch (e) {
    console.error('Error in postEnrollments:', e);
    return res.status(500).json({ success: false, message: 'حدث خطأ في الخادم: ' + e.message });
  } finally {
    if (conn) await conn.end();
  }
}

// DELETE /api/enrollments
async function deleteEnrollment(req, res) {
  const id = req.query.id || (req.body && req.body.id);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف الطلب مطلوب' });
  }
  let conn;
  try {
    conn = await createConnection();
    await ensureMySqlEnrollmentTable(conn);
    const [result] = await conn.execute('DELETE FROM enrollment_requests WHERE id = ?', [id]);
    
    if (result.affectedRows > 0) {
        return res.json({ success: true, message: 'تم حذف الطلب بنجاح' });
    } else {
        return res.status(404).json({ success: false, message: 'لم يتم العثور على الطلب' });
    }
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء حذف الطلب' });
  } finally {
    if (conn) await conn.end();
  }
}

function normalizeIncomingEnrollment(body) {
  // Support both form-based naming and our EnrollmentSystem structure
  const student_name = body.student_name || body.fullName || body.studentName || '';
  // اجعل البريد الإلكتروني اختيارياً؛ وفّر قيمة افتراضية عند الغياب
  const email = body.email || `guest-${Date.now()}@noor.local`;
  const phone = body.phone || '';
  const course_id = body.course_id || body.courseId || body.course || '';
  // لم نعد نطلب اسم الكورس من الواجهة؛ سنجلبه من قاعدة البيانات
  const course_name = body.course_name || body.courseTitle || '';
  const notes = {
    address: body.address || null,
    birthDate: body.birthDate || null,
    education: body.education || null,
    experience: body.experience || null,
    paymentMethod: body.paymentMethod || null,
    coursePrice: body.coursePrice || null
  };
  // الحقول المطلوبة: الاسم، الهاتف، ومعرّف الكورس فقط
  if (!student_name || !phone || !course_id) {
    throw new Error('الاسم ورقم الهاتف ومعرّف الكورس مطلوبة');
  }
  return { student_name, email, phone, course_id, course_name, status: 'pending', notes };
}

module.exports = {
  getEnrollments,
  postEnrollments,
  deleteEnrollment
};