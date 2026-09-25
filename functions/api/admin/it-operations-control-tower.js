// Release 467 Build 265 — CAIP Private-Media Prerequisite Inventory over exact Build 264 Production source.
import { jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as getReadinessControlTower } from './it-control-tower.js';
import { onRequestGet as getSelfDiagnostics } from './it-self-diagnostics.js';

const RELEASE=467;
const BUILD=265;
const TITLE='CAIP Private-Media Prerequisite Inventory';
const AUTHORITY='release467-build265-caip-private-media-prerequisite-inventory';
const EVIDENCE_ID='r467-b264-green-36146386642-36147031112';

const VERIFIED_DEVELOPMENT=Object.freeze({
  release:467,build:264,title:'Refinement Outcomes Renewal III',state:'DEVELOPMENT_GREEN',
  dev_sha:'9017e145286f2007646a1f4de9ebdb670ca23881',tree_sha:'bbe175e82624a2043fb7fd8f84ca5ba9bb361410',
  system_gate_run:36146386642,current_application_quality_run:36146386016,it_admin_runtime_proof_run:36146386111,
  branch_hygiene_run:36146385905,proof_state:'EXACT_BRANCH_HEAD_FIVE_PROOF_GREEN_WITH_PROVIDER_MEASUREMENT',
  exact_preview_deployment:true,role:'LAST_FULLY_VERIFIED_RESTART_CHECKPOINT'
});
const ACCEPTED_DEVELOPMENT=Object.freeze({...VERIFIED_DEVELOPMENT,accepted_sha:VERIFIED_DEVELOPMENT.dev_sha,accepted_tree_sha:VERIFIED_DEVELOPMENT.tree_sha});
const PRODUCTION=Object.freeze({
  release:467,build:264,title:'Refinement Outcomes Renewal III',state:'PRODUCTION_GREEN',
  main_sha:'9cf042afb9b7938f160df89b49b82376eb8f9291',tree_sha:'bbe175e82624a2043fb7fd8f84ca5ba9bb361410',
  production_pages_deploy_run:36147031112,production_live_resource_integrity_run:36147115215,
  products_browser_proof_run:36147115091,products_route_proof_run:36147115289,remote_d1_queries:0
});
const PRODUCTION_PROOF_TRANSPORT=Object.freeze({
  max_attempts:3,retry_http_statuses:[408,425,429,500,502,503,504],
  retry_exceptions:['urllib.error.URLError','ConnectionResetError','TimeoutError'],
  permanent_4xx_fail_closed:true,resource_correctness_fail_closed:true,
  workflow:'.github/workflows/production-live-resource-integrity-proof.yml'
});
const CURRENT_GUARDS=Object.freeze([
  'System Gate','Current Application Quality Proof','I.T. Admin Runtime Proof','Repository Branch Hygiene',
  'Release 467 Build 265 CAIP Private-Media Prerequisite Inventory'
]);
const CANONICAL_MIGRATIONS=Object.freeze(['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql','0005_release467_inventory_process_assignment.sql','0006_release467_product_media_publication_guard.sql','0007_release467_storefront_launch_remediation.sql','0008_release467_workshop_process_taxonomy.sql','0009_release467_workshop_capability_profiles.sql','0010_release467_custom_work_intake_2.sql','0011_release467_manufacturing_triage_route.sql','0012_release467_hybrid_creative_project_operations.sql','0013_release467_digital_proof_customer_approval.sql','0014_release467_prototype_sample_production_run.sql','0015_release467_small_batch_corporate_event_quoting.sql','0016_release467_customer_supplied_item_suitability_review.sql','0017_release467_production_cost_evidence_v2.sql','0018_release467_manufacturing_work_order_job_traveler.sql','0019_release467_production_run_qa_rework_scrap_evidence.sql','0020_release467_workshop_knowledge_library_foundation.sql','0021_release467_project_knowledge_recipe_history.sql','0022_release467_capability_profile_coverage_closure.sql','0023_release467_cupcake_soap_label_templates.sql']);
const EXTERNAL_POLICY=Object.freeze([
  {key:'stripe_development',state:'HOLD_EXTERNAL'},
  {key:'paypal_sandbox',state:'HOLD_EXTERNAL'},
  {key:'social_oauth',state:'HOLD_EXTERNAL'},
  {key:'caip_private_media',state:'EVIDENCE_DEPENDENT'},
  {key:'cloudflare_access_service_token',state:'HOLD_EXTERNAL_CONFIGURED_AND_PROVEN_DEVELOPMENT'}
]);
const self='self';
const BUILD86_DIAGNOSTIC_CONTRACT=Object.freeze({self_diagnostics:self,automatic_repair:false,provider_execution:false,provider_publication:false});

