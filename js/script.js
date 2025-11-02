// Language Management System
class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'ar';
        this.translations = {};
        this.init();
    }

    init() {
        this.setLanguage(this.currentLang);
        this.bindEvents();
        this.loadTranslations();
    }

    bindEvents() {
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => this.toggleLanguage());
        }
    }

    toggleLanguage() {
        this.currentLang = this.currentLang === 'ar' ? 'en' : 'ar';
        this.setLanguage(this.currentLang);
        localStorage.setItem('language', this.currentLang);
    }

    setLanguage(lang) {
        const html = document.documentElement;
        const body = document.body;
        const langText = document.getElementById('langText');

        if (lang === 'ar') {
            html.setAttribute('lang', 'ar');
            html.setAttribute('dir', 'rtl');
            body.classList.add('arabic-text');
            body.classList.remove('english-text');
            if (langText) langText.textContent = 'English';
        } else {
            html.setAttribute('lang', 'en');
            html.setAttribute('dir', 'ltr');
            body.classList.add('english-text');
            body.classList.remove('arabic-text');
            if (langText) langText.textContent = 'العربية';
        }

        this.updateContent(lang);
        this.currentLang = lang;
    }

    updateContent(lang) {
        const elements = document.querySelectorAll('[data-ar][data-en]');
        elements.forEach(element => {
            const text = element.getAttribute(`data-${lang}`);
            if (text) {
                element.textContent = text;
            }
        });

        // Update placeholders
        const inputs = document.querySelectorAll('input[placeholder]');
        inputs.forEach(input => {
            const arPlaceholder = input.getAttribute('data-placeholder-ar');
            const enPlaceholder = input.getAttribute('data-placeholder-en');
            if (arPlaceholder && enPlaceholder) {
                input.placeholder = lang === 'ar' ? arPlaceholder : enPlaceholder;
            }
        });
    }

    loadTranslations() {
        // This would typically load from a JSON file or API
        this.translations = {
            ar: {
                welcome: 'مرحباً بكم',
                loading: 'جاري التحميل...',
                error: 'حدث خطأ',
                success: 'تم بنجاح'
            },
            en: {
                welcome: 'Welcome',
                loading: 'Loading...',
                error: 'An error occurred',
                success: 'Success'
            }
        };
    }

    t(key) {
        return this.translations[this.currentLang][key] || key;
    }
}

// إدارة الإحصائيات
class StatsManager {
    constructor() {
        this.apiUrl = '/api/stats';
    }

    init() {
        this.loadStats();
    }

    async loadStats() {
        try {
            const response = await fetch(this.apiUrl);
            const result = await response.json();
            
            // دعم شكلين من الاستجابة:
            // 1) { success: true, data: { totalStudents, totalTeachers, totalCourses, successRate } }
            // 2) { students, teachers, courses, successRate }
            let statsData = null;
            if (result && result.success && result.data) {
                statsData = result.data;
            } else if (result && (typeof result.students !== 'undefined' || typeof result.courses !== 'undefined')) {
                statsData = {
                    totalStudents: result.students ?? 0,
                    totalTeachers: result.teachers ?? 0,
                    totalCourses: result.courses ?? 0,
                    successRate: result.successRate ?? 95
                };
            }

            if (statsData) {
                this.updateStatsDisplay(statsData);
            } else {
                console.warn('فشل في جلب الإحصائيات:', result && (result.error || result.message) || 'خطأ غير معروف');
                this.showDefaultStats();
            }
        } catch (error) {
            console.error('خطأ في جلب الإحصائيات:', error);
            this.showDefaultStats();
        }
    }

    updateStatsDisplay(stats) {
        // تحديث عدد الطلاب
        const studentsElement = document.getElementById('totalStudents');
        if (studentsElement) {
            this.animateCounterTo(studentsElement, stats.totalStudents || 0);
        }

        // تحديث عدد المعلمين
        const teachersElement = document.getElementById('totalTeachers');
        if (teachersElement) {
            this.animateCounterTo(teachersElement, stats.totalTeachers || 0);
        }

        // تحديث عدد المقررات
        const coursesElement = document.getElementById('totalCourses');
        if (coursesElement) {
            this.animateCounterTo(coursesElement, stats.totalCourses || 0);
        }

        // تحديث معدل النجاح
        const successRateElement = document.getElementById('successRate');
        if (successRateElement) {
            this.animateCounterTo(successRateElement, stats.successRate || 95, '%');
        }
    }

    showDefaultStats() {
        // عرض إحصائيات افتراضية في حالة فشل جلب البيانات
        const defaultStats = {
            totalStudents: 0,
            totalTeachers: 0,
            totalCourses: 0,
            successRate: 95
        };
        this.updateStatsDisplay(defaultStats);
    }

