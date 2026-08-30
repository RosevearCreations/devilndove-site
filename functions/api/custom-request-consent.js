// File: /functions/api/custom-request-consent.js
// Brief description: Public noindex token endpoint for custom request review/photo/consent responses.

import { hasCustomRequestConsentSchema } from "./_lib/publicRuntimeSchemaReadiness.js";

function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
function clean(value, limit = 1200) { const text = String(value || '').trim(); return text.length > limit ? text.slice(0, limit).trim() : text; }

async function requireConsentSchema(db) {
  const ready = await hasCustomRequestConsentSchema(db);
  if (ready) return null;
  return json(
    {
      ok: false,
      error: 'custom_request_consent_schema_unavailable',
      message: 'Custom request consent is temporarily unavailable.'
    },
    503
  );
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

  const schemaError = await requireConsentSchema(db);
  if (schemaError) return schemaError;

  const row = await db.prepare(`SELECT * FROM custom_request_fulfillment_prompts WHERE prompt_token=? LIMIT 1`).bind(token).first().catch(() => null);
  if (!row || ['void','expired'].includes(String(row.prompt_status || '').toLowerCase()) || row.expired_at || row.voided_at) return json({ ok: false, error: 'Consent prompt was not found or is no longer active.' }, 404);
  return json({ ok: true, prompt: publicPrompt(row) });
}

export async function onRequestPost(context) {
  const db = context.env.DB || context.env.DD_DB;
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  let body = {}; try { body = await context.request.json(); } catch { body = {}; }
  const token = clean(body.token, 180);
  if (!token || !token.startsWith('consent_')) return json({ ok: false, error: 'A valid consent token is required.' }, 400);

  const schemaError = await requireConsentSchema(db);
  if (schemaError) return schemaError;

  const row = await db.prepare(`SELECT * FROM custom_request_fulfillment_prompts WHERE prompt_token=? LIMIT 1`).bind(token).first().catch(() => null);
  if (!row || ['void','expired'].includes(String(row.prompt_status || '').toLowerCase()) || row.expired_at || row.voided_at) return json({ ok: false, error: 'Consent prompt was not found or is no longer active.' }, 404);
  const scope = ['private_only','website_gallery','social_only','all_public_ok'].includes(clean(body.public_use_scope, 40)) ? clean(body.public_use_scope, 40) : 'private_only';
  await db.prepare(`UPDATE custom_request_fulfillment_prompts SET public_response_status='responded', prompt_status='responded', public_use_scope=?, review_text=?, customer_response_note=?, responded_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE custom_request_fulfillment_prompt_id=?`).bind(scope, clean(body.review_text, 1600) || null, clean(body.customer_response_note, 1200) || null, Number(row.custom_request_fulfillment_prompt_id || 0)).run();
  return json({ ok: true, message: 'Thank you. Your review/photo consent response was saved.' });
}
