class EnrollmentSystem {
    constructor() {
        this.enrollmentData = {};
        this.apiBase = 'https://nooracademic.up.railway.app';
        this.currentStep = 1;
        this.selectedPaymentMethod = null;
        
        this.init();
    }

    init() {
        this.checkUserAuthentication();
        this.setupEventListeners();
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
        // منع إرسال النموذج المباشر
        const enrollmentForm = document.getElementById('enrollmentForm');
        if (enrollmentForm) {
            enrollmentForm.addEventListener('submit', (e) => e.preventDefault());
        }

        // أزرار التنقل بين الخطوات
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const submitBtn = document.getElementById('submitBtn');

        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
        if (submitBtn) submitBtn.addEventListener('click', () => this.submitEnrollment());

        // اختيار طريقة الدفع
        const paymentTiles = document.querySelectorAll('.payment-method');
        paymentTiles.forEach(tile => {
            tile.addEventListener('click', () => {
                this.selectPaymentMethod(tile.dataset.method);
            });
        });
    }

    showStep(step) {
        const steps = document.querySelectorAll('.form-step');
        steps.forEach(s => {
            const isTarget = s.getAttribute('data-step') === String(step);
            s.style.display = isTarget ? 'block' : 'none';
            s.classList.toggle('active', isTarget);
        });

        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        if (prevBtn) prevBtn.style.display = step > 1 ? 'inline-block' : 'none';
        if (nextBtn) nextBtn.style.display = step < 3 ? 'inline-block' : 'none';
        if (submitBtn) submitBtn.style.display = step === 3 ? 'inline-block' : 'none';

        this.currentStep = step;
        if (step === 3) this.updateReviewBlock();
    }

    nextStep() {
        if (this.currentStep === 1) {
            // تحقق من بيانات الطالب
            const fullName = document.getElementById('fullName').value;
            const phone = document.getElementById('phone').value;
            const address = document.getElementById('address').value;

            if (!fullName || !phone || !address) {
                this.showToast('أكمل بياناتك الأساسية أولاً', 'error');
                return;
            }

            this.enrollmentData.fullName = fullName;
            this.enrollmentData.phone = phone;
            this.enrollmentData.address = address;

            this.showStep(2);
        } else if (this.currentStep === 2) {
            if (!this.selectedPaymentMethod) {
                this.showToast('اختر طريقة الدفع للاستمرار', 'error');
                return;
            }

            // حفظ تفاصيل الدفع
            const amount = parseFloat(document.getElementById('paymentAmount')?.value || '0');
            const transactionIdEl = document.getElementById('transactionId');
            const transactionId = transactionIdEl && transactionIdEl.style.display !== 'none' ? (transactionIdEl.value || '') : '';

            const paymentDetails = {
                amount: isNaN(amount) ? 0 : amount,
                transactionId: transactionId || undefined
            };

            // احفظ بصيغتين لضمان التوافق
            this.enrollmentData.paymentMethod = this.selectedPaymentMethod;
            this.enrollmentData.paymentDetails = paymentDetails;
            this.enrollmentData.payment_method = this.selectedPaymentMethod;
            this.enrollmentData.payment_details = paymentDetails;

            this.showStep(3);
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    }

    selectPaymentMethod(method) {
        this.selectedPaymentMethod = method;
        // تمييز العنصر المحدد بصرياً
        document.querySelectorAll('.payment-method').forEach(el => {
            el.classList.toggle('selected', el.dataset.method === method);
        });

        const details = document.getElementById('paymentDetails');
        const txGroup = document.getElementById('transactionIdGroup');
        if (details) details.style.display = 'block';

        // عرض/إخفاء رقم المعاملة حسب الطريقة
        const needsTransactionId = ['mobile-money','bank','areeba','amteen','bank-transfer'].includes(method);
        if (txGroup) txGroup.style.display = needsTransactionId ? 'block' : 'none';
    }

    updateReviewBlock() {
        const review = document.getElementById('reviewBlock');
        if (!review) return;

        const methodText = {
            'mobile-money': 'موبايل موني',
            'bank': 'بنكك',
            'areeba': 'أريبا',
            'amteen': 'أمتين',
            'bank-transfer': 'تحويل بنكي',
            'in-person': 'دفع مباشر'
        }[this.selectedPaymentMethod] || this.selectedPaymentMethod || 'غير محدد';

        const amount = this.enrollmentData.paymentDetails?.amount || 0;
        const tx = this.enrollmentData.paymentDetails?.transactionId || '';

        review.innerHTML = `
            <div class="detail-item"><span class="detail-label">الاسم:</span> ${this.enrollmentData.fullName}</div>
            <div class="detail-item"><span class="detail-label">الهاتف:</span> ${this.enrollmentData.phone}</div>
            <div class="detail-item"><span class="detail-label">العنوان:</span> ${this.enrollmentData.address}</div>
            <hr style="margin:10px 0;">
            <div class="detail-item"><span class="detail-label">الدورة:</span> ${this.enrollmentData.courseName || ''}</div>
            <div class="detail-item"><span class="detail-label">طريقة الدفع:</span> ${methodText}</div>
            <div class="detail-item"><span class="detail-label">المبلغ:</span> ${amount} دولار</div>
            ${tx ? `<div class="detail-item"><span class="detail-label">رقم العملية:</span> ${tx}</div>` : ''}
        `;
    }

    loadCourseData() {
        const urlParams = new URLSearchParams(window.location.search);
        // دعم كلا المفتاحين: courseId و course لضمان التوافق الخلفي
        const courseId = urlParams.get('courseId') || urlParams.get('course');

        if (!courseId) {
            window.location.href = 'courses.html';
            return;
        }

        fetch(`${this.apiBase}/api/courses/${courseId}`)
            .then(response => response.json())
            .then(data => {
                this.courseData = data;
                this.enrollmentData.courseId = data.id;
                this.enrollmentData.courseName = data.title;
                this.displayCourseDetails(data);
            })
            .catch(error => console.error('Error fetching course data:', error));
    }

    displayCourseDetails(course) {
        document.getElementById('courseTitle').textContent = course.title;
        document.getElementById('courseDescription').textContent = course.description;
        document.getElementById('coursePrice').textContent = `Price: ${course.price} SDG`;
    }

    submitEnrollment() {
        if (!this.checkUserAuthentication()) return;

        if (!this.enrollmentData.fullName || !this.enrollmentData.phone || !this.enrollmentData.address) {
            this.showToast('أكمل بياناتك الأساسية أولاً', 'error');
            this.showStep(1);
            return;
        }

        if (!this.enrollmentData.paymentMethod) {
            this.showToast('اختر طريقة الدفع أولاً', 'error');
            this.showStep(2);
            return;
        }

        fetch(`${this.apiBase}/api/enrollments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.enrollmentData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showSuccessMessage();
            } else {
                this.showToast(data.message || 'فشل إرسال طلب التسجيل', 'error');
            }
        })
        .catch(error => {
            console.error('Error submitting enrollment:', error);
            this.showToast('حدث خطأ، حاول مرة أخرى', 'error');
        });
    }

    showSuccessMessage() {
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.style.display = 'flex';
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new EnrollmentSystem();
});