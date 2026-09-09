// Release 467 Build 85 — admin-only Socials / OAuth acceptance evidence.
// Read-only projection over existing OAuth + social queue authorities. No provider call and no publication.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { encryptionKeyConfigured, isDevelopmentOAuthHost, oauthAcceptanceProvider, oauthRemoteAuthorizationOpen, oauthSelectedProviderAuthorizationOpen } from '../_lib/oauthSecurity.js';
import { getOAuthContract, providerConfiguration, providerIdentityExpectation, providerIdentityStatus } from '../_lib/oauthProviders.js';
import { deriveSocialOAuthAcceptance, SOCIAL_OAUTH_ACCEPTANCE_PROVIDERS } from '../_lib/socialOAuthAcceptance.js';
import { CURRENT_RELEASE } from '../_lib/releaseAuthority.js';

const json = (data, status = 200) => jsonResponse({ release: CURRENT_RELEASE, build: 85, ...data }, status, {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
});

function connectionHealth(row, now = Date.now()) {
  if (!row) return 'not_connected';
  if (String(row.connection_status || '') !== 'connected') return String(row.connection_status || 'attention_required');
  const access = row.access_expires_at ? Date.parse(String(row.access_expires_at)) : NaN;
  const refresh = row.refresh_expires_at ? Date.parse(String(row.refresh_expires_at)) : NaN;
  if (Number.isFinite(refresh) && refresh <= now) return 'reauthorization_required';
  if (!Number.isFinite(access)) return 'connected_expiry_unknown';
  if (access <= now) return row.refresh_token_present ? 'refresh_due' : 'reauthorization_required';
  if (access - now <= 15 * 60 * 1000) return row.refresh_token_present ? 'refresh_due_soon' : 'reauthorization_due_soon';
  return 'healthy';
}

function safeConnection(row, contract, env) {
  if (!row || !contract) return null;
  const identity = providerIdentityStatus(contract, env, row.remote_subject_id, row.connection_status);
  return {
    provider_key: row.provider_key,
    connection_status: row.connection_status,
    health: connectionHealth({ ...row, refresh_token_present: Boolean(row.refresh_token_ciphertext) }),
    scopes: (() => { try { const parsed = JSON.parse(row.scopes_json || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })(),
    access_expires_at: row.access_expires_at || null,
    refresh_expires_at: row.refresh_expires_at || null,
    intended_account_verification: identity.status,
    intended_account_label: identity.account_label || null,
    intended_account_label_configured: Boolean(identity.account_label_configured),
    provider_subject_present: Boolean(row.remote_subject_id),
    provider_subject_emitted: false,
    token_material_present: 'redacted',
  };
}

async function queueRows(db) {
  try {
    const result = await db.prepare(`
      SELECT social_post_queue_id,social_post_key,target_platforms_json,approval_status,post_status,
             privacy_status,approved_for_public_post,updated_at
      FROM social_post_queue
      WHERE COALESCE(post_status,'draft') IN ('draft','ready')
      ORDER BY CASE WHEN COALESCE(approval_status,'needs_review')='approved' THEN 0 ELSE 1 END,
               CASE WHEN COALESCE(post_status,'draft')='ready' THEN 0 ELSE 1 END,
               social_post_queue_id DESC
      LIMIT 250
    `).all();
    return Array.isArray(result?.results) ? result.results : [];
  } catch {
    return [];
  }
}

export async function onRequestGet({ request, env }) {
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok: false, code: 'oauth_database_unavailable', error: 'OAuth acceptance authority is unavailable.' }, 503);

  const url = new URL(request.url);
  const selected = oauthAcceptanceProvider(env);
  const contract = selected ? getOAuthContract(selected) : null;
  const cfg = contract ? providerConfiguration(contract, env) : null;
  const intended = contract ? providerIdentityExpectation(contract, env) : null;
  let row = null;
  if (selected) {
    try {
      row = await db.prepare(`
        SELECT provider_key,remote_subject_id,refresh_token_ciphertext,scopes_json,access_expires_at,
               refresh_expires_at,connection_status,updated_at
        FROM oauth_provider_connections WHERE provider_key=? LIMIT 1
      `).bind(selected).first();
    } catch {
      row = null;
    }
  }

  const safe = safeConnection(row, contract, env);
  const devHost = isDevelopmentOAuthHost(url.hostname, env);
  const globalOpen = oauthRemoteAuthorizationOpen(env, request.url);
  const selectedOpen = selected ? oauthSelectedProviderAuthorizationOpen(env, request.url, selected) : false;
  const projection = deriveSocialOAuthAcceptance({
    selected_provider: selected,
    development_host: devHost,
    explicit_operator_switch: globalOpen,
    selected_provider_authorization_open: selectedOpen,
    encryption_authority_ready: encryptionKeyConfigured(env),
    provider_configuration_ready: Boolean(cfg?.configured),
    intended_account_configured: Boolean(intended?.configured),
    identity_lookup_configuration_ready: Boolean(intended?.lookup_configuration_ready),
    connection_present: Boolean(safe),
    connection_healthy: safe?.health === 'healthy',
    intended_account_verification: safe?.intended_account_verification || 'not_connected',
    queue_rows: await queueRows(db),
    provider_publication_closed: true,
  });

  const startReady = Boolean(
    selected && devHost && selectedOpen && encryptionKeyConfigured(env) && cfg?.configured
    && intended?.configured && intended?.lookup_configuration_ready
  );

  return json({
    ok: true,
    authority: 'release467_build85_social_oauth_acceptance',
    environment: devHost ? 'development' : 'production_or_non_development',
    supported_social_acceptance_providers: SOCIAL_OAUTH_ACCEPTANCE_PROVIDERS,
    selected_provider: selected || null,
    selected_provider_reference: 'SOCIAL_OAUTH_ACCEPTANCE_PROVIDER',
    global_operator_switch_reference: 'OAUTH_PROVIDER_AUTHORIZATION_MODE=development-explicit',
    remote_authorization_open: selectedOpen,
    production_authorization_open: false,
    provider_publication_allowed: false,
    provider_execution_allowed: false,
    automatic_publication_allowed: false,
    provider_contacted: false,
    secret_values_emitted: false,
    provider_subject_values_emitted: false,
    encryption_key_configured: encryptionKeyConfigured(env),
    provider_configuration_ready: Boolean(cfg?.configured),
    intended_account_configured: Boolean(intended?.configured),
    intended_account_label: intended?.account_label || null,
    intended_account_label_configured: Boolean(intended?.account_label_configured),
    identity_lookup_configuration_ready: Boolean(intended?.lookup_configuration_ready),
    connection: safe,
    acceptance: projection,
    start_authorization_available: startReady && projection.status === 'oauth_authorization_required',
    start_authorization_path: startReady && projection.status === 'oauth_authorization_required'
      ? `/api/admin/oauth-start?provider=${encodeURIComponent(selected)}&return_to=${encodeURIComponent('/admin/social-publishing/#social-oauth-acceptance')}`
      : null,
    publication_boundary: {
      accepted: false,
      provider_execution: false,
      provider_publication: false,
      automatic_publication: false,
      required_next_acceptance: 'explicit controlled provider publication acceptance after OAuth + human-approved draft evidence',
    },
  });
}
