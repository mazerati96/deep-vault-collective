// Star Map Interactions - DRAGGABLE VERSION WITH FADE-IN
document.addEventListener('DOMContentLoaded', () => {
    const planets = document.querySelectorAll('.planet');
    const starmapBackground = document.querySelector('.starmap-background');
    const starmapImage = starmapBackground.querySelector('img');

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
        wuld: { name: 'Wuld', description: 'Home to the story "A Rogue\'s Tale"', link: 'wuld.html' },
        jesnen: { name: 'Jesnen', description: 'Coming soon...', link: 'jesnen.html' },
        ilun: { name: 'Ilun', description: 'Coming soon...', link: 'ilun.html' },
        westelox: { name: 'Westelox', description: 'Coming soon...', link: 'westelox.html' },
        xenderon: { name: 'Xenderon (Hell)', description: 'Coming soon...', link: 'xenderon.html' },
        vyomi: { name: 'Vyomi (Heaven)', description: 'Coming soon...', link: 'vyomi.html' },
        edereb: { name: 'Edereb', description: 'Coming soon...', link: 'edereb.html' },
        omicros: { name: 'Omicros', description: 'Coming soon...', link: 'omicros.html' },
        astraea: { name: 'Astraea', description: 'Coming soon...', link: 'astraea.html' },
        rexus: { name: 'Rexus', description: 'Coming soon...', link: 'rexus.html' },
        legatius: { name: 'Legatius', description: 'Coming soon...', link: 'legatius.html' }
    };

    // ============================================
    // DRAGGABLE MAP FUNCTIONALITY
    // ============================================

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;
    let currentX = 0;
    let currentY = 0;

    const container = document.querySelector('.starmap-container');

    container.addEventListener('mousedown', startDrag);
    container.addEventListener('mousemove', drag);
    container.addEventListener('mouseup', endDrag);
    container.addEventListener('mouseleave', endDrag);

    // Touch support for mobile
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', endDrag);

    function startDrag(e) {
        isDragging = true;
        startX = e.clientX - currentX;
        startY = e.clientY - currentY;
        container.style.cursor = 'grabbing';
    }

    function drag(e) {
        if (!isDragging) return;

        e.preventDefault();
        currentX = e.clientX - startX;
        currentY = e.clientY - startY;

        // Limit drag boundaries so map doesn't go too far
        const maxDrag = 500;
        currentX = Math.max(-maxDrag, Math.min(maxDrag, currentX));
        currentY = Math.max(-maxDrag, Math.min(maxDrag, currentY));

        starmapBackground.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
    }

    function endDrag() {
        isDragging = false;
        container.style.cursor = 'grab';
    }

    function handleTouchStart(e) {
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX - currentX;
        startY = touch.clientY - currentY;
    }

    function handleTouchMove(e) {
        if (!isDragging) return;

        e.preventDefault();
        const touch = e.touches[0];
        currentX = touch.clientX - startX;
        currentY = touch.clientY - startY;

        const maxDrag = 500;
        currentX = Math.max(-maxDrag, Math.min(maxDrag, currentX));
        currentY = Math.max(-maxDrag, Math.min(maxDrag, currentY));

        starmapBackground.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
    }

    // Set initial cursor
    container.style.cursor = 'grab';

    // ============================================
    // PLANET CLICK HANDLERS
    // ============================================

    planets.forEach(planet => {
        planet.addEventListener('click', (e) => {
            // Only trigger if not dragging
            if (Math.abs(currentX - translateX) < 5 && Math.abs(currentY - translateY) < 5) {
                const planetName = planet.getAttribute('data-planet');
                const data = planetData[planetName];

                if (data) {
                    const transition = document.querySelector('.page-transition');
                    transition.classList.add('active');

                    setTimeout(() => {
                        window.location.href = data.link;
                    }, 600);
                }
            }
        });
    });

    // Update translate values on mouse up
    container.addEventListener('mouseup', () => {
        translateX = currentX;
        translateY = currentY;
    });
});