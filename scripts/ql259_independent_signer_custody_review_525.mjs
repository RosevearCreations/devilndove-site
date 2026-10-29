/* QL-259 Build 525 — nonsecret intake for ACTUAL independent source custody.
 * Status-only JSON cannot authenticate a person, host, pin or signed proof. */
import {readFileSync} from 'node:fs';
import {QL256_SOURCE_522} from './ql256_original_signer_preflight_522.mjs';

const opaque=value=>typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{7,95}$/.test(value);
export function evaluateQl259CustodyReview525({source={},privateReview={},publicProof={}}={}){
 const blockers=[];
 if(source.source_sha_A!==QL256_SOURCE_522.sourceShaA)blockers.push('Authentic original source commit A does not match the locally pinned source.');
 if(source.genuine_possession_challenge_valid!==true)blockers.push('A genuine independently witnessed Ed25519 signer possession response is missing.');
 if(source.private_receipt_structure_matches!==true)blockers.push('Distinct opaque custodian, witness and reviewer receipts are missing or invalid.');
 const roles=['custodian','witness','reviewer'];
 if(!roles.every(role=>opaque(privateReview[role+'_receipt_id'])))blockers.push('Each independent authenticated role needs an opaque private receipt reference.');
 else if(new Set(roles.map(role=>privateReview[role+'_receipt_id'])).size!==3)blockers.push('The signer custodian, witness and reviewer must be separate authenticated parties.');
 if(privateReview.original_key_store_approved!==true)blockers.push('Owner approval of a restricted, persistent original signer key store is not witnessed.');
 if(privateReview.pin_registry_witnessed_out_of_band!==true)blockers.push('Original public key SPKI pin registry has no independent out-of-band witness.');
 if(privateReview.isolated_nonproduction_tenant_verified!==true)blockers.push('Actual Devil n Dove isolated nonproduction tenant is not independently verified.');
 if(publicProof.immutable_http_status!==200||publicProof.path!=='docs/integration/ql246-source-proof.json')
  blockers.push('Original signed proof B is not available as HTTP 200 at the exact immutable public GitHub path.');
 if(!/^[a-f0-9]{40}$/.test(String(publicProof.commit_sha_B||'')))blockers.push('Proof commit B immutable GitHub SHA is missing.');
 if(publicProof.independent_signature_and_pin_verified!==true)blockers.push('Proof B original Ed25519 signature and independently pinned public key were not separately verified.');
 return {application:'Devil n Dove',build:525,ql:'QL-259',source_sha_A:QL256_SOURCE_522.sourceShaA,
  private_candidate_supplied:blockers.length===0,independently_authenticated:false,
  signer_custody_accepted:false,source_proof_B_verified:false,owner_test_decision:'NOT_GIVEN',
  gateway_get:'NOT_RUN',integration:'DISCONNECTED / HOLD',blockers:blockers.length?blockers:
   ['All reported statuses require the actual original private identity, source signer, pin-registry and independent proof files to be inspected by the separately authenticated reviewer.'],
  next_specific_blocker:blockers[0]||'Independent reviewer must examine original private signer and pinned key evidence, not a self-attesting handoff.'};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const index=process.argv.indexOf('--nonsecret-evidence');
 if(index<0||!process.argv[index+1]){process.stderr.write('Usage: node scripts/ql259_independent_signer_custody_review_525.mjs --nonsecret-evidence <STATUS_JSON>\n');process.exitCode=2;}
 else try{const evidence=JSON.parse(readFileSync(process.argv[index+1],'utf8'));
  process.stdout.write(JSON.stringify(evaluateQl259CustodyReview525(evidence),null,2)+'\n');process.exitCode=2;
 }catch(error){process.stderr.write('Nonsecret original evidence references were unavailable: '+String(error.message).slice(0,100)+'\n');process.exitCode=2;}
}
