// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.enrollments = [];
        this.currentEnrollment = null;
        // استخدم نفس الأصل لطلبات API افتراضياً
        this.apiBase = '';
        // فلتر الحالة الحالي لعلامات التبويب
        this.currentFilter = 'all';
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
        // أولاً جرّب واجهة Node: /api/stats
        try {
            const nodeResp = await fetch('/api/stats');
            if (nodeResp.ok) {
                const result = await nodeResp.json();
                // يدعم عدة أشكال من الاستجابة
                const data = result?.data ? result.data : result;
                const mapped = {
                    totalStudents: Number(data.totalStudents ?? data.students ?? 0),
                    totalCourses: Number(data.totalCourses ?? data.courses ?? 0),
                    activeUsers: Number(data.activeUsers ?? data.enrollments ?? 0),
                    systemStatus: Number(data.systemStatus ?? 100)
                };
                this.updateDashboardStats(mapped);
                console.log('Dashboard stats loaded via Node API:', mapped);
                return;
            }
        } catch (e) {
            console.warn('Node stats API failed, will try PHP:', e.message);
        }

        // سقوط احتياطي إلى PHP: api/stats.php (في حالة وجود خادم PHP)
        try {
            const phpResp = await fetch('api/stats.php');
            if (phpResp.ok) {
                const result = await phpResp.json();
                const data = result?.data || {};
                const mapped = {
                    totalStudents: Number(data.totalStudents ?? 0),
                    totalCourses: Number(data.totalCourses ?? 0),
                    activeUsers: Number(data.activeUsers ?? 0),
                    systemStatus: Number(data.systemStatus ?? 100)
                };
                this.updateDashboardStats(mapped);
                console.log('Dashboard stats loaded via PHP API:', mapped);
                return;
            }
        } catch (e) {
            console.warn('PHP stats API failed:', e.message);
        }

        // في حال فشل كل شيء
        this.updateDashboardStats({
            totalStudents: 0,
            totalCourses: 0,
            activeUsers: 0,
            systemStatus: 0
        });
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
            const response = await fetch(`${this.apiBase}/api/enrollments`);
            if (response.ok) {
                const result = await response.json();
                if (result && result.success && Array.isArray(result.data)) {
                    this.enrollments = result.data;
                    console.log('Enrollments loaded from API:', this.enrollments.length);
                    console.log('First enrollment:', this.enrollments[0]); // للتشخيص
                    return;
                }
                throw new Error('Invalid response format');
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
                    address: enrollment.address,
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
            searchInput.addEventListener('input', () => this.displayEnrollments(this.currentFilter));
        }

        if (courseFilter) {
            courseFilter.addEventListener('change', () => this.displayEnrollments(this.currentFilter));
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
        console.log('displayEnrollments called with filter:', filter);
        console.log('Total enrollments:', this.enrollments.length);
        
        let filteredEnrollments = this.enrollments;

        if (filter !== 'all') {
            filteredEnrollments = this.enrollments.filter(e => e.status === filter);
        }
        
        console.log('After status filter:', filteredEnrollments.length);

        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const courseFilter = document.getElementById('courseFilter')?.value || 'all';
        
        console.log('Search term:', searchTerm);
        console.log('Course filter:', courseFilter);

        if (searchTerm) {
            filteredEnrollments = filteredEnrollments.filter(e => 
                e.studentName.toLowerCase().includes(searchTerm) ||
                e.id.toLowerCase().includes(searchTerm) ||
                e.courseName.toLowerCase().includes(searchTerm) ||
                (e.address && e.address.toLowerCase().includes(searchTerm))
            );
        }

        if (courseFilter && courseFilter !== 'all') {
            filteredEnrollments = filteredEnrollments.filter(e => String(e.courseId) === String(courseFilter));
        }
        
        console.log('Final filtered enrollments:', filteredEnrollments.length);

        // عرض البطاقات في الحاوية الموحدة داخل النموذج
        this.renderEnrollments('enrollmentsList', filteredEnrollments);
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

        // استخراج بيانات الدفع من paymentDetails أو notes
        const paymentMethod = enrollment.paymentMethod || (enrollment.notes && enrollment.notes.paymentMethod);
        const paymentDetails = enrollment.paymentDetails || {};
        const coursePrice = enrollment.coursePrice || (enrollment.notes && enrollment.notes.coursePrice) || 0;
        
        const paymentMethodText = {
            'mobile-money': 'موبايل موني',
            'bank': 'بنكك',
            'areeba': 'أريبا',
            'amteen': 'أمتين',
            'bank-transfer': 'تحويل بنكي',
            'in-person': 'دفع مباشر'
        }[paymentMethod] || paymentMethod || 'غير محدد';

        const addr = enrollment.address || (enrollment.notes && enrollment.notes.address) || 'غير متوفر';
        const receiptUrl = enrollment.receiptFile || '';
        const ext = receiptUrl.split('.').pop()?.toLowerCase();
        const isImage = ['jpg','jpeg','png','gif','webp'].includes(ext || '');
        const isPdf = (ext === 'pdf');

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
                            <span class="detail-label">عنوان السكن:</span>
                            <span class="detail-value">${addr}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">رقم الهاتف:</span>
                            <span class="detail-value">${enrollment.phone}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">تاريخ التقديم:</span>
                            <span class="detail-value">${new Date(enrollment.submissionDate).toLocaleDateString('en-GB')}</span>
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
                            <span class="detail-value">${Number(coursePrice || 0).toLocaleString('en-US')} دولار</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">طريقة الدفع:</span>
                            <span class="detail-value">${paymentMethodText}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">المبلغ المدفوع:</span>
                            <span class="detail-value">${Number(paymentDetails.amount || coursePrice || 0).toLocaleString('en-US')} دولار</span>
                        </div>
                        ${paymentDetails.transactionId ? `
                        <div class="detail-item">
                            <span class="detail-label">رقم المعاملة:</span>
                            <span class="detail-value">${paymentDetails.transactionId}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                ${receiptUrl ? `
                <div class="receipt-preview">
                    <h4><i class="fas fa-receipt"></i> إيصال الدفع</h4>
                    ${isImage ? `
                        <img src="${receiptUrl}" alt="إيصال الدفع" class="receipt-image" onclick="adminDashboard.showReceiptModal('${receiptUrl}')">
                        <p style="margin-top: 10px; color: #666; font-size: 0.9rem;">اضغط على الصورة لعرضها بحجم أكبر</p>
                    ` : isPdf ? `
                        <a href="${receiptUrl}" target="_blank" class="btn-view-details" style="display:inline-block;margin-bottom:8px;">فتح الإيصال (PDF)</a>
                        <object data="${receiptUrl}" type="application/pdf" style="width:100%;height:420px;"></object>
                    ` : `
                        <a href="${receiptUrl}" target="_blank" class="btn-view-details">عرض الإيصال</a>
                    `}
                </div>
                ` : ''}

                ${(paymentDetails.notes || (enrollment.notes && enrollment.notes.studentNotes)) ? `
                <div class="detail-section">
                    <h4><i class="fas fa-sticky-note"></i> ملاحظات الطالب</h4>
                    <p>${paymentDetails.notes || (enrollment.notes && enrollment.notes.studentNotes) || ''}</p>
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
            const template = welcomeSystem.generateWelcomeMessage(
                this.currentEnrollment.courseId,
                this.currentEnrollment.studentName,
                this.currentEnrollment.whatsappLink || ''
            );
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

    async confirmApproval() {
        if (!this.currentEnrollment) return;

        const welcomeMessage = document.getElementById('welcomeMessage')?.value || '';
        const whatsappLink = document.getElementById('whatsappLink')?.value || '';
        const courseAccess = document.getElementById('courseAccess')?.value || '';
        const approvalDate = new Date().toISOString();

        // Try update via API
        try {
            const response = await fetch(`${this.apiBase}/api/enrollments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_status',
                    id: this.currentEnrollment.id,
                    status: 'approved',
                    additionalData: {
                        approvalDate,
                        welcomeMessage,
                        whatsappLink,
                        notes: { courseAccess }
                    }
                })
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'فشل تحديث الحالة');
            }
        } catch (err) {
            console.warn('API update failed, falling back to localStorage:', err.message);
        }

        // Update local state regardless to keep UI responsive
        this.currentEnrollment.status = 'approved';
        this.currentEnrollment.approvalDate = approvalDate;
        this.currentEnrollment.welcomeMessage = welcomeMessage;
        this.currentEnrollment.whatsappLink = whatsappLink;
        this.currentEnrollment.courseAccess = courseAccess;

        // Record a student notification in localStorage for profile page
        this.addStudentNotification(this.currentEnrollment, welcomeMessage, whatsappLink);

        this.updateStats();
        this.displayEnrollments();

        this.closeModal('approvalModal');
        this.showNotification('تم قبول الطلب وإرسال رسالة الترحيب بنجاح!', 'success');

        // بعد قبول الطلب، أضف الطالب تلقائياً إلى جدول الطلاب عبر API
        try {
            await this.createStudentFromEnrollment(this.currentEnrollment);
            this.showNotification('تم إضافة الطالب إلى قائمة الطلاب بنجاح', 'success');

            // Automatically trigger WhatsApp message after successful student creation
            this.sendWhatsAppMessage();

        } catch (e) {
            console.warn('Failed to add student to DB:', e.message);
            this.showNotification('تم القبول، لكن حدث خطأ في إضافة الطالب لقاعدة البيانات', 'error');
        }

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

    // إنشاء سجل طالب جديد بناءً على بيانات الطلب المقبول
    async createStudentFromEnrollment(enrollment) {
        // تقسيم الاسم الكامل إلى اسم أول واسم أخير
        const parts = String(enrollment.studentName || '').trim().split(/\s+/);
        const first_name = parts[0] || String(enrollment.studentName || 'طالب');
        const last_name = parts.slice(1).join(' ') || '';

        // توليد رقم طالب فريد بالاعتماد على معرف الطلب
        const student_id = `STU-${String(enrollment.id)}`;
        const enrollment_date = new Date().toISOString().split('T')[0];

        const payload = {
            id: student_id, // Use id instead of student_id
            firstName: first_name, // Use firstName instead of first_name
            lastName: last_name, // Use lastName instead of last_name
            email: String(enrollment.email || ''),
            phone: String(enrollment.phone || ''),
            birthDate: null,
            gender: 'male',
            address: '',
            registrationDate: enrollment_date
        };

        const resp = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await resp.json().catch(() => ({ success: false, message: 'استجابة غير صالحة' }));
        if (!resp.ok || !result.success) {
            // في حال تعارض المفتاح الفريد، نتجاهل الإضافة (قد يكون الطالب مضاف مسبقاً)
            throw new Error(result.message || 'فشل إضافة الطالب');
        }

        // ربط صورة إيصال الدفع بسجل الطالب محلياً ليتم عرضها في صفحة الطلاب
        try {
            if (enrollment && enrollment.receiptFile) {
                const mapKey = 'noorProStudentReceiptPhotos';
                const existing = localStorage.getItem(mapKey);
                const photoMap = existing ? JSON.parse(existing) : {};
                photoMap[payload.id] = enrollment.receiptFile;
                localStorage.setItem(mapKey, JSON.stringify(photoMap));
                console.log('Stored receipt photo for student', payload.id, '->', enrollment.receiptFile);
            }
        } catch (e) {
            console.warn('Failed to store receipt photo mapping:', e.message);
        }
        return result;
    }

    addStudentNotification(enrollment, message, whatsappLink = '') {
        try {
            const list = JSON.parse(localStorage.getItem('studentNotifications') || '[]');
            const notification = {
                id: 'NOTIF-' + Date.now(),
                email: String(enrollment.email || ''),
                courseId: String(enrollment.courseId || ''),
                courseName: String(enrollment.courseName || ''),
                type: 'approval',
                title: 'تم قبولك في كورس',
                message: message || `تم قبولك في ${enrollment.courseName}`,
                whatsappLink: whatsappLink || '',
                createdAt: new Date().toISOString(),
                isRead: false
            };
            list.push(notification);
            localStorage.setItem('studentNotifications', JSON.stringify(list));
        } catch (e) {
            console.warn('Failed to store student notification:', e.message);
        }
    }

    async rejectEnrollment(enrollmentId) {
        if (confirm('هل أنت متأكد من رفض هذا الطلب؟')) {
            const enrollment = this.enrollments.find(e => e.id === enrollmentId);
            if (enrollment) {
                const rejectionDate = new Date().toISOString();
                // Try server update first
                try {
                    const response = await fetch(`${this.apiBase}/api/enrollments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'update_status',
                            id: enrollment.id,
                            status: 'rejected',
                            additionalData: { rejectionDate }
                        })
                    });
                    const result = await response.json();
                    if (!response.ok || !result.success) {
                        throw new Error(result.message || 'فشل تحديث الحالة');
                    }
                } catch (err) {
                    console.warn('API update failed, using local fallback:', err.message);
                }

                enrollment.status = 'rejected';
                enrollment.rejectionDate = rejectionDate;
                
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

        alert(`تفاصيل الطلب ${enrollment.id}:\n\nالطالب: ${enrollment.studentName}\nالكورس: ${enrollment.courseName}\nالحالة: ${enrollment.status}\nتاريخ التقديم: ${new Date(enrollment.submissionDate).toLocaleDateString('en-GB')}`);
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
                <span class="detail-value">${new Date(enrollment.submissionDate).toLocaleDateString('en-GB')}</span>
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
            'mobile-money': 'موبايل موني',
            'bank': 'بنكك',
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
                <span class="detail-value">${Number(enrollment.paymentDetails.amount || 0).toLocaleString('en-US')} دولار</span>
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

    sendWelcomeMessage(enrollment) {
        console.log('Sending welcome message to:', enrollment.studentName);
        console.log('Message:', enrollment.welcomeMessage);
        console.log('WhatsApp Link:', enrollment.whatsappLink);
    }

    sendWhatsAppMessage() {
        if (!this.currentEnrollment) {
            this.showNotification('لا يوجد طلب محدد لإرسال رسالة واتساب.', 'error');
            return;
        }

        const welcomeMessageText = document.getElementById('welcomeMessage')?.value || '';
        const whatsappLinkText = document.getElementById('whatsappLink')?.value || this.currentEnrollment.whatsappLink || '';
        const studentName = this.currentEnrollment.studentName;
        const studentPhone = this.currentEnrollment.phone;

        // Normalize phone number for WhatsApp (digits only, add Uganda country code if local)
        const normalizePhone = (raw) => {
            let digits = String(raw || '').replace(/\D+/g, '');
            if (!digits) return '';
            // Strip leading 00 international prefix
            if (digits.startsWith('00')) digits = digits.slice(2);
            // If local format starting with 0, default to Uganda country code 256
            if (digits.startsWith('0')) digits = '256' + digits.slice(1);
            return digits;
        };
        const targetPhone = normalizePhone(studentPhone);

        // Compile a list of approved students for the same course (or just the current one)
        const approvedSameCourse = (this.enrollments || []).filter(e => 
            e.status === 'approved' && e.courseId === this.currentEnrollment.courseId
        );
        const studentsForList = approvedSameCourse.length ? approvedSameCourse : [this.currentEnrollment];
        const listHeader = 'قائمة الطلاب المقبولين:';
        const listBody = studentsForList.map((e, i) => `${i + 1}) ${e.studentName} - ${e.phone || 'بدون رقم'} - ${e.courseName}`).join('\n');
        const listFooter = `\nإجمالي: ${studentsForList.length}`;

        // Replace placeholder for student name if not already done
        const baseMessage = (welcomeMessageText || `مرحباً ${studentName}! تم قبول طلبك في ${this.currentEnrollment.courseName}.`).replace(/\[STUDENT_NAME\]|undefined/gi, studentName);
        let finalMessage = `${baseMessage}\n\n${listHeader}\n${listBody}${listFooter}`;
        if (whatsappLinkText && !finalMessage.includes(whatsappLinkText)) {
            finalMessage += `\n\n📱 رابط مجموعة الواتساب:\n${whatsappLinkText}`;
        }
        // Limit very long messages to avoid browser URL length issues
        if (finalMessage.length > 1800) {
            finalMessage = finalMessage.slice(0, 1780) + '...';
        }

        if (typeof WelcomeSystem !== 'undefined') {
            const welcomeSystem = new WelcomeSystem();
            const whatsappUrl = welcomeSystem.createWhatsAppMessage(finalMessage, targetPhone || '');
            window.open(whatsappUrl, '_blank');
            this.showNotification('يتم فتح واتساب مع رسالة تحتوي أرقام الطلاب...', 'info');
        } else {
            this.showNotification('نظام الترحيب غير متاح، سيتم استخدام نص الرسالة فقط.', 'warning');
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(finalMessage)}`;
            window.open(whatsappUrl, '_blank');
        }
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

// تبديل علامة التبويب للحالات وتحديث العرض
function showTab(status) {
    if (!adminDashboard) return;
    adminDashboard.currentFilter = status;

    // تحديث حالة الأزرار النشطة إن وجدت
    const tabs = document.querySelectorAll('.status-tabs .tab-btn');
    if (tabs && tabs.length) {
        tabs.forEach(btn => btn.classList.remove('active'));
        const order = { all: 0, pending: 1, approved: 2, rejected: 3 };
        const idx = order[status];
        if (typeof idx === 'number' && tabs[idx]) {
            tabs[idx].classList.add('active');
        }
    }

    adminDashboard.displayEnrollments(status);
}