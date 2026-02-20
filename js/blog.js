
// ============================================================
//  PHASE 1 Enhanced Blog — Rich Editor + Images + Tags + Search
//  Preserves your existing Firebase v10 modular structure
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

// PHASE 1: Add Firebase Storage
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const storage = getStorage();

let currentUser = null;
let editingPostId = null;
let quillEditor = null; // PHASE 1: Quill instance
let selectedTags = []; // PHASE 1: Tags array
let allPosts = []; // PHASE 1: For search/filter
let currentFilter = 'all'; // PHASE 1: Active category filter

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

    // PHASE 1: Search & Filter
    const searchInput = document.getElementById('searchInput');
    const categoryPills = document.getElementById('categoryPills');

    // PHASE 1: Image upload
    const imageUploadArea = document.getElementById('imageUploadArea');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const imageInput = document.getElementById('imageInput');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const featuredImageUrl = document.getElementById('featuredImageUrl');

    // PHASE 1: Tags
    const tagsInput = document.getElementById('tagsInput');
    const tagsDisplay = document.getElementById('tagsDisplay');
    const tagSuggestions = document.getElementById('tagSuggestions');
    const tagsData = document.getElementById('tagsData');

    // ============================================
    // PHASE 1: INITIALIZE QUILL EDITOR
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
                    ['link', 'image'],
                    ['clean']
                ]
            }
        });

        // Sync Quill content to hidden textarea
        quillEditor.on('text-change', () => {
            postContentField.value = quillEditor.root.innerHTML;
        });
    }

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
                emptyMessage.textContent = 'The vault is currently empty. Check back soon for new stories!';
                return;
            }

            loadingState.style.display = 'none';

            // PHASE 1: Store all posts for filtering
            allPosts = [];
            snapshot.forEach((docSnap) => {
                const post = docSnap.data();
                const postId = docSnap.id();

                // Skip drafts for public visitors
                if (!post.published && !currentUser) return;

                allPosts.push({ ...post, id: postId });
            });

            // PHASE 1: Build category pills
            buildCategoryPills();

            // PHASE 1: Initial render (all posts)
            renderFilteredPosts();

        } catch (error) {
            console.error('❌ Error loading posts:', error);
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            emptyMessage.textContent = 'Error loading posts. Please try refreshing the page.';
        }
    }

    // ============================================
    // PHASE 1: BUILD CATEGORY PILLS
    // ============================================

    function buildCategoryPills() {
        // Get unique tags from all posts
        const allTags = new Set();
        allPosts.forEach(post => {
            if (post.tags && Array.isArray(post.tags)) {
                post.tags.forEach(tag => allTags.add(tag));
            }
        });

        // Clear existing pills (except "All Posts")
        categoryPills.querySelectorAll('.pill-btn:not(.active)').forEach(p => p.remove());

        // Add tag pills
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
    // PHASE 1: FILTER BY CATEGORY
    // ============================================

    function filterByCategory(category) {
        currentFilter = category;

        // Update active pill
        categoryPills.querySelectorAll('.pill-btn').forEach(p => {
            p.classList.toggle('active', 
                (category === 'all' && p.dataset.category === 'all') ||
                p.dataset.category === category
            );
        });

        renderFilteredPosts();
    }

    // ============================================
    // PHASE 1: SEARCH FUNCTIONALITY
    // ============================================

    searchInput.addEventListener('input', (e) => {
        renderFilteredPosts(e.target.value);
    });

    // ============================================
    // PHASE 1: RENDER FILTERED POSTS
    // ============================================

    function renderFilteredPosts(searchTerm = '') {
        // Clear grid
        postsGrid.querySelectorAll('.post-card').forEach(c => c.remove());

        // Filter posts
        let filtered = allPosts;

        // Filter by category
        if (currentFilter !== 'all') {
            filtered = filtered.filter(post => 
                post.tags && post.tags.includes(currentFilter)
            );
        }

        // Filter by search term
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

        // Show empty state if no results
        if (filtered.length === 0) {
            emptyState.style.display = 'block';
            emptyMessage.textContent = searchTerm 
                ? `No posts found for "${searchTerm}"`
                : `No posts in category "${currentFilter}"`;
            return;
        }

        emptyState.style.display = 'none';

        // Render filtered posts
        filtered.forEach((post, index) => {
            postsGrid.appendChild(createPostCard(post, post.id, index));
        });
    }

    // ============================================
    // CREATE POST CARD (Enhanced with image + tags)
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

        // PHASE 1: Featured Image
        if (post.featuredImage) {
            html += `<div class="post-card-image">
                <img src="${post.featuredImage}" alt="${escapeHtml(post.title)}" loading="lazy" />
            </div>`;
        }

        if (!post.published && currentUser) {
            html += `<div class="post-draft-badge">DRAFT</div>`;
        }

        html += `
            <div class="post-meta">
                <span class="post-meta-date">${postDate}</span>
            </div>
        `;

        // PHASE 1: Tags display
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
                    <button class="post-action-btn edit"   data-id="${postId}">EDIT</button>
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
        
        // Initialize Quill if not already done
        if (!quillEditor) initQuillEditor();
        quillEditor.setContents([]);
        
        // Clear image
        featuredImageUrl.value = '';
        imagePreviewContainer.style.display = 'none';
        uploadPlaceholder.style.display = 'block';
        
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
            
            // Initialize Quill if not done
            if (!quillEditor) initQuillEditor();
            
            // Load content into Quill
            quillEditor.root.innerHTML = post.content || '';
            postContentField.value = post.content || '';
            
            // Load tags
            selectedTags = post.tags || [];
            updateTagsDisplay();
            
            // Load image
            if (post.featuredImage) {
                featuredImageUrl.value = post.featuredImage;
                imagePreview.src = post.featuredImage;
                imagePreviewContainer.style.display = 'block';
                uploadPlaceholder.style.display = 'none';
            } else {
                featuredImageUrl.value = '';
                imagePreviewContainer.style.display = 'none';
                uploadPlaceholder.style.display = 'block';
            }
            
            updateCharCounts();
            postModal.style.display = 'flex';
            
        } catch (error) {
            console.error('❌ Error loading post for edit:', error);
            alert('Error loading post. Please try again.');
        }
    }

    // ============================================
    // PHASE 1: IMAGE UPLOAD
    // ============================================

    uploadPlaceholder.addEventListener('click', () => imageInput.click());
    
    imageUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageUploadArea.classList.add('drag-over');
    });
    
    imageUploadArea.addEventListener('dragleave', () => {
        imageUploadArea.classList.remove('drag-over');
    });
    
    imageUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        imageUploadArea.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    });
    
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleImageUpload(file);
    });
    
    removeImageBtn.addEventListener('click', () => {
        featuredImageUrl.value = '';
        imageInput.value = '';
        imagePreviewContainer.style.display = 'none';
        uploadPlaceholder.style.display = 'block';
    });
    
    async function handleImageUpload(file) {
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }
        
        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            uploadPlaceholder.style.display = 'none';
            imagePreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
        
        // Upload to Firebase Storage
        try {
            const timestamp = Date.now();
            const filename = `blog-images/${timestamp}_${file.name}`;
            const storageRef = ref(storage, filename);
            const uploadTask = uploadBytesResumable(storageRef, file);
            
            uploadProgress.style.display = 'block';
            
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    progressFill.style.width = progress + '%';
                    progressText.textContent = Math.round(progress) + '%';
                },
                (error) => {
                    console.error('❌ Upload error:', error);
                    alert('Image upload failed. Please try again.');
                    uploadProgress.style.display = 'none';
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    featuredImageUrl.value = downloadURL;
                    uploadProgress.style.display = 'none';
                    console.log('✅ Image uploaded:', downloadURL);
                }
            );
            
        } catch (error) {
            console.error('❌ Error uploading image:', error);
            alert('Image upload failed. Please try again.');
        }
    }

    // ============================================
    // PHASE 1: TAGS MANAGEMENT
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
        
        // Update hidden field
        tagsData.value = JSON.stringify(selectedTags);
        
        // Attach remove listeners
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
            // Get post to delete image if exists
            const postRef = doc(db, 'blog-posts', postId);
            const postSnap = await getDoc(postRef);
            
            if (postSnap.exists()) {
                const post = postSnap.data();
                
                // Delete image from Storage if exists
                if (post.featuredImage) {
                    try {
                        const imageRef = ref(storage, post.featuredImage);
                        await deleteObject(imageRef);
                    } catch (err) {
                        console.warn('Could not delete image:', err);
                    }
                }
            }
            
            await deleteDoc(postRef);
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
                tags: selectedTags,
                featuredImage: featuredImageUrl.value || null,
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