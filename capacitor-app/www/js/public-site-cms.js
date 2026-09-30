'use strict';

let siteContent = null;
let currentTab = 'articles';

document.addEventListener('DOMContentLoaded', async () => {
  renderLayout();
  // Ensure template content is mounted inside #page-content container
  const pageContent = document.getElementById('page-content');
  const template = document.getElementById('page-template');
  if (pageContent && template) {
    pageContent.innerHTML = '';
    pageContent.appendChild(template.content.cloneNode(true));
  }

  await loadSiteContent();
  await loadEnquiries();

  // Settings form listener
  const settingsForm = document.getElementById('public-settings-form');
  settingsForm?.addEventListener('submit', handleSaveSettings);

  // Leadership form listener
  const leadershipForm = document.getElementById('leadership-form');
  leadershipForm?.addEventListener('submit', handleSaveLeadership);

  // Article form listener
  const articleForm = document.getElementById('article-form');
  articleForm?.addEventListener('submit', handleSaveArticle);

  // Gallery form listener
  const galleryForm = document.getElementById('gallery-item-form');
  galleryForm?.addEventListener('submit', handleSaveGalleryItem);
});

/** Tab switcher */
function switchCmsTab(tab) {
  currentTab = tab;
  ['articles', 'leadership', 'gallery', 'enquiries', 'settings', 'preview'].forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    const content = document.getElementById(`tab-content-${t}`);
    if (t === tab) {
      btn?.classList.remove('text-surface-500', 'hover:bg-surface-800');
      btn?.classList.add('bg-brand-600', 'text-white', 'shadow-sm');
      content?.classList.remove('hidden');
    } else {
      btn?.classList.remove('bg-brand-600', 'text-white', 'shadow-sm');
      btn?.classList.add('text-surface-500', 'hover:bg-surface-800');
      content?.classList.add('hidden');
    }
  });

  if (tab === 'preview') {
    const frame = document.getElementById('live-preview-frame');
    if (frame) frame.src = frame.src; // refresh preview
  }
}

/** Load public site data from backend */
async function loadSiteContent() {
  try {
    const res = await apiFetch('/public/site');
    siteContent = res.data || {};
    renderArticles();
    renderGallery();
    populateSettingsForm();
    populateLeadershipForm();
  } catch (err) {
    console.error('Error loading public site content:', err);
  }
}