    animateCounterTo(element, targetValue, suffix = '') {
        const duration = 2000;
        const startValue = 0;
        const increment = targetValue / (duration / 16);
        let currentValue = startValue;

        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            element.textContent = Math.floor(currentValue) + suffix;
        }, 16);
    }
}

// Navigation Management
class NavigationManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.handleScroll();
    }

    bindEvents() {
        // Mobile menu toggle
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');

        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                hamburger.classList.toggle('active');
            });
        }

        // Smooth scrolling for navigation links
        const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar')) {
                navMenu?.classList.remove('active');
                hamburger?.classList.remove('active');
            }
        });
    }

    handleScroll() {
        const header = document.querySelector('.header');
        let lastScrollTop = 0;

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 100) {
                header?.classList.add('scrolled');
            } else {
                header?.classList.remove('scrolled');
            }

            // Hide/show header on scroll
            if (scrollTop > lastScrollTop && scrollTop > 200) {
                header?.classList.add('hidden');
            } else {
                header?.classList.remove('hidden');
            }
            
            lastScrollTop = scrollTop;
        });
    }
}

// Modal Management
class ModalManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Login modal
        const loginBtn = document.querySelector('.btn-login');
        const loginModal = document.getElementById('loginModal');
        
        if (loginBtn && loginModal) {
            loginBtn.addEventListener('click', () => this.openModal('loginModal'));
        }

        // Register modal
        const registerBtn = document.querySelector('.btn-register');
        const registerModal = document.getElementById('registerModal');
        
        if (registerBtn && registerModal) {
            registerBtn.addEventListener('click', () => this.openModal('registerModal'));
        }

        // إغلاق النوافذ المنبثقة عند النقر على زر الإغلاق
        const closeButtons = document.querySelectorAll('.modal .close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
            });
        });

        // إغلاق النوافذ المنبثقة عند النقر خارج المحتوى
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Form submissions
        this.bindFormEvents();
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
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

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    bindFormEvents() {
        // تم إزالة كل ما يتعلق بنماذج تسجيل الدخول والتسجيل
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const email = formData.get('email') || form.querySelector('input[type="email"]').value;
        const password = formData.get('password') || form.querySelector('input[type="password"]').value;
        const submitBtn = form.querySelector('.btn-submit');
        
        // Validate inputs
        if (!email || !password) {
            this.showNotification('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
            return;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showNotification('البريد الإلكتروني غير صحيح', 'error');
            return;
        }
        
        // Show loading state
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="loading"></span>';
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await this.simulateApiCall();
            
            // Check credentials using AuthManager if available
            if (window.AuthManager) {
                const authManager = new window.AuthManager();
                const user = authManager.authenticateUser(email, password);
                
                if (user) {
                    this.showNotification('تم تسجيل الدخول بنجاح', 'success');
                    this.closeModal('loginModal');
                    form.reset();
                    
                    // Redirect based on user type
                    setTimeout(() => {
                        if (user.userType === 'admin') {
                            window.location.href = 'admin-dashboard.html';
                        } else if (user.userType === 'teacher') {
                            window.location.href = 'teacher-dashboard.html';
                        } else {
                            window.location.href = 'student-dashboard.html';
                        }
                    }, 1500);
                } else {
                    this.showNotification('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
                }
            } else {
                // Fallback authentication
                this.showNotification('تم تسجيل الدخول بنجاح', 'success');
                this.closeModal('loginModal');
                form.reset();
            }
        } catch (error) {
            this.showNotification('خطأ في تسجيل الدخول', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const inputs = form.querySelectorAll('input');
        const submitBtn = form.querySelector('.btn-submit');
        
        // Get form data
        const fullName = inputs[0].value.trim();
        const email = inputs[1].value.trim();
        const password = inputs[2].value.trim();
        const confirmPassword = inputs[3].value.trim();
        
        // Validate inputs
        if (!fullName || !email || !password || !confirmPassword) {
            this.showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        // Name validation
        if (fullName.length < 2) {
            this.showNotification('الاسم قصير جداً', 'error');
            return;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showNotification('البريد الإلكتروني غير صحيح', 'error');
            return;
        }

        // Password validation
        if (password.length < 6) {
            this.showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
            return;
        }

        // Password confirmation
        if (password !== confirmPassword) {
            this.showNotification('كلمة المرور وتأكيدها غير متطابقتين', 'error');
            return;
        }
        
        // Show loading state
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="loading"></span>';
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await this.simulateApiCall();
            
            // Check if AuthManager is available
            if (window.AuthManager) {
                const authManager = new window.AuthManager();
                const users = authManager.loadUsers();
                
                // Check if email already exists
                const existingUser = users.find(user => user.email === email);
                if (existingUser) {
                    this.showNotification('البريد الإلكتروني مستخدم بالفعل', 'error');
                    return;
                }
                
                // Create new user
                const userData = {
                    id: Date.now().toString(),
                    firstName: fullName.split(' ')[0],
                    lastName: fullName.split(' ').slice(1).join(' ') || '',
                    email: email,
                    phone: '',
                    password: password,
                    userType: 'student',
                    createdAt: new Date().toISOString(),
                    isActive: true,
                    isVerified: false
                };
                
                // Register user
                if (authManager.registerUser(userData)) {
                    this.showNotification('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول', 'success');
                    this.closeModal('registerModal');
                    form.reset();
                    
                    // Switch to login modal after delay
                    setTimeout(() => {
                        this.openModal('loginModal');
                    }, 2000);
                } else {
                    this.showNotification('حدث خطأ في إنشاء الحساب', 'error');
                }
            } else {
                // Fallback registration
                this.showNotification('تم إنشاء الحساب بنجاح!', 'success');
                this.closeModal('registerModal');
                form.reset();
            }
        } catch (error) {
            this.showNotification('خطأ في التسجيل', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    simulateApiCall() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate 90% success rate
                if (Math.random() > 0.1) {
                    resolve();
                } else {
                    reject(new Error('API Error'));
                }
            }, 2000);
        });
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
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Animation Manager
class AnimationManager {
    constructor() {
        this.init();
    }

    init() {
        this.observeElements();
        this.initCounters();
    }

    observeElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements for animation
        const animatedElements = document.querySelectorAll(
            '.feature-card, .course-card, .stat-item, .hero-text, .floating-cards'
        );
        
        animatedElements.forEach(el => {
            observer.observe(el);
        });
    }

    initCounters() {
        const counters = document.querySelectorAll('.stat-number');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        });

        counters.forEach(counter => observer.observe(counter));
    }

    animateCounter(element) {
        const target = parseInt(element.textContent.replace(/\D/g, ''));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            const suffix = element.textContent.includes('%') ? '%' : '+';
            element.textContent = Math.floor(current) + suffix;
        }, 16);
    }
}

