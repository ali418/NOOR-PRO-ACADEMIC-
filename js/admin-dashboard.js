// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.enrollments = [];
        this.currentEnrollment = null;
        this.init();
    }

    async init() {
        await this.loadEnrollments();
        this.bindEvents();
        this.updateStats();
        this.displayEnrollments();
    }

    async loadEnrollments() {
        try {
            // محاولة تحميل البيانات من API
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
            
            // في حالة عدم توفر API، تحميل من localStorage
            const stored = localStorage.getItem('noorProEnrollments');
            if (stored) {
                const enrollmentData = JSON.parse(stored);
                // Convert enrollment data to admin dashboard format
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

    addSampleData() {
        // تم إزالة البيانات التجريبية - سيتم تحميل البيانات من قاعدة البيانات
        console.log('Sample data removed - data will be loaded from database');
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const courseFilter = document.getElementById('courseFilter');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterEnrollments());
        }

        if (courseFilter) {
            courseFilter.addEventListener('change', () => this.filterEnrollments());
        }
    }

    updateStats() {
        const pending = this.enrollments.filter(e => e.status === 'pending').length;
        const approved = this.enrollments.filter(e => e.status === 'approved').length;
        const rejected = this.enrollments.filter(e => e.status === 'rejected').length;
        const total = this.enrollments.length;

        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('approvedCount').textContent = approved;
        document.getElementById('rejectedCount').textContent = rejected;
        document.getElementById('totalCount').textContent = total;
    }

    displayEnrollments(filter = 'all') {
        let filteredEnrollments = this.enrollments;

        if (filter !== 'all') {
            filteredEnrollments = this.enrollments.filter(e => e.status === filter);
        }

        // Apply search and course filters
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

        // Display in appropriate containers
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
        console.log('Creating card for enrollment:', enrollment.id, 'Status:', enrollment.status);
        console.log('Is status pending?', enrollment.status === 'pending');
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
                            <span class="detail-value">${enrollment.paymentDetails.amount} دولار</span>
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
                         onclick="showReceiptModal('${enrollment.receiptFile}')">
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
                        <button class="btn-approve" onclick="showApprovalModal('${enrollment.id}')">
                            <i class="fas fa-check"></i> موافقة
                        </button>
                        <button class="btn-reject" onclick="rejectEnrollment('${enrollment.id}')">
                            <i class="fas fa-times"></i> رفض
                        </button>
                        <button class="btn-view-students" onclick="viewStudentDetails('${enrollment.id}')">
                            <i class="fas fa-user-graduate"></i> عرض تفاصيل الطالب
                        </button>
                    ` : ''}
                    <button class="btn-view-details" onclick="viewEnrollmentDetails('${enrollment.id}')">
                        <i class="fas fa-eye"></i> عرض التفاصيل
                    </button>
                </div>
            </div>
        `;
    }

    showApprovalModal(enrollmentId) {
        this.currentEnrollment = this.enrollments.find(e => e.id === enrollmentId);
        if (!this.currentEnrollment) return;

        // Pre-fill welcome message using WelcomeSystem if available
        let welcomeMessage = '';
        let whatsappLink = '';
        
        if (typeof WelcomeSystem !== 'undefined') {
            const welcomeSystem = new WelcomeSystem();
            const template = welcomeSystem.generateWelcomeMessage(this.currentEnrollment);
            welcomeMessage = template.message;
            whatsappLink = template.whatsappLink;
        } else {
            // Fallback to default message
            welcomeMessage = `مرحباً ${this.currentEnrollment.studentName}!\n\nتم قبول طلب التسجيل في دورة ${this.currentEnrollment.courseName}.\n\nتفاصيل الدورة:\n- تاريخ البدء: قريباً\n- المدة: حسب الدورة\n- الوقت: سيتم إشعارك\n\nسيتم التواصل معك قريباً لتزويدك بتفاصيل الوصول.\n\nمرحباً بك في مركز نور برو الأكاديمي!`;
            whatsappLink = 'https://wa.me/249123456789';
        }
        
        document.getElementById('welcomeMessage').value = welcomeMessage;
        document.getElementById('whatsappLink').value = whatsappLink;
        document.getElementById('courseAccess').value = `رابط الوصول للدورة: ${this.currentEnrollment.courseName}`;

        document.getElementById('approvalModal').style.display = 'block';
    }

    confirmApproval() {
        if (!this.currentEnrollment) return;

        const welcomeMessage = document.getElementById('welcomeMessage').value;
        const whatsappLink = document.getElementById('whatsappLink').value;
        const courseAccess = document.getElementById('courseAccess').value;

        // Update enrollment status
        this.currentEnrollment.status = 'approved';
        this.currentEnrollment.approvalDate = new Date().toISOString();
        this.currentEnrollment.welcomeMessage = welcomeMessage;
        this.currentEnrollment.whatsappLink = whatsappLink;
        this.currentEnrollment.courseAccess = courseAccess;

        this.saveEnrollments();
        this.updateStats();
        this.displayEnrollments();

        // Close modal
        this.closeModal('approvalModal');

        // Show success message
        this.showNotification('تم قبول الطلب وإرسال رسالة الترحيب بنجاح!', 'success');

        // Send welcome message using WelcomeSystem
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
            // Fallback to original method
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

        // Create detailed view modal (simplified for this example)
        alert(`تفاصيل الطلب ${enrollment.id}:\n\nالطالب: ${enrollment.studentName}\nالكورس: ${enrollment.courseName}\nالحالة: ${enrollment.status}\nتاريخ التقديم: ${new Date(enrollment.submissionDate).toLocaleDateString('ar-SA')}`);
    }
    
    viewStudentDetails(enrollmentId) {
        const enrollment = this.enrollments.find(e => e.id === enrollmentId);
        if (enrollment) {
            // إنشاء نافذة منبثقة لعرض بيانات الطالب وصورة الإيصال
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.style.zIndex = '1000';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            modalContent.style.maxWidth = '800px';
            
            const closeBtn = document.createElement('span');
            closeBtn.className = 'close';
            closeBtn.innerHTML = '&times;';
            closeBtn.onclick = function() {
                document.body.removeChild(modal);
            };
            
            const header = document.createElement('div');
            header.className = 'modal-header';
            header.innerHTML = `<h2>بيانات الطالب: ${enrollment.studentName}</h2>`;
            header.appendChild(closeBtn);
            
            const body = document.createElement('div');
            body.className = 'modal-body';
            
            // بيانات الطالب
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
            
            // صورة الإيصال إذا كانت موجودة
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
            
            // تفاصيل الدفع
            const paymentInfo = document.createElement('div');
            paymentInfo.className = 'payment-details';
            
            const paymentMethodText = {
                'mobile-money': 'محفظة إلكترونية',
                'areeba': 'أريبا',
                'amteen': 'أمتين',
                'bank-transfer': 'تحويل بنكي',
                'in-person': 'دفع مباشر'
            }[enrollment.paymentMethod] || enrollment.paymentMethod;
            
            paymentInfo.innerHTML = `
                <h3><i class="fas fa-money-bill-wave"></i> تفاصيل الدفع</h3>
                <div class="detail-item">
                    <span class="detail-label">طريقة الدفع:</span>
                    <span class="detail-value">${paymentMethodText}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">المبلغ المدفوع:</span>
                    <span class="detail-value">${enrollment.paymentDetails.amount} دولار</span>
                </div>
                ${enrollment.paymentDetails.transactionId ? `
                <div class="detail-item">
                    <span class="detail-label">رقم المعاملة:</span>
                    <span class="detail-value">${enrollment.paymentDetails.transactionId}</span>
                </div>
                ` : ''}
            `;
            
            // إضافة الأقسام إلى النافذة المنبثقة
            body.insertBefore(studentInfo, body.firstChild);
            body.appendChild(paymentInfo);
            
            // أزرار الإجراءات
            const actions = document.createElement('div');
            actions.className = 'modal-actions';
            actions.innerHTML = `
                <button class="btn-approve" onclick="showApprovalModal('${enrollment.id}')">
                    <i class="fas fa-check"></i> موافقة
                </button>
                <button class="btn-reject" onclick="rejectEnrollment('${enrollment.id}')">
                    <i class="fas fa-times"></i> رفض
                </button>
            `;
            
            // تجميع النافذة المنبثقة
            modalContent.appendChild(header);
            modalContent.appendChild(body);
            modalContent.appendChild(actions);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // إغلاق النافذة عند النقر خارجها
            window.onclick = function(event) {
                if (event.target === modal) {
                    document.body.removeChild(modal);
                }
            };
        }
    }

    sendWelcomeMessage(enrollment) {
        // In a real application, this would send an email or SMS
        console.log('Sending welcome message to:', enrollment.email);
        console.log('Message:', enrollment.welcomeMessage);
        console.log('WhatsApp Link:', enrollment.whatsappLink);
        
        // Simulate API call
        setTimeout(() => {
            this.showNotification(`تم إرسال رسالة الترحيب إلى ${enrollment.studentName}`, 'success');
        }, 1000);
    }

    filterEnrollments() {
        this.displayEnrollments();
    }

    saveEnrollments() {
        // Save enrollments back to localStorage using the same key
        const enrollmentData = this.enrollments.map(enrollment => ({
            fullName: enrollment.studentName,
            email: enrollment.email,
            phone: enrollment.phone,
            courseId: enrollment.courseId,
            courseName: enrollment.courseName,
            coursePrice: enrollment.coursePrice,
            paymentMethod: enrollment.paymentMethod,
            paymentDetails: enrollment.paymentDetails,
            receiptFile: enrollment.receiptFile,
            status: enrollment.status,
            submissionDate: enrollment.submissionDate,
            notes: enrollment.notes
        }));
        localStorage.setItem('noorProEnrollments', JSON.stringify(enrollmentData));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
}

// Global functions for HTML onclick events
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Update display
    adminDashboard.displayEnrollments(tabName === 'all' ? 'all' : tabName);
}

