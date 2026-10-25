/* Build 463 synthetic provider-meter inputs; genuine GitHub sample provenance separate. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {BUDGET_METRICS_463,BUDGET_SOURCE_LINKS_463,ACTIONS_SAMPLE_463,calculateBudget463} from '../public/js/maker-resource-budget-policy-463.mjs';
import {MAKER_LINKS,workbenchUrl} from '../public/js/maker-workbench-policy-457.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const windowStart='2026-10-24T00:00:00Z',windowEnd='2026-10-25T00:00:00Z';
const sources={d1:'https://dash.cloudflare.com/example/d1',workers:'https://dash.cloudflare.com/example/workers',r2:'https://dash.cloudflare.com/example/r2',actions:'https://github.com/RosevearCreations/devilndove-site/actions'};
const complete={windowStart,windowEnd,sources,values:Object.fromEntries(BUDGET_METRICS_463.map(m=>[m.key,0])),limits:Object.fromEntries(BUDGET_METRICS_463.map(m=>[m.key,100]))};
test('missing live Cloudflare data never becomes a confirmed usage result or estimated zero',()=>{
 const r=calculateBudget463();assert.equal(r.state,'HOLD_PROVIDER_METRICS_INCOMPLETE');
 assert.ok(r.metrics.every(m=>m.usage===null&&m.ratio===null));assert.equal(r.providerVerified,false);
 assert.equal(r.automaticCostChange,false);assert.equal(r.d1WriteAllowed,false);assert.equal(r.r2DeletionAllowed,false);
 assert.equal(r.githubGateWeakeningAllowed,false);
});
test('even complete operator-entered figures remain manual review and cannot change quota/provider',()=>{
 const r=calculateBudget463(complete);assert.equal(r.state,'REVIEW_PROVIDER_EVIDENCE_MANUALLY');
 assert.equal(r.metrics.length,12);assert.ok(r.metrics.every(m=>m.usage===0&&m.ratio===0&&m.status==='BELOW_RECORDED_LIMIT'));
 assert.equal(r.providerVerified,false);assert.equal(r.automaticQuotaIncrease,false);assert.equal(r.automaticRetry,false);
});
test('near or over limit is shown from actual input; invalid window/source stays HOLD',()=>{
 const r=calculateBudget463({...complete,values:{...complete.values,d1_reads:76,r2_storage:101}});
 assert.equal(r.metrics.find(m=>m.key==='d1_reads').status,'NEAR_RECORDED_LIMIT');
 assert.equal(r.metrics.find(m=>m.key==='r2_storage').status,'OVER_RECORDED_LIMIT');
 assert.equal(r.nearOrOver.length,2);
 const blocked=calculateBudget463({...complete,windowStart:'2026-10-24T00:00:00',sources:{...sources,d1:'https://malicious.example/d1'}});
 assert.equal(blocked.state,'HOLD_PROVIDER_METRICS_INCOMPLETE');
 assert.equal(blocked.metrics.find(m=>m.key==='d1_reads').source,null);
 assert.match(blocked.holds.join(' '),/UTC reporting/);
 assert.equal(calculateBudget463({...complete,limits:{...complete.limits,worker_cpu_p95:''}}).state,'HOLD_PROVIDER_METRICS_INCOMPLETE');
});
test('historical completed Build 462 GitHub timing sample reconciles without claiming invoice/billable usage',()=>{
 const s=ACTIONS_SAMPLE_463;assert.equal(s.runs,78);assert.equal(s.jobs,82);assert.equal(s.job_execution_minutes,17.8);
 assert.equal(s.rounded_job_minute_reference,83);assert.equal(s.first_job_wait_p95_seconds,66);
 assert.equal(s.lanes.reduce((sum,x)=>sum+x.runs,0),78);assert.equal(s.lanes.reduce((sum,x)=>sum+x.jobs,0),82);
 assert.equal(s.lanes.reduce((sum,x)=>sum+x.rounded_reference,0),83);
 assert.ok(Object.values(BUDGET_SOURCE_LINKS_463).every(x=>x.startsWith('https://developers.cloudflare.com/')||x.startsWith('https://docs.github.com/')));
});
test('private responsive Admin screen uses only optional original GET and browser-local export, no background provider or D1 writes',()=>{
 const html=read('admin/maker-resource-budget/index.html'),js=read('public/js/admin-maker-resource-budget-463.js');
 assert.match(html,/data-admin-module="it-platform"/);assert.match(html,/href="#rbMain"/);assert.match(html,/aria-live="polite"/);
 assert.match(html,/:focus-visible/);assert.match(html,/@media\(max-width:480px\)/);assert.match(html,/prefers-reduced-motion/);
 assert.match(js,/\/api\/admin\/d1-read-budget/);assert.match(js,/method:'GET'/);assert.match(js,/credentials:'same-origin'/);
 assert.doesNotMatch(js,/method:\s*['"]POST['"]|localStorage|sessionStorage|innerHTML|api\.cloudflare\.com|fetch\(['"]https:/);
 assert.match(js,/rbContracts.*addEventListener/);assert.match(js,/UNVERIFIED_RESOURCE_BUDGET_AUDIT/);
 const link=MAKER_LINKS.find(x=>x.key==='resource-budget');assert.ok(link);
 assert.equal(workbenchUrl(link,89),'/admin/maker-resource-budget/');
});
