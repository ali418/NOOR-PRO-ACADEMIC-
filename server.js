const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();
const { runMigrations } = require('./migrations');

const app = express();
const PORT = process.env.PORT || 8000;

// ضبط الإعدادات الأساسية
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
}));

// تقديم الملفات الثابتة
app.use(express.static(path.join(__dirname, '/')));

// توجيه الطلبات إلى ملفات API
app.use('/api/students', (req, res) => {
    require('./api/students.php')(req, res);
});

app.use('/api/courses', (req, res) => {
    require('./api/courses.php')(req, res);
});

app.use('/api/videos', (req, res) => {
    require('./api/videos.php')(req, res);
});

app.use('/api/categories', (req, res) => {
    require('./api/categories.php')(req, res);
});

app.use('/api/enrollments', (req, res) => {
    require('./api/enrollments.php')(req, res);
});

// توجيه جميع الطلبات الأخرى إلى الصفحة الرئيسية
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// تنفيذ الـ migrations لإنشاء قاعدة البيانات
runMigrations()
    .then(() => {
        console.log('تم إنشاء وتهيئة قاعدة البيانات بنجاح');
        
        // تشغيل الخادم بعد إنشاء قاعدة البيانات
        app.listen(PORT, () => {
            console.log(`الخادم يعمل على المنفذ ${PORT}`);
        });
    })
    .catch(err => {
        console.error('حدث خطأ أثناء إنشاء قاعدة البيانات:', err);
        
        // تشغيل الخادم حتى في حالة فشل إنشاء قاعدة البيانات
        app.listen(PORT, () => {
            console.log(`الخادم يعمل على المنفذ ${PORT} (بدون إنشاء قاعدة البيانات)`);
        });
    });