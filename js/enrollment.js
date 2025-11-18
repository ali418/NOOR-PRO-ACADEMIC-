class EnrollmentSystem {
    constructor() {
        this.enrollmentData = {};
        // استخدم الخادم المحلي أثناء التطوير تلقائياً
        const isLocal = typeof window !== 'undefined' && /localhost|127\.0\.0\.1/i.test(window.location.hostname);
        this.apiBase = isLocal ? '' : 'https://nooracademic.up.railway.app';
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
        const submitBtnFooter = document.getElementById('submitBtnFooter');

        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (nextBtnInline) nextBtnInline.addEventListener('click', () => this.nextStep());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
        if (submitBtn) submitBtn.addEventListener('click', () => this.submitEnrollment());
        if (submitBtnFooter) submitBtnFooter.addEventListener('click', () => this.submitEnrollment());

        // تأكد برمجياً من وجود زر تأكيد احتياطي في الأسفل في حال كان القالب قديم
        this.ensureSubmitButtons();

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

        // تحذير فوري لحقل الهاتف عند عدم وجود مفتاح دولة
        const phoneInput = document.getElementById('phone');
        const phoneWarning = document.getElementById('phoneWarning');
        if (phoneInput) {
            const updatePhoneWarning = () => {
                const val = (phoneInput.value || '').trim();
                if (!val) {
                    if (phoneWarning) phoneWarning.style.display = 'none';
                    phoneInput.style.borderColor = '';
                    return;
                }
                if (this.hasCountryCode(val)) {
                    if (phoneWarning) phoneWarning.style.display = 'none';
                    phoneInput.style.borderColor = '';
                } else {
                    if (phoneWarning) {
                        phoneWarning.style.display = 'block';
                        phoneWarning.textContent = 'تنبيه: اكتب الرقم مع مفتاح الدولة مثل +256XXXXXXXX أو 00256XXXXXXXX؛ هذا ضروري لأننا نتواصل عبر واتساب.';
                    }
                    phoneInput.style.borderColor = '#b00020';
                }
            };
            phoneInput.addEventListener('input', updatePhoneWarning);
            // أضف إدراج تلقائي لمفتاح الدولة 00256 عند فقدان التركيز
            phoneInput.addEventListener('blur', () => {
                const val = (phoneInput.value || '').trim();
                if (!this.hasCountryCode(val) && val) {
                    const normalized = this.applyDefaultUgandaCode(val);
                    phoneInput.value = normalized;
                    updatePhoneWarning();
                }
            });
            // تحديث أولي إذا وُجدت قيمة
            setTimeout(updatePhoneWarning, 0);
        }
    }

    ensureSubmitButtons() {
        try {
            // أنشئ زر سفلي إذا لم يكن موجوداً
            let submitBtnFooter = document.getElementById('submitBtnFooter');
            if (!submitBtnFooter) {
                const btnGroup = document.querySelector('.btn-group');
                if (btnGroup) {
                    submitBtnFooter = document.createElement('button');
                    submitBtnFooter.type = 'button';
                    submitBtnFooter.id = 'submitBtnFooter';
                    submitBtnFooter.className = 'btn btn-primary';
                    submitBtnFooter.style.display = 'none';
                    submitBtnFooter.textContent = 'تأكيد التسجيل';
                    btnGroup.appendChild(submitBtnFooter);
                    submitBtnFooter.addEventListener('click', () => this.submitEnrollment());
                }
            }

            // إن لم يكن زر التأكيد داخل الخطوة موجوداً، جرّب إنشاء واحد داخل محتوى الخطوة 3
            let submitBtn = document.getElementById('submitBtn');
            if (!submitBtn) {
                const step3 = document.querySelector('.form-step[data-step="3"] .btn-group');
                if (step3) {
                    submitBtn = document.createElement('button');
                    submitBtn.type = 'button';
                    submitBtn.id = 'submitBtn';
                    submitBtn.className = 'btn btn-primary';
                    submitBtn.style.display = 'none';
                    submitBtn.textContent = 'تأكيد التسجيل';
                    step3.appendChild(submitBtn);
                    submitBtn.addEventListener('click', () => this.submitEnrollment());
                }
            }
        } catch (_) {}
    }

    // يتحقق من وجود مفتاح دولة في الرقم: يقبل +، 00، أو بداية برقم غير صفري بطول مناسب
    hasCountryCode(raw) {
        const v = String(raw || '').trim().replace(/\s+/g, '');
        if (!v) return false;
        if (v.startsWith('+')) return true;
        if (v.startsWith('00')) return true;
        // اعتبار أرقام تبدأ برقم غير صفري وبطول معقول كأرقام دولية (مثال: 249... أو 966...)
        return /^[1-9]\d{7,}$/.test(v);
    }

    // إدراج مفتاح أوغندا 00256 تلقائياً للأرقام المحلية أو الخالية من المفتاح
    applyDefaultUgandaCode(raw) {
        let digits = String(raw || '').replace(/\D+/g, '');
        if (!digits) return '';
        // إن كان يبدأ بـ 00 أو + فلا حاجة
        if (digits.startsWith('00')) return digits; // يبقى 00...
        if ((raw || '').trim().startsWith('+')) return (raw || '').trim(); // احفظ الشكل مع + كما هو
        // إن كان محلياً يبدأ بـ 0، أزل 0 وأضف 00256
        if (digits.startsWith('0')) {
            digits = digits.replace(/^0+/, '');
            return `00256${digits}`;
        }
        // إن كان أرقام بلا 0 ومع ذلك بلا مفتاح، أضف 00256
        return `00256${digits}`;
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
        const submitBtnFooter = document.getElementById('submitBtnFooter');

        if (prevBtn) prevBtn.style.display = step > 1 ? 'inline-block' : 'none';
        
        // Hide the main next button in step 1, as there is an inline one
        if (nextBtn) {
            nextBtn.textContent = (step === 2) ? 'إتمام التسجيل' : 'الانتقال للخطوة التالية';
            if (step === 1) {
                nextBtn.style.display = 'none';
            } else {
                nextBtn.style.display = step < 3 ? 'inline-block' : 'none';
            }
        }

        if (submitBtn) submitBtn.style.display = step === 3 ? 'inline-block' : 'none';
        if (submitBtnFooter) submitBtnFooter.style.display = step === 3 ? 'inline-block' : 'none';

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
            const sbf = document.getElementById('submitBtnFooter');
            if (sbf) sbf.style.display = 'inline-block';
            this.updateReviewBlock();
        } else {
            // عند الانتقال لغير الخطوة 3، تأكد من إخفاء الأزرار الاحتياطية
            const sb = document.getElementById('submitBtn');
            const sbf = document.getElementById('submitBtnFooter');
            if (sb) sb.style.display = 'none';
            if (sbf) sbf.style.display = 'none';
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

            // اجعل الانتقال يتطلب الاسم والهاتف قفطة فقطة، العنوان اختياري
            if (!fullName || !phone) {
                this.showToast('يرجى إدخال الاسم ورقم الهاتف أولاً', 'error');
                return;
            }

            // منع المتابعة إذا كان الرقم بدون مفتاح دولة
            if (!this.hasCountryCode(phone)) {
                // الإدراج التلقائي لمفتاح أوغندا 00256 للأرقام المحلية
                const autoFixed = this.applyDefaultUgandaCode(phone);
                if (this.hasCountryCode(autoFixed)) {
                    this.enrollmentData.phone = autoFixed;
                    if (phoneEl) phoneEl.value = autoFixed;
                } else {
                    this.showToast('الرجاء كتابة الرقم مع مفتاح الدولة (مثال: +256XXXXXXXX أو 00256XXXXXXXX) قبل الانتقال', 'error');
                    const phoneWarning = document.getElementById('phoneWarning');
                    if (phoneWarning) {
                        phoneWarning.style.display = 'block';
                        phoneWarning.textContent = 'الرقم بلا مفتاح دولة؛ أضف +256 أو 00256 قبل الرقم.';
                    }
                    if (phoneEl) phoneEl.style.borderColor = '#b00020';
                    return;
                }
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

            this.submitEnrollment();
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
        const fullName = document.getElementById('fullName')?.value || '';
        const phone = document.getElementById('phone')?.value || '';
        const address = document.getElementById('address')?.value || '';
        const methodText = this.selectedPaymentMethod ? this.selectedPaymentMethod.label : '—';
        const amount = document.getElementById('txAmount')?.value || '';
        const tx = document.getElementById('txNumber')?.value || '';
        const receiptName = document.getElementById('receiptFile')?.files?.[0]?.name || '';
        const notes = document.getElementById('notes')?.value || '';

        const courseTitle = this.courseData?.title || this.enrollmentData.courseName || '';
        const courseDesc = this.courseData?.description || '';
        // عرض السعر كما أدخله الأدمن بدون أي تحويل
        const course = this.courseData || {};
        const sdgRaw = (course.price_sdg ?? course.priceSdg ?? course.priceSDG);
        const usdRaw = (course.price_usd ?? course.priceUsd ?? course.priceUSD);

        const formattedPriceUSD = (usdRaw !== undefined && usdRaw !== null && usdRaw !== '')
            ? `${Number(usdRaw).toLocaleString('en-US')} USD`
            : undefined;

        const formattedPriceSDG = (sdgRaw !== undefined && sdgRaw !== null && sdgRaw !== '')
            ? `${Number(sdgRaw).toLocaleString('en-US')} SDG`
            : undefined;

        let priceDisplay = '';
        if (formattedPriceUSD && formattedPriceSDG) {
            priceDisplay = `${formattedPriceUSD}<br>${formattedPriceSDG}`;
        } else if (formattedPriceUSD) {
            priceDisplay = formattedPriceUSD;
        } else if (formattedPriceSDG) {
            priceDisplay = formattedPriceSDG;
        } else {
            priceDisplay = 'مجاني';
        }

        review.innerHTML = `
            <h4 style="margin:0 0 8px 0; color:#0d6efd;">بيانات الطالب</h4>
            <div class="detail-item"><span class="detail-label">الاسم:</span> ${fullName || '—'}</div>
            <div class="detail-item"><span class="detail-label">الهاتف:</span> ${phone || '—'}</div>
            <div class="detail-item"><span class="detail-label">العنوان:</span> ${address || '—'}</div>
            <hr style="margin:10px 0;">
            <h4 style="margin:0 0 8px 0; color:#0d6efd;">بيانات الكورس</h4>
            <div class="detail-item"><span class="detail-label">اسم الدورة:</span> ${courseTitle}</div>
            ${courseDesc ? `<div class=\"detail-item\"><span class=\"detail-label\">وصف مختصر:</span> ${courseDesc}</div>` : ''}
            <div class=\"detail-item\"><span class=\"detail-label\">سعر الدورة:</span> ${priceDisplay}</div>
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
                    // حاول استخدام واجهة الاستعلام كنسخة احتياطية قبل إعلان عدم الوجود
                    try {
                        const queryResp = await fetch(`${this.apiBase}/api/courses?id=${encodeURIComponent(courseId)}`);
                        const ct2 = queryResp.headers.get('content-type') || '';
                        if (queryResp.ok && ct2.includes('application/json')) {
                            const d2 = await queryResp.json();
                            const arr = Array.isArray(d2.courses) ? d2.courses : [];
                            const found = arr.find(c => String(c.id) === String(courseId));
                            if (found) {
                                return { course: found };
                            }
                        }
                    } catch (_) {}
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
                this.enrollmentData.courseName = data.course.title || data.course.course_name || '';
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
                        // احفظ كلا السعرين إن وُجدا، مع توفير fallback من نفس القيمة عند غياب أحدهما
                        price: found.price || found.course_price || 0,
                        price_usd: (found.price_usd ?? found.priceUsd ?? found.priceUSD ?? (found.price || found.course_price || undefined)),
                        price_sdg: (found.price_sdg ?? found.priceSdg ?? found.priceSDG ?? (found.price || found.course_price || undefined)),
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
                <div style="margin-top:12px;padding:12px;border:1px dashed #d8e7ff;border-radius:8px;background:#f8fbff;">
                    <div style="margin-bottom:8px;font-weight:bold;color:#0d6efd;">اختر دورة من القائمة:</div>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <select id="courseSelector" style="flex:1;padding:10px;border:2px solid #e9ecef;border-radius:6px;"></select>
                        <button id="chooseCourseBtn" class="btn btn-primary" style="padding:10px 16px;">اختيار</button>
                    </div>
                </div>`;
            infoEl.innerHTML = html;
            // حمّل قائمة الدورات لملء المُحدِّد
            this.loadCourseListIntoSelector();
            const chooseBtn = document.getElementById('chooseCourseBtn');
            if (chooseBtn) {
                chooseBtn.addEventListener('click', () => this.applySelectedCourse());
            }
        }

        // لا نعطل الأزرار؛ نسمح بإدخال بيانات الطالب والدفع، لكن نتحقق عند الإرسال
    }

    // جلب قائمة الدورات وعرضها في المُحدِّد
    async loadCourseListIntoSelector() {
        const selector = document.getElementById('courseSelector');
        if (!selector) return;
        selector.innerHTML = '<option value="">جاري التحميل...</option>';
        let courses = [];
        try {
            const resp = await fetch(`${this.apiBase}/api/courses`);
            const ct = resp.headers.get('content-type') || '';
            if (resp.ok && ct.includes('application/json')) {
                const data = await resp.json();
                courses = data.courses || data.data || [];
            } else {
                throw new Error(`HTTP ${resp.status}`);
            }
        } catch (_) {
            try {
                const fb = await fetch(`${this.apiBase}/api/courses-sample`);
                const ct = fb.headers.get('content-type') || '';
                if (fb.ok && ct.includes('application/json')) {
                    const data = await fb.json();
                    courses = data.courses || data.data || [];
                }
            } catch (e) {
                console.warn('Failed to load course list', e);
            }
        }

        selector.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'اختر دورة من القائمة';
        selector.appendChild(placeholder);
        courses.forEach(c => {
            const opt = document.createElement('option');
            opt.value = String(c.id);
            opt.textContent = c.title || c.course_name || `دورة #${c.id}`;
            selector.appendChild(opt);
        });
    }

    async applySelectedCourse() {
        const selector = document.getElementById('courseSelector');
        if (!selector) return;
        const selectedId = selector.value;
        if (!selectedId) {
            this.showToast('يرجى اختيار دورة من القائمة أولاً', 'error');
            return;
        }
        // حاول جلب تفاصيل الدورة المختارة
        try {
            const resp = await fetch(`${this.apiBase}/api/courses/${selectedId}`);
            const ct = resp.headers.get('content-type') || '';
            if (resp.ok && ct.includes('application/json')) {
                const data = await resp.json();
                const course = data.course || data.data || data;
                this.courseData = course;
                this.enrollmentData.courseId = course.id;
                this.enrollmentData.courseName = course.title || course.course_name || '';
                this.displayCourseDetails(course);
                this.showToast('تم اختيار الدورة بنجاح', 'success');
                return;
            }
            throw new Error(`HTTP ${resp.status}`);
        } catch (_) {
            // فشل الجلب من القاعدة؛ استخدم بيانات العينة إن توفرت
            try {
                const fb = await fetch(`${this.apiBase}/api/courses-sample`);
                const ct = fb.headers.get('content-type') || '';
                if (fb.ok && ct.includes('application/json')) {
                    const data = await fb.json();
                    const list = data.courses || data.data || [];
                    const found = list.find(c => String(c.id) === String(selectedId));
                    if (found) {
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
                        this.showToast('تم اختيار الدورة بنجاح (بيانات العينة)', 'success');
                        return;
                    }
                }
            } catch (e) {
                console.warn('Failed to apply selected course', e);
            }
            this.showToast('تعذر تحميل تفاصيل الدورة المختارة', 'error');
        }
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
            // Allow HTML (like <br>) only for our controlled price display; otherwise use textContent
            if (typeof value === 'string' && value.includes('<br>')) {
                span.innerHTML = value;
            } else {
                span.textContent = String(value);
            }
            div.appendChild(icon);
            div.appendChild(strong);
            div.appendChild(span);
            fragments.push(div);
        };

        const formatDate = (d) => {
            if (!d) return undefined;
            try {
                const dt = new Date(d);
                if (!isNaN(dt)) return dt.toLocaleDateString('en-GB');
            } catch (e) {}
            return String(d);
        };
        // عرض السعر كما أدخله الأدمن بدون أي تحويل
        const c = course || this.courseData || {};
        const usdRaw = (c.price_usd ?? c.priceUsd ?? c.priceUSD);
        const sdgRaw = (c.price_sdg ?? c.priceSdg ?? c.priceSDG);

        const formattedPriceUSD = (usdRaw !== undefined && usdRaw !== null && usdRaw !== '')
            ? `${Number(usdRaw).toLocaleString('en-US')} USD`
            : undefined;

        const formattedPriceSDG = (sdgRaw !== undefined && sdgRaw !== null && sdgRaw !== '')
            ? `${Number(sdgRaw).toLocaleString('en-US')} SDG`
            : undefined;

        let priceDisplay = '';
        if (formattedPriceUSD && formattedPriceSDG) {
            priceDisplay = `${formattedPriceUSD}<br>${formattedPriceSDG}`;
        } else if (formattedPriceUSD) {
            priceDisplay = formattedPriceUSD;
        } else if (formattedPriceSDG) {
            priceDisplay = formattedPriceSDG;
        } else {
            priceDisplay = 'مجاني';
        }

        addItem('fas fa-book', 'العنوان:', c.title || c.course_name);
        addItem('fas fa-align-left', 'الوصف:', c.description);
        addItem('fas fa-clock', 'المدة:', c.duration);
        addItem('fas fa-chalkboard-teacher', 'المُدرّس:', c.instructor_name || c.instructor);
        addItem('fas fa-tags', 'الفئة:', c.category);
        addItem('fas fa-level-up-alt', 'المستوى:', c.level_name);
        addItem('fas fa-calendar-day', 'تاريخ البدء:', formatDate(c.start_date));
        addItem('fas fa-calendar-check', 'تاريخ الانتهاء:', formatDate(c.end_date));
        addItem('fas fa-dollar-sign', 'السعر:', priceDisplay);

        // Clear and append
        infoEl.innerHTML = '';
        fragments.forEach(el => infoEl.appendChild(el));

        // Optional features list
        if (featuresEl) {
            featuresEl.innerHTML = '';
            const features = Array.isArray(c.features) ? c.features : [];
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
            let audience = c.target_audience || c.audience || c.targetAudience;
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
                if (c.level_name) fallback.push(`مناسب لمستوى ${c.level_name}`);
                if (c.category) fallback.push(`مفيد لطلاب ${c.category}`);
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

        // تأكد من اشتمال الرقم على مفتاح الدولة قبل الإرسال النهائي
        if (!this.hasCountryCode(this.enrollmentData.phone || '')) {
            // حاول إدراج مفتاح أوغندا 00256 تلقائياً
            const autoFixed = this.applyDefaultUgandaCode(this.enrollmentData.phone || '');
            if (this.hasCountryCode(autoFixed)) {
                this.enrollmentData.phone = autoFixed;
            } else {
                this.showToast('أدخل الرقم مع مفتاح الدولة (مثال: +256 أو 00256) قبل التأكيد', 'error');
                this.showStep(1);
                try {
                    const phoneEl = document.getElementById('phone');
                    const phoneWarning = document.getElementById('phoneWarning');
                    if (phoneEl) phoneEl.style.borderColor = '#b00020';
                    if (phoneWarning) {
                        phoneWarning.style.display = 'block';
                        phoneWarning.textContent = 'الرقم بلا مفتاح دولة؛ أضف +256 أو 00256 قبل الرقم.';
                    }
                } catch (_) {}
                return;
            }
        }

        // يجب اختيار دورة قبل الإرسال
        if (!this.enrollmentData.courseId) {
            this.showToast('يرجى اختيار دورة أولاً قبل تأكيد التسجيل', 'error');
            // إن لم تفاصيل الدورة ظاهرة، أعد إظهار المحدد
            if (!this.courseData) this.renderNotFound('يرجى اختيار دورة من القائمة لإتمام التسجيل.');
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
                // املأ رقم الطلب في واجهة النجاح إن وُجد
                try {
                    const rnEl = document.getElementById('requestNumber');
                    if (rnEl) rnEl.textContent = data.request_number || data.id || '';
                } catch (_) {}

                // تحقّق صارم من كون المستخدم إدمن لتوجيهه للوحة التحكم مباشرةً
                let isAdmin = false;
                try {
                    const raw = localStorage.getItem('userData');
                    if (raw) {
                        const user = JSON.parse(raw);
                        const role = (user.role || user.userType || '').toLowerCase();
                        isAdmin = (role === 'admin' || role === 'administrator');
                    }
                } catch (_) {}

                if (isAdmin) {
                    try { window.location.href = '/admin-dashboard.html'; } catch (_) {}
                    return;
                }

                // Redirect to the confirmation page
                const courseId = this.enrollmentData.courseId;
                if (courseId) {
                    window.location.href = `enrollment-confirmation.html?courseId=${courseId}`;
                } else {
                    window.location.href = 'enrollment-confirmation.html';
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