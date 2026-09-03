// Release 467 Build 25 — read-only Finance ↔ Product/Inventory unit-economics readiness client.
(() => {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const text = (value) => String(value == null ? '' : value).trim();
  const esc = (value) => text(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const apiFetch = (url, options = {}) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(url, options) : fetch(url, { credentials: 'same-origin', ...options });
  const currentMonth = () => new Date().toISOString().slice(0, 7);
  let rows = [];

  async function read(response) {
    const type = text(response.headers?.get?.('content-type')).toLowerCase();
    if (!type.includes('application/json')) throw new Error(`HTTP ${response.status} did not return JSON.`);
    const data = await response.json();
    if (!response.ok || data?.ok === false) throw new Error(data?.error || `HTTP ${response.status}`);
    return data;
  }
  function message(value, error = false) {
    const node = byId('ueMessage'); if (!node) return;
    node.textContent = value || '';
    node.classList.toggle('is-error', error);
    node.classList.toggle('is-success', Boolean(value && !error));
  }
  function money(cents, currency = 'CAD') {
    const n = Number(cents || 0) / 100;
    try { return new Intl.NumberFormat('en-CA', { style: 'currency', currency: currency || 'CAD' }).format(n); } catch { return `$${n.toFixed(2)}`; }
  }
  function metric(label, value, detail = '') { return `<div class="ue-metric"><span class="small">${esc(label)}</span><strong>${esc(value)}</strong>${detail ? `<span class="small">${esc(detail)}</span>` : ''}</div>`; }
  function stateLabel(value) {
    return ({publication_blocked:'Publication blocked',fulfillment_blocked:'Fulfillment blocked',fulfillment_unverified:'Fulfillment unverified',costing_incomplete:'Costing incomplete',costing_unverified:'Costing unverified',price_unverified:'Price unverified',nonpositive_estimated_headroom:'Non-positive estimated headroom',review_supported:'Review supported'})[value] || value || 'Unknown';
  }
  function costingLabel(value) {
    return ({estimated_cost_available:'Estimated cost available',schema_unavailable:'Costing schema unavailable',product_costing_unavailable:'Product costing unavailable',missing_cost_links:'Missing cost links',costing_unverified_zero_cost:'Zero-cost evidence unverified'})[value] || value || 'Unknown';
  }
  function renderSummary(summary = {}, period = '') {
    byId('ueSummary').innerHTML = [
      metric('Period', period || '—'),
      metric('Products', Number(summary.total_products || 0)),
      metric('Review supported', Number(summary.review_supported || 0), 'evidence only'),
      metric('Costing incomplete', Number(summary.costing_incomplete || 0)),
      metric('Costing unverified', Number(summary.costing_unverified || 0)),
      metric('Non-positive headroom', Number(summary.nonpositive_estimated_headroom || 0)),
      metric('Fulfillment blocked', Number(summary.fulfillment_blocked || 0)),
      metric('Sold in period', Number(summary.products_sold_in_period || 0)),
    ].join('');
  }
  function evidence(label, value) { return `<div><span class="small">${esc(label)}</span><strong>${esc(value)}</strong></div>`; }
  function renderRow(row) {
    const issues = Array.isArray(row.issues) ? row.issues : [];
    const issueHtml = issues.length ? `<div class="ue-issues">${issues.map((issue) => `<div class="ue-issue"><strong>${esc(issue.lane || 'Review')}</strong><div class="small">${esc(issue.detail || '')}</div></div>`).join('')}</div>` : '';
    const headroomPct = row.estimated_price_headroom_percent == null ? 'n/a' : `${Number(row.estimated_price_headroom_percent).toFixed(1)}%`;
    return `<article class="ue-row ue-state-${esc(row.economics_state)}">
      <div>
        <div class="ue-badges"><span class="ue-badge">${esc(stateLabel(row.economics_state))}</span><span class="ue-badge">${esc(costingLabel(row.costing_state))}</span>${row.sku ? `<span class="ue-badge">SKU ${esc(row.sku)}</span>` : ''}</div>
        <h2>${esc(row.name)}</h2>
        <div class="small">Sellability ${esc(row.sellability_state || 'unknown')} • fulfillment ${esc(row.fulfillment_state || 'unknown')} • ${Number(row.sold_quantity_in_period || 0)} unit(s) sold in period</div>
        <div class="ue-evidence">
          ${evidence('Price', money(row.price_cents, row.currency))}
          ${evidence('Direct cost', money(row.direct_unit_cost_cents, row.currency))}
          ${evidence('Linked-resource cost', money(row.linked_resource_cost_cents, row.currency))}
          ${evidence('Allocated overhead / unit', money(row.allocated_overhead_cents, row.currency))}
          ${evidence('Estimated full unit cost', money(row.estimated_full_unit_cost_cents, row.currency))}
          ${evidence('Estimated price headroom', `${money(row.estimated_price_headroom_cents, row.currency)} (${headroomPct})`)}
          ${evidence('Missing cost links', Number(row.missing_cost_links || 0))}
          ${evidence('Period revenue', money(row.sold_revenue_cents_in_period, row.currency))}
        </div>
        ${issueHtml}
      </div>
      <div class="ue-actions"><a class="btn" href="${esc(row.owner_urls?.product || '/admin/products/')}">Product</a><a class="btn" href="${esc(row.owner_urls?.storefront_inventory || '/admin/storefront-inventory-sellability/')}">Sellability</a><a class="btn" href="${esc(row.owner_urls?.inventory || '/admin/inventory-intelligence/')}">Inventory</a><a class="btn" href="${esc(row.owner_urls?.finance || '/admin/accounting/')}">Finance</a></div>
    </article>`;
  }
  function filtered() {
    const state = byId('ueState')?.value || 'all';
    const q = text(byId('ueSearch')?.value).toLowerCase();
    return rows.filter((row) => {
      if (state !== 'all' && row.economics_state !== state) return false;
      if (q && ![row.name,row.sku,row.status,row.review_status,row.economics_state,row.costing_state,row.sellability_state,row.fulfillment_state].some((value) => text(value).toLowerCase().includes(q))) return false;
      return true;
    });
  }
  function renderList() {
    const list = filtered();
    byId('ueCount').textContent = `${list.length} of ${rows.length} Product(s)`;
    byId('ueList').innerHTML = list.map(renderRow).join('') || '<div class="card"><p class="small">No Products match the current readiness filters.</p></div>';
  }
  async function load() {
    const month = byId('ueMonth')?.value || currentMonth();
    message(`Loading ${month} Accounting cost evidence with current sellability evidence…`);
    const data = await read(await apiFetch(`/api/admin/finance-product-inventory-unit-economics?month=${encodeURIComponent(month)}`, { cache: 'no-store' }));
    rows = Array.isArray(data.products) ? data.products : [];
    renderSummary(data.summary || {}, data.period || month);
    renderList();
    const warnings = Array.isArray(data.upstream_warnings) ? data.upstream_warnings.filter(Boolean) : [];
    message(`Release 467 Build 25 loaded ${rows.length} Product(s) for ${data.period || month}. Read-only; no price, Product, Inventory, public offer or accounting mutation occurred.${warnings.length ? ` ${warnings.length} upstream warning(s) reported.` : ''}`);
  }
  function reset() {
    if (byId('ueMonth')) byId('ueMonth').value = currentMonth();
    if (byId('ueState')) byId('ueState').value = 'all';
    if (byId('ueSearch')) byId('ueSearch').value = '';
    renderList();
  }
  function init() {
    if (byId('ueMonth')) byId('ueMonth').value = currentMonth();
    byId('ueState')?.addEventListener('change', renderList);
    byId('ueSearch')?.addEventListener('input', renderList);
    byId('ueMonth')?.addEventListener('change', () => load().catch((error) => message(error.message || String(error), true)));
    byId('ueRefresh')?.addEventListener('click', () => load().catch((error) => message(error.message || String(error), true)));
    byId('ueReset')?.addEventListener('click', reset);
    load().catch((error) => message(error.message || String(error), true));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
