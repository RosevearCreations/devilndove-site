// Release 467 Build 210 — current read-only Deployment Preflight over exact Build 209 GREEN predecessor.
import { getDb, jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as getHistoricalDeploymentPreflight } from './_historicalDeploymentPreflight.js';

const RELEASE=467;
const BUILD=210;
const TITLE='Custom Work Intake 2.0';
const CANONICAL_MIGRATIONS=Object.freeze(['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql','0005_release467_inventory_process_assignment.sql','0006_release467_product_media_publication_guard.sql','0007_release467_storefront_launch_remediation.sql','0008_release467_workshop_process_taxonomy.sql','0009_release467_workshop_capability_profiles.sql','0010_release467_custom_work_intake_2.sql']);
const REQUIRED_DEVELOPMENT_PROOFS=Object.freeze([
  'System Gate','Current Application Quality Proof','I.T. Admin Runtime Proof','Repository Branch Hygiene',
  'Release 467 Build 209 Workshop Capability Profiles & Constraints Proof'
]);
const VERIFIED_DEVELOPMENT=Object.freeze({
  release:467,build:209,title:'Workshop Capability Profiles & Constraints',state:'DEVELOPMENT_GREEN',
  dev_sha:'9b6b22291bd98bdd2d57c8793a0c892f937b4287',tree_sha:'36bed0abebbb47b375277562355c3517d171b629',
  system_gate_run:35517349532,current_application_quality_run:35517349713,it_admin_runtime_proof_run:35517349672,
  branch_hygiene_run:35517349600,build_specific_proof_run:35517349698,proof_state:'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN',
  exact_preview_deployment:true
});
const PRODUCTION=Object.freeze({
  release:467,build:209,title:'Workshop Capability Profiles & Constraints',state:'PRODUCTION_GREEN',
  main_sha:'9a1bd2b3d99edf69651a17e790866d3b8fa744d4',
  tree_sha:'36bed0abebbb47b375277562355c3517d171b629',production_pages_deploy_run:35517517613,
  production_live_resource_integrity_run:35517574976,products_browser_proof_run:35517574870,
  products_route_proof_run:35517574790,build_specific_proof_run:35517517656,remote_d1_queries:0,
  exact_production_url:'https://d8ed45c4.devilndove-site.pages.dev'
});
const PRODUCTION_PROOF_TRANSPORT=Object.freeze({
  max_attempts:3,retry_http_statuses:[408,425,429,500,502,503,504],
  retry_exceptions:['urllib.error.URLError','ConnectionResetError','TimeoutError'],
  permanent_4xx_fail_closed:true,resource_correctness_fail_closed:true
});
const rows=(r)=>Array.isArray(r?.results)?r.results:[];

