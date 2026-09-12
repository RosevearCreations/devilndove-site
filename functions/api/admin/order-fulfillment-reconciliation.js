// Release 467 Build 111 — read-only Orders-to-Fulfilment reconciliation.
// Reuses Build 82 Orders workflow, Build 27 Finance readiness and Build 29 Production readiness
// (which in turn consumes Build 26 Inventory fulfilment readiness), plus one bounded evidence query.

import { captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { buildOrderFulfillmentReconciliation } from '../_lib/orderFulfillmentReconciliation.js';
import { onRequestGet as loadWorkflow } from './order-fulfillment-workflow.js';
import { onRequestGet as loadFinance } from './order-finance-settlement-readiness.js';
import { onRequestGet as loadProduction } from './order-production-release-readiness.js';

const RELEASE = 467;
const BUILD = 111;
const DEFAULT_LIMIT = 80;
const MAX_LIMIT = 120;

function json(data, status = 200) {
  return jsonResponse({ release: RELEASE, build: BUILD, ...data }, status, { 'Cache-Control': 'no-store' });
}
function boundedLimit(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}
function childContext(context, pathname, search = '') {
  const url = new URL(context.request.url);
  url.pathname = pathname;
  url.search = search;
  return { ...context, request: new Request(url.toString(), { method: 'GET', headers: context.request.headers }) };
}
async function readResponse(response, label) {
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || payload.ok === false) {
    const error = new Error(payload?.error || `${label} returned HTTP ${response.status}.`);
    error.status = response.status || 503;
    throw error;
  }
  return payload;
}

