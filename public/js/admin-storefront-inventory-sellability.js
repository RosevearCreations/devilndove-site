// Release 467 Build 24 — read-only Storefront ↔ Inventory sellability reconciliation client.
(() => {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const text = (value) => String(value == null ? '' : value).trim();
  const esc = (value) => text(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const apiFetch = (url, options = {}) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(url, options) : fetch(url, { credentials: 'same-origin', ...options });
  let rows = [];

  async function read(response) {
    const type = text(response.headers?.get?.('content-type')).toLowerCase();
    if (!type.includes('application/json')) throw new Error(`HTTP ${response.status} did not return JSON.`);
    const data = await response.json();
    if (!response.ok || data?.ok === false) throw new Error(data?.error || `HTTP ${response.status}`);
    return data;
  }
  function message(value, error = false) {
    const node = byId('siMessage'); if (!node) return;
    node.textContent = value || '';
    node.classList.toggle('is-error', error);
    node.classList.toggle('is-success', Boolean(value && !error));
  }
  function metric(label, value, detail = '') {
    return `<div class="si-metric"><span class="small">${esc(label)}</span><strong>${esc(value)}</strong>${detail ? `<span class="small">${esc(detail)}</span>` : ''}</div>`;
  }
  function stateLabel(value) {
    return ({publication_blocked:'Publication blocked',fulfillment_blocked:'Fulfillment blocked',fulfillment_unverified:'Fulfillment unverified',sellability_supported:'Sellability supported'})[value] || value || 'Unknown';
  }
  function fulfillmentLabel(value) {
    return ({in_stock:'In stock',buildable:'Buildable',stock_blocked:'Stock blocked',resource_blocked:'Resource blocked',unverified:'Unverified',not_applicable:'Digital / N/A'})[value] || value || 'Unknown';
  }
  function renderSummary(summary = {}) {
    byId('siSummary').innerHTML = [
      metric('Products', Number(summary.total_products || 0)),
      metric('Supported', Number(summary.sellability_supported || 0), 'review evidence'),
      metric('Publication blocked', Number(summary.publication_blocked || 0)),
      metric('Fulfillment blocked', Number(summary.fulfillment_blocked || 0)),
      metric('Fulfillment unverified', Number(summary.fulfillment_unverified || 0)),
      metric('In stock', Number(summary.in_stock || 0)),
      metric('Buildable', Number(summary.buildable || 0)),
      metric('Resource blocked', Number(summary.resource_blocked || 0)),
    ].join('');
  }
  function evidence(label, value) { return `<div><span class="small">${esc(label)}</span><strong>${esc(value)}</strong></div>`; }
  function renderRow(row) {
    const issues = Array.isArray(row.issues) ? row.issues : [];
    const issueHtml = issues.length ? `<div class="si-issues">${issues.map((issue) => `<div class="si-issue"><strong>${esc(issue.lane || 'Review')}</strong><div class="small">${esc(issue.detail || '')}</div></div>`).join('')}</div>` : '';
    const buildable = row.buildable_units_from_resources == null ? 'unknown' : String(row.buildable_units_from_resources);
    return `<article class="si-row si-state-${esc(row.sellability_state)}">
      <div>
        <div class="si-badges"><span class="si-badge">${esc(stateLabel(row.sellability_state))}</span><span class="si-badge">${esc(fulfillmentLabel(row.fulfillment_state))}</span>${row.sku ? `<span class="si-badge">SKU ${esc(row.sku)}</span>` : ''}</div>
        <h2>${esc(row.name)}</h2>
        <div class="small">Publication ${row.publication_ready ? 'ready' : 'blocked'} • score ${Number(row.publication_score || 0)}% • owner ${esc(row.correction_owner || 'none')}</div>
        <div class="si-evidence">
          ${evidence('Finished stock', row.inventory_tracked ? Number(row.direct_stock_units || 0) : 'not tracked')}
          ${evidence('Linked resources', Number(row.linked_resource_count || 0))}
          ${evidence('Buildable units', buildable)}
          ${evidence('Resource shortages', Number(row.resource_shortage_links || 0))}
        </div>
        ${issueHtml}
      </div>
      <div class="si-actions"><a class="btn" href="${esc(row.owner_urls?.product || '/admin/products/')}">Product</a><a class="btn" href="${esc(row.owner_urls?.storefront_quality || '/admin/storefront-quality/')}">Storefront</a><a class="btn" href="${esc(row.owner_urls?.inventory || '/admin/inventory-intelligence/')}">Inventory</a></div>
    </article>`;
  }
  function filtered() {
    const state = byId('siState')?.value || 'all';
    const fulfillment = byId('siFulfillment')?.value || 'all';
    const q = text(byId('siSearch')?.value).toLowerCase();
    return rows.filter((row) => {
      if (state !== 'all' && row.sellability_state !== state) return false;
      if (fulfillment !== 'all' && row.fulfillment_state !== fulfillment) return false;
      if (q && ![row.name,row.sku,row.status,row.review_status,row.sellability_state,row.fulfillment_state].some((value) => text(value).toLowerCase().includes(q))) return false;
      return true;
    });
  }
  function renderList() {
    const list = filtered();
    byId('siCount').textContent = `${list.length} of ${rows.length} Product(s)`;
    byId('siList').innerHTML = list.map(renderRow).join('') || '<div class="card"><p class="small">No Products match the current reconciliation filters.</p></div>';
  }
  async function load() {
    message('Loading Product publication and Inventory fulfillment evidence…');
    const data = await read(await apiFetch('/api/admin/storefront-inventory-sellability', { cache: 'no-store' }));
    rows = Array.isArray(data.products) ? data.products : [];
    renderSummary(data.summary || {});
    renderList();
    const warnings = Array.isArray(data.upstream_warnings) ? data.upstream_warnings.filter(Boolean) : [];
    message(`Release 467 Build 24 loaded ${rows.length} Product(s). Read-only; no Product, Inventory or public offer mutation occurred.${warnings.length ? ` ${warnings.length} upstream warning(s) reported.` : ''}`);
  }
  function reset() {
    if (byId('siState')) byId('siState').value = 'all';
    if (byId('siFulfillment')) byId('siFulfillment').value = 'all';
    if (byId('siSearch')) byId('siSearch').value = '';
    renderList();
  }
  function init() {
    ['siState','siFulfillment'].forEach((id) => byId(id)?.addEventListener('change', renderList));
    byId('siSearch')?.addEventListener('input', renderList);
    byId('siRefresh')?.addEventListener('click', () => load().catch((error) => message(error.message || String(error), true)));
    byId('siReset')?.addEventListener('click', reset);
    load().catch((error) => message(error.message || String(error), true));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
