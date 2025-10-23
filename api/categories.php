<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

class CategoryAPI {
    private $conn;
    
    public function __construct($connection) {
        $this->conn = $connection;
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        
        try {
            switch ($method) {
                case 'GET':
                    if (isset($_GET['id'])) {
                        $this->getCategory($_GET['id']);
                    } else {
                        $this->getAllCategories();
                    }
                    break;
                    
                case 'POST':
                    $this->addCategory();
                    break;
                    
                case 'PUT':
                    $this->updateCategory();
                    break;
                    
                case 'DELETE':
                    if (isset($_GET['id'])) {
                        $this->deleteCategory($_GET['id']);
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
    
    private function getAllCategories() {
        $query = "SELECT cc.*, COUNT(c.id) as course_count 
                  FROM course_categories cc 
                  LEFT JOIN courses c ON cc.category_name = c.category 
                  WHERE cc.is_active = 1 
                  GROUP BY cc.id 
                  ORDER BY cc.display_order";
        
        $result = $this->conn->query($query);
        $categories = [];
        
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $categories[] = $row;
            }
        }
        
        echo json_encode([
            'success' => true,
            'data' => $categories,
            'count' => count($categories)
        ]);
    }
    
    private function getCategory($id) {
        $stmt = $this->conn->prepare("SELECT cc.*, COUNT(c.id) as course_count 
                                      FROM course_categories cc 
                                      LEFT JOIN courses c ON cc.category_name = c.category 
                                      WHERE cc.id = ? 
                                      GROUP BY cc.id");
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
            echo json_encode(['error' => 'Category not found']);
        }
    }
    
    private function addCategory() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $input = $_POST;
        }
        
        $required = ['category_name', 'category_name_ar'];
        foreach ($required as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Missing required field: $field"]);
                return;
            }
        }
        
        $stmt = $this->conn->prepare("INSERT INTO course_categories 
                                      (category_name, category_name_ar, description, icon, color, display_order) 
                                      VALUES (?, ?, ?, ?, ?, ?)");
        
        $category_name = $input['category_name'];
        $category_name_ar = $input['category_name_ar'];
        $description = $input['description'] ?? '';
        $icon = $input['icon'] ?? 'fas fa-book';
        $color = $input['color'] ?? '#007bff';
        $display_order = $input['display_order'] ?? 1;
        
        $stmt->bind_param("sssssi", $category_name, $category_name_ar, $description, $icon, $color, $display_order);
        
        if ($stmt->execute()) {
            $categoryId = $this->conn->insert_id;
            echo json_encode([
                'success' => true,
                'message' => 'Category added successfully',
                'category_id' => $categoryId
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add category: ' . $this->conn->error]);
        }
    }
    
    private function updateCategory() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Category ID is required']);
            return;
        }
        
        $id = $input['id'];
        $fields = [];
        $values = [];
        $types = '';
        
        $allowedFields = ['category_name', 'category_name_ar', 'description', 'icon', 'color', 'is_active', 'display_order'];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $fields[] = "$field = ?";
                $values[] = $input[$field];
                
                if ($field === 'is_active' || $field === 'display_order') {
                    $types .= 'i';
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
        
        $query = "UPDATE course_categories SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param($types, ...$values);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Category updated successfully'
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Category not found']);
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update category: ' . $this->conn->error]);
        }
    }
    
    private function deleteCategory($id) {
        // التحقق من وجود كورسات مرتبطة بهذا القسم
        $stmt = $this->conn->prepare("SELECT COUNT(*) as course_count FROM courses c 
                                      JOIN course_categories cc ON c.category = cc.category_name 
                                      WHERE cc.id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row['course_count'] > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot delete category with associated courses']);
            return;
        }
        
        $deleteStmt = $this->conn->prepare("DELETE FROM course_categories WHERE id = ?");
        $deleteStmt->bind_param("i", $id);
        
        if ($deleteStmt->execute()) {
            if ($deleteStmt->affected_rows > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Category deleted successfully'
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Category not found']);
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete category: ' . $this->conn->error]);
        }
    }
}

// إنشاء مثيل من API وتشغيله
$api = new CategoryAPI($conn);
$api->handleRequest();
?>