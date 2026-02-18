// Worlds & Stories Page
document.addEventListener('DOMContentLoaded', () => {

    // ============================================================
    //  SCROLL REVEAL — work cards & coming cards
    // ============================================================
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

    // ============================================================
    //  PARALLAX — header text and decorative badge rings
    //
    //  Header elements shift slowly upward for a gentle float.
    //  Badge rings move at a slightly faster rate than the card
    //  text, giving the illusion of depth between layers.
    // ============================================================

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    if (!prefersReducedMotion && !isMobile) {

        // Single elements
        const headerTargets = [
            { el: document.querySelector('.worlds-eyebrow'), speed: 0.04 },
            { el: document.querySelector('.worlds-title'), speed: 0.09 },
            { el: document.querySelector('.worlds-subtitle'), speed: 0.06 },
            { el: document.querySelector('.map-cta-text'), speed: 0.04 },
            { el: document.querySelector('.map-cta-btn'), speed: 0.03 },
        ].filter(t => t.el !== null);

        // Multiple elements — badge rings get a slightly higher speed
        // to feel like they're floating in front of the card text
        const badgeRings = Array.from(document.querySelectorAll('.badge-ring'));
        const sectionLabels = Array.from(document.querySelectorAll('.section-label'));

        const allTargets = [...headerTargets];

        badgeRings.forEach(el => allTargets.push({ el, speed: 0.12 }));
        sectionLabels.forEach(el => allTargets.push({ el, speed: 0.05 }));

        allTargets.forEach(({ el }) => {
            el.style.willChange = 'transform';
        });

        let ticking = false;

        function updateParallax() {
            const scrollY = window.scrollY;

            allTargets.forEach(({ el, speed }) => {
                const offset = scrollY * speed;
                el.style.transform = `translateY(-${offset}px)`;
            });

            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });
    }
});