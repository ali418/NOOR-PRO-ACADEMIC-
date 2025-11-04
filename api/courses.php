<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        getCourses($db);
        break;
    case 'POST':
        addCourse($db, $input);
        break;
    case 'PUT':
        updateCourse($db, $input);
        break;
    case 'DELETE':
        deleteCourse($db, $input);
        break;
    default:
        sendResponse(false, 'طريقة الطلب غير مدعومة');
}

// عرض جميع المقررات أو مقرر محدد
function getCourses($db) {
    try {
        $course_id = isset($_GET['id']) ? $_GET['id'] : null;
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        
        if ($course_id) {
            // عرض مقرر محدد
            $query = "SELECT * FROM courses WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $course_id);
        } else {
            // عرض جميع المقررات مع إمكانية البحث
            $query = "SELECT * FROM courses WHERE 
                     title LIKE :search OR 
                     course_code LIKE :search OR 
                     instructor_name LIKE :search 
                     ORDER BY id DESC";
            $stmt = $db->prepare($query);
            $search_param = "%{$search}%";
            $stmt->bindParam(':search', $search_param);
        }
        
        $stmt->execute();
        $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'تم جلب البيانات بنجاح', $courses);
        
    } catch(PDOException $e) {
        sendResponse(false, 'خطأ في جلب البيانات: ' . $e->getMessage());
    }
}

// إضافة مقرر جديد
function addCourse($db, $input) {
    try {
        $required_fields = ['course_code'];
        $errors = validateInput($input, $required_fields);
        
        if (!empty($errors)) {
            sendResponse(false, implode(', ', $errors));
        }
        
        // التحقق من عدم تكرار رمز المقرر
        $check_query = "SELECT id FROM courses WHERE course_code = :course_code";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(':course_code', $input['course_code']);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            sendResponse(false, 'رمز المقرر موجود مسبقاً');
        }
        
        $query = "INSERT INTO courses (course_code, course_name, title, description, credits, duration_weeks, instructor_name, max_students, youtube_link, category, price, level_name, start_date, end_date, course_icon, badge_text) 
                  VALUES (:course_code, :course_name, :title, :description, :credits, :duration_weeks, :instructor_name, :max_students, :youtube_link, :category, :price, :level_name, :start_date, :end_date, :course_icon, :badge_text)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':course_code', $input['course_code']);
        $course_name_val = $input['course_name'] ?? ($input['title'] ?? '');
        $title_val = $input['title'] ?? ($input['course_name'] ?? '');
        $stmt->bindParam(':course_name', $course_name_val);
        $stmt->bindParam(':title', $title_val);
        $stmt->bindParam(':description', $input['description'] ?? null);
        $stmt->bindParam(':credits', $input['credits'] ?? 3);
        $stmt->bindParam(':duration_weeks', $input['duration_weeks'] ?? 16);
        $stmt->bindParam(':instructor_name', $input['instructor_name'] ?? null);
        $stmt->bindParam(':max_students', $input['max_students'] ?? 30);
        $stmt->bindParam(':youtube_link', $input['youtube_link'] ?? null);
        $stmt->bindParam(':category', $input['category'] ?? 'general');
        $stmt->bindParam(':price', $input['price'] ?? '0');
        $stmt->bindParam(':level_name', $input['level_name'] ?? 'مبتدئ');
        $stmt->bindParam(':start_date', $input['start_date'] ?? null);
        $stmt->bindParam(':end_date', $input['end_date'] ?? null);
        $stmt->bindParam(':course_icon', $input['course_icon'] ?? 'fas fa-book');
        $stmt->bindParam(':badge_text', $input['badge_text'] ?? null);
        
        if ($stmt->execute()) {
            $course_id = $db->lastInsertId();
            sendResponse(true, 'تم إضافة المقرر بنجاح', ['id' => $course_id]);
        } else {
            sendResponse(false, 'فشل في إضافة المقرر');
        }
        
    } catch(PDOException $e) {
        sendResponse(false, 'خطأ في إضافة المقرر: ' . $e->getMessage());
    }
}