// Course Management
class CourseManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const enrollButtons = document.querySelectorAll('.btn-enroll');
        enrollButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleEnrollment(e));
        });
    }

    handleEnrollment(e) {
        e.preventDefault();
        
        // الحصول على رابط التسجيل من الزر مباشرة
        const enrollBtn = e.target;
        const enrollmentUrl = enrollBtn.getAttribute('onclick');
        
        // استخراج معرف الكورس من الرابط
        let courseId = '';
        
        if (enrollmentUrl && enrollmentUrl.includes('enrollment.html')) {
            // استخراج رابط التسجيل من onclick
            const match = enrollmentUrl.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/);
            if (match) {
                const url = match[1];
                const courseMatch = url.match(/course=([^&]+)/);
                if (courseMatch) {
                    courseId = courseMatch[1];
                }
            }
        }
        
        if (!courseId) {
            // إذا لم يتم العثور على معرف الكورس، استخدم الطريقة القديمة
            const courseCard = e.target.closest('.course-card');
            if (courseCard) {
                const courseName = courseCard.querySelector('h3').textContent;
                courseId = this.getCourseIdFromName(courseName);
            } else {
                courseId = 'english-a1'; // معرف افتراضي
            }
        }
        
        // توجيه المستخدم مباشرة إلى صفحة التسجيل مع عرض بيانات الكورس
        window.location.href = `enrollment.html?course=${courseId}`;
    }

    getCourseIdFromName(courseName) {
        // تحديد معرف الكورس بناءً على الاسم
        const courseMapping = {
            'اللغة الإنجليزية - المستوى A1': 'english-a1',
            'اللغة الإنجليزية - المستوى A2': 'english-a2',
            'المحادثة الإنجليزية': 'english-speaking',
            'قواعد اللغة الإنجليزية': 'english-grammar',
            'دبلوم الموارد البشرية المهني': 'hr-diploma',
            'إدارة الأعمال': 'business-management',
            'التسويق والمبيعات': 'marketing-sales',
            'تدريب المدربين (TOT)': 'tot-training',
            'البرمجة وتطوير المواقع': 'programming-web'
        };
        
        return courseMapping[courseName] || 'english-a1';
    }
}

// Search Functionality
class SearchManager {
    constructor() {
        this.init();
    }

    init() {
        this.createSearchBar();
        this.bindEvents();
    }

