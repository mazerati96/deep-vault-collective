// ============================================================
//  FIREBASE CONFIG
//  Using CDN ESM imports — no bundler required
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAwZMXM8GKjxqLi49IDAtYQ-qOh8xwfPGw",
    authDomain: "deep-vault-collective.firebaseapp.com",
    projectId: "deep-vault-collective",
    storageBucket: "deep-vault-collective.firebasestorage.app",
    messagingSenderId: "258533145085",
    appId: "1:258533145085:web:4b7a93823400f1af590194"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and db so other modules can import them
export const auth = getAuth(app);
export const db = getFirestore(app);