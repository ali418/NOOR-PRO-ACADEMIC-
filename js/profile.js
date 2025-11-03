// Profile Page JavaScript
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.apiEnrollments = '/api/enrollments';
        this.apiStudentsNode = '/api/students';
        this.apiStudentsPhp = '/api/students.php?action=get';
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.setupTabs();
        this.loadUserCourses();
        this.loadUserCertificates();
        // حمّل الإشعارات مبدئياً
        this.loadNotifications();
    }

    setupEventListeners() {
        // Profile dropdown toggle
        const profileBtn = document.querySelector('.profile-btn');
        const profileDropdown = document.querySelector('.profile-dropdown');
        
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('active');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            if (profileDropdown) {
                profileDropdown.classList.remove('active');
            }
        });

        // Edit info button
        const editBtn = document.getElementById('edit-info-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.toggleEditMode());
        }

        // Change password button
        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => this.showChangePasswordModal());
        }

        // Course filters
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterCourses(filter);
                
                // Update active filter button
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // Remove active class from all tabs and panes
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding pane
                btn.classList.add('active');
                document.getElementById(targetTab).classList.add('active');

                // عند فتح تبويب الإشعارات، نقوم بتحميلها
                if (targetTab === 'notifications') {
                    this.loadNotifications();
                }
            });
        });
    }

    async loadUserData() {
        // محاولة تحديد المستخدم عبر باراميترات الرابط أو التخزين المحلي
        const params = new URLSearchParams(window.location.search);
        const paramEmail = params.get('email');
        const paramId = params.get('id');

        const storedUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const baseUser = storedUser || {
            name: 'أحمد محمد',
            email: 'ahmed@example.com',
            phone: '+966501234567',
            birthDate: '1995-05-15',
            city: 'الرياض',
            educationLevel: 'bachelor',
            enrolledCourses: 0,
            completedCourses: 0,
            pendingCourses: 0
        };

        try {
            let userData = null;

            // أولوية: البحث بالمعرف إن وُجد، ثم بالبريد، ثم بالمستخدم المخزن
            if (paramId) {
                userData = await this.fetchStudentById(paramId);
            }

            if (!userData && (paramEmail || baseUser.email)) {
                const emailToFind = (paramEmail || baseUser.email || '').trim();
                if (emailToFind) {
                    userData = await this.fetchStudentByEmail(emailToFind);
                }
            }

            // إذا لم يتم العثور على بيانات من الـ API، استخدم البيانات المخزنة/الافتراضية
            this.currentUser = userData || baseUser;
            this.displayUserData(this.currentUser);
        } catch (e) {
            console.error('Error loading user profile from API:', e);
            this.currentUser = baseUser;
            this.displayUserData(this.currentUser);
        }
    }

    async fetchStudentById(id) {
        // جرّب Node أولاً ثم PHP كنسخة احتياطية
        try {
            const nodeRes = await fetch(`${this.apiStudentsNode}/${encodeURIComponent(id)}`);
            if (nodeRes.ok) {
                const result = await nodeRes.json();
                if (result && result.success && result.data) {
                    return this.mapStudentToUserData(result.data);
                }
            }
        } catch (err) {
            // تجاهل، وسنحاول PHP
        }

        try {
            const phpRes = await fetch(`${this.apiStudentsPhp}&id=${encodeURIComponent(id)}`);
            if (phpRes.ok) {
                const result = await phpRes.json();
                if (result && result.success && Array.isArray(result.data) && result.data.length > 0) {
                    return this.mapStudentToUserData(result.data[0]);
                }
            }
        } catch (err) {
            // لا شيء
        }

        return null;
    }

    async fetchStudentByEmail(email) {
        const normalized = (email || '').toLowerCase();

        // Node API: جلب جميع الطلاب ثم البحث بالبريد
        try {
            const nodeRes = await fetch(this.apiStudentsNode);
            if (nodeRes.ok) {
                const result = await nodeRes.json();
                if (result && result.success && Array.isArray(result.data)) {
                    const match = result.data.find(s => String(s.email || '').toLowerCase() === normalized);
                    if (match) return this.mapStudentToUserData(match);
                }
            }
        } catch (err) {
            // تجاهل وسنحاول PHP
        }

        // PHP API: البحث باستخدام باراميتر search
        try {
            const phpRes = await fetch(`${this.apiStudentsPhp}&search=${encodeURIComponent(email)}`);
            if (phpRes.ok) {
                const result = await phpRes.json();
                if (result && result.success && Array.isArray(result.data)) {
                    const match = result.data.find(s => String(s.email || '').toLowerCase() === normalized);
                    if (match) return this.mapStudentToUserData(match);
                }
            }
        } catch (err) {
            // لا شيء
        }

        return null;
    }

    mapStudentToUserData(student) {
        // توحيد حقول بيانات الطالب لعرضها في الملف الشخصي
        const first = student.first_name || '';
        const last = student.last_name || '';
        const fullName = `${first} ${last}`.trim() || student.name || '';

        return {
            name: fullName || 'طالب',
            email: student.email || '',
            phone: student.phone || '',
            birthDate: student.date_of_birth || '',
            city: student.address || '',
            educationLevel: '',
            // ستُحدّث هذه لاحقاً من بيانات التسجيلات
            enrolledCourses: 0,
            completedCourses: 0,
            pendingCourses: 0
        };
    }

    displayUserData(userData) {
        // Update profile header
        document.getElementById('student-name').textContent = userData.name;
        document.getElementById('student-email').textContent = userData.email;
        document.querySelector('.profile-name').textContent = userData.name;

        // Update stats
        document.getElementById('enrolled-courses').textContent = userData.enrolledCourses || 0;
        document.getElementById('completed-courses').textContent = userData.completedCourses || 0;
        document.getElementById('pending-courses').textContent = userData.pendingCourses || 0;

        // Update form fields
        document.getElementById('full-name').value = userData.name || '';
        document.getElementById('email').value = userData.email || '';
        document.getElementById('phone').value = userData.phone || '';
        document.getElementById('birth-date').value = userData.birthDate || '';
        document.getElementById('city').value = userData.city || '';
        document.getElementById('education-level').value = userData.educationLevel || '';
    }

    async loadUserCourses() {
        const email = (this.currentUser && this.currentUser.email) ? this.currentUser.email.toLowerCase() : null;
        try {
            const resp = await fetch(this.apiEnrollments);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const result = await resp.json();
            const items = Array.isArray(result) ? result : (result.data || []);
            const userItems = email ? items.filter(i => (i.email || '').toLowerCase() === email) : items;
            const courses = userItems.map(i => ({
                id: i.id,
                title: i.courseName || 'مقرر',
                description: (i.notes && typeof i.notes === 'object' && (i.notes.coursePrice || i.notes.paymentMethod)) ? `السعر: ${i.notes.coursePrice || '—'} - الدفع: ${i.notes.paymentMethod || '—'}` : '',
                status: (i.status === 'approved' || i.status === 'completed' || i.status === 'pending') ? i.status : 'pending',
                progress: i.status === 'completed' ? 100 : 0,
                instructor: '',
                enrollDate: i.submissionDate || new Date().toISOString(),
                whatsappLink: i.whatsappLink || (i.notes && i.notes.whatsappLink) || ''
            }));

            // Update counters from enrollments
            const total = courses.length;
            const approved = courses.filter(c => c.status === 'approved').length;
            const completed = courses.filter(c => c.status === 'completed').length;
            const pending = courses.filter(c => c.status === 'pending').length;
            document.getElementById('enrolled-courses').textContent = String(total);
            document.getElementById('completed-courses').textContent = String(completed);
            document.getElementById('pending-courses').textContent = String(pending);

            this.displayCourses(courses);
        } catch (err) {
            console.warn('فشل جلب طلبات التسجيل، سيتم استخدام البيانات المحلية:', err);
            // Fallback to local JSON file
            try {
                const fallbackResp = await fetch('enrollment-requests.json');
                if (!fallbackResp.ok) throw new Error('HTTP ' + fallbackResp.status);
                const items = await fallbackResp.json();
                const userItems = email ? items.filter(i => (i.email || '').toLowerCase() === email) : items;
                const courses = userItems.map(i => ({
                    id: i.id,
                    title: i.courseName || 'مقرر',
                    description: (i.notes && typeof i.notes === 'object' && (i.notes.coursePrice || i.notes.paymentMethod)) ? `السعر: ${i.notes.coursePrice || '—'} - الدفع: ${i.notes.paymentMethod || '—'}` : '',
                    status: (i.status === 'approved' || i.status === 'completed' || i.status === 'pending') ? i.status : 'pending',
                    progress: i.status === 'completed' ? 100 : 0,
                    instructor: '',
                    enrollDate: i.submissionDate || new Date().toISOString(),
                    whatsappLink: i.whatsappLink || (i.notes && i.notes.whatsappLink) || ''
                }));

                const total = courses.length;
                const approved = courses.filter(c => c.status === 'approved').length;
                const completed = courses.filter(c => c.status === 'completed').length;
                const pending = courses.filter(c => c.status === 'pending').length;
                document.getElementById('enrolled-courses').textContent = String(total);
                document.getElementById('completed-courses').textContent = String(completed);
                document.getElementById('pending-courses').textContent = String(pending);

                this.displayCourses(courses);
            } catch (fallbackErr) {
                console.error('فشل جلب البيانات من الملف المحلي أيضاً:', fallbackErr);
                this.displayCourses([]);
            }
        }
    }

    // إشعارات الطالب
    loadNotifications() {
        const container = document.getElementById('student-notifications');
        if (!container) return;

        const email = (this.currentUser && this.currentUser.email) ? String(this.currentUser.email).toLowerCase() : '';
        let list = [];
        try {
            list = JSON.parse(localStorage.getItem('studentNotifications') || '[]');
        } catch (e) {
            list = [];
        }

        const userItems = list.filter(n => String(n.email || '').toLowerCase() === email);
        userItems.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        if (!userItems.length) {
            container.innerHTML = `
                <div class="empty-state" style="text-align:center;color:#666;padding:30px;">
                    <i class="fas fa-bell" style="font-size:1.5rem;color:#999;"></i>
                    <div style="margin-top:10px;">لا توجد إشعارات حالياً</div>
                </div>
            `;
            return;
        }

        container.innerHTML = userItems.map(n => this.createNotificationCard(n)).join('');
    }

    createNotificationCard(n) {
        const dateStr = n.createdAt ? new Date(n.createdAt).toLocaleString('ar-SA') : '';
        const whatsappBtn = n.whatsappLink ? `
            <a class="btn-whatsapp" href="${n.whatsappLink}" target="_blank" rel="noopener">
                <i class="fab fa-whatsapp"></i>
                <span>الانضمام لمجموعة الواتساب</span>
            </a>
        ` : '';

        return `
            <div class="notification-card" style="background:#fff;border:1px solid #eee;border-radius:10px;padding:15px;margin-bottom:12px;box-shadow:var(--shadow-sm, 0 2px 6px rgba(0,0,0,0.06));">
                <div class="notification-header" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                    <i class="fas fa-bell" style="color:#f39c12"></i>
                    <div style="font-weight:600;">${n.title || 'إشعار'}</div>
                    <div style="margin-inline-start:auto;color:#777;font-size:0.85rem;">${dateStr}</div>
                </div>
                <div class="notification-body" style="color:#444;">
                    <div class="notification-message">${n.message || ''}</div>
                    ${n.courseName ? `<div class="notification-course" style="margin-top:8px;color:#555;"><i class="fas fa-book"></i> ${n.courseName}</div>` : ''}
                    ${whatsappBtn ? `<div style="margin-top:10px;">${whatsappBtn}</div>` : ''}
                </div>
            </div>
        `;
    }

    displayCourses(courses) {
        const coursesContainer = document.getElementById('student-courses');
        if (!coursesContainer) return;

        coursesContainer.innerHTML = '';

        courses.forEach(course => {
            const courseCard = this.createCourseCard(course);
            coursesContainer.appendChild(courseCard);
        });
    }

    createCourseCard(course) {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.dataset.status = course.status;

        const statusText = {
            'approved': 'مقبول',
            'pending': 'في الانتظار',
            'completed': 'مكتمل'
        };

        card.innerHTML = `
            <div class="course-status ${course.status}">${statusText[course.status]}</div>
            <h4>${course.title}</h4>
            <p>${course.description}</p>
            <div class="course-progress">
                <div class="progress-label">
                    <span>التقدم</span>
                    <span>${course.progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${course.progress}%"></div>
                </div>
            </div>
            <div class="course-info">
                <p><strong>المدرس:</strong> ${course.instructor}</p>
                <p><strong>تاريخ التسجيل:</strong> ${new Date(course.enrollDate).toLocaleDateString('ar-SA')}</p>
            </div>
            ${course.status === 'approved' && course.whatsappLink ? `
            <div class="course-actions" style="margin-top: 10px;">
                <a class="btn-secondary" href="${course.whatsappLink}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;">
                    <i class="fab fa-whatsapp"></i>
                    <span>الانضمام إلى مجموعة الواتساب</span>
                </a>
            </div>
            ` : ''}
        `;

        return card;
    }

    filterCourses(filter) {
        const courseCards = document.querySelectorAll('.course-card');
        
        courseCards.forEach(card => {
            if (filter === 'all' || card.dataset.status === filter) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    loadUserCertificates() {
        // Sample certificates data
        const certificates = [
            {
                id: 1,
                title: 'شهادة إتمام دورة البرمجة',
                course: 'أساسيات البرمجة',
                date: '2024-01-30',
                downloadUrl: '#'
            }
        ];

        this.displayCertificates(certificates);
    }

    displayCertificates(certificates) {
        const certificatesContainer = document.getElementById('student-certificates');
        if (!certificatesContainer) return;

        if (certificates.length === 0) {
            certificatesContainer.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 40px;">لا توجد شهادات متاحة حالياً</p>';
            return;
        }

        certificatesContainer.innerHTML = '';

        certificates.forEach(certificate => {
            const certificateCard = this.createCertificateCard(certificate);
            certificatesContainer.appendChild(certificateCard);
        });
    }

    createCertificateCard(certificate) {
        const card = document.createElement('div');
        card.className = 'certificate-card';

        card.innerHTML = `
            <div class="certificate-icon">
                <i class="fas fa-certificate"></i>
            </div>
            <h4>${certificate.title}</h4>
            <p class="certificate-date">${new Date(certificate.date).toLocaleDateString('ar-SA')}</p>
            <button class="download-btn" onclick="window.open('${certificate.downloadUrl}', '_blank')">
                <i class="fas fa-download"></i>
                تحميل الشهادة
            </button>
        `;

        return card;
    }

    toggleEditMode() {
        const inputs = document.querySelectorAll('#personal-info input, #personal-info select');
        const editBtn = document.getElementById('edit-info-btn');
        const isEditing = editBtn.textContent.includes('حفظ');

        if (isEditing) {
            // Save mode
            this.saveUserData();
            inputs.forEach(input => {
                input.readOnly = true;
                input.disabled = true;
            });
            editBtn.innerHTML = '<i class="fas fa-edit"></i><span>تعديل المعلومات</span>';
        } else {
            // Edit mode
            inputs.forEach(input => {
                input.readOnly = false;
                input.disabled = false;
            });
            editBtn.innerHTML = '<i class="fas fa-save"></i><span>حفظ التغييرات</span>';
        }
    }

    saveUserData() {
        const userData = {
            ...this.currentUser,
            name: document.getElementById('full-name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            birthDate: document.getElementById('birth-date').value,
            city: document.getElementById('city').value,
            educationLevel: document.getElementById('education-level').value
        };

        localStorage.setItem('currentUser', JSON.stringify(userData));
        this.currentUser = userData;
        this.displayUserData(userData);

        // Show success message
        this.showNotification('تم حفظ التغييرات بنجاح', 'success');
    }

    showChangePasswordModal() {
        // Create modal for changing password
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>تغيير كلمة المرور</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>كلمة المرور الحالية</label>
                        <input type="password" id="current-password" required>
                    </div>
                    <div class="form-group">
                        <label>كلمة المرور الجديدة</label>
                        <input type="password" id="new-password" required>
                    </div>
                    <div class="form-group">
                        <label>تأكيد كلمة المرور الجديدة</label>
                        <input type="password" id="confirm-password" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button class="btn-primary" onclick="profileManager.changePassword()">تغيير كلمة المرور</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal when clicking outside or on close button
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-close')) {
                modal.remove();
            }
        });
    }

    changePassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showNotification('يرجى ملء جميع الحقول', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('كلمة المرور الجديدة غير متطابقة', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
            return;
        }

        // In real app, this would be an API call
        this.showNotification('تم تغيير كلمة المرور بنجاح', 'success');
        document.querySelector('.modal-overlay').remove();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    logout() {
        if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html';
        }
    }
}

