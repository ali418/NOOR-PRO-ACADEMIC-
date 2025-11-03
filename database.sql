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
    title VARCHAR(100),
    course_name VARCHAR(100) NOT NULL,
    description TEXT,
    credits INT NOT NULL DEFAULT 3,
    duration_weeks INT NOT NULL DEFAULT 16,
    instructor_name VARCHAR(100),
    max_students INT DEFAULT 30,
    price VARCHAR(255),
    level_name VARCHAR(50),
    start_date DATE,
    end_date DATE,
    duration VARCHAR(50),
    capacity INT,
    details TEXT,
    category VARCHAR(50),
    course_icon VARCHAR(50),
    badge_text VARCHAR(50),
    youtube_link TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Ensure category_id exists and is linked to course_categories
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category_id INT DEFAULT NULL;
-- Add FK constraint (will be ignored if already exists)
ALTER TABLE courses ADD CONSTRAINT fk_courses_category 
FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE SET NULL;

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

-- جدول تسجيل الطلاب في المقررات
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date DATE NOT NULL,
    status ENUM('enrolled', 'completed', 'dropped') DEFAULT 'enrolled',
    grade DECIMAL(5,2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, course_id)
);

-- جدول الدرجات
CREATE TABLE IF NOT EXISTS grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    assignment_name VARCHAR(100) NOT NULL,
    grade DECIMAL(5,2) NOT NULL,
    max_grade DECIMAL(5,2) NOT NULL DEFAULT 100,
    grade_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE
);

-- جدول المستخدمين (للإدارة)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('admin', 'teacher', 'student') DEFAULT 'admin',
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول طلبات التسجيل (واجهة المستخدم) مع دعم صورة الإيصال
CREATE TABLE IF NOT EXISTS enrollment_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    course_price VARCHAR(100) NULL,
    payment_method VARCHAR(50) NULL,
    payment_details JSON NULL,
    receipt_file VARCHAR(500) NULL,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    request_number VARCHAR(100) UNIQUE,
    submission_date DATETIME NOT NULL,
    approval_date DATETIME NULL,
    welcome_message TEXT NULL,
    whatsapp_link VARCHAR(500) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_enrollment_requests_status (status),
    INDEX idx_enrollment_requests_submission (submission_date)
);

-- إدراج بيانات تجريبية للطلاب
INSERT INTO students (student_id, first_name, last_name, email, phone, date_of_birth, gender, address, enrollment_date) VALUES
('ST001', 'أحمد', 'محمد', 'ahmed.mohamed@email.com', '01234567890', '2000-05-15', 'male', 'القاهرة، مصر', '2024-01-15'),
('ST002', 'فاطمة', 'علي', 'fatima.ali@email.com', '01234567891', '2001-03-20', 'female', 'الإسكندرية، مصر', '2024-01-15'),
('ST003', 'محمد', 'حسن', 'mohamed.hassan@email.com', '01234567892', '1999-12-10', 'male', 'الجيزة، مصر', '2024-01-15'),
('ST004', 'مريم', 'أحمد', 'mariam.ahmed@email.com', '01234567893', '2000-08-25', 'female', 'القاهرة، مصر', '2024-01-15'),
('ST005', 'عمر', 'سعد', 'omar.saad@email.com', '01234567894', '2001-01-30', 'male', 'المنصورة، مصر', '2024-01-15');

-- إدراج بيانات تجريبية للمقررات
INSERT INTO courses (course_code, course_name, description, credits, instructor_name) VALUES
-- كورسات اللغة الإنجليزية
('ENG001', 'اللغة الإنجليزية - المستوى الأول (A1)', 'كورس مبتدئين في اللغة الإنجليزية من الصفر', 3, 'مدرس اللغة الإنجليزية'),
('ENG002', 'اللغة الإنجليزية - المستوى الثاني (A2)', 'كورس تأسيسي في اللغة الإنجليزية', 3, 'مدرس اللغة الإنجليزية'),
('SPK001', 'كورس المخاطبة التأسيسي (A1)', 'تعلم المخاطبة باللغة الإنجليزية من الصفر', 3, 'مدرس المخاطبة'),
('SPK002', 'كورس المخاطبة المتقدم (A2)', 'تطوير مهارات المخاطبة المتقدمة', 3, 'مدرس المخاطبة'),
('GRM001', 'كورس القواعد المكثف', 'تعلم قواعد اللغة الإنجليزية بشكل مكثف', 2, 'مدرس القواعد'),

