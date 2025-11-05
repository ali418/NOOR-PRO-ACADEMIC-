-- 002_courses_category_fk.sql
-- Add category foreign key to courses table.

-- Note: This simplified script assumes it is run on a fresh database.

ALTER TABLE courses ADD COLUMN category_id INT DEFAULT NULL;

ALTER TABLE courses 
  ADD CONSTRAINT fk_courses_category 
  FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_courses_category_id ON courses(category_id);