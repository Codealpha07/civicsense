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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrMobile, password, role: 'Admin' })
      });
      const data = await res.json();
      if (!data.success) {
        showMsg(data.message || 'Login failed.', false);
        return;
      }
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('role', 'Admin');
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify({ name: data.name || data.firstName || '', email: data.email || '' }));
      showMsg('Login successful! Redirecting...', true);
      setTimeout(() => {
        window.location.href = '/admin-dashboard';
      }, 1200);
    } catch (err) {
      showMsg('Server error. Try again.', false);
    }
  });
});
