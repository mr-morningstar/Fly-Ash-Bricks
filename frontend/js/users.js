'use strict';

const UsersModule = {
  currentPage: 1,
  limit: 10,
  roles: [],

  async init() {
    const content = document.getElementById('page-content');
    const tpl = document.getElementById('page-template').content.cloneNode(true);
    content.appendChild(tpl);
    await this.loadRoles();
    await this.loadData();
    this.setupModal();
  },

  async loadRoles() {
    try {
      const res = await apiFetchCached('/roles');
      this.roles = res.data || [];
    } catch (err) {}
  },

  changePage(page) { this.currentPage = page; this.loadData(); },

  async loadData() {
    this.renderTable(null, true);
    try {
      const qs = new URLSearchParams({ page: this.currentPage, limit: this.limit });
      const res = await apiFetch(`/users?${qs}`);
      this.renderTable(res.data.users, false);
      this.renderPagination(res.data);
    } catch (err) {
      showToast(err.message, 'error');
      this.renderTable([], false);
    }
  },

  renderTable(data, loading) {
    const columns = [
      { key: 'name', label: 'Name', render: (u) => `
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 flex items-center justify-center font-black text-sm">
            ${(u.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <div class="font-bold">${u.name}</div>
            <div class="text-xs text-surface-400">${u.email}</div>
          </div>
        </div>
      `},
      { key: 'role', label: 'Role', render: (u) => `<span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">${u.role?.name || 'Staff'}</span>` },
      { key: 'status', label: 'Status', class: 'text-center', render: (u) => `
        <button onclick="UsersModule.toggleUser('${u._id}')" class="px-2 py-1 rounded-full text-xs font-bold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-600'}">
          ${u.isActive ? 'Active' : 'Inactive'}
        </button>
      `},
      { key: 'createdAt', label: 'Joined', render: (u) => new Date(u.createdAt).toLocaleDateString('en-IN') },
      { key: 'actions', label: '', class: 'text-right', render: (u) => `
        <button onclick="UsersModule.resetPassword('${u._id}')" class="p-2 text-surface-400 hover:text-amber-500 transition-colors" title="Reset Password">🔑</button>
      `}
    ];
    document.getElementById('table-container').innerHTML = Components.DataTable({ id: 'users-table', columns, data, loading });
  },

  renderPagination({ total, page, limit }) {
    document.getElementById('pagination-container').innerHTML = Components.Pagination({
      currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total, limit, onPageChangeName: 'UsersModule.changePage'
    });
  },

  setupModal() {
    const roleOpts = this.roles.map(r => `<option value="${r._id}">${r.name}</option>`).join('');
    const html = `
      <form id="user-form" onsubmit="UsersModule.submitCreate(event)" class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Full Name</label>
            <input type="text" name="name" required class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Email</label>
            <input type="email" name="email" required class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Password</label>
            <input type="password" name="password" required minlength="6" class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-surface-500 mb-1">Role</label>
            <select name="roleId" required class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
              <option value="">Select Role</option>
              ${roleOpts}
            </select>
          </div>
        </div>
        <button type="submit" class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/30">Create User</button>
      </form>
    `;
    document.getElementById('user-modal-wrap').innerHTML = Components.Modal({ id: 'user-modal', title: 'Create New User', contentHtml: html });
  },

  openCreateModal() {
    document.getElementById('user-form')?.reset();
    Components.openModal('user-modal');
  },

  async submitCreate(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await apiFetch('/users', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd.entries())) });
      showToast('User created successfully!');
      Components.closeModal('user-modal');
      this.loadData();
    } catch (err) { showToast(err.message, 'error'); }
  },

  async toggleUser(id) {
    try {
      await apiFetch(`/users/${id}/toggle`, { method: 'PATCH' });
      showToast('User status updated.');
      this.loadData();
    } catch (err) { showToast(err.message, 'error'); }
  },

  async resetPassword(id) {
    const newPwd = prompt('Enter new password (min 6 characters):');
    if (!newPwd || newPwd.length < 6) { showToast('Password too short.', 'warning'); return; }
    try {
      await apiFetch(`/users/${id}/reset-password`, { method: 'PATCH', body: JSON.stringify({ password: newPwd }) });
      showToast('Password reset successfully!');
    } catch (err) { showToast(err.message, 'error'); }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => UsersModule.init(), 100);
});
