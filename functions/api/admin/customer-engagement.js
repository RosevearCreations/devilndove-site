import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { processNotificationOutbox, queueNotification } from '../_lib/notificationOutbox.js';

function json(data, status = 200) { return jsonResponse(data, status); }
function nr(result) { return Array.isArray(result?.results) ? result.results : []; }
function cents(value) { return Math.max(0, Math.round(Number(value || 0))); }
function safeEmail(value) { return normalizeText(value).toLowerCase(); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function uniqueIds(value) {
  return Array.from(new Set(asArray(value).map((row) => Number(row || 0)).filter((row) => Number.isInteger(row) && row > 0)));
}

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
  await db.prepare(`CREATE TABLE IF NOT EXISTS gift_card_redemptions (
    gift_card_redemption_id INTEGER PRIMARY KEY AUTOINCREMENT,
    gift_card_id INTEGER NOT NULL,
    order_id INTEGER,
    redeemed_amount_cents INTEGER NOT NULL DEFAULT 0,
    redeemed_by_email TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
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

function generateGiftCardCode() {
  return `DND-GIFT-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function queueRecoveryEmail(db, lead) {
  await queueNotification(db, {
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

async function queueGiftCardNotice(db, cardRow) {
  const recipientEmail = safeEmail(cardRow.recipient_email || cardRow.issued_to_email);
  if (!recipientEmail) return;
  await queueNotification(db, {
    notification_kind: 'gift_card_issued',
    destination: recipientEmail,
    payload: {
      code: cardRow.code || '',
      currency: cardRow.currency || 'CAD',
      initial_amount_cents: Number(cardRow.initial_amount_cents || 0),
      remaining_amount_cents: Number(cardRow.remaining_amount_cents || 0),
      expires_at: cardRow.expires_at || '',
      note: cardRow.recipient_note || cardRow.note || '',
      purchaser_name: cardRow.purchaser_name || '',
      recipient_name: cardRow.recipient_name || cardRow.issued_to_name || '',
      subject: (cardRow.purchaser_name || cardRow.recipient_name || cardRow.issued_to_name)
        ? `A Devil n Dove gift card${cardRow.purchaser_name ? ` from ${cardRow.purchaser_name}` : ''}`
        : 'Your Devil n Dove gift card'
    }
  });
}

async function listEngagementData(db) {
  await Promise.all([
    ensureWishlistTable(db),
    ensureInterestTable(db),
    ensureCheckoutRecoveryTable(db),
    ensureGiftCardTables(db),
    ensureReviewTable(db)
  ]);

  const [hasOrders, hasOrderItems, hasNotificationOutbox, hasCartActivity] = await Promise.all([
    tableExists(db, 'orders'),
    tableExists(db, 'order_items'),
    tableExists(db, 'notification_outbox'),
    tableExists(db, 'cart_activity')
  ]);

  const [wishlistRows, interestRows, recoveryRows, giftCards, reviewRows, recentOrders, outboxRows] = await Promise.all([
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
             note, recipient_note, status, expires_at, last_redeemed_at, created_at
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
      SELECT notification_outbox_id, notification_kind, destination, status, error_text, created_at, last_attempt_at, related_order_id
      FROM notification_outbox
      WHERE notification_kind IN ('checkout_recovery','gift_card_issued','review_request','back_in_stock')
      ORDER BY created_at DESC, notification_outbox_id DESC
      LIMIT 150
    `).all().catch(() => ({ results: [] })) : ({ results: [] })
  ]);

  const notificationRows = nr(outboxRows);
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
      product_id: Number(row.product_id || 0),
      name: row.name || '',
      slug: row.slug || '',
      featured_image_url: row.featured_image_url || '',
      saved_count: Number(row.saved_count || 0),
      last_saved_at: row.last_saved_at || null
    })),
    interest_requests: nr(interestRows).map((row) => ({
      product_interest_request_id: Number(row.product_interest_request_id || 0),
      product_id: Number(row.product_id || 0),
      request_type: row.request_type || '',
      user_id: Number(row.user_id || 0),
      email: row.email || '',
      notes: row.notes || '',
      status: row.status || 'open',
      created_at: row.created_at || null,
      product_name: row.product_name || '',
      product_slug: row.product_slug || '',
      featured_image_url: row.featured_image_url || ''
    })),
    checkout_recovery_leads: nr(recoveryRows).map((row) => ({
      checkout_recovery_lead_id: Number(row.checkout_recovery_lead_id || 0),
      browser_session_token: row.browser_session_token || '',
      visitor_token: row.visitor_token || '',
      customer_email: row.customer_email || '',
      customer_name: row.customer_name || '',
      cart_count: Number(row.cart_count || 0),
      cart_value_cents: Number(row.cart_value_cents || 0),
      currency: row.currency || 'CAD',
      checkout_path: row.checkout_path || '/checkout/',
      status: row.status || 'open',
      last_recovery_email_at: row.last_recovery_email_at || null,
      created_at: row.created_at || null
    })),
    gift_cards: nr(giftCards).map((row) => ({
      gift_card_id: Number(row.gift_card_id || 0),
      code: row.code || '',
      currency: row.currency || 'CAD',
      initial_amount_cents: Number(row.initial_amount_cents || 0),
      remaining_amount_cents: Number(row.remaining_amount_cents || 0),
      recipient_email: row.recipient_email || '',
      recipient_name: row.recipient_name || '',
      purchaser_email: row.purchaser_email || '',
      purchaser_name: row.purchaser_name || '',
      note: row.note || '',
      recipient_note: row.recipient_note || '',
      status: row.status || 'active',
      expires_at: row.expires_at || null,
      last_redeemed_at: row.last_redeemed_at || null,
      created_at: row.created_at || null
    })),
    reviews: nr(reviewRows).map((row) => ({
      product_review_id: Number(row.product_review_id || 0),
      product_id: Number(row.product_id || 0),
      order_id: Number(row.order_id || 0),
      user_id: Number(row.user_id || 0),
      reviewer_name: row.reviewer_name || '',
      reviewer_email: row.reviewer_email || '',
      rating: Number(row.rating || 0),
      review_text: row.review_text || '',
      review_kind: row.review_kind || 'testimonial',
      status: row.status || 'pending_review',
      is_featured: Number(row.is_featured || 0),
      admin_notes: row.admin_notes || '',
      created_at: row.created_at || null,
      product_name: row.product_name || '',
      product_slug: row.product_slug || ''
    })),
    recent_review_orders: nr(recentOrders).map((row) => ({
      order_id: Number(row.order_id || 0),
      order_number: row.order_number || '',
      customer_email: row.customer_email || '',
      customer_name: row.customer_name || '',
      created_at: row.created_at || null,
      product_names: row.product_names || '',
      item_count: Number(row.item_count || 0),
      total_cents: Number(row.total_cents || 0),
      currency: row.currency || 'CAD'
    })),
    notification_queue: notificationRows.map((row) => ({
      notification_outbox_id: Number(row.notification_outbox_id || 0),
      notification_kind: row.notification_kind || '',
      destination: row.destination || '',
      status: row.status || 'queued',
      error_text: row.error_text || '',
      created_at: row.created_at || null,
      last_attempt_at: row.last_attempt_at || null,
      related_order_id: Number(row.related_order_id || 0)
    }))
  };
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
      AND status IN ('queued','retry','sent')
    ORDER BY notification_outbox_id DESC
    LIMIT 1
  `).bind(notificationKind, safeEmail(destination), relatedOrderId == null ? null : Number(relatedOrderId || 0), relatedOrderId == null ? null : Number(relatedOrderId || 0)).first().catch(() => null);
  return !!row;
}

async function queueBackInStockNotice(db, requestRow) {
  const destination = safeEmail(requestRow.email);
  if (!destination) return false;
  const already = await notificationExists(db, { notificationKind: 'back_in_stock', destination });
  if (already) return false;
  await queueNotification(db, {
    notification_kind: 'back_in_stock',
    destination,
    payload: {
      product_name: requestRow.product_name || '',
      product_slug: requestRow.product_slug || '',
      subject: requestRow.product_name ? `${requestRow.product_name} is back in stock` : 'A Devil n Dove item is back in stock'
    }
  });
  return true;
}

async function autoProcessEngagement(db, env) {
  const results = { back_in_stock_queued: 0, back_in_stock_closed: 0, recovery_queued: 0, review_requests_queued: 0, notifications_processed: 0 };

  const hasProducts = await tableExists(db, 'products');
  const hasOrders = await tableExists(db, 'orders');
  const hasOrderItems = await tableExists(db, 'order_items');

  if (hasProducts) {
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

  const recoveryRows = nr(await db.prepare(`
    SELECT checkout_recovery_lead_id, customer_email, customer_name, cart_count, cart_value_cents, currency, checkout_path
    FROM checkout_recovery_leads
    WHERE LOWER(COALESCE(status,'open')) = 'open'
      AND LOWER(COALESCE(customer_email,'')) != ''
      AND last_recovery_email_at IS NULL
    ORDER BY created_at ASC, checkout_recovery_lead_id ASC
    LIMIT 50
  `).all().catch(() => ({ results: [] })));
  for (const row of recoveryRows) {
    const already = await notificationExists(db, { notificationKind: 'checkout_recovery', destination: row.customer_email });
    if (already) continue;
    await queueRecoveryEmail(db, row);
    await db.prepare(`UPDATE checkout_recovery_leads SET status = 'emailed', last_recovery_email_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE checkout_recovery_lead_id = ?`).bind(Number(row.checkout_recovery_lead_id || 0)).run().catch(() => null);
    results.recovery_queued += 1;
  }

  if (hasOrders && hasOrderItems) {
    const orders = nr(await db.prepare(`
      SELECT o.order_id, o.order_number, o.customer_email
      FROM orders o
      WHERE (LOWER(COALESCE(o.payment_status,'')) IN ('paid','completed','captured','partially_refunded')
         OR LOWER(COALESCE(o.order_status,'')) IN ('paid','fulfilled','completed'))
        AND substr(COALESCE(o.created_at,''),1,10) >= date('now','-45 days')
      ORDER BY o.created_at DESC, o.order_id DESC
      LIMIT 50
    `).all().catch(() => ({ results: [] })));

    for (const row of orders) {
      const already = await notificationExists(db, { notificationKind: 'review_request', destination: row.customer_email, relatedOrderId: Number(row.order_id || 0) });
      if (already) continue;
      await queueReviewRequest(db, Number(row.order_id || 0));
      results.review_requests_queued += 1;
    }
  }

  const processed = await processNotificationOutbox(env, { limit: 30 }).catch(() => ({ processed_count: 0 }));
  results.notifications_processed = Number(processed?.processed_count || 0);
  return results;
}
export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  try {
    const payload = await listEngagementData(db);
    return json({ ok: true, ...payload });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Failed to load customer engagement dashboard.' }, 500);
  }
}

async function loadRecoveryLead(db, leadId) {
  return db.prepare(`SELECT * FROM checkout_recovery_leads WHERE checkout_recovery_lead_id = ? LIMIT 1`).bind(leadId).first();
}

async function queueReviewRequest(db, orderId) {
  const order = await db.prepare(`SELECT order_id, order_number, customer_email FROM orders WHERE order_id = ? LIMIT 1`).bind(orderId).first();
  if (!order) throw new Error('Order not found.');
  const productNames = nr(await db.prepare(`SELECT product_name FROM order_items WHERE order_id = ? ORDER BY order_item_id ASC LIMIT 12`).bind(orderId).all()).map((row) => row.product_name || '').filter(Boolean);
  await queueNotification(db, {
    notification_kind: 'review_request',
    destination: safeEmail(order.customer_email),
    related_order_id: orderId,
    payload: { order_number: order.order_number || '', product_names: productNames }
  });
  return { order, productNames };
}

async function retryNotificationRows(db, ids = []) {
  const normalizedIds = uniqueIds(ids);
  if (!normalizedIds.length) return 0;
  const placeholders = normalizedIds.map(() => '?').join(',');
  await db.prepare(`
    UPDATE notification_outbox
    SET status = 'queued', next_attempt_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE notification_outbox_id IN (${placeholders})
  `).bind(...normalizedIds).run();
  return normalizedIds.length;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const action = normalizeText(body.action).toLowerCase();

  try {
    await Promise.all([
      ensureWishlistTable(db),
      ensureInterestTable(db),
      ensureCheckoutRecoveryTable(db),
      ensureGiftCardTables(db),
      ensureReviewTable(db)
    ]);

    if (action === 'set_interest_status' || action === 'bulk_set_interest_status') {
      const ids = action === 'set_interest_status'
        ? uniqueIds([body.product_interest_request_id])
        : uniqueIds(body.product_interest_request_ids);
      const status = normalizeText(body.status).toLowerCase() || 'reviewed';
      if (!ids.length) return json({ ok: false, error: 'At least one product_interest_request_id is required.' }, 400);
      const placeholders = ids.map(() => '?').join(',');
      await db.prepare(`UPDATE product_interest_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE product_interest_request_id IN (${placeholders})`).bind(status, ...ids).run();
      await auditAdminAction(env, request, adminUser, { action_type: 'interest_request_status_update', target_type: 'product_interest_request', details: { ids, status } });
      return json({ ok: true, message: `${ids.length} interest request(s) updated.` });
    }

    if (action === 'queue_recovery_email' || action === 'bulk_queue_recovery_emails') {
      const ids = action === 'queue_recovery_email'
        ? uniqueIds([body.checkout_recovery_lead_id])
        : uniqueIds(body.checkout_recovery_lead_ids);
      if (!ids.length) return json({ ok: false, error: 'At least one checkout_recovery_lead_id is required.' }, 400);
      let queuedCount = 0;
      for (const leadId of ids) {
        const lead = await loadRecoveryLead(db, leadId);
        if (!lead) continue;
        await queueRecoveryEmail(db, lead);
        await db.prepare(`UPDATE checkout_recovery_leads SET status = 'emailed', last_recovery_email_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE checkout_recovery_lead_id = ?`).bind(leadId).run();
        queuedCount += 1;
      }
      await auditAdminAction(env, request, adminUser, { action_type: 'checkout_recovery_email_queued', target_type: 'checkout_recovery_lead', details: { ids, queuedCount } });
      return json({ ok: true, message: `${queuedCount} recovery email(s) queued.` });
    }

    if (action === 'set_recovery_status') {
      const ids = uniqueIds(body.checkout_recovery_lead_ids || [body.checkout_recovery_lead_id]);
      const status = normalizeText(body.status).toLowerCase() || 'closed';
      if (!ids.length) return json({ ok: false, error: 'At least one checkout_recovery_lead_id is required.' }, 400);
      const placeholders = ids.map(() => '?').join(',');
      await db.prepare(`UPDATE checkout_recovery_leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE checkout_recovery_lead_id IN (${placeholders})`).bind(status, ...ids).run();
      await auditAdminAction(env, request, adminUser, { action_type: 'checkout_recovery_status_update', target_type: 'checkout_recovery_lead', details: { ids, status } });
      return json({ ok: true, message: `${ids.length} recovery lead(s) updated.` });
    }

    if (action === 'issue_gift_card') {
      const amountCents = cents(body.amount_cents);
      const currency = normalizeText(body.currency || 'CAD').toUpperCase() || 'CAD';
      const purchaserEmail = safeEmail(body.purchaser_email || adminUser.email || '');
      const purchaserName = normalizeText(body.purchaser_name || adminUser.display_name || '');
      const recipientEmail = safeEmail(body.recipient_email || body.issued_to_email);
      const recipientName = normalizeText(body.recipient_name || body.issued_to_name);
      const expiresAt = normalizeText(body.expires_at);
      const note = normalizeText(body.note);
      const recipientNote = normalizeText(body.recipient_note || body.note);
      const code = normalizeText(body.code).toUpperCase() || generateGiftCardCode();
      if (!recipientEmail || amountCents <= 0) return json({ ok: false, error: 'recipient_email and amount_cents are required.' }, 400);
      await db.prepare(`
        INSERT INTO gift_cards (
          code, currency, initial_amount_cents, remaining_amount_cents,
          issued_to_email, issued_to_name, recipient_email, recipient_name,
          purchaser_email, purchaser_name, purchaser_user_id,
          note, recipient_note, status, expires_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        code,
        currency,
        amountCents,
        amountCents,
        recipientEmail,
        recipientName || null,
        recipientEmail,
        recipientName || null,
        purchaserEmail || null,
        purchaserName || null,
        Number(adminUser.user_id || 0) || null,
        note || null,
        recipientNote || null,
        expiresAt || null
      ).run();
      const cardRow = await db.prepare(`SELECT * FROM gift_cards WHERE code = ? LIMIT 1`).bind(code).first();
      await queueGiftCardNotice(db, cardRow || { code, currency, initial_amount_cents: amountCents, remaining_amount_cents: amountCents, recipient_email: recipientEmail, recipient_name: recipientName, purchaser_name: purchaserName, expires_at: expiresAt, recipient_note: recipientNote });
      await auditAdminAction(env, request, adminUser, { action_type: 'gift_card_issued', target_type: 'gift_card', target_key: code, details: { amount_cents: amountCents, purchaser_email: purchaserEmail, recipient_email: recipientEmail } });
      return json({ ok: true, message: 'Gift card issued.', code });
    }

    if (action === 'resend_gift_card' || action === 'bulk_resend_gift_cards') {
      const ids = action === 'resend_gift_card' ? uniqueIds([body.gift_card_id]) : uniqueIds(body.gift_card_ids);
      if (!ids.length) return json({ ok: false, error: 'At least one gift_card_id is required.' }, 400);
      let queuedCount = 0;
      for (const giftCardId of ids) {
        const cardRow = await db.prepare(`SELECT * FROM gift_cards WHERE gift_card_id = ? LIMIT 1`).bind(giftCardId).first();
        if (!cardRow) continue;
        await queueGiftCardNotice(db, cardRow);
        queuedCount += 1;
      }
      await auditAdminAction(env, request, adminUser, { action_type: 'gift_card_resend_queued', target_type: 'gift_card', details: { ids, queuedCount } });
      return json({ ok: true, message: `${queuedCount} gift card email(s) queued again.` });
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
        await queueReviewRequest(db, orderId);
        queuedCount += 1;
      }
      await auditAdminAction(env, request, adminUser, { action_type: 'review_request_queued', target_type: 'order', details: { ids, queuedCount } });
      return json({ ok: true, message: `${queuedCount} review request(s) queued.` });
    }


    if (action === 'auto_process_engagement') {
      const automationResults = await autoProcessEngagement(db, env);
      await auditAdminAction(env, request, adminUser, { action_type: 'customer_engagement_auto_process', target_type: 'customer_engagement', details: automationResults });
      return json({ ok: true, message: 'Automated engagement cycle completed.', automation_results: automationResults });
    }

    if (action === 'retry_notification' || action === 'bulk_retry_notifications') {
      const ids = action === 'retry_notification' ? uniqueIds([body.notification_outbox_id]) : uniqueIds(body.notification_outbox_ids);
      if (!ids.length) return json({ ok: false, error: 'At least one notification_outbox_id is required.' }, 400);
      const retried = await retryNotificationRows(db, ids);
      await auditAdminAction(env, request, adminUser, { action_type: 'notification_retry_queued', target_type: 'notification_outbox', details: { ids, retried } });
      return json({ ok: true, message: `${retried} notification(s) re-queued.` });
    }

    return json({ ok: false, error: 'Unsupported action.' }, 400);
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Customer engagement action failed.' }, 500);
  }
}
