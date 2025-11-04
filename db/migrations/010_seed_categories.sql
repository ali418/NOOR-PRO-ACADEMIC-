-- 010_seed_categories.sql
-- تحميل أقسام الكورسات بشكل آمن لتجربة النظام

INSERT IGNORE INTO course_categories (category_name, category_name_ar, description, icon, color, display_order) VALUES
('english', 'اللغة الإنجليزية', 'كورسات تعلم اللغة الإنجليزية بجميع المستويات', 'fas fa-language', '#28a745', 1),
('speaking', 'المخاطبة', 'كورسات تطوير مهارات المخاطبة والتحدث', 'fas fa-microphone', '#17a2b8', 2),
('grammar', 'القواعد', 'كورسات قواعد اللغة الإنجليزية', 'fas fa-book', '#6f42c1', 3),
('hr_diploma', 'دبلومات الموارد البشرية', 'الدبلومات المهنية في إدارة الموارد البشرية', 'fas fa-graduation-cap', '#fd7e14', 4),
('hr_short', 'دورات الموارد البشرية القصيرة', 'دورات قصيرة في المهارات الإدارية', 'fas fa-briefcase', '#20c997', 5),
('programming', 'البرمجة', 'كورسات البرمجة وتطوير البرمجيات', 'fas fa-code', '#007bff', 6),
('web_development', 'تطوير المواقع', 'كورسات تطوير المواقع والتطبيقات', 'fas fa-globe', '#dc3545', 7),
('database', 'قواعد البيانات', 'كورسات إدارة قواعد البيانات', 'fas fa-database', '#6c757d', 8),
('ai', 'الذكاء الاصطناعي', 'كورسات الذكاء الاصطناعي والتعلم الآلي', 'fas fa-robot', '#e83e8c', 9),
('security', 'أمن المعلومات', 'كورسات حماية الأنظمة والشبكات', 'fas fa-shield-alt', '#343a40', 10);