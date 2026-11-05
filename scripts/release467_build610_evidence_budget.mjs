/* Build 610 — bounded parallel verification of the exact, unchanged Build 595–608 suites.
 * All cases run. Timeout, nonzero exit, missing fixture, or missing evidence FAIL CLOSED.
 */
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync,appendFileSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {performance} from 'node:perf_hooks';

export const TEST_FILES_610=[
 'scripts/release467_build602_external_issuer_witness_owner.test.mjs',
 'scripts/release467_build601_issuer_escalation_handoff.test.mjs',
 'scripts/release467_build600_decision_register_aging.test.mjs',
 'scripts/release467_build599_issuer_receipt_consent_preflight.test.mjs',
 'scripts/release467_build598_issuer_response_witness.test.mjs',
 'scripts/release467_build597_source_disposition_witness.test.mjs',
 'scripts/release467_build596_review_workboard.test.mjs',
 'scripts/release467_build595_source_verification.test.mjs',
 'scripts/release467_build603_custody_witness_owner_expiry.test.mjs',
 'scripts/release467_build604_issuer_witness_owner_renewal.test.mjs',
 'scripts/release467_build605_issuer_witness_owner_handoff.test.mjs',
 'scripts/release467_build606_issuer_challenge_witness_consent.test.mjs',
 'scripts/release467_build607_issuer_witness_owner_decision.test.mjs',
 'scripts/release467_build608_issuer_witness_owner_renewal.test.mjs'
];
export const BUDGET_610=Object.freeze({
 max_concurrent:3, per_file_hard_ms:240000, total_hard_ms:420000,
 soft_total_ms:180000, report_version:1
});
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const REPORT='artifacts/build610-evidence-test-timings.json';
const read=p=>readFileSync(path.join(ROOT,p),'utf8');
export function auditInventory610(root=ROOT){
 if(TEST_FILES_610.length!==14||new Set(TEST_FILES_610).size!==14)
  throw Error('Evidence file inventory changed or duplicated');
 for(const [i,build] of Array.from({length:14},(_,n)=>[n,595+n]))
  if(!TEST_FILES_610.some(p=>p.startsWith('scripts/release467_build'+build+'_')))
   throw Error('Missing exact Build '+build+' source-replay test');
 for(const p of TEST_FILES_610){
  if(!existsSync(path.join(root,p)))throw Error('Missing mandatory evidence test '+p);
 }
 const gate=read(' .github/workflows/current-application-quality.yml'.trimStart());
 for(const p of TEST_FILES_610)
  if(!gate.includes(p))throw Error('Mandatory quality workflow lost '+p);
 if(!gate.includes('node scripts/release467_build610_evidence_budget.mjs'))
  throw Error('Mandatory source-replay runner detached from Quality gate');
 if(!gate.includes('Build 609 consolidated historical proof'))
  throw Error('Historical consolidated proof removed');
 const marker=read('.github/workflows/production-pages-deploy-current.yml');
 if(!marker.includes('"build":610'))throw Error('Expected production Build 610 release marker');
 return {files:TEST_FILES_610.length,concurrency:BUDGET_610.max_concurrent};
}
function runTest610(testPath){
 return new Promise(resolve=>{
  const started=performance.now();let stdout='',stderr='',overflow=false,timedOut=false;
  const child=spawn(process.execPath,['--test',testPath],{
   cwd:ROOT,stdio:['ignore','pipe','pipe'],
   env:Object.fromEntries(['PATH','HOME','CI','NODE_ENV','TZ','GITHUB_SHA',
     'GITHUB_WORKSPACE'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]))
  });
  const cap=(current,chunk)=>{const s=current+chunk.toString('utf8');
   if(s.length>150000){overflow=true;return s.slice(-150000);}return s;};
  child.stdout.on('data',chunk=>{stdout=cap(stdout,chunk);});
  child.stderr.on('data',chunk=>{stderr=cap(stderr,chunk);});
  const timer=setTimeout(()=>{timedOut=true;child.kill('SIGKILL');},
   BUDGET_610.per_file_hard_ms);
  child.on('error',err=>{stderr+=' '+err.message;});
  child.on('close',(code,signal)=>{
   clearTimeout(timer);
   const duration_ms=Math.round(performance.now()-started);
   const match=stdout.match(/# tests (\d+)/);
   resolve({file:testPath,passed:code===0&&!timedOut&&!overflow,
    duration_ms,tests:match?Number(match[1]):null,timed_out:timedOut,
    exit_code:code,signal:signal||null,output_truncated:overflow,
    failure_excerpt:code===0&&!timedOut&&!overflow?null:
     (stdout.slice(-1600)+'\n'+stderr.slice(-1200)).slice(-2600)});
  });
 });
}
export async function runBudget610(){
 auditInventory610();
 const started=performance.now(),results=[],active=new Set();
 let next=0;
 const workers=Array.from({length:BUDGET_610.max_concurrent},async()=>{
  while(next<TEST_FILES_610.length){
   const i=next++;
   const r=await runTest610(TEST_FILES_610[i]);
   results.push(r);
   console.log('BUILD610 '+(r.passed?'PASS':'FAIL')+' '+r.duration_ms+
     'ms ('+(r.tests??'?')+' tests) '+r.file);
  }
 });
 await Promise.all(workers);
 const total_ms=Math.round(performance.now()-started);
 const failures=results.filter(r=>!r.passed);
 const report={
  schema:'devilndove-build610-exact-source-test-budget-v1',
  source_sha:process.env.GITHUB_SHA||null,
  tested_files:TEST_FILES_610.length,executed_files:results.length,
  max_concurrent:BUDGET_610.max_concurrent,
  hard_per_file_ms:BUDGET_610.per_file_hard_ms,
  hard_total_ms:BUDGET_610.total_hard_ms,
  soft_target_ms:BUDGET_610.soft_total_ms,
  elapsed_ms:total_ms,soft_sla_exceeded:total_ms>BUDGET_610.soft_total_ms,
  complete:results.length===TEST_FILES_610.length,
  failures:failures.length,all_passed:failures.length===0&&
   results.length===TEST_FILES_610.length&&total_ms<=BUDGET_610.total_hard_ms,
  results:TEST_FILES_610.map(f=>results.find(x=>x.file===f))
 };
 mkdirSync(path.dirname(path.join(ROOT,REPORT)),{recursive:true});
 writeFileSync(path.join(ROOT,REPORT),JSON.stringify(report,null,2)+'\n');
 if(process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY,
   '\n### Build 610 exact evidence tests\n'+
   '- Cases: '+report.executed_files+'/'+report.tested_files+'\n'+
   '- Parallel workers: '+report.max_concurrent+'\n'+
   '- Elapsed: '+(total_ms/1000).toFixed(1)+' s; target: '+
    (BUDGET_610.soft_total_ms/1000).toFixed(0)+' s\n'+
   '- Failures: '+failures.length+'\n'+
   '- Source chain authorization: **HOLD**\n');
 if(!report.all_passed)throw Error('Build 610 evidence budget FAIL CLOSED: '+
  failures.map(x=>x.file).join(',')+', elapsed='+total_ms);
 if(report.soft_sla_exceeded)
  console.warn('Build 610 timing soft SLO exceeded; tests still GREEN, investigate latency.');
 return report;
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
 try{
  if(process.argv.includes('--audit-only'))
   console.log('Build 610 source-replay inventory PASS:',auditInventory610());
  else await runBudget610();
 }catch(err){console.error(err.message);process.exitCode=1;}
}
