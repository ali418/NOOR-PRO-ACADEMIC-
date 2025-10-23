<?php
require_once 'config.php';

class EnrollmentAPI {
    private $conn;
    private $table_name = "enrollment_requests";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    // جلب جميع طلبات التسجيل
    public function getAllEnrollments() {
        try {
            $query = "SELECT * FROM " . $this->table_name . " ORDER BY submission_date DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $enrollments = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $enrollments[] = [
                    'id' => $row['id'],
                    'studentName' => $row['student_name'],
                    'email' => $row['email'],
                    'phone' => $row['phone'],
                    'courseId' => $row['course_id'],
                    'courseName' => $row['course_name'],
                    'coursePrice' => $row['course_price'],
                    'paymentMethod' => $row['payment_method'],
                    'paymentDetails' => json_decode($row['payment_details'], true),
                    'receiptFile' => $row['receipt_file'],
                    'status' => $row['status'],
                    'submissionDate' => $row['submission_date'],
                    'approvalDate' => $row['approval_date'],
                    'welcomeMessage' => $row['welcome_message'],
                    'whatsappLink' => $row['whatsapp_link'],
                    'notes' => $row['notes']
                ];
            }
            
            return $enrollments;
        } catch (Exception $e) {
            throw new Exception("خطأ في جلب البيانات: " . $e->getMessage());
        }
    }

    // إضافة طلب تسجيل جديد
    public function addEnrollment($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (student_name, email, phone, course_id, course_name, status, request_number, submission_date) 
                  VALUES (:student_name, :email, :phone, :course_id, :course_name, :status, :request_number, :submission_date)";
        
        $stmt = $this->conn->prepare($query);
        
        // Generate request number
        $request_number = 'REQ-' . time() . rand(100, 999);
        
        $stmt->bindParam(":student_name", $data['student_name']);
        $stmt->bindParam(":email", $data['email']);
        $stmt->bindParam(":phone", $data['phone']);
        $stmt->bindParam(":course_id", $data['course_id']);
        $stmt->bindParam(":course_name", $data['course_name']);
        $stmt->bindParam(":status", $data['status']);
        $stmt->bindParam(":request_number", $request_number);
        $stmt->bindParam(":submission_date", $data['submission_date']);
        
        if($stmt->execute()) {
            return array("success" => true, "request_number" => $request_number);
        }
        
        return array("success" => false, "message" => "فشل في إضافة طلب التسجيل");
    }

    // تحديث حالة طلب التسجيل
    public function updateEnrollmentStatus($id, $status, $additionalData = []) {
        try {
            $updateFields = ['status = :status'];
            $params = [':id' => $id, ':status' => $status];
            
            if (isset($additionalData['approvalDate'])) {
                $updateFields[] = 'approval_date = :approval_date';
                $params[':approval_date'] = $additionalData['approvalDate'];
            }
            
            if (isset($additionalData['welcomeMessage'])) {
                $updateFields[] = 'welcome_message = :welcome_message';
                $params[':welcome_message'] = $additionalData['welcomeMessage'];
            }
            
            if (isset($additionalData['whatsappLink'])) {
                $updateFields[] = 'whatsapp_link = :whatsapp_link';
                $params[':whatsapp_link'] = $additionalData['whatsappLink'];
            }
            
            if (isset($additionalData['notes'])) {
                $updateFields[] = 'notes = :notes';
                $params[':notes'] = $additionalData['notes'];
            }
            
            $query = "UPDATE " . $this->table_name . " SET " . implode(', ', $updateFields) . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            
            return $stmt->execute($params);
        } catch (Exception $e) {
            throw new Exception("خطأ في تحديث البيانات: " . $e->getMessage());
        }
    }

    // حذف طلب تسجيل
    public function deleteEnrollment($id) {
        try {
            $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            
            return $stmt->execute();
        } catch (Exception $e) {
            throw new Exception("خطأ في حذف البيانات: " . $e->getMessage());
        }
    }
}

// معالجة الطلبات
try {
    $enrollmentAPI = new EnrollmentAPI();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $enrollments = $enrollmentAPI->getAllEnrollments();
            sendResponse(true, 'تم جلب البيانات بنجاح', $enrollments);
            break;
            
        case 'POST':
            // Handle form data from enrollment form
            if (!empty($_POST)) {
                $data = array(
                    'student_name' => $_POST['studentName'] ?? '',
                    'email' => $_POST['email'] ?? '',
                    'phone' => $_POST['phone'] ?? '',
                    'course_id' => $_POST['courseId'] ?? '',
                    'course_name' => $_POST['courseName'] ?? '',
                    'status' => 'pending',
                    'submission_date' => date('Y-m-d H:i:s')
                );
                
                $result = $enrollmentAPI->addEnrollment($data);
                echo json_encode($result);
                break;
            }
            
            // Handle JSON data for admin actions
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (isset($input['action'])) {
                switch ($input['action']) {
                    case 'add':
                        $result = $enrollmentAPI->addEnrollment($input['data']);
                        echo json_encode($result);
                        break;
                        
                    case 'update_status':
                        $result = $enrollmentAPI->updateEnrollmentStatus(
                            $input['id'], 
                            $input['status'], 
                            $input['additionalData'] ?? []
                        );
                        if ($result) {
                            sendResponse(true, 'تم تحديث الحالة بنجاح');
                        } else {
                            sendResponse(false, 'فشل في تحديث الحالة');
                        }
                        break;
                        
                    default:
                        sendResponse(false, 'إجراء غير مدعوم');
                }
            } else {
                sendResponse(false, 'لم يتم تحديد الإجراء المطلوب');
            }
            break;
            
        case 'DELETE':
            $input = json_decode(file_get_contents('php://input'), true);
            if (isset($input['id'])) {
                $result = $enrollmentAPI->deleteEnrollment($input['id']);
                if ($result) {
                    sendResponse(true, 'تم حذف الطلب بنجاح');
                } else {
                    sendResponse(false, 'فشل في حذف الطلب');
                }
            } else {
                sendResponse(false, 'لم يتم تحديد معرف الطلب');
            }
            break;
            
        default:
            sendResponse(false, 'طريقة الطلب غير مدعومة');
    }
    
} catch (Exception $e) {
    sendResponse(false, $e->getMessage());
}
?>