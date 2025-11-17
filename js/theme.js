// Theme toggle removed as requested; keep current theme behavior minimal
document.addEventListener('DOMContentLoaded', () => {
    try { localStorage.removeItem('theme'); } catch (_) {}
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.style.display = 'none';
        btn.setAttribute('aria-hidden', 'true');
    }
});