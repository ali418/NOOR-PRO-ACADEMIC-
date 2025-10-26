// Courses Management System
class CoursesManager {
    constructor() {
        this.courses = [];
        this.filteredCourses = [];
        this.currentPage = 1;
        this.coursesPerPage = 12;
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.sortBy = 'name';
        this.sortOrder = 'asc';
        this.filters = {
            search: '',
            category: '',
            level: '',
            status: ''
        };
        this.lessons = [];
        this.apiUrl = 'api/courses.php';
        
        this.init();
    }

    async init() {
        await this.loadCoursesFromAPI();
        this.bindEvents();
        this.renderCourses();
        this.updateStats();
        
        // التحقق من وجود معرف كورس في الرابط وفتح نافذة التفاصيل
        this.checkUrlForCourseId();
    }
    
    // التحقق من وجود معرف كورس في الرابط
    checkUrlForCourseId() {
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('openCourse');
        
        if (courseId) {
            // فتح نافذة تفاصيل الكورس تلقائياً
            this.viewCourse(courseId);
        }
    }

    // API Methods
    async loadCoursesFromAPI() {
        try {
            this.showLoading(true);
            const response = await fetch(this.apiUrl);
            const data = await response.json();
            
            if (data.success) {
                this.courses = data.data.map(course => ({
                    id: course.course_code,
                    db_id: course.id,
                    name: course.course_name,
                    description: course.description,
                    category: course.category,
                    level: course.level,
                    status: course.status,
                    duration: course.duration,
                    price: course.price,
                    maxStudents: course.max_students,
                    enrolledStudents: course.enrolled_students || 0,
                    lessonsCount: course.lessons_count || 0,
                    instructor: course.instructor,
                    createdDate: course.created_at,
                    image: `https://via.placeholder.com/300x180/4F46E5/FFFFFF?text=${encodeURIComponent(course.course_name)}`,
                    allowEnrollment: course.allow_enrollment === 1,
                    requireApproval: course.require_approval === 1,
                    youtube_link: course.youtube_link || ''
                }));
                this.applyFilters();
                this.updateStats();
            } else {
                console.error('Failed to load courses:', data.message);
                this.showNotification('فشل في تحميل المقررات: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            this.showNotification('حدث خطأ أثناء تحميل المقررات', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async addCourseToAPI(courseData) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(courseData)
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error adding course:', error);
            return { success: false, message: 'خطأ في الاتصال بالخادم' };
        }
    }

    async updateCourseInAPI(courseData) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(courseData)
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error updating course:', error);
            return { success: false, message: 'خطأ في الاتصال بالخادم' };
        }
    }