// تحديث بيانات مقرر
function updateCourse($db, $input) {
    try {
        if (!isset($input['id'])) {
            sendResponse(false, 'معرف المقرر مطلوب');
        }
        
        $required_fields = ['id'];
        $errors = validateInput($input, $required_fields);
        
        if (!empty($errors)) {
            sendResponse(false, implode(', ', $errors));
        }
        
        // التحقق من وجود المقرر
        $check_query = "SELECT id FROM courses WHERE id = :id";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(':id', $input['id']);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() == 0) {
            sendResponse(false, 'المقرر غير موجود');
        }
        
        $query = "UPDATE courses SET 
                  course_name = :course_name,
                  title = :title,
                  description = :description,
                  credits = :credits,
                  duration_weeks = :duration_weeks,
                  instructor_name = :instructor_name,
                  max_students = :max_students,
                  status = :status,
                  youtube_link = :youtube_link,
                  category = :category,
                  price = :price,
                  level_name = :level_name,
                  start_date = :start_date,
                  end_date = :end_date,
                  course_icon = :course_icon,
                  badge_text = :badge_text
                  WHERE id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $input['id']);
        $course_name_upd = $input['course_name'] ?? ($input['title'] ?? '');
        $title_upd = $input['title'] ?? ($input['course_name'] ?? '');
        $stmt->bindParam(':course_name', $course_name_upd);
        $stmt->bindParam(':title', $title_upd);
        $stmt->bindParam(':description', $input['description'] ?? null);
        $stmt->bindParam(':credits', $input['credits'] ?? 3);
        $stmt->bindParam(':duration_weeks', $input['duration_weeks'] ?? 16);
        $stmt->bindParam(':instructor_name', $input['instructor_name'] ?? null);
        $stmt->bindParam(':max_students', $input['max_students'] ?? 30);
        $stmt->bindParam(':status', $input['status'] ?? 'active');
        $stmt->bindParam(':youtube_link', $input['youtube_link'] ?? null);
        $stmt->bindParam(':category', $input['category'] ?? 'general');
        $stmt->bindParam(':price', $input['price'] ?? '0');
        $stmt->bindParam(':level_name', $input['level_name'] ?? 'مبتدئ');
        $stmt->bindParam(':start_date', $input['start_date'] ?? null);
        $stmt->bindParam(':end_date', $input['end_date'] ?? null);
        $stmt->bindParam(':course_icon', $input['course_icon'] ?? 'fas fa-book');
        $stmt->bindParam(':badge_text', $input['badge_text'] ?? null);
        
        if ($stmt->execute()) {
            sendResponse(true, 'تم تحديث بيانات المقرر بنجاح');
        } else {
            sendResponse(false, 'فشل في تحديث بيانات المقرر');
        }
        
    } catch(PDOException $e) {
        sendResponse(false, 'خطأ في تحديث المقرر: ' . $e->getMessage());
    }
}

// حذف مقرر
function deleteCourse($db, $input) {
    try {
        if (!isset($input['id'])) {
            sendResponse(false, 'معرف المقرر مطلوب');
        }
        
        // التحقق من وجود المقرر
        $check_query = "SELECT id FROM courses WHERE id = :id";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(':id', $input['id']);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() == 0) {
            sendResponse(false, 'المقرر غير موجود');
        }
        
        // التحقق من وجود طلاب مسجلين في المقرر
        $enrollment_check = "SELECT id FROM enrollments WHERE course_id = :course_id";
        $enrollment_stmt = $db->prepare($enrollment_check);
        $enrollment_stmt->bindParam(':course_id', $input['id']);
        $enrollment_stmt->execute();
        
        if ($enrollment_stmt->rowCount() > 0) {
            sendResponse(false, 'لا يمكن حذف المقرر لوجود طلاب مسجلين فيه');
        }
        
        $query = "DELETE FROM courses WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $input['id']);
        
        if ($stmt->execute()) {
            sendResponse(true, 'تم حذف المقرر بنجاح');
        } else {
            sendResponse(false, 'فشل في حذف المقرر');
        }
        
    } catch(PDOException $e) {
        sendResponse(false, 'خطأ في حذف المقرر: ' . $e->getMessage());
    }
}
?>