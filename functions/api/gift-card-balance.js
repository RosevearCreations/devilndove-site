// File: /functions/api/admin/gift-card-balance.js
// Brief description: Admin-only gift-card balance lookup for support and redemption checks.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status); }
function clean(value) { return normalizeText(value).trim(); }
async function ensureTables(db) {
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
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureTables(db);
  const url = new URL(request.url);
  const code = clean(url.searchParams.get('code')).toUpperCase();
  const email = clean(url.searchParams.get('email')).toLowerCase();
  if (!code && !email) return json({ ok: false, error: 'Enter a gift-card code or recipient/purchaser email.' }, 400);
  const cards = await db.prepare(`
    SELECT * FROM gift_cards
    WHERE (? = '' OR UPPER(code) = ?)
       OR (? = '' OR LOWER(COALESCE(recipient_email, issued_to_email, '')) = ? OR LOWER(COALESCE(purchaser_email, '')) = ?)
    ORDER BY datetime(created_at) DESC, gift_card_id DESC
    LIMIT 20
  `).bind(code, code, email, email, email).all().catch(() => ({ results: [] }));
  const rows = Array.isArray(cards?.results) ? cards.results : [];
  const ids = rows.map((row) => Number(row.gift_card_id || 0)).filter(Boolean);
  let redemptions = [];
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(',');
    redemptions = (await db.prepare(`SELECT * FROM gift_card_redemptions WHERE gift_card_id IN (${placeholders}) ORDER BY datetime(created_at) DESC LIMIT 60`).bind(...ids).all().catch(() => ({ results: [] }))).results || [];
  }
  return json({ ok: true, cards: rows, redemptions, count: rows.length });
}
