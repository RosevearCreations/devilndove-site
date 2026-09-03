// Release 467 Build 29 — read-only Order ↔ Production Release readiness reconciliation.
// Build 26 owns open-order finished-stock gap evidence. Build 440 Product Production Release owns
// the exact lot-aware preview. This endpoint never posts production, reserves/deducts inventory,
// changes an order/shipment, contacts a customer/provider, or repairs schema.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as loadFulfillmentReadiness } from './order-inventory-fulfillment-readiness.js';
import { onRequestGet as loadProductionPreview } from './product-production-release.js';

const RELEASE = 467;
const BUILD = 29;
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });
const n = (value, fallback = 0) => { const x = Number(value); return Number.isFinite(x) ? x : fallback; };
const positiveId = (value) => { const x = Number(value); return Number.isInteger(x) && x > 0 ? x : 0; };

async function responseJson(response) {
  return response.json().catch(() => null);
}

function derivedRow(row) {
  const gap = row.finished_stock_gap_units == null ? null : Math.max(0, n(row.finished_stock_gap_units));
  const demandUnverified = row.readiness_state === 'demand_unverified' || n(row.unclassified_open_units) > 0;
  const productMissing = row.readiness_state === 'product_missing' || !positiveId(row.product_id);
  let production_release_state = 'production_preview_required';
  let production_preview_quantity = gap == null ? null : Math.max(0, Math.ceil(gap));
  let detail = 'Finished-stock demand leaves a gap. Check the existing Production Release preview for the exact gap quantity before deciding whether production can be reviewed.';
  if (productMissing) {
    production_release_state = 'product_missing';
    production_preview_quantity = null;
    detail = 'Open demand does not resolve to a current Product owner. Production readiness fails closed.';
  } else if (demandUnverified) {
    production_release_state = 'demand_unverified';
    production_preview_quantity = null;
    detail = 'Open demand contains an unclassified order state. Production quantity is not inferred until the order lifecycle is reviewed.';
  } else if (gap == null) {
    production_release_state = 'gap_unverified';
    production_preview_quantity = null;
    detail = 'Build 26 did not produce a trustworthy finished-stock gap. Production readiness fails closed.';
  } else if (gap <= 0) {
    production_release_state = 'no_production_required';
    production_preview_quantity = 0;
    detail = 'Current finished-stock evidence covers recognized open demand. No production preview is required by this reconciliation.';
  }
  return {
    ...row,
    production_release_state,
    production_preview_quantity,
    production_preview_supported: false,
    production_post_authorized: false,
    detail,
    owner_urls: {
      ...(row.owner_urls || {}),
      orders: '/admin/order-fulfillment-care/',
      production: positiveId(row.product_id) ? `/admin/products/?product_id=${encodeURIComponent(row.product_id)}` : '/admin/products/',
    },
  };
}

function previewContext(context, productId, outputQuantity) {
  const url = new URL(context.request.url);
  url.pathname = '/api/admin/product-production-release';
  url.search = '';
  url.searchParams.set('product_id', String(productId));
  url.searchParams.set('output_quantity', String(outputQuantity));
  return { ...context, request: new Request(url.toString(), { method: 'GET', headers: context.request.headers }) };
}

