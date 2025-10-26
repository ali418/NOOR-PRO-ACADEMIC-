// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.enrollments = [];
        this.currentEnrollment = null;
        this.init();
    }

    async init() {
        await this.loadEnrollments();
        await this.loadDashboardStats();
        this.bindEvents();
        this.updateStats();
        this.displayEnrollments();
    }

    async loadDashboardStats() {
        try {
            const response = await fetch('api/stats.php');
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.updateDashboardStats(result.data);
                    console.log('Dashboard stats loaded from database:', result.data);
                } else {
                    throw new Error(result.error || 'Failed to load stats');
                }
            } else {
                throw new Error('Failed to fetch stats from API');
            }
        } catch (error) {
            console.log('API not available for stats, using default values:', error.message);
            this.updateDashboardStats({
                totalStudents: 0,
                totalCourses: 0,
                activeUsers: 0,
                systemStatus: 0
            });
        }
    }

    updateDashboardStats(stats) {
        const totalStudentsElement = document.getElementById('totalStudents');
        const totalCoursesElement = document.getElementById('totalCourses');
        const activeUsersElement = document.getElementById('activeUsers');
        const systemStatusElement = document.getElementById('systemStatus');

        if (totalStudentsElement) {
            totalStudentsElement.textContent = stats.totalStudents || 0;
        }
        
        if (totalCoursesElement) {
            totalCoursesElement.textContent = stats.totalCourses || 0;
        }
        
        if (activeUsersElement) {
            activeUsersElement.textContent = stats.activeUsers || 0;
        }
        
        if (systemStatusElement) {
            systemStatusElement.textContent = stats.systemStatus ? `${stats.systemStatus}%` : '0%';
        }

        console.log('Dashboard stats updated:', stats);
    }

    async loadEnrollments() {
        try {
            const response = await fetch('api/enrollments.php');
            if (response.ok) {
                const data = await response.json();
                this.enrollments = data;
                console.log('Enrollments loaded from database:', this.enrollments.length);
            } else {
                throw new Error('Failed to load from API');
            }
        } catch (error) {
            console.log('API not available, checking localStorage:', error.message);
            
            const stored = localStorage.getItem('noorProEnrollments');
            if (stored) {
                const enrollmentData = JSON.parse(stored);
                this.enrollments = enrollmentData.map((enrollment, index) => ({
                    id: `REQ-${String(index + 1).padStart(3, '0')}`,
                    studentName: enrollment.fullName,
                    email: enrollment.email,
                    phone: enrollment.phone,
                    courseId: enrollment.courseId,
                    courseName: enrollment.courseName,
                    coursePrice: enrollment.coursePrice || '0',
                    paymentMethod: enrollment.paymentMethod || 'not-specified',
                    paymentDetails: enrollment.paymentDetails || {},
                    receiptFile: enrollment.receiptFile || '',
                    status: enrollment.status || 'pending',
                    submissionDate: enrollment.submissionDate || new Date().toISOString(),
                    notes: enrollment.notes || ''
                }));
                console.log('Enrollments loaded from localStorage:', this.enrollments.length);
            } else {
                this.enrollments = [];
                console.log('No enrollments found in localStorage');
            }
        }
    }

    bindEvents() {
        const searchInput = document.getElementById('searchInput');
        const courseFilter = document.getElementById('courseFilter');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterEnrollments());
        }

        if (courseFilter) {
            courseFilter.addEventListener('change', () => this.filterEnrollments());
        }
    }

    filterEnrollments() {
        this.displayEnrollments();
    }

    updateStats() {
        const pending = this.enrollments.filter(e => e.status === 'pending').length;
        const approved = this.enrollments.filter(e => e.status === 'approved').length;
        const rejected = this.enrollments.filter(e => e.status === 'rejected').length;
        const total = this.enrollments.length;

        const pendingElement = document.getElementById('pendingCount');
        const approvedElement = document.getElementById('approvedCount');
        const rejectedElement = document.getElementById('rejectedCount');
        const totalElement = document.getElementById('totalCount');

        if (pendingElement) pendingElement.textContent = pending;
        if (approvedElement) approvedElement.textContent = approved;
        if (rejectedElement) rejectedElement.textContent = rejected;
        if (totalElement) totalElement.textContent = total;
    }

    displayEnrollments(filter = 'all') {
        let filteredEnrollments = this.enrollments;

        if (filter !== 'all') {
            filteredEnrollments = this.enrollments.filter(e => e.status === filter);
        }

        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const courseFilter = document.getElementById('courseFilter')?.value || '';

        if (searchTerm) {
            filteredEnrollments = filteredEnrollments.filter(e => 
                e.studentName.toLowerCase().includes(searchTerm) ||
                e.id.toLowerCase().includes(searchTerm) ||
                e.courseName.toLowerCase().includes(searchTerm) ||
                e.email.toLowerCase().includes(searchTerm)
            );
        }

        if (courseFilter) {
            filteredEnrollments = filteredEnrollments.filter(e => e.courseId === courseFilter);
        }

        this.renderEnrollments('pendingEnrollments', filteredEnrollments.filter(e => e.status === 'pending'));
        this.renderEnrollments('approvedEnrollments', filteredEnrollments.filter(e => e.status === 'approved'));
        this.renderEnrollments('rejectedEnrollments', filteredEnrollments.filter(e => e.status === 'rejected'));
        this.renderEnrollments('allEnrollments', filteredEnrollments);
    }

    renderEnrollments(containerId, enrollments) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (enrollments.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>لا توجد طلبات</h3>
                    <p>لم يتم العثور على أي طلبات في هذه الفئة</p>
                </div>
            `;
            return;
        }

        container.innerHTML = enrollments.map(enrollment => this.createEnrollmentCard(enrollment)).join('');
    }

    createEnrollmentCard(enrollment) {
        const statusClass = `status-${enrollment.status}`;
        const statusText = {
            'pending': 'معلق',
            'approved': 'موافق عليه',
            'rejected': 'مرفوض'
        }[enrollment.status];

        const paymentMethodText = {
            'mobile-money': 'محفظة إلكترونية',
            'areeba': 'أريبا',
            'amteen': 'أمتين',
            'bank-transfer': 'تحويل بنكي',
            'in-person': 'دفع مباشر'
        }[enrollment.paymentMethod] || enrollment.paymentMethod;

        return `
            <div class="enrollment-card">
                <div class="enrollment-header">
                    <div class="enrollment-id">${enrollment.id}</div>
                    <div class="enrollment-status ${statusClass}">${statusText}</div>
                </div>

                <div class="enrollment-details">
                    <div class="detail-section">
                        <h4><i class="fas fa-user"></i> بيانات الطالب</h4>
                        <div class="detail-item">
                            <span class="detail-label">الاسم:</span>
                            <span class="detail-value">${enrollment.studentName}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">البريد الإلكتروني:</span>
                            <span class="detail-value">${enrollment.email}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">رقم الهاتف:</span>
                            <span class="detail-value">${enrollment.phone}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">تاريخ التقديم:</span>
                            <span class="detail-value">${new Date(enrollment.submissionDate).toLocaleDateString('ar-SA')}</span>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4><i class="fas fa-book"></i> بيانات الكورس</h4>
                        <div class="detail-item">
                            <span class="detail-label">اسم الكورس:</span>
                            <span class="detail-value">${enrollment.courseName}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">السعر:</span>
                            <span class="detail-value">${enrollment.coursePrice} دولار</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">طريقة الدفع:</span>
                            <span class="detail-value">${paymentMethodText}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">المبلغ المدفوع:</span>
                            <span class="detail-value">${enrollment.paymentDetails.amount || 0} دولار</span>
                        </div>
                        ${enrollment.paymentDetails.transactionId ? `
                        <div class="detail-item">
                            <span class="detail-label">رقم المعاملة:</span>
                            <span class="detail-value">${enrollment.paymentDetails.transactionId}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                ${enrollment.receiptFile ? `
                <div class="receipt-preview">
                    <h4><i class="fas fa-receipt"></i> إيصال الدفع</h4>
                    <img src="${enrollment.receiptFile}" alt="إيصال الدفع" class="receipt-image" 
                         onclick="adminDashboard.showReceiptModal('${enrollment.receiptFile}')">
                    <p style="margin-top: 10px; color: #666; font-size: 0.9rem;">اضغط على الصورة لعرضها بحجم أكبر</p>
                </div>
                ` : ''}

                ${enrollment.paymentDetails.notes ? `
                <div class="detail-section">
                    <h4><i class="fas fa-sticky-note"></i> ملاحظات الطالب</h4>
                    <p>${enrollment.paymentDetails.notes}</p>
                </div>
                ` : ''}

                <div class="enrollment-actions">
                    ${enrollment.status === 'pending' ? `
                        <button class="btn-approve" onclick="adminDashboard.showApprovalModal('${enrollment.id}')">
                            <i class="fas fa-check"></i> موافقة
                        </button>
                        <button class="btn-reject" onclick="adminDashboard.rejectEnrollment('${enrollment.id}')">
                            <i class="fas fa-times"></i> رفض
                        </button>
                        <button class="btn-view-students" onclick="adminDashboard.viewStudentDetails('${enrollment.id}')">
                            <i class="fas fa-user-graduate"></i> عرض تفاصيل الطالب
                        </button>
                    ` : ''}
                    <button class="btn-view-details" onclick="adminDashboard.viewEnrollmentDetails('${enrollment.id}')">
                        <i class="fas fa-eye"></i> عرض التفاصيل
                    </button>
                </div>
            </div>
        `;
    }

    showApprovalModal(enrollmentId) {
        this.currentEnrollment = this.enrollments.find(e => e.id === enrollmentId);
        if (!this.currentEnrollment) return;

        let welcomeMessage = '';
        let whatsappLink = '';
        
        if (typeof WelcomeSystem !== 'undefined') {
            const welcomeSystem = new WelcomeSystem();
            const template = welcomeSystem.generateWelcomeMessage(this.currentEnrollment);
            welcomeMessage = template.message;
            whatsappLink = template.whatsappLink;
        } else {
            welcomeMessage = `مرحباً ${this.currentEnrollment.studentName}!\n\nتم قبول طلب التسجيل في دورة ${this.currentEnrollment.courseName}.\n\nتفاصيل الدورة:\n- تاريخ البدء: قريباً\n- المدة: حسب الدورة\n- الوقت: سيتم إشعارك\n\nسيتم التواصل معك قريباً لتزويدك بتفاصيل الوصول.\n\nمرحباً بك في مركز نور برو الأكاديمي!`;
            whatsappLink = 'https://wa.me/249123456789';
        }
        
        const welcomeMessageElement = document.getElementById('welcomeMessage');
        const whatsappLinkElement = document.getElementById('whatsappLink');
        const courseAccessElement = document.getElementById('courseAccess');
        
        if (welcomeMessageElement) welcomeMessageElement.value = welcomeMessage;
        if (whatsappLinkElement) whatsappLinkElement.value = whatsappLink;
        if (courseAccessElement) courseAccessElement.value = `رابط الوصول للدورة: ${this.currentEnrollment.courseName}`;

        const modal = document.getElementById('approvalModal');
        if (modal) modal.style.display = 'block';
    }

    confirmApproval() {
        if (!this.currentEnrollment) return;

        const welcomeMessage = document.getElementById('welcomeMessage')?.value || '';
        const whatsappLink = document.getElementById('whatsappLink')?.value || '';
        const courseAccess = document.getElementById('courseAccess')?.value || '';

        this.currentEnrollment.status = 'approved';
        this.currentEnrollment.approvalDate = new Date().toISOString();
        this.currentEnrollment.welcomeMessage = welcomeMessage;
        this.currentEnrollment.whatsappLink = whatsappLink;
        this.currentEnrollment.courseAccess = courseAccess;

        this.saveEnrollments();
        this.updateStats();
        this.displayEnrollments();

        this.closeModal('approvalModal');
        this.showNotification('تم قبول الطلب وإرسال رسالة الترحيب بنجاح!', 'success');

        if (typeof WelcomeSystem !== 'undefined') {
            const welcomeSystem = new WelcomeSystem();
            welcomeSystem.sendWelcomeNotifications(
                this.currentEnrollment, 
                welcomeMessage, 
                whatsappLink
            ).then(result => {
                if (result.success) {
                    this.showNotification(`تم إرسال رسالة الترحيب إلى ${this.currentEnrollment.studentName}`, 'success');
                } else {
                    this.showNotification('تم قبول الطلب ولكن فشل في إرسال الرسالة', 'error');
                }
            });
        } else {
            this.sendWelcomeMessage(this.currentEnrollment);
        }
    }

    rejectEnrollment(enrollmentId) {
        if (confirm('هل أنت متأكد من رفض هذا الطلب؟')) {
            const enrollment = this.enrollments.find(e => e.id === enrollmentId);
            if (enrollment) {
                enrollment.status = 'rejected';
                enrollment.rejectionDate = new Date().toISOString();
                
                this.saveEnrollments();
                this.updateStats();
                this.displayEnrollments();
                
                this.showNotification('تم رفض الطلب', 'error');
            }
        }
    }

    viewEnrollmentDetails(enrollmentId) {
        const enrollment = this.enrollments.find(e => e.id === enrollmentId);
        if (!enrollment) return;

        alert(`تفاصيل الطلب ${enrollment.id}:\n\nالطالب: ${enrollment.studentName}\nالكورس: ${enrollment.courseName}\nالحالة: ${enrollment.status}\nتاريخ التقديم: ${new Date(enrollment.submissionDate).toLocaleDateString('ar-SA')}`);
    }
    
    viewStudentDetails(enrollmentId) {
        const enrollment = this.enrollments.find(e => e.id === enrollmentId);
        if (!enrollment) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.style.zIndex = '1000';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.maxWidth = '800px';
        modalContent.style.margin = '50px auto';
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '8px';
        modalContent.style.maxHeight = '80vh';
        modalContent.style.overflowY = 'auto';
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.innerHTML = '&times;';
        closeBtn.style.float = 'right';
        closeBtn.style.fontSize = '28px';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = function() {
            document.body.removeChild(modal);
        };
        
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `<h2>بيانات الطالب: ${enrollment.studentName}</h2>`;
        header.appendChild(closeBtn);
        
        const body = document.createElement('div');
        body.className = 'modal-body';
        
        const studentInfo = document.createElement('div');
        studentInfo.className = 'student-details';
        studentInfo.innerHTML = `
            <h3><i class="fas fa-user"></i> معلومات الطالب</h3>
            <div class="detail-item">
                <span class="detail-label">الاسم الكامل:</span>
                <span class="detail-value">${enrollment.studentName}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">البريد الإلكتروني:</span>
                <span class="detail-value">${enrollment.email}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">رقم الهاتف:</span>
                <span class="detail-value">${enrollment.phone}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">تاريخ التقديم:</span>
                <span class="detail-value">${new Date(enrollment.submissionDate).toLocaleDateString('ar-SA')}</span>
            </div>
        `;
        
        if (enrollment.receiptFile) {
            const receiptSection = document.createElement('div');
            receiptSection.className = 'receipt-section';
            receiptSection.innerHTML = `
                <h3><i class="fas fa-receipt"></i> إيصال الدفع</h3>
                <div class="receipt-image-container">
                    <img src="${enrollment.receiptFile}" alt="إيصال الدفع" style="max-width: 100%; max-height: 400px;">
                </div>
            `;
            body.appendChild(receiptSection);
        }
        
        const paymentMethodText = {
            'mobile-money': 'محفظة إلكترونية',
            'areeba': 'أريبا',
            'amteen': 'أمتين',
            'bank-transfer': 'تحويل بنكي',
            'in-person': 'دفع مباشر'
        }[enrollment.paymentMethod] || enrollment.paymentMethod;
        
        const paymentInfo = document.createElement('div');
        paymentInfo.className = 'payment-details';
        paymentInfo.innerHTML = `
            <h3><i class="fas fa-money-bill-wave"></i> تفاصيل الدفع</h3>
            <div class="detail-item">
                <span class="detail-label">طريقة الدفع:</span>
                <span class="detail-value">${paymentMethodText}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">المبلغ المدفوع:</span>
                <span class="detail-value">${enrollment.paymentDetails.amount || 0} دولار</span>
            </div>
            ${enrollment.paymentDetails.transactionId ? `
            <div class="detail-item">
                <span class="detail-label">رقم المعاملة:</span>
                <span class="detail-value">${enrollment.paymentDetails.transactionId}</span>
            </div>
            ` : ''}
        `;
        
        body.insertBefore(studentInfo, body.firstChild);
        body.appendChild(paymentInfo);
        
        if (enrollment.status === 'pending') {
            const actions = document.createElement('div');
            actions.className = 'modal-actions';
            actions.style.marginTop = '20px';
            actions.innerHTML = `
                <button class="btn-approve" onclick="adminDashboard.showApprovalModal('${enrollment.id}'); document.body.removeChild(this.closest('.modal'));">
                    <i class="fas fa-check"></i> موافقة
                </button>
                <button class="btn-reject" onclick="adminDashboard.rejectEnrollment('${enrollment.id}'); document.body.removeChild(this.closest('.modal'));">
                    <i class="fas fa-times"></i> رفض
                </button>
            `;
            body.appendChild(actions);
        }
        
        modalContent.appendChild(header);
        modalContent.appendChild(body);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    showReceiptModal(receiptUrl) {
        const modal = document.createElement('div');
        modal.className = 'receipt-modal';
        modal.style.display = 'block';
        modal.style.position = 'fixed';
        modal.style.zIndex = '2000';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
        
        const modalContent = document.createElement('div');
        modalContent.style.position = 'relative';
        modalContent.style.margin = '5% auto';
        modalContent.style.width = '90%';
        modalContent.style.maxWidth = '800px';
        modalContent.style.textAlign = 'center';
        
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '15px';
        closeBtn.style.right = '35px';
        closeBtn.style.color = '#f1f1f1';
        closeBtn.style.fontSize = '40px';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = function() {
            document.body.removeChild(modal);
        };
        
        const img = document.createElement('img');
        img.src = receiptUrl;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.maxHeight = '80vh';
        
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(img);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        modal.onclick = function(event) {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        };
    }

    saveEnrollments() {
        try {
            localStorage.setItem('noorProEnrollments', JSON.stringify(this.enrollments));
            console.log('Enrollments saved to localStorage');
        } catch (error) {
            console.error('Error saving enrollments:', error);
        }
    }

    sendWelcomeMessage(enrollment) {
        console.log('Sending welcome message to:', enrollment.studentName);
        console.log('Message:', enrollment.welcomeMessage);
        console.log('WhatsApp Link:', enrollment.whatsappLink);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '9999';
        notification.style.maxWidth = '300px';
        notification.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        
        const colors = {
            success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
            error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
            info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' }
        };
        
        const color = colors[type] || colors.info;
        notification.style.backgroundColor = color.bg;
        notification.style.border = `1px solid ${color.border}`;
        notification.style.color = color.text;
        
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
    }
}

// Global functions for onclick handlers
let adminDashboard;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    adminDashboard = new AdminDashboard();
});

// Global functions that can be called from HTML
function showApprovalModal(enrollmentId) {
    if (adminDashboard) {
        adminDashboard.showApprovalModal(enrollmentId);
    }
}

function confirmApproval() {
    if (adminDashboard) {
        adminDashboard.confirmApproval();
    }
}

function rejectEnrollment(enrollmentId) {
    if (adminDashboard) {
        adminDashboard.rejectEnrollment(enrollmentId);
    }
}

function viewEnrollmentDetails(enrollmentId) {
    if (adminDashboard) {
        adminDashboard.viewEnrollmentDetails(enrollmentId);
    }
}

function viewStudentDetails(enrollmentId) {
    if (adminDashboard) {
        adminDashboard.viewStudentDetails(enrollmentId);
    }
}

function showReceiptModal(receiptUrl) {
    if (adminDashboard) {
        adminDashboard.showReceiptModal(receiptUrl);
    }
}

function closeModal(modalId) {
    if (adminDashboard) {
        adminDashboard.closeModal(modalId);
    }
}

function filterEnrollments(status) {
    if (adminDashboard) {
        adminDashboard.displayEnrollments(status);
    }
}