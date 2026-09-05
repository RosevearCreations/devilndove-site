// Release 467 Build 53 — current read-only reliability projection.
// Implementation acceptance is distinct from the last externally verified closure.
// Historical Release 466 reliability logic remains a retained regression engine only.
import { loadRelease466Reliability } from './release466Reliability.js';

export const CURRENT_RELIABILITY_RELEASE = 467;
export const CURRENT_RELIABILITY_BUILD = 53;
export const CURRENT_RELIABILITY_TITLE = 'Generated Deliverable Review-State Convergence';
export const CURRENT_RELIABILITY_AUTHORITY = 'current-development-authority.json';
export const ACCEPTED_DEVELOPMENT = Object.freeze({
  release: 467,
  build: 53,
  title: CURRENT_RELIABILITY_TITLE,
  accepted_dev_sha: '4ba42dba64c4d1ca46cd145add24128ab3f17be4',
  accepted_dev_tree_sha: '2fed089e03b4c545aaa330e7767a8e9a127dc58d',
  system_gate_run: 33933835769,
  current_application_quality_run: 33933835712,
  it_admin_runtime_proof_run: 33933835781,
  branch_hygiene_run: 33933835787,
  exact_preview_deployment: true,
  role: 'IMPLEMENTATION_ACCEPTANCE',
});
export const LAST_FULLY_VERIFIED_DEVELOPMENT = Object.freeze({
  release: 467,
  build: 52,
  title: 'Content Studio Render Readiness / Explicit Execution Boundary',
  dev_sha: '33ead64048edf0b089b49c4a02783f468dc806a5',
  tree_sha: '8c25dfedc31bd27cb7b79429c15b669830e176f8',
  system_gate_run: 33933307193,
  current_application_quality_run: 33933307182,
  it_admin_runtime_proof_run: 33933307188,
  branch_hygiene_run: 33933307190,
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
      build53_generated_review_state_convergence: true,
      build53_generated_ready_for_render: false,
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
