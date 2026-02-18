// Contact Page - Form Handling
document.addEventListener('DOMContentLoaded', () => {

    // ============================================================
    //  FORM HANDLING
    // ============================================================
    const form = document.getElementById('contactForm');
    const submitBtn = form.querySelector('.submit-btn');
    const btnText = form.querySelector('.btn-text');
    const btnSending = form.querySelector('.btn-sending');
    const successMsg = document.getElementById('formSuccess');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Show sending state
        submitBtn.classList.add('sending');
        btnText.style.display = 'none';
        btnSending.style.display = 'inline';

        // Collect form data
        const data = {
            name: form.name.value.trim(),
            email: form.email.value.trim(),
            subject: form.subject.value.trim() || 'Message from Deep Vault Collective website',
            message: form.message.value.trim()
        };

        try {
            // Send to Vercel serverless function
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Submission failed');
            }

            // Show success
            form.reset();
            submitBtn.style.display = 'none';
            successMsg.style.display = 'block';

        } catch (err) {
            // Reset button on error
            submitBtn.classList.remove('sending');
            btnText.style.display = 'inline';
            btnSending.style.display = 'none';

            console.error('Form submission error:', err);
            alert('Something went wrong sending your message. Please try emailing directly at jkemp19992024@gmail.com');
        }
    });

    // ============================================================
    //  PARALLAX — subtle depth on header text
    //
    //  The title drifts up slightly faster than the subtitle,
    //  creating a gentle layered depth as the user scrolls.
    //  Social icons get a very slight shift for extra dimension.
    // ============================================================

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    if (!prefersReducedMotion && !isMobile) {

        const parallaxTargets = [
            { el: document.querySelector('.contact-title'), speed: 0.09 },
            { el: document.querySelector('.contact-subtitle'), speed: 0.05 },
            { el: document.querySelector('.social-title'), speed: 0.04 },
        ].filter(t => t.el !== null);

        // Give each social icon a very tiny staggered offset for depth
        const socialIcons = Array.from(document.querySelectorAll('.social-icon'));
        socialIcons.forEach((el, i) => {
            // Alternating slight speed difference per icon for layered feel
            const speed = 0.02 + (i % 2 === 0 ? 0.01 : 0);
            parallaxTargets.push({ el, speed });
        });

        parallaxTargets.forEach(({ el }) => {
            el.style.willChange = 'transform';
        });

        let ticking = false;

        function updateParallax() {
            const scrollY = window.scrollY;

            parallaxTargets.forEach(({ el, speed }) => {
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