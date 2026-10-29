/* Read-only release operator preflight. It never generates a signing key,
 * fabricates a signed proof, calls a gateway or changes a deployment. */
import {readFileSync} from 'node:fs';
import {createHash,createPublicKey,verify} from 'node:crypto';
import {canonicalQl246513,ql246ShapeIssues513} from '../functions/api/_lib/ql246Proof513.mjs';

const hex=bytes=>createHash('sha256').update(bytes).digest('hex');
const sha=x=>/^[a-f0-9]{40}$/.test(String(x||''));
const digest=x=>/^[a-f0-9]{64}$/.test(String(x||''));

export function inspectSourceProof518({raw,sourceShaA,proofShaB,sourceCiHeadSha,
  outOfBandTrustedSpkiSha256,ancestorConfirmed=false,independentCustodyVerified=false,
  independentNegativeWitnessVerified=false,now=Date.now()}={}){
  const blockers=[];
  if(typeof raw!=='string'||!raw.trim())return {published:false,accepted:false,blockers:['Signed source proof is NOT_AVAILABLE (public immutable path remains 404).']};
  let record;
  try{record=JSON.parse(raw);}catch{return {published:false,accepted:false,blockers:['Source proof is not valid JSON.']};}
  const p=record.payload||{};
  blockers.push(...ql246ShapeIssues513(record,now));
  if(!sha(sourceShaA)||p.source_revision!==sourceShaA||sourceCiHeadSha!==sourceShaA)
    blockers.push('Source A, signed payload source_revision and exact GREEN CI head SHA do not match.');
  if(!sha(proofShaB)||proofShaB===sourceShaA||!ancestorConfirmed)
    blockers.push('Separate proof commit B must be an independently verified descendant of source A.');
  let pin=null,signatureValid=false;
  try{
    const key=createPublicKey(record.publicKeyPem);
    if(key.asymmetricKeyType!=='ed25519')throw Error('Ed25519 public key required.');
    pin=hex(key.export({type:'spki',format:'der'}));
    signatureValid=verify(null,Buffer.from(canonicalQl246513(p)),key,
      Buffer.from(String(record.signature||''),'base64url'));
  }catch{blockers.push('Valid Ed25519 public key and canonical detached signature required.');}
  if(!signatureValid)blockers.push('Canonical signature did not verify.');
  if(!digest(outOfBandTrustedSpkiSha256)||pin!==outOfBandTrustedSpkiSha256||!independentCustodyVerified)
    blockers.push('Independent signer custody and a separately authenticated public SPKI pin are NOT_VERIFIED.');
  if(!independentNegativeWitnessVerified)
    blockers.push('Seven actual independently witnessed negative denial tests are NOT_VERIFIED; synthetic fixtures never count.');
  return {published:true,accepted:blockers.length===0,public_spki_sha256:pin||'NOT_AVAILABLE',
    exact_proof_bytes_sha256:hex(Buffer.from(raw)),signature_valid:signatureValid,
    connection_state:'DISCONNECTED',actual_gateway_test:'NOT_RUN',blockers};
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  const file=process.argv[2];
  if(!file){process.stderr.write('NOT_AVAILABLE: pass an existing genuine signed proof file; no synthetic data will be published.\n');process.exitCode=2;}
  else{
    const raw=readFileSync(file,'utf8');
    const result=inspectSourceProof518({raw,sourceShaA:process.env.QL252_SOURCE_SHA_A,
      proofShaB:process.env.QL252_PROOF_SHA_B,sourceCiHeadSha:process.env.QL252_SOURCE_CI_HEAD_SHA,
      outOfBandTrustedSpkiSha256:process.env.QL252_TRUSTED_SPKI_SHA256});
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
    if(!result.accepted)process.exitCode=2;
  }
}
