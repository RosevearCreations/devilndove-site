import { jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as getReadinessControlTower } from './it-control-tower.js';

const RELEASE = 467;
const BUILD = 10;
const TITLE = 'I.T. Control Tower Consolidation and Self-Diagnostics';
const LAST_GREEN = Object.freeze({
  release: 467,
  build: 9,
  dev_sha: 'd8a9ffba03f980b9632643d91d9aa69b25bd94fd',
  dev_tree_sha: '949f2523d31e0f47ed1e19ff7655de2762fbc1df',
  system_gate_run: 33633043297,
  build_proof_run: 33633043229,
});
const DEVELOPMENT = Object.freeze({
  target: 'https://dev.devilndove-site.pages.dev',
  pages_project: 'devilndove-site',
  d1_name: 'devilndove-dev',
  d1_id: 'dbc1615b-dcbe-4951-973b-b47c99c73bfa',
  product_r2: 'devilndove-toolshed-images-dev',
  caip_r2: 'devilndove-caip-media-dev',
  canonical_migrations: 4,
});
const EXTERNAL_POLICY = Object.freeze([
  { key: 'cloudflare_access_service_token', label: 'Cloudflare Access service-token acceptance', state: 'HOLD_EXTERNAL', authority: 'Release 467 Build 6', href: '/admin/it/' },
  { key: 'stripe_development', label: 'Stripe Development acceptance', state: 'HOLD_EXTERNAL', authority: 'Release 467 Build 7', href: '/admin/release-control/external-commercial-readiness/' },
  { key: 'paypal_sandbox', label: 'PayPal sandbox acceptance', state: 'HOLD_EXTERNAL', authority: 'Release 467 Build 7', href: '/admin/release-control/external-commercial-readiness/' },
  { key: 'social_oauth', label: 'Social/OAuth controlled acceptance', state: 'HOLD_EXTERNAL', authority: 'Release 467 Build 7', href: '/admin/release-control/external-commercial-readiness/' },
  { key: 'caip_private_media', label: 'CAIP private-media acceptance', state: 'USE_FRESH_BUILD7_RUNTIME_EVIDENCE', authority: 'Release 467 Build 7', href: '/admin/release-control/external-commercial-readiness/' },
]);

const priority = (state) => state === 'red' ? 0 : state === 'amber' ? 1 : 2;
const clean = (value) => String(value ?? '').trim();

function recoveryQueue(subsystems = {}) {
  const seen = new Set();
  const queue = [];
  for (const [subsystem, value] of Object.entries(subsystems || {})) {
    for (const finding of Array.isArray(value?.findings) ? value.findings : []) {
      if (!finding || !['red', 'amber'].includes(finding.state)) continue;
      const code = clean(finding.code) || `${subsystem}:${clean(finding.label)}`;
      if (seen.has(code)) continue;
      seen.add(code);
      queue.push({
        subsystem,
        state: finding.state,
        priority: finding.state === 'red' ? 'BLOCKING' : 'ATTENTION',
        code,
        label: clean(finding.label) || 'Readiness finding',
        detail: clean(finding.detail),
        correction: clean(finding.correction) || 'Open the linked corrective workspace and re-run I.T. preflight.',
        href: clean(finding.href) || '/admin/it/',
      });
    }
  }
  queue.sort((a, b) => priority(a.state) - priority(b.state) || a.label.localeCompare(b.label));
  return queue;
}

export async function onRequestGet(context) {
  const baseResponse = await getReadinessControlTower(context);
  if (!baseResponse.ok) return baseResponse;

  const base = await baseResponse.json().catch(() => null);
  if (!base?.ok) {
    return jsonResponse({ release: RELEASE, build: BUILD, ok: false, error: 'I.T. readiness authority returned an invalid payload.' }, 503, { 'Cache-Control': 'no-store' });
  }

  const subsystems = base.subsystems || {};
  const queue = recoveryQueue(subsystems);
  const red = queue.filter((item) => item.state === 'red').length;
  const amber = queue.filter((item) => item.state === 'amber').length;
  const ancestry = subsystems.deployment_ancestry || {};
  const admin = subsystems.admin_authority?.metrics || {};
  const database = subsystems.database?.metrics || {};
  const runtimeSha = clean(ancestry.runtime_source_sha) || null;
  const runtimeHost = clean(ancestry.deployment_host) || null;

  return jsonResponse({
    release: RELEASE,
    build: BUILD,
    title: TITLE,
    ok: true,
    authority: 'release467-build10-it-operations-control-tower',
    state: 'DEVELOPMENT_CANDIDATE',
    environment: 'development',
    release_authority: {
      current: { release: RELEASE, build: BUILD, title: TITLE },
      last_green: LAST_GREEN,
      compatibility_runtime_release_header: 466,
      compatibility_runtime_release_header_role: 'INHERITED_RUNTIME_COMPATIBILITY',
      production_promotion_authority: 'Release 467 Build 5 Production Promotion Readiness',
      production_promotion_state: 'NO_AUTOMATIC_PROMOTION',
    },
    development: {
      ...DEVELOPMENT,
      runtime_source_sha: runtimeSha,
      runtime_host: runtimeHost,
      exact_runtime_sha_available: Boolean(runtimeSha),
    },
    readiness: base.readiness || {},
    headline_metrics: {
      readiness_score: Number(base.readiness?.score || 0),
      readiness_state: clean(base.readiness?.overall) || 'unknown',
      launch_state: clean(base.readiness?.launch_state) || 'UNKNOWN',
      blocking_actions: red,
      attention_actions: amber,
      root_admin_full_manage: admin.root_admin_full_manage === true,
      active_profiles: Number(admin.active_profile_count || 0),
      active_admins: Number(admin.active_admin_count || 0),
      enabled_modules: Number(admin.enabled_modules || 0),
      d1_tables: Number(database.tables || 0),
      canonical_migrations: Number(database.canonical_migrations || 0),
      migration_proofs: Number(database.migration_proofs || 0),
      foreign_key_violations: Number(database.foreign_key_violations || 0),
    },
    external_policy: EXTERNAL_POLICY,
    recovery_queue: queue,
    next_action: queue[0] || null,
    subsystems,
    sanitized_configuration: base.sanitized_configuration || {},
    source_preflight_engine: {
      release: Number(base.release || 0),
      build: Number(base.build || 0),
      authority: clean(base.authority),
      retained_for_compatibility: true,
    },
    safety: {
      schema_change_required: false,
      request_time_schema_mutation: false,
      d1_mutation_from_endpoint: false,
      r2_mutation_from_endpoint: false,
      provider_execution: false,
      provider_publication: false,
      cloudflare_access_policy_mutation: false,
      main_mutation: false,
      production_mutation: false,
      secret_values_emitted: false,
    },
    drift_policy: 'Build 10 consolidates existing read-only readiness evidence. It does not infer exact D1/R2 identity from opaque runtime bindings, does not repair administrator permissions automatically, and does not convert external HOLDs into acceptance.',
    generated_at: new Date().toISOString(),
  }, 200, { 'Cache-Control': 'no-store' });
}