-- كورسات الموارد البشرية - الدبلومات المهنية
('HR001', 'الدبلوم المهني في إدارة الأعمال', 'البرنامج المتكامل في إدارة الأعمال', 4, 'خبير إدارة الأعمال'),
('HR002', 'الدبلوم المهني في إدارة الموارد البشرية', 'تأهيل متخصصين في إدارة الموارد البشرية', 4, 'خبير الموارد البشرية'),
('HR003', 'الدبلوم المهني في التسويق والمبيعات', 'تطوير مهارات التسويق والمبيعات', 4, 'خبير التسويق'),
('HR004', 'الدبلوم المهني في المحاسبة المالية', 'تعلم أساسيات ومتقدمات المحاسبة', 4, 'خبير المحاسبة'),
('HR005', 'الدبلوم المهني في إدارة المشروعات', 'إدارة المشروعات بطريقة احترافية', 4, 'خبير إدارة المشروعات'),
('HR006', 'البرنامج المتكامل في الصحة والسلامة المهنية', 'تطبيق معايير الصحة والسلامة', 4, 'خبير الصحة والسلامة'),
('HR007', 'تدريب المدربين (TOT)', 'تأهيل المدربين المحترفين', 3, 'خبير التدريب'),

-- كورسات الموارد البشرية - الدورات القصيرة
('HRS001', 'المهارات الإدارية الحديثة', 'تطوير المهارات الإدارية المعاصرة', 2, 'مدرب المهارات الإدارية'),
('HRS002', 'ريادة الأعمال والمشاريع الناشئة', 'تعلم أساسيات ريادة الأعمال', 2, 'خبير ريادة الأعمال'),
('HRS003', 'التخطيط الاستراتيجي والتشغيلي', 'وضع الخطط الاستراتيجية الفعالة', 2, 'خبير التخطيط'),
('HRS004', 'المشرف الإداري المعتمد', 'تأهيل المشرفين الإداريين', 2, 'خبير الإشراف'),
('HRS005', 'المدير التنفيذي (CEO Program)', 'برنامج تأهيل المديرين التنفيذيين', 3, 'خبير الإدارة التنفيذية'),
('HRS006', 'التميز الوظيفي والإداري', 'تحقيق التميز في الأداء الوظيفي', 2, 'خبير التميز المؤسسي'),

-- كورسات تقنية
('CRS001', 'مقدمة في البرمجة', 'تعلم أساسيات البرمجة باستخدام Python', 3, 'أحمد محمد'),
('CRS002', 'تطوير المواقع', 'تعلم HTML, CSS, JavaScript', 3, 'فاطمة علي'),
('CRS003', 'قواعد البيانات', 'تعلم MySQL وإدارة قواعد البيانات', 3, 'محمد حسن'),
('CRS004', 'الذكاء الاصطناعي', 'مقدمة في الذكاء الاصطناعي والتعلم الآلي', 4, 'سارة أحمد'),
('CRS005', 'أمن المعلومات', 'تعلم حماية الأنظمة والشبكات', 3, 'عمر خالد');

-- إدراج بيانات تجريبية للمدرسين
INSERT INTO teachers (teacher_id, first_name, last_name, email, phone, specialization, qualification, experience_years) VALUES
('T001', 'أحمد', 'محمود', 'ahmed.mahmoud@academy.com', '01111111111', 'علوم الحاسوب', 'دكتوراه', 10),
('T002', 'سارة', 'إبراهيم', 'sara.ibrahim@academy.com', '01111111112', 'الرياضيات', 'دكتوراه', 8),
('T003', 'محمد', 'علي', 'mohamed.ali@academy.com', '01111111113', 'اللغة الإنجليزية', 'ماجستير', 5),
('T004', 'نور الدين', 'حسن', 'noureddine.hassan@academy.com', '01111111114', 'الفيزياء', 'دكتوراه', 12),
('T005', 'ليلى', 'حسن', 'laila.hassan@academy.com', '01111111115', 'الكيمياء', 'دكتوراه', 7);

