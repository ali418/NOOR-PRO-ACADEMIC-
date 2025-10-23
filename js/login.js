class LoginSystem {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingLogin();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    checkExistingLogin() {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            // إذا كان المستخدم مسجل دخول بالفعل، توجيهه للصفحة الرئيسية
            this.showMessage('أنت مسجل دخول بالفعل، سيتم توجيهك للصفحة الرئيسية...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // التحقق من صحة البيانات
        if (!this.validateLoginData(email, password)) {
            return;
        }

        // محاولة تسجيل الدخول
        try {
            const loginResult = await this.attemptLogin(email, password);
            
            if (loginResult.success) {
                // حفظ بيانات المستخدم
                localStorage.setItem('currentUser', JSON.stringify(loginResult.user));
                
                this.showMessage('تم تسجيل الدخول بنجاح! سيتم توجيهك...', 'success');
                
                // توجيه المستخدم بعد ثانيتين
                setTimeout(() => {
                    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
                    window.location.href = redirectUrl;
                }, 2000);
            } else {
                this.showMessage(loginResult.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
            }
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            this.showMessage('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.', 'error');
        }
    }

    validateLoginData(email, password) {
        if (!email || !password) {
            this.showMessage('يرجى ملء جميع الحقول المطلوبة', 'error');
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showMessage('يرجى إدخال بريد إلكتروني صحيح', 'error');
            return false;
        }

        if (password.length < 6) {
            this.showMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
            return false;
        }

        return true;
    }

    async attemptLogin(email, password) {
        // محاولة الحصول على المستخدمين المسجلين من localStorage
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        
        // البحث عن المستخدم
        const user = registeredUsers.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.password === password
        );

        if (user) {
            return {
                success: true,
                user: {
                    id: user.id,
                    name: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    loginTime: new Date().toISOString()
                }
            };
        }

        // إذا لم يتم العثور على المستخدم، إنشاء حساب تجريبي للاختبار
        if (email === 'admin@noor.com' && password === '123456') {
            return {
                success: true,
                user: {
                    id: 'admin',
                    name: 'المدير',
                    email: 'admin@noor.com',
                    phone: '0123456789',
                    loginTime: new Date().toISOString(),
                    role: 'admin'
                }
            };
        }

        return {
            success: false,
            message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showMessage(message, type) {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        
        // إخفاء جميع الرسائل أولاً
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';
        
        if (type === 'error') {
            document.getElementById('errorText').textContent = message;
            errorDiv.style.display = 'block';
        } else if (type === 'success') {
            document.getElementById('successText').textContent = message;
            successDiv.style.display = 'block';
        }
        
        // إخفاء الرسالة بعد 5 ثوانٍ
        setTimeout(() => {
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';
        }, 5000);
    }
}

// تشغيل النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new LoginSystem();
});