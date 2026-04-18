document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');

  function showMsg(elId, msg, success) {
    const el = document.getElementById(elId);
    el.innerHTML = `<div class="${success ? 'success-msg' : 'error-msg'}">${msg}</div>`;
  }

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const mobileRaw = document.getElementById('signupMobile').value.trim();
    const mobile = `+91${mobileRaw}`;
    const address = document.getElementById('signupAddress').value.trim();
    const state = document.getElementById('stateSelect').value;
    const city = document.getElementById('citySelect').value;
    const pinCode = document.getElementById('pinCode').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!firstName || !lastName || !email || !mobileRaw || !address || !state || !city || !pinCode || !password) {
      showMsg('signupMsg', 'All fields are required.', false);
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          mobile,
          address,
          state,
          city,
          pinCode,
          password,
          role: 'Citizen'
        })
      });
      const data = await res.json();
      if (!data.success) {
        showMsg('signupMsg', data.message || 'Signup failed.', false);
        return;
      }
      // redirect to verification page with contact info
      window.location.href = `/verify?email=${encodeURIComponent(email)}&mobile=${encodeURIComponent(mobile)}`;
    } catch (err) {
      showMsg('signupMsg', 'Server error. Try again.', false);
    }
  });
});
