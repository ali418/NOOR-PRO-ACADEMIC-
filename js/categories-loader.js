/**
 * Categories Loader for Homepage
 * Loads and displays category cards with course counts
 */

class CategoriesLoader {
    constructor() {
        this.categories = [];
        this.init();
    }

    init() {
        // Load categories when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadCategories());
        } else {
            this.loadCategories();
        }
    }

    async loadCategories() {
        const loadingElement = document.getElementById('loadingCategories');
        const gridElement = document.getElementById('categoriesGrid');

        if (!loadingElement || !gridElement) {
            console.warn('Categories elements not found on this page');
            return;
        }

        try {
            // Show loading
            loadingElement.style.display = 'block';
            gridElement.style.display = 'none';

            // Fetch categories from API
            const response = await fetch('/api/categories.json');
            const result = await response.json();

            if (result.success && result.data) {
                this.categories = result.data;
                this.displayCategories();
            } else {
                throw new Error(result.message || 'فشل في تحميل التصنيفات');
            }

        } catch (error) {
            console.error('Error loading categories:', error);
            this.showError(error.message);
        }
    }

    displayCategories() {
        const gridElement = document.getElementById('categoriesGrid');
        const loadingElement = document.getElementById('loadingCategories');

        if (!gridElement) return;

        // Show only first 6 categories on homepage
        const displayCategories = this.categories.slice(0, 6);

        if (displayCategories.length === 0) {
            this.showEmptyState();
            return;
        }

        // Generate category cards HTML
        const categoriesHTML = displayCategories.map(category => this.createCategoryCard(category)).join('');
        
        gridElement.innerHTML = categoriesHTML;

        // Hide loading and show grid
        loadingElement.style.display = 'none';
        gridElement.style.display = 'grid';

        // Add click event listeners
        this.addEventListeners();
    }

    createCategoryCard(category) {
        const icon = this.getCategoryIcon(category.category_name_ar);
        const color = this.getCategoryColor(category.category_name_ar);
        const coursesCount = category.courses_count || 0;
        const descriptionAr = category.description || this.getDefaultDescription(category.category_name_ar);
        const descriptionEn = this.getDefaultDescriptionEn(category.category_name_en || category.category_name_ar);

        const titleAr = category.category_name_ar || 'تصنيف';
        const titleEn = category.category_name_en || titleAr;

        const lang = (localStorage.getItem('language') || document.documentElement.lang || 'ar');
        const labelAr = 'مقرر متاح';
        const labelEn = 'Available Courses';
        const labelText = lang === 'en' ? labelEn : labelAr;

        return `
            <div class="category-card" data-category-id="${category.id}" onclick="navigateToCategory(${category.id})">
                <div class="category-icon" style="background: ${color}">
                    <i class="${icon}"></i>
                </div>
                <h3 class="category-title" data-ar="${this.escapeAttr(titleAr)}" data-en="${this.escapeAttr(titleEn)}">${lang === 'en' ? this.escapeHTML(titleEn) : this.escapeHTML(titleAr)}</h3>
                <p class="category-description" data-ar="${this.escapeAttr(descriptionAr)}" data-en="${this.escapeAttr(descriptionEn)}">${lang === 'en' ? this.escapeHTML(descriptionEn) : this.escapeHTML(descriptionAr)}</p>
                <div class="courses-count">
                    <i class="fas fa-book"></i>
                    <span class="count-number">${coursesCount}</span>
                    <span class="count-label" data-ar="${labelAr}" data-en="${labelEn}">${labelText}</span>
                </div>
            </div>
        `;
    }

    // بسيطة لتفادي مشاكل السمات HTML
    escapeAttr(text) {
        return String(text || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    getCategoryIcon(categoryName) {
        const iconMap = {
            'اللغة الإنجليزية': 'fas fa-language',
            'English': 'fas fa-language',
            'Speaking': 'fas fa-microphone',
            'Grammar': 'fas fa-spell-check',
            'الموارد البشرية': 'fas fa-users',
            'HR diplomas': 'fas fa-graduation-cap',
            'HR short courses': 'fas fa-certificate',
            'التقنية': 'fas fa-laptop-code',
            'Programming': 'fas fa-code',
            'Web Development': 'fas fa-globe',
            'Database': 'fas fa-database',
            'AI': 'fas fa-robot',
            'Security': 'fas fa-shield-alt'
        };

        // Try exact match first
        if (iconMap[categoryName]) {
            return iconMap[categoryName];
        }

        // Try partial matches
        const lowerName = categoryName.toLowerCase();
        if (lowerName.includes('english') || lowerName.includes('إنجليزية')) {
            return 'fas fa-language';
        }
        if (lowerName.includes('hr') || lowerName.includes('موارد')) {
            return 'fas fa-users';
        }
        if (lowerName.includes('programming') || lowerName.includes('تقنية') || lowerName.includes('web')) {
            return 'fas fa-laptop-code';
        }

        // Default icon
        return 'fas fa-book';
    }

    getCategoryColor(categoryName) {
        const colorMap = {
            'اللغة الإنجليزية': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'English': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'Speaking': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'Grammar': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'الموارد البشرية': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'HR diplomas': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'HR short courses': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'التقنية': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            'Programming': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            'Web Development': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'Database': 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
            'AI': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
            'Security': 'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)'
        };

        // Try exact match first
        if (colorMap[categoryName]) {
            return colorMap[categoryName];
        }

        // Try partial matches
        const lowerName = categoryName.toLowerCase();
        if (lowerName.includes('english') || lowerName.includes('إنجليزية')) {
            return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
        if (lowerName.includes('hr') || lowerName.includes('موارد')) {
            return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
        }
        if (lowerName.includes('programming') || lowerName.includes('تقنية') || lowerName.includes('web')) {
            return 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)';
        }

        // Default gradient
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    getDefaultDescription(categoryName) {
        const descriptionMap = {
            'اللغة الإنجليزية': 'تعلم اللغة الإنجليزية من الأساسيات إلى الاحتراف',
            'English': 'تعلم اللغة الإنجليزية من الأساسيات إلى الاحتراف',
            'Speaking': 'تطوير مهارات المحادثة والتحدث باللغة الإنجليزية',
            'Grammar': 'إتقان قواعد اللغة الإنجليزية بطريقة سهلة ومبسطة',
            'الموارد البشرية': 'تطوير مهارات إدارة الموارد البشرية والقيادة',
            'HR diplomas': 'دبلومات متخصصة في إدارة الموارد البشرية',
            'HR short courses': 'دورات قصيرة في مجال الموارد البشرية',
            'التقنية': 'تعلم أحدث التقنيات والبرمجة والتطوير',
            'Programming': 'تعلم البرمجة من الصفر إلى الاحتراف',
            'Web Development': 'تطوير المواقع والتطبيقات الإلكترونية',
            'Database': 'إدارة وتصميم قواعد البيانات',
            'AI': 'الذكاء الاصطناعي وتعلم الآلة',
            'Security': 'أمن المعلومات والحماية السيبرانية'
        };

        return descriptionMap[categoryName] || 'مجال تعليمي متميز يهدف إلى تطوير مهاراتك المهنية';
    }

    getDefaultDescriptionEn(categoryName) {
        const descriptionMapEn = {
            'اللغة الإنجليزية': 'Learn English from basics to proficiency',
            'English Language': 'Learn English from basics to proficiency',
            'Speaking': 'Develop English speaking and conversational skills',
            'Grammar': 'Master English grammar in a simple, easy way',
            'الموارد البشرية': 'Develop HR management and leadership skills',
            'Human Resources': 'Develop HR management and leadership skills',
            'HR diplomas': 'Specialized diplomas in human resources',
            'HR Diplomas': 'Specialized diplomas in human resources',
            'التقنية': 'Learn the latest technologies and programming',
            'Technology': 'Learn the latest technologies and programming',
            'Programming': 'Learn programming from zero to expert',
            'Web Development': 'Build modern websites and web apps',
            'Database': 'Design and manage databases',
            'AI': 'Artificial Intelligence and Machine Learning',
            'Security': 'Information security and cyber protection'
        };

        return descriptionMapEn[categoryName] || 'An educational field that helps you develop professional skills';
    }

    showError(message) {
        const loadingElement = document.getElementById('loadingCategories');
        const gridElement = document.getElementById('categoriesGrid');

        if (loadingElement) {
            loadingElement.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
                    <p style="font-size: 18px; margin-bottom: 10px;">حدث خطأ في تحميل التصنيفات</p>
                    <p style="font-size: 14px; color: #6b7280;">${message}</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-redo me-2"></i>
                        إعادة المحاولة
                    </button>
                </div>
            `;
        }

        if (gridElement) {
            gridElement.style.display = 'none';
        }
    }

    showEmptyState() {
        const loadingElement = document.getElementById('loadingCategories');
        const gridElement = document.getElementById('categoriesGrid');

        if (loadingElement) {
            loadingElement.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-folder-open" style="font-size: 48px; margin-bottom: 20px;"></i>
                    <p style="font-size: 18px;">لا توجد تصنيفات متاحة حالياً</p>
                </div>
            `;
        }

        if (gridElement) {
            gridElement.style.display = 'none';
        }
    }

    addEventListeners() {
        // Event listeners are handled by onclick attributes in the HTML
        // This method can be used for additional event handling if needed
    }
}

// Global function to navigate to category
function navigateToCategory(categoryId) {
    window.location.href = `category-courses.html?category=${categoryId}`;
}

// Initialize categories loader
const categoriesLoader = new CategoriesLoader();

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoriesLoader;
}