<?php
// إعدادات قاعدة البيانات - تكوين Railway
$db_url = getenv('DATABASE_URL') ?: getenv('RAILWAY_DATABASE_URL');
if ($db_url) {
    // محاولة تحليل DATABASE_URL بصيغة: mysql://user:pass@host:port/dbname
    $parsed = parse_url($db_url);
    $host = isset($parsed['host']) ? $parsed['host'] : (getenv('MYSQLHOST') ?: 'localhost');
    $port = isset($parsed['port']) ? $parsed['port'] : (getenv('MYSQLPORT') ?: '3306');
    $user = isset($parsed['user']) ? $parsed['user'] : (getenv('MYSQLUSER') ?: 'root');
    $pass = isset($parsed['pass']) ? $parsed['pass'] : (getenv('MYSQLPASSWORD') ?: '');
    $path = isset($parsed['path']) ? ltrim($parsed['path'], '/') : (getenv('MYSQLDATABASE') ?: 'noor_pro_academic');

    define('DB_HOST', $host);
    define('DB_NAME', $path);
    define('DB_USER', $user);
    define('DB_PASS', $pass);
    define('DB_PORT', $port);
} else {
    // إعدادات محلية
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'noor_pro_academic');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_PORT', '3306');
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