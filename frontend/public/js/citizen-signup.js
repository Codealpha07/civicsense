document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  const otpSection = document.getElementById('otpSection');
  const resendBtn = document.getElementById('resendOtpBtn');
  const otpTimer = document.getElementById('otpTimer');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  const otpInputs = [
    document.getElementById('otp1'),
    document.getElementById('otp2'),
    document.getElementById('otp3'),
    document.getElementById('otp4'),
    document.getElementById('otp5'),
    document.getElementById('otp6')
  ];
  let countdown = 60;
  let interval;

  function showMsg(elId, msg, success) {
    const el = document.getElementById(elId);
    el.innerHTML = `<div class="${success ? 'success-msg' : 'error-msg'}">${msg}</div>`;
  }

  function startTimer() {
    resendBtn.disabled = true;
    countdown = 60;
    otpTimer.innerText = countdown;
    interval = setInterval(() => {
      countdown--;
      otpTimer.innerText = countdown;
      if (countdown <= 0) {
        clearInterval(interval);
        resendBtn.disabled = false;
      }
    }, 1000);
  }

  function showOtpSection() {
    otpSection.style.display = 'block';
    startTimer();
  }

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const mobile = document.getElementById('signupMobile').value.trim();
    const address = document.getElementById('signupAddress').value.trim();
    const state = document.getElementById('stateSelect').value;
    const city = document.getElementById('citySelect').value;
    
    const pinCode = document.getElementById('pinCode').value.trim();
    const otpMethod = document.querySelector('input[name="otpMethod"]:checked').value;
    const password = document.getElementById('signupPassword').value;
    if (!firstName || !lastName || !email || !mobile || !address || !state || !city || !pinCode || !password) {
      showMsg('signupMsg', 'All fields are required.', false);
      return;
    }
    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, mobile, address, state, city, pinCode, password, role: 'Citizen', otpMethod })
      });
      const data = await res.json();
      if (!data.success) {
        showMsg('signupMsg', data.message || 'Signup failed.', false);
        return;
      }
      showMsg('signupMsg', 'OTP sent! Please verify.', true);
      showOtpSection();
    } catch (err) {
      showMsg('signupMsg', 'Server error. Try again.', false);
    }
  });

  verifyOtpBtn.addEventListener('click', async () => {
    const otp = otpInputs.map(inp => inp.value).join('');
    const email = document.getElementById('signupEmail').value.trim();
    if (otp.length !== 6) {
      showMsg('otpMsg', 'Enter 6-digit OTP.', false);
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
        showMsg('otpMsg', data.message || 'Verification failed.', false);
        return;
      }
      showMsg('otpMsg', 'Verified! Redirecting...', true);
      setTimeout(() => {
        window.location.href = '/citizen-dashboard';
      }, 1200);
    } catch (err) {
      showMsg('otpMsg', 'Server error. Try again.', false);
    }
  });

  resendBtn.addEventListener('click', async () => {
    const email = document.getElementById('signupEmail').value.trim();
    if (!email) {
      showMsg('otpMsg', 'Enter email first.', false);
      return;
    }
    startTimer();
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!data.success) {
        showMsg('otpMsg', data.message || 'Could not resend OTP.', false);
        return;
      }
      showMsg('otpMsg', 'OTP resent!', true);
    } catch (err) {
      showMsg('otpMsg', 'Server error. Try again.', false);
    }
  });

  // Auto-focus OTP inputs
  otpInputs.forEach((input, idx) => {
    input.addEventListener('input', () => {
      if (input.value.length === 1 && idx < 5) {
        otpInputs[idx + 1].focus();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value === '' && idx > 0) {
        otpInputs[idx - 1].focus();
      }
    });
  });
});
