// Release 467 Build 89 — current I.T. External Acceptance Environment Isolation & Guided Recovery.
// Converges the retained readiness/self-diagnostics engine with the externally proven Build 88 Development + Production baseline.
import { jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as getReadinessControlTower } from './it-control-tower.js';
import { onRequestGet as getSelfDiagnostics } from './it-self-diagnostics.js';

const RELEASE = 467;
const BUILD = 89;
const TITLE = 'External Acceptance Environment Isolation & Guided Recovery';
const ACCEPTED_DEVELOPMENT = Object.freeze({
  release:467,build:88,title:'External Acceptance Control Center Convergence',state:'DEVELOPMENT_GREEN',
  accepted_sha:'9c6d56b887b2aa4bb710e5980608b8942830034c',
  accepted_tree_sha:'9f7d279ed5c83795682ba763ca150f1fe91a6019',
  system_gate_run:34423493650,current_application_quality_run:34423493830,
  it_admin_runtime_proof_run:34423493747,branch_hygiene_run:34423493617,
  exact_preview_deployment:true,role:'LAST_FULLY_VERIFIED_RESTART_CHECKPOINT'
});
const VERIFIED_DEVELOPMENT = Object.freeze({
  release:467,build:88,title:'External Acceptance Control Center Convergence',state:'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN',
  dev_sha:'9c6d56b887b2aa4bb710e5980608b8942830034c',
  tree_sha:'9f7d279ed5c83795682ba763ca150f1fe91a6019',
  system_gate_run:34423493650,current_application_quality_run:34423493830,
  it_admin_runtime_proof_run:34423493747,branch_hygiene_run:34423493617,
  exact_preview_deployment:true,role:'LAST_FULLY_VERIFIED_RESTART_CHECKPOINT'
});
const PRODUCTION = Object.freeze({
  release:467,build:88,title:'External Acceptance Control Center Convergence',state:'PRODUCTION_GREEN',
  main_sha:'9c6d56b887b2aa4bb710e5980608b8942830034c',
  tree_sha:'9f7d279ed5c83795682ba763ca150f1fe91a6019',
  pages_deploy_run:34423649786,production_pages_deploy_run:34423649786,
  production_live_resource_integrity_run:34423737422,
  promotion_state:'EXACT_TREE_PRODUCTION_GREEN_STANDARD_CHAIN'
});
const CURRENT_GUARDS = Object.freeze(['System Gate','Current Application Quality Proof','I.T. Admin Runtime Proof','Repository Branch Hygiene']);
const EXTERNAL_POLICY = Object.freeze([
  {key:'stripe_development',label:'Stripe Development acceptance',state:'HOLD_EXTERNAL',authority:'six real dimensions: credentials, checkout, signed webhook, refund, reconciliation and idempotent replay',href:'/admin/release-control/external-acceptance/'},
  {key:'paypal_sandbox',label:'PayPal sandbox acceptance',state:'HOLD_EXTERNAL',authority:'six real dimensions: credentials, approval/capture, verified webhook, refund, reconciliation and idempotent replay',href:'/admin/release-control/external-acceptance/'},
  {key:'social_oauth',label:'Social/OAuth controlled acceptance',state:'HOLD_EXTERNAL',authority:'real selected-provider Development OAuth evidence required; publication stays closed',href:'/admin/release-control/external-acceptance/'},
  {key:'caip_private_media',label:'CAIP private-media acceptance',state:'EVIDENCE_DEPENDENT',authority:'fresh authenticated private review/range-streaming evidence required',href:'/admin/release-control/external-acceptance/'},
  {key:'cloudflare_access_service_token',label:'Cloudflare Access service-token acceptance',state:'HOLD_EXTERNAL',authority:'dispatch-only external service-token proof required',href:'/admin/release-control/external-acceptance/'}
]);
const clean=(value)=>String(value??'').trim();
const priority=(state)=>state==='red'?0:state==='amber'?1:2;
function recoveryQueue(subsystems={}){
  const seen=new Set(),queue=[];
  for(const [subsystem,value] of Object.entries(subsystems||{}))for(const finding of Array.isArray(value?.findings)?value.findings:[]){
    if(!finding||!['red','amber'].includes(finding.state))continue;
    const code=clean(finding.code)||`${subsystem}:${clean(finding.label)}`;if(seen.has(code))continue;seen.add(code);
    queue.push({subsystem,state:finding.state,priority:finding.state==='red'?'BLOCKING':'ATTENTION',code,label:clean(finding.label)||'Readiness finding',detail:clean(finding.detail),correction:clean(finding.correction)||'Open the linked corrective workspace and rerun the read-only preflight.',href:clean(finding.href)||'/admin/it/'});
  }
  queue.sort((a,b)=>priority(a.state)-priority(b.state)||a.label.localeCompare(b.label));return queue;
}

