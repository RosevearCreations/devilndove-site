/* QL-253 public GitHub metadata GET-only probe. No gateway, private auth,
 * owner decision, or signing operation is ever attempted here. */
import {createHash} from 'node:crypto';
const sha=value=>/^[0-9a-f]{40}$/.test(String(value||''));
const run=value=>/^[1-9][0-9]{5,18}$/.test(String(value||''));
const repo='RosevearCreations/devilndove-site';

export async function probeQl253PublicOrigin519({sourceShaA,mainSha,runId,proofCommitShaB=null,fetchFn=fetch}={}){
  if(!sha(sourceShaA)||!sha(mainSha)||!run(runId)||proofCommitShaB!==null&&!sha(proofCommitShaB))
    throw Error('Exact immutable public source, main SHA and CI run ID are required.');
  const output={repository:repo,source_sha_A:sourceShaA,main_sha:mainSha,
    source_ci_run_url:`https://github.com/${repo}/actions/runs/${runId}`,
    source_ci_exact_head_green:false,proof_commit_sha_B:proofCommitShaB||'NOT_AVAILABLE',
    immutable_public_proof_http_status:'NOT_AVAILABLE',proof_ancestry_verified:false,
    proof_source_sha_matches_A:false,exact_proof_bytes_sha256:'NOT_AVAILABLE',
    independent_signer_pin_verified:false,owner_test_decision:'NOT_GIVEN',
    actual_gateway_test:'NOT_RUN',connection_state:'DISCONNECTED',issues:[]};
  const headers={'Accept':'application/vnd.github+json','User-Agent':'devilndove-ql253-public-origin-probe'};
  const get=async url=>fetchFn(url,{method:'GET',redirect:'error',headers,signal:AbortSignal.timeout(10000)});
  const ci=await get(`https://api.github.com/repos/${repo}/actions/runs/${runId}`);
  if(ci.status===200){
    const v=await ci.json();
    output.source_ci_exact_head_green=v.head_sha===sourceShaA&&v.conclusion==='success'&&v.status==='completed';
  }
  if(!output.source_ci_exact_head_green)output.issues.push('Exact source A GREEN GitHub Actions run is not independently verified.');
  const proofUrl=`https://raw.githubusercontent.com/${repo}/${proofCommitShaB||mainSha}/docs/integration/ql246-source-proof.json`;
  const proof=await get(proofUrl);
  output.immutable_public_proof_http_status=proof.status;
  if(proof.status!==200){output.issues.push(`Genuine immutable QL-246 source proof unavailable: HTTP ${proof.status}.`);return output;}
  let raw,record;
  try{raw=await proof.text();record=JSON.parse(raw);}catch{
    output.issues.push('Public proof did not return a valid readable JSON record.');return output;
  }
  output.exact_proof_bytes_sha256=createHash('sha256').update(Buffer.from(raw)).digest('hex');
  output.proof_source_sha_matches_A=record?.payload?.source_revision===sourceShaA;
  if(!output.proof_source_sha_matches_A)output.issues.push('Signed source revision does not equal exact tested source A.');
  if(!proofCommitShaB){output.issues.push('Proof B is not separately identified; a current-main file is not immutable two-SHA attestation.');return output;}
  const compare=await get(`https://api.github.com/repos/${repo}/compare/${sourceShaA}...${proofCommitShaB}`);
  if(compare.status===200){const v=await compare.json();
    output.proof_ancestry_verified=sourceShaA!==proofCommitShaB&&v.status==='ahead'&&Number(v.ahead_by)>0;
  }
  if(!output.proof_ancestry_verified)output.issues.push('Distinct proof B / source A ancestry is not confirmed.');
  // Public retrieval and ancestry are not signer trust, real witness, or owner authorization.
  output.issues.push('Independent SPKI custody, distinct signed witness and authenticated owner TEST-only decision remain required.');
  return output;
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  if(process.argv[2]!=='--public-get'){
    process.stderr.write('Use --public-get with immutable source SHA, main SHA and numeric CI run ID. No gateway GET is supported.\n');
    process.exitCode=2;
  }else{
    probeQl253PublicOrigin519({sourceShaA:process.argv[3],mainSha:process.argv[4],runId:process.argv[5],proofCommitShaB:process.argv[6]||null})
      .then(v=>{process.stdout.write(JSON.stringify(v,null,2)+'\n');if(v.issues.length)process.exitCode=2;})
      .catch(error=>{process.stderr.write('Public GitHub GET failed: '+String(error.message).slice(0,200)+'\n');process.exitCode=2;});
  }
}
