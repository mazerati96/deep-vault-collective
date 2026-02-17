// Worlds & Stories Page
document.addEventListener('DOMContentLoaded', () => {
    // Scroll reveal for cards
    const cards = document.querySelectorAll('.work-card, .coming-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    cards.forEach(card => observer.observe(card));
});