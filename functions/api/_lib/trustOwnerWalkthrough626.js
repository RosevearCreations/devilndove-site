/* Build 626: deterministic original-owner renewal guidance and verified
 * one-use read-only TEST acceptance projection. No credential, SQL or network use. */
export const HOLD_626='HOLD_ORIGINAL_META_OWNER_RENEWAL_OR_GENUINE_TEST_WITNESS';
export const ACCEPT_626='VERIFIED_ORIGINAL_META_READ_ONLY_TEST_ACCEPTED_NO_CHANNEL_ACTIVATION';
const MINUTE=60000;

export function expiry626(value,now=Date.now(),warnMinutes=15){
  const target=Date.parse(value||'');
  if(!Number.isFinite(target))return {state:'MISSING',expires_at:null,minutes_remaining:null};
  const remaining=Math.max(0,Math.ceil((target-now)/MINUTE));
  return {state:target<=now?'EXPIRED':target-now<=warnMinutes*MINUTE?
    'EXPIRING_SOON':'CURRENT',expires_at:new Date(target).toISOString(),
    minutes_remaining:remaining};
}

export function deriveWalkthrough626({source,window,provider,grant,
  attempts=[],outcomes=[],failures=[],witnesses=[],now=Date.now()}){
  const original=source?.assistant;
  const schema=source?.original_database_readback;
  const currentWindow=window?.derived_readonly_page_identity_window;
  const token=expiry626(source?.original_credential_readback?.expires_at,now);
  const windowExpiry=expiry626(currentWindow?.expires_at,now,2);
  const grantExpiry=expiry626(grant?.expires_at,now,2);
  const latest=Array.isArray(witnesses)?witnesses[0]:null;
  const witnessed=original?.source_proof_verified===true&&
    original?.actual_readonly_meta_test_witnessed===true&&
    provider?.latest_verified_original_get===
      'ORIGINAL_ONE_GENUINE_META_GET_WITNESSED_READ_ONLY_NO_CONNECTION'&&
    !!latest&&!!latest.test_nonce&&
    outcomes.some(x=>x.test_nonce===latest.test_nonce&&!!x.receipt_sha256)&&
    attempts.some(x=>x.test_nonce===latest.test_nonce)&&
    !failures.some(x=>x.test_nonce===latest.test_nonce)&&
    currentWindow?.verified===true&&windowExpiry.state!=='EXPIRED'&&
    schema?.all_source_tables_present===true&&
    source.original_credential_readback?.saved_encrypted_credential===true&&
    token.state!=='EXPIRED'&&token.state!=='MISSING';
  const spent=!!grant?.test_nonce&&attempts.some(x=>x.test_nonce===grant.test_nonce);
  const failed=!!grant?.test_nonce&&failures.some(x=>x.test_nonce===grant.test_nonce);
  const renewal={
    source_window:windowExpiry,
    saved_meta_credential:token,
    most_recent_one_use_grant:grantExpiry,
    most_recent_nonce_spent:spent,
    most_recent_nonce_failed:failed,
    original_credential_needs_owner_action:token.state!=='CURRENT',
    source_window_requires_fresh_signatures:currentWindow?.verified!==true||
      windowExpiry.state!=='CURRENT',
    new_one_use_authorization_required:!grant||spent||grantExpiry.state!=='CURRENT',
    automatic_renewal:false,
    reusing_spent_nonce_forbidden:true
  };
  const checklist=[
    {id:'schema',section:46,complete:schema?.all_source_tables_present===true,
      action:'Original owner: verify the actual D1 database and source migration readback, custody backup and approval. Proposed 0052–0062 are not auto-applied.'},
    {id:'original_evidence',section:46,complete:original?.checks?.slice(1,3).every(c=>c.complete)===true,
      action:'Independently review original issuer, separate witness, owner pins, no quarantine, signed owner ledger and two real external archives.'},
    {id:'window',section:44,complete:currentWindow?.verified===true&&windowExpiry.state==='CURRENT',
      action:'Obtain fresh original ISSUER/WITNESS/OWNER signatures for Meta completion and a new ten-minute Page-ID window. Expired windows cannot be extended.'},
    {id:'credential',section:45,complete:source?.original_credential_readback?.saved_encrypted_credential===true&&
      source?.original_credential_readback?.read_only_page_candidate===true&&token.state==='CURRENT',
      action:'Original Meta account owner: check the saved encrypted Page read credential, expiry and exact permissions. Never paste, decrypt or refresh it in this assistant.'},
    {id:'signed_enrollment',section:45,complete:original?.checks?.find(c=>c.id==='original_enrollment')?.complete===true&&
      currentWindow?.verified===true,
      action:'Separately sign ENROLL_624 for the SAVED encrypted token fingerprint, approved Page identity, owner ledger and current original window.'},
    {id:'one_use_authorization',section:45,complete:witnessed||
      (!!grant&&!spent&&grantExpiry.state==='CURRENT'&&currentWindow?.verified===true),
      action:'Have the three original roles sign a NEW RECHECK_624 with an unused nonce, exact Page-ID GET, and expiry no later than the source window/enrollment.'},
    {id:'one_provider_get',section:45,complete:witnessed||
      (!!grant?.test_nonce&&outcomes.some(x=>x.test_nonce===grant.test_nonce)&&!failed),
      action:'With explicit owner supervision, execute exactly ONE Page-ID GET in section 45. The nonce is consumed before the request; never retry a failed or spent approval.'},
    {id:'independent_test_acceptance',section:45,complete:witnessed,
      action:'The independent original signers must ACCEPT_624 the ACTUAL immutable GET receipt. Recheck original source window and current credential. No connection or publication is enabled.'}
  ];
  const pending=checklist.filter(s=>!s.complete);
  return {build:626,release_gate:witnessed?ACCEPT_626:HOLD_626,
    original_readonly_test_acceptance:witnessed?'VERIFIED_SINGLE_GET_RECEIPT_READ_ONLY_TEST_ONLY':
      'HOLD_NOT_INDEPENDENTLY_VERIFIED',
    accepted_for_readonly_test_only:witnessed,connected:false,
    provider_channel_activated:false,customer_publication_enabled:false,
    provider_write:false,read_request_performed_by_assistant:false,
    migration_applied_by_assistant:false,credential_renewed_by_assistant:false,
    renewal,checklist,pending_steps:pending.map(c=>c.id),
    next_action:pending[0]?.action||
      'One read-only TEST has independent custody acceptance. Keep actual connection/publishing disabled pending a separate original owner go-live decision.'};
}
