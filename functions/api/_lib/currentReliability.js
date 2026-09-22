// Release 467 Build 232 — current read-only prototype-to-run pilot over exact Build 231 GREEN predecessor.
import { loadRelease466Reliability } from './release466Reliability.js';

export const CURRENT_RELIABILITY_RELEASE=467;
export const CURRENT_RELIABILITY_BUILD=232;
export const CURRENT_RELIABILITY_TITLE='Manufacturing Outcomes Review & Roadmap Renewal';
export const CURRENT_RELIABILITY_AUTHORITY='current-development-authority.json';
export const CURRENT_READ_ONLY='CURRENT_READ_ONLY';
export const ACCEPTED_DEVELOPMENT=Object.freeze({
  release:467,build:231,title:'Workshop Journal & Capability Case-Study Activation',
  dev_sha:'fc65e05083e7dcf52d50a392d650d937988db0b6',tree_sha:'afc367962b2163105a73c60a1bb14fd06744218e',
  system_gate_run:35685100622,current_application_quality_run:35685100552,it_admin_runtime_proof_run:35685100662,
  branch_hygiene_run:35685100555,build_specific_proof_run:35685100623,exact_preview_deployment:true,
  role:'LAST_FULLY_VERIFIED_RESTART_CHECKPOINT'
});
export const LAST_FULLY_VERIFIED_DEVELOPMENT=Object.freeze({
  release:467,build:231,title:'Workshop Journal & Capability Case-Study Activation',state:'DEVELOPMENT_GREEN',
  dev_sha:'fc65e05083e7dcf52d50a392d650d937988db0b6',tree_sha:'afc367962b2163105a73c60a1bb14fd06744218e',
  system_gate_run:35685100622,current_application_quality_run:35685100552,it_admin_runtime_proof_run:35685100662,
  branch_hygiene_run:35685100555,build_specific_proof_run:35685100623,proof_state:'EXACT_BRANCH_HEAD_GREEN'
});
export const CURRENT_PRODUCTION=Object.freeze({
  release:467,build:231,title:'Workshop Journal & Capability Case-Study Activation',state:'PRODUCTION_GREEN',
  main_sha:'99af873897334e8eb3b382c898a687bcbe06819a',tree_sha:'afc367962b2163105a73c60a1bb14fd06744218e',
  production_pages_deploy_run:35685413652,production_live_resource_integrity_run:35685469887,
  products_browser_proof_run:35685469957,products_route_proof_run:35685469861,build_specific_proof_run:35685413673,remote_d1_queries:0
});
export const PRODUCTION_PROOF_TRANSPORT_POLICY=Object.freeze({
  max_attempts:3,retry_http_statuses:[408,425,429,500,502,503,504],
  retry_exceptions:['urllib.error.URLError','ConnectionResetError','TimeoutError'],
  permanent_4xx_fail_closed:true,resource_correctness_fail_closed:true,
  workflow:'.github/workflows/production-live-resource-integrity-proof.yml'
});

export async function loadCurrentReliability(db,env={}){
  const inherited=await loadRelease466Reliability(db,env);
  return {
    release:467,build:232,title:CURRENT_RELIABILITY_TITLE,authority:CURRENT_RELIABILITY_AUTHORITY,state:CURRENT_READ_ONLY,
    environment:inherited.environment,score:inherited.score,status:inherited.status,scope:inherited.scope,slo_targets:inherited.slo_targets,
    checks:inherited.checks,migrations:inherited.migrations,runtime_incidents:inherited.runtime_incidents,
    foreign_key_violations:inherited.foreign_key_violations,resources:inherited.resources,
    governance:{...inherited.governance,current_release_authority:'current-development-authority.json',production_promotion_proof_count:4,production_closure_proof_count:6,rollback_readiness:'release-neutral-read-only',restart_integrity_protocol:'EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1'},
    recovery:inherited.recovery,drift:inherited.drift,
    provenance:{
      current_surface_release:467,current_surface_build:232,inherited_engine:'functions/api/_lib/release466Reliability.js',inherited_engine_role:'HISTORICAL_REGRESSION_COMPATIBILITY',
      historical_feature_authority:'release467-build36-current-reliability-operational-health.json',current_operator_authority:'current-development-authority.json',
      accepted_development:ACCEPTED_DEVELOPMENT,last_fully_verified_development:LAST_FULLY_VERIFIED_DEVELOPMENT,current_production:CURRENT_PRODUCTION,
      production_proof_transport_policy:PRODUCTION_PROOF_TRANSPORT_POLICY,implementation_acceptance_is_distinct_from_final_closure:true,
      closure_candidate_requires_external_exact_head_proof:true,build231_public_story_activation_production_green:true,build231_business_exit:'HOLD_NO_PUBLISHABLE_EVIDENCE',
      build232_manufacturing_outcomes_candidate:true,build231_schema_migration_added:false,build231_automatic_publication:false,
      successor_builds_planned:'Build 232 measurement then evidence-derived decision',production_baseline_build:231
    },
    safety:{...inherited.safety,mutation_capability:'none',request_time_schema_mutation:false,d1_business_data_mutation:false,r2_mutation:false,binding_mutation:false,server_persistence:false,automatic_business_action:false,accounting_posting:false,period_close:false,inventory_mutation:false,creative_mutation:false,price_mutation:false,provider_execution:false,provider_publication:false,marketplace_publication:false,social_publication:false,backup_restore_execution:false,production_mutation:false,secrets_exposed:false}
  };
}
