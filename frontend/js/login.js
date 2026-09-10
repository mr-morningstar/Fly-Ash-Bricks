'use strict';

window.fillAdminCredentials = function() {
  const emailInput = document.getElementById('email');
  const passInput = document.getElementById('password');
  if (emailInput) emailInput.value = 'admin@devbricks.com';
  if (passInput) passInput.value = 'Admin@123';
  const errorDiv = document.getElementById('error-msg');
  if (errorDiv) errorDiv.style.display = 'none';
};

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
  form.addEventListener('submit', async (e) => {
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

  // Forgot password handler
  forgotBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = prompt('Enter your registered email address:');
    if (!email) return;

    if (loader) loader.style.display = 'flex';

    try {
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      alert(`Password reset link generated:\n\n${res.data?.resetUrl || 'Check server console'}\n\nUse this link to set a new password.`);
    } catch (error) {
      alert(error.message || 'Failed to generate reset link.');
    } finally {
      if (loader) loader.style.display = 'none';
    }
  });
});
