'use strict';

const ReportsModule = {
  init() {
    const content = document.getElementById('page-content');
    const template = document.getElementById('page-template').content.cloneNode(true);
    content.appendChild(template);

    // Default dates (last 30 days)
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    
    document.getElementById('date-from').valueAsDate = fromDate;
    document.getElementById('date-to').valueAsDate = toDate;
  },

  async generateReport(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('generate-btn');
    const fd = new FormData(form);
    const type = fd.get('type');
    const from = fd.get('from');
    const to = fd.get('to');

    try {
      btn.disabled = true;
      btn.innerHTML = 'Generating... ⏳';

      const qs = new URLSearchParams({ type, from, to });
      const res = await apiFetch(`/reports/generate?${qs}`);
      
      if (!res.data || res.data.length === 0) {
        showToast('No data found for the selected date range.', 'warning');
        return;
      }

      this.downloadCSV(res.data, type, from, to);
      showToast('Report downloaded successfully!');
      
    } catch (err) {
      showToast(err.message || 'Failed to generate report.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Generate CSV';
    }
  },

  downloadCSV(data, type, from, to) {
    const headers = this.getHeadersForType(type, data);
    const csvContent = [
      headers.join(','),
      ...data.map(row => this.formatRow(row, headers, type).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${type}_report_${from}_to_${to}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  getHeadersForType(type, data) {
    switch(type) {
      case 'production': return ['Date', 'Group Name', 'Total Bricks', 'Trips', 'Rate Per Brick', 'Total Amount', 'Notes'];
      case 'attendance': return ['Date', 'Labour Name', 'Phone', 'Group Name', 'Status', 'Notes'];
      case 'billing': return ['Bill ID', 'Group Name', 'Period Start', 'Period End', 'Status', 'Total Gross', 'Total Trip', 'Total Net'];
      case 'inventory-consumption': return ['Date', 'Material Name', 'Category', 'Quantity', 'Unit', 'Unit Cost', 'Total Cost', 'Vendor', 'Driver'];
      case 'trip-summary': return ['Date', 'Customer', 'Village', 'Destination', 'Bricks Delivered', 'Trips', 'Rate/Trip', 'Driver Name', 'Total Cost'];
      default: return Object.keys(data[0] || {});
    }
  },

  formatRow(row, headers, type) {
    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    switch(type) {
      case 'production':
        return [
          escape(new Date(row.date).toLocaleDateString()),
          escape(row.group?.name),
          escape(row.totalBricks),
          escape(row.trips),
          escape(row.ratePerBrick),
          escape(row.totalAmount),
          escape(row.notes)
        ];
      case 'attendance':
        return [
          escape(new Date(row.date).toLocaleDateString()),
          escape(row.labour?.name),
          escape(row.labour?.phone),
          escape(row.group?.name),
          escape(row.status),
          escape(row.note)
        ];
      case 'billing':
        return [
          escape(row._id),
          escape(row.group?.name),
          escape(new Date(row.periodStart).toLocaleDateString()),
          escape(new Date(row.periodEnd).toLocaleDateString()),
          escape(row.status),
          escape(row.totalGross),
          escape(row.totalTrip),
          escape(row.totalNet)
        ];
      case 'inventory-consumption':
        return [
          escape(new Date(row.date).toLocaleDateString()),
          escape(row.inventoryItem?.name),
          escape(row.inventoryItem?.category),
          escape(row.quantity),
          escape(row.unit),
          escape(row.unitCost),
          escape(row.totalCost),
          escape(row.vendorName),
          escape(row.driverName)
        ];
      case 'trip-summary':
        return [
          escape(new Date(row.date).toLocaleDateString()),
          escape(row.customerName),
          escape(row.villageName),
          escape(row.destination),
          escape(row.bricksDelivered),
          escape(row.tripsCount),
          escape(row.ratePerTrip),
          escape(row.driver?.name),
          escape(row.grandTotal)
        ];
      default:
        return headers.map(h => escape(row[h]));
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => ReportsModule.init(), 100);
});
