const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

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

// API endpoint to get statistics
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await createConnection();

        const queries = {
            students: 'SELECT COUNT(*) as count FROM students',
            teachers: 'SELECT COUNT(*) as count FROM teachers',
            courses: 'SELECT COUNT(*) as count FROM courses',
            enrollments: 'SELECT COUNT(*) as count FROM enrollments'
        };

        const [
            [studentsResult],
            [teachersResult],
            [coursesResult],
            [enrollmentsResult]
        ] = await Promise.all([
            connection.execute(queries.students),
            connection.execute(queries.teachers),
            connection.execute(queries.courses),
            connection.execute(queries.enrollments)
        ]);

        const stats = {
            students: studentsResult[0].count,
            teachers: teachersResult[0].count,
            courses: coursesResult[0].count,
            enrollments: enrollmentsResult[0].count
        };

        const successRate = stats.enrollments > 0 ? Math.round((stats.enrollments / (stats.enrollments + 2)) * 100) : 95;

        res.json({
            students: stats.students,
            teachers: stats.teachers,
            courses: stats.courses,
            successRate: successRate
        });

    } catch (error) {
        console.error('Error fetching statistics:', error.message);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الإحصائيات'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

module.exports = router;