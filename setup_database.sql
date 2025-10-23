-- إعداد قاعدة البيانات noor_pro_academic
-- تنفيذ هذا الملف سيقوم بإنشاء قاعدة البيانات والجداول المطلوبة

-- إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS noor_pro_academic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE noor_pro_academic;

-- جدول الطلاب
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female') NOT NULL,
    address TEXT,
    enrollment_date DATE NOT NULL,
    status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول المقررات الدراسية
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    description TEXT,
    credits INT NOT NULL DEFAULT 3,
    duration_weeks INT NOT NULL DEFAULT 16,
    instructor_name VARCHAR(100),
    max_students INT DEFAULT 30,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول المدرسين
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    specialization VARCHAR(100),
    qualification VARCHAR(100),
    experience_years INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول التسجيلات
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date DATE NOT NULL,
    status ENUM('enrolled', 'completed', 'dropped') DEFAULT 'enrolled',
    grade DECIMAL(5,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, course_id)
);

-- جدول طلبات التسجيل الجديدة
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

-- جدول الفئات
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول الفيديوهات
CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    course_id INT,
    category_id INT,
    duration INT, -- بالثواني
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollment_requests_status ON enrollment_requests(status);
CREATE INDEX idx_enrollment_requests_submission_date ON enrollment_requests(submission_date);
CREATE INDEX idx_enrollment_requests_email ON enrollment_requests(email);
CREATE INDEX idx_enrollment_requests_request_number ON enrollment_requests(request_number);
CREATE INDEX idx_videos_course ON videos(course_id);
CREATE INDEX idx_videos_category ON videos(category_id);
CREATE INDEX idx_videos_status ON videos(status);

-- إدراج بيانات تجريبية للفئات
INSERT INTO categories (name, description) VALUES 
('البرمجة', 'دورات البرمجة وتطوير البرمجيات'),
('التصميم', 'دورات التصميم الجرافيكي وتصميم المواقع'),
('التسويق', 'دورات التسويق الرقمي والتسويق الإلكتروني'),
('اللغات', 'دورات تعلم اللغات المختلفة');

-- إدراج بيانات تجريبية للدورات
INSERT INTO courses (course_code, course_name, description, credits, duration_weeks, instructor_name, max_students) VALUES 
('CS101', 'مقدمة في البرمجة', 'تعلم أساسيات البرمجة باستخدام Python', 3, 12, 'أحمد محمد', 25),
('WEB201', 'تطوير المواقع', 'تعلم HTML, CSS, JavaScript لتطوير المواقع', 4, 16, 'فاطمة علي', 20),
('DES101', 'أساسيات التصميم', 'تعلم أساسيات التصميم الجرافيكي', 3, 10, 'محمد حسن', 15),
('MKT301', 'التسويق الرقمي', 'استراتيجيات التسويق عبر الإنترنت', 3, 8, 'سارة أحمد', 30);

-- إدراج بيانات تجريبية للطلاب
INSERT INTO students (student_id, first_name, last_name, email, phone, date_of_birth, gender, address, enrollment_date) VALUES 
('STU001', 'علي', 'محمد', 'ali.mohamed@email.com', '01234567890', '1995-05-15', 'male', 'القاهرة، مصر', '2024-01-15'),
('STU002', 'مريم', 'أحمد', 'mariam.ahmed@email.com', '01234567891', '1997-08-22', 'female', 'الإسكندرية، مصر', '2024-01-20'),
('STU003', 'محمد', 'علي', 'mohamed.ali@email.com', '01234567892', '1996-12-10', 'male', 'الجيزة، مصر', '2024-02-01');

COMMIT;