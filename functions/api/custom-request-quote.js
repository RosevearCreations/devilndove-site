// File: /functions/api/custom-request-quote.js
// Brief description: Token-protected public preview for custom request quote drafts, including accept/decline response tracking.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
function clean(value, limit = 1200) { const text = String(value ?? '').replace(/\s+/g, ' ').trim(); return text.length > limit ? text.slice(0, limit).trim() : text; }
function money(cents) { return (Number(cents || 0) / 100).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' }); }
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_quote_share_links (
    custom_request_quote_share_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    quote_draft_id INTEGER,
    share_token TEXT NOT NULL UNIQUE,
    share_status TEXT NOT NULL DEFAULT 'active',
    customer_name TEXT,
    customer_email TEXT,
    title TEXT,
    quote_total_cents INTEGER NOT NULL DEFAULT 0,
    scope_summary TEXT,
    payment_summary_json TEXT DEFAULT '{}',
    expires_at TEXT,
    accepted_at TEXT,
    declined_at TEXT,
    customer_response_note TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_quote_share_links_token ON custom_request_quote_share_links(share_token, share_status)`).run().catch(() => null);
}
async function event(db, requestId, type, note) {
  await db.prepare(`INSERT INTO custom_request_conversion_events (custom_request_id, conversion_type, target_table, event_notes, created_at) VALUES (?, ?, 'custom_request_quote_share_links', ?, CURRENT_TIMESTAMP)`).bind(Number(requestId || 0), type, note || null).run().catch(() => null);
}
async function loadQuote(db, token) {
  await ensureSchema(db);
  const link = await db.prepare(`SELECT * FROM custom_request_quote_share_links WHERE share_token=? LIMIT 1`).bind(token).first().catch(() => null);
  if (!link) return null;
  const request = await db.prepare(`SELECT request_key, request_type, product_interest, deadline_date, status FROM custom_requests WHERE custom_request_id=? LIMIT 1`).bind(Number(link.custom_request_id || 0)).first().catch(() => null);
  const candidates = await db.prepare(`SELECT candidate_type, amount_cents, currency, due_date, description, candidate_status FROM custom_request_payment_candidates WHERE custom_request_id=? ORDER BY CASE candidate_type WHEN 'deposit' THEN 1 ELSE 2 END, custom_request_payment_candidate_id`).bind(Number(link.custom_request_id || 0)).all().catch(() => ({ results: [] }));
  return { link, request, payment_candidates: Array.isArray(candidates?.results) ? candidates.results : [] };
}
function publicPayload(loaded) {
  const { link, request, payment_candidates } = loaded;
  const expired = link.expires_at && new Date(link.expires_at).getTime() < Date.now();
  const status = expired && link.share_status === 'active' ? 'expired' : link.share_status;
  return {
    ok: true,
    quote: {
      share_status: status,
      title: link.title || request?.product_interest || 'Custom Devil n Dove request',
      customer_name: link.customer_name || '',
      customer_email: link.customer_email || '',
      request_type: request?.request_type || '',
      requested_deadline: request?.deadline_date || '',
      quote_total_cents: Number(link.quote_total_cents || 0),
      quote_total_label: money(link.quote_total_cents || 0),
      scope_summary: link.scope_summary || '',
      payment_summary: (() => { try { return JSON.parse(link.payment_summary_json || '{}'); } catch { return {}; } })(),
      payment_candidates: payment_candidates.map((row) => ({ candidate_type: row.candidate_type, amount_cents: Number(row.amount_cents || 0), amount_label: money(row.amount_cents || 0), due_date: row.due_date || '', description: row.description || '', candidate_status: row.candidate_status || 'draft' })),
      expires_at: link.expires_at || '',
      accepted_at: link.accepted_at || '',
      declined_at: link.declined_at || '',
      customer_response_note: link.customer_response_note || ''
    }
  };
}
export async function onRequestGet(context) {
  const db = context.env.DB || context.env.DD_DB;
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const token = clean(new URL(context.request.url).searchParams.get('token'), 160);
  if (!token) return json({ ok: false, error: 'Missing quote token.' }, 400);
  const loaded = await loadQuote(db, token);
  if (!loaded) return json({ ok: false, error: 'Quote preview was not found.' }, 404);
  return json(publicPayload(loaded));
}
export async function onRequestPost(context) {
  const db = context.env.DB || context.env.DD_DB;
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  let body = {};
  try { body = await context.request.json(); } catch { body = {}; }
  const token = clean(body.token, 160);
  const action = clean(body.action, 40).toLowerCase();
  const note = clean(body.customer_response_note || body.note || '', 1200);
  if (!token || !['accept', 'decline'].includes(action)) return json({ ok: false, error: 'Choose accept or decline for this quote.' }, 400);
  const loaded = await loadQuote(db, token);
  if (!loaded) return json({ ok: false, error: 'Quote preview was not found.' }, 404);
  const { link } = loaded;
  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) return json({ ok: false, error: 'This quote preview link has expired.' }, 400);
  if (!['active', 'viewed'].includes(String(link.share_status || ''))) return json({ ok: false, error: 'This quote has already been responded to or closed.' }, 400);
  const accepted = action === 'accept';
  await db.prepare(`UPDATE custom_request_quote_share_links SET share_status=?, accepted_at=CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE accepted_at END, declined_at=CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE declined_at END, customer_response_note=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_quote_share_link_id=?`).bind(
    accepted ? 'accepted' : 'declined', accepted ? 1 : 0, accepted ? 0 : 1, note || null, Number(link.custom_request_quote_share_link_id || 0)
  ).run();
  await db.prepare(`UPDATE custom_requests SET status=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(accepted ? 'accepted' : 'declined', Number(link.custom_request_id || 0)).run().catch(() => null);
  await db.prepare(`UPDATE custom_request_quote_drafts SET quote_status=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_quote_draft_id=?`).bind(accepted ? 'accepted' : 'declined', Number(link.quote_draft_id || 0)).run().catch(() => null);
  await event(db, link.custom_request_id, accepted ? 'quote_preview_accepted' : 'quote_preview_declined', note || null);
  const reloaded = await loadQuote(db, token);
  return json({ message: accepted ? 'Quote accepted. We will review the next step before requesting payment.' : 'Quote declined. Thank you for letting us know.', ...publicPayload(reloaded) });
}
