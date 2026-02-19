// Login Page Logic
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');
    const authError = document.getElementById('authError');
    const authSuccess = document.getElementById('authSuccess');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Check if already logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in, redirect to dashboard
            window.location.href = 'author-dashboard.html';
        }
    });

    // Handle form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Hide previous messages
        authError.style.display = 'none';
        authSuccess.style.display = 'none';

        // Show loading state
        loginBtn.classList.add('loading');
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        try {
            // Sign in with Firebase Auth
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            console.log('✅ Signed in:', user.uid);

            // Show success
            authSuccess.style.display = 'block';
            loginForm.reset();

            // Redirect to dashboard after 1 second
            setTimeout(() => {
                window.location.href = 'author-dashboard.html';
            }, 1000);

        } catch (error) {
            console.error('❌ Login error:', error);

            // Reset button
            loginBtn.classList.remove('loading');
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';

            // Show user-friendly error message
            let errorMessage = 'Login failed. Please try again.';

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Try again later.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Check your connection.';
            }

            authError.textContent = errorMessage;
            authError.style.display = 'block';
        }
    });
});