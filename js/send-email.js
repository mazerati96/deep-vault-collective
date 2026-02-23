
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    const btnText = form.querySelector('.btn-text');
    const btnSending = form.querySelector('.btn-sending');
    const success = document.getElementById('formSuccess');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Swap button to sending state
        btnText.style.display = 'none';
        btnSending.style.display = 'inline';
        success.style.display = 'none';

        const payload = {
            name: form.querySelector('#name').value.trim(),
            email: form.querySelector('#email').value.trim(),
            subject: form.querySelector('#subject').value.trim(),
            message: form.querySelector('#message').value.trim()
        };

        try {
            const response = await fetch('/api/send-email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                form.reset();
                success.style.display = 'block';
            } else {
                alert(result.error || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            console.error('Form submission error:', err);
            alert('Could not send message. Please try again or email contact@johnathankemp.org directly.');
        } finally {
            // Restore button
            btnText.style.display = 'inline';
            btnSending.style.display = 'none';
        }
    });
});