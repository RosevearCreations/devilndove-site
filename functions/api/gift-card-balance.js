// Devil n Dove Build 413 — public gift-card balance lookup.
// Gift Card schema is migration-owned; public GET never creates/alters tables.

import { requireGiftCardSchema } from './_lib/giftCardSchemaReadiness.js';

const BUILD = 413;
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
  if (!db) return json({ ok: false, build: BUILD, error: 'Gift-card lookup is unavailable right now.' }, 503);

  const schema = await requireGiftCardSchema(db, {
    requiredTables: ['gift_cards','gift_card_lookup_attempts','gift_card_lookup_lockouts','gift_card_redemptions']
  });
  if (!schema.ok) {
    return json({
      ok: false,
      build: BUILD,
      error: 'Gift-card lookup is temporarily unavailable while the service is being prepared.',
      error_code: 'gift_card_schema_not_ready',
      request_time_schema_mutation: false,
      migration_authority: 'database_gift_card_runtime_parity.sql'
    }, 503);
  }

  const url = new URL(context.request.url);
  const code = clean(url.searchParams.get('code')).toUpperCase();
  const email = clean(url.searchParams.get('email')).toLowerCase();
  if (!code || !email || !email.includes('@')) return json({ ok: false, build: BUILD, error: 'Enter the gift-card code and recipient or purchaser email.' }, 400);

  const ip = context.request.headers.get('cf-connecting-ip') || context.request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = context.request.headers.get('user-agent') || '';
  const ipHash = String(ip || 'unknown').slice(0, 120);
  const codeSuffix = code.slice(-4);
  const clientKey = `${ip}:${email.slice(0, 80)}`;

  const lockout = await db.prepare(`SELECT * FROM gift_card_lookup_lockouts WHERE lockout_status='active' AND (LOWER(COALESCE(lookup_email,''))=LOWER(?) OR code_suffix=? OR ip_hash=?) AND (expires_at IS NULL OR datetime(expires_at) > datetime('now')) LIMIT 1`).bind(email, codeSuffix, ipHash).first().catch(() => null);
  if (lockout) return json({ ok: false, build: BUILD, error: 'Gift-card lookup is temporarily locked for safety. Please contact Devil n Dove if this is your card.' }, 423);

  const recentAttempts = await db.prepare(`SELECT COUNT(*) AS total FROM gift_card_lookup_attempts WHERE client_key=? AND datetime(created_at) >= datetime('now','-15 minutes')`).bind(clientKey).first().catch(() => ({ total: 0 }));
  if (Number(recentAttempts?.total || 0) >= 12) return json({ ok: false, build: BUILD, error: 'Too many balance lookup attempts. Please wait a little while and try again.' }, 429);

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

  if (!row) {
    await db.prepare(`INSERT INTO gift_card_lookup_attempts (code_hint, email_hash, client_key, lookup_email, code_suffix, ip_hash, user_agent, result_status, was_success, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'failed', 0, CURRENT_TIMESTAMP)`).bind(code.slice(0,8), email.slice(0,3), clientKey, email, codeSuffix, ipHash, userAgent.slice(0,240)).run().catch(() => null);
    return json({ ok: false, build: BUILD, error: 'No gift card matched that code and email.', request_time_schema_mutation: false }, 404);
  }

  await db.prepare(`INSERT INTO gift_card_lookup_attempts (code_hint, email_hash, client_key, lookup_email, code_suffix, ip_hash, user_agent, result_status, was_success, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'ok', 1, CURRENT_TIMESTAMP)`).bind(code.slice(0,8), email.slice(0,3), clientKey, email, codeSuffix, ipHash, userAgent.slice(0,240)).run().catch(() => null);
  const redemptions = rows(await db.prepare(`SELECT redeemed_amount_cents, redeemed_by_email, created_at FROM gift_card_redemptions WHERE gift_card_id=? ORDER BY datetime(created_at) DESC LIMIT 20`).bind(Number(row.gift_card_id || 0)).all().catch(() => ({ results: [] })));
  return json({ ok: true, build: BUILD, card: safeCard(row), redemptions, request_time_schema_mutation: false, migration_authority: 'database_gift_card_runtime_parity.sql' });
}
