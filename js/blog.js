// ============================================
//  PHASE 1 Blog (NO IMAGE UPLOADS) - CLEANED
//  Features: Rich text editor, Tags, Search, Category filters
// ============================================

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
let quillEditor = null;
let selectedTags = [];
let allPosts = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    const postsGrid = document.getElementById('postsGrid');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const emptyMessage = document.getElementById('emptyMessage');
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

    // Search & Filter
    const searchInput = document.getElementById('searchInput');
    const categoryPills = document.getElementById('categoryPills');

    // Tags
    const tagsInput = document.getElementById('tagsInput');
    const tagsDisplay = document.getElementById('tagsDisplay');
    const tagsData = document.getElementById('tagsData');

    // ============================================
    // INITIALIZE QUILL EDITOR
    // ============================================

    function initQuillEditor() {
        quillEditor = new Quill('#quillEditor', {
            theme: 'snow',
            placeholder: 'Write your story here...',
            modules: {
                toolbar: [
                    [{ 'header': [2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                ]
            }
        });

        quillEditor.on('text-change', () => {
            postContentField.value = quillEditor.root.innerHTML;
        });
    }

    // ============================================
    // AUTH STATE
    // ============================================

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (newPostBtn) newPostBtn.style.display = user ? 'inline-block' : 'none';
        loadPosts();
    });

    // ============================================
    // LOAD POSTS
    // ============================================

    async function loadPosts() {
        try {
            loadingState.style.display = 'block';
            emptyState.style.display = 'none';

            postsGrid.querySelectorAll('.post-card').forEach(c => c.remove());

            const q = query(collection(db, 'blog-posts'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                loadingState.style.display = 'none';
                emptyState.style.display = 'block';
                emptyMessage.textContent = 'The vault is currently empty. Check back soon for new stories!';
                return;
            }

            loadingState.style.display = 'none';

            allPosts = [];
            snapshot.forEach((docSnap) => {
                const post = docSnap.data();
                const postId = docSnap.id;

                if (!post.published && !currentUser) return;

                allPosts.push({ ...post, id: postId });
            });

            buildCategoryPills();
            renderFilteredPosts();

        } catch (error) {
            console.error('❌ Error loading posts:', error);
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            emptyMessage.textContent = 'Error loading posts. Please try refreshing the page.';
        }
    }

    // ============================================
    // BUILD CATEGORY PILLS
    // ============================================

    function buildCategoryPills() {
        const allTags = new Set();
        allPosts.forEach(post => {
            if (post.tags && Array.isArray(post.tags)) {
                post.tags.forEach(tag => allTags.add(tag));
            }
        });

        categoryPills.querySelectorAll('.pill-btn:not([data-category="all"])').forEach(p => p.remove());

        allTags.forEach(tag => {
            const pill = document.createElement('button');
            pill.className = 'pill-btn';
            pill.textContent = tag;
            pill.dataset.category = tag;
            pill.addEventListener('click', () => filterByCategory(tag));
            categoryPills.appendChild(pill);
        });
    }

    // ============================================
    // FILTER BY CATEGORY
    // ============================================

    function filterByCategory(category) {
        currentFilter = category;

        categoryPills.querySelectorAll('.pill-btn').forEach(p => {
            p.classList.toggle('active', 
                (category === 'all' && p.dataset.category === 'all') ||
                p.dataset.category === category
            );
        });

        renderFilteredPosts();
    }

    // ============================================
    // SEARCH FUNCTIONALITY
    // ============================================

    searchInput.addEventListener('input', (e) => {
        renderFilteredPosts(e.target.value);
    });

    // ============================================
    // RENDER FILTERED POSTS
    // ============================================

    function renderFilteredPosts(searchTerm = '') {
        postsGrid.querySelectorAll('.post-card').forEach(c => c.remove());

        let filtered = allPosts;

        if (currentFilter !== 'all') {
            filtered = filtered.filter(post => 
                post.tags && post.tags.includes(currentFilter)
            );
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(post => {
                const titleMatch = post.title.toLowerCase().includes(term);
                const excerptMatch = post.excerpt.toLowerCase().includes(term);
                const contentMatch = post.content.toLowerCase().includes(term);
                const tagsMatch = post.tags && post.tags.some(tag => 
                    tag.toLowerCase().includes(term)
                );
                return titleMatch || excerptMatch || contentMatch || tagsMatch;
            });
        }

        if (filtered.length === 0) {
            emptyState.style.display = 'block';
            emptyMessage.textContent = searchTerm 
                ? `No posts found for "${searchTerm}"`
                : `No posts in category "${currentFilter}"`;
            return;
        }

        emptyState.style.display = 'none';

        filtered.forEach((post, index) => {
            postsGrid.appendChild(createPostCard(post, post.id, index));
        });
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
        `;

        if (post.tags && post.tags.length > 0) {
            html += `<div class="post-tags">`;
            post.tags.forEach(tag => {
                html += `<span class="post-tag">${escapeHtml(tag)}</span>`;
            });
            html += `</div>`;
        }

        html += `
            <h2 class="post-title">${escapeHtml(post.title)}</h2>
            <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
            <a href="blog-post.html?id=${postId}" class="read-more">READ MORE</a>
        `;

        if (currentUser) {
            html += `
                <div class="post-actions">
                    <button class="post-action-btn edit" data-id="${postId}">EDIT</button>
                    <button class="post-action-btn delete" data-id="${postId}">DELETE</button>
                </div>
            `;
        }

        card.innerHTML = html;

        if (currentUser) {
            card.querySelector('.edit').addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(postId);
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
        selectedTags = [];
        updateTagsDisplay();
        
        if (!quillEditor) initQuillEditor();
        quillEditor.setContents([]);
        
        updateCharCounts();
        postModal.style.display = 'flex';
    });

    // ============================================
    // EDIT POST MODAL
    // ============================================

    async function openEditModal(postId) {
        editingPostId = postId;
        modalTitle.textContent = 'EDIT POST';
        
        try {
            const postRef = doc(db, 'blog-posts', postId);
            const postSnap = await getDoc(postRef);
            
            if (!postSnap.exists()) {
                alert('Post not found');
                return;
            }
            
            const post = postSnap.data();
            
            postIdField.value = postId;
            postTitleField.value = post.title || '';
            postExcerptField.value = post.excerpt || '';
            postPublished.checked = post.published || false;
            
            if (!quillEditor) initQuillEditor();
            
            quillEditor.root.innerHTML = post.content || '';
            postContentField.value = post.content || '';
            
            selectedTags = post.tags || [];
            updateTagsDisplay();
            
            updateCharCounts();
            postModal.style.display = 'flex';
            
        } catch (error) {
            console.error('❌ Error loading post for edit:', error);
            alert('Error loading post. Please try again.');
        }
    }

    // ============================================
    // TAGS MANAGEMENT
    // ============================================

    tagsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = tagsInput.value.trim();
            if (tag && !selectedTags.includes(tag)) {
                selectedTags.push(tag);
                updateTagsDisplay();
                tagsInput.value = '';
            }
        }
    });
    
    function updateTagsDisplay() {
        tagsDisplay.innerHTML = '';
        selectedTags.forEach((tag, index) => {
            const tagEl = document.createElement('span');
            tagEl.className = 'tag-item';
            tagEl.innerHTML = `
                ${escapeHtml(tag)}
                <button type="button" class="tag-remove" data-index="${index}">✕</button>
            `;
            tagsDisplay.appendChild(tagEl);
        });
        
        tagsData.value = JSON.stringify(selectedTags);
        
        tagsDisplay.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                selectedTags.splice(index, 1);
                updateTagsDisplay();
            });
        });
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
    // SAVE POST
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
                tags: selectedTags,
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
        selectedTags = [];
        if (quillEditor) quillEditor.setContents([]);
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
    // UTILITY
    // ============================================

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});