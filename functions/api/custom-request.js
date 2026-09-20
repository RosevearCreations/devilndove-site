// File: /functions/api/custom-request.js
// Release 467 Build 210: structured Custom Work Intake 2.0 over the existing custom_requests authority.

import { hasCustomRequestIntakeSchema } from "./_lib/publicRuntimeSchemaReadiness.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
function clean(value, limit = 1000) { const text = String(value ?? '').replace(/\s+/g, ' ').trim(); return text.length > limit ? text.slice(0, limit).trim() : text; }
function cleanEmail(value) { const text = clean(value, 254).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : ''; }
function parseBudgetCents(value) { const number = Number(String(value ?? '').replace(/[^0-9.]/g, '')); return Number.isFinite(number) && number > 0 ? Math.round(number * 100) : null; }
function parseQuantity(value) { const n = Number.parseInt(String(value ?? '').trim(), 10); return Number.isInteger(n) && n >= 1 ? n : null; }
function flag(value) { return value === true || String(value || '').toLowerCase() === 'on' || String(value || '') === '1' ? 1 : 0; }
const PROJECT_INTENTS = new Set(['one_off','prototype','repeat','batch','corporate_event','repair_remake','unknown']);

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

function build151Context(body) {
  const giftIntent = clean(body.gift_intent, 80);
  const recipient = clean(body.recipient_name, 160);
  const occasion = clean(body.occasion, 160);
  const wrap = clean(body.wrap_preference, 80);
  const fulfillment = clean(body.fulfillment_preference, 80);
  const eventContext = clean(body.event_context, 220);
  const giftMessage = clean(body.gift_message, 600);
  const parts = [];
  if (giftIntent) parts.push(`Gift intent=${giftIntent}`);
  if (recipient) parts.push(`Recipient=${recipient}`);
  if (occasion) parts.push(`Occasion=${occasion}`);
  if (wrap) parts.push(`Wrap=${wrap}`);
  if (fulfillment) parts.push(`Fulfillment=${fulfillment}`);
  if (eventContext) parts.push(`Event/context=${eventContext}`);
  if (giftMessage) parts.push(`Gift message=${giftMessage}`);
  return parts.length ? `[Build 151 gift/pickup/event context] ${parts.join('; ')}` : '';
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
  const quantity = parseQuantity(body.quantity);
  const projectIntentRaw = clean(body.project_intent || 'unknown', 40).toLowerCase().replace(/[^a-z0-9_]/g, '');
  const projectIntent = PROJECT_INTENTS.has(projectIntentRaw) ? projectIntentRaw : 'unknown';
  const intendedUse = clean(body.intended_use || '', 600);
  const organizationName = clean(body.organization_name || '', 240);
  const eventContextStructured = clean(body.event_context_structured || '', 500);
  const suppliedItem = flag(body.supplied_item);
  const desiredMaterial = clean(body.desired_material || '', 500);
  const desiredFinish = clean(body.desired_finish || '', 500);
  const personalizationText = clean(body.personalization_text || '', 1000);
  const requestedCapabilityKey = clean(body.requested_capability_key || '', 120).toLowerCase().replace(/[^a-z0-9-]/g, '');
  const toleranceSizeNotes = clean(body.tolerance_size_notes || '', 800);
  const helpChooseMethod = flag(body.help_choose_method);
  const baseMessage = clean(body.message || body.notes || '', 2600);
  const contextLine = build151Context(body);
  const message = clean([baseMessage, contextLine].filter(Boolean).join('\n'), 3000);
  const consentToContact = flag(body.consent_to_contact);
  const attachmentUrls = Array.isArray(body.attachment_urls) ? body.attachment_urls.map((item) => clean(item, 500)).filter(Boolean).slice(0, 8) : [];
  const utm = parseUtm(body, context.request);

  if (!name) return json({ ok: false, error: 'Please add your name.' }, 400);
  if (!email) return json({ ok: false, error: 'Please add a valid email address.' }, 400);
  if (!baseMessage || baseMessage.length < 12) return json({ ok: false, error: 'Please add a few details about the custom request.' }, 400);
  if (!consentToContact) return json({ ok: false, error: 'Please confirm we may contact you about this request.' }, 400);

  if (!(await hasCustomRequestIntakeSchema(db))) {
    return json({ ok: false, error: 'custom_request_schema_unavailable', message: 'Custom requests are temporarily unavailable.', request_time_schema_mutation: false }, 503);
  }

  if (requestedCapabilityKey) {
    const capability = await db.prepare(`SELECT capability_key FROM workshop_capability_profiles WHERE capability_key=? AND is_public=1 AND review_status IN ('reviewed','published') LIMIT 1`).bind(requestedCapabilityKey).first().catch(() => null);
    if (!capability) return json({ ok: false, error: 'Please choose a currently reviewed workshop capability or select help me decide.' }, 400);
  }

  const requestKey = `cr_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
  const uploadToken = `upload_${crypto.randomUUID().replace(/-/g, '')}`;
  const insert = await db.prepare(`INSERT INTO custom_requests (
    request_key, name, email, phone, request_type, product_interest, deadline_date,
    budget_cents, quantity, project_intent, intended_use, organization_name, event_context_structured,
    supplied_item, desired_material, desired_finish, personalization_text, requested_capability_key,
    tolerance_size_notes, help_choose_method,
    message, attachment_urls_json, consent_to_contact, utm_source, utm_medium, utm_campaign, utm_content, utm_term, visitor_token, browser_session_token,
    scent_profile, wax_or_base, colour_notes, batch_number, ingredient_notes, allergen_safety_notes,
    upload_token, reference_upload_count, status, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    requestKey, name, email, phone || null, requestType || 'custom_gift', productInterest || null, deadlineDate || null,
    parseBudgetCents(body.budget), quantity, projectIntent, intendedUse || null, organizationName || null, eventContextStructured || null,
    suppliedItem, desiredMaterial || null, desiredFinish || null, personalizationText || null, requestedCapabilityKey || null,
    toleranceSizeNotes || null, helpChooseMethod,
    message, JSON.stringify(attachmentUrls), consentToContact,
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

  return json({ ok: true, message: 'Custom request received. We will review it before replying.', request_key: requestKey, upload_token: uploadToken, reference_upload_limit: 5, custom_request_id: customRequestId, build: 210, structured_intake: true, capability_preference_recorded: Boolean(requestedCapabilityKey), help_choose_method: Boolean(helpChooseMethod), context_preserved_in_existing_message_authority: Boolean(contextLine), request_time_schema_mutation: false, automatic_order_created: false, automatic_quote_created: false, manufacturing_route_proposed: false, stock_reserved: false, provider_action_executed: false });
}
