// Build 431 — authoritative, bounded GitHub run classification; no changes to release policy.
export const RELEASE_PROOFS_431 = Object.freeze([
  {name:'System Gate', workflow:'system-gate.yml'},
  {name:'Current Application Quality Proof', workflow:'current-application-quality.yml'},
  {name:'I.T. Admin Runtime Proof', workflow:'it-admin-runtime-proof.yml'},
  {name:'Repository Branch Hygiene', workflow:'repository-branch-hygiene.yml'}
]);
export const PRODUCTION_WORKFLOW_431 = 'production-pages-deploy-current.yml';
export const SHA_431 = /^[0-9a-f]{40}$/;
export function classifyRuns431(payload, sha, branch) {
  if (!SHA_431.test(String(sha||'')) || !Array.isArray(payload?.workflow_runs))
    return {status:'UNKNOWN',reason:'No trustworthy workflow evidence was returned.',run_url:null,run_id:null};
  const runs=payload.workflow_runs.filter(x=>x?.head_sha===sha && x?.head_branch===branch);
  runs.sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||'')));
  const passed=runs.find(x=>x.status==='completed' && x.conclusion==='success');
  const chosen=passed||runs[0];
  if(!chosen)return {status:'MISSING',reason:'No run for this exact commit on '+branch+'.',run_url:null,run_id:null};
  const status=passed?'GREEN':chosen.status==='queued'||chosen.status==='in_progress'||chosen.status==='waiting'?'PENDING':'FAILED';
  return {status,reason:status==='GREEN'?'Successful run for exact '+branch+' SHA.':status==='PENDING'?'Run is still queued or running.':'No successful completed run for this exact SHA.',
    run_url: typeof chosen.html_url==='string'&&/^https:\/\/github\.com\/RosevearCreations\/devilndove-site\/actions\/runs\/\d+$/.test(chosen.html_url)?chosen.html_url:null,
    run_id:Number.isSafeInteger(chosen.id)?chosen.id:null};
}
export function summarizeGate431({dev_sha,main_sha,checks=[],production=null}={}) {
  const same=SHA_431.test(String(dev_sha||''))&&main_sha===dev_sha;
  const passed=checks.length===4&&checks.every(x=>x.status==='GREEN');
  const productionPassed=production?.status==='GREEN';
  let status='UNKNOWN';
  let reason='Repository and release evidence cannot currently be verified.';
  if(SHA_431.test(String(dev_sha||''))) {
    if(!passed){status='DEVELOPMENT_HOLD';reason='One or more exact-SHA Development proofs are missing, failed or unavailable.';}
    else if(!same){status='NOT_ON_MAIN';reason='Development proofs passed, but main does not match dev.';}
    else if(!productionPassed){status='PRODUCTION_HOLD';reason='main matches dev, but the Production Pages Deploy proof is not successful or not available.';}
    else {status='LIVE_VERSION_REQUIRED';reason='Production workflow succeeded; compare the live release-version.json SHA before confirming GREEN.';}
  }
  return {status,reason,branches_match:same,all_development_proofs_green:passed,production_workflow_green:productionPassed,
    production_green:false,live_version_verified:false};
}
