// Course Loader for Homepage
class CourseLoader {
    constructor() {
        this.coursesGrid = document.getElementById('coursesGrid');
        // Use page-provided states instead of injecting a duplicate loader
        this.loadingState = document.getElementById('loadingState');
        this.emptyState = document.getElementById('emptyState');
        this.addCourseBtn = document.getElementById('addCourseBtn');
        this.addCourseForm = document.getElementById('addCourseForm');
        this.editCourseForm = document.getElementById('editCourseForm');
        this.adminControls = document.getElementById('adminControls');
        this.isAdmin = this.detectAdmin();
        this.init();
    }

    init() {
        this.loadCourses();
        this.bindAdminControls();
    }

    detectAdmin() {
        // Support multiple storage keys used across the app for admin detection
        try {
            let isAdmin = false;

            // Check structured currentUser object
            const raw = localStorage.getItem('currentUser');
            if (raw) {
                const user = JSON.parse(raw);
                if (user && (user.role === 'admin' || user.userType === 'admin' || user.role === 'administrator')) {
                    isAdmin = true;
                }
            }

            // Fallback: simple flags/roles stored separately
            const adminFlag = localStorage.getItem('isAdminLoggedIn') || localStorage.getItem('adminLoggedIn');
            if (adminFlag && (adminFlag === 'true' || adminFlag === '1')) {
                isAdmin = true;
            }

            const role = localStorage.getItem('userRole');
            if (role && role.toLowerCase() === 'admin') {
                isAdmin = true;
            }

            return isAdmin;
        } catch (_) {
            const adminFlag = localStorage.getItem('isAdminLoggedIn') || localStorage.getItem('adminLoggedIn');
            const role = (localStorage.getItem('userRole') || '').toLowerCase();
            return (adminFlag === 'true' || adminFlag === '1' || role === 'admin');
        }
    }

