/* Build 463 — provenance-first resource budget review. No provider meter inferred. */
export const BUDGET_SOURCE_LINKS_463=Object.freeze({
 d1:'https://developers.cloudflare.com/d1/observability/metrics-analytics/',
 d1Billing:'https://developers.cloudflare.com/d1/observability/billing/',
 workers:'https://developers.cloudflare.com/workers/observability/metrics-and-analytics/',
 r2:'https://developers.cloudflare.com/r2/platform/metrics-analytics/',
 actions:'https://docs.github.com/en/actions/how-tos/monitor-workflows/view-job-execution-time'
});
export const BUDGET_METRICS_463=Object.freeze([
 {key:'d1_reads',group:'d1',label:'D1 rows read in selected period',unit:'rows'},
 {key:'d1_writes',group:'d1',label:'D1 rows written in selected period',unit:'rows'},
 {key:'d1_storage',group:'d1',label:'D1 total storage measured',unit:'bytes'},
 {key:'worker_requests',group:'workers',label:'Worker requests in selected period',unit:'requests'},
 {key:'worker_cpu_p95',group:'workers',label:'Worker CPU time p95',unit:'ms'},
 {key:'worker_errors',group:'workers',label:'Worker failed requests',unit:'requests'},
 {key:'worker_subrequests',group:'workers',label:'Worker subrequests',unit:'requests'},
 {key:'r2_storage',group:'r2',label:'R2 stored bytes measured',unit:'bytes'},
 {key:'r2_class_a',group:'r2',label:'R2 Class A operations in selected period',unit:'operations'},
 {key:'r2_class_b',group:'r2',label:'R2 Class B operations in selected period',unit:'operations'},
 {key:'actions_job_minutes',group:'actions',label:'GitHub Actions charged job minutes (account billing)',unit:'minutes'},
 {key:'actions_queue_p95',group:'actions',label:'GitHub workflow first-job wait p95',unit:'seconds'}
]);
export const ACTIONS_SAMPLE_463=Object.freeze({
 source:'GitHub REST actions/runs and jobs for exactly Build 462; actual timestamps, not billable invoice',
 observed_window_utc:'2026-10-25 03:03:24–03:11:17 UTC',
 production_commit:'c8e8f7c6195c90fcae10e617959e0aae2da980f4',
 dev_pr:'https://github.com/RosevearCreations/devilndove-site/pull/517',
 main_pr:'https://github.com/RosevearCreations/devilndove-site/pull/518',
 production_proof:'https://github.com/RosevearCreations/devilndove-site/actions/runs/40157267277',
 runs:78,jobs:82,job_execution_minutes:17.8,rounded_job_minute_reference:83,first_job_wait_p95_seconds:66,
 lanes:Object.freeze([
  {name:'Development PR',runs:28,jobs:30,execution_min:6.3,rounded_reference:29,p95_wait_sec:68},
  {name:'Development post-merge',runs:16,jobs:18,execution_min:5.9,rounded_reference:20,p95_wait_sec:3},
  {name:'Production PR',runs:22,jobs:22,execution_min:3.2,rounded_reference:22,p95_wait_sec:25},
  {name:'Production post-merge',runs:11,jobs:11,execution_min:2.2,rounded_reference:11,p95_wait_sec:51},
  {name:'Independent live proof',runs:1,jobs:1,execution_min:0.2,rounded_reference:1,p95_wait_sec:2}
 ])
});

function positiveNumber(raw){const s=String(raw??'').trim();if(!/^\d+(?:\.\d+)?$/.test(s))return null;const n=Number(s);return Number.isFinite(n)&&n>=0?n:null;}
function validProviderLink(group,value){
 const raw=String(value||'').trim();if(raw.length>500)return null;
 try{const u=new URL(raw);const hosts=group==='actions'?['github.com','api.github.com']:['dash.cloudflare.com'];
  return u.protocol==='https:'&&hosts.includes(u.hostname)?raw:null;}catch{return null;}
}
export function calculateBudget463({values={},limits={},sources={},windowStart='',windowEnd=''}={}){
 const states=[],holds=[];
 const utcPattern=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
 const start=Date.parse(windowStart),end=Date.parse(windowEnd);
 if(!utcPattern.test(windowStart)||!utcPattern.test(windowEnd)||!Number.isFinite(start)||!Number.isFinite(end)||start>=end)
  holds.push('Enter real UTC reporting start and end timestamps ending in Z, in chronological order.');
 const compared=[];
 for(const m of BUDGET_METRICS_463){const usage=positiveNumber(values[m.key]),cap=positiveNumber(limits[m.key]);
  const source=validProviderLink(m.group,sources[m.group]);const sourceConfirmed=Boolean(source);
  const ratio=usage===null||cap===null||cap<=0?null:usage/cap;
  const status=usage===null||!sourceConfirmed||cap===null||cap<=0?'HOLD_MISSING_PROVENANCE_OR_LIMIT':ratio>=1?'OVER_RECORDED_LIMIT':ratio>=0.75?'NEAR_RECORDED_LIMIT':'BELOW_RECORDED_LIMIT';
  if(status==='HOLD_MISSING_PROVENANCE_OR_LIMIT')holds.push(`${m.label}: enter provider-measured value, a valid source link and the actual same-window plan/usage limit.`);
  if(status==='OVER_RECORDED_LIMIT'||status==='NEAR_RECORDED_LIMIT')compared.push({key:m.key,status});
  states.push(Object.freeze({key:m.key,group:m.group,unit:m.unit,usage,limit:cap,ratio,status,source}));
 }
 holds.push('External provider figures are operator-entered and cannot be independently attested by this app; inspect original Cloudflare/GitHub billing before approving any action.');
 return Object.freeze({state:states.some(x=>x.status==='HOLD_MISSING_PROVENANCE_OR_LIMIT')||holds.length>1?'HOLD_PROVIDER_METRICS_INCOMPLETE':'REVIEW_PROVIDER_EVIDENCE_MANUALLY',
  metrics:states,holds,nearOrOver:compared,
  providerVerified:false,automaticCostChange:false,automaticRetry:false,automaticQuotaIncrease:false,
  r2DeletionAllowed:false,d1WriteAllowed:false,githubGateWeakeningAllowed:false});
}
