// Devil n Dove Build 440 — shared Product / Inventory lot provenance helpers.
// Migration-owned schema only: no request-time CREATE/ALTER/repair.

const EPSILON = 0.000001;
const REQUIRED_TABLES = [
  'inventory_purchase_lots',
  'inventory_lot_policies',
  'product_production_run_material_lots',
  'product_finished_inventory_lots',
];

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function number(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function id(value) { const n = Number(value || 0); return Number.isInteger(n) && n > 0 ? n : 0; }
function text(value) { return String(value ?? '').trim(); }

export async function productLotSchemaReadiness(db) {
  if (!db) return { ok: false, missing_tables: [...REQUIRED_TABLES] };
  const placeholders = REQUIRED_TABLES.map(() => '?').join(',');
  const result = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${placeholders})`).bind(...REQUIRED_TABLES).all().catch(() => ({ results: [] }));
  const present = new Set(rows(result).map((row) => String(row.name || '')));
  const missing = REQUIRED_TABLES.filter((name) => !present.has(name));
  return { ok: missing.length === 0, missing_tables: missing };
}

function landedUnitCostCents(lot) {
  const quantityReceived = Math.max(EPSILON, number(lot.quantity_received, 0));
  const base = Math.max(0, number(lot.unit_cost_cents, 0));
  const extras = Math.max(0, number(lot.shipping_cost_cents, 0)) + Math.max(0, number(lot.tax_cost_cents, 0));
  return base + (extras / quantityReceived);
}

function candidateShape(row) {
  return {
    inventory_purchase_lot_id: id(row.inventory_purchase_lot_id),
    lot_code: row.lot_code || '',
    quantity_remaining: Math.max(0, number(row.quantity_remaining, 0)),
    quantity_received: Math.max(0, number(row.quantity_received, 0)),
    unit_cost_cents: Math.max(0, Math.round(number(row.unit_cost_cents, 0))),
    landed_unit_cost_cents: Number(landedUnitCostCents(row).toFixed(4)),
    supplier_name: row.supplier_name || '',
    supplier_sku: row.supplier_sku || '',
    source_url: row.source_url || '',
    purchase_date: row.purchase_date || null,
    received_date: row.received_date || null,
    expiry_date: row.expiry_date || null,
    lot_status: row.lot_status || '',
  };
}

export async function loadMaterialLotPlan(db, siteItemInventoryId, requiredStockQuantity) {
  const inventoryId = id(siteItemInventoryId);
  const required = Math.max(0, number(requiredStockQuantity, 0));
  if (!inventoryId || required <= EPSILON) {
    return { ready: true, method: 'none', candidates: [], allocations: [], required_stock_quantity: required, estimated_cost_cents: 0, blockers: [] };
  }

  const [policy, lotResult] = await Promise.all([
    db.prepare(`SELECT site_item_inventory_id,depletion_method,reconcile_status,last_reconciled_quantity,last_reconciled_at FROM inventory_lot_policies WHERE site_item_inventory_id=? LIMIT 1`).bind(inventoryId).first().catch(() => null),
    db.prepare(`SELECT inventory_purchase_lot_id,site_item_inventory_id,lot_code,purchase_date,received_date,supplier_name,supplier_order_number,supplier_sku,asin,source_url,quantity_received,quantity_remaining,unit_cost_cents,shipping_cost_cents,tax_cost_cents,expiry_date,storage_location,lot_status,notes,created_at FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_status='available' AND quantity_remaining>? ORDER BY inventory_purchase_lot_id ASC`).bind(inventoryId, EPSILON).all().catch(() => ({ results: [] })),
  ]);

  const methodRaw = text(policy?.depletion_method).toLowerCase();
  const method = ['fifo', 'fefo', 'manual'].includes(methodRaw) ? methodRaw : 'manual';
  const reconcileStatus = text(policy?.reconcile_status).toLowerCase() || 'needs_review';
  const today = new Date().toISOString().slice(0, 10);
  let candidates = rows(lotResult)
    .filter((row) => !row.expiry_date || String(row.expiry_date) >= today)
    .map(candidateShape);

  if (method === 'fifo') {
    candidates.sort((a, b) => String(a.received_date || a.purchase_date || '').localeCompare(String(b.received_date || b.purchase_date || '')) || a.inventory_purchase_lot_id - b.inventory_purchase_lot_id);
  } else if (method === 'fefo') {
    candidates.sort((a, b) => {
      const ae = a.expiry_date || '9999-12-31';
      const be = b.expiry_date || '9999-12-31';
      return String(ae).localeCompare(String(be)) || String(a.received_date || a.purchase_date || '').localeCompare(String(b.received_date || b.purchase_date || '')) || a.inventory_purchase_lot_id - b.inventory_purchase_lot_id;
    });
  }

  const blockers = [];
  if (reconcileStatus === 'blocked') {
    blockers.push('Purchase-lot reconciliation is blocked for this inventory item. Reconcile the lot total before production.');
  }
  if (!candidates.length) {
    blockers.push('No available, non-expired purchase lot can cover this material usage.');
  }

  let allocationCandidates = candidates;
  let allocationMethod = method;
  if (method === 'manual') {
    if (candidates.length === 1) {
      allocationCandidates = candidates;
      allocationMethod = 'single_lot';
    } else if (candidates.length > 1) {
      allocationCandidates = [];
      blockers.push('This inventory item has multiple available purchase lots while depletion is Manual. Choose FIFO or FEFO in Inventory Lot controls before production so provenance is deterministic.');
    }
  }

  const allocations = [];
  let remaining = required;
  for (let index = 0; index < allocationCandidates.length && remaining > EPSILON; index += 1) {
    const lot = allocationCandidates[index];
    const take = Math.min(remaining, lot.quantity_remaining);
    if (take <= EPSILON) continue;
    const extended = Math.max(0, Math.round(take * lot.landed_unit_cost_cents));
    allocations.push({
      ...lot,
      allocation_sequence: allocations.length,
      allocation_method: allocationMethod,
      quantity_consumed: Number(take.toFixed(6)),
      quantity_remaining_after: Number((lot.quantity_remaining - take).toFixed(6)),
      extended_cost_cents: extended,
    });
    remaining = Number((remaining - take).toFixed(6));
  }
  if (remaining > EPSILON && allocationCandidates.length) {
    blockers.push(`Purchase lots are short by ${remaining.toFixed(6)} stock unit(s).`);
  }

  return {
    ready: blockers.length === 0 ? 1 : 0,
    method: allocationMethod,
    reconcile_status: reconcileStatus,
    required_stock_quantity: Number(required.toFixed(6)),
    covered_stock_quantity: Number((required - Math.max(0, remaining)).toFixed(6)),
    candidates,
    allocations,
    estimated_cost_cents: allocations.reduce((sum, row) => sum + Number(row.extended_cost_cents || 0), 0),
    blockers,
  };
}

export async function loadFinishedLotGuard(db, productProductionRunId) {
  const runId = id(productProductionRunId);
  if (!runId) return null;
  const row = await db.prepare(`
    SELECT
      a.product_finished_inventory_lot_id,a.lot_key,a.product_id,a.product_production_run_id,a.source_kind,
      a.quantity_created,a.unit_material_cost_cents,a.lot_status,a.created_at,
      a.product_committed_quantity,a.prior_available_quantity,a.attributed_committed_quantity,a.attributed_uncommitted_quantity
    FROM product_finished_lot_commitment_attribution a
    WHERE a.product_production_run_id=?
    LIMIT 1
  `).bind(runId).first().catch(() => null);
  if (!row) return null;
  return {
    ...row,
    product_finished_inventory_lot_id: id(row.product_finished_inventory_lot_id),
    quantity_created: Math.max(0, number(row.quantity_created, 0)),
    product_committed_quantity: Math.max(0, number(row.product_committed_quantity, 0)),
    prior_available_quantity: Math.max(0, number(row.prior_available_quantity, 0)),
    attributed_committed_quantity: Math.max(0, number(row.attributed_committed_quantity, 0)),
    attributed_uncommitted_quantity: Math.max(0, number(row.attributed_uncommitted_quantity, 0)),
  };
}

export { EPSILON, landedUnitCostCents };
