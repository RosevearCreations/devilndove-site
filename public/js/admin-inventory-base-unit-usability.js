// Release 461: inventory usability overlay for purchase-package vs usable/base-unit authority.
// Presentation only: all inventory mutation remains owned by /api/admin/site-item-inventory.

const STYLE_ID = 'ddInventoryBaseUnitUsabilityStyle';
const SUMMARY_ID = 'siteInventoryBaseUnitSummary';

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function positive(value, fallback = 1) {
  const parsed = number(value, fallback);
  return parsed > 0 ? parsed : fallback;
}

function text(value, fallback = 'unit') {
  return String(value || '').trim() || fallback;
}

function formatQty(value) {
  const n = number(value, 0);
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(n);
}

function formatMoneyCents(value) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'CAD', maximumFractionDigits: 4 }).format(number(value, 0) / 100);
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .dd-inventory-unit-summary{margin:12px 0;padding:12px;border:1px solid var(--border,#555);border-radius:12px;background:rgba(255,255,255,.035)}
    .dd-inventory-unit-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:8px}
    .dd-inventory-unit-stat{padding:8px 10px;border:1px solid var(--border,#555);border-radius:10px;min-width:0}
    .dd-inventory-unit-stat strong{display:block;font-size:1.05rem;overflow-wrap:anywhere}
    .dd-inventory-base-readout{margin-top:5px;padding-top:5px;border-top:1px dashed currentColor;font-size:.82em;opacity:.9}
    .dd-inventory-base-authority{font-weight:700}
    .dd-inventory-unit-note{margin-top:6px}
    @media(max-width:760px){.dd-inventory-unit-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:480px){.dd-inventory-unit-summary-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

function setLabel(forId, label) {
  const target = document.querySelector(`label[for="${forId}"]`);
  if (target) target.textContent = label;
}

function formValues() {
  const read = (id) => number(document.getElementById(id)?.value, 0);
  const purchaseLabel = text(document.getElementById('siteInventoryStockUnitLabel')?.value, 'unit');
  const baseLabel = text(document.getElementById('siteInventoryUsageUnitLabel')?.value, 'unit');
  const perPurchase = positive(document.getElementById('siteInventoryUsageUnitsPerStock')?.value, 1);
  const purchaseCostCents = Math.max(0, read('siteInventoryUnitCost') * 100);
  return {
    purchaseLabel,
    baseLabel,
    perPurchase,
    purchaseCostCents,
    onHand: Math.max(0, read('siteInventoryOnHand')),
    reserved: Math.max(0, read('siteInventoryReservedInput')),
    incoming: Math.max(0, read('siteInventoryIncomingInput')),
    reorder: Math.max(0, read('siteInventoryReorder')),
    preferred: Math.max(0, read('siteInventoryPreferredReorderQty'))
  };
}

function renderFormSummary() {
  const form = document.getElementById('siteInventoryForm');
  if (!form) return;
  let summary = document.getElementById(SUMMARY_ID);
  if (!summary) {
    summary = document.createElement('div');
    summary.id = SUMMARY_ID;
    summary.className = 'dd-inventory-unit-summary';
    summary.setAttribute('aria-live', 'polite');
    const unitField = document.getElementById('siteInventoryUsageUnitsPerStock')?.closest('div, label');
    (unitField?.parentElement || form).insertAdjacentElement('afterend', summary);
  }
  const v = formValues();
  const availableBase = Math.max(0, (v.onHand - v.reserved) * v.perPurchase);
  const baseCost = v.purchaseCostCents / v.perPurchase;
  summary.innerHTML = `
    <strong>Inventory quantity authority</strong>
    <div class="small dd-inventory-unit-note">Receive and cost by purchase package. Production availability and material use are authoritative in the usable/base unit.</div>
    <div class="dd-inventory-unit-summary-grid">
      <div class="dd-inventory-unit-stat"><span class="small">Conversion</span><strong>1 ${v.purchaseLabel} = ${formatQty(v.perPurchase)} ${v.baseLabel}</strong></div>
      <div class="dd-inventory-unit-stat"><span class="small">Usable on hand</span><strong>${formatQty(v.onHand * v.perPurchase)} ${v.baseLabel}</strong><span class="small">${formatQty(v.onHand)} ${v.purchaseLabel} received/held</span></div>
      <div class="dd-inventory-unit-stat"><span class="small">Usable available</span><strong>${formatQty(availableBase)} ${v.baseLabel}</strong><span class="small">after ${formatQty(v.reserved * v.perPurchase)} ${v.baseLabel} reserved</span></div>
      <div class="dd-inventory-unit-stat"><span class="small">Cost authority</span><strong>${formatMoneyCents(v.purchaseCostCents)} / ${v.purchaseLabel}</strong><span class="small">≈ ${formatMoneyCents(baseCost)} / ${v.baseLabel}</span></div>
      <div class="dd-inventory-unit-stat"><span class="small">Incoming usable</span><strong>${formatQty(v.incoming * v.perPurchase)} ${v.baseLabel}</strong></div>
      <div class="dd-inventory-unit-stat"><span class="small">Reorder threshold</span><strong>${formatQty(v.reorder * v.perPurchase)} ${v.baseLabel}</strong></div>
      <div class="dd-inventory-unit-stat"><span class="small">Preferred reorder</span><strong>${formatQty(v.preferred)} ${v.purchaseLabel}</strong><span class="small">${formatQty(v.preferred * v.perPurchase)} ${v.baseLabel}</span></div>
    </div>`;
}

function relabelForm() {
  setLabel('siteInventoryOnHand', 'On hand (purchase units)');
  setLabel('siteInventoryReservedInput', 'Reserved (purchase units)');
  setLabel('siteInventoryIncomingInput', 'Incoming (purchase units)');
  setLabel('siteInventoryReorder', 'Reorder at (purchase units)');
  setLabel('siteInventoryPreferredReorderQty', 'Preferred reorder (purchase units)');
  setLabel('siteInventoryStockUnitLabel', 'Purchase / package unit');
  setLabel('siteInventoryUsageUnitLabel', 'Usable / base unit');
  setLabel('siteInventoryUsageUnitsPerStock', 'Usable units per purchase unit');
  setLabel('siteInventoryUnitCost', 'Purchase-unit cost (CAD)');
}

function parseItemFromRow(row) {
  const carrier = row?.querySelector('[data-load-form-id][data-item], [data-save-row-id][data-item], [data-adjust-action][data-item]');
  if (!carrier) return {};
  try { return JSON.parse(carrier.getAttribute('data-item') || '{}'); } catch { return {}; }
}

function appendReadout(cell, html) {
  if (!cell || cell.querySelector('.dd-inventory-base-readout')) return;
  const div = document.createElement('div');
  div.className = 'dd-inventory-base-readout';
  div.innerHTML = html;
  cell.appendChild(div);
}

function decorateRows() {
  const table = document.querySelector('.site-inventory-admin-table');
  if (!table) return;
  const headers = table.querySelectorAll('thead th');
  for (const header of headers) {
    if (header.textContent.trim() === 'On hand') header.textContent = 'Purchase / usable on hand';
    if (header.textContent.trim() === 'Reorder at') header.textContent = 'Purchase / usable reorder';
    if (header.textContent.trim() === 'Unit cost') header.textContent = 'Purchase / usable cost';
  }

  for (const row of table.querySelectorAll('tbody tr')) {
    const item = parseItemFromRow(row);
    if (!item?.site_item_inventory_id || item.quantity_authority !== 'base') continue;
    const purchaseLabel = text(item.purchase_unit_label || item.stock_unit_label, 'unit');
    const baseLabel = text(item.base_unit_label || item.usage_unit_label, 'unit');
    const perPurchase = positive(item.base_units_per_purchase_unit || item.usage_units_per_stock_unit, 1);
    const onHandCell = row.querySelector('[data-label="On hand"]');
    const reorderCell = row.querySelector('[data-label="Reorder at"]');
    const costCell = row.querySelector('[data-label="Unit cost"]');
    appendReadout(onHandCell, `<span class="dd-inventory-base-authority">${formatQty(item.base_on_hand_quantity)} ${baseLabel} usable</span><br><span>${formatQty(item.base_available_quantity)} ${baseLabel} available</span>`);
    appendReadout(reorderCell, `<span>${formatQty(item.base_reorder_level)} ${baseLabel} usable threshold</span><br><span>1 ${purchaseLabel} = ${formatQty(perPurchase)} ${baseLabel}</span>`);
    appendReadout(costCell, `<span>${formatMoneyCents(item.base_unit_cost_cents)} / ${baseLabel}</span><br><span>package cost retained for receiving</span>`);

    const receive = row.querySelector('[data-adjust-action="receive"]');
    if (receive) {
      receive.textContent = `Receive ${purchaseLabel}`;
      receive.title = `Receiving quantity is entered in ${purchaseLabel}; usable stock is converted to ${baseLabel}.`;
    }
    const use = row.querySelector('[data-adjust-action="consume_usage"]');
    if (use) {
      use.textContent = `Record ${baseLabel} use`;
      use.title = `Material use is entered in the canonical usable/base unit: ${baseLabel}.`;
    }
  }
}

function decorateMovementHeading() {
  const heading = document.querySelector('.site-inventory-movements-card h4');
  if (!heading || heading.dataset.baseUsability === '1') return;
  heading.dataset.baseUsability = '1';
  const note = document.createElement('div');
  note.className = 'small';
  note.textContent = 'Movement history preserves purchase-package balances for receiving/correction traceability; current usable/base authority is shown in the inventory rows above.';
  heading.insertAdjacentElement('afterend', note);
}

function refresh() {
  if (!document.getElementById('siteInventoryAdminMount')) return;
  injectStyles();
  relabelForm();
  renderFormSummary();
  decorateRows();
  decorateMovementHeading();
}

function attachInputListeners() {
  const ids = [
    'siteInventoryOnHand','siteInventoryReservedInput','siteInventoryIncomingInput','siteInventoryReorder',
    'siteInventoryPreferredReorderQty','siteInventoryStockUnitLabel','siteInventoryUsageUnitLabel',
    'siteInventoryUsageUnitsPerStock','siteInventoryUnitCost'
  ];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el || el.dataset.baseUsabilityBound === '1') continue;
    el.dataset.baseUsabilityBound = '1';
    el.addEventListener('input', renderFormSummary);
    el.addEventListener('change', renderFormSummary);
  }
}

function boot() {
  const mount = document.getElementById('siteInventoryAdminMount');
  if (!mount) return;
  let queued = false;
  const run = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      refresh();
      attachInputListeners();
    });
  };
  run();
  new MutationObserver(run).observe(mount, { childList: true, subtree: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