function summarize(rows) {
  const count = (state) => rows.filter((row) => row.production_release_state === state).length;
  return {
    products_with_open_demand: rows.length,
    recognized_active_units: rows.reduce((sum, row) => sum + Math.max(0, n(row.active_order_units)), 0),
    paid_active_units: rows.reduce((sum, row) => sum + Math.max(0, n(row.paid_active_units)), 0),
    finished_stock_gap_units: rows.reduce((sum, row) => sum + Math.max(0, n(row.finished_stock_gap_units)), 0),
    production_preview_required: count('production_preview_required'),
    no_production_required: count('no_production_required'),
    demand_unverified: count('demand_unverified'),
    gap_unverified: count('gap_unverified'),
    product_missing: count('product_missing'),
  };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, release: RELEASE, build: BUILD, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, release: RELEASE, build: BUILD, error: 'Database binding is not configured.' }, 500);
  try {
    const fulfillmentResponse = await loadFulfillmentReadiness(context);
    const fulfillment = await responseJson(fulfillmentResponse);
    if (!fulfillmentResponse.ok || !fulfillment || fulfillment.ok === false) {
      return json({ ok: false, release: RELEASE, build: BUILD, error: fulfillment?.error || `Build 26 fulfillment authority returned HTTP ${fulfillmentResponse.status}.` }, fulfillmentResponse.status || 500);
    }
    const rows = (Array.isArray(fulfillment.rows) ? fulfillment.rows : []).map(derivedRow);
    const productId = positiveId(new URL(context.request.url).searchParams.get('product_id'));
    const selected = productId ? rows.find((row) => positiveId(row.product_id) === productId) : null;
    let production_preview = null;
    let selected_row = selected || null;

    if (productId && !selected) {
      return json({ ok: false, release: RELEASE, build: BUILD, error: 'The requested Product does not have current open physical order demand in Build 26.' }, 404);
    }

    if (selected && selected.production_release_state === 'production_preview_required') {
      const outputQuantity = Math.max(1, positiveId(selected.production_preview_quantity));
      const previewResponse = await loadProductionPreview(previewContext(context, productId, outputQuantity));
      const preview = await responseJson(previewResponse);
      if (!previewResponse.ok || !preview || preview.ok === false) {
        selected_row = {
          ...selected,
          production_release_state: 'production_preview_unavailable',
          production_preview_supported: false,
          detail: preview?.error || `Production Release preview returned HTTP ${previewResponse.status}.`,
        };
      } else {
        const blockers = Array.isArray(preview.blockers) ? preview.blockers : [];
        const ready = Number(preview.ready || 0) === 1 && blockers.length === 0;
        production_preview = {
          product_id: productId,
          output_quantity: outputQuantity,
          ready,
          blockers,
          estimated_material_cost_cents: Math.max(0, n(preview.estimated_material_cost_cents)),
          lot_provenance: preview.lot_provenance || null,
          materials: Array.isArray(preview.materials) ? preview.materials : [],
          ingredients: Array.isArray(preview.ingredients) ? preview.ingredients : [],
        };
        selected_row = {
          ...selected,
          production_release_state: ready ? 'production_preview_ready_for_review' : 'production_blocked',
          production_preview_supported: ready,
          detail: ready
            ? `The existing Production Release owner reports no current blockers for an exact ${outputQuantity}-unit preview. This is review evidence only; production is not posted or reserved.`
            : `${blockers.length || 1} current Production Release blocker(s) prevent a supported ${outputQuantity}-unit preview.`,
        };
      }
    }

    return json({
      ok: true,
      release: RELEASE,
      build: BUILD,
      role: 'read_only_order_production_release_readiness_reconciliation',
      authorities: {
        order_inventory_fulfillment: '/api/admin/order-inventory-fulfillment-readiness',
        production_release_preview: '/api/admin/product-production-release',
        orders_owner: '/admin/order-fulfillment-care/',
        production_owner: '/admin/products/',
      },
      boundaries: {
        exact_gap_preview_only: true,
        production_post_authorized: false,
        automatic_production: false,
        inventory_reservation: false,
        inventory_deduction: false,
        order_mutation: false,
        shipment_mutation: false,
        customer_contact: false,
        provider_execution: false,
        request_time_schema_mutation: false,
      },
      semantics: {
        production_preview_required: 'Recognized open demand exceeds current finished-stock evidence; the operator may request one exact-gap Production Release preview.',
        production_preview_ready_for_review: 'The existing Production Release preview currently reports no material/lot/ingredient blockers for the exact gap. It is not authorization to post production.',
        production_blocked: 'The existing Production Release preview reports one or more current blockers for the exact gap quantity.',
        demand_unverified: 'Unclassified open-order demand fails closed and does not infer a production quantity.',
      },
      upstream_warnings: Array.isArray(fulfillment.upstream_warnings) ? fulfillment.upstream_warnings : [],
      summary: summarize(rows),
      rows,
      selected: selected_row,
      production_preview,
    });
  } catch (error) {
    return json({ ok: false, release: RELEASE, build: BUILD, error: error?.message || 'Order/Production Release readiness could not load.' }, 500);
  }
}
