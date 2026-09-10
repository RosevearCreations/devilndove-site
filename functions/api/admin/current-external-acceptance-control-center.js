// Release 467 Build 88 — current external acceptance control center.
// GET-only projection over retained historical evidence engines. Provider actions remain
// on the existing guarded Development-only provider-acceptance-runner endpoint.
import { jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as getCommercialBridge } from './release467-external-commercial-acceptance.js';
import { onRequestGet as getProviderRunner } from './provider-acceptance-runner.js';

const RELEASE = 467;
const BUILD = 88;
const TITLE = 'External Acceptance Control Center Convergence';
const AUTHORITY = 'release467-build88-external-acceptance-control-center';
const VERIFIED_DEVELOPMENT = Object.freeze({
  release:467,build:87,title:'Production Authority & Restart Convergence',
  dev_sha:'646d73710784008617157cf5746a66f053daba83',
  tree_sha:'709f802cf7ca24a12f48bd7c8b562a92b306fcae',
  system_gate_run:34421392242,current_application_quality_run:34421392244,
  it_admin_runtime_proof_run:34421392231,branch_hygiene_run:34421392188,
  proof_state:'EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN',exact_preview_deployment:true
});
const PRODUCTION = Object.freeze({
  release:467,build:87,title:'Production Authority & Restart Convergence',state:'PRODUCTION_GREEN',
  main_sha:'646d73710784008617157cf5746a66f053daba83',
  tree_sha:'709f802cf7ca24a12f48bd7c8b562a92b306fcae',
  production_pages_deploy_run:34421532872,
  production_live_resource_integrity_run:34421613381
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
const passed=(row)=>text(row?.check_state).toLowerCase()==='passed';
const copy=(value)=>value&&typeof value==='object'?JSON.parse(JSON.stringify(value)):value;

function normalizePaymentLane(provider,evidence={},bridge={}){
  const refundPassed=evidence.refund_accepted===true;
  const refund={
    check_key:'refund',
    check_label:provider==='stripe'?'Provider-synchronized test refund completes':'Provider-synchronized sandbox refund completes',
    check_state:refundPassed?'passed':'pending',
    evidence_present:refundPassed,
    evidence_reference:refundPassed?`current:${provider}:provider-synchronized-refund`:null,
    detail:refundPassed?'Existing guarded provider refund evidence is recorded and synchronized.':'A provider-synchronized Development test/sandbox refund is still required.'
  };
  const inherited=Array.isArray(evidence.checks)?evidence.checks.map(row=>({
    check_key:text(row?.check_key),check_label:text(row?.check_label)||text(row?.check_key),
    check_state:text(row?.check_state)||'pending',evidence_present:row?.evidence_present===true,
    evidence_reference:text(row?.evidence_reference)||null,detail:text(row?.detail)||''
  })):[];
  const checks=[...inherited,refund];
  const allPassed=checks.length===6&&checks.every(passed);
  return {
    key:provider==='stripe'?'stripe_development':'paypal_sandbox',
    label:provider==='stripe'?'Stripe Development':'PayPal sandbox',
    acceptance_state:allPassed?'ACCEPTED':'HOLD_EXTERNAL',accepted:allPassed,
    required_check_count:6,accepted_check_count:checks.filter(passed).length,checks,
    configuration:copy(evidence.configuration)||{},
    acceptance_payment:copy(evidence.acceptance_payment)||null,
    verified_webhook:copy(evidence.verified_webhook)||null,
    duplicate_replay:copy(evidence.duplicate_replay)||null,
    provider_refund:copy(evidence.provider_refund)||null,
    refund_accepted:refundPassed,
    webhook:copy(evidence.webhook)||{},
    historical_bridge_state:text(bridge.acceptance_state)||null,
    historical_bridge_accepted:bridge.accepted===true,
    evidence_authorities:provider==='stripe'
      ? ['docs/operations/RELEASE_467_BUILD_79_STRIPE_DEVELOPMENT_PREPARATION.md','functions/api/admin/provider-acceptance-runner.js']
      : ['docs/operations/RELEASE_467_BUILD_80_PAYPAL_SANDBOX_PREPARATION.md','functions/api/admin/provider-acceptance-runner.js'],
    provider_secret_values_emitted:false,token_values_emitted:false,automatic_provider_execution:false,production_execution:false
  };
}

function normalizeBridgeLane(key,label,item={},href){
  return {
    key,label,acceptance_state:text(item.acceptance_state)||'HOLD_EXTERNAL',accepted:item.accepted===true,
    owner:key==='caip_private_media'?'Creators / I.T.':'Socials / I.T.',
    correction_href:href,
    policy:text(item.policy)||'',
    evidence:copy(item),
    provider_secret_values_emitted:false,token_values_emitted:false,automatic_provider_execution:false,provider_publication:false,production_execution:false
  };
}

export async function onRequestGet(context){
  const [bridgeResponse,runnerResponse]=await Promise.all([getCommercialBridge(context),getProviderRunner(context)]);
  const [bridge,runner]=await Promise.all([bridgeResponse.json().catch(()=>null),runnerResponse.json().catch(()=>null)]);
  if(!bridgeResponse.ok||!bridge?.ok)return jsonResponse({ok:false,release:RELEASE,build:BUILD,title:TITLE,error:text(bridge?.error)||'Current commercial evidence bridge is unavailable.',provider_execution:false,production_mutation:false,secret_values_emitted:false},bridgeResponse.status||503,{'Cache-Control':'no-store'});
  if(!runnerResponse.ok||!runner?.ok)return jsonResponse({ok:false,release:RELEASE,build:BUILD,title:TITLE,error:text(runner?.error)||'Provider acceptance evidence runner is unavailable.',provider_execution:false,production_mutation:false,secret_values_emitted:false},runnerResponse.status||503,{'Cache-Control':'no-store'});

  const bridgeItems=bridge.items||{},providers=runner.providers||{};
  const stripe=normalizePaymentLane('stripe',providers.stripe||{},bridgeItems.stripe_development||{});
  const paypal=normalizePaymentLane('paypal',providers.paypal||{},bridgeItems.paypal_sandbox||{});
  const caip=normalizeBridgeLane('caip_private_media','CAIP private-media acceptance',bridgeItems.caip_private_media||{},'/admin/runtime-acceptance/');
  const social=normalizeBridgeLane('social_oauth','Social / OAuth controlled acceptance',bridgeItems.social_oauth||{},'/admin/social-publishing/');
  const access={...ACCESS_LANE};
  const lanes=[stripe,paypal,caip,social,access];
  const acceptedLaneCount=lanes.filter(row=>row.accepted===true).length;
  const externalAcceptanceComplete=acceptedLaneCount===lanes.length;

  return jsonResponse({
    ok:true,release:RELEASE,build:BUILD,title:TITLE,authority:AUTHORITY,state:externalAcceptanceComplete?'EXTERNAL_ACCEPTANCE_COMPLETE':'HOLD_EXTERNAL',
    verified_development:VERIFIED_DEVELOPMENT,production:PRODUCTION,
    summary:{required_lane_count:lanes.length,accepted_lane_count:acceptedLaneCount,pending_lane_count:lanes.length-acceptedLaneCount,external_acceptance_complete:externalAcceptanceComplete,production_promotion_ready_inferred:false},
    lanes:{stripe_development:stripe,paypal_sandbox:paypal,caip_private_media:caip,social_oauth:social,cloudflare_access_service_token:access},
    provider_action_lane:{
      endpoint:'/api/admin/provider-acceptance-runner',
      allowed_providers:['stripe','paypal'],
      allowed_actions:['refresh_evidence','prepare_checkout','refund_latest'],
      explicit_human_confirmation_required:true,
      development_host_required:true,
      provider_test_or_sandbox_credentials_required:true,
      payment_provider_mutations_switch_required:true,
      production_execution:false,
      automatic_execution:false,
      secret_values_emitted:false
    },
    authorities:{
      historical_commercial_bridge:'release467-build7-external-commercial-acceptance.json',
      historical_provider_runner:'release466-build6-provider-acceptance-readiness.json',
      stripe_preparation:'docs/operations/RELEASE_467_BUILD_79_STRIPE_DEVELOPMENT_PREPARATION.md',
      paypal_preparation:'docs/operations/RELEASE_467_BUILD_80_PAYPAL_SANDBOX_PREPARATION.md',
      social_oauth:'release467-build85-socials-oauth-acceptance.json',
      it_diagnostics:'release467-build86-it-operations-self-diagnostics.json',
      current_release:'release467-build88-external-acceptance-control-center.json'
    },
    truth_notes:[
      'Build 87 is the exact verified Development and Production baseline consumed by Build 88.',
      'Stripe requires six real Development dimensions: credentials, checkout, webhook signature, provider-synchronized refund, reconciliation and idempotent replay.',
      'PayPal requires six real sandbox dimensions: credentials, approval/capture, webhook verification, provider-synchronized refund, reconciliation and idempotent replay.',
      'Historical Build 6/7 engines remain retained regression/evidence authorities; Build 88 is the current operator projection.',
      'Cloudflare Access service-token proof remains a separate external lane and cannot be inferred from application configuration.',
      'A GREEN source/deployment build does not by itself satisfy any external provider acceptance lane.'
    ],
    safety:{read_only_projection:true,request_time_schema_mutation:false,d1_mutation_from_endpoint:false,r2_mutation_from_endpoint:false,binding_mutation:false,automatic_provider_execution:false,provider_publication:false,production_provider_execution:false,production_mutation:false,production_business_data_overwrite:false,secret_values_emitted:false},
    generated_at:new Date().toISOString()
  },200,{'Cache-Control':'no-store'});
}
