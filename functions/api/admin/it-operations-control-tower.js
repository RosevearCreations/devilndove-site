// Release 467 Build 205 — current release/restart authority over canonical Build 204 GREEN restart boundary.
import { jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as getReadinessControlTower } from './it-control-tower.js';
import { onRequestGet as getSelfDiagnostics } from './it-self-diagnostics.js';

const RELEASE=467;
const BUILD=205;
const TITLE='Current Authority & Manufacturing-Era Roadmap Convergence';
const AUTHORITY='release467-build205-current-authority-manufacturing-era-roadmap-convergence';
const EVIDENCE_ID='r467-b204-48307e67-35483005170-35483092965';

const VERIFIED_DEVELOPMENT=Object.freeze({
  release:467,build:204,title:'Storefront Launch Set & Autonomous Closure',state:'DEVELOPMENT_GREEN',
  dev_sha:'48307e67978dee5ef4481ccfe2739a5d3df79b18',tree_sha:'4a63209efc54bc641ba0484c4954ac1cb35acc2e',
  system_gate_run:35483005170,current_application_quality_run:35483005094,it_admin_runtime_proof_run:35483005097,
  branch_hygiene_run:35483005113,build_specific_proof_run:35478691738,exact_preview_deployment:true,
  role:'LAST_FULLY_VERIFIED_RESTART_CHECKPOINT'
});
const ACCEPTED_DEVELOPMENT=Object.freeze({...VERIFIED_DEVELOPMENT,accepted_sha:VERIFIED_DEVELOPMENT.dev_sha,accepted_tree_sha:VERIFIED_DEVELOPMENT.tree_sha});
const PRODUCTION=Object.freeze({
  release:467,build:204,title:'Storefront Launch Set & Autonomous Closure',state:'PRODUCTION_GREEN',
  main_sha:'09253dbe5b43c4308d1ff671bb71df80bf0592d9',tree_sha:'4a63209efc54bc641ba0484c4954ac1cb35acc2e',
  pages_deploy_run:35483092965,production_pages_deploy_run:35483092965,
  production_live_resource_integrity_run:0,products_browser_proof_run:0,
  products_route_proof_run:0,build_specific_proof_run:35478779057,
  exact_production_url:'https://cd226d56.devilndove-site.pages.dev',remote_d1_queries:0
});
const PRODUCTION_PROOF_TRANSPORT=Object.freeze({
  max_attempts:3,retry_http_statuses:[408,425,429,500,502,503,504],
  retry_exceptions:['urllib.error.URLError','ConnectionResetError','TimeoutError'],
  permanent_4xx_fail_closed:true,resource_correctness_fail_closed:true,
  workflow:'.github/workflows/production-live-resource-integrity-proof.yml'
});
const CURRENT_GUARDS=Object.freeze([
  'System Gate','Current Application Quality Proof','I.T. Admin Runtime Proof','Repository Branch Hygiene',
  'Release 467 Build 205 Current Authority Manufacturing-Era Roadmap Convergence Proof'
]);
const CANONICAL_MIGRATIONS=Object.freeze([
  '0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql',
  '0003_release464_business_growth.sql','0004_release465_storefront_quality.sql',
  '0005_release467_inventory_process_assignment.sql','0006_release467_product_media_publication_guard.sql'
]);
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
    release:467,build:204,title:'Storefront Launch Set & Autonomous Closure',
    sha:VERIFIED_DEVELOPMENT.dev_sha,tree_sha:VERIFIED_DEVELOPMENT.tree_sha,
    development_proofs:{
      system_gate_run:35483005170,current_application_quality_run:35483005094,
      it_admin_runtime_proof_run:35483005097,branch_hygiene_run:35483005113,build204_proof_run:35478691738
    },
    production_proofs:{
      production_pages_deploy_run:35483092965,production_live_resource_integrity_run:0,
      products_browser_proof_run:0,products_route_proof_run:0,build204_proof_run:35478779057
    },
    production_main_sha:PRODUCTION.main_sha,production_state:'PRODUCTION_GREEN',same_tree:true,remote_d1_queries:0,
    retry_policy:PRODUCTION_PROOF_TRANSPORT,
    canonical_migration_authority:'migrations/canonical/manifest.json + scripts/d1_migrate.py',
    canonical_migrations:CANONICAL_MIGRATIONS,
    external_lanes:Object.fromEntries(EXTERNAL_POLICY.map((x)=>[x.key,x.state])),
    runtime_closure:{
      product_detail_core_requests:1,request_time_schema_mutation:false,bucket_wide_r2_listing:false,
      background_polling:false,code_only_production_zero_d1:true
    },
    next_build:'Build 205 converges machine, I.T. and human restart authority over exact Build 204/current roadmap proof.'
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
  return `# Devil n Dove Release 467 Build 204 Canonical Restart Evidence Pack

- Evidence ID: ${pack.evidence_id}
- Production state: ${pack.production_state}
- Canonical Development SHA: ${pack.sha}
- Canonical Production main SHA: ${PRODUCTION.main_sha}
- Shared tree: ${pack.tree_sha}
- System Gate: 35483005170
- Current Application Quality Proof: 35483005094
- I.T. Admin Runtime Proof: 35483005097
- Repository Branch Hygiene: 35483005113
- Original Build 204 Development Proof: 35478691738
- Canonical Production Pages Deploy: 35483092965
- Original Build 204 Production Proof: 35478779057
- Original Build 204 Production Pages: 35478779248
- Production remote D1 queries for roadmap promotion: 0
- Current candidate: Build 205 Current Authority & Manufacturing-Era Roadmap Convergence
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
    release:RELEASE,build:BUILD,title:TITLE,ok:true,authority:AUTHORITY,state:'DEVELOPMENT_CLOSURE_CANDIDATE',
    release_authority:{
      current_operator:{release:RELEASE,build:BUILD,title:TITLE,state:'DEVELOPMENT_CLOSURE_CANDIDATE'},
      accepted_development:ACCEPTED_DEVELOPMENT,verified_development:VERIFIED_DEVELOPMENT,production:PRODUCTION,
      production_proof_transport:PRODUCTION_PROOF_TRANSPORT,
      restart_integrity:{
        protocol:'EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1',last_fully_verified:VERIFIED_DEVELOPMENT,
        current_closure_candidate:{release:467,build:205,title:TITLE,authority:'release467-build205-current-authority-manufacturing-era-roadmap-convergence.json'},
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
    subsystems:base?.subsystems||{},self_diagnostics:diagnostic?.diagnostics||{},
    build86_diagnostic_contract:BUILD86_DIAGNOSTIC_CONTRACT,external_policy:EXTERNAL_POLICY,
    truth_notes:[
      'Build 204/current roadmap source is the exact last fully verified Development checkpoint.',
      'Build 204/current roadmap Production is GREEN on the identical source tree with code/docs-only / zero-D1 promotion.',
      'Development proofs: System 35483005170, Quality 35483005094, I.T. 35483005097, Hygiene 35483005113.',
      'Current Production proof: Pages 35483092965. Original Build 204 runtime Production proof remains retained separately.',
      'Build 205 Current Authority & Manufacturing-Era Roadmap Convergence is the active Development closure candidate.',
      'Canonical D1 migrations are 0001-0006; request-time schema mutation remains closed.'
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
