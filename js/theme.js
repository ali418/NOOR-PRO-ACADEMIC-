// Dark mode disabled: force light theme and hide toggle if present
document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');

    // Ensure light mode
    body.removeAttribute('data-theme');
    try { localStorage.removeItem('theme'); } catch (_) {}

    // Hide any existing toggle button
    if (themeToggle) {
        themeToggle.style.display = 'none';
        themeToggle.setAttribute('aria-hidden', 'true');
    }
});