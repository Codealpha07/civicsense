document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  const mobile = urlParams.get('mobile');

  const verifySubText = document.getElementById('verifySubText');
  if (email) {
    const masked = email.replace(/(^.).*(@.*)/, '$1***$2');
    verifySubText.textContent = `Choose how you want to receive your OTP`;
  }

  const otpInputs = [
    document.getElementById('otp1'),
    document.getElementById('otp2'),
    document.getElementById('otp3'),
    document.getElementById('otp4'),
    document.getElementById('otp5'),
    document.getElementById('otp6')
  ];
  const verifyBtn = document.getElementById('verifyOtpBtn');
  const resendBtn = document.getElementById('resendOtpBtn');
  const otpTimer = document.getElementById('otpTimer');
  let countdown = 60;
  let interval;

  function showMsg(elId, msg, success) {
    const el = document.getElementById(elId);
    el.innerHTML = `<div class="${success ? 'success-msg' : 'error-msg'}">${msg}</div>`;
  }

  function startTimer() {
    otpTimer.classList.remove('d-none');
    resendBtn.disabled = true;
    countdown = 60;
    otpTimer.innerText = countdown;
    interval = setInterval(() => {
      countdown--;
      otpTimer.innerText = countdown;
      if (countdown <= 0) {
        otpTimer.classList.add('d-none');
        resendBtn.innerText = 'Resend OTP';
        clearInterval(interval);
        resendBtn.disabled = false;
      }
    }, 1000);
  }
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

  verifyBtn.addEventListener('click', async () => {
    const otp = otpInputs.map(inp => inp.value).join('');
    if (otp.length !== 6) {
      showMsg('otpMsg', 'Enter 6-digit OTP.', false);
      return;
    }
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mobile, otp })
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
    const method = document.querySelector('input[name="otpMethod"]:checked').value;
    startTimer();
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mobile, method })
      });
      const data = await res.json();
      if (!data.success) {
        showMsg('otpMsg', data.message || 'Could not resend OTP.', false);
        return;
      }
      verifySubText.textContent = `OTP sent via ${method.toUpperCase()}.`; 
      resendBtn.innerText = `Resend OTP (${countdown}s)`;
      showMsg('otpMsg', 'OTP sent!', true);
    } catch (err) {
      showMsg('otpMsg', 'Server error. Try again.', false);
    }
  });
});