function showReceiptModal(imageSrc) {
    document.getElementById('modalReceiptImage').src = imageSrc;
    document.getElementById('receiptModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function confirmApproval() {
    adminDashboard.confirmApproval();
}

// Initialize admin dashboard when page loads
let adminDashboard;

// Make functions globally available
window.showApprovalModal = function(enrollmentId) {
    if (adminDashboard) {
        adminDashboard.showApprovalModal(enrollmentId);
    }
};

window.rejectEnrollment = function(enrollmentId) {
    if (adminDashboard) {
        adminDashboard.rejectEnrollment(enrollmentId);
    }
};

window.viewEnrollmentDetails = function(enrollmentId) {
    if (adminDashboard) {
        adminDashboard.viewEnrollmentDetails(enrollmentId);
    }
};

window.viewStudentDetails = function(enrollmentId) {
    if (adminDashboard) {
        adminDashboard.viewStudentDetails(enrollmentId);
    }
};

window.confirmApproval = function() {
    if (adminDashboard) {
        adminDashboard.confirmApproval();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    adminDashboard = new AdminDashboard();
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .notification {
            font-family: 'Cairo', sans-serif;
            font-weight: 600;
        }
        
        .notification i {
            margin-left: 10px;
        }
    `;
    document.head.appendChild(style);
});

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}