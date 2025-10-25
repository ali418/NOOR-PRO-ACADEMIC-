<?php
// إعدادات قاعدة البيانات - تكوين Railway
$db_url = getenv('DATABASE_URL');
if ($db_url) {
    // استخدام متغيرات البيئة من Railway
    define('DB_HOST', getenv('MYSQLHOST') ?: 'containers-us-west-41.railway.app');
    define('DB_NAME', getenv('MYSQLDATABASE') ?: 'railway');
    define('DB_USER', getenv('MYSQLUSER') ?: 'root');
    define('DB_PASS', getenv('MYSQLPASSWORD') ?: 'your_password_here');
    define('DB_PORT', getenv('MYSQLPORT') ?: '5432');
} else {
    // إعدادات محلية
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'noor_academy');
    define('DB_USER', 'root');
    define('DB_PASS', '');
}

// إعداد الترميز
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// التعامل مع طلبات OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    public $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $port = defined('DB_PORT') ? DB_PORT : '3306';
            $dsn = "mysql:host=" . $this->host . ";port=" . $port . ";dbname=" . $this->db_name . ";charset=utf8";
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo json_encode([
                'success' => false,
                'message' => 'فشل الاتصال بقاعدة البيانات: ' . $exception->getMessage()
            ]);
        }
        
        return $this->conn;
    }
}

// دالة مساعدة لإرسال الاستجابة
function sendResponse($success, $message, $data = null) {
    $response = [
        'success' => $success,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

// دالة التحقق من صحة البيانات
function validateInput($data, $required_fields) {
    $errors = [];
    
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            $errors[] = "الحقل {$field} مطلوب";
        }
    }
    
    return $errors;
}
?>