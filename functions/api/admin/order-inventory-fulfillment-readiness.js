// Release 467 Build 26 — read-only Order ↔ Inventory fulfillment-readiness reconciliation.
// This projection compares recognized pre-fulfillment physical order demand with Build 24 Product/Inventory evidence.
// It does not reserve stock, deduct inventory, start production, change orders, or contact providers.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as loadSellability } from './storefront-inventory-sellability.js';

const RELEASE = 467;
const BUILD = 26;
const ACTIVE_STATUSES = new Set(['pending', 'draft', 'processing', 'paid']);
const CLOSED_STATUSES = new Set(['completed', 'cancelled', 'canceled', 'refunded']);
const PAID_STATUSES = new Set(['paid', 'completed', 'captured']);
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });
const n = (value, fallback = 0) => { const x = Number(value); return Number.isFinite(x) ? x : fallback; };
const text = (value) => String(value == null ? '' : value).trim();
const lower = (value) => text(value).toLowerCase();

async function loadOrderDemand(db) {
  const result = await db.prepare(`
    SELECT
      oi.product_id,
      MAX(COALESCE(NULLIF(oi.product_name,''),'')) AS demand_product_name,
      MAX(COALESCE(NULLIF(oi.sku,''),'')) AS demand_sku,
      LOWER(COALESCE(o.order_status,'pending')) AS order_status,
      LOWER(COALESCE(o.payment_status,'pending')) AS payment_status,
      COUNT(DISTINCT o.order_id) AS order_count,
      COALESCE(SUM(COALESCE(oi.quantity,0)),0) AS units,
      MIN(o.created_at) AS oldest_order_at,
      MAX(o.updated_at) AS latest_order_at
    FROM order_items oi
    INNER JOIN orders o ON o.order_id=oi.order_id
    WHERE oi.product_id IS NOT NULL
      AND oi.product_id > 0
      AND COALESCE(oi.requires_shipping, CASE WHEN LOWER(COALESCE(oi.product_type,''))='digital' THEN 0 ELSE 1 END)=1
      AND LOWER(COALESCE(o.order_status,'pending')) NOT IN ('completed','cancelled','canceled','refunded')
    GROUP BY oi.product_id, LOWER(COALESCE(o.order_status,'pending')), LOWER(COALESCE(o.payment_status,'pending'))
    ORDER BY oi.product_id ASC
  `).all();
  return Array.isArray(result?.results) ? result.results : [];
}

function aggregateDemand(rows = []) {
  const map = new Map();
  for (const row of rows) {
    const productId = n(row.product_id);
    if (!productId) continue;
    if (!map.has(productId)) map.set(productId, {
      product_id: productId,
      demand_product_name: text(row.demand_product_name),
      demand_sku: text(row.demand_sku),
      active_order_units: 0,
      active_order_count: 0,
      paid_active_units: 0,
      unclassified_open_units: 0,
      unclassified_order_count: 0,
      unclassified_statuses: new Set(),
      oldest_order_at: row.oldest_order_at || null,
      latest_order_at: row.latest_order_at || null,
    });
    const item = map.get(productId);
    const status = lower(row.order_status || 'pending');
    const payment = lower(row.payment_status || 'pending');
    const units = Math.max(0, n(row.units));
    const orders = Math.max(0, n(row.order_count));
    if (ACTIVE_STATUSES.has(status)) {
      item.active_order_units += units;
      item.active_order_count += orders;
      if (PAID_STATUSES.has(payment) || status === 'paid') item.paid_active_units += units;
    } else if (!CLOSED_STATUSES.has(status)) {
      item.unclassified_open_units += units;
      item.unclassified_order_count += orders;
      item.unclassified_statuses.add(status || 'unknown');
    }
    if (!item.oldest_order_at || String(row.oldest_order_at || '') < String(item.oldest_order_at)) item.oldest_order_at = row.oldest_order_at || item.oldest_order_at;
    if (!item.latest_order_at || String(row.latest_order_at || '') > String(item.latest_order_at)) item.latest_order_at = row.latest_order_at || item.latest_order_at;
  }
  return Array.from(map.values()).map((item) => ({ ...item, unclassified_statuses: Array.from(item.unclassified_statuses).sort() }));
}