    async loadCourses() {
        try {
            this.showLoading();
            
            // Check for category ID in the URL
            const urlParams = new URLSearchParams(window.location.search);
            const categoryId = urlParams.get('category_id');
            
            let url = '/api/courses';
            if (categoryId) {
                url = `/api/categories/${categoryId}/courses`;
            }

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Check which page we're on and filter courses accordingly
                const currentPath = window.location.pathname;
                const isHomepage = currentPath === '/' || currentPath === '/index.html';
                const isStudentsPage = currentPath === '/students.html' || currentPath.includes('students');
                
                console.log('=== Course Loading Debug Info ===');
                console.log('Current path:', currentPath);
                console.log('Is homepage:', isHomepage);
                console.log('Is students page:', isStudentsPage);
                console.log('Total courses from API:', data.courses?.length);
                
                if (data.courses && data.courses.length > 0) {
                    data.courses.forEach((course, index) => {
                        console.log(`Course ${index + 1}:`, {
                            id: course.id,
                            title: course.title || course.course_name,
                            is_featured: course.is_featured,
                            category: course.category
                        });
                    });
                }
                
                const featuredCourses = data.courses?.filter(course => course.is_featured === true) || [];
                console.log('Featured courses count:', featuredCourses.length);
                
                if (isHomepage || isStudentsPage) {
                    // On homepage and students page, show only featured courses
                    console.log('Showing featured courses only:', featuredCourses.length);
                    this.renderCourses(featuredCourses);
                } else {
                    // On other pages (like courses.html), show only non-featured courses
                    const regularCourses = data.courses.filter(course => !course.is_featured);
                    console.log('Showing regular courses only:', regularCourses.length);
                    this.renderCourses(regularCourses);
                }
                
                console.log('=== End Debug Info ===');
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

        // Show admin controls only on allowed admin pages
        if (this.adminControls) {
            const canShowAdmin = this.isAdmin && this.isAdminAllowedOnPage();
            this.adminControls.style.display = canShowAdmin ? 'flex' : 'none';
        }

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
    const startDateAr = startDateObj ? startDateObj.toLocaleDateString('en-GB') : '';
        const startDateEn = startDateObj ? startDateObj.toLocaleDateString('en-US') : '';
        
        // معالجة السعر بشكل صحيح
        let priceDisplay = '';
            const priceUsd = course.price;
            const priceSdg = course.price_sdg;

            if (priceUsd && !isNaN(parseFloat(priceUsd)) && parseFloat(priceUsd) > 0) {
                priceDisplay += `<span>${parseFloat(priceUsd).toFixed(2)} $</span>`;
            }

            if (priceSdg && !isNaN(parseFloat(priceSdg)) && parseFloat(priceSdg) > 0) {
                if (priceDisplay) priceDisplay += ' / ';
    priceDisplay += `<span>${parseFloat(priceSdg).toLocaleString('en-US')} جنيه</span>`;
            }

            if (!priceDisplay) {
                priceDisplay = 'مجاني';
            }

        const lang = (localStorage.getItem('language') || document.documentElement.lang || 'ar');

        const showAdminActions = this.isAdmin && this.isAdminAllowedOnPage();
        const adminActions = showAdminActions ? `
            <div class="admin-actions" style="display:flex; gap:8px; margin-top:10px;">
                <button class="btn btn-sm btn-secondary" onclick="window.courseLoader.editCourse(${course.id})">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-sm btn-danger" onclick="window.courseLoader.deleteCourse(${course.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        ` : '';

        return `
            <div class="course-card" data-category="${course.category || 'general'}" data-course-id="${course.id}">
                <div class="course-image">
                    <i class="${icon}"></i>
                    <div class="course-badge" data-ar="${badgeAr}" data-en="${badgeEn}">${lang === 'en' ? badgeEn : badgeAr}</div>
                </div>
                <div class="course-content">
                    <h3 data-ar="${title}" data-en="${title}">
                        <a href="enrollment.html?courseId=${course.id}" class="course-title-link" style="text-decoration:none;color:inherit;">
                            ${lang === 'en' ? title : title}
                        </a>
                    </h3>
                    <p data-ar="${description}" data-en="${description}">${lang === 'en' ? description : description}</p>
                    <div class="course-meta">
                        <span class="duration" data-ar="${durationAr}" data-en="${durationEn}">${lang === 'en' ? durationEn : durationAr}</span>
                        <span class="level" data-ar="${levelAr}" data-en="${levelEn}">${lang === 'en' ? levelEn : levelAr}</span>
                        <span class="price" data-ar="${priceDisplay}" data-en="${priceDisplay}">${priceDisplay}</span>
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
                    <button class="btn-enroll" onclick="window.location.href='enrollment.html?courseId=${course.id}'" data-ar="التسجيل الآن" data-en="Enroll Now">
                        ${lang === 'en' ? 'Enroll Now' : 'التسجيل الآن'}
                    </button>
                    ${adminActions}
                </div>
            </div>
        `;
    }

    // Allow admin actions only on admin-specific pages
    isAdminAllowedOnPage() {
        try {
            const path = (window.location.pathname || '').toLowerCase();
            const allowedPages = ['/courses.html', '/admin-dashboard.html'];
            const hasExplicitAdminContainer = !!document.getElementById('adminControls');
            return allowedPages.includes(path) || hasExplicitAdminContainer;
        } catch (_) {
            return false;
        }
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
        // Toggle admin controls visibility
        if (this.adminControls) {
            this.adminControls.style.display = this.isAdmin ? 'flex' : 'none';
        }

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
                const isFeatured = document.getElementById('addFeatured')?.checked || false;

                // Basic required validation
                if (!title) {
                    alert('يرجى إدخال اسم المقرر');
                    return;
                }

                // Parse price number if present (supports strings like "75 دولار")
                const priceMatch = String(priceRaw).match(/(\d+(?:\.\d+)?)/);
                const priceNum = priceMatch ? parseFloat(priceMatch[1]) : null;
                const priceSdgRaw = document.getElementById('addPriceSDG')?.value || '';
                const priceSdgMatch = String(priceSdgRaw).match(/(\d+(?:\.\d+)?)/);
                const priceSdgNum = priceSdgMatch ? parseFloat(priceSdgMatch[1]) : null;

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
                    category_id: categoryText || undefined,
                    level_name: level || undefined,
                    duration: duration || undefined,
                    start_date: startDate || undefined,
                    end_date: endDate || undefined,
                    price: priceNum !== null ? priceNum : (priceRaw || undefined),
                    price_sdg: priceSdgNum !== null ? priceSdgNum : (priceSdgRaw || undefined),
                    course_icon: courseIcon || undefined,
                    badge_text: badgeText || undefined,
                    is_featured: isFeatured || false,
                };

                try {
                    // Send POST to API
                    const resp = await fetch(`/api/courses`, {
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

        // Edit form submit
        if (this.editCourseForm) {
            this.editCourseForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = document.getElementById('editId')?.value;
                const title = document.getElementById('editTitle')?.value?.trim() || '';
                const categoryText = document.getElementById('editCategory')?.value || '';
                const description = document.getElementById('editDescription')?.value?.trim() || '';
                const level = document.getElementById('editLevel')?.value || '';
                const duration = document.getElementById('editDuration')?.value?.trim() || '';
                const priceRaw = document.getElementById('editPrice')?.value || '';
                const instructor = document.getElementById('editInstructor')?.value?.trim() || '';
                const youtube = document.getElementById('editYoutube')?.value?.trim() || '';
                const startDate = document.getElementById('editStartDate')?.value || '';
                const endDate = document.getElementById('editEndDate')?.value || '';
                const maxStudents = document.getElementById('editMaxStudents')?.value || '';
                const courseIcon = document.getElementById('editIcon')?.value?.trim() || '';
                const badgeText = document.getElementById('editBadge')?.value?.trim() || '';
                const isFeatured = document.getElementById('editFeatured')?.checked || false;

                if (!id) { alert('معرف المقرر غير موجود'); return; }
                if (!title) { alert('يرجى إدخال اسم المقرر'); return; }

                const priceMatch = String(priceRaw).match(/(\d+(?:\.\d+)?)/);
                const priceNum = priceMatch ? parseFloat(priceMatch[1]) : null;
                const priceSdgRaw = document.getElementById('editPriceSDG')?.value || '';
                const priceSdgMatch = String(priceSdgRaw).match(/(\d+(?:\.\d+)?)/);
                const priceSdgNum = priceSdgMatch ? parseFloat(priceSdgMatch[1]) : null;

                const payload = {
                    id: parseInt(id),
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
                    price_sdg: priceSdgNum !== null ? priceSdgNum : (priceSdgRaw || undefined),
                    course_icon: courseIcon || undefined,
                    badge_text: badgeText || undefined
                };

                try {
                    // Primary attempt: Node API
                    const resp = await fetch(`/api/courses/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    let result = null;
                    try { result = await resp.json(); } catch(_) {}

                    // Fallback to sample API when course not found or 404 (Railway Node app doesn't serve .php routes for PUT)
                    let finalOk = !!(resp.ok && result && result.success);
                    if (!finalOk && (resp.status === 404 || (result && /المقرر غير موجود|لم يتم العثور/i.test(String(result.message || ''))))) {
                        const samplePayload = {
                            id: parseInt(id),
                            course_name: title,
                            description,
                            category: categoryText || undefined,
                            level: level || undefined,
                            duration: duration || undefined,
                            price: priceNum !== null ? priceNum : (priceRaw || undefined),
                            instructor: instructor,
                            youtube_link: youtube || undefined,
                            start_date: startDate || undefined,
                            end_date: endDate || undefined
                        };
                        const respSample = await fetch(`/api/courses-sample/${id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(samplePayload)
                        });
                        const resultSample = await respSample.json().catch(() => ({ success: false }));
                        finalOk = !!(respSample.ok && resultSample && resultSample.success);
                        result = resultSample;
                    }

                    if (finalOk) {
                        const modalEl = document.getElementById('editCourseModal');
                        try {
                            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                            modal.hide();
                        } catch (_) {
                            modalEl.style.display = 'none';
                            document.body.style.overflow = '';
                        }
                        await this.loadCourses();
                        alert('تم حفظ التغييرات بنجاح');
                    } else {
                        alert('فشل في تحديث المقرر: ' + ((result && result.message) || resp.status));
                    }
                } catch (error) {
                    console.error('Error updating course:', error);
                    alert('حدث خطأ أثناء تحديث المقرر');
                }
            });
        }
    }

