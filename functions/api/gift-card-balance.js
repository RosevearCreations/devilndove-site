// File: /functions/api/gift-card-balance.js
// Brief description: Public gift-card balance lookup with code and email verification.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
function clean(value, limit = 180) {
  const text = String(value || '').trim();
  return text.length > limit ? text.slice(0, limit).trim() : text;
}
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
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
}
function safeCard(row) {
  return {
    code: String(row.code || '').replace(/^(.{4}).+(.{4})$/, '$1••••$2'),
    currency: row.currency || 'CAD',
    initial_amount_cents: Number(row.initial_amount_cents || 0),
    remaining_amount_cents: Number(row.remaining_amount_cents || 0),
    status: row.status || 'active',
    expires_at: row.expires_at || '',
    last_redeemed_at: row.last_redeemed_at || '',
    issued_to_name: row.issued_to_name || row.recipient_name || '',
    purchase_source: row.purchase_source || ''
  };
}
export async function onRequestGet(context) {
  const db = context.env.DB || context.env.DD_DB;
  if (!db) return json({ ok: false, error: 'Gift-card lookup is unavailable right now.' }, 503);
  await ensureTables(db);
  const url = new URL(context.request.url);
  const code = clean(url.searchParams.get('code')).toUpperCase();
  const email = clean(url.searchParams.get('email')).toLowerCase();
  if (!code || !email || !email.includes('@')) return json({ ok: false, error: 'Enter the gift-card code and recipient or purchaser email.' }, 400);
  const row = await db.prepare(`
    SELECT * FROM gift_cards
    WHERE UPPER(code)=?
      AND (
        LOWER(COALESCE(recipient_email, issued_to_email, ''))=?
        OR LOWER(COALESCE(purchaser_email, ''))=?
        OR LOWER(COALESCE(issued_to_email, ''))=?
      )
    LIMIT 1
  `).bind(code, email, email, email).first().catch(() => null);
  if (!row) return json({ ok: false, error: 'No gift card matched that code and email.' }, 404);
  const redemptions = rows(await db.prepare(`SELECT redeemed_amount_cents, redeemed_by_email, created_at FROM gift_card_redemptions WHERE gift_card_id=? ORDER BY datetime(created_at) DESC LIMIT 20`).bind(Number(row.gift_card_id || 0)).all().catch(() => ({ results: [] })));
  return json({ ok: true, card: safeCard(row), redemptions });
}
