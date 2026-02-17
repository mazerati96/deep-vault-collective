// Star Map Interactions
document.addEventListener('DOMContentLoaded', () => {
    const planets = document.querySelectorAll('.planet');

    // Planet data - you can expand this with real info later
    const planetData = {
        wuld: {
            name: 'Wuld',
            description: 'Home to the story "A Rogue\'s Tale"',
            link: 'wuld.html'
        },
        jesnen: {
            name: 'Jesnen',
            description: 'Coming soon...',
            link: 'jesnen.html'
        },
        ilun: {
            name: 'Ilun',
            description: 'Coming soon...',
            link: 'ilun.html'
        },
        westelox: {
            name: 'Westelox',
            description: 'Coming soon...',
            link: 'westelox.html'
        },
        xenderon: {
            name: 'Xenderon (Hell)',
            description: 'Coming soon...',
            link: 'xenderon.html'
        },
        vyomi: {
            name: 'Vyomi (Heaven)',
            description: 'Coming soon...',
            link: 'vyomi.html'
        },
        edereb: {
            name: 'Edereb',
            description: 'Coming soon...',
            link: 'edereb.html'
        },
        omicros: {
            name: 'Omicros',
            description: 'Coming soon...',
            link: 'omicros.html'
        },
        astraea: {
            name: 'Astraea',
            description: 'Coming soon...',
            link: 'astraea.html'
        },
        rexus: {
            name: 'Rexus',
            description: 'Coming soon...',
            link: 'rexus.html'
        },
        legatius: {
            name: 'Legatius',
            description: 'Coming soon...',
            link: 'legatius.html'
        }
    };

    // Click handler for planets
    planets.forEach(planet => {
        planet.addEventListener('click', () => {
            const planetName = planet.getAttribute('data-planet');
            const data = planetData[planetName];

            if (data) {
                // Trigger page transition
                const transition = document.querySelector('.page-transition');
                transition.classList.add('active');

                setTimeout(() => {
                    // Navigate to planet page
                    window.location.href = data.link;
                }, 600);
            }
        });

        // Add hover sound effect placeholder (optional)
        planet.addEventListener('mouseenter', () => {
            // Can add sound effects here later
            // const hoverSound = new Audio('../assets/sounds/hover.mp3');
            // hoverSound.play();
        });
    });

    // Smooth parallax effect on mouse move (subtle)
    const starmapBackground = document.querySelector('.starmap-background');

    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;

        starmapBackground.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.05)`;
    });
});