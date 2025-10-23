/**
 * Video Modal Manager
 * Handles intro video display and modal functionality
 */
class VideoModal {
    constructor() {
        this.modal = null;
        this.currentVideo = null;
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        // Create modal HTML structure
        const modalHTML = `
            <div id="videoModal" class="video-modal">
                <div class="video-modal-content">
                    <div class="video-modal-header">
                        <h3 id="videoTitle">الفيديو التعريفي</h3>
                        <button class="video-close" onclick="videoModal.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="video-container" id="videoContainer">
                        <!-- Video will be loaded here -->
                    </div>
                    <div class="video-info">
                        <h4 id="videoInfoTitle">معلومات الكورس</h4>
                        <p id="videoDescription">وصف الكورس سيظهر هنا</p>
                        <div class="video-features" id="videoFeatures">
                            <!-- Features will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('videoModal');
    }

    bindEvents() {
        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.closeModal();
            }
        });
    }

    openModal(courseId) {
        const courseData = this.getCourseData(courseId);
        if (!courseData) {
            console.error('Course data not found for:', courseId);
            return;
        }

        this.currentVideo = courseId;
        this.loadVideoContent(courseData);
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Stop video playback
        const videoContainer = document.getElementById('videoContainer');
        videoContainer.innerHTML = '';
        this.currentVideo = null;
    }

    loadVideoContent(courseData) {
        // Update modal title
        document.getElementById('videoTitle').textContent = courseData.title;
        
        // Load video
        const videoContainer = document.getElementById('videoContainer');
        if (courseData.videoType === 'youtube') {
            videoContainer.innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${courseData.videoId}?autoplay=1&rel=0" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            `;
        } else if (courseData.videoType === 'local') {
            videoContainer.innerHTML = `
                <video controls autoplay>
                    <source src="${courseData.videoUrl}" type="video/mp4">
                    متصفحك لا يدعم تشغيل الفيديو.
                </video>
            `;
        }

        // Update course info
        document.getElementById('videoInfoTitle').textContent = courseData.title;
        document.getElementById('videoDescription').textContent = courseData.description;

