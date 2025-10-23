// Videos Management JavaScript
class VideoManager {
    constructor() {
        this.videos = [];
        this.courses = [];
        this.currentFilter = 'all';
        this.editingVideoId = null;
        
        this.init();
    }

    init() {
        this.loadCourses();
        this.loadVideos();
        this.bindEvents();
    }

    bindEvents() {
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterVideos(e.target.value);
        });

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderVideos();
            });
        });

        // Add video button
        document.getElementById('addVideoBtn').addEventListener('click', () => {
            this.openModal();
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // Form submission
        document.getElementById('videoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveVideo();
        });

        // File upload
        const fileUpload = document.getElementById('fileUpload');
        const fileInput = document.getElementById('videoFile');

        fileUpload.addEventListener('click', () => {
            fileInput.click();
        });

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
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                this.handleFileSelect(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Close modal when clicking outside
        document.getElementById('videoModal').addEventListener('click', (e) => {
            if (e.target.id === 'videoModal') {
                this.closeModal();
            }
        });
    }

    async loadCourses() {
        try {
            const response = await fetch('api/courses.php');
            const data = await response.json();
            
            if (data.success) {
                this.courses = data.data;
                this.populateCourseSelect();
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            this.showNotification('خطأ في تحميل المقررات', 'error');
        }
    }

    populateCourseSelect() {
        const select = document.getElementById('courseSelect');
        select.innerHTML = '<option value="">اختر المقرر</option>';
        
        this.courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.title;
            select.appendChild(option);
        });
    }

    async loadVideos() {
        const loading = document.getElementById('loading');
        loading.classList.add('show');

        try {
            const response = await fetch('api/videos.php');
            const data = await response.json();
            
            if (data.success) {
                this.videos = data.data;
                this.renderVideos();
            } else {
                this.showNotification('خطأ في تحميل الفيديوهات', 'error');
            }
        } catch (error) {
            console.error('Error loading videos:', error);
            this.showNotification('خطأ في الاتصال بالخادم', 'error');
        } finally {
            loading.classList.remove('show');
        }
    }

    renderVideos() {
        const grid = document.getElementById('videosGrid');
        let filteredVideos = this.videos;

        // Apply filter
        if (this.currentFilter !== 'all') {
            filteredVideos = this.videos.filter(video => {
                if (this.currentFilter === 'free') return video.is_free == 1;
                if (this.currentFilter === 'premium') return video.is_free == 0;
                return true;
            });
        }

        if (filteredVideos.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #718096;">
                    <i class="fas fa-video" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
                    <h3>لا توجد فيديوهات</h3>
                    <p>ابدأ بإضافة فيديو جديد للمقررات</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredVideos.map(video => this.createVideoCard(video)).join('');
    }

    createVideoCard(video) {
        const course = this.courses.find(c => c.id == video.course_id);
        const courseName = course ? course.title : 'غير محدد';
        const duration = this.formatDuration(video.duration);
        
        return `
            <div class="video-card" data-id="${video.id}">
                <div class="video-thumbnail">
                    ${video.thumbnail_url ? 
                        `<img src="${video.thumbnail_url}" alt="${video.title}">` : 
                        '<i class="fas fa-play-circle"></i>'
                    }
                    ${video.duration ? `<div class="video-duration">${duration}</div>` : ''}
                </div>
                <div class="video-info">
                    <div class="video-title">${video.title}</div>
                    <div class="video-course">${courseName}</div>
                    ${video.description ? `<div class="video-description">${video.description}</div>` : ''}
                    <div class="video-meta">
                        <div class="video-order">الترتيب: ${video.order_index}</div>
                        <div class="video-status ${video.is_free == 1 ? 'free' : 'premium'}">
                            ${video.is_free == 1 ? 'مجاني' : 'مدفوع'}
                        </div>
                    </div>
                    <div class="video-actions">
                        <button class="action-btn edit-btn" onclick="videoManager.editVideo(${video.id})">
                            <i class="fas fa-edit"></i>
                            تعديل
                        </button>
                        <button class="action-btn delete-btn" onclick="videoManager.deleteVideo(${video.id})">
                            <i class="fas fa-trash"></i>
                            حذف
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    formatDuration(seconds) {
        if (!seconds) return '00:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    filterVideos(searchTerm) {
        const cards = document.querySelectorAll('.video-card');
        
        cards.forEach(card => {
            const title = card.querySelector('.video-title').textContent.toLowerCase();
            const course = card.querySelector('.video-course').textContent.toLowerCase();
            const description = card.querySelector('.video-description')?.textContent.toLowerCase() || '';
            
            const matches = title.includes(searchTerm.toLowerCase()) || 
                          course.includes(searchTerm.toLowerCase()) || 
                          description.includes(searchTerm.toLowerCase());
            
            card.style.display = matches ? 'block' : 'none';
        });
    }

    openModal(video = null) {
        const modal = document.getElementById('videoModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('videoForm');
        
        if (video) {
            title.textContent = 'تعديل الفيديو';
            this.editingVideoId = video.id;
            this.populateForm(video);
        } else {
            title.textContent = 'إضافة فيديو جديد';
            this.editingVideoId = null;
            form.reset();
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('videoModal');
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Reset form
        document.getElementById('videoForm').reset();
        document.getElementById('videoId').value = '';
        this.editingVideoId = null;
        
        // Reset progress bar
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        progressBar.style.display = 'none';
        progressFill.style.width = '0%';
    }

    populateForm(video) {
        document.getElementById('videoId').value = video.id;
        document.getElementById('courseSelect').value = video.course_id;
        document.getElementById('videoTitle').value = video.title;
        document.getElementById('videoDescription').value = video.description || '';
        document.getElementById('videoUrl').value = video.video_url || '';
        document.getElementById('videoDuration').value = video.duration || '';
        document.getElementById('videoOrder').value = video.order_index || 1;
        document.getElementById('isFree').checked = video.is_free == 1;
    }

    handleFileSelect(file) {
        // Validate file type
        const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime'];
        if (!allowedTypes.includes(file.type)) {
            this.showNotification('نوع الملف غير مدعوم. يرجى اختيار ملف فيديو صالح.', 'error');
            return;
        }

        // Validate file size (100MB limit)
        const maxSize = 100 * 1024 * 1024; // 100MB in bytes
        if (file.size > maxSize) {
            this.showNotification('حجم الملف كبير جداً. الحد الأقصى 100 ميجابايت.', 'error');
            return;
        }

        // Update upload UI
        const uploadText = document.querySelector('.upload-text');
        uploadText.textContent = `تم اختيار: ${file.name}`;
        
        // Clear video URL if file is selected
        document.getElementById('videoUrl').value = '';
    }

    async saveVideo() {
        const form = document.getElementById('videoForm');
        const formData = new FormData();
        
        // Get form data
        const courseId = document.getElementById('courseSelect').value;
        const title = document.getElementById('videoTitle').value;
        const description = document.getElementById('videoDescription').value;
        const videoUrl = document.getElementById('videoUrl').value;
        const duration = document.getElementById('videoDuration').value;
        const orderIndex = document.getElementById('videoOrder').value;
        const isFree = document.getElementById('isFree').checked ? 1 : 0;
        const videoFile = document.getElementById('videoFile').files[0];

        // Validation
        if (!courseId) {
            this.showNotification('يرجى اختيار المقرر', 'error');
            return;
        }

        if (!title.trim()) {
            this.showNotification('يرجى إدخال عنوان الفيديو', 'error');
            return;
        }

        if (!videoFile && !videoUrl) {
            this.showNotification('يرجى رفع ملف فيديو أو إدخال رابط الفيديو', 'error');
            return;
        }

        // Prepare form data
        if (this.editingVideoId) {
            formData.append('id', this.editingVideoId);
        }
        
        formData.append('course_id', courseId);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('video_url', videoUrl);
        formData.append('duration', duration || 0);
        formData.append('order_index', orderIndex || 1);
        formData.append('is_free', isFree);

        if (videoFile) {
            formData.append('video_file', videoFile);
        }

        // Show progress bar for file uploads
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        
        if (videoFile) {
            progressBar.style.display = 'block';
        }

        try {
            const saveBtn = document.getElementById('saveBtn');
            saveBtn.disabled = true;
            saveBtn.textContent = 'جاري الحفظ...';

            const response = await fetch('api/videos.php', {
                method: this.editingVideoId ? 'PUT' : 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification(
                    this.editingVideoId ? 'تم تحديث الفيديو بنجاح' : 'تم إضافة الفيديو بنجاح', 
                    'success'
                );
                this.closeModal();
                this.loadVideos();
            } else {
                this.showNotification(data.message || 'حدث خطأ أثناء حفظ الفيديو', 'error');
            }
        } catch (error) {
            console.error('Error saving video:', error);
            this.showNotification('خطأ في الاتصال بالخادم', 'error');
        } finally {
            const saveBtn = document.getElementById('saveBtn');
            saveBtn.disabled = false;
            saveBtn.textContent = 'حفظ الفيديو';
            
            if (videoFile) {
                progressBar.style.display = 'none';
                progressFill.style.width = '0%';
            }
        }
    }

    editVideo(id) {
        const video = this.videos.find(v => v.id == id);
        if (video) {
            this.openModal(video);
        }
    }

    async deleteVideo(id) {
        const video = this.videos.find(v => v.id == id);
        if (!video) return;

        if (!confirm(`هل أنت متأكد من حذف الفيديو "${video.title}"؟`)) {
            return;
        }

        try {
            const response = await fetch(`api/videos.php?id=${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('تم حذف الفيديو بنجاح', 'success');
                this.loadVideos();
            } else {
                this.showNotification(data.message || 'حدث خطأ أثناء حذف الفيديو', 'error');
            }
        } catch (error) {
            console.error('Error deleting video:', error);
            this.showNotification('خطأ في الاتصال بالخادم', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        notification.querySelector('.notification-content').style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }
}

// Initialize video manager when page loads
let videoManager;
document.addEventListener('DOMContentLoaded', () => {
    videoManager = new VideoManager();
});

// Check if user is logged in as admin
function checkAdminAuth() {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'admin-login.html';
        return false;
    }
    return true;
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
});