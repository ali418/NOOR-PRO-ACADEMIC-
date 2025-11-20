// Welcome Message System
class WelcomeSystem {
    constructor() {
        this.templates = {
            'english-a1': {
                courseName: 'المستوى الأول - مبتدئين (A1)',
                duration: '3 أشهر',
                startDate: 'بداية كل شهر',
                whatsappGroup: 'https://chat.whatsapp.com/english-a1-group',
                welcomeMessage: `
مرحباً بك في اكاديمية نور للتدريب المتقدم! 🎉

تم قبول طلب التسجيل الخاص بك بنجاح في كورس اللغة الإنجليزية - المستوى الأول (A1).

📚 تفاصيل الكورس:
- اسم الكورس: المستوى الأول - مبتدئين (A1)
- المدة: 3 أشهر
- تاريخ البداية: بداية كل شهر
- السعر: 150 دولار

📱 للانضمام إلى مجموعة الواتساب الخاصة بالكورس:
[WHATSAPP_LINK]

📖 سيتم إرسال المواد التعليمية ورابط الفصول الافتراضية قريباً.

مع أطيب التمنيات بالتوفيق والنجاح! 🌟
فريق اكاديمية نور للتدريب المتقدم
                `
            },
            'english-a2': {
                courseName: 'المستوى الثاني - تأسيسي (A2)',
                duration: '3 أشهر',
                startDate: 'بداية كل شهر',
                whatsappGroup: 'https://chat.whatsapp.com/english-a2-group',
                welcomeMessage: `
مرحباً بك في اكاديمية نور للتدريب المتقدم! 🎉

تم قبول طلب التسجيل الخاص بك بنجاح في كورس اللغة الإنجليزية - المستوى الثاني (A2).

📚 تفاصيل الكورس:
- اسم الكورس: المستوى الثاني - تأسيسي (A2)
- المدة: 3 أشهر
- تاريخ البداية: بداية كل شهر
- السعر: 180 دولار

📱 للانضمام إلى مجموعة الواتساب الخاصة بالكورس:
[WHATSAPP_LINK]

📖 سيتم إرسال المواد التعليمية ورابط الفصول الافتراضية قريباً.

مع أطيب التمنيات بالتوفيق والنجاح! 🌟
فريق اكاديمية نور للتدريب المتقدم
                `
            },
            'hr-professional': {
                courseName: 'الدبلوم المهني في إدارة الموارد البشرية',
                duration: '6 أشهر',
                startDate: 'بداية كل شهر',
                whatsappGroup: 'https://chat.whatsapp.com/hr-professional-group',
                welcomeMessage: `
مرحباً بك في اكاديمية نور للتدريب المتقدم! 🎉

تم قبول طلب التسجيل الخاص بك بنجاح في الدبلوم المهني في إدارة الموارد البشرية.

📚 تفاصيل الكورس:
- اسم الكورس: الدبلوم المهني في إدارة الموارد البشرية
- المدة: 6 أشهر
- تاريخ البداية: بداية كل شهر
- السعر: 300 دولار

📱 للانضمام إلى مجموعة الواتساب الخاصة بالكورس:
[WHATSAPP_LINK]

📖 سيتم إرسال المواد التعليمية ورابط الفصول الافتراضية قريباً.

مع أطيب التمنيات بالتوفيق والنجاح! 🌟
فريق اكاديمية نور للتدريب المتقدم
                `
            },
            'business-management': {
                courseName: 'الدبلوم المهني في إدارة الأعمال',
                duration: '6 أشهر',
                startDate: 'بداية كل شهر',
                whatsappGroup: 'https://chat.whatsapp.com/business-management-group',
                welcomeMessage: `
مرحباً بك في اكاديمية نور للتدريب المتقدم! 🎉

تم قبول طلب التسجيل الخاص بك بنجاح في الدبلوم المهني في إدارة الأعمال.

📚 تفاصيل الكورس:
- اسم الكورس: الدبلوم المهني في إدارة الأعمال
- المدة: 6 أشهر
- تاريخ البداية: بداية كل شهر
- السعر: 300 دولار

📱 للانضمام إلى مجموعة الواتساب الخاصة بالكورس:
[WHATSAPP_LINK]

📖 سيتم إرسال المواد التعليمية ورابط الفصول الافتراضية قريباً.

مع أطيب التمنيات بالتوفيق والنجاح! 🌟
فريق اكاديمية نور للتدريب المتقدم
                `
            },
            'programming-web': {
                courseName: 'البرمجة وتطوير المواقع',
                duration: '8 أشهر',
                startDate: 'بداية كل شهر',
                whatsappGroup: 'https://chat.whatsapp.com/programming-web-group',
                welcomeMessage: `
مرحباً بك في اكاديمية نور للتدريب المتقدم! 🎉

تم قبول طلب التسجيل الخاص بك بنجاح في كورس البرمجة وتطوير المواقع.

📚 تفاصيل الكورس:
- اسم الكورس: البرمجة وتطوير المواقع
- المدة: 8 أشهر
- تاريخ البداية: بداية كل شهر
- السعر: 400 دولار

📱 للانضمام إلى مجموعة الواتساب الخاصة بالكورس:
[WHATSAPP_LINK]

📖 سيتم إرسال المواد التعليمية ورابط الفصول الافتراضية قريباً.

مع أطيب التمنيات بالتوفيق والنجاح! 🌟
فريق اكاديمية نور للتدريب المتقدم
                `
            }
        };
    }

