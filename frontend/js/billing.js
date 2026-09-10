'use strict';

const BillingModule = {
  currentPage: 1,
  limit: 10,
  filters: {},
  groups: [],

  async init() {
    const content = document.getElementById('page-content');
    const tpl = document.getElementById('page-template').content.cloneNode(true);
    content.appendChild(tpl);
    await this.loadGroups();
    await this.loadData();
    this.setupGenerateModal();
  },

  async loadGroups() {
    try {
      const res = await apiFetchCached('/groups?limit=100');
      this.groups = res.data.groups || res.data;
    } catch (err) { }
  },

  applyFilter() {
    this.filters.status = document.getElementById('bill-status-filter').value;
    const s = document.getElementById('bill-start').value;
    const e = document.getElementById('bill-end').value;
    if (s) this.filters.start = s;
    if (e) this.filters.end = e;
    this.currentPage = 1;
    this.loadData();
  },

  changePage(page) { this.currentPage = page; this.loadData(); },

  async loadData() {
    this.renderTable(null, true);
    try {
      const qs = new URLSearchParams({ page: this.currentPage, limit: this.limit, ...this.filters });
      const res = await apiFetch(`/billing?${qs}`);
      this.renderTable(res.data.bills, false);
      this.renderPagination(res.data);
    } catch (err) {
      showToast(err.message, 'error');
      this.renderTable([], false);
    }
  },

  renderTable(data, loading) {
    const statusBadge = (s) => {
      const map = { draft: 'bg-surface-100 text-surface-600', final: 'bg-blue-100 text-blue-700', paid: 'bg-green-100 text-green-700' };
      return `<span class="px-2 py-1 rounded-full text-xs font-bold ${map[s] || map.draft}">${s}</span>`;
    };
    const columns = [
      { key: 'group', label: 'Group', render: (r) => `<span class="font-bold">${r.group?.name || '-'}</span>` },
      { key: 'period', label: 'Period', render: (r) => `<span class="text-xs">${new Date(r.periodStart).toLocaleDateString('en-IN')} → ${new Date(r.periodEnd).toLocaleDateString('en-IN')}</span>` },
      { key: 'status', label: 'Status', class: 'text-center', render: (r) => statusBadge(r.status) },
      { key: 'gross', label: 'Gross', class: 'text-right font-mono', render: (r) => `₹${(r.totalGross || 0).toLocaleString()}` },
      { key: 'trip', label: 'Trip Earnings', class: 'text-right font-mono text-blue-600 dark:text-blue-400', render: (r) => `₹${(r.totalTrip || 0).toLocaleString()}` },
      { key: 'net', label: 'Net Payable', class: 'text-right font-mono font-black text-brand-600 dark:text-brand-400', render: (r) => `₹${(r.totalNet || 0).toLocaleString()}` },
      { key: 'actions', label: '', class: 'text-right', render: (r) => `
        <button onclick="BillingModule.viewBill('${r._id}')" class="p-2 text-surface-400 hover:text-blue-500 transition-colors" title="View">👁️</button>
        ${r.status !== 'paid' ? `<button onclick="BillingModule.markPaid('${r._id}')" class="p-2 text-surface-400 hover:text-brand-500 transition-colors" title="Mark Paid">✅</button>` : ''}
        <button onclick="BillingModule.deleteBill('${r._id}')" class="p-2 text-surface-400 hover:text-rose-500 transition-colors" title="Delete">🗑️</button>
      `}
    ];
    document.getElementById('table-container').innerHTML = Components.DataTable({ id: 'bills-table', columns, data, loading, emptyMessage: 'No bills generated yet.' });
  },

  renderPagination({ total, page, limit }) {
    document.getElementById('pagination-container').innerHTML = Components.Pagination({
      currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total, limit, onPageChangeName: 'BillingModule.changePage'
    });
  },

  setupGenerateModal() {
    const groupOpts = this.groups.map(g => `<option value="${g._id}">${g.name}</option>`).join('');
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const html = `
      <form id="bill-form" onsubmit="BillingModule.submitGenerate(event)" class="flex flex-col gap-4">
        <div>
          <label class="block text-xs font-bold text-surface-500 mb-1">Select Group</label>
          <select name="groupId" required class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
            <option value="">Select...</option>${groupOpts}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Period Start</label>
            <input type="date" name="periodStart" value="${firstDay}" required class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Period End</label>
            <input type="date" name="periodEnd" value="${lastDay}" required class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          </div>
        </div>
        <p class="text-xs text-surface-400 bg-surface-50 dark:bg-surface-950 p-3 rounded-xl border border-surface-200 dark:border-surface-800">
          ℹ️ Trip earnings from helpers/drivers in this period will be automatically included in each worker's bill.
        </p>
        <button type="submit" class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/30">Generate Bill</button>
      </form>
    `;
    document.getElementById('generate-modal-wrap').innerHTML = Components.Modal({ id: 'generate-modal', title: 'Generate New Bill', contentHtml: html });
  },

  openGenerateModal() {
    document.getElementById('bill-form')?.reset();
    Components.openModal('generate-modal');
  },

  async submitGenerate(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const res = await apiFetch('/billing/generate', {
        method: 'POST',
        body: JSON.stringify({ groupId: fd.get('groupId'), periodStart: fd.get('periodStart'), periodEnd: fd.get('periodEnd') })
      });
      showToast('Bill generated successfully!');
      Components.closeModal('generate-modal');
      this.loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async viewBill(id) {
    try {
      const res = await apiFetch(`/billing/${id}`);
      const bill = res.data;
      const lineItemRows = (bill.lineItems || []).map(li => `
        <tr class="border-b border-surface-100 dark:border-surface-800">
          <td class="p-3 font-bold">${li.labour?.name || '-'}</td>
          <td class="p-3 text-right font-mono">${li.attendanceDays || 0}d</td>
          <td class="p-3 text-right font-mono">₹${(li.productionShare || 0).toLocaleString()}</td>
          <td class="p-3 text-right font-mono text-blue-600 dark:text-blue-400">₹${(li.tripEarnings || 0).toLocaleString()}</td>
          <td class="p-3 text-right font-mono font-black text-brand-600 dark:text-brand-400">₹${(li.totalGross || 0).toLocaleString()}</td>
        </tr>
      `).join('');

      const detailHtml = `
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><span class="text-surface-400">Group:</span> <strong>${bill.group?.name}</strong></div>
            <div><span class="text-surface-400">Period:</span> <strong>${new Date(bill.periodStart).toLocaleDateString('en-IN')} → ${new Date(bill.periodEnd).toLocaleDateString('en-IN')}</strong></div>
            <div><span class="text-surface-400">Status:</span> <strong class="capitalize">${bill.status}</strong></div>
            <div><span class="text-surface-400">Net Payable:</span> <strong class="text-brand-600 text-lg">₹${(bill.totalNet || 0).toLocaleString()}</strong></div>
          </div>
          <div class="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700">
            <table class="w-full text-sm">
              <thead class="bg-surface-50 dark:bg-surface-800">
                <tr>
                  <th class="p-3 text-left">Worker</th>
                  <th class="p-3 text-right">Attendance</th>
                  <th class="p-3 text-right">Prod. Share</th>
                  <th class="p-3 text-right">Trip Earning</th>
                  <th class="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>${lineItemRows}</tbody>
            </table>
          </div>
        </div>
      `;
      document.getElementById('bill-detail-modal-wrap').innerHTML = Components.Modal({ id: 'bill-detail-modal', title: 'Bill Details', contentHtml: detailHtml, maxWidth: 'max-w-3xl' });
      Components.openModal('bill-detail-modal');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async markPaid(id) {
    try {
      await apiFetch(`/billing/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'paid' }) });
      showToast('Bill marked as paid!');
      this.loadData();
    } catch (err) { showToast(err.message, 'error'); }
  },

  async deleteBill(id) {
    if (!confirm('Delete this bill permanently?')) return;
    try {
      await apiFetch(`/billing/${id}`, { method: 'DELETE' });
      showToast('Bill deleted.');
      this.loadData();
    } catch (err) { showToast(err.message, 'error'); }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => BillingModule.init(), 100);
});