-- إدراج مستخدم إداري افتراضي
INSERT INTO users (username, password, email, role) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@nooracademy.com', 'admin');

-- إنشاء جدول الفيديوهات التعليمية
CREATE TABLE IF NOT EXISTS course_videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    video_title VARCHAR(255) NOT NULL,
    video_description TEXT,
    video_url VARCHAR(500) NOT NULL,
    video_duration INT DEFAULT 0, -- بالثواني
    video_order INT DEFAULT 1,
    is_free BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course_videos_course_id (course_id),
    INDEX idx_course_videos_order (video_order)
);

-- إنشاء جدول أقسام الكورسات
CREATE TABLE IF NOT EXISTS course_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_name_ar VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20) DEFAULT '#007bff',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إدراج أقسام الكورسات
INSERT INTO course_categories (category_name, category_name_ar, description, icon, color, display_order) VALUES
('english', 'اللغة الإنجليزية', 'كورسات تعلم اللغة الإنجليزية بجميع المستويات', 'fas fa-language', '#28a745', 1),
('speaking', 'المخاطبة', 'كورسات تطوير مهارات المخاطبة والتحدث', 'fas fa-microphone', '#17a2b8', 2),
('grammar', 'القواعد', 'كورسات قواعد اللغة الإنجليزية', 'fas fa-book', '#6f42c1', 3),
('hr_diploma', 'دبلومات الموارد البشرية', 'الدبلومات المهنية في إدارة الموارد البشرية', 'fas fa-graduation-cap', '#fd7e14', 4),
('hr_short', 'دورات الموارد البشرية القصيرة', 'دورات قصيرة في المهارات الإدارية', 'fas fa-briefcase', '#20c997', 5),
('programming', 'البرمجة', 'كورسات البرمجة وتطوير البرمجيات', 'fas fa-code', '#007bff', 6),
('web_development', 'تطوير المواقع', 'كورسات تطوير المواقع والتطبيقات', 'fas fa-globe', '#dc3545', 7),
('database', 'قواعد البيانات', 'كورسات إدارة قواعد البيانات', 'fas fa-database', '#6c757d', 8),
('ai', 'الذكاء الاصطناعي', 'كورسات الذكاء الاصطناعي والتعلم الآلي', 'fas fa-robot', '#e83e8c', 9),
('security', 'أمن المعلومات', 'كورسات حماية الأنظمة والشبكات', 'fas fa-shield-alt', '#343a40', 10);

-- إدراج فيديوهات تجريبية للكورسات
INSERT INTO course_videos (course_id, video_title, video_description, video_url, video_duration, video_order, is_free) VALUES
-- فيديوهات كورس اللغة الإنجليزية A1
(1, 'مقدمة الكورس', 'مرحباً بكم في كورس اللغة الإنجليزية للمبتدئين', 'https://example.com/video1.mp4', 600, 1, TRUE),
(1, 'الحروف الإنجليزية', 'تعلم الحروف الإنجليزية ونطقها الصحيح', 'https://example.com/video2.mp4', 900, 2, TRUE),
(1, 'الأرقام من 1 إلى 20', 'تعلم الأرقام الإنجليزية الأساسية', 'https://example.com/video3.mp4', 720, 3, FALSE),

-- فيديوهات كورس المخاطبة التأسيسي
(3, 'أساسيات النطق', 'تعلم النطق الصحيح للكلمات الإنجليزية', 'https://example.com/video4.mp4', 1200, 1, TRUE),
(3, 'التحيات والتعارف', 'كيفية التحية والتعريف بالنفس', 'https://example.com/video5.mp4', 800, 2, FALSE),

-- فيديوهات دبلوم إدارة الأعمال
(6, 'مقدمة في إدارة الأعمال', 'أساسيات إدارة الأعمال الحديثة', 'https://example.com/video6.mp4', 1800, 1, TRUE),
(6, 'التخطيط الاستراتيجي', 'كيفية وضع الخطط الاستراتيجية', 'https://example.com/video7.mp4', 2400, 2, FALSE);

