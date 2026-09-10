'use strict';

const ProductionModule = {
  currentPage: 1,
  limit: 10,
  filters: {},
  formData: null,

  async init() {
    const content = document.getElementById('page-content');
    const tpl = document.getElementById('page-template').content.cloneNode(true);
    content.appendChild(tpl);

    document.getElementById('prod-date-filter').valueAsDate = new Date();
    await this.loadData();
    await this.loadFormData();
    this.setupModals();
    this.setupImportModal();
  },

  async loadFormData() {
    try {
      const dateVal = document.getElementById('prod-date-filter').value;
      const res = await apiFetch(`/production/daily-form?date=${dateVal || new Date().toISOString().split('T')[0]}`);
      this.formData = res.data;
    } catch (err) {
      showToast('Could not load form data.', 'error');
    }
  },

  async loadData() {
    this.renderTable(null, true);
    try {
      const qs = new URLSearchParams({ page: this.currentPage, limit: this.limit, ...this.filters });
      const res = await apiFetch(`/production?${qs}`);
      this.renderTable(res.data.production, false);
      this.renderPagination(res.data);
    } catch (err) {
      showToast(err.message, 'error');
      this.renderTable([], false);
    }
  },

  applyFilter() {
    const date = document.getElementById('prod-date-filter').value;
    if (date) this.filters.date = date;
    this.currentPage = 1;
    this.loadData();
  },

  clearFilter() {
    this.filters = {};
    document.getElementById('prod-date-filter').value = '';
    this.loadData();
  },

  changePage(page) { this.currentPage = page; this.loadData(); },

  renderTable(data, loading) {
    const columns = [
      { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString('en-IN') },
      { key: 'group', label: 'Group', render: (r) => `<span class="font-bold">${r.group?.name || '-'}</span>` },
      { key: 'shift', label: 'Shift', render: (r) => `<span class="capitalize px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">${r.shift || 'full'}</span>` },
      { key: 'bricks', label: 'Bricks', class: 'text-right font-mono font-bold', render: (r) => `${r.totalBricks?.toLocaleString()}` },
      { key: 'rate', label: 'Rate', class: 'text-right font-mono text-surface-500', render: (r) => `₹${r.ratePerBrick}` },
      { key: 'total', label: 'Total Amt', class: 'text-right font-mono font-bold text-brand-600 dark:text-brand-400', render: (r) => `₹${r.totalAmount?.toLocaleString()}` },
      { key: 'actions', label: '', class: 'text-right', render: (r) => `
        <button onclick="ProductionModule.deleteRecord('${r._id}')" class="p-2 text-surface-400 hover:text-rose-500 transition-colors" title="Delete">🗑️</button>
      `}
    ];
    document.getElementById('table-container').innerHTML = Components.DataTable({ id: 'prod-table', columns, data, loading });
  },

  renderPagination({ total, page, limit }) {
    document.getElementById('pagination-container').innerHTML = Components.Pagination({
      currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total, limit, onPageChangeName: 'ProductionModule.changePage'
    });
  },

  setupModals() {
    if (!this.formData) return;
    const { groups, inventoryItems } = this.formData;

    const groupOpts = groups.map(g => `<option value="${g._id}" data-rate="${g.ratePerBrick}">${g.name} (₹${g.ratePerBrick}/brick) — ${g.presentCount} present</option>`).join('');
    const matRows = inventoryItems.map(item => `
      <div class="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-950 rounded-xl">
        <div class="flex-1">
          <div class="text-sm font-bold">${item.name} <span class="text-xs text-surface-400">(${item.currentStock} ${item.unit} in stock)</span></div>
          ${item.isOptional ? '<span class="text-[10px] text-surface-400 uppercase tracking-wider">Optional</span>' : ''}
        </div>
        <input type="number" step="0.01" min="0" name="mat_${item._id}" placeholder="Qty used" class="w-28 px-3 py-1.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-right">
        <span class="text-xs text-surface-400 w-8">${item.unit}</span>
      </div>
    `).join('');

    const modalHtml = `
      <form id="prod-form" onsubmit="ProductionModule.submitProduction(event)" class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Date</label>
            <input type="date" name="date" required class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Group</label>
            <select name="group" required onchange="ProductionModule.updateRate(this)" class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
              <option value="">Select Group</option>
              ${groupOpts}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Shift</label>
            <select name="shift" class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
              <option value="full">Full Day</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Total Bricks Molded</label>
            <input type="number" name="totalBricks" required min="1" oninput="ProductionModule.calcPreview()" class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          </div>
        </div>

        <!-- Preview -->
        <div class="p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl flex justify-between items-center">
          <span class="text-sm text-brand-700 dark:text-brand-400 font-bold">Estimated Total Payout:</span>
          <span id="prod-preview" class="text-lg font-black text-brand-700 dark:text-brand-400">₹0</span>
        </div>

        <!-- Material Consumption -->
        ${inventoryItems.length > 0 ? `
        <div>
          <h4 class="text-sm font-bold text-surface-500 mb-2">Material Consumption (Optional)</h4>
          <div class="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">${matRows}</div>
        </div>` : ''}

        <button type="submit" class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/30">Save Production Record</button>
      </form>
    `;

    document.getElementById('entry-modal-wrap').innerHTML = Components.Modal({ id: 'entry-modal', title: 'Log Daily Production', contentHtml: modalHtml, maxWidth: 'max-w-2xl' });
  },

  updateRate(sel) {
    const rate = sel.options[sel.selectedIndex]?.dataset?.rate || 0;
    ProductionModule._currentRate = parseFloat(rate);
    ProductionModule.calcPreview();
  },

  calcPreview() {
    const bricks = parseInt(document.querySelector('input[name="totalBricks"]')?.value || 0);
    const rate = this._currentRate || 0;
    const el = document.getElementById('prod-preview');
    if (el) el.textContent = `₹${(bricks * rate).toLocaleString()}`;
  },

  openEntryModal() {
    document.getElementById('prod-form')?.reset();
    const dateInput = document.querySelector('#entry-modal input[name="date"]');
    if (dateInput) dateInput.valueAsDate = new Date();
    const previewEl = document.getElementById('prod-preview');
    if (previewEl) previewEl.textContent = '₹0';
    Components.openModal('entry-modal');
  },

  async submitProduction(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      date: fd.get('date'),
      group: fd.get('group'),
      shift: fd.get('shift'),
      totalBricks: parseInt(fd.get('totalBricks')),
      materialConsumption: []
    };

    if (this.formData?.inventoryItems) {
      this.formData.inventoryItems.forEach(item => {
        const qty = parseFloat(fd.get(`mat_${item._id}`) || 0);
        if (qty > 0) data.materialConsumption.push({ inventoryItem: item._id, quantity: qty });
      });
    }

    try {
      await apiFetch('/production', { method: 'POST', body: JSON.stringify(data) });
      showToast('Production record saved!');
      Components.closeModal('entry-modal');
      this.loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async deleteRecord(id) {
    if (!confirm('Delete this production record? This cannot be undone.')) return;
    try {
      await apiFetch(`/production/${id}`, { method: 'DELETE' });
      showToast('Record deleted.');
      this.loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  setupImportModal() {
    document.getElementById('import-modal-wrap').innerHTML = Components.ImportModal({
      entityName: 'Production',
      uploadFuncName: 'ProductionModule.submitImport'
    });
  },
  openImportModal() { Components.openModal('import-Production-modal'); },

  async submitImport(e) {
    e.preventDefault();
    const file = document.getElementById('import-Production-modal-file').files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await apiFetch('/production/import', { method: 'POST', body: fd });
      showToast(res.message || 'Import complete.');
      Components.closeModal('import-Production-modal');
      this.loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => ProductionModule.init(), 100);
});