    generateWelcomeMessage(courseId, studentName, customWhatsappLink = null) {
        const template = this.templates[courseId];
        if (!template) {
            return this.getDefaultWelcomeMessage(studentName, customWhatsappLink);
        }

        let message = template.welcomeMessage;
        
        // Replace placeholders
        message = message.replace('[STUDENT_NAME]', studentName);
        message = message.replace('[COURSE_NAME]', template.courseName);
        message = message.replace('[DURATION]', template.duration);
        message = message.replace('[START_DATE]', template.startDate);
        
        const whatsappLink = customWhatsappLink || template.whatsappGroup;
        message = message.replace('[WHATSAPP_LINK]', whatsappLink);

        return {
            message: message.trim(),
            whatsappLink: whatsappLink,
            courseDetails: {
                name: template.courseName,
                duration: template.duration,
                startDate: template.startDate
            }
        };
    }

    getDefaultWelcomeMessage(studentName, whatsappLink = null) {
        const defaultMessage = `
مرحباً ${studentName} في اكاديمية نور للتدريب المتقدم! 🎉

تم قبول طلب التسجيل الخاص بك بنجاح.

نحن سعداء لانضمامك إلى عائلة اكاديمية نور للتدريب المتقدم ونتطلع لرحلة تعليمية مثمرة معك.

${whatsappLink ? `📱 للانضمام إلى مجموعة الواتساب الخاصة بالكورس:\n${whatsappLink}\n` : ''}

📖 سيتم التواصل معك قريباً لتزويدك بتفاصيل الدخول والمواد التعليمية.

مع أطيب التمنيات بالتوفيق والنجاح! 🌟
فريق اكاديمية نور للتدريب المتقدم
        `;

        return {
            message: defaultMessage.trim(),
            whatsappLink: whatsappLink,
            courseDetails: {
                name: 'الكورس المختار',
                duration: 'حسب الكورس',
                startDate: 'سيتم إعلامك قريباً'
            }
        };
    }

    getCourseTemplate(courseId) {
        return this.templates[courseId] || null;
    }

    getAllCourseTemplates() {
        return this.templates;
    }

    updateCourseTemplate(courseId, template) {
        this.templates[courseId] = template;
        this.saveTemplates();
    }

    saveTemplates() {
        localStorage.setItem('welcomeTemplates', JSON.stringify(this.templates));
    }

    loadTemplates() {
        const saved = localStorage.getItem('welcomeTemplates');
        if (saved) {
            this.templates = { ...this.templates, ...JSON.parse(saved) };
        }
    }