-- إنشاء جدول المدفوعات
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    payment_method ENUM('bank_transfer', 'cash', 'credit_card', 'mobile_payment') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EGP',
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transaction_id VARCHAR(100),
    receipt_image VARCHAR(500),
    payment_date TIMESTAMP NULL,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    INDEX idx_payments_enrollment (enrollment_id),
    INDEX idx_payments_status (payment_status),
    INDEX idx_payments_date (payment_date)
);

-- إنشاء جدول أقساط الدفع
CREATE TABLE IF NOT EXISTS payment_installments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    installment_number INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    payment_status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
    paid_date TIMESTAMP NULL,
    payment_id INT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
    INDEX idx_installments_enrollment (enrollment_id),
    INDEX idx_installments_due_date (due_date),
    INDEX idx_installments_status (payment_status)
);

-- إنشاء جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    student_id INT NULL,
    notification_type ENUM('enrollment', 'payment', 'course_update', 'system', 'welcome', 'reminder') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    action_url VARCHAR(500),
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_student (student_id),
    INDEX idx_notifications_type (notification_type),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_created (created_at)
);

-- إنشاء جدول الرسائل الترحيبية
CREATE TABLE IF NOT EXISTS welcome_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    message_type ENUM('email', 'sms', 'whatsapp') NOT NULL,
    message_content TEXT NOT NULL,
    whatsapp_group_link VARCHAR(500),
    sent_status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    delivery_status ENUM('pending', 'delivered', 'failed') DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    INDEX idx_welcome_enrollment (enrollment_id),
    INDEX idx_welcome_type (message_type),
    INDEX idx_welcome_status (sent_status)
);

-- إنشاء جدول الجلسات الدراسية
CREATE TABLE IF NOT EXISTS course_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    session_title VARCHAR(255) NOT NULL,
    session_description TEXT,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    session_type ENUM('lecture', 'practical', 'exam', 'workshop') DEFAULT 'lecture',
    location VARCHAR(255),
    max_capacity INT DEFAULT 30,
    is_online BOOLEAN DEFAULT FALSE,
    meeting_link VARCHAR(500),
    session_status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
    instructor_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES teachers(id) ON DELETE SET NULL,
    INDEX idx_sessions_course (course_id),
    INDEX idx_sessions_date (session_date),
    INDEX idx_sessions_status (session_status)
);

-- إنشاء جدول حضور الطلاب
CREATE TABLE IF NOT EXISTS student_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    attendance_status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'absent',
    check_in_time TIMESTAMP NULL,
    check_out_time TIMESTAMP NULL,
    notes TEXT,
    marked_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES course_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_session_student (session_id, student_id),
    INDEX idx_attendance_session (session_id),
    INDEX idx_attendance_student (student_id),
    INDEX idx_attendance_status (attendance_status)
);

-- إنشاء جدول سجلات النشاط الإداري
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action_type ENUM('login', 'logout', 'create', 'update', 'delete', 'approve', 'reject', 'view') NOT NULL,
    target_type ENUM('student', 'course', 'enrollment', 'payment', 'user', 'system') NOT NULL,
    target_id INT,
    description TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    additional_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_activity_user (user_id),
    INDEX idx_activity_type (action_type),
    INDEX idx_activity_target (target_type, target_id),
    INDEX idx_activity_created (created_at)
);

-- إنشاء جدول إعدادات النظام
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_settings_key (setting_key),
    INDEX idx_settings_public (is_public)
);

-- إنشاء جدول الشهادات
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    certificate_number VARCHAR(50) NOT NULL UNIQUE,
    certificate_type ENUM('completion', 'achievement', 'participation') DEFAULT 'completion',
    issue_date DATE NOT NULL,
    expiry_date DATE NULL,
    grade VARCHAR(10),
    certificate_file VARCHAR(500),
    verification_code VARCHAR(100) NOT NULL UNIQUE,
    is_verified BOOLEAN DEFAULT TRUE,
    issued_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_certificates_enrollment (enrollment_id),
    INDEX idx_certificates_number (certificate_number),
    INDEX idx_certificates_verification (verification_code)
);

-- إنشاء جدول التقييمات والمراجعات
CREATE TABLE IF NOT EXISTS course_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_title VARCHAR(255),
    review_text TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_course_student_review (course_id, student_id),
    INDEX idx_reviews_course (course_id),
    INDEX idx_reviews_student (student_id),
    INDEX idx_reviews_rating (rating),
    INDEX idx_reviews_approved (is_approved)
);

