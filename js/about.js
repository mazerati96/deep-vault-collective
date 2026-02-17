// About Page Interactions
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll reveal for sections (if needed for future content)
    const sections = document.querySelectorAll('.about-section');

    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // Add hover effect to work highlights
    const workHighlights = document.querySelectorAll('.work-highlight');

    workHighlights.forEach(highlight => {
        highlight.addEventListener('mouseenter', () => {
            highlight.style.transform = 'translateY(-5px)';
        });

        highlight.addEventListener('mouseleave', () => {
            highlight.style.transform = 'translateY(0)';
        });
    });
});