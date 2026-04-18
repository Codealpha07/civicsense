document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  const mobile = urlParams.get('mobile');

  const verifySubText = document.getElementById('verifySubText');
  // default helper text before OTP is dispatched
  verifySubText.textContent = 'Choose where to receive your OTP and click "Send OTP".';


  const otpInputs = [
    document.getElementById('otp1'),
    document.getElementById('otp2'),
    document.getElementById('otp3'),
    document.getElementById('otp4'),
    document.getElementById('otp5'),
    document.getElementById('otp6')
  ];
  const verifyBtn = document.getElementById('verifyOtpBtn');
  const sendBtn = document.getElementById('sendOtpBtn');
  const otpWrapper = document.getElementById('otpWrapper');
  const resendBtn = document.getElementById('resendOtpBtn');
  const otpTimer = document.getElementById('otpTimer');
  let countdown = 15;
  let interval;

  function showMsg(elId, msg, success) {
    const el = document.getElementById(elId);
    el.innerHTML = `<div class="${success ? 'success-msg' : 'error-msg'}">${msg}</div>`;
  }

  function startTimer() {
    resendBtn.disabled = true;
    countdown = 15;
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

  sendBtn.addEventListener('click', async () => {
    const method = document.querySelector('input[name="otpMethod"]:checked').value;
    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          mobile, 
          method,
          purpose: 'verification' 
        })
      });
      const data = await res.json();
      if (!data.success) {
        showMsg('otpMsg', data.message || 'Could not send OTP.', false);
        return;
      }
      showMsg('otpMsg', 'OTP sent!', true);
      // update info banner
      let maskedContact;
      if (method === 'email') {
        maskedContact = email.replace(/(^.).*(@.*)/, '$1***$2');
      } else {
        maskedContact = '+91*****' + mobile.slice(-4);
      }
      verifySubText.textContent = `We\u2019ve sent an OTP to ${maskedContact}`;
      sendBtn.disabled = true;
      otpWrapper.style.display = '';
      startTimer();
    } catch (err) {
      showMsg('otpMsg', 'Server error. Try again.', false);
    }
  });

  verifyBtn.addEventListener('click', async () => {
    const otp = otpInputs.map(inp => inp.value).join('');
    if (otp.length !== 6) {
      showMsg('otpMsg', 'Enter 6-digit OTP.', false);
      return;
    }
    try {
      const res = await fetch('/api/v1/auth/verify-otp', {
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
        window.location.href = '/dashboard';
      }, 1200);
    } catch (err) {
      showMsg('otpMsg', 'Server error. Try again.', false);
    }
  });

  resendBtn.addEventListener('click', async () => {
    const method = document.querySelector('input[name="otpMethod"]:checked').value;
    startTimer();
    try {
      const res = await fetch('/api/v1/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mobile, method })
      });
      const data = await res.json();
      if (!data.success) {
        showMsg('otpMsg', data.message || 'Could not resend OTP.', false);
        return;
      }
      showMsg('otpMsg', 'OTP resent!', true);
      let maskedContact;
      if (method === 'email') {
        maskedContact = email.replace(/(^.).*(@.*)/, '$1***$2');
      } else {
        maskedContact = '+91*****' + mobile.slice(-4);
      }
      verifySubText.textContent = `We\u2019ve resent the OTP to ${maskedContact}`;
    } catch (err) {
      showMsg('otpMsg', 'Server error. Try again.', false);
    }
  });
});