export async function onRequestGet(context){
  const [baseResponse,diagnosticResponse]=await Promise.all([getReadinessControlTower(context),getSelfDiagnostics(context)]);
  if(!baseResponse.ok)return baseResponse;
  if(!diagnosticResponse.ok)return diagnosticResponse;
  const [base,diagnostic]=await Promise.all([baseResponse.json().catch(()=>null),diagnosticResponse.json().catch(()=>null)]);
  if(!base?.ok||!diagnostic?.ok)return jsonResponse({release:RELEASE,build:BUILD,ok:false,error:'I.T. diagnostic authorities returned an invalid payload.'},503,{'Cache-Control':'no-store'});
  const subsystems=base.subsystems||{},queue=recoveryQueue(subsystems),red=queue.filter(x=>x.state==='red').length,amber=queue.filter(x=>x.state==='amber').length;
  const admin=subsystems.admin_authority?.metrics||{},database=subsystems.database?.metrics||{},self=diagnostic.diagnostics||{};
  const runtimeSha=clean(diagnostic.observations?.deployment?.sha)||clean(subsystems.deployment_ancestry?.runtime_source_sha)||null;
  return jsonResponse({
    release:RELEASE,build:BUILD,title:TITLE,ok:true,
    authority:'release467-build89-external-acceptance-environment-isolation',state:'DEVELOPMENT_CLOSURE_CANDIDATE',environment:diagnostic.environment||base.environment||'development',
    release_authority:{
      current_operator:{release:RELEASE,build:BUILD,title:TITLE,state:'DEVELOPMENT_CLOSURE_CANDIDATE'},
      accepted_development:ACCEPTED_DEVELOPMENT,verified_development:VERIFIED_DEVELOPMENT,production:PRODUCTION,
      restart_integrity:{protocol:'EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1',last_fully_verified:VERIFIED_DEVELOPMENT,current_closure_candidate:{release:467,build:89,title:TITLE,state:'AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF'},candidate_must_not_self_claim_final_proof:true},
      current_automatic_guards:CURRENT_GUARDS,persistent_branches:['main','dev'],production_promotion_required_development_proofs:CURRENT_GUARDS,
      rollback_readiness:'release-neutral-read-only',canonical_migration_authority:'migrations/canonical/manifest.json + scripts/d1_migrate.py',request_time_schema_mutation:false
    },
    development:{target:'https://dev.devilndove-site.pages.dev',pages_project:'devilndove-site',branch:'dev',d1_name:'devilndove-dev',product_r2:'devilndove-toolshed-images-dev',caip_r2:'devilndove-caip-media-dev',canonical_migrations:4,runtime_source_sha:runtimeSha,last_fully_verified:VERIFIED_DEVELOPMENT},
    headline_metrics:{readiness_score:Number(base.readiness?.score||0),readiness_state:clean(base.readiness?.overall)||'unknown',self_diagnostics_state:clean(self.overall_status)||'unknown',technical_blockers:Number(self.technical_blocker_count||0),technical_reviews:Number(self.technical_review_count||0),blocking_actions:red,attention_actions:amber,root_admin_full_manage:admin.root_admin_full_manage===true,active_profiles:Number(admin.active_profile_count||0),active_admins:Number(admin.active_admin_count||0),enabled_modules:Number(admin.enabled_modules||0),d1_tables:Number(database.tables||0),canonical_migrations:Number(database.canonical_migrations||0),migration_proofs:Number(database.migration_proofs||0),foreign_key_violations:Number(database.foreign_key_violations||0)},
    self_diagnostics:self,
    diagnostic_observations:diagnostic.observations||{},corrective_links:diagnostic.corrective_links||{},
    external_policy:EXTERNAL_POLICY,recovery_queue:queue,next_action:queue[0]||null,subsystems,
    truth_notes:[
      'Build 88 is the last fully verified Development checkpoint at 9c6d56b887b2aa4bb710e5980608b8942830034c / tree 9f7d279ed5c83795682ba763ca150f1fe91a6019 with System 34423493650, Quality 34423493830, I.T. 34423493747 and Hygiene 34423493617 successful plus exact Preview acceptance.',
      'Build 88 is Production GREEN at the same SHA/tree with Production Pages Deploy 34423649786 and Live Resource Integrity 34423737422 successful.',
      'Build 89 is the current External Acceptance Environment Isolation & Guided Recovery closure candidate. Production acceptance status remains read-only and never invokes the Development-only provider runner.',
      'Canonical D1 migrations remain exactly 0001-0004. Corrective instructions route the operator to the owning workspace; I.T. diagnostics perform no automatic repair.',
      'Stripe, PayPal, Social OAuth, Cloudflare Access and CAIP external acceptance remain separate from source/deployment health.'
    ],
    safety:{read_only_projection:true,automatic_repair:false,schema_change_required:false,request_time_schema_mutation:false,d1_mutation_from_endpoint:false,r2_mutation_from_endpoint:false,binding_mutation:false,deployment_execution:false,backup_restore_execution:false,provider_execution:false,provider_publication:false,production_mutation:false,production_business_data_overwrite:false,secret_values_emitted:false},
    generated_at:new Date().toISOString()
  },200,{'Cache-Control':'no-store'});
}
