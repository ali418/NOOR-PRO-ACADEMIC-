<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        getStudents($db);
        break;
    case 'POST':
        addStudent($db, $input);
        break;
    case 'PUT':
        updateStudent($db, $input);
        break;
    case 'DELETE':
        deleteStudent($db, $input);
        break;
    default:
        sendResponse(false, 'طريقة الطلب غير مدعومة');
}

// عرض جميع الطلاب أو طالب محدد
function getStudents($db) {
    try {
        $student_id = isset($_GET['id']) ? $_GET['id'] : null;
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        
        if ($student_id) {
            // عرض طالب محدد
            $query = "SELECT * FROM students WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $student_id);
        } else {
            // عرض جميع الطلاب مع إمكانية البحث
            $query = "SELECT * FROM students WHERE 
                     first_name LIKE :search OR 
                     last_name LIKE :search OR 
                     student_id LIKE :search OR 
                     email LIKE :search 
                     ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
            $search_param = "%{$search}%";
            $stmt->bindParam(':search', $search_param);
        }
        
        $stmt->execute();
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'تم جلب البيانات بنجاح', $students);
        
    } catch(PDOException $e) {
        sendResponse(false, 'خطأ في جلب البيانات: ' . $e->getMessage());
    }
}

// إضافة طالب جديد
function addStudent($db, $input) {
    try {
        $required_fields = ['student_id', 'first_name', 'last_name', 'email', 'gender', 'enrollment_date'];
        $errors = validateInput($input, $required_fields);
        
        if (!empty($errors)) {
            sendResponse(false, implode(', ', $errors));
        }
        
        // التحقق من عدم تكرار رقم الطالب أو البريد الإلكتروني
        $check_query = "SELECT id FROM students WHERE student_id = :student_id OR email = :email";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(':student_id', $input['student_id']);
        $check_stmt->bindParam(':email', $input['email']);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            sendResponse(false, 'رقم الطالب أو البريد الإلكتروني موجود مسبقاً');
        }
        
        $query = "INSERT INTO students (student_id, first_name, last_name, email, phone, date_of_birth, gender, address, enrollment_date) 
                  VALUES (:student_id, :first_name, :last_name, :email, :phone, :date_of_birth, :gender, :address, :enrollment_date)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_id', $input['student_id']);
        $stmt->bindParam(':first_name', $input['first_name']);
        $stmt->bindParam(':last_name', $input['last_name']);
        $stmt->bindParam(':email', $input['email']);
        $stmt->bindParam(':phone', $input['phone'] ?? null);
        $stmt->bindParam(':date_of_birth', $input['date_of_birth'] ?? null);
        $stmt->bindParam(':gender', $input['gender']);
        $stmt->bindParam(':address', $input['address'] ?? null);
        $stmt->bindParam(':enrollment_date', $input['enrollment_date']);
        
        if ($stmt->execute()) {
            $student_id = $db->lastInsertId();
            sendResponse(true, 'تم إضافة الطالب بنجاح', ['id' => $student_id]);
        } else {
            sendResponse(false, 'فشل في إضافة الطالب');
        }
        
    } catch(PDOException $e) {
        sendResponse(false, 'خطأ في إضافة الطالب: ' . $e->getMessage());
    }
}

// تحديث بيانات طالب
function updateStudent($db, $input) {
    try {
        if (!isset($input['id'])) {
            sendResponse(false, 'معرف الطالب مطلوب');
        }
        
        $required_fields = ['first_name', 'last_name', 'email', 'gender'];
        $errors = validateInput($input, $required_fields);
        
        if (!empty($errors)) {
            sendResponse(false, implode(', ', $errors));
        }
        
        // التحقق من وجود الطالب
        $check_query = "SELECT id FROM students WHERE id = :id";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(':id', $input['id']);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() == 0) {
            sendResponse(false, 'الطالب غير موجود');
        }
        
        // التحقق من عدم تكرار البريد الإلكتروني
        $email_check = "SELECT id FROM students WHERE email = :email AND id != :id";
        $email_stmt = $db->prepare($email_check);
        $email_stmt->bindParam(':email', $input['email']);
        $email_stmt->bindParam(':id', $input['id']);
        $email_stmt->execute();
        
        if ($email_stmt->rowCount() > 0) {
            sendResponse(false, 'البريد الإلكتروني موجود مسبقاً');
        }
        
        $query = "UPDATE students SET 
                  first_name = :first_name,
                  last_name = :last_name,
                  email = :email,
                  phone = :phone,
                  date_of_birth = :date_of_birth,
                  gender = :gender,
                  address = :address,
                  status = :status
                  WHERE id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $input['id']);
        $stmt->bindParam(':first_name', $input['first_name']);
        $stmt->bindParam(':last_name', $input['last_name']);
        $stmt->bindParam(':email', $input['email']);
        $stmt->bindParam(':phone', $input['phone'] ?? null);
        $stmt->bindParam(':date_of_birth', $input['date_of_birth'] ?? null);
        $stmt->bindParam(':gender', $input['gender']);
        $stmt->bindParam(':address', $input['address'] ?? null);
        $stmt->bindParam(':status', $input['status'] ?? 'active');
        
        if ($stmt->execute()) {
            sendResponse(true, 'تم تحديث بيانات الطالب بنجاح');
        } else {
            sendResponse(false, 'فشل في تحديث بيانات الطالب');
        }
        
    } catch(PDOException $e) {
        sendResponse(false, 'خطأ في تحديث الطالب: ' . $e->getMessage());
    }
}

// حذف طالب
function deleteStudent($db, $input) {
    try {
        if (!isset($input['id'])) {
            sendResponse(false, 'معرف الطالب مطلوب');
        }
        
        // التحقق من وجود الطالب
        $check_query = "SELECT id FROM students WHERE id = :id";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(':id', $input['id']);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() == 0) {
            sendResponse(false, 'الطالب غير موجود');
        }
        
        $query = "DELETE FROM students WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $input['id']);
        
        if ($stmt->execute()) {
            sendResponse(true, 'تم حذف الطالب بنجاح');
        } else {
            sendResponse(false, 'فشل في حذف الطالب');
        }
        
    } catch(PDOException $e) {
        sendResponse(false, 'خطأ في حذف الطالب: ' . $e->getMessage());
    }
}
?>