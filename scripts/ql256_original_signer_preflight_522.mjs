/* Build 522 / QL-256: genuine public origin and optional privately obtained
 * signer proof-of-possession verification. It NEVER generates a key, signs a
 * payload, stores a private key, assigns a human identity or makes gateway GETs.
 * A cryptographic challenge alone is not independent custody/witness trust. */
import {createHash,createPublicKey,verify as verifySignature} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {probeQl253PublicOrigin519} from './ql253_public_origin_probe_519.mjs';

export const QL256_SOURCE_522=Object.freeze({
  repo:'RosevearCreations/devilndove-site',
  sourceShaA:'340d6da39abed229094527dfc91a7fd423fabd02',
  sourceRunId:'40794862120',
  baselineMain:'5017939f3b63e3f63d79a83f34357956cbafd0b4'
});

/** Verify possession without claiming an authenticated custodian or witness. */
export function inspectPrivateQl256Challenge522({publicSpkiPem,challengeBytes,signatureBase64,now=Date.now()}={}){
  const unavailable={signer_provisioning_decision:'SIGNER_STATUS_UNKNOWN',
    public_spki_sha256:'NOT_AVAILABLE',signer_possession_challenge_valid:false,
    independent_custody_verified:false,independent_witness_verified:false,
    named_reviewer_verified:false,reason:'No original, independently witnessed source signer has been supplied.'};
  if(!publicSpkiPem)return unavailable;
  const pem=String(publicSpkiPem);
  if(!/^-----BEGIN PUBLIC KEY-----\s[\s\S]+-----END PUBLIC KEY-----\s*$/.test(pem))
    return {...unavailable,reason:'Only an Ed25519 PUBLIC KEY PEM may be inspected. Never supply a private key.'};
  let key,spkiSha;
  try{key=createPublicKey(pem);if(key.asymmetricKeyType!=='ed25519')throw Error('non-Ed25519');
    spkiSha=createHash('sha256').update(key.export({type:'spki',format:'der'})).digest('hex');}
  catch{return {...unavailable,reason:'The supplied public SPKI is not a valid Ed25519 key.'};}
  const partial={...unavailable,public_spki_sha256:spkiSha,
    reason:'Public Ed25519 key is structurally valid, but private signer possession and custody remain unverified.'};
  if(!challengeBytes||!signatureBase64)return partial;
  let record,signature,bytes;
  try{
    bytes=Buffer.isBuffer(challengeBytes)?challengeBytes:Buffer.from(challengeBytes);
    record=JSON.parse(bytes.toString('utf8'));
    signature=Buffer.from(String(signatureBase64).trim(),'base64');
    const started=Date.parse(record.created_at_utc),expires=Date.parse(record.expires_at_utc);
    if(record.context!=='rosevear.integration.v1.ql256.signer-possession'||
      record.source_sha_A!==QL256_SOURCE_522.sourceShaA||
      !/^[a-z0-9][a-z0-9_-]{2,63}$/i.test(record.nonproduction_tenant_id||'')||
      !Number.isFinite(started)||!Number.isFinite(expires)||expires-started<=0||expires-started>300000||
      now<started||now>expires||signature.length!==64||!verifySignature(null,bytes,key,signature))
      return {...partial,reason:'Challenge signature, nonproduction scope, expiry or source SHA did not verify.'};
  }catch{return {...partial,reason:'Challenge receipt or signature could not be verified.'};}
  return {...partial,signer_provisioning_decision:'SIGNER_EXISTS_CUSTODY_NOT_VERIFIED',
    signer_possession_challenge_valid:true,
    reason:'Authentic Ed25519 possession of this public key was demonstrated for the bounded challenge only. Custodian identity, independent witness pin and owner TEST-only approval are NOT verified.'};
}

export async function collectQl256PublicEvidence522({mainSha,fetchFn=fetch,publicSpkiPem,challengeBytes,signatureBase64,now=Date.now()}={}){
  const probe=await probeQl253PublicOrigin519({mainSha,
    sourceShaA:QL256_SOURCE_522.sourceShaA,runId:QL256_SOURCE_522.sourceRunId,fetchFn});
  const signer=inspectPrivateQl256Challenge522({publicSpkiPem,challengeBytes,signatureBase64,now});
  return {
    app:'Devil n Dove',repository:QL256_SOURCE_522.repo,current_main_sha:mainSha,
    signer_provisioning_decision:signer.signer_provisioning_decision,
    source_sha_A:QL256_SOURCE_522.sourceShaA,source_ci_run_url:probe.source_ci_run_url,
    source_ci_exact_head_green:probe.source_ci_exact_head_green,
    original_ql246_proof_http_status:probe.immutable_public_proof_http_status,
    proof_commit_sha_B:'NOT_AVAILABLE',exact_proof_bytes_sha256:'NOT_AVAILABLE',
    public_spki_sha256:signer.public_spki_sha256,
    signer_possession_challenge_valid:signer.signer_possession_challenge_valid,
    independent_custody_witness_reviewer:'NOT_ASSIGNED / PRIVATE_REVIEW_REQUESTED',
    nonproduction_tenant_verified:false,owner_test_decision:'NOT_GIVEN',
    genuine_gateway_get_and_denial_receipts:'NOT_RUN',connection_state:'DISCONNECTED / HOLD',
    next_concrete_blocker:signer.signer_possession_challenge_valid?
      'A separate authenticated human must independently verify the signer custodian identity and distinct witness fingerprint, then record the approved nonproduction tenant and TEST-only owner decision before any GET.':
      'Name an owner-approved private Devil n Dove Ed25519 key custodian, choose its secure key store, and have a distinct authenticated witness issue a fresh five-minute real nonce challenge. No accepted signer custody evidence is presently available.',
    signer_reason:signer.reason
  };
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  const args=process.argv.slice(2),ix=args.indexOf('--public-get'),sha=args[ix+1];
  const keyIx=args.indexOf('--public-spki-pem'),challengeIx=args.indexOf('--challenge-file'),signatureIx=args.indexOf('--signature-file');
  if(ix<0||!/^[0-9a-f]{40}$/.test(sha||'')||
    (challengeIx>=0)!==(signatureIx>=0)||(challengeIx>=0&&keyIx<0)){
    process.stderr.write('Usage: node scripts/ql256_original_signer_preflight_522.mjs --public-get <40-char-main-sha> [--public-spki-pem <public-file> --challenge-file <independently-issued-json> --signature-file <base64-signature>]. Public GitHub-only; no gateway or signer provisioning.\n');
    process.exitCode=2;
  }else{
    try{
      const publicSpkiPem=keyIx>=0?readFileSync(args[keyIx+1],'utf8'):undefined;
      const challengeBytes=challengeIx>=0?readFileSync(args[challengeIx+1]):undefined;
      const signatureBase64=signatureIx>=0?readFileSync(args[signatureIx+1],'utf8'):undefined;
      collectQl256PublicEvidence522({mainSha:sha,publicSpkiPem,challengeBytes,signatureBase64})
        .then(result=>{process.stdout.write(JSON.stringify(result,null,2)+'\n');process.exitCode=2;})
        .catch(error=>{process.stderr.write('Actual public QL-256 evidence could not be verified: '+String(error.message).slice(0,160)+'\n');process.exitCode=2;});
    }catch(error){process.stderr.write('Public SPKI or privately issued challenge files are unavailable: '+String(error.message).slice(0,120)+'\n');process.exitCode=2;}
  }
}
