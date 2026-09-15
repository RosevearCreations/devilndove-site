// Release 467 Build 156 — current read-only reliability projection over the exact Build 155 baseline.
import { loadRelease466Reliability } from './release466Reliability.js';
export const CURRENT_RELIABILITY_RELEASE=467;
export const CURRENT_RELIABILITY_BUILD=156;
export const CURRENT_RELIABILITY_TITLE='Tool & Supply Process Assignment';
export const CURRENT_RELIABILITY_AUTHORITY='current-development-authority.json';
export const CURRENT_READ_ONLY='CURRENT_READ_ONLY';
export const ACCEPTED_DEVELOPMENT=Object.freeze({release:467,build:155,title:'Products Client Responsiveness Hotfix',accepted_dev_sha:'4e9efa2daf8f541e941c350ccde77798b5c99080',accepted_dev_tree_sha:'3f08dc3dfde778ddca0ca5fd328e7d45a1fcee9e',system_gate_run:34915558746,current_application_quality_run:34915558747,it_admin_runtime_proof_run:34915558751,branch_hygiene_run:34915558771,exact_preview_deployment:true,role:'LAST_FULLY_VERIFIED_RESTART_CHECKPOINT'});
export const LAST_FULLY_VERIFIED_DEVELOPMENT=Object.freeze({release:467,build:155,title:'Products Client Responsiveness Hotfix',dev_sha:'4e9efa2daf8f541e941c350ccde77798b5c99080',tree_sha:'3f08dc3dfde778ddca0ca5fd328e7d45a1fcee9e',system_gate_run:34915558746,current_application_quality_run:34915558747,it_admin_runtime_proof_run:34915558751,branch_hygiene_run:34915558771,proof_state:'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN'});
export const CURRENT_PRODUCTION=Object.freeze({release:467,build:155,title:'Products Client Responsiveness Hotfix',main_sha:'4e9efa2daf8f541e941c350ccde77798b5c99080',tree_sha:'3f08dc3dfde778ddca0ca5fd328e7d45a1fcee9e',production_pages_deploy_run:34915729378,production_live_resource_integrity_run:34915877580,products_production_browser_proof_run:34915877555,products_route_production_proof_run:34915877617,state:'PRODUCTION_GREEN',client_ui_incident_state:'CLOSED_BUILD155_PRODUCTS_RESPONSIVENESS',client_ui_usability_proven:true});
export const PRODUCTION_PROOF_TRANSPORT_POLICY=Object.freeze({max_attempts:3,retry_http_statuses:[408,425,429,500,502,503,504],retry_exceptions:['urllib.error.URLError','ConnectionResetError','TimeoutError'],permanent_4xx_fail_closed:true,resource_correctness_fail_closed:true,workflow:'.github/workflows/production-live-resource-integrity-proof.yml'});
export async function loadCurrentReliability(db,env={}){
  const inherited=await loadRelease466Reliability(db,env);
  return {
    release:467,build:156,title:CURRENT_RELIABILITY_TITLE,authority:CURRENT_RELIABILITY_AUTHORITY,state:CURRENT_READ_ONLY,
    environment:inherited.environment,score:inherited.score,status:inherited.status,scope:inherited.scope,slo_targets:inherited.slo_targets,
    checks:inherited.checks,migrations:inherited.migrations,runtime_incidents:inherited.runtime_incidents,foreign_key_violations:inherited.foreign_key_violations,resources:inherited.resources,
    governance:{...inherited.governance,current_release_authority:'current-development-authority.json',production_promotion_proof_count:4,production_closure_proof_count:7,rollback_readiness:'release-neutral-read-only',restart_integrity_protocol:'EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1'},
    recovery:inherited.recovery,drift:inherited.drift,
    provenance:{current_surface_release:467,current_surface_build:156,inherited_engine:'functions/api/_lib/release466Reliability.js',inherited_engine_role:'HISTORICAL_REGRESSION_COMPATIBILITY',historical_feature_authority:'release467-build36-current-reliability-operational-health.json',current_operator_authority:'current-development-authority.json',accepted_development:ACCEPTED_DEVELOPMENT,last_fully_verified_development:LAST_FULLY_VERIFIED_DEVELOPMENT,current_production:CURRENT_PRODUCTION,production_proof_transport_policy:PRODUCTION_PROOF_TRANSPORT_POLICY,implementation_acceptance_is_distinct_from_final_closure:true,closure_candidate_requires_external_exact_head_proof:true,build155_products_client_responsiveness_green:true,build156_inventory_process_assignment_candidate:true,build156_exact_head_proof_required:true,production_baseline_build:155},
    safety:{...inherited.safety,mutation_capability:'none',request_time_schema_mutation:false,d1_business_data_mutation:false,r2_mutation:false,binding_mutation:false,server_persistence:false,automatic_business_action:false,accounting_posting:false,period_close:false,inventory_mutation:false,creative_mutation:false,price_mutation:false,provider_execution:false,provider_publication:false,marketplace_publication:false,social_publication:false,backup_restore_execution:false,production_mutation:false,secrets_exposed:false}
  };
}