// Initialize profile manager when page loads
let profileManager;
document.addEventListener('DOMContentLoaded', () => {
    profileManager = new ProfileManager();
});

// Add modal styles dynamically
const modalStyles = `
<style>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.modal-content {
    background: var(--white);
    border-radius: var(--border-radius-lg);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--gray-200);
}

.modal-header h3 {
    margin: 0;
    color: var(--gray-800);
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--gray-500);
}

.modal-body {
    padding: 20px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: var(--gray-700);
}

.form-group input {
    width: 100%;
    padding: 12px;
    border: 2px solid var(--gray-200);
    border-radius: var(--border-radius);
    font-size: 1rem;
}

.form-group input:focus {
    outline: none;
    border-color: var(--primary-color);
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 20px;
    border-top: 1px solid var(--gray-200);
}

.btn-primary {
    background: var(--primary-color);
    color: var(--white);
    border: none;
    padding: 10px 20px;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-weight: 500;
}

.btn-primary:hover {
    background: var(--secondary-color);
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--white);
    padding: 15px 20px;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 10001;
    animation: slideIn 0.3s ease;
}

.notification.success {
    border-left: 4px solid var(--success-color);
    color: var(--success-color);
}

.notification.error {
    border-left: 4px solid var(--danger-color);
    color: var(--danger-color);
}

.notification.info {
    border-left: 4px solid var(--primary-color);
    color: var(--primary-color);
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', modalStyles);