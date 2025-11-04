-- 002_courses_category_fk.sql
-- إضافة عمود الربط بالقسم إلى جدول الكورسات وربط المفتاح الخارجي

-- إضافة العمود بدون IF NOT EXISTS لضمان التوافق مع إصدارات MySQL/MariaDB الأقدم
-- في حال كان العمود موجوداً بالفعل سيظهر خطأ تكرار العمود وسيتم تجاوزه بواسطة مشغل الهجرات
ALTER TABLE courses ADD COLUMN category_id INT DEFAULT NULL;

ALTER TABLE courses 
  ADD CONSTRAINT fk_courses_category 
  FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE SET NULL;

-- إضافة فهرس للأداء على العمود الجديد (سيُتجاهل إذا كان موجوداً مسبقاً)
CREATE INDEX idx_courses_category_id ON courses(category_id);