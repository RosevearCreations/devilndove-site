// Release 467 Build 87 — current read-only reliability projection.
// Build 86 is the last fully verified Development + Production checkpoint; Build 87 converges Production authority and restart truth.
import { loadRelease466Reliability } from './release466Reliability.js';

export const CURRENT_RELIABILITY_RELEASE = 467;
export const CURRENT_RELIABILITY_BUILD = 87;
export const CURRENT_RELIABILITY_TITLE = 'Production Authority & Restart Convergence';
export const CURRENT_RELIABILITY_AUTHORITY = 'current-development-authority.json';
export const ACCEPTED_DEVELOPMENT = Object.freeze({
  release: 467, build: 86, title: 'I.T. Operations & Self-Diagnostics',
  accepted_dev_sha: '5fdbb5346e52f17072671274dc36e4d3527a7905',
  accepted_dev_tree_sha: 'f9037baf12bc3489b3a0df3df03eef5bdbe85e90',
  system_gate_run: 34419070653, current_application_quality_run: 34419070636,
  it_admin_runtime_proof_run: 34419070642, branch_hygiene_run: 34419070660,
  exact_preview_deployment: true, role: 'LAST_FULLY_VERIFIED_RESTART_CHECKPOINT'
});
export const LAST_FULLY_VERIFIED_DEVELOPMENT = Object.freeze({
  release: 467, build: 86, title: 'I.T. Operations & Self-Diagnostics',
  dev_sha: '5fdbb5346e52f17072671274dc36e4d3527a7905',
  tree_sha: 'f9037baf12bc3489b3a0df3df03eef5bdbe85e90',
  system_gate_run: 34419070653, current_application_quality_run: 34419070636,
  it_admin_runtime_proof_run: 34419070642, branch_hygiene_run: 34419070660,
  proof_state: 'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN'
});
export const CURRENT_PRODUCTION = Object.freeze({
  release: 467, build: 86, title: 'I.T. Operations & Self-Diagnostics',
  main_sha: '5fdbb5346e52f17072671274dc36e4d3527a7905',
  tree_sha: 'f9037baf12bc3489b3a0df3df03eef5bdbe85e90',
  production_pages_deploy_run: 34419211512,
  production_live_resource_integrity_run: 34419284027,
  state: 'PRODUCTION_GREEN'
});

export async function loadCurrentReliability(db, env = {}) {
  const inherited = await loadRelease466Reliability(db, env);
  return {
    release: CURRENT_RELIABILITY_RELEASE,
    build: CURRENT_RELIABILITY_BUILD,
    title: CURRENT_RELIABILITY_TITLE,
    authority: CURRENT_RELIABILITY_AUTHORITY,
    state: 'CURRENT_READ_ONLY',
    environment: inherited.environment,
    score: inherited.score,
    status: inherited.status,
    scope: inherited.scope,
    slo_targets: inherited.slo_targets,
    checks: inherited.checks,
    migrations: inherited.migrations,
    runtime_incidents: inherited.runtime_incidents,
    foreign_key_violations: inherited.foreign_key_violations,
    resources: inherited.resources,
    governance: {
      ...inherited.governance,
      current_release_authority: 'current-development-authority.json',
      production_promotion_proof_count: 4,
      rollback_readiness: 'release-neutral-read-only',
      restart_integrity_protocol: 'EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1'
    },
    recovery: inherited.recovery,
    drift: inherited.drift,
    provenance: {
      current_surface_release: 467,
      current_surface_build: 87,
      inherited_engine: 'functions/api/_lib/release466Reliability.js',
      inherited_engine_role: 'HISTORICAL_REGRESSION_COMPATIBILITY',
      historical_feature_authority: 'release467-build36-current-reliability-operational-health.json',
      current_operator_authority: 'current-development-authority.json',
      accepted_development: ACCEPTED_DEVELOPMENT,
      last_fully_verified_development: LAST_FULLY_VERIFIED_DEVELOPMENT,
      current_production: CURRENT_PRODUCTION,
      implementation_acceptance_is_distinct_from_final_closure: true,
      closure_candidate_requires_external_exact_head_proof: true,
      build86_it_operations_self_diagnostics_development_and_production_green: true,
      build87_production_authority_restart_convergence_candidate: true,
      build87_read_only_projection: true,
      build87_automatic_repair: false,
      production_baseline_build: 86
    },
    safety: {
      ...inherited.safety,
      mutation_capability: 'none',
      request_time_schema_mutation: false,
      d1_business_data_mutation: false,
      r2_mutation: false,
      binding_mutation: false,
      provider_execution: false,
      provider_publication: false,
      backup_restore_execution: false,
      production_mutation: false,
      secrets_exposed: false
    }
  };
}
