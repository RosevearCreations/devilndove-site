/* Build 612 — static source-replay dependency graph and measured runner CPU safeguards.
 * This does not execute, suppress, sign, authenticate or authorize provider requests.
 */
import {readFileSync,writeFileSync,mkdirSync,appendFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {TEST_FILES_610,BUDGET_610,workerCapacity612} from './release467_build610_evidence_budget.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFileSync(path.join(ROOT,p),'utf8');
const reportPath='artifacts/build610-evidence-test-timings.json';
export const STAGES_612=Object.freeze([
 {build:595,fn:'sourceVerification595',prior:'intakeAging594',file:'public/js/admin-channel-source-verification-595.mjs'},
 {build:596,fn:'evidenceWorkboard596',prior:'sourceVerification595',file:'public/js/admin-channel-review-workboard-596.mjs'},
 {build:597,fn:'reconcileSource597',prior:'evidenceWorkboard596',file:'public/js/admin-channel-source-disposition-597.mjs'},
 {build:598,fn:'issuerResponseReview598',prior:'reconcileSource597',file:'public/js/admin-channel-issuer-response-598.mjs'},
 {build:599,fn:'receiptIntake599',prior:'issuerResponseReview598',file:'public/js/admin-channel-issuer-response-598.mjs'},
 {build:600,fn:'decisionRegister600',prior:'receiptIntake599',file:'public/js/admin-channel-issuer-response-598.mjs'},
 {build:601,fn:'reconcileEscalations601',prior:'decisionRegister600',file:'public/js/admin-channel-issuer-response-598.mjs'},
 {build:602,fn:'recheckExternalEvidence602',prior:'reconcileEscalations601',file:'public/js/admin-channel-issuer-response-598.mjs'}
]);
const validNumber=n=>Number.isFinite(n)&&n>=0;
const stageBuild=file=>Number(file.match(/release467_build(\d{3})_/)?.[1]);
function sourceGraph612(){
 const stages=STAGES_612.map(x=>{
  const source=read(x.file);
  if(!source.includes('export function '+x.fn+'(')||
     !source.includes(x.prior+'(')||
     !source.includes('asOf===exact'+(x.build-1)+'.as_of?reproduced:'))
   throw Error('Build '+x.build+' must independently replay and verify '+x.prior);
  return {build:x.build,function:x.fn,exact_prior:x.prior,runtime_file:x.file};
 });
 const edges=stages.slice(1).map((x,i)=>({from:stages[i].build,to:x.build,
  relation:'source-replay stage dependency'}));
 return {stages,edges};
}
function importedTestGraph612(){
 const suiteByPath=new Map(TEST_FILES_610.map(x=>[x,stageBuild(x)]));
 if(suiteByPath.size!==14||[...suiteByPath.values()].some(x=>!Number.isInteger(x)))
  throw Error('Build 612 source-replay suite inventory changed');
 const nodes=TEST_FILES_610.map(file=>{
  const source=read(file);
  const imports=[...source.matchAll(/\bfrom\s*['"](\.[^'"]+\.mjs)['"]/g)]
   .map(x=>path.posix.normalize(path.posix.join(path.posix.dirname(file),x[1])));
  return {build:suiteByPath.get(file),file,
   imported_suite_builds:imports.filter(x=>suiteByPath.has(x))
    .map(x=>suiteByPath.get(x)).sort((a,b)=>a-b),
   runtime_module_imports:imports.filter(x=>x.startsWith('public/js/')).length};
 });
 const edges=nodes.flatMap(n=>n.imported_suite_builds.map(x=>({from:n.build,to:x,
  relation:'static test-module import'})));
 const adjacency=new Map(nodes.map(x=>[x.build,x.imported_suite_builds]));
 const settled=new Set(),pending=new Set();
 function visit(id){
  if(pending.has(id))throw Error('Build 612 test suite import cycle at '+id);
  if(settled.has(id))return;
  pending.add(id);
  for(const to of adjacency.get(id)||[])visit(to);
  pending.delete(id);settled.add(id);
 }
 for(const node of nodes)visit(node.build);
 return {nodes:nodes.sort((a,b)=>a.build-b.build),edges};
}
export function profileGraph612(report){
 if(!report||report.schema!=='devilndove-build610-exact-source-test-budget-v1'||
 !report.all_passed||!report.complete||report.failures!==0||
 report.tested_files!==14||report.executed_files!==14||report.results?.length!==14||
 !validNumber(report.elapsed_ms)||report.elapsed_ms===0)
 throw Error('Build 612 requires all 14 exact, successful source-replay test reports');
 const expected=TEST_FILES_610,newResults=new Map();
 for(const x of report.results){
  if(!x||!expected.includes(x.file)||newResults.has(x.file)||!x.passed||
    x.timed_out||x.output_truncated||x.exit_code!==0||!validNumber(x.duration_ms))
   throw Error('Build 612 refuses skipped, repeated, failed or forged test evidence');
  newResults.set(x.file,x);
 }
 if(newResults.size!==14)throw Error('Build 612 missing exact source test evidence');
 const cores=report.available_cpu_cores,workers=report.max_concurrent;
 if(!Number.isInteger(cores)||cores<1||!Number.isInteger(workers)||
    workers!==workerCapacity612(cores)||workers>BUDGET_610.max_concurrent)
 throw Error('Build 612 detected CPU oversubscription or missing runner capacity');
 if(!validNumber(report.hard_per_file_ms)||report.hard_per_file_ms!==BUDGET_610.per_file_hard_ms||
 report.hard_total_ms!==BUDGET_610.total_hard_ms)
 throw Error('Build 612 cannot alter hard test execution budgets');
 const runtime=sourceGraph612(),tests=importedTestGraph612();
 const stages=tests.nodes.map(n=>({
   ...n,measured_ms:newResults.get(n.file).duration_ms
 }));
 const total_standalone_ms=stages.reduce((a,b)=>a+b.measured_ms,0);
 const parallel_factor=Math.round(1000*total_standalone_ms/report.elapsed_ms)/1000;
 if(total_standalone_ms>report.elapsed_ms*workers+1000)
 throw Error('Build 612 detected contradictory runner timing/worker capacity');
 const cpu_load_1m_start=report.cpu_load_1m_start;
 const cpu_load_1m_end=report.cpu_load_1m_end;
 if(!validNumber(cpu_load_1m_start)||!validNumber(cpu_load_1m_end))
 throw Error('Build 612 requires source-reported CPU pressure observations');
 const sorted=stages.slice().sort((a,b)=>b.measured_ms-a.measured_ms);
 return {
  schema:'devilndove-build612-source-replay-graph-cpu-guard-v1',
  source_sha:report.source_sha,
  all_test_files_passed:true,files_executed:14,
  source_stages:runtime.stages,source_edges:runtime.edges,
  test_nodes:stages,test_import_edges:tests.edges,
  effective_workers:workers,configured_max_workers:BUDGET_610.max_concurrent,
  cpu_slots_available:cores,cpu_slots_reserved:Math.max(0,cores-workers),
  cpu_load_1m_start,cpu_load_1m_end,
  cpu_contention_warning:cpu_load_1m_start>cores*1.25||
    cpu_load_1m_end>cores*1.25,
  cpu_contention_proof:'CAPACITY_AND_HOST_LOAD_HEURISTIC_ONLY_NOT_PROCESS_CPU_USAGE',
  elapsed_ms:report.elapsed_ms,standalone_duration_sum_ms:total_standalone_ms,
  observed_overlap_factor:parallel_factor,
  slowest_files:sorted.slice(0,4),
  hard_total_ms:BUDGET_610.total_hard_ms,
  result:'TEST_GRAPH_VALID_CONCURRENCY_GUARDED_PROVIDER_OWNER_HOLD',
  authorization:'HOLD_ORIGINAL_ISSUER_INDEPENDENT_WITNESS_EXACT_SIGNED_OWNER'
 };
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  if(process.argv.includes('--audit-only')){
   const graph=sourceGraph612(),imports=importedTestGraph612();
   console.log('Build 612 graph audit PASS:',graph.stages.length,
    'exact replay stages,',imports.nodes.length,'mandatory test nodes,',
    imports.edges.length,'test import edges');
  }else{
   const report=JSON.parse(read(reportPath)),profile=profileGraph612(report);
   mkdirSync(path.join(ROOT,'artifacts'),{recursive:true});
   writeFileSync(path.join(ROOT,'artifacts/build612-source-graph-cpu-guard.json'),
    JSON.stringify(profile,null,2)+'\n');
   console.log('Build 612 original-source replay graph:',profile.source_stages.length,
    'stages /',profile.source_edges.length,'edges;',profile.files_executed,
    'test files; CPU cores',profile.cpu_slots_available,'workers',
    profile.effective_workers,'reserved',profile.cpu_slots_reserved);
   console.log('Build 612 source-measured replay wall time:',
    profile.elapsed_ms+'ms; overlap factor:',profile.observed_overlap_factor,
    '; contention heuristic warning:',profile.cpu_contention_warning);
   for(const n of profile.slowest_files)
    console.log('Build 612 hotspot:',n.build,n.measured_ms+'ms',n.file);
   if(process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
     '\n### Build 612 source-replay graph and CPU contention guardrails\n'+
     '- Verified suites: **14 of 14 GREEN**\n'+
     '- Source graph: '+profile.source_stages.length+' staged source checks\n'+
     '- Workers: '+profile.effective_workers+'/'+profile.cpu_slots_available+
       ' available CPU slots, '+profile.cpu_slots_reserved+' reserved\n'+
     '- Replay elapsed: '+profile.elapsed_ms+' ms; CPU pressure warning: '+
        profile.cpu_contention_warning+'\n'+
     '- Issuer, witness and exact owner authorization: **HOLD**\n');
  }
 }catch(error){console.error('Build 612 graph or CPU guard FAIL CLOSED:',error.message);process.exitCode=1;}
}
