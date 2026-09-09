// Release 467 Build 82 — reviewed Operations-owned Orders / Fulfilment workflow transition.
// This contract owns only non-financial fulfilment status transitions. It does not execute
// payments, refunds, customer messages, shipping-provider calls, accounting posts, or schema changes.

import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
} from '../../_lib/adminAudit.js';

export const RELEASE = 467;
export const BUILD = 82;
export const CONTRACT_ID = 'operations-order-fulfillment-workflow-write';
export const OWNER = 'operations';

const REVIEWED = new Set(['preparing', 'making', 'packing', 'evidence', 'ready', 'fulfilled', 'returned']);
const PAID = new Set(['paid', 'completed', 'captured', 'partially_refunded']);

function json(data, status = 200) {
  return jsonResponse({ release: RELEASE, build: BUILD, contract: CONTRACT_ID, ...data }, status, { 'Cache-Control': 'no-store' });
}
function text(value) { return String(value ?? '').trim(); }
function lower(value) { return text(value).toLowerCase(); }

function allowedTargets(currentStatus, fulfillmentType) {
  const current = lower(currentStatus);
  const type = lower(fulfillmentType || 'shipping');
  if (['draft', 'pending', 'processing', 'paid'].includes(current)) return ['preparing'];
  if (current === 'preparing') return type === 'digital' ? ['evidence'] : ['making', 'packing'];
  if (current === 'making') return ['packing'];
  if (current === 'packing') return ['evidence'];
  if (current === 'evidence') return ['ready'];
  if (current === 'ready') return ['fulfilled'];
  if (current === 'fulfilled' || current === 'completed') return ['returned'];
  return [];
}

export const metadata = Object.freeze({
  release: RELEASE,
  build: BUILD,
  contract: CONTRACT_ID,
  owner: OWNER,
  reviewedStatusValues: Object.freeze(Array.from(REVIEWED)),
  paymentExecution: false,
  refundExecution: false,
  shippingProviderExecution: false,
  customerMessageSend: false,
  accountingPosting: false,
  requestTimeSchemaMutation: false,
  auditAuthority: 'order_status_history',
});

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  let input = {};
  try { input = await context.request.json(); }
  catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const orderId = Number(input.order_id || 0);
  const newStatus = lower(input.new_status);
  const note = text(input.note).slice(0, 1200);

  if (!Number.isInteger(orderId) || orderId <= 0) return json({ ok: false, error: 'A valid order_id is required.' }, 400);
  if (!REVIEWED.has(newStatus)) return json({ ok: false, error: 'That status is not owned by the Build 82 fulfilment workflow.' }, 400);

  let order;
  try {
    order = await db.prepare(`
      SELECT
        o.order_id,o.order_number,o.order_status,o.payment_status,o.fulfillment_type,
        CASE
          WHEN EXISTS(SELECT 1 FROM payments p WHERE p.order_id=o.order_id AND LOWER(COALESCE(p.payment_status,''))='refunded') THEN 'refunded'
          WHEN EXISTS(SELECT 1 FROM payments p WHERE p.order_id=o.order_id AND LOWER(COALESCE(p.payment_status,''))='partially_refunded') THEN 'partially_refunded'
          WHEN COALESCE((SELECT SUM(CASE WHEN LOWER(COALESCE(p.payment_status,'')) IN ('paid','completed','captured','partially_refunded') THEN COALESCE(p.amount_cents,0) ELSE 0 END) FROM payments p WHERE p.order_id=o.order_id),0) >= COALESCE(o.total_cents,0)
               AND COALESCE(o.total_cents,0) > 0 THEN 'paid'
          ELSE LOWER(COALESCE(o.payment_status,'pending'))
        END AS derived_payment_status
      FROM orders o
      WHERE o.order_id=?
      LIMIT 1
    `).bind(orderId).first();
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'order_fulfillment_workflow',
      incident_code: 'build82_transition_lookup_failed',
      severity: 'error',
      message: error?.message || 'Build 82 fulfilment transition lookup failed.',
      related_user_id: adminUser.user_id,
      details: { order_id: orderId, new_status: newStatus },
    }).catch(() => null);
    return json({ ok: false, error: 'Could not load the order for fulfilment review.' }, 500);
  }

  if (!order) return json({ ok: false, error: 'Order not found.' }, 404);

  const currentStatus = lower(order.order_status || 'pending');
  const paymentStatus = lower(order.derived_payment_status || order.payment_status || 'pending');
  const targets = allowedTargets(currentStatus, order.fulfillment_type);

  if (!targets.includes(newStatus)) {
    return json({
      ok: false,
      error: `Transition ${currentStatus || 'unknown'} → ${newStatus} is not a reviewed Build 82 fulfilment transition.`,
      current_status: currentStatus,
      allowed_targets: targets,
    }, 409);
  }

  if (!['fulfilled', 'completed'].includes(currentStatus) && !PAID.has(paymentStatus)) {
    return json({
      ok: false,
      error: 'Payment must be confirmed before fulfilment work advances.',
      current_status: currentStatus,
      payment_status: paymentStatus,
    }, 409);
  }

  if (paymentStatus === 'refunded') {
    return json({ ok: false, error: 'The payment is refunded. Fulfilment cannot advance; review the existing refund/payment owner.' }, 409);
  }

  if (['evidence', 'returned'].includes(newStatus) && !note) {
    return json({
      ok: false,
      error: `${newStatus === 'evidence' ? 'Evidence review' : 'Return'} requires an audit note.`,
      note_required: true,
    }, 400);
  }

  const actor = adminUser.display_name || adminUser.email || `Admin #${adminUser.user_id}`;
  const workflowNote = [
    `[Release 467 Build 82 fulfilment workflow] ${actor}: ${currentStatus} → ${newStatus}.`,
    note,
  ].filter(Boolean).join(' ');

  try {
    await db.prepare(`UPDATE orders SET order_status=?, updated_at=CURRENT_TIMESTAMP WHERE order_id=?`).bind(newStatus, orderId).run();
    await db.prepare(`
      INSERT INTO order_status_history (order_id,old_status,new_status,changed_by_user_id,note,created_at)
      VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)
    `).bind(orderId, currentStatus || null, newStatus, adminUser.user_id || null, workflowNote).run();
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'order_fulfillment_workflow',
      incident_code: 'build82_transition_write_failed',
      severity: 'error',
      message: error?.message || 'Build 82 fulfilment transition write failed.',
      related_user_id: adminUser.user_id,
      details: { order_id: orderId, old_status: currentStatus, new_status: newStatus },
    }).catch(() => null);
    return json({ ok: false, error: 'The fulfilment status could not be updated.' }, 500);
  }

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: 'order_fulfillment_workflow_transition',
    target_type: 'order',
    target_id: orderId,
    target_key: order.order_number || String(orderId),
    details: {
      old_status: currentStatus,
      new_status: newStatus,
      payment_status: paymentStatus,
      fulfillment_type: order.fulfillment_type || 'shipping',
      note,
      build: BUILD,
    },
  }).catch(() => null);

  return json({
    ok: true,
    message: `Order ${order.order_number || orderId} advanced to ${newStatus}.`,
    order: {
      order_id: orderId,
      order_number: order.order_number || '',
      old_status: currentStatus,
      order_status: newStatus,
      payment_status: paymentStatus,
      fulfillment_type: order.fulfillment_type || 'shipping',
    },
    customer_message_sent: false,
    provider_action_executed: false,
    payment_or_refund_executed: false,
    accounting_posted: false,
    request_time_schema_mutation: false,
    audit_authority: 'order_status_history',
  });
}
