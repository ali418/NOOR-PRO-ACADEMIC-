class EnrollmentSystem {
    constructor() {
        this.enrollmentData = {};
        this.apiBase = 'https://nooracademic.up.railway.app';
        
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
        const enrollmentForm = document.getElementById('enrollmentForm');
        if (enrollmentForm) {
            enrollmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitEnrollment();
            });
        }
    }

    loadCourseData() {
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('courseId');

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

        const fullName = document.getElementById('fullName').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;

        if (!fullName || !phone || !address) {
            this.showToast('Please fill in all required fields.', 'error');
            return;
        }

        this.enrollmentData.fullName = fullName;
        this.enrollmentData.phone = phone;
        this.enrollmentData.address = address;

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
                this.showToast(data.message || 'Enrollment failed.', 'error');
            }
        })
        .catch(error => {
            console.error('Error submitting enrollment:', error);
            this.showToast('An error occurred. Please try again.', 'error');
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