    createSearchBar() {
        // Search bar is already created in HTML, no need to create it dynamically
        const existingSearchContainer = document.querySelector('.search-box');
        if (existingSearchContainer) {
            return; // Search bar already exists
        }
        
        // Fallback: create search bar if it doesn't exist
        console.log('Creating fallback search bar');
    }

    bindEvents() {
        const searchInput = document.querySelector('.search-input');
        const searchBtn = document.querySelector('.search-btn');

        if (searchInput && searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });

            // Live search
            searchInput.addEventListener('input', (e) => {
                this.liveSearch(e.target.value);
            });
        }
    }

    performSearch() {
        const query = document.querySelector('.search-input').value;
        if (query.trim()) {
            this.showSearchResults(query);
        }
    }

    liveSearch(query) {
        if (query.length < 2) return;
        
        // Search in course titles and descriptions
        const courses = document.querySelectorAll('.course-card');
        courses.forEach(course => {
            const title = course.querySelector('h3').textContent.toLowerCase();
            const description = course.querySelector('p').textContent.toLowerCase();
            const searchTerm = query.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                course.style.display = 'block';
                course.classList.add('search-highlight');
            } else {
                course.style.display = 'none';
                course.classList.remove('search-highlight');
            }
        });
    }

    showSearchResults(query) {
        // Scroll to courses section
        const coursesSection = document.getElementById('courses');
        if (coursesSection) {
            coursesSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeToggle();
    }

    createThemeToggle() {
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        themeToggle.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: none;
            background: var(--primary-color);
            color: white;
            cursor: pointer;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            transition: var(--transition);
        `;

        themeToggle.addEventListener('click', () => this.toggleTheme());
        document.body.appendChild(themeToggle);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
    }

    applyTheme(theme) {
        const root = document.documentElement;
        const themeToggle = document.querySelector('.theme-toggle i');
        
        if (theme === 'dark') {
            root.style.setProperty('--white', '#1a1a1a');
            root.style.setProperty('--gray-50', '#2a2a2a');
            root.style.setProperty('--gray-100', '#3a3a3a');
            root.style.setProperty('--gray-800', '#e5e5e5');
            root.style.setProperty('--gray-700', '#f0f0f0');
            root.style.setProperty('--gray-600', '#f5f5f5');
            
            if (themeToggle) themeToggle.className = 'fas fa-sun';
        } else {
            root.style.setProperty('--white', '#ffffff');
            root.style.setProperty('--gray-50', '#f8fafc');
            root.style.setProperty('--gray-100', '#f3f4f6');
            root.style.setProperty('--gray-800', '#1f2937');
            root.style.setProperty('--gray-700', '#374151');
            root.style.setProperty('--gray-600', '#4b5563');
            
            if (themeToggle) themeToggle.className = 'fas fa-moon';
        }
    }
}

// Initialize all managers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all systems
    const languageManager = new LanguageManager();
    const navigationManager = new NavigationManager();
    const modalManager = new ModalManager();
    const animationManager = new AnimationManager();
    const courseManager = new CourseManager();
    
    // Only initialize SearchManager if we're not on auth page
    if (!window.location.pathname.includes('auth.html')) {
        const searchManager = new SearchManager();
    }
    
    const themeManager = new ThemeManager();
    const statsManager = new StatsManager();
    statsManager.init();

    // Add loading animation
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = '<div class="loading"></div>';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--white);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity 0.5s ease;
    `;
    
    document.body.appendChild(loader);
    
    // Hide loader after page loads
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(loader);
            }, 500);
        }, 1000);
    });

    // Add smooth reveal animations
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            animation: slideUp 0.6s ease-out forwards;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .search-highlight {
            border: 2px solid var(--accent-color) !important;
            transform: scale(1.02);
        }
        
        .header.scrolled {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
        }
        
        .header.hidden {
            transform: translateY(-100%);
        }
        
        .search-container {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin: 0 1rem;
        }
        
        .search-input {
            padding: 8px 12px;
            border: 2px solid var(--gray-300);
            border-radius: var(--border-radius);
            font-size: 14px;
            width: 200px;
            transition: var(--transition);
        }
        
        .search-input:focus {
            outline: none;
            border-color: var(--primary-color);
        }
        
        .search-btn {
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: var(--border-radius);
            cursor: pointer;
            transition: var(--transition);
        }
        
        .search-btn:hover {
            background: var(--secondary-color);
        }
        
        @media (max-width: 768px) {
            .search-container {
                display: none;
            }
        }
    `;
    
    document.head.appendChild(style);

    console.log('🎉 Noor Pro Academic Center System Initialized Successfully!');
});