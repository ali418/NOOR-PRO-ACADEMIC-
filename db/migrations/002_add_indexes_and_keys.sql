-- 002_add_indexes_and_keys.sql
-- This script adds necessary foreign keys and indexes in an idempotent way.

DELIMITER $$

-- Procedure to add a column if it doesn't exist
CREATE PROCEDURE AddColumnIfNotExists(
    IN dbName VARCHAR(255),
    IN tableName VARCHAR(255),
    IN colName VARCHAR(255),
    IN colDef VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE table_schema = dbName AND table_name = tableName AND column_name = colName
    )
    THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', colName, ' ', colDef);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

-- Procedure to add a foreign key if it doesn't exist
CREATE PROCEDURE AddForeignKeyIfNotExists(
    IN dbName VARCHAR(255),
    IN tableName VARCHAR(255),
    IN constraintName VARCHAR(255),
    IN colName VARCHAR(255),
    IN refTableName VARCHAR(255),
    IN refColName VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
        WHERE constraint_schema = dbName AND table_name = tableName AND constraint_name = constraintName AND constraint_type = 'FOREIGN KEY'
    )
    THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD CONSTRAINT ', constraintName, ' FOREIGN KEY (', colName, ') REFERENCES ', refTableName, '(', refColName, ') ON DELETE SET NULL');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

-- Procedure to create an index if it doesn't exist
CREATE PROCEDURE CreateIndexIfNotExists(
    IN dbName VARCHAR(255),
    IN tableName VARCHAR(255),
    IN indexName VARCHAR(255),
    IN colList VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.STATISTICS
        WHERE table_schema = dbName AND table_name = tableName AND index_name = indexName
    )
    THEN
        SET @sql = CONCAT('CREATE INDEX ', indexName, ' ON ', tableName, '(', colList, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Use the procedures to make changes
CALL AddColumnIfNotExists(DATABASE(), 'courses', 'category_id', 'INT DEFAULT NULL');
CALL AddForeignKeyIfNotExists(DATABASE(), 'courses', 'fk_courses_category', 'category_id', 'course_categories', 'id');
CALL CreateIndexIfNotExists(DATABASE(), 'courses', 'idx_courses_category_id', 'category_id');
CALL CreateIndexIfNotExists(DATABASE(), 'students', 'idx_students_email', 'email');
CALL CreateIndexIfNotExists(DATABASE(), 'courses', 'idx_courses_code', 'course_code');
CALL CreateIndexIfNotExists(DATABASE(), 'enrollments', 'idx_enrollments_student', 'student_id');
CALL CreateIndexIfNotExists(DATABASE(), 'enrollments', 'idx_enrollments_course', 'course_id');
CALL CreateIndexIfNotExists(DATABASE(), 'course_categories', 'idx_course_categories_name', 'category_name');

-- Drop the procedures
DROP PROCEDURE AddColumnIfNotExists;
DROP PROCEDURE AddForeignKeyIfNotExists;
DROP PROCEDURE CreateIndexIfNotExists;