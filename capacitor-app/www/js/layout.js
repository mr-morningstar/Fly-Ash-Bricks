'use strict';

// Apply theme instantly before page rendering begins to prevent flash
(function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark'; // default dark for rich aesthetics
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  // Ensure route is guarded (except login.html and index.html/public pages)
  const path = window.location.pathname;
  const isPublicPage = path.endsWith('index.html') || path === '/' || path.includes('/profile/');
  const isLoginPage = path.endsWith('login.html');
  
  if (!isPublicPage && !isLoginPage) {
    guardRoute();
    renderLayout();
  }
});

/** Renders the master layout with sidebar, header and dark toggle */
function renderLayout() {
  const container = document.getElementById('layout-wrapper');
  if (!container) return;

  const user = getLoggedInUser();
  if (!user) return;

  const permissions = (user.role && user.role.permissions) || [];
  const isAdmin = user.role && user.role.name === 'Super Admin';

  const checkPerm = (perm) => isAdmin || permissions.includes(perm);

  // Define sidebar menu options with icons & permissions
  const menuItems = [
    { label: 'Dashboard',  url: 'dashboard.html',  icon: '📊', show: true },
    { label: 'Inventory',  url: 'inventory.html',  icon: '📦', show: checkPerm('inventory.view') },
    { label: 'Production', url: 'production.html', icon: '🧱', show: checkPerm('production.view') },
    { label: 'Fleet Trips',url: 'fleet.html',      icon: '🚛', show: checkPerm('fleet.view') },
    { label: 'Drivers',    url: 'drivers.html',    icon: '🚚', show: checkPerm('fleet.view') },
    { label: 'Attendance', url: 'attendance.html', icon: '📅', show: checkPerm('attendance.view') },
    { label: 'Labours',    url: 'labours.html',    icon: '👷', show: checkPerm('labour.view') },
    { label: 'Groups',     url: 'groups.html',     icon: '👥', show: checkPerm('group.view') },
    { label: 'Daily Wages',url: 'wages.html',      icon: '💰', show: checkPerm('billing.view') },
    { label: 'Billing',    url: 'billing.html',    icon: '💸', show: checkPerm('billing.view') },
    { label: 'Public Site CMS', url: 'public-site.html', icon: '🌐', show: checkPerm('publicSite.view') || checkPerm('publicSite.update') },
    { label: 'Reports',    url: 'reports.html',    icon: '📄', show: checkPerm('reports.view') },
    { label: 'Users',      url: 'users.html',      icon: '🔑', show: checkPerm('user.view') },
    { label: 'Settings',   url: 'settings.html',   icon: '⚙️', show: checkPerm('settings.view') }
  ];

  const activeUrl = window.location.pathname.split('/').pop() || 'dashboard.html';

  // Desktop Navigation
  const navHtml = menuItems
    .filter(item => item.show)
    .map(item => {
      const isActive = activeUrl === item.url;
      const activeClass = isActive
        ? 'bg-brand-600/15 text-brand-400 border-l-2 border-brand-500 shadow-sm'
        : 'text-surface-400 hover:text-surface-200 hover:bg-white/5 border-l-2 border-transparent';
      return `
        <a href="${item.url}" class="flex items-center gap-3 px-4 py-2.5 rounded-r-xl transition-all duration-200 font-medium ${activeClass}">
          <span class="text-lg">${item.icon}</span>
          <span class="sidebar-text text-sm">${item.label}</span>
          ${isActive ? '<span class="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400"></span>' : ''}
        </a>
      `;
    })
    .join('');

  // Mobile Bottom Navigation (limit to 5 core items)
  const mobileCore = ['dashboard.html', 'production.html', 'attendance.html', 'fleet.html', 'inventory.html'];
  const bottomNavHtml = menuItems
    .filter(item => item.show && mobileCore.includes(item.url))
    .slice(0, 5)
    .map(item => {
      const activeClass = activeUrl === item.url
        ? 'text-brand-400 scale-110'
        : 'text-surface-500';
      return `
        <a href="${item.url}" class="nav-item flex flex-col items-center justify-center w-full py-2 ${activeClass}">
          <span class="text-2xl mb-1">${item.icon}</span>
          <span class="text-[10px] font-bold tracking-wider">${item.label.split(' ')[0]}</span>
        </a>
      `;
    })
    .join('');

  // Assemble template
  container.className = 'min-h-screen flex flex-col md:flex-row bg-surface-50 dark:bg-surface-950 text-surface-800 dark:text-surface-200 pb-[72px] md:pb-0';
  container.innerHTML = `
    <!-- Mobile Header -->
    <header class="md:hidden border-b border-white/5 flex justify-between items-center px-4 py-3 sticky top-0 z-40" style="background:linear-gradient(135deg,#091419,#0d1f1a);">
      <div class="flex items-center gap-2">
        <img src="assets/logo.png" alt="DEV Fly Ash" class="h-9 w-auto object-contain">
        <div class="flex flex-col leading-tight">
          <span class="font-black tracking-wider text-surface-100 text-sm uppercase">DEV Fly Ash</span>
          <span class="brand-by-line">by Shivam Dansena</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="window.openChangePasswordModal()" class="p-2 text-surface-400 hover:text-brand-400 focus:outline-none text-base" title="Change Password">🔑</button>
        <button id="theme-toggle-mobile" class="p-2 text-surface-400 hover:text-surface-200 focus:outline-none">🌓</button>
        <button id="menu-toggle" class="p-2 text-surface-400 hover:text-surface-200 focus:outline-none text-xl">☰</button>
      </div>
    </header>

    <!-- Sidebar Navigation (Desktop & Mobile Drawer) -->
    <aside id="sidebar" class="hidden md:flex flex-col w-64 text-surface-200 transition-all duration-300 z-50 fixed md:sticky top-0 h-screen border-r border-white/5" style="background:linear-gradient(160deg,#091419 0%,#0d1f1a 50%,#091e1c 100%);">
      <div class="p-4 border-b border-white/5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="assets/logo.png" alt="DEV Fly Ash" class="h-10 w-auto object-contain">
          <div class="flex flex-col">
            <span class="font-black tracking-wider text-surface-100 text-sm uppercase leading-tight">DEV Fly Ash</span>
            <span class="text-[9px] text-brand-500 font-bold uppercase tracking-widest">Bricks ERP</span>
            <span class="brand-by-line">by Shivam Dansena</span>
          </div>
        </div>
      </div>
      
      <!-- Nav List -->
      <nav class="flex-1 px-3 py-5 flex flex-col gap-0.5 overflow-y-auto">
        ${navHtml}
      </nav>

      <!-- User Profile Card / Footer -->
      <div class="p-4 border-t border-white/5 flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <img src="${user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}" 
               alt="avatar" class="w-10 h-10 rounded-full border-2 border-brand-500/40 object-cover">
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-sm text-surface-200 truncate">${user.name}</h4>
            <span class="text-xs text-brand-500 capitalize font-semibold">${user.role?.name || 'Staff'}</span>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 pt-1">
          <button onclick="window.openChangePasswordModal()" class="w-full py-1.5 px-3 text-surface-300 hover:text-brand-300 hover:bg-white/5 border border-white/5 hover:border-brand-500/30 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
            <span>🔑</span> Change Password
          </button>
          <div class="flex justify-between items-center gap-2">
            <button id="theme-toggle" class="flex-1 py-1.5 text-surface-400 hover:text-surface-200 hover:bg-white/5 rounded-lg text-xs transition-colors">🌓 Theme</button>
            <button id="logout-btn" class="flex-1 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-white/5 rounded-lg text-xs transition-colors">🚪 Logout</button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mobile Drawer Nav Overlay -->
    <div id="drawer-overlay" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"></div>

    <!-- Main Content Panel -->
    <main class="flex-1 flex flex-col overflow-x-hidden min-h-screen">
      <!-- Desktop Header -->
      <header class="hidden md:flex justify-between items-center px-8 py-4 bg-white/80 dark:bg-surface-950/90 backdrop-blur-md border-b border-surface-200 dark:border-white/5 sticky top-0 z-30">
        <h2 id="page-title" class="font-black text-2xl tracking-tight text-surface-800 dark:text-surface-100"></h2>
        <div class="flex items-center gap-3">
          <span class="text-sm font-semibold text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-brand-900/30 border border-brand-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
            Dev Village Mold Yard
          </span>
          <button onclick="window.openChangePasswordModal()" class="flex items-center gap-1.5 text-xs font-bold text-surface-300 hover:text-white bg-surface-100 dark:bg-surface-800/80 hover:bg-brand-600/30 border border-surface-200 dark:border-surface-700 hover:border-brand-500/50 px-3 py-1.5 rounded-full transition-all" title="Change your password">
            🔑 Change Password
          </button>
        </div>
      </header>
      
      <!-- Inside Page Content Container -->
      <div id="page-content" class="flex-1 p-4 md:p-8">
        <!-- Render page specific contents inside here -->
      </div>
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav id="bottom-nav" class="md:hidden fixed bottom-0 left-0 right-0 border-t border-white/5 z-40 flex justify-around items-end pt-1 pb-safe backdrop-blur-lg" style="background:rgba(9,20,25,0.97);">
      ${bottomNavHtml}
    </nav>

    <!-- Global Change Password Modal -->
    <div id="change-password-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all">
      <div class="bg-surface-900 border border-brand-500/30 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl text-surface-200 relative">
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center text-lg">🔑</div>
            <h3 class="font-black text-lg text-white">Change Password</h3>
          </div>
          <button onclick="window.closeChangePasswordModal()" class="text-surface-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div id="modal-pwd-error" class="hidden mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl"></div>
        <div id="modal-pwd-success" class="hidden mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl"></div>

        <form id="modal-change-pwd-form" onsubmit="window.handleModalChangePassword(event)" class="flex flex-col gap-4">
          <div>
            <label class="block text-xs font-bold text-surface-400 mb-1">Current Password</label>
            <div class="relative flex items-center">
              <input type="password" id="modal-cur-pwd" required class="w-full px-3 py-2.5 bg-surface-950 border border-surface-700 focus:border-brand-500 rounded-xl text-sm outline-none text-white pr-10">
              <button type="button" onclick="window.toggleModalPass('modal-cur-pwd', this)" class="absolute right-3 text-surface-400 hover:text-brand-400">👁️</button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-surface-400 mb-1">New Password (min 6 characters)</label>
            <div class="relative flex items-center">
              <input type="password" id="modal-new-pwd" required minlength="6" class="w-full px-3 py-2.5 bg-surface-950 border border-surface-700 focus:border-brand-500 rounded-xl text-sm outline-none text-white pr-10">
              <button type="button" onclick="window.toggleModalPass('modal-new-pwd', this)" class="absolute right-3 text-surface-400 hover:text-brand-400">👁️</button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-surface-400 mb-1">Confirm New Password</label>
            <div class="relative flex items-center">
              <input type="password" id="modal-confirm-pwd" required minlength="6" class="w-full px-3 py-2.5 bg-surface-950 border border-surface-700 focus:border-brand-500 rounded-xl text-sm outline-none text-white pr-10">
              <button type="button" onclick="window.toggleModalPass('modal-confirm-pwd', this)" class="absolute right-3 text-surface-400 hover:text-brand-400">👁️</button>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10 mt-2">
            <button type="button" onclick="window.closeChangePasswordModal()" class="px-4 py-2 text-xs font-bold text-surface-400 hover:text-white rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" id="modal-pwd-submit-btn" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-black shadow-lg shadow-brand-500/30 transition-all flex items-center gap-2">
              Update Password →
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Dynamic set page title
  const activeItem = menuItems.find(item => activeUrl === item.url);
  const pageTitleElement = document.getElementById('page-title');
  if (pageTitleElement && activeItem) {
    pageTitleElement.innerText = activeItem.label;
  }

  setupLayoutEvents();
}

function setupLayoutEvents() {
  const themeToggle = document.getElementById('theme-toggle');
  const themeToggleMobile = document.getElementById('theme-toggle-mobile');
  const logoutBtn = document.getElementById('logout-btn');
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const drawerOverlay = document.getElementById('drawer-overlay');

  const toggleThemeFunc = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  if (themeToggle) themeToggle.addEventListener('click', toggleThemeFunc);
  if (themeToggleMobile) themeToggleMobile.addEventListener('click', toggleThemeFunc);

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await apiFetch('/auth/logout', { method: 'POST' });
      } catch (e) { }
      clearAuthSession();
      window.location.href = 'login.html';
    });
  }

  if (menuToggle && sidebar && drawerOverlay) {
    const openMenu = () => {
      sidebar.classList.remove('hidden');
      sidebar.classList.add('fixed', 'left-0', 'top-0', 'bottom-0', 'flex', 'w-[280px]');
      drawerOverlay.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      sidebar.classList.add('hidden');
      sidebar.classList.remove('fixed', 'left-0', 'top-0', 'bottom-0', 'flex', 'w-[280px]');
      drawerOverlay.classList.add('hidden');
      document.body.style.overflow = '';
    };

    menuToggle.addEventListener('click', openMenu);
    drawerOverlay.addEventListener('click', closeMenu);

    sidebar.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }
}

// ── Change Password Modal Functions ─────────────────────────────────────────

window.openChangePasswordModal = function() {
  const modal = document.getElementById('change-password-modal');
  const err = document.getElementById('modal-pwd-error');
  const succ = document.getElementById('modal-pwd-success');
  const form = document.getElementById('modal-change-pwd-form');
  if (err) { err.textContent = ''; err.classList.add('hidden'); }
  if (succ) { succ.textContent = ''; succ.classList.add('hidden'); }
  if (form) form.reset();
  if (modal) modal.classList.remove('hidden');
};

window.closeChangePasswordModal = function() {
  const modal = document.getElementById('change-password-modal');
  if (modal) modal.classList.add('hidden');
};

window.toggleModalPass = function(id, btn) {
  const input = document.getElementById(id);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
};

window.handleModalChangePassword = async function(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('modal-cur-pwd').value;
  const newPassword = document.getElementById('modal-new-pwd').value;
  const confirmPassword = document.getElementById('modal-confirm-pwd').value;
  const errDiv = document.getElementById('modal-pwd-error');
  const succDiv = document.getElementById('modal-pwd-success');
  const btn = document.getElementById('modal-pwd-submit-btn');

  errDiv.classList.add('hidden');
  succDiv.classList.add('hidden');

  if (newPassword.length < 6) {
    errDiv.textContent = 'New password must be at least 6 characters.';
    errDiv.classList.remove('hidden');
    return;
  }

  if (newPassword !== confirmPassword) {
    errDiv.textContent = 'New passwords do not match. Please verify.';
    errDiv.classList.remove('hidden');
    return;
  }

  if (currentPassword === newPassword) {
    errDiv.textContent = 'New password cannot be the same as your current password.';
    errDiv.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Updating...';

  try {
    await apiFetch('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });

    succDiv.textContent = '✅ Password updated successfully!';
    succDiv.classList.remove('hidden');
    if (typeof showToast === 'function') showToast('Password updated successfully!', 'success');

    setTimeout(() => {
      window.closeChangePasswordModal();
    }, 1500);
  } catch (err) {
    errDiv.textContent = err.message || 'Failed to update password. Check your current password.';
    errDiv.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Update Password →';
  }
};
