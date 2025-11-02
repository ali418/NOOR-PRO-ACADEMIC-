-- إضافة عمود category_id إلى جدول courses
ALTER TABLE courses ADD COLUMN category_id INT DEFAULT NULL;

-- إضافة مفتاح خارجي للربط مع جدول course_categories
ALTER TABLE courses ADD CONSTRAINT fk_courses_category 
FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE SET NULL;

-- تحديث المقررات الموجودة لربطها بالتصنيفات المناسبة
-- كورسات اللغة الإنجليزية
UPDATE courses SET category_id = (SELECT id FROM course_categories WHERE category_name = 'english') 
WHERE course_code IN ('ENG001', 'ENG002');

-- كورسات المخاطبة
UPDATE courses SET category_id = (SELECT id FROM course_categories WHERE category_name = 'speaking') 
WHERE course_code IN ('SPK001', 'SPK002');

-- كورسات القواعد
UPDATE courses SET category_id = (SELECT id FROM course_categories WHERE category_name = 'grammar') 
WHERE course_code IN ('GRM001');

-- دبلومات الموارد البشرية
UPDATE courses SET category_id = (SELECT id FROM course_categories WHERE category_name = 'hr_diploma') 
WHERE course_code IN ('HR001', 'HR002', 'HR003', 'HR004', 'HR005', 'HR006', 'HR007');

-- دورات الموارد البشرية القصيرة
UPDATE courses SET category_id = (SELECT id FROM course_categories WHERE category_name = 'hr_short') 
WHERE course_code IN ('HRS001', 'HRS002', 'HRS003', 'HRS004', 'HRS005', 'HRS006');

-- كورسات البرمجة
UPDATE courses SET category_id = (SELECT id FROM course_categories WHERE category_name = 'programming') 
WHERE course_code IN ('CRS001', 'CS101');

-- كورسات تطوير المواقع
UPDATE courses SET category_id = (SELECT id FROM course_categories WHERE category_name = 'web_development') 
WHERE course_code IN ('CRS002', 'WEB201');

-- كورسات قواعد البيانات
UPDATE courses SET category_id = (SELECT id FROM course_categories WHERE category_name = 'database') 
WHERE course_code IN ('CRS003');

-- كورسات الذكاء الاصطناعي
UPDATE courses SET category_id = (SELECT id FROM course_categories WHERE category_name = 'ai') 
WHERE course_code IN ('CRS004');

-- كورسات أمن المعلومات
UPDATE courses SET category_id = (SELECT id FROM course_categories WHERE category_name = 'security') 
WHERE course_code IN ('CRS005');

-- إضافة فهرس للأداء
CREATE INDEX idx_courses_category_id ON courses(category_id);