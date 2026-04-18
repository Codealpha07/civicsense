(() => {
  const FOOTER_STYLE_ID = 'shared-premium-footer-styles';
  const FOOTER_ROOT_ID = 'shared-premium-footer';

  function injectStyles() {
    if (document.getElementById(FOOTER_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = FOOTER_STYLE_ID;
    style.textContent = `
      .premium-footer {
        background: var(--bg-secondary, #ffffff);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        margin-top: 5rem;
        position: relative;
        overflow: hidden;
      }
      .premium-footer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, transparent, rgba(102, 126, 234, 0.03), transparent);
        opacity: 0;
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .premium-footer:hover::before {
        opacity: 1;
      }
      .footer-content {
        max-width: 1600px;
        margin: 0 auto;
        padding: 3rem 2.5rem 2rem;
      }
      .footer-section h6 {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        color: var(--text-primary, #1a202c);
        margin-bottom: 1.5rem;
        position: relative;
      }
      .footer-section h6::after {
        content: '';
        position: absolute;
        bottom: -0.5rem;
        left: 0;
        width: 30px;
        height: 2px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        border-radius: 1px;
      }
      .footer-link {
        color: var(--text-secondary, #4a5568);
        text-decoration: none;
        font-weight: 500;
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        display: inline-block;
        padding: 0.25rem 0;
      }
      .footer-link::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 1px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .footer-link:hover {
        color: var(--text-accent, #667eea);
        transform: translateX(5px);
      }
      .footer-link:hover::before {
        width: 100%;
      }
      .footer-bottom {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 2rem;
        text-align: center;
        color: var(--text-secondary, #4a5568);
        font-size: 0.9rem;
      }
      .footer-version {
        background: var(--glass-bg, rgba(255, 255, 255, 0.08));
        backdrop-filter: blur(15px);
        border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.15));
        border-radius: 12px;
        padding: 0.5rem 1rem;
        display: inline-block;
        margin-top: 1rem;
        font-weight: 600;
        color: var(--text-accent, #667eea);
      }
      @media (max-width: 768px) {
        .footer-content {
          padding: 2rem 1.5rem 1.5rem;
        }
      }
      .dropdown-menu {
        background: rgba(255, 255, 255, 0.98) !important;
        backdrop-filter: blur(24px);
        border: 1px solid rgba(0, 0, 0, 0.08) !important;
        z-index: 3000 !important;
      }
      [data-bs-theme="dark"] .dropdown-menu {
        background: rgba(15, 23, 42, 0.98) !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
      }
    `;

    document.head.appendChild(style);
  }

  function footerHtml() {
    return `
      <footer id="${FOOTER_ROOT_ID}" class="premium-footer">
        <div class="footer-content">
          <div class="row">
            <div class="col-md-3 mb-4">
              <div class="footer-section">
                <h6>Legal & Privacy</h6>
                <ul class="list-unstyled">
                  <li class="mb-2"><a href="/privacy-policy.html" class="footer-link"><i class="fas fa-shield-alt me-2"></i>Privacy Policy</a></li>
                  <li class="mb-2"><a href="/terms.html" class="footer-link"><i class="fas fa-file-contract me-2"></i>Terms of Service</a></li>
                  <li class="mb-2"><a href="/cookies.html" class="footer-link"><i class="fas fa-cookie-bite me-2"></i>Cookie Policy</a></li>
                </ul>
              </div>
            </div>
            <div class="col-md-3 mb-4">
              <div class="footer-section">
                <h6>Quick Links</h6>
                <ul class="list-unstyled">
                  <li class="mb-2"><a href="/about.html" class="footer-link"><i class="fas fa-info-circle me-2"></i>About CivicVerse</a></li>
                  <li class="mb-2"><a href="/citizen-dashboard.html" class="footer-link"><i class="fas fa-tachometer-alt me-2"></i>Dashboard</a></li>
                  <li class="mb-2"><a href="/contact.html" class="footer-link"><i class="fas fa-envelope me-2"></i>Contact Us</a></li>
                </ul>
              </div>
            </div>
            <div class="col-md-3 mb-4">
              <div class="footer-section">
                <h6>Support & Help</h6>
                <ul class="list-unstyled">
                  <li class="mb-2"><a href="/support.html" class="footer-link"><i class="fas fa-life-ring me-2"></i>Help Center</a></li>
                  <li class="mb-2"><a href="/faq.html" class="footer-link"><i class="fas fa-question-circle me-2"></i>FAQ</a></li>
                  <li class="mb-2"><a href="/feedback.html" class="footer-link"><i class="fas fa-comment-dots me-2"></i>Feedback</a></li>
                </ul>
              </div>
            </div>
            <div class="col-md-3 mb-4">
              <div class="footer-section">
                <h6>Community</h6>
                <ul class="list-unstyled">
                  <li class="mb-2"><a href="/community.html" class="footer-link"><i class="fas fa-users me-2"></i>Community Forum</a></li>
                  <li class="mb-2"><a href="/news.html" class="footer-link"><i class="fas fa-newspaper me-2"></i>News & Updates</a></li>
                  <li class="mb-2"><a href="/events.html" class="footer-link"><i class="fas fa-calendar-alt me-2"></i>Events</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div class="footer-bottom"></div>
        </div>
      </footer>
    `;
  }

  function mountFooter() {
    const logoTargets = document.querySelectorAll('.logo-section, .logo-icon');
    logoTargets.forEach((el) => {
      if (el.dataset.dashboardNavBound === 'true') return;
      el.dataset.dashboardNavBound = 'true';
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        window.location.href = '/dashboard';
      });
    });

    injectStyles();

    document.querySelectorAll('footer').forEach((node) => {
      node.remove();
    });

    const wrapper = document.createElement('div');
    wrapper.innerHTML = footerHtml();
    document.body.appendChild(wrapper.firstElementChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountFooter);
  } else {
    mountFooter();
  }
})();
