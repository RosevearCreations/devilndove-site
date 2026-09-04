// Release 467 Build 48 — current read-only reliability projection.
// Build 49 restart-integrity convergence keeps implementation acceptance separate
// from the later exact branch-head closure proof.
// Historical Release 466 reliability logic remains a retained regression engine only.
import { loadRelease466Reliability } from './release466Reliability.js';

export const CURRENT_RELIABILITY_RELEASE = 467;
export const CURRENT_RELIABILITY_BUILD = 48;
export const CURRENT_RELIABILITY_TITLE = 'Automated Production Acceptance';
export const CURRENT_RELIABILITY_AUTHORITY = 'current-development-authority.json';
export const LAST_FULLY_VERIFIED_DEVELOPMENT = Object.freeze({
  release: 467,
  build: 48,
  title: 'Automated Production Acceptance',
  dev_sha: '3980661045c68f55fa64e66e6414055ee0d359f6',
  tree_sha: '66e5e0a088d6eb9f4f85f70791de8925ac40adb0',
  system_gate_run: 33925647553,
  current_application_quality_run: 33925647532,
  it_admin_runtime_proof_run: 33925647561,
  branch_hygiene_run: 33925647559,
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
      last_fully_verified_development: LAST_FULLY_VERIFIED_DEVELOPMENT,
      implementation_acceptance_is_distinct_from_final_closure: true,
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
