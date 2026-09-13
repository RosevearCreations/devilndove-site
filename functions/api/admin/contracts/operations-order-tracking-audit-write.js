// Release 467 Build 150 — Orders workspace tracking audit handoff.
// Records a reviewed carrier/tracking reference in canonical order_status_history without
// calling a shipping provider, changing order status, sending a buyer message, or adding schema.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from '../../_lib/adminAudit.js';

export const RELEASE = 467;
export const BUILD = 150;
export const CONTRACT_ID = 'operations-order-tracking-audit-write';
export const OWNER = 'operations';

function json(data, status = 200) {
  return jsonResponse({ release: RELEASE, build: BUILD, contract: CONTRACT_ID, ...data }, status, { 'Cache-Control': 'no-store' });
}
function text(value) { return String(value ?? '').trim(); }
function actionId(value) {
  const id = text(value).slice(0, 120);
  return /^[A-Za-z0-9._:-]{8,120}$/.test(id) ? id : '';
}
function marker(id) { return `[client_action_id:${id}]`; }
function cleanTracking(value) { return text(value).replace(/[^A-Za-z0-9 ._\/-]/g, '').slice(0, 120); }

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  let input = {};
  try { input = await context.request.json(); }
  catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const orderId = Number(input.order_id || 0);
  const clientActionId = actionId(input.client_action_id);
  const carrier = cleanTracking(input.carrier);
  const trackingNumber = cleanTracking(input.tracking_number);
  const note = text(input.note).slice(0, 600);
  const expectedStatus = text(input.expected_order_status).toLowerCase();

  if (!Number.isInteger(orderId) || orderId <= 0) return json({ ok: false, error: 'A valid order_id is required.' }, 400);
  if (!clientActionId) return json({ ok: false, error: 'A stable client_action_id is required.' }, 400);
  if (!carrier || !trackingNumber) return json({ ok: false, error: 'Carrier and tracking number are required.' }, 400);
  if (!expectedStatus) return json({ ok: false, error: 'expected_order_status is required to stop stale cross-device changes.' }, 400);

  const actionMarker = marker(clientActionId);
  try {
    const replay = await db.prepare(`
      SELECT history_id,old_status,new_status,note,created_at
      FROM order_status_history
      WHERE order_id=? AND instr(COALESCE(note,''),?)>0
      ORDER BY history_id DESC LIMIT 1
    `).bind(orderId, actionMarker).first();
    if (replay) {
      return json({ ok: true, idempotent_replay: true, client_action_id: clientActionId, history_id: Number(replay.history_id || 0), message: 'Previously confirmed tracking audit replayed safely.', provider_action_executed: false, buyer_message_sent: false, order_status_changed: false, request_time_schema_mutation: false });
    }
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'orders_workspace', incident_code: 'build150_tracking_idempotency_lookup_failed', severity: 'error', message: error?.message || 'Build 150 tracking idempotency lookup failed.', related_user_id: adminUser.user_id, details: { order_id: orderId, client_action_id: clientActionId } }).catch(() => null);
    return json({ ok: false, error: 'Could not prove whether this tracking audit was already recorded. No new write was attempted.' }, 503);
  }

  const order = await db.prepare(`SELECT order_id,order_number,order_status,fulfillment_type FROM orders WHERE order_id=? LIMIT 1`).bind(orderId).first();
  if (!order) return json({ ok: false, error: 'Order not found.' }, 404);
  const currentStatus = text(order.order_status || 'pending').toLowerCase();
  if (currentStatus !== expectedStatus) {
    return json({ ok: false, error: 'Order status changed on another device. Refresh before recording tracking.', conflict: true, expected_order_status: expectedStatus, current_order_status: currentStatus }, 409);
  }

  const actor = adminUser.display_name || adminUser.email || `Admin #${adminUser.user_id}`;
  const auditNote = [`[Release 467 Build 150 tracking audit] ${actor}.`, `carrier=${carrier}`, `tracking=${trackingNumber}`, note, actionMarker].filter(Boolean).join(' ');
  let write;
  try {
    write = await db.prepare(`
      INSERT INTO order_status_history (order_id,old_status,new_status,changed_by_user_id,note,created_at)
      VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)
    `).bind(orderId, currentStatus, currentStatus, adminUser.user_id || null, auditNote).run();
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'orders_workspace', incident_code: 'build150_tracking_audit_write_failed', severity: 'error', message: error?.message || 'Build 150 tracking audit write failed.', related_user_id: adminUser.user_id, details: { order_id: orderId, client_action_id: clientActionId } }).catch(() => null);
    return json({ ok: false, error: 'Tracking audit could not be recorded. Retry with the same client_action_id.' }, 500);
  }

  await auditAdminAction(context.env, context.request, adminUser, { action_type: 'order_tracking_audit_recorded', target_type: 'order', target_id: orderId, target_key: order.order_number || String(orderId), details: { carrier, tracking_number: trackingNumber, order_status: currentStatus, client_action_id: clientActionId, build: BUILD } }).catch(() => null);

  return json({
    ok: true,
    idempotent_replay: false,
    client_action_id: clientActionId,
    history_id: Number(write?.meta?.last_row_id || 0),
    message: `Tracking audit recorded for order ${order.order_number || orderId}.`,
    tracking: { carrier, tracking_number: trackingNumber },
    provider_action_executed: false,
    buyer_message_sent: false,
    order_status_changed: false,
    payment_or_refund_executed: false,
    accounting_posted: false,
    request_time_schema_mutation: false,
    audit_authority: 'order_status_history'
  });
}
