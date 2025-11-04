-- 001_core_tables.sql
-- إنشاء الجداول الأساسية المستخدمة في النظام

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

-- جدول أقسام الكورسات
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