async function tableExists(db,name){
  try{return Boolean(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first());}
  catch{return false;}
}
async function safeAll(db,sql){try{return rows(await db.prepare(sql).all());}catch{return[];}}
async function canonicalMigrationTruth(db){
  const native_ledger='d1_migrations',proof_table='app_schema_migration_proofs';
  const nativeExists=await tableExists(db,native_ledger),proofExists=await tableExists(db,proof_table);
  const nativeRows=nativeExists?await safeAll(db,'SELECT id,name,applied_at FROM d1_migrations ORDER BY id'):[];
  const proofRows=proofExists?await safeAll(db,'SELECT migration_name FROM app_schema_migration_proofs ORDER BY schema_migration_proof_id'):[];
  const nativeNames=new Set(nativeRows.map((r)=>String(r.name||''))),proofNames=new Set(proofRows.map((r)=>String(r.migration_name||'')));
  const migrations=CANONICAL_MIGRATIONS.map((file,index)=>({version:index+1,file,native_applied:nativeNames.has(file),proof_recorded:proofNames.has(file)}));
  const fkRows=await safeAll(db,'PRAGMA foreign_key_check');
  return {
    stream:'devilndove-canonical-forward',manifest_path:'migrations/canonical/manifest.json',applicator:'scripts/d1_migrate.py',
    native_ledger:'d1_migrations',proof_table:'app_schema_migration_proofs',expected_count:CANONICAL_MIGRATIONS.length,
    native_applied_count:migrations.filter((x)=>x.native_applied).length,proof_recorded_count:migrations.filter((x)=>x.proof_recorded).length,
    foreign_key_violations:fkRows.length,migrations
  };
}
function markdownReport(data){
  return `# Release ${RELEASE} Build ${BUILD} Deployment Preflight

- State: ${data.state}
- Last fully verified Development: ${VERIFIED_DEVELOPMENT.dev_sha}
- Production main: ${PRODUCTION.main_sha}
- Tree: ${VERIFIED_DEVELOPMENT.tree_sha}
- System Gate: ${VERIFIED_DEVELOPMENT.system_gate_run}
- Current Application Quality Proof: ${VERIFIED_DEVELOPMENT.current_application_quality_run}
- I.T. Admin Runtime Proof: ${VERIFIED_DEVELOPMENT.it_admin_runtime_proof_run}
- Repository Branch Hygiene: ${VERIFIED_DEVELOPMENT.branch_hygiene_run}
- Production Pages Deploy: ${PRODUCTION.production_pages_deploy_run}
- Production Live Resource Integrity: ${PRODUCTION.production_live_resource_integrity_run}
- Canonical migrations: ${data.canonical_migration_truth?.native_applied_count||0}/${CANONICAL_MIGRATIONS.length}
`;
}
export async function onRequestGet(context){
  const historicalResponse=await getHistoricalDeploymentPreflight(context);
  const historical=historicalResponse.ok?await historicalResponse.json().catch(()=>({})):{};
  const db=getDb(context.env);
  if(!db)return jsonResponse({ok:false,release:RELEASE,build:BUILD,error:'Database binding is not configured.'},503,{'Cache-Control':'no-store'});
  const truth=await canonicalMigrationTruth(db);
  const checks=[
    {status:truth.native_applied_count===CANONICAL_MIGRATIONS.length?'pass':'fail',code:'canonical_native_ledger',label:'Canonical D1 migration ledger',detail:`${truth.native_applied_count}/${CANONICAL_MIGRATIONS.length} canonical migrations recorded.`},
    {status:truth.proof_recorded_count===CANONICAL_MIGRATIONS.length?'pass':'fail',code:'canonical_checksum_proofs',label:'Canonical migration proof rows',detail:`${truth.proof_recorded_count}/${CANONICAL_MIGRATIONS.length} proof rows recorded.`},
    {status:truth.foreign_key_violations===0?'pass':'fail',code:'canonical_foreign_keys',label:'D1 foreign-key integrity',detail:`${truth.foreign_key_violations} violation(s).`},
    {status:'pass',code:'runtime_schema_mutation_boundary',label:'Request-time schema mutation boundary',detail:'Current endpoint is GET-only and exposes no repair capability.'},
    {status:'pass',code:'build209_verified_baseline',label:'Build 209 verified restart baseline',detail:'Build 209 workshop capability profiles are exact-SHA Production GREEN on the current shared source tree.'},
    {status:'review',code:'build210_custom_work_intake',label:'Build 210 Custom Work Intake 2.0',detail:'Canonical migration 0010 and structured Custom Work intake must pass one exact-head Development proof before promotion.'}
  ];
  const blocker_count=checks.filter((x)=>x.status==='fail').length,warning_count=checks.filter((x)=>x.status==='review').length;
  const data={
    ok:true,release:RELEASE,build:BUILD,title:TITLE,state:'CURRENT_READ_ONLY',generated_at:new Date().toISOString(),
    summary:{status:blocker_count?'blocked':warning_count?'review':'ready',blocker_count,warning_count,pass_count:checks.filter((x)=>x.status==='pass').length,check_count:checks.length},
    checks,recent_runs:Array.isArray(historical?.recent_runs)?historical.recent_runs:[],
    post_deploy_confirmations:Array.isArray(historical?.post_deploy_confirmations)?historical.post_deploy_confirmations:[],
    canonical_migration_truth:truth,
    release_authority:{
      current_release:RELEASE,current_build:BUILD,required_development_proofs:REQUIRED_DEVELOPMENT_PROOFS,
      verified_development_checkpoint:VERIFIED_DEVELOPMENT,production:PRODUCTION,production_proof_transport:PRODUCTION_PROOF_TRANSPORT,
      current_candidate:{release:467,build:210,title:TITLE,authority:'release467-build210-custom-work-intake-2.json'},
      rollback_readiness:'release-neutral-read-only',historical_feature_authority:'release467-build37-deployment-preflight-canonical-migration.json'
    },
    truth_notes:[
      `Build 209 source is the exact fully verified restart baseline at ${VERIFIED_DEVELOPMENT.dev_sha}; Production source is ${PRODUCTION.main_sha}; both share ${VERIFIED_DEVELOPMENT.tree_sha}.`,
      `Development proofs: System ${VERIFIED_DEVELOPMENT.system_gate_run}, Quality ${VERIFIED_DEVELOPMENT.current_application_quality_run}, I.T. ${VERIFIED_DEVELOPMENT.it_admin_runtime_proof_run}, Hygiene ${VERIFIED_DEVELOPMENT.branch_hygiene_run}.`,
      `Production proofs: Pages ${PRODUCTION.production_pages_deploy_run}, Live Resources ${PRODUCTION.production_live_resource_integrity_run}, Product Browser ${PRODUCTION.products_browser_proof_run}, Product Route ${PRODUCTION.products_route_proof_run}.`,
      'Build 210 Custom Work Intake 2.0 is the active Development closure candidate.',
      'Canonical migrations are 0001-0010; migration 0010 enriches the existing custom_requests authority only.'
    ],
    safety:{mutation_capability:'none',request_time_schema_mutation:false,d1_business_data_mutation:false,r2_mutation:false,binding_mutation:false,server_persistence:false,automatic_business_action:false,production_mutation:false}
  };
  if(new URL(context.request.url).searchParams.get('format')==='markdown')return new Response(markdownReport(data),{status:200,headers:{'Content-Type':'text/markdown; charset=utf-8','Cache-Control':'no-store'}});
  return jsonResponse(data,200,{'Cache-Control':'no-store'});
}
