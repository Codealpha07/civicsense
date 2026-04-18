// Toggle between Login and Signup
const loginToggle = document.getElementById('loginToggle');
const signupToggle = document.getElementById('signupToggle');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const otpSection = document.getElementById('otpSection');
const resendOtpBtn = document.getElementById('resendOtpBtn');
const otpTimer = document.getElementById('otpTimer');
let otpCountdown = 30;
let otpInterval;

// On initial load, show form based on URL param
(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const roleParam = params.get('role');

    // Pre-select role if provided via query string
    if (roleParam) {
        const loginRoleSelect = document.getElementById('loginRole');
        const signupRoleSelect = document.getElementById('signupRole');
        if (loginRoleSelect) loginRoleSelect.value = roleParam;
        if (signupRoleSelect) signupRoleSelect.value = roleParam;
    }

    if (mode === 'signup') {
        showSignup(false);
    } else {
        showLogin(false);
    }
})();

function showLogin(updateUrl = true) {
    loginForm.classList.remove('d-none');
    signupForm.classList.add('d-none');
    otpSection.style.display = 'none';
    loginToggle.classList.add('active');
    signupToggle.classList.remove('active');
    if (updateUrl) {
        history.replaceState(null, '', '?mode=login');
    }
}
function showSignup(updateUrl = true) {
    loginForm.classList.add('d-none');
    signupForm.classList.remove('d-none');
    otpSection.style.display = 'none';
    signupToggle.classList.add('active');
    if (updateUrl) {
        history.replaceState(null, '', '?mode=signup');
    }
    loginToggle.classList.remove('active');
}
loginToggle.addEventListener('click', () => showLogin(true));
signupToggle.addEventListener('click', () => showSignup(true));

// OTP Section Logic
function showOtpSection() {
    otpSection.style.display = 'block';
    stopOtpTimer(); // Enable resend immediately for testing
    resendOtpBtn.disabled = false;
    otpTimer.innerText = '0';
}
function hideOtpSection() {
    otpSection.style.display = 'none';
    stopOtpTimer();
}
function startOtpTimer() {
    resendOtpBtn.disabled = false;
    otpTimer.innerText = '0';
}
function stopOtpTimer() {
    clearInterval(otpInterval);
    resendOtpBtn.disabled = false;
    otpTimer.innerText = '0';
}
resendOtpBtn.addEventListener('click', function() {
    resendOtpBtn.disabled = true;
    otpCountdown = 30;
    otpTimer.innerText = otpCountdown;
    startOtpTimer();
    // TODO: Trigger resend OTP API
    showOtpMsg('OTP resent!', true);
});

// OTP input focus auto-move
const otpInputs = [
    document.getElementById('otp1'),
    document.getElementById('otp2'),
    document.getElementById('otp3'),
    document.getElementById('otp4'),
    document.getElementById('otp5'),
    document.getElementById('otp6')
];
otpInputs.forEach((input, idx) => {
    input.addEventListener('input', function() {
        if (input.value.length === 1 && idx < 5) {
            otpInputs[idx + 1].focus();
        }
    });
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && input.value === '' && idx > 0) {
            otpInputs[idx - 1].focus();
        }
    });
});

// LOGIN FORM SUBMIT
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const emailOrMobile = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;
    if (!emailOrMobile || !password) {
        showLoginMsg('All fields are required.', false);
        return;
    }
    if (password.length < 6) {
        showLoginMsg('Password must be at least 6 characters.', false);
        return;
    }
    try {
        const res = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailOrMobile, password, role })
        });
        const data = await res.json();
        if (!data.success) {
            showLoginMsg(data.message || 'Login failed.', false);
            if (data.message && data.message.toLowerCase().includes('not verified')) {
                // Show OTP section for existing unverified user
                document.getElementById('signupEmail').value = emailOrMobile;
                showOtpSection();
            }
            return;
        }
        // Save in localStorage for later use
        localStorage.removeItem('userId');
            const uid = data.user?._id || data.user?.id || data.userId;
            if (uid) localStorage.setItem('userId', uid);
        localStorage.setItem('role', data.role);
        showLoginMsg('Login successful! Redirecting...', true);
        setTimeout(() => {
            window.location.href = role === 'Admin' ? '/admin-dashboard' : '/dashboard';
        }, 1200);
    } catch (err) {
        showLoginMsg('Server error. Try again.', false);
    }
});

// SIGNUP FORM SUBMIT
signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const mobile = document.getElementById('signupMobile').value.trim();
    const address = document.getElementById('signupAddress').value.trim();
    const password = document.getElementById('signupPassword').value;
    const role = document.getElementById('signupRole').value;
    if (!firstName || !lastName || !email || !mobile || !address || !password) {
        showSignupMsg('All fields are required.', false);
        return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        showSignupMsg('Invalid email address.', false);
        return;
    }
    if (!/^\d{10}$/.test(mobile)) {
        showSignupMsg('Mobile number must be 10 digits.', false);
        return;
    }
    if (password.length < 6) {
        showSignupMsg('Password must be at least 6 characters.', false);
        return;
    }
    try {
        const res = await fetch('/api/v1/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, email, mobile, address, password, role })
        });
        const data = await res.json();
        if (!data.success) {
            showSignupMsg(data.message || 'Signup failed.', false);
            return;
        }
        showSignupMsg('OTP sent! Please verify.', true);
        showOtpSection();
    } catch (err) {
        showSignupMsg('Server error. Try again.', false);
    }
});

// OTP verification
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
verifyOtpBtn.addEventListener('click', async function() {
    const otp = otpInputs.map(inp => inp.value).join('');
    const email = document.getElementById('signupEmail').value.trim();
    const role = document.getElementById('signupRole').value;
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        showOtpMsg('Enter a valid 6-digit OTP.', false);
        return;
    }
    try {
        const res = await fetch('/api/v1/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        const data = await res.json();
        if (!data.success) {
            showOtpMsg(data.message || 'OTP verification failed.', false);
            return;
        }
        showOtpMsg('OTP verified! Redirecting...', true);
        setTimeout(() => {
            window.location.href = role === 'Admin' ? '/admin-dashboard' : '/dashboard';
        }, 1200);
    } catch (err) {
        showOtpMsg('Server error. Try again.', false);
    }
});

// RESEND OTP
resendOtpBtn.addEventListener('click', async function() {
    resendOtpBtn.disabled = true;
    otpCountdown = 30;
    otpTimer.innerText = otpCountdown;
    startOtpTimer();
    const email = document.getElementById('signupEmail').value.trim();
    if (!email) {
        showOtpMsg('Enter your email to resend OTP.', false);
        return;
    }
    try {
        const res = await fetch('/api/v1/auth/resend-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!data.success) {
            showOtpMsg(data.message || 'Could not resend OTP.', false);
            return;
        }
        showOtpMsg('OTP resent!', true);
    } catch (err) {
        showOtpMsg('Server error. Try again.', false);
    }
});

// Message helpers
function showLoginMsg(msg, success) {
    const el = document.getElementById('loginMsg');
    el.innerHTML = `<div class="${success ? 'success-msg' : 'error-msg'}">${msg}</div>`;
}
function showSignupMsg(msg, success) {
    const el = document.getElementById('signupMsg');
    el.innerHTML = `<div class="${success ? 'success-msg' : 'error-msg'}">${msg}</div>`;
}
function showOtpMsg(msg, success) {
    const el = document.getElementById('otpMsg');
    el.innerHTML = `<div class="${success ? 'success-msg' : 'error-msg'}">${msg}</div>`;
}
