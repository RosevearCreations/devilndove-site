// File: /functions/api/admin/gift-card-actions.js
// Brief description: Admin gift-card activation, void, refund, and reissue actions with audit-friendly redemption notes.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status); }
function clean(value, limit = 200) { const text = normalizeText(value); return text.length > limit ? text.slice(0, limit).trim() : text; }
function cents(value) { const n = Number(value || 0); return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0; }
async function ensureTables(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS gift_cards (
    gift_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    currency TEXT NOT NULL DEFAULT 'CAD',
    initial_amount_cents INTEGER NOT NULL DEFAULT 0,
    remaining_amount_cents INTEGER NOT NULL DEFAULT 0,
    issued_to_email TEXT,
    issued_to_name TEXT,
    recipient_email TEXT,
    recipient_name TEXT,
    purchaser_email TEXT,
    purchaser_name TEXT,
    note TEXT,
    recipient_note TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    expires_at TEXT,
    last_redeemed_at TEXT,
    order_id INTEGER,
    purchase_source TEXT,
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
  await db.prepare(`CREATE TABLE IF NOT EXISTS gift_card_admin_events (
    gift_card_admin_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    gift_card_id INTEGER,
    source_gift_card_id INTEGER,
    action_key TEXT NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    created_by_user_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
}
function generateGiftCardCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let body = '';
  for (let i = 0; i < 12; i += 1) body += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `DND-${body.slice(0,4)}-${body.slice(4,8)}-${body.slice(8,12)}`;
}
async function recordEvent(db, adminUser, row, action, amount, note, sourceId = null) {
  await db.prepare(`INSERT INTO gift_card_admin_events (gift_card_id, source_gift_card_id, action_key, amount_cents, note, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
    .bind(Number(row?.gift_card_id || 0) || null, sourceId, action, amount || 0, note || null, Number(adminUser?.user_id || 0) || null).run().catch(() => null);
}

async function queueGiftCardEmail(db, card, action, adminUser, note = '') {
  await db.prepare(`CREATE TABLE IF NOT EXISTS notification_outbox (
    notification_outbox_id INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_kind TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'email',
    destination TEXT,
    payload_json TEXT,
    metadata_json TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
  const destination = clean(card?.recipient_email || card?.issued_to_email || card?.purchaser_email || '', 254);
  if (!destination) return { queued: false, reason: 'No recipient email on gift-card record.' };
  const payload = {
    subject: action === 'reissue' ? 'Your Devil n Dove gift card has been reissued' : 'Your Devil n Dove gift card is active',
    gift_card_id: Number(card?.gift_card_id || 0),
    code: card?.code || '',
    currency: card?.currency || 'CAD',
    remaining_amount_cents: Number(card?.remaining_amount_cents || 0),
    note: note || 'Review before sending from the notification outbox.'
  };
  const result = await db.prepare(`INSERT INTO notification_outbox (notification_kind, channel, destination, payload_json, metadata_json, status, next_attempt_at, created_at, updated_at) VALUES ('gift_card_delivery', 'email', ?, ?, ?, 'queued', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(destination, JSON.stringify(payload), JSON.stringify({ source: 'gift_card_actions', action, queued_by_user_id: adminUser?.user_id || null })).run();
  return { queued: true, notification_outbox_id: Number(result?.meta?.last_row_id || 0), destination };
}

async function loadCard(db, id) {
  return db.prepare(`SELECT * FROM gift_cards WHERE gift_card_id=? LIMIT 1`).bind(id).first();
}
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureTables(db);
  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const action = clean(body.action, 40).toLowerCase();
  const id = Number(body.gift_card_id || 0);
  if (!id) return json({ ok: false, error: 'gift_card_id is required.' }, 400);
  const card = await loadCard(db, id);
  if (!card) return json({ ok: false, error: 'Gift card was not found.' }, 404);
  const note = clean(body.note || '', 800);
  let message = 'Gift card updated.';
  if (action === 'activate_paid') {
    const order = card.order_id ? await db.prepare(`SELECT order_id, payment_status, order_status FROM orders WHERE order_id=? LIMIT 1`).bind(Number(card.order_id)).first().catch(() => null) : null;
    const paid = ['paid','complete','completed','fulfilled'].includes(String(order?.payment_status || '').toLowerCase()) || ['paid','fulfilled'].includes(String(order?.order_status || '').toLowerCase());
    if (!paid) return json({ ok: false, error: 'The connected order is not marked paid yet.' }, 409);
    await db.prepare(`UPDATE gift_cards SET status='active', updated_at=CURRENT_TIMESTAMP WHERE gift_card_id=?`).bind(id).run();
    await recordEvent(db, adminUser, card, action, 0, note || 'Activated after confirmed paid order.');
    message = 'Gift card activated after paid-order confirmation.';
  } else if (action === 'void') {
    await db.prepare(`UPDATE gift_cards SET status='void', remaining_amount_cents=0, updated_at=CURRENT_TIMESTAMP WHERE gift_card_id=?`).bind(id).run();
    await recordEvent(db, adminUser, card, action, Number(card.remaining_amount_cents || 0), note || 'Voided by admin.');
    message = 'Gift card voided.';
  } else if (action === 'refund') {
    const amount = Math.min(cents(body.amount_cents || card.remaining_amount_cents), Number(card.remaining_amount_cents || 0));
    await db.prepare(`UPDATE gift_cards SET remaining_amount_cents=MAX(0, remaining_amount_cents - ?), status=CASE WHEN MAX(0, remaining_amount_cents - ?) <= 0 THEN 'refunded' ELSE status END, updated_at=CURRENT_TIMESTAMP WHERE gift_card_id=?`).bind(amount, amount, id).run();
    await recordEvent(db, adminUser, card, action, amount, note || 'Refund/reduction recorded by admin.');
    message = 'Gift card refund/reduction recorded.';
  } else if (action === 'reissue') {
    const newCode = generateGiftCardCode();
    const amount = Math.max(0, Number(card.remaining_amount_cents || 0));
    const insert = await db.prepare(`INSERT INTO gift_cards (code, currency, initial_amount_cents, remaining_amount_cents, issued_to_email, issued_to_name, recipient_email, recipient_name, purchaser_email, purchaser_name, note, recipient_note, status, expires_at, order_id, purchase_source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, 'admin_reissue', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
      newCode, card.currency || 'CAD', amount, amount, card.issued_to_email || card.recipient_email || null, card.issued_to_name || card.recipient_name || null, card.recipient_email || card.issued_to_email || null, card.recipient_name || card.issued_to_name || null, card.purchaser_email || null, card.purchaser_name || null, note || `Reissued from ${card.code}`, card.recipient_note || null, card.expires_at || null, card.order_id || null
    ).run();
    const newId = Number(insert?.meta?.last_row_id || 0);
    await db.prepare(`UPDATE gift_cards SET status='reissued', remaining_amount_cents=0, updated_at=CURRENT_TIMESTAMP WHERE gift_card_id=?`).bind(id).run();
    await recordEvent(db, adminUser, { gift_card_id: newId }, action, amount, note || `Reissued from card #${id}.`, id);
    message = `Gift card reissued as ${newCode}.`;
  } else {
    return json({ ok: false, error: 'Supported actions: activate_paid, void, refund, reissue.' }, 400);
  }
  await auditAdminAction(env, request, adminUser, { action_type: `gift_card_${action}`, target_type: 'gift_card', target_id: id, target_key: card.code || String(id), details: { note } }).catch(() => null);
  const updated = await loadCard(db, action === 'reissue' ? Number((await db.prepare(`SELECT gift_card_id FROM gift_cards ORDER BY gift_card_id DESC LIMIT 1`).first())?.gift_card_id || id) : id).catch(() => null);
  let delivery = { queued: false, reason: 'No delivery needed for this action.' };
  if (['activate_paid', 'reissue'].includes(action)) delivery = await queueGiftCardEmail(db, updated, action === 'reissue' ? 'reissue' : 'activation', adminUser, note).catch((error) => ({ queued: false, reason: error?.message || 'Gift-card email queue failed.' }));
  return json({ ok: true, message, card: updated, delivery });
}
