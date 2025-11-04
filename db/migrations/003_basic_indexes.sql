-- 003_basic_indexes.sql
-- فهارس أساسية لتحسين الأداء على الجداول المستخدمة

CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_course_categories_name ON course_categories(category_name);