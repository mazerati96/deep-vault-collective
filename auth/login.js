// ============================================================
//  LOGIN PAGE LOGIC
//  Firebase v9 modular syntax via CDN ESM
// ============================================================

import { auth } from "../auth/firebase-config.js";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');
    const authError = document.getElementById('errorMessage'); // matches HTML id
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');
    const eyeIcon = document.getElementById('eyeIcon');
    const eyeOffIcon = document.getElementById('eyeOffIcon');

    // ── Password visibility toggle ──
    passwordToggle.addEventListener('click', () => {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        eyeIcon.style.display = isHidden ? 'none' : 'block';
        eyeOffIcon.style.display = isHidden ? 'block' : 'none';
    });

    // ── If already logged in, skip straight to dashboard ──
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.location.href = 'author-dashboard.html';
        }
    });

    // ── Form submission ──
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous errors
        authError.style.display = 'none';
        authError.textContent = '';

        // Show loading state
        loginBtn.classList.add('loading');
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('✅ Signed in:', userCredential.user.uid);

            // Brief pause so the user sees the button state, then redirect
            setTimeout(() => {
                window.location.href = 'author-dashboard.html';
            }, 800);

        } catch (error) {
            console.error('❌ Login error:', error);

            // Reset button
            loginBtn.classList.remove('loading');
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';

            // User-friendly error messages
            const errorMessages = {
                'auth/user-not-found': 'No account found with this email.',
                'auth/wrong-password': 'Incorrect password.',
                'auth/invalid-email': 'Invalid email address.',
                'auth/invalid-credential': 'Invalid email or password.',
                'auth/too-many-requests': 'Too many failed attempts. Try again later.',
                'auth/network-request-failed': 'Network error. Check your connection.',
            };

            authError.textContent = errorMessages[error.code] || 'Login failed. Please try again.';
            authError.style.display = 'block';
        }
    });
});