-- 002_courses_category_fk.sql
-- إضافة عمود الربط بالقسم إلى جدول الكورسات وربط المفتاح الخارجي

DELIMITER $$
CREATE PROCEDURE AddColumnAndForeignKeyIfNotExists()
BEGIN
    -- Add the column if it does not exist
    IF NOT EXISTS(
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE table_schema = DATABASE() AND table_name = 'courses' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE courses ADD COLUMN category_id INT DEFAULT NULL;
    END IF;

    -- Add the foreign key if it does not exist
    IF NOT EXISTS(
        SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
        WHERE constraint_schema = DATABASE() AND table_name = 'courses' AND constraint_name = 'fk_courses_category'
    ) THEN
        ALTER TABLE courses 
          ADD CONSTRAINT fk_courses_category 
          FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE SET NULL;
    END IF;

    -- Add the index if it does not exist
    IF NOT EXISTS(
        SELECT * FROM INFORMATION_SCHEMA.STATISTICS
        WHERE table_schema = DATABASE() AND table_name = 'courses' AND index_name = 'idx_courses_category_id'
    ) THEN
        CREATE INDEX idx_courses_category_id ON courses(category_id);
    END IF;
END$$
DELIMITER ;

-- Execute the procedure
CALL AddColumnAndForeignKeyIfNotExists();

-- Drop the procedure after use
DROP PROCEDURE AddColumnAndForeignKeyIfNotExists;