function stableJson(value){
  if(Array.isArray(value))return `[${value.map(stableJson).join(',')}]`;
  if(value&&typeof value==='object'){const keys=Object.keys(value).sort();return `{${keys.map((k)=>`${JSON.stringify(k)}:${stableJson(value[k])}`).join(',')}}`;}
  return JSON.stringify(value);
}
async function sha256Hex(text){
  const bytes=new TextEncoder().encode(text),digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),(b)=>b.toString(16).padStart(2,'0')).join('');
}
function closurePayload(){
  return {
    release:467,build:263,title:'Release Efficiency & Read-Budget Outcome Verification',
    sha:VERIFIED_DEVELOPMENT.dev_sha,tree_sha:VERIFIED_DEVELOPMENT.tree_sha,
    development_proofs:{
      system_gate_run:36146386642,current_application_quality_run:36146386016,
      it_admin_runtime_proof_run:36146386111,branch_hygiene_run:36146385905
    },
    production_proofs:{
      production_pages_deploy_run:36147031112,production_live_resource_integrity_run:36147115215,
      products_browser_proof_run:36147115091,products_route_proof_run:36147115289
    },
    production_main_sha:PRODUCTION.main_sha,production_state:'PRODUCTION_GREEN',same_tree:true,remote_d1_queries:0,
    retry_policy:PRODUCTION_PROOF_TRANSPORT,
    canonical_migration_authority:'migrations/canonical/manifest.json + scripts/d1_migrate.py',
    canonical_migrations:CANONICAL_MIGRATIONS.slice(0,23),
    external_lanes:Object.fromEntries(EXTERNAL_POLICY.map((x)=>[x.key,x.state])),
    runtime_closure:{
      product_detail_core_requests:1,request_time_schema_mutation:false,bucket_wide_r2_listing:false,
      background_polling:false,automatic_inventory_assignment:false,build230_evidence_adoption:true
    },
    next_build:'Build 266 follows after Build 265 prerequisite-inventory closure.'
  };
}
async function closurePack(){
  const payload=closurePayload(),canonical=stableJson(payload),digest=await sha256Hex(canonical);
  return {pack:{evidence_id:EVIDENCE_ID,...payload,integrity:{
    algorithm:'SHA-256',canonicalization:'recursive-key-sort-json-v1',
    digest_scope:'closure_payload_without_evidence_id_or_integrity',digest_sha256:digest,
    canonical_payload_bytes:new TextEncoder().encode(canonical).length,
    cross_artifact_contract:'closure-json-vs-verification-manifest-v1'
  }},canonical};
}
function markdownReport(pack){
  return `# Devil n Dove Release 467 Build 265 Canonical Restart Evidence Pack

- Evidence ID: ${pack.evidence_id}
- Production state: ${pack.production_state}
- Canonical Development SHA: ${pack.sha}
- Canonical Production main SHA: ${PRODUCTION.main_sha}
- Shared tree: ${pack.tree_sha}
- System Gate: ${pack.development_proofs.system_gate_run}
- Current Application Quality Proof: ${pack.development_proofs.current_application_quality_run}
- I.T. Admin Runtime Proof: ${pack.development_proofs.it_admin_runtime_proof_run}
- Repository Branch Hygiene: ${pack.development_proofs.branch_hygiene_run}
- Production Pages Deploy: ${pack.production_proofs.production_pages_deploy_run}
- Production Live Resource Integrity: ${pack.production_proofs.production_live_resource_integrity_run}
- Product Browser Proof: ${pack.production_proofs.products_browser_proof_run}
- Product Route Proof: ${pack.production_proofs.products_route_proof_run}
- Current Production baseline: Build 263 Release Efficiency & Read-Budget Outcome Verification
- SHA-256: ${pack.integrity.digest_sha256}
`;
}

