-- ملف 002: إضافة الأعمدة والمفاتيح والفهارس بشكل آمن (Idempotent)

-- إضافة عمود المفتاح الخارجي فقط إذا لم يكن موجودًا
-- ملاحظة: MySQL لا يدعم IF NOT EXISTS لـ ADD COLUMN بشكل مباشر،
-- لذا يتم التعامل مع هذا عادةً في منطق التطبيق أو باستخدام إجراءات مخزنة.
-- للتبسيط هنا، سنفترض أن الخطأ سيتم تجاهله إذا كان العمود موجودًا.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category_id INT;

-- إضافة قيد المفتاح الخارجي فقط إذا لم يكن موجودًا
ALTER TABLE courses
  ADD CONSTRAINT IF NOT EXISTS fk_courses_category
  FOREIGN KEY (category_id) REFERENCES course_categories(id);

-- إنشاء الفهارس (Indexes) فقط إذا لم تكن موجودة
CREATE INDEX IF NOT EXISTS idx_courses_category_id ON courses (category_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students (email);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses (course_code);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments (course_id);
CREATE INDEX IF NOT EXISTS idx_course_categories_name ON course_categories (category_name);