// About Page Interactions
document.addEventListener('DOMContentLoaded', () => {

    // ============================================================
    //  SCROLL REVEAL — about-section elements
    // ============================================================
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

    // ============================================================
    //  HOVER EFFECT — work highlights
    // ============================================================
    const workHighlights = document.querySelectorAll('.work-highlight');

    workHighlights.forEach(highlight => {
        highlight.addEventListener('mouseenter', () => {
            highlight.style.transform = 'translateY(-5px)';
        });
        highlight.addEventListener('mouseleave', () => {
            highlight.style.transform = 'translateY(0)';
        });
    });

    // ============================================================
    //  PARALLAX — subtle depth on title & subtitle
    //  (These elements are not managed by the IntersectionObserver
    //   so their transforms are safe to control here.)
    // ============================================================

    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Skip on small/mobile screens
    const isMobile = window.innerWidth < 768;

    if (!prefersReducedMotion && !isMobile) {

        const parallaxTargets = [
            { el: document.querySelector('.about-title'), speed: 0.08 },
            { el: document.querySelector('.about-subtitle'), speed: 0.05 },
        ];

        // Filter out any nulls (elements that might not exist)
        const validTargets = parallaxTargets.filter(t => t.el !== null);

        // Set will-change for compositor optimization
        validTargets.forEach(({ el }) => {
            el.style.willChange = 'transform';
        });

        let ticking = false;

        function updateParallax() {
            const scrollY = window.scrollY;

            validTargets.forEach(({ el, speed }) => {
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