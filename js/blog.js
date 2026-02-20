// MINIMAL TEST VERSION - Just load posts, no fancy features
import { auth } from "../auth/firebase-config.js";
import { db } from "../auth/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection,
    query,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🟢 DOM loaded');
    
    const postsGrid = document.getElementById('postsGrid');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const newPostBtn = document.getElementById('newPostBtn');

    onAuthStateChanged(auth, (user) => {
        console.log('🟢 Auth state changed:', user ? 'Logged in' : 'Not logged in');
        currentUser = user;
        if (newPostBtn) newPostBtn.style.display = user ? 'inline-block' : 'none';
        loadPosts();
    });

    async function loadPosts() {
        console.log('🟢 Starting loadPosts...');
        
        try {
            if (loadingState) loadingState.style.display = 'block';
            if (emptyState) emptyState.style.display = 'none';

            console.log('🟢 Querying Firestore...');
            const q = query(collection(db, 'blog-posts'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            
            console.log('🟢 Got snapshot:', snapshot.size, 'posts');

            // Remove old cards
            postsGrid.querySelectorAll('.post-card').forEach(c => c.remove());

            if (snapshot.empty) {
                console.log('⚠️ No posts found');
                if (loadingState) loadingState.style.display = 'none';
                if (emptyState) emptyState.style.display = 'block';
                return;
            }

            if (loadingState) loadingState.style.display = 'none';

            let index = 0;
            snapshot.forEach((docSnap) => {
                const post = docSnap.data();
                const postId = docSnap.id;
                
                console.log('🟢 Post:', postId, post.title);

                // Skip drafts for public
                if (!post.published && !currentUser) {
                    console.log('⚠️ Skipping draft:', postId);
                    return;
                }

                // Create simple card
                const card = document.createElement('div');
                card.className = 'post-card';
                card.innerHTML = `
                    <h2 class="post-title">${escapeHtml(post.title)}</h2>
                    <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
                    <a href="blog-post.html?id=${postId}" class="read-more">READ MORE</a>
                `;
                postsGrid.appendChild(card);
                index++;
            });

            console.log('✅ Rendered', index, 'posts');

        } catch (error) {
            console.error('❌ ERROR in loadPosts:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            if (loadingState) loadingState.style.display = 'none';
            if (emptyState) {
                emptyState.style.display = 'block';
                emptyState.querySelector('h2').textContent = 'Error Loading Posts';
                emptyState.querySelector('p').textContent = error.message;
            }
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});