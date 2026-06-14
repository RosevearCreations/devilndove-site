import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText
} from "../_lib/adminAudit.js";

function json(data, status = 200) {
  return jsonResponse(data, status);
}

function normalizeOrderStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return ["draft", "pending", "paid", "fulfilled", "cancelled", "refunded"].includes(status)
    ? status
    : "";
}

async function safeHistoryInsert(db, orderId, oldStatus, newStatus, changedByUserId, note) {
  try {
    await db.prepare(`
      INSERT INTO order_status_history (
        order_id,
        old_status,
        new_status,
        changed_by_user_id,
        note,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(orderId, oldStatus || null, newStatus || null, changedByUserId || null, note || null).run();
    return true;
  } catch {
    return false;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: "Database binding is not configured." }, 500);

  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const order_id = Number(body.order_id);
  const new_status = normalizeOrderStatus(body.new_status);
  const note = normalizeText(body.note || "");

  if (!Number.isInteger(order_id) || order_id <= 0) {
    return json({ ok: false, error: "A valid order_id is required." }, 400);
  }

  if (!new_status) {
    return json({ ok: false, error: "A valid new_status is required." }, 400);
  }

  let order;
  try {
    order = await db.prepare(`
      SELECT
        order_id,
        order_number,
        order_status,
        payment_status,
        total_cents,
        currency,
        created_at,
        updated_at
      FROM orders
      WHERE order_id = ?
      LIMIT 1
    `).bind(order_id).first();
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: 'admin_order_status_update',
      incident_code: 'order_lookup_failed',
      severity: 'error',
      message: error?.message || 'Failed to look up order before status update.',
      related_user_id: adminUser.user_id,
      details: { order_id, new_status }
    });
    return json({ ok: false, error: 'Failed to load order for status update.' }, 500);
  }

  if (!order) {
    return json({ ok: false, error: "Order not found." }, 404);
  }

  const old_status = String(order.order_status || "").toLowerCase();
  if (old_status === new_status) {
    return json({
      ok: true,
      message: "Order status is already set to that value.",
      warnings: [],
      order: {
        order_id: Number(order.order_id || 0),
        order_number: order.order_number || "",
        order_status: old_status,
        payment_status: order.payment_status || "pending",
        total_cents: Number(order.total_cents || 0),
        currency: order.currency || "CAD",
        created_at: order.created_at || null,
        updated_at: order.updated_at || null
      }
    });
  }

  try {
    await db.prepare(`
      UPDATE orders
      SET
        order_status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ?
    `).bind(new_status, order_id).run();
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: 'admin_order_status_update',
      incident_code: 'order_update_failed',
      severity: 'error',
      message: error?.message || 'Failed to update order status.',
      related_user_id: adminUser.user_id,
      details: { order_id, old_status, new_status }
    });
    return json({ ok: false, error: 'Failed to update order status.' }, 500);
  }

  const warnings = [];
  const actorLabel = adminUser.display_name || adminUser.email || `Admin #${adminUser.user_id}`;
  const historyNote = note
    ? `${actorLabel} updated order status. ${note}`
    : `${actorLabel} updated order status.`;

  const historySaved = await safeHistoryInsert(db, order_id, old_status, new_status, adminUser.user_id, historyNote);
  if (!historySaved) {
    warnings.push('Order status changed, but status-history logging failed.');
    await captureRuntimeIncident(env, request, {
      incident_scope: 'admin_order_status_update',
      incident_code: 'history_insert_failed',
      severity: 'warning',
      message: 'Order status changed but history insert failed.',
      related_user_id: adminUser.user_id,
      details: { order_id, old_status, new_status }
    });
  }


  if (new_status === 'paid') {
    try {
      await db.prepare(`
        UPDATE gift_cards
        SET status = 'active', updated_at = CURRENT_TIMESTAMP
        WHERE order_id = ?
          AND COALESCE(status, 'pending_activation') IN ('pending_activation','inactive','pending')
      `).bind(order_id).run();
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS gift_card_admin_events (
          gift_card_admin_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
          gift_card_id INTEGER,
          source_gift_card_id INTEGER,
          action_key TEXT NOT NULL,
          amount_cents INTEGER NOT NULL DEFAULT 0,
          note TEXT,
          created_by_user_id INTEGER,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `).run().catch(() => null);
      await db.prepare(`
        INSERT INTO gift_card_admin_events (gift_card_id, action_key, note, created_by_user_id, created_at)
        SELECT gift_card_id, 'auto_activate_paid_order', 'Activated automatically when the connected order was marked paid.', ?, CURRENT_TIMESTAMP
        FROM gift_cards
        WHERE order_id = ? AND COALESCE(status,'active')='active'
      `).bind(Number(adminUser.user_id || 0), order_id).run().catch(() => null);
    } catch (giftCardError) {
      warnings.push('Order was marked paid, but connected gift-card activation could not be completed automatically.');
    }
  }

  await auditAdminAction(env, request, adminUser, {
    action_type: 'order_status_update',
    target_type: 'order',
    target_id: order_id,
    target_key: order.order_number || String(order_id),
    details: { old_status, new_status, note }
  });

  let updatedOrder = null;
  try {
    updatedOrder = await db.prepare(`
      SELECT
        order_id,
        order_number,
        order_status,
        payment_status,
        total_cents,
        currency,
        created_at,
        updated_at
      FROM orders
      WHERE order_id = ?
      LIMIT 1
    `).bind(order_id).first();
  } catch (error) {
    warnings.push('Order updated, but the refreshed order snapshot could not be loaded.');
    await captureRuntimeIncident(env, request, {
      incident_scope: 'admin_order_status_update',
      incident_code: 'refresh_lookup_failed',
      severity: 'warning',
      message: error?.message || 'Order updated but refresh lookup failed.',
      related_user_id: adminUser.user_id,
      details: { order_id, new_status }
    });
  }

  return json({
    ok: true,
    message: warnings.length ? 'Order status updated with warnings.' : 'Order status updated successfully.',
    warning: warnings[0] || '',
    warnings,
    order: {
      order_id: Number(updatedOrder?.order_id || order_id || 0),
      order_number: updatedOrder?.order_number || order.order_number || '',
      order_status: updatedOrder?.order_status || new_status,
      payment_status: updatedOrder?.payment_status || order.payment_status || 'pending',
      total_cents: Number(updatedOrder?.total_cents || order.total_cents || 0),
      currency: updatedOrder?.currency || order.currency || 'CAD',
      created_at: updatedOrder?.created_at || order.created_at || null,
      updated_at: updatedOrder?.updated_at || new Date().toISOString()
    },
    updated_by: {
      user_id: adminUser.user_id,
      email: adminUser.email,
      display_name: adminUser.display_name
    },
    fallback_state: warnings.length ? 'order_updated_with_partial_logging' : null
  });
}
