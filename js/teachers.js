document.addEventListener('DOMContentLoaded', () => {
    const langButtons = document.querySelectorAll('.lang-btn');

    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            const lang = button.dataset.lang;
            const target = button.dataset.target;

            // Update active button state
            const parentToggle = button.closest('.lang-toggle');
            parentToggle.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show the correct bio content
            const infoContainer = button.closest('.teacher-info');
            infoContainer.querySelectorAll('.bio-content').forEach(content => {
                content.style.display = 'none';
            });

            const activeContent = infoContainer.querySelector(`#${target}-${lang}`);
            if (activeContent) {
                activeContent.style.display = 'block';
            }
        });
    });
});