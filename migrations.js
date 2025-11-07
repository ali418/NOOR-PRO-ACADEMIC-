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

// مسار مجلد ملفات المهاجرات
const getMigrationsDir = () => path.join(__dirname, 'db', 'migrations');

// قراءة ملف قاعدة البيانات (استخدام احتياطي إذا لم توجد ملفات مهاجرات)
const readDatabaseFile = () => {
  try {
    const databaseFilePath = path.join(__dirname, 'database.sql');
    return fs.readFileSync(databaseFilePath, 'utf8');
  } catch (error) {
    console.error('خطأ في قراءة ملف قاعدة البيانات:', error);
    return null;
  }
};

// تحميل ملفات المهاجرات مرتبة حسب الاسم
const loadMigrationFiles = () => {
  const dir = getMigrationsDir();
  try {
    if (!fs.existsSync(dir)) {
      return [];
    }
    const files = fs
      .readdirSync(dir)
      .filter(f => f.toLowerCase().endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    const migrations = files.map(file => {
      const fullPath = path.join(dir, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      return { name: file, commands: splitSqlCommands(sql) };
    });
    return migrations;
  } catch (error) {
    console.error('خطأ في قراءة ملفات المهاجرات:', error);
    return [];
  }
};

// تقسيم ملف SQL إلى أوامر منفصلة مع إزالة التعليقات
const splitSqlCommands = (sqlContent) => {
  if (!sqlContent || typeof sqlContent !== 'string') return [];
  // إزالة تعليقات البلوك /* ... */
  let cleaned = sqlContent.replace(/\/\*[\s\S]*?\*\//g, '');
  // إزالة التعليقات أحادية السطر التي تبدأ بـ -- أو #
  cleaned = cleaned
    .split(/\r?\n/)
    .filter(line => !/^\s*(--|#)/.test(line))
    .join('\n');

  return cleaned
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0);
};

// استخراج إعدادات قاعدة البيانات من متغيرات البيئة أو DATABASE_URL
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
        multipleStatements: true
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
    multipleStatements: true
  };
}

// إنشاء اتصال بقاعدة البيانات وتحديد قاعدة البيانات للاستخدام
const createConnection = async () => {
  const cfg = resolveDbConfig();
  try {
    // الاتصال بالخادم
    const connection = await mysql.createConnection({
      host: cfg.host,
      user: cfg.user,
      password: cfg.password,
      port: cfg.port,
      multipleStatements: true
    });
    console.log('تم الاتصال بخادم قاعدة البيانات بنجاح');

    // إنشاء قاعدة البيانات إذا لم تكن موجودة ثم استخدامها
    const dbName = cfg.database;
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${dbName}\``);

    return connection;
  } catch (error) {
    console.error('خطأ في الاتصال بقاعدة البيانات:', error);
    throw error;
  }
};

// التحقق مما إذا كان يجب تخطي الأمر لتجنب الازدواجية
const shouldSkipCommand = async (connection, command) => {
  const cmd = command.replace(/\s+/g, ' ').trim();

  // CREATE INDEX idx_name ON table (...)
  let m = cmd.match(/CREATE\s+INDEX\s+`?([A-Za-z0-9_]+)`?\s+ON\s+`?([A-Za-z0-9_]+)`?/i);
  if (m) {
    const indexName = m[1];
    const tableName = m[2];
    const [rows] = await connection.query(
      'SELECT COUNT(*) AS cnt FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
      [tableName, indexName]
    );
    return rows[0]?.cnt > 0;
  }

  // ALTER TABLE table ADD INDEX/KEY idx_name (...)
  m = cmd.match(/ALTER\s+TABLE\s+`?([A-Za-z0-9_]+)`?\s+ADD\s+(?:INDEX|KEY)\s+`?([A-Za-z0-9_]+)`?/i);
  if (m) {
    const tableName = m[1];
    const indexName = m[2];
    const [rows] = await connection.query(
      'SELECT COUNT(*) AS cnt FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
      [tableName, indexName]
    );
    return rows[0]?.cnt > 0;
  }

  // ALTER TABLE table ADD COLUMN column ...
  m = cmd.match(/ALTER\s+TABLE\s+`?([A-Za-z0-9_]+)`?\s+ADD\s+COLUMN\s+`?([A-Za-z0-9_]+)`?/i);
  if (m) {
    const tableName = m[1];
    const columnName = m[2];
    const [rows] = await connection.query(
      'SELECT COUNT(*) AS cnt FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
      [tableName, columnName]
    );
    return rows[0]?.cnt > 0;
  }

  // ALTER TABLE table ADD CONSTRAINT fk_name FOREIGN KEY (...)
  m = cmd.match(/ALTER\s+TABLE\s+`?([A-Za-z0-9_]+)`?\s+ADD\s+CONSTRAINT\s+`?([A-Za-z0-9_]+)`?\s+FOREIGN\s+KEY/i);
  if (m) {
    const tableName = m[1];
    const constraintName = m[2];
    const [rows] = await connection.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = ? AND constraint_type = 'FOREIGN KEY'",
      [tableName, constraintName]
    );
    return rows[0]?.cnt > 0;
  }

  return false; // افتراضياً لا يتم التخطي
};

// تنفيذ أوامر SQL مع تخطي الأوامر المكررة
const executeSqlCommands = async (connection, commands) => {
  for (const command of commands) {
    try {
      if (await shouldSkipCommand(connection, command)) {
        console.log('تم تخطي الأمر (موجود مسبقاً):', command.substring(0, 80) + '...');
        continue;
      }
      await connection.query(command);
      console.log('تم تنفيذ الأمر بنجاح:', command.substring(0, 80) + '...');
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
    // محاولة تحميل ملفات المهاجرات
    const migrations = loadMigrationFiles();
    let commands = [];
    if (migrations.length > 0) {
      console.log(`تم العثور على ${migrations.length} ملف مهاجرات. سيتم تنفيذها بالترتيب.`);
      // دمج جميع الأوامر مع الحفاظ على ترتيب الملفات
      migrations.forEach(m => {
        console.log(`تحميل ملف المهاجرات: ${m.name} - عدد الأوامر: ${m.commands.length}`);
        commands.push(...m.commands);
      });
    } else {
      // استخدام ملف قاعدة البيانات كحل احتياطي
      const sqlContent = readDatabaseFile();
      if (!sqlContent) {
        console.error('لم يتم العثور على ملف قاعدة البيانات أو ملفات مهاجرات');
        return;
      }
      commands = splitSqlCommands(sqlContent);
      console.log(`تم العثور على ${commands.length} أمر SQL للتنفيذ من database.sql`);
    }

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