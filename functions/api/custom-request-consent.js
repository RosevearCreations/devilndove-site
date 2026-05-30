// File: /functions/api/custom-request-consent.js
// Brief description: Public noindex token endpoint for custom request review/photo/consent responses.

function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, limit = 1200) { const text = String(value || '').trim(); return text.length > limit ? text.slice(0, limit).trim() : text; }
async function ensureColumn(db, tableName, columnName, definition) {
  const info = await db.prepare(`PRAGMA table_info(${tableName})`).all().catch(() => ({ results: [] }));
  if (!rows(info).some((row) => String(row.name || '').toLowerCase() === columnName.toLowerCase())) await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`).run().catch(() => null);
}
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_fulfillment_prompts (
    custom_request_fulfillment_prompt_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    order_id INTEGER,
    prompt_key TEXT NOT NULL UNIQUE,
    prompt_status TEXT NOT NULL DEFAULT 'draft',
    prompt_type TEXT NOT NULL DEFAULT 'review_photo_consent',
    customer_name TEXT,
    customer_email TEXT,
    subject TEXT,
    body_text TEXT,
    consent_question_text TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'prompt_token', 'prompt_token TEXT');
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'public_response_status', "public_response_status TEXT NOT NULL DEFAULT 'not_sent'");
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'public_use_scope', 'public_use_scope TEXT');
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'review_text', 'review_text TEXT');
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'customer_response_note', 'customer_response_note TEXT');
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'responded_at', 'responded_at TEXT');
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_fulfillment_prompts_token ON custom_request_fulfillment_prompts(prompt_token)`).run().catch(() => null);
}
function publicPrompt(row) {
  return {
    prompt_key: row.prompt_key || '',
    prompt_status: row.prompt_status || 'draft',
    public_response_status: row.public_response_status || 'not_sent',
    public_use_scope: row.public_use_scope || '',
    customer_name: row.customer_name || '',
    customer_email: row.customer_email || '',
    subject: row.subject || 'Thank you for your Devil n Dove custom piece',
    body_text: row.body_text || '',
    consent_question_text: row.consent_question_text || '',
    review_text: row.review_text || '',
    customer_response_note: row.customer_response_note || '',
    responded_at: row.responded_at || ''
  };
}
export async function onRequestGet(context) {
  const db = context.env.DB || context.env.DD_DB;
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const token = clean(new URL(context.request.url).searchParams.get('token'), 180);
  if (!token || !token.startsWith('consent_')) return json({ ok: false, error: 'A valid consent token is required.' }, 400);
  await ensureSchema(db);
  const row = await db.prepare(`SELECT * FROM custom_request_fulfillment_prompts WHERE prompt_token=? LIMIT 1`).bind(token).first().catch(() => null);
  if (!row) return json({ ok: false, error: 'Consent prompt was not found.' }, 404);
  return json({ ok: true, prompt: publicPrompt(row) });
}
export async function onRequestPost(context) {
  const db = context.env.DB || context.env.DD_DB;
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  let body = {}; try { body = await context.request.json(); } catch { body = {}; }
  const token = clean(body.token, 180);
  if (!token || !token.startsWith('consent_')) return json({ ok: false, error: 'A valid consent token is required.' }, 400);
  await ensureSchema(db);
  const row = await db.prepare(`SELECT * FROM custom_request_fulfillment_prompts WHERE prompt_token=? LIMIT 1`).bind(token).first().catch(() => null);
  if (!row) return json({ ok: false, error: 'Consent prompt was not found.' }, 404);
  const scope = ['private_only','website_gallery','social_only','all_public_ok'].includes(clean(body.public_use_scope, 40)) ? clean(body.public_use_scope, 40) : 'private_only';
  await db.prepare(`UPDATE custom_request_fulfillment_prompts SET public_response_status='responded', prompt_status='responded', public_use_scope=?, review_text=?, customer_response_note=?, responded_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE custom_request_fulfillment_prompt_id=?`).bind(scope, clean(body.review_text, 1600) || null, clean(body.customer_response_note, 1200) || null, Number(row.custom_request_fulfillment_prompt_id || 0)).run();
  return json({ ok: true, message: 'Thank you. Your review/photo consent response was saved.' });
}
