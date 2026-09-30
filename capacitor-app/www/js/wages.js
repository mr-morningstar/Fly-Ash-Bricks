'use strict';

/**
 * Daily Wages & Settlements Module Frontend Controller
 * Displays day-by-day aggregated wages combining:
 * 1. Brick-making rates (group rate/brick distributed per attendance)
 * 2. Driver trip earnings
 * 3. Helper loading/unloading (pickup & pickdown) earnings
 */
const WagesModule = {
  days: [],
  selectedDay: null,
  startDate: '',
  endDate: '',

  async init() {
    const content = document.getElementById('page-content');
    const tpl = document.getElementById('page-template')?.content.cloneNode(true);
    if (content && tpl) content.appendChild(tpl);

    this.setDefaultDates();
    await this.loadData();
  },

  setDefaultDates() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    this.startDate = start.toISOString().split('T')[0];
    this.endDate = end.toISOString().split('T')[0];

    const startInput = document.getElementById('wages-start-date');
    const endInput = document.getElementById('wages-end-date');
    if (startInput) startInput.value = this.startDate;
    if (endInput) endInput.value = this.endDate;
  },

  setFilterPreset(preset) {
    const today = new Date();
    const endStr = today.toISOString().split('T')[0];
    let startStr = endStr;

    if (preset === 'week') {
      const pastWeek = new Date();
      pastWeek.setDate(today.getDate() - 7);
      startStr = pastWeek.toISOString().split('T')[0];
    } else if (preset === 'month') {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startStr = firstOfMonth.toISOString().split('T')[0];
    }

    const startInput = document.getElementById('wages-start-date');
    const endInput = document.getElementById('wages-end-date');
    if (startInput) startInput.value = startStr;
    if (endInput) endInput.value = endStr;

    this.applyDateFilter();
  },

  applyDateFilter() {
    this.startDate = document.getElementById('wages-start-date')?.value || '';
    this.endDate = document.getElementById('wages-end-date')?.value || '';
    this.loadData();
  },

  async loadData() {
    try {
      const query = new URLSearchParams();
      if (this.startDate) query.append('startDate', this.startDate);
      if (this.endDate) query.append('endDate', this.endDate);

      this.renderTable([], true);
      const res = await apiRequest(`/wages/daily-summary?${query}`);
      this.days = res.data?.days || [];

      this.renderStats(this.days);
      this.renderTable(this.days, false);
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to load daily wages.', 'error');
      this.renderTable([], false);
    }
  },

  renderStats(days) {
    const container = document.getElementById('wages-stats-container');
    if (!container) return;

    const totalBricks = days.reduce((acc, d) => acc + (d.totalBricks || 0), 0);
    const totalTrips = days.reduce((acc, d) => acc + (d.totalTrips || 0), 0);
    const totalMaking = days.reduce((acc, d) => acc + (d.totalMakingWage || 0), 0);
    const totalTripWages = days.reduce((acc, d) => acc + (d.totalTripWage || 0), 0);
    const grandTotal = totalMaking + totalTripWages;

    container.innerHTML = `
      ${Components.StatsCard({ title: 'Total Bricks Made', value: totalBricks.toLocaleString(), icon: '🧱' })}
      ${Components.StatsCard({ title: 'Total Trips Run', value: totalTrips, icon: '🚛' })}
      ${Components.StatsCard({ title: 'Production Making Wages', value: `₹${Math.round(totalMaking).toLocaleString()}`, icon: '🏗️' })}
      ${Components.StatsCard({ title: 'Total Wages Payable', value: `₹${Math.round(grandTotal).toLocaleString()}`, icon: '💰' })}
    `;
  },

  renderTable(data, loading) {
    const container = document.getElementById('wages-table-container');
    if (!container) return;

    const columns = [
      {
        key: 'date',
        label: 'Date',
        render: (item) => `
          <div class="flex items-center gap-2">
            <span class="text-base">📅</span>
            <span class="font-bold text-surface-900 dark:text-white">${new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        `
      },
      {
        key: 'totalBricks',
        label: 'Bricks Made',
        class: 'text-right',
        render: (item) => `<span class="font-black font-mono">${(item.totalBricks || 0).toLocaleString()}</span>`
      },
      {
        key: 'totalTrips',
        label: 'Fleet Trips',
        class: 'text-center',
        render: (item) => item.totalTrips > 0 
          ? `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">${item.totalTrips}</span>`
          : `<span class="text-surface-400 text-xs">—</span>`
      },
      {
        key: 'totalMakingWage',
        label: 'Making Wages (₹)',
        class: 'text-right',
        render: (item) => `<span class="font-mono font-bold text-surface-800 dark:text-surface-200">₹${Number(item.totalMakingWage || 0).toLocaleString()}</span>`
      },
      {
        key: 'totalTripWage',
        label: 'Trip Driver & Helper (₹)',
        class: 'text-right',
        render: (item) => `<span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹${Number(item.totalTripWage || 0).toLocaleString()}</span>`
      },
      {
        key: 'grandTotal',
        label: 'Daily Total Payout (₹)',
        class: 'text-right',
        render: (item) => `<span class="font-mono font-black text-brand-600 dark:text-brand-400 text-sm">₹${Number(item.grandTotal || 0).toLocaleString()}</span>`
      },
      {
        key: 'actions',
        label: '',
        class: 'text-right',
        render: (item) => `
          <button onclick="WagesModule.openBreakdownModal('${item.date}')" 
                  class="px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 rounded-lg text-xs font-black transition-colors flex items-center gap-1.5 ml-auto">
            <span>👁️</span> Breakdown
          </button>
        `
      }
    ];

    container.innerHTML = Components.DataTable({
      id: 'wages-table',
      columns,
      data,
      loading,
      emptyMessage: 'No daily records found for the selected date range.'
    });
  },

  openBreakdownModal(dateStr) {
    const day = this.days.find(d => d.date === dateStr);
    if (!day) return;
    this.selectedDay = day;

    const formattedDate = new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const workers = day.workers || [];

    const rowsHtml = workers.length === 0 
      ? `<tr><td colspan="7" class="px-6 py-8 text-center text-xs font-bold text-surface-400">No individual worker earnings recorded on this day.</td></tr>`
      : workers.map((w, idx) => {
          const statusBadge = w.attendance === 'P' 
            ? '<span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-black">Present</span>'
            : w.attendance === 'HD'
            ? '<span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[10px] font-black">Half-Day</span>'
            : '<span class="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 text-[10px] font-black">Absent</span>';

          return `
            <tr class="hover:bg-surface-50/50 dark:hover:bg-surface-800/40 text-xs transition-colors">
              <td class="px-4 py-3 font-bold text-surface-400">#${idx + 1}</td>
              <td class="px-4 py-3">
                <div class="font-black text-surface-900 dark:text-white">${w.name}</div>
                <div class="text-[10px] text-surface-400">${w.group || 'General'}</div>
              </td>
              <td class="px-4 py-3 text-center">${statusBadge}</td>
              <td class="px-4 py-3 text-right font-mono font-bold text-surface-800 dark:text-surface-200">
                ₹${Number(w.makingWage || 0).toLocaleString()}
              </td>
              <td class="px-4 py-3 text-right font-mono text-blue-500">
                ${w.drivingTrips > 0 ? `₹${Number(w.drivingWage || 0).toLocaleString()} <span class="text-[10px] text-surface-400">(${w.drivingTrips} trips)</span>` : '—'}
              </td>
              <td class="px-4 py-3 text-right font-mono text-emerald-500">
                ${w.helperTrips > 0 ? `₹${Number(w.helperWage || 0).toLocaleString()} <span class="text-[10px] text-surface-400">(${w.helperTrips} load/unload)</span>` : '—'}
              </td>
              <td class="px-4 py-3 text-right font-mono font-black text-brand-600 dark:text-brand-400 text-sm">
                ₹${Number(w.totalPayable || 0).toLocaleString()}
              </td>
            </tr>
          `;
        }).join('');

    const modalHtml = `
      <div class="flex flex-col gap-5">
        
        <!-- Day Summary Header -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-surface-50 dark:bg-surface-950/60 rounded-xl border border-surface-200 dark:border-surface-800">
          <div>
            <span class="block text-[10px] font-bold uppercase text-surface-400">Date</span>
            <span class="font-bold text-xs text-surface-900 dark:text-white">${day.date}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold uppercase text-surface-400">Bricks Output</span>
            <span class="font-black text-xs text-surface-900 dark:text-white">${day.totalBricks.toLocaleString()} bricks</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold uppercase text-surface-400">Fleet Deliveries</span>
            <span class="font-black text-xs text-blue-500">${day.totalTrips} trips</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold uppercase text-surface-400">Grand Daily Payout</span>
            <span class="font-black text-xs text-brand-500">₹${Number(day.grandTotal).toLocaleString()}</span>
          </div>
        </div>

        <!-- Worker Breakdown Table -->
        <div class="border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto max-h-96 overflow-y-auto">
            <table class="w-full text-left border-collapse">
              <thead class="sticky top-0 bg-surface-100 dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800 text-[10px] font-extrabold uppercase tracking-wider text-surface-400 z-10">
                <tr>
                  <th class="px-4 py-2.5">#</th>
                  <th class="px-4 py-2.5">Worker Name</th>
                  <th class="px-4 py-2.5 text-center">Attendance</th>
                  <th class="px-4 py-2.5 text-right">Making Wage</th>
                  <th class="px-4 py-2.5 text-right">Driver Earnings</th>
                  <th class="px-4 py-2.5 text-right">Helper (Pickup/Down)</th>
                  <th class="px-4 py-2.5 text-right font-black text-brand-500">Total Payable</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-100 dark:divide-surface-800 bg-white dark:bg-surface-900">
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Print / Close Actions -->
        <div class="flex justify-between items-center pt-2">
          <button onclick="window.print()" class="px-4 py-2 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-xl font-bold text-xs transition-colors flex items-center gap-2">
            <span>🖨️</span> Print Daily Sheet
          </button>
          <button onclick="Components.closeModal('day-breakdown-modal')" class="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md shadow-brand-500/20">
            Done
          </button>
        </div>

      </div>
    `;

    document.getElementById('day-breakdown-modal-container').innerHTML = Components.Modal({
      id: 'day-breakdown-modal',
      title: `Daily Wages Breakdown · ${formattedDate}`,
      contentHtml: modalHtml,
      maxWidth: 'max-w-4xl'
    });

    Components.openModal('day-breakdown-modal');
  },

  exportSummary() {
    if (this.days.length === 0) {
      if (typeof showToast === 'function') showToast('No records to export.', 'warning');
      return;
    }

    const headers = ['Date', 'Bricks Produced', 'Total Trips', 'Making Wages (INR)', 'Trip Driving & Helper Wages (INR)', 'Total Daily Payout (INR)'];
    const rows = this.days.map(d => [
      d.date,
      d.totalBricks,
      d.totalTrips,
      d.totalMakingWage,
      d.totalTripWage,
      d.grandTotal
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DEV_BRICKS_Daily_Wages_${this.startDate}_to_${this.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof showToast === 'function') showToast('Daily wages exported to CSV.', 'success');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => WagesModule.init(), 100);
});
