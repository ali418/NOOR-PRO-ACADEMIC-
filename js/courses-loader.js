// Course Loader for Homepage
class CourseLoader {
    constructor() {
        this.coursesGrid = document.getElementById('coursesGrid');
        this.loadingIndicator = document.getElementById('loadingCourses');
        this.init();
    }

    init() {
        this.loadCourses();
    }

    async loadCourses() {
        try {
            this.showLoading();
            // Use sample data for testing while database is being set up
            const response = await fetch('/api/courses');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.renderCourses(data.courses);
            } else {
                this.showError('فشل في تحميل المقررات: ' + (data.message || 'خطأ غير معروف'));
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            this.showError('حدث خطأ في تحميل المقررات. يرجى المحاولة مرة أخرى.');
        } finally {
            this.hideLoading();
        }
    }

    renderCourses(courses) {
        if (!courses || courses.length === 0) {
            this.showEmptyState();
            return;
        }

        // احفظ قائمة الكورسات للاستخدام من مكونات أخرى (مثل الفيديو مودال)
        this.courses = courses;
        window.HOMEPAGE_COURSES = courses;

        const coursesHTML = courses.map(course => this.createCourseCard(course)).join('');
        this.coursesGrid.innerHTML = `
            <div class="loading-courses" id="loadingCourses" style="display: none; text-align: center; padding: 40px; color: #718096;">
                <i class="fas fa-spinner fa-spin" style="font-size: 48px; margin-bottom: 20px;"></i>
                <p>جاري تحميل المقررات...</p>
            </div>
            ${coursesHTML}
        `;

        // Refresh translations for newly injected elements
        if (window.languageManager && typeof window.languageManager.updateContent === 'function') {
            window.languageManager.updateContent();
        }
    }

    createCourseCard(course) {
        const categoryIcons = {
            'english': 'fas fa-language',
            'hr': 'fas fa-users-cog',
            'technical': 'fas fa-code',
            'business': 'fas fa-chart-line',
            'marketing': 'fas fa-bullhorn',
            'training': 'fas fa-chalkboard-teacher'
        };

        const icon = course.course_icon || categoryIcons[course.category] || 'fas fa-book';
        const rawBadge = course.badge_text || 'جديد';
        const badgeAr = rawBadge;
        const badgeMapEn = { 'جديد': 'New', 'مميز': 'Featured', 'مكثف': 'Intensive', 'دبلوم': 'Diploma', 'TOT': 'TOT' };
        const badgeEn = badgeMapEn[rawBadge] || rawBadge;

        const levelMapAr = { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' };
        const levelMapEn = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
        const levelRaw = course.level_name || course.level || '';
        const levelAr = levelMapAr[levelRaw] || levelRaw || 'جميع المستويات';
        const levelEn = levelMapEn[levelRaw] || levelRaw || 'All levels';

        const title = course.title || course.course_name || 'مقرر';
        const description = course.description || '';
        const durationWeeks = course.duration_weeks || '';
        const durationAr = course.duration || (durationWeeks ? `${durationWeeks} أسبوع` : '');
        const durationEn = course.duration || (durationWeeks ? `${durationWeeks} weeks` : '');
        const startDateObj = course.start_date ? new Date(course.start_date) : null;
        const startDateAr = startDateObj ? startDateObj.toLocaleDateString('ar-EG') : '';
        const startDateEn = startDateObj ? startDateObj.toLocaleDateString('en-US') : '';
        let priceAr = 'قريباً';
        let priceEn = 'Coming Soon';
        if (typeof course.price === 'number') {
            priceAr = `${course.price} $`;
            priceEn = `${course.price} $`;
        } else if (typeof course.price === 'string' && course.price.trim() !== '') {
            // إذا كانت القيمة نصية رقمية
            const num = parseInt(course.price.replace(/[^0-9]/g, ''), 10);
            const priceVal = isNaN(num) ? course.price : `${num} $`;
            priceAr = priceVal;
            priceEn = priceVal;
        }
        const lang = (localStorage.getItem('language') || document.documentElement.lang || 'ar');

        return `
            <div class="course-card" data-category="${course.category || 'general'}" data-course-id="${course.id}">
                <div class="course-image">
                    <i class="${icon}"></i>
                    <div class="course-badge" data-ar="${badgeAr}" data-en="${badgeEn}">${lang === 'en' ? badgeEn : badgeAr}</div>
                </div>
                <div class="course-content">
                    <h3 data-ar="${title}" data-en="${title}">${lang === 'en' ? title : title}</h3>
                    <p data-ar="${description}" data-en="${description}">${lang === 'en' ? description : description}</p>
                    <div class="course-meta">
                        <span class="duration" data-ar="${durationAr}" data-en="${durationEn}">${lang === 'en' ? durationEn : durationAr}</span>
                        <span class="level" data-ar="${levelAr}" data-en="${levelEn}">${lang === 'en' ? levelEn : levelAr}</span>
                        <span class="price" data-ar="${priceAr}" data-en="${priceEn}">${lang === 'en' ? priceEn : priceAr}</span>
                    </div>
                    ${startDateObj ? `
                            <div class="course-dates">
                                <small data-ar="البداية: ${startDateAr}" data-en="Start: ${startDateEn}">${lang === 'en' ? `Start: ${startDateEn}` : `البداية: ${startDateAr}`}</small>
                            </div>
                        ` : ''}
                    <div class="course-video">
                        <button class="btn-preview" onclick="playIntroVideo('course-${course.id}')" data-ar="مشاهدة الفيديو التعريفي" data-en="Watch Intro Video">
                            <i class="fas fa-play"></i>
                            ${lang === 'en' ? 'Watch Intro Video' : 'مشاهدة الفيديو التعريفي'}
                        </button>
                    </div>
                    <button class="btn-enroll" onclick="window.location.href='enrollment.html?course=${course.id}'" data-ar="التسجيل الآن" data-en="Enroll Now">
                        ${lang === 'en' ? 'Enroll Now' : 'التسجيل الآن'}
                    </button>
                </div>
            </div>
        `;
    }

    showLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'block';
        }
    }

    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        }
    }

    showError(message) {
        this.coursesGrid.innerHTML = `
            <div class="loading-courses" id="loadingCourses" style="display: none; text-align: center; padding: 40px; color: #718096;">
                <i class="fas fa-spinner fa-spin" style="font-size: 48px; margin-bottom: 20px;"></i>
                <p>جاري تحميل المقررات...</p>
            </div>
            <div class="error-state" style="text-align: center; padding: 40px; color: #e53e3e;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px;">
                    إعادة المحاولة
                </button>
            </div>
        `;
    }

    showEmptyState() {
        this.coursesGrid.innerHTML = `
            <div class="loading-courses" id="loadingCourses" style="display: none; text-align: center; padding: 40px; color: #718096;">
                <i class="fas fa-spinner fa-spin" style="font-size: 48px; margin-bottom: 20px;"></i>
                <p>جاري تحميل المقررات...</p>
            </div>
            <div class="empty-state" style="text-align: center; padding: 40px; color: #718096;">
                <i class="fas fa-graduation-cap" style="font-size: 48px; margin-bottom: 20px;"></i>
                <p>لا توجد مقررات متاحة حالياً</p>
            </div>
        `;
    }

    // Method to refresh courses (can be called from admin after updates)
    refresh() {
        this.loadCourses();
    }
}

// Initialize course loader when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.courseLoader = new CourseLoader();
});

// Global function for video preview (placeholder)
function playIntroVideo(courseId) {
    // This function can be implemented to show video previews
    console.log('Playing intro video for:', courseId);
    alert('ميزة مشاهدة الفيديو التعريفي ستكون متاحة قريباً');
}