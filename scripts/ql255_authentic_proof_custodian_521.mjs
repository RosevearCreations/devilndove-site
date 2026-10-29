/* QL-255 offline exception reconciliation plus OPTIONAL public GitHub metadata GET.
 * It does not sign a proof, authenticate an owner/custodian, call any gateway,
 * or deploy a private Rosevear AI Hub service. */
import {probeQl253PublicOrigin519} from './ql253_public_origin_probe_519.mjs';

export const QL254_OBSERVATION_521=Object.freeze({
  at:'2026-10-29T03:42:01Z',
  main_sha:'ae145e67d526119a90612e8e4151dc84416d1446',
  proof_http_status:404,
  source_sha_A:'340d6da39abed229094527dfc91a7fd423fabd02',
  source_ci_run_id:'40794862120'
});

export function reconcileQl255OriginCustody521({probe,observedAt,prior=QL254_OBSERVATION_521}={}){
  if(!probe||!Number.isFinite(Date.parse(observedAt))||Date.parse(observedAt)<Date.parse(prior.at))
    throw Error('A real later public observation and its timestamp are required.');
  const proofCandidate=probe.immutable_public_proof_http_status===200&&
    probe.proof_ancestry_verified===true&&probe.proof_source_sha_matches_A===true&&
    probe.source_ci_exact_head_green===true;
  return {
    application_name:'Devil n Dove',repository:'RosevearCreations/devilndove-site',
    source_sha_A:probe.source_sha_A,source_ci_run_url:probe.source_ci_run_url,
    ql254_prior_main_sha:prior.main_sha,ql254_prior_http_status:prior.proof_http_status,
    ql255_observed_main_sha:probe.main_sha,ql255_observed_at_utc:observedAt,
    prior_exception_age_minutes:Math.floor((Date.parse(observedAt)-Date.parse(prior.at))/60000),
    proof_commit_sha_B:probe.proof_commit_sha_B||'NOT_AVAILABLE',
    immutable_public_proof_http_status:probe.immutable_public_proof_http_status,
    immutable_public_proof_url:/^[0-9a-f]{40}$/.test(probe.proof_commit_sha_B||'')?
      `https://raw.githubusercontent.com/RosevearCreations/devilndove-site/${probe.proof_commit_sha_B}/docs/integration/ql246-source-proof.json`:'NOT_AVAILABLE',
    exact_proof_bytes_sha256:probe.exact_proof_bytes_sha256||'NOT_AVAILABLE',
    proof_origin_candidate:proofCandidate,
    public_spki_sha256:'NOT_AVAILABLE',
    independently_authenticated_custodian:'NOT_VERIFIED',
    out_of_band_custody_receipt_id:'NOT_AVAILABLE',
    distinct_witness_receipt_id:'NOT_AVAILABLE',
    private_pin_registry_verified:false,
    owner_test_decision:'NOT_GIVEN',owner_test_receipt_id:'NOT_AVAILABLE',
    actual_gateway_test:'NOT_RUN',original_seven_negative_denial_receipts:'NOT_VERIFIED',
    private_24_7_relay_deployed:false,connection_state:'DISCONNECTED',
    exception_state:'HELD',
    next:proofCandidate?
      'Request independently authenticated signer-custodian and distinct witness attestation privately; separately authenticate owner TEST-only scope before any gateway GET.':
      'Original QL-246 signed proof B remains unavailable or unverified. Require a real signature, source A CI and immutable B before private pin or owner authorization review.'
  };
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  if(process.argv[2]!=='--public-get'||!/^[0-9a-f]{40}$/.test(process.argv[3]||'')){
    process.stderr.write('Usage: node scripts/ql255_authentic_proof_custodian_521.mjs --public-get <current-main-40-SHA> [genuine-proof-B-40-SHA]. Public GitHub only.\n');
    process.exitCode=2;
  }else{
    probeQl253PublicOrigin519({sourceShaA:QL254_OBSERVATION_521.source_sha_A,
      mainSha:process.argv[3],runId:QL254_OBSERVATION_521.source_ci_run_id,
      proofCommitShaB:process.argv[4]||null})
      .then(probe=>{
        const result=reconcileQl255OriginCustody521({probe,observedAt:new Date().toISOString()});
        process.stdout.write(JSON.stringify(result,null,2)+'\n');
        process.exitCode=2; // Integrations remain HELD, even when public proof becomes retrievable.
      }).catch(error=>{process.stderr.write('Public GitHub-only QL-255 check unavailable: '+String(error.message).slice(0,180)+'\n');process.exitCode=2;});
  }
}
