// Release 467 Build 58 — current read-only reliability projection.
// Build 58 exposes Build 57 as the last fully verified Development checkpoint while
// account-administration JSON response hardening remains the current closure candidate.
// Historical Release 466 reliability logic remains a retained regression engine only.
import { loadRelease466Reliability } from './release466Reliability.js';

export const CURRENT_RELIABILITY_RELEASE = 467;
export const CURRENT_RELIABILITY_BUILD = 58;
export const CURRENT_RELIABILITY_TITLE = 'Account Administration JSON Response Hardening';
export const CURRENT_RELIABILITY_AUTHORITY = 'current-development-authority.json';
export const ACCEPTED_DEVELOPMENT = Object.freeze({
  release: 467,
  build: 58,
  title: CURRENT_RELIABILITY_TITLE,
  accepted_dev_sha: '8dc267594534bc51797f5cf4e59fc6dec6e8d9b6',
  accepted_dev_tree_sha: 'c2f31450d59477fc313c9c0b25637f7bc9bc35e0',
  system_gate_run: 33967307608,
  current_application_quality_run: 33967307714,
  it_admin_runtime_proof_run: 33967307740,
  branch_hygiene_run: 33967307653,
  exact_preview_deployment: true,
  role: 'ACCOUNT_ADMIN_JSON_HARDENING_CANDIDATE_BASE',
});
export const LAST_FULLY_VERIFIED_DEVELOPMENT = Object.freeze({
  release: 467,
  build: 57,
  title: 'Current Authority / Restart Truth Convergence',
  dev_sha: '8dc267594534bc51797f5cf4e59fc6dec6e8d9b6',
  tree_sha: 'c2f31450d59477fc313c9c0b25637f7bc9bc35e0',
  system_gate_run: 33967307608,
  current_application_quality_run: 33967307714,
  it_admin_runtime_proof_run: 33967307740,
  branch_hygiene_run: 33967307653,
  proof_state: 'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN',
});
export const CURRENT_PRODUCTION = Object.freeze({
  release: 467,
  build: 55,
  title: 'Inventory Intelligence Manufacturer-Link Schema Compatibility',
  main_sha: 'ee42e7838a83def94e858b3d0d6c1a23947e2344',
  tree_sha: 'a338071e446f5b18db3f26d8a0c0ca07141cd158',
  production_pages_deploy_run: 33936229477,
  state: 'PRODUCTION_GREEN',
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
      current_production: CURRENT_PRODUCTION,
      implementation_acceptance_is_distinct_from_final_closure: true,
      closure_candidate_requires_external_exact_head_proof: true,
      build52_render_readiness_read_only: true,
      build52_render_job_creation: false,
      build53_generated_review_state_convergence: true,
      build53_generated_ready_for_render: false,
      build55_production_green: true,
      build56_product_photo_packaging_onboarding_development_green: true,
      build57_authority_restart_truth_convergence_development_green: true,
      build58_account_administration_json_response_hardening_candidate: true,
      production_baseline_build: 55,
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
