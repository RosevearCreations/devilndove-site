// Release 467 Build 153 — current read-only reliability projection.
import { loadRelease466Reliability } from './release466Reliability.js';
export const CURRENT_RELIABILITY_RELEASE=467;
export const CURRENT_RELIABILITY_BUILD=153;
export const CURRENT_RELIABILITY_TITLE='Layout Observer Performance Hotfix';
export const CURRENT_RELIABILITY_AUTHORITY='current-development-authority.json';
export const CURRENT_READ_ONLY='CURRENT_READ_ONLY';
export const ACCEPTED_DEVELOPMENT=Object.freeze({release:467,build:153,title:'Layout Observer Performance Hotfix',accepted_dev_sha:'b8323b4e13ae08a8126da761106367de75f7cd40',accepted_dev_tree_sha:'a3d0225c579953d5572dc99313661c2981c42510',system_gate_run:34863777573,current_application_quality_run:34863777529,it_admin_runtime_proof_run:34863777559,branch_hygiene_run:34863777543,exact_preview_deployment:true,role:'LAST_FULLY_VERIFIED_RESTART_CHECKPOINT'});
export const LAST_FULLY_VERIFIED_DEVELOPMENT=Object.freeze({release:467,build:153,title:'Layout Observer Performance Hotfix',dev_sha:'b8323b4e13ae08a8126da761106367de75f7cd40',tree_sha:'a3d0225c579953d5572dc99313661c2981c42510',system_gate_run:34863777573,current_application_quality_run:34863777529,it_admin_runtime_proof_run:34863777559,branch_hygiene_run:34863777543,proof_state:'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN'});
export const CURRENT_PRODUCTION=Object.freeze({release:467,build:153,title:'Layout Observer Performance Hotfix',main_sha:'ba8b3c2406335391334b2a74a89e5819236c770b',tree_sha:'a3d0225c579953d5572dc99313661c2981c42510',production_pages_deploy_run:34864015766,production_live_resource_integrity_run:34864113781,state:'PRODUCTION_GREEN',post_closure_incident:'Build 154 addresses /admin/products/ HTTP 503 / Cloudflare Error 1102 observed 2026-09-14T15:48:10Z.'});
export const PRODUCTION_PROOF_TRANSPORT_POLICY=Object.freeze({max_attempts:3,retry_http_statuses:[408,425,429,500,502,503,504],retry_exceptions:['urllib.error.URLError','ConnectionResetError','TimeoutError'],permanent_4xx_fail_closed:true,resource_correctness_fail_closed:true,workflow:'.github/workflows/production-live-resource-integrity-proof.yml'});
export async function loadCurrentReliability(db,env={}){
  const inherited=await loadRelease466Reliability(db,env);
  return {
    release:467,build:153,title:CURRENT_RELIABILITY_TITLE,authority:CURRENT_RELIABILITY_AUTHORITY,state:CURRENT_READ_ONLY,
    environment:inherited.environment,score:inherited.score,status:inherited.status,scope:inherited.scope,slo_targets:inherited.slo_targets,
    checks:inherited.checks,migrations:inherited.migrations,runtime_incidents:inherited.runtime_incidents,foreign_key_violations:inherited.foreign_key_violations,resources:inherited.resources,
    governance:{...inherited.governance,current_release_authority:'current-development-authority.json',production_promotion_proof_count:4,production_closure_proof_count:6,rollback_readiness:'release-neutral-read-only',restart_integrity_protocol:'EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1'},
    recovery:inherited.recovery,drift:inherited.drift,
    provenance:{current_surface_release:467,current_surface_build:153,inherited_engine:'functions/api/_lib/release466Reliability.js',inherited_engine_role:'HISTORICAL_REGRESSION_COMPATIBILITY',historical_feature_authority:'release467-build36-current-reliability-operational-health.json',current_operator_authority:'current-development-authority.json',accepted_development:ACCEPTED_DEVELOPMENT,last_fully_verified_development:LAST_FULLY_VERIFIED_DEVELOPMENT,current_production:CURRENT_PRODUCTION,production_proof_transport_policy:PRODUCTION_PROOF_TRANSPORT_POLICY,implementation_acceptance_is_distinct_from_final_closure:true,closure_candidate_requires_external_exact_head_proof:true,build153_development_and_production_green:true,build154_products_worker_resource_candidate:true,build154_products_route_specific_proof_required:true,production_baseline_build:153},
    safety:{...inherited.safety,mutation_capability:'none',request_time_schema_mutation:false,d1_business_data_mutation:false,r2_mutation:false,binding_mutation:false,server_persistence:false,automatic_business_action:false,accounting_posting:false,period_close:false,inventory_mutation:false,creative_mutation:false,price_mutation:false,provider_execution:false,provider_publication:false,marketplace_publication:false,social_publication:false,backup_restore_execution:false,production_mutation:false,secrets_exposed:false}
  };
}
