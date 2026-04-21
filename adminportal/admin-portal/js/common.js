// common.js: injects the shared header and activates nav links
(async () => {
  const headerHolder = document.createElement('div');
  document.body.prepend(headerHolder);

  try {
    const resp = await fetch('partials/header.html');
    const html = await resp.text();
    headerHolder.innerHTML = html;

    // Highlight active link based on filename
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    document.querySelectorAll('#navLinks .nav-link').forEach(link => {
      if (link.dataset.page === currentPage) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });

    // Robust Logout logic using event delegation
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#logoutBtn');
      if (btn) {
        e.preventDefault();
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('department');
        localStorage.removeItem('role');
        
        // Redirect to main landing page (citizen portal)
        // PRODUCTION: https://civicsense-4861.onrender.com/
        window.location.href = 'https://civicsense-4861.onrender.com/';
      }
    });

  } catch (e) {
    console.error('Failed to load common header:', e);
  }
})();
