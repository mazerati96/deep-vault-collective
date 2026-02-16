// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    const enterBtn = document.querySelector('.enter-btn');

    enterBtn.addEventListener('click', () => {
        // Add click animation
        enterBtn.style.transform = 'scale(0.95)';

        setTimeout(() => {
            // Fade out splash screen
            document.querySelector('.splash-container').style.opacity = '0';
            document.querySelector('.splash-container').style.transition = 'opacity 1s ease';

            // TODO: Navigate to main site after fade
            setTimeout(() => {
                console.log('Transitioning to main site...');
                // Add the star map here later possibly 
            }, 1000);
        }, 100);
    });
});