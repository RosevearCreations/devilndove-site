// Release 467 Build 61 — current read-only reliability projection.
// Build 61 exposes Build 60 as the last fully verified Development + Production checkpoint
// while the Production live-resource validation harness is repaired and strengthened.
import { loadRelease466Reliability } from './release466Reliability.js';

export const CURRENT_RELIABILITY_RELEASE = 467;
export const CURRENT_RELIABILITY_BUILD = 61;
export const CURRENT_RELIABILITY_TITLE = 'Production Live Resource Proof Repair';
export const CURRENT_RELIABILITY_AUTHORITY = 'current-development-authority.json';
export const ACCEPTED_DEVELOPMENT = Object.freeze({
  release: 467,
  build: 61,
  title: CURRENT_RELIABILITY_TITLE,
  accepted_dev_sha: '2f099d88b39a35a3bb8cf73798ba2c30b2b82083',
  accepted_dev_tree_sha: '66bbd5b61e815b2bd9f2483eaa5161542c177e9a',
  system_gate_run: 33972673238,
  current_application_quality_run: 33972673246,
  it_admin_runtime_proof_run: 33972673266,
  branch_hygiene_run: 33972673254,
  exact_preview_deployment: true,
  role: 'PRODUCTION_LIVE_RESOURCE_PROOF_REPAIR_CANDIDATE_BASE',
});
export const LAST_FULLY_VERIFIED_DEVELOPMENT = Object.freeze({
  release: 467,
  build: 60,
  title: 'Production Resource Binding & Account/Auth Recovery',
  dev_sha: '2f099d88b39a35a3bb8cf73798ba2c30b2b82083',
  tree_sha: '66bbd5b61e815b2bd9f2483eaa5161542c177e9a',
  system_gate_run: 33972673238,
  current_application_quality_run: 33972673246,
  it_admin_runtime_proof_run: 33972673266,
  branch_hygiene_run: 33972673254,
  proof_state: 'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN',
});
export const CURRENT_PRODUCTION = Object.freeze({
  release: 467,
  build: 60,
  title: 'Production Resource Binding & Account/Auth Recovery',
  main_sha: '732bac55a4a43434a31090bb3b9c6b7b2c5a7939',
  tree_sha: '66bbd5b61e815b2bd9f2483eaa5161542c177e9a',
  production_pages_deploy_run: 33972781588,
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
      build58_account_administration_json_response_hardening_development_green: true,
      build59_storefront_media_availability_merchandising_recovery_development_and_production_green: true,
      build60_production_resource_binding_account_auth_recovery_development_and_production_green: true,
      build61_production_live_resource_proof_repair_candidate: true,
      production_baseline_build: 60,
      production_live_resource_integrity_prior_run: 33972823412,
      production_live_resource_prior_run_classification: 'HARNESS_FAILED_BEFORE_RESOURCE_ASSERTIONS',
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
