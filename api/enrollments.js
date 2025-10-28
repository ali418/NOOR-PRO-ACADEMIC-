const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

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

// GET /api/enrollments
async function getEnrollments(req, res) {
  try {
    const conn = await createConnection();
    const [rows] = await conn.execute(
      'SELECT * FROM enrollment_requests ORDER BY submission_date DESC'
    );
    await conn.end();
    const data = rows.map(mapRowToEnrollment);
    return res.json({ success: true, message: 'تم جلب البيانات بنجاح', data });
  } catch (error) {
    // Fallback to file
    const items = readFallback();
    return res.json({ success: true, message: 'تم جلب البيانات من التخزين المؤقت', data: items });
  }
}

// Helper to insert into DB
async function insertEnrollment(conn, payload) {
  const requestNumber = 'REQ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const submissionDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const notes = payload.notes ? JSON.stringify(payload.notes) : null;

  const [result] = await conn.execute(
    `INSERT INTO enrollment_requests (student_name, email, phone, course_id, course_name, status, request_number, submission_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.student_name,
      payload.email,
      payload.phone,
      String(payload.course_id),
      payload.course_name,
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
      return res.json({ success: true, message: 'تم تحديث الحالة بنجاح' });
    } catch (error) {
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

  // Add enrollment
  try {
    const payload = normalizeIncomingEnrollment(body);
    try {
      const conn = await createConnection();
      const { id, request_number } = await insertEnrollment(conn, payload);
      await conn.end();
      return res.json({ success: true, message: 'تم إضافة الطلب بنجاح', id, request_number });
    } catch (dbErr) {
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
        notes: payload.notes || null
      };
      items.push(entry);
      writeFallback(items);
      return res.json({ success: true, message: 'تم إضافة الطلب (تخزين مؤقت)', id: entry.id });
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
    await conn.execute('DELETE FROM enrollment_requests WHERE id = ?', [id]);
    await conn.end();
    return res.json({ success: true, message: 'تم حذف الطلب بنجاح' });
  } catch (error) {
    const items = readFallback();
    const idx = items.findIndex(i => String(i.id) === String(id));
    if (idx !== -1) {
      const deleted = items.splice(idx, 1);
      writeFallback(items);
      return res.json({ success: true, message: 'تم حذف الطلب (تخزين مؤقت)', data: deleted[0] });
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