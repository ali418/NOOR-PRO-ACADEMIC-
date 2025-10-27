-- إضافة الأعمدة الجديدة لجدول المقررات
USE noor_pro_academic;

ALTER TABLE courses 
ADD COLUMN category VARCHAR(50) DEFAULT 'general',
ADD COLUMN price VARCHAR(20) DEFAULT '0',
ADD COLUMN level_name VARCHAR(50) DEFAULT 'مبتدئ',
ADD COLUMN start_date DATE NULL,
ADD COLUMN course_icon VARCHAR(100) DEFAULT 'fas fa-book',
ADD COLUMN badge_text VARCHAR(50) NULL;

-- تحديث البيانات الموجودة بقيم افتراضية
UPDATE courses SET 
    category = CASE 
        WHEN course_code LIKE 'ENG%' THEN 'english'
        WHEN course_code LIKE 'SPK%' THEN 'english'
        WHEN course_code LIKE 'GRM%' THEN 'english'
        WHEN course_code LIKE 'HR%' THEN 'hr'
        WHEN course_code LIKE 'HRS%' THEN 'hr'
        WHEN course_code LIKE 'CRS%' THEN 'technical'
        ELSE 'general'
    END,
    price = CASE 
        WHEN course_code = 'ENG001' THEN '75$'
        WHEN course_code = 'ENG002' THEN '75$'
        WHEN course_code = 'SPK001' THEN '85$'
        WHEN course_code = 'GRM001' THEN '50$'
        ELSE 'قريباً'
    END,
    level_name = CASE 
        WHEN course_code LIKE '%001' OR course_name LIKE '%A1%' THEN 'مبتدئ (A1)'
        WHEN course_code LIKE '%002' OR course_name LIKE '%A2%' THEN 'تأسيسي (A2)'
        WHEN course_name LIKE '%مهني%' THEN 'مهني'
        WHEN course_name LIKE '%متقدم%' THEN 'متقدم'
        ELSE 'مبتدئ'
    END,
    start_date = '2025-09-20',
    course_icon = CASE 
        WHEN course_code LIKE 'ENG%' THEN 'fas fa-language'
        WHEN course_code LIKE 'SPK%' THEN 'fas fa-microphone'
        WHEN course_code LIKE 'GRM%' THEN 'fas fa-book-open'
        WHEN course_code LIKE 'HR%' THEN 'fas fa-users-cog'
        WHEN course_code LIKE 'HRS%' THEN 'fas fa-briefcase'
        WHEN course_code LIKE 'CRS%' THEN 'fas fa-code'
        ELSE 'fas fa-book'
    END,
    badge_text = CASE 
        WHEN course_code IN ('ENG001', 'ENG002', 'SPK001') THEN 'جديد'
        WHEN course_code = 'SPK001' THEN 'مميز'
        WHEN course_code = 'GRM001' THEN 'مكثف'
        WHEN course_name LIKE '%دبلوم%' THEN 'دبلوم'
        WHEN course_code = 'HR007' THEN 'TOT'
        ELSE NULL
    END;