    // Open edit modal and prefill values
    editCourse(dbId) {
        const course = (this.courses || []).find(c => String(c.id) === String(dbId));
        if (!course) { alert('لم يتم العثور على المقرر'); return; }

        const modalEl = document.getElementById('editCourseModal');
        if (!modalEl) { alert('نموذج التعديل غير متاح'); return; }
        try {
            const modal = new bootstrap.Modal(modalEl);
            // Prefill fields
            document.getElementById('editId') && (document.getElementById('editId').value = course.id);
            document.getElementById('editTitle') && (document.getElementById('editTitle').value = course.title || course.course_name || '');
            document.getElementById('editCategory') && (document.getElementById('editCategory').value = course.category || '');
            document.getElementById('editDescription') && (document.getElementById('editDescription').value = course.description || '');
            document.getElementById('editLevel') && (document.getElementById('editLevel').value = course.level_name || course.level || '');
            document.getElementById('editDuration') && (document.getElementById('editDuration').value = course.duration || course.duration_weeks || '');
            document.getElementById('editPrice') && (document.getElementById('editPrice').value = course.price || '');
            document.getElementById('editPriceSDG') && (document.getElementById('editPriceSDG').value = course.price_sdg || '');
            document.getElementById('editInstructor') && (document.getElementById('editInstructor').value = course.instructor_name || '');
            document.getElementById('editYoutube') && (document.getElementById('editYoutube').value = course.youtube_link || '');
            document.getElementById('editStartDate') && (document.getElementById('editStartDate').value = course.start_date || '');
            document.getElementById('editEndDate') && (document.getElementById('editEndDate').value = course.end_date || '');
            document.getElementById('editMaxStudents') && (document.getElementById('editMaxStudents').value = course.max_students || '');
            document.getElementById('editIcon') && (document.getElementById('editIcon').value = course.course_icon || '');
            document.getElementById('editBadge') && (document.getElementById('editBadge').value = course.badge_text || '');
            modal.show();
        } catch (_) {
            modalEl.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    // Delete course handler
    async deleteCourse(dbId) {
        if (!confirm('هل أنت متأكد من حذف هذا المقرر؟')) return;
        try {
            const resp = await fetch(`/api/courses?id=${encodeURIComponent(dbId)}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: dbId })
            });
            const result = await resp.json();
            if (resp.ok && result.success) {
                await this.loadCourses();
                alert('تم حذف المقرر بنجاح');
            } else {
                alert('فشل في حذف المقرر: ' + (result.message || resp.status));
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            alert('حدث خطأ أثناء حذف المقرر');
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