document.addEventListener('DOMContentLoaded', () => {
    const logoImg = document.getElementById('logo-img');
    const canvas = document.getElementById('logo-canvas');
    const ctx = canvas.getContext('2d');
    const enterBtn = document.querySelector('.enter-btn');
    const splashContainer = document.querySelector('.splash-container');

    // Wait for image to load
    logoImg.onload = function () {
        initPixelReveal();
    };

    // If image already loaded
    if (logoImg.complete) {
        initPixelReveal();
    }

    function initPixelReveal() {
        // Set canvas size to match image
        canvas.width = logoImg.offsetWidth;
        canvas.height = logoImg.offsetHeight;

        // Draw the logo onto the canvas
        ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Clear canvas to start
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Hide the original image (we'll draw it on canvas)
        logoImg.style.opacity = '0';

        // Create array of all pixel positions
        const pixelPositions = [];
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const index = (y * canvas.width + x) * 4;
                const alpha = pixels[index + 3];

                // Only include non-transparent pixels
                if (alpha > 0) {
                    pixelPositions.push({ x, y, index });
                }
            }
        }

        // Shuffle for random reveal (looks more "drawn")
        shuffleArray(pixelPositions);

        // Reveal pixels gradually
        const totalPixels = pixelPositions.length;
        const duration = 2500; // 2.5 seconds
        const pixelsPerFrame = Math.ceil(totalPixels / (duration / 16)); // ~60fps

        let currentPixel = 0;

        const revealInterval = setInterval(() => {
            const batch = pixelsPerFrame * 2; // Reveal in batches for performance

            for (let i = 0; i < batch && currentPixel < totalPixels; i++) {
                const pixel = pixelPositions[currentPixel];
                const index = pixel.index;

                ctx.fillStyle = `rgba(${pixels[index]}, ${pixels[index + 1]}, ${pixels[index + 2]}, ${pixels[index + 3] / 255})`;
                ctx.fillRect(pixel.x, pixel.y, 1, 1);

                currentPixel++;
            }

            if (currentPixel >= totalPixels) {
                clearInterval(revealInterval);
            }
        }, 16); // ~60fps
    }

    // Shuffle array helper
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Enter button click - NAVIGATE TO STAR MAP
    enterBtn.addEventListener('click', () => {
        enterBtn.style.transform = 'scale(0.95)';
        enterBtn.style.opacity = '0.5';

        setTimeout(() => {
            splashContainer.style.transition = 'opacity 1.2s ease';
            splashContainer.style.opacity = '0';

            setTimeout(() => {
                // Navigate to star map page
                window.location.href = 'pages/starmap.html';
            }, 1200);
        }, 100);
    });
});