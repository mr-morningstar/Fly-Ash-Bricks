'use strict';

// Simple request cache
const apiCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // In Capacitor (native Android), window.location.pathname isn't a file path.
      // Use a simple check: if we're not already on login, redirect there.
      const onLogin = window.location.href.includes('login.html');
      if (!onLogin) {
        window.location.href = 'login.html?expired=true';
      }
      throw new Error('Unauthorized session.');
    }

    // Handle Blob for PDF downloads
    if (response.headers.get('content-type')?.includes('application/pdf')) {
      return response.blob();
    }

    const result = await response.json();
    if (!response.ok) {
      const err = new Error(result.message || 'API request failed.');
      err.errors = result.errors;
      err.statusCode = response.status;
      throw err;
    }
    return result;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

async function apiFetchCached(endpoint, options = {}) {
  if (options.method && options.method !== 'GET') {
    return apiFetch(endpoint, options);
  }
  const cacheKey = endpoint;
  const cached = apiCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }
  const result = await apiFetch(endpoint, options);
  apiCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

function clearApiCache() {
  apiCache.clear();
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-[80px] md:bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] md:w-full mx-4 md:mx-0 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  
  let bgClass = 'bg-surface-900 border-brand-500 text-brand-400';
  let icon = '🟢';
  if (type === 'error') {
    bgClass = 'bg-surface-900 border-rose-500 text-rose-400';
    icon = '🔴';
  } else if (type === 'warning') {
    bgClass = 'bg-surface-900 border-amber-500 text-amber-400';
    icon = '🟡';
  }

  toast.className = `flex items-center gap-3 p-4 rounded-xl border bg-opacity-95 shadow-2xl backdrop-blur-md transform transurface-y-4 opacity-0 transition-all duration-300 pointer-events-auto ${bgClass}`;
  toast.innerHTML = `
    <span class="text-lg">${icon}</span>
    <div class="flex-1 text-sm font-semibold">${message}</div>
    <button class="text-surface-400 hover:text-surface-200 text-xs font-bold ml-2 focus:outline-none">✕</button>
  `;

  toast.querySelector('button').addEventListener('click', () => {
    toast.classList.add('opacity-0', 'transurface-y-2');
    setTimeout(() => toast.remove(), 300);
  });

  container.appendChild(toast);
  setTimeout(() => toast.classList.remove('opacity-0', 'transurface-y-4'), 10);
  setTimeout(() => {
    toast.classList.add('opacity-0', 'transurface-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * apiRequest — alias for apiFetch.
 * groups.js, drivers.js, fleet.js, and wages.js all use this name.
 * Keeping the alias here avoids renaming every call site.
 */
const apiRequest = apiFetch;

