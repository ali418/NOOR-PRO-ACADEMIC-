/**
 * ملف الـ migrations لإنشاء قاعدة البيانات تلقائياً
 * يستخدم هذا الملف عند نشر النظام على منصة Railway أو أي منصة أخرى
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// تحميل متغيرات البيئة
dotenv.config();

// قراءة ملف قاعدة البيانات
const readDatabaseFile = () => {
  try {
    const databaseFilePath = path.join(__dirname, 'database.sql');
    return fs.readFileSync(databaseFilePath, 'utf8');
  } catch (error) {
    console.error('خطأ في قراءة ملف قاعدة البيانات:', error);
    return null;
  }
};

// تقسيم ملف SQL إلى أوامر منفصلة
const splitSqlCommands = (sqlContent) => {
  // تقسيم الأوامر بناءً على الفاصل ";"
  return sqlContent
    .split(';')
    .map(command => command.trim())
    .filter(command => command.length > 0);
};

// إنشاء اتصال بقاعدة البيانات
const createConnection = async () => {
  // استخدام متغيرات البيئة من Railway أو المتغيرات المحلية
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  };

  try {
    // إنشاء اتصال بالخادم بدون تحديد قاعدة بيانات
    const connection = await mysql.createConnection(dbConfig);
    console.log('تم الاتصال بخادم قاعدة البيانات بنجاح');
    return connection;
  } catch (error) {
    console.error('خطأ في الاتصال بقاعدة البيانات:', error);
    throw error;
  }
};

// تنفيذ أوامر SQL
const executeSqlCommands = async (connection, commands) => {
  for (const command of commands) {
    try {
      await connection.query(command);
      console.log('تم تنفيذ الأمر بنجاح:', command.substring(0, 50) + '...');
    } catch (error) {
      console.error('خطأ في تنفيذ الأمر:', command.substring(0, 100));
      console.error('رسالة الخطأ:', error.message);
      // استمر في تنفيذ باقي الأوامر حتى لو فشل أحدها
    }
  }
};

// الدالة الرئيسية لتنفيذ الـ migrations
const runMigrations = async () => {
  let connection;
  try {
    // قراءة ملف قاعدة البيانات
    const sqlContent = readDatabaseFile();
    if (!sqlContent) {
      console.error('لم يتم العثور على ملف قاعدة البيانات');
      return;
    }

    // تقسيم الأوامر
    const commands = splitSqlCommands(sqlContent);
    console.log(`تم العثور على ${commands.length} أمر SQL للتنفيذ`);

    // إنشاء اتصال بقاعدة البيانات
    connection = await createConnection();

    // تنفيذ الأوامر
    await executeSqlCommands(connection, commands);
    
    console.log('تم إنشاء قاعدة البيانات وتهيئتها بنجاح');
  } catch (error) {
    console.error('خطأ أثناء تنفيذ الـ migrations:', error);
  } finally {
    // إغلاق الاتصال
    if (connection) {
      await connection.end();
      console.log('تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
};

// تصدير الدالة لاستخدامها في ملف server.js
module.exports = { runMigrations };

// تنفيذ الـ migrations إذا تم تشغيل الملف مباشرة
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('اكتمل تنفيذ الـ migrations');
    })
    .catch(err => {
      console.error('فشل تنفيذ الـ migrations:', err);
      process.exit(1);
    });
}