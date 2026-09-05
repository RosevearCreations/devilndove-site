// Release 467 Build 51 — current read-only reliability projection.
// Implementation acceptance is distinct from the last externally verified closure.
// Historical Release 466 reliability logic remains a retained regression engine only.
import { loadRelease466Reliability } from './release466Reliability.js';

export const CURRENT_RELIABILITY_RELEASE = 467;
export const CURRENT_RELIABILITY_BUILD = 51;
export const CURRENT_RELIABILITY_TITLE = 'Explicit Content Studio Schema Readiness';
export const CURRENT_RELIABILITY_AUTHORITY = 'current-development-authority.json';
export const ACCEPTED_DEVELOPMENT = Object.freeze({
  release: 467,
  build: 51,
  title: CURRENT_RELIABILITY_TITLE,
  accepted_dev_sha: 'd62273bd57e0d542a3746b65b9b2ba03b1c8c0f0',
  accepted_dev_tree_sha: 'a5fc48a4b21441dee7e81ecf4685cbad7cc236a6',
  system_gate_run: 33931737250,
  current_application_quality_run: 33931737252,
  it_admin_runtime_proof_run: 33931737261,
  branch_hygiene_run: 33931737243,
  exact_preview_deployment: true,
  role: 'IMPLEMENTATION_ACCEPTANCE',
});
export const LAST_FULLY_VERIFIED_DEVELOPMENT = Object.freeze({
  release: 467,
  build: 50,
  title: 'Reviewed CAIP to Content Studio Handoff',
  dev_sha: 'd14e41cf4c1b0c12ce597f6fe3ab05d74901a0fa',
  tree_sha: 'c01d433a0434e893a8b21d9ffded8587732f9a32',
  system_gate_run: 33931172444,
  current_application_quality_run: 33931172515,
  it_admin_runtime_proof_run: 33931172403,
  branch_hygiene_run: 33931172411,
  proof_state: 'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN',
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
      restart_integrity_protocol: 'EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1',
    },
    recovery: inherited.recovery,
    drift: inherited.drift,
    provenance: {
      current_surface_release: CURRENT_RELIABILITY_RELEASE,
      current_surface_build: CURRENT_RELIABILITY_BUILD,
      inherited_engine: 'functions/api/_lib/release466Reliability.js',
      inherited_engine_role: 'HISTORICAL_REGRESSION_COMPATIBILITY',
      historical_feature_authority: 'release467-build36-current-reliability-operational-health.json',
      current_operator_authority: 'current-development-authority.json',
      accepted_development: ACCEPTED_DEVELOPMENT,
      last_fully_verified_development: LAST_FULLY_VERIFIED_DEVELOPMENT,
      implementation_acceptance_is_distinct_from_final_closure: true,
      closure_candidate_requires_external_exact_head_proof: true,
      production_baseline_build: 32,
    },
    safety: {
      ...inherited.safety,
      mutation_capability: 'none',
      request_time_schema_mutation: false,
      d1_business_data_mutation: false,
      r2_mutation: false,
      provider_execution: false,
      provider_publication: false,
      production_mutation: false,
      secrets_exposed: false,
    },
  };
}
