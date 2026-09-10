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
      <div class="flex items-center gap-3">
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
        <div class="flex justify-between items-center pt-2 gap-2">
          <button id="theme-toggle" class="flex-1 py-2 text-surface-400 hover:text-surface-200 hover:bg-white/5 rounded-lg text-sm transition-colors">🌓 Theme</button>
          <button id="logout-btn" class="flex-1 py-2 text-rose-400 hover:text-rose-300 hover:bg-white/5 rounded-lg text-sm transition-colors">🚪 Logout</button>
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
        <div class="flex items-center gap-4">
          <span class="text-sm font-semibold text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-brand-900/30 border border-brand-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
            Dev Village Mold Yard
          </span>
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
