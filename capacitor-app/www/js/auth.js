'use strict';

/**
 * Auth utilities for saving/retrieving credentials.
 */

function isAuthenticated() {
  return localStorage.getItem('token') !== null;
}

function getLoggedInUser() {
  const userJson = localStorage.getItem('user');
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    return null;
  }
}

function saveAuthSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // Set theme preference
  if (user && user.theme) {
    localStorage.setItem('theme', user.theme);
  }
}

function clearAuthSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/** Check session state on load and redirect if unauthenticated */
function guardRoute() {
  if (!isAuthenticated()) {
    const isLoginScreen = window.location.pathname.endsWith('login.html');
    if (!isLoginScreen) {
      window.location.href = 'login.html';
    }
  }
}
