// Release 467 Build 431 — verified-Admin, on-demand release evidence. No D1, R2 or provider writes.
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {RELEASE_PROOFS_431,PRODUCTION_WORKFLOW_431,SHA_431,classifyRuns431,summarizeGate431} from '../_lib/releaseGate431.mjs';

const REPO='RosevearCreations/devilndove-site';
const API='https://api.github.com/repos/'+REPO;
const githubWorkflowUrl=(file)=>'https://github.com/'+REPO+'/actions/workflows/'+file;
const response=(data,status=200)=>Response.json({ok:status<400,build:431,read_only:true,local_only:false,
  deployment_triggered:false,provider_called:false,db_written:false,...data},{status,headers:{'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff'}});
async function githubRead(path,token) {
  const headers={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',
    'User-Agent':'devilndove-release-gate-431'};
  if(token)headers.Authorization='Bearer '+token;
  try {
    const res=await fetch(API+path,{headers,cache:'no-store',signal:AbortSignal.timeout(9000)});
    if(!res.ok) {
      const reason=res.status===404?'Repository or workflow is not accessible to this read-only API.':
        res.status===403?'GitHub API access is rate-limited or lacks read permission.':
        'GitHub API returned HTTP '+res.status+'.';
      return {error:reason};
    }
    return {value:await res.json()};
  }catch{return {error:'GitHub API request timed out or could not be completed.'};}
}
function branchSha(result) {
  const sha=result?.value?.commit?.sha;
  return SHA_431.test(String(sha||''))?sha:null;
}
function unavailable(reason) {
  return {status:'UNKNOWN',reason:reason||'Workflow evidence could not be accessed.',run_url:null,run_id:null};
}
export async function onRequestGet(context) {
  if(!verifiedAdminFromModule(context))return response({error:'Verified active Admin required.'},401);
  const token=String(context.env?.GITHUB_RELEASE_READ_TOKEN||'').trim();
  const [dev,main]=await Promise.all([githubRead('/branches/dev',token),githubRead('/branches/main',token)]);
  const devSha=branchSha(dev),mainSha=branchSha(main);
  const proofItems=await Promise.all(RELEASE_PROOFS_431.map(async item=>{
    if(!devSha)return {...item,...unavailable(dev.error||'The Development SHA could not be resolved.'),workflow_url:githubWorkflowUrl(item.workflow)};
    const url='/actions/workflows/'+item.workflow+'/runs?branch=dev&head_sha='+devSha+'&per_page=100';
    const found=await githubRead(url,token);
    return {...item,...(found.error?unavailable(found.error):classifyRuns431(found.value,devSha,'dev')),
      workflow_url:githubWorkflowUrl(item.workflow)};
  }));
  let prod=unavailable(main.error||'The main SHA could not be resolved.');
  if(mainSha) {
    const found=await githubRead('/actions/workflows/'+PRODUCTION_WORKFLOW_431+'/runs?branch=main&head_sha='+mainSha+'&per_page=100',token);
    prod=found.error?unavailable(found.error):classifyRuns431(found.value,mainSha,'main');
  }
  prod={...prod,name:'Production Pages Deploy',workflow:PRODUCTION_WORKFLOW_431,workflow_url:githubWorkflowUrl(PRODUCTION_WORKFLOW_431)};
  const summary=summarizeGate431({dev_sha:devSha,main_sha:mainSha,checks:proofItems,production:prod});
  return response({
    repo:REPO,dev_sha:devSha,main_sha:mainSha,
    dev_source_issue:dev.error||null,main_source_issue:main.error||null,
    checks:proofItems,production:prod,summary,
    live_version_path:'/release-version.json',
    note:'Production GREEN is never inferred from green GitHub runs alone. Compare the live version marker with main after a successful protected Production deploy.'
  });
}
export function onRequestPost(){return response({error:'This release-status endpoint is strictly read-only.'},405);}