export async function onRequestGet(context){
  const [baseResponse,diagnosticResponse,closure]=await Promise.all([
    getReadinessControlTower(context),getSelfDiagnostics(context),closurePack()
  ]);
  const base=baseResponse.ok?await baseResponse.json().catch(()=>({})):{};
  const diagnostic=diagnosticResponse.ok?await diagnosticResponse.json().catch(()=>({})):{};
  const data={
    release:RELEASE,build:BUILD,title:TITLE,ok:true,authority:AUTHORITY,state:'DEVELOPMENT_REFINEMENT_CANDIDATE',
    release_authority:{
      current_operator:{release:RELEASE,build:BUILD,title:TITLE,state:'DEVELOPMENT_REFINEMENT_CANDIDATE'},
      accepted_development:ACCEPTED_DEVELOPMENT,verified_development:VERIFIED_DEVELOPMENT,production:PRODUCTION,
      production_proof_transport:PRODUCTION_PROOF_TRANSPORT,
      restart_integrity:{
        protocol:'EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1',last_fully_verified:VERIFIED_DEVELOPMENT,
        current_closure_candidate:{release:467,build:264,title:TITLE,authority:'release467-build264-refinement-outcomes-renewal-iii.json'},
        candidate_must_not_self_claim_final_proof:true,exact_current_sha_resolution:'VERIFY dev AND main REFS AT RESTART'
      },
      current_automatic_guards:CURRENT_GUARDS,persistent_branches:['main','dev'],
      production_promotion_required_development_proofs:CURRENT_GUARDS,rollback_readiness:'release-neutral-read-only',
      canonical_migration_authority:'migrations/canonical/manifest.json + scripts/d1_migrate.py',
      canonical_migrations:CANONICAL_MIGRATIONS,request_time_schema_mutation:false
    },
    closure_evidence_pack:closure.pack,
    headline_metrics:{
      readiness_score:Number(base?.readiness?.score||0),
      technical_blockers:Number(diagnostic?.diagnostics?.technical_blocker_count||0),
      technical_reviews:Number(diagnostic?.diagnostics?.technical_review_count||0),
      active_profiles:Number(base?.subsystems?.admin_authority?.metrics?.active_profile_count||0),
      foreign_key_violations:Number(base?.subsystems?.database?.metrics?.foreign_key_violations||0)
    },
    refinement_outcomes_renewal_ii:{source_builds:'249-255',accepted_heads:14,total_workflow_runs:870,successful_runs:863,failed_runs:7,skipped_runs:0,retried_run_attempts:0,build250_provider_rows_read:2178,build250_provider_rows_read_ceiling:25000,build250_operations_today_tasks_select_statements:13,build254_route_specific_remediation:'NOT_JUSTIFIED_WITHOUT_REAL_SESSION_EVIDENCE',build255_proof_fanout:'HIGH',exact_sha_promotion:'PRESERVE',future_queue_exhausted:false,next_build:257,successor_roadmap:'docs/operations/RELEASE_467_RELEASE_EFFICIENCY_READ_PATH_AUTONOMOUS_BUILDS_257_264.md'},
    workflow_trigger_inventory:{baseline_workflow_files:146,primary_trigger_union:140,pull_request:86,push:90,workflow_dispatch:89,workflow_run:5,issues:1,workflow_disabled:false,workflow_deleted:false,historical_scope_tightening:'COMPLETED_BUILD258_MANUAL_ONLY_242_257',next_build:259,future_queue_exhausted:false},
    workflow_trigger_scope_tightening:{target_build_span:'242-257',target_workflows:16,retirement_mode:'MANUAL_ONLY_PROVENANCE',candidate_workflow_files:148,pull_request:72,push:122,workflow_dispatch:123,workflow_run:5,net_pr_reduction:15,net_push_reduction:15,historical_gate_scripts_retained:true,workflow_files_deleted:false,exact_sha_promotion:'PRESERVE',next_build:259,future_queue_exhausted:false},
    exact_sha_proof_composition:{action:'.github/actions/release467-exact-sha-proof/action.yml',verifier:'scripts/release467_exact_sha_proof_composition.py',mode:'READ_ONLY_EXACT_SHA_NAMED_PROOF_COMPOSITION',development_named_proofs:5,production_named_proofs:5,build258_refactored:true,build259_uses_same_component:true,mutation_capability:'NONE',candidate_workflow_files:149,pull_request:73,push:123,workflow_dispatch:124,workflow_run:5,next_build:260,future_queue_exhausted:false},
    pull_request_matrix_fanout_reduction:{target_workflows:38,target_builds:'206-241,258-259',mode:'REMOVE_PULL_REQUEST_TRIGGER_ONLY',candidate_workflow_files:150,pull_request:36,push:124,workflow_dispatch:132,workflow_run:5,expected_actual_pr_runs:35,system_gate_contract_coverage:true,push_retained:true,manual_retained:true,next_build:261,future_queue_exhausted:false},
    production_proof_dependency_orchestration:{target_historical_workflows:39,target_builds:'206-241,258-260',mode:'REMOVE_MAIN_FROM_PUSH_BRANCH_FILTER_ONLY',candidate_workflow_files:151,pull_request:37,push:125,workflow_dispatch:133,workflow_run:5,development_push_retained:true,manual_retained:true,production_pages_push_retained:true,named_production_proofs_independently_visible:true,exact_sha_binding_preserved:true,next_build:262,future_queue_exhausted:false},
    operations_today_tasks_read_fanout_review:{baseline_top_level_select_statements:13,target_top_level_select_statements:8,statement_reduction:5,mode:'BATCH_SIX_LATEST_ACTION_POINT_LOOKUPS_INTO_ONE_D1_STATEMENT',today_tasks_rows_read_ceiling:15000,seller_daily_rows_read_ceiling:10000,aggregate_rows_read_ceiling:25000,production_d1_contact:false,d1_mutation:false,next_build:263,future_queue_exhausted:false},
    release_efficiency_read_budget_outcome_verification:{accepted_heads:12,total_workflow_runs:584,successful_runs:584,failed_runs:0,skipped_runs:0,runs_per_head:48.666667,normalized_runs_per_head_reduction_percent:21.6858,required_named_proofs_green:true,exact_tree_continuity:true,historical_noncanonical_failure_workflow:'Release 467 Build 155 Products Development Browser Proof',historical_noncanonical_failure_count:10,build255_closure_runs:134,build262_closure_runs:68,build255_to_build262_reduction_percent:49.2537,candidate_workflow_files:153,pull_request:39,push:127,workflow_dispatch:135,workflow_run:5,expected_today_tasks_statements:8,today_tasks_rows_read_ceiling:15000,seller_daily_rows_read_ceiling:10000,aggregate_rows_read_ceiling:25000,production_d1_contact:false,next_build:264,future_queue_exhausted:false},
    subsystems:base?.subsystems||{},self_diagnostics:diagnostic?.diagnostics||{},
    build86_diagnostic_contract:BUILD86_DIAGNOSTIC_CONTRACT,external_policy:EXTERNAL_POLICY,
    truth_notes:[
      'Build 263 is the exact last fully verified Development checkpoint.',
      'Build 263 Production is GREEN on the identical tree bbe175e82624a2043fb7fd8f84ca5ba9bb361410.',
      'Build 263 Development proofs: System 36146386642, Quality 36146386016, I.T. 36146386111, Hygiene 36146385905.',
      'Build 263 Production proofs: Pages 36147031112, Live Resources 36147115215, Product Browser 36147115091, Product Route 36147115289.',
      'Build 260 removed only redundant pull-request triggers from 38 historical proof workflows while preserving System Gate coverage and push/manual evidence.',
      'Build 261 removed 39 redundant historical Production main-push subscriptions while preserving Development push/manual evidence and all four canonical Production proofs.',
      'Build 262 batches six latest-action point lookups into one read-only D1 statement and closed exact Development at 8 statements under unchanged provider ceilings.',
      'Build 263 measures 584 closure-scoped GREEN runs across 12 accepted heads, a 21.69% normalized runs-per-head reduction while all required named proofs and exact-tree release pairs remain valid.',
      'Build 265 preserves the Build 264 release-efficiency decision and does not reopen broad CI trigger work.',
      'Build 265 begins the CAIP recovery/continuity roadmap with a read-only private-media prerequisite inventory; Build 266 is next.'
    ],
    safety:{
      read_only_projection:true,mutation_capability:'none',request_time_schema_mutation:false,d1_business_data_mutation:false,
      r2_mutation:false,binding_mutation:false,provider_execution:false,provider_publication:false,production_mutation:false
    },
    generated_at:new Date().toISOString()
  };
  const format=new URL(context.request.url).searchParams.get('format');
  if(format==='markdown')return new Response(markdownReport(closure.pack),{status:200,headers:{'Content-Type':'text/markdown; charset=utf-8','Cache-Control':'no-store'}});
  if(format==='closure-json')return new Response(JSON.stringify({exported_by:{release:RELEASE,build:BUILD,title:TITLE,authority:AUTHORITY},closure_evidence_pack:closure.pack},null,2)+'\n',{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
  if(format==='verification-manifest')return new Response(JSON.stringify({exported_by:{release:RELEASE,build:BUILD,title:TITLE,authority:AUTHORITY},evidence_id:EVIDENCE_ID,verification:closure.pack.integrity,canonical_payload:JSON.parse(closure.canonical)},null,2)+'\n',{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
  return jsonResponse(data,200,{'Cache-Control':'no-store'});
}
