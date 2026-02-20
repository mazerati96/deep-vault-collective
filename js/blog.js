// ============================================================
//  Blog Page Logic — ES Module, modular Firebase v10 SDK
// ============================================================

import { auth } from "../auth/firebase-config.js";
import { db } from "../auth/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection,
    query,
    orderBy,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUser = null;
let editingPostId = null;

document.addEventListener('DOMContentLoaded', () => {
    const postsGrid = document.getElementById('postsGrid');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const newPostBtn = document.getElementById('newPostBtn');
    const postModal = document.getElementById('postModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const postForm = document.getElementById('postForm');
    const cancelBtn = document.getElementById('cancelBtn');

    // Form fields
    const postTitleField = document.getElementById('postTitle');
    const postExcerptField = document.getElementById('postExcerpt');
    const postContentField = document.getElementById('postContent');
    const postPublished = document.getElementById('postPublished');
    const postIdField = document.getElementById('postId');
    const modalTitle = document.getElementById('modalTitle');
    const saveBtn = document.getElementById('saveBtn');
    const btnText = saveBtn.querySelector('.btn-text');
    const btnLoading = saveBtn.querySelector('.btn-loading');

    // Character counters
    const titleCount = document.getElementById('titleCount');
    const excerptCount = document.getElementById('excerptCount');

    // ============================================
    // AUTH STATE
    // ============================================

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        newPostBtn.style.display = user ? 'inline-block' : 'none';
        loadPosts();
    });

    // ============================================
    // LOAD POSTS
    // ============================================

    async function loadPosts() {
        try {
            loadingState.style.display = 'block';
            emptyState.style.display = 'none';

            // Remove old cards
            postsGrid.querySelectorAll('.post-card').forEach(c => c.remove());

            const q = query(collection(db, 'blog-posts'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                loadingState.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            loadingState.style.display = 'none';

            let index = 0;
            snapshot.forEach((docSnap) => {
                const post = docSnap.data();
                const postId = docSnap.id;

                // Skip drafts for public visitors
                if (!post.published && !currentUser) return;

                postsGrid.appendChild(createPostCard(post, postId, index));
                index++;
            });

            // If all posts were drafts and user isn't logged in
            if (postsGrid.querySelectorAll('.post-card').length === 0) {
                emptyState.style.display = 'block';
            }

        } catch (error) {
            console.error('❌ Error loading posts:', error);
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            emptyState.querySelector('h2').textContent = 'Error Loading Posts';
            emptyState.querySelector('p').textContent = 'Please try refreshing the page.';
        }
    }

    // ============================================
    // CREATE POST CARD
    // ============================================

    function createPostCard(post, postId, index) {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.style.setProperty('--delay', `${index * 0.1}s`);

        const postDate = post.createdAt
            ? new Date(post.createdAt.toDate()).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            })
            : 'Draft';

        let html = '';

        if (!post.published && currentUser) {
            html += `<div class="post-draft-badge">DRAFT</div>`;
        }

        html += `
            <div class="post-meta">
                <span class="post-meta-date">${postDate}</span>
            </div>
            <h2 class="post-title">${escapeHtml(post.title)}</h2>
            <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
            <a href="blog-post.html?id=${postId}" class="read-more">READ MORE</a>
        `;

        if (currentUser) {
            html += `
                <div class="post-actions">
                    <button class="post-action-btn edit"   data-id="${postId}">EDIT</button>
                    <button class="post-action-btn delete" data-id="${postId}">DELETE</button>
                </div>
            `;
        }

        card.innerHTML = html;

        if (currentUser) {
            card.querySelector('.edit').addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(postId, post);
            });
            card.querySelector('.delete').addEventListener('click', (e) => {
                e.stopPropagation();
                deletePost(postId);
            });
        }

        return card;
    }

    // ============================================
    // NEW POST MODAL
    // ============================================

    newPostBtn.addEventListener('click', () => {
        editingPostId = null;
        modalTitle.textContent = 'CREATE NEW POST';
        postForm.reset();
        postIdField.value = '';
        updateCharCounts();
        postModal.style.display = 'flex';
    });

    // ============================================
    // EDIT POST MODAL
    // ============================================

    function openEditModal(postId, post) {
        editingPostId = postId;
        modalTitle.textContent = 'EDIT POST';
        postIdField.value = postId;
        postTitleField.value = post.title || '';
        postExcerptField.value = post.excerpt || '';
        postContentField.value = post.content || '';
        postPublished.checked = post.published || false;
        updateCharCounts();
        postModal.style.display = 'flex';
    }

    // ============================================
    // DELETE POST
    // ============================================

    async function deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return;

        try {
            await deleteDoc(doc(db, 'blog-posts', postId));
            console.log('✅ Post deleted:', postId);
            loadPosts();
        } catch (error) {
            console.error('❌ Error deleting post:', error);
            alert('Failed to delete post. Please try again.');
        }
    }

    // ============================================
    // SAVE POST (Create or Update)
    // ============================================

    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUser) {
            alert('You must be logged in to save posts.');
            return;
        }

        saveBtn.classList.add('loading');
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';

        try {
            const postData = {
                title: postTitleField.value.trim(),
                excerpt: postExcerptField.value.trim(),
                content: postContentField.value.trim(),
                published: postPublished.checked,
                updatedAt: serverTimestamp()
            };

            if (editingPostId) {
                await updateDoc(doc(db, 'blog-posts', editingPostId), postData);
                console.log('✅ Post updated:', editingPostId);
            } else {
                postData.createdAt = serverTimestamp();
                postData.authorId = currentUser.uid;
                postData.authorEmail = currentUser.email;
                const docRef = await addDoc(collection(db, 'blog-posts'), postData);
                console.log('✅ Post created:', docRef.id);
            }

            closeModal();
            loadPosts();

        } catch (error) {
            console.error('❌ Error saving post:', error);
            alert('Failed to save post. Please try again.');
        } finally {
            saveBtn.classList.remove('loading');
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    });

    // ============================================
    // CLOSE MODAL
    // ============================================

    function closeModal() {
        postModal.style.display = 'none';
        postForm.reset();
        editingPostId = null;
    }

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // ============================================
    // CHARACTER COUNTERS
    // ============================================

    postTitleField.addEventListener('input', () => {
        titleCount.textContent = `${postTitleField.value.length} / 200`;
    });

    postExcerptField.addEventListener('input', () => {
        excerptCount.textContent = `${postExcerptField.value.length} / 300`;
    });

    function updateCharCounts() {
        titleCount.textContent = `${postTitleField.value.length} / 200`;
        excerptCount.textContent = `${postExcerptField.value.length} / 300`;
    }

    // ============================================
    // MARKDOWN TOOLBAR
    // ============================================

    document.querySelectorAll('.toolbar-btn').forEach(btn => {
        btn.addEventListener('click', () => insertMarkdown(btn.getAttribute('data-md')));
    });

    function insertMarkdown(syntax) {
        const start = postContentField.selectionStart;
        const end = postContentField.selectionEnd;
        const text = postContentField.value;
        const selectedText = text.substring(start, end);

        let newText;
        if (syntax === '**bold**') newText = `**${selectedText || 'text'}**`;
        else if (syntax === '*italic*') newText = `*${selectedText || 'text'}*`;
        else if (syntax === '[link](url)') newText = `[${selectedText || 'link text'}](url)`;

        postContentField.value = text.substring(0, start) + newText + text.substring(end);
        postContentField.focus();
        postContentField.setSelectionRange(start + newText.length, start + newText.length);
    }

    // ============================================
    // UTILITY
    // ============================================

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});