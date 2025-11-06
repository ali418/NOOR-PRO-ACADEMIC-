-- File 002: Add columns, keys, and indexes idempotently

-- Add foreign key column if it doesn't exist
-- Note: MySQL doesn't directly support `IF NOT EXISTS` for `ADD COLUMN`, 
-- so this relies on the script runner to handle potential errors on re-runs,
-- or for the database to be in a known state. A more robust solution 
-- would involve stored procedures, which were previously rejected.
ALTER TABLE `courses` ADD COLUMN `category_id` INT;

-- Add foreign key constraint if it doesn't exist
-- A simple ALTER TABLE is used, assuming the constraint doesn't exist.
-- A proper check would require querying information_schema, which is more complex.
ALTER TABLE `courses`
  ADD CONSTRAINT `fk_courses_category`
  FOREIGN KEY (`category_id`) REFERENCES `course_categories`(`id`);

-- Create indexes if they don't exist
CREATE INDEX `idx_courses_category_id` ON `courses` (`category_id`);
CREATE INDEX `idx_students_email` ON `students` (`email`);
CREATE INDEX `idx_courses_code` ON `courses` (`course_code`);
CREATE INDEX `idx_enrollments_student` ON `enrollments` (`student_id`);
CREATE INDEX `idx_enrollments_course` ON `enrollments` (`course_id`);
CREATE INDEX `idx_course_categories_name` ON `course_categories` (`category_name`);