    // Email/SMS simulation functions
    sendWelcomeEmail(enrollment, welcomeData) {
        return new Promise((resolve, reject) => {
            // Simulate API call delay
            setTimeout(() => {
                console.log('Sending welcome email to:', enrollment.email);
                console.log('Subject: مرحباً بك في اكاديمية نور للتدريب المتقدم');
                console.log('Message:', welcomeData.message);
                
                // Simulate success/failure
                if (Math.random() > 0.1) { // 90% success rate
                    resolve({
                        success: true,
                        messageId: 'EMAIL_' + Date.now(),
                        sentAt: new Date().toISOString()
                    });
                } else {
                    reject(new Error('فشل في إرسال البريد الإلكتروني'));
                }
            }, 1000);
        });
    }

    sendWelcomeSMS(enrollment, welcomeData) {
        return new Promise((resolve, reject) => {
            // Simulate API call delay
            setTimeout(() => {
                console.log('Sending welcome SMS to:', enrollment.phone);
                console.log('Message:', welcomeData.message.substring(0, 160) + '...');
                
                // Simulate success/failure
                if (Math.random() > 0.05) { // 95% success rate
                    resolve({
                        success: true,
                        messageId: 'SMS_' + Date.now(),
                        sentAt: new Date().toISOString()
                    });
                } else {
                    reject(new Error('فشل في إرسال الرسالة النصية'));
                }
            }, 800);
        });
    }

    async sendWelcomeNotifications(enrollment, customMessage = null, customWhatsappLink = null) {
        try {
            // Generate welcome message
            const welcomeData = customMessage ? 
                { message: customMessage, whatsappLink: customWhatsappLink } :
                this.generateWelcomeMessage(enrollment.courseId, enrollment.studentName, customWhatsappLink);

            const results = {
                email: null,
                sms: null,
                errors: []
            };

            // Send email
            try {
                results.email = await this.sendWelcomeEmail(enrollment, welcomeData);
            } catch (error) {
                results.errors.push('Email: ' + error.message);
            }

            // Send SMS
            try {
                results.sms = await this.sendWelcomeSMS(enrollment, welcomeData);
            } catch (error) {
                results.errors.push('SMS: ' + error.message);
            }

            return {
                success: results.email || results.sms,
                results: results,
                welcomeData: welcomeData
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                results: null
            };
        }
    }

    // WhatsApp integration helpers
    generateWhatsAppInviteLink(groupId, studentName) {
        // In a real app, this would generate a proper WhatsApp group invite
        const baseUrl = 'https://chat.whatsapp.com/';
        return `${baseUrl}${groupId}?welcome=${encodeURIComponent(studentName)}`;
    }

    createWhatsAppMessage(text, phoneNumber = '') {
        // Create WhatsApp message link (supports no phone to open composer)
        const encodedText = encodeURIComponent(text);
        const dest = (phoneNumber && String(phoneNumber).trim()) ? String(phoneNumber).trim() : '';
        return dest ? `https://wa.me/${dest}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
    }

    // Notification tracking
    trackNotification(enrollmentId, type, status, messageId = null) {
        const notifications = JSON.parse(localStorage.getItem('notificationLog') || '[]');
        
        notifications.push({
            enrollmentId: enrollmentId,
            type: type, // 'email', 'sms', 'whatsapp'
            status: status, // 'sent', 'failed', 'pending'
            messageId: messageId,
            timestamp: new Date().toISOString()
        });

        localStorage.setItem('notificationLog', JSON.stringify(notifications));
    }

    getNotificationHistory(enrollmentId = null) {
        const notifications = JSON.parse(localStorage.getItem('notificationLog') || '[]');
        
        if (enrollmentId) {
            return notifications.filter(n => n.enrollmentId === enrollmentId);
        }
        
        return notifications;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WelcomeSystem;
} else {
    window.WelcomeSystem = WelcomeSystem;
}