// Release 460 — admin-only, Development-only provider publication validation endpoint.
// Produces local payload previews and deterministic idempotency keys. It never contacts providers.

import { getAdminUserFromRequest, jsonResponse } from '../_lib/adminAudit.js';
import { isDevelopmentOAuthHost } from '../_lib/oauthSecurity.js';
import { buildProviderPublicationPlan, listProviderPublicationContracts } from '../_lib/socialPublishContracts.js';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
}

function developmentRequest(context) {
  try { return isDevelopmentOAuthHost(new URL(context.request.url).hostname); } catch { return false; }
}

async function requireAdmin(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { response: json({ ok: false, release: 460, error: 'Admin access required.' }, 401) };
  if (!developmentRequest(context)) {
    return {
      response: json({
        ok: false,
        release: 460,
        code: 'provider_publication_validation_development_only',
        error: 'Provider publication validation is restricted to the Development application.',
        validation_only: true,
        provider_execution: false,
        provider_publication: false,
        production_mutation: false,
      }, 403),
    };
  }
  return { adminUser };
}

function boundary() {
  return {
    validation_only: true,
    provider_execution: false,
    provider_publication: false,
    provider_live_authorization: false,
    network_calls_allowed: false,
    token_material_required: false,
    production_mutation: false,
  };
}

export async function onRequestGet(context) {
  const auth = await requireAdmin(context);
  if (auth.response) return auth.response;
  return json({
    ok: true,
    release: 460,
    mode: 'provider_publication_validation_only',
    validation_policy: 'release460_internal_preview_v1',
    contracts: listProviderPublicationContracts(),
    execution_boundary: boundary(),
    note: 'These are internal validation previews and idempotency plans only. No provider request is made and no publication is authorized.',
  });
}

export async function onRequestPost(context) {
  const auth = await requireAdmin(context);
  if (auth.response) return auth.response;
  let body = {};
  try { body = await context.request.json(); } catch {
    return json({ ok: false, release: 460, code: 'provider_publication_invalid_json', error: 'Valid JSON body required.', execution_boundary: boundary() }, 400);
  }
  const provider = String(body?.provider || '').trim().toLowerCase();
  const intent = body?.intent && typeof body.intent === 'object' && !Array.isArray(body.intent) ? body.intent : body;
  try {
    const plan = await buildProviderPublicationPlan(provider, intent);
    return json({
      ok: plan.valid,
      release: 460,
      mode: 'provider_publication_validation_only',
      plan,
      execution_boundary: boundary(),
    }, plan.valid ? 200 : 422);
  } catch (error) {
    const code = String(error?.message || '') === 'provider_publication_provider_unsupported'
      ? 'provider_publication_provider_unsupported'
      : 'provider_publication_validation_failed';
    return json({
      ok: false,
      release: 460,
      code,
      error: code === 'provider_publication_provider_unsupported' ? 'Choose a supported provider.' : 'Provider publication validation could not complete.',
      execution_boundary: boundary(),
    }, code === 'provider_publication_provider_unsupported' ? 400 : 500);
  }
}
