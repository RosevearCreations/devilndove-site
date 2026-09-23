// Release 467 Build 238 — current read-only resume-work refinement over exact Build 234 GREEN predecessor.
import { loadRelease466Reliability } from './release466Reliability.js';

export const CURRENT_RELIABILITY_RELEASE=467;
export const CURRENT_RELIABILITY_BUILD=238;
export const CURRENT_RELIABILITY_TITLE='Attention, Notifications & Operator Signal Cleanup';
export const CURRENT_RELIABILITY_AUTHORITY='current-development-authority.json';
export const CURRENT_READ_ONLY='CURRENT_READ_ONLY';
export const ACCEPTED_DEVELOPMENT=Object.freeze({
  release:467,build:237,title:'Mobile, Touch, Keyboard & Dense-Workspace Ergonomics',
  dev_sha:'06cb191758b204fbbc3912ae533bec6c6fd227ad',tree_sha:'51fc6b9a4c0910f42bbbee9bf7d7a8aa756220b5',
  system_gate_run:35858747170,current_application_quality_run:35858747245,it_admin_runtime_proof_run:35858747280,
  branch_hygiene_run:35858746503,exact_preview_deployment:true,role:'LAST_FULLY_VERIFIED_RESTART_CHECKPOINT'
});
export const LAST_FULLY_VERIFIED_DEVELOPMENT=Object.freeze({
  release:467,build:237,title:'Mobile, Touch, Keyboard & Dense-Workspace Ergonomics',state:'DEVELOPMENT_GREEN',
  dev_sha:'06cb191758b204fbbc3912ae533bec6c6fd227ad',tree_sha:'51fc6b9a4c0910f42bbbee9bf7d7a8aa756220b5',
  system_gate_run:35858747170,current_application_quality_run:35858747245,it_admin_runtime_proof_run:35858747280,
  branch_hygiene_run:35858746503,proof_state:'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN'
});
export const CURRENT_PRODUCTION=Object.freeze({
  release:467,build:237,title:'Mobile, Touch, Keyboard & Dense-Workspace Ergonomics',state:'PRODUCTION_GREEN',
  main_sha:'53c0d8e4ed7cb9ea1691198e25a51f556a2ce0b3',tree_sha:'51fc6b9a4c0910f42bbbee9bf7d7a8aa756220b5',
  production_pages_deploy_run:35858981317,production_live_resource_integrity_run:35859107887,
  products_browser_proof_run:35859108079,products_route_proof_run:35859107986,remote_d1_queries:0
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
    release:467,build:238,title:CURRENT_RELIABILITY_TITLE,authority:CURRENT_RELIABILITY_AUTHORITY,state:CURRENT_READ_ONLY,
    environment:inherited.environment,score:inherited.score,status:inherited.status,scope:inherited.scope,slo_targets:inherited.slo_targets,
    checks:inherited.checks,migrations:inherited.migrations,runtime_incidents:inherited.runtime_incidents,
    foreign_key_violations:inherited.foreign_key_violations,resources:inherited.resources,
    governance:{...inherited.governance,current_release_authority:'current-development-authority.json',production_promotion_proof_count:4,production_closure_proof_count:6,rollback_readiness:'release-neutral-read-only',restart_integrity_protocol:'EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1'},
    recovery:inherited.recovery,drift:inherited.drift,
    provenance:{
      current_surface_release:467,current_surface_build:238,inherited_engine:'functions/api/_lib/release466Reliability.js',inherited_engine_role:'HISTORICAL_REGRESSION_COMPATIBILITY',
      historical_feature_authority:'release467-build36-current-reliability-operational-health.json',current_operator_authority:'current-development-authority.json',
      accepted_development:ACCEPTED_DEVELOPMENT,last_fully_verified_development:LAST_FULLY_VERIFIED_DEVELOPMENT,current_production:CURRENT_PRODUCTION,
      production_proof_transport_policy:PRODUCTION_PROOF_TRANSPORT_POLICY,implementation_acceptance_is_distinct_from_final_closure:true,
      closure_candidate_requires_external_exact_head_proof:true,build234_workflow_help_production_green:true,build234_exact_tree:'51fc6b9a4c0910f42bbbee9bf7d7a8aa756220b5',
      build237_ergonomics_production_green:true,build238_attention_signal_candidate:true,build238_existing_authorities_only:true,build238_schema_change:false,build238_automatic_publication:false,
      successor_builds_planned:'Builds 239-248 owner-authorized refinement roadmap',production_baseline_build:237
    },
    safety:{...inherited.safety,mutation_capability:'none',request_time_schema_mutation:false,d1_business_data_mutation:false,r2_mutation:false,binding_mutation:false,server_persistence:false,automatic_business_action:false,accounting_posting:false,period_close:false,inventory_mutation:false,creative_mutation:false,price_mutation:false,provider_execution:false,provider_publication:false,marketplace_publication:false,social_publication:false,backup_restore_execution:false,production_mutation:false,secrets_exposed:false}
  };
}
