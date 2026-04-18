import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { queueNotification } from '../_lib/notificationOutbox.js';

function json(data, status = 200) { return jsonResponse(data, status); }
function nr(result) { return Array.isArray(result?.results) ? result.results : []; }
function cents(value) { return Math.max(0, Math.round(Number(value || 0))); }
function safeEmail(value) { return normalizeText(value).toLowerCase(); }

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1`).bind(tableName).first();
    return !!row;
  } catch {
    return false;
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

async function listEngagementData(db) {
  await Promise.all([
    ensureWishlistTable(db),
    ensureInterestTable(db),
    ensureCheckoutRecoveryTable(db),
    ensureGiftCardTables(db),
    ensureReviewTable(db)
  ]);

  const [wishlistRows, interestRows, recoveryRows, giftCards, reviewRows] = await Promise.all([
    db.prepare(`
      SELECT p.product_id, p.name, p.slug, p.featured_image_url, COUNT(*) AS saved_count, MAX(mw.created_at) AS last_saved_at
      FROM member_wishlists mw
      LEFT JOIN products p ON p.product_id = mw.product_id
      GROUP BY p.product_id, p.name, p.slug, p.featured_image_url
      ORDER BY saved_count DESC, last_saved_at DESC
      LIMIT 25
    `).all().catch(() => ({ results: [] })),
    db.prepare(`
      SELECT pir.product_interest_request_id, pir.product_id, pir.request_type, pir.user_id, pir.email, pir.notes, pir.status, pir.created_at,
             p.name AS product_name, p.slug AS product_slug, p.featured_image_url
      FROM product_interest_requests pir
      LEFT JOIN products p ON p.product_id = pir.product_id
      ORDER BY pir.created_at DESC, pir.product_interest_request_id DESC
      LIMIT 50
    `).all().catch(() => ({ results: [] })),
    db.prepare(`
      SELECT checkout_recovery_lead_id, browser_session_token, visitor_token, customer_email, customer_name, cart_count, cart_value_cents,
             currency, checkout_path, status, last_recovery_email_at, created_at
      FROM checkout_recovery_leads
      ORDER BY created_at DESC, checkout_recovery_lead_id DESC
      LIMIT 50
    `).all().catch(() => ({ results: [] })),
    db.prepare(`
      SELECT gift_card_id, code, currency, initial_amount_cents, remaining_amount_cents, issued_to_email, issued_to_name,
             note, status, expires_at, last_redeemed_at, created_at
      FROM gift_cards
      ORDER BY created_at DESC, gift_card_id DESC
      LIMIT 50
    `).all().catch(() => ({ results: [] })),
    db.prepare(`
      SELECT pr.product_review_id, pr.product_id, pr.order_id, pr.user_id, pr.reviewer_name, pr.reviewer_email, pr.rating,
             pr.review_text, pr.review_kind, pr.status, pr.is_featured, pr.admin_notes, pr.created_at,
             p.name AS product_name, p.slug AS product_slug
      FROM product_reviews pr
      LEFT JOIN products p ON p.product_id = pr.product_id
      ORDER BY pr.created_at DESC, pr.product_review_id DESC
      LIMIT 50
    `).all().catch(() => ({ results: [] }))
  ]);

  const abandonedCartStats = await (async () => {
    if (!(await tableExists(db, 'cart_activity'))) return { open_abandoned_carts: 0 };
    const row = await db.prepare(`
      SELECT COUNT(*) AS open_abandoned_carts
      FROM cart_activity
      WHERE event_type = 'cart_abandoned' AND created_at >= datetime('now', '-30 days')
    `).first().catch(() => null);
    return { open_abandoned_carts: Number(row?.open_abandoned_carts || 0) };
  })();

  return {
    summary: {
      wishlist_products_count: nr(wishlistRows).length,
      back_in_stock_open_count: nr(interestRows).filter((row) => String(row.request_type || '') === 'back_in_stock' && String(row.status || 'open') === 'open').length,
      checkout_recovery_open_count: nr(recoveryRows).filter((row) => String(row.status || 'open') === 'open').length,
      gift_card_active_count: nr(giftCards).filter((row) => String(row.status || 'active') === 'active' && Number(row.remaining_amount_cents || 0) > 0).length,
      pending_review_count: nr(reviewRows).filter((row) => String(row.status || '') === 'pending_review').length,
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
      issued_to_email: row.issued_to_email || '',
      issued_to_name: row.issued_to_name || '',
      note: row.note || '',
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
    }))
  };
}

async function queueRecoveryEmail(db, lead) {
  const email = safeEmail(lead.customer_email);
  if (!email) throw new Error('A recovery email address is required.');
  await queueNotification(db, {
    notification_kind: 'checkout_recovery',
    destination: email,
    payload: {
      email,
      customer_name: lead.customer_name || '',
      cart_count: lead.cart_count || 0,
      cart_value_cents: lead.cart_value_cents || 0,
      currency: lead.currency || 'CAD',
      checkout_url: lead.checkout_path || '/checkout/'
    }
  });
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

    if (action === 'set_interest_status') {
      const id = Number(body.product_interest_request_id || 0);
      const status = normalizeText(body.status).toLowerCase() || 'reviewed';
      if (!id) return json({ ok: false, error: 'product_interest_request_id is required.' }, 400);
      await db.prepare(`UPDATE product_interest_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE product_interest_request_id = ?`).bind(status, id).run();
      await auditAdminAction(env, request, adminUser, { action_type: 'interest_request_status_update', target_type: 'product_interest_request', target_id: id, details: { status } });
      return json({ ok: true, message: 'Interest request updated.' });
    }

    if (action === 'queue_recovery_email') {
      const leadId = Number(body.checkout_recovery_lead_id || 0);
      if (!leadId) return json({ ok: false, error: 'checkout_recovery_lead_id is required.' }, 400);
      const lead = await db.prepare(`SELECT * FROM checkout_recovery_leads WHERE checkout_recovery_lead_id = ? LIMIT 1`).bind(leadId).first();
      if (!lead) return json({ ok: false, error: 'Recovery lead not found.' }, 404);
      await queueRecoveryEmail(db, lead);
      await db.prepare(`UPDATE checkout_recovery_leads SET status = 'emailed', last_recovery_email_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE checkout_recovery_lead_id = ?`).bind(leadId).run();
      await auditAdminAction(env, request, adminUser, { action_type: 'checkout_recovery_email_queued', target_type: 'checkout_recovery_lead', target_id: leadId, details: { customer_email: lead.customer_email || '' } });
      return json({ ok: true, message: 'Recovery email queued.' });
    }

    if (action === 'issue_gift_card') {
      const amountCents = cents(body.amount_cents);
      const currency = normalizeText(body.currency || 'CAD').toUpperCase() || 'CAD';
      const issuedToEmail = safeEmail(body.issued_to_email);
      const issuedToName = normalizeText(body.issued_to_name);
      const expiresAt = normalizeText(body.expires_at);
      const note = normalizeText(body.note);
      const code = normalizeText(body.code).toUpperCase() || generateGiftCardCode();
      if (!issuedToEmail || amountCents <= 0) return json({ ok: false, error: 'issued_to_email and amount_cents are required.' }, 400);
      await db.prepare(`
        INSERT INTO gift_cards (code, currency, initial_amount_cents, remaining_amount_cents, issued_to_email, issued_to_name, note, status, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(code, currency, amountCents, amountCents, issuedToEmail, issuedToName || null, note || null, expiresAt || null).run();
      await queueNotification(db, {
        notification_kind: 'gift_card_issued',
        destination: issuedToEmail,
        payload: { code, currency, initial_amount_cents: amountCents, remaining_amount_cents: amountCents, expires_at: expiresAt || '', note }
      });
      await auditAdminAction(env, request, adminUser, { action_type: 'gift_card_issued', target_type: 'gift_card', target_key: code, details: { amount_cents: amountCents, issued_to_email: issuedToEmail } });
      return json({ ok: true, message: 'Gift card issued.', code });
    }

    if (action === 'set_review_status') {
      const reviewId = Number(body.product_review_id || 0);
      const status = normalizeText(body.status).toLowerCase() || 'approved';
      const isFeatured = Number(body.is_featured || 0) === 1 ? 1 : 0;
      const adminNotes = normalizeText(body.admin_notes);
      if (!reviewId) return json({ ok: false, error: 'product_review_id is required.' }, 400);
      await db.prepare(`UPDATE product_reviews SET status = ?, is_featured = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE product_review_id = ?`).bind(status, isFeatured, adminNotes || null, reviewId).run();
      await auditAdminAction(env, request, adminUser, { action_type: 'review_status_update', target_type: 'product_review', target_id: reviewId, details: { status, is_featured: isFeatured } });
      return json({ ok: true, message: 'Review updated.' });
    }

    if (action === 'queue_review_request') {
      const orderId = Number(body.order_id || 0);
      if (!orderId) return json({ ok: false, error: 'order_id is required.' }, 400);
      const order = await db.prepare(`SELECT order_id, order_number, customer_email FROM orders WHERE order_id = ? LIMIT 1`).bind(orderId).first();
      if (!order) return json({ ok: false, error: 'Order not found.' }, 404);
      const productNames = nr(await db.prepare(`SELECT product_name FROM order_items WHERE order_id = ? ORDER BY order_item_id ASC LIMIT 12`).bind(orderId).all()).map((row) => row.product_name || '').filter(Boolean);
      await queueNotification(db, {
        notification_kind: 'review_request',
        destination: safeEmail(order.customer_email),
        related_order_id: orderId,
        payload: { order_number: order.order_number || '', product_names: productNames }
      });
      await auditAdminAction(env, request, adminUser, { action_type: 'review_request_queued', target_type: 'order', target_id: orderId, target_key: order.order_number || String(orderId), details: { product_names: productNames } });
      return json({ ok: true, message: 'Review request email queued.' });
    }

    return json({ ok: false, error: 'Unsupported action.' }, 400);
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Customer engagement action failed.' }, 500);
  }
}
