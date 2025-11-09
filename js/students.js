// Students Management System with MySQL Integration
class StudentsManager {
    constructor() {
        this.students = [];
        this.filteredStudents = [];
        this.currentPage = 1;
        this.studentsPerPage = 10;
        this.sortBy = 'name';
        this.sortOrder = 'asc';
        this.filters = {
            search: '',
            status: '',
            grade: ''
        };
        this.apiUrl = '/api/students';
        
        this.init();
    }

    init() {
        this.loadStudentsFromAPI();
        this.bindEvents();
    }

    // تحميل الطلاب من قاعدة البيانات
    async loadStudentsFromAPI() {
        try {
            this.showLoading(true);
            const response = await fetch(this.apiUrl);
            const result = await response.json();
            
            if (result.success) {
                this.students = result.data.map(student => ({
                    id: student.student_id,
                    firstName: student.first_name,
                    lastName: student.last_name,
                    email: student.email,
                    phone: student.phone || '',
                    birthDate: student.date_of_birth || '',
                    gender: student.gender,
                    address: student.address || '',
                    status: student.status,
                    registrationDate: student.enrollment_date,
                    dbId: student.id // معرف قاعدة البيانات
                }));
                this.renderStudents();
                this.updateStats();
            } else {
                this.showNotification('خطأ في تحميل البيانات: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error loading students:', error);
            this.showNotification('خطأ في الاتصال بالخادم', 'error');
            // تحميل البيانات التجريبية في حالة فشل الاتصال
            this.loadSampleData();
        } finally {
            this.showLoading(false);
        }
    }

    // إضافة طالب جديد إلى قاعدة البيانات
    async addStudentToAPI(studentData) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: studentData.id,
                    first_name: studentData.firstName,
                    last_name: studentData.lastName,
                    email: studentData.email,
                    phone: studentData.phone,
                    date_of_birth: studentData.birthDate,
                    gender: studentData.gender,
                    address: studentData.address,
                    enrollment_date: studentData.registrationDate
                })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error adding student:', error);
            return { success: false, message: 'خطأ في الاتصال بالخادم' };
        }
    }

    // تحديث بيانات طالب
    async updateStudentInAPI(studentData) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: studentData.dbId,
                    first_name: studentData.firstName,
                    last_name: studentData.lastName,
                    email: studentData.email,
                    phone: studentData.phone,
                    date_of_birth: studentData.birthDate,
                    gender: studentData.gender,
                    address: studentData.address,
                    status: studentData.status
                })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error updating student:', error);
            return { success: false, message: 'خطأ في الاتصال بالخادم' };
        }
    }

    // حذف طالب من قاعدة البيانات
    async deleteStudentFromAPI(dbId) {
        try {
            const response = await fetch(`${this.apiUrl}/${dbId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error deleting student:', error);
            return { success: false, message: 'خطأ في الاتصال بالخادم' };
        }
    }

    // عرض/إخفاء مؤشر التحميل
    showLoading(show) {
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    loadSampleData() {
        // Sample student data (fallback)
        this.students = [
            {
                id: 'STU001',
                firstName: 'أحمد',
                lastName: 'محمد علي',
                email: 'ahmed.mohamed@email.com',
                phone: '+966501234567',
                birthDate: '2005-03-15',
                gender: 'male',
                gradeLevel: 'high',
                address: 'الرياض، المملكة العربية السعودية',
                status: 'active',
                registrationDate: '2023-09-01',
                photo: 'https://via.placeholder.com/40/4F46E5/FFFFFF?text=أح',
                notes: 'طالب متفوق في الرياضيات'
            },
            {
                id: 'STU002',
                firstName: 'فاطمة',
                lastName: 'عبدالله السالم',
                email: 'fatima.salem@email.com',
                phone: '+966507654321',
                birthDate: '2006-07-22',
                gender: 'female',
                gradeLevel: 'high',
                address: 'جدة، المملكة العربية السعودية',
                status: 'active',
                registrationDate: '2023-09-01',
                photo: 'https://via.placeholder.com/40/EC4899/FFFFFF?text=فا',
                notes: 'متميزة في اللغة العربية'
            },
            {
                id: 'STU003',
                firstName: 'محمد',
                lastName: 'خالد الأحمد',
                email: 'mohammed.khalid@email.com',
                phone: '+966512345678',
                birthDate: '2004-11-08',
                gender: 'male',
                gradeLevel: 'university',
                address: 'الدمام، المملكة العربية السعودية',
                status: 'graduated',
                registrationDate: '2022-09-01',
                photo: 'https://via.placeholder.com/40/10B981/FFFFFF?text=مح',
                notes: 'خريج بامتياز'
            },
            {
                id: 'STU004',
                firstName: 'نورا',
                lastName: 'سعد المطيري',
                email: 'nora.saad@email.com',
                phone: '+966598765432',
                birthDate: '2007-01-30',
                gender: 'female',
                gradeLevel: 'middle',
                address: 'مكة المكرمة، المملكة العربية السعودية',
                status: 'active',
                registrationDate: '2023-09-15',
                photo: 'https://via.placeholder.com/40/F59E0B/FFFFFF?text=نو',
                notes: 'نشطة في الأنشطة اللاصفية'
            },
            {
                id: 'STU005',
                firstName: 'عبدالرحمن',
                lastName: 'يوسف القحطاني',
                email: 'abdulrahman.youssef@email.com',
                phone: '+966523456789',
                birthDate: '2008-05-12',
                gender: 'male',
                gradeLevel: 'middle',
                address: 'أبها، المملكة العربية السعودية',
                status: 'inactive',
                registrationDate: '2023-08-20',
                photo: 'https://via.placeholder.com/40/6B7280/FFFFFF?text=عب',
                notes: 'في إجازة مؤقتة'
            },
            {
                id: 'STU006',
                firstName: 'مريم',
                lastName: 'عبدالعزيز النجار',
                email: 'mariam.abdulaziz@email.com',
                phone: '+966534567890',
                birthDate: '2009-09-18',
                gender: 'female',
                gradeLevel: 'elementary',
                address: 'الطائف، المملكة العربية السعودية',
                status: 'active',
                registrationDate: '2023-09-10',
                photo: 'https://via.placeholder.com/40/8B5CF6/FFFFFF?text=مر',
                notes: 'موهوبة في الفنون'
            },
            {
                id: 'STU007',
                firstName: 'سارة',
                lastName: 'أحمد الزهراني',
                email: 'sara.ahmed@email.com',
                phone: '+966545678901',
                birthDate: '2005-12-03',
                gender: 'female',
                gradeLevel: 'high',
                address: 'المدينة المنورة، المملكة العربية السعودية',
                status: 'suspended',
                registrationDate: '2023-09-05',
                photo: 'https://via.placeholder.com/40/EF4444/FFFFFF?text=سا',
                notes: 'موقوفة مؤقتاً لأسباب تأديبية'
            },
            {
                id: 'STU008',
                firstName: 'عمر',
                lastName: 'فهد الشمري',
                email: 'omar.fahad@email.com',
                phone: '+966556789012',
                birthDate: '2006-04-25',
                gender: 'male',
                gradeLevel: 'high',
                address: 'حائل، المملكة العربية السعودية',
                status: 'active',
                registrationDate: '2023-09-12',
                photo: 'https://via.placeholder.com/40/06B6D4/FFFFFF?text=عم',
                notes: 'قائد فريق كرة القدم'
            }
        ];

        // Add more sample data to reach 247 students
        for (let i = 9; i <= 247; i++) {
            const genders = ['male', 'female'];
            const grades = ['elementary', 'middle', 'high', 'university'];
            const statuses = ['active', 'inactive', 'graduated', 'suspended'];
            const cities = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الطائف', 'أبها', 'حائل'];
            
            const gender = genders[Math.floor(Math.random() * genders.length)];
            const grade = grades[Math.floor(Math.random() * grades.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const city = cities[Math.floor(Math.random() * cities.length)];
            
            const maleNames = ['أحمد', 'محمد', 'عبدالله', 'عبدالرحمن', 'خالد', 'سعد', 'فهد', 'عمر', 'يوسف', 'إبراهيم'];
            const femaleNames = ['فاطمة', 'عائشة', 'خديجة', 'مريم', 'نورا', 'سارة', 'هند', 'رقية', 'زينب', 'أسماء'];
            const lastNames = ['الأحمد', 'المحمد', 'السالم', 'القحطاني', 'الزهراني', 'الشمري', 'المطيري', 'النجار', 'الحربي', 'العتيبي'];
            
            const firstName = gender === 'male' ? 
                maleNames[Math.floor(Math.random() * maleNames.length)] : 
                femaleNames[Math.floor(Math.random() * femaleNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            
            this.students.push({
                id: `STU${i.toString().padStart(3, '0')}`,
                firstName: firstName,
                lastName: lastName,
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace('ال', '')}${i}@email.com`,
                phone: `+9665${Math.floor(Math.random() * 90000000) + 10000000}`,
                birthDate: `${2000 + Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
                gender: gender,
                gradeLevel: grade,
                address: `${city}، المملكة العربية السعودية`,
                status: status,
                registrationDate: `2023-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
                photo: `https://via.placeholder.com/40/${this.getRandomColor()}/FFFFFF?text=${firstName.charAt(0)}`,
                notes: 'ملاحظات عامة'
            });
        }

        this.filteredStudents = [...this.students];
    }

    getRandomColor() {
        const colors = ['4F46E5', 'EC4899', '10B981', 'F59E0B', '6B7280', '8B5CF6', 'EF4444', '06B6D4'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('studentSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            });
        }

        // Filter dropdowns
        const statusFilter = document.getElementById('statusFilter');
        const gradeFilter = document.getElementById('gradeFilter');
        const sortBy = document.getElementById('sortBy');

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }

        if (gradeFilter) {
            gradeFilter.addEventListener('change', (e) => {
                this.filters.grade = e.target.value;
                this.applyFilters();
            });
        }

        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.applyFilters();
            });
        }

        // Add student button
        const addStudentBtn = document.getElementById('addStudentBtn');
        if (addStudentBtn) {
            addStudentBtn.addEventListener('click', () => this.openAddStudentModal());
        }

        // Add student form
        const addStudentForm = document.getElementById('addStudentForm');
        if (addStudentForm) {
            addStudentForm.addEventListener('submit', (e) => this.handleAddStudent(e));
        }

        // Select all checkbox
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => this.handleSelectAll(e));
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshTable');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // Export button
        const exportBtn = document.getElementById('exportStudentsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportStudents());
        }

        // Import button
        const importBtn = document.getElementById('importStudentsBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importStudents());
        }
    }

    applyFilters() {
        let filtered = [...this.students];

        // Apply search filter
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(student => 
                student.firstName.toLowerCase().includes(searchTerm) ||
                student.lastName.toLowerCase().includes(searchTerm) ||
                student.email.toLowerCase().includes(searchTerm) ||
                student.id.toLowerCase().includes(searchTerm) ||
                student.phone.includes(searchTerm)
            );
        }

        // Apply status filter
        if (this.filters.status) {
            filtered = filtered.filter(student => student.status === this.filters.status);
        }

        // Apply grade filter
        if (this.filters.grade) {
            filtered = filtered.filter(student => student.gradeLevel === this.filters.grade);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (this.sortBy) {
                case 'name':
                    aValue = `${a.firstName} ${a.lastName}`;
                    bValue = `${b.firstName} ${b.lastName}`;
                    break;
                case 'date':
                    aValue = new Date(a.registrationDate);
                    bValue = new Date(b.registrationDate);
                    break;
                case 'grade':
                    aValue = a.gradeLevel;
                    bValue = b.gradeLevel;
                    break;
                default:
                    aValue = a[this.sortBy];
                    bValue = b[this.sortBy];
            }

            if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        this.filteredStudents = filtered;
        this.currentPage = 1;
        this.renderStudents();
        this.updatePagination();
    }

    renderStudents() {
        const tbody = document.getElementById('studentsTableBody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.studentsPerPage;
        const endIndex = startIndex + this.studentsPerPage;
        const studentsToShow = this.filteredStudents.slice(startIndex, endIndex);

        tbody.innerHTML = '';

        if (studentsToShow.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                        <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        لا توجد نتائج مطابقة للبحث
                    </td>
                </tr>
            `;
            return;
        }

        studentsToShow.forEach(student => {
            const row = document.createElement('tr');
            row.className = 'fade-in';
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="student-checkbox" data-student-id="${student.id}">
                </td>
                <td>
                    <img src="${student.photo}" alt="${student.firstName}" class="student-photo">
                </td>
                <td>
                    <div class="student-name">${student.firstName} ${student.lastName}</div>
                </td>
                <td>
                    <div class="student-id">${student.id}</div>
                </td>
                <td>${student.email}</td>
                <td>${student.phone}</td>
                <td>${this.getGradeLabel(student.gradeLevel)}</td>
                <td>
                    <span class="status-badge ${student.status}">${this.getStatusLabel(student.status)}</span>
                </td>
                <td>${this.formatDate(student.registrationDate)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action view" onclick="studentsManager.viewStudent('${student.id}')" title="عرض التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action edit" onclick="studentsManager.editStudent('${student.id}')" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" onclick="studentsManager.deleteStudent('${student.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Bind checkbox events
        const checkboxes = tbody.querySelectorAll('.student-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSelectAllState());
        });
    }

    getGradeLabel(grade) {
        const labels = {
            elementary: 'ابتدائي',
            middle: 'متوسط',
            high: 'ثانوي',
            university: 'جامعي'
        };
        return labels[grade] || grade;
    }

    getStatusLabel(status) {
        const labels = {
            active: 'نشط',
            inactive: 'غير نشط',
            graduated: 'خريج',
            suspended: 'موقوف'
        };
        return labels[status] || status;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        // إظهار التاريخ بالتقويم الميلادي وبأرقام إنجليزية
        return date.toLocaleDateString('en-GB');
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredStudents.length / this.studentsPerPage);
        const paginationInfo = document.querySelector('.pagination-info span');
        
        if (paginationInfo) {
            const startIndex = (this.currentPage - 1) * this.studentsPerPage + 1;
            const endIndex = Math.min(this.currentPage * this.studentsPerPage, this.filteredStudents.length);
            paginationInfo.textContent = `عرض ${startIndex}-${endIndex} من ${this.filteredStudents.length} طالب`;
        }

        // Update pagination buttons (simplified for demo)
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

            // Page numbers (show first, current, and last)
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
        const totalPages = Math.ceil(this.filteredStudents.length / this.studentsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderStudents();
            this.updatePagination();
        }
    }

    updateStats() {
        const totalStudents = this.students.length;
        const activeStudents = this.students.filter(s => s.status === 'active').length;
        const newStudents = this.students.filter(s => {
            const regDate = new Date(s.registrationDate);
            const now = new Date();
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            return regDate >= monthAgo;
        }).length;
        const graduates = this.students.filter(s => s.status === 'graduated').length;

        // Update stat cards
        const statNumbers = document.querySelectorAll('.stat-number');
        if (statNumbers.length >= 4) {
            statNumbers[0].textContent = totalStudents.toLocaleString();
            statNumbers[1].textContent = activeStudents.toLocaleString();
            statNumbers[2].textContent = newStudents.toLocaleString();
            statNumbers[3].textContent = graduates.toLocaleString();
        }
    }

    openAddStudentModal() {
        const modal = document.getElementById('addStudentModal');
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

    async handleAddStudent(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        // إنشاء رقم طالب فريد وحزمة بيانات مطابقة لواجهة الإضافة
        const studentId = `STU-${Date.now()}`;
        const newStudent = {
            id: studentId,
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            // لم يعد هناك حقل بريد في النموذج؛ نولّد بريداً داخلياً لتلبية متطلبات الخادم
            email: `no-email-${studentId}@noor.local`,
            phone: formData.get('phone') || '',
            birthDate: formData.get('birthDate'),
            gender: formData.get('gender'),
            address: formData.get('address') || '',
            registrationDate: new Date().toISOString().split('T')[0]
        };

        try {
            this.showLoading(true);
            const result = await this.addStudentToAPI(newStudent);
            
            if (result.success) {
                // Reload students from API
                await this.loadStudentsFromAPI();
                
                // Close modal and show success message
                this.closeModal('addStudentModal');
                this.showNotification('تم إضافة الطالب بنجاح!', 'success');
                
                // Reset form
                form.reset();
            } else {
                this.showNotification('حدث خطأ أثناء إضافة الطالب: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error adding student:', error);
            this.showNotification('حدث خطأ أثناء إضافة الطالب', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    viewStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        const modal = document.getElementById('studentDetailsModal');
        const content = document.getElementById('studentDetailsContent');
        
        if (modal && content) {
            content.innerHTML = `
                <div class="student-profile">
                    <img src="${student.photo}" alt="${student.firstName}" class="student-avatar">
                    <div class="student-info">
                        <h3>${student.firstName} ${student.lastName}</h3>
                        <span class="status-badge ${student.status}">${this.getStatusLabel(student.status)}</span>
                        <div class="student-meta">
                            <div class="meta-item">
                                <span class="meta-label">رقم الطالب</span>
                                <span class="meta-value">${student.id}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">البريد الإلكتروني</span>
                                <span class="meta-value">${student.email}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">رقم الهاتف</span>
                                <span class="meta-value">${student.phone}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">تاريخ الميلاد</span>
                                <span class="meta-value">${this.formatDate(student.birthDate)}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">الجنس</span>
                                <span class="meta-value">${student.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">المرحلة التعليمية</span>
                                <span class="meta-value">${this.getGradeLabel(student.gradeLevel)}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">العنوان</span>
                                <span class="meta-value">${student.address}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">تاريخ التسجيل</span>
                                <span class="meta-value">${this.formatDate(student.registrationDate)}</span>
                            </div>
                        </div>
                        ${student.notes ? `
                            <div class="meta-item" style="margin-top: 1rem;">
                                <span class="meta-label">ملاحظات</span>
                                <span class="meta-value">${student.notes}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    editStudent(studentId) {
        // For demo purposes, just show a message
        this.showNotification('سيتم فتح نموذج التعديل قريباً', 'info');
    }

    async deleteStudent(studentId) {
        if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
            try {
                this.showLoading(true);
                
                // Find student to get database ID
                const student = this.students.find(s => s.id === studentId);
                if (!student || !student.db_id) {
                    this.showNotification('لم يتم العثور على الطالب', 'error');
                    return;
                }
                
                const result = await this.deleteStudentFromAPI(student.db_id);
                
                if (result.success) {
                    // Reload students from API
                    await this.loadStudentsFromAPI();
                    this.showNotification('تم حذف الطالب بنجاح', 'success');
                } else {
                    this.showNotification('حدث خطأ أثناء حذف الطالب: ' + result.message, 'error');
                }
            } catch (error) {
                console.error('Error deleting student:', error);
                this.showNotification('حدث خطأ أثناء حذف الطالب', 'error');
            } finally {
                this.showLoading(false);
            }
        }
    }

    handleSelectAll(e) {
        const checkboxes = document.querySelectorAll('.student-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    }

    updateSelectAllState() {
        const checkboxes = document.querySelectorAll('.student-checkbox');
        const selectAll = document.getElementById('selectAll');
        
        if (selectAll) {
            const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
            selectAll.checked = checkedCount === checkboxes.length;
            selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
        }
    }

    async refreshData() {
        // Refresh data from API
        const refreshBtn = document.getElementById('refreshTable');
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('fa-spin');
            
            try {
                await this.loadStudentsFromAPI();
                this.showNotification('تم تحديث البيانات', 'success');
            } catch (error) {
                console.error('Error refreshing data:', error);
                this.showNotification('حدث خطأ أثناء تحديث البيانات', 'error');
            } finally {
                icon.classList.remove('fa-spin');
            }
        }
    }

    exportStudents() {
        // Create CSV content
        const headers = ['رقم الطالب', 'الاسم الأول', 'الاسم الأخير', 'البريد الإلكتروني', 'الهاتف', 'المرحلة', 'الحالة', 'تاريخ التسجيل'];
        const csvContent = [
            headers.join(','),
            ...this.filteredStudents.map(student => [
                student.id,
                student.firstName,
                student.lastName,
                student.email,
                student.phone,
                this.getGradeLabel(student.gradeLevel),
                this.getStatusLabel(student.status),
                student.registrationDate
            ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        this.showNotification('تم تصدير البيانات بنجاح', 'success');
    }

    importStudents() {
        // Create file input
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
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
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

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize students manager when DOM is loaded
let studentsManager;

document.addEventListener('DOMContentLoaded', () => {
    studentsManager = new StudentsManager();

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

    console.log('🎓 Students Management System Initialized!');
});

// Global function to close modals (for inline onclick handlers)
function closeModal(modalId) {
    if (studentsManager) {
        studentsManager.closeModal(modalId);
    }
}