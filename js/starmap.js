// Star Map Interactions - FIXED DRAGGABLE + MOBILE TAP VERSION
document.addEventListener('DOMContentLoaded', () => {
    const planets = document.querySelectorAll('.planet');
    const starmapBackground = document.querySelector('.starmap-background');
    const starmapImage = starmapBackground.querySelector('img');
    const container = document.querySelector('.starmap-container');

    // ============================================
    // SMOOTH FADE-IN AFTER IMAGE LOADS
    // ============================================

    starmapImage.addEventListener('load', () => {
        starmapBackground.style.transform = 'translate(-50%, -50%)';
        setTimeout(() => {
            starmapBackground.classList.add('loaded');
        }, 100);
    });

    if (starmapImage.complete) {
        starmapBackground.style.transform = 'translate(-50%, -50%)';
        setTimeout(() => {
            starmapBackground.classList.add('loaded');
        }, 100);
    }

    // Planet data
    const planetData = {
        wuld: {
            name: 'Wuld', link: 'wuld.html' },
        jesnen: { name: 'Jesnen', description: 'Coming soon...', link: 'worlds.html' },
        ilun: { name: 'Ilun', link: 'ilun.html' },
        westelox: { name: 'Westelox', description: 'Coming soon...', link: 'worlds.html' },
        xenderon: { name: 'Xenderon (Hell)', description: 'Coming soon...', link: 'worlds.html' },
        vyomi: { name: 'Vyomi (Heaven)', description: 'Coming soon...', link: 'worlds.html' },
        edereb: { name: 'Edereb', description: 'Coming soon...', link: 'worlds.html' },
        omicros: { name: 'Omicros', description: 'Coming soon...', link: 'worlds.html' },
        astraea: { name: 'Astraea', description: 'Coming soon...', link: 'worlds.html' },
        rexus: { name: 'Rexus', description: 'Coming soon...', link: 'worlds.html' },
        legatius: { name: 'Legatius', description: 'Coming soon...', link: 'worlds.html' }
    };

    // Helper: trigger page transition and navigate
    function navigateToPlanet(planetName) {
        const data = planetData[planetName];
        if (data) {
            const transition = document.querySelector('.page-transition');
            transition.classList.add('active');
            setTimeout(() => {
                window.location.href = data.link;
            }, 600);
        }
    }

    // ============================================
    // DRAGGABLE MAP FUNCTIONALITY
    // ============================================

    let isDragging = false;
    let hasDragged = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;

    container.style.cursor = 'grab';

    // --- Mouse events (desktop) ---

    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        hasDragged = false;
        startX = e.clientX - currentX;
        startY = e.clientY - currentY;
        container.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const newX = e.clientX - startX;
        const newY = e.clientY - startY;

        if (Math.abs(newX - currentX) > 3 || Math.abs(newY - currentY) > 3) {
            hasDragged = true;
        }

        currentX = newX;
        currentY = newY;

        const maxDrag = 500;
        currentX = Math.max(-maxDrag, Math.min(maxDrag, currentX));
        currentY = Math.max(-maxDrag, Math.min(maxDrag, currentY));

        starmapBackground.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        container.style.cursor = 'grab';
    });

    // --- Touch events (mobile) ---

    let touchStartX = 0;
    let touchStartY = 0;

    container.addEventListener('touchstart', (e) => {
        isDragging = true;
        hasDragged = false;
        const touch = e.touches[0];
        touchStartX = touch.clientX - currentX;
        touchStartY = touch.clientY - currentY;
        e.preventDefault();
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const touch = e.touches[0];
        const newX = touch.clientX - touchStartX;
        const newY = touch.clientY - touchStartY;

        if (Math.abs(newX - currentX) > 3 || Math.abs(newY - currentY) > 3) {
            hasDragged = true;
        }

        currentX = newX;
        currentY = newY;

        const maxDrag = 500;
        currentX = Math.max(-maxDrag, Math.min(maxDrag, currentX));
        currentY = Math.max(-maxDrag, Math.min(maxDrag, currentY));

        starmapBackground.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
    }, { passive: false });

    container.addEventListener('touchend', () => {
        isDragging = false;
    });

    // ============================================
    // PLANET CLICK HANDLERS (desktop)
    // ============================================

    planets.forEach(planet => {
        planet.addEventListener('click', (e) => {
            if (!hasDragged) {
                navigateToPlanet(planet.getAttribute('data-planet'));
            }
            hasDragged = false;
        });
    });

    // ============================================
    // PLANET TAP HANDLERS (mobile)
    // FIX: container touchstart calls e.preventDefault(), which blocks
    // the synthetic 'click' event mobile browsers normally fire after a tap.
    // So we listen for touchend directly on each planet instead, and
    // navigate if the finger didn't meaningfully move (hasDragged is false).
    // ============================================

    planets.forEach(planet => {
        planet.addEventListener('touchend', (e) => {
            if (!hasDragged) {
                e.stopPropagation(); // prevent container touchend from interfering
                navigateToPlanet(planet.getAttribute('data-planet'));
            }
        });
    });

});