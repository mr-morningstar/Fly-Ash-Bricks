'use strict';

const DashboardModule = {
  trendChart: null,
  groupChart: null,

  async init() {
    const content = document.getElementById('page-content');
    const tpl = document.getElementById('page-template').content.cloneNode(true);
    content.appendChild(tpl);

    this.setGreeting();
    await this.loadData();
  },

  setGreeting() {
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good Morning 👋' : h < 17 ? 'Good Afternoon 👋' : 'Good Evening 👋';
    const el = document.getElementById('dash-greeting');
    const dateEl = document.getElementById('dash-date');
    const user = getLoggedInUser();
    if (el) el.textContent = `${greet}${user ? ', ' + user.name.split(' ')[0] : ''}`;
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  },

  async loadData() {
    this.renderKPISkeleton();
    try {
      const res = await apiFetch('/dashboard/full');
      const d = res.data;
      this.renderKPIs(d.summary);
      this.renderTrendChart(d.productionTrend);
      this.renderGroupChart(d.groupComparison);
      this.renderRecentBills(d.recentBills);
      this.renderRecentTrips(d.recentTrips);
      this.renderLowStock(d.lowStockItems);
    } catch (err) {
      showToast('Failed to load dashboard data.', 'error');
    }
  },

  async refresh() {
    clearApiCache();
    await this.loadData();
    showToast('Dashboard refreshed!');
  },

  renderKPISkeleton() {
    document.getElementById('kpi-cards').innerHTML = Array(6).fill('').map(() =>
      `<div class="p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
         <div class="skeleton h-4 w-24 rounded mb-4"></div>
         <div class="skeleton h-8 w-16 rounded"></div>
       </div>`
    ).join('');
  },

  renderKPIs(s) {
    const cards = [
      { title: 'Bricks Today', value: s.totalBricksToday?.toLocaleString() || '0', icon: '🧱', color: 'blue' },
      { title: "Today's Payout", value: `₹${(s.todayEstimatedPayout || 0).toLocaleString()}`, icon: '🪙', color: 'emerald' },
      { title: 'Active Labours', value: s.totalLabours || '0', icon: '👷', color: 'slate' },
      { title: 'Active Groups', value: s.activeGroups || '0', icon: '👥', color: 'purple' },
      { title: 'Pending Bills', value: s.pendingBillsCount || '0', icon: '💸', color: s.pendingBillsCount > 0 ? 'rose' : 'slate' },
      { title: 'Low Stock', value: s.lowStockCount || '0', icon: '⚠️', color: s.lowStockCount > 0 ? 'amber' : 'slate' },
    ];
    document.getElementById('kpi-cards').innerHTML = cards.map(c => Components.StatCard(c)).join('');
  },

  renderTrendChart(trend) {
    const ctx = document.getElementById('trend-chart');
    if (!ctx) return;
    if (this.trendChart) this.trendChart.destroy();

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trend.map(d => d.date),
        datasets: [{
          label: 'Bricks',
          data: trend.map(d => d.totalBricks),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.08)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10b981',
          pointRadius: 3,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, maxTicksLimit: 7 } },
          y: { grid: { color: gridColor }, ticks: { color: textColor } }
        }
      }
    });
  },

  renderGroupChart(groups) {
    const ctx = document.getElementById('group-chart');
    if (!ctx) return;
    if (this.groupChart) this.groupChart.destroy();

    const colors = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#ef4444','#06b6d4'];
    const isDark = document.documentElement.classList.contains('dark');

    this.groupChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: groups.map(g => g.groupName),
        datasets: [{
          data: groups.map(g => g.totalBricks),
          backgroundColor: colors,
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: isDark ? '#94a3b8' : '#64748b', padding: 12, font: { size: 11 } }
          }
        }
      }
    });
  },

  renderRecentBills(bills) {
    const el = document.getElementById('recent-bills');
    if (!bills?.length) { el.innerHTML = '<p class="text-sm text-surface-400 text-center py-4">No bills yet</p>'; return; }
    el.innerHTML = bills.map(b => `
      <a href="billing.html" class="flex justify-between items-center p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
        <div>
          <div class="text-sm font-bold">${b.group?.name || 'Group'}</div>
          <div class="text-xs text-surface-400">${new Date(b.periodEnd).toLocaleDateString('en-IN')}</div>
        </div>
        <div class="text-right">
          <div class="text-sm font-black text-brand-600 dark:text-brand-400">₹${(b.totalNet || 0).toLocaleString()}</div>
          <span class="text-xs px-2 py-0.5 rounded-full ${b.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'} font-bold">${b.status}</span>
        </div>
      </a>
    `).join('');
  },

  renderRecentTrips(trips) {
    const el = document.getElementById('recent-trips');
    if (!trips?.length) { el.innerHTML = '<p class="text-sm text-surface-400 text-center py-4">No trips yet</p>'; return; }
    el.innerHTML = trips.map(t => `
      <a href="fleet.html" class="flex justify-between items-center p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
        <div>
          <div class="text-sm font-bold">${t.driver?.name || 'Unknown Driver'}</div>
          <div class="text-xs text-surface-400">${t.destination || '-'} · ${t.tripsCount} trip(s)</div>
        </div>
        <div class="text-sm font-black text-blue-600 dark:text-blue-400">₹${(t.grandTotal || 0).toLocaleString()}</div>
      </a>
    `).join('');
  },

  renderLowStock(items) {
    const el = document.getElementById('low-stock');
    if (!items?.length) { el.innerHTML = '<p class="text-sm text-surface-400 text-center py-4">✅ All stock levels OK</p>'; return; }
    el.innerHTML = items.map(item => `
      <a href="inventory.html" class="flex justify-between items-center p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors">
        <div>
          <div class="text-sm font-bold text-rose-800 dark:text-rose-300">${item.name}</div>
          <div class="text-xs text-rose-600 dark:text-rose-400">Min: ${item.minStockLevel} ${item.unit}</div>
        </div>
        <div class="text-sm font-black text-rose-700 dark:text-rose-400">${item.currentStock} ${item.unit}</div>
      </a>
    `).join('');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => DashboardModule.init(), 100);
});