    async deleteCourseFromAPI(dbId) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: dbId })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error deleting course:', error);
            return { success: false, message: 'خطأ في الاتصال بالخادم' };
        }
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    getRandomColor() {
        const colors = ['4F46E5', 'EC4899', '10B981', 'F59E0B', '6B7280', '8B5CF6', 'EF4444', '06B6D4', '84CC16'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('courseSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            });
        }

        // Filter dropdowns
        const categoryFilter = document.getElementById('categoryFilter');
        const levelFilter = document.getElementById('levelFilter');
        const statusFilter = document.getElementById('statusFilter');
        const sortBy = document.getElementById('sortBy');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.applyFilters();
            });
        }

        if (levelFilter) {
            levelFilter.addEventListener('change', (e) => {
                this.filters.level = e.target.value;
                this.applyFilters();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }

        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.applyFilters();
            });
        }

        // View toggle buttons
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const viewMode = e.target.closest('.view-btn').dataset.view;
                this.switchView(viewMode);
            });
        });

        // Add course button
        const addCourseBtn = document.getElementById('addCourseBtn');
        if (addCourseBtn) {
            addCourseBtn.addEventListener('click', () => this.openAddCourseModal());
        }

        // Add course form
        const addCourseForm = document.getElementById('addCourseForm');
        if (addCourseForm) {
            addCourseForm.addEventListener('submit', (e) => this.handleAddCourse(e));
        }

        // Tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.closest('.tab-btn').dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Add lesson button
        const addLessonBtn = document.getElementById('addLessonBtn');
        if (addLessonBtn) {
            addLessonBtn.addEventListener('click', () => this.openAddLessonModal());
        }

        // Add lesson form
        const addLessonForm = document.getElementById('addLessonForm');
        if (addLessonForm) {
            addLessonForm.addEventListener('submit', (e) => this.handleAddLesson(e));
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshCourses');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // Export/Import buttons
        const exportBtn = document.getElementById('exportCoursesBtn');
        const importBtn = document.getElementById('importCoursesBtn');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCourses());
        }
        
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importCourses());
        }
    }

    applyFilters() {
        let filtered = [...this.courses];

        // Apply search filter
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(course => 
                course.name.toLowerCase().includes(searchTerm) ||
                course.description.toLowerCase().includes(searchTerm) ||
                course.instructor.toLowerCase().includes(searchTerm) ||
                course.id.toLowerCase().includes(searchTerm)
            );
        }

        // Apply category filter
        if (this.filters.category) {
            filtered = filtered.filter(course => course.category === this.filters.category);
        }

        // Apply level filter
        if (this.filters.level) {
            filtered = filtered.filter(course => course.level === this.filters.level);
        }

        // Apply status filter
        if (this.filters.status) {
            filtered = filtered.filter(course => course.status === this.filters.status);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (this.sortBy) {
                case 'name':
                    aValue = a.name;
                    bValue = b.name;
                    break;
                case 'date':
                    aValue = new Date(a.createdDate);
                    bValue = new Date(b.createdDate);
                    break;
                case 'students':
                    aValue = a.enrolledStudents;
                    bValue = b.enrolledStudents;
                    break;
                case 'lessons':
                    aValue = a.lessonsCount;
                    bValue = b.lessonsCount;
                    break;
                default:
                    aValue = a[this.sortBy];
                    bValue = b[this.sortBy];
            }

            if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        this.filteredCourses = filtered;
        this.currentPage = 1;
        this.renderCourses();
        this.updatePagination();
    }

    switchView(viewMode) {
        this.viewMode = viewMode;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewMode}"]`).classList.add('active');

        // Show/hide appropriate containers
        const gridContainer = document.getElementById('coursesGrid');
        const listContainer = document.getElementById('coursesList');

        if (viewMode === 'grid') {
            gridContainer.style.display = 'grid';
            listContainer.style.display = 'none';
            this.coursesPerPage = 12;
        } else {
            gridContainer.style.display = 'none';
            listContainer.style.display = 'block';
            this.coursesPerPage = 10;
        }

        this.renderCourses();
        this.updatePagination();
    }

    renderCourses() {
        if (this.viewMode === 'grid') {
            this.renderCoursesGrid();
        } else {
            this.renderCoursesList();
        }
    }

    renderCoursesGrid() {
        const container = document.getElementById('coursesGrid');
        if (!container) return;

        const startIndex = (this.currentPage - 1) * this.coursesPerPage;
        const endIndex = startIndex + this.coursesPerPage;
        const coursesToShow = this.filteredCourses.slice(startIndex, endIndex);

        container.innerHTML = '';

        if (coursesToShow.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-book-open"></i>
                    <h3>لا توجد مقررات</h3>
                    <p>لا توجد مقررات مطابقة لمعايير البحث</p>
                </div>
            `;
            return;
        }

        coursesToShow.forEach(course => {
            const courseCard = document.createElement('div');
            courseCard.className = 'course-card fade-in';
            courseCard.innerHTML = `
                <div class="course-image">
                    <i class="fas fa-${this.getCategoryIcon(course.category)}"></i>
                    <div class="course-badge ${course.status}">${this.getStatusLabel(course.status)}</div>
                    ${course.youtube_link ? `
                        <div class="video-preview-overlay">
                            <button class="btn-video-preview" onclick="coursesManager.playIntroVideo('${course.id}')" title="مشاهدة الفيديو التعريفي">
                                <i class="fas fa-play"></i>
                                <span>الفيديو التعريفي</span>
                            </button>
                        </div>
                    ` : ''}
                    <div class="course-actions">
                        <button class="btn-action view" onclick="coursesManager.viewCourse('${course.id}')" title="عرض التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action edit" onclick="coursesManager.editCourse('${course.id}')" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" onclick="coursesManager.deleteCourse('${course.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="course-content">
                    <h3 class="course-title">${course.name}</h3>
                    <p class="course-description">${course.description}</p>
                    <div class="course-meta">
                        <div class="meta-item">
                            <i class="fas fa-user"></i>
                            <span>${course.instructor}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>${course.duration} ساعة</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-tag"></i>
                            <span>${course.price} ريال</span>
                        </div>
                    </div>
                    <div class="course-stats">
                        <div class="stats-item">
                            <div class="stats-number">${course.lessonsCount}</div>
                            <div class="stats-label">درس</div>
                        </div>
                        <div class="stats-item">
                            <div class="stats-number">${course.enrolledStudents}</div>
                            <div class="stats-label">طالب</div>
                        </div>
                        <div class="stats-item">
                            <div class="stats-number">${this.getLevelLabel(course.level)}</div>
                            <div class="stats-label">المستوى</div>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(courseCard);
        });
    }

    renderCoursesList() {
        const tbody = document.getElementById('coursesTableBody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.coursesPerPage;
        const endIndex = startIndex + this.coursesPerPage;
        const coursesToShow = this.filteredCourses.slice(startIndex, endIndex);

        tbody.innerHTML = '';

        if (coursesToShow.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                        <i class="fas fa-book-open" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        لا توجد مقررات مطابقة للبحث
                    </td>
                </tr>
            `;
            return;
        }

        coursesToShow.forEach(course => {
            const row = document.createElement('tr');
            row.className = 'fade-in';
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="course-checkbox" data-course-id="${course.id}">
                </td>
                <td>
                    <div class="course-info">
                        <div class="course-thumbnail">
                            <i class="fas fa-${this.getCategoryIcon(course.category)}"></i>
                        </div>
                        <div>
                            <div class="course-name">${course.name}</div>
                            <div class="course-category">${this.getCategoryLabel(course.category)}</div>
                        </div>
                    </div>
                </td>
                <td>${this.getCategoryLabel(course.category)}</td>
                <td>${this.getLevelLabel(course.level)}</td>
                <td>${course.lessonsCount}</td>
                <td>${course.enrolledStudents}/${course.maxStudents}</td>
                <td>
                    <span class="status-badge ${course.status}">${this.getStatusLabel(course.status)}</span>
                </td>
                <td>${this.formatDate(course.createdDate)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action view" onclick="coursesManager.viewCourse('${course.id}')" title="عرض التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action edit" onclick="coursesManager.editCourse('${course.id}')" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" onclick="coursesManager.deleteCourse('${course.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getCategoryIcon(category) {
        const icons = {
            math: 'calculator',
            science: 'flask',
            language: 'language',
            social: 'globe',
            arts: 'palette'
        };
        return icons[category] || 'book';
    }

    getCategoryLabel(category) {
        const labels = {
            math: 'الرياضيات',
            science: 'العلوم',
            language: 'اللغات',
            social: 'الاجتماعيات',
            arts: 'الفنون'
        };
        return labels[category] || category;
    }

    getLevelLabel(level) {
        const labels = {
            elementary: 'ابتدائي',
            middle: 'متوسط',
            high: 'ثانوي',
            university: 'جامعي'
        };
        return labels[level] || level;
    }

    getStatusLabel(status) {
        const labels = {
            active: 'نشط',
            draft: 'مسودة',
            archived: 'مؤرشف'
        };
        return labels[status] || status;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA');
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredCourses.length / this.coursesPerPage);
        const paginationInfo = document.querySelector('.pagination-info span');
        
        if (paginationInfo) {
            const startIndex = (this.currentPage - 1) * this.coursesPerPage + 1;
            const endIndex = Math.min(this.currentPage * this.coursesPerPage, this.filteredCourses.length);
            const totalText = this.viewMode === 'grid' ? 'مقرر' : 'مقرر';
            paginationInfo.textContent = `عرض ${startIndex}-${endIndex} من ${this.filteredCourses.length} ${totalText}`;
        }

        // Update pagination buttons
        const pagination = document.querySelector('.pagination');
        if (pagination) {
            pagination.innerHTML = '';
            
            // Previous button
            const prevBtn = document.createElement('button');
            prevBtn.className = 'pagination-btn';
            prevBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            prevBtn.disabled = this.currentPage === 1;
            prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
            pagination.appendChild(prevBtn);

            // Page numbers
            for (let i = 1; i <= Math.min(totalPages, 5); i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `pagination-btn ${i === this.currentPage ? 'active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => this.goToPage(i));
                pagination.appendChild(pageBtn);
            }

            // Next button
            const nextBtn = document.createElement('button');
            nextBtn.className = 'pagination-btn';
            nextBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            nextBtn.disabled = this.currentPage === totalPages;
            nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
            pagination.appendChild(nextBtn);
        }
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredCourses.length / this.coursesPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderCourses();
            this.updatePagination();
        }
    }

    updateStats() {
        const totalCourses = this.courses.length;
        const activeCourses = this.courses.filter(c => c.status === 'active').length;
        const totalLessons = this.courses.reduce((sum, course) => sum + course.lessonsCount, 0);
        const totalStudents = this.courses.reduce((sum, course) => sum + course.enrolledStudents, 0);

        // Update stat cards
        const statNumbers = document.querySelectorAll('.stat-number');
        if (statNumbers.length >= 4) {
            statNumbers[0].textContent = totalCourses.toLocaleString();
            statNumbers[1].textContent = activeCourses.toLocaleString();
            statNumbers[2].textContent = totalLessons.toLocaleString();
            statNumbers[3].textContent = totalStudents.toLocaleString();
        }
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Show/hide tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    openAddCourseModal() {
        const modal = document.getElementById('addCourseModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Reset form and switch to first tab
            const form = document.getElementById('addCourseForm');
            if (form) form.reset();
            this.switchTab('basic');
            this.lessons = []; // Reset lessons
            this.renderLessonsList();
            
            // Focus first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    async handleAddCourse(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        // Show loading
        this.showLoading(true);
        
        // Create new course object for API
        const courseData = {
            course_code: `CRS${(this.courses.length + 1).toString().padStart(3, '0')}`,
            course_name: formData.get('courseName'),
            description: formData.get('description'),
            category: formData.get('category'),
            level: formData.get('level'),
            status: formData.get('status') || 'draft',
            duration: formData.get('duration') || '',
            price: parseFloat(formData.get('price')) || 0,
            max_students: parseInt(formData.get('maxStudents')) || 30,
            instructor: formData.get('instructor') || 'مدرس جديد',
            schedule: formData.get('schedule') || '',
            youtube_link: formData.get('youtubeLink') || '',
            allow_enrollment: formData.get('allowEnrollment') === 'on' ? 1 : 0,
            require_approval: formData.get('requireApproval') === 'on' ? 1 : 0
        };

        try {
            const result = await this.addCourseToAPI(courseData);
            
            if (result.success) {
                // Reload courses from API
                await this.loadCoursesFromAPI();
                
                // Close modal and show success message
                this.closeModal('addCourseModal');
                this.showNotification('تم إضافة المقرر بنجاح!', 'success');
                
                // Reset form and lessons
                form.reset();
                this.lessons = [];
            } else {
                this.showNotification('فشل في إضافة المقرر: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error adding course:', error);
            this.showNotification('حدث خطأ أثناء إضافة المقرر', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    openAddLessonModal() {
        const modal = document.getElementById('addLessonModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Focus first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    handleAddLesson(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        // Create new lesson object
        const newLesson = {
            id: `LSN${(this.lessons.length + 1).toString().padStart(3, '0')}`,
            title: formData.get('lessonTitle'),
            type: formData.get('lessonType'),
            duration: parseInt(formData.get('lessonDuration')) || 0,
            description: formData.get('lessonDescription') || ''
        };

        // Add to lessons array
        this.lessons.push(newLesson);
        this.renderLessonsList();

        // Close modal and reset form
        this.closeModal('addLessonModal');
        form.reset();
        this.showNotification('تم إضافة الدرس بنجاح!', 'success');
    }

    renderLessonsList() {
        const container = document.getElementById('lessonsList');
        if (!container) return;

        if (this.lessons.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--gray-500); margin: 2rem 0;">لم يتم إضافة دروس بعد</p>';
            return;
        }

        container.innerHTML = this.lessons.map(lesson => `
            <div class="lesson-item">
                <div class="lesson-info">
                    <div class="lesson-icon ${lesson.type}">
                        <i class="fas fa-${this.getLessonIcon(lesson.type)}"></i>
                    </div>
                    <div class="lesson-details">
                        <h4>${lesson.title}</h4>
                        <p>${this.getLessonTypeLabel(lesson.type)} - ${lesson.duration} دقيقة</p>
                    </div>
                </div>
                <div class="lesson-actions">
                    <button class="btn-action edit" onclick="coursesManager.editLesson('${lesson.id}')" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="coursesManager.deleteLesson('${lesson.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getLessonIcon(type) {
        const icons = {
            video: 'play',
            text: 'file-text',
            quiz: 'question-circle',
            assignment: 'tasks'
        };
        return icons[type] || 'book';
    }

    getLessonTypeLabel(type) {
        const labels = {
            video: 'فيديو',
            text: 'نص',
            quiz: 'اختبار',
            assignment: 'واجب'
        };
        return labels[type] || type;
    }

    viewCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        const modal = document.getElementById('courseDetailsModal');
        const content = document.getElementById('courseDetailsContent');
        
        if (modal && content) {
            content.innerHTML = `
                <div class="course-profile">
                    <div class="course-header">
                        <div class="course-image-large">
                            <i class="fas fa-${this.getCategoryIcon(course.category)}"></i>
                        </div>
                        <div class="course-info">
                            <h3>${course.name}</h3>
                            <span class="status-badge ${course.status}">${this.getStatusLabel(course.status)}</span>
                            <div class="course-meta-large">
                                <div class="meta-item">
                                    <span class="meta-label">رقم المقرر</span>
                                    <span class="meta-value">${course.id}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">المدرس</span>
                                    <span class="meta-value">${course.instructor}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">التصنيف</span>
                                    <span class="meta-value">${this.getCategoryLabel(course.category)}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">المستوى</span>
                                    <span class="meta-value">${this.getLevelLabel(course.level)}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">المدة</span>
                                    <span class="meta-value">${course.duration} ساعة</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">السعر</span>
                                    <span class="meta-value">${course.price} ريال</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">عدد الدروس</span>
                                    <span class="meta-value">${course.lessonsCount} درس</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">الطلاب المسجلين</span>
                                    <span class="meta-value">${course.enrolledStudents}/${course.maxStudents}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">تاريخ الإنشاء</span>
                                    <span class="meta-value">${this.formatDate(course.createdDate)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="course-description-full">
                        <h4>وصف المقرر</h4>
                        <p>${course.description}</p>
                    </div>
                </div>
            `;
            
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    editCourse(courseId) {
        this.showNotification('سيتم فتح نموذج التعديل قريباً', 'info');
    }

    async deleteCourse(courseId) {
        if (confirm('هل أنت متأكد من حذف هذا المقرر؟')) {
            // Find the course to get its database ID
            const course = this.courses.find(c => c.id === courseId);
            if (!course || !course.db_id) {
                this.showNotification('لا يمكن حذف المقرر - معرف غير صحيح', 'error');
                return;
            }
            
            // Show loading
            this.showLoading(true);
            
            try {
                const result = await this.deleteCourseFromAPI(course.db_id);
                
                if (result.success) {
                    // Reload courses from API
                    await this.loadCoursesFromAPI();
                    this.showNotification('تم حذف المقرر بنجاح', 'success');
                } else {
                    this.showNotification('فشل في حذف المقرر: ' + result.message, 'error');
                }
            } catch (error) {
                console.error('Error deleting course:', error);
                this.showNotification('حدث خطأ أثناء حذف المقرر', 'error');
            } finally {
                this.showLoading(false);
            }
        }
    }

    editLesson(lessonId) {
        this.showNotification('سيتم فتح نموذج تعديل الدرس قريباً', 'info');
    }

    deleteLesson(lessonId) {
        if (confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
            this.lessons = this.lessons.filter(l => l.id !== lessonId);
            this.renderLessonsList();
            this.showNotification('تم حذف الدرس بنجاح', 'success');
        }
    }

    async refreshData() {
        const refreshBtn = document.getElementById('refreshCourses');
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('fa-spin');
            
            try {
                await this.loadCoursesFromAPI();
                this.showNotification('تم تحديث البيانات', 'success');
            } catch (error) {
                console.error('Error refreshing data:', error);
                this.showNotification('فشل في تحديث البيانات', 'error');
            } finally {
                icon.classList.remove('fa-spin');
            }
        }
    }

    exportCourses() {
        // Create CSV content
        const headers = ['رقم المقرر', 'اسم المقرر', 'التصنيف', 'المستوى', 'الحالة', 'المدرس', 'عدد الدروس', 'الطلاب المسجلين', 'السعر', 'تاريخ الإنشاء'];
        const csvContent = [
            headers.join(','),
            ...this.filteredCourses.map(course => [
                course.id,
                course.name,
                this.getCategoryLabel(course.category),
                this.getLevelLabel(course.level),
                this.getStatusLabel(course.status),
                course.instructor,
                course.lessonsCount,
                course.enrolledStudents,
                course.price,
                course.createdDate
            ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `courses_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        this.showNotification('تم تصدير البيانات بنجاح', 'success');
    }

    importCourses() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.xlsx,.xls';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.showNotification('سيتم تطبيق وظيفة الاستيراد قريباً', 'info');
            }
        };
        input.click();
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            backgroundColor: type === 'success' ? '#10b981' : 
                           type === 'error' ? '#ef4444' : '#3b82f6'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Play intro video for course
    playIntroVideo(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course || !course.youtube_link) {
            this.showNotification('لا يوجد فيديو تعريفي لهذا المقرر', 'error');
            return;
        }

        // Extract YouTube video ID from URL
        const videoId = this.extractYouTubeId(course.youtube_link);
        if (!videoId) {
            this.showNotification('رابط الفيديو غير صحيح', 'error');
            return;
        }

        // Create and show video modal
        this.showVideoModal(course, videoId);
    }

    // Extract YouTube video ID from various URL formats
    extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // Show video modal
    showVideoModal(course, videoId) {
        // Remove existing modal if any
        const existingModal = document.getElementById('courseVideoModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'courseVideoModal';
        modal.className = 'modal video-modal';
        modal.innerHTML = `
            <div class="modal-content video-modal-content">
                <div class="modal-header video-modal-header">
                    <h2>${course.name} - الفيديو التعريفي</h2>
                    <span class="close video-close">&times;</span>
                </div>
                <div class="video-container">
                    <iframe 
                        width="100%" 
                        height="400" 
                        src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
                        frameborder="0" 
                        allowfullscreen>
                    </iframe>
                </div>
                <div class="video-info">
                    <h4>${course.name}</h4>
                    <p>${course.description}</p>
                    <div class="course-details">
                        <div class="detail-item">
                            <i class="fas fa-user"></i>
                            <span>المدرب: ${course.instructor}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>المدة: ${course.duration}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-tag"></i>
                            <span>السعر: ${course.price} ريال</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.appendChild(modal);
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Add close event listeners
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            modal.remove();
            document.body.style.overflow = 'auto';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        });
    }
}

// Initialize courses manager when DOM is loaded
let coursesManager;

// Global function to play intro video
function playIntroVideo(courseId) {
    if (coursesManager) {
        coursesManager.playIntroVideo(courseId);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    coursesManager = new CoursesManager();

    // Close modals when clicking outside or on close button
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Close buttons
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });

    console.log('📚 Courses Management System Initialized!');
});

// Global function to close modals
function closeModal(modalId) {
    if (coursesManager) {
        coursesManager.closeModal(modalId);
    }
}