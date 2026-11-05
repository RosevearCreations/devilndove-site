/* Build 610: read-only promotion queue/runner timing evidence.
 * SLA warnings never certify or override protected security and release checks.
 */
import {appendFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const REPO='RosevearCreations/devilndove-site';
const ALLOWED=new Set(['System Gate','Current Application Quality Proof',
 'I.T. Admin Runtime Proof','Repository Branch Hygiene',
 'Production Pages Deploy','Production Live Resource Integrity Proof']);
const TARGETS={queue_wait_s:120,quality_runtime_s:300,production_runtime_s:180};
export function summarizeQueue610(rows){
 if(!Array.isArray(rows))throw Error('Queue observations must be an array');
 const vals=rows.map(r=>{
  if(!r||!ALLOWED.has(r.workflow)||!Number.isFinite(r.queued_s)||
    !Number.isFinite(r.runtime_s)||r.queued_s<0||r.runtime_s<0)
    throw Error('Malformed or untrusted GitHub queue timing');
  return {...r,
   queue_slo_exceeded:r.queued_s>TARGETS.queue_wait_s,
   runtime_slo_exceeded:r.runtime_s>
    (r.workflow==='Production Pages Deploy'?TARGETS.production_runtime_s:
     r.workflow==='Current Application Quality Proof'?TARGETS.quality_runtime_s:900)};
 });
 const p95=arr=>arr.length?
   [...arr].sort((a,b)=>a-b)[Math.ceil(arr.length*.95)-1]:null;
 const summary={
  observed_runs:vals.length,
  p95_queue_wait_s:p95(vals.map(r=>r.queued_s)),
  p95_runtime_s:p95(vals.map(r=>r.runtime_s)),
  queue_slo_warnings:vals.filter(r=>r.queue_slo_exceeded).length,
  runtime_slo_warnings:vals.filter(r=>r.runtime_slo_exceeded).length,
  most_delayed:vals.slice().sort((a,b)=>b.queued_s-a.queued_s).slice(0,4)
 };
 return {summary,observations:vals,targets:TARGETS};
}
const positive=(a,b)=>Math.max(0,Math.round((Date.parse(b)-Date.parse(a))/1000));
async function githubGet(url,token){
 const parsed=new URL(url);
 if(parsed.hostname!=='api.github.com'||
   !parsed.pathname.startsWith('/repos/'+REPO+'/actions/runs'))
  throw Error('Only read-only repository Actions endpoints are permitted');
 const response=await fetch(parsed,{method:'GET',signal:AbortSignal.timeout(12000),
  headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28','User-Agent':'devilndove-ci-sla-build610'}});
 if(!response.ok)throw Error('GitHub telemetry GET status '+response.status);
 return response.json();
}
export async function collectQueue610(token){
 if(!token)throw Error('No Actions read token available');
 const all=[];
 for(const branch of ['dev','main']){
  const data=await githubGet('https://api.github.com/repos/'+REPO+
   '/actions/runs?branch='+branch+'&per_page=40',token);
  const used=new Map();
  for(const r of data.workflow_runs||[]){
   if(!ALLOWED.has(r.name)||r.status!=='completed'||r.conclusion!=='success')
    continue;
   const count=used.get(r.name)||0;
   if(count>=2)continue;
   used.set(r.name,count+1);
   all.push({branch,run:r});
  }
 }
 const observations=[];
 for(const {branch,run} of all.slice(0,15)){
  const data=await githubGet('https://api.github.com/repos/'+REPO+
   '/actions/runs/'+run.id+'/jobs?per_page=100',token);
  const jobs=(data.jobs||[]).filter(j=>j.started_at&&j.completed_at);
  if(!jobs.length)continue;
  const first=jobs.reduce((m,j)=>Date.parse(j.started_at)<Date.parse(m.started_at)?j:m);
  const last=jobs.reduce((m,j)=>Date.parse(j.completed_at)>Date.parse(m.completed_at)?j:m);
  const slowest=jobs.flatMap(j=>(j.steps||[]).filter(s=>s.started_at&&s.completed_at)
    .map(s=>({name:s.name,seconds:positive(s.started_at,s.completed_at)})))
   .sort((a,b)=>b.seconds-a.seconds).slice(0,3);
  observations.push({
   workflow:run.name,branch,run_id:run.id,
   commit_sha:run.head_sha,queued_s:positive(run.created_at,first.started_at),
   runtime_s:positive(first.started_at,last.completed_at),top_steps:slowest
  });
 }
 return summarizeQueue610(observations);
}
function save(report){
 const output=path.join(root,'artifacts/build610-promotion-queue-sla.json');
 mkdirSync(path.dirname(output),{recursive:true});
 writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 if(process.env.GITHUB_STEP_SUMMARY){
  const s=report.observation_status==='AVAILABLE'?report.metrics.summary:null;
  appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n### Build 610 promotion queue SLA\n'+
   (s?'- Source: GitHub Actions original read-only timestamps\n'+
    '- Runs: '+s.observed_runs+', p95 initial queue wait: '+
     s.p95_queue_wait_s+' s, p95 runtime: '+s.p95_runtime_s+' s\n'+
    '- Queue warnings: '+s.queue_slo_warnings+
     '; runtime warnings: '+s.runtime_slo_warnings+'\n':
    '- **UNAVAILABLE**: could not obtain source-authenticated GitHub timings. No green claim made.\n')+
   '- Thresholds are monitoring warnings only; protected gates still fail closed.\n');
 }
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
 if(!process.argv.includes('--collect')){
  const sample=summarizeQueue610([{workflow:'Current Application Quality Proof',
   branch:'dev',run_id:1,queued_s:13,runtime_s:348},
  {workflow:'Production Pages Deploy',branch:'main',run_id:2,
   queued_s:4,runtime_s:52}]);
  if(sample.summary.runtime_slo_warnings!==1||
    sample.summary.queue_slo_warnings!==0)throw Error('SLA fixture mismatch');
  console.log('Build 610 queue and budget calculator self-test PASS.');
 }else{
  let report;
  try{
   const metrics=await collectQueue610(process.env.GITHUB_TOKEN||'');
   report={schema:'devilndove-build610-promotion-queue-sla-v1',
    observation_status:'AVAILABLE',source:'GitHub Actions read-only API',
    observed_at:new Date().toISOString(),metrics};
  }catch(e){
   report={schema:'devilndove-build610-promotion-queue-sla-v1',
    observation_status:'UNAVAILABLE',observed_at:new Date().toISOString(),
    error:String(e.message).slice(0,160),metrics:null};
   console.warn('GitHub queue telemetry unavailable; do not claim SLA acceptance.');
  }
  save(report);
  console.log('Build 610 read-only queue monitoring:',
   report.observation_status,report.metrics?.summary||'no measurements');
 }
}
