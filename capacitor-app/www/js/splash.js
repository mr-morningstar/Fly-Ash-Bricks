/**
 * DEV Fly Ash Bricks - Splash Screen & Global Branding
 * Handles: loading splash, footer injection, version tag
 */

(function () {
  'use strict';

  // ── Splash Screen ──────────────────────────────────────────────────────────
  function createSplash() {
    const splash = document.createElement('div');
    splash.id = 'splash-screen';
    splash.innerHTML = `
      <div class="splash-bg"></div>
      <div class="splash-content">
        <!-- Logo -->
        <div class="splash-logo-wrap">
          <img src="assets/logo.png" alt="DEV Fly Ash Bricks" class="splash-logo" />
          <div class="splash-tagline">हमार घर के शानन</div>
        </div>

        <!-- Brand below logo -->
        <div class="splash-brand">
          <span class="splash-brand-by">Software by</span>
          <span class="splash-brand-name">Shivam Dansena</span>
        </div>

        <!-- Loading Animation -->
        <div class="splash-loader">
          <div class="splash-bar">
            <div class="splash-bar-fill"></div>
          </div>
          <span class="splash-loading-text">Loading your workspace...</span>
        </div>
      </div>
    `;
    document.body.insertBefore(splash, document.body.firstChild);
    return splash;
  }

  function hideSplash(splash) {
    splash.classList.add('splash-exit');
    setTimeout(() => {
      splash.remove();
    }, 600);
  }

  // ── Page Footer ────────────────────────────────────────────────────────────
  function injectFooter() {
    const year = new Date().getFullYear();
    const footer = document.createElement('footer');
    footer.id = 'app-footer';
    footer.innerHTML = `
      <div class="footer-inner">
        <div class="footer-left">
          <img src="assets/logo.png" alt="DEV Fly Ash" class="footer-logo" />
          <div class="footer-text">
            <span class="footer-company">DEV Fly Ash Bricks</span>
            <span class="footer-slogan">हमार घर के शानन</span>
          </div>
        </div>
        <div class="footer-center">
          <span class="footer-copy">© ${year} DEV Fly Ash Bricks. All rights reserved.</span>
          <span class="footer-dev">
            Crafted by 
            <a href="https://github.com/ShivamDansena" target="_blank" rel="noopener noreferrer" class="footer-dev-link">
              Shivam Dansena
            </a>
          </span>
        </div>
        <div class="footer-right">
          <a href="https://github.com/ShivamDansena" target="_blank" rel="noopener noreferrer" class="footer-gh" title="GitHub">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(footer);
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', () => {
    const isLoginPage = window.location.pathname.endsWith('login.html');
    const isPublicPage = isLoginPage || window.location.pathname === '/';

    if (isLoginPage) {
      const splash = createSplash();

      // Hide after content loads (min 1.8s for UX feel)
      const minDelay = new Promise(resolve => setTimeout(resolve, 1800));
      const pageLoad = new Promise(resolve => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', resolve);
      });

      Promise.all([minDelay, pageLoad]).then(() => {
        hideSplash(splash);
        if (!isPublicPage) injectFooter();
      });
    } else {
      if (!isPublicPage) injectFooter();
    }
  });

})();
