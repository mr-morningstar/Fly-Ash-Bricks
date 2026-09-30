'use strict';

const SettingsModule = {
  async init() {
    const content = document.getElementById('page-content');
    const tpl = document.getElementById('page-template').content.cloneNode(true);
    content.appendChild(tpl);
    await this.loadSettings();
  },

  async loadSettings() {
    try {
      const res = await apiFetch('/settings');
      const s = res.data;
      if (!s) return;
      const fields = ['companyName', 'phone', 'email', 'address', 'defaultRatePerBrick', 'lowStockAlertThreshold'];
      fields.forEach(f => {
        const el = document.getElementById(`s-${f}`);
        if (el && s[f] !== undefined) el.value = s[f];
      });
      // Array fields
      if (s.materialUnits) {
        document.getElementById('s-materialUnits').value = s.materialUnits.join(', ');
      }
      if (s.productionLabels) {
        document.getElementById('s-productionLabels').value = s.productionLabels.join(', ');
      }
      // Bank details
      if (s.bankDetails) {
        ['bankName', 'accountNumber', 'ifscCode', 'accountHolder'].forEach(f => {
          const el = document.getElementById(`s-${f}`);
          if (el && s.bankDetails[f]) el.value = s.bankDetails[f];
        });
      }
      if (s.financialYearStartMonth) {
        const sel = document.getElementById('s-fyMonth');
        if (sel) sel.value = s.financialYearStartMonth;
      }
    } catch (err) {
      showToast('Failed to load settings.', 'error');
    }
  },

  async save(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const parseArray = (str) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
    
    const data = {
      companyName: fd.get('companyName'),
      phone: fd.get('phone'),
      email: fd.get('email'),
      address: fd.get('address'),
      defaultRatePerBrick: parseFloat(fd.get('defaultRatePerBrick')) || 0,
      lowStockAlertThreshold: parseInt(fd.get('lowStockAlertThreshold')) || 0,
      financialYearStartMonth: parseInt(fd.get('financialYearStartMonth')) || 4,
      materialUnits: parseArray(fd.get('materialUnits')),
      productionLabels: parseArray(fd.get('productionLabels')),
      bankDetails: {
        bankName: fd.get('bankDetails.bankName'),
        accountNumber: fd.get('bankDetails.accountNumber'),
        ifscCode: fd.get('bankDetails.ifscCode'),
        accountHolder: fd.get('bankDetails.accountHolder')
      }
    };
    try {
      await apiFetch('/settings', { method: 'PATCH', body: JSON.stringify(data) });
      showToast('Settings saved successfully!');
      clearApiCache();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async changePassword(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('s-cur-password').value;
    const newPassword = document.getElementById('s-new-password').value;
    const confirmPassword = document.getElementById('s-confirm-password').value;
    const btn = document.getElementById('s-change-pwd-btn');

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    if (currentPassword === newPassword) {
      showToast('New password cannot be the same as your current password.', 'warning');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Updating...';

    try {
      await apiFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      showToast('Password updated successfully!', 'success');
      document.getElementById('settings-password-form').reset();
    } catch (err) {
      showToast(err.message || 'Failed to update password. Check current password.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '🔑 Update Password';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => SettingsModule.init(), 100);
});
