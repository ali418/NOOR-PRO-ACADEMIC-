-- إنشاء جدول طلبات التسجيل الجديدة
USE noor_pro_academic;

CREATE TABLE IF NOT EXISTS enrollment_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    request_number VARCHAR(50) UNIQUE NOT NULL,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approval_date TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_status ON enrollment_requests(status);
CREATE INDEX idx_submission_date ON enrollment_requests(submission_date);
CREATE INDEX idx_email ON enrollment_requests(email);
CREATE INDEX idx_request_number ON enrollment_requests(request_number);