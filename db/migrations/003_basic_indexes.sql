-- 003_basic_indexes.sql
-- فهارس أساسية لتحسين الأداء على الجداول المستخدمة

-- Function to create an index if it does not exist
DELIMITER $$
CREATE PROCEDURE CreateIndexIfNotExists(
    IN tableName VARCHAR(128),
    IN indexName VARCHAR(128),
    IN columnList VARCHAR(255)
)
BEGIN
    SET @s = CONCAT('SELECT COUNT(1) INTO @indexExists FROM INFORMATION_SCHEMA.STATISTICS WHERE table_schema = DATABASE() AND table_name = \'', tableName, '\' AND index_name = \'', indexName, '\';');
    PREPARE stmt FROM @s;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    IF @indexExists = 0 THEN
        SET @s = CONCAT('CREATE INDEX ', indexName, ' ON ', tableName, ' (', columnList, ');');
        PREPARE stmt FROM @s;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

-- Create indexes using the stored procedure
CALL CreateIndexIfNotExists('students', 'idx_students_email', 'email');
CALL CreateIndexIfNotExists('courses', 'idx_courses_code', 'course_code');
CALL CreateIndexIfNotExists('courses', 'idx_courses_category', 'category');
CALL CreateIndexIfNotExists('enrollments', 'idx_enrollments_student', 'student_id');
CALL CreateIndexIfNotExists('enrollments', 'idx_enrollments_course', 'course_id');
CALL CreateIndexIfNotExists('course_categories', 'idx_course_categories_name', 'category_name');

-- Drop the procedure after use
DROP PROCEDURE CreateIndexIfNotExists;