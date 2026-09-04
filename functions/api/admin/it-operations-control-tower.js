import { jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as getReadinessControlTower } from './it-control-tower.js';

const RELEASE = 467;
const BUILD = 49;
const TITLE = 'Current Authority Convergence & Restart Integrity';
const ACCEPTED_DEVELOPMENT = Object.freeze({
  release: 467, build: 49, title: TITLE, state: 'DEVELOPMENT_GREEN',
  accepted_sha: '7bbfbf10a531898052771d9db1cfbb1a9e7d893a',
  accepted_tree_sha: '7a74af809182a0eb6befb56e34d2869b44090c6e',
  system_gate_run: 33928678750,
  current_application_quality_run: 33928678778,
  it_admin_runtime_proof_run: 33928678807,
  branch_hygiene_run: 33928678789,
  exact_preview_deployment: true,
  role: 'IMPLEMENTATION_ACCEPTANCE',
});
const VERIFIED_DEVELOPMENT = Object.freeze({
  release: 467, build: 48, title: 'Automated Production Acceptance', state: 'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN',
  dev_sha: '3980661045c68f55fa64e66e6414055ee0d359f6',
  tree_sha: '66e5e0a088d6eb9f4f85f70791de8925ac40adb0',
  system_gate_run: 33925647553,
  current_application_quality_run: 33925647532,
  it_admin_runtime_proof_run: 33925647561,
  branch_hygiene_run: 33925647559,
  exact_preview_deployment: true,
  role: 'LAST_FULLY_VERIFIED_RESTART_CHECKPOINT',
});
const PRODUCTION = Object.freeze({
  release: 467, build: 32, title: 'Help, Search & Responsive Convergence', state: 'PRODUCTION_GREEN',
  main_sha: '816490a9f36ffc2a730d8149549e5a2fbd609966',
  tree_sha: '2c1b4a3694779996e1bdb094be5e9e043834276e',
  pages_deploy_run: 33866964958, promotion_state: 'EXACT_TREE_PRODUCTION_GREEN',
});
const DEVELOPMENT = Object.freeze({ target: 'https://dev.devilndove-site.pages.dev', pages_project: 'devilndove-site', d1_name: 'devilndove-dev', d1_id: 'dbc1615b-dcbe-4951-973b-b47c99c73bfa', product_r2: 'devilndove-toolshed-images-dev', caip_r2: 'devilndove-caip-media-dev', canonical_migrations: 4 });
const CURRENT_GUARDS = Object.freeze(['System Gate','Current Application Quality Proof','I.T. Admin Runtime Proof','Repository Branch Hygiene']);
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
  const seen = new Set(); const queue = [];
  for (const [subsystem, value] of Object.entries(subsystems || {})) for (const finding of Array.isArray(value?.findings) ? value.findings : []) {
    if (!finding || !['red','amber'].includes(finding.state)) continue;
    const code = clean(finding.code) || `${subsystem}:${clean(finding.label)}`; if (seen.has(code)) continue; seen.add(code);
    queue.push({ subsystem, state: finding.state, priority: finding.state === 'red' ? 'BLOCKING' : 'ATTENTION', code, label: clean(finding.label) || 'Readiness finding', detail: clean(finding.detail), correction: clean(finding.correction) || 'Open the linked corrective workspace and re-run I.T. preflight.', href: clean(finding.href) || '/admin/it/' });
  }
  queue.sort((a,b) => priority(a.state)-priority(b.state) || a.label.localeCompare(b.label)); return queue;
}

