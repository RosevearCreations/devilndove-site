/* QL-258 / Build 524: inspect nonsecret statements without upgrading them to
 * authenticated custody or gateway authorization. No signer or service call. */
import {readFileSync} from 'node:fs';
import {QL256_SOURCE_522} from './ql256_original_signer_preflight_522.mjs';

const accepted=['ASSIGNED_AND_INDEPENDENTLY_AUTHENTICATED'];
export function evaluateQl258CustodyDecision524({ql257Result={},ownerStatus={}}={}){
 const reasons=[];
 if(ql257Result.source_sha_A!==QL256_SOURCE_522.sourceShaA)reasons.push('Original source A does not match the independently tested Developer source.');
 if(ql257Result.genuine_possession_challenge_valid!==true)reasons.push('No real bounded Ed25519 signer-possession challenge was independently supplied.');
 if(ql257Result.private_receipt_structure_matches!==true)reasons.push('Distinct private custodian, witness and reviewer receipt references do not match.');
 if(!accepted.includes(ownerStatus.custodian))reasons.push('No independently authenticated Devil n Dove signer-key custodian decision.');
 if(!accepted.includes(ownerStatus.witness))reasons.push('No independently authenticated distinct challenge witness decision.');
 if(!accepted.includes(ownerStatus.reviewer))reasons.push('No independently authenticated independent reviewer decision.');
 if(ownerStatus.private_store!=='APPROVED')reasons.push('No owner-approved restricted persistent signer-key store.');
 if(ownerStatus.public_pin!=='VERIFIED_OUT_OF_BAND')reasons.push('No out-of-band independently verified public SPKI pin.');
 if(ownerStatus.tenant_isolation!=='VERIFIED')reasons.push('No independently confirmed Devil n Dove nonproduction tenant isolation.');
 // A file is not an authenticated person, pinned registry or signed source B.
 // An external reviewer must inspect original private records and decide.
 return {application:'Devil n Dove',build:524,ql:'QL-258',source_sha_A:QL256_SOURCE_522.sourceShaA,
  candidate_private_evidence_complete:reasons.length===0,independent_custody_accepted:false,
  source_proof_B:'NOT_AVAILABLE',owner_test_decision:'NOT_GIVEN',gateway_get:'NOT_RUN',
  integration:'DISCONNECTED / HOLD',reasons:reasons.length?reasons:[
   'Status-only packet is structurally complete, but authentic independent registry/identity records still require private external review.'],
  next_specific_blocker:reasons[0]||'An authorized independent reviewer must directly verify the original custody, witness, source pin and tenant records in the approved private channel.'};
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const p=process.argv.indexOf('--private-status');
 if(p<0||!process.argv[p+1]){process.stderr.write('Usage: node scripts/ql258_independent_custody_decision_524.mjs --private-status <SANITIZED_STATUS_JSON> [--ql257-intake <ACTUAL_RESULT_JSON>]\n');process.exitCode=2;}
 else try{const status=JSON.parse(readFileSync(process.argv[p+1],'utf8'));const i=process.argv.indexOf('--ql257-intake');
  const ql257=i>=0?JSON.parse(readFileSync(process.argv[i+1],'utf8')):{};
  process.stdout.write(JSON.stringify(evaluateQl258CustodyDecision524({ownerStatus:status,ql257Result:ql257}),null,2)+'\n');process.exitCode=2;
 }catch(error){process.stderr.write('Private evidence packet could not be read: '+String(error.message).slice(0,120)+'\n');process.exitCode=2;}
}
