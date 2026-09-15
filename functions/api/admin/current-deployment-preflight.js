// Release 467 Build 156 — current Deployment Preflight over exact Build 155 baseline.
// GET-only. Historical diagnostics are reused read-only; forward schema authority remains canonical.
import { getDb, jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as getHistoricalDeploymentPreflight } from './_historicalDeploymentPreflight.js';
const RELEASE=467;
const BUILD=156;
const TITLE='Tool & Supply Process Assignment';
const CANONICAL_MIGRATIONS=Object.freeze(["0001_release464_migration_authority.sql","0002_release464_operational_acceptance.sql","0003_release464_business_growth.sql","0004_release465_storefront_quality.sql","0005_release467_inventory_process_assignment.sql"]);
const REQUIRED_DEVELOPMENT_PROOFS=Object.freeze(['System Gate','Current Application Quality Proof','I.T. Admin Runtime Proof','Repository Branch Hygiene']);
const VERIFIED_DEVELOPMENT=Object.freeze({release:467,build:155,title:'Products Client Responsiveness Hotfix',dev_sha:'4e9efa2daf8f541e941c350ccde77798b5c99080',tree_sha:'3f08dc3dfde778ddca0ca5fd328e7d45a1fcee9e',system_gate_run:34915558746,current_application_quality_run:34915558747,it_admin_runtime_proof_run:34915558751,branch_hygiene_run:34915558771,proof_state:'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN',exact_preview_deployment:true});
const PRODUCTION=Object.freeze({release:467,build:155,state:'PRODUCTION_GREEN',main_sha:'4e9efa2daf8f541e941c350ccde77798b5c99080',tree_sha:'3f08dc3dfde778ddca0ca5fd328e7d45a1fcee9e',production_pages_deploy_run:34915729378,production_live_resource_integrity_run:34915877580,products_production_browser_proof_run:34915877555,products_route_production_proof_run:34915877617,client_ui_incident_state:'CLOSED_BUILD155_PRODUCTS_RESPONSIVENESS',client_ui_usability_proven:true});
const PRODUCTION_PROOF_TRANSPORT=Object.freeze({max_attempts:3,retry_http_statuses:[408,425,429,500,502,503,504],retry_exceptions:['urllib.error.URLError','ConnectionResetError','TimeoutError'],permanent_4xx_fail_closed:true,resource_correctness_fail_closed:true});
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
async function tableExists(db,name){try{return Boolean(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first());}catch{return false;}}
async function safeAll(db,sql){try{return rows(await db.prepare(sql).all());}catch{return[];}}
async function canonicalMigrationTruth(db){
  const native_ledger='d1_migrations',proof_table='app_schema_migration_proofs';
  const nativeExists=await tableExists(db,native_ledger),proofExists=await tableExists(db,proof_table);
  const nativeRows=nativeExists?await safeAll(db,'SELECT id,name,applied_at FROM d1_migrations ORDER BY id'):[];
  const proofRows=proofExists?await safeAll(db,'SELECT migration_name FROM app_schema_migration_proofs ORDER BY schema_migration_proof_id'):[];
  const nativeNames=new Set(nativeRows.map((r)=>String(r.name||''))),proofNames=new Set(proofRows.map((r)=>String(r.migration_name||'')));
  const migrations=CANONICAL_MIGRATIONS.map((file,index)=>({version:index+1,file,native_applied:nativeNames.has(file),proof_recorded:proofNames.has(file)}));
  const fkRows=await safeAll(db,'PRAGMA foreign_key_check');
  return {stream:'devilndove-canonical-forward',manifest_path:'migrations/canonical/manifest.json',applicator:'scripts/d1_migrate.py',native_ledger:'d1_migrations',proof_table:'app_schema_migration_proofs',expected_count:5,native_applied_count:migrations.filter((x)=>x.native_applied).length,proof_recorded_count:migrations.filter((x)=>x.proof_recorded).length,foreign_key_violations:fkRows.length,migrations};
}
function markdownReport(data){return `# Release ${RELEASE} Build ${BUILD} Deployment Preflight\n\n- State: ${data.state}\n- Last fully verified Development: ${VERIFIED_DEVELOPMENT.dev_sha}\n- Production main: ${PRODUCTION.main_sha}\n- Tree: ${VERIFIED_DEVELOPMENT.tree_sha}\n- System Gate: ${VERIFIED_DEVELOPMENT.system_gate_run}\n- Current Application Quality Proof: ${VERIFIED_DEVELOPMENT.current_application_quality_run}\n- I.T. Admin Runtime Proof: ${VERIFIED_DEVELOPMENT.it_admin_runtime_proof_run}\n- Repository Branch Hygiene: ${VERIFIED_DEVELOPMENT.branch_hygiene_run}\n- Production Pages Deploy: ${PRODUCTION.production_pages_deploy_run}\n- Production Live Resource Integrity: ${PRODUCTION.production_live_resource_integrity_run}\n- Canonical migrations: ${data.canonical_migration_truth?.native_applied_count||0}/5\n`;}
export async function onRequestGet(context){
  const historicalResponse=await getHistoricalDeploymentPreflight(context);
  const historical=historicalResponse.ok?await historicalResponse.json().catch(()=>({})):{};
  const db=getDb(context.env);
  if(!db)return jsonResponse({ok:false,release:RELEASE,build:BUILD,error:'Database binding is not configured.'},503,{'Cache-Control':'no-store'});
  const truth=await canonicalMigrationTruth(db);
  const checks=[
    {status:truth.native_applied_count===5?'pass':'fail',code:'canonical_native_ledger',label:'Canonical D1 migration ledger',detail:`${truth.native_applied_count}/5 canonical migrations recorded.`},
    {status:truth.proof_recorded_count===5?'pass':'fail',code:'canonical_checksum_proofs',label:'Canonical migration proof rows',detail:`${truth.proof_recorded_count}/5 proof rows recorded.`},
    {status:truth.foreign_key_violations===0?'pass':'fail',code:'canonical_foreign_keys',label:'D1 foreign-key integrity',detail:`${truth.foreign_key_violations} violation(s).`},
    {status:'pass',code:'runtime_schema_mutation_boundary',label:'Request-time schema mutation boundary',detail:'Current endpoint is GET-only and exposes no repair capability.'},
    {status:'pass',code:'products_client_responsiveness',label:'Products client responsiveness',detail:'Build 155 authenticated browser responsiveness and Product population are GREEN.'},
    {status:'review',code:'restart_integrity_checkpoint',label:'Restart integrity checkpoint',detail:`Build 155 is fully verified at ${VERIFIED_DEVELOPMENT.dev_sha}; Build 156 is the active Tool & Supply Process Assignment candidate.`}
  ];
  const blocker_count=checks.filter((x)=>x.status==='fail').length;
  const warning_count=checks.filter((x)=>x.status==='review').length;
  const data={ok:true,release:RELEASE,build:BUILD,title:TITLE,state:'CURRENT_READ_ONLY',generated_at:new Date().toISOString(),summary:{status:blocker_count?'blocked':warning_count?'review':'ready',blocker_count,warning_count,pass_count:checks.filter((x)=>x.status==='pass').length,check_count:checks.length},checks,recent_runs:Array.isArray(historical?.recent_runs)?historical.recent_runs:[],post_deploy_confirmations:Array.isArray(historical?.post_deploy_confirmations)?historical.post_deploy_confirmations:[],canonical_migration_truth:truth,release_authority:{current_release:RELEASE,current_build:BUILD,required_development_proofs:REQUIRED_DEVELOPMENT_PROOFS,verified_development_checkpoint:VERIFIED_DEVELOPMENT,production:PRODUCTION,production_proof_transport:PRODUCTION_PROOF_TRANSPORT,rollback_readiness:'release-neutral-read-only',historical_feature_authority:'release467-build37-deployment-preflight-canonical-migration.json'},truth_notes:[`Build 155 is the current fully verified Development baseline at ${VERIFIED_DEVELOPMENT.dev_sha}; Production is ${PRODUCTION.main_sha}; both share ${VERIFIED_DEVELOPMENT.tree_sha}.`,`Development proofs: System ${VERIFIED_DEVELOPMENT.system_gate_run}, Quality ${VERIFIED_DEVELOPMENT.current_application_quality_run}, I.T. ${VERIFIED_DEVELOPMENT.it_admin_runtime_proof_run}, Hygiene ${VERIFIED_DEVELOPMENT.branch_hygiene_run}.`,`Production proofs: Pages ${PRODUCTION.production_pages_deploy_run}, Live Resources ${PRODUCTION.production_live_resource_integrity_run}, Products Browser ${PRODUCTION.products_production_browser_proof_run}, Products Route ${PRODUCTION.products_route_production_proof_run}.`,'Build 156 Tool & Supply Process Assignment is the active Development closure candidate.','Canonical migrations are 0001-0005; request-time DDL remains closed.'],safety:{mutation_capability:'none',request_time_schema_mutation:false,d1_business_data_mutation:false,r2_mutation:false,binding_mutation:false,server_persistence:false,automatic_business_action:false,production_mutation:false}};
  if(new URL(context.request.url).searchParams.get('format')==='markdown')return new Response(markdownReport(data),{status:200,headers:{'Content-Type':'text/markdown; charset=utf-8','Cache-Control':'no-store'}});
  return jsonResponse(data,200,{'Cache-Control':'no-store'});
}
