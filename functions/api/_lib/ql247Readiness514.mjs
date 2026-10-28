/* QL-247: distinguish independently verifiable public source preparation
 * from separately authorized *real* nonproduction authenticated testing. */
export const ql247SourceReadiness514=(receipt={})=>{
 const localProof=receipt?.source_side_hmac_receipts_current===true;
 const phaseA={repository:'RosevearCreations/devilndove-site',
  business_id:'devilndove',tenant_id:null,environment:'nonproduction',
  allowed_methods:['GET'],
  allowed_paths:['/api/integration/v1/health','/api/integration/v1/capabilities'],
  exact_current_main_sha:null,exact_main_ci_run_url:null,
  main_git_and_ci_provenance:'VERIFY_INDEPENDENTLY_ON_EACH_PROMOTION',
  local_source_receipt_samples_present:localProof,
  trusted_ql246_public_pin_configured:receipt?.ql246_trusted_pin_provisioned===true,
  independent_operator_challenge_configured:receipt?.ql246_operator_challenge_provisioned===true,
  separately_verified_immutable_revision_configured:receipt?.ql246_immutable_source_revision_provisioned===true,
  public_ql246_source_proof_published:false,
  signer_private_key_readiness:'NOT_VERIFIED_BY_PUBLIC_ENDPOINT',
  original_trace_ids_verified:false};
 const sevenDenials={nonce_replay_denied:false,stale_request_denied:false,
  cross_business_denied:false,cross_tenant_denied:false,revoked_key_denied:false,
  write_denied:false,dispatch_denied:false};
 return {build:514,connection_state:'DISCONNECTED',phase:'A_PUBLIC_SOURCE_PREPARATION',
  owner_pilot_authorization:'NOT_GIVEN',owner_nonproduction_test_authorization:'NOT_VERIFIED',
  phase_a:phaseA,phase_b:{status:'NOT_AUTHORIZED_OR_INDEPENDENTLY_VERIFIED',
   exact_source_origin_verified:false,distinct_hmac_key_provisioned:false,
   externally_authenticated_health_get_verified:false,
   externally_authenticated_capabilities_get_verified:false,
   independently_observed_negative_tests:sevenDenials,
   gateway_audit_after_restart_verified:false,
   scoped_key_rotation_and_revocation_verified:false,
   rollback_kill_switch_witnessed:false,
   private_runner_approved:false},
  phase_c:{status:'NOT_AUTHORIZED',owner_identity_independently_verified:false,
   product_references_enabled:false,listing_references_enabled:false,
   etsy_or_marketplace_writes_enabled:false,events_enabled:false,
   messaging_or_dispatch_enabled:false},
  can_publish_ql246_signed_proof:false,can_enable_real_gateway_connection:false,
  next_evidence:[
   'Independently verify exact current green main SHA and matching CI URL for this source; a GitHub repository owner alone proves no API authentication.',
   'Obtain separately approved nonproduction test scope, operator identity, source/tenant, expiry, independent reviewer and rollback plan.',
   'Provision one source-specific 256-bit HMAC key and Ed25519 source signer only in approved secret stores; deliver the public SPKI pin over an independently authenticated channel.',
   'Witness both actual nonproduction authenticated GETs, seven real denied cases, restart-durable gateway audit, pin, key revocation/rotation and kill-switch rollback.',
   'Only after real evidence, request a fresh one-hour operator challenge and sign/publish QL-246 source proof at an agreed immutable revision; never publish a fake placeholder.',
   'Independently verify six app source receipts and require new separate owner authorization for any later reversible read-only pilot.'
  ],signed_file_state:'MISSING_BLOCKED_EVIDENCE',source_private_key_disclosed:false,
  customer_data_shared:false,etsy_provider_modified:false,publication_performed:false};
};