-- إنشاء جدول الخصومات والعروض
CREATE TABLE IF NOT EXISTS discounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discount_code VARCHAR(50) NOT NULL UNIQUE,
    discount_name VARCHAR(255) NOT NULL,
    discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_amount DECIMAL(10,2) DEFAULT 0,
    max_discount DECIMAL(10,2) NULL,
    usage_limit INT DEFAULT 1,
    used_count INT DEFAULT 0,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    applicable_courses JSON, -- قائمة بأكواد الكورسات المؤهلة
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_discounts_code (discount_code),
    INDEX idx_discounts_active (is_active),
    INDEX idx_discounts_dates (valid_from, valid_until)
);

-- إنشاء جدول استخدام الخصومات
CREATE TABLE IF NOT EXISTS discount_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discount_id INT NOT NULL,
    enrollment_id INT NOT NULL,
    original_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    final_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    INDEX idx_discount_usage_discount (discount_id),
    INDEX idx_discount_usage_enrollment (enrollment_id)
);

-- إدراج إعدادات النظام الافتراضية
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('academy_name', 'مركز نور برو الأكاديمي', 'string', 'اسم الأكاديمية', TRUE),
('academy_email', 'info@nooracademy.com', 'string', 'البريد الإلكتروني للأكاديمية', TRUE),
('academy_phone', '+20123456789', 'string', 'رقم هاتف الأكاديمية', TRUE),
('academy_address', 'القاهرة، مصر', 'string', 'عنوان الأكاديمية', TRUE),
('whatsapp_number', '+20123456789', 'string', 'رقم الواتساب للدعم', TRUE),
('default_currency', 'EGP', 'string', 'العملة الافتراضية', FALSE),
('payment_methods', '["bank_transfer", "cash", "mobile_payment"]', 'json', 'طرق الدفع المتاحة', FALSE),
('max_installments', '6', 'number', 'أقصى عدد أقساط مسموح', FALSE),
('late_payment_fee', '50', 'number', 'رسوم التأخير في الدفع', FALSE),
('certificate_validity_years', '5', 'number', 'مدة صلاحية الشهادة بالسنوات', FALSE),
('auto_approve_payments', 'false', 'boolean', 'الموافقة التلقائية على المدفوعات', FALSE),
('send_welcome_messages', 'true', 'boolean', 'إرسال رسائل الترحيب تلقائياً', FALSE),
('backup_frequency_days', '7', 'number', 'تكرار النسخ الاحتياطي بالأيام', FALSE);

-- إدراج بيانات تجريبية للمدفوعات
INSERT INTO payments (enrollment_id, payment_method, amount, payment_status, transaction_id, payment_date, due_date, notes) VALUES
(1, 'bank_transfer', 1500.00, 'completed', 'TXN001', '2024-01-16 10:30:00', '2024-01-15', 'دفع كامل للكورس'),
(2, 'cash', 800.00, 'completed', NULL, '2024-01-17 14:20:00', '2024-01-15', 'دفع نقدي'),
(3, 'mobile_payment', 1200.00, 'pending', 'TXN002', NULL, '2024-01-20', 'في انتظار التأكيد'),
(4, 'bank_transfer', 2000.00, 'completed', 'TXN003', '2024-01-18 09:15:00', '2024-01-15', 'دفع دبلوم إدارة الأعمال'),
(5, 'cash', 1800.00, 'completed', NULL, '2024-01-19 16:45:00', '2024-01-15', 'دفع نقدي للدبلوم');

-- إدراج بيانات تجريبية للأقساط
INSERT INTO payment_installments (enrollment_id, installment_number, amount, due_date, payment_status, paid_date, notes) VALUES
(3, 1, 600.00, '2024-01-20', 'pending', NULL, 'القسط الأول'),
(3, 2, 600.00, '2024-02-20', 'pending', NULL, 'القسط الثاني'),
(4, 1, 1000.00, '2024-01-18', 'paid', '2024-01-18 09:15:00', 'القسط الأول - مدفوع'),
(4, 2, 1000.00, '2024-02-18', 'pending', NULL, 'القسط الثاني'),
(5, 1, 900.00, '2024-01-19', 'paid', '2024-01-19 16:45:00', 'القسط الأول - مدفوع'),
(5, 2, 900.00, '2024-02-19', 'pending', NULL, 'القسط الثاني');

