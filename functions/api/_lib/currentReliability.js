// Release 467 Build 52 — current read-only reliability projection.
// Implementation acceptance is distinct from the last externally verified closure.
// Historical Release 466 reliability logic remains a retained regression engine only.
import { loadRelease466Reliability } from './release466Reliability.js';

export const CURRENT_RELIABILITY_RELEASE = 467;
export const CURRENT_RELIABILITY_BUILD = 52;
export const CURRENT_RELIABILITY_TITLE = 'Content Studio Render Readiness / Explicit Execution Boundary';
export const CURRENT_RELIABILITY_AUTHORITY = 'current-development-authority.json';
export const ACCEPTED_DEVELOPMENT = Object.freeze({
  release: 467,
  build: 52,
  title: CURRENT_RELIABILITY_TITLE,
  accepted_dev_sha: '24f66983bf052280f62d0983f27d9707ef20d8f2',
  accepted_dev_tree_sha: 'de49d1b7ad75a7fbff31749165d93b2f1aba94a9',
  system_gate_run: 33932827712,
  current_application_quality_run: 33932827708,
  it_admin_runtime_proof_run: 33932827704,
  branch_hygiene_run: 33932827696,
  exact_preview_deployment: true,
  role: 'IMPLEMENTATION_ACCEPTANCE',
});
export const LAST_FULLY_VERIFIED_DEVELOPMENT = Object.freeze({
  release: 467,
  build: 51,
  title: 'Explicit Content Studio Schema Readiness',
  dev_sha: '3f5e10f4ad005945ed4092b63079b11f62c4d7ee',
  tree_sha: 'baca33be1a9b0dc888f12c2882f97545faed97a8',
  system_gate_run: 33932323391,
  current_application_quality_run: 33932323375,
  it_admin_runtime_proof_run: 33932323392,
  branch_hygiene_run: 33932323423,
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
      build52_render_readiness_read_only: true,
      build52_render_job_creation: false,
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
