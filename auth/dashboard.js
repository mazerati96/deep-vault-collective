// ============================================================
//  DASHBOARD LOGIC — Protected Page
//  Firebase v9 modular syntax via CDN ESM
// ============================================================

import { auth } from "../auth/firebase-config.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const userEmailEl = document.getElementById('userEmail');
    const logoutBtn = document.getElementById('logoutBtn');

    // ── Auth guard — redirect to login if not authenticated ──
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('✅ Authenticated:', user.uid);
            if (userEmailEl) userEmailEl.textContent = user.email;
        } else {
            console.log('❌ Not authenticated — redirecting to login');
            window.location.href = 'author-login.html';
        }
    });

    // ── Logout ──
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            console.log('✅ Signed out');
            window.location.href = 'author-login.html';
        } catch (error) {
            console.error('❌ Logout error:', error);
            alert('Error signing out. Please try again.');
        }
    });
});