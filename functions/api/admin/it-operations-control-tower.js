// Release 467 Build 241 — current release/restart authority over exact Build 240 GREEN predecessor.
import { jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as getReadinessControlTower } from './it-control-tower.js';
import { onRequestGet as getSelfDiagnostics } from './it-self-diagnostics.js';

const RELEASE=467;
const BUILD=241;
const TITLE='Cross-Authority Handoff Simplification';
const AUTHORITY='release467-build241-cross-authority-handoff-simplification';
const EVIDENCE_ID='r467-b240-b239-35874693973-35877290030';

const VERIFIED_DEVELOPMENT=Object.freeze({
  release:467,build:240,title:'API Read Budget, Cache & Batch Streamlining',state:'DEVELOPMENT_GREEN',
  dev_sha:'3fb60a9f3be8c40ca415ecd3cdcf7a44bff081d8',tree_sha:'6388a8259bdf4902e220fed5e1dd9f21766c2357',
  system_gate_run:35874693973,current_application_quality_run:35874693732,it_admin_runtime_proof_run:35874693995,
  branch_hygiene_run:35874694168,proof_state:'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN',
  exact_preview_deployment:true,role:'LAST_FULLY_VERIFIED_RESTART_CHECKPOINT'
});
const ACCEPTED_DEVELOPMENT=Object.freeze({...VERIFIED_DEVELOPMENT,accepted_sha:VERIFIED_DEVELOPMENT.dev_sha,accepted_tree_sha:VERIFIED_DEVELOPMENT.tree_sha});
const PRODUCTION=Object.freeze({
  release:467,build:240,title:'API Read Budget, Cache & Batch Streamlining',state:'PRODUCTION_GREEN',
  main_sha:'a9efe9826c6ad7e400fa174f7cd6a8e6d980c452',tree_sha:'6388a8259bdf4902e220fed5e1dd9f21766c2357',
  production_pages_deploy_run:35877290030,production_live_resource_integrity_run:35877494906,
  products_browser_proof_run:35877494864,products_route_proof_run:35877494771,remote_d1_queries:0
});
const PRODUCTION_PROOF_TRANSPORT=Object.freeze({
  max_attempts:3,retry_http_statuses:[408,425,429,500,502,503,504],
  retry_exceptions:['urllib.error.URLError','ConnectionResetError','TimeoutError'],
  permanent_4xx_fail_closed:true,resource_correctness_fail_closed:true,
  workflow:'.github/workflows/production-live-resource-integrity-proof.yml'
});
const CURRENT_GUARDS=Object.freeze([
  'System Gate','Current Application Quality Proof','I.T. Admin Runtime Proof','Repository Branch Hygiene',
  'Release 467 Build 241 API Read Budget Cache Batch Streamlining'
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
    release:467,build:240,title:'API Read Budget, Cache & Batch Streamlining',
    sha:VERIFIED_DEVELOPMENT.dev_sha,tree_sha:VERIFIED_DEVELOPMENT.tree_sha,
    development_proofs:{
      system_gate_run:35874693973,current_application_quality_run:35874693732,
      it_admin_runtime_proof_run:35874693995,branch_hygiene_run:35874694168
    },
    production_proofs:{
      production_pages_deploy_run:35877290030,production_live_resource_integrity_run:35877494906,
      products_browser_proof_run:35877494864,products_route_proof_run:35877494771
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
    next_build:'Build 241 is the active owner-authorized read-budget/browser-freeze correction; Build 241 follows only after exact Build 241 Production GREEN.'
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
  return `# Devil n Dove Release 467 Build 241 Canonical Restart Evidence Pack

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
- Current candidate: Build 241 Cross-Authority Handoff Simplification
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
        current_closure_candidate:{release:467,build:240,title:TITLE,authority:'release467-build241-cross-authority-handoff-simplification.json'},
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
      'Build 240 source is the exact last fully verified Development checkpoint.',
      'Build 240 Production is GREEN on the identical tree 6388a8259bdf4902e220fed5e1dd9f21766c2357.',
      'Development proofs: System 35874693973, Quality 35874693732, I.T. 35874693995, Hygiene 35874694168.',
      'Production proofs: Pages 35877290030, Live Resources 35877494906, Product Browser 35877494864, Product Route 35877494771.',
      'Build 241 Cross-Authority Handoff Simplification is the active Development candidate and contains the reported Admin lockup.',
      'Build 241 adds no schema change, new business-write authority or automatic provider mutation.'
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
