// File: /functions/api/custom-request.js
// Brief description: Public custom request intake for engraving, personalized gifts, and workshop-made commissions.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function clean(value, limit = 1000) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > limit ? text.slice(0, limit).trim() : text;
}

function cleanEmail(value) {
  const text = clean(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : '';
}

function parseBudgetCents(value) {
  const number = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(number) && number > 0 ? Math.round(number * 100) : null;
}

async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_requests (
    custom_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    request_type TEXT NOT NULL,
    product_interest TEXT,
    deadline_date TEXT,
    budget_cents INTEGER,
    message TEXT NOT NULL,
    attachment_urls_json TEXT DEFAULT '[]',
    consent_to_contact INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new',
    admin_notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status, created_at)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_requests_email ON custom_requests(email, created_at)`).run().catch(() => null);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}

export async function onRequestPost(context) {
  const db = context.env.DB || context.env.DD_DB;
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  let body = {};
  try { body = await context.request.json(); } catch { body = {}; }

  const name = clean(body.name, 120);
  const email = cleanEmail(body.email);
  const phone = clean(body.phone, 60);
  const requestType = clean(body.request_type || body.type || 'custom_gift', 80).toLowerCase().replace(/[^a-z0-9_ -]/g, '').replace(/\s+/g, '_');
  const productInterest = clean(body.product_interest || body.product || '', 200);
  const deadlineDate = clean(body.deadline_date || '', 20);
  const message = clean(body.message || body.notes || '', 3000);
  const consentToContact = body.consent_to_contact === true || String(body.consent_to_contact || '').toLowerCase() === 'on' || String(body.consent_to_contact || '') === '1' ? 1 : 0;
  const attachmentUrls = Array.isArray(body.attachment_urls) ? body.attachment_urls.map((item) => clean(item, 500)).filter(Boolean).slice(0, 8) : [];

  if (!name) return json({ ok: false, error: 'Please add your name.' }, 400);
  if (!email) return json({ ok: false, error: 'Please add a valid email address.' }, 400);
  if (!message || message.length < 12) return json({ ok: false, error: 'Please add a few details about the custom request.' }, 400);
  if (!consentToContact) return json({ ok: false, error: 'Please confirm we may contact you about this request.' }, 400);

  await ensureSchema(db);
  const requestKey = `cr_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
  const insert = await db.prepare(`INSERT INTO custom_requests (
    request_key, name, email, phone, request_type, product_interest, deadline_date,
    budget_cents, message, attachment_urls_json, consent_to_contact, status, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    requestKey, name, email, phone || null, requestType || 'custom_gift', productInterest || null,
    deadlineDate || null, parseBudgetCents(body.budget), message, JSON.stringify(attachmentUrls), consentToContact
  ).run();

  return json({ ok: true, message: 'Custom request received. We will review it before replying.', request_key: requestKey, custom_request_id: Number(insert?.meta?.last_row_id || 0) || null });
}
