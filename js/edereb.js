// ============================================
// EDEREB.JS — Dying Ember Particle Background
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    const container = document.createElement('div');
    container.className = 'ember-background';
    document.body.prepend(container);

    const EMBER_COUNT = 22;

    for (let i = 0; i < EMBER_COUNT; i++) {
        const ember = document.createElement('div');
        ember.className = 'ember';

        // Random position across viewport
        const x = Math.random() * 100; // vw

        // Size — mostly tiny, occasionally a larger dying ember
        const size = 1.5 + Math.random() * 4; // px

        // Very faint — barely perceptible
        const maxOpacity = 0.04 + Math.random() * 0.1;

        // Slow rise: 20–55 seconds
        const duration = 20 + Math.random() * 35;

        // Stagger start so screen is populated on load
        const delay = -(Math.random() * duration);

        // Gentle horizontal drift — embers don't travel far
        const drift = (Math.random() - 0.5) * 60; // px

        // Rise height varies — some barely lift, some travel high
        const rise = 40 + Math.random() * 80; // vh

        ember.style.cssText = `
            left: ${x}vw;
            bottom: ${Math.random() * 20}vh;
            width: ${size}px;
            height: ${size}px;
            opacity: ${maxOpacity};
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
            --drift: ${drift}px;
            --rise: -${rise}vh;
        `;

        container.appendChild(ember);
    }

});