function reconcile(demand, product) {
  const activeUnits = Math.max(0, n(demand.active_order_units));
  const unclassifiedUnits = Math.max(0, n(demand.unclassified_open_units));
  if (!product) {
    return {
      ...demand,
      name: demand.demand_product_name || `Product ${demand.product_id}`,
      sku: demand.demand_sku,
      product_type: 'physical',
      direct_stock_units: null,
      finished_stock_gap_units: null,
      linked_resource_count: null,
      buildable_units_from_resources: null,
      resource_shortage_links: null,
      readiness_state: 'product_missing',
      readiness_supported: false,
      detail: 'Open physical demand references a Product ID that is not present in the current Product read model.',
      owner_urls: { orders: '/admin/order-fulfillment-care/', inventory: '/admin/inventory-intelligence/', product: '/admin/products/' },
    };
  }

  const stock = Math.max(0, n(product.direct_stock_units));
  const tracked = product.inventory_tracked === true;
  const buildable = product.buildable_units_from_resources == null ? null : Math.max(0, n(product.buildable_units_from_resources));
  const shortageLinks = Math.max(0, n(product.resource_shortage_links));
  const resourceLinks = Math.max(0, n(product.linked_resource_count));
  const stockGap = activeUnits > stock ? activeUnits - stock : 0;
  let state = 'capacity_unverified';
  let supported = false;
  let detail = 'Current evidence does not prove finished-stock coverage or a reviewed buildability path.';

  if (unclassifiedUnits > 0) {
    state = 'demand_unverified';
    detail = `${unclassifiedUnits} unit(s) are attached to non-closed order status(es) not classified by Build 26: ${demand.unclassified_statuses.join(', ') || 'unknown'}. Review order lifecycle state before relying on capacity.`;
  } else if (activeUnits <= 0) {
    state = 'no_active_demand';
    supported = true;
    detail = 'No recognized pre-fulfillment physical demand is currently open for this Product.';
  } else if (tracked && stock >= activeUnits) {
    state = 'finished_stock_supported';
    supported = true;
    detail = `Current finished-stock evidence (${stock}) is at least recognized active demand (${activeUnits}). This is readiness evidence only; no units are reserved here.`;
  } else if (shortageLinks > 0) {
    state = 'resource_shortage';
    detail = `${shortageLinks} linked resource shortage(s) are reported while finished stock does not cover recognized active demand.`;
  } else if (resourceLinks > 0 && buildable != null && buildable > 0) {
    state = 'buildability_review';
    detail = `Finished stock leaves a ${stockGap}-unit gap and Build 24 reports ${buildable} buildable unit(s). Build 26 does not add finished stock and buildability into a reservation promise; operator review is required.`;
  } else if (tracked && stock < activeUnits) {
    state = 'finished_stock_shortfall';
    detail = `Recognized active demand exceeds current finished-stock evidence by ${stockGap} unit(s), with no positive buildability evidence relied on by this projection.`;
  }

  return {
    ...demand,
    name: product.name,
    sku: product.sku,
    product_type: product.product_type,
    sellability_state: product.sellability_state,
    fulfillment_state: product.fulfillment_state,
    direct_stock_units: stock,
    finished_stock_gap_units: stockGap,
    linked_resource_count: resourceLinks,
    buildable_units_from_resources: buildable,
    resource_shortage_links: shortageLinks,
    readiness_state: state,
    readiness_supported: supported,
    detail,
    owner_urls: {
      orders: '/admin/order-fulfillment-care/',
      inventory: '/admin/inventory-intelligence/',
      sellability: '/admin/storefront-inventory-sellability/',
      product: `/admin/products/?product_id=${encodeURIComponent(demand.product_id)}`,
    },
  };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, release: RELEASE, build: BUILD, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, release: RELEASE, build: BUILD, error: 'Database binding is not configured.' }, 500);
  try {
    const sellabilityResponse = await loadSellability(context);
    const sellability = await sellabilityResponse.json().catch(() => null);
    if (!sellabilityResponse.ok || !sellability || sellability.ok === false) {
      return json({ ok: false, release: RELEASE, build: BUILD, error: sellability?.error || `Build 24 sellability authority returned HTTP ${sellabilityResponse.status}.` }, sellabilityResponse.status || 500);
    }
    const demand = aggregateDemand(await loadOrderDemand(db));
    const products = new Map((Array.isArray(sellability.products) ? sellability.products : []).map((p) => [n(p.product_id), p]));
    const rows = demand
      .filter((d) => d.active_order_units > 0 || d.unclassified_open_units > 0)
      .map((d) => reconcile(d, products.get(n(d.product_id))))
      .sort((a, b) => Number(a.readiness_supported) - Number(b.readiness_supported) || b.paid_active_units - a.paid_active_units || b.active_order_units - a.active_order_units || a.name.localeCompare(b.name));
    const count = (state) => rows.filter((x) => x.readiness_state === state).length;
    const summary = {
      products_with_open_demand: rows.length,
      recognized_active_units: rows.reduce((sum, x) => sum + n(x.active_order_units), 0),
      paid_active_units: rows.reduce((sum, x) => sum + n(x.paid_active_units), 0),
      unclassified_open_units: rows.reduce((sum, x) => sum + n(x.unclassified_open_units), 0),
      finished_stock_supported: count('finished_stock_supported'),
      buildability_review: count('buildability_review'),
      finished_stock_shortfall: count('finished_stock_shortfall'),
      resource_shortage: count('resource_shortage'),
      demand_unverified: count('demand_unverified'),
      capacity_unverified: count('capacity_unverified'),
      product_missing: count('product_missing'),
    };
    return json({
      ok: true,
      release: RELEASE,
      build: BUILD,
      role: 'read_only_order_inventory_fulfillment_readiness_reconciliation',
      authorities: {
        order_customer_care: '/api/admin/order-fulfillment-care',
        sellability_inventory: '/api/admin/storefront-inventory-sellability',
        order_write_owner: '/admin/order-fulfillment-care/',
        inventory_owner: '/admin/inventory-intelligence/',
      },
      boundaries: {
        inventory_reservation: false,
        inventory_deduction: false,
        automatic_build: false,
        order_mutation: false,
        shipment_mutation: false,
        customer_contact: false,
        provider_execution: false,
        request_time_schema_mutation: false,
      },
      semantics: {
        recognized_active_statuses: Array.from(ACTIVE_STATUSES),
        closed_statuses: Array.from(CLOSED_STATUSES),
        finished_stock_supported: 'Gross current finished-stock evidence is at least recognized pre-fulfillment demand. No reservation is created.',
        buildability_review: 'Positive Build 24 buildability evidence exists after a finished-stock gap, but Build 26 does not add stock and buildability into a promised capacity total.',
        unclassified_open_demand: 'Any non-closed order status outside the recognized Build 26 demand states forces review rather than being silently classified.',
      },
      upstream_warnings: Array.isArray(sellability.upstream_warnings) ? sellability.upstream_warnings : [],
      summary,
      rows,
    });
  } catch (error) {
    return json({ ok: false, release: RELEASE, build: BUILD, error: error?.message || 'Order/Inventory fulfillment readiness could not load.' }, 500);
  }
}
