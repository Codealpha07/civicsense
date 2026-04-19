// DOM Elements
const ddUserNameEl = document.getElementById('ddUserName');
const ddUserEmailEl = document.getElementById('ddUserEmail');
const userAvatarEl = document.getElementById('userAvatar');
const avatarInitialsEl = document.getElementById('avatarInitials');
const currentPointsEl = document.getElementById('currentPoints');


// Check authentication and load user data
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.isAuthenticated()) {
        window.location.href = '/citizen-login.html';
        return;
    }

    try {
        // Load user data
        await loadUserData();
        await loadRewardsData();
        setupLogoutHandler();
    } catch (error) {
        console.error('Error initializing page:', error);
    }
});

// Setup logout handler
function setupLogoutHandler() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.logout) window.logout();
        });
    }
}

// Load user data
async function loadUserData() {
    try {
        const token = window.getToken();
        if (!token) return;

        const response = await fetch('/api/v1/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch user data');

        const userData = await response.json();
        
        if (userData.success) {
            localStorage.setItem('user', JSON.stringify(userData.data));
            updateUserInterface(userData.data);
            if (window.setUserAvatar) window.setUserAvatar();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Update user interface with user data
function updateUserInterface(user) {
    if (ddUserNameEl) ddUserNameEl.textContent = `${user.firstName || ''} ${user.lastName || ''}`;
    if (ddUserEmailEl) ddUserEmailEl.textContent = user.email || '';
    updateAvatarDisplay(user);
}

// Update avatar display with initials fallback
function updateAvatarDisplay(user) {
    if (user.photo && user.photo.trim() !== '') {
        if (userAvatarEl) {
            userAvatarEl.src = `/uploads/${user.photo}`;
            userAvatarEl.style.display = 'block';
            userAvatarEl.onerror = function() {
                this.style.display = 'none';
                if (avatarInitialsEl) {
                    avatarInitialsEl.style.display = 'flex';
                    avatarInitialsEl.textContent = getInitials(user.firstName, user.lastName);
                }
            };
        }
        if (avatarInitialsEl) avatarInitialsEl.style.display = 'none';
    } else {
        if (userAvatarEl) userAvatarEl.style.display = 'none';
        if (avatarInitialsEl) {
            avatarInitialsEl.style.display = 'flex';
            avatarInitialsEl.textContent = getInitials(user.firstName, user.lastName);
        }
    }
}

// Get user initials
function getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'U';
}

// Load rewards data (points)
async function loadRewardsData() {
    try {
        const token = window.getToken();
        if (!token) return;

        const response = await fetch('/api/v1/achievements', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch rewards data');

        const achievementsData = await response.json();
        
        if (achievementsData.success) {
            const points = achievementsData.data.points || 0;
            if (currentPointsEl) {
                animateNumber(currentPointsEl, 0, points);
            }
        }
    } catch (error) {
        console.error('Error loading rewards data:', error);
    }
}

// Animate number counting up
function animateNumber(element, start, end) {
    const duration = 1000;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (end - start) * progress);
        
        element.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = end.toLocaleString();
        }
    }

    requestAnimationFrame(update);
}
