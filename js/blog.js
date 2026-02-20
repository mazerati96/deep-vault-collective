// Blog Page Logic - Full CRUD with Auth Detection
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
    const postTitle = document.getElementById('postTitle');
    const postExcerpt = document.getElementById('postExcerpt');
    const postContent = document.getElementById('postContent');
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
    // AUTH STATE DETECTION
    // ============================================

    auth.onAuthStateChanged((user) => {
        currentUser = user;

        if (user) {
            // Author is logged in - show New Post button
            newPostBtn.style.display = 'inline-block';
            console.log('✅ Author logged in:', user.email);
        } else {
            // Not logged in - hide author controls
            newPostBtn.style.display = 'none';
            console.log('👤 Viewing as public user');
        }

        // Load posts regardless of auth state
        loadPosts();
    });

    // ============================================
    // LOAD POSTS FROM FIRESTORE
    // ============================================

    async function loadPosts() {
        try {
            loadingState.style.display = 'block';
            emptyState.style.display = 'none';

            // Get posts from Firestore (ordered by date, newest first)
            const postsSnapshot = await db.collection('blog-posts')
                .orderBy('createdAt', 'desc')
                .get();

            // Clear existing posts (except loading/empty states)
            const existingCards = postsGrid.querySelectorAll('.post-card');
            existingCards.forEach(card => card.remove());

            if (postsSnapshot.empty) {
                // No posts found
                loadingState.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            // Hide loading state
            loadingState.style.display = 'none';

            // Render each post
            postsSnapshot.forEach((doc, index) => {
                const post = doc.data();
                const postId = doc.id;

                // Skip drafts for non-authors
                if (!post.published && !currentUser) {
                    return;
                }

                const postCard = createPostCard(post, postId, index);
                postsGrid.appendChild(postCard);
            });

        } catch (error) {
            console.error('❌ Error loading posts:', error);
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            emptyState.querySelector('h2').textContent = 'Error Loading Posts';
            emptyState.querySelector('p').textContent = 'Please try refreshing the page.';
        }
    }

    // ============================================
    // CREATE POST CARD ELEMENT
    // ============================================

    function createPostCard(post, postId, index) {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.style.setProperty('--delay', `${index * 0.1}s`);

        // Format date
        const postDate = post.createdAt ?
            new Date(post.createdAt.toDate()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : 'Draft';

        // Build HTML
        let html = '';

        // Draft badge (author only)
        if (!post.published && currentUser) {
            html += `<div class="post-draft-badge">DRAFT</div>`;
        }

        // Meta (date)
        html += `
            <div class="post-meta">
                <span class="post-meta-date">${postDate}</span>
            </div>
        `;

        // Title
        html += `<h2 class="post-title">${escapeHtml(post.title)}</h2>`;

        // Excerpt
        html += `<p class="post-excerpt">${escapeHtml(post.excerpt)}</p>`;

        // Read more link
        html += `<a href="blog-post.html?id=${postId}" class="read-more">READ MORE</a>`;

        // Author actions (edit/delete) - only if logged in
        if (currentUser) {
            html += `
                <div class="post-actions">
                    <button class="post-action-btn edit" data-id="${postId}">EDIT</button>
                    <button class="post-action-btn delete" data-id="${postId}">DELETE</button>
                </div>
            `;
        }

        card.innerHTML = html;

        // Attach event listeners if author
        if (currentUser) {
            const editBtn = card.querySelector('.edit');
            const deleteBtn = card.querySelector('.delete');

            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(postId, post);
            });

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deletePost(postId);
            });
        }

        return card;
    }

    // ============================================
    // NEW POST BUTTON
    // ============================================

    newPostBtn.addEventListener('click', () => {
        openNewPostModal();
    });

    function openNewPostModal() {
        editingPostId = null;
        modalTitle.textContent = 'CREATE NEW POST';
        postForm.reset();
        postIdField.value = '';
        updateCharCounts();
        postModal.style.display = 'flex';
    }

    // ============================================
    // EDIT POST
    // ============================================

    function openEditModal(postId, post) {
        editingPostId = postId;
        modalTitle.textContent = 'EDIT POST';
        postIdField.value = postId;
        postTitle.value = post.title || '';
        postExcerpt.value = post.excerpt || '';
        postContent.value = post.content || '';
        postPublished.checked = post.published || false;
        updateCharCounts();
        postModal.style.display = 'flex';
    }

    // ============================================
    // DELETE POST
    // ============================================

    async function deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) {
            return;
        }

        try {
            await db.collection('blog-posts').doc(postId).delete();
            console.log('✅ Post deleted:', postId);
            loadPosts(); // Reload posts
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

        // Show loading state
        saveBtn.classList.add('loading');
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';

        try {
            const postData = {
                title: postTitle.value.trim(),
                excerpt: postExcerpt.value.trim(),
                content: postContent.value.trim(),
                published: postPublished.checked,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (editingPostId) {
                // UPDATE existing post
                await db.collection('blog-posts').doc(editingPostId).update(postData);
                console.log('✅ Post updated:', editingPostId);
            } else {
                // CREATE new post
                postData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                postData.authorId = currentUser.uid;
                postData.authorEmail = currentUser.email;

                const docRef = await db.collection('blog-posts').add(postData);
                console.log('✅ Post created:', docRef.id);
            }

            // Close modal and reload
            closeModal();
            loadPosts();

        } catch (error) {
            console.error('❌ Error saving post:', error);
            alert('Failed to save post. Please try again.');
        } finally {
            // Reset button state
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

    postTitle.addEventListener('input', () => {
        titleCount.textContent = `${postTitle.value.length} / 200`;
    });

    postExcerpt.addEventListener('input', () => {
        excerptCount.textContent = `${postExcerpt.value.length} / 300`;
    });

    function updateCharCounts() {
        titleCount.textContent = `${postTitle.value.length} / 200`;
        excerptCount.textContent = `${postExcerpt.value.length} / 300`;
    }

    // ============================================
    // MARKDOWN TOOLBAR BUTTONS
    // ============================================

    const toolbarBtns = document.querySelectorAll('.toolbar-btn');
    toolbarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const markdown = btn.getAttribute('data-md');
            insertMarkdown(markdown);
        });
    });

    function insertMarkdown(syntax) {
        const start = postContent.selectionStart;
        const end = postContent.selectionEnd;
        const text = postContent.value;
        const selectedText = text.substring(start, end);

        let newText;
        if (syntax === '**bold**') {
            newText = `**${selectedText || 'text'}**`;
        } else if (syntax === '*italic*') {
            newText = `*${selectedText || 'text'}*`;
        } else if (syntax === '[link](url)') {
            newText = `[${selectedText || 'link text'}](url)`;
        }

        postContent.value = text.substring(0, start) + newText + text.substring(end);
        postContent.focus();
        postContent.setSelectionRange(start + newText.length, start + newText.length);
    }

    // ============================================
    // UTILITY: ESCAPE HTML
    // ============================================

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});