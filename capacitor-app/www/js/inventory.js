'use strict';

const InventoryModule = {
  currentTab: 'catalog',
  catalogPage: 1,
  inwardPage: 1,
  limit: 10,
  inventoryItems: [],
  catalogQuery: '',
  inwardQuery: '',
  inwardStartDate: '',
  inwardEndDate: '',

  async init() {
    const content = document.getElementById('page-content');
    const template = document.getElementById('page-template').content.cloneNode(true);
    content.appendChild(template);

    await this.loadCatalog();
    this.renderCatalogFilter();
    this.renderInwardFilter();
    this.setupModals();
  },

  switchTab(tab) {
    this.currentTab = tab;
    
    document.getElementById('tab-catalog').className = 'px-4 py-3 font-bold border-b-2 ' + (tab === 'catalog' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300');
    document.getElementById('tab-inward').className = 'px-4 py-3 font-bold border-b-2 ' + (tab === 'inward' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300');
    
    document.getElementById('view-catalog').classList.toggle('hidden', tab !== 'catalog');
    document.getElementById('view-inward').classList.toggle('hidden', tab !== 'inward');

    if (tab === 'catalog') this.loadCatalog();
    if (tab === 'inward') this.loadInward();
  },

  async loadCatalog() {
    this.renderCatalogTable(null, true);
    try {
      const qs = new URLSearchParams({ page: this.catalogPage, limit: this.limit });
      if (this.catalogQuery) qs.append('q', this.catalogQuery);
      
      const res = await apiFetch(`/inventory?${qs}`);
      this.inventoryItems = res.data.items; // save for inward dropdown
      this.renderCatalogTable(res.data.items, false);
      this.renderCatalogPagination(res.data);
      this.updateStats(res.data);
    } catch (err) {
      showToast(err.message, 'error');
      this.renderCatalogTable([], false);
    }
  },

  async loadInward() {
    this.renderInwardTable(null, true);
    try {
      const qs = new URLSearchParams({ page: this.inwardPage, limit: this.limit });
      if (this.inwardQuery) qs.append('q', this.inwardQuery);
      if (this.inwardStartDate) qs.append('startDate', this.inwardStartDate);
      if (this.inwardEndDate) qs.append('endDate', this.inwardEndDate);
      
      const res = await apiFetch(`/material-inward?${qs}`);
      this.renderInwardTable(res.data.records, false);
      this.renderInwardPagination(res.data);
    } catch (err) {
      showToast(err.message, 'error');
      this.renderInwardTable([], false);
    }
  },

  updateStats(data) {
    const container = document.getElementById('stats-container');
    const totalItems = data.total;
    const lowStock = data.lowStockCount;
    const rawMaterials = data.items ? data.items.filter(i => i.category === 'raw-material').length : 0;

    container.innerHTML = `
      ${Components.StatCard({ title: 'Total Items', value: totalItems, icon: '📦', color: 'blue' })}
      ${Components.StatCard({ title: 'Low Stock Alerts', value: lowStock, icon: '⚠️', color: lowStock > 0 ? 'rose' : 'slate' })}
      ${Components.StatCard({ title: 'Raw Materials', value: rawMaterials, icon: '🪨', color: 'slate' })}
    `;
  },

  // ---- CATALOG RENDERING ----
  renderCatalogFilter() {
    document.getElementById('catalog-filter-container').innerHTML = Components.FilterBar({
      searchPlaceholder: 'Search materials...',
      onSearchName: 'InventoryModule.onCatalogSearch',
      onDateFilterName: 'InventoryModule.onCatalogDateFilter',
      onExportName: 'InventoryModule.exportCatalog'
    });
  },
  onCatalogSearch(val) { InventoryModule.catalogQuery = val; InventoryModule.catalogPage = 1; InventoryModule.loadCatalog(); },
  onCatalogDateFilter() {
    // Inventory usually doesn't need date filters for current stock, but added for consistency
    InventoryModule.loadCatalog(); 
  },
  exportCatalog() {
    window.open(API_BASE_URL + '/inventory?limit=1000&export=csv' + (InventoryModule.catalogQuery ? '&q=' + InventoryModule.catalogQuery : ''));
  },

  renderCatalogTable(data, loading) {
    const container = document.getElementById('catalog-table-container');
    const columns = [
      { key: 'name', label: 'Material Name', render: (item) => `
        <div class="flex items-center gap-2">
          <span class="font-bold ${item.isLowStock ? 'text-rose-600 dark:text-rose-400' : ''}">${item.name}</span>
          ${item.isLowStock ? '<span class="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 font-bold uppercase tracking-wider">Low Stock</span>' : ''}
        </div>
      `},
      { key: 'category', label: 'Category', render: (item) => `<span class="capitalize text-xs">${item.category.replace('-', ' ')}</span>` },
      { key: 'currentStock', label: 'Current Stock', class: 'text-right', render: (item) => `
        <span class="font-mono font-bold text-lg ${item.isLowStock ? 'text-rose-600 dark:text-rose-400' : ''}">
          ${(item.currentStock || 0).toLocaleString()} <span class="text-sm font-normal text-surface-500">${item.unit}</span>
        </span>
      `},
      { key: 'minStockLevel', label: 'Min Level', class: 'text-right text-surface-500', render: (item) => `${item.minStockLevel || 0}` },
      { key: 'lastUnitCost', label: 'Last Cost', class: 'text-right font-mono', render: (item) => `₹${item.lastUnitCost || 0}` },
      { key: 'status', label: 'Status', class: 'text-center', render: (item) => `
        <button onclick="InventoryModule.toggleActive('${item._id}')" class="px-2 py-1 rounded text-xs font-bold ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-500'}">
          ${item.isActive ? 'Active' : 'Inactive'}
        </button>
      `},
    ];
    container.innerHTML = Components.DataTable({ id: 'catalog-table', columns, data, loading });
  },

  renderCatalogPagination({ total, page, limit }) {
    document.getElementById('catalog-pagination').innerHTML = Components.Pagination({
      currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total, limit, onPageChangeName: 'InventoryModule.changeCatalogPage'
    });
  },
  changeCatalogPage(page) { this.catalogPage = page; this.loadCatalog(); },

  // ---- INWARD RENDERING ----
  renderInwardFilter() {
    document.getElementById('inward-filter-container').innerHTML = Components.FilterBar({
      searchPlaceholder: 'Search by vendor, vehicle, invoice...',
      onSearchName: 'InventoryModule.onInwardSearch',
      onDateFilterName: 'InventoryModule.onInwardDateFilter',
      onExportName: 'InventoryModule.exportInward'
    });
  },
  onInwardSearch(val) { InventoryModule.inwardQuery = val; InventoryModule.inwardPage = 1; InventoryModule.loadInward(); },
  onInwardDateFilter() {
    const parent = document.getElementById('inward-filter-container');
    InventoryModule.inwardStartDate = parent.querySelector('#filter-start-date').value;
    InventoryModule.inwardEndDate = parent.querySelector('#filter-end-date').value;
    InventoryModule.inwardPage = 1;
    InventoryModule.loadInward();
  },
  exportInward() {
    let url = API_BASE_URL + '/material-inward?limit=1000&export=csv';
    if (InventoryModule.inwardQuery) url += '&q=' + InventoryModule.inwardQuery;
    if (InventoryModule.inwardStartDate) url += '&startDate=' + InventoryModule.inwardStartDate;
    if (InventoryModule.inwardEndDate) url += '&endDate=' + InventoryModule.inwardEndDate;
    window.open(url);
  },

  renderInwardTable(data, loading) {
    const container = document.getElementById('inward-table-container');
    const columns = [
      { key: 'date', label: 'Date', render: (item) => new Date(item.date).toLocaleDateString() },
      { key: 'item', label: 'Material', render: (item) => `<span class="font-bold">${item.inventoryItem?.name || '-'}</span>` },
      { key: 'quantity', label: 'Quantity', class: 'text-right font-mono font-bold', render: (item) => `${item.quantity} <span class="text-xs text-surface-500">${item.unit}</span>` },
      { key: 'cost', label: 'Unit Cost', class: 'text-right font-mono', render: (item) => `₹${item.unitCost || 0}` },
      { key: 'total', label: 'Total Value', class: 'text-right font-mono font-bold text-surface-800 dark:text-brand-400', render: (item) => `₹${item.totalCost || 0}` },
      { key: 'vendor', label: 'Vendor / Driver', render: (item) => `
        <div class="flex flex-col text-xs">
          <span class="font-semibold">${item.vendorName || '-'}</span>
          <span class="text-surface-500">${item.driverName || '-'} / ${item.vehicleNumber || '-'}</span>
        </div>
      `},
      { key: 'actions', label: '', class: 'text-right', render: (item) => `
        <button onclick="InventoryModule.deleteInward('${item._id}')" class="p-2 text-surface-400 hover:text-rose-500 transition-colors" title="Delete">🗑️</button>
      `}
    ];
    container.innerHTML = Components.DataTable({ id: 'inward-table', columns, data, loading, emptyMessage: 'No inward receipts recorded yet.' });
  },

  renderInwardPagination({ total, page, limit }) {
    document.getElementById('inward-pagination').innerHTML = Components.Pagination({
      currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total, limit, onPageChangeName: 'InventoryModule.changeInwardPage'
    });
  },
  changeInwardPage(page) { this.inwardPage = page; this.loadInward(); },

  // ---- ACTIONS & MODALS ----
  setupModals() {
    // New Material Modal
    const itemHtml = `
      <form id="item-form" onsubmit="InventoryModule.submitItem(event)" class="flex flex-col gap-4">
        <div>
          <label class="block text-xs font-bold text-surface-500 mb-1">Material Name</label>
          <input type="text" name="name" required class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Unit</label>
            <select name="unit" required class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
              <option value="tons">Tons</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="bags">Bags</option>
              <option value="liters">Liters</option>
              <option value="units">Units / Pieces</option>
              <option value="m³">Cubic Meters (m³)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Category</label>
            <select name="category" class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
              <option value="raw-material">Raw Material</option>
              <option value="additive">Additive</option>
              <option value="fuel">Fuel</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Min Stock Alert Level</label>
            <input type="number" name="minStockLevel" value="0" min="0" class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          </div>
          <div class="flex items-center pt-5">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isOptional" class="w-4 h-4 text-brand-600 rounded">
              <span class="text-sm font-semibold">Optional in Production</span>
            </label>
          </div>
        </div>
        <button type="submit" class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/30 mt-2">Save Material</button>
      </form>
    `;
    document.getElementById('item-modal-container').innerHTML = Components.Modal({ id: 'item-modal', title: 'Add New Material', contentHtml: itemHtml });
  },

  renderInwardModal() {
    const inwardHtml = `
      <form id="inward-form" onsubmit="InventoryModule.submitInward(event)" class="flex flex-col gap-4">
        
        <!-- Global Form Fields -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Date</label>
            <input type="date" name="globalDate" required class="w-full px-3 py-2 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Vendor Name (Optional)</label>
            <input type="text" name="globalVendor" class="w-full px-3 py-2 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Vehicle No. (Optional)</label>
            <input type="text" name="globalVehicle" class="w-full px-3 py-2 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm uppercase">
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Invoice No. (Optional)</label>
            <input type="text" name="globalInvoice" class="w-full px-3 py-2 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          </div>
        </div>

        <!-- Dynamic Rows Container -->
        <div class="flex flex-col gap-3">
          <div class="flex justify-between items-center px-1">
            <h4 class="font-bold text-sm text-surface-700 dark:text-surface-300">Materials Received</h4>
            <button type="button" onclick="InventoryModule.addInwardRow()" class="text-xs px-3 py-1.5 bg-surface-200 dark:bg-surface-800 hover:bg-surface-300 dark:hover:bg-surface-700 rounded-lg font-bold transition-colors text-surface-700 dark:text-surface-300 flex items-center gap-1">
              <span>+</span> Add Material
            </button>
          </div>
          <div id="inward-rows-container" class="flex flex-col gap-2">
            <!-- Rows injected here -->
          </div>
        </div>

        <button type="submit" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 mt-4">Record Inward (Bulk Entry)</button>
      </form>
    `;
    document.getElementById('inward-modal-container').innerHTML = Components.Modal({ id: 'inward-modal', title: 'Mega Form: Bulk Material Receipt', contentHtml: inwardHtml, maxWidth: 'max-w-4xl' });
  },

  getMaterialOptionsHTML() {
    return this.inventoryItems.map(i => `<option value="${i._id}">${i.name} (${i.unit})</option>`).join('');
  },

  addInwardRow() {
    const container = document.getElementById('inward-rows-container');
    const rowId = 'row-' + Date.now() + Math.random().toString(36).substr(2, 5);
    const options = this.getMaterialOptionsHTML();
    
    const rowHtml = `
      <div id="${rowId}" class="inward-row flex flex-col md:flex-row gap-3 items-start md:items-end p-3 bg-surface-50 dark:bg-surface-900/50 rounded-lg border border-surface-200 dark:border-surface-800">
        <div class="flex-1 w-full md:w-auto">
          <label class="block text-[10px] font-bold text-surface-500 mb-1 uppercase tracking-wider">Material *</label>
          <select name="inventoryItem[]" required class="w-full px-3 py-2 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
            <option value="">Select...</option>
            ${options}
          </select>
        </div>
        <div class="w-full md:w-32">
          <label class="block text-[10px] font-bold text-surface-500 mb-1 uppercase tracking-wider">Quantity *</label>
          <input type="number" step="0.01" name="quantity[]" required min="0.01" class="w-full px-3 py-2 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
        </div>
        <div class="w-full md:w-32">
          <label class="block text-[10px] font-bold text-surface-500 mb-1 uppercase tracking-wider">Cost/Unit (Opt)</label>
          <input type="number" step="0.01" name="unitCost[]" value="0" min="0" class="w-full px-3 py-2 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
        </div>
        <button type="button" onclick="InventoryModule.removeInwardRow('${rowId}')" class="w-full md:w-auto px-3 py-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors font-bold text-sm" title="Remove Row">
          🗑️
        </button>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
  },

  removeInwardRow(rowId) {
    const row = document.getElementById(rowId);
    if (row && document.querySelectorAll('.inward-row').length > 1) {
      row.remove();
    } else {
      showToast('You must have at least one material row.', 'warning');
    }
  },

  openItemModal() {
    document.getElementById('item-form').reset();
    Components.openModal('item-modal');
  },

  async openMaterialInwardModal() {
    if (this.inventoryItems.length === 0) {
      // Refresh items just in case
      const res = await apiFetch('/inventory?limit=100');
      this.inventoryItems = res.data.items;
    }
    if (this.inventoryItems.length === 0) {
      showToast('Please add materials to the catalog first.', 'warning');
      return;
    }
    this.renderInwardModal();
    document.querySelector('input[name="globalDate"]').valueAsDate = new Date();
    this.addInwardRow(); // Add first row default
    Components.openModal('inward-modal');
  },

  async submitItem(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.isOptional = !!data.isOptional;
    try {
      await apiFetch('/inventory', { method: 'POST', body: JSON.stringify(data) });
      showToast('Material added to catalog.');
      Components.closeModal('item-modal');
      this.loadCatalog();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async submitInward(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    // Parse global fields
    const globalDate = fd.get('globalDate');
    const globalVendor = fd.get('globalVendor');
    const globalVehicle = fd.get('globalVehicle');
    const globalInvoice = fd.get('globalInvoice');
    
    // Parse dynamic array fields
    const items = fd.getAll('inventoryItem[]');
    const quantities = fd.getAll('quantity[]');
    const unitCosts = fd.getAll('unitCost[]');
    
    const records = [];
    for(let i = 0; i < items.length; i++) {
      if(!items[i]) continue;
      records.push({
        date: globalDate,
        vendorName: globalVendor,
        vehicleNumber: globalVehicle,
        invoiceNumber: globalInvoice,
        inventoryItem: items[i],
        quantity: quantities[i],
        unitCost: unitCosts[i] || 0
      });
    }
    
    if (records.length === 0) {
      showToast('Please add at least one material.', 'error');
      return;
    }

    try {
      await apiFetch('/material-inward/bulk', { method: 'POST', body: JSON.stringify({ records }) });
      showToast('Bulk material inward recorded successfully.');
      Components.closeModal('inward-modal');
      this.loadInward();
      if (this.currentTab === 'catalog') this.loadCatalog(); // refresh stock
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async toggleActive(id) {
    try {
      await apiFetch(`/inventory/${id}/toggle`, { method: 'PATCH' });
      showToast('Material status updated.');
      this.loadCatalog();
    } catch (err) { showToast(err.message, 'error'); }
  },

  async deleteInward(id) {
    if (!confirm('Delete inward record? This will decrement the inventory stock by the received quantity.')) return;
    try {
      await apiFetch(`/material-inward/${id}`, { method: 'DELETE' });
      showToast('Record deleted & stock updated.');
      this.loadInward();
    } catch (err) { showToast(err.message, 'error'); }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => InventoryModule.init(), 100);
});
