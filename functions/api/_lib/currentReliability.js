// Release 467 Build 155 — current read-only reliability projection over the exact Build 154 baseline.
import { loadRelease466Reliability } from './release466Reliability.js';
export const CURRENT_RELIABILITY_RELEASE=467;
export const CURRENT_RELIABILITY_BUILD=154;
export const CURRENT_RELIABILITY_TITLE='Products Worker Resource Hotfix';
export const CURRENT_RELIABILITY_AUTHORITY='current-development-authority.json';
export const CURRENT_READ_ONLY='CURRENT_READ_ONLY';
export const ACCEPTED_DEVELOPMENT=Object.freeze({release:467,build:154,title:'Products Worker Resource Hotfix',accepted_dev_sha:'fc74ea680c0eee221722ce1ede6cb7990b92551f',accepted_dev_tree_sha:'36e466d2d971ac7c80f183c3b9b42a0ff56597d9',system_gate_run:34867834161,current_application_quality_run:34867834181,it_admin_runtime_proof_run:34867834020,branch_hygiene_run:34867834038,exact_preview_deployment:true,role:'LAST_FULLY_VERIFIED_RESTART_CHECKPOINT'});
export const LAST_FULLY_VERIFIED_DEVELOPMENT=Object.freeze({release:467,build:154,title:'Products Worker Resource Hotfix',dev_sha:'fc74ea680c0eee221722ce1ede6cb7990b92551f',tree_sha:'36e466d2d971ac7c80f183c3b9b42a0ff56597d9',system_gate_run:34867834161,current_application_quality_run:34867834181,it_admin_runtime_proof_run:34867834020,branch_hygiene_run:34867834038,proof_state:'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN'});
export const CURRENT_PRODUCTION=Object.freeze({release:467,build:154,title:'Products Worker Resource Hotfix',main_sha:'cc50c65c7d4ecbb75e9744a57a14be7da4aba873',tree_sha:'36e466d2d971ac7c80f183c3b9b42a0ff56597d9',production_pages_deploy_run:34868084233,production_live_resource_integrity_run:34868183267,products_route_production_proof_run:34868183338,state:'PRODUCTION_GREEN',client_ui_incident_state:'OPEN_BUILD155_PRODUCTS_RESPONSIVENESS',client_ui_usability_proven:false});
export const PRODUCTION_PROOF_TRANSPORT_POLICY=Object.freeze({max_attempts:3,retry_http_statuses:[408,425,429,500,502,503,504],retry_exceptions:['urllib.error.URLError','ConnectionResetError','TimeoutError'],permanent_4xx_fail_closed:true,resource_correctness_fail_closed:true,workflow:'.github/workflows/production-live-resource-integrity-proof.yml'});
export async function loadCurrentReliability(db,env={}){
  const inherited=await loadRelease466Reliability(db,env);
  return {
    release:467,build:154,title:CURRENT_RELIABILITY_TITLE,authority:CURRENT_RELIABILITY_AUTHORITY,state:CURRENT_READ_ONLY,
    environment:inherited.environment,score:inherited.score,status:inherited.status,scope:inherited.scope,slo_targets:inherited.slo_targets,
    checks:inherited.checks,migrations:inherited.migrations,runtime_incidents:inherited.runtime_incidents,foreign_key_violations:inherited.foreign_key_violations,resources:inherited.resources,
    governance:{...inherited.governance,current_release_authority:'current-development-authority.json',production_promotion_proof_count:4,production_closure_proof_count:7,rollback_readiness:'release-neutral-read-only',restart_integrity_protocol:'EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1'},
    recovery:inherited.recovery,drift:inherited.drift,
    provenance:{current_surface_release:467,current_surface_build:154,inherited_engine:'functions/api/_lib/release466Reliability.js',inherited_engine_role:'HISTORICAL_REGRESSION_COMPATIBILITY',historical_feature_authority:'release467-build36-current-reliability-operational-health.json',current_operator_authority:'current-development-authority.json',accepted_development:ACCEPTED_DEVELOPMENT,last_fully_verified_development:LAST_FULLY_VERIFIED_DEVELOPMENT,current_production:CURRENT_PRODUCTION,production_proof_transport_policy:PRODUCTION_PROOF_TRANSPORT_POLICY,implementation_acceptance_is_distinct_from_final_closure:true,closure_candidate_requires_external_exact_head_proof:true,build154_server_route_green:true,build155_products_client_responsiveness_candidate:true,build155_real_browser_proof_required:true,production_baseline_build:154},
    safety:{...inherited.safety,mutation_capability:'none',request_time_schema_mutation:false,d1_business_data_mutation:false,r2_mutation:false,binding_mutation:false,server_persistence:false,automatic_business_action:false,accounting_posting:false,period_close:false,inventory_mutation:false,creative_mutation:false,price_mutation:false,provider_execution:false,provider_publication:false,marketplace_publication:false,social_publication:false,backup_restore_execution:false,production_mutation:false,secrets_exposed:false}
  };
}
