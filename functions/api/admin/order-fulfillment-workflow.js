// Release 467 Build 82 — Orders / Fulfilment workflow read projection.
// One bounded admin GET over existing Orders, Payments and order_status_history authorities.

import {
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
} from '../_lib/adminAudit.js';
import { buildFulfillmentWorkflow } from '../_lib/orderFulfillmentWorkflow.js';

const RELEASE = 467;
const BUILD = 82;
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

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const url = new URL(context.request.url);
  const limit = boundedLimit(url.searchParams.get('limit'));

  try {
    const result = await db.prepare(`
      WITH payment_summary AS (
        SELECT
          p.order_id,
          COUNT(*) AS payment_count,
          COALESCE(SUM(
            CASE
              WHEN LOWER(COALESCE(p.payment_status,'')) IN ('paid','completed','captured','partially_refunded')
              THEN COALESCE(p.amount_cents,0)
              ELSE 0
            END
          ),0) AS paid_total_cents,
          MAX(CASE WHEN LOWER(COALESCE(p.payment_status,'')) = 'refunded' THEN 1 ELSE 0 END) AS has_refunded,
          MAX(CASE WHEN LOWER(COALESCE(p.payment_status,'')) = 'partially_refunded' THEN 1 ELSE 0 END) AS has_partially_refunded,
          MAX(CASE WHEN LOWER(COALESCE(p.payment_status,'')) = 'authorized' THEN 1 ELSE 0 END) AS has_authorized,
          MAX(CASE WHEN LOWER(COALESCE(p.payment_status,'')) = 'pending' THEN 1 ELSE 0 END) AS has_pending
        FROM payments p
        GROUP BY p.order_id
      )
      SELECT
        o.order_id,
        o.order_number,
        o.customer_email,
        o.customer_name,
        o.order_status,
        o.payment_status,
        o.payment_method,
        o.fulfillment_type,
        o.currency,
        o.total_cents,
        o.created_at,
        o.updated_at,
        COALESCE(ps.payment_count,0) AS payment_count,
        COALESCE(ps.paid_total_cents,0) AS paid_total_cents,
        CASE
          WHEN COALESCE(ps.has_refunded,0)=1 THEN 'refunded'
          WHEN COALESCE(ps.has_partially_refunded,0)=1 THEN 'partially_refunded'
          WHEN COALESCE(ps.paid_total_cents,0) >= COALESCE(o.total_cents,0) AND COALESCE(o.total_cents,0) > 0 THEN 'paid'
          WHEN COALESCE(ps.has_authorized,0)=1 THEN 'authorized'
          WHEN COALESCE(ps.has_pending,0)=1 THEN 'pending'
          ELSE COALESCE(o.payment_status,'pending')
        END AS derived_payment_status,
        (
          SELECT h.new_status
          FROM order_status_history h
          WHERE h.order_id=o.order_id
          ORDER BY datetime(h.created_at) DESC,h.rowid DESC
          LIMIT 1
        ) AS latest_history_status,
        (
          SELECT h.created_at
          FROM order_status_history h
          WHERE h.order_id=o.order_id
          ORDER BY datetime(h.created_at) DESC,h.rowid DESC
          LIMIT 1
        ) AS latest_history_at,
        (
          SELECT h.note
          FROM order_status_history h
          WHERE h.order_id=o.order_id
          ORDER BY datetime(h.created_at) DESC,h.rowid DESC
          LIMIT 1
        ) AS latest_history_note,
        (
          SELECT COUNT(*)
          FROM order_status_history h
          WHERE h.order_id=o.order_id
        ) AS history_count
      FROM orders o
      LEFT JOIN payment_summary ps ON ps.order_id=o.order_id
      ORDER BY datetime(COALESCE(o.updated_at,o.created_at)) DESC,o.order_id DESC
      LIMIT ?
    `).bind(limit).all();

    const workflow = buildFulfillmentWorkflow(Array.isArray(result?.results) ? result.results : []);
    return json({
      ok: true,
      read_only_projection: true,
      requested_by: {
        user_id: adminUser.user_id,
        email: adminUser.email,
        display_name: adminUser.display_name,
      },
      limit,
      ...workflow,
      owners: {
        orders: '/admin/orders/',
        fulfillment_care: '/admin/order-fulfillment-care/',
        refunds: '/admin/orders/',
        accounting: '/admin/accounting/',
      },
    });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'order_fulfillment_workflow',
      incident_code: 'build82_read_projection_failed',
      severity: 'warning',
      message: error?.message || 'Build 82 fulfilment workflow projection failed.',
      related_user_id: adminUser.user_id,
      details: { build: BUILD, limit, error: String(error?.stack || error) },
    }).catch(() => null);

    return json({
      ok: false,
      read_only_projection: true,
      error: 'Orders / Fulfilment workflow could not be loaded.',
      boundaries: {
        customer_message_send: false,
        provider_shipping_execution: false,
        payment_execution: false,
        refund_execution: false,
        accounting_posting: false,
        request_time_schema_mutation: false,
      },
    }, 503);
  }
}
