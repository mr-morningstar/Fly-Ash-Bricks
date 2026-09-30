'use strict';

const AttendanceModule = {
  groups: [],
  gridData: null,
  // Track unsaved changes: { labourId_date: status }
  pendingChanges: {},

  async init() {
    const content = document.getElementById('page-content');
    const tpl = document.getElementById('page-template').content.cloneNode(true);
    content.appendChild(tpl);

    this.populateMonthYear();
    await this.loadGroups();
    this.setupImportModal();
  },

  populateMonthYear() {
    const monthSel = document.getElementById('att-month-filter');
    const yearSel = document.getElementById('att-year-filter');
    const now = new Date();

    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    months.forEach((m, i) => {
      const opt = new Option(m, i + 1);
      if (i === now.getMonth()) opt.selected = true;
      monthSel.appendChild(opt);
    });

    for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) {
      const opt = new Option(y, y);
      if (y === now.getFullYear()) opt.selected = true;
      yearSel.appendChild(opt);
    }
  },

  async loadGroups() {
    try {
      const res = await apiFetchCached('/groups?limit=100');
      this.groups = res.data.groups || res.data;
      const sel = document.getElementById('att-group-filter');
      this.groups.forEach(g => {
        sel.innerHTML += `<option value="${g._id}">${g.name}</option>`;
      });
    } catch (err) {
      showToast('Failed to load groups.', 'error');
    }
  },

  async loadGrid() {
    const groupId = document.getElementById('att-group-filter').value;
    const month = document.getElementById('att-month-filter').value;
    const year = document.getElementById('att-year-filter').value;
    if (!groupId) return;

    const container = document.getElementById('att-grid-container');
    container.innerHTML = '<div class="p-8 text-center text-surface-500">Loading grid...</div>';
    this.pendingChanges = {};

    try {
      const res = await apiFetch(`/attendance/grid?groupId=${groupId}&month=${month}&year=${year}`);
      this.gridData = res.data;
      this.renderGrid(res.data);
    } catch (err) {
      container.innerHTML = `<div class="p-8 text-center text-rose-500">Error: ${err.message}</div>`;
    }
  },

  renderGrid({ dates, grid }) {
    if (!grid.length) {
      document.getElementById('att-grid-container').innerHTML = '<div class="p-8 text-center text-surface-500">No labours in this group.</div>';
      return;
    }

    const statuses = ['P', 'A', 'HD', 'FD'];
    const statusColor = { P: 'bg-brand-500', A: 'bg-surface-300 dark:bg-surface-600', HD: 'bg-amber-400', FD: 'bg-blue-500' };

    const dateHeaders = dates.map(d => {
      const day = new Date(d).toLocaleDateString('en-IN', { day: '2-digit', weekday: 'short' }).split(' ');
      const isWeekend = [0, 6].includes(new Date(d).getDay());
      return `<th class="p-2 text-center text-xs font-bold border-r border-surface-100 dark:border-surface-800 min-w-[52px] ${isWeekend ? 'bg-surface-50 dark:bg-surface-800/50' : ''}">
        <div>${day[1] || day[0]}</div>
        <div class="text-surface-400">${new Date(d).getDate()}</div>
      </th>`;
    }).join('');

    const rows = grid.map(row => {
      const cells = dates.map(date => {
        const entry = row.attendance[date];
        const current = this.pendingChanges[`${row.labourId}_${date}`] || entry?.status || 'A';
        return `<td class="border-r border-b border-surface-100 dark:border-surface-800 text-center p-1">
          <select onchange="AttendanceModule.markChange('${row.labourId}', '${date}', this.value)"
            class="w-full text-center text-xs font-bold rounded-lg py-1 cursor-pointer border-0 outline-none
              ${current === 'P' ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300' :
                current === 'HD' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                current === 'FD' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'}">
            ${statuses.map(s => `<option value="${s}" ${current === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>`;
      }).join('');

      const s = row.summary || {};
      return `<tr class="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
        <td class="p-3 border-r border-b border-surface-100 dark:border-surface-800 sticky left-0 bg-white dark:bg-surface-900 z-10 min-w-[120px]">
          <div class="font-bold text-sm">${row.name}</div>
          <div class="text-xs text-surface-400">${row.phone || ''}</div>
        </td>
        ${cells}
        <td class="p-2 border-b border-surface-100 dark:border-surface-800 text-center text-xs sticky right-0 bg-white dark:bg-surface-900 z-10">
          <div class="flex flex-col gap-0.5">
            <span class="text-brand-600 font-bold">P:${s.P || 0}</span>
            <span class="text-amber-600 font-bold">HD:${s.HD || 0}</span>
            <span class="text-surface-400 font-bold">A:${s.A || 0}</span>
          </div>
        </td>
      </tr>`;
    }).join('');

    document.getElementById('att-grid-container').innerHTML = `
      <table class="w-full border-collapse text-surface-700 dark:text-surface-200">
        <thead class="bg-surface-50 dark:bg-surface-800 sticky top-0 z-20">
          <tr>
            <th class="p-3 text-left text-xs font-bold uppercase border-r border-b border-surface-200 dark:border-surface-700 sticky left-0 bg-surface-50 dark:bg-surface-800 z-30 min-w-[120px]">Worker</th>
            ${dateHeaders}
            <th class="p-2 text-center text-xs font-bold border-b border-surface-200 dark:border-surface-700 sticky right-0 bg-surface-50 dark:bg-surface-800 z-30">Summary</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  },

  markChange(labourId, date, status) {
    this.pendingChanges[`${labourId}_${date}`] = status;
  },

  async saveAllBulk() {
    const groupId = document.getElementById('att-group-filter').value;
    if (!groupId || Object.keys(this.pendingChanges).length === 0) {
      showToast('No changes to save.', 'warning');
      return;
    }

    // Group changes by date
    const byDate = {};
    for (const [key, status] of Object.entries(this.pendingChanges)) {
      const [labourId, date] = key.split('_');
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push({ labour: labourId, status });
    }

    try {
      const ops = Object.entries(byDate).map(([date, records]) =>
        apiFetch('/attendance/bulk', {
          method: 'POST',
          body: JSON.stringify({ group: groupId, date, records })
        })
      );
      await Promise.all(ops);
      this.pendingChanges = {};
      showToast(`Saved attendance successfully!`);
      this.loadGrid();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  setupImportModal() {
    document.getElementById('import-modal-wrap').innerHTML = Components.ImportModal({
      entityName: 'Attendance',
      uploadFuncName: 'AttendanceModule.submitImport'
    });
  },

  openImportModal() { Components.openModal('import-Attendance-modal'); },

  async submitImport(e) {
    e.preventDefault();
    const file = document.getElementById('import-Attendance-modal-file').files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await apiFetch('/attendance/import', { method: 'POST', body: fd });
      showToast(res.message || 'Import complete.');
      Components.closeModal('import-Attendance-modal');
      this.loadGrid();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => AttendanceModule.init(), 100);
});
