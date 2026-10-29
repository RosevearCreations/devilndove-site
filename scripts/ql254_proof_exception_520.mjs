/* QL-254: public-source proof exception aging. All responses are observations,
 * never private trust/pin evidence, owner permission, or gateway execution. */
import {probeQl253PublicOrigin519} from './ql253_public_origin_probe_519.mjs';

export const QL253_OBSERVED_520=Object.freeze({
  at:'2026-10-29T02:43:00Z',
  main_sha:'962cd59efe8ebfeda623b6f82b95c030adfc3ab4',
  proof_http_status:404,
  source_sha_A:'340d6da39abed229094527dfc91a7fd423fabd02',
  source_ci_run_id:'40794862120'
});

export function reconcileQl254Exception520({probe,observedAt,prior=QL253_OBSERVED_520}={}){
  if(!probe||!Number.isFinite(Date.parse(observedAt))||Date.parse(observedAt)<Date.parse(prior.at))
    throw Error('An actual current observation timestamp later than the original QL-253 snapshot is required.');
  const status=probe.immutable_public_proof_http_status;
  const available=status===200&&probe.proof_ancestry_verified===true&&
    probe.proof_source_sha_matches_A===true&&probe.source_ci_exact_head_green===true;
  const agedMinutes=Math.floor((Date.parse(observedAt)-Date.parse(prior.at))/60000);
  return {
    application_name:'Devil n Dove',repository:'RosevearCreations/devilndove-site',
    source_sha_A:probe.source_sha_A,source_ci_run_url:probe.source_ci_run_url,
    ql253_prior_observed_main:prior.main_sha,ql253_prior_proof_http_status:prior.proof_http_status,
    ql254_observed_main:probe.main_sha,ql254_checked_at_utc:observedAt,
    ql253_to_ql254_elapsed_minutes:agedMinutes,
    proof_commit_sha_B:probe.proof_commit_sha_B,
    immutable_public_proof_http_status:status,
    exact_proof_bytes_sha256:probe.exact_proof_bytes_sha256,
    public_proof_origin_candidate:available,
    public_spki_sha256:'NOT_AVAILABLE',out_of_band_registry_snapshot_sha256:'NOT_AVAILABLE',
    out_of_band_registry_receipt_id:'NOT_AVAILABLE',out_of_band_custody_receipt_id:'NOT_AVAILABLE',
    distinct_independent_witness_receipt_id:'NOT_AVAILABLE',
    owner_test_decision:'NOT_GIVEN',owner_test_receipt_id:'NOT_AVAILABLE',
    real_health_and_capabilities_get_receipts:'NOT_RUN',
    original_seven_negative_denial_receipts:'NOT_VERIFIED',
    private_24_7_relay_deployed:false,connection_state:'DISCONNECTED',
    exception_state:'HELD',
    next:available?'Privately authenticate the original signer and distinct witness pins, then request a separate real owner TEST-only decision. No gateway GET yet.':
      'Publish a genuine Ed25519 QL-246 proof at distinct immutable B with source A exact CI, then independently retry public B before any private trust or owner TEST decision.'
  };
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  if(process.argv[2]!=='--public-get'||!process.argv[3]){
    process.stderr.write('Usage: node scripts/ql254_proof_exception_520.mjs --public-get <full-main-SHA> [full-proof-B-SHA]. Public GitHub GET only.\n');
    process.exitCode=2;
  }else{
    probeQl253PublicOrigin519({sourceShaA:QL253_OBSERVED_520.source_sha_A,
      mainSha:process.argv[3],runId:QL253_OBSERVED_520.source_ci_run_id,
      proofCommitShaB:process.argv[4]||null})
      .then(probe=>{const result=reconcileQl254Exception520({probe,observedAt:new Date().toISOString()});
        process.stdout.write(JSON.stringify(result,null,2)+'\n');if(result.exception_state==='HELD')process.exitCode=2;})
      .catch(error=>{process.stderr.write('QL-254 public GitHub proof recheck unavailable: '+String(error.message).slice(0,180)+'\n');process.exitCode=2;});
  }
}