export async function onRequestGet(context) {
  const baseResponse = await getReadinessControlTower(context);
  if (!baseResponse.ok) return baseResponse;
  const base = await baseResponse.json().catch(() => null);
  if (!base?.ok) return jsonResponse({ release: RELEASE, build: BUILD, ok: false, error: 'I.T. readiness authority returned an invalid payload.' }, 503, { 'Cache-Control': 'no-store' });
  const subsystems = base.subsystems || {}; const queue = recoveryQueue(subsystems);
  const red = queue.filter((item)=>item.state==='red').length; const amber = queue.filter((item)=>item.state==='amber').length;
  const ancestry = subsystems.deployment_ancestry || {}; const admin = subsystems.admin_authority?.metrics || {}; const database = subsystems.database?.metrics || {};
  const runtimeSha = clean(ancestry.runtime_source_sha) || null; const runtimeHost = clean(ancestry.deployment_host) || null;
  return jsonResponse({
    release: RELEASE, build: BUILD, title: TITLE, ok: true,
    authority: 'release467-build49-current-authority-convergence-restart-integrity', state: 'DEVELOPMENT_GREEN', environment: 'development',
    release_authority: {
      current_operator: { release: RELEASE, build: BUILD, title: TITLE, state: 'DEVELOPMENT_GREEN' },
      accepted_development: ACCEPTED_DEVELOPMENT,
      verified_development: VERIFIED_DEVELOPMENT,
      restart_integrity: {
        protocol: 'EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1',
        last_fully_verified: VERIFIED_DEVELOPMENT,
        current_closure_candidate: ACCEPTED_DEVELOPMENT,
        implementation_acceptance_is_distinct_from_final_closure: true,
        restart_requires_exact_dev_head_proof_verification: true,
        closure_candidate_requires_external_exact_head_proof: true,
        next_build_ingests_previous_final_closure: true,
      },
      production: PRODUCTION,
      compatibility_runtime_release_header: 466, compatibility_runtime_release_header_role: 'INHERITED_RUNTIME_COMPATIBILITY', current_automatic_guards: CURRENT_GUARDS,
      persistent_branches: ['main','dev'], production_promotion_required_development_proofs: CURRENT_GUARDS, rollback_readiness: 'RELEASE_NEUTRAL_READ_ONLY',
      reliability_authority: 'current-development-authority.json', reliability_projection_build: 49,
      historical_build36_reliability_authority: 'release467-build36-current-reliability-operational-health', historical_reliability_engine_role: 'HISTORICAL_REGRESSION_COMPATIBILITY',
      deployment_preflight_authority: 'current-development-authority.json', deployment_preflight_projection_build: 49,
      historical_build37_deployment_preflight_authority: 'release467-build37-deployment-preflight-canonical-migration',
      accounting_schema_authority: 'release467-build38-accounting-core-runtime-ddl-elimination', accounting_request_time_ddl: 0,
      product_numbering_schema_authority: 'release467-build39-product-numbering-runtime-ddl-elimination', product_numbering_request_time_ddl: 0, product_numbering_required_columns: ['sequence_key','next_product_number','updated_at'],
      product_social_automation_schema_authority: 'release467-build40-product-social-automation-runtime-ddl-elimination', product_social_automation_request_time_ddl: 0, product_social_required_settings_columns: 12, product_social_required_queue_columns: 33,
      packaging_safe_area_authority: 'release467-build41-unified-interface-label-fit-foundation', packaging_safe_area_gate: 'scripts/current_packaging_safe_area_gate.py',
      packaging_material_intelligence_authority: 'release467-build42-material-template-intelligence', packaging_material_intelligence_gate: 'scripts/current_packaging_material_intelligence_gate.py', packaging_material_intelligence_request_time_ddl: 0,
      packaging_label_composition_authority: 'release467-build43-label-composition-overrides', packaging_label_composition_gate: 'scripts/current_packaging_label_composition_gate.py', packaging_label_composition_request_time_ddl: 0,
      packaging_label_production_authority: 'release467-build44-label-production-reuse', packaging_label_production_gate: 'scripts/current_packaging_label_production_gate.py', packaging_label_production_request_time_ddl: 0,
      grey_hair_media_intelligence_authority: 'release467-build45-grey-hair-media-intelligence', grey_hair_media_intelligence_gate: 'scripts/current_grey_hair_media_intelligence_gate.py', grey_hair_media_intelligence_request_time_ddl: 0,
      grey_hair_sync_alignment_authority: 'release467-build46-four-camera-sync-audio-alignment', grey_hair_sync_alignment_gate: 'scripts/current_grey_hair_sync_alignment_gate.py', grey_hair_sync_alignment_request_time_ddl: 0,
      grey_hair_story_edit_planning_authority: 'release467-build47-ai-story-edit-planning', grey_hair_story_edit_planning_gate: 'scripts/current_grey_hair_story_edit_planning_gate.py', grey_hair_story_edit_planning_request_time_ddl: 0,
      grey_hair_production_acceptance_authority: 'release467-build48-automated-production-acceptance', grey_hair_production_acceptance_gate: 'scripts/current_grey_hair_production_acceptance_gate.py', grey_hair_production_acceptance_request_time_ddl: 0,
      authority_restart_integrity_authority: 'release467-build49-current-authority-convergence-restart-integrity', authority_restart_integrity_gate: 'scripts/current_authority_restart_integrity_gate.py', authority_restart_integrity_request_time_ddl: 0,
      runtime_schema_residue_files_ceiling: 58, runtime_schema_residue_occurrences_ceiling: 522, runtime_schema_residue_shared_helpers_ceiling: 2, raw_d1_bypass_with_ddl_ceiling: 0,
      canonical_migration_authority: 'migrations/canonical/manifest.json + scripts/d1_migrate.py', request_time_schema_mutation: false,
    },
    development: { ...DEVELOPMENT, runtime_source_sha: runtimeSha, runtime_host: runtimeHost, exact_runtime_sha_available: Boolean(runtimeSha), accepted_implementation: ACCEPTED_DEVELOPMENT, last_fully_verified: VERIFIED_DEVELOPMENT },
    readiness: base.readiness || {},
    headline_metrics: { readiness_score: Number(base.readiness?.score || 0), readiness_state: clean(base.readiness?.overall) || 'unknown', launch_state: clean(base.readiness?.launch_state) || 'UNKNOWN', blocking_actions: red, attention_actions: amber, root_admin_full_manage: admin.root_admin_full_manage === true, active_profiles: Number(admin.active_profile_count || 0), active_admins: Number(admin.active_admin_count || 0), enabled_modules: Number(admin.enabled_modules || 0), d1_tables: Number(database.tables || 0), canonical_migrations: Number(database.canonical_migrations || 0), migration_proofs: Number(database.migration_proofs || 0), foreign_key_violations: Number(database.foreign_key_violations || 0) },
    external_policy: EXTERNAL_POLICY, recovery_queue: queue, next_action: queue[0] || null, subsystems, sanitized_configuration: base.sanitized_configuration || {},
    source_preflight_engine: { release: Number(base.release || 0), build: Number(base.build || 0), authority: clean(base.authority), role: 'RETAINED_READ_ONLY_PREFLIGHT_ENGINE' },
    truth_notes: [
      'Build 49 implementation acceptance is dev 7bbfbf10a531898052771d9db1cfbb1a9e7d893a / tree 7a74af809182a0eb6befb56e34d2869b44090c6e with System 33928678750, Quality 33928678778, I.T. 33928678807 and Hygiene 33928678789 successful plus exact Preview acceptance.',
      'Build 48 remains the last fully verified restart checkpoint at dev 3980661045c68f55fa64e66e6414055ee0d359f6 / tree 66e5e0a088d6eb9f4f85f70791de8925ac40adb0 with System 33925647553, Quality 33925647532, I.T. 33925647561 and Hygiene 33925647559 until the Build 49 closure merged head completes its external exact-head cycle.',
      'Build 49 formalizes a finite restart protocol: a closure candidate never self-claims post-commit workflow evidence, and the next build ingests the preceding externally verified final closure before source mutation.',
      'Build 49 adds no schema, canonical migration, request-time DDL, D1/R2 business-data mutation, provider/render/publication execution, Cloudflare Access mutation, main mutation or application Production promotion.',
      'The canonical D1 stream remains exactly four files and request-time schema DDL remains zero for Builds 38-49 protected current authorities.',
      'Deployment Preflight and Reliability remain read-only current projections; Build 37 and Build 36 remain historical feature evidence.',
      'Production promotion still requires the exact current Development tree plus successful System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene proofs.',
      'Build 32 remains the independently verified Production-green baseline until a deliberate Production promotion is requested and proven.',
      'External HOLDs never become GREEN by inference from source/deployment acceptance.'
    ],
    safety: { read_only_projection: true, automatic_repair: false, schema_change_required: false, request_time_schema_mutation: false, d1_mutation_from_endpoint: false, r2_mutation_from_endpoint: false, provider_execution: false, provider_publication: false, cloudflare_access_policy_mutation: false, main_mutation: false, production_mutation: false, secret_values_emitted: false },
    generated_at: new Date().toISOString(),
  }, 200, { 'Cache-Control': 'no-store' });
}
