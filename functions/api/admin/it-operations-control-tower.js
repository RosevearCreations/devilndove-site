import { jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as getReadinessControlTower } from './it-control-tower.js';

const RELEASE = 467;
const BUILD = 39;
const TITLE = 'Product Numbering Runtime-DDL Elimination & Sequence Safety Convergence';
const ACCEPTED_DEVELOPMENT = Object.freeze({
  release: 467,
  build: 39,
  title: TITLE,
  state: 'DEVELOPMENT_GREEN',
  accepted_sha: '8f94a6b49b6353946d96afbe2c7eb0b5ce6ca6b1',
  accepted_tree_sha: '1dba2f02509e7fe0c7046541f126f80aa5170d8b',
  system_gate_run: 33883587705,
  current_application_quality_run: 33883587677,
  it_admin_runtime_proof_run: 33883587724,
  branch_hygiene_run: 33883587669,
});
const PRODUCTION = Object.freeze({
  release: 467,
  build: 32,
  title: 'Help, Search & Responsive Convergence',
  state: 'PRODUCTION_GREEN',
  main_sha: '816490a9f36ffc2a730d8149549e5a2fbd609966',
  tree_sha: '2c1b4a3694779996e1bdb094be5e9e043834276e',
  pages_deploy_run: 33866964958,
  promotion_state: 'EXACT_TREE_PRODUCTION_GREEN',
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
const CURRENT_GUARDS = Object.freeze([
  'System Gate',
  'Current Application Quality Proof',
  'I.T. Admin Runtime Proof',
  'Repository Branch Hygiene',
]);
const EXTERNAL_POLICY = Object.freeze([
  { key: 'cloudflare_access_service_token', label: 'Cloudflare Access service-token acceptance', state: 'HOLD_EXTERNAL', authority: 'fresh external acceptance required', href: '/admin/it/' },
  { key: 'stripe_development', label: 'Stripe Development acceptance', state: 'HOLD_EXTERNAL', authority: 'fresh external acceptance required', href: '/admin/release-control/external-commercial-readiness/' },
  { key: 'paypal_sandbox', label: 'PayPal sandbox acceptance', state: 'HOLD_EXTERNAL', authority: 'fresh external acceptance required', href: '/admin/release-control/external-commercial-readiness/' },
  { key: 'social_oauth', label: 'Social/OAuth controlled acceptance', state: 'HOLD_EXTERNAL', authority: 'fresh external acceptance required', href: '/admin/release-control/external-commercial-readiness/' },
  { key: 'caip_private_media', label: 'CAIP private-media acceptance', state: 'EVIDENCE_DEPENDENT', authority: 'fresh authenticated runtime evidence required', href: '/admin/release-control/external-commercial-readiness/' },
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
      queue.push({ subsystem, state: finding.state, priority: finding.state === 'red' ? 'BLOCKING' : 'ATTENTION', code, label: clean(finding.label) || 'Readiness finding', detail: clean(finding.detail), correction: clean(finding.correction) || 'Open the linked corrective workspace and re-run I.T. preflight.', href: clean(finding.href) || '/admin/it/' });
    }
  }
  queue.sort((a, b) => priority(a.state) - priority(b.state) || a.label.localeCompare(b.label));
  return queue;
}

export async function onRequestGet(context) {
  const baseResponse = await getReadinessControlTower(context);
  if (!baseResponse.ok) return baseResponse;
  const base = await baseResponse.json().catch(() => null);
  if (!base?.ok) return jsonResponse({ release: RELEASE, build: BUILD, ok: false, error: 'I.T. readiness authority returned an invalid payload.' }, 503, { 'Cache-Control': 'no-store' });

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
    authority: 'release467-build39-product-numbering-runtime-ddl-elimination',
    state: 'DEVELOPMENT_GREEN',
    environment: 'development',
    release_authority: {
      current_operator: { release: RELEASE, build: BUILD, title: TITLE, state: 'DEVELOPMENT_GREEN' },
      accepted_development: ACCEPTED_DEVELOPMENT,
      production: PRODUCTION,
      compatibility_runtime_release_header: 466,
      compatibility_runtime_release_header_role: 'INHERITED_RUNTIME_COMPATIBILITY',
      current_automatic_guards: CURRENT_GUARDS,
      persistent_branches: ['main', 'dev'],
      production_promotion_required_development_proofs: CURRENT_GUARDS,
      rollback_readiness: 'RELEASE_NEUTRAL_READ_ONLY',
      reliability_authority: 'current-development-authority.json',
      reliability_projection_build: 39,
      historical_build36_reliability_authority: 'release467-build36-current-reliability-operational-health',
      historical_reliability_engine_role: 'HISTORICAL_REGRESSION_COMPATIBILITY',
      deployment_preflight_authority: 'current-development-authority.json',
      deployment_preflight_projection_build: 39,
      historical_build37_deployment_preflight_authority: 'release467-build37-deployment-preflight-canonical-migration',
      accounting_schema_authority: 'release467-build38-accounting-core-runtime-ddl-elimination',
      accounting_request_time_ddl: 0,
      product_numbering_schema_authority: 'release467-build39-product-numbering-runtime-ddl-elimination',
      product_numbering_request_time_ddl: 0,
      product_numbering_required_columns: ['sequence_key', 'next_product_number', 'updated_at'],
      runtime_schema_residue_files_ceiling: 59,
      runtime_schema_residue_occurrences_ceiling: 525,
      runtime_schema_residue_shared_helpers_ceiling: 3,
      raw_d1_bypass_with_ddl_ceiling: 0,
      canonical_migration_authority: 'migrations/canonical/manifest.json + scripts/d1_migrate.py',
      request_time_schema_mutation: false,
    },
    development: { ...DEVELOPMENT, runtime_source_sha: runtimeSha, runtime_host: runtimeHost, exact_runtime_sha_available: Boolean(runtimeSha) },
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
    source_preflight_engine: { release: Number(base.release || 0), build: Number(base.build || 0), authority: clean(base.authority), role: 'RETAINED_READ_ONLY_PREFLIGHT_ENGINE' },
    truth_notes: [
      'Build 39 is Development GREEN and owns current I.T. operator truth.',
      'Product Numbering carries zero request-time schema DDL and asserts the proven catalog_product_number_sequence baseline read-only across three required columns before preview or allocation.',
      'Desktop and mobile Product Numbering preserve sequence-floor and atomic allocation business writes; missing schema or invalid allocation fails closed.',
      'Historical runtime schema residue is ratcheted to ceilings of 59 files, 525 DDL statements and 3 delegated/shared helpers, with zero raw D1 bypasses carrying DDL.',
      'Accounting remains pinned at zero request-time schema DDL under its Build 38 authority.',
      'The canonical D1 migration stream remains exactly four files; Build 39 adds no migration because catalog_product_number_sequence is a proven pre-canonical baseline.',
      'Deployment Preflight and Reliability are synchronized to Release 467 Build 39 as read-only current projections; their Build 37 and Build 36 feature authorities remain historical evidence.',
      'Build 38 remains the historical Accounting feature authority.',
      'Production promotion requires the exact current Development tree plus successful System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene proofs.',
      'Production rollback readiness remains release-neutral and read-only and does not execute rollback, schema reversal or business-data restoration.',
      'Build 32 remains the independently verified Production-green baseline until a deliberate Production promotion is requested and proven.',
      'External HOLDs never become GREEN by inference from source, D1 convergence, deployment success, reliability health, preflight status, Accounting readiness or Product Numbering readiness.',
    ],
    safety: { read_only_projection: true, automatic_repair: false, schema_change_required: false, request_time_schema_mutation: false, d1_mutation_from_endpoint: false, r2_mutation_from_endpoint: false, provider_execution: false, provider_publication: false, cloudflare_access_policy_mutation: false, main_mutation: false, production_mutation: false, secret_values_emitted: false },
    generated_at: new Date().toISOString(),
  }, 200, { 'Cache-Control': 'no-store' });
}
