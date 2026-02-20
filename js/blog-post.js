// ============================================
//  PHASE 1 Enhanced Blog Post Display
//  Renders rich HTML content + featured images + tags
// ============================================

import { auth } from "../auth/firebase-config.js";
import { db }   from "../auth/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const loadingContainer = document.getElementById('loadingContainer');
    const postContainer    = document.getElementById('postContainer');
    const postDateEl       = document.getElementById('postDate');
    const postTitleEl      = document.getElementById('postTitle');
    const postContentEl    = document.getElementById('postContent');
    const draftBadge       = document.getElementById('draftBadge');
    
    // PHASE 1: New elements
   
    const tagsContainer    = document.getElementById('postTags');

    // Get post ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId    = urlParams.get('id');

    if (!postId) {
        window.location.href = 'blog.html';
        return;
    }

    // We need auth state before deciding whether to show drafts
    onAuthStateChanged(auth, (user) => {
        loadPost(postId, user);
    });

    async function loadPost(id, user) {
        try {
            const postRef  = doc(db, 'blog-posts', id);
            const postSnap = await getDoc(postRef);

            if (!postSnap.exists()) {
                alert('Post not found.');
                window.location.href = 'blog.html';
                return;
            }

            const post = postSnap.data();

            // Block draft access for non-authors
            if (!post.published && !user) {
                alert('This post is not yet published.');
                window.location.href = 'blog.html';
                return;
            }

            displayPost(post);

        } catch (error) {
            console.error('❌ Error loading post:', error);
            alert('Error loading post. Please try again.');
            window.location.href = 'blog.html';
        }
    }

    function displayPost(post) {
        // Page title
        postTitleEl.textContent = post.title;
        document.title = `${post.title} | Deep Vault Collective`;

        // Date
        if (post.createdAt) {
            postDateEl.textContent = new Date(post.createdAt.toDate()).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        } else {
            postDateEl.textContent = 'Draft';
        }

        // Draft badge
        if (!post.published) {
            draftBadge.style.display = 'inline-block';
        }
        
 
        
        // PHASE 1: Tags
        if (post.tags && post.tags.length > 0 && tagsContainer) {
            tagsContainer.innerHTML = '';
            post.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'post-tag-item';
                tagEl.textContent = tag;
                tagsContainer.appendChild(tagEl);
            });
            tagsContainer.style.display = 'flex';
        }

        // PHASE 1: Render rich HTML content (from Quill)
        // No need for markdown parsing - Quill saves as HTML
        postContentEl.innerHTML = sanitizeHtml(post.content);

        // Show post
        loadingContainer.style.display = 'none';
        postContainer.style.display    = 'block';
    }

    // ============================================
    // BASIC HTML SANITIZATION
    // ============================================
    
    function sanitizeHtml(html) {
        // Create a temporary div to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Allow only safe tags (Quill generates these)
        const allowedTags = ['p', 'br', 'strong', 'em', 'u', 's', 'h2', 'h3', 
                             'blockquote', 'ol', 'ul', 'li', 'a', 'code', 'pre', 'img'];
        
        // Remove script tags and dangerous attributes
        const scripts = temp.querySelectorAll('script, iframe, object, embed');
        scripts.forEach(el => el.remove());
        
        return temp.innerHTML;
    }
});