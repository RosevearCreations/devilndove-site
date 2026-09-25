// Release 467 Build 269 — current read-only Deployment Preflight over exact Build 268 Production source.
import { getDb, jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as getHistoricalDeploymentPreflight } from './_historicalDeploymentPreflight.js';

const RELEASE=467;
const BUILD=269;
const TITLE='Private Raw Media Intake Integrity';
const CANONICAL_MIGRATIONS=Object.freeze(['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql','0005_release467_inventory_process_assignment.sql','0006_release467_product_media_publication_guard.sql','0007_release467_storefront_launch_remediation.sql','0008_release467_workshop_process_taxonomy.sql','0009_release467_workshop_capability_profiles.sql','0010_release467_custom_work_intake_2.sql','0011_release467_manufacturing_triage_route.sql','0012_release467_hybrid_creative_project_operations.sql','0013_release467_digital_proof_customer_approval.sql','0014_release467_prototype_sample_production_run.sql','0015_release467_small_batch_corporate_event_quoting.sql','0016_release467_customer_supplied_item_suitability_review.sql','0017_release467_production_cost_evidence_v2.sql','0018_release467_manufacturing_work_order_job_traveler.sql','0019_release467_production_run_qa_rework_scrap_evidence.sql','0020_release467_workshop_knowledge_library_foundation.sql','0021_release467_project_knowledge_recipe_history.sql','0022_release467_capability_profile_coverage_closure.sql','0023_release467_cupcake_soap_label_templates.sql']);
const REQUIRED_DEVELOPMENT_PROOFS=Object.freeze(['System Gate','Current Application Quality Proof','I.T. Admin Runtime Proof','Repository Branch Hygiene','Release 467 Build 269 Private Raw Media Intake Integrity']);
const VERIFIED_DEVELOPMENT=Object.freeze({
  release:467,build:268,title:'CAIP Private-Media Recovery Hardening Closure',state:'DEVELOPMENT_GREEN',
  dev_sha:'139310232fb103cb2c843dc4d409ecdb7d4bb701',tree_sha:'86f0a6c3e378944f0f97cbd32ff416d4abbe3767',
  system_gate_run:36176223381,current_application_quality_run:36176223395,it_admin_runtime_proof_run:36176223268,
  branch_hygiene_run:36176223158,dedicated_gate_run:36176223314,proof_state:'EXACT_BRANCH_HEAD_FIVE_PROOF_GREEN',exact_preview_deployment:true
});
const PRODUCTION=Object.freeze({
  release:467,build:268,title:'CAIP Private-Media Recovery Hardening Closure',state:'PRODUCTION_GREEN',
  main_sha:'44da8087958eb0c64df3de892ca8628293a96231',tree_sha:'86f0a6c3e378944f0f97cbd32ff416d4abbe3767',
  production_pages_deploy_run:36176423497,production_live_resource_integrity_run:36176498083,
  products_browser_proof_run:36176498119,products_route_proof_run:36176498113,build_specific_proof_run:36176423468
});
const PRODUCTION_PROOF_TRANSPORT=Object.freeze({max_attempts:3,retry_http_statuses:[408,425,429,500,502,503,504],retry_exceptions:['urllib.error.URLError','ConnectionResetError','TimeoutError'],permanent_4xx_fail_closed:true,resource_correctness_fail_closed:true});
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
async function tableExists(db,name){try{return Boolean(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first());}catch{return false;}}
async function safeAll(db,sql){try{return rows(await db.prepare(sql).all());}catch{return[];}}
async function canonicalMigrationTruth(db){
  const nativeExists=await tableExists(db,'d1_migrations'),proofExists=await tableExists(db,'app_schema_migration_proofs');
  const nativeRows=nativeExists?await safeAll(db,'SELECT id,name,applied_at FROM d1_migrations ORDER BY id'):[];
  const proofRows=proofExists?await safeAll(db,'SELECT migration_name FROM app_schema_migration_proofs ORDER BY schema_migration_proof_id'):[];
  const nativeNames=new Set(nativeRows.map((r)=>String(r.name||''))),proofNames=new Set(proofRows.map((r)=>String(r.migration_name||'')));
  const migrations=CANONICAL_MIGRATIONS.map((file,index)=>({version:index+1,file,native_applied:nativeNames.has(file),proof_recorded:proofNames.has(file)}));
  const fkRows=await safeAll(db,'PRAGMA foreign_key_check');
  return {stream:'devilndove-canonical-forward',manifest_path:'migrations/canonical/manifest.json',applicator:'scripts/d1_migrate.py',native_ledger:'d1_migrations',proof_table:'app_schema_migration_proofs',expected_count:CANONICAL_MIGRATIONS.length,native_applied_count:migrations.filter((x)=>x.native_applied).length,proof_recorded_count:migrations.filter((x)=>x.proof_recorded).length,foreign_key_violations:fkRows.length,migrations};
}
function markdownReport(data){
  return '# Release '+RELEASE+' Build '+BUILD+' Deployment Preflight\n\n- State: '+data.state+'\n- Last fully verified Development: '+VERIFIED_DEVELOPMENT.dev_sha+'\n- Production main: '+PRODUCTION.main_sha+'\n- Tree: '+VERIFIED_DEVELOPMENT.tree_sha+'\n- System Gate: '+VERIFIED_DEVELOPMENT.system_gate_run+'\n- Current Application Quality Proof: '+VERIFIED_DEVELOPMENT.current_application_quality_run+'\n- I.T. Admin Runtime Proof: '+VERIFIED_DEVELOPMENT.it_admin_runtime_proof_run+'\n- Repository Branch Hygiene: '+VERIFIED_DEVELOPMENT.branch_hygiene_run+'\n- Production Pages Deploy: '+PRODUCTION.production_pages_deploy_run+'\n- Production Live Resource Integrity: '+PRODUCTION.production_live_resource_integrity_run+'\n- Canonical migrations: '+(data.canonical_migration_truth?.native_applied_count||0)+'/'+CANONICAL_MIGRATIONS.length+'\n';
}
export async function onRequestGet(context){
  const historicalResponse=await getHistoricalDeploymentPreflight(context),historical=historicalResponse.ok?await historicalResponse.json().catch(()=>({})):{};
  const db=getDb(context.env);if(!db)return jsonResponse({ok:false,release:RELEASE,build:BUILD,error:'Database binding is not configured.'},503,{'Cache-Control':'no-store'});
  const truth=await canonicalMigrationTruth(db);
  const checks=[
    {status:truth.native_applied_count===23?'pass':'fail',code:'canonical_native_ledger',label:'Canonical D1 migration ledger',detail:truth.native_applied_count+'/23 canonical migrations recorded.'},
    {status:truth.proof_recorded_count===23?'pass':'fail',code:'canonical_checksum_proofs',label:'Canonical migration proof rows',detail:truth.proof_recorded_count+'/23 proof rows recorded.'},
    {status:truth.foreign_key_violations===0?'pass':'fail',code:'canonical_foreign_keys',label:'D1 foreign-key integrity',detail:truth.foreign_key_violations+' violation(s).'},
    {status:'pass',code:'runtime_schema_mutation_boundary',label:'Request-time schema mutation boundary',detail:'Current endpoint is GET-only and exposes no repair capability.'},
    {status:'pass',code:'build268_verified_baseline',label:'Build 268 verified restart baseline',detail:'Build 268 CAIP Private-Media Recovery Hardening Closure is exact-tree Development and Production GREEN with all required named proofs.'},
    {status:'pass',code:'build268_source_promotion',label:'Build 268 Production source promotion',detail:'Build 268 is on main 44da8087958eb0c64df3de892ca8628293a96231 with the identical Development tree 86f0a6c3e378944f0f97cbd32ff416d4abbe3767.'},
    {status:'review',code:'build269_private_raw_media_intake_integrity',label:'Build 269 Private Raw Media Intake Integrity',detail:'Build 269 activates duplicate-safe source/runtime intake integrity and the missing standalone migration artifact while deployed Production private-media acceptance remains evidence-dependent and fail closed.'}
  ];
  const blocker_count=checks.filter((x)=>x.status==='fail').length,warning_count=checks.filter((x)=>x.status==='review').length;
  const data={ok:true,release:RELEASE,build:BUILD,title:TITLE,state:'CURRENT_READ_ONLY',generated_at:new Date().toISOString(),summary:{status:blocker_count?'blocked':warning_count?'review':'ready',blocker_count,warning_count,pass_count:checks.filter((x)=>x.status==='pass').length,check_count:checks.length},checks,recent_runs:Array.isArray(historical?.recent_runs)?historical.recent_runs:[],post_deploy_confirmations:Array.isArray(historical?.post_deploy_confirmations)?historical.post_deploy_confirmations:[],canonical_migration_truth:truth,release_authority:{current_release:RELEASE,current_build:BUILD,required_development_proofs:REQUIRED_DEVELOPMENT_PROOFS,verified_development_checkpoint:VERIFIED_DEVELOPMENT,production:PRODUCTION,production_proof_transport:PRODUCTION_PROOF_TRANSPORT,current_candidate:{release:467,build:269,title:TITLE,authority:'release467-build269-private-raw-media-intake-integrity.json'},rollback_readiness:'release-neutral-read-only',historical_feature_authority:'release467-build37-deployment-preflight-canonical-migration.json'},truth_notes:['Build 268 is the exact fully verified Development and Production restart boundary.','Build 268 Development and Production share tree 86f0a6c3e378944f0f97cbd32ff416d4abbe3767.','Canonical migration authority remains through data-only 0023.','Build 269 is a read-only release-truth projection over duplicate-safe private raw-media intake integrity; deployed Production private-media acceptance remains evidence-dependent and fail closed.'],safety:{mutation_capability:'none',request_time_schema_mutation:false,d1_business_data_mutation:false,r2_mutation:false,binding_mutation:false,server_persistence:false,automatic_business_action:false,production_mutation:false}};
  if(new URL(context.request.url).searchParams.get('format')==='markdown')return new Response(markdownReport(data),{status:200,headers:{'Content-Type':'text/markdown; charset=utf-8','Cache-Control':'no-store'}});
  return jsonResponse(data,200,{'Cache-Control':'no-store'});
}
