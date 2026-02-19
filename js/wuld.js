// ============================================
// WULD.JS — Floating Arcane Rune Background
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    // Elder Futhark runes — archaic, fitting for a rune-magic world
    const RUNES = [
        'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ',
        'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ',
        'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ'
    ];

    // Create the fixed background container
    const container = document.createElement('div');
    container.className = 'rune-background';
    document.body.prepend(container);

    const RUNE_COUNT = 26;

    for (let i = 0; i < RUNE_COUNT; i++) {
        const rune = document.createElement('span');
        rune.className = 'floating-rune';

        // Random rune character
        rune.textContent = RUNES[Math.floor(Math.random() * RUNES.length)];

        // Random horizontal position across the full viewport width
        const x = Math.random() * 100; // vw

        // Random font size — mix of small accents and larger glyphs
        const size = 1.0 + Math.random() * 3.2; // rem

        // Very low opacity — barely visible, purely atmospheric
        const opacity = 0.035 + Math.random() * 0.085;

        // Slow drift: 25-55 seconds per cycle
        const duration = 25 + Math.random() * 30;

        // Negative delay means the rune is already mid-journey on load
        // so the screen is populated immediately, not empty at first
        const delay = -(Math.random() * duration);

        // Subtle horizontal drift as it rises — feels organic, not mechanical
        const drift = (Math.random() - 0.5) * 80; // px left or right

        // Slight rotation over the journey
        const spin = (Math.random() - 0.5) * 25; // degrees

        rune.style.cssText = `
            left: ${x}vw;
            font-size: ${size}rem;
            opacity: ${opacity};
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
            --drift: ${drift}px;
            --spin: ${spin}deg;
        `;

        container.appendChild(rune);
    }

});