# مخطط قاعدة البيانات - مركز نور برو الأكاديمي

## نظرة عامة على قاعدة البيانات

تحتوي قاعدة البيانات على **17 جدولاً رئيسياً** مترابطاً لإدارة نظام الأكاديمية بشكل شامل.

## الجداول الرئيسية والعلاقات

### 1. جداول المستخدمين والطلاب
- **`students`** - بيانات الطلاب الأساسية
- **`users`** - حسابات المستخدمين (إداريين)
- **`teachers`** - بيانات المدرسين

### 2. جداول الكورسات والمحتوى
- **`courses`** - الكورسات المتاحة
- **`course_categories`** - تصنيفات الكورسات
- **`course_videos`** - الفيديوهات التعليمية
- **`course_sessions`** - الجلسات الدراسية

### 3. جداول التسجيل والدرجات
- **`enrollments`** - تسجيلات الطلاب
- **`grades`** - درجات الطلاب
- **`student_attendance`** - حضور الطلاب

### 4. جداول المدفوعات
- **`payments`** - المدفوعات الرئيسية
- **`payment_installments`** - أقساط الدفع
- **`discounts`** - الخصومات والعروض
- **`discount_usage`** - استخدام الخصومات

### 5. جداول الإشعارات والرسائل
- **`notifications`** - الإشعارات العامة
- **`welcome_messages`** - رسائل الترحيب

### 6. جداول الإدارة والنظام
- **`admin_activity_logs`** - سجلات النشاط الإداري
- **`system_settings`** - إعدادات النظام
- **`certificates`** - الشهادات
- **`course_reviews`** - تقييمات الكورسات

## العلاقات بين الجداول

### العلاقات الأساسية:

```
students (1) ←→ (M) enrollments ←→ (M) courses (1)
enrollments (1) ←→ (M) payments
enrollments (1) ←→ (M) payment_installments
enrollments (1) ←→ (1) certificates
enrollments (1) ←→ (M) welcome_messages

courses (1) ←→ (M) course_videos
courses (1) ←→ (M) course_sessions
courses (1) ←→ (M) course_reviews
course_categories (1) ←→ (M) courses

course_sessions (1) ←→ (M) student_attendance
students (1) ←→ (M) student_attendance

teachers (1) ←→ (M) course_sessions
users (1) ←→ (M) admin_activity_logs

discounts (1) ←→ (M) discount_usage
enrollments (1) ←→ (M) discount_usage
```

## تفاصيل الجداول

### 1. جدول الطلاب (students)
```sql
- id (PK)
- student_id (UNIQUE)
- first_name, last_name
- email (UNIQUE), phone_number
- date_of_birth, gender
- address, registration_date
```

### 2. جدول الكورسات (courses)
```sql
- id (PK)
- course_code (UNIQUE)
- course_name, description
- credits, instructor_name
- category, price, duration
- is_active, created_at
```

### 3. جدول التسجيلات (enrollments)
```sql
- id (PK)
- student_id (FK → students)
- course_id (FK → courses)
- enrollment_date, status
- payment_status, total_amount
- notes, created_at
```

### 4. جدول المدفوعات (payments)
```sql
- id (PK)
- enrollment_id (FK → enrollments)
- payment_method, amount, currency
- payment_status, transaction_id
- receipt_image, payment_date
- due_date, notes
```

### 5. جدول أقساط الدفع (payment_installments)
```sql
- id (PK)
- enrollment_id (FK → enrollments)
- installment_number, amount
- due_date, payment_status
- paid_date, payment_id (FK → payments)
```

### 6. جدول الإشعارات (notifications)
```sql
- id (PK)
- user_id (FK → users), student_id (FK → students)
- notification_type, title, message
- is_read, priority, action_url
- expires_at, created_at
```

### 7. جدول الجلسات الدراسية (course_sessions)
```sql
- id (PK)
- course_id (FK → courses)
- session_title, session_description
- session_date, start_time, end_time
- session_type, location, max_capacity
- is_online, meeting_link
- instructor_id (FK → teachers)
```

### 8. جدول حضور الطلاب (student_attendance)
```sql
- id (PK)
- session_id (FK → course_sessions)
- student_id (FK → students)
- attendance_status, check_in_time
- check_out_time, notes
- marked_by (FK → users)
```

### 9. جدول الشهادات (certificates)
```sql
- id (PK)
- enrollment_id (FK → enrollments)
- certificate_number (UNIQUE)
- certificate_type, issue_date
- expiry_date, grade
- verification_code (UNIQUE)
- issued_by (FK → users)
```

### 10. جدول الخصومات (discounts)
```sql
- id (PK)
- discount_code (UNIQUE)
- discount_name, discount_type
- discount_value, min_amount
- usage_limit, used_count
- valid_from, valid_until
- applicable_courses (JSON)
- created_by (FK → users)
```

## الفهارس المُحسَّنة للأداء

تم إنشاء فهارس على الحقول التالية لتحسين الأداء:

### فهارس البحث الأساسية:
- `students.email`, `students.phone_number`
- `courses.course_code`, `courses.category`
- `enrollments.student_id`, `enrollments.course_id`
- `payments.enrollment_id`, `payments.payment_status`

### فهارس التواريخ والحالات:
- `notifications.created_at`, `notifications.is_read`
- `course_sessions.session_date`, `course_sessions.session_status`
- `student_attendance.attendance_status`
- `discounts.valid_from`, `discounts.valid_until`

## إعدادات النظام الافتراضية

تم إدراج إعدادات النظام التالية في جدول `system_settings`:

- **معلومات الأكاديمية**: الاسم، البريد الإلكتروني، الهاتف، العنوان
- **إعدادات الدفع**: العملة الافتراضية، طرق الدفع، أقصى عدد أقساط
- **إعدادات الشهادات**: مدة الصلاحية
- **إعدادات التشغيل**: الموافقة التلقائية، إرسال الرسائل، تكرار النسخ الاحتياطي

## البيانات التجريبية المُدرجة

تم إدراج بيانات تجريبية شاملة تشمل:

- **5 طلاب** مع بيانات كاملة
- **25+ كورس** في مختلف التخصصات
- **5 مدرسين** متخصصين
- **5 تسجيلات** مع حالات مختلفة
- **مدفوعات وأقساط** متنوعة
- **إشعارات وجلسات** تجريبية
- **خصومات وعروض** نموذجية

## ملاحظات مهمة

1. **الأمان**: جميع كلمات المرور مُشفرة باستخدام bcrypt
2. **المرونة**: دعم العملات المتعددة والدفع بالأقساط
3. **التتبع**: سجلات شاملة لجميع الأنشطة الإدارية
4. **القابلية للتوسع**: تصميم يدعم إضافة ميزات جديدة
5. **الأداء**: فهارس محسنة لجميع الاستعلامات الشائعة

## إحصائيات قاعدة البيانات

- **عدد الجداول**: 17 جدول
- **عدد العلاقات**: 25+ علاقة خارجية
- **عدد الفهارس**: 35+ فهرس
- **عدد البيانات التجريبية**: 100+ سجل