async function loadBoundedEvidence(db, limit) {
  const result = await db.prepare(`
    WITH target_orders AS (
      SELECT order_id
      FROM orders
      ORDER BY datetime(COALESCE(updated_at,created_at)) DESC, order_id DESC
      LIMIT ?
    ),
    item_profile AS (
      SELECT
        oi.order_id,
        COUNT(*) AS line_count,
        COALESCE(SUM(COALESCE(oi.quantity,0)),0) AS total_units,
        COALESCE(SUM(CASE WHEN COALESCE(oi.requires_shipping, CASE WHEN LOWER(COALESCE(oi.product_type,''))='digital' THEN 0 ELSE 1 END)=1 THEN COALESCE(oi.quantity,0) ELSE 0 END),0) AS physical_units,
        COALESCE(SUM(CASE WHEN COALESCE(oi.requires_shipping, CASE WHEN LOWER(COALESCE(oi.product_type,''))='digital' THEN 0 ELSE 1 END)=0 THEN COALESCE(oi.quantity,0) ELSE 0 END),0) AS digital_units,
        COALESCE(SUM(CASE WHEN COALESCE(oi.product_id,0)<=0 THEN COALESCE(oi.quantity,0) ELSE 0 END),0) AS unresolved_product_units,
        GROUP_CONCAT(DISTINCT CASE WHEN COALESCE(oi.product_id,0)>0 THEN CAST(oi.product_id AS TEXT) END) AS product_ids_csv
      FROM order_items oi
      INNER JOIN target_orders t ON t.order_id=oi.order_id
      GROUP BY oi.order_id
    ),
    history_profile AS (
      SELECT
        h.order_id,
        SUM(CASE WHEN LOWER(COALESCE(h.new_status,''))='evidence' THEN 1 ELSE 0 END) AS evidence_event_count,
        MAX(CASE WHEN LOWER(COALESCE(h.new_status,''))='evidence' AND LENGTH(TRIM(COALESCE(h.note,'')))>0 THEN 1 ELSE 0 END) AS evidence_note_present,
        SUM(CASE WHEN LOWER(COALESCE(h.new_status,''))='ready' THEN 1 ELSE 0 END) AS ready_event_count,
        SUM(CASE WHEN LOWER(COALESCE(h.new_status,'')) IN ('fulfilled','completed') THEN 1 ELSE 0 END) AS fulfilled_event_count,
        SUM(CASE WHEN LOWER(COALESCE(h.new_status,''))='returned' THEN 1 ELSE 0 END) AS returned_event_count,
        MAX(CASE WHEN LOWER(COALESCE(h.new_status,''))='returned' AND LENGTH(TRIM(COALESCE(h.note,'')))>0 THEN 1 ELSE 0 END) AS returned_note_present
      FROM order_status_history h
      INNER JOIN target_orders t ON t.order_id=h.order_id
      GROUP BY h.order_id
    )
    SELECT
      t.order_id,
      COALESCE(i.line_count,0) AS line_count,
      COALESCE(i.total_units,0) AS total_units,
      COALESCE(i.physical_units,0) AS physical_units,
      COALESCE(i.digital_units,0) AS digital_units,
      COALESCE(i.unresolved_product_units,0) AS unresolved_product_units,
      COALESCE(i.product_ids_csv,'') AS product_ids_csv,
      COALESCE(h.evidence_event_count,0) AS evidence_event_count,
      COALESCE(h.evidence_note_present,0) AS evidence_note_present,
      COALESCE(h.ready_event_count,0) AS ready_event_count,
      COALESCE(h.fulfilled_event_count,0) AS fulfilled_event_count,
      COALESCE(h.returned_event_count,0) AS returned_event_count,
      COALESCE(h.returned_note_present,0) AS returned_note_present
    FROM target_orders t
    LEFT JOIN item_profile i ON i.order_id=t.order_id
    LEFT JOIN history_profile h ON h.order_id=t.order_id
    ORDER BY t.order_id DESC
  `).bind(limit).all();
  return Array.isArray(result?.results) ? result.results : [];
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const limit = boundedLimit(new URL(context.request.url).searchParams.get('limit'));

  try {
    const [workflowResponse, financeResponse, productionResponse, profiles] = await Promise.all([
      loadWorkflow(childContext(context, '/api/admin/order-fulfillment-workflow', `?limit=${limit}`)),
      loadFinance(childContext(context, '/api/admin/order-finance-settlement-readiness')),
      loadProduction(childContext(context, '/api/admin/order-production-release-readiness')),
      loadBoundedEvidence(db, limit),
    ]);
    const [workflow, finance, production] = await Promise.all([
      readResponse(workflowResponse, 'Build 82 Orders / Fulfilment workflow'),
      readResponse(financeResponse, 'Build 27 Finance settlement readiness'),
      readResponse(productionResponse, 'Build 29 Production readiness'),
    ]);

    const reconciliation = buildOrderFulfillmentReconciliation({
      workflowOrders: workflow.orders || [],
      financeRows: finance.rows || [],
      profiles,
      productReadinessRows: production.rows || [],
    });

    return json({
      ok: true,
      role: 'read_only_orders_to_fulfilment_reconciliation',
      limit,
      requested_by: {
        user_id: adminUser.user_id,
        email: adminUser.email,
        display_name: adminUser.display_name,
      },
      authorities: {
        order_workflow: { release: workflow.release, build: workflow.build, route: '/api/admin/order-fulfillment-workflow' },
        finance_settlement: { release: finance.release, build: finance.build, route: '/api/admin/order-finance-settlement-readiness' },
        inventory_fulfilment: { release: 467, build: 26, route: '/api/admin/order-inventory-fulfillment-readiness', consumed_via: 'Build 29 Production readiness' },
        production_release: { release: production.release, build: production.build, route: '/api/admin/order-production-release-readiness' },
        transition_owner: '/api/admin/contracts/operations-order-fulfillment-workflow-write',
        audit_authority: 'order_status_history',
      },
      semantics: {
        transition_supported: 'Build 111 found no reconciliation blocker or review item. The existing Build 82 transition contract remains the only fulfilment status mutation owner.',
        shared_product_readiness: 'Inventory/Production readiness is shared Product-level evidence across open demand; it is never an order-specific reservation or production authorization.',
        blocked: 'At least one contradiction or missing required evidence must be resolved before using the existing fulfilment transition control.',
        review: 'No hard contradiction was proven, but one or more authorities need operator review before transition.',
      },
      ...reconciliation,
    });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'order_fulfillment_reconciliation',
      incident_code: 'build111_reconciliation_failed',
      severity: 'warning',
      message: error?.message || 'Build 111 Orders-to-Fulfilment reconciliation failed.',
      related_user_id: adminUser.user_id,
      details: { build: BUILD, limit, error: String(error?.stack || error) },
    }).catch(() => null);
    return json({
      ok: false,
      read_only_reconciliation: true,
      error: error?.message || 'Orders-to-Fulfilment reconciliation could not be loaded.',
      boundaries: {
        existing_build82_write_contract_preserved: true,
        new_order_mutation: false,
        inventory_reservation: false,
        inventory_deduction: false,
        production_execution: false,
        customer_message_send: false,
        payment_execution: false,
        refund_execution: false,
        accounting_posting: false,
        provider_execution: false,
        request_time_schema_mutation: false,
      },
    }, Number(error?.status) || 503);
  }
}
