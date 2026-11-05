/* Build 611: source-derived replay timing, never a substitute for test results. */
import {readFileSync,mkdirSync,writeFileSync,appendFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(path.join(ROOT,p),'utf8'));
const BASELINE_610=Object.freeze({
  github_actions_run:41963999084,full_quality_ms:239000,
  concurrent_replay_ms:133000,
  stages_ms:{595:2389,596:5392,597:10829,598:18107,
    599:35181,600:64126,601:131375,602:127200}
});
const number=v=>Number.isFinite(v)&&v>=0;
export function sourceReplayProfile611(report){
 if(!report||report.schema!=='devilndove-build610-exact-source-test-budget-v1'||
 !report.all_passed||report.failures!==0||report.tested_files!==14||
 report.executed_files!==14||!number(report.elapsed_ms)||report.results?.length!==14)
 throw Error('No completely GREEN, source-derived 14-file replay timing');
 const stages=report.results.filter(x=>/release467_build(?:59[5-9]|60[0-2])_/.test(x.file));
 if(stages.length!==8||stages.some(x=>!x.passed||!number(x.duration_ms)))
 throw Error('Build 595–602 stage profile is incomplete');
 const measured=stages.map(s=>({
  build:Number(s.file.match(/build(\d{3})_/)[1]),file:s.file,elapsed_ms:s.duration_ms,
  baseline_ms:BASELINE_610.stages_ms[Number(s.file.match(/build(\d{3})_/)[1])],
  change_percent:Math.round(10000*(s.duration_ms/
    BASELINE_610.stages_ms[Number(s.file.match(/build(\d{3})_/)[1])]-1))/100
 })).sort((a,b)=>a.build-b.build);
 const speed=(base,newTime)=>Math.round(10000*(1-newTime/base))/100;
 return {schema:'devilndove-build611-reconciliation-replay-profile-v1',
  source_sha:report.source_sha,comparison_source:
    'GitHub Actions #'+BASELINE_610.github_actions_run,
  full_quality_baseline_ms:BASELINE_610.full_quality_ms,
  baseline_replay_ms:BASELINE_610.concurrent_replay_ms,
  current_replay_ms:report.elapsed_ms,
  replay_speedup_percent:speed(BASELINE_610.concurrent_replay_ms,report.elapsed_ms),
  all_tests_passed:true,stage_profiles:measured,
  remaining_hotspots:measured.slice().sort((a,b)=>b.elapsed_ms-a.elapsed_ms).slice(0,3),
  release_authority:'UNCHANGED_PROTECTED_GATES_EXTERNAL_PROVIDER_OWNER_HOLD'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const p=sourceReplayProfile611(read('artifacts/build610-evidence-test-timings.json'));
  mkdirSync(path.join(ROOT,'artifacts'),{recursive:true});
  writeFileSync(path.join(ROOT,'artifacts/build611-source-replay-profile.json'),
   JSON.stringify(p,null,2)+'\n');
  console.log('Build 611 original-source verified fixture reuse, exact replay:',
   (p.current_replay_ms/1000).toFixed(2),'seconds; Build 610 baseline',
   (p.baseline_replay_ms/1000).toFixed(2),'seconds; relative change',
   p.replay_speedup_percent+'%');
  for(const s of p.stage_profiles)
   console.log('Build '+s.build+' replay '+(s.elapsed_ms/1000).toFixed(2)+
    's (Build 610 '+(s.baseline_ms/1000).toFixed(2)+'s); delta '+s.change_percent+'%');
  if(p.replay_speedup_percent<=0)console.warn(
   'No measured speedup: investigate the remaining source-replay hot spots.');
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    '\n### Build 611 same-invocation fixture reuse and replay profile\n'+
    '- Verified exact-source tests: **14 of 14 GREEN**\n'+
    '- Build 610 replay baseline: '+(p.baseline_replay_ms/1000).toFixed(1)+' s\n'+
    '- Build 611 replay: '+(p.current_replay_ms/1000).toFixed(1)+' s\n'+
    '- Change: '+p.replay_speedup_percent+'%\n'+
    '- Original evidence, independent witness and exact signed owner permission: **HOLD**\n');
 }catch(e){console.error('Build 611 profiling FAIL CLOSED: '+e.message);process.exitCode=1;}
}
