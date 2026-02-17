// Contact Page - Form Handling
document.addEventListener('DOMContentLoaded', () => {
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
           
            await new Promise(resolve => setTimeout(resolve, 1200));

            // Show success
            form.reset();
            submitBtn.style.display = 'none';
            successMsg.style.display = 'block';

        } catch (err) {
            // Reset button on error
            submitBtn.classList.remove('sending');
            btnText.style.display = 'inline';
            btnSending.style.display = 'none';
            alert('Something went wrong. Please try emailing directly at jkemp19992024@gmail.com');
        }
    });
});