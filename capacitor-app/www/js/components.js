'use strict';

/**
 * Reusable Components Library for DEV Bricks Enterprise
 * Renders HTML structures and attaches standard behaviors.
 */

const Components = {

  /** 
   * Enhanced Data Table with pagination, empty states, and skeleton loading 
   * columns: Array of { key, label, render(item), class }
   */
  DataTable({ id, columns, data, loading, emptyMessage = 'No records found.' }) {
    if (loading) {
      const skeletonRows = Array(5).fill('').map(() => `
        <tr class="border-b border-surface-200 dark:border-surface-800">
          ${columns.map(() => `<td class="p-4"><div class="skeleton h-4 rounded w-full"></div></td>`).join('')}
        </tr>
      `).join('');
      return this._tableShell(id, columns, skeletonRows);
    }

    if (!data || data.length === 0) {
      return this._tableShell(id, columns, `
        <tr>
          <td colspan="${columns.length}" class="p-8 text-center text-surface-500">
            <div class="flex flex-col items-center gap-2">
              <span class="text-4xl">📭</span>
              <span>${emptyMessage}</span>
            </div>
          </td>
        </tr>
      `);
    }

    const rows = data.map(item => `
      <tr class="border-b border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
        ${columns.map(col => `
          <td class="p-4 text-sm ${col.class || ''}">
            ${col.render ? col.render(item) : (item[col.key] || '-')}
          </td>
        `).join('')}
      </tr>
    `).join('');

    return this._tableShell(id, columns, rows);
  },

  _tableShell(id, columns, bodyHtml) {
    return `
      <div class="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-sm">
        <table id="${id}" class="w-full text-left border-collapse whitespace-nowrap">
          <thead class="bg-surface-50 dark:bg-surface-800/80 text-surface-600 dark:text-surface-300 border-b border-surface-200 dark:border-surface-700">
            <tr>
              ${columns.map(col => `<th class="p-4 font-bold text-xs uppercase tracking-wider ${col.class || ''}">${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody class="text-surface-700 dark:text-surface-300">
            ${bodyHtml}
          </tbody>
        </table>
      </div>
    `;
  },

  /** ERP style pagination controls */
  Pagination({ currentPage, totalPages, totalItems, limit, onPageChangeName }) {
    if (totalItems === 0) return '';
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalItems);

    return `
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
        <div class="text-sm text-surface-500 dark:text-surface-400">
          Showing <span class="font-bold text-surface-800 dark:text-white">${start}</span> to <span class="font-bold text-surface-800 dark:text-white">${end}</span> of <span class="font-bold text-surface-800 dark:text-white">${totalItems}</span> results
        </div>
        <div class="flex gap-2">
          <button onclick="${onPageChangeName}(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} 
            class="px-4 py-2 rounded-lg font-medium text-sm border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-50 transition-colors">
            Previous
          </button>
          <button onclick="${onPageChangeName}(${currentPage + 1})" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''} 
            class="px-4 py-2 rounded-lg font-medium text-sm border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-50 transition-colors">
            Next
          </button>
        </div>
      </div>
    `;
  },

  /** Filter Bar with Date Range and Export */
  FilterBar({ searchPlaceholder = 'Search...', onSearchName, onDateFilterName, onExportName }) {
    const exportBtn = onExportName ? `
      <button onclick="${onExportName}()" class="px-4 py-2 bg-brand-600/10 text-brand-600 dark:text-brand-400 rounded-lg hover:bg-brand-600/20 transition-colors text-sm font-bold shadow-sm whitespace-nowrap flex items-center gap-2">
        <span>⬇️</span> Export CSV
      </button>
    ` : '';
    
    return `
      <div class="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
        <div class="flex-1 relative">
          <span class="absolute left-3 top-1/2 -transurface-y-1/2 text-surface-400">🔍</span>
          <input type="text" placeholder="${searchPlaceholder}" oninput="debounce(${onSearchName}, 500)(this.value)" 
                 class="w-full pl-10 pr-4 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg focus:outline-none focus:border-brand-500 transition-colors">
        </div>
        <div class="flex gap-2 filter-scroll overflow-x-auto">
          <input type="date" id="filter-start-date" class="px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          <input type="date" id="filter-end-date" class="px-3 py-2 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg text-sm">
          <button onclick="${onDateFilterName}()" class="px-4 py-2 bg-surface-800 dark:bg-surface-700 text-white rounded-lg hover:bg-surface-700 dark:hover:bg-surface-600 transition-colors text-sm font-bold shadow-sm whitespace-nowrap">
            Apply Filter
          </button>
          ${exportBtn}
        </div>
      </div>
    `;
  },

  /** Modal Container */
  Modal({ id, title, contentHtml, maxWidth = 'max-w-md' }) {
    return `
      <div id="${id}" class="hidden fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="modal-overlay absolute inset-0 bg-surface-900/60 backdrop-blur-sm" onclick="Components.closeModal('${id}')"></div>
        <div class="modal-content relative bg-white dark:bg-surface-900 w-full ${maxWidth} rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 flex flex-col max-h-[90vh]">
          <div class="flex justify-between items-center p-6 border-b border-surface-100 dark:border-surface-800">
            <h3 class="text-xl font-bold text-surface-800 dark:text-white">${title}</h3>
            <button onclick="Components.closeModal('${id}')" class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 text-2xl focus:outline-none">&times;</button>
          </div>
          <div class="p-6 overflow-y-auto custom-scrollbar">
            ${contentHtml}
          </div>
        </div>
      </div>
    `;
  },

  /** Reusable Import CSV Modal */
  ImportModal({ entityName, uploadFuncName, templateLink }) {
    const id = `import-${entityName}-modal`;
    const html = `
      <div class="text-center">
        <div class="w-16 h-16 mx-auto mb-4 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center text-3xl">
          📄
        </div>
        <p class="text-surface-500 dark:text-surface-400 mb-6 text-sm">Upload a CSV file to bulk import ${entityName}. Make sure it matches the required template format.</p>
        
        <form id="${id}-form" onsubmit="${uploadFuncName}(event)" class="flex flex-col gap-4">
          <input type="file" id="${id}-file" accept=".csv" required 
                 class="block w-full text-sm text-surface-500 dark:text-surface-400
                        file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                        file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700
                        dark:file:bg-brand-900/20 dark:file:text-brand-400
                        hover:file:bg-brand-100 transition-colors border border-dashed border-surface-300 dark:border-surface-700 rounded-xl p-4 cursor-pointer">
          
          <div class="flex gap-3 mt-2">
            ${templateLink ? `<a href="${templateLink}" target="_blank" class="flex-1 py-3 px-4 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-xl font-bold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors text-sm">Download Template</a>` : ''}
            <button type="submit" class="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all transform active:scale-95 shadow-lg shadow-brand-500/30 text-sm">Upload & Import</button>
          </div>
        </form>
      </div>
    `;
    return this.Modal({ id, title: `Import ${entityName}`, contentHtml: html });
  },

  /** Standard Stat Card */
  StatCard({ title, value, icon, color = 'emerald' }) {
    return `
      <div class="card-hover bg-white dark:bg-surface-900 p-6 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm flex items-center gap-4">
        <div class="w-14 h-14 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 flex items-center justify-center text-3xl">
          ${icon}
        </div>
        <div>
          <h4 class="text-sm font-semibold text-surface-500 dark:text-surface-400 mb-1">${title}</h4>
          <p class="text-2xl font-black text-surface-800 dark:text-white">${value}</p>
        </div>
      </div>
    `;
  },

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden');
  },

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
  }
};

window.Components = Components;
