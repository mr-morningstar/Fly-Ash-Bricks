'use strict';

window.togglePasswordVisibility = function() {
  const passInput = document.getElementById('password');
  const btn = document.getElementById('toggle-password-btn');
  if (!passInput) return;
  if (passInput.type === 'password') {
    passInput.type = 'text';
    if (btn) btn.textContent = '🙈';
  } else {
    passInput.type = 'password';
    if (btn) btn.textContent = '👁️';
  }
};

window.openForgotModal = function() {
  const modal = document.getElementById('forgot-modal');
  const err = document.getElementById('forgot-error');
  const succ = document.getElementById('forgot-success');
  const devWrap = document.getElementById('forgot-dev-link-wrap');
  const form = document.getElementById('forgot-form');

  if (err) err.style.display = 'none';
  if (succ) succ.style.display = 'none';
  if (devWrap) devWrap.style.display = 'none';
  if (form) {
    form.style.display = 'flex';
    form.reset();
  }
  if (modal) modal.style.display = 'flex';
};

window.closeForgotModal = function() {
  const modal = document.getElementById('forgot-modal');
  if (modal) modal.style.display = 'none';
};

window.submitForgotPassword = async function(e) {
  e.preventDefault();
  const emailInput = document.getElementById('forgot-email');
  const submitBtn = document.getElementById('forgot-submit-btn');
  const errDiv = document.getElementById('forgot-error');
  const succDiv = document.getElementById('forgot-success');
  const succText = document.getElementById('forgot-success-text');
  const devWrap = document.getElementById('forgot-dev-link-wrap');
  const devLink = document.getElementById('forgot-dev-link');
  const form = document.getElementById('forgot-form');

  const email = emailInput?.value.trim();
  if (!email) return;

  if (errDiv) errDiv.style.display = 'none';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
  }

  try {
    const res = await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    if (form) form.style.display = 'none';
    if (succDiv) {
      succDiv.style.display = 'block';
      if (succText) {
        succText.textContent = `A secure password reset link has been dispatched to ${email}. Please check your inbox.`;
      }
    }

    if (res.data?.resetUrl && devWrap && devLink) {
      devLink.href = res.data.resetUrl;
      devWrap.style.display = 'block';
    }
  } catch (error) {
    if (errDiv) {
      errDiv.textContent = error.message || 'Failed to dispatch reset email. Please ensure your email is correct.';
      errDiv.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Reset Link →';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, skip to dashboard
  if (typeof isAuthenticated === 'function' && isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Check URL params for feedback (e.g. session expired)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('expired')) {
    if (typeof showToast === 'function') {
      showToast('Your session has expired. Please log in again.', 'warning');
    }
  }

  const form = document.getElementById('login-form');
  const loader = document.getElementById('loader');
  const forgotBtn = document.getElementById('forgot-password');
  const errorDiv = document.getElementById('error-msg');
  const errorText = document.getElementById('error-text');

  // Login handler
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (errorDiv) errorDiv.style.display = 'none';
    if (loader) loader.style.display = 'flex';

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (typeof showToast === 'function') {
        showToast('Logged in successfully! Redirecting...', 'success');
      }
      
      // Save credentials to localStorage
      saveAuthSession(response.token, response.data.user);
      
      // Redirect to main workspace
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    } catch (error) {
      if (errorDiv && errorText) {
        errorText.textContent = error.message || 'Invalid credentials. Please try again.';
        errorDiv.style.display = 'block';
      }
      if (typeof showToast === 'function') {
        showToast(error.message || 'Incorrect credentials.', 'error');
      }
    } finally {
      if (loader) loader.style.display = 'none';
    }
  });

  // Forgot password open modal trigger
  forgotBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    window.openForgotModal();
  });
});
