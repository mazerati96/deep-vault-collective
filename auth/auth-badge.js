// ============================================================
//  AUTH BADGE — Floating "Author Logged In" indicator
//  ES Module — uses modular Firebase v10 SDK
// ============================================================

import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Inject styles
const style = document.createElement('style');
style.textContent = `
    #auth-badge {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9998;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 18px;
        background: rgba(0, 0, 0, 0.75);
        border: 1px solid rgba(0, 217, 255, 0.4);
        backdrop-filter: blur(10px);
        box-shadow: 0 0 20px rgba(0, 217, 255, 0.15);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        animation: badgeFadeIn 0.6s ease forwards;
    }

    @keyframes badgeFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    .auth-badge-text {
        font-size: 0.7rem;
        letter-spacing: 2px;
        color: #00d9ff;
        font-weight: 600;
        white-space: nowrap;
    }

    .auth-badge-divider {
        color: rgba(0, 217, 255, 0.4);
        font-size: 0.8rem;
    }

    .auth-badge-logout {
        font-size: 0.7rem;
        letter-spacing: 2px;
        color: rgba(255, 255, 255, 0.6);
        background: transparent;
        border: none;
        cursor: pointer;
        font-family: inherit;
        font-weight: 600;
        padding: 0;
        transition: color 0.2s ease;
        white-space: nowrap;
    }

    .auth-badge-logout:hover {
        color: #fff;
    }

    @media (max-width: 768px) {
        #auth-badge {
            bottom: 16px;
            right: 16px;
            padding: 8px 14px;
        }
        .auth-badge-text {
            font-size: 0.6rem;
            letter-spacing: 1px;
        }
        .auth-badge-logout {
            font-size: 0.6rem;
        }
    }
`;
document.head.appendChild(style);

onAuthStateChanged(auth, (user) => {
    // Remove any existing badge first
    const existing = document.getElementById('auth-badge');
    if (existing) existing.remove();

    if (!user) return; // Not logged in — do nothing

    // Build the badge
    const badge = document.createElement('div');
    badge.id = 'auth-badge';
    badge.innerHTML = `
        <span class="auth-badge-text">✦ AUTHOR LOGGED IN</span>
        <span class="auth-badge-divider">|</span>
        <button class="auth-badge-logout" id="authBadgeLogout">LOG OUT</button>
    `;
    document.body.appendChild(badge);

    // Logout handler
    document.getElementById('authBadgeLogout').addEventListener('click', async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('❌ Logout error:', error);
            alert('Error signing out. Please try again.');
        }
    });
});