// Individual Blog Post Page
document.addEventListener('DOMContentLoaded', () => {
    const loadingContainer = document.getElementById('loadingContainer');
    const postContainer = document.getElementById('postContainer');
    const postDate = document.getElementById('postDate');
    const postTitle = document.getElementById('postTitle');
    const postContent = document.getElementById('postContent');
    const draftBadge = document.getElementById('draftBadge');

    // Get post ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        // No post ID provided - redirect to blog list
        window.location.href = 'blog.html';
        return;
    }

    // Load the post
    loadPost(postId);

    async function loadPost(id) {
        try {
            const postDoc = await db.collection('blog-posts').doc(id).get();

            if (!postDoc.exists) {
                // Post not found
                alert('Post not found');
                window.location.href = 'blog.html';
                return;
            }

            const post = postDoc.data();

            // Check if it's a draft and user is not author
            const user = auth.currentUser;
            if (!post.published && !user) {
                alert('This post is not yet published.');
                window.location.href = 'blog.html';
                return;
            }

            // Display the post
            displayPost(post);

        } catch (error) {
            console.error('❌ Error loading post:', error);
            alert('Error loading post. Please try again.');
            window.location.href = 'blog.html';
        }
    }

    function displayPost(post) {
        // Set title (also updates page title)
        postTitle.textContent = post.title;
        document.title = `${post.title} | Deep Vault Collective`;

        // Set date
        if (post.createdAt) {
            const date = new Date(post.createdAt.toDate());
            postDate.textContent = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            postDate.textContent = 'Draft';
        }

        // Show draft badge if unpublished
        if (!post.published) {
            draftBadge.style.display = 'inline-block';
        }

        // Render content (simple markdown)
        postContent.innerHTML = renderMarkdown(post.content);

        // Show post, hide loading
        loadingContainer.style.display = 'none';
        postContainer.style.display = 'block';
    }

    // ============================================
    // SIMPLE MARKDOWN RENDERER
    // ============================================

    function renderMarkdown(text) {
        if (!text) return '';

        let html = text;

        // Escape HTML first
        html = escapeHtml(html);

        // Headers (## Header)
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

        // Bold (**text**)
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Italic (*text*)
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Links ([text](url))
        html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Paragraphs (double line break = new paragraph)
        html = html.split('\n\n').map(para => {
            if (para.trim().startsWith('<h')) return para; // Don't wrap headers
            return para.trim() ? `<p>${para.trim()}</p>` : '';
        }).join('\n');

        // Line breaks within paragraphs
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});