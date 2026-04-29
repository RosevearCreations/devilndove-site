import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { processNotificationOutbox, queueNotification } from '../_lib/notificationOutbox.js';

function json(data, status = 200) { return jsonResponse(data, status); }
function nr(result) { return Array.isArray(result?.results) ? result.results : []; }
function cents(value) { return Math.max(0, Math.round(Number(value || 0))); }
function safeEmail(value) { return normalizeText(value).toLowerCase(); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function uniqueIds(value) { return Array.from(new Set(asArray(value).map((row) => Number(row || 0)).filter((row) => Number.isInteger(row) && row > 0))); }
function safeJsonStringify(value, fallback = '[]') { try { return JSON.stringify(value ?? []); } catch { return fallback; } }

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1`).bind(tableName).first();
    return !!row;
  } catch {
    return false;
  }
}

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(nr(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function ensureColumn(db, tableName, columnName, ddl) {
  const cols = await getTableColumnSet(db, tableName);
  if (!cols.has(columnName)) {
    await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${ddl}`).run().catch(() => null);
  }
}

async function ensureWishlistTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS member_wishlists (
    member_wishlist_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
  )`).run().catch(() => null);
}

async function ensureInterestTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_interest_requests (
    product_interest_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    request_type TEXT NOT NULL,
    user_id INTEGER,
    email TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
}

async function ensureCheckoutRecoveryTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS checkout_recovery_leads (
    checkout_recovery_lead_id INTEGER PRIMARY KEY AUTOINCREMENT,
    browser_session_token TEXT,
    visitor_token TEXT,
    customer_email TEXT,
    customer_name TEXT,
    cart_count INTEGER NOT NULL DEFAULT 0,
    cart_value_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'CAD',
    checkout_path TEXT,
    checkout_state_json TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    last_recovery_email_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(browser_session_token, customer_email)
  )`).run().catch(() => null);
}

