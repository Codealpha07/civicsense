// DOM Elements
const ddUserNameEl = document.getElementById('ddUserName');
const ddUserEmailEl = document.getElementById('ddUserEmail');
const userAvatarEl = document.getElementById('userAvatar');
const avatarInitialsEl = document.getElementById('avatarInitials');
const currentPointsEl = document.getElementById('currentPoints');
const leaderboardPointsEl = document.getElementById('leaderboardPoints');

// Gamification State
let userPoints = 0;

// Check authentication and load user data
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.isAuthenticated()) {
        window.location.href = '/citizen-login.html';
        return;
    }

    try {
        await loadUserData();
        await loadRewardsData();
        setupLogoutHandler();
        setupAnimations();
    } catch (error) {
        console.error('Error initializing page:', error);
    }
});

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
            userPoints = achievementsData.data.points || 0;
            updatePointsDisplay(userPoints);
        }
    } catch (error) {
        console.error('Error loading rewards data:', error);
    }
}

function updatePointsDisplay(points) {
    if (currentPointsEl) animateNumber(currentPointsEl, 0, points);
    if (leaderboardPointsEl) animateNumber(leaderboardPointsEl, 0, points);
    updateLevelDisplay(points);
}

function updateLevelDisplay(points) {
    const level = Math.floor(points / 250) + 1;
    const currentLevelXp = points % 250;
    const progressPercent = (currentLevelXp / 250) * 100;
    
    // Update labels in the UI if elements exist
    const levelLabel = document.querySelector('.level-progress-card .text-secondary.fw-bold');
    const progressBar = document.querySelector('.level-progress-card .progress-bar');
    const xpSub = document.querySelector('.level-progress-card .text-secondary small');
    const nextLevelMsg = document.querySelector('.level-progress-card .text-accent');

    if (levelLabel) levelLabel.textContent = `Level ${level}`;
    if (progressBar) progressBar.style.width = `${progressPercent}%`;
    
    const xpLabel = document.querySelector('.level-progress-card .text-secondary');
    if (xpLabel) xpLabel.textContent = `${currentLevelXp} / 250 XP`;
    
    if (nextLevelMsg) {
        const remaining = 250 - currentLevelXp;
        const levels = ["Citizen", "Contributor", "Active Citizen", "Protector", "Guardian", "Elite Guardian", "Civic Hero"];
        const nextTitle = levels[level] || "Legend";
        nextLevelMsg.textContent = `${remaining} XP to ${nextTitle}`;
    }
}

// Reward Redemption Handler
window.redeemReward = function(name, cost) {
    if (userPoints < cost) {
        showNotification(`Not enough credits! You need ${cost - userPoints} more.`, 'error');
        return;
    }

    // Confirmation Dialog
    if (confirm(`Redeem ${cost} credits for the ${name}?`)) {
        userPoints -= cost;
        updatePointsDisplay(userPoints);
        
        showNotification(`Successfully redeemed ${name}! Check your email for the voucher.`, 'success');
        
        // Potential API call to record redemption here
    }
};

function showNotification(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// Add Toast Styles
const style = document.createElement('style');
style.textContent = `
    .custom-toast {
        position: fixed; top: 100px; right: 20px; z-index: 9999;
        padding: 1rem 2rem; border-radius: 12px; background: white;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1); transform: translateX(120%);
        transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        border-left: 5px solid #667eea;
    }
    .custom-toast.show { transform: translateX(0); }
    .custom-toast.error { border-left-color: #f5576c; }
    .custom-toast.success { border-left-color: #43e97b; }
    .toast-content { display: flex; align-items: center; gap: 1rem; font-weight: 600; }
    .toast-content i { font-size: 1.25rem; }
`;
document.head.appendChild(style);

// Rest of the helper functions from original file
function setupLogoutHandler() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.logout) window.logout();
        });
    }
}

async function loadUserData() {
    try {
        const token = window.getToken();
        if (!token) return;
        const response = await fetch('/api/v1/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
            const userData = await response.json();
            if (userData.success) updateUserInterface(userData.data);
        }
    } catch (e) {}
}

function updateUserInterface(user) {
    if (ddUserNameEl) ddUserNameEl.textContent = `${user.firstName || ''} ${user.lastName || ''}`;
    if (ddUserEmailEl) ddUserEmailEl.textContent = user.email || '';
    updateAvatarDisplay(user);
}

function updateAvatarDisplay(user) {
    if (user.photo && user.photo.trim() !== '') {
        if (userAvatarEl) {
            userAvatarEl.src = `/uploads/${user.photo}`;
            userAvatarEl.style.display = 'block';
            userAvatarEl.onerror = () => {
                userAvatarEl.style.display = 'none';
                avatarInitialsEl.style.display = 'flex';
                avatarInitialsEl.textContent = getInitials(user.firstName, user.lastName);
            };
        }
    } else {
        if (userAvatarEl) userAvatarEl.style.display = 'none';
        if (avatarInitialsEl) {
            avatarInitialsEl.style.display = 'flex';
            avatarInitialsEl.textContent = getInitials(user.firstName, user.lastName);
        }
    }
}

function getInitials(f, l) { return (f ? f[0] : '') + (l ? l[0] : '') || 'U'; }

function animateNumber(element, start, end) {
    const duration = 1500;
    const startTime = performance.now();
    function update(t) {
        const progress = Math.min((t - startTime) / duration, 1);
        element.textContent = Math.floor(start + (end - start) * progress).toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function setupAnimations() {
    const scrollReveal = () => {
        document.querySelectorAll('.scroll-reveal').forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight - 100) el.classList.add('revealed');
        });
    };
    window.addEventListener('scroll', scrollReveal);
    scrollReveal();
}
