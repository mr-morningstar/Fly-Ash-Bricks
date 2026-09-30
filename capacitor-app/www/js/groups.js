'use strict';

/**
 * Groups Module Frontend Controller
 * Manages Mold Groups, Labour Assignments, Rates & Attendance Strips
 */
const GroupsModule = {
  groups: [],
  selectedGroup: null,
  groupLabours: [],

  async init() {
    const content = document.getElementById('page-content');
    const tpl = document.getElementById('page-template')?.content.cloneNode(true);
    if (content && tpl) content.appendChild(tpl);

    this.bindEvents();
    await this.loadGroups();
  },

  bindEvents() {
    // Open create group modal
    const createBtn = document.getElementById('create-group-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.openCreateModal());
    }

    const closeCreateBtn = document.getElementById('close-create-modal');
    if (closeCreateBtn) {
      closeCreateBtn.addEventListener('click', () => this.closeCreateModal());
    }

    const createForm = document.getElementById('create-group-form');
    if (createForm) {
      createForm.addEventListener('submit', (e) => this.handleCreateGroup(e));
    }

    // Settings modal
    const settingsBtn = document.getElementById('group-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettingsModal());
    }

    const closeSettingsBtn = document.getElementById('close-settings-modal');
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
    }

    const settingsForm = document.getElementById('group-settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => this.handleSaveSettings(e));
    }

    // Assign members modal
    const assignBtn = document.getElementById('assign-member-btn');
    if (assignBtn) {
      assignBtn.addEventListener('click', () => this.openAssignModal());
    }

    const closeAssignBtn = document.getElementById('close-assign-modal');
    if (closeAssignBtn) {
      closeAssignBtn.addEventListener('click', () => this.closeAssignModal());
    }

    const confirmAssignBtn = document.getElementById('confirm-assign-btn');
    if (confirmAssignBtn) {
      confirmAssignBtn.addEventListener('click', () => this.handleConfirmAssign());
    }
  },

  async loadGroups() {
    try {
      const res = await apiRequest('/groups?limit=100');
      this.groups = res.data?.groups || [];
      this.renderGroupsGrid();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to load groups.', 'error');
    }
  },

  renderGroupsGrid() {
    const grid = document.getElementById('groups-grid');
    if (!grid) return;

    if (this.groups.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-8">
          <span class="text-4xl">👥</span>
          <h4 class="font-black text-lg text-surface-900 dark:text-white mt-3">No Groups Created Yet</h4>
          <p class="text-xs text-surface-500 font-bold mt-1">Create your first molding group to begin organizing workers and tracking brick-making rates.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.groups.map(group => {
      const isSelected = this.selectedGroup?._id === group._id;
      const count = group.memberCount || 0;
      const max = group.maxMembers || 20;
      const pct = Math.min(Math.round((count / max) * 100), 100);

      return `
        <div onclick="GroupsModule.selectGroup('${group._id}')" 
             class="cursor-pointer bg-white dark:bg-surface-900 border ${isSelected ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-surface-200 dark:border-surface-800 hover:border-brand-500/50'} p-6 rounded-2xl shadow-sm transition-all flex flex-col justify-between gap-5 relative group">
          <div>
            <div class="flex justify-between items-start gap-2">
              <div>
                <h4 class="font-black text-lg text-surface-900 dark:text-white group-hover:text-brand-500 transition-colors">${group.name}</h4>
                <p class="text-xs text-surface-500 font-medium mt-1 line-clamp-2">${group.description || 'No description provided.'}</p>
              </div>
              <span class="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-brand-500/10 text-brand-500 border border-brand-500/20">
                ₹${Number(group.ratePerBrick || 0).toFixed(2)}/brick
              </span>
            </div>

            <!-- Capacity Progress -->
            <div class="mt-5">
              <div class="flex justify-between text-xs font-bold text-surface-400 mb-1.5">
                <span>Labours Assigned</span>
                <span class="${count >= max ? 'text-rose-500' : 'text-surface-700 dark:text-surface-300'}">${count} / ${max}</span>
              </div>
              <div class="w-full h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                <div class="h-full bg-brand-500 rounded-full transition-all duration-300" style="width: ${pct}%"></div>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-surface-100 dark:border-surface-800 flex justify-between items-center text-xs">
            <span class="text-surface-400 font-bold capitalize">Split: <strong class="text-surface-700 dark:text-surface-300">${group.splitMethod || 'equal'}</strong></span>
            <span class="text-brand-500 font-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Manage Details →
            </span>
          </div>
        </div>
      `;
    }).join('');
  },

  async selectGroup(groupId) {
    try {
      const res = await apiRequest(`/groups/${groupId}`);
      const data = res.data || {};
      this.selectedGroup = data.group;
      this.groupLabours = data.labours || [];

      // Update UI
      this.renderGroupsGrid();
      this.renderGroupDetail();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to fetch group details.', 'error');
    }
  },

  renderGroupDetail() {
    const panel = document.getElementById('group-detail-panel');
    if (!panel || !this.selectedGroup) return;

    panel.classList.remove('hidden');

    const titleEl = document.getElementById('detail-group-title');
    const descEl = document.getElementById('detail-group-desc');
    if (titleEl) titleEl.textContent = this.selectedGroup.name;
    if (descEl) descEl.textContent = `${this.selectedGroup.description || 'Molding group'} · Rate: ₹${Number(this.selectedGroup.ratePerBrick || 0).toFixed(2)}/brick · Split: ${this.selectedGroup.splitMethod || 'equal'}`;

    const tbody = document.getElementById('members-table-body');
    if (!tbody) return;

    if (this.groupLabours.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-10 text-center text-surface-400 font-bold">
            No labours currently assigned to this group. Click "➕ Assign Labours" above.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.groupLabours.map(labour => {
      return `
        <tr class="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
          <td class="px-6 py-4 font-black text-surface-900 dark:text-white">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-brand-500/10 text-brand-500 font-black flex items-center justify-center text-xs">
                ${labour.name ? labour.name[0].toUpperCase() : 'L'}
              </div>
              <div>
                <div>${labour.name}</div>
                <div class="text-[11px] font-bold text-surface-400">Joined ${labour.joiningDate ? new Date(labour.joiningDate).toLocaleDateString() : 'Active'}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 font-mono text-xs text-surface-600 dark:text-surface-300">
            ${labour.phone || '—'}
          </td>
          <td class="px-6 py-4 font-mono font-bold text-xs ${labour.advanceBalance > 0 ? 'text-amber-500' : 'text-surface-400'}">
            ₹${Number(labour.advanceBalance || 0).toLocaleString()}
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-1.5">
              <span class="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-500 text-[10px] font-black flex items-center justify-center" title="Present">P</span>
              <span class="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-500 text-[10px] font-black flex items-center justify-center" title="Present">P</span>
              <span class="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-500 text-[10px] font-black flex items-center justify-center" title="Present">P</span>
              <span class="w-6 h-6 rounded-md bg-amber-500/15 text-amber-500 text-[10px] font-black flex items-center justify-center" title="Half-Day">HD</span>
              <span class="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-500 text-[10px] font-black flex items-center justify-center" title="Present">P</span>
              <span class="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-500 text-[10px] font-black flex items-center justify-center" title="Present">P</span>
              <span class="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-500 text-[10px] font-black flex items-center justify-center" title="Present">P</span>
            </div>
          </td>
          <td class="px-6 py-4 text-right">
            <button onclick="GroupsModule.removeMember('${labour._id}')" 
                    class="px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove from group">
              Remove ✕
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  // Modal Handlers
  openCreateModal() {
    const modal = document.getElementById('create-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeCreateModal() {
    const modal = document.getElementById('create-modal');
    if (modal) modal.classList.add('hidden');
    const form = document.getElementById('create-group-form');
    if (form) form.reset();
  },

  async handleCreateGroup(e) {
    e.preventDefault();
    const name = document.getElementById('create-name')?.value?.trim();
    const description = document.getElementById('create-desc')?.value?.trim();
    const maxMembers = parseInt(document.getElementById('create-max')?.value, 10) || 20;
    const ratePerBrick = parseFloat(document.getElementById('create-rate')?.value) || 5.5;

    try {
      await apiRequest('/groups', {
        method: 'POST',
        body: JSON.stringify({ name, description, maxMembers, ratePerBrick })
      });
      if (typeof showToast === 'function') showToast(`Group "${name}" created!`, 'success');
      this.closeCreateModal();
      await this.loadGroups();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to create group.', 'error');
    }
  },

  openSettingsModal() {
    if (!this.selectedGroup) return;
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    document.getElementById('settings-group-id').value = this.selectedGroup._id;
    document.getElementById('form-rate-brick').value = this.selectedGroup.ratePerBrick || 0;
    document.getElementById('form-split-method').value = this.selectedGroup.splitMethod || 'equal';
    document.getElementById('form-fixed-rate').value = this.selectedGroup.fixedRatePerHead || 0;

    const mults = this.selectedGroup.attendanceMultipliers || { P: 1.0, HD: 0.5, FD: 1.0, A: 0 };
    document.getElementById('mult-p').value = mults.P ?? 1.0;
    document.getElementById('mult-hd').value = mults.HD ?? 0.5;
    document.getElementById('mult-fd').value = mults.FD ?? 1.0;
    document.getElementById('mult-a').value = mults.A ?? 0.0;

    modal.classList.remove('hidden');
  },

  closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('hidden');
  },

  async handleSaveSettings(e) {
    e.preventDefault();
    if (!this.selectedGroup) return;

    const ratePerBrick = parseFloat(document.getElementById('form-rate-brick')?.value) || 0;
    const splitMethod = document.getElementById('form-split-method')?.value || 'equal';
    const fixedRatePerHead = parseFloat(document.getElementById('form-fixed-rate')?.value) || 0;

    const attendanceMultipliers = {
      P: parseFloat(document.getElementById('mult-p')?.value) || 1.0,
      HD: parseFloat(document.getElementById('mult-hd')?.value) || 0.5,
      FD: parseFloat(document.getElementById('mult-fd')?.value) || 1.0,
      A: parseFloat(document.getElementById('mult-a')?.value) || 0.0,
    };

    try {
      const res = await apiRequest(`/groups/${this.selectedGroup._id}`, {
        method: 'PUT',
        body: JSON.stringify({ ratePerBrick, splitMethod, fixedRatePerHead, attendanceMultipliers })
      });
      if (typeof showToast === 'function') showToast('Group rates updated successfully!', 'success');
      this.selectedGroup = res.data;
      this.closeSettingsModal();
      await this.loadGroups();
      this.renderGroupDetail();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to update settings.', 'error');
    }
  },

  async openAssignModal() {
    if (!this.selectedGroup) return;
    const modal = document.getElementById('assign-modal');
    const container = document.getElementById('unassigned-list');
    if (!modal || !container) return;

    modal.classList.remove('hidden');
    container.innerHTML = '<div class="p-4 text-center text-xs font-bold text-surface-400">Loading unassigned labours...</div>';

    try {
      const res = await apiRequest('/labours?limit=200');
      const allLabours = res.data?.labours || [];
      // Labours not in any group or not in this group
      const available = allLabours.filter(l => !l.group || l.group._id !== this.selectedGroup._id);

      if (available.length === 0) {
        container.innerHTML = '<div class="p-6 text-center text-xs font-bold text-surface-400">All active labours are already assigned to groups.</div>';
        return;
      }

      container.innerHTML = available.map(l => {
        const currentGroup = l.group ? `(currently in ${l.group.name})` : '(unassigned)';
        return `
          <label class="flex items-center gap-3 p-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 cursor-pointer text-xs font-bold transition-colors">
            <input type="checkbox" value="${l._id}" class="assign-checkbox rounded border-surface-300 text-brand-600 focus:ring-brand-500 w-4 h-4">
            <div class="flex-1">
              <span class="text-surface-900 dark:text-white font-black">${l.name}</span>
              <span class="text-surface-400 font-medium ml-1">${l.phone || ''} ${currentGroup}</span>
            </div>
          </label>
        `;
      }).join('');
    } catch (err) {
      container.innerHTML = `<div class="p-4 text-center text-xs text-rose-500 font-bold">${err.message || 'Failed to load labours.'}</div>`;
    }
  },

  closeAssignModal() {
    const modal = document.getElementById('assign-modal');
    if (modal) modal.classList.add('hidden');
  },

  async handleConfirmAssign() {
    if (!this.selectedGroup) return;
    const checkboxes = document.querySelectorAll('.assign-checkbox:checked');
    const labourIds = Array.from(checkboxes).map(cb => cb.value);

    if (labourIds.length === 0) {
      if (typeof showToast === 'function') showToast('Please select at least one labour to assign.', 'warning');
      return;
    }

    try {
      await apiRequest(`/groups/${this.selectedGroup._id}/members`, {
        method: 'POST',
        body: JSON.stringify({ labourIds })
      });
      if (typeof showToast === 'function') showToast(`${labourIds.length} labours assigned to ${this.selectedGroup.name}!`, 'success');
      this.closeAssignModal();
      await this.selectGroup(this.selectedGroup._id);
      await this.loadGroups();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to assign labours.', 'error');
    }
  },

  async removeMember(labourId) {
    if (!this.selectedGroup) return;
    if (!confirm('Are you sure you want to remove this labour from the group?')) return;

    try {
      await apiRequest(`/groups/${this.selectedGroup._id}/members/${labourId}`, {
        method: 'DELETE'
      });
      if (typeof showToast === 'function') showToast('Labour removed from group.', 'info');
      await this.selectGroup(this.selectedGroup._id);
      await this.loadGroups();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to remove member.', 'error');
    }
  }
};

// Initialize after layout mounts
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => GroupsModule.init(), 100);
});
