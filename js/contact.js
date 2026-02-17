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
});