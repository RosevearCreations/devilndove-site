import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { paymentExecutionBoundary, paymentExecutionStatus } from '../_lib/paymentExecution.js';

const RELEASE = 466;
const BUILD = 4;
const STRIPE_CHECKS = ['credentials', 'checkout', 'webhook-signature', 'reconciliation', 'idempotent-replay'];
const PAYPAL_CHECKS = ['credentials', 'approval-capture', 'webhook-verification', 'reconciliation', 'idempotent-replay'];
const SOCIAL_PROVIDER_KEYS = ['etsy', 'pinterest', 'meta', 'tiktok', 'youtube', 'x'];
const LIVE_SEO_CONFLICTS = ['/cart/', '/checkout/', '/checkout/confirmation/', '/supplies/health/', '/tools/health/', '/toolshed/duplicates/'];

const rows = (value) => Array.isArray(value?.results) ? value.results : [];
const text = (value) => String(value ?? '').trim();
const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const integer = (value) => Math.trunc(num(value));
const json = (data, status = 200) => jsonResponse({ release: RELEASE, build: BUILD, ...data }, status, { 'Cache-Control': 'no-store' });

async function tableExists(db, name) {
  try {
    const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first();
    return Boolean(row?.name);
  } catch {
    return false;
  }
}

async function safeAll(db, sql, bindings = []) {
  try {
    return rows(await db.prepare(sql).bind(...bindings).all());
  } catch {
    return [];
  }
}

function parseJson(value, fallback = {}) {
  try {
    const parsed = JSON.parse(String(value || ''));
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function checkState(checks, requiredKeys) {
  const byKey = new Map(checks.map((row) => [text(row.check_key), row]));
  const required = requiredKeys.map((key) => {
    const row = byKey.get(key) || null;
    return {
      check_key: key,
      check_label: text(row?.check_label) || key,
      check_state: text(row?.check_state) || 'missing',
      evidence_reference_present: Boolean(text(row?.evidence_reference)),
      last_checked_at: row?.last_checked_at || null,
      last_safe_error: text(row?.last_safe_error) || null,
      correction_mechanics: text(row?.correction_mechanics) || null,
    };
  });
  const passed = required.filter((row) => row.check_state === 'passed').length;
  const failed = required.filter((row) => ['blocked', 'failed', 'missing'].includes(row.check_state));
  return {
    required_count: required.length,
    passed_count: passed,
    accepted: required.length > 0 && passed === required.length,
    blocker_count: failed.length,
    checks: required,
  };
}

async function loadPaymentAcceptance(db, request, env, provider) {
  const requiredKeys = provider === 'stripe' ? STRIPE_CHECKS : PAYPAL_CHECKS;
  const readinessReady = await tableExists(db, 'it_provider_readiness_checks');
  const checks = readinessReady ? await safeAll(db, `SELECT check_key,check_label,check_state,evidence_reference,last_checked_at,last_safe_error,correction_mechanics FROM it_provider_readiness_checks WHERE provider_key=? AND environment='development' AND required_for_activation=1 ORDER BY check_key`, [provider]) : [];
  const acceptance = checkState(checks, requiredKeys);
  const execution = paymentExecutionStatus(request.url, env, provider);
  const boundary = paymentExecutionBoundary(env);
  const configurationSafe = execution.live_credential_detected !== true;
  return {
    provider,
    schema_ready: readinessReady,
    accepted: acceptance.accepted && configurationSafe,
    acceptance_state: acceptance.accepted && configurationSafe ? 'accepted' : (acceptance.blocker_count > 0 ? 'blocked_or_failed' : 'pending_external_evidence'),
    required_count: acceptance.required_count,
    passed_count: acceptance.passed_count,
    blocker_count: acceptance.blocker_count,
    checks: acceptance.checks,
    execution_boundary: {
      configured: Boolean(execution.configured),
      test_mode: Boolean(execution.test_mode),
      live_credential_detected: Boolean(execution.live_credential_detected),
      development_host: Boolean(execution.development_host),
      operator_switch_set: Boolean(execution.operator_switch_set),
      execution_authorized_now: Boolean(execution.execution_authorized),
      execution_code: text(execution.code),
      production_execution: false,
      required_operator_switch: `${boundary.operator_switch}=${boundary.required_value}`,
    },
    policy: 'Configuration or an enabled operator switch is never acceptance. All required provider checks must carry sanitized passed evidence.',
  };
}

async function loadCaipAcceptance(db) {
  const grantReady = await tableExists(db, 'creative_asset_access_grants');
  const auditReady = await tableExists(db, 'creative_asset_access_audit');
  const recent = auditReady ? await safeAll(db, `SELECT creative_asset_access_audit_id,event_type,outcome,details_json,created_at FROM creative_asset_access_audit WHERE event_type='review_proxy_served' ORDER BY creative_asset_access_audit_id DESC LIMIT 50`) : [];
  const served = recent.map((row) => ({ ...row, details: parseJson(row.details_json, {}) }));
  const rangeEvidence = served.find((row) => row.outcome === 'served' && row.details?.ranged_streaming === true && row.details?.no_copy === true && row.details?.no_cache === true) || null;
  return {
    schema_ready: grantReady && auditReady,
    accepted: Boolean(rangeEvidence),
    acceptance_state: rangeEvidence ? 'accepted' : 'pending_authenticated_browser_range_evidence',
    review_proxy_served_events: served.length,
    range_evidence: rangeEvidence ? {
      audit_id: integer(rangeEvidence.creative_asset_access_audit_id),
      created_at: rangeEvidence.created_at || null,
      ranged_streaming: true,
      no_copy: true,
      no_cache: true,
      source_storage_provider: text(rangeEvidence.details?.source_storage_provider) || null,
      object_key_present: rangeEvidence.details?.object_key_present === true,
      raw_token_logged: false,
    } : null,
    policy: 'Acceptance requires a real authenticated Development browser/range-streaming serve through the administrator-bound private review proxy. Bucket presence alone is not acceptance.',
  };
}

async function loadSocialOauthAcceptance(db) {
  const providerReady = await tableExists(db, 'provider_setup_authorities');
  const readinessReady = await tableExists(db, 'it_provider_readiness_checks');
  const connectionReady = await tableExists(db, 'oauth_provider_connections');
  const eventReady = await tableExists(db, 'oauth_security_events');
  const providers = providerReady ? await safeAll(db, `SELECT provider_key,display_name,provider_type,setup_status,enabled,last_verified_at,last_error FROM provider_setup_authorities WHERE provider_key IN ('etsy','pinterest','meta','tiktok','youtube','x') ORDER BY provider_key`) : [];
  const selected = providers.filter((row) => integer(row.enabled) === 1);
  const connections = connectionReady ? await safeAll(db, `SELECT provider_key,connection_status,access_expires_at,refresh_expires_at,last_refresh_at,disconnected_at,remote_revoke_state,diagnostic_code,updated_at,CASE WHEN remote_subject_id IS NOT NULL AND trim(remote_subject_id)<>'' THEN 1 ELSE 0 END provider_subject_present FROM oauth_provider_connections WHERE provider_key IN ('etsy','pinterest','meta','tiktok','youtube','x') ORDER BY provider_key`) : [];
  const security = eventReady ? await safeAll(db, `SELECT provider_key,event_type,outcome,diagnostic_code,created_at FROM oauth_security_events WHERE provider_key IN ('etsy','pinterest','meta','tiktok','youtube','x') ORDER BY created_at DESC LIMIT 100`) : [];
  const readiness = readinessReady ? await safeAll(db, `SELECT provider_key,check_key,check_label,check_state,evidence_reference,last_checked_at,last_safe_error,correction_mechanics FROM it_provider_readiness_checks WHERE provider_key IN ('etsy','pinterest','meta','tiktok','youtube','x') AND environment='development' AND required_for_activation=1 ORDER BY provider_key,check_key`) : [];
  const providerSummaries = selected.map((provider) => {
    const key = text(provider.provider_key);
    const checks = readiness.filter((row) => text(row.provider_key) === key);
    const requiredPassed = checks.length > 0 && checks.every((row) => text(row.check_state) === 'passed');
    const connection = connections.find((row) => text(row.provider_key) === key) || null;
    const identityVerified = Boolean(connection && integer(connection.provider_subject_present) === 1 && ['connected', 'refresh_required'].includes(text(connection.connection_status)));
    const lifecycleEvents = security.filter((row) => text(row.provider_key) === key);
    const controlledLifecycle = lifecycleEvents.some((row) => ['complete', 'passed', 'accepted'].includes(text(row.outcome))) || Boolean(connection?.disconnected_at);
    return {
      provider_key: key,
      display_name: text(provider.display_name) || key,
      setup_status: text(provider.setup_status),
      required_checks: checks.length,
      passed_checks: checks.filter((row) => text(row.check_state) === 'passed').length,
      readiness_passed: requiredPassed,
      intended_account_evidence_present: identityVerified,
      controlled_lifecycle_evidence_present: controlledLifecycle,
      connection_status: text(connection?.connection_status) || 'not_connected',
      remote_revoke_state: text(connection?.remote_revoke_state) || null,
      accepted: requiredPassed && identityVerified && controlledLifecycle,
      last_safe_error: text(provider.last_error) || null,
    };
  });
  const accepted = selected.length > 0 && providerSummaries.every((row) => row.accepted);
  return {
    schema_ready: providerReady && readinessReady && connectionReady && eventReady,
    selected_provider_count: selected.length,
    accepted_provider_count: providerSummaries.filter((row) => row.accepted).length,
    accepted,
    acceptance_state: accepted ? 'accepted' : (selected.length === 0 ? 'pending_provider_selection' : 'pending_controlled_oauth_evidence'),
    providers: providerSummaries,
    publication_allowed: false,
    provider_subject_values_emitted: false,
    token_values_emitted: false,
    policy: 'Only explicitly enabled Development providers are acceptance targets. Intended-account verification and controlled lifecycle evidence are required; publication remains disabled.',
  };
}

function launchBlockers({ caip, stripe, paypal, social }) {
  const blockers = [];
  if (!caip.accepted) blockers.push({ code: 'caip_private_media_acceptance_pending', item: 16, owner: 'Creators / I.T.' });
  if (!stripe.accepted) blockers.push({ code: 'stripe_development_acceptance_pending', item: 17, owner: 'Financials / I.T.' });
  if (!paypal.accepted) blockers.push({ code: 'paypal_sandbox_acceptance_pending', item: 18, owner: 'Financials / I.T.' });
  if (!social.accepted) blockers.push({ code: 'social_oauth_controlled_acceptance_pending', item: 19, owner: 'Socials / I.T.' });
  blockers.push({ code: 'native_github_ruleset_external_pending', item: 20, owner: 'I.T. / GitHub repository settings' });
  for (const path of LIVE_SEO_CONFLICTS) blockers.push({ code: 'production_sitemap_noindex_conflict', item: 20, owner: 'Storefront / SEO', path });
  return blockers;
}

export async function onRequestGet({ request, env }) {
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const [caip, stripe, paypal, social] = await Promise.all([
    loadCaipAcceptance(db),
    loadPaymentAcceptance(db, request, env, 'stripe'),
    loadPaymentAcceptance(db, request, env, 'paypal'),
    loadSocialOauthAcceptance(db),
  ]);
  const blockers = launchBlockers({ caip, stripe, paypal, social });
  const externalAccepted = caip.accepted && stripe.accepted && paypal.accepted && social.accepted;
  const promotionReady = externalAccepted && blockers.length === 0;

  return json({
    ok: true,
    authority: 'release466-external-commercial-readiness',
    environment: 'development',
    schema_change_required: false,
    production_release: 465,
    production_source_sha: 'd5009d9c622bdf84232b3aa7bd24a1c3d61581b2',
    items: {
      caip_private_media: { id: 16, ...caip },
      stripe_development: { id: 17, ...stripe },
      paypal_sandbox: { id: 18, ...paypal },
      social_oauth: { id: 19, ...social },
      production_launch_readiness: {
        id: 20,
        implementation_ready: true,
        external_acceptance_complete: externalAccepted,
        promotion_ready: promotionReady,
        state: promotionReady ? 'ready_for_separate_promotion_review' : 'hold',
        blocker_count: blockers.length,
        blockers,
        live_seo_conflicts: LIVE_SEO_CONFLICTS,
        native_github_ruleset_state: 'external_repository_setting_pending',
      },
    },
    permanent_boundaries: {
      production_mutation: false,
      production_payment_execution: false,
      production_provider_execution: false,
      provider_publication: false,
      raw_r2_delete: false,
      automatic_oauth_action: false,
      secrets_emitted: false,
      promotion_requires_separate_deliberate_authorization: true,
    },
  });
}
