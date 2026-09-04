// Release 467 Build 50 — current read-only reliability projection.
// Implementation acceptance is distinct from the last externally verified closure.
// Historical Release 466 reliability logic remains a retained regression engine only.
import { loadRelease466Reliability } from './release466Reliability.js';

export const CURRENT_RELIABILITY_RELEASE = 467;
export const CURRENT_RELIABILITY_BUILD = 50;
export const CURRENT_RELIABILITY_TITLE = 'Reviewed CAIP to Content Studio Handoff';
export const CURRENT_RELIABILITY_AUTHORITY = 'current-development-authority.json';
export const ACCEPTED_DEVELOPMENT = Object.freeze({
  release: 467,
  build: 50,
  title: CURRENT_RELIABILITY_TITLE,
  accepted_dev_sha: 'dddd7c9423132dd22b179348a5644362f7b9f46c',
  accepted_dev_tree_sha: '1d5d4859c55fae404a79eb8cef85e1e0d3f30826',
  system_gate_run: 33930359847,
  current_application_quality_run: 33930359835,
  it_admin_runtime_proof_run: 33930359865,
  branch_hygiene_run: 33930359956,
  exact_preview_deployment: true,
  role: 'IMPLEMENTATION_ACCEPTANCE',
});
export const LAST_FULLY_VERIFIED_DEVELOPMENT = Object.freeze({
  release: 467,
  build: 49,
  title: 'Current Authority Convergence & Restart Integrity',
  dev_sha: '28307cd8939329db05dab61c336d0c7a49f8759e',
  tree_sha: '0120c5ca4ccaabb00f3f4ef6f685ae0f8fabcaf7',
  system_gate_run: 33929301077,
  current_application_quality_run: 33929301018,
  it_admin_runtime_proof_run: 33929301051,
  branch_hygiene_run: 33929300999,
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
