// Enrollment System JavaScript
class EnrollmentSystem {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.selectedPaymentMethod = null;
        this.courseData = null;
        this.enrollmentData = {};
        
        this.init();
    }

    init() {
        this.checkUserAuthentication();
        this.loadCourseData();
        this.setupEventListeners();
        this.updateStepDisplay();
        this.setupNavigation();
    }

    checkUserAuthentication() {
        // Get course ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('course');
        
        // Check if user is logged in
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            // Check if user is already enrolled in this course
            if (this.isUserEnrolledInCourse(currentUser.id, courseId)) {
                this.showAlreadyEnrolledMessage(courseId);
                return;
            }
            
            // Pre-fill user information if logged in
            this.prefillUserInfo(currentUser);
        }
    }

    getCurrentUser() {
        const savedUser = localStorage.getItem('noorProCurrentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    }

    isUserEnrolledInCourse(userId, courseId) {
        const enrollments = JSON.parse(localStorage.getItem('noorProEnrollments') || '[]');
        return enrollments.some(enrollment => 
            enrollment.userId === userId && 
            enrollment.courseId === courseId && 
            enrollment.status !== 'cancelled'
        );
    }

    showAlreadyEnrolledMessage(courseId) {
        const enrollmentContainer = document.querySelector('.enrollment-container');
        if (enrollmentContainer) {
            enrollmentContainer.innerHTML = `
                <div class="already-enrolled-message">
                    <div class="message-content">
                        <i class="fas fa-check-circle"></i>
                        <h2>أنت مسجل بالفعل في هذا الكورس!</h2>
                        <p>لقد قمت بالتسجيل في هذا الكورس مسبقاً. يمكنك متابعة دروسك من خلال لوحة التحكم.</p>
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="window.location.href='students.html'">
                                <i class="fas fa-tachometer-alt"></i>
                                الذهاب للوحة التحكم
                            </button>
                            <button class="btn btn-secondary" onclick="window.location.href='courses.html'">
                                <i class="fas fa-book"></i>
                                تصفح الكورسات الأخرى
                            </button>
                        </div>
                    </div>
                </div>
                <style>
                    .already-enrolled-message {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 60vh;
                        padding: 40px 20px;
                    }
                    .message-content {
                        background: white;
                        padding: 50px 40px;
                        border-radius: 20px;
                        text-align: center;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                        max-width: 600px;
                    }
                    .message-content i {
                        font-size: 4rem;
                        color: var(--success-color);
                        margin-bottom: 20px;
                    }
                    .message-content h2 {
                        color: var(--success-color);
                        margin-bottom: 15px;
                        font-size: 2rem;
                    }
                    .message-content p {
                        color: #666;
                        margin-bottom: 30px;
                        font-size: 1.1rem;
                        line-height: 1.6;
                    }
                    .action-buttons {
                        display: flex;
                        gap: 15px;
                        justify-content: center;
                        flex-wrap: wrap;
                    }
                    .action-buttons .btn {
                        padding: 12px 25px;
                        border-radius: 8px;
                        font-weight: 600;
                        text-decoration: none;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s ease;
                    }
                    .action-buttons .btn-primary {
                        background: var(--primary-color);
                        color: white;
                        border: none;
                    }
                    .action-buttons .btn-secondary {
                        background: var(--gray-500);
                        color: white;
                        border: none;
                    }
                    .action-buttons .btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    }
                </style>
            `;
        }
    }

    // Navigation setup and authentication state management
    setupNavigation() {
        const navAuth = document.getElementById('navAuth');
        const navUser = document.getElementById('navUser');
        const userWelcome = document.getElementById('userWelcome');
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        const currentUser = this.getCurrentUser();
        
        if (currentUser) {
            // User is logged in - show user info, hide auth buttons
            if (navAuth) navAuth.style.display = 'none';
            if (navUser) navUser.style.display = 'flex';
            if (userWelcome) userWelcome.textContent = `مرحباً، ${currentUser.fullName || currentUser.email}`;
        } else {
            // User is not logged in - show auth buttons, hide user info
            if (navAuth) navAuth.style.display = 'flex';
            if (navUser) navUser.style.display = 'none';
        }

        // Add event listeners for navigation buttons
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = 'index.html#login';
            });
        }

        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                window.location.href = 'index.html#register';
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                    localStorage.removeItem('currentUser');
                    window.location.href = 'index.html';
                }
            });
        }
    }

    prefillUserInfo(user) {
        // Pre-fill form fields with user information
        setTimeout(() => {
            const firstNameField = document.getElementById('firstName');
            const lastNameField = document.getElementById('lastName');
            const emailField = document.getElementById('email');
            const phoneField = document.getElementById('phone');

            if (firstNameField && user.firstName) firstNameField.value = user.firstName;
            if (lastNameField && user.lastName) lastNameField.value = user.lastName;
            if (emailField && user.email) emailField.value = user.email;
            if (phoneField && user.phone) phoneField.value = user.phone;
        }, 100);
    }

    loadCourseData() {
        // الحصول على معرف الكورس من URL
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('course');
        
        if (!courseId) {
            // إذا لم يتم تحديد الكورس، استخدم كورس افتراضي
            courseId = 'english-a1';
        }

        // بيانات الكورسات
        const coursesData = {
            'english-a1': {
                title: 'اللغة الإنجليزية - المستوى A1',
                description: 'كورس شامل لتعلم أساسيات اللغة الإنجليزية للمبتدئين',
                duration: '3 أشهر',
                level: 'مبتدئ',
                price: '150 دولار',
                instructor: 'أ. محمد أحمد',
                schedule: 'الأحد والثلاثاء - 7:00 مساءً',
                features: [
                    'شهادة معتمدة عند الانتهاء',
                    'دروس تفاعلية مع المدرب',
                    'مواد تعليمية شاملة',
                    'اختبارات دورية لقياس التقدم',
                    'مجموعة واتساب للطلاب',
                    'دعم فني على مدار الساعة'
                ]
            },
            'english-a2': {
                title: 'اللغة الإنجليزية - المستوى A2',
                description: 'تطوير مهارات اللغة الإنجليزية للمستوى المتوسط المبتدئ',
                duration: '3 أشهر',
                level: 'متوسط مبتدئ',
                price: '175 دولار',
                instructor: 'أ. سارة محمد',
                schedule: 'الاثنين والأربعاء - 7:00 مساءً',
                features: [
                    'شهادة معتمدة عند الانتهاء',
                    'تركيز على المحادثة والاستماع',
                    'مواد تعليمية متقدمة',
                    'مشاريع عملية',
                    'مجموعة واتساب للطلاب',
                    'جلسات إضافية للمراجعة'
                ]
            },
            'english-speaking': {
                title: 'المحادثة الإنجليزية',
                description: 'تحسين مهارات المحادثة والنطق في اللغة الإنجليزية',
                duration: '2 أشهر',
                level: 'جميع المستويات',
                price: '120 دولار',
                instructor: 'أ. أحمد علي',
                schedule: 'السبت والثلاثاء - 8:00 مساءً',
                features: [
                    'جلسات محادثة مكثفة',
                    'تصحيح النطق',
                    'مواقف حياتية عملية',
                    'تسجيلات صوتية للمراجعة',
                    'مجموعة واتساب للممارسة',
                    'شهادة إتمام'
                ]
            },
            'english-grammar': {
                title: 'قواعد اللغة الإنجليزية',
                description: 'دراسة شاملة لقواعد اللغة الإنجليزية',
                duration: '2.5 أشهر',
                level: 'متوسط',
                price: '130 دولار',
                instructor: 'أ. فاطمة حسن',
                schedule: 'الأحد والخميس - 6:30 مساءً',
                features: [
                    'شرح مفصل للقواعد',
                    'تمارين تطبيقية شاملة',
                    'اختبارات تقييمية',
                    'مراجع ومصادر إضافية',
                    'دعم أكاديمي مستمر',
                    'شهادة معتمدة'
                ]
            },
            'hr-diploma': {
                title: 'دبلوم الموارد البشرية المهني',
                description: 'برنامج شامل في إدارة الموارد البشرية',
                duration: '6 أشهر',
                level: 'متقدم',
                price: '300 دولار',
                instructor: 'د. عبدالله محمد',
                schedule: 'الجمعة والسبت - 5:00 مساءً',
                features: [
                    'دبلوم معتمد دولياً',
                    'دراسات حالة عملية',
                    'ورش عمل تطبيقية',
                    'مشروع تخرج',
                    'شبكة مهنية واسعة',
                    'فرص توظيف'
                ]
            },
            'business-management': {
                title: 'إدارة الأعمال',
                description: 'أساسيات إدارة الأعمال والقيادة',
                duration: '4 أشهر',
                level: 'متوسط',
                price: '220 دولار',
                instructor: 'أ. خالد أحمد',
                schedule: 'الثلاثاء والخميس - 7:30 مساءً',
                features: [
                    'استراتيجيات الإدارة الحديثة',
                    'مهارات القيادة',
                    'إدارة الفرق',
                    'التخطيط الاستراتيجي',
                    'شهادة مهنية',
                    'استشارات مجانية'
                ]
            },
            'marketing-sales': {
                title: 'التسويق والمبيعات',
                description: 'استراتيجيات التسويق الرقمي والمبيعات',
                duration: '3.5 أشهر',
                level: 'متوسط',
                price: '200 دولار',
                instructor: 'أ. نور الدين',
                schedule: 'الاثنين والأربعاء - 8:00 مساءً',
                features: [
                    'التسويق الرقمي',
                    'إدارة وسائل التواصل',
                    'تقنيات البيع',
                    'تحليل السوق',
                    'مشاريع عملية',
                    'شهادة معتمدة'
                ]
            },
            'tot-training': {
                title: 'تدريب المدربين (TOT)',
                description: 'برنامج إعداد وتأهيل المدربين المحترفين',
                duration: '5 أشهر',
                level: 'متقدم',
                price: '280 دولار',
                instructor: 'د. أمينة علي',
                schedule: 'الجمعة والسبت - 6:00 مساءً',
                features: [
                    'مهارات التدريب المتقدمة',
                    'تصميم البرامج التدريبية',
                    'تقنيات العرض والتقديم',
                    'إدارة قاعة التدريب',
                    'شهادة TOT معتمدة',
                    'فرص عمل كمدرب'
                ]
            },
            'programming-web': {
                title: 'البرمجة وتطوير المواقع',
                description: 'تعلم البرمجة وتطوير المواقع من الصفر',
                duration: '6 أشهر',
                level: 'مبتدئ إلى متقدم',
                price: '350 دولار',
                instructor: 'م. يوسف محمد',
                schedule: 'السبت والأحد - 4:00 مساءً',
                features: [
                    'HTML, CSS, JavaScript',
                    'React و Node.js',
                    'قواعد البيانات',
                    'مشاريع عملية',
                    'محفظة أعمال',
                    'دعم في البحث عن عمل'
                ]
            }
        };

        this.courseData = coursesData[courseId];
        
        if (!this.courseData) {
            // إذا لم يتم العثور على الكورس، استخدم بيانات افتراضية
            this.courseData = coursesData['english-a1'];
        }

        this.displayCourseInfo();
    }

    displayCourseInfo() {
        const courseInfoDiv = document.getElementById('courseInfo');
        const courseFeaturesDiv = document.getElementById('courseFeatures');
        const courseConfirmationDiv = document.getElementById('courseConfirmation');

        // عرض معلومات الكورس
        courseInfoDiv.innerHTML = `
            <div class="course-info-item">
                <i class="fas fa-book"></i>
                <strong>اسم الكورس:</strong> ${this.courseData.title}
            </div>
            <div class="course-info-item">
                <i class="fas fa-align-left"></i>
                <strong>الوصف:</strong> ${this.courseData.description}
            </div>
            <div class="course-info-item">
                <i class="fas fa-clock"></i>
                <strong>المدة:</strong> ${this.courseData.duration}
            </div>
            <div class="course-info-item">
                <i class="fas fa-layer-group"></i>
                <strong>المستوى:</strong> ${this.courseData.level}
            </div>
            <div class="course-info-item">
                <i class="fas fa-dollar-sign"></i>
                <strong>السعر:</strong> ${this.courseData.price}
            </div>
            <div class="course-info-item">
                <i class="fas fa-user-tie"></i>
                <strong>المدرب:</strong> ${this.courseData.instructor}
            </div>
            <div class="course-info-item">
                <i class="fas fa-calendar-alt"></i>
                <strong>المواعيد:</strong> ${this.courseData.schedule}
            </div>
        `;

        // عرض مميزات الكورس
        courseFeaturesDiv.innerHTML = this.courseData.features
            .map(feature => `<li>${feature}</li>`)
            .join('');

        // تأكيد اختيار الكورس
        courseConfirmationDiv.innerHTML = `
            <div style="background: #e8f4fd; padding: 20px; border-radius: 10px; text-align: center;">
                <h4 style="color: var(--primary-color); margin-bottom: 10px;">الكورس المختار</h4>
                <h3 style="color: #333; margin-bottom: 5px;">${this.courseData.title}</h3>
                <p style="color: #666; margin-bottom: 10px;">${this.courseData.description}</p>
                <div style="display: flex; justify-content: space-around; margin-top: 15px;">
                    <span><strong>المدة:</strong> ${this.courseData.duration}</span>
                    <span><strong>السعر:</strong> ${this.courseData.price}</span>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Payment method selection
        document.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', () => {
                this.selectPaymentMethod(method.dataset.method);
            });
        });

        // File upload
        const fileInput = document.getElementById('receiptFile');
        const fileUpload = document.querySelector('.file-upload');
        
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });

        // Drag and drop
        fileUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUpload.classList.add('dragover');
        });

        fileUpload.addEventListener('dragleave', () => {
            fileUpload.classList.remove('dragover');
        });

        fileUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUpload.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) {
                document.getElementById('receiptFile').files = e.dataTransfer.files;
                this.handleFileUpload(file);
            }
        });

        // Real-time validation
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const fullNameInput = document.getElementById('fullName');

        if (emailInput) {
            emailInput.addEventListener('input', (e) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (e.target.value.trim() && !emailRegex.test(e.target.value.trim())) {
                    e.target.style.borderColor = '#dc3545';
                    this.showFieldError(e.target, 'البريد الإلكتروني غير صحيح');
                } else if (e.target.value.trim()) {
                    e.target.style.borderColor = '#28a745';
                    this.clearFieldError(e.target);
                } else {
                    e.target.style.borderColor = '#e2e8f0';
                    this.clearFieldError(e.target);
                }
            });
        }

        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                const phoneRegex = /^05[0-9]{8}$/;
                if (e.target.value.trim() && !phoneRegex.test(e.target.value.trim())) {
                    e.target.style.borderColor = '#dc3545';
                    this.showFieldError(e.target, 'رقم الهاتف غير صحيح (05xxxxxxxx)');
                } else if (e.target.value.trim()) {
                    e.target.style.borderColor = '#28a745';
                    this.clearFieldError(e.target);
                } else {
                    e.target.style.borderColor = '#e2e8f0';
                    this.clearFieldError(e.target);
                }
            });
        }

        if (fullNameInput) {
            fullNameInput.addEventListener('input', (e) => {
                if (e.target.value.trim() && e.target.value.trim().length < 3) {
                    e.target.style.borderColor = '#dc3545';
                    this.showFieldError(e.target, 'الاسم قصير جداً');
                } else if (e.target.value.trim()) {
                    e.target.style.borderColor = '#28a745';
                    this.clearFieldError(e.target);
                } else {
                    e.target.style.borderColor = '#e2e8f0';
                    this.clearFieldError(e.target);
                }
            });
        }

        // Form validation
        document.getElementById('enrollmentForm').addEventListener('input', () => {
            this.validateCurrentStep();
        });
    }

    selectPaymentMethod(method) {
        // إزالة التحديد السابق
        document.querySelectorAll('.payment-method').forEach(m => {
            m.classList.remove('selected');
        });

        // إخفاء جميع تفاصيل الدفع
        document.querySelectorAll('.payment-details').forEach(detail => {
            detail.classList.remove('active');
        });

        // تحديد الطريقة الجديدة
        document.querySelector(`[data-method="${method}"]`).classList.add('selected');
        this.selectedPaymentMethod = method;

        // عرض تفاصيل الدفع المناسبة
        const detailsMap = {
            'mobile-money': 'mobileMoneyDetails',
            'areeba': 'areebaDetails',
            'amteen': 'amteenDetails',
            'bank': 'bankDetails'
        };

        const detailsId = detailsMap[method];
        if (detailsId) {
            document.getElementById(detailsId).classList.add('active');
        }

        this.validateCurrentStep();
    }

    handleFileUpload(file) {
        if (!file) return;

        // التحقق من نوع الملف
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            alert('نوع الملف غير مدعوم. يرجى رفع ملف JPG أو PNG أو PDF.');
            return;
        }

        // التحقق من حجم الملف (5 ميجا)
        if (file.size > 5 * 1024 * 1024) {
            alert('حجم الملف كبير جداً. يرجى رفع ملف أقل من 5 ميجا.');
            return;
        }

        // عرض معلومات الملف
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('uploadedFile').classList.add('show');

        this.validateCurrentStep();
    }

    changeStep(direction) {
        if (direction === 1 && !this.validateCurrentStep()) {
            return;
        }

        this.currentStep += direction;
        
        if (this.currentStep < 1) this.currentStep = 1;
        if (this.currentStep > this.totalSteps) this.currentStep = this.totalSteps;

        this.updateStepDisplay();
    }

    updateStepDisplay() {
        // تحديث مؤشر الخطوات
        document.querySelectorAll('.step').forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
            }
        });

        // إخفاء/إظهار خطوات النموذج
        document.querySelectorAll('.form-step').forEach((step, index) => {
            step.classList.remove('active');
            if (index + 1 === this.currentStep) {
                step.classList.add('active');
            }
        });

        // تحديث أزرار التنقل
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        
        if (this.currentStep === this.totalSteps) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }
    }

    validateCurrentStep() {
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        if (!currentStepElement) return false;

        const inputs = currentStepElement.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            this.clearFieldError(input);
            
            if (!input.value.trim()) {
                this.showFieldError(input, 'هذا الحقل مطلوب');
                isValid = false;
            } else if (input.type === 'email' && !this.isValidEmail(input.value)) {
                this.showFieldError(input, 'يرجى إدخال بريد إلكتروني صحيح');
                isValid = false;
            } else if (input.type === 'tel' && !this.isValidPhone(input.value)) {
                this.showFieldError(input, 'يرجى إدخال رقم هاتف صحيح');
                isValid = false;
            } else if (input.id === 'password' && input.value.length < 6) {
                this.showFieldError(input, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
                isValid = false;
            } else if (input.id === 'confirmPassword') {
                const password = document.getElementById('password').value;
                if (input.value !== password) {
                    this.showFieldError(input, 'كلمة المرور غير متطابقة');
                    isValid = false;
                }
            }
        });

        // التحقق من طريقة الدفع في الخطوة 3
        if (this.currentStep === 3 && !this.selectedPaymentMethod) {
            alert('يرجى اختيار طريقة الدفع');
            isValid = false;
        }

        // التحقق من رفع الإيصال في الخطوة 4
        if (this.currentStep === 4) {
            const receiptFile = document.getElementById('receiptFile');
            const paymentAmount = document.getElementById('paymentAmount');
            
            if (!receiptFile.files.length) {
                alert('يرجى رفع إيصال الدفع');
                isValid = false;
            }
            
            if (!paymentAmount.value.trim()) {
                this.showFieldError(paymentAmount, 'يرجى إدخال مبلغ الدفع');
                isValid = false;
            }
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[0-9+\-\s()]{10,}$/;
        return phoneRegex.test(phone);
    }

    collectFormData() {
        const formData = new FormData();
        
        // المعلومات الشخصية
        formData.append('fullName', document.getElementById('fullName').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('phone', document.getElementById('phone').value);
        formData.append('password', document.getElementById('password').value);
        formData.append('age', document.getElementById('age').value);
        formData.append('education', document.getElementById('education').value);
        
        // معلومات الكورس
        formData.append('courseId', new URLSearchParams(window.location.search).get('course'));
        formData.append('courseTitle', this.courseData.title);
        formData.append('coursePrice', this.courseData.price);
        formData.append('motivation', document.getElementById('motivation').value);
        formData.append('experience', document.getElementById('experience').value);
        
        // معلومات الدفع
        formData.append('paymentMethod', this.selectedPaymentMethod);
        formData.append('paymentAmount', document.getElementById('paymentAmount').value);
        formData.append('transactionId', document.getElementById('transactionId').value);
        formData.append('notes', document.getElementById('notes').value);
        
        // ملف الإيصال
        const receiptFile = document.getElementById('receiptFile').files[0];
        if (receiptFile) {
            formData.append('receiptFile', receiptFile);
        }
        
        // معلومات إضافية
        formData.append('submissionDate', new Date().toISOString());
        formData.append('status', 'pending');
        
        return formData;
    }

    async submitEnrollment() {
        if (!this.validateCurrentStep()) {
            return;
        }

        try {
            // إظهار رسالة التحميل
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'جاري الإرسال...';
            submitBtn.disabled = true;

            const formData = this.collectFormData();
            
            // إرسال البيانات إلى API
            const response = await fetch('api/enrollments.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('فشل في إرسال الطلب');
            }

            const result = await response.json();
            
            if (result.success) {
                // إخفاء النموذج وإظهار رسالة النجاح
                document.querySelector('.enrollment-content').style.display = 'none';
                document.getElementById('requestNumber').textContent = result.request_number;
                document.getElementById('successMessage').classList.add('show');
            } else {
                throw new Error(result.message || 'حدث خطأ في إرسال الطلب');
            }
            
        } catch (error) {
            console.error('خطأ في إرسال الطلب:', error);
            alert('حدث خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى.');
            
            // استعادة الزر
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async simulateSubmission(formData) {
        // محاكاة تأخير الشبكة
        return new Promise(resolve => {
            setTimeout(resolve, 2000);
        });
    }

    saveEnrollmentLocally(formData, requestNumber) {
        try {
            // تحويل FormData إلى كائن عادي
            const enrollmentData = {};
            for (let [key, value] of formData.entries()) {
                if (key !== 'receiptFile') { // تجاهل الملف للحفظ المحلي
                    enrollmentData[key] = value;
                }
            }
            
            enrollmentData.requestNumber = requestNumber;
            enrollmentData.submissionDate = new Date().toISOString();
            
            // حفظ التسجيل
            const enrollments = JSON.parse(localStorage.getItem('noorProEnrollments') || '[]');
            enrollments.push(enrollmentData);
            localStorage.setItem('noorProEnrollments', JSON.stringify(enrollments));
            
            // حفظ المستخدم في قائمة المستخدمين المسجلين
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            
            // التحقق من عدم وجود المستخدم مسبقاً
            const existingUser = registeredUsers.find(user => user.email === enrollmentData.email);
            
            if (!existingUser) {
                const newUser = {
                    id: Date.now().toString(),
                    fullName: enrollmentData.fullName,
                    email: enrollmentData.email,
                    phone: enrollmentData.phone,
                    password: enrollmentData.password,
                    registrationDate: new Date().toISOString(),
                    enrolledCourses: [enrollmentData.courseId]
                };
                
                registeredUsers.push(newUser);
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
            } else {
                // إضافة الكورس للمستخدم الموجود
                if (!existingUser.enrolledCourses) {
                    existingUser.enrolledCourses = [];
                }
                if (!existingUser.enrolledCourses.includes(enrollmentData.courseId)) {
                    existingUser.enrolledCourses.push(enrollmentData.courseId);
                    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                }
            }
            
            console.log('تم حفظ التسجيل محلياً:', enrollmentData);
            return true;
        } catch (error) {
            console.error('خطأ في حفظ التسجيل محلياً:', error);
            return false;
        }
    }

    showFieldError(input, message) {
        this.clearFieldError(input);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.cssText = `
            color: #dc3545;
            font-size: 12px;
            margin-top: 5px;
            display: flex;
            align-items: center;
            gap: 5px;
        `;
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i>${message}`;
        
        input.parentNode.appendChild(errorDiv);
    }

    clearFieldError(input) {
        const errorDiv = input.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
}

// وظائف مساعدة
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // إظهار رسالة تأكيد
        const notification = document.createElement('div');
        notification.textContent = 'تم النسخ بنجاح!';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            font-weight: bold;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 2000);
    }).catch(() => {
        alert('فشل في النسخ. يرجى النسخ يدوياً.');
    });
}

function changeStep(direction) {
    if (window.enrollmentSystem) {
        window.enrollmentSystem.changeStep(direction);
    }
}

function submitEnrollment() {
    if (window.enrollmentSystem) {
        window.enrollmentSystem.submitEnrollment();
    }
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.enrollmentSystem = new EnrollmentSystem();
});