'use strict';

const LaboursModule = {
  currentPage: 1,
  limit: 10,
  labours: [],
  groups: [],
  query: '',
  groupFilter: '',
  statusFilter: '',
  editingId: null,

  async init() {
    const content = document.getElementById('page-content');
    const tpl = document.getElementById('page-template').content.cloneNode(true);
    content.appendChild(tpl);
    
    await this.loadGroups();
    this.setupListeners();
    await this.loadData();
  },

  async loadGroups() {
    try {
      const res = await apiFetchCached('/groups?limit=100');
      this.groups = res.data?.groups || [];
      const opts = this.groups.map(g => `<option value="${g._id}">${g.name}</option>`).join('');
      document.getElementById('filter-group').insertAdjacentHTML('beforeend', opts);
      document.getElementById('form-group').insertAdjacentHTML('beforeend', opts);
    } catch (err) {}
  },

  setupListeners() {
    document.getElementById('search-input').addEventListener('input', debounce(e => {
      this.query = e.target.value;
      this.currentPage = 1;
      this.loadData();
    }, 500));
    
    document.getElementById('filter-group').addEventListener('change', e => {
      this.groupFilter = e.target.value;
      this.currentPage = 1;
      this.loadData();
    });

    document.getElementById('filter-status').addEventListener('change', e => {
      this.statusFilter = e.target.value;
      this.currentPage = 1;
      this.loadData();
    });

    document.getElementById('add-btn').addEventListener('click', () => this.openModal());
    document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
    document.getElementById('labour-form').addEventListener('submit', (e) => this.submitForm(e));
    
    document.getElementById('prev-page').addEventListener('click', () => {
      if (this.currentPage > 1) { this.currentPage--; this.loadData(); }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
      this.currentPage++; this.loadData();
    });
  },

  async loadData() {
    document.getElementById('labour-table-body').innerHTML = `<tr><td colspan="7" class="text-center p-8"><div class="skeleton h-8 w-full rounded"></div></td></tr>`;
    try {
      const qs = new URLSearchParams({ page: this.currentPage, limit: this.limit });
      if (this.query) qs.append('q', this.query);
      if (this.groupFilter) qs.append('group', this.groupFilter);
      if (this.statusFilter) qs.append('isActive', this.statusFilter);

      const res = await apiFetch(`/labours?${qs}`);
      this.labours = res.data.labours;
      this.renderTable(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  renderTable({ labours, total, page, limit }) {
    const tbody = document.getElementById('labour-table-body');
    const empty = document.getElementById('empty-state');
    
    if (labours.length === 0) {
      tbody.innerHTML = '';
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
      tbody.innerHTML = labours.map(l => `
        <tr class="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center font-bold text-surface-500 overflow-hidden">
                ${l.photoPath ? `<img src="${API_BASE_URL.replace('/api/v1', '')}/${l.photoPath}" class="w-full h-full object-cover">` : l.name[0].toUpperCase()}
              </div>
              <div>
                <div class="font-bold">${l.name}</div>
                <div class="text-xs text-surface-400">${l.idProof || 'No ID'}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4">${l.age}</td>
          <td class="px-6 py-4">${l.phone || '-'}</td>
          <td class="px-6 py-4"><span class="px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded font-semibold text-xs">${l.group?.name || 'Unassigned'}</span></td>
          <td class="px-6 py-4 font-mono font-bold ${l.advanceBalance > 0 ? 'text-rose-500' : 'text-brand-500'}">₹${l.advanceBalance || 0}</td>
          <td class="px-6 py-4">
            <span class="px-2 py-1 rounded-full text-xs font-bold ${l.isActive ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-600'}">
              ${l.isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td class="px-6 py-4 text-right">
            <button onclick="LaboursModule.openModal('${l._id}')" class="p-2 text-surface-400 hover:text-blue-500 transition-colors">✏️</button>
            <button onclick="LaboursModule.deleteLabour('${l._id}')" class="p-2 text-surface-400 hover:text-rose-500 transition-colors">🗑️</button>
          </td>
        </tr>
      `).join('');
    }

    // Pagination update
    const totalPages = Math.ceil(total / limit);
    document.getElementById('pag-start').textContent = total === 0 ? 0 : ((page - 1) * limit) + 1;
    document.getElementById('pag-end').textContent = Math.min(page * limit, total);
    document.getElementById('pag-total').textContent = total;
    
    document.getElementById('prev-page').disabled = page <= 1;
    document.getElementById('next-page').disabled = page >= totalPages;
  },

  openModal(id = null) {
    this.editingId = id;
    const form = document.getElementById('labour-form');
    form.reset();
    document.getElementById('modal-title').textContent = id ? 'Edit Worker Profile' : 'Register Worker Profile';
    
    if (id) {
      const l = this.labours.find(x => x._id === id);
      if (l) {
        document.getElementById('form-name').value = l.name;
        document.getElementById('form-age').value = l.age;
        document.getElementById('form-phone').value = l.phone || '';
        document.getElementById('form-id-proof').value = l.idProof || '';
        document.getElementById('form-address').value = l.address || '';
        document.getElementById('form-group').value = l.group?._id || '';
        document.getElementById('form-advance').value = l.advanceBalance || 0;
        if(l.joiningDate) document.getElementById('form-joining').value = new Date(l.joiningDate).toISOString().split('T')[0];
        document.getElementById('form-active').checked = l.isActive;
      }
    } else {
      document.getElementById('form-joining').value = new Date().toISOString().split('T')[0];
    }
    document.getElementById('form-modal').classList.remove('hidden');
  },

  closeModal() {
    document.getElementById('form-modal').classList.add('hidden');
    this.editingId = null;
  },

  async submitForm(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', document.getElementById('form-name').value);
    fd.append('age', document.getElementById('form-age').value);
    fd.append('phone', document.getElementById('form-phone').value);
    fd.append('idProof', document.getElementById('form-id-proof').value);
    fd.append('address', document.getElementById('form-address').value);
    if(document.getElementById('form-group').value) fd.append('group', document.getElementById('form-group').value);
    if(!this.editingId) fd.append('openingAdvanceBalance', document.getElementById('form-advance').value);
    fd.append('joiningDate', document.getElementById('form-joining').value);
    fd.append('isActive', document.getElementById('form-active').checked);

    const file = document.getElementById('form-photo').files[0];
    if(file) fd.append('photo', file);

    try {
      if (this.editingId) {
        await apiFetch(`/labours/${this.editingId}`, { method: 'PUT', body: fd, isMultipart: true });
        showToast('Worker updated successfully!');
      } else {
        await apiFetch('/labours', { method: 'POST', body: fd, isMultipart: true });
        showToast('Worker registered successfully!');
      }
      this.closeModal();
      this.loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async deleteLabour(id) {
    if (!confirm('Are you sure you want to delete this labour record?')) return;
    try {
      await apiFetch(`/labours/${id}`, { method: 'DELETE' });
      showToast('Worker record deleted.');
      this.loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => LaboursModule.init(), 100);
});