/** Render articles list */
function renderArticles() {
  const container = document.getElementById('articles-list');
  if (!container) return;

  const articles = siteContent.articles || [];
  if (!articles.length) {
    container.innerHTML = `
      <div class="col-span-2 p-8 text-center bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 text-surface-400">
        <p class="text-3xl mb-2">📰</p>
        <p class="font-bold text-surface-200 mb-1">No custom articles yet</p>
        <p class="text-xs">Click "+ New Article" above to publish your first vlog or manufacturing post.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = articles.map(art => `
    <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div class="flex justify-between items-start gap-2 mb-2">
          <span class="px-2.5 py-1 text-[11px] font-bold uppercase rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/25">
            ${art.category || 'Article'}
          </span>
          <span class="text-xs text-surface-400">${art.readTime || '5 min read'} · ${art.date || ''}</span>
        </div>
        <h3 class="font-bold text-base text-surface-100 mb-2 leading-tight">${art.title}</h3>
        <p class="text-xs text-surface-400 line-clamp-3 mb-4 leading-relaxed">${art.excerpt}</p>
      </div>
      <div class="flex justify-between items-center pt-3 border-t border-surface-800 text-xs">
        <span class="text-surface-500">By <strong>${art.author || 'Ashish Dansena'}</strong></span>
        <div class="flex gap-2">
          <button onclick="editArticle('${art._id}')" class="px-3 py-1 bg-surface-800 hover:bg-surface-700 text-surface-200 rounded-lg font-bold">Edit</button>
          <button onclick="deleteArticle('${art._id}')" class="px-3 py-1 bg-rose-900/40 hover:bg-rose-900/70 text-rose-300 rounded-lg font-bold">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

/** Render gallery */
function renderGallery() {
  const container = document.getElementById('gallery-items-grid');
  if (!container) return;

  const items = siteContent.galleryItems || [];
  if (!items.length) {
    container.innerHTML = `
      <div class="col-span-4 p-8 text-center bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 text-surface-400">
        <p class="text-3xl mb-2">🖼️</p>
        <p class="font-bold text-surface-200 mb-1">No custom gallery photos</p>
        <p class="text-xs">Add high-resolution photos of your mold yard, bricks, and delivery fleet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl overflow-hidden shadow-sm flex flex-col group">
      <div class="h-36 overflow-hidden bg-surface-950 relative">
        <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-black/60 backdrop-blur-sm text-brand-400">
          ${item.category}
        </span>
      </div>
      <div class="p-3 flex-1 flex flex-col justify-between">
        <h4 class="font-bold text-xs text-surface-200 truncate mb-2" title="${item.title}">${item.title}</h4>
        <button onclick="deleteGalleryItem('${item._id}')" class="w-full py-1 text-xs font-bold text-rose-400 hover:bg-rose-900/30 rounded-lg transition-colors">
          Delete Photo
        </button>
      </div>
    </div>
  `).join('');
}

/** Load Customer Enquiries */
async function loadEnquiries() {
  const tbody = document.getElementById('enquiries-table-body');
  if (!tbody) return;

  try {
    const res = await apiFetch('/public/enquiries');
    const list = res.data || [];

    const badge = document.getElementById('enquiry-badge');
    if (badge && list.length > 0) {
      badge.textContent = list.length;
      badge.classList.remove('hidden');
    }

    if (!list.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="p-8 text-center text-surface-400">
            No customer enquiries submitted yet. When visitors fill out the form on <code>/contact.html</code>, they appear here.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(enq => `
      <tr class="hover:bg-surface-800/40 transition-colors">
        <td class="p-4">
          <div class="font-bold text-surface-200">${enq.firstName} ${enq.lastName || ''}</div>
          <div class="text-xs text-surface-400">${enq.email || 'No email provided'}</div>
        </td>
        <td class="p-4">
          <div class="font-semibold text-brand-400">${enq.phone}</div>
          <div class="flex gap-2 mt-1 text-xs">
            <a href="tel:${enq.phone}" class="text-surface-400 hover:text-white">📞 Call</a>
            <a href="https://wa.me/${enq.phone.replace(/[^0-9]/g, '')}" target="_blank" class="text-emerald-400 hover:underline">💬 WhatsApp</a>
          </div>
        </td>
        <td class="p-4 text-surface-300">${enq.enquiryType || 'General'}</td>
        <td class="p-4 font-bold text-surface-200">${enq.quantity || '-'}</td>
        <td class="p-4 text-xs text-surface-400">${new Date(enq.createdAt).toLocaleDateString('en-IN')}</td>
        <td class="p-4">
          <button onclick="downloadEnquiryXml('${enq._id}', '${encodeURIComponent(enq.xmlData || '')}')" class="px-2.5 py-1 bg-surface-800 hover:bg-brand-600 text-surface-200 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1">
            <span>📄</span> XML
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error loading enquiries:', err);
  }
}

/** Download XML for a specific enquiry */
function downloadEnquiryXml(id, encodedXml) {
  const xml = decodeURIComponent(encodedXml) || `<?xml version="1.0" encoding="UTF-8"?><Enquiry id="${id}"><Status>Logged</Status></Enquiry>`;
  const blob = new Blob([xml], { type: 'application/xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Enquiry_${id}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Populate settings form */
function populateSettingsForm() {
  if (!siteContent) return;
  const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = val; };
  setVal('cfg-company-name', siteContent.companyName);
  setVal('cfg-phone', siteContent.contactPhone);
  setVal('cfg-email', siteContent.contactEmail);
  setVal('cfg-owner-email', siteContent.ownerEmail);
  setVal('cfg-address', siteContent.contactAddress);
  setVal('cfg-maps-cid', siteContent.googleMapsCid);
  setVal('cfg-wa-url', siteContent.socialLinks?.whatsapp);
}

/** Populate leadership form */
function populateLeadershipForm() {
  if (!siteContent) return;
  const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = val; };

  // Hero
  setVal('ldr-hero-badge', siteContent.heroBadge);
  setVal('ldr-hero-subtitle', siteContent.heroSubtitle);
  setVal('ldr-hero-image', siteContent.heroImage);

  // Dev Dansena
  const dev = siteContent.leadership?.devDansena;
  if (dev) {
    setVal('ldr-dev-name', dev.name);
    setVal('ldr-dev-role', dev.role);
    setVal('ldr-dev-phone', dev.phone);
    setVal('ldr-dev-badge', dev.badge);
    setVal('ldr-dev-location', dev.location);
    setVal('ldr-dev-photo', dev.photo);
    const prevDev = document.getElementById('prev-dev-photo');
    if (prevDev && dev.photo) prevDev.src = dev.photo;
  }

  // Ashish Dansena
  const ash = siteContent.leadership?.ashishDansena;
  if (ash) {
    setVal('ldr-ash-name', ash.name);
    setVal('ldr-ash-role', ash.role);
    setVal('ldr-ash-phone', ash.phone);
    setVal('ldr-ash-badge', ash.badge);
    setVal('ldr-ash-location', ash.location);
    setVal('ldr-ash-photo', ash.photo);
    const prevAsh = document.getElementById('prev-ash-photo');
    if (prevAsh && ash.photo) prevAsh.src = ash.photo;
  }

  // Family
  const fam = siteContent.leadership?.family;
  if (fam) {
    setVal('ldr-fam-photo', fam.photo);
    setVal('ldr-fam-title', fam.title);
    setVal('ldr-fam-subtitle', fam.subtitle);
    setVal('ldr-fam-rating-link', fam.ratingLink);
    setVal('ldr-fam-rating-text', fam.ratingText);
  }
}

/** Save Settings */
async function handleSaveSettings(e) {
  e.preventDefault();
  const payload = {
    companyName: document.getElementById('cfg-company-name')?.value.trim() || 'DEV Fly Ash Bricks',
    contactPhone: document.getElementById('cfg-phone').value.trim(),
    contactEmail: document.getElementById('cfg-email').value.trim(),
    ownerEmail: document.getElementById('cfg-owner-email').value.trim(),
    contactAddress: document.getElementById('cfg-address').value.trim(),
    googleMapsCid: document.getElementById('cfg-maps-cid').value.trim(),
    socialLinks: {
      whatsapp: document.getElementById('cfg-wa-url').value.trim()
    }
  };

  try {
    await apiFetch('/public/site', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    alert('✅ Public site settings saved successfully!');
    await loadSiteContent();
  } catch (err) {
    alert('Error saving settings: ' + (err.message || 'Unknown'));
  }
}

/** Save Leadership & Hero Settings */
async function handleSaveLeadership(e) {
  e.preventDefault();
  const payload = {
    heroBadge: document.getElementById('ldr-hero-badge')?.value.trim(),
    heroSubtitle: document.getElementById('ldr-hero-subtitle')?.value.trim(),
    heroImage: document.getElementById('ldr-hero-image')?.value.trim(),
    leadership: {
      devDansena: {
        name: document.getElementById('ldr-dev-name')?.value.trim(),
        role: document.getElementById('ldr-dev-role')?.value.trim(),
        phone: document.getElementById('ldr-dev-phone')?.value.trim(),
        badge: document.getElementById('ldr-dev-badge')?.value.trim(),
        location: document.getElementById('ldr-dev-location')?.value.trim(),
        photo: document.getElementById('ldr-dev-photo')?.value.trim()
      },
      ashishDansena: {
        name: document.getElementById('ldr-ash-name')?.value.trim(),
        role: document.getElementById('ldr-ash-role')?.value.trim(),
        phone: document.getElementById('ldr-ash-phone')?.value.trim(),
        badge: document.getElementById('ldr-ash-badge')?.value.trim(),
        location: document.getElementById('ldr-ash-location')?.value.trim(),
        photo: document.getElementById('ldr-ash-photo')?.value.trim()
      },
      family: {
        photo: document.getElementById('ldr-fam-photo')?.value.trim(),
        title: document.getElementById('ldr-fam-title')?.value.trim(),
        subtitle: document.getElementById('ldr-fam-subtitle')?.value.trim(),
        ratingLink: document.getElementById('ldr-fam-rating-link')?.value.trim(),
        ratingText: document.getElementById('ldr-fam-rating-text')?.value.trim()
      }
    }
  };

  try {
    await apiFetch('/public/site', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    alert('✅ Leadership & Hero settings saved! Refresh the public site to see changes.');
    await loadSiteContent();
  } catch (err) {
    alert('Error saving leadership settings: ' + (err.message || 'Unknown'));
  }
}

/** Modal controls */
function openArticleModal() {
  document.getElementById('article-form').reset();
  document.getElementById('art-id').value = '';
  document.getElementById('article-modal-title').textContent = 'Add New Article';
  document.getElementById('article-modal').classList.remove('hidden');
}
function closeArticleModal() {
  document.getElementById('article-modal').classList.add('hidden');
}

function openGalleryModal() {
  document.getElementById('gallery-item-form').reset();
  document.getElementById('gallery-modal').classList.remove('hidden');
}
function closeGalleryModal() {
  document.getElementById('gallery-modal').classList.add('hidden');
}

/** Save Article */
async function handleSaveArticle(e) {
  e.preventDefault();
  const id = document.getElementById('art-id').value;
  const payload = {
    title: document.getElementById('art-title').value.trim(),
    category: document.getElementById('art-category').value.trim(),
    readTime: document.getElementById('art-readtime').value.trim(),
    excerpt: document.getElementById('art-excerpt').value.trim(),
    content: document.getElementById('art-content').value.trim(),
    image: document.getElementById('art-image').value.trim()
  };

  try {
    if (id) {
      await apiFetch(`/public/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      await apiFetch('/public/articles', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    closeArticleModal();
    await loadSiteContent();
  } catch (err) {
    alert('Error saving article: ' + err.message);
  }
}

function editArticle(id) {
  const art = (siteContent.articles || []).find(a => a._id === id);
  if (!art) return;
  document.getElementById('art-id').value = art._id;
  document.getElementById('art-title').value = art.title;
  document.getElementById('art-category').value = art.category || 'Manufacturing';
  document.getElementById('art-readtime').value = art.readTime || '5 min read';
  document.getElementById('art-excerpt').value = art.excerpt || '';
  document.getElementById('art-content').value = art.content || '';
  document.getElementById('art-image').value = art.image || 'assets/gallery-2.jpg';
  document.getElementById('article-modal-title').textContent = 'Edit Article';
  document.getElementById('article-modal').classList.remove('hidden');
}

async function deleteArticle(id) {
  if (!confirm('Are you sure you want to delete this article?')) return;
  try {
    await apiFetch(`/public/articles/${id}`, { method: 'DELETE' });
    await loadSiteContent();
  } catch (err) {
    alert('Error deleting article: ' + err.message);
  }
}

/** Save Gallery Item */
async function handleSaveGalleryItem(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('gal-title').value.trim(),
    category: document.getElementById('gal-category').value,
    image: document.getElementById('gal-image').value.trim()
  };

  try {
    await apiFetch('/public/gallery-items', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    closeGalleryModal();
    await loadSiteContent();
  } catch (err) {
    alert('Error adding gallery item: ' + err.message);
  }
}

async function deleteGalleryItem(id) {
  if (!confirm('Delete this gallery photo?')) return;
  try {
    await apiFetch(`/public/gallery-items/${id}`, { method: 'DELETE' });
    await loadSiteContent();
  } catch (err) {
    alert('Error deleting gallery item: ' + err.message);
  }
}
