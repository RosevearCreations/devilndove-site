// Release 448 — manufacturer provenance and Devil n Dove-authored purchased-item reviews.
(function () {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const text = (value) => String(value == null ? '' : value).trim();
  const esc = (value) => text(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const apiFetch = (url, options = {}) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(url, options) : fetch(url, { credentials: 'same-origin', ...options });
  const state = { inventory: [], manufacturers: [], inventoryId: Number(new URLSearchParams(location.search).get('inventory_id') || 0) || 0, detail: null };

  async function readJson(response) {
    const type = text(response.headers?.get?.('content-type')).toLowerCase();
    if (!type.includes('application/json')) throw new Error(`HTTP ${response.status} did not return JSON.`);
    const payload = await response.json();
    if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `HTTP ${response.status}`);
    return payload;
  }
  function message(value, error = false) {
    const node = byId('vendorReviewMessage'); if (!node) return;
    node.textContent = value || '';
    node.classList.toggle('is-error', Boolean(error));
    node.classList.toggle('is-success', Boolean(value && !error));
  }
  function renderItems() {
    const select = byId('vendorReviewItem'); if (!select) return;
    select.innerHTML = '<option value="">Choose Tool or Supply…</option>' + state.inventory.map((row) => {
      const maker = row.manufacturer_name ? ` • ${row.manufacturer_name}` : ' • manufacturer not linked';
      const reviews = Number(row.review_count || 0) ? ` • ${Number(row.review_count)} review(s)` : '';
      return `<option value="${Number(row.site_item_inventory_id)}" ${Number(row.site_item_inventory_id) === state.inventoryId ? 'selected' : ''}>${esc(`${row.item_name || row.external_key} [${row.source_type}]${maker}${reviews}`)}</option>`;
    }).join('');
  }
  function renderManufacturers(selectedId = 0) {
    const select = byId('manufacturerSelect'); if (!select) return;
    select.innerHTML = '<option value="">Create / enter below…</option>' + state.manufacturers.map((row) => `<option value="${Number(row.manufacturer_id)}" ${Number(row.manufacturer_id) === Number(selectedId) ? 'selected' : ''}>${esc(row.manufacturer_name)}</option>`).join('');
  }
  function clearReview() {
    byId('vendorReviewId').value = '';
    byId('reviewPlatform').value = 'amazon';
    byId('reviewVendor').value = '';
    byId('reviewExternalId').value = '';
    byId('reviewSourceUrl').value = '';
    byId('reviewExternalUrl').value = '';
    byId('reviewDate').value = '';
    byId('reviewRating').value = '';
    byId('reviewVerification').value = 'unverified';
    byId('reviewTitle').value = '';
    byId('reviewBody').value = '';
    byId('reviewPublication').value = 'private';
  }
  function fillReview(row) {
    byId('vendorReviewId').value = Number(row.inventory_vendor_review_id || 0) || '';
    byId('reviewPlatform').value = row.platform_code || 'other';
    byId('reviewVendor').value = row.vendor_name || '';
    byId('reviewExternalId').value = row.external_item_id || '';
    byId('reviewSourceUrl').value = row.source_url || '';
    byId('reviewExternalUrl').value = row.external_review_url || '';
    byId('reviewDate').value = text(row.review_date).slice(0, 10);
    byId('reviewRating').value = row.rating_value == null ? '' : row.rating_value;
    byId('reviewVerification').value = row.verification_status || 'unverified';
    byId('reviewTitle').value = row.review_title || '';
    byId('reviewBody').value = row.review_body || '';
    byId('reviewPublication').value = row.publication_status || 'private';
    byId('reviewCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function renderHistory(reviews) {
    const node = byId('reviewHistory'); if (!node) return;
    if (!reviews.length) { node.innerHTML = '<p class="small">No saved reviews for this item.</p>'; return; }
    node.innerHTML = reviews.map((row) => `<article class="card" style="margin-top:10px">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><strong>${esc(row.review_title || `${row.platform_code || 'local'} review`)}</strong><div class="small">${esc(row.manufacturer_name || 'Manufacturer not linked')} • ${esc(row.vendor_name || row.platform_code || 'local')}${row.external_item_id ? ` • ${esc(row.external_item_id)}` : ''}</div></div><div class="small">${row.rating_value == null ? '' : `${Number(row.rating_value)}/5 • `}${esc(row.verification_status)} • ${esc(row.publication_status)}</div></div>
      <p class="small">${esc(row.review_body).slice(0, 700)}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-edit-review="${Number(row.inventory_vendor_review_id)}">Edit</button>${row.external_review_url ? `<a class="btn" href="${esc(row.external_review_url)}" target="_blank" rel="noopener noreferrer">Open external review</a>` : ''}${row.source_url ? `<a class="btn" href="${esc(row.source_url)}" target="_blank" rel="noopener noreferrer">Open item source</a>` : ''}</div>
    </article>`).join('');
    node.querySelectorAll('[data-edit-review]').forEach((button) => button.addEventListener('click', () => {
      const review = reviews.find((row) => Number(row.inventory_vendor_review_id) === Number(button.getAttribute('data-edit-review')));
      if (review) fillReview(review);
    }));
  }
  function renderDetail(payload) {
    state.detail = payload;
    state.manufacturers = Array.isArray(payload.manufacturers) ? payload.manufacturers : state.manufacturers;
    byId('manufacturerCard').hidden = false;
    byId('reviewCard').hidden = false;
    byId('reviewHistoryCard').hidden = false;
    const link = payload.manufacturer_link || null;
    renderManufacturers(link?.manufacturer_id || 0);
    byId('manufacturerName').value = link?.manufacturer_name || '';
    byId('manufacturerWebsite').value = link?.website_url || '';
    byId('manufacturerRelationship').value = link?.relationship_type || 'manufacturer';
    byId('manufacturerVerification').value = link?.verification_status || 'unverified';
    byId('manufacturerExternalId').value = link?.external_item_id || '';
    byId('manufacturerEvidence').value = link?.evidence_reference || '';
    renderHistory(Array.isArray(payload.reviews) ? payload.reviews : []);
    history.replaceState(null, '', `/admin/vendor-reviews/?inventory_id=${state.inventoryId}`);
  }
  async function loadIndex() {
    const q = text(byId('vendorReviewSearch')?.value);
    const payload = await readJson(await apiFetch(`/api/admin/inventory-vendor-reviews?limit=1000&q=${encodeURIComponent(q)}`, { method: 'GET', cache: 'no-store' }));
    state.inventory = Array.isArray(payload.inventory) ? payload.inventory : [];
    state.manufacturers = Array.isArray(payload.manufacturers) ? payload.manufacturers : [];
    renderItems(); renderManufacturers();
    message(`${state.inventory.length} active Tool/Supply Inventory items loaded. No marketplace was contacted.`);
    if (state.inventoryId && state.inventory.some((row) => Number(row.site_item_inventory_id) === state.inventoryId)) await loadDetail();
  }
  async function loadDetail() {
    if (!state.inventoryId) return;
    message('Loading manufacturer/review provenance…');
    const payload = await readJson(await apiFetch(`/api/admin/inventory-vendor-reviews?inventory_id=${state.inventoryId}`, { method: 'GET', cache: 'no-store' }));
    renderDetail(payload);
    message(`Loaded ${payload.item?.item_name || 'Inventory item'}. Supplier and manufacturer remain separate authorities.`);
  }
  async function saveManufacturer() {
    if (!state.inventoryId) return;
    const selected = Number(byId('manufacturerSelect').value || 0) || 0;
    const body = {
      action: 'save_manufacturer', site_item_inventory_id: state.inventoryId,
      manufacturer_id: selected || null, manufacturer_name: byId('manufacturerName').value,
      website_url: byId('manufacturerWebsite').value, relationship_type: byId('manufacturerRelationship').value,
      verification_status: byId('manufacturerVerification').value, external_item_id: byId('manufacturerExternalId').value,
      evidence_reference: byId('manufacturerEvidence').value,
    };
    const button = byId('manufacturerSave'); button.disabled = true; message('Saving manufacturer provenance…');
    try { const payload = await readJson(await apiFetch('/api/admin/inventory-vendor-reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })); renderDetail(payload); message(payload.message || 'Manufacturer saved.'); }
    catch (error) { message(error.message || String(error), true); }
    finally { button.disabled = false; }
  }
  async function saveReview() {
    if (!state.inventoryId) return;
    const body = {
      action: 'save_review', site_item_inventory_id: state.inventoryId,
      inventory_vendor_review_id: Number(byId('vendorReviewId').value || 0) || null,
      manufacturer_id: Number(byId('manufacturerSelect').value || 0) || null,
      platform_code: byId('reviewPlatform').value, vendor_name: byId('reviewVendor').value,
      external_item_id: byId('reviewExternalId').value, source_url: byId('reviewSourceUrl').value,
      external_review_url: byId('reviewExternalUrl').value, review_date: byId('reviewDate').value,
      rating_value: byId('reviewRating').value, verification_status: byId('reviewVerification').value,
      review_title: byId('reviewTitle').value, review_body: byId('reviewBody').value,
      publication_status: byId('reviewPublication').value,
    };
    const button = byId('reviewSave'); button.disabled = true; message('Saving local Devil n Dove review…');
    try { const payload = await readJson(await apiFetch('/api/admin/inventory-vendor-reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })); renderDetail(payload); clearReview(); message(payload.message || 'Review saved.'); }
    catch (error) { message(error.message || String(error), true); }
    finally { button.disabled = false; }
  }
  function init() {
    byId('vendorReviewItem')?.addEventListener('change', async (event) => { state.inventoryId = Number(event.target.value || 0); if (state.inventoryId) await loadDetail(); });
    let searchTimer = null;
    byId('vendorReviewSearch')?.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => loadIndex().catch((error) => message(error.message || String(error), true)), 250); });
    byId('manufacturerSelect')?.addEventListener('change', () => { const row = state.manufacturers.find((item) => Number(item.manufacturer_id) === Number(byId('manufacturerSelect').value || 0)); if (row) { byId('manufacturerName').value = row.manufacturer_name || ''; byId('manufacturerWebsite').value = row.website_url || ''; } });
    byId('manufacturerSave')?.addEventListener('click', saveManufacturer);
    byId('reviewSave')?.addEventListener('click', saveReview);
    byId('reviewClear')?.addEventListener('click', clearReview);
    loadIndex().catch((error) => message(error.message || String(error), true));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
