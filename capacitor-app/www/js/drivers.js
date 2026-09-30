'use strict';

/**
 * Drivers Module Frontend Controller
 * Complete CRUD for dedicated delivery drivers and rates
 */
const DriversModule = {
  drivers: [],
  labours: [],
  currentPage: 1,
  limit: 10,
  currentFilters: { search: '' },
  editingDriverId: null,

  async init() {
    const content = document.getElementById('page-content');
    const tpl = document.getElementById('page-template')?.content.cloneNode(true);
    if (content && tpl) content.appendChild(tpl);

    await Promise.all([this.loadLabours(), this.loadDrivers()]);
    this.renderFilterBar();
  },

  async loadLabours() {
    try {
      const res = await apiRequest('/labours?limit=200');
      this.labours = res.data?.labours || [];
    } catch (e) {
      console.warn('Could not load labours for driver linkage:', e);
    }
  },

  async loadDrivers() {
    try {
      const query = new URLSearchParams({
        page: this.currentPage,
        limit: this.limit,
        search: this.currentFilters.search,
        sort: '-createdAt'
      });

      this.renderTable([], true);
      const res = await apiRequest(`/drivers?${query}`);
      const data = res.data || {};
      this.drivers = data.drivers || [];

      this.renderStats(this.drivers);
      this.renderTable(this.drivers, false);
      this.renderPagination({ total: data.total || 0, page: data.page || 1, limit: data.limit || 10 });
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to load drivers.', 'error');
      this.renderTable([], false);
    }
  },

  renderStats(drivers) {
    const container = document.getElementById('driver-stats-container');
    if (!container) return;

    const total = drivers.length;
    const activeVehicles = new Set(drivers.map(d => d.vehicleNumber).filter(Boolean)).size;
    const avgTripRate = total > 0 
      ? Math.round(drivers.reduce((acc, d) => acc + (d.defaultTripRate || 0), 0) / total) 
      : 0;
    const avgHelperRate = total > 0 
      ? Math.round(drivers.reduce((acc, d) => acc + (d.helperRate || 0), 0) / total) 
      : 0;

    container.innerHTML = `
      ${Components.StatsCard({ title: 'Total Drivers', value: total, icon: '🚚' })}
      ${Components.StatsCard({ title: 'Active Vehicles', value: activeVehicles, icon: '🚛' })}
      ${Components.StatsCard({ title: 'Avg Trip Rate', value: `₹${avgTripRate}`, icon: '💰' })}
      ${Components.StatsCard({ title: 'Avg Helper Rate', value: `₹${avgHelperRate}`, icon: '🤝' })}
    `;
  },

  renderFilterBar() {
    const container = document.getElementById('driver-filter-container');
    if (!container) return;
    container.innerHTML = Components.FilterBar({
      searchPlaceholder: 'Search driver name, phone, or vehicle number...',
      onSearchName: 'DriversModule.handleSearch'
    });
  },

  handleSearch(query) {
    DriversModule.currentFilters.search = query;
    DriversModule.currentPage = 1;
    DriversModule.loadDrivers();
  },

  changePage(page) {
    this.currentPage = page;
    this.loadDrivers();
  },

  renderTable(data, loading) {
    const container = document.getElementById('driver-table-container');
    if (!container) return;

    const columns = [
      {
        key: 'name',
        label: 'Driver Name',
        render: (item) => `
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-brand-500/10 text-brand-500 font-black flex items-center justify-center text-sm">
              ${item.name ? item.name[0].toUpperCase() : 'D'}
            </div>
            <div>
              <div class="font-bold text-surface-900 dark:text-white">${item.name}</div>
              <div class="text-xs text-surface-400">${item.phone || 'No phone'}</div>
            </div>
          </div>
        `
      },
      {
        key: 'vehicle',
        label: 'Vehicle Allocated',
        render: (item) => `
          <div class="flex flex-col">
            <span class="font-mono font-bold text-xs px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 w-fit">
              ${item.vehicleNumber || 'Unassigned'}
            </span>
            <span class="text-[11px] text-surface-500 font-medium mt-0.5">${item.vehicleType || 'Truck'}</span>
          </div>
        `
      },
      {
        key: 'defaultTripRate',
        label: 'Driving Rate / Trip',
        class: 'text-right',
        render: (item) => `<span class="font-mono font-bold text-brand-600 dark:text-brand-400">₹${Number(item.defaultTripRate || 0).toLocaleString()}</span>`
      },
      {
        key: 'helperRate',
        label: 'Helper Rate / Trip',
        class: 'text-right',
        render: (item) => `<span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹${Number(item.helperRate || 0).toLocaleString()}</span>`
      },
      {
        key: 'labourRef',
        label: 'Worker Type',
        render: (item) => item.labourRef 
          ? `<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">👷 Registered Labour</span>`
          : `<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">🚚 Standalone Driver</span>`
      },
      {
        key: 'actions',
        label: '',
        class: 'text-right',
        render: (item) => `
          <div class="flex justify-end gap-1">
            <button onclick="DriversModule.openDriverModal('${item._id}')" class="p-2 text-surface-400 hover:text-brand-500 transition-colors" title="Edit">✏️</button>
            <button onclick="DriversModule.deleteDriver('${item._id}')" class="p-2 text-surface-400 hover:text-rose-500 transition-colors" title="Delete">🗑️</button>
          </div>
        `
      }
    ];

    container.innerHTML = Components.DataTable({
      id: 'driver-table',
      columns,
      data,
      loading,
      emptyMessage: 'No drivers registered yet. Click "➕ Add New Driver" above.'
    });
  },

  renderPagination({ total, page, limit }) {
    const container = document.getElementById('driver-pagination-container');
    if (!container) return;
    const totalPages = Math.ceil(total / limit) || 1;
    container.innerHTML = Components.Pagination({
      currentPage: page,
      totalPages,
      totalItems: total,
      limit,
      onPageChangeName: 'DriversModule.changePage'
    });
  },

  openDriverModal(driverId = null) {
    this.editingDriverId = driverId;
    const driver = driverId ? this.drivers.find(d => d._id === driverId) : null;

    const labourOptions = this.labours.map(l => {
      const selected = driver?.labourRef?._id === l._id ? 'selected' : '';
      return `<option value="${l._id}" ${selected}>${l.name} (${l.phone || 'No phone'})</option>`;
    }).join('');

    const modalHtml = `
      <form id="driver-form" onsubmit="DriversModule.submitDriver(event)" class="flex flex-col gap-4">
        
        <div class="p-3 bg-brand-500/5 border border-brand-500/20 rounded-xl mb-1">
          <label class="block text-xs font-bold text-brand-500 mb-1">Link to Registered Labour (Optional)</label>
          <select id="driver-labour-ref" onchange="DriversModule.onLabourSelect(this)" class="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
            <option value="">-- Standalone Driver (Not a Labour) --</option>
            ${labourOptions}
          </select>
          <p class="text-[11px] text-surface-500 mt-1">If this driver is also an existing plant worker, select them here so trip wages flow directly to their account.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Driver Full Name *</label>
            <input type="text" id="driver-name" required value="${driver?.name || ''}" placeholder="e.g. Ramesh Kumar"
                   class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Phone Number</label>
            <input type="tel" id="driver-phone" value="${driver?.phone || ''}" placeholder="e.g. 8085112711"
                   class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Vehicle Number</label>
            <input type="text" id="driver-vehicle-no" value="${driver?.vehicleNumber || ''}" placeholder="e.g. CG-13-AB-1234"
                   class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm uppercase">
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Vehicle Type</label>
            <select id="driver-vehicle-type" class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
              <option value="Truck" ${driver?.vehicleType === 'Truck' ? 'selected' : ''}>Truck (6-Wheeler / 10-Wheeler)</option>
              <option value="Tractor" ${driver?.vehicleType === 'Tractor' ? 'selected' : ''}>Tractor Trolley</option>
              <option value="Dumper" ${driver?.vehicleType === 'Dumper' ? 'selected' : ''}>Dumper</option>
              <option value="Tempo" ${driver?.vehicleType === 'Tempo' ? 'selected' : ''}>Tempo / Pickup</option>
              <option value="Other" ${driver?.vehicleType === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-surface-50 dark:bg-surface-950/60 rounded-xl border border-surface-200 dark:border-surface-800">
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Default Driving Rate / Trip (₹) *</label>
            <input type="number" id="driver-trip-rate" required min="0" value="${driver?.defaultTripRate ?? 500}"
                   class="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm font-bold">
            <span class="text-[10px] text-surface-400">Paid to driver per delivery trip driven.</span>
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Helper Rate / Trip (₹) *</label>
            <input type="number" id="driver-helper-rate" required min="0" value="${driver?.helperRate ?? 150}"
                   class="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm font-bold">
            <span class="text-[10px] text-surface-400">Paid if this person assists as helper with another driver.</span>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-surface-500 mb-1">Driving License Number</label>
          <input type="text" id="driver-license" value="${driver?.licenseNumber || ''}" placeholder="e.g. DL-13-20220012345"
                 class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm uppercase">
        </div>

        <button type="submit" class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/30">
          ${driverId ? 'Update Driver Profile' : 'Save New Driver'}
        </button>
      </form>
    `;

    document.getElementById('driver-modal-container').innerHTML = Components.Modal({
      id: 'driver-modal',
      title: driverId ? 'Edit Driver' : 'Add New Delivery Driver',
      contentHtml: modalHtml,
      maxWidth: 'max-w-xl'
    });

    Components.openModal('driver-modal');
  },

  onLabourSelect(select) {
    if (!select.value) return;
    const labour = this.labours.find(l => l._id === select.value);
    if (labour) {
      const nameInput = document.getElementById('driver-name');
      const phoneInput = document.getElementById('driver-phone');
      if (nameInput && !nameInput.value) nameInput.value = labour.name;
      if (phoneInput && !phoneInput.value) phoneInput.value = labour.phone || '';
    }
  },

  async submitDriver(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('driver-name')?.value?.trim(),
      phone: document.getElementById('driver-phone')?.value?.trim(),
      vehicleNumber: document.getElementById('driver-vehicle-no')?.value?.trim().toUpperCase(),
      vehicleType: document.getElementById('driver-vehicle-type')?.value,
      defaultTripRate: parseFloat(document.getElementById('driver-trip-rate')?.value) || 0,
      helperRate: parseFloat(document.getElementById('driver-helper-rate')?.value) || 0,
      licenseNumber: document.getElementById('driver-license')?.value?.trim().toUpperCase(),
      labourRef: document.getElementById('driver-labour-ref')?.value || null,
    };

    try {
      if (this.editingDriverId) {
        await apiRequest(`/drivers/${this.editingDriverId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (typeof showToast === 'function') showToast('Driver updated successfully!', 'success');
      } else {
        await apiRequest('/drivers', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (typeof showToast === 'function') showToast('New driver registered!', 'success');
      }
      Components.closeModal('driver-modal');
      await this.loadDrivers();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to save driver.', 'error');
    }
  },

  async deleteDriver(driverId) {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    try {
      await apiRequest(`/drivers/${driverId}`, { method: 'DELETE' });
      if (typeof showToast === 'function') showToast('Driver removed.', 'info');
      await this.loadDrivers();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to delete driver.', 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => DriversModule.init(), 100);
});
