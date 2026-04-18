// auth.js - Simple frontend auth state management for static HTML

// Get auth token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('isLoggedIn') === 'true' && getToken();
}

// Call this on page load to update navbar links based on login state
function updateNavbar() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    // Hide/show nav links based on login status
    document.querySelectorAll('.nav-logged-in').forEach(el => {
        el.style.display = isLoggedIn ? '' : 'none';
    });
    document.querySelectorAll('.nav-logged-out').forEach(el => {
        el.style.display = isLoggedIn ? 'none' : '';
    });
}

// Call this on logout
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// Attach event listeners for logout links
function attachLogoutHandler() {
    document.querySelectorAll('.logout-link').forEach(el => {
        el.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
}

// Protect a page or action: if not logged in, redirect to login with redirect param
function requireLogin(redirectTo) {
    if (!isAuthenticated()) {
        window.location.href = `/login?redirect=${encodeURIComponent(redirectTo)}`;
        return false;
    }
    return true;
}

// Set user avatar: show profile image if available, else initial
function setUserAvatar() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('setUserAvatar: user object =', user);
    const avatars = document.querySelectorAll('#userAvatar, .user-avatar');
    if (!avatars.length) return;

    avatars.forEach(avatar => {
        avatar.innerHTML = '';
        // Check for profileImage or photo property
        if (user.profileImage || user.photo) {
            const img = document.createElement('img');
            // Use profileImage if available, otherwise use photo
            const imagePath = user.profileImage || (user.photo ? `/uploads/${user.photo}` : null);
            if (imagePath) {
                img.src = imagePath;
            img.alt = 'Profile';
            img.className = 'avatar-img';
            avatar.appendChild(img);
                return;
            }
        }
        
        // If we get here, no valid image was found, use initials
            let initial = '?';
        // Try to get initials from firstName and lastName first
        if (user.firstName && user.lastName) {
            initial = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        } 
        // Fallback to name if available
        else if (user.name && user.name.trim()) {
                initial = user.name.trim()[0].toUpperCase();
        } 
        // Last resort, use email
        else if (user.email && user.email.trim()) {
                initial = user.email.trim()[0].toUpperCase();
            }
            avatar.textContent = initial;
    });
}

// On every page load, update navbar, attach logout handler, and set avatar
window.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    attachLogoutHandler();
    setUserAvatar();
});

// Export for inline event handlers
window.requireLogin = requireLogin;
window.logout = logout;
window.updateNavbar = updateNavbar;
window.setUserAvatar = setUserAvatar;
window.getToken = getToken;
window.isAuthenticated = isAuthenticated;
