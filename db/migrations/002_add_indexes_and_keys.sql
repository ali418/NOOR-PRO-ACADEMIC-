-- 002_add_indexes_and_keys.sql

-- Helper procedure to add a column if it doesn't exist
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DELIMITER $$
CREATE PROCEDURE AddColumnIfNotExists(
    IN dbName tinytext,
    IN tableName tinytext,
    IN fieldName tinytext,
    IN fieldDef text
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS
        WHERE column_name=fieldName
        AND table_name=tableName
        AND table_schema=dbName
    )
    THEN
        SET @ddl=CONCAT('ALTER TABLE ',dbName,'.',tableName,
            ' ADD COLUMN ',fieldName,' ',fieldDef);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
    END IF;
END;
$$
DELIMITER ;

-- Helper procedure to add a foreign key if it doesn't exist
DROP PROCEDURE IF EXISTS AddForeignKeyIfNotExists;
DELIMITER $$
CREATE PROCEDURE AddForeignKeyIfNotExists(
    IN dbName tinytext,
    IN tableName tinytext,
    IN constraintName tinytext,
    IN keyName tinytext,
    IN referencesTable tinytext,
    IN referencesKey tinytext
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM information_schema.TABLE_CONSTRAINTS
        WHERE constraint_name=constraintName
        AND table_name=tableName
        AND table_schema=dbName
    )
    THEN
        SET @ddl=CONCAT('ALTER TABLE ',dbName,'.',tableName,
            ' ADD CONSTRAINT ',constraintName,' FOREIGN KEY (',keyName,') REFERENCES ',referencesTable,'(',referencesKey,')');
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
    END IF;
END;
$$
DELIMITER ;

-- Helper procedure to add an index if it doesn't exist
DROP PROCEDURE IF EXISTS AddIndexIfNotExists;
DELIMITER $$
CREATE PROCEDURE AddIndexIfNotExists(
    IN dbName tinytext,
    IN tableName tinytext,
    IN indexName tinytext,
    IN fieldName tinytext
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM information_schema.STATISTICS
        WHERE index_name=indexName
        AND table_name=tableName
        AND table_schema=dbName
    )
    THEN
        SET @ddl=CONCAT('CREATE INDEX ',indexName,' ON ',dbName,'.',tableName,' (',fieldName,')');
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
    END IF;
END;
$$
DELIMITER ;

-- Use the helper procedures to make changes
CALL AddColumnIfNotExists(DATABASE(), 'courses', 'category_id', 'INT');
CALL AddForeignKeyIfNotExists(DATABASE(), 'courses', 'fk_courses_category', 'category_id', 'course_categories', 'id');
CALL AddIndexIfNotExists(DATABASE(), 'courses', 'idx_courses_category_id', 'category_id');
CALL AddIndexIfNotExists(DATABASE(), 'students', 'idx_students_email', 'email');
CALL AddIndexIfNotExists(DATABASE(), 'courses', 'idx_courses_code', 'course_code');
CALL AddIndexIfNotExists(DATABASE(), 'enrollments', 'idx_enrollments_student', 'student_id');
CALL AddIndexIfNotExists(DATABASE(), 'enrollments', 'idx_enrollments_course', 'course_id');
CALL AddIndexIfNotExists(DATABASE(), 'course_categories', 'idx_course_categories_name', 'category_name');

-- Drop the helper procedures
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DROP PROCEDURE IF EXISTS AddForeignKeyIfNotExists;
DROP PROCEDURE IF EXISTS AddIndexIfNotExists;