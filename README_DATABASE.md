# دليل إعداد قاعدة البيانات MySQL - مركز نور الأكاديمي

## متطلبات النظام

### 1. تثبيت خادم MySQL
يمكنك استخدام إحدى الطرق التالية:

#### أ) XAMPP (الأسهل للمبتدئين)
- قم بتحميل XAMPP من: https://www.apachefriends.org/
- قم بتثبيته وتشغيل Apache و MySQL من لوحة التحكم

#### ب) WAMP (لنظام Windows)
- قم بتحميل WAMP من: https://www.wampserver.com/
- قم بتثبيته وتشغيل الخدمات

#### ج) MySQL Server منفصل
- قم بتحميل MySQL Server من: https://dev.mysql.com/downloads/mysql/
- قم بتثبيت PHP منفصلاً

## خطوات الإعداد

### 1. إنشاء قاعدة البيانات
1. افتح phpMyAdmin (عادة على http://localhost/phpmyadmin)
2. قم بإنشاء قاعدة بيانات جديدة باسم `noor_academy`
3. اختر ترميز `utf8mb4_unicode_ci` للدعم الكامل للعربية

### 2. استيراد هيكل قاعدة البيانات
1. في phpMyAdmin، اختر قاعدة البيانات `noor_academy`
2. اذهب إلى تبويب "Import" أو "استيراد"
3. اختر ملف `database.sql` من مجلد المشروع
4. اضغط "Go" أو "تنفيذ"

### 3. إعداد ملف الاتصال
قم بتعديل ملف `api/config.php` وتحديث إعدادات الاتصال:

```php
// إعدادات قاعدة البيانات
define('DB_HOST', 'localhost');     // عنوان الخادم
define('DB_NAME', 'noor_academy');  // اسم قاعدة البيانات
define('DB_USER', 'root');          // اسم المستخدم
define('DB_PASS', '');              // كلمة المرور (فارغة في XAMPP)
```

### 4. اختبار الاتصال
1. تأكد من تشغيل Apache و MySQL
2. افتح المتصفح واذهب إلى: `http://localhost/api/students.php?action=get`
3. يجب أن ترى استجابة JSON مع بيانات الطلاب

## هيكل قاعدة البيانات

### جداول النظام:
- **students**: بيانات الطلاب
- **courses**: بيانات المقررات
- **teachers**: بيانات المدرسين
- **enrollments**: تسجيل الطلاب في المقررات
- **grades**: درجات الطلاب
- **users**: مستخدمي النظام

### العلاقات:
- كل طالب يمكن أن يسجل في عدة مقررات
- كل مقرر يمكن أن يحتوي على عدة طلاب
- كل مقرر له مدرس واحد
- كل تسجيل يمكن أن يحتوي على عدة درجات

## استخدام APIs

### API الطلاب (students.php)
```javascript
// جلب جميع الطلاب
fetch('api/students.php?action=get')

// إضافة طالب جديد
fetch('api/students.php?action=add', {
    method: 'POST',
    body: JSON.stringify(studentData)
})

// تحديث طالب
fetch('api/students.php?action=update', {
    method: 'POST',
    body: JSON.stringify(studentData)
})

// حذف طالب
fetch('api/students.php?action=delete', {
    method: 'POST',
    body: JSON.stringify({id: studentId})
})
```

### API المقررات (courses.php)
```javascript
// جلب جميع المقررات
fetch('api/courses.php?action=get')

// إضافة مقرر جديد
fetch('api/courses.php?action=add', {
    method: 'POST',
    body: JSON.stringify(courseData)
})

// تحديث مقرر
fetch('api/courses.php?action=update', {
    method: 'POST',
    body: JSON.stringify(courseData)
})

// حذف مقرر
fetch('api/courses.php?action=delete', {
    method: 'POST',
    body: JSON.stringify({id: courseId})
})
```

## استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ في الاتصال بقاعدة البيانات**
   - تأكد من تشغيل MySQL
   - تحقق من إعدادات الاتصال في config.php

2. **خطأ 404 عند الوصول للـ APIs**
   - تأكد من تشغيل Apache
   - تحقق من مسار الملفات

3. **مشاكل في الترميز العربي**
   - تأكد من استخدام UTF-8 في جميع الملفات
   - تحقق من إعدادات قاعدة البيانات

4. **خطأ CORS**
   - تم إعداد CORS في config.php
   - تأكد من تشغيل الموقع من خادم محلي

## الأمان

- تم إعداد حماية من SQL Injection باستخدام PDO
- تم إعداد تنظيف البيانات المدخلة
- يُنصح بإضافة نظام مصادقة للإنتاج

## الدعم الفني

في حالة مواجهة مشاكل:
1. تحقق من سجلات الأخطاء في Apache/PHP
2. استخدم أدوات المطور في المتصفح لفحص طلبات AJAX
3. تأكد من صحة بيانات JSON المرسلة