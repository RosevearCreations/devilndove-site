// Release 467 Build 254 — current read-only operator journey friction review over Build 253 Production source.
import { loadRelease466Reliability } from './release466Reliability.js';

export const CURRENT_RELIABILITY_RELEASE=467;
export const CURRENT_RELIABILITY_BUILD=254;
export const CURRENT_RELIABILITY_TITLE='Operator Journey Friction Review';
export const CURRENT_RELIABILITY_AUTHORITY='current-development-authority.json';
export const CURRENT_READ_ONLY='CURRENT_READ_ONLY';
export const ACCEPTED_DEVELOPMENT=Object.freeze({
  release:467,build:253,title:'Session & Abuse-Control Runtime Evidence',
  dev_sha:'42ad585550cbf76b39ab28d30ed345e177b8fb86',tree_sha:'deeca5e877175af1c7c804b09bfbb14a9daa7df8',
  system_gate_run:36066344734,current_application_quality_run:36066344961,it_admin_runtime_proof_run:36066344950,
  branch_hygiene_run:36066346173,exact_preview_deployment:true,role:'LAST_FULLY_VERIFIED_RESTART_CHECKPOINT'
});
export const LAST_FULLY_VERIFIED_DEVELOPMENT=Object.freeze({
  release:467,build:253,title:'Session & Abuse-Control Runtime Evidence',state:'DEVELOPMENT_GREEN',
  dev_sha:'42ad585550cbf76b39ab28d30ed345e177b8fb86',tree_sha:'deeca5e877175af1c7c804b09bfbb14a9daa7df8',
  system_gate_run:36066344734,current_application_quality_run:36066344961,it_admin_runtime_proof_run:36066344950,
  branch_hygiene_run:36066346173,proof_state:'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN'
});
export const CURRENT_PRODUCTION=Object.freeze({
  release:467,build:253,title:'Session & Abuse-Control Runtime Evidence',state:'PRODUCTION_GREEN',
  main_sha:'ec4e665c34af6e6fbc1dc440411b8b7795deaeb5',tree_sha:'deeca5e877175af1c7c804b09bfbb14a9daa7df8',
  production_pages_deploy_run:36066849392,production_live_resource_integrity_run:36067030179,
  products_browser_proof_run:36067030078,products_route_proof_run:36067030066,remote_d1_queries:0
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
    release:467,build:254,title:CURRENT_RELIABILITY_TITLE,authority:CURRENT_RELIABILITY_AUTHORITY,state:CURRENT_READ_ONLY,
    environment:inherited.environment,score:inherited.score,status:inherited.status,scope:inherited.scope,slo_targets:inherited.slo_targets,
    checks:inherited.checks,migrations:inherited.migrations,runtime_incidents:inherited.runtime_incidents,
    foreign_key_violations:inherited.foreign_key_violations,resources:inherited.resources,
    governance:{...inherited.governance,current_release_authority:'current-development-authority.json',production_promotion_proof_count:4,production_closure_proof_count:6,rollback_readiness:'release-neutral-read-only',restart_integrity_protocol:'EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1'},
    recovery:inherited.recovery,drift:inherited.drift,
    provenance:{
      current_surface_release:467,current_surface_build:254,inherited_engine:'functions/api/_lib/release466Reliability.js',inherited_engine_role:'HISTORICAL_REGRESSION_COMPATIBILITY',
      historical_feature_authority:'release467-build36-current-reliability-operational-health.json',current_operator_authority:'current-development-authority.json',
      accepted_development:ACCEPTED_DEVELOPMENT,last_fully_verified_development:LAST_FULLY_VERIFIED_DEVELOPMENT,current_production:CURRENT_PRODUCTION,
      production_proof_transport_policy:PRODUCTION_PROOF_TRANSPORT_POLICY,implementation_acceptance_is_distinct_from_final_closure:true,
      closure_candidate_requires_external_exact_head_proof:true,build234_workflow_help_production_green:true,build234_exact_tree:'a29c7d6fe3e7fbfae120000020303dc32ef55419',
      build237_ergonomics_production_green:true,build238_attention_signal_production_green:true,build238_existing_authorities_only:true,build238_schema_change:false,build238_automatic_publication:false,
      build239_navigation_production_green:true,build240_admin_read_budget_production_green:true,successor_builds_planned:'Build 255-256 evidence-driven refinement outcomes roadmap',production_baseline_build:253,build252_accessibility_acceptance_refresh:true,build253_session_abuse_runtime_evidence:true,build254_operator_journey_friction_review:true
    },
    safety:{...inherited.safety,mutation_capability:'none',request_time_schema_mutation:false,d1_business_data_mutation:false,r2_mutation:false,binding_mutation:false,server_persistence:false,automatic_business_action:false,accounting_posting:false,period_close:false,inventory_mutation:false,creative_mutation:false,price_mutation:false,provider_execution:false,provider_publication:false,marketplace_publication:false,social_publication:false,backup_restore_execution:false,production_mutation:false,secrets_exposed:false}
  };
}