-- إدراج بيانات تجريبية للإشعارات
INSERT INTO notifications (student_id, notification_type, title, message, priority, created_at) VALUES
(1, 'welcome', 'مرحباً بك في الأكاديمية', 'نرحب بك في مركز نور برو الأكاديمي. تم قبول تسجيلك بنجاح.', 'high', '2024-01-16 10:35:00'),
(1, 'course_update', 'تحديث الكورس', 'تم إضافة فيديوهات جديدة لكورس اللغة الإنجليزية A1', 'medium', '2024-01-20 14:00:00'),
(2, 'welcome', 'مرحباً بك في الأكاديمية', 'نرحب بك في مركز نور برو الأكاديمي. تم قبول تسجيلك بنجاح.', 'high', '2024-01-17 14:25:00'),
(3, 'payment', 'تذكير بالدفع', 'يرجى دفع القسط المستحق للكورس في أقرب وقت ممكن.', 'urgent', '2024-01-21 09:00:00'),
(4, 'welcome', 'مرحباً بك في الأكاديمية', 'نرحب بك في مركز نور برو الأكاديمي. تم قبول تسجيلك بنجاح.', 'high', '2024-01-18 09:20:00');

-- إدراج بيانات تجريبية للجلسات
INSERT INTO course_sessions (course_id, session_title, session_date, start_time, end_time, session_type, location, max_capacity, instructor_id) VALUES
(1, 'الجلسة الأولى - مقدمة', '2024-02-01', '10:00:00', '12:00:00', 'lecture', 'قاعة A1', 25, 3),
(1, 'الجلسة الثانية - الحروف والأرقام', '2024-02-03', '10:00:00', '12:00:00', 'practical', 'قاعة A1', 25, 3),
(1, 'الجلسة الثالثة - المفردات الأساسية', '2024-02-05', '10:00:00', '12:00:00', 'lecture', 'قاعة A1', 25, 3),
(2, 'الجلسة الأولى - مراجعة A1', '2024-02-02', '14:00:00', '16:00:00', 'lecture', 'قاعة A2', 25, 3),
(6, 'مقدمة في إدارة الأعمال', '2024-02-01', '18:00:00', '20:00:00', 'lecture', 'قاعة الدبلومات', 30, 1);

-- إدراج خصم تجريبي
INSERT INTO discounts (discount_code, discount_name, discount_type, discount_value, min_amount, usage_limit, valid_from, valid_until, applicable_courses, created_by) VALUES
('WELCOME2024', 'خصم الترحيب 2024', 'percentage', 10.00, 500.00, 100, '2024-01-01', '2024-12-31', '["ENG001", "ENG002", "HR001"]', 1),
('EARLY_BIRD', 'خصم التسجيل المبكر', 'fixed_amount', 200.00, 1000.00, 50, '2024-01-01', '2024-03-31', '["HR001", "HR002", "HR003"]', 1);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_phone ON students(phone_number);
CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_grades_enrollment ON grades(enrollment_id);
CREATE INDEX idx_course_videos_course_id ON course_videos(course_id);
CREATE INDEX idx_course_videos_order ON course_videos(video_order);
CREATE INDEX idx_course_categories_name ON course_categories(category_name);
CREATE INDEX idx_payments_enrollment ON payments(enrollment_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_installments_enrollment ON payment_installments(enrollment_id);
CREATE INDEX idx_notifications_student ON notifications(student_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_sessions_course ON course_sessions(course_id);
CREATE INDEX idx_attendance_session ON student_attendance(session_id);
CREATE INDEX idx_attendance_student ON student_attendance(student_id);
CREATE INDEX idx_activity_user ON admin_activity_logs(user_id);
CREATE INDEX idx_certificates_enrollment ON certificates(enrollment_id);
CREATE INDEX idx_reviews_course ON course_reviews(course_id);
CREATE INDEX idx_discounts_code ON discounts(discount_code);