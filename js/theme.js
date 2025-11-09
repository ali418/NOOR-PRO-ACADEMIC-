document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Function to apply the saved theme
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            body.removeAttribute('data-theme');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    };

    // Check for saved theme in local storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    }

    // Event listener for the theme toggle button
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            let newTheme;
            if (body.getAttribute('data-theme') === 'dark') {
                body.removeAttribute('data-theme');
                newTheme = 'light';
            } else {
                body.setAttribute('data-theme', 'dark');
                newTheme = 'dark';
            }
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }
});