        // Load features
        const featuresContainer = document.getElementById('videoFeatures');
        featuresContainer.innerHTML = courseData.features.map(feature => `
            <div class="video-feature">
                <i class="${feature.icon}"></i>
                <span>${feature.text}</span>
            </div>
        `).join('');
    }

    getCourseData(courseId) {
        const courses = {
            'english-a1': {
                title: 'اللغة الإنجليزية - المستوى A1',
                description: 'كورس تأسيسي في اللغة الإنجليزية للمبتدئين، يغطي الأساسيات من الحروف والأرقام إلى المحادثات البسيطة.',
                videoType: 'youtube',
                videoId: 'dQw4w9WgXcQ', // Replace with actual video ID
                features: [
                    { icon: 'fas fa-clock', text: '40 ساعة تدريبية' },
                    { icon: 'fas fa-certificate', text: 'شهادة معتمدة' },
                    { icon: 'fas fa-users', text: 'مجموعات صغيرة' },
                    { icon: 'fas fa-headphones', text: 'تدريب على الاستماع' },
                    { icon: 'fas fa-comments', text: 'ممارسة المحادثة' }
                ]
            },
            'english-a2': {
                title: 'اللغة الإنجليزية - المستوى A2',
                description: 'كورس متقدم للمستوى التأسيسي، يركز على تطوير مهارات القراءة والكتابة والمحادثة.',
                videoType: 'youtube',
                videoId: 'dQw4w9WgXcQ', // Replace with actual video ID
                features: [
                    { icon: 'fas fa-clock', text: '50 ساعة تدريبية' },
                    { icon: 'fas fa-certificate', text: 'شهادة معتمدة' },
                    { icon: 'fas fa-book', text: 'مواد تعليمية شاملة' },
                    { icon: 'fas fa-microphone', text: 'تدريب على النطق' },
                    { icon: 'fas fa-edit', text: 'تمارين كتابية' }
                ]
            },
            'english-speaking': {
                title: 'المحادثة الإنجليزية',
                description: 'كورس مخصص لتطوير مهارات المحادثة والتحدث باللغة الإنجليزية بطلاقة وثقة.',
                videoType: 'youtube',
                videoId: 'dQw4w9WgXcQ', // Replace with actual video ID
                features: [
                    { icon: 'fas fa-clock', text: '30 ساعة تدريبية' },
                    { icon: 'fas fa-users', text: 'جلسات محادثة جماعية' },
                    { icon: 'fas fa-microphone', text: 'تسجيلات صوتية' },
                    { icon: 'fas fa-video', text: 'محادثات مرئية' },
                    { icon: 'fas fa-trophy', text: 'تحديات أسبوعية' }
                ]
            },
            'english-grammar': {
                title: 'قواعد اللغة الإنجليزية',
                description: 'كورس شامل لتعلم قواعد اللغة الإنجليزية من الأساسيات إلى المستوى المتقدم.',
                videoType: 'youtube',
                videoId: 'dQw4w9WgXcQ', // Replace with actual video ID
                features: [
                    { icon: 'fas fa-clock', text: '35 ساعة تدريبية' },
                    { icon: 'fas fa-book', text: 'كتاب قواعد شامل' },
                    { icon: 'fas fa-tasks', text: 'تمارين تفاعلية' },
                    { icon: 'fas fa-chart-line', text: 'تتبع التقدم' },
                    { icon: 'fas fa-question-circle', text: 'اختبارات دورية' }
                ]
            },
            'hr-professional': {
                title: 'الدبلوم المهني في الموارد البشرية',
                description: 'برنامج شامل لتأهيل المختصين في مجال الموارد البشرية وإدارة المواهب.',
                videoType: 'youtube',
                videoId: 'dQw4w9WgXcQ', // Replace with actual video ID
                features: [
                    { icon: 'fas fa-clock', text: '120 ساعة تدريبية' },
                    { icon: 'fas fa-certificate', text: 'دبلوم معتمد' },
                    { icon: 'fas fa-briefcase', text: 'تدريب عملي' },
                    { icon: 'fas fa-users', text: 'ورش عمل' },
                    { icon: 'fas fa-laptop', text: 'أدوات HR حديثة' }
                ]
            },
            'business-management': {
                title: 'إدارة الأعمال',
                description: 'كورس متكامل في إدارة الأعمال والقيادة الإدارية للمدراء والقادة.',
                videoType: 'youtube',
                videoId: 'dQw4w9WgXcQ', // Replace with actual video ID
                features: [
                    { icon: 'fas fa-clock', text: '80 ساعة تدريبية' },
                    { icon: 'fas fa-chart-line', text: 'استراتيجيات الأعمال' },
                    { icon: 'fas fa-users', text: 'إدارة الفرق' },
                    { icon: 'fas fa-lightbulb', text: 'الابتكار والإبداع' },
                    { icon: 'fas fa-handshake', text: 'مهارات التفاوض' }
                ]
            },
            'marketing-sales': {
                title: 'التسويق والمبيعات',
                description: 'كورس شامل في استراتيجيات التسويق الحديثة وتقنيات المبيعات الفعالة.',
                videoType: 'youtube',
                videoId: 'dQw4w9WgXcQ', // Replace with actual video ID
                features: [
                    { icon: 'fas fa-clock', text: '60 ساعة تدريبية' },
                    { icon: 'fas fa-bullhorn', text: 'التسويق الرقمي' },
                    { icon: 'fas fa-chart-bar', text: 'تحليل السوق' },
                    { icon: 'fas fa-mobile-alt', text: 'التسويق عبر الهاتف' },
                    { icon: 'fas fa-share-alt', text: 'وسائل التواصل الاجتماعي' }
                ]
            },
            'tot-training': {
                title: 'تدريب المدربين TOT',
                description: 'برنامج تأهيل المدربين المحترفين وتطوير مهارات التدريب والعرض.',
                videoType: 'youtube',
                videoId: 'dQw4w9WgXcQ', // Replace with actual video ID
                features: [
                    { icon: 'fas fa-clock', text: '40 ساعة تدريبية' },
                    { icon: 'fas fa-chalkboard-teacher', text: 'تقنيات التدريب' },
                    { icon: 'fas fa-presentation', text: 'مهارات العرض' },
                    { icon: 'fas fa-users', text: 'إدارة المتدربين' },
                    { icon: 'fas fa-clipboard-check', text: 'تقييم الأداء' }
                ]
            },
            'programming-web': {
                title: 'البرمجة وتطوير المواقع',
                description: 'كورس شامل في البرمجة وتطوير المواقع الإلكترونية باستخدام أحدث التقنيات.',
                videoType: 'youtube',
                videoId: 'dQw4w9WgXcQ', // Replace with actual video ID
                features: [
                    { icon: 'fas fa-clock', text: '100 ساعة تدريبية' },
                    { icon: 'fas fa-code', text: 'HTML, CSS, JavaScript' },
                    { icon: 'fas fa-database', text: 'قواعد البيانات' },
                    { icon: 'fas fa-mobile-alt', text: 'التصميم المتجاوب' },
                    { icon: 'fas fa-project-diagram', text: 'مشاريع عملية' }
                ]
            }
        };

        return courses[courseId] || null;
    }
}

// Global function to play intro video
function playIntroVideo(courseId) {
    if (window.videoModal) {
        window.videoModal.openModal(courseId);
    }
}

// Initialize video modal when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.videoModal = new VideoModal();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoModal;
}