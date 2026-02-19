// Dashboard Logic - Protected Page
document.addEventListener('DOMContentLoaded', () => {
    const authLoading = document.getElementById('authLoading');
    const dashboardContainer = document.getElementById('dashboardContainer');
    const userEmailEl = document.getElementById('userEmail');
    const logoutBtn = document.getElementById('logoutBtn');

    // Check authentication state
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in - show dashboard
            console.log('✅ Authenticated:', user.uid);

            userEmailEl.textContent = user.email;

            // Hide loading, show dashboard
            authLoading.style.display = 'none';
            dashboardContainer.style.display = 'block';

        } else {
            // No user signed in - redirect to login
            console.log('❌ Not authenticated - redirecting to login');
            window.location.href = 'author-login.html';
        }
    });

    // Logout button
    logoutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
            console.log('✅ Signed out');
            window.location.href = 'author-login.html';
        } catch (error) {
            console.error('❌ Logout error:', error);
            alert('Error signing out. Please try again.');
        }
    });
});