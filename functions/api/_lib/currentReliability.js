// Release 467 Build 89 — current read-only reliability projection.
// Build 88 is the last fully verified Development + Production checkpoint; Build 89 isolates external acceptance by environment.
import { loadRelease466Reliability } from './release466Reliability.js';

export const CURRENT_RELIABILITY_RELEASE = 467;
export const CURRENT_RELIABILITY_BUILD = 89;
export const CURRENT_RELIABILITY_TITLE = 'External Acceptance Environment Isolation & Guided Recovery';
export const CURRENT_RELIABILITY_AUTHORITY = 'current-development-authority.json';
export const ACCEPTED_DEVELOPMENT = Object.freeze({
  release: 467, build: 88, title: 'External Acceptance Control Center Convergence',
  accepted_dev_sha: '9c6d56b887b2aa4bb710e5980608b8942830034c',
  accepted_dev_tree_sha: '9f7d279ed5c83795682ba763ca150f1fe91a6019',
  system_gate_run: 34423493650, current_application_quality_run: 34423493830,
  it_admin_runtime_proof_run: 34423493747, branch_hygiene_run: 34423493617,
  exact_preview_deployment: true, role: 'LAST_FULLY_VERIFIED_RESTART_CHECKPOINT'
});
export const LAST_FULLY_VERIFIED_DEVELOPMENT = Object.freeze({
  release: 467, build: 88, title: 'External Acceptance Control Center Convergence',
  dev_sha: '9c6d56b887b2aa4bb710e5980608b8942830034c',
  tree_sha: '9f7d279ed5c83795682ba763ca150f1fe91a6019',
  system_gate_run: 34423493650, current_application_quality_run: 34423493830,
  it_admin_runtime_proof_run: 34423493747, branch_hygiene_run: 34423493617,
  proof_state: 'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN'
});
export const CURRENT_PRODUCTION = Object.freeze({
  release: 467, build: 88, title: 'External Acceptance Control Center Convergence',
  main_sha: '9c6d56b887b2aa4bb710e5980608b8942830034c',
  tree_sha: '9f7d279ed5c83795682ba763ca150f1fe91a6019',
  production_pages_deploy_run: 34423649786,
  production_live_resource_integrity_run: 34423737422,
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
      current_surface_build: 89,
      inherited_engine: 'functions/api/_lib/release466Reliability.js',
      inherited_engine_role: 'HISTORICAL_REGRESSION_COMPATIBILITY',
      historical_feature_authority: 'release467-build36-current-reliability-operational-health.json',
      current_operator_authority: 'current-development-authority.json',
      accepted_development: ACCEPTED_DEVELOPMENT,
      last_fully_verified_development: LAST_FULLY_VERIFIED_DEVELOPMENT,
      current_production: CURRENT_PRODUCTION,
      implementation_acceptance_is_distinct_from_final_closure: true,
      closure_candidate_requires_external_exact_head_proof: true,
      build88_external_acceptance_control_center_development_and_production_green: true,
      build89_external_acceptance_environment_isolation_candidate: true,
      build89_read_only_reliability_projection: true,
      build89_automatic_provider_execution: false,
      production_baseline_build: 88
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
