/**
 * وظائف البحث المتقدمة للكورسات
 * Advanced Search Functionality for Courses
 */

class CourseSearch {
    constructor() {
        this.courses = [];
        this.filteredCourses = [];
        this.searchInput = null;
        this.init();
    }

    init() {
        // انتظار تحميل الصفحة
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.searchInput = document.querySelector('.search-box input');
        this.loadCourses();
        this.bindEvents();
    }

    loadCourses() {
        // تحميل جميع الكورسات من الصفحة
        const courseCards = document.querySelectorAll('.course-card');
        this.courses = Array.from(courseCards).map(card => ({
            element: card,
            title: card.querySelector('h3')?.textContent || '',
            description: card.querySelector('p')?.textContent || '',
            category: card.dataset.category || '',
            level: card.querySelector('.level')?.textContent || '',
            duration: card.querySelector('.duration')?.textContent || '',
            price: card.querySelector('.price')?.textContent || ''
        }));
        this.filteredCourses = [...this.courses];
    }

    bindEvents() {
        if (this.searchInput) {
            // البحث أثناء الكتابة
            this.searchInput.addEventListener('input', (e) => {
                this.performSearch(e.target.value);
            });

            // البحث عند الضغط على Enter
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch(e.target.value);
                }
            });
        }

        // إضافة وظيفة البحث للزر إذا كان موجوداً
        const searchButton = document.querySelector('.search-btn');
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                if (this.searchInput) {
                    this.performSearch(this.searchInput.value);
                }
            });
        }
    }

    performSearch(query) {
        const searchTerm = query.trim().toLowerCase();
        
        if (searchTerm === '') {
            // إظهار جميع الكورسات
            this.showAllCourses();
            return;
        }

        // البحث في العنوان والوصف والفئة
        this.filteredCourses = this.courses.filter(course => {
            return course.title.toLowerCase().includes(searchTerm) ||
                   course.description.toLowerCase().includes(searchTerm) ||
                   course.category.toLowerCase().includes(searchTerm) ||
                   course.level.toLowerCase().includes(searchTerm);
        });

        this.displayResults();
        this.updateSearchStats(searchTerm);
    }

    showAllCourses() {
        this.courses.forEach(course => {
            course.element.style.display = 'block';
            course.element.classList.remove('search-hidden');
        });
        this.clearSearchStats();
    }

    displayResults() {
        // إخفاء جميع الكورسات أولاً
        this.courses.forEach(course => {
            course.element.style.display = 'none';
            course.element.classList.add('search-hidden');
        });

        // إظهار النتائج المطابقة
        this.filteredCourses.forEach(course => {
            course.element.style.display = 'block';
            course.element.classList.remove('search-hidden');
            
            // إضافة تأثير الظهور
            course.element.style.animation = 'fadeInUp 0.3s ease-out';
        });

        // إظهار رسالة إذا لم توجد نتائج
        this.handleNoResults();
    }

    handleNoResults() {
        const coursesGrid = document.querySelector('.courses-grid');
        let noResultsMessage = document.querySelector('.no-results-message');

        if (this.filteredCourses.length === 0) {
            if (!noResultsMessage) {
                noResultsMessage = document.createElement('div');
                noResultsMessage.className = 'no-results-message';
                noResultsMessage.innerHTML = `
                    <div class="no-results-content">
                        <i class="fas fa-search"></i>
                        <h3>لم يتم العثور على نتائج</h3>
                        <p>جرب البحث بكلمات مختلفة أو تصفح جميع الكورسات المتاحة</p>
                        <button class="btn-clear-search" onclick="courseSearch.clearSearch()">
                            مسح البحث
                        </button>
                    </div>
                `;
                coursesGrid.appendChild(noResultsMessage);
            }
            noResultsMessage.style.display = 'block';
        } else {
            if (noResultsMessage) {
                noResultsMessage.style.display = 'none';
            }
        }
    }

    updateSearchStats(searchTerm) {
        let searchStats = document.querySelector('.search-stats');
        
        if (!searchStats) {
            searchStats = document.createElement('div');
            searchStats.className = 'search-stats';
            const coursesSection = document.querySelector('.courses-section');
            const coursesGrid = document.querySelector('.courses-grid');
            coursesSection.insertBefore(searchStats, coursesGrid);
        }

        searchStats.innerHTML = `
            <div class="search-results-info">
                <span class="results-count">${this.filteredCourses.length}</span>
                نتيجة للبحث عن: "<strong>${searchTerm}</strong>"
                <button class="btn-clear-search" onclick="courseSearch.clearSearch()">
                    <i class="fas fa-times"></i> مسح البحث
                </button>
            </div>
        `;
        searchStats.style.display = 'block';
    }

    clearSearchStats() {
        const searchStats = document.querySelector('.search-stats');
        if (searchStats) {
            searchStats.style.display = 'none';
        }
    }

    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        this.showAllCourses();
        this.clearSearchStats();
        
        // إزالة رسالة عدم وجود نتائج
        const noResultsMessage = document.querySelector('.no-results-message');
        if (noResultsMessage) {
            noResultsMessage.style.display = 'none';
        }
    }

    // دالة للبحث المتقدم (يمكن استخدامها لاحقاً)
    advancedSearch(filters) {
        this.filteredCourses = this.courses.filter(course => {
            let matches = true;

            if (filters.category && filters.category !== 'all') {
                matches = matches && course.category === filters.category;
            }

            if (filters.level) {
                matches = matches && course.level.toLowerCase().includes(filters.level.toLowerCase());
            }

            if (filters.priceRange) {
                // يمكن إضافة منطق تصفية السعر هنا
            }

            if (filters.duration) {
                matches = matches && course.duration.toLowerCase().includes(filters.duration.toLowerCase());
            }

            return matches;
        });

        this.displayResults();
    }
}

// إنشاء مثيل عام للبحث
let courseSearch;

// تهيئة البحث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    courseSearch = new CourseSearch();
});

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CourseSearch;
}