<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

class VideoAPI {
    private $conn;
    
    public function __construct($connection) {
        $this->conn = $connection;
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $pathParts = explode('/', trim($path, '/'));
        
        try {
            switch ($method) {
                case 'GET':
                    if (isset($_GET['course_id'])) {
                        $this->getVideosByCourse($_GET['course_id']);
                    } elseif (isset($_GET['id'])) {
                        $this->getVideo($_GET['id']);
                    } else {
                        $this->getAllVideos();
                    }
                    break;
                    
                case 'POST':
                    if (isset($_POST['action']) && $_POST['action'] === 'upload') {
                        $this->uploadVideo();
                    } else {
                        $this->addVideo();
                    }
                    break;
                    
                case 'PUT':
                    $this->updateVideo();
                    break;
                    
                case 'DELETE':
                    if (isset($_GET['id'])) {
                        $this->deleteVideo($_GET['id']);
                    }
                    break;
                    
                default:
                    http_response_code(405);
                    echo json_encode(['error' => 'Method not allowed']);
                    break;
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    
    private function getAllVideos() {
        $query = "SELECT cv.*, c.course_name, c.course_name_ar 
                  FROM course_videos cv 
                  LEFT JOIN courses c ON cv.course_id = c.id 
                  ORDER BY cv.course_id, cv.video_order";
        
        $result = $this->conn->query($query);
        $videos = [];
        
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $videos[] = $row;
            }
        }
        
        echo json_encode([
            'success' => true,
            'data' => $videos,
            'count' => count($videos)
        ]);
    }
    
    private function getVideosByCourse($courseId) {
        $stmt = $this->conn->prepare("SELECT * FROM course_videos WHERE course_id = ? ORDER BY video_order");
        $stmt->bind_param("i", $courseId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $videos = [];
        while ($row = $result->fetch_assoc()) {
            $videos[] = $row;
        }
        
        echo json_encode([
            'success' => true,
            'data' => $videos,
            'count' => count($videos)
        ]);
    }
    
    private function getVideo($id) {
        $stmt = $this->conn->prepare("SELECT cv.*, c.course_name, c.course_name_ar 
                                      FROM course_videos cv 
                                      LEFT JOIN courses c ON cv.course_id = c.id 
                                      WHERE cv.id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            echo json_encode([
                'success' => true,
                'data' => $row
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Video not found']);
        }
    }
    
    private function addVideo() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $input = $_POST;
        }
        
        $required = ['course_id', 'video_title', 'video_url'];
        foreach ($required as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Missing required field: $field"]);
                return;
            }
        }
        
        $stmt = $this->conn->prepare("INSERT INTO course_videos 
                                      (course_id, video_title, video_description, video_url, video_duration, video_order, is_free) 
                                      VALUES (?, ?, ?, ?, ?, ?, ?)");
        
        $course_id = $input['course_id'];
        $video_title = $input['video_title'];
        $video_description = $input['video_description'] ?? '';
        $video_url = $input['video_url'];
        $video_duration = $input['video_duration'] ?? 0;
        $video_order = $input['video_order'] ?? 1;
        $is_free = isset($input['is_free']) ? (bool)$input['is_free'] : false;
        
        $stmt->bind_param("isssiib", $course_id, $video_title, $video_description, $video_url, $video_duration, $video_order, $is_free);
        
        if ($stmt->execute()) {
            $videoId = $this->conn->insert_id;
            echo json_encode([
                'success' => true,
                'message' => 'Video added successfully',
                'video_id' => $videoId
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add video: ' . $this->conn->error]);
        }
    }
    
    private function updateVideo() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Video ID is required']);
            return;
        }
        
        $id = $input['id'];
        $fields = [];
        $values = [];
        $types = '';
        
        $allowedFields = ['course_id', 'video_title', 'video_description', 'video_url', 'video_duration', 'video_order', 'is_free'];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $fields[] = "$field = ?";
                $values[] = $input[$field];
                
                if ($field === 'course_id' || $field === 'video_duration' || $field === 'video_order') {
                    $types .= 'i';
                } elseif ($field === 'is_free') {
                    $types .= 'i';
                    $values[count($values) - 1] = (bool)$input[$field] ? 1 : 0;
                } else {
                    $types .= 's';
                }
            }
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            return;
        }
        
        $values[] = $id;
        $types .= 'i';
        
        $query = "UPDATE course_videos SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param($types, ...$values);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Video updated successfully'
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Video not found']);
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update video: ' . $this->conn->error]);
        }
    }
    
    private function deleteVideo($id) {
        // أولاً، احصل على معلومات الفيديو لحذف الملف
        $stmt = $this->conn->prepare("SELECT video_url FROM course_videos WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            // حذف الملف من الخادم إذا كان محلياً
            $videoUrl = $row['video_url'];
            if (strpos($videoUrl, 'uploads/') !== false) {
                $filePath = '../' . $videoUrl;
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }
            
            // حذف السجل من قاعدة البيانات
            $deleteStmt = $this->conn->prepare("DELETE FROM course_videos WHERE id = ?");
            $deleteStmt->bind_param("i", $id);
            
            if ($deleteStmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Video deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete video: ' . $this->conn->error]);
            }
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Video not found']);
        }
    }
    
    private function uploadVideo() {
        if (!isset($_FILES['video']) || $_FILES['video']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['error' => 'No video file uploaded or upload error']);
            return;
        }
        
        $file = $_FILES['video'];
        $allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'];
        $maxSize = 100 * 1024 * 1024; // 100MB
        
        if (!in_array($file['type'], $allowedTypes)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid file type. Only video files are allowed.']);
            return;
        }
        
        if ($file['size'] > $maxSize) {
            http_response_code(400);
            echo json_encode(['error' => 'File size too large. Maximum size is 100MB.']);
            return;
        }
        
        $uploadDir = '../uploads/videos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = uniqid('video_') . '.' . $fileExtension;
        $filePath = $uploadDir . $fileName;
        
        if (move_uploaded_file($file['tmp_name'], $filePath)) {
            $videoUrl = 'uploads/videos/' . $fileName;
            
            // إضافة معلومات الفيديو إلى قاعدة البيانات إذا تم توفير معلومات إضافية
            if (isset($_POST['course_id']) && isset($_POST['video_title'])) {
                $stmt = $this->conn->prepare("INSERT INTO course_videos 
                                              (course_id, video_title, video_description, video_url, video_duration, video_order, is_free) 
                                              VALUES (?, ?, ?, ?, ?, ?, ?)");
                
                $course_id = $_POST['course_id'];
                $video_title = $_POST['video_title'];
                $video_description = $_POST['video_description'] ?? '';
                $video_duration = $_POST['video_duration'] ?? 0;
                $video_order = $_POST['video_order'] ?? 1;
                $is_free = isset($_POST['is_free']) ? (bool)$_POST['is_free'] : false;
                
                $stmt->bind_param("isssiib", $course_id, $video_title, $video_description, $videoUrl, $video_duration, $video_order, $is_free);
                
                if ($stmt->execute()) {
                    $videoId = $this->conn->insert_id;
                    echo json_encode([
                        'success' => true,
                        'message' => 'Video uploaded and added successfully',
                        'video_url' => $videoUrl,
                        'video_id' => $videoId
                    ]);
                } else {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Video uploaded successfully, but failed to add to database',
                        'video_url' => $videoUrl,
                        'error' => $this->conn->error
                    ]);
                }
            } else {
                echo json_encode([
                    'success' => true,
                    'message' => 'Video uploaded successfully',
                    'video_url' => $videoUrl
                ]);
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to upload video']);
        }
    }
}

// إنشاء مثيل من API وتشغيله
$api = new VideoAPI($conn);
$api->handleRequest();
?>