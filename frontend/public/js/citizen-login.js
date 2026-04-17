document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');

  function showMsg(msg, success) {
    const el = document.getElementById('loginMsg');
    el.innerHTML = `<div class="${success ? 'success-msg' : 'error-msg'}">${msg}</div>`;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailOrMobile = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!emailOrMobile || !password) {
      showMsg('All fields are required.', false);
      return;
    }
    if (password.length < 6) {
      showMsg('Password must be at least 6 characters.', false);
      return;
    }
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrMobile, password, role: 'Citizen' })
      });
      const data = await res.json();
      if (!data.success) {
        showMsg(data.message || 'Login failed.', false);
        return;
      }
      // Clean old value
      localStorage.removeItem('userId');
      const uid = data.user?._id || data.user?.id || data.userId;
      if (uid) localStorage.setItem('userId', uid);
      localStorage.setItem('role', 'Citizen');
      localStorage.setItem('isLoggedIn', 'true');
      const fname = data.user?.firstName || data.user?.name || data.firstName || '';
      localStorage.setItem('firstName', fname);
      localStorage.setItem('user', JSON.stringify({ name: fname, email: data.user?.email || data.email || '' }));
      // Store JWT token for authenticated requests
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('JWT token stored:', data.token);
      } else {
        console.warn('No JWT token received from backend!');
      }
      showMsg('Login successful! Redirecting...', true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1200);
    } catch (err) {
      showMsg('Server error. Try again.', false);
    }
  });
});
