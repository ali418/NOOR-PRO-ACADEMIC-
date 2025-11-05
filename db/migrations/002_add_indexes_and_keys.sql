-- ملف 002: إضافة الأعمدة والمفاتيح والفهارس بشكل مباشر

-- إضافة عمود المفتاح الخارجي
-- سيُنفذ هذا مرة واحدة فقط عند إنشاء قاعدة بيانات جديدة
ALTER TABLE courses ADD COLUMN category_id INT;

-- إضافة قيد المفتاح الخارجي
ALTER TABLE courses
  ADD CONSTRAINT fk_courses_category
  FOREIGN KEY (category_id) REFERENCES course_categories(id);

-- إنشاء الفهارس (Indexes)
CREATE INDEX idx_courses_category_id ON courses (category_id);
CREATE INDEX idx_students_email ON students (email);
CREATE INDEX idx_courses_code ON courses (course_code);
CREATE INDEX idx_enrollments_student ON enrollments (student_id);
CREATE INDEX idx_enrollments_course ON enrollments (course_id);
CREATE INDEX idx_course_categories_name ON course_categories (category_name);