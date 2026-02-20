// ============================================================
//  Individual Blog Post Page — ES Module, modular Firebase v10
// ============================================================

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

        // Render markdown content
        postContentEl.innerHTML = renderMarkdown(post.content);

        // Show post
        loadingContainer.style.display = 'none';
        postContainer.style.display    = 'block';
    }

    // ============================================
    // SIMPLE MARKDOWN RENDERER
    // ============================================

    function renderMarkdown(text) {
        if (!text) return '';

        let html = escapeHtml(text);

        // Headers
        html = html.replace(/^## (.+)$/gm,  '<h2>$1</h2>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

        // Bold & italic
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g,     '<em>$1</em>');

        // Links
        html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Blockquotes
        html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr>');

        // Paragraphs (double newline)
        html = html.split('\n\n').map(para => {
            para = para.trim();
            if (!para) return '';
            if (para.startsWith('<h') || para.startsWith('<blockquote') || para.startsWith('<hr')) return para;
            return `<p>${para}</p>`;
        }).join('\n');

        // Single line breaks within paragraphs
        html = html.replace(/(?<!>)\n(?!<)/g, '<br>');

        return html;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});