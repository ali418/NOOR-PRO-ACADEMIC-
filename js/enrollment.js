// Enrollment System JavaScript
class EnrollmentSystem {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.selectedPaymentMethod = null;
        this.courseData = null;
        this.enrollmentData = {};
        this.currentLanguage = 'ar';
        
        this.init();
    }

    init() {
        this.checkUserAuthentication();
        this.setupEventListeners();
        this.updateStepDisplay();
        this.setupNavigation();
        this.setupLanguageToggle();
        this.loadCourseData();
        this.updateLanguage();
    }

    setupLanguageToggle() {
        const navContainer = document.querySelector('.nav-container');
        if (navContainer) {
            const languageToggle = document.createElement('div');
            languageToggle.className = 'language-toggle';
            languageToggle.innerHTML = `
                <button class="btn-language" onclick="enrollmentSystem.toggleLanguage()">
                    <i class="fas fa-globe"></i>
                    <span id="languageText">English</span>
                </button>
            `;
            navContainer.appendChild(languageToggle);
        }
    }

    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'ar' ? 'en' : 'ar';
        this.updateLanguage();
    }

    updateLanguage() {
        const html = document.documentElement;
        const elements = document.querySelectorAll('[data-ar][data-en]');
        
        if (this.currentLanguage === 'en') {
            html.setAttribute('lang', 'en');
            html.setAttribute('dir', 'ltr');
            elements.forEach(el => {
                el.textContent = el.getAttribute('data-en');
            });
            document.getElementById('languageText').textContent = 'العربية';
        } else {
            html.setAttribute('lang', 'ar');
            html.setAttribute('dir', 'rtl');
            elements.forEach(el => {
                el.textContent = el.getAttribute('data-ar');
            });
            document.getElementById('languageText').textContent = 'English';
        }
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
        // Navigation buttons
        const nextBtns = document.querySelectorAll('.btn-next');
        const prevBtns = document.querySelectorAll('.btn-prev');
        
        nextBtns.forEach(btn => {
            btn.addEventListener('click', () => this.nextStep());
        });
        
        prevBtns.forEach(btn => {
            btn.addEventListener('click', () => this.prevStep());
        });

        // Payment method selection
        const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', (e) => {
                this.selectedPaymentMethod = e.target.value;
                this.updatePaymentDetails();
            });
        });

        // Form submission
        const submitBtn = document.getElementById('submitEnrollment');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitEnrollment());
        }

        // Step navigation
        const stepButtons = document.querySelectorAll('.step-number');
        stepButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                if (index + 1 <= this.currentStep) {
                    this.goToStep(index + 1);
                }
            });
        });
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
        // Update step indicators
        const stepNumbers = document.querySelectorAll('.step-number');
        const stepTitles = document.querySelectorAll('.step-title');
        
        stepNumbers.forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNum < this.currentStep) {
                step.classList.add('completed');
            } else if (stepNum === this.currentStep) {
                step.classList.add('active');
            }
        });

        // Update step content
        const steps = document.querySelectorAll('.step');
        steps.forEach((step, index) => {
            step.classList.remove('active');
            if (index + 1 === this.currentStep) {
                step.classList.add('active');
            }
        });

        // Update navigation buttons
        const prevBtn = document.querySelector('.btn-prev');
        const nextBtn = document.querySelector('.btn-next');
        const submitBtn = document.getElementById('submitEnrollment');

        if (prevBtn) {
            prevBtn.style.display = this.currentStep === 1 ? 'none' : 'inline-block';
        }

        if (nextBtn && submitBtn) {
            if (this.currentStep === this.totalSteps) {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'inline-block';
            } else {
                nextBtn.style.display = 'inline-block';
                submitBtn.style.display = 'none';
            }
        }
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

        try {
            const response = await fetch(`/api/courses?id=${courseId}`);
            const course = await response.json();
            
            if (course) {
                this.courseData = course;
                this.enrollmentData.courseId = courseId;
                this.updateEnrollmentForm(course);
            } else {
                this.showNotification('لم يتم العثور على بيانات الدورة', 'error');
            }
        } catch (error) {
            console.error('خطأ في جلب بيانات الدورة:', error);
            this.showNotification('خطأ في تحميل بيانات الدورة', 'error');
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
        const paymentDetails = document.getElementById('paymentDetails');
        if (!paymentDetails) return;

        let detailsHTML = '';

        switch (this.selectedPaymentMethod) {
            case 'bank':
                detailsHTML = `
                    <div class="payment-info">
                        <h4>تفاصيل التحويل البنكي</h4>
                        <div class="bank-details">
                            <p><strong>اسم البنك:</strong> البنك الأهلي السعودي</p>
                            <p><strong>رقم الحساب:</strong> 1234567890123456</p>
                            <p><strong>اسم المستفيد:</strong> مركز نور برو الأكاديمي</p>
                            <p><strong>IBAN:</strong> SA1234567890123456789012</p>
                        </div>
                        <div class="upload-section">
                            <label for="transferReceipt">رفع إيصال التحويل:</label>
                            <input type="file" id="transferReceipt" accept="image/*,.pdf" required>
                        </div>
                    </div>
                `;
                break;
            case 'installments':
                detailsHTML = `
                    <div class="payment-info">
                        <h4>خطة الدفع بالأقساط</h4>
                        <div class="installment-plan">
                            <p><strong>القسط الأول:</strong> ${this.courseData ? Math.ceil(this.courseData.price / 3) : 0} ريال (عند التسجيل)</p>
                            <p><strong>القسط الثاني:</strong> ${this.courseData ? Math.ceil(this.courseData.price / 3) : 0} ريال (بعد شهر)</p>
                            <p><strong>القسط الثالث:</strong> ${this.courseData ? Math.floor(this.courseData.price / 3) : 0} ريال (بعد شهرين)</p>
                        </div>
                    </div>
                `;
                break;
            case 'cash':
                detailsHTML = `
                    <div class="payment-info">
                        <h4>الدفع النقدي</h4>
                        <p>يمكنك الدفع نقدياً عند زيارة مقر المركز</p>
                        <div class="center-address">
                            <p><strong>العنوان:</strong> الرياض، حي النخيل، شارع الملك فهد</p>
                            <p><strong>أوقات العمل:</strong> السبت - الخميس: 9:00 ص - 9:00 م</p>
                            <p><strong>الهاتف:</strong> 0112345678</p>
                        </div>
                    </div>
                `;
                break;
        }

        paymentDetails.innerHTML = detailsHTML;
    }

    async submitEnrollment() {
        if (!this.validateAllSteps()) {
            return;
        }

        // Collect form data
        this.collectFormData();

        try {
            this.showLoading(true);
            
            // Submit enrollment
            const response = await fetch('/api/enrollments.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.enrollmentData)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccessMessage();
                // Redirect after success
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 3000);
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
        this.enrollmentData.fullName = document.getElementById('fullName')?.value || '';
        this.enrollmentData.email = document.getElementById('email')?.value || '';
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
            this.enrollmentData.courseTitle = this.courseData.title;
            this.enrollmentData.coursePrice = this.courseData.price;
        }
    }

    showSuccessMessage() {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <div class="success-content">
                <i class="fas fa-check-circle"></i>
                <h3>تم التسجيل بنجاح!</h3>
                <p>شكراً لك على التسجيل في الدورة. سيتم التواصل معك قريباً لتأكيد التسجيل.</p>
                <div class="success-actions">
                    <a href="profile.html" class="btn btn-primary">الذهاب إلى الملف الشخصي</a>
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

// Initialize system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.enrollmentSystem = new EnrollmentSystem();
});