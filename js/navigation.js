// Global Navigation Script
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger-menu');
    const navOverlay = document.querySelector('.nav-overlay');
    const navLinks = document.querySelectorAll('.nav-menu a');

    // Toggle menu
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navOverlay.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');

            // Close menu
            hamburger.classList.remove('active');
            navOverlay.classList.remove('active');

            // Trigger page transition
            const transition = document.querySelector('.page-transition');
            transition.classList.add('active');

            setTimeout(() => {
                window.location.href = href;
            }, 600);
        });
    });

    // Close menu when clicking outside
    navOverlay.addEventListener('click', (e) => {
        if (e.target === navOverlay) {
            hamburger.classList.remove('active');
            navOverlay.classList.remove('active');
        }
    });

    // ESC key to close menu
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navOverlay.classList.contains('active')) {
            hamburger.classList.remove('active');
            navOverlay.classList.remove('active');
        }
    });
});