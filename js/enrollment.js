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
        // السماح بالتسجيل بدون تسجيل دخول؛ إن وُجدت بيانات المستخدم نستخدمها فقط
        if (isLoggedIn) {
            this.enrollmentData.userId = userData.id;
            this.enrollmentData.userEmail = userData.email;
            this.enrollmentData.userName = userData.fullName;
        }
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
            // دعم الانتقال بالضغط على Enter في الخطوة 1
            enrollmentForm.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (this.currentStep === 1) this.nextStep();
                }
            });
        }

        // أزرار التنقل بين الخطوات
        const nextBtn = document.getElementById('nextBtn');
        const nextBtnInline = document.getElementById('nextBtnInline');
        const prevBtn = document.getElementById('prevBtn');
        const submitBtn = document.getElementById('submitBtn');

        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (nextBtnInline) nextBtnInline.addEventListener('click', () => this.nextStep());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
        if (submitBtn) submitBtn.addEventListener('click', () => this.submitEnrollment());

        // اختيار طريقة الدفع
        const paymentTiles = document.querySelectorAll('.payment-method');
        paymentTiles.forEach(tile => {
            tile.addEventListener('click', () => {
                this.selectPaymentMethod(tile.dataset.method);
            });
        });

        // تحديث الملخص مباشرةً عند تغيير حقول الدفع والملاحظات
        const amountEl = document.getElementById('paymentAmount');
        const txEl = document.getElementById('transactionId');
        const notesEl = document.getElementById('studentNotes');
        const receiptEl = document.getElementById('receiptFile');
        [amountEl, txEl, notesEl, receiptEl].forEach(el => {
            if (el) {
                const evt = el.type === 'file' ? 'change' : 'input';
                el.addEventListener(evt, () => this.updateReviewBlock());
            }
        });
    }

    showStep(step) {
        const steps = document.querySelectorAll('.form-step');
        steps.forEach(s => {
            const isTarget = s.getAttribute('data-step') === String(step);
            s.style.display = isTarget ? 'block' : 'none';
            s.classList.toggle('active', isTarget);
        });

        // حدّث مؤشرات الخطوات (1، 2، 3) لتظهر الحالية والمكتملة
        const indicators = document.querySelectorAll('.step');
        indicators.forEach(ind => {
            const indStep = Number(ind.getAttribute('data-step'));
            ind.classList.toggle('active', indStep === step);
            ind.classList.toggle('completed', indStep < step);
        });

        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        if (prevBtn) prevBtn.style.display = step > 1 ? 'inline-block' : 'none';
        if (nextBtn) nextBtn.style.display = step < 3 ? 'inline-block' : 'none';
        if (submitBtn) submitBtn.style.display = step === 3 ? 'inline-block' : 'none';

        this.currentStep = step;
        if (step === 3) {
            // تأكيد إظهار محتوى الخطوة الثالثة
            const step3 = document.querySelector('.form-step[data-step="3"]');
            if (step3) {
                step3.style.display = 'block';
                step3.classList.add('active');
            }
            const sb = document.getElementById('submitBtn');
            if (sb) sb.style.display = 'inline-block';
            this.updateReviewBlock();
        }
    }

    nextStep() {
        if (this.currentStep === 1) {
            // تحقق من بيانات الطالب
            const fullNameEl = document.getElementById('fullName');
            const phoneEl = document.getElementById('phone');
            const addressEl = document.getElementById('address');

            const fullName = (fullNameEl?.value || '').trim();
            const phone = (phoneEl?.value || '').trim();
            const address = (addressEl?.value || '').trim();

            // اجعل الانتقال يتطلب الاسم والهاتف فقط، العنوان اختياري
            if (!fullName || !phone) {
                this.showToast('يرجى إدخال الاسم ورقم الهاتف أولاً', 'error');
                return;
            }

            this.enrollmentData.fullName = fullName;
            this.enrollmentData.phone = phone;
            if (address) this.enrollmentData.address = address;

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

        // عرض/إخفاء رقم المعاملة حسب الطريقة (مقتصر على موبايل موني وبنكك)
        const needsTransactionId = ['mobile-money','bank'].includes(method);
        if (txGroup) txGroup.style.display = needsTransactionId ? 'block' : 'none';

        // عرض تعليمات الطريقة المختارة
        const infoBox = document.getElementById('methodInfo');
        const infoContent = document.getElementById('methodInfoContent');
        if (infoBox && infoContent) {
            infoBox.style.display = 'block';
            let html = '';
            if (method === 'bank') {
                html = `
                    <div>
                        <div>💳 عبر بنكك</div>
                        <div>الحساب باسم: <strong>نورالدين محمد</strong></div>
                        <div>رقم الحساب: <strong>4055971</strong></div>
                        <div style="margin-top:6px;color:#555">بعد التحويل، فضلاً أدخل رقم العملية وارفع صورة الإيصال إن أمكن.</div>
                    </div>
                `;
            } else if (method === 'mobile-money') {
                html = `
                    <div>
                        <div>📱 عبر موبايل موني</div>
                        <div>الاسم: <strong>محمد محمد نور الدين</strong></div>
                        <div>رقم الهاتف: <strong>+256767033631</strong></div>
                        <div style="margin-top:6px;color:#555">بعد التحويل، أدخل رقم العملية وارفع الإيصال للتأكيد.</div>
                    </div>
                `;
            } else if (method === 'in-person') {
                html = `
                    <div>
                        <div>💵 الدفع عند الحضور</div>
                        <div style="margin-top:6px;color:#555">يمكنك إتمام الدفع في المركز مباشرةً. لا حاجة لرقم معاملة.</div>
                    </div>
                `;
            } else {
                html = `<div>تفاصيل الطريقة ستكون متاحة بعد اختيارك النهائي.</div>`;
            }
            infoContent.innerHTML = html;
        }
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

        // اقرأ القيم مباشرة من الحقول لضمان الظهور حتى لو لم تُحفظ بعد
        const fullName = (document.getElementById('fullName')?.value || this.enrollmentData.fullName || '').trim();
        const phone = (document.getElementById('phone')?.value || this.enrollmentData.phone || '').trim();
        const address = (document.getElementById('address')?.value || this.enrollmentData.address || '').trim();

        const amountInput = parseFloat(document.getElementById('paymentAmount')?.value || '');
        const amount = !isNaN(amountInput) ? amountInput : (this.enrollmentData.paymentDetails?.amount || 0);
        const txField = document.getElementById('transactionId');
        const tx = txField && txField.style.display !== 'none' ? (txField.value || this.enrollmentData.paymentDetails?.transactionId || '') : '';
        const notes = document.getElementById('studentNotes')?.value || '';
        const receiptInput = document.getElementById('receiptFile');
        const receiptName = receiptInput && receiptInput.files && receiptInput.files[0] ? receiptInput.files[0].name : '';

        const courseTitle = this.courseData?.title || this.enrollmentData.courseName || '';
        const courseDesc = this.courseData?.description || '';
        const coursePrice = (this.courseData?.price !== undefined && this.courseData?.price !== null) ? this.courseData.price : '';

        review.innerHTML = `
            <h4 style="margin:0 0 8px 0; color:#0d6efd;">بيانات الطالب</h4>
            <div class="detail-item"><span class="detail-label">الاسم:</span> ${fullName || '—'}</div>
            <div class="detail-item"><span class="detail-label">الهاتف:</span> ${phone || '—'}</div>
            <div class="detail-item"><span class="detail-label">العنوان:</span> ${address || '—'}</div>
            <hr style="margin:10px 0;">
            <h4 style="margin:0 0 8px 0; color:#0d6efd;">بيانات الكورس</h4>
            <div class="detail-item"><span class="detail-label">اسم الدورة:</span> ${courseTitle}</div>
            ${courseDesc ? `<div class=\"detail-item\"><span class=\"detail-label\">وصف مختصر:</span> ${courseDesc}</div>` : ''}
            ${coursePrice !== '' ? `<div class=\"detail-item\"><span class=\"detail-label\">سعر الدورة:</span> ${coursePrice} SDG</div>` : ''}
            <hr style="margin:10px 0;">
            <h4 style="margin:0 0 8px 0; color:#0d6efd;">تفاصيل الدفع</h4>
            <div class="detail-item"><span class="detail-label">طريقة الدفع:</span> ${methodText}</div>
            <div class="detail-item"><span class="detail-label">المبلغ:</span> ${amount}</div>
            ${tx ? `<div class="detail-item"><span class="detail-label">رقم العملية:</span> ${tx}</div>` : ''}
            ${receiptName ? `<div class="detail-item"><span class="detail-label">ملف الإيصال:</span> ${receiptName}</div>` : ''}
            ${notes ? `<div class="detail-item"><span class="detail-label">ملاحظات:</span> ${notes}</div>` : ''}
        `;
    }

    loadCourseData() {
        const urlParams = new URLSearchParams(window.location.search);
        // دعم كلا المفتاحين: courseId و course لضمان التوافق الخلفي
        const rawId = urlParams.get('courseId') || urlParams.get('course') || '';
        // إزالة المسافات والنقاط الزائدة في نهاية المعرّف لمنع روابط مثل 1.
        const courseId = String(rawId).trim().replace(/\.+$/g, '');

        if (!courseId) {
            this.showToast('لم يتم تحديد المقرر المطلوب', 'error');
            this.renderNotFound('لم يتم تحديد المقرر المطلوب. الرجاء اختيار دورة من قائمة الدورات.');
            return;
        }

        const courseUrl = `${this.apiBase}/api/courses/${courseId}`;
        fetch(courseUrl)
            .then(async (response) => {
                const contentType = response.headers.get('content-type') || '';
                // تعامل ودّي مع 404: اعرض رسالة داخلية بدون رمي خطأ
                if (response.status === 404 && contentType.includes('application/json')) {
                    try {
                        const data = await response.json();
                        const msg = (data && (data.message || data.error)) || 'لم يتم العثور على المقرر المطلوب';
                        this.showToast(msg, 'error');
                    } catch (_) {
                        this.showToast('لم يتم العثور على المقرر المطلوب', 'error');
                    }
                    this.renderNotFound('عذراً، هذا الكورس غير متوفر حالياً. يمكنك اختيار دورة أخرى من قائمة الدورات.');
                    return null;
                }
                if (!response.ok || !contentType.includes('application/json')) {
                    const text = await response.text();
                    throw new Error(`HTTP ${response.status} from ${courseUrl}. Content-Type: ${contentType}. Body starts: ${text.slice(0, 120)}`);
                }
                return response.json();
            })
            .then(data => {
                if (!data) return;
                this.courseData = data.course;
                this.enrollmentData.courseId = data.course.id;
                this.enrollmentData.courseName = data.course.title;
                this.displayCourseDetails(data.course);
            })
            .catch(async (error) => {
                console.warn('Error fetching course data:', error);
                // Fallback: load from sample endpoint and find by id
                try {
                    const sampleUrl = `${this.apiBase}/api/courses-sample`;
                    const resp = await fetch(sampleUrl);
                    const ct = resp.headers.get('content-type') || '';
                    if (!resp.ok || !ct.includes('application/json')) {
                        const txt = await resp.text();
                        throw new Error(`Fallback failed: HTTP ${resp.status} from ${sampleUrl}. CT: ${ct}. Body: ${txt.slice(0, 120)}`);
                    }
                    const sampleData = await resp.json();
                    const allCourses = sampleData.courses || sampleData.data || [];
                    const found = allCourses.find(c => String(c.id) === String(courseId));
                    if (!found) {
                        this.showToast('لم يتم العثور على المقرر المطلوب', 'error');
                        this.renderNotFound('عذراً، لم نعثر على هذه الدورة. يمكنك اختيار دورة أخرى من القائمة.');
                        return;
                    }
                    // طبيعـة الحقول قد تختلف في بيانات العينة؛ نوحّدها قبل العرض
                    const normalized = {
                        id: found.id,
                        title: found.title || found.course_name || 'دورة',
                        description: found.description || found.course_description || '',
                        price: found.price || found.course_price || 0,
                        duration: found.duration || found.course_duration || ''
                    };
                    this.courseData = normalized;
                    this.enrollmentData.courseId = normalized.id;
                    this.enrollmentData.courseName = normalized.title;
                    this.displayCourseDetails(normalized);
                } catch (fbErr) {
                    console.warn('Fallback to sample courses failed:', fbErr);
                    this.showToast('تعذر تحميل بيانات المقرر حالياً. يرجى المحاولة لاحقاً.', 'error');
                    this.renderNotFound('حدث خطأ أثناء تحميل البيانات. الرجاء المحاولة لاحقاً أو اختيار دورة أخرى من القائمة.');
                }
            });
    }

    // عرض رسالة ودية داخل صفحة التسجيل بدلاً من التحويل التلقائي
    renderNotFound(message) {
        const infoEl = document.getElementById('courseInfo');
        const featuresEl = document.getElementById('courseFeatures');
        if (featuresEl) {
            featuresEl.innerHTML = '';
        }
        if (infoEl) {
            const html = `
                <div style="background:#fff3cd;border:1px solid #ffeeba;color:#856404;padding:12px;border-radius:6px;">
                    <strong>تنبيه:</strong>
                    <div style="margin-top:6px;">${message}</div>
                    <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
                        <a href="courses.html" style="background:#0d6efd;color:#fff;padding:8px 12px;border-radius:4px;text-decoration:none;">عرض جميع الدورات</a>
                        <a href="javascript:history.back()" style="background:#6c757d;color:#fff;padding:8px 12px;border-radius:4px;text-decoration:none;">رجوع</a>
                    </div>
                </div>`;
            infoEl.innerHTML = html;
        }

        // تعطيل أزرار التقدم إذا كانت موجودة لتفادي إرسال استمارة دون بيانات دورة
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitEnrollmentBtn');
        if (nextBtn) nextBtn.disabled = true;
        if (submitBtn) submitBtn.disabled = true;
    }

    displayCourseDetails(course) {
        const infoEl = document.getElementById('courseInfo');
        const featuresEl = document.getElementById('courseFeatures');
        if (!infoEl) {
            console.warn('Missing #courseInfo element; skipping course details render');
            return;
        }
        // Render structured info blocks compatible with enrollment.html markup
        const fragments = [];
        const addItem = (iconClass, label, value) => {
            if (value === undefined || value === null || value === '') return;
            const div = document.createElement('div');
            div.className = 'course-info-item';
            const icon = document.createElement('i');
            icon.className = iconClass;
            const strong = document.createElement('strong');
            strong.textContent = label;
            const span = document.createElement('span');
            span.textContent = String(value);
            div.appendChild(icon);
            div.appendChild(strong);
            div.appendChild(span);
            fragments.push(div);
        };

        const formatDate = (d) => {
            if (!d) return undefined;
            try {
                const dt = new Date(d);
                if (!isNaN(dt)) return dt.toLocaleDateString('ar-EG');
            } catch (e) {}
            return String(d);
        };
        const formattedPrice = (course.price !== undefined && course.price !== null && course.price !== '')
            ? `${Number(course.price).toLocaleString('ar-EG')} SDG`
            : undefined;

        addItem('fas fa-book', 'العنوان:', course.title);
        addItem('fas fa-align-left', 'الوصف:', course.description);
        addItem('fas fa-clock', 'المدة:', course.duration);
        addItem('fas fa-chalkboard-teacher', 'المُدرّس:', course.instructor_name);
        addItem('fas fa-tags', 'الفئة:', course.category);
        addItem('fas fa-level-up-alt', 'المستوى:', course.level_name);
        addItem('fas fa-calendar-day', 'تاريخ البدء:', formatDate(course.start_date));
        addItem('fas fa-calendar-check', 'تاريخ الانتهاء:', formatDate(course.end_date));
        addItem('fas fa-dollar-sign', 'السعر:', formattedPrice);

        // Clear and append
        infoEl.innerHTML = '';
        fragments.forEach(el => infoEl.appendChild(el));

        // Optional features list
        if (featuresEl) {
            featuresEl.innerHTML = '';
            const features = Array.isArray(course.features) ? course.features : [];
            features.slice(0, 8).forEach(f => {
                const li = document.createElement('li');
                li.textContent = String(f);
                featuresEl.appendChild(li);
            });
        }

        // Target Audience block
        const audienceEl = document.getElementById('courseAudience');
        if (audienceEl) {
            audienceEl.innerHTML = '';
            let audience = course.target_audience || course.audience || course.targetAudience;
            if (Array.isArray(audience)) {
                audience.slice(0, 8).forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = String(item);
                    audienceEl.appendChild(li);
                });
            } else if (typeof audience === 'string' && audience.trim()) {
                const li = document.createElement('li');
                li.textContent = audience.trim();
                audienceEl.appendChild(li);
            } else {
                const fallback = [];
                if (course.level_name) fallback.push(`مناسب لمستوى ${course.level_name}`);
                if (course.category) fallback.push(`مفيد لطلاب ${course.category}`);
                if (fallback.length === 0) fallback.push('مناسب للطلاب المهتمين بهذا المجال');
                fallback.forEach(text => {
                    const li = document.createElement('li');
                    li.textContent = text;
                    audienceEl.appendChild(li);
                });
            }
        }
    }

    submitEnrollment() {
        // لم يعد تسجيل الدخول شرطًا؛ نقرأ بيانات المستخدم إن وُجدت
        this.checkUserAuthentication();

        // يكفي الاسم ورقم الهاتف؛ العنوان اختياري
        if (!this.enrollmentData.fullName || !this.enrollmentData.phone) {
            this.showToast('أدخل الاسم ورقم الهاتف أولاً', 'error');
            this.showStep(1);
            return;
        }

        if (!this.enrollmentData.paymentMethod) {
            this.showToast('اختر طريقة الدفع أولاً', 'error');
            this.showStep(2);
            return;
        }
        const formData = new FormData();
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');

        formData.append('studentName', this.enrollmentData.fullName || '');
        formData.append('email', this.enrollmentData.userEmail || userData.email || '');
        formData.append('phone', this.enrollmentData.phone || '');
        formData.append('address', this.enrollmentData.address || '');
        formData.append('courseId', String(this.enrollmentData.courseId || ''));
        formData.append('courseName', this.enrollmentData.courseName || '');
        formData.append('paymentMethod', this.enrollmentData.paymentMethod || this.selectedPaymentMethod || '');
        const amount = this.enrollmentData.paymentDetails?.amount ?? 0;
        formData.append('paymentAmount', String(amount));
        if (this.enrollmentData.paymentDetails?.transactionId) {
            formData.append('transactionId', this.enrollmentData.paymentDetails.transactionId);
        }

        const receiptInput = document.getElementById('receiptFile');
        if (receiptInput && receiptInput.files && receiptInput.files[0]) {
            formData.append('receiptFile', receiptInput.files[0]);
        }
        const notes = document.getElementById('studentNotes')?.value || '';
        if (notes) formData.append('notes', notes);

        fetch(`${this.apiBase}/api/enrollments`, {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showSuccessMessage();
                const cid = this.enrollmentData.courseId;
                if (cid) {
                    try { window.location.href = `/enrollment-confirmation.html?courseId=${cid}`; } catch (_) {}
                }
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