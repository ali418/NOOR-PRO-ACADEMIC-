// Course Filter Management
class CourseFilter {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.setActiveCategory('all');
    }

    bindEvents() {
        // Category filter buttons
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.filterCourses(category);
                this.setActiveCategory(category);
            });
        });
    }

    setActiveCategory(category) {
        // Remove active class from all buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to selected button
        const activeBtn = document.querySelector(`[data-category="${category}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    filterCourses(category) {
        const courseCards = document.querySelectorAll('.course-card');
        
        courseCards.forEach(card => {
            const cardCategory = card.dataset.category;
            
            if (category === 'all' || cardCategory === category) {
                card.classList.remove('hidden');
                // Add animation
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                }, 100);
            } else {
                card.classList.add('hidden');
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
            }
        });

        // Update course count
        this.updateCourseCount(category);
    }

    updateCourseCount(category) {
        const visibleCourses = document.querySelectorAll('.course-card:not(.hidden)').length;
        const countElement = document.querySelector('.course-count');
        
        if (countElement) {
            const categoryName = category === 'all' ? 'جميع الكورسات' : this.getCategoryName(category);
            countElement.textContent = `${categoryName} (${visibleCourses})`;
        }
    }

    getCategoryName(category) {
        const categoryNames = {
            'english': 'اللغة الإنجليزية',
            'hr': 'الموارد البشرية',
            'technical': 'التقنية'
        };
        return categoryNames[category] || category;
    }

    // Search functionality
    searchCourses(searchTerm) {
        const courseCards = document.querySelectorAll('.course-card');
        const term = searchTerm.toLowerCase();

        courseCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            
            if (title.includes(term) || description.includes(term)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Animation for course cards on scroll
    animateOnScroll() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1
        });

        document.querySelectorAll('.course-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease';
            observer.observe(card);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const courseFilter = new CourseFilter();
    
    // Add search functionality if search input exists
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            courseFilter.searchCourses(e.target.value);
        });
    }

    // Initialize scroll animations
    courseFilter.animateOnScroll();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CourseFilter;
}