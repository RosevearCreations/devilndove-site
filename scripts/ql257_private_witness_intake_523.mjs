/* QL-257 Build 523 — accepts only actual independently obtained PUBLIC signer
 * evidence and opaque custody references. Never generates a key or claims that
 * an unauthenticated file proves a distinct person or authorization. */
import {readFileSync} from 'node:fs';
import {inspectPrivateQl256Challenge522,QL256_SOURCE_522} from './ql256_original_signer_preflight_522.mjs';

const opaque=x=>typeof x==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{7,95}$/.test(x);
export function evaluateQl257WitnessIntake523({publicSpkiPem,challengeBytes,signatureBase64,privateReceipt,now=Date.now()}={}){
  const proof=inspectPrivateQl256Challenge522({publicSpkiPem,challengeBytes,signatureBase64,now});
  const receipt=privateReceipt&&typeof privateReceipt==='object'?privateReceipt:{};
  const refs={custodian_receipt_id:opaque(receipt.custodian_receipt_id)?receipt.custodian_receipt_id:'NOT_AVAILABLE',
    witness_receipt_id:opaque(receipt.witness_receipt_id)?receipt.witness_receipt_id:'NOT_AVAILABLE',
    reviewer_receipt_id:opaque(receipt.reviewer_receipt_id)?receipt.reviewer_receipt_id:'NOT_AVAILABLE'};
  const distinct=Object.values(refs).every(v=>v!=='NOT_AVAILABLE')&&new Set(Object.values(refs)).size===3;
  const pinMatches=proof.public_spki_sha256!=='NOT_AVAILABLE'&&receipt.public_spki_sha256===proof.public_spki_sha256;
  let claimedTenant='';try{claimedTenant=JSON.parse(Buffer.from(challengeBytes||'{}').toString('utf8'))?.nonproduction_tenant_id||'';}catch{/* Never trust malformed witness input. */}
  const scopeMatches=receipt.source_sha_A===QL256_SOURCE_522.sourceShaA&&
    Boolean(claimedTenant)&&receipt.nonproduction_tenant_id===claimedTenant;
  const structural=Boolean(proof.signer_possession_challenge_valid&&distinct&&pinMatches&&scopeMatches);
  return {application:'Devil n Dove',build:523,ql:'QL-257',source_sha_A:QL256_SOURCE_522.sourceShaA,
    signer_provisioning_decision:proof.signer_provisioning_decision,public_spki_sha256:proof.public_spki_sha256,
    genuine_possession_challenge_valid:proof.signer_possession_challenge_valid,
    private_receipt_structure_matches:structural,private_receipt_refs:refs,
    independent_custody_verified:false,independent_witness_verified:false,reviewer_verified:false,
    owner_test_decision:'NOT_GIVEN',original_signed_ql246_proof:'NOT_AVAILABLE',gateway_test:'NOT_RUN',
    connection_state:'DISCONNECTED / HOLD',
    next_blocker:structural?
      'Independent authenticated reviewer must check original private custodian/witness identity, tenant isolation and pin custody out of band; an uploaded receipt cannot self-attest. Then obtain a separate owner TEST-only decision.':
      'Provide an actual privately generated Ed25519 public SPKI and signed five-minute challenge, plus three distinct opaque custodian/witness/reviewer receipt references matching the real tenant. No private keys.'};
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  const args=process.argv.slice(2),get=flag=>{const i=args.indexOf(flag);return i<0?null:args[i+1]};
  if(!['--public-spki-pem','--challenge-file','--signature-file','--private-receipt-file'].every(get)){
    process.stderr.write('Usage: node scripts/ql257_private_witness_intake_523.mjs --public-spki-pem <PUBLIC.pem> --challenge-file <REAL.json> --signature-file <BASE64.txt> --private-receipt-file <OPAQUE.json>\n');process.exitCode=2;
  }else try{
    const result=evaluateQl257WitnessIntake523({publicSpkiPem:readFileSync(get('--public-spki-pem'),'utf8'),
      challengeBytes:readFileSync(get('--challenge-file')),signatureBase64:readFileSync(get('--signature-file'),'utf8'),
      privateReceipt:JSON.parse(readFileSync(get('--private-receipt-file'),'utf8'))});
    process.stdout.write(JSON.stringify(result,null,2)+'\n');process.exitCode=2; // always private-review only
  }catch(error){process.stderr.write('Real QL-257 evidence is incomplete/unreadable: '+String(error.message).slice(0,120)+'\n');process.exitCode=2;}
}
