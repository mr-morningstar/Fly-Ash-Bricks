'use strict';

const UsersModule = {
  currentTab: 'users', // 'users' or 'roles'
  currentPage: 1,
  limit: 10,
  users: [],
  roles: [],
  editingUserId: null,
  editingRoleId: null,

  // All available permissions grouped by module
  permissionGroups: [
    {
      group: 'Production & Manufacturing',
      perms: [
        { key: 'production.view', label: 'View Production' },
        { key: 'production.create', label: 'Log Production' },
        { key: 'production.edit', label: 'Edit Production' },
        { key: 'production.delete', label: 'Delete Production' }
      ]
    },
    {
      group: 'Labour & Workforce',
      perms: [
        { key: 'labour.view', label: 'View Labourers' },
        { key: 'labour.create', label: 'Add Labourer' },
        { key: 'labour.edit', label: 'Edit Labourer' },
        { key: 'labour.delete', label: 'Delete Labourer' }
      ]
    },
    {
      group: 'Groups & Teams',
      perms: [
        { key: 'group.view', label: 'View Groups' },
        { key: 'group.create', label: 'Create Groups' },
        { key: 'group.edit', label: 'Edit Groups' },
        { key: 'group.delete', label: 'Delete Groups' },
        { key: 'group.config', label: 'Configure Rates' }
      ]
    },
    {
      group: 'Attendance & Wages',
      perms: [
        { key: 'attendance.view', label: 'View Attendance' },
        { key: 'attendance.mark', label: 'Mark Attendance' },
        { key: 'attendance.edit', label: 'Edit Attendance' }
      ]
    },
    {
      group: 'Billing & Invoices',
      perms: [
        { key: 'billing.view', label: 'View Invoices' },
        { key: 'billing.generate', label: 'Generate Invoices' },
        { key: 'billing.download', label: 'Download PDF' },
        { key: 'billing.pay', label: 'Record Payments' }
      ]
    },
    {
      group: 'Inventory & Materials',
      perms: [
        { key: 'inventory.view', label: 'View Inventory' },
        { key: 'inventory.manage', label: 'Manage Stock & Inward' }
      ]
    },
    {
      group: 'User & Access Management',
      perms: [
        { key: 'user.view', label: 'View Users' },
        { key: 'user.create', label: 'Create Users' },
        { key: 'user.edit', label: 'Edit Users' },
        { key: 'user.delete', label: 'Delete Users' },
        { key: 'role.view', label: 'View Roles' },
        { key: 'role.create', label: 'Create Roles' },
        { key: 'role.edit', label: 'Edit Roles' },
        { key: 'role.delete', label: 'Delete Roles' }
      ]
    },
    {
      group: 'System & Reports',
      perms: [
        { key: 'dashboard.view', label: 'View Dashboard' },
        { key: 'reports.view', label: 'View Reports' },
        { key: 'reports.export', label: 'Export Data' },
        { key: 'settings.view', label: 'View Settings' },
        { key: 'settings.edit', label: 'Edit Settings' },
        { key: 'publicSite.view', label: 'View Website CMS' },
        { key: 'publicSite.update', label: 'Update Website CMS' }
      ]
    }
  ],

  async init() {
    const content = document.getElementById('page-content');
    const tpl = document.getElementById('page-template').content.cloneNode(true);
    content.appendChild(tpl);

    await this.loadRoles();
    await this.loadData();
    this.renderRolePermissionCheckboxes();
  },

  switchTab(tab) {
    this.currentTab = tab;
    const usersTabBtn = document.getElementById('tab-users-btn');
    const rolesTabBtn = document.getElementById('tab-roles-btn');
    const usersView = document.getElementById('users-view');
    const rolesView = document.getElementById('roles-view');
    const topActionBtn = document.getElementById('top-action-btn');

    if (tab === 'users') {
      usersTabBtn?.classList.add('bg-brand-600', 'text-white', 'shadow-md');
      usersTabBtn?.classList.remove('text-surface-400', 'hover:text-surface-200');
      rolesTabBtn?.classList.remove('bg-brand-600', 'text-white', 'shadow-md');
      rolesTabBtn?.classList.add('text-surface-400', 'hover:text-surface-200');

      usersView?.classList.remove('hidden');
      rolesView?.classList.add('hidden');

      if (topActionBtn) {
        topActionBtn.textContent = '+ New User';
        topActionBtn.onclick = () => UsersModule.openCreateModal();
      }
    } else {
      rolesTabBtn?.classList.add('bg-brand-600', 'text-white', 'shadow-md');
      rolesTabBtn?.classList.remove('text-surface-400', 'hover:text-surface-200');
      usersTabBtn?.classList.remove('bg-brand-600', 'text-white', 'shadow-md');
      usersTabBtn?.classList.add('text-surface-400', 'hover:text-surface-200');

      usersView?.classList.add('hidden');
      rolesView?.classList.remove('hidden');

      if (topActionBtn) {
        topActionBtn.textContent = '+ New Role';
        topActionBtn.onclick = () => UsersModule.openCreateRoleModal();
      }
      this.renderRoles();
    }
  },

  async loadRoles() {
    try {
      let res;
      try {
        res = await apiFetch('/settings/roles');
      } catch (e) {
        res = await apiFetch('/roles');
      }
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        this.roles = res.data;
      }
    } catch (err) {
      console.warn('Could not load dynamic roles, using defaults:', err.message);
    }

    if (!this.roles || this.roles.length === 0) {
      this.roles = [
        { _id: 'super_admin_def', name: 'Super Admin', isDefault: true, description: 'Full system access & administration' },
        { _id: 'manager_def', name: 'Manager', isDefault: true, description: 'Operational control and reports management' },
        { _id: 'supervisor_def', name: 'Supervisor', isDefault: true, description: 'Daily production and attendance logging' },
        { _id: 'accountant_def', name: 'Accountant', isDefault: true, description: 'Billing, invoices and wage records' },
        { _id: 'viewer_def', name: 'Viewer', isDefault: true, description: 'Read-only access to records' }
      ];
    }
    this.populateRoleDropdowns();
  },

  populateRoleDropdowns() {
    const roleOpts = this.roles.map(r => `<option value="${r._id}">${r.name}</option>`).join('');
    
    const userRoleSelect = document.getElementById('u-role-select');
    if (userRoleSelect) {
      userRoleSelect.innerHTML = `<option value="">Select Role</option>${roleOpts}`;
    }

    const editUserRoleSelect = document.getElementById('edit-u-role-select');
    if (editUserRoleSelect) {
      editUserRoleSelect.innerHTML = `<option value="">Select Role</option>${roleOpts}`;
    }
  },

  changePage(page) {
    this.currentPage = page;
    this.loadData();
  },

  async loadData() {
    this.renderTable(null, true);
    try {
      const qs = new URLSearchParams({ page: this.currentPage, limit: this.limit });
      const res = await apiFetch(`/users?${qs}`);
      this.users = res.data.users || [];
      this.renderTable(this.users, false);
      this.renderPagination(res.data);
    } catch (err) {
      showToast(err.message || 'Failed to load users.', 'error');
      this.renderTable([], false);
    }
  },

  renderTable(data, loading) {
    const columns = [
      { key: 'name', label: 'User Details', render: (u) => `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-black text-sm uppercase">
            ${(u.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <div class="font-bold text-surface-900 dark:text-surface-100">${u.name}</div>
            <div class="text-xs text-surface-400">${u.email}</div>
          </div>
        </div>
      `},
      { key: 'role', label: 'Assigned Role', render: (u) => `
        <span class="inline-flex items-center px-2.5 py-1 bg-teal-500/10 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-500/20 rounded-lg text-xs font-bold">
          🛡️ ${u.role?.name || 'Staff'}
        </span>
      `},
      { key: 'status', label: 'Status', class: 'text-center', render: (u) => `
        <button onclick="UsersModule.toggleUser('${u._id}')" class="px-2.5 py-1 rounded-full text-xs font-bold transition-all ${u.isActive ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'}">
          ${u.isActive ? '● Active' : '○ Inactive'}
        </button>
      `},
      { key: 'createdAt', label: 'Joined', render: (u) => new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
      { key: 'actions', label: 'Actions', class: 'text-right', render: (u) => `
        <div class="flex items-center justify-end gap-1">
          <button onclick="UsersModule.openEditModal('${u._id}')" class="p-2 text-surface-400 hover:text-brand-400 hover:bg-surface-800 rounded-lg transition-colors" title="Edit User">
            ✏️
          </button>
          <button onclick="UsersModule.resetPassword('${u._id}')" class="p-2 text-surface-400 hover:text-amber-400 hover:bg-surface-800 rounded-lg transition-colors" title="Reset Password">
            🔑
          </button>
          <button onclick="UsersModule.deleteUser('${u._id}', '${(u.name || '').replace(/'/g, "\\'")}')" class="p-2 text-surface-400 hover:text-rose-400 hover:bg-surface-800 rounded-lg transition-colors" title="Delete User">
            🗑️
          </button>
        </div>
      `}
    ];
    document.getElementById('table-container').innerHTML = Components.DataTable({ id: 'users-table', columns, data, loading });
  },

  renderPagination({ total, page, limit }) {
    document.getElementById('pagination-container').innerHTML = Components.Pagination({
      currentPage: page, totalPages: Math.ceil((total || 0) / limit), totalItems: total || 0, limit, onPageChangeName: 'UsersModule.changePage'
    });
  },

  openCreateModal() {
    document.getElementById('create-user-form')?.reset();
    this.populateRoleDropdowns();
    Components.openModal('create-user-modal');
  },

  async submitCreate(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    try {
      await apiFetch('/users', { method: 'POST', body: JSON.stringify(body) });
      showToast('User account created successfully!', 'success');
      Components.closeModal('create-user-modal');
      this.loadData();
    } catch (err) {
      showToast(err.message || 'Failed to create user.', 'error');
    }
  },

  openEditModal(userId) {
    const user = this.users.find(u => u._id === userId);
    if (!user) return;
    this.editingUserId = userId;
    this.populateRoleDropdowns();

    const form = document.getElementById('edit-user-form');
    if (form) {
      form.elements['name'].value = user.name || '';
      form.elements['email'].value = user.email || '';
      form.elements['roleId'].value = user.role?._id || user.role || '';
      form.elements['isActive'].value = user.isActive ? 'true' : 'false';
    }
    Components.openModal('edit-user-modal');
  },

  async submitEditUser(e) {
    e.preventDefault();
    if (!this.editingUserId) return;
    const fd = new FormData(e.target);
    const data = {
      name: fd.get('name'),
      email: fd.get('email'),
      roleId: fd.get('roleId'),
      isActive: fd.get('isActive') === 'true'
    };
    try {
      await apiFetch(`/users/${this.editingUserId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      showToast('User details updated successfully!', 'success');
      Components.closeModal('edit-user-modal');
      this.loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update user.', 'error');
    }
  },

  async toggleUser(id) {
    try {
      await apiFetch(`/users/${id}/toggle`, { method: 'PATCH' });
      showToast('User status updated successfully.', 'success');
      this.loadData();
    } catch (err) {
      showToast(err.message || 'Failed to toggle status.', 'error');
    }
  },

  async resetPassword(id) {
    const newPwd = prompt('Enter new password for this user (min 6 characters):');
    if (!newPwd) return;
    if (newPwd.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }
    try {
      await apiFetch(`/users/${id}/reset-password`, {
        method: 'PATCH',
        body: JSON.stringify({ password: newPwd })
      });
      showToast('Password reset successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to reset password.', 'error');
    }
  },

  async deleteUser(id, name) {
    if (!confirm(`Are you sure you want to permanently delete the user account for "${name}"?`)) return;
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      showToast('User deleted successfully.', 'success');
      this.loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete user.', 'error');
    }
  },

  // ==========================================
  // ROLES & PERMISSIONS MODULE
  // ==========================================

  renderRoles() {
    const container = document.getElementById('roles-grid');
    if (!container) return;

    if (!this.roles || this.roles.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-surface-400">No roles configured. Click "+ New Role" to add one.</div>`;
      return;
    }

    container.innerHTML = this.roles.map(role => {
      const isSuperAdmin = role.name === 'Super Admin';
      const permsCount = role.permissions ? role.permissions.length : (isSuperAdmin ? 'All System' : 0);
      const isCustom = !role.isDefault;

      return `
        <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-6 shadow-sm hover:border-brand-500/40 transition-all flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex items-center gap-2">
                <div class="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center font-black text-lg">
                  🛡️
                </div>
                <div>
                  <h3 class="font-bold text-base text-surface-900 dark:text-surface-100">${role.name}</h3>
                  <span class="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${isCustom ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-brand-500/10 text-brand-500 border border-brand-500/20'}">
                    ${isCustom ? 'Custom Role' : 'System Default'}
                  </span>
                </div>
              </div>
            </div>

            <p class="text-xs text-surface-500 dark:text-surface-400 mb-4 min-h-[32px]">
              ${role.description || 'No description provided.'}
            </p>

            <div class="p-3 bg-surface-50 dark:bg-surface-950/60 rounded-xl border border-surface-100 dark:border-surface-800/60 mb-4">
              <div class="text-[11px] font-bold text-surface-400 uppercase tracking-wider mb-1">Assigned Permissions</div>
              <div class="text-sm font-black text-brand-500">
                ${isSuperAdmin ? '⚡ Full Unlimited Access (All Permissions)' : `🔒 ${permsCount} Permissions Granted`}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-3 border-t border-surface-100 dark:border-surface-800">
            <button onclick="UsersModule.openEditRoleModal('${role._id}')" class="flex-1 py-2 px-3 bg-surface-100 hover:bg-brand-600 dark:bg-surface-800 dark:hover:bg-brand-600 text-surface-700 dark:text-surface-200 hover:text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm">
              ✏️ Edit Name & Permissions
            </button>
            ${isCustom ? `
              <button onclick="UsersModule.deleteRole('${role._id}', '${role.name.replace(/'/g, "\\'")}')" class="p-2 text-surface-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all" title="Delete Role">
                🗑️
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  renderRolePermissionCheckboxes(prefix = 'role-perm') {
    const container = document.getElementById(`${prefix}-container`);
    if (!container) return;

    container.innerHTML = this.permissionGroups.map(group => `
      <div class="bg-surface-50 dark:bg-surface-950 p-4 rounded-xl border border-surface-200 dark:border-surface-800">
        <div class="font-bold text-xs uppercase tracking-wider text-brand-500 mb-3 flex items-center justify-between">
          <span>${group.group}</span>
          <button type="button" onclick="UsersModule.toggleGroupPerms('${prefix}', '${group.group.replace(/'/g, "\\'")}')" class="text-[11px] text-surface-400 hover:text-brand-400 lowercase font-medium">Toggle all</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          ${group.perms.map(p => `
            <label class="flex items-center gap-2 text-xs font-semibold text-surface-700 dark:text-surface-300 cursor-pointer select-none hover:text-brand-400">
              <input type="checkbox" name="permissions" value="${p.key}" data-group="${group.group}" class="${prefix}-checkbox rounded bg-surface-100 dark:bg-surface-900 border-surface-300 dark:border-surface-700 text-brand-500 focus:ring-brand-500">
              <span>${p.label}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');
  },

  toggleGroupPerms(prefix, groupName) {
    const checkboxes = Array.from(document.querySelectorAll(`.${prefix}-checkbox[data-group="${groupName}"]`));
    const allChecked = checkboxes.every(cb => cb.checked);
    checkboxes.forEach(cb => { cb.checked = !allChecked; });
  },

  toggleAllPerms(prefix, selectAll = true) {
    document.querySelectorAll(`.${prefix}-checkbox`).forEach(cb => {
      cb.checked = selectAll;
    });
  },

  openCreateRoleModal() {
    this.editingRoleId = null;
    document.getElementById('role-modal-title').textContent = 'Create New Role';
    document.getElementById('role-form')?.reset();
    this.renderRolePermissionCheckboxes('create-role-perm');
    Components.openModal('role-modal');
  },

  openEditRoleModal(roleId) {
    const role = this.roles.find(r => r._id === roleId);
    if (!role) return;

    this.editingRoleId = roleId;
    document.getElementById('role-modal-title').textContent = `Edit Role: ${role.name}`;
    
    const form = document.getElementById('role-form');
    if (form) {
      form.elements['name'].value = role.name || '';
      form.elements['description'].value = role.description || '';
      
      // If Super Admin, disable renaming name
      if (role.name === 'Super Admin') {
        form.elements['name'].disabled = true;
      } else {
        form.elements['name'].disabled = false;
      }
    }

    this.renderRolePermissionCheckboxes('create-role-perm');

    // Check currently active permissions
    const perms = role.permissions || [];
    document.querySelectorAll('.create-role-perm-checkbox').forEach(cb => {
      cb.checked = perms.includes(cb.value);
    });

    Components.openModal('role-modal');
  },

  async submitRole(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.elements['name'].value.trim();
    const description = form.elements['description'].value.trim();
    const checkedPerms = Array.from(document.querySelectorAll('.create-role-perm-checkbox:checked')).map(cb => cb.value);

    if (!name) {
      showToast('Role name is required.', 'warning');
      return;
    }

    try {
      if (this.editingRoleId) {
        // Edit existing role
        await apiFetch(`/settings/roles/${this.editingRoleId}`, {
          method: 'PUT',
          body: JSON.stringify({ name, description, permissions: checkedPerms })
        });
        showToast(`Role "${name}" updated successfully!`, 'success');
      } else {
        // Create new role
        await apiFetch('/settings/roles', {
          method: 'POST',
          body: JSON.stringify({ name, description, permissions: checkedPerms })
        });
        showToast(`Role "${name}" created successfully!`, 'success');
      }

      Components.closeModal('role-modal');
      await this.loadRoles();
      this.renderRoles();
    } catch (err) {
      showToast(err.message || 'Failed to save role.', 'error');
    }
  },

  async deleteRole(id, name) {
    if (!confirm(`Are you sure you want to delete the role "${name}"? Users with this role may lose their permissions.`)) return;
    try {
      await apiFetch(`/settings/roles/${id}`, { method: 'DELETE' });
      showToast('Role deleted successfully.', 'success');
      await this.loadRoles();
      this.renderRoles();
    } catch (err) {
      showToast(err.message || 'Failed to delete role.', 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => UsersModule.init(), 100);
});
