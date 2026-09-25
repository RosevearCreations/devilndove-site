// Release 467 Build 260 — current read-only Pull-Request Matrix Fan-Out Reduction over Build 259 Production source.
import { loadRelease466Reliability } from './release466Reliability.js';

export const CURRENT_RELIABILITY_RELEASE=467;
export const CURRENT_RELIABILITY_BUILD=260;
export const CURRENT_RELIABILITY_TITLE='Pull-Request Matrix Fan-Out Reduction';
export const CURRENT_RELIABILITY_AUTHORITY='current-development-authority.json';
export const CURRENT_READ_ONLY='CURRENT_READ_ONLY';
export const ACCEPTED_DEVELOPMENT=Object.freeze({
  release:467,build:259,title:'Reusable Exact-SHA Proof Composition',
  dev_sha:'270eea921559b2439459180998cc367b6fe7c9bb',tree_sha:'e81b613e5a4b491927ab89c89800345025853b99',
  system_gate_run:36082784059,current_application_quality_run:36082784168,it_admin_runtime_proof_run:36082783908,
  branch_hygiene_run:36082784042,exact_preview_deployment:true,role:'LAST_FULLY_VERIFIED_RESTART_CHECKPOINT'
});
export const LAST_FULLY_VERIFIED_DEVELOPMENT=Object.freeze({
  release:467,build:259,title:'Reusable Exact-SHA Proof Composition',state:'DEVELOPMENT_GREEN',
  dev_sha:'270eea921559b2439459180998cc367b6fe7c9bb',tree_sha:'e81b613e5a4b491927ab89c89800345025853b99',
  system_gate_run:36082784059,current_application_quality_run:36082784168,it_admin_runtime_proof_run:36082783908,
  branch_hygiene_run:36082784042,proof_state:'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN'
});
export const CURRENT_PRODUCTION=Object.freeze({
  release:467,build:259,title:'Reusable Exact-SHA Proof Composition',state:'PRODUCTION_GREEN',
  main_sha:'af294ad20ec26222ec0f7ccdb856f39de9fbbd2e',tree_sha:'e81b613e5a4b491927ab89c89800345025853b99',
  production_pages_deploy_run:36082913970,production_live_resource_integrity_run:36082967263,
  products_browser_proof_run:36082967302,products_route_proof_run:36082967286,remote_d1_queries:0
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
    release:467,build:260,title:CURRENT_RELIABILITY_TITLE,authority:CURRENT_RELIABILITY_AUTHORITY,state:CURRENT_READ_ONLY,
    environment:inherited.environment,score:inherited.score,status:inherited.status,scope:inherited.scope,slo_targets:inherited.slo_targets,
    checks:inherited.checks,migrations:inherited.migrations,runtime_incidents:inherited.runtime_incidents,
    foreign_key_violations:inherited.foreign_key_violations,resources:inherited.resources,
    governance:{...inherited.governance,current_release_authority:'current-development-authority.json',production_promotion_proof_count:4,production_closure_proof_count:6,rollback_readiness:'release-neutral-read-only',restart_integrity_protocol:'EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1'},
    recovery:inherited.recovery,drift:inherited.drift,
    provenance:{
      current_surface_release:467,current_surface_build:260,inherited_engine:'functions/api/_lib/release466Reliability.js',inherited_engine_role:'HISTORICAL_REGRESSION_COMPATIBILITY',
      historical_feature_authority:'release467-build36-current-reliability-operational-health.json',current_operator_authority:'current-development-authority.json',
      accepted_development:ACCEPTED_DEVELOPMENT,last_fully_verified_development:LAST_FULLY_VERIFIED_DEVELOPMENT,current_production:CURRENT_PRODUCTION,
      production_proof_transport_policy:PRODUCTION_PROOF_TRANSPORT_POLICY,implementation_acceptance_is_distinct_from_final_closure:true,
      closure_candidate_requires_external_exact_head_proof:true,build234_workflow_help_production_green:true,build234_exact_tree:'a29c7d6fe3e7fbfae120000020303dc32ef55419',
      build237_ergonomics_production_green:true,build238_attention_signal_production_green:true,build238_existing_authorities_only:true,build238_schema_change:false,build238_automatic_publication:false,
      build239_navigation_production_green:true,build240_admin_read_budget_production_green:true,successor_builds_planned:'Builds 257-264 release efficiency and read-path roadmap',production_baseline_build:259,build252_accessibility_acceptance_refresh:true,build253_session_abuse_runtime_evidence:true,build254_operator_journey_friction_review:true,build255_production_reliability_release_efficiency_review:true,build256_refinement_outcomes_renewal_ii:true,build257_workflow_trigger_inventory_ownership_map:true,build257_baseline_workflow_files:146,build257_primary_trigger_union:140,build257_workflow_disable:false,build257_workflow_delete:false,build258_historical_workflow_trigger_scope_tightening:true,build258_manual_only_workflows:16,build258_pull_request_triggers:72,build258_push_triggers:122,build258_workflow_dispatch_triggers:123,build259_reusable_exact_sha_proof_composition:true,build259_composition_action:'.github/actions/release467-exact-sha-proof/action.yml',build259_composition_verifier:'scripts/release467_exact_sha_proof_composition.py',build259_named_development_proofs:5,build259_named_production_proofs:5,build259_expected_workflow_files:149,build259_expected_pull_request:73,build259_expected_push:123,build259_expected_workflow_dispatch:124,build260_pull_request_matrix_fanout_reduction:true,build260_target_pr_workflows:38,build260_scanner_pull_request:36,build260_expected_actual_pr_runs:35,build260_push_triggers:124,build260_workflow_dispatch_triggers:132,accepted_head_workflow_runs:870,accepted_head_successful_runs:863,accepted_head_failed_runs:7,accepted_head_skipped_runs:0,accepted_head_rerun_attempts:0,build250_provider_rows_read:2178,build250_provider_rows_read_ceiling:25000,build250_operations_today_tasks_select_statements:13
    },
    safety:{...inherited.safety,mutation_capability:'none',request_time_schema_mutation:false,d1_business_data_mutation:false,r2_mutation:false,binding_mutation:false,server_persistence:false,automatic_business_action:false,accounting_posting:false,period_close:false,inventory_mutation:false,creative_mutation:false,price_mutation:false,provider_execution:false,provider_publication:false,marketplace_publication:false,social_publication:false,backup_restore_execution:false,production_mutation:false,secrets_exposed:false}
  };
}
