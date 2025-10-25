<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // إحصائيات الطلاب
    $studentsQuery = "SELECT COUNT(*) as total_students FROM students";
    $studentsStmt = $db->prepare($studentsQuery);
    $studentsStmt->execute();
    $studentsResult = $studentsStmt->fetch(PDO::FETCH_ASSOC);
    $totalStudents = $studentsResult['total_students'] ?? 0;
    
    // إحصائيات الكورسات
    $coursesQuery = "SELECT COUNT(*) as total_courses FROM courses";
    $coursesStmt = $db->prepare($coursesQuery);
    $coursesStmt->execute();
    $coursesResult = $coursesStmt->fetch(PDO::FETCH_ASSOC);
    $totalCourses = $coursesResult['total_courses'] ?? 0;
    
    // إحصائيات المستخدمين النشطين (المسجلين في الكورسات)
    $activeUsersQuery = "SELECT COUNT(DISTINCT student_id) as active_users FROM enrollments";
    $activeUsersStmt = $db->prepare($activeUsersQuery);
    $activeUsersStmt->execute();
    $activeUsersResult = $activeUsersStmt->fetch(PDO::FETCH_ASSOC);
    $activeUsers = $activeUsersResult['active_users'] ?? 0;
    
    // إحصائيات التسجيلات
    $enrollmentsQuery = "SELECT COUNT(*) as total_enrollments FROM enrollments";
    $enrollmentsStmt = $db->prepare($enrollmentsQuery);
    $enrollmentsStmt->execute();
    $enrollmentsResult = $enrollmentsStmt->fetch(PDO::FETCH_ASSOC);
    $totalEnrollments = $enrollmentsResult['total_enrollments'] ?? 0;
    
    // إحصائيات المعلمين
    $teachersQuery = "SELECT COUNT(*) as total_teachers FROM teachers";
    $teachersStmt = $db->prepare($teachersQuery);
    $teachersStmt->execute();
    $teachersResult = $teachersStmt->fetch(PDO::FETCH_ASSOC);
    $totalTeachers = $teachersResult['total_teachers'] ?? 0;
    
    // حالة النظام (نسبة مئوية بناءً على وجود البيانات)
    $systemStatus = 100; // افتراضياً 100% إذا كان النظام يعمل
    if ($totalStudents == 0 && $totalCourses == 0 && $totalEnrollments == 0) {
        $systemStatus = 0; // 0% إذا لم توجد بيانات
    }
    
    $stats = [
        'success' => true,
        'data' => [
            'totalStudents' => (int)$totalStudents,
            'totalCourses' => (int)$totalCourses,
            'activeUsers' => (int)$activeUsers,
            'totalEnrollments' => (int)$totalEnrollments,
            'totalTeachers' => (int)$totalTeachers,
            'systemStatus' => $systemStatus
        ]
    ];
    
    echo json_encode($stats, JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage(),
        'data' => [
            'totalStudents' => 0,
            'totalCourses' => 0,
            'activeUsers' => 0,
            'totalEnrollments' => 0,
            'totalTeachers' => 0,
            'systemStatus' => 0
        ]
    ], JSON_UNESCAPED_UNICODE);
}
?>