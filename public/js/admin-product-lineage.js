// Release 448 — Product material/tool/manufacturer lineage workspace.
(function () {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const text = (value) => String(value == null ? '' : value).trim();
  const esc = (value) => text(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const apiFetch = (url, options = {}) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(url, options) : fetch(url, { credentials: 'same-origin', ...options });
  const state = { products: [], detail: null, productId: Number(new URLSearchParams(location.search).get('product_id') || 0) || 0 };

  async function readJson(response) {
    const type = text(response.headers?.get?.('content-type')).toLowerCase();
    if (!type.includes('application/json')) throw new Error(`HTTP ${response.status} did not return JSON.`);
    const payload = await response.json();
    if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `HTTP ${response.status}`);
    return payload;
  }

  function message(value, error = false) {
    const node = byId('lineageMessage'); if (!node) return;
    node.textContent = value || '';
    node.classList.toggle('is-error', Boolean(error));
    node.classList.toggle('is-success', Boolean(value && !error));
  }

  function productLabel(row) {
    const status = row.lineage_status ? ` • ${row.lineage_status}` : '';
    return `${row.name || `Product ${row.product_id}`} (${row.status || 'draft'}${status})`;
  }

  function renderProducts() {
    const select = byId('lineageProduct'); if (!select) return;
    select.innerHTML = '<option value="">Choose a product…</option>' + state.products.map((row) => `<option value="${Number(row.product_id)}" ${Number(row.product_id) === state.productId ? 'selected' : ''}>${esc(productLabel(row))}</option>`).join('');
  }

  function applyOriginPolicy() {
    const origin = text(byId('lineageOrigin')?.value).toLowerCase();
    const policy = byId('lineagePolicy'); const status = byId('lineageStatus');
    if (!policy || !status) return;
    if (['antiquity','resale','external_finished_good'].includes(origin)) {
      policy.value = 'exempt'; status.value = 'exempt'; status.disabled = true;
    } else if (origin === 'made_in_house') {
      policy.value = 'required'; status.disabled = false;
      if (['exempt','legacy_pending'].includes(status.value)) status.value = 'unverified';
    } else {
      policy.value = 'legacy_nonblocking'; status.disabled = false;
      if (status.value === 'exempt') status.value = 'legacy_pending';
    }
  }

  function renderSummary(detail) {
    const node = byId('lineageSummary'); if (!node) return;
    const s = detail.summary || {};
    const blockers = Array.isArray(detail.blockers) ? detail.blockers : [];
    const warnings = Array.isArray(detail.warnings) ? detail.warnings : [];
    node.innerHTML = `
      <div><strong>${detail.publish_blocked ? 'PUBLICATION BLOCKED' : detail.enforcement_active ? 'Required lineage currently ready' : 'Non-blocking lineage review'}</strong></div>
      <div>Materials: ${Number(s.material_links || 0)} linked • ${Number(s.resolved_material_links || 0)} resolved to Inventory • ${Number(s.verified_material_links || 0)} verified</div>
      <div>Tools/molds: ${Number(s.tool_links || 0)} linked • ${Number(s.verified_tool_links || 0)} verified</div>
      <div>Manufacturers: ${Number(s.manufacturer_count || 0)} linked • ${Number(s.verified_manufacturer_links || 0)} verified resource link(s)</div>
      ${blockers.length ? `<ul>${blockers.map((row) => `<li>${esc(row)}</li>`).join('')}</ul>` : ''}
      ${warnings.length ? `<ul>${warnings.map((row) => `<li>${esc(row)}</li>`).join('')}</ul>` : ''}`;
  }

  function roleOptions(row) {
    const current = text(row.resource_role) || (row.resource_kind === 'tool' ? 'tool' : 'material');
    const options = row.resource_kind === 'tool' ? ['tool','mold','fixture','equipment','other'] : ['material','other'];
    return options.map((value) => `<option value="${value}" ${value === current ? 'selected' : ''}>${value.replaceAll('_',' ')}</option>`).join('');
  }

  function verificationOptions(row) {
    const current = text(row.verification_status) || 'unverified';
    return ['pending','legacy_pending','unverified','verified','exempt'].map((value) => `<option value="${value}" ${value === current ? 'selected' : ''}>${value.replaceAll('_',' ')}</option>`).join('');
  }

  function manufacturerLine(row) {
    if (!row.site_item_inventory_id) return '';
    if (!row.manufacturer_id) return `<div class="small" style="margin-top:6px"><strong>Manufacturer:</strong> not linked • <a href="/admin/vendor-reviews/?inventory_id=${Number(row.site_item_inventory_id)}">review manufacturer</a></div>`;
    const verified = text(row.manufacturer_verification_status).toLowerCase() === 'verified';
    return `<div class="small" style="margin-top:6px"><strong>Manufacturer:</strong> ${esc(row.manufacturer_name || 'Unknown')} • ${esc(row.manufacturer_relationship || 'manufacturer')} • ${verified ? 'verified' : esc(row.manufacturer_verification_status || 'unverified')} • <a href="/admin/vendor-reviews/?inventory_id=${Number(row.site_item_inventory_id)}">manufacturer/reviews</a></div>`;
  }

  function renderResources(detail) {
    const node = byId('lineageResources'); if (!node) return;
    const resources = [...(detail.materials || []), ...(detail.tools || [])];
    if (!resources.length) {
      node.innerHTML = '<p class="small">No Product Tool/Supply links exist yet. Use the Product resource editor to attach raw materials and durable tools.</p>';
      return;
    }
    node.innerHTML = resources.map((row) => {
      const resolved = Number(row.site_item_inventory_id || 0) > 0 && Number(row.inventory_active || 0) === 1;
      const durable = row.resource_kind === 'tool';
      return `<article class="card" data-lineage-link="${Number(row.product_resource_link_id)}" data-kind="${esc(row.resource_kind)}" style="margin-top:10px">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><strong>${esc(row.item_name || row.source_key)}</strong><div class="small">${durable ? 'Durable Tool — never consumed by this link' : `Consumable Supply • ${esc(row.consumption_mode || 'per_unit')}`}</div></div><div class="small"><strong>${resolved ? 'Inventory linked' : 'Inventory unresolved'}</strong>${row.site_item_inventory_id ? ` • #${Number(row.site_item_inventory_id)}` : ''}</div></div>
        ${manufacturerLine(row)}
        <div class="grid cols-2" style="gap:10px;margin-top:10px"><label><span class="small">Role</span><select class="input" data-role>${roleOptions(row)}</select></label><label><span class="small">Verification</span><select class="input" data-verification>${verificationOptions(row)}</select></label></div>
        <div class="grid cols-2" style="gap:10px;margin-top:10px"><label><span class="small">Evidence reference</span><input class="input" data-evidence maxlength="1000" value="${esc(row.evidence_reference || '')}"/></label><label><span class="small">Review note</span><input class="input" data-note maxlength="2000" value="${esc(row.review_note || '')}"/></label></div>
        <div class="small" style="margin-top:8px">Source key: <code>${esc(row.source_key)}</code>${row.supplier_name ? ` • Supplier/store: ${esc(row.supplier_name)}` : ''}${row.supplier_sku ? ` • Supplier SKU: ${esc(row.supplier_sku)}` : ''}</div>
      </article>`;
    }).join('');
  }

  function renderDetail(detail) {
    state.detail = detail;
    byId('lineageProfileCard').hidden = false;
    byId('lineageResourcesCard').hidden = false;
    const profile = detail.profile || {};
    byId('lineageOrigin').value = profile.origin_kind || 'legacy_pending';
    byId('lineageStatus').value = profile.lineage_status || 'legacy_pending';
    byId('lineagePolicy').value = profile.publication_policy || 'legacy_nonblocking';
    byId('lineageEvidence').value = profile.evidence_reference || '';
    byId('lineageNotes').value = profile.review_notes || '';
    byId('lineageOpenProduct').href = `/admin/products/?product_id=${state.productId}`;
    applyOriginPolicy(); renderSummary(detail); renderResources(detail);
  }

  async function loadIndex() {
    message('Loading Product lineage authority…');
    const payload = await readJson(await apiFetch('/api/admin/product-lineage?limit=1000', { method: 'GET', cache: 'no-store' }));
    state.products = Array.isArray(payload.products) ? payload.products : [];
    renderProducts();
    if (!payload.schema_ready) message(`Release 448 lineage migration is not applied yet: ${(payload.missing_tables || []).join(', ')}.`, true);
    else message(`${state.products.length} products available. Product lineage changes never mutate stock.`);
    if (state.productId) await loadDetail();
  }

  async function loadDetail() {
    if (!state.productId) return;
    message('Loading lineage…');
    const detail = await readJson(await apiFetch(`/api/admin/product-lineage?product_id=${encodeURIComponent(state.productId)}`, { method: 'GET', cache: 'no-store' }));
    renderDetail(detail);
    history.replaceState(null, '', `/admin/product-lineage/?product_id=${state.productId}`);
    message(detail.publish_blocked ? 'Lineage loaded. Publication is blocked until the required material evidence is verified.' : 'Lineage loaded.');
  }

  function collectReviews() {
    return Array.from(document.querySelectorAll('[data-lineage-link]')).map((node) => ({
      product_resource_link_id: Number(node.getAttribute('data-lineage-link') || 0),
      resource_role: node.querySelector('[data-role]')?.value || (node.getAttribute('data-kind') === 'tool' ? 'tool' : 'material'),
      verification_status: node.querySelector('[data-verification]')?.value || 'unverified',
      evidence_reference: node.querySelector('[data-evidence]')?.value || '',
      review_note: node.querySelector('[data-note]')?.value || '',
    }));
  }

  async function save() {
    if (!state.productId) return;
    applyOriginPolicy();
    const origin = byId('lineageOrigin').value;
    const body = {
      product_id: state.productId,
      origin_kind: origin,
      lineage_status: byId('lineageStatus').value,
      publication_policy: byId('lineagePolicy').value,
      materials_required: origin === 'made_in_house' || origin === 'legacy_pending' ? 1 : 0,
      evidence_reference: byId('lineageEvidence').value,
      review_notes: byId('lineageNotes').value,
      resource_reviews: collectReviews(),
    };
    const button = byId('lineageSave'); button.disabled = true;
    message('Saving lineage review…');
    try {
      const detail = await readJson(await apiFetch('/api/admin/product-lineage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
      renderDetail(detail); message(detail.message || 'Lineage review saved.'); await loadIndex();
    } catch (error) { message(error.message || String(error), true); }
    finally { button.disabled = false; }
  }

  function verifyResolvedMaterials() {
    document.querySelectorAll('[data-lineage-link][data-kind="supply"]').forEach((node) => {
      const select = node.querySelector('[data-verification]');
      const summaryText = node.textContent || '';
      if (select && summaryText.includes('Inventory linked')) select.value = 'verified';
    });
    message('Resolved Supply links marked verified in the editor. Save the lineage review to persist them.');
  }

  function init() {
    byId('lineageProduct')?.addEventListener('change', async (event) => { state.productId = Number(event.target.value || 0); if (state.productId) await loadDetail(); });
    byId('lineageRefresh')?.addEventListener('click', () => loadIndex().catch((error) => message(error.message || String(error), true)));
    byId('lineageOrigin')?.addEventListener('change', applyOriginPolicy);
    byId('lineageSave')?.addEventListener('click', save);
    byId('lineageVerifyResolved')?.addEventListener('click', verifyResolvedMaterials);
    loadIndex().catch((error) => message(error.message || String(error), true));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
