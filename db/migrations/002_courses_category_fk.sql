-- 002_courses_category_fk.sql
-- إضافة عمود الربط بالقسم إلى جدول الكورسات وربط المفتاح الخارجي

ALTER TABLE courses ADD COLUMN IF NOT EXISTS category_id INT DEFAULT NULL;

ALTER TABLE courses 
  ADD CONSTRAINT fk_courses_category 
  FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE SET NULL;