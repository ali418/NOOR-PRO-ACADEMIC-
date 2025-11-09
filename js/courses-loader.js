// Course Loader for Homepage
class CourseLoader {
    constructor() {
        this.coursesGrid = document.getElementById('coursesGrid');
        // Use page-provided states instead of injecting a duplicate loader
        this.loadingState = document.getElementById('loadingState');
        this.emptyState = document.getElementById('emptyState');
        this.addCourseBtn = document.getElementById('addCourseBtn');
        this.addCourseForm = document.getElementById('addCourseForm');
        this.init();
    }

    init() {
        this.loadCourses();
        this.bindAdminControls();
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
        // Render only the course cards; control visibility via existing page states
        this.coursesGrid.innerHTML = coursesHTML;
        if (this.emptyState) this.emptyState.style.display = 'none';
        // Clear inline display to let CSS grid/flex rules apply
        if (this.coursesGrid) this.coursesGrid.style.display = '';

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
        
        // معالجة السعر بشكل صحيح
        let priceDisplay = 'قريباً';
        const priceUsd = course.price_usd || course.price; // استخدم price_usd إذا كان متاحاً

        if (priceUsd && !isNaN(parseFloat(priceUsd))) {
            const priceFloat = parseFloat(priceUsd);
            priceDisplay = `${priceFloat.toFixed(2)} $`;
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
                        <span class="price" data-ar="{priceDisplay}" data-en="{priceDisplay}">${priceDisplay}</span>
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
        if (this.loadingState) this.loadingState.style.display = 'block';
        if (this.emptyState) this.emptyState.style.display = 'none';
        if (this.coursesGrid) this.coursesGrid.style.display = 'none';
    }

    hideLoading() {
        if (this.loadingState) this.loadingState.style.display = 'none';
    }

    showError(message) {
        if (this.loadingState) this.loadingState.style.display = 'none';
        if (this.emptyState) this.emptyState.style.display = 'none';
        if (this.coursesGrid) this.coursesGrid.style.display = '';
        this.coursesGrid.innerHTML = `
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
        if (this.loadingState) this.loadingState.style.display = 'none';
        if (this.coursesGrid) {
            this.coursesGrid.innerHTML = '';
            this.coursesGrid.style.display = 'none';
        }
        if (this.emptyState) this.emptyState.style.display = 'block';
    }

    // Method to refresh courses (can be called from admin after updates)
    refresh() {
        this.loadCourses();
    }

    // Admin: bind add course controls if present on the page
    bindAdminControls() {
        // Button to open modal
        if (this.addCourseBtn) {
            this.addCourseBtn.addEventListener('click', () => {
                const modalEl = document.getElementById('addCourseModal');
                if (!modalEl) return;
                try {
                    const modal = new bootstrap.Modal(modalEl);
                    // Reset form
                    if (this.addCourseForm) this.addCourseForm.reset();
                    modal.show();
                } catch (e) {
                    // Fallback if Bootstrap isn't available
                    modalEl.style.display = 'block';
                    document.body.style.overflow = 'hidden';
                }
            });
        }

        // Form submit handler
        if (this.addCourseForm) {
            this.addCourseForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                // Collect values by IDs defined in courses.html
                const title = document.getElementById('addTitle')?.value?.trim() || '';
                const categoryText = document.getElementById('addCategory')?.value || '';
                const description = document.getElementById('addDescription')?.value?.trim() || '';
                const level = document.getElementById('addLevel')?.value || '';
                const duration = document.getElementById('addDuration')?.value?.trim() || '';
                const priceRaw = document.getElementById('addPrice')?.value || '';
                const instructor = document.getElementById('addInstructor')?.value?.trim() || '';
                const youtube = document.getElementById('addYoutube')?.value?.trim() || '';
                const startDate = document.getElementById('addStartDate')?.value || '';
                const endDate = document.getElementById('addEndDate')?.value || '';
                const maxStudents = document.getElementById('addMaxStudents')?.value || '';
                const courseIcon = document.getElementById('addIcon')?.value?.trim() || '';
                const badgeText = document.getElementById('addBadge')?.value?.trim() || '';

                // Basic required validation
                if (!title) {
                    alert('يرجى إدخال اسم المقرر');
                    return;
                }

                // Parse price number if present (supports strings like "75 دولار")
                const priceMatch = String(priceRaw).match(/(\d+(?:\.\d+)?)/);
                const priceNum = priceMatch ? parseFloat(priceMatch[1]) : null;

                // Generate a course code
                const courseCode = `CRS-${Date.now().toString().slice(-6)}`;

                // Build payload compatible with /api/courses addCourse
                const payload = {
                    course_code: courseCode,
                    title,
                    course_name: title,
                    description,
                    instructor_name: instructor,
                    max_students: maxStudents ? parseInt(maxStudents) : undefined,
                    status: 'active',
                    youtube_link: youtube || undefined,
                    category: categoryText || undefined,
                    level_name: level || undefined,
                    duration: duration || undefined,
                    start_date: startDate || undefined,
                    end_date: endDate || undefined,
                    price: priceNum !== null ? priceNum : (priceRaw || undefined),
                    course_icon: courseIcon || undefined,
                    badge_text: badgeText || undefined
                };

                try {
                    // Send POST to API
                    const resp = await fetch('/api/courses', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const result = await resp.json();

                    if (resp.ok && result.success) {
                        // Hide modal
                        const modalEl = document.getElementById('addCourseModal');
                        try {
                            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                            modal.hide();
                        } catch (_) {
                            modalEl.style.display = 'none';
                            document.body.style.overflow = '';
                        }
                        // Reset form
                        this.addCourseForm.reset();
                        // Refresh course list
                        await this.loadCourses();
                        alert('تم إضافة المقرر بنجاح');
                    } else {
                        alert('فشل في إضافة المقرر: ' + (result.message || resp.status));
                    }
                } catch (error) {
                    console.error('Error adding course:', error);
                    alert('حدث خطأ أثناء إضافة المقرر');
                }
            });
        }
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