import { jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as getLegacyCommercialReadiness } from './release466-external-commercial-readiness.js';

const RELEASE = 467;
const BUILD = 7;
const REQUIRED_LANES = Object.freeze([
  'caip_private_media',
  'stripe_development',
  'paypal_sandbox',
  'social_oauth',
]);

const CORRECTION_ACTIONS = Object.freeze({
  caip_private_media_acceptance_pending: {
    label: 'Open Runtime Acceptance',
    href: '/admin/runtime-acceptance/',
    owner: 'Creators / I.T.',
    mechanic: 'Create fresh authenticated Development browser/range-streaming evidence through the private review proxy. Bucket presence by itself is not acceptance.',
  },
  stripe_development_acceptance_pending: {
    label: 'Open Commercial Acceptance Runner',
    href: '/admin/release-control/external-commercial-readiness/#provider-acceptance-runner',
    owner: 'Financials / I.T.',
    mechanic: 'Use Stripe test mode only. Complete the deliberate Development acceptance payment, verified webhook, reconciliation, duplicate replay and provider-synchronized refund evidence. Configuration alone is not acceptance.',
  },
  paypal_sandbox_acceptance_pending: {
    label: 'Open Commercial Acceptance Runner',
    href: '/admin/release-control/external-commercial-readiness/#provider-acceptance-runner',
    owner: 'Financials / I.T.',
    mechanic: 'Use PayPal sandbox only. Complete the deliberate Development approval/capture, verified webhook, reconciliation, duplicate replay and provider-synchronized refund evidence. Configuration alone is not acceptance.',
  },
  social_oauth_controlled_acceptance_pending: {
    label: 'Open Provider Configuration',
    href: '/admin/it-integrations/',
    owner: 'Socials / I.T.',
    mechanic: 'Select only the intended Development provider/account, complete controlled connect/identity/lifecycle evidence, and keep publication disabled until separately authorized.',
  },
  native_github_ruleset_external_pending: {
    label: 'Review repository rulesets',
    href: null,
    owner: 'I.T. / GitHub repository settings',
    mechanic: 'Review GitHub repository Settings → Rules → Rulesets using native repository controls. Do not infer a ruleset PASS from application source state.',
  },
});

const text = (value) => String(value ?? '').trim();
const integer = (value) => Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0;
const json = (data, status = 200) => jsonResponse({ release: RELEASE, build: BUILD, ...data }, status, { 'Cache-Control': 'no-store' });

function shaFromEnv(env) {
  const candidates = [env?.CF_PAGES_COMMIT_SHA, env?.COMMIT_SHA, env?.GITHUB_SHA];
  return candidates.map(text).find((value) => /^[0-9a-f]{40}$/i.test(value)) || null;
}

function correctionFor(code) {
  const correction = CORRECTION_ACTIONS[text(code)] || null;
  return correction ? { ...correction } : {
    label: 'Open I.T.',
    href: '/admin/it/',
    owner: 'I.T.',
    mechanic: 'Review the current I.T. evidence ledger and resolve the exact non-GREEN authority without changing Production or weakening an acceptance boundary.',
  };
}

function sanitizeLane(key, item) {
  const source = item && typeof item === 'object' ? item : {};
  const checks = Array.isArray(source.checks) ? source.checks.map((check) => ({
    check_key: text(check?.check_key),
    check_label: text(check?.check_label) || text(check?.check_key),
    check_state: text(check?.check_state) || 'pending',
    evidence_reference_present: check?.evidence_reference_present === true,
    last_checked_at: check?.last_checked_at || null,
    last_safe_error: text(check?.last_safe_error) || null,
    correction_mechanics: text(check?.correction_mechanics) || null,
    evidence_source: text(check?.evidence_source) || null,
  })) : undefined;

  const copy = {
    ...source,
    provider_secret_values_emitted: false,
    token_values_emitted: false,
  };
  if (checks) copy.checks = checks;
  if (key === 'stripe_development' || key === 'paypal_sandbox') {
    const execution = source.execution_boundary || {};
    copy.execution_boundary = {
      configured: execution.configured === true,
      test_mode: execution.test_mode === true,
      live_credential_detected: execution.live_credential_detected === true,
      development_host: execution.development_host === true,
      operator_switch_set: execution.operator_switch_set === true,
      execution_authorized_now: execution.execution_authorized_now === true,
      execution_code: text(execution.execution_code) || null,
      production_execution: false,
      required_operator_switch: text(execution.required_operator_switch) || null,
      legacy_refund_gate: text(execution.legacy_refund_gate) || null,
    };
  }
  return copy;
}

export async function onRequestGet(context) {
  const legacyResponse = await getLegacyCommercialReadiness(context);
  const legacyPayload = await legacyResponse.json().catch(() => null);

  if (!legacyResponse.ok || !legacyPayload?.ok) {
    return json({
      ok: false,
      authority: 'release467-external-commercial-acceptance',
      environment: 'development',
      state: 'HOLD_EXTERNAL',
      error: text(legacyPayload?.error) || `External commercial evidence bridge failed (${legacyResponse.status}).`,
      historical_authority_mutated: false,
      provider_execution: false,
      production_mutation: false,
      secret_values_emitted: false,
    }, legacyResponse.status || 500);
  }

  const legacyItems = legacyPayload.items || {};
  const items = Object.fromEntries(REQUIRED_LANES.map((key) => [key, sanitizeLane(key, legacyItems[key])]));
  const acceptedCount = REQUIRED_LANES.filter((key) => items[key]?.accepted === true).length;
  const externalAcceptanceComplete = acceptedCount === REQUIRED_LANES.length;
  const legacyLaunch = legacyItems.production_launch_readiness || {};
  const legacyBlockers = Array.isArray(legacyLaunch.blockers) ? legacyLaunch.blockers : [];
  const blockers = legacyBlockers.map((blocker) => {
    const code = text(blocker?.code);
    const correction = correctionFor(code);
    return {
      code,
      item: integer(blocker?.item),
      owner: text(blocker?.owner) || correction.owner,
      correction_label: correction.label,
      correction_href: correction.href,
      correction_mechanic: correction.mechanic,
    };
  });

  const runtimeSourceSha = shaFromEnv(context.env);
  const state = externalAcceptanceComplete ? 'COMMERCIAL_ACCEPTANCE_COMPLETE' : 'HOLD_EXTERNAL';

  return json({
    ok: true,
    authority: 'release467-external-commercial-acceptance',
    environment: 'development',
    state,
    source: {
      branch: 'dev',
      runtime_source_sha: runtimeSourceSha,
      exact_sha_visible: Boolean(runtimeSourceSha),
    },
    evidence_bridge: {
      source_authority: text(legacyPayload.authority) || 'legacy-external-commercial-readiness',
      source_release: integer(legacyPayload.release),
      source_build: integer(legacyPayload.build),
      reuse_mode: 'READ_ONLY_WRAPPER',
      historical_authority_mutated: false,
      historical_production_release_field_accepted_as_current: false,
      historical_production_source_sha_field_accepted_as_current: false,
      historical_live_seo_wording_accepted_as_current: false,
    },
    acceptance_summary: {
      required_lane_count: REQUIRED_LANES.length,
      accepted_lane_count: acceptedCount,
      pending_lane_count: REQUIRED_LANES.length - acceptedCount,
      external_commercial_acceptance_complete: externalAcceptanceComplete,
      blocker_count: blockers.length,
      promotion_ready_inferred: false,
    },
    items: {
      ...items,
      release_mechanics: {
        state,
        external_commercial_acceptance_complete: externalAcceptanceComplete,
        blocker_count: blockers.length,
        blockers,
        production_promotion_authority: 'release467-build5-production-promotion-readiness.json',
        cloudflare_access_authority: 'release467-build6-access-acceptance-harness.json',
        current_release_authority: 'release467-build7-external-commercial-acceptance.json',
      },
    },
    correction_actions: Object.entries(CORRECTION_ACTIONS).map(([code, value]) => ({ code, ...value })),
    authority_separation: {
      commercial_acceptance: 'Build 7 reports provider/commercial evidence only.',
      cloudflare_access: 'Build 6 remains the separate outer Cloudflare Access service-token lane.',
      production_promotion: 'Build 5 Production Promotion Readiness remains the current HOLD/READY promotion authority.',
      application_admin: 'Provider or Access evidence is never application-admin authentication.',
    },
    permanent_boundaries: {
      request_method: 'GET',
      schema_change: false,
      d1_mutation: false,
      r2_mutation: false,
      provider_execution: false,
      provider_publication: false,
      cloudflare_access_policy_mutation: false,
      main_mutation: false,
      production_mutation: false,
      secret_values_emitted: false,
    },
  });
}
