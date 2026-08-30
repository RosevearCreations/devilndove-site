// File: /functions/api/custom-request.js
// Brief description: Public custom request intake for engraving, personalized gifts, and workshop-made commissions.

import { hasCustomRequestIntakeSchema } from "./_lib/publicRuntimeSchemaReadiness.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
function clean(value, limit = 1000) { const text = String(value ?? '').replace(/\s+/g, ' ').trim(); return text.length > limit ? text.slice(0, limit).trim() : text; }
function cleanEmail(value) { const text = clean(value, 254).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : ''; }
function parseBudgetCents(value) { const number = Number(String(value ?? '').replace(/[^0-9.]/g, '')); return Number.isFinite(number) && number > 0 ? Math.round(number * 100) : null; }

function parseUtm(body, request) {
  const out = { utm_source: clean(body.utm_source, 180), utm_medium: clean(body.utm_medium, 180), utm_campaign: clean(body.utm_campaign, 180), utm_content: clean(body.utm_content, 180), utm_term: clean(body.utm_term, 180), visitor_token: clean(body.visitor_token, 120), browser_session_token: clean(body.browser_session_token, 120) };
  if (!out.utm_source) {
    try {
      const params = new URL(request.headers.get('Referer') || '').searchParams;
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) out[key] = clean(params.get(key), 180) || out[key];
    } catch {}
  }
  return out;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}

export async function onRequestPost(context) {
  const db = context.env.DB || context.env.DD_DB;
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  let body = {}; try { body = await context.request.json(); } catch { body = {}; }

  const name = clean(body.name, 120);
  const email = cleanEmail(body.email);
  const phone = clean(body.phone, 60);
  const requestType = clean(body.request_type || body.type || 'custom_gift', 80).toLowerCase().replace(/[^a-z0-9_ -]/g, '').replace(/\s+/g, '_');
  const productInterest = clean(body.product_interest || body.product || '', 200);
  const scentProfile = clean(body.scent_profile || '', 240);
  const waxOrBase = clean(body.wax_or_base || '', 240);
  const colourNotes = clean(body.colour_notes || '', 240);
  const batchNumber = clean(body.batch_number || '', 120);
  const ingredientNotes = clean(body.ingredient_notes || '', 600);
  const allergenSafetyNotes = clean(body.allergen_safety_notes || '', 600);
  const deadlineDate = clean(body.deadline_date || '', 20);
  const message = clean(body.message || body.notes || '', 3000);
  const consentToContact = body.consent_to_contact === true || String(body.consent_to_contact || '').toLowerCase() === 'on' || String(body.consent_to_contact || '') === '1' ? 1 : 0;
  const attachmentUrls = Array.isArray(body.attachment_urls) ? body.attachment_urls.map((item) => clean(item, 500)).filter(Boolean).slice(0, 8) : [];
  const utm = parseUtm(body, context.request);

  if (!name) return json({ ok: false, error: 'Please add your name.' }, 400);
  if (!email) return json({ ok: false, error: 'Please add a valid email address.' }, 400);
  if (!message || message.length < 12) return json({ ok: false, error: 'Please add a few details about the custom request.' }, 400);
  if (!consentToContact) return json({ ok: false, error: 'Please confirm we may contact you about this request.' }, 400);

  if (!(await hasCustomRequestIntakeSchema(db))) {
    return json({ ok: false, error: 'custom_request_schema_unavailable', message: 'Custom requests are temporarily unavailable.' }, 503);
  }

  const requestKey = `cr_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
  const uploadToken = `upload_${crypto.randomUUID().replace(/-/g, '')}`;
  const insert = await db.prepare(`INSERT INTO custom_requests (
    request_key, name, email, phone, request_type, product_interest, deadline_date,
    budget_cents, message, attachment_urls_json, consent_to_contact, utm_source, utm_medium, utm_campaign, utm_content, utm_term, visitor_token, browser_session_token,
    scent_profile, wax_or_base, colour_notes, batch_number, ingredient_notes, allergen_safety_notes,
    upload_token, reference_upload_count, status, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    requestKey, name, email, phone || null, requestType || 'custom_gift', productInterest || null, deadlineDate || null,
    parseBudgetCents(body.budget), message, JSON.stringify(attachmentUrls), consentToContact,
    utm.utm_source || null, utm.utm_medium || null, utm.utm_campaign || null, utm.utm_content || null, utm.utm_term || null,
    utm.visitor_token || null, utm.browser_session_token || null, scentProfile || null, waxOrBase || null, colourNotes || null,
    batchNumber || null, ingredientNotes || null, allergenSafetyNotes || null, uploadToken
  ).run();

  const customRequestId = Number(insert?.meta?.last_row_id || 0) || null;
  if (customRequestId && (requestType.includes('candle') || requestType.includes('soap') || scentProfile || waxOrBase || ingredientNotes)) {
    await db.prepare(`INSERT INTO custom_candle_soap_product_specs (custom_request_id, product_family, scent_profile, wax_or_base, colour_notes, batch_number, ingredient_notes, allergen_safety_notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
      customRequestId, requestType.includes('soap') ? 'soap' : 'candle', scentProfile || null, waxOrBase || null, colourNotes || null,
      batchNumber || null, ingredientNotes || null, allergenSafetyNotes || null
    ).run().catch(() => null);
  }

  return json({ ok: true, message: 'Custom request received. We will review it before replying.', request_key: requestKey, upload_token: uploadToken, reference_upload_limit: 5, custom_request_id: customRequestId });
}
