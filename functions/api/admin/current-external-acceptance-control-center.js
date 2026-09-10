// Release 467 Build 90 — structured cross-lane external acceptance evidence.
// Build 89 environment isolation remains authoritative: bridge-first everywhere, provider runner only on Development.
import { jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as getCommercialBridge } from './release467-external-commercial-acceptance.js';
import { onRequestGet as getProviderRunner } from './provider-acceptance-runner.js';

const RELEASE = 467;
const BUILD = 90;
const TITLE = 'External Acceptance Evidence Depth & Cross-Lane Guidance';
const AUTHORITY = 'release467-build90-external-acceptance-evidence-depth';
const VERIFIED_DEVELOPMENT = Object.freeze({
  release:467,build:89,title:'External Acceptance Environment Isolation & Guided Recovery',
  dev_sha:'68ac415302bceddb81e6faea15fbbebb3a76f24a',
  tree_sha:'1a7cccf46b29718ea63d532c8c22322bcca98ffd',
  system_gate_run:34425720516,current_application_quality_run:34425720539,
  it_admin_runtime_proof_run:34425720559,branch_hygiene_run:34425720537,
  proof_state:'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN',exact_preview_deployment:true
});
const PRODUCTION = Object.freeze({
  release:467,build:89,title:'External Acceptance Environment Isolation & Guided Recovery',state:'PRODUCTION_GREEN',
  main_sha:'68ac415302bceddb81e6faea15fbbebb3a76f24a',
  tree_sha:'1a7cccf46b29718ea63d532c8c22322bcca98ffd',
  production_pages_deploy_run:34425875315,
  production_live_resource_integrity_run:34425949898
});
const text=(value)=>String(value??'').trim();
const copy=(value)=>value&&typeof value==='object'?JSON.parse(JSON.stringify(value)):value;
const passed=(row)=>['passed','accepted'].includes(text(row?.check_state).toLowerCase());
const settled=(status)=>['paid','partially_refunded','refunded'].includes(text(status).toLowerCase());
const check=(key,label,ok,detail,evidenceReference=null,required=true,lastCheckedAt=null)=>({
  check_key:key,check_label:label,check_state:ok?'passed':'pending',required,
  evidence_present:ok,evidence_reference:evidenceReference,last_checked_at:lastCheckedAt,
  detail, last_safe_error:null, evidence_source:'release467-build90-current-projection'
});

function runtimeBoundary(request,env={}){
  let host='';
  try{host=new URL(request.url).hostname.toLowerCase();}catch{}
  const environment=text(env.DND_ENVIRONMENT).toLowerCase();
  const branch=text(env.CF_PAGES_BRANCH).toLowerCase();
  const sha=text(env.CF_PAGES_COMMIT_SHA)||null;
  const production=environment==='production'||branch==='main'||host==='devilndove.com'||host==='www.devilndove.com';
  const development=!production&&(environment==='development'||branch==='dev'||host==='dev.devilndove-site.pages.dev'||host.endsWith('.devilndove-site.pages.dev'));
  return {environment:production?'production':development?'development':environment||'unknown',branch:branch||null,host:host||null,runtime_source_sha:/^[0-9a-f]{40}$/i.test(sha||'')?sha:null,development,production};
}

function bridgeChecks(item={}){
  return (Array.isArray(item.checks)?item.checks:[]).map(row=>({
    check_key:text(row?.check_key),check_label:text(row?.check_label)||text(row?.check_key),
    check_state:text(row?.check_state)||'pending',required:true,
    evidence_present:row?.evidence_reference_present===true||row?.evidence_present===true,
    evidence_reference:text(row?.evidence_reference)||null,last_checked_at:row?.last_checked_at||null,
    detail:text(row?.correction_mechanics)||text(row?.detail)||'',last_safe_error:text(row?.last_safe_error)||null,
    evidence_source:text(row?.evidence_source)||null
  }));
}

function fallbackRunnerChecks(provider,evidence={}){
  const inherited=(Array.isArray(evidence.checks)?evidence.checks:[]).map(row=>({
    check_key:text(row?.check_key),check_label:text(row?.check_label)||text(row?.check_key),
    check_state:text(row?.check_state)||'pending',required:true,evidence_present:row?.evidence_present===true,
    evidence_reference:text(row?.evidence_reference)||null,last_checked_at:null,detail:text(row?.detail)||'',
    last_safe_error:null,evidence_source:'provider-acceptance-runner'
  }));
  if(!inherited.some(row=>row.check_key==='refund'))inherited.push({
    check_key:'refund',check_label:provider==='stripe'?'Provider-synchronized test refund completes':'Provider-synchronized sandbox refund completes',
    check_state:evidence.refund_accepted===true?'passed':'pending',required:true,evidence_present:evidence.refund_accepted===true,
    evidence_reference:evidence.refund_accepted===true?`current:${provider}:provider-synchronized-refund`:null,
    last_checked_at:evidence?.provider_refund?.provider_sync_at||null,
    detail:evidence.refund_accepted===true?'A synchronized provider refund is recorded.':'A provider-synchronized Development test/sandbox refund is still required.',
    last_safe_error:null,evidence_source:'payment_refunds'
  });
  return inherited;
}

function configFromBridge(item={}){
  const boundary=item.execution_boundary||{};
  return {
    configuration_ready:boundary.configured===true&&boundary.test_mode===true&&boundary.live_credential_detected!==true,
    credential_mode:boundary.live_credential_detected===true?'live_forbidden':boundary.test_mode===true?'test_or_sandbox':'missing_or_invalid',
    development_host:boundary.development_host===true,operator_switch_set:boundary.operator_switch_set===true,
    execution_authorized:boundary.execution_authorized_now===true,live_credential_detected:boundary.live_credential_detected===true,
    execution_code:text(boundary.execution_code)||null,secret_values_emitted:false
  };
}

function paymentNextAction(provider,lane,actionLaneAvailable){
  const missing=(lane.checks||[]).find(row=>row.required!==false&&!passed(row));
  const stableDevelopment='https://dev.devilndove-site.pages.dev/admin/release-control/external-acceptance/';
  if(!missing)return {state:'complete',label:'All six evidence checks are present',action:null,action_enabled:false,href:null,provider_network_call:false};
  const key=missing.check_key;
  if(key==='credentials')return {state:'required',label:'Complete test/sandbox provider configuration',action:'configure_credentials',action_enabled:false,href:'/admin/it-integrations/',provider_network_call:false};
  if(key==='checkout'||key==='approval-capture')return {state:'required',label:provider==='stripe'?'Prepare and complete the Stripe Development checkout':'Prepare and complete the PayPal sandbox approval/capture',action:'prepare_checkout',action_enabled:actionLaneAvailable===true,href:actionLaneAvailable?null:stableDevelopment,provider_network_call:actionLaneAvailable===true};
  if(key==='webhook-signature'||key==='webhook-verification')return {state:'required',label:'Complete provider flow and capture a verified webhook',action:'complete_or_resend_webhook',action_enabled:false,href:stableDevelopment,provider_network_call:false};
  if(key==='refund'){
    const canRefund=actionLaneAvailable===true&&settled(lane?.acceptance_payment?.payment_status)&&lane?.configuration?.execution_authorized===true;
    return {state:'required',label:canRefund?'Run the provider-synchronized refund proof':'Settle the Development acceptance payment before the refund proof',action:'refund_latest',action_enabled:canRefund,href:canRefund?null:stableDevelopment,provider_network_call:canRefund};
  }
  if(key==='reconciliation')return {state:'required',label:'Refresh after the verified provider event reconciles locally',action:'refresh_evidence',action_enabled:actionLaneAvailable===true,href:actionLaneAvailable?null:stableDevelopment,provider_network_call:false};
  if(key==='idempotent-replay')return {state:'required',label:'Replay the same verified webhook and confirm duplicate handling',action:'resend_webhook',action_enabled:false,href:stableDevelopment,provider_network_call:false};
  return {state:'required',label:missing.detail||`Complete ${missing.check_label||key}`,action:null,action_enabled:false,href:stableDevelopment,provider_network_call:false};
}

function normalizePaymentLane(provider,bridge={},runnerEvidence=null,actionLaneAvailable=false){
  const checks=bridgeChecks(bridge);
  const normalizedChecks=checks.length===6?checks:fallbackRunnerChecks(provider,runnerEvidence||{});
  const required=normalizedChecks.filter(row=>row.required!==false);
  const allPassed=required.length===6&&required.every(passed);
  const configuration=runnerEvidence?.configuration?copy(runnerEvidence.configuration):configFromBridge(bridge);
  const lane={
    key:provider==='stripe'?'stripe_development':'paypal_sandbox',label:provider==='stripe'?'Stripe Development':'PayPal sandbox',
    acceptance_state:bridge.accepted===true&&allPassed?'ACCEPTED':'HOLD_EXTERNAL',accepted:bridge.accepted===true&&allPassed,
    required_check_count:6,accepted_check_count:required.filter(passed).length,checks:normalizedChecks,configuration,
    acceptance_payment:copy(runnerEvidence?.acceptance_payment)||null,verified_webhook:copy(runnerEvidence?.verified_webhook)||null,
    duplicate_replay:copy(runnerEvidence?.duplicate_replay)||null,provider_refund:copy(runnerEvidence?.provider_refund)||null,
    refund_accepted:bridge?.refund_evidence?.accepted===true||runnerEvidence?.refund_accepted===true,
    bridge_acceptance_state:text(bridge.acceptance_state)||null,bridge_accepted:bridge.accepted===true,
    evidence_timestamp:normalizedChecks.map(row=>row.last_checked_at).filter(Boolean).sort().at(-1)||null,
    evidence_freshness_state:'timestamp_visible_no_automatic_age_acceptance',
    evidence_authority:'release467-external-commercial-acceptance',runner_enrichment_available:Boolean(runnerEvidence),
    provider_secret_values_emitted:false,token_values_emitted:false,automatic_provider_execution:false,production_execution:false
  };
  lane.next_action=paymentNextAction(provider,lane,actionLaneAvailable);
  return lane;
}

function normalizeCaipLane(item={}){
  const range=item.range_evidence||null;
  const timestamp=range?.created_at||null;
  const checks=[
    check('schema_ready','Private-review schema available',item.schema_ready===true,'Creative asset grants and audit authorities must both be available.',item.schema_ready===true?'d1:creative_asset_access_grants+creative_asset_access_audit':null,true,timestamp),
    check('review_proxy_served','Authenticated private review proxy served evidence',Number(item.review_proxy_served_events||0)>0,'At least one authenticated private review proxy serve must be recorded.',Number(item.review_proxy_served_events||0)>0?`d1:review_proxy_served:${Number(item.review_proxy_served_events||0)}`:null,true,timestamp),
    check('ranged_streaming','Ranged streaming evidence',range?.ranged_streaming===true,'The accepted private-media serve must prove ranged streaming.',range?.ranged_streaming===true?'audit:ranged_streaming':null,true,timestamp),
    check('no_copy','No-copy evidence',range?.no_copy===true,'The accepted private-media serve must prove no-copy handling.',range?.no_copy===true?'audit:no_copy':null,true,timestamp),
    check('no_cache','No-cache evidence',range?.no_cache===true,'The accepted private-media serve must prove no-cache handling.',range?.no_cache===true?'audit:no_cache':null,true,timestamp),
    check('object_key_present','Private object-key presence',range?.object_key_present===true,'Useful evidence that the proxy resolved a private-media object key; informational and not a separate acceptance blocker.',range?.object_key_present===true?'audit:object_key_present':null,false,timestamp)
  ];
  const required=checks.filter(row=>row.required!==false),accepted=item.accepted===true&&required.every(passed);
  const missing=required.find(row=>!passed(row));
  return {
    key:'caip_private_media',label:'CAIP private-media acceptance',acceptance_state:accepted?'ACCEPTED':'EVIDENCE_DEPENDENT',accepted,
    owner:'Creators / I.T.',policy:text(item.policy)||'Fresh authenticated Development private-media evidence is required.',
    checks,required_check_count:required.length,accepted_check_count:required.filter(passed).length,
    evidence_timestamp:timestamp,evidence_freshness_state:timestamp?'timestamp_visible_requires_operator_current-release-judgment':'missing_timestamp',
    evidence:copy(item),correction_href:'/admin/runtime-acceptance/',
    next_action:accepted?{state:'complete',label:'Required CAIP evidence checks are present; verify the timestamp is appropriate for the current release before external closure.',href:'/admin/runtime-acceptance/'}:{state:'required',label:missing?.detail||'Capture fresh authenticated private review/range-streaming evidence.',href:'/admin/runtime-acceptance/'},
    provider_secret_values_emitted:false,token_values_emitted:false,automatic_provider_execution:false,provider_publication:false,production_execution:false
  };
}

function normalizeSocialLane(item={}){
  const providers=Array.isArray(item.providers)?item.providers:[];
  const selected=Number(item.selected_provider_count||providers.length||0);
  const allReadiness=selected>0&&providers.length>0&&providers.every(row=>row.readiness_passed===true);
  const allIdentity=selected>0&&providers.length>0&&providers.every(row=>row.intended_account_evidence_present===true);
  const allLifecycle=selected>0&&providers.length>0&&providers.every(row=>row.controlled_lifecycle_evidence_present===true);
  const publicationClosed=item.publication_allowed!==true;
  const checks=[
    check('provider_selection','Intended Development provider selected',selected>0,'Select only the intended Development provider/account for controlled OAuth acceptance.',selected>0?`selected-provider-count:${selected}`:null),
    check('provider_readiness','Selected-provider readiness checks passed',allReadiness,'All selected-provider configuration/readiness checks must pass.',allReadiness?'d1:it_provider_readiness_checks':null),
    check('intended_account','Intended-account identity evidence present',allIdentity,'Each selected provider must prove the intended remote account identity.',allIdentity?'d1:oauth_provider_connections:intended-account':null),
    check('controlled_lifecycle','Controlled OAuth lifecycle evidence present',allLifecycle,'Each selected provider must have controlled connect/refresh/revoke lifecycle evidence.',allLifecycle?'d1:oauth_security_events+lifecycle':null),
    check('publication_closed','Provider publication remains closed',publicationClosed,'OAuth acceptance never authorizes provider publication.',publicationClosed?'policy:provider-publication-closed':null)
  ];
  const accepted=item.accepted===true&&checks.every(passed),missing=checks.find(row=>!passed(row));
  let href='/admin/social-publishing/';
  if(missing?.check_key==='provider_selection'||missing?.check_key==='provider_readiness')href='/admin/it-integrations/';
  return {
    key:'social_oauth',label:'Social / OAuth controlled acceptance',acceptance_state:accepted?'ACCEPTED':'HOLD_EXTERNAL',accepted,
    owner:'Socials / I.T.',policy:text(item.policy)||'Controlled Development OAuth evidence is required; publication remains closed.',
    checks,required_check_count:checks.length,accepted_check_count:checks.filter(passed).length,
    evidence_timestamp:null,evidence_freshness_state:'current_database_state_visible_no_timestamp_self_attestation',
    evidence:copy(item),correction_href:href,
    next_action:accepted?{state:'complete',label:'Selected-provider OAuth acceptance evidence is present; publication remains separately closed.',href:'/admin/social-publishing/'}:{state:'required',label:missing?.detail||'Complete controlled Development OAuth evidence.',href},
    provider_secret_values_emitted:false,token_values_emitted:false,automatic_provider_execution:false,provider_publication:false,production_execution:false
  };
}

function accessLane(){
  const checks=[
    check('source_harness','Access acceptance harness source is present',true,'The retained Build 6 dispatch-only harness remains the source authority.','release467-build6-access-acceptance-harness.json'),
    check('exact_dev_sha','Exact reviewed Development SHA supplied to dispatch',false,'The application cannot self-attest the workflow input SHA; the external dispatch must supply the exact reviewed Development SHA.'),
    check('service_token_secrets','Cloudflare Access service-token GitHub Actions secrets available',false,'Secret-name requirements are known, but secret existence/values cannot be read or inferred by the application.'),
    check('dispatch_success','Dispatch-only Access workflow succeeded',false,'A successful external Build 6 Access acceptance workflow run is required.'),
    check('application_401_reached','Probe passed Access and reached expected application 401',false,'PASS requires the service token to pass Cloudflare Access and the no-session application request to return the intentional 401 Unauthorized JSON.')
  ];
  return {
    key:'cloudflare_access_service_token',label:'Cloudflare Access service-token acceptance',acceptance_state:'HOLD_EXTERNAL',accepted:false,
    owner:'I.T. / Cloudflare Access',policy:'Application source can describe the dispatch contract but cannot self-declare the external Access proof.',
    checks,required_check_count:checks.length,accepted_check_count:checks.filter(passed).length,
    evidence_timestamp:null,evidence_freshness_state:'external_workflow_evidence_required',
    evidence_authority:'release467-build6-access-acceptance-harness.json',correction_href:'/admin/it/',
    next_action:{state:'required',label:'Dispatch the separate Cloudflare Access service-token proof against the exact reviewed Development SHA and retain sanitized successful evidence.',href:'/admin/it/'},
    correction_mechanic:'Run the dispatch-only service-token acceptance against the exact reviewed Development SHA. Application source/configuration cannot self-declare this external proof.',
    provider_execution:false,production_mutation:false,secret_values_emitted:false
  };
}

export async function onRequestGet(context){
  const runtime=runtimeBoundary(context.request,context.env||{});
  const bridgeResponse=await getCommercialBridge(context);
  const bridge=await bridgeResponse.json().catch(()=>null);
  if(!bridgeResponse.ok||!bridge?.ok)return jsonResponse({ok:false,release:RELEASE,build:BUILD,title:TITLE,error:text(bridge?.error)||'Current commercial evidence bridge is unavailable.',runtime,provider_runner_invoked:false,provider_execution:false,production_mutation:false,secret_values_emitted:false},bridgeResponse.status||503,{'Cache-Control':'no-store'});

  let runner=null,runnerStatus={invoked:false,available:false,status:null,error:null};
  if(runtime.development){
    runnerStatus.invoked=true;
    const runnerResponse=await getProviderRunner(context);
    runnerStatus.status=runnerResponse.status;
    runner=await runnerResponse.json().catch(()=>null);
    if(runnerResponse.ok&&runner?.ok){runnerStatus.available=true;}
    else{runnerStatus.error=text(runner?.error)||`Development provider runner unavailable (${runnerResponse.status}).`;runner=null;}
  }

  const bridgeItems=bridge.items||{},providers=runner?.providers||{};
  const actionLaneAvailable=runtime.development&&runnerStatus.available===true;
  const stripe=normalizePaymentLane('stripe',bridgeItems.stripe_development||{},providers.stripe||null,actionLaneAvailable);
  const paypal=normalizePaymentLane('paypal',bridgeItems.paypal_sandbox||{},providers.paypal||null,actionLaneAvailable);
  const caip=normalizeCaipLane(bridgeItems.caip_private_media||{});
  const social=normalizeSocialLane(bridgeItems.social_oauth||{});
  const access=accessLane();
  const lanes=[stripe,paypal,social,caip,access];
  const acceptedLaneCount=lanes.filter(row=>row.accepted===true).length;
  const requiredCheckCount=lanes.reduce((sum,row)=>sum+Number(row.required_check_count||0),0);
  const acceptedCheckCount=lanes.reduce((sum,row)=>sum+Number(row.accepted_check_count||0),0);
  const externalAcceptanceComplete=acceptedLaneCount===lanes.length;

  return jsonResponse({
    ok:true,release:RELEASE,build:BUILD,title:TITLE,authority:AUTHORITY,state:externalAcceptanceComplete?'EXTERNAL_ACCEPTANCE_COMPLETE':'HOLD_EXTERNAL',
    runtime,verified_development:VERIFIED_DEVELOPMENT,production:PRODUCTION,
    summary:{required_lane_count:lanes.length,accepted_lane_count:acceptedLaneCount,pending_lane_count:lanes.length-acceptedLaneCount,required_check_count:requiredCheckCount,accepted_check_count:acceptedCheckCount,external_acceptance_complete:externalAcceptanceComplete,production_promotion_ready_inferred:false},
    lanes:{stripe_development:stripe,paypal_sandbox:paypal,social_oauth:social,caip_private_media:caip,cloudflare_access_service_token:access},
    provider_runner:runnerStatus,
    provider_action_lane:{endpoint:'/api/admin/provider-acceptance-runner',available:actionLaneAvailable,availability_reason:actionLaneAvailable?'canonical_development_runner_available':runtime.production?'production_read_only_projection':'development_runner_unavailable',allowed_providers:['stripe','paypal'],allowed_actions:['refresh_evidence','prepare_checkout','refund_latest'],explicit_human_confirmation_required:true,development_host_required:true,provider_test_or_sandbox_credentials_required:true,payment_provider_mutations_switch_required:true,production_execution:false,automatic_execution:false,secret_values_emitted:false},
    authorities:{historical_commercial_bridge:'release467-build7-external-commercial-acceptance.json',historical_provider_runner:'release466-build6-provider-acceptance-readiness.json',cloudflare_access:'release467-build6-access-acceptance-harness.json',social_oauth:'release467-build85-socials-oauth-acceptance.json',build89_final_closure:'release467-build89-external-acceptance-environment-isolation.json',current_release:'release467-build90-external-acceptance-evidence-depth.json'},
    truth_notes:[
      'Build 89 is the exact verified Development and Production baseline consumed by Build 90.',
      'Build 90 preserves Build 89 environment isolation: Production remains bridge-first/read-only and never invokes the Development-only provider runner.',
      'All five external lanes now expose structured check counts and one explicit next action.',
      'CAIP and Social/OAuth depth is derived from the existing read-only commercial evidence bridge; Build 90 adds no new D1 writes or provider calls.',
      'Cloudflare Access remains externally proven only. Application source can expose the checklist but cannot infer workflow secret availability or a successful dispatch.',
      'Evidence timestamps are shown when available, but Build 90 never converts age alone into acceptance or silently calls historical evidence fresh.',
      'Production provider execution and provider publication remain closed; source/deployment GREEN does not satisfy external acceptance.'
    ],
    safety:{read_only_projection:true,request_time_schema_mutation:false,d1_mutation_from_endpoint:false,r2_mutation_from_endpoint:false,binding_mutation:false,automatic_provider_execution:false,provider_publication:false,production_provider_execution:false,production_mutation:false,production_business_data_overwrite:false,secret_values_emitted:false},
    generated_at:new Date().toISOString()
  },200,{'Cache-Control':'no-store'});
}
