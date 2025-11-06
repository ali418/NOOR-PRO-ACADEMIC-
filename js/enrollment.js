// Enrollment System JavaScript
class EnrollmentSystem {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.selectedPaymentMethod = null;
        this.courseData = null;
        this.enrollmentData = {};
        this.currentLanguage = 'ar';
        // استخدام نفس الأصل لواجهات API افتراضياً
        this.apiBase = 'https://nooracademic.up.railway.app';
        
        this.init();
    }

    init() {
        this.checkUserAuthentication();
        this.setupEventListeners();
        this.updateStepDisplay();
        this.setupNavigation();
        this.loadCourseData();
    }

    checkUserAuthentication() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (!isLoggedIn) {
            this.showLoginPrompt();
            return false;
        }
        
        this.enrollmentData.userId = userData.id;
        this.enrollmentData.userEmail = userData.email;
        this.enrollmentData.userName = userData.fullName;
        
        return true;
    }

    showLoginPrompt() {
        const loginPrompt = document.createElement('div');
        loginPrompt.className = 'login-prompt';
        loginPrompt.innerHTML = `
            <div class="prompt-content">
                <h3>يجب تسجيل الدخول أولاً</h3>
                <p>لإكمال عملية التسجيل في الدورة، يجب عليك تسجيل الدخول أولاً</p>
                <div class="prompt-actions">
                    <a href="login.html" class="btn btn-primary">تسجيل الدخول</a>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn btn-secondary">إلغاء</button>
                </div>
            </div>
        `;
        document.body.appendChild(loginPrompt);
    }

    setupEventListeners() {
        // Payment method selection via clickable cards
        const paymentCards = document.querySelectorAll('.payment-method');
        paymentCards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectedPaymentMethod = card.getAttribute('data-method');
                paymentCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.updatePaymentDetails();
            });
        });

        // Optional: enable clicking on step indicators to go back
        const stepIndicators = document.querySelectorAll('.step');
        stepIndicators.forEach(ind => {
            ind.addEventListener('click', () => {
                const s = Number(ind.getAttribute('data-step')) || 1;
                if (s <= this.currentStep) this.goToStep(s);
            });
        });

        // Receipt file selection preview
        const receiptInput = document.getElementById('receiptFile');
        const uploadedFileDiv = document.getElementById('uploadedFile');
        const fileNameSpan = document.getElementById('fileName');
        if (receiptInput) {
            receiptInput.addEventListener('change', () => {
                if (receiptInput.files && receiptInput.files[0]) {
                    const f = receiptInput.files[0];
                    if (fileNameSpan) fileNameSpan.textContent = f.name;
                    if (uploadedFileDiv) uploadedFileDiv.style.display = 'flex';
                } else {
                    if (uploadedFileDiv) uploadedFileDiv.style.display = 'none';
                    if (fileNameSpan) fileNameSpan.textContent = '';
                }
            });
        }
    }

    setupNavigation() {
        const steps = document.querySelectorAll('.step');
        steps.forEach((step, index) => {
            if (index === 0) {
                step.classList.add('active');
            }
        });
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateStepDisplay();
                this.scrollToTop();
            }
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
            this.scrollToTop();
        }
    }

    goToStep(stepNumber) {
        if (stepNumber >= 1 && stepNumber <= this.totalSteps) {
            this.currentStep = stepNumber;
            this.updateStepDisplay();
            this.scrollToTop();
        }
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.validatePersonalInfo();
            case 2:
                return this.validateCourseSelection();
            case 3:
                return this.validatePaymentMethod();
            case 4:
                return true;
            default:
                return true;
        }
    }

    validatePersonalInfo() {
        const requiredFields = ['fullName', 'email', 'phone'];
        let isValid = true;

        requiredFields.forEach(field => {
            const input = document.getElementById(field);
            if (input && !input.value.trim()) {
                this.showFieldError(input, 'هذا الحقل مطلوب');
                isValid = false;
            } else if (input) {
                this.clearFieldError(input);
            }
        });

        // Email validation
        const emailInput = document.getElementById('email');
        if (emailInput && emailInput.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value)) {
                this.showFieldError(emailInput, 'يرجى إدخال بريد إلكتروني صحيح');
                isValid = false;
            }
        }

        // Phone validation
        const phoneInput = document.getElementById('phone');
        if (phoneInput && phoneInput.value) {
            const phoneRegex = /^[0-9+\-\s()]+$/;
            if (!phoneRegex.test(phoneInput.value)) {
                this.showFieldError(phoneInput, 'يرجى إدخال رقم هاتف صحيح');
                isValid = false;
            }
        }

        return isValid;
    }

    validateCourseSelection() {
        return this.courseData !== null;
    }

    validatePaymentMethod() {
        if (!this.selectedPaymentMethod) {
            this.showNotification('يرجى اختيار طريقة الدفع', 'error');
            return false;
        }
        return true;
    }

    showFieldError(input, message) {
        this.clearFieldError(input);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        
        input.classList.add('error');
        input.parentNode.appendChild(errorDiv);
    }

    clearFieldError(input) {
        input.classList.remove('error');
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    updateStepDisplay() {
        // Update step indicators (elements with class .step)
        const indicators = document.querySelectorAll('.step');
        indicators.forEach(ind => {
            const s = Number(ind.getAttribute('data-step')) || 1;
            ind.classList.toggle('active', s === this.currentStep);
            ind.classList.toggle('completed', s < this.currentStep);
        });

        // Update form step content (elements with class .form-step)
        const formSteps = document.querySelectorAll('.form-step');
        formSteps.forEach(step => {
            const s = Number(step.getAttribute('data-step')) || 1;
            step.classList.toggle('active', s === this.currentStep);
        });

        // Update navigation buttons by IDs
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        if (prevBtn) prevBtn.style.display = this.currentStep === 1 ? 'none' : 'inline-block';
        if (nextBtn) nextBtn.style.display = this.currentStep === this.totalSteps ? 'none' : 'inline-block';
        if (submitBtn) submitBtn.style.display = this.currentStep === this.totalSteps ? 'inline-block' : 'none';
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    async loadCourseData() {
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('course');
        
        if (!courseId) {
            this.showNotification('لم يتم تحديد الدورة', 'error');
            return;
        }

        // حاول أولاً جلب البيانات من قاعدة البيانات، ثم وفّر بديل من بيانات العينة عند الفشل
        try {
            const dbResp = await fetch(`${this.apiBase}/api/courses?id=${courseId}`);
            if (dbResp.ok) {
                const dbJson = await dbResp.json();
                const raw = (dbJson && Array.isArray(dbJson.courses)) ? dbJson.courses[0] : null;
                if (raw) {
                    const course = {
                        title: raw.title || raw.course_name || '',
                        description: raw.description || '',
                        duration: raw.duration_weeks || raw.duration || '',
                        level: raw.level_name || raw.level || '',
                        price: raw.price || 0
                    };
                    this.courseData = course;
                    this.enrollmentData.courseId = courseId;
                    this.updateEnrollmentForm(course);
                    return;
                }
            }
            throw new Error('DB fetch failed or course not found');
        } catch (error) {
            console.warn('فشل جلب بيانات الدورة من قاعدة البيانات، سيتم استخدام بيانات العينة:', error);
            try {
                const sampleResp = await fetch(`${this.apiBase}/api/courses-sample`);
                const sampleJson = await sampleResp.json();
                // الواجهة الأمامية تستخدم خاصية courses في الاستجابة
                const list = Array.isArray(sampleJson.courses) ? sampleJson.courses : [];
                const raw = list.find(c => String(c.id) === String(courseId));
                if (raw) {
                    const course = {
                        title: raw.title || '',
                        description: raw.description || '',
                        duration: raw.duration_weeks || raw.duration || '',
                        level: raw.level_name || raw.level || '',
                        price: raw.price || 0
                    };
                    this.courseData = course;
                    this.enrollmentData.courseId = courseId;
                    this.updateEnrollmentForm(course);
                } else {
                    this.showNotification('لم يتم العثور على بيانات الدورة', 'error');
                }
            } catch (fallbackError) {
                console.error('خطأ في تحميل بيانات العينة للدورة:', fallbackError);
                this.showNotification('خطأ في تحميل بيانات الدورة', 'error');
            }
        }
    }

    updateEnrollmentForm(courseData) {
        const courseInfoDiv = document.getElementById('courseInfo');
        const courseFeaturesDiv = document.getElementById('courseFeatures');
        const courseConfirmationDiv = document.getElementById('courseConfirmation');
        
        if (!courseInfoDiv) return;

        // عرض معلومات الكورس
        courseInfoDiv.innerHTML = `
            <div class="course-info-item">
                <i class="fas fa-book"></i>
                <strong>اسم الكورس:</strong> ${courseData.title}
            </div>
            <div class="course-info-item">
                <i class="fas fa-align-left"></i>
                <strong>الوصف:</strong> ${courseData.description}
            </div>
            <div class="course-info-item">
                <i class="fas fa-clock"></i>
                <strong>المدة:</strong> ${courseData.duration}
            </div>
            <div class="course-info-item">
                <i class="fas fa-layer-group"></i>
                <strong>المستوى:</strong> ${courseData.level}
            </div>
            <div class="course-info-item">
                <i class="fas fa-money-bill-wave"></i>
                <strong>السعر:</strong> ${courseData.price} ريال
            </div>
        `;

        // عرض مميزات الكورس إذا كانت متوفرة
        if (courseFeaturesDiv && courseData.features) {
            courseFeaturesDiv.innerHTML = courseData.features
                .map(feature => `<li>${feature}</li>`)
                .join('');
        }

        // تأكيد اختيار الكورس
        if (courseConfirmationDiv) {
            courseConfirmationDiv.innerHTML = `
                <div style="background: #e8f4fd; padding: 20px; border-radius: 10px; text-align: center;">
                    <h4 style="color: var(--primary-color); margin-bottom: 10px;">الكورس المختار</h4>
                    <h3 style="color: #333; margin-bottom: 5px;">${courseData.title}</h3>
                    <p style="color: #666; margin-bottom: 10px;">${courseData.description}</p>
                    <div style="display: flex; justify-content: space-around; margin-top: 15px;">
                        <span><strong>المدة:</strong> ${courseData.duration}</span>
                        <span><strong>السعر:</strong> ${courseData.price}</span>
                    </div>
                </div>
            `;
        }
    }

    updatePaymentDetails() {
        const map = {
            'mobile-money': 'mobileMoneyDetails',
            'areeba': 'areebaDetails',
            'amteen': 'amteenDetails',
            'bank': 'bankDetails'
        };
        const allDetails = document.querySelectorAll('.payment-details');
        allDetails.forEach(d => d.classList.remove('active'));
        const targetId = map[this.selectedPaymentMethod];
        const target = targetId ? document.getElementById(targetId) : null;
        if (target) target.classList.add('active');
    }

    async submitEnrollment() {
        if (!this.validateAllSteps()) {
            return;
        }

        // Collect form data
        this.collectFormData();

        try {
            this.showLoading(true);
            
            // Build multipart form data to support receipt upload
            const formData = new FormData();
            const data = this.enrollmentData || {};
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null) {
                    formData.append(key, data[key]);
                }
            });
            // Append payment extra fields
            const paymentAmountEl = document.getElementById('paymentAmount');
            const transactionIdEl = document.getElementById('transactionId');
            if (paymentAmountEl && paymentAmountEl.value) formData.append('paymentAmount', paymentAmountEl.value);
            if (transactionIdEl && transactionIdEl.value) formData.append('transactionId', transactionIdEl.value);

            // Append receipt file if selected
            const fileInput = document.getElementById('receiptFile');
            if (fileInput && fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
                if (!allowed.includes(file.type)) {
                    this.showNotification('صيغة الملف غير مدعومة. استخدم JPG, PNG, أو PDF', 'error');
                    this.showLoading(false);
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    this.showNotification('حجم الملف أكبر من 5 ميجا', 'error');
                    this.showLoading(false);
                    return;
                }
                formData.append('receiptFile', file);
            }

            // Submit enrollment
            const response = await fetch(`${this.apiBase}/api/enrollments`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result && result.success) {
                this.showSuccessMessage();
            } else {
                this.showNotification(result.message || 'حدث خطأ في التسجيل', 'error');
            }
        } catch (error) {
            console.error('خطأ في إرسال التسجيل:', error);
            this.showNotification('حدث خطأ في الاتصال بالخادم', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    validateAllSteps() {
        for (let i = 1; i <= this.totalSteps; i++) {
            this.currentStep = i;
            if (!this.validateCurrentStep()) {
                this.updateStepDisplay();
                return false;
            }
        }
        this.currentStep = this.totalSteps;
        return true;
    }

    collectFormData() {
        // Personal information
        this.enrollmentData.fullName = document.getElementById('fullName')?.value || this.enrollmentData.userName || '';
        this.enrollmentData.email = document.getElementById('email')?.value || this.enrollmentData.userEmail || '';
        this.enrollmentData.phone = document.getElementById('phone')?.value || '';
        this.enrollmentData.address = document.getElementById('address')?.value || '';
        this.enrollmentData.birthDate = document.getElementById('birthDate')?.value || '';
        this.enrollmentData.education = document.getElementById('education')?.value || '';
        this.enrollmentData.experience = document.getElementById('experience')?.value || '';

        // Payment information
        this.enrollmentData.paymentMethod = this.selectedPaymentMethod;
        this.enrollmentData.enrollmentDate = new Date().toISOString();
        this.enrollmentData.status = 'pending';

        // Course information
        if (this.courseData) {
            const urlParams = new URLSearchParams(window.location.search);
            this.enrollmentData.courseId = urlParams.get('course'); // Use courseId from URL
            this.enrollmentData.course_name = this.courseData.title; // Use course_name
            this.enrollmentData.coursePrice = this.courseData.price;
        }

        // Extra payment fields shown in step 4
        const paymentAmountEl = document.getElementById('paymentAmount');
        const transactionIdEl = document.getElementById('transactionId');
        if (paymentAmountEl) this.enrollmentData.paymentAmount = paymentAmountEl.value || '';
        if (transactionIdEl) this.enrollmentData.transactionId = transactionIdEl.value || '';
    }

    showSuccessMessage() {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <div class="success-content">
                <i class="fas fa-check-circle"></i>
                <h3>تم إرسال بياناتك بنجاح!</h3>
                <p>ستصلك رسالة ترحيبية عبر البريد الإلكتروني وواتساب تحتوي على رابط مجموعة واتساب.</p>
                <div class="success-actions">
                    <a href="courses.html" class="btn btn-secondary">تصفح المزيد من الدورات</a>
                </div>
            </div>
        `;
        document.body.appendChild(successDiv);
    }

    showLoading(show) {
        const loadingDiv = document.getElementById('loadingOverlay');
        if (loadingDiv) {
            loadingDiv.style.display = show ? 'flex' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 5000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Global functions for HTML onclick events
function submitEnrollment() {
    if (window.enrollmentSystem) {
        window.enrollmentSystem.submitEnrollment();
    }
}

// Global step navigation for HTML buttons calling changeStep(+/-1)
function changeStep(delta) {
    if (!window.enrollmentSystem) return;
    if (delta > 0) {
        window.enrollmentSystem.nextStep();
    } else if (delta < 0) {
        window.enrollmentSystem.prevStep();
    }
}

// Initialize system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.enrollmentSystem = new EnrollmentSystem();
});

// Helper: copy text to clipboard used by payment details buttons
function copyToClipboard(text) {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('تم النسخ إلى الحافظة');
        }).catch(() => {
            console.warn('تعذر النسخ إلى الحافظة');
        });
    } else {
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(temp);
    }
}