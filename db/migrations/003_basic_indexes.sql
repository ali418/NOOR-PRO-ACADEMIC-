-- 003_basic_indexes.sql
-- Basic indexes for performance improvement.

CREATE INDEX IF NOT EXISTS idx_students_email ON students (email);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses (course_code);

-- The index on the courses category column is now created in 002_courses_category_fk.sql

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments (course_id);
CREATE INDEX IF NOT EXISTS idx_course_categories_name ON course_categories (category_name);