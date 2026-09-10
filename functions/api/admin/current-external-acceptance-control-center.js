// Release 467 Build 89 — environment-isolated external acceptance control center.
// Acceptance truth is read-only and bridge-first. The historical provider runner is invoked
// only on Development; Production renders a safe read-only projection with all actions closed.
import { jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as getCommercialBridge } from './release467-external-commercial-acceptance.js';
import { onRequestGet as getProviderRunner } from './provider-acceptance-runner.js';

const RELEASE = 467;
const BUILD = 89;
const TITLE = 'External Acceptance Environment Isolation & Guided Recovery';
const AUTHORITY = 'release467-build89-external-acceptance-environment-isolation';
const VERIFIED_DEVELOPMENT = Object.freeze({
  release:467,build:88,title:'External Acceptance Control Center Convergence',
  dev_sha:'9c6d56b887b2aa4bb710e5980608b8942830034c',
  tree_sha:'9f7d279ed5c83795682ba763ca150f1fe91a6019',
  system_gate_run:34423493650,current_application_quality_run:34423493830,
  it_admin_runtime_proof_run:34423493747,branch_hygiene_run:34423493617,
  proof_state:'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN',exact_preview_deployment:true
});
const PRODUCTION = Object.freeze({
  release:467,build:88,title:'External Acceptance Control Center Convergence',state:'PRODUCTION_GREEN',
  main_sha:'9c6d56b887b2aa4bb710e5980608b8942830034c',
  tree_sha:'9f7d279ed5c83795682ba763ca150f1fe91a6019',
  production_pages_deploy_run:34423649786,
  production_live_resource_integrity_run:34423737422
});
const ACCESS_LANE = Object.freeze({
  key:'cloudflare_access_service_token',label:'Cloudflare Access service-token acceptance',
  acceptance_state:'HOLD_EXTERNAL',accepted:false,owner:'I.T. / Cloudflare Access',
  evidence_authority:'release467-build6-access-acceptance-harness.json',
  correction_href:'/admin/it/',
  correction_mechanic:'Run the dispatch-only service-token acceptance against the exact reviewed Development SHA. Application source/configuration cannot self-declare this external proof.',
  provider_execution:false,production_mutation:false,secret_values_emitted:false
});
const text=(value)=>String(value??'').trim();
const copy=(value)=>value&&typeof value==='object'?JSON.parse(JSON.stringify(value)):value;
const passed=(row)=>['passed','accepted'].includes(text(row?.check_state).toLowerCase());
const settled=(status)=>['paid','partially_refunded','refunded'].includes(text(status).toLowerCase());

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
    check_key:text(row?.check_key),
    check_label:text(row?.check_label)||text(row?.check_key),
    check_state:text(row?.check_state)||'pending',
    evidence_present:row?.evidence_reference_present===true||row?.evidence_present===true,
    evidence_reference:text(row?.evidence_reference)||null,
    last_checked_at:row?.last_checked_at||null,
    detail:text(row?.correction_mechanics)||text(row?.detail)||'',
    last_safe_error:text(row?.last_safe_error)||null,
    evidence_source:text(row?.evidence_source)||null
  }));
}

function fallbackRunnerChecks(provider,evidence={}){
  const inherited=(Array.isArray(evidence.checks)?evidence.checks:[]).map(row=>({
    check_key:text(row?.check_key),check_label:text(row?.check_label)||text(row?.check_key),
    check_state:text(row?.check_state)||'pending',evidence_present:row?.evidence_present===true,
    evidence_reference:text(row?.evidence_reference)||null,last_checked_at:null,
    detail:text(row?.detail)||'',last_safe_error:null,evidence_source:'provider-acceptance-runner'
  }));
  if(!inherited.some(row=>row.check_key==='refund'))inherited.push({
    check_key:'refund',check_label:provider==='stripe'?'Provider-synchronized test refund completes':'Provider-synchronized sandbox refund completes',
    check_state:evidence.refund_accepted===true?'passed':'pending',evidence_present:evidence.refund_accepted===true,
    evidence_reference:evidence.refund_accepted===true?`current:${provider}:provider-synchronized-refund`:null,last_checked_at:evidence?.provider_refund?.provider_sync_at||null,
    detail:evidence.refund_accepted===true?'A synchronized provider refund is recorded.':'A provider-synchronized Development test/sandbox refund is still required.',last_safe_error:null,evidence_source:'payment_refunds'
  });
  return inherited;
}

function configFromBridge(item={}){
  const boundary=item.execution_boundary||{};
  return {
    configuration_ready:boundary.configured===true&&boundary.test_mode===true&&boundary.live_credential_detected!==true,
    credential_mode:boundary.live_credential_detected===true?'live_forbidden':boundary.test_mode===true?'test_or_sandbox':'missing_or_invalid',
    development_host:boundary.development_host===true,
    operator_switch_set:boundary.operator_switch_set===true,
    execution_authorized:boundary.execution_authorized_now===true,
    live_credential_detected:boundary.live_credential_detected===true,
    execution_code:text(boundary.execution_code)||null,
    secret_values_emitted:false
  };
}

function paymentNextAction(provider,lane,actionLaneAvailable){
  const missing=(lane.checks||[]).find(row=>!passed(row));
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
  const allPassed=normalizedChecks.length===6&&normalizedChecks.every(passed);
  const configuration=runnerEvidence?.configuration?copy(runnerEvidence.configuration):configFromBridge(bridge);
  const lane={
    key:provider==='stripe'?'stripe_development':'paypal_sandbox',
    label:provider==='stripe'?'Stripe Development':'PayPal sandbox',
    acceptance_state:bridge.accepted===true&&allPassed?'ACCEPTED':'HOLD_EXTERNAL',
    accepted:bridge.accepted===true&&allPassed,
    required_check_count:6,accepted_check_count:normalizedChecks.filter(passed).length,checks:normalizedChecks,
    configuration,
    acceptance_payment:copy(runnerEvidence?.acceptance_payment)||null,
    verified_webhook:copy(runnerEvidence?.verified_webhook)||null,
    duplicate_replay:copy(runnerEvidence?.duplicate_replay)||null,
    provider_refund:copy(runnerEvidence?.provider_refund)||null,
    refund_accepted:bridge?.refund_evidence?.accepted===true||runnerEvidence?.refund_accepted===true,
    bridge_acceptance_state:text(bridge.acceptance_state)||null,
    bridge_accepted:bridge.accepted===true,
    evidence_authority:'release467-external-commercial-acceptance',
    runner_enrichment_available:Boolean(runnerEvidence),
    provider_secret_values_emitted:false,token_values_emitted:false,automatic_provider_execution:false,production_execution:false
  };
  lane.next_action=paymentNextAction(provider,lane,actionLaneAvailable);
  return lane;
}

function normalizeBridgeLane(key,label,item={},href){
  const accepted=item.accepted===true;
  return {
    key,label,acceptance_state:text(item.acceptance_state)||'HOLD_EXTERNAL',accepted,
    owner:key==='caip_private_media'?'Creators / I.T.':'Socials / I.T.',
    correction_href:href,policy:text(item.policy)||'',evidence:copy(item),
    next_action:accepted?{state:'complete',label:'Current evidence accepted',href:null}:{state:'required',label:text(item.policy)||'Complete fresh Development evidence.',href},
    provider_secret_values_emitted:false,token_values_emitted:false,automatic_provider_execution:false,provider_publication:false,production_execution:false
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
  const caip=normalizeBridgeLane('caip_private_media','CAIP private-media acceptance',bridgeItems.caip_private_media||{},'/admin/runtime-acceptance/');
  const social=normalizeBridgeLane('social_oauth','Social / OAuth controlled acceptance',bridgeItems.social_oauth||{},'/admin/social-publishing/');
  const access={...ACCESS_LANE,next_action:{state:'required',label:'Run the separate Cloudflare Access service-token proof',href:'/admin/it/'}};
  const lanes=[stripe,paypal,caip,social,access];
  const acceptedLaneCount=lanes.filter(row=>row.accepted===true).length;
  const externalAcceptanceComplete=acceptedLaneCount===lanes.length;

  return jsonResponse({
    ok:true,release:RELEASE,build:BUILD,title:TITLE,authority:AUTHORITY,state:externalAcceptanceComplete?'EXTERNAL_ACCEPTANCE_COMPLETE':'HOLD_EXTERNAL',
    runtime,verified_development:VERIFIED_DEVELOPMENT,production:PRODUCTION,
    summary:{required_lane_count:lanes.length,accepted_lane_count:acceptedLaneCount,pending_lane_count:lanes.length-acceptedLaneCount,external_acceptance_complete:externalAcceptanceComplete,production_promotion_ready_inferred:false},
    lanes:{stripe_development:stripe,paypal_sandbox:paypal,caip_private_media:caip,social_oauth:social,cloudflare_access_service_token:access},
    provider_runner:runnerStatus,
    provider_action_lane:{
      endpoint:'/api/admin/provider-acceptance-runner',available:actionLaneAvailable,
      availability_reason:actionLaneAvailable?'canonical_development_runner_available':runtime.production?'production_read_only_projection':'development_runner_unavailable',
      allowed_providers:['stripe','paypal'],allowed_actions:['refresh_evidence','prepare_checkout','refund_latest'],
      explicit_human_confirmation_required:true,development_host_required:true,provider_test_or_sandbox_credentials_required:true,payment_provider_mutations_switch_required:true,
      production_execution:false,automatic_execution:false,secret_values_emitted:false
    },
    authorities:{
      historical_commercial_bridge:'release467-build7-external-commercial-acceptance.json',
      historical_provider_runner:'release466-build6-provider-acceptance-readiness.json',
      stripe_preparation:'docs/operations/RELEASE_467_BUILD_79_STRIPE_DEVELOPMENT_PREPARATION.md',
      paypal_preparation:'docs/operations/RELEASE_467_BUILD_80_PAYPAL_SANDBOX_PREPARATION.md',
      social_oauth:'release467-build85-socials-oauth-acceptance.json',
      build88_final_closure:'release467-build88-external-acceptance-control-center.json',
      current_release:'release467-build89-external-acceptance-environment-isolation.json'
    },
    truth_notes:[
      'Build 88 is the exact verified Development and Production baseline consumed by Build 89.',
      'The current acceptance projection is bridge-first and can render read-only on Production without invoking the Development-only provider runner.',
      'Stripe and PayPal each require six real Development/sandbox evidence dimensions including provider-synchronized refund.',
      'Provider actions are available only when the canonical Development runner itself confirms its guarded execution boundary.',
      'A Development runner failure degrades the current page to read-only evidence instead of making the entire control center unavailable.',
      'Production provider execution and provider publication remain closed; a GREEN source/deployment build does not satisfy external acceptance.'
    ],
    safety:{read_only_projection:true,request_time_schema_mutation:false,d1_mutation_from_endpoint:false,r2_mutation_from_endpoint:false,binding_mutation:false,automatic_provider_execution:false,provider_publication:false,production_provider_execution:false,production_mutation:false,production_business_data_overwrite:false,secret_values_emitted:false},
    generated_at:new Date().toISOString()
  },200,{'Cache-Control':'no-store'});
}