async function ensureGiftCardTables(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS gift_cards (
    gift_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    currency TEXT NOT NULL DEFAULT 'CAD',
    initial_amount_cents INTEGER NOT NULL DEFAULT 0,
    remaining_amount_cents INTEGER NOT NULL DEFAULT 0,
    issued_to_email TEXT,
    issued_to_name TEXT,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    expires_at TEXT,
    last_redeemed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
  await ensureColumn(db, 'gift_cards', 'purchaser_email', `purchaser_email TEXT`);
  await ensureColumn(db, 'gift_cards', 'purchaser_name', `purchaser_name TEXT`);
  await ensureColumn(db, 'gift_cards', 'recipient_email', `recipient_email TEXT`);
  await ensureColumn(db, 'gift_cards', 'recipient_name', `recipient_name TEXT`);
  await ensureColumn(db, 'gift_cards', 'recipient_note', `recipient_note TEXT`);
  await ensureColumn(db, 'gift_cards', 'purchaser_user_id', `purchaser_user_id INTEGER`);
  await ensureColumn(db, 'gift_cards', 'order_id', `order_id INTEGER`);
  await ensureColumn(db, 'gift_cards', 'purchase_source', `purchase_source TEXT`);
  await db.prepare(`CREATE TABLE IF NOT EXISTS gift_card_redemptions (
    gift_card_redemption_id INTEGER PRIMARY KEY AUTOINCREMENT,
    gift_card_id INTEGER NOT NULL,
    order_id INTEGER,
    redeemed_amount_cents INTEGER NOT NULL DEFAULT 0,
    redeemed_by_email TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
}

async function ensureGiftCardAuditTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS gift_card_delivery_audit (
    gift_card_delivery_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    gift_card_id INTEGER,
    audience TEXT NOT NULL DEFAULT 'recipient',
    notification_kind TEXT NOT NULL,
    destination TEXT,
    notification_outbox_id INTEGER,
    notification_dispatch_log_id INTEGER,
    actor_user_id INTEGER,
    action_type TEXT NOT NULL DEFAULT 'queued',
    details_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
}

async function logGiftCardAudit(db, payload = {}) {
  await ensureGiftCardAuditTable(db);
  await db.prepare(`INSERT INTO gift_card_delivery_audit (
    gift_card_id, audience, notification_kind, destination, notification_outbox_id,
    notification_dispatch_log_id, actor_user_id, action_type, details_json, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(
    Number(payload.gift_card_id || 0) || null,
    normalizeText(payload.audience) || 'recipient',
    normalizeText(payload.notification_kind) || 'gift_card_issued',
    safeEmail(payload.destination) || null,
    Number(payload.notification_outbox_id || 0) || null,
    Number(payload.notification_dispatch_log_id || 0) || null,
    Number(payload.actor_user_id || 0) || null,
    normalizeText(payload.action_type) || 'queued',
    payload.details_json ? JSON.stringify(payload.details_json) : null
  ).run().catch(() => null);
}

async function ensureReviewTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_reviews (
    product_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    order_id INTEGER,
    user_id INTEGER,
    reviewer_name TEXT,
    reviewer_email TEXT,
    rating INTEGER NOT NULL DEFAULT 5,
    review_text TEXT,
    review_kind TEXT NOT NULL DEFAULT 'testimonial',
    status TEXT NOT NULL DEFAULT 'pending_review',
    is_featured INTEGER NOT NULL DEFAULT 0,
    admin_notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
}

async function ensureNotificationTables(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS notification_dispatch_log (
    notification_dispatch_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_outbox_id INTEGER,
    notification_kind TEXT,
    destination TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    provider_message_id TEXT,
    error_text TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS notification_exclusions (
    notification_exclusion_id INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_kind TEXT NOT NULL,
    destination TEXT,
    product_id INTEGER,
    order_id INTEGER,
    reason TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS notification_cooldown_rules (
    notification_cooldown_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_kind TEXT NOT NULL UNIQUE,
    cooldown_hours INTEGER NOT NULL DEFAULT 24,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS customer_engagement_runs (
    customer_engagement_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_type TEXT NOT NULL DEFAULT 'automation',
    actor_user_id INTEGER,
    summary_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
  await ensureColumn(db, 'notification_outbox', 'attempt_count', `attempt_count INTEGER NOT NULL DEFAULT 0`);
  await ensureColumn(db, 'notification_outbox', 'last_attempt_at', `last_attempt_at TEXT`);
  await ensureColumn(db, 'notification_outbox', 'provider_message_id', `provider_message_id TEXT`);
  await ensureColumn(db, 'notification_outbox', 'error_text', `error_text TEXT`);
  await ensureColumn(db, 'notification_outbox', 'related_product_id', `related_product_id INTEGER`);
  const defaults = [
    ['checkout_recovery', 24],
    ['review_request', 72],
    ['back_in_stock', 24],
    ['gift_card_issued', 1],
    ['gift_card_purchase_confirmation', 1]
  ];
  for (const [kind, hours] of defaults) {
    await db.prepare(`INSERT INTO notification_cooldown_rules (notification_kind, cooldown_hours, is_enabled, created_at, updated_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(notification_kind) DO NOTHING`).bind(kind, hours).run().catch(() => null);
  }
}



async function ensureAutomationSettingsTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS notification_automation_settings (
    notification_automation_setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_kind TEXT NOT NULL UNIQUE,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    send_after_hours INTEGER NOT NULL DEFAULT 24,
    max_age_days INTEGER NOT NULL DEFAULT 30,
    order_statuses_json TEXT,
    payment_statuses_json TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
  const defaults = [
    ['checkout_recovery', 1, 7, null, null, 'Queue first recovery email after the cart has been abandoned for at least this many hours.'],
    ['review_request', 72, 45, JSON.stringify(['paid','fulfilled','completed']), JSON.stringify(['paid','completed','captured','partially_refunded']), 'Queue review-request emails only after the order has aged past this threshold.'],
    ['back_in_stock', 1, 30, null, null, 'Queue back-in-stock notifications when matching inventory returns and the row is still open.'],
    ['gift_card_issued', 1, 30, null, null, 'Gift card delivery stays near-instant but can still be disabled here if needed.'],
    ['gift_card_purchase_confirmation', 1, 30, null, null, 'Purchaser confirmations stay near-instant but can still be disabled here if needed.']
  ];
  for (const [kind, sendAfterHours, maxAgeDays, orderStatusesJson, paymentStatusesJson, notes] of defaults) {
    await db.prepare(`INSERT INTO notification_automation_settings (
      notification_kind, is_enabled, send_after_hours, max_age_days, order_statuses_json, payment_statuses_json, notes, created_at, updated_at
    ) VALUES (?, 1, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(notification_kind) DO NOTHING`).bind(kind, sendAfterHours, maxAgeDays, orderStatusesJson, paymentStatusesJson, notes).run().catch(() => null);
  }
}

function parseStatusList(value, fallback = []) {
  if (Array.isArray(value)) return value.map((row) => normalizeText(row).toLowerCase()).filter(Boolean);
  const text = normalizeText(value);
  if (!text) return fallback;
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map((row) => normalizeText(row).toLowerCase()).filter(Boolean);
  } catch {}
  return text.split(',').map((row) => normalizeText(row).toLowerCase()).filter(Boolean);
}

async function getAutomationSettings(db) {
  await ensureAutomationSettingsTable(db);
  const rows = nr(await db.prepare(`SELECT notification_automation_setting_id, notification_kind, is_enabled, send_after_hours, max_age_days, order_statuses_json, payment_statuses_json, notes, created_at, updated_at FROM notification_automation_settings ORDER BY notification_kind ASC`).all().catch(() => ({ results: [] })));
  const map = new Map();
  for (const row of rows) {
    map.set(String(row.notification_kind || '').toLowerCase(), {
      notification_automation_setting_id: Number(row.notification_automation_setting_id || 0),
      notification_kind: row.notification_kind || '',
      is_enabled: Number(row.is_enabled || 0),
      send_after_hours: Number(row.send_after_hours || 0),
      max_age_days: Number(row.max_age_days || 0),
      order_statuses: parseStatusList(row.order_statuses_json),
      payment_statuses: parseStatusList(row.payment_statuses_json),
      notes: row.notes || '',
      created_at: row.created_at || null,
      updated_at: row.updated_at || null
    });
  }
  return map;
}

function generateGiftCardCode() {
  return `DND-GIFT-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function queueRecoveryEmail(db, lead) {
  return queueNotification(db, {
    notification_kind: 'checkout_recovery',
    destination: safeEmail(lead.customer_email),
    payload: {
      customer_name: lead.customer_name || '',
      cart_count: lead.cart_count || 0,
      cart_value_cents: lead.cart_value_cents || 0,
      currency: lead.currency || 'CAD',
      checkout_url: lead.checkout_path || '/checkout/'
    }
  });
}

async function queueGiftCardNotice(db, cardRow, actorUserId = null) {
  const recipientEmail = safeEmail(cardRow.recipient_email || cardRow.issued_to_email);
  if (!recipientEmail) return { queued: false };
  const result = await queueNotification(db, {
    notification_kind: 'gift_card_issued',
    destination: recipientEmail,
    related_order_id: Number(cardRow.order_id || 0) || null,
    payload: {
      code: cardRow.code || '',
      currency: cardRow.currency || 'CAD',
      initial_amount_cents: Number(cardRow.initial_amount_cents || 0),
      remaining_amount_cents: Number(cardRow.remaining_amount_cents || 0),
      expires_at: cardRow.expires_at || '',
      note: cardRow.recipient_note || cardRow.note || '',
      purchaser_name: cardRow.purchaser_name || '',
      recipient_name: cardRow.recipient_name || '',
      subject: cardRow.purchaser_name ? `A Devil n Dove gift card from ${cardRow.purchaser_name}` : 'Your Devil n Dove gift card'
    }
  });
  if (result?.queued) {
    await logGiftCardAudit(db, {
      gift_card_id: Number(cardRow.gift_card_id || 0),
      audience: 'recipient',
      notification_kind: 'gift_card_issued',
      destination: recipientEmail,
      notification_outbox_id: Number(result.notification_outbox_id || 0) || null,
      actor_user_id: actorUserId || null,
      action_type: 'queued',
      details_json: { source: cardRow.purchase_source || 'manual', code: cardRow.code || '' }
    });
  }
  return result;
}

async function queueGiftCardPurchaseConfirmation(db, cardRow, actorUserId = null) {
  const purchaserEmail = safeEmail(cardRow.purchaser_email);
  if (!purchaserEmail) return { queued: false };
  const result = await queueNotification(db, {
    notification_kind: 'gift_card_purchase_confirmation',
    destination: purchaserEmail,
    related_order_id: Number(cardRow.order_id || 0) || null,
    payload: {
      code: cardRow.code || '',
      currency: cardRow.currency || 'CAD',
      initial_amount_cents: Number(cardRow.initial_amount_cents || 0),
      purchaser_name: cardRow.purchaser_name || '',
      recipient_name: cardRow.recipient_name || '',
      recipient_email: cardRow.recipient_email || cardRow.issued_to_email || '',
      subject: 'Your Devil n Dove gift card purchase is confirmed'
    }
  });
  if (result?.queued) {
    await logGiftCardAudit(db, {
      gift_card_id: Number(cardRow.gift_card_id || 0),
      audience: 'purchaser',
      notification_kind: 'gift_card_purchase_confirmation',
      destination: purchaserEmail,
      notification_outbox_id: Number(result.notification_outbox_id || 0) || null,
      actor_user_id: actorUserId || null,
      action_type: 'queued',
      details_json: { source: cardRow.purchase_source || 'manual', code: cardRow.code || '' }
    });
  }
  return result;
}

async function notificationExists(db, { notificationKind = '', destination = '', relatedOrderId = null } = {}) {
  const hasOutbox = await tableExists(db, 'notification_outbox');
  if (!hasOutbox) return false;
  const row = await db.prepare(`
    SELECT notification_outbox_id
    FROM notification_outbox
    WHERE notification_kind = ?
      AND LOWER(COALESCE(destination,'')) = LOWER(?)
      AND (? IS NULL OR related_order_id = ?)
      AND status IN ('queued','retry','sent','suppressed')
    ORDER BY notification_outbox_id DESC
    LIMIT 1
  `).bind(notificationKind, safeEmail(destination), relatedOrderId == null ? null : Number(relatedOrderId || 0), relatedOrderId == null ? null : Number(relatedOrderId || 0)).first().catch(() => null);
  return !!row;
}

async function queueBackInStockNotice(db, requestRow) {
  const destination = safeEmail(requestRow.email);
  if (!destination) return false;
  const already = await notificationExists(db, { notificationKind: 'back_in_stock', destination, relatedOrderId: null });
  if (already) return false;
  const result = await queueNotification(db, {
    notification_kind: 'back_in_stock',
    destination,
    related_product_id: Number(requestRow.product_id || 0) || null,
    payload: {
      product_name: requestRow.product_name || '',
      product_slug: requestRow.product_slug || '',
      subject: requestRow.product_name ? `${requestRow.product_name} is back in stock` : 'A Devil n Dove item is back in stock'
    }
  });
  return !!result?.queued;
}

async function queueReviewRequest(db, orderId) {
  const order = await db.prepare(`
    SELECT o.order_id, o.order_number, o.customer_email, o.customer_name, o.currency, o.total_cents,
           GROUP_CONCAT(oi.product_name, ', ') AS product_names
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.order_id
    WHERE o.order_id = ?
    GROUP BY o.order_id, o.order_number, o.customer_email, o.customer_name, o.currency, o.total_cents
    LIMIT 1
  `).bind(orderId).first().catch(() => null);
  if (!order || !safeEmail(order.customer_email)) return { queued: false };
  return queueNotification(db, {
    notification_kind: 'review_request',
    destination: safeEmail(order.customer_email),
    related_order_id: Number(order.order_id || 0),
    payload: {
      order_number: order.order_number || '',
      customer_name: order.customer_name || '',
      customer_email: order.customer_email || '',
      product_names: String(order.product_names || '').split(',').map((part) => normalizeText(part)).filter(Boolean),
      subject: order.order_number ? `How was your Devil n Dove order ${order.order_number}?` : 'How was your Devil n Dove order?'
    }
  });
}

async function retryNotificationRows(db, ids = []) {
  if (!ids.length) return 0;
  const placeholders = ids.map(() => '?').join(',');
  await db.prepare(`
    UPDATE notification_outbox
    SET status = 'retry', next_attempt_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE notification_outbox_id IN (${placeholders})
  `).bind(...ids).run().catch(() => null);
  return ids.length;
}

async function cancelNotificationRows(db, ids = []) {
  if (!ids.length) return 0;
  await ensureNotificationTables(db);
  const placeholders = ids.map(() => '?').join(',');
  const rows = nr(await db.prepare(`SELECT notification_outbox_id, notification_kind, destination FROM notification_outbox WHERE notification_outbox_id IN (${placeholders})`).bind(...ids).all().catch(() => ({ results: [] })));
  await db.prepare(`UPDATE notification_outbox SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE notification_outbox_id IN (${placeholders})`).bind(...ids).run().catch(() => null);
  for (const row of rows) {
    await db.prepare(`INSERT INTO notification_dispatch_log (notification_outbox_id, notification_kind, destination, status, error_text, created_at) VALUES (?, ?, ?, 'cancelled', 'Cancelled by admin.', CURRENT_TIMESTAMP)`).bind(Number(row.notification_outbox_id || 0), row.notification_kind || '', row.destination || '').run().catch(() => null);
  }
  return ids.length;
}

async function recordAutomationRun(db, runType, actorUserId, summary) {
  await ensureNotificationTables(db);
  await db.prepare(`INSERT INTO customer_engagement_runs (run_type, actor_user_id, summary_json, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`).bind(runType || 'automation', actorUserId || null, JSON.stringify(summary || {})).run().catch(() => null);
}

async function autoProcessEngagement(db, env, actorUserId = null) {
  const results = { back_in_stock_queued: 0, back_in_stock_closed: 0, recovery_queued: 0, review_requests_queued: 0, notifications_processed: 0 };
  const hasProducts = await tableExists(db, 'products');
  const hasOrders = await tableExists(db, 'orders');
  const hasOrderItems = await tableExists(db, 'order_items');
  const automationSettings = await getAutomationSettings(db);
  const backInStockSettings = automationSettings.get('back_in_stock') || { is_enabled: 1 };
  const recoverySettings = automationSettings.get('checkout_recovery') || { is_enabled: 1, send_after_hours: 1, max_age_days: 7 };
  const reviewSettings = automationSettings.get('review_request') || { is_enabled: 1, send_after_hours: 72, max_age_days: 45, payment_statuses: ['paid','completed','captured','partially_refunded'], order_statuses: ['paid','fulfilled','completed'] };

  if (hasProducts && Number(backInStockSettings.is_enabled || 0) === 1) {
    const backInStockRows = nr(await db.prepare(`
      SELECT pir.product_interest_request_id, pir.email, pir.product_id, p.name AS product_name, p.slug AS product_slug
      FROM product_interest_requests pir
      INNER JOIN products p ON p.product_id = pir.product_id
      WHERE LOWER(COALESCE(pir.request_type,'')) = 'back_in_stock'
        AND LOWER(COALESCE(pir.status,'open')) = 'open'
        AND COALESCE(p.inventory_quantity,0) > 0
        AND COALESCE(p.status,'draft') IN ('active','published')
      ORDER BY pir.created_at ASC, pir.product_interest_request_id ASC
      LIMIT 50
    `).all().catch(() => ({ results: [] })));
    for (const row of backInStockRows) {
      const queued = await queueBackInStockNotice(db, row);
      if (queued) results.back_in_stock_queued += 1;
      await db.prepare(`UPDATE product_interest_requests SET status = 'done', updated_at = CURRENT_TIMESTAMP WHERE product_interest_request_id = ?`).bind(Number(row.product_interest_request_id || 0)).run().catch(() => null);
      results.back_in_stock_closed += 1;
    }
  }

  const recoveryRows = Number(recoverySettings.is_enabled || 0) === 1 ? nr(await db.prepare(`
    SELECT checkout_recovery_lead_id, customer_email, customer_name, cart_count, cart_value_cents, currency, checkout_path
    FROM checkout_recovery_leads
    WHERE LOWER(COALESCE(status,'open')) = 'open'
      AND LOWER(COALESCE(customer_email,'')) != ''
      AND last_recovery_email_at IS NULL
      AND created_at <= datetime('now', printf('-%d hours', ?))
      AND created_at >= datetime('now', printf('-%d days', ?))
    ORDER BY created_at ASC, checkout_recovery_lead_id ASC
    LIMIT 50
  `).bind(Math.max(0, Number(recoverySettings.send_after_hours || 1)), Math.max(1, Number(recoverySettings.max_age_days || 7))).all().catch(() => ({ results: [] }))) : [];
  for (const row of recoveryRows) {
    const already = await notificationExists(db, { notificationKind: 'checkout_recovery', destination: row.customer_email });
    if (already) continue;
    const queued = await queueRecoveryEmail(db, row);
    if (queued?.queued) {
      await db.prepare(`UPDATE checkout_recovery_leads SET status = 'emailed', last_recovery_email_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE checkout_recovery_lead_id = ?`).bind(Number(row.checkout_recovery_lead_id || 0)).run().catch(() => null);
      results.recovery_queued += 1;
    }
  }

  if (hasOrders && hasOrderItems && Number(reviewSettings.is_enabled || 0) === 1) {
    const paymentStatuses = parseStatusList(reviewSettings.payment_statuses, ['paid','completed','captured','partially_refunded']);
    const orderStatuses = parseStatusList(reviewSettings.order_statuses, ['paid','fulfilled','completed']);
    const paymentPlaceholders = paymentStatuses.map(() => '?').join(',') || "''";
    const orderPlaceholders = orderStatuses.map(() => '?').join(',') || "''";
    const orders = nr(await db.prepare(`
      SELECT o.order_id, o.order_number, o.customer_email
      FROM orders o
      WHERE (LOWER(COALESCE(o.payment_status,'')) IN (${paymentPlaceholders})
         OR LOWER(COALESCE(o.order_status,'')) IN (${orderPlaceholders}))
        AND o.created_at <= datetime('now', printf('-%d hours', ?))
        AND substr(COALESCE(o.created_at,''),1,10) >= date('now', printf('-%d days', ?))
      ORDER BY o.created_at DESC, o.order_id DESC
      LIMIT 50
    `).bind(...paymentStatuses, ...orderStatuses, Math.max(0, Number(reviewSettings.send_after_hours || 72)), Math.max(1, Number(reviewSettings.max_age_days || 45))).all().catch(() => ({ results: [] })));
    for (const row of orders) {
      const already = await notificationExists(db, { notificationKind: 'review_request', destination: row.customer_email, relatedOrderId: Number(row.order_id || 0) });
      if (already) continue;
      const queued = await queueReviewRequest(db, Number(row.order_id || 0));
      if (queued?.queued) results.review_requests_queued += 1;
    }
  }

  const processed = await processNotificationOutbox(env, { limit: 30 }).catch(() => ({ processed_count: 0 }));
  results.notifications_processed = Number(processed?.processed_count || 0);
  await recordAutomationRun(db, 'automation', actorUserId, results);
  return results;
}

async function listEngagementData(db) {
  await Promise.all([
    ensureWishlistTable(db),
    ensureInterestTable(db),
    ensureCheckoutRecoveryTable(db),
    ensureGiftCardTables(db),
    ensureReviewTable(db),
    ensureNotificationTables(db),
    ensureAutomationSettingsTable(db)
  ]);

  const [hasOrders, hasOrderItems, hasNotificationOutbox, hasCartActivity] = await Promise.all([
    tableExists(db, 'orders'),
    tableExists(db, 'order_items'),
    tableExists(db, 'notification_outbox'),
    tableExists(db, 'cart_activity')
  ]);

  const [wishlistRows, interestRows, recoveryRows, giftCards, reviewRows, recentOrders, outboxRows, cooldownRows, automationSettingRows, exclusionRows, runRows, dispatchRows, giftAuditRows] = await Promise.all([
    db.prepare(`
      SELECT p.product_id, p.name, p.slug, p.featured_image_url, COUNT(*) AS saved_count, MAX(mw.created_at) AS last_saved_at
      FROM member_wishlists mw
      LEFT JOIN products p ON p.product_id = mw.product_id
      GROUP BY p.product_id, p.name, p.slug, p.featured_image_url
      ORDER BY saved_count DESC, last_saved_at DESC
      LIMIT 50
    `).all().catch(() => ({ results: [] })),
    db.prepare(`
      SELECT pir.product_interest_request_id, pir.product_id, pir.request_type, pir.user_id, pir.email, pir.notes, pir.status, pir.created_at,
             p.name AS product_name, p.slug AS product_slug, p.featured_image_url
      FROM product_interest_requests pir
      LEFT JOIN products p ON p.product_id = pir.product_id
      ORDER BY CASE WHEN LOWER(COALESCE(pir.status,'open'))='open' THEN 0 ELSE 1 END, pir.created_at DESC, pir.product_interest_request_id DESC
      LIMIT 200
    `).all().catch(() => ({ results: [] })),
    db.prepare(`
      SELECT checkout_recovery_lead_id, browser_session_token, visitor_token, customer_email, customer_name, cart_count, cart_value_cents,
             currency, checkout_path, status, last_recovery_email_at, created_at
      FROM checkout_recovery_leads
      ORDER BY CASE WHEN LOWER(COALESCE(status,'open'))='open' THEN 0 ELSE 1 END, created_at DESC, checkout_recovery_lead_id DESC
      LIMIT 200
    `).all().catch(() => ({ results: [] })),
    db.prepare(`
      SELECT gift_card_id, code, currency, initial_amount_cents, remaining_amount_cents,
             COALESCE(recipient_email, issued_to_email) AS recipient_email,
             COALESCE(recipient_name, issued_to_name) AS recipient_name,
             purchaser_email, purchaser_name,
             note, recipient_note, status, expires_at, last_redeemed_at, created_at,
             order_id, purchase_source
      FROM gift_cards
      ORDER BY created_at DESC, gift_card_id DESC
      LIMIT 150
    `).all().catch(() => ({ results: [] })),
    db.prepare(`
      SELECT pr.product_review_id, pr.product_id, pr.order_id, pr.user_id, pr.reviewer_name, pr.reviewer_email, pr.rating,
             pr.review_text, pr.review_kind, pr.status, pr.is_featured, pr.admin_notes, pr.created_at,
             p.name AS product_name, p.slug AS product_slug
      FROM product_reviews pr
      LEFT JOIN products p ON p.product_id = pr.product_id
      ORDER BY CASE WHEN LOWER(COALESCE(pr.status,'pending_review'))='pending_review' THEN 0 ELSE 1 END, pr.created_at DESC, pr.product_review_id DESC
      LIMIT 200
    `).all().catch(() => ({ results: [] })),
    hasOrders && hasOrderItems ? db.prepare(`
      SELECT o.order_id, o.order_number, o.customer_email, o.customer_name, o.created_at,
             GROUP_CONCAT(oi.product_name, ', ') AS product_names,
             COUNT(oi.order_item_id) AS item_count,
             COALESCE(o.total_cents,0) AS total_cents,
             COALESCE(o.currency,'CAD') AS currency
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      WHERE LOWER(COALESCE(o.payment_status,'')) IN ('paid','completed','captured','partially_refunded')
         OR LOWER(COALESCE(o.order_status,'')) IN ('paid','fulfilled','completed')
      GROUP BY o.order_id, o.order_number, o.customer_email, o.customer_name, o.created_at, o.total_cents, o.currency
      ORDER BY o.created_at DESC, o.order_id DESC
      LIMIT 50
    `).all().catch(() => ({ results: [] })) : ({ results: [] }),
    hasNotificationOutbox ? db.prepare(`
      SELECT notification_outbox_id, notification_kind, destination, related_order_id, related_product_id, status, error_text, attempt_count, created_at, last_attempt_at
      FROM notification_outbox
      WHERE notification_kind IN ('checkout_recovery','gift_card_issued','gift_card_purchase_confirmation','review_request','back_in_stock')
      ORDER BY created_at DESC, notification_outbox_id DESC
      LIMIT 200
    `).all().catch(() => ({ results: [] })) : ({ results: [] }),
    db.prepare(`SELECT notification_cooldown_rule_id, notification_kind, cooldown_hours, is_enabled, created_at, updated_at FROM notification_cooldown_rules ORDER BY notification_kind ASC`).all().catch(() => ({ results: [] })),
    db.prepare(`SELECT notification_automation_setting_id, notification_kind, is_enabled, send_after_hours, max_age_days, order_statuses_json, payment_statuses_json, notes, created_at, updated_at FROM notification_automation_settings ORDER BY notification_kind ASC`).all().catch(() => ({ results: [] })),
    db.prepare(`SELECT notification_exclusion_id, notification_kind, destination, product_id, order_id, reason, is_active, created_at, updated_at FROM notification_exclusions WHERE is_active = 1 ORDER BY created_at DESC, notification_exclusion_id DESC LIMIT 100`).all().catch(() => ({ results: [] })),
    db.prepare(`SELECT customer_engagement_run_id, run_type, actor_user_id, summary_json, created_at FROM customer_engagement_runs ORDER BY created_at DESC, customer_engagement_run_id DESC LIMIT 50`).all().catch(() => ({ results: [] })),
    db.prepare(`SELECT notification_dispatch_log_id, notification_outbox_id, notification_kind, destination, status, provider_message_id, error_text, created_at FROM notification_dispatch_log ORDER BY created_at DESC, notification_dispatch_log_id DESC LIMIT 200`).all().catch(() => ({ results: [] }))
  ]);

  const notificationRows = nr(outboxRows);
  const dispatchLogRows = nr(dispatchRows);
  const giftCardHistoryMap = new Map();
  for (const row of dispatchLogRows) {
    const key = `${safeEmail(row.destination)}::gift_card`;
    const current = giftCardHistoryMap.get(key) || { send_count: 0, last_status: '', last_created_at: null, history: [] };
    if (String(row.notification_kind || '').startsWith('gift_card_')) {
      current.send_count += 1;
      current.last_status = row.status || current.last_status;
      current.last_created_at = row.created_at || current.last_created_at;
      if (current.history.length < 8) current.history.push({
        notification_dispatch_log_id: Number(row.notification_dispatch_log_id || 0),
        status: row.status || '',
        created_at: row.created_at || null,
        error_text: row.error_text || '',
        provider_message_id: row.provider_message_id || '',
        notification_kind: row.notification_kind || ''
      });
      giftCardHistoryMap.set(key, current);
    }
  }

  const abandonedCartStats = hasCartActivity ? await (async () => {
    const row = await db.prepare(`
      SELECT COUNT(*) AS open_abandoned_carts
      FROM cart_activity
      WHERE event_type = 'cart_abandoned' AND created_at >= datetime('now', '-30 days')
    `).first().catch(() => null);
    return { open_abandoned_carts: Number(row?.open_abandoned_carts || 0) };
  })() : { open_abandoned_carts: 0 };

  return {
    summary: {
      wishlist_products_count: nr(wishlistRows).length,
      back_in_stock_open_count: nr(interestRows).filter((row) => String(row.request_type || '') === 'back_in_stock' && String(row.status || 'open') === 'open').length,
      checkout_recovery_open_count: nr(recoveryRows).filter((row) => String(row.status || 'open') === 'open').length,
      gift_card_active_count: nr(giftCards).filter((row) => String(row.status || 'active') === 'active' && Number(row.remaining_amount_cents || 0) > 0).length,
      pending_review_count: nr(reviewRows).filter((row) => String(row.status || '') === 'pending_review').length,
      notification_queue_count: notificationRows.filter((row) => ['queued','retry','failed'].includes(String(row.status || '').toLowerCase())).length,
      ...abandonedCartStats
    },
    wishlist_products: nr(wishlistRows).map((row) => ({
      product_id: Number(row.product_id || 0), name: row.name || '', slug: row.slug || '', featured_image_url: row.featured_image_url || '', saved_count: Number(row.saved_count || 0), last_saved_at: row.last_saved_at || null
    })),
    interest_requests: nr(interestRows).map((row) => ({
      product_interest_request_id: Number(row.product_interest_request_id || 0), product_id: Number(row.product_id || 0), request_type: row.request_type || '', user_id: Number(row.user_id || 0), email: row.email || '', notes: row.notes || '', status: row.status || 'open', created_at: row.created_at || null, product_name: row.product_name || '', product_slug: row.product_slug || '', featured_image_url: row.featured_image_url || ''
    })),
    checkout_recovery_leads: nr(recoveryRows).map((row) => ({
      checkout_recovery_lead_id: Number(row.checkout_recovery_lead_id || 0), browser_session_token: row.browser_session_token || '', visitor_token: row.visitor_token || '', customer_email: row.customer_email || '', customer_name: row.customer_name || '', cart_count: Number(row.cart_count || 0), cart_value_cents: Number(row.cart_value_cents || 0), currency: row.currency || 'CAD', checkout_path: row.checkout_path || '/checkout/', status: row.status || 'open', last_recovery_email_at: row.last_recovery_email_at || null, created_at: row.created_at || null
    })),
    gift_cards: nr(giftCards).map((row) => {
      const recipientKey = `${safeEmail(row.recipient_email || row.issued_to_email)}::gift_card`;
      const purchaserKey = `${safeEmail(row.purchaser_email)}::gift_card`;
      const recipientHistory = giftCardHistoryMap.get(recipientKey) || { send_count: 0, last_status: '', last_created_at: null, history: [] };
      const purchaserHistory = giftCardHistoryMap.get(purchaserKey) || { send_count: 0, last_status: '', last_created_at: null, history: [] };
      return {
        gift_card_id: Number(row.gift_card_id || 0), code: row.code || '', currency: row.currency || 'CAD', initial_amount_cents: Number(row.initial_amount_cents || 0), remaining_amount_cents: Number(row.remaining_amount_cents || 0), recipient_email: row.recipient_email || '', recipient_name: row.recipient_name || '', purchaser_email: row.purchaser_email || '', purchaser_name: row.purchaser_name || '', note: row.note || '', recipient_note: row.recipient_note || '', status: row.status || 'active', expires_at: row.expires_at || null, last_redeemed_at: row.last_redeemed_at || null, created_at: row.created_at || null, order_id: Number(row.order_id || 0), purchase_source: row.purchase_source || '', recipient_send_count: Number(recipientHistory.send_count || 0), recipient_last_status: recipientHistory.last_status || '', recipient_last_sent_at: recipientHistory.last_created_at || null, recipient_send_history: recipientHistory.history || [], purchaser_send_count: Number(purchaserHistory.send_count || 0), purchaser_last_status: purchaserHistory.last_status || '', purchaser_last_sent_at: purchaserHistory.last_created_at || null, purchaser_send_history: purchaserHistory.history || []
      };
    }),
    reviews: nr(reviewRows).map((row) => ({
      product_review_id: Number(row.product_review_id || 0), product_id: Number(row.product_id || 0), order_id: Number(row.order_id || 0), user_id: Number(row.user_id || 0), reviewer_name: row.reviewer_name || '', reviewer_email: row.reviewer_email || '', rating: Number(row.rating || 0), review_text: row.review_text || '', review_kind: row.review_kind || 'testimonial', status: row.status || 'pending_review', is_featured: Number(row.is_featured || 0), admin_notes: row.admin_notes || '', created_at: row.created_at || null, product_name: row.product_name || '', product_slug: row.product_slug || ''
    })),
    recent_review_orders: nr(recentOrders).map((row) => ({
      order_id: Number(row.order_id || 0), order_number: row.order_number || '', customer_email: row.customer_email || '', customer_name: row.customer_name || '', created_at: row.created_at || null, product_names: row.product_names || '', item_count: Number(row.item_count || 0), total_cents: Number(row.total_cents || 0), currency: row.currency || 'CAD'
    })),
    notification_queue: notificationRows.map((row) => ({
      notification_outbox_id: Number(row.notification_outbox_id || 0), notification_kind: row.notification_kind || '', destination: row.destination || '', related_order_id: Number(row.related_order_id || 0), related_product_id: Number(row.related_product_id || 0), status: row.status || 'queued', error_text: row.error_text || '', attempt_count: Number(row.attempt_count || 0), created_at: row.created_at || null, last_attempt_at: row.last_attempt_at || null
    })),
    automation_rules: nr(cooldownRows).map((row) => ({ notification_cooldown_rule_id: Number(row.notification_cooldown_rule_id || 0), notification_kind: row.notification_kind || '', cooldown_hours: Number(row.cooldown_hours || 0), is_enabled: Number(row.is_enabled || 0), created_at: row.created_at || null, updated_at: row.updated_at || null })),
    automation_settings: nr(automationSettingRows).map((row) => ({ notification_automation_setting_id: Number(row.notification_automation_setting_id || 0), notification_kind: row.notification_kind || '', is_enabled: Number(row.is_enabled || 0), send_after_hours: Number(row.send_after_hours || 0), max_age_days: Number(row.max_age_days || 0), order_statuses: parseStatusList(row.order_statuses_json), payment_statuses: parseStatusList(row.payment_statuses_json), notes: row.notes || '', created_at: row.created_at || null, updated_at: row.updated_at || null })),
    exclusions: nr(exclusionRows).map((row) => ({ notification_exclusion_id: Number(row.notification_exclusion_id || 0), notification_kind: row.notification_kind || '', destination: row.destination || '', product_id: Number(row.product_id || 0), order_id: Number(row.order_id || 0), reason: row.reason || '', is_active: Number(row.is_active || 0), created_at: row.created_at || null, updated_at: row.updated_at || null })),
    automation_runs: nr(runRows).map((row) => ({ customer_engagement_run_id: Number(row.customer_engagement_run_id || 0), run_type: row.run_type || 'automation', actor_user_id: Number(row.actor_user_id || 0), summary_json: row.summary_json || '{}', created_at: row.created_at || null })),
    notification_dispatch_log: dispatchLogRows.map((row) => ({ notification_dispatch_log_id: Number(row.notification_dispatch_log_id || 0), notification_outbox_id: Number(row.notification_outbox_id || 0), notification_kind: row.notification_kind || '', destination: row.destination || '', status: row.status || '', provider_message_id: row.provider_message_id || '', error_text: row.error_text || '', created_at: row.created_at || null }))
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const payload = await listEngagementData(db);
  return json({ ok: true, ...payload });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await Promise.all([ensureWishlistTable(db), ensureInterestTable(db), ensureCheckoutRecoveryTable(db), ensureGiftCardTables(db), ensureGiftCardAuditTable(db), ensureReviewTable(db), ensureNotificationTables(db), ensureAutomationSettingsTable(db)]);

  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }

  try {
    const action = normalizeText(body.action).toLowerCase();

    if (action === 'issue_gift_card') {
      const purchaserEmail = safeEmail(body.purchaser_email);
      const purchaserName = normalizeText(body.purchaser_name);
      const recipientEmail = safeEmail(body.recipient_email);
      const recipientName = normalizeText(body.recipient_name);
      const recipientNote = normalizeText(body.recipient_note);
      const note = normalizeText(body.note);
      const expiresAt = normalizeText(body.expires_at) || null;
      const amountCents = cents(body.amount_cents);
      if (!recipientEmail || amountCents <= 0) return json({ ok: false, error: 'Recipient email and amount are required.' }, 400);
      const code = generateGiftCardCode();
      await db.prepare(`
        INSERT INTO gift_cards (
          code, currency, initial_amount_cents, remaining_amount_cents,
          issued_to_email, issued_to_name, recipient_email, recipient_name,
          purchaser_email, purchaser_name, recipient_note, note, status, expires_at,
          purchaser_user_id, created_at, updated_at
        ) VALUES (?, 'CAD', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(code, amountCents, amountCents, recipientEmail, recipientName || null, recipientEmail, recipientName || null, purchaserEmail || null, purchaserName || null, recipientNote || null, note || null, expiresAt, Number(adminUser.user_id || 0)).run();
      const cardRow = await db.prepare(`SELECT * FROM gift_cards WHERE code = ? LIMIT 1`).bind(code).first();
      await queueGiftCardNotice(db, cardRow || {}, Number(adminUser.user_id || 0));
      if (purchaserEmail) await queueGiftCardPurchaseConfirmation(db, cardRow || {}, Number(adminUser.user_id || 0));
      await auditAdminAction(env, request, adminUser, { action_type: 'gift_card_issued', target_type: 'gift_card', target_key: code, details: { amount_cents: amountCents, purchaser_email: purchaserEmail, recipient_email: recipientEmail } });
      return json({ ok: true, message: 'Gift card issued and email(s) queued.' });
    }

    if (action === 'resend_gift_card' || action === 'bulk_resend_gift_cards') {
      const ids = action === 'resend_gift_card' ? uniqueIds([body.gift_card_id]) : uniqueIds(body.gift_card_ids);
      if (!ids.length) return json({ ok: false, error: 'At least one gift_card_id is required.' }, 400);
      let queuedCount = 0;
      for (const giftCardId of ids) {
        const cardRow = await db.prepare(`SELECT * FROM gift_cards WHERE gift_card_id = ? LIMIT 1`).bind(giftCardId).first();
        if (!cardRow) continue;
        const audience = normalizeText(body.audience).toLowerCase();
        const a = audience && audience !== 'purchaser' ? await queueGiftCardNotice(db, cardRow, Number(adminUser.user_id || 0)) : { queued: false };
        const b = audience && audience !== 'recipient' ? await queueGiftCardPurchaseConfirmation(db, cardRow, Number(adminUser.user_id || 0)) : { queued: false };
        queuedCount += Number(!!a?.queued) + Number(!!b?.queued);
      }
      await auditAdminAction(env, request, adminUser, { action_type: 'gift_card_resend_queued', target_type: 'gift_card', details: { ids, queuedCount } });
      return json({ ok: true, message: `${queuedCount} gift card email(s) queued.` });
    }

    if (action === 'resend_gift_card_recipient' || action === 'resend_gift_card_purchaser') {
      const giftCardId = Number(body.gift_card_id || 0);
      if (!giftCardId) return json({ ok: false, error: 'gift_card_id is required.' }, 400);
      const cardRow = await db.prepare(`SELECT * FROM gift_cards WHERE gift_card_id = ? LIMIT 1`).bind(giftCardId).first();
      if (!cardRow) return json({ ok: false, error: 'Gift card not found.' }, 404);
      const result = action === 'resend_gift_card_recipient'
        ? await queueGiftCardNotice(db, cardRow, Number(adminUser.user_id || 0))
        : await queueGiftCardPurchaseConfirmation(db, cardRow, Number(adminUser.user_id || 0));
      await auditAdminAction(env, request, adminUser, { action_type: action, target_type: 'gift_card', target_id: giftCardId, details: { queued: !!result?.queued } });
      return json({ ok: true, message: result?.queued ? 'Gift card email queued.' : 'No email was queued for this audience.' });
    }

    if (action === 'set_gift_card_status' || action === 'bulk_set_gift_card_status') {
      const ids = action === 'set_gift_card_status' ? uniqueIds([body.gift_card_id]) : uniqueIds(body.gift_card_ids);
      const status = normalizeText(body.status).toLowerCase() || 'inactive';
      if (!ids.length) return json({ ok: false, error: 'At least one gift_card_id is required.' }, 400);
      const placeholders = ids.map(() => '?').join(',');
      await db.prepare(`UPDATE gift_cards SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE gift_card_id IN (${placeholders})`).bind(status, ...ids).run();
      await auditAdminAction(env, request, adminUser, { action_type: 'gift_card_status_update', target_type: 'gift_card', details: { ids, status } });
      return json({ ok: true, message: `${ids.length} gift card(s) updated.` });
    }

    if (action === 'set_interest_status' || action === 'bulk_set_interest_status') {
      const ids = action === 'set_interest_status' ? uniqueIds([body.product_interest_request_id]) : uniqueIds(body.product_interest_request_ids);
      const status = normalizeText(body.status).toLowerCase() || 'reviewed';
      if (!ids.length) return json({ ok: false, error: 'At least one product_interest_request_id is required.' }, 400);
      const placeholders = ids.map(() => '?').join(',');
      await db.prepare(`UPDATE product_interest_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE product_interest_request_id IN (${placeholders})`).bind(status, ...ids).run();
      await auditAdminAction(env, request, adminUser, { action_type: 'interest_status_update', target_type: 'product_interest_request', details: { ids, status } });
      return json({ ok: true, message: `${ids.length} interest request(s) updated.` });
    }

    if (action === 'queue_recovery_email' || action === 'bulk_queue_recovery_emails') {
      const ids = action === 'queue_recovery_email' ? uniqueIds([body.checkout_recovery_lead_id]) : uniqueIds(body.checkout_recovery_lead_ids);
      if (!ids.length) return json({ ok: false, error: 'At least one checkout_recovery_lead_id is required.' }, 400);
      let queuedCount = 0;
      for (const id of ids) {
        const lead = await db.prepare(`SELECT * FROM checkout_recovery_leads WHERE checkout_recovery_lead_id = ? LIMIT 1`).bind(id).first();
        if (!lead) continue;
        const queued = await queueRecoveryEmail(db, lead);
        if (queued?.queued) {
          await db.prepare(`UPDATE checkout_recovery_leads SET status = 'emailed', last_recovery_email_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE checkout_recovery_lead_id = ?`).bind(id).run().catch(() => null);
          queuedCount += 1;
        }
      }
      await auditAdminAction(env, request, adminUser, { action_type: 'checkout_recovery_queued', target_type: 'checkout_recovery_lead', details: { ids, queuedCount } });
      return json({ ok: true, message: `${queuedCount} recovery email(s) queued.` });
    }

    if (action === 'set_recovery_status') {
      const ids = uniqueIds(body.checkout_recovery_lead_ids || [body.checkout_recovery_lead_id]);
      const status = normalizeText(body.status).toLowerCase() || 'closed';
      if (!ids.length) return json({ ok: false, error: 'At least one checkout_recovery_lead_id is required.' }, 400);
      const placeholders = ids.map(() => '?').join(',');
      await db.prepare(`UPDATE checkout_recovery_leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE checkout_recovery_lead_id IN (${placeholders})`).bind(status, ...ids).run();
      return json({ ok: true, message: `${ids.length} recovery lead(s) updated.` });
    }

    if (action === 'set_review_status' || action === 'bulk_set_review_status') {
      const ids = action === 'set_review_status' ? uniqueIds([body.product_review_id]) : uniqueIds(body.product_review_ids);
      const status = normalizeText(body.status).toLowerCase() || 'approved';
      const isFeatured = Number(body.is_featured || 0) === 1 ? 1 : 0;
      const adminNotes = normalizeText(body.admin_notes);
      if (!ids.length) return json({ ok: false, error: 'At least one product_review_id is required.' }, 400);
      const placeholders = ids.map(() => '?').join(',');
      await db.prepare(`UPDATE product_reviews SET status = ?, is_featured = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE product_review_id IN (${placeholders})`).bind(status, isFeatured, adminNotes || null, ...ids).run();
      await auditAdminAction(env, request, adminUser, { action_type: 'review_status_update', target_type: 'product_review', details: { ids, status, is_featured: isFeatured } });
      return json({ ok: true, message: `${ids.length} review(s) updated.` });
    }

    if (action === 'queue_review_request' || action === 'bulk_queue_review_requests') {
      const ids = action === 'queue_review_request' ? uniqueIds([body.order_id]) : uniqueIds(body.order_ids);
      if (!ids.length) return json({ ok: false, error: 'At least one order_id is required.' }, 400);
      let queuedCount = 0;
      for (const orderId of ids) {
        const queued = await queueReviewRequest(db, orderId);
        if (queued?.queued) queuedCount += 1;
      }
      await auditAdminAction(env, request, adminUser, { action_type: 'review_request_queued', target_type: 'order', details: { ids, queuedCount } });
      return json({ ok: true, message: `${queuedCount} review request(s) queued.` });
    }

    if (action === 'set_notification_cooldown') {
      const notificationKind = normalizeText(body.notification_kind);
      const cooldownHours = Math.max(0, Number(body.cooldown_hours || 0));
      const isEnabled = Number(body.is_enabled || 0) === 1 ? 1 : 0;
      if (!notificationKind) return json({ ok: false, error: 'notification_kind is required.' }, 400);
      await db.prepare(`INSERT INTO notification_cooldown_rules (notification_kind, cooldown_hours, is_enabled, created_at, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(notification_kind) DO UPDATE SET cooldown_hours = excluded.cooldown_hours, is_enabled = excluded.is_enabled, updated_at = CURRENT_TIMESTAMP`).bind(notificationKind, cooldownHours, isEnabled).run();
      return json({ ok: true, message: 'Cooldown rule saved.' });
    }

    if (action === 'set_notification_automation') {
      const notificationKind = normalizeText(body.notification_kind);
      const isEnabled = Number(body.is_enabled || 0) === 1 ? 1 : 0;
      const sendAfterHours = Math.max(0, Number(body.send_after_hours || 0));
      const maxAgeDays = Math.max(1, Number(body.max_age_days || 1));
      const orderStatusesJson = safeJsonStringify(parseStatusList(body.order_statuses || body.order_statuses_json));
      const paymentStatusesJson = safeJsonStringify(parseStatusList(body.payment_statuses || body.payment_statuses_json));
      const notes = normalizeText(body.notes);
      if (!notificationKind) return json({ ok: false, error: 'notification_kind is required.' }, 400);
      await db.prepare(`INSERT INTO notification_automation_settings (
        notification_kind, is_enabled, send_after_hours, max_age_days, order_statuses_json, payment_statuses_json, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(notification_kind) DO UPDATE SET
        is_enabled = excluded.is_enabled,
        send_after_hours = excluded.send_after_hours,
        max_age_days = excluded.max_age_days,
        order_statuses_json = excluded.order_statuses_json,
        payment_statuses_json = excluded.payment_statuses_json,
        notes = excluded.notes,
        updated_at = CURRENT_TIMESTAMP`).bind(notificationKind, isEnabled, sendAfterHours, maxAgeDays, orderStatusesJson, paymentStatusesJson, notes || null).run();
      return json({ ok: true, message: 'Automation rule saved.' });
    }

    if (action === 'add_notification_exclusion') {
      const notificationKind = normalizeText(body.notification_kind);
      const destination = safeEmail(body.destination);
      const productId = Number(body.product_id || 0) || null;
      const orderId = Number(body.order_id || 0) || null;
      const reason = normalizeText(body.reason);
      if (!notificationKind) return json({ ok: false, error: 'notification_kind is required.' }, 400);
      await db.prepare(`INSERT INTO notification_exclusions (notification_kind, destination, product_id, order_id, reason, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(notificationKind, destination || null, productId, orderId, reason || null).run();
      return json({ ok: true, message: 'Exclusion added.' });
    }

    if (action === 'remove_notification_exclusion') {
      const id = Number(body.notification_exclusion_id || 0);
      if (!id) return json({ ok: false, error: 'notification_exclusion_id is required.' }, 400);
      await db.prepare(`UPDATE notification_exclusions SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE notification_exclusion_id = ?`).bind(id).run();
      return json({ ok: true, message: 'Exclusion removed.' });
    }

    if (action === 'retry_notification' || action === 'bulk_retry_notifications') {
      const ids = action === 'retry_notification' ? uniqueIds([body.notification_outbox_id]) : uniqueIds(body.notification_outbox_ids);
      if (!ids.length) return json({ ok: false, error: 'At least one notification_outbox_id is required.' }, 400);
      const retried = await retryNotificationRows(db, ids);
      await auditAdminAction(env, request, adminUser, { action_type: 'notification_retry_queued', target_type: 'notification_outbox', details: { ids, retried } });
      return json({ ok: true, message: `${retried} notification(s) re-queued.` });
    }

    if (action === 'cancel_notification' || action === 'bulk_cancel_notifications') {
      const ids = action === 'cancel_notification' ? uniqueIds([body.notification_outbox_id]) : uniqueIds(body.notification_outbox_ids);
      if (!ids.length) return json({ ok: false, error: 'At least one notification_outbox_id is required.' }, 400);
      const cancelled = await cancelNotificationRows(db, ids);
      return json({ ok: true, message: `${cancelled} notification(s) cancelled.` });
    }

    if (action === 'auto_process_engagement') {
      const automationResults = await autoProcessEngagement(db, env, Number(adminUser.user_id || 0));
      await auditAdminAction(env, request, adminUser, { action_type: 'customer_engagement_auto_process', target_type: 'customer_engagement', details: automationResults });
      return json({ ok: true, message: 'Automated engagement cycle completed.', automation_results: automationResults });
    }

    return json({ ok: false, error: 'Unsupported action.' }, 400);
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Customer engagement action failed.' }, 500);
  }
}
