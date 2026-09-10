'use strict';

/**
 * Fleet Deliveries Module Frontend Controller
 * Complete trip logging with 2,000 bricks/trip auto-calc, registered driver auto-fill,
 * and up to 5 loading/unloading helpers (pickup & pickdown).
 */
const FleetModule = {
  trips: [],
  drivers: [],
  labours: [],
  currentHelpers: [], // Array of helper rows { labourRef, name, role, costPerTrip }
  currentPage: 1,
  limit: 10,
  currentFilters: { search: '', startDate: '', endDate: '' },

  async init() {
    const content = document.getElementById('page-content');
    const tpl = document.getElementById('page-template')?.content.cloneNode(true);
    if (content && tpl) content.appendChild(tpl);

    await Promise.all([this.loadDrivers(), this.loadLabours()]);
    this.renderFilterBar();
    this.setupModals();
    await this.loadData();
  },

  async loadDrivers() {
    try {
      const res = await apiRequest('/drivers?limit=100');
      this.drivers = res.data?.drivers || [];
    } catch (e) {
      console.warn('Could not load drivers:', e);
    }
  },

  async loadLabours() {
    try {
      const res = await apiRequest('/labours?limit=200');
      this.labours = res.data?.labours || [];
    } catch (e) {
      console.warn('Could not load labours:', e);
    }
  },

  async loadData() {
    try {
      const query = new URLSearchParams({
        page: this.currentPage,
        limit: this.limit,
        search: this.currentFilters.search,
        startDate: this.currentFilters.startDate,
        endDate: this.currentFilters.endDate,
        sort: '-date'
      });

      this.renderTable([], true);
      const res = await apiRequest(`/trips?${query}`);
      const data = res.data || {};
      this.trips = data.trips || [];

      this.renderStats(this.trips);
      this.renderTable(this.trips, false);
      this.renderPagination({ total: data.total || 0, page: data.page || 1, limit: data.limit || 10 });
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to load trips.', 'error');
      this.renderTable([], false);
    }
  },

  renderStats(trips) {
    const container = document.getElementById('stats-container');
    if (!container) return;

    const totalTrips = trips.reduce((acc, t) => acc + (t.tripsCount || 0), 0);
    const totalBricks = trips.reduce((acc, t) => acc + (t.bricksDelivered || 0), 0);
    const totalCost = trips.reduce((acc, t) => acc + (t.grandTotal || 0), 0);
    const activeDestinations = new Set(trips.map(t => t.villageName || t.destination).filter(Boolean)).size;

    container.innerHTML = `
      ${Components.StatsCard({ title: 'Total Deliveries', value: totalTrips, icon: '🚛' })}
      ${Components.StatsCard({ title: 'Bricks Delivered', value: totalBricks.toLocaleString(), icon: '🧱' })}
      ${Components.StatsCard({ title: 'Total Fleet Cost', value: `₹${totalCost.toLocaleString()}`, icon: '💸' })}
      ${Components.StatsCard({ title: 'Destinations', value: activeDestinations, icon: '📍' })}
    `;
  },

  renderFilterBar() {
    const container = document.getElementById('filter-container');
    if (!container) return;
    container.innerHTML = Components.FilterBar({
      searchPlaceholder: 'Search customer, village, or driver...',
      onSearchName: 'FleetModule.handleSearch',
      onDateFilterName: 'FleetModule.handleDateFilter'
    });
  },

  handleSearch(query) {
    FleetModule.currentFilters.search = query;
    FleetModule.currentPage = 1;
    FleetModule.loadData();
  },

  handleDateFilter() {
    const start = document.getElementById('filter-start-date')?.value;
    const end = document.getElementById('filter-end-date')?.value;
    FleetModule.currentFilters.startDate = start || '';
    FleetModule.currentFilters.endDate = end || '';
    FleetModule.currentPage = 1;
    FleetModule.loadData();
  },

  changePage(page) {
    this.currentPage = page;
    this.loadData();
  },

  renderTable(data, loading) {
    const container = document.getElementById('table-container');
    if (!container) return;

    const columns = [
      { key: 'date', label: 'Date', render: (item) => new Date(item.date).toLocaleDateString() },
      {
        key: 'destination',
        label: 'Customer & Site',
        render: (item) => `
          <div class="flex flex-col">
            <span class="font-bold text-surface-900 dark:text-white">${item.customerName || 'Direct Site'}</span>
            <span class="text-xs text-surface-400">📍 ${item.villageName || item.destination}</span>
          </div>
        `
      },
      {
        key: 'driver',
        label: 'Driver & Vehicle',
        render: (item) => `
          <div class="flex flex-col">
            <span class="font-bold text-brand-600 dark:text-brand-400">${item.driver?.name || 'Manual Driver'}</span>
            <span class="text-[11px] font-mono text-surface-400">${item.driver?.vehicleNumber || 'No vehicle'}</span>
          </div>
        `
      },
      {
        key: 'bricks',
        label: 'Bricks',
        class: 'text-right',
        render: (item) => `<span class="font-black text-surface-900 dark:text-white">${(item.bricksDelivered || 0).toLocaleString()}</span>`
      },
      {
        key: 'trips',
        label: 'Trips',
        class: 'text-center',
        render: (item) => `<span class="px-2.5 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold">${item.tripsCount}</span>`
      },
      {
        key: 'helpers',
        label: 'Loading Helpers',
        render: (item) => {
          const helpers = item.helpers || [];
          if (helpers.length === 0) return '<span class="text-surface-400 text-xs">—</span>';
          return `
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">👥 ${helpers.length} Helper${helpers.length > 1 ? 's' : ''}</span>
              <span class="text-[10px] text-surface-400">₹${item.totalHelperCost || 0} total</span>
            </div>
          `;
        }
      },
      {
        key: 'cost',
        label: 'Grand Total',
        class: 'text-right',
        render: (item) => `<span class="font-mono font-black text-brand-600 dark:text-brand-400">₹${Number(item.grandTotal || 0).toLocaleString()}</span>`
      },
      {
        key: 'actions',
        label: '',
        class: 'text-right',
        render: (item) => `
          <button onclick="FleetModule.deleteTrip('${item._id}')" class="p-2 text-surface-400 hover:text-rose-500 transition-colors" title="Delete Trip">🗑️</button>
        `
      }
    ];

    container.innerHTML = Components.DataTable({
      id: 'fleet-table',
      columns,
      data,
      loading,
      emptyMessage: 'No trips recorded yet. Click "+ New Trip" above.'
    });
  },

  renderPagination({ total, page, limit }) {
    const container = document.getElementById('pagination-container');
    if (!container) return;
    const totalPages = Math.ceil(total / limit) || 1;
    container.innerHTML = Components.Pagination({
      currentPage: page,
      totalPages,
      totalItems: total,
      limit,
      onPageChangeName: 'FleetModule.changePage'
    });
  },

  setupModals() {
    // Import Modal
    const importContainer = document.getElementById('import-modal-container');
    if (importContainer) {
      importContainer.innerHTML = Components.ImportModal({
        entityName: 'Trips',
        uploadFuncName: 'FleetModule.submitImport'
      });
    }

    this.renderTripModalHtml();
  },

  renderTripModalHtml() {
    const driverOptions = this.drivers.map(d => 
      `<option value="${d._id}" data-name="${d.name}" data-vehicle="${d.vehicleNumber || ''}" data-rate="${d.defaultTripRate || 500}" data-labour="${d.labourRef?._id || ''}">${d.name} (${d.vehicleNumber || d.vehicleType}) - ₹${d.defaultTripRate}/trip</option>`
    ).join('');

    const labourOptions = this.labours.map(l => 
      `<option value="${l._id}">${l.name} (Labour - ${l.phone || 'No phone'})</option>`
    ).join('');

    const tripHtml = `
      <form id="trip-form" onsubmit="FleetModule.submitTrip(event)" class="flex flex-col gap-4">
        
        <!-- Standard Rate Auto-calculation Banner -->
        <div class="flex items-center justify-between p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-xs">
          <div class="flex items-center gap-2">
            <span class="text-base">⚡</span>
            <span class="font-bold text-brand-500">Standard Truck Capacity: <strong>2,000 Bricks / Trip</strong></span>
          </div>
          <span class="text-[11px] text-surface-400 font-medium">Quantity auto-computes automatically</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Trip Date *</label>
            <input type="date" name="date" id="trip-date" required 
                   class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm font-medium">
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Customer / Client Name *</label>
            <input type="text" name="customerName" id="trip-customer" required placeholder="e.g. Rajesh Dansena"
                   class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-bold text-surface-500 mb-1">Village / Delivery Destination *</label>
            <input type="text" name="villageName" id="trip-village" required placeholder="e.g. Sondka, Kharsia / Site #4"
                   class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Number of Trips *</label>
            <input type="number" name="tripsCount" id="trip-count" required min="1" value="1" 
                   oninput="FleetModule.onTripsCountChange(this.value)"
                   class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm font-black text-brand-500">
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Bricks Delivered (Auto-calculated) *</label>
            <input type="number" name="bricksDelivered" id="trip-bricks" required min="1" value="2000"
                   oninput="FleetModule.onBricksChange(this.value)"
                   class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm font-black">
          </div>
        </div>

        <!-- Driver Section -->
        <div class="p-4 bg-surface-50 dark:bg-surface-950/60 rounded-xl border border-surface-200 dark:border-surface-800">
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-black text-sm text-surface-900 dark:text-white flex items-center gap-2">
              <span>🚚</span> Driver Allocation
            </h4>
            <a href="drivers.html" target="_blank" class="text-xs text-brand-500 font-bold hover:underline">Manage Drivers ↗</a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="md:col-span-3">
              <label class="block text-xs font-bold text-surface-500 mb-1">Select Registered Driver</label>
              <select id="select-registered-driver" onchange="FleetModule.onDriverSelect(this)" 
                      class="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm font-medium">
                <option value="">-- Manual / Walk-in Driver --</option>
                ${driverOptions}
                <optgroup label="Or select from Registered Labours">
                  ${labourOptions}
                </optgroup>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-surface-500 mb-1">Driver Name *</label>
              <input type="text" name="driver.name" id="driver-name" required placeholder="Driver name"
                     class="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-surface-500 mb-1">Vehicle No. *</label>
              <input type="text" name="driver.vehicleNumber" id="driver-vehicle" required placeholder="CG-13-XX-0000"
                     class="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm uppercase">
            </div>
            <div>
              <label class="block text-xs font-bold text-surface-500 mb-1">Rate per Trip (₹) *</label>
              <input type="number" name="ratePerTrip" id="trip-rate" required min="0" value="500"
                     oninput="FleetModule.updateCostPreview()"
                     class="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm font-bold text-brand-500">
            </div>
          </div>
          <input type="hidden" name="driver.labourRef" id="driver-labour-ref" value="">
        </div>

        <!-- Helpers (Loading / Unloading / Pickup & Pickdown) Section -->
        <div class="p-4 bg-surface-50 dark:bg-surface-950/60 rounded-xl border border-surface-200 dark:border-surface-800">
          <div class="flex justify-between items-center mb-3">
            <div>
              <h4 class="font-black text-sm text-surface-900 dark:text-white flex items-center gap-2">
                <span>🤝</span> Loading & Unloading Helpers (Max 5)
              </h4>
              <p class="text-[11px] text-surface-400 mt-0.5">Labours or drivers who assist with pickup and pickdown</p>
            </div>
            <button type="button" onclick="FleetModule.addHelperRow()" 
                    id="add-helper-btn"
                    class="px-3 py-1.5 bg-brand-500/15 hover:bg-brand-500/25 text-brand-500 rounded-lg font-bold text-xs transition-colors">
              ➕ Add Helper
            </button>
          </div>

          <div id="helpers-list-container" class="flex flex-col gap-2.5">
            <!-- Dynamically populated helper rows -->
          </div>
        </div>

        <!-- Live Cost Summary Box -->
        <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-xl flex justify-between items-center text-xs font-bold">
          <div>
            <span class="text-surface-400">Driver Cost:</span> <span id="preview-driver-cost" class="text-surface-800 dark:text-surface-200">₹500</span> ·
            <span class="text-surface-400">Helpers Cost:</span> <span id="preview-helper-cost" class="text-surface-800 dark:text-surface-200">₹0</span>
          </div>
          <div class="text-sm">
            <span class="text-surface-400">Grand Total:</span> <span id="preview-grand-total" class="text-brand-500 font-black">₹500</span>
          </div>
        </div>

        <button type="submit" class="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/30 active:scale-95">
          💾 Save Trip Record
        </button>
      </form>
    `;

    document.getElementById('trip-modal-container').innerHTML = Components.Modal({
      id: 'trip-modal',
      title: 'Record Fleet Delivery Trip',
      contentHtml: tripHtml,
      maxWidth: 'max-w-2xl'
    });
  },

  // 1 Trip = 2,000 Bricks Auto-Calculation
  onTripsCountChange(val) {
    const trips = parseInt(val, 10) || 1;
    const bricksInput = document.getElementById('trip-bricks');
    if (bricksInput) bricksInput.value = trips * 2000;
    this.updateCostPreview();
  },

  onBricksChange(val) {
    const bricks = parseInt(val, 10) || 2000;
    const tripsInput = document.getElementById('trip-count');
    if (tripsInput) tripsInput.value = Math.max(1, Math.ceil(bricks / 2000));
    this.updateCostPreview();
  },

  onDriverSelect(select) {
    const opt = select.selectedOptions[0];
    if (!opt || !select.value) {
      document.getElementById('driver-labour-ref').value = '';
      return;
    }

    const driverNameInput = document.getElementById('driver-name');
    const vehicleInput = document.getElementById('driver-vehicle');
    const rateInput = document.getElementById('trip-rate');
    const labourRefInput = document.getElementById('driver-labour-ref');

    // Check if selected is from registered drivers
    const driver = this.drivers.find(d => d._id === select.value);
    if (driver) {
      if (driverNameInput) driverNameInput.value = driver.name;
      if (vehicleInput) vehicleInput.value = driver.vehicleNumber || '';
      if (rateInput && driver.defaultTripRate) rateInput.value = driver.defaultTripRate;
      if (labourRefInput) labourRefInput.value = driver.labourRef?._id || '';
    } else {
      // Selected from labours
      const labour = this.labours.find(l => l._id === select.value);
      if (labour) {
        if (driverNameInput) driverNameInput.value = labour.name;
        if (labourRefInput) labourRefInput.value = labour._id;
      }
    }

    this.updateCostPreview();
  },

  // Dynamic Helpers (Max 5)
  addHelperRow() {
    if (this.currentHelpers.length >= 5) {
      if (typeof showToast === 'function') showToast('Maximum 5 helpers per trip allowed.', 'warning');
      return;
    }

    this.currentHelpers.push({
      id: Date.now(),
      workerId: '',
      role: 'both',
      costPerTrip: 150
    });

    this.renderHelperRows();
    this.updateCostPreview();
  },

  removeHelperRow(id) {
    this.currentHelpers = this.currentHelpers.filter(h => h.id !== id);
    this.renderHelperRows();
    this.updateCostPreview();
  },

  renderHelperRows() {
    const container = document.getElementById('helpers-list-container');
    if (!container) return;

    if (this.currentHelpers.length === 0) {
      container.innerHTML = `
        <div class="text-center py-3 text-xs text-surface-400 italic">
          No helpers allocated. Click "➕ Add Helper" to record labours who assisted with loading/unloading.
        </div>
      `;
      return;
    }

    const options = `
      <option value="">-- Choose Labour / Driver --</option>
      <optgroup label="Registered Labours">
        ${this.labours.map(l => `<option value="labour:${l._id}">${l.name} (Labour)</option>`).join('')}
      </optgroup>
      <optgroup label="Registered Drivers (going as helper)">
        ${this.drivers.map(d => `<option value="driver:${d._id}">${d.name} (Driver - rate: ₹${d.helperRate || 150})</option>`).join('')}
      </optgroup>
    `;

    container.innerHTML = this.currentHelpers.map((h, idx) => `
      <div class="flex flex-col md:flex-row items-center gap-2 p-2.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl text-xs">
        <span class="font-bold text-surface-400 w-5 text-center">#${idx + 1}</span>
        
        <select onchange="FleetModule.onHelperSelect(${h.id}, this)" class="flex-1 px-2.5 py-1.5 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-xs font-bold">
          ${options}
        </select>

        <select onchange="FleetModule.onHelperRoleChange(${h.id}, this.value)" class="w-32 px-2 py-1.5 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-xs">
          <option value="both" ${h.role === 'both' ? 'selected' : ''}>Load & Unload</option>
          <option value="loading" ${h.role === 'loading' ? 'selected' : ''}>Loading Only</option>
          <option value="unloading" ${h.role === 'unloading' ? 'selected' : ''}>Unloading Only</option>
        </select>

        <div class="flex items-center gap-1">
          <span class="text-surface-400 font-bold">₹</span>
          <input type="number" min="0" value="${h.costPerTrip}" oninput="FleetModule.onHelperRateChange(${h.id}, this.value)"
                 placeholder="Rate" class="w-20 px-2 py-1.5 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-xs font-bold text-center">
          <span class="text-surface-400 text-[10px]">/trip</span>
        </div>

        <button type="button" onclick="FleetModule.removeHelperRow(${h.id})" class="p-1 text-surface-400 hover:text-rose-500" title="Remove Helper">✕</button>
      </div>
    `).join('');

    // Restore selected values
    this.currentHelpers.forEach(h => {
      if (h.workerValue) {
        const row = container.querySelector(`select[onchange*="${h.id}"]`);
        if (row) row.value = h.workerValue;
      }
    });
  },

  onHelperSelect(id, select) {
    const helper = this.currentHelpers.find(h => h.id === id);
    if (!helper) return;

    helper.workerValue = select.value;
    const [type, workerId] = (select.value || '').split(':');

    if (type === 'driver') {
      const d = this.drivers.find(x => x._id === workerId);
      if (d) {
        helper.name = d.name;
        helper.labourRef = d.labourRef?._id || null;
        if (d.helperRate) helper.costPerTrip = d.helperRate;
      }
    } else if (type === 'labour') {
      const l = this.labours.find(x => x._id === workerId);
      if (l) {
        helper.name = l.name;
        helper.labourRef = l._id;
      }
    }

    this.renderHelperRows();
    this.updateCostPreview();
  },

  onHelperRoleChange(id, role) {
    const helper = this.currentHelpers.find(h => h.id === id);
    if (helper) helper.role = role;
  },

  onHelperRateChange(id, val) {
    const helper = this.currentHelpers.find(h => h.id === id);
    if (helper) helper.costPerTrip = parseFloat(val) || 0;
    this.updateCostPreview();
  },

  updateCostPreview() {
    const trips = parseInt(document.getElementById('trip-count')?.value, 10) || 1;
    const driverRate = parseFloat(document.getElementById('trip-rate')?.value) || 0;
    const driverTotal = trips * driverRate;

    const helpersTotal = this.currentHelpers.reduce((acc, h) => acc + (trips * (h.costPerTrip || 0)), 0);
    const grand = driverTotal + helpersTotal;

    const pDriver = document.getElementById('preview-driver-cost');
    const pHelper = document.getElementById('preview-helper-cost');
    const pGrand = document.getElementById('preview-grand-total');

    if (pDriver) pDriver.textContent = `₹${driverTotal.toLocaleString()}`;
    if (pHelper) pHelper.textContent = `₹${helpersTotal.toLocaleString()}`;
    if (pGrand) pGrand.textContent = `₹${grand.toLocaleString()}`;
  },

  openImportModal() { Components.openModal('import-Trips-modal'); },

  openTripModal() {
    this.currentHelpers = [];
    const form = document.getElementById('trip-form');
    if (form) form.reset();
    
    const dateInput = document.getElementById('trip-date');
    if (dateInput) dateInput.valueAsDate = new Date();

    const tripsInput = document.getElementById('trip-count');
    if (tripsInput) tripsInput.value = '1';
    
    const bricksInput = document.getElementById('trip-bricks');
    if (bricksInput) bricksInput.value = '2000';

    this.renderHelperRows();
    this.updateCostPreview();
    Components.openModal('trip-modal');
  },

  async submitTrip(e) {
    e.preventDefault();
    const tripsCount = Number(document.getElementById('trip-count')?.value) || 1;

    // Build helpers payload
    const helpers = this.currentHelpers.map(h => ({
      labourRef: h.labourRef || null,
      name: h.name || 'Helper',
      role: h.role || 'both',
      tripsCount: tripsCount,
      costPerTrip: Number(h.costPerTrip) || 0,
      totalCost: tripsCount * (Number(h.costPerTrip) || 0)
    }));

    const data = {
      date: document.getElementById('trip-date')?.value,
      customerName: document.getElementById('trip-customer')?.value?.trim(),
      villageName: document.getElementById('trip-village')?.value?.trim(),
      destination: document.getElementById('trip-village')?.value?.trim(),
      bricksDelivered: Number(document.getElementById('trip-bricks')?.value) || (tripsCount * 2000),
      tripsCount: tripsCount,
      ratePerTrip: Number(document.getElementById('trip-rate')?.value) || 0,
      driver: {
        labourRef: document.getElementById('driver-labour-ref')?.value || null,
        name: document.getElementById('driver-name')?.value?.trim(),
        vehicleNumber: document.getElementById('driver-vehicle')?.value?.trim().toUpperCase()
      },
      helpers: helpers
    };

    try {
      await apiRequest('/trips', { method: 'POST', body: JSON.stringify(data) });
      if (typeof showToast === 'function') showToast('Trip recorded with helpers successfully!', 'success');
      Components.closeModal('trip-modal');
      await this.loadData();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to save trip.', 'error');
    }
  },

  async submitImport(e) {
    e.preventDefault();
    const file = document.getElementById('import-Trips-modal-file')?.files[0];
    if (!file) return;
    
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await apiRequest('/trips/import', { method: 'POST', body: fd });
      if (typeof showToast === 'function') showToast(res.message || 'Import successful!', 'success');
      Components.closeModal('import-Trips-modal');
      await this.loadData();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to import trips.', 'error');
    }
  },

  async deleteTrip(id) {
    if (!confirm('Are you sure you want to delete this trip record?')) return;
    try {
      await apiRequest(`/trips/${id}`, { method: 'DELETE' });
      if (typeof showToast === 'function') showToast('Trip record deleted.', 'info');
      await this.loadData();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to delete trip.', 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => FleetModule.init(), 100);
});
