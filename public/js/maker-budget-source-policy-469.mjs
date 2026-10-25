/* Build 469: conservative, client-only Cloudflare source receipt and hotspot review.
 * This module reads no provider APIs, D1 databases, Workers telemetry or R2 buckets. */

export const FREE_PLAN_REFERENCE_469=Object.freeze([
 {key:'d1_reads',group:'d1',label:'D1 rows read',unit:'rows/day',allowance:5_000_000,window:'day',kind:'daily_limit',reviewTarget:'Bound Product Editor list reads and repeated detail refreshes.'},
 {key:'d1_writes',group:'d1',label:'D1 rows written',unit:'rows/day',allowance:100_000,window:'day',kind:'daily_limit',reviewTarget:'Inspect autosave coalescing and failing write retries.'},
 {key:'worker_requests',group:'workers',label:'Workers requests',unit:'requests/day',allowance:100_000,window:'day',kind:'daily_limit',reviewTarget:'Review affected routes, 503/1102 events and per-request CPU with original provider traces.'},
 {key:'r2_class_a',group:'r2',label:'R2 Class A operations',unit:'operations/month',allowance:1_000_000,window:'month',kind:'monthly_free_inclusion',reviewTarget:'Review photo uploads, list/sync attempts and source-linked operation counts.'},
 {key:'r2_class_b',group:'r2',label:'R2 Class B operations',unit:'operations/month',allowance:10_000_000,window:'month',kind:'monthly_free_inclusion',reviewTarget:'Review gallery/media read patterns, cache behavior and source-linked operations.'}
]);

export const PROVENANCE_DOCS_469=Object.freeze({
 d1:'https://developers.cloudflare.com/d1/platform/pricing/',
 d1Metrics:'https://developers.cloudflare.com/d1/observability/metrics-analytics/',
 workers:'https://developers.cloudflare.com/workers/platform/limits/',
 r2:'https://developers.cloudflare.com/r2/pricing/'
});

function validDay(day){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;
 const start=new Date(`${day}T00:00:00.000Z`);
 return Number.isFinite(start.getTime())&&start.toISOString().slice(0,10)===day?start:null;
}
function validMonth(month){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return null;
 const start=new Date(`${month}-01T00:00:00.000Z`);
 return Number.isFinite(start.getTime())&&start.toISOString().slice(0,7)===month?start:null;
}
function validUtcInstant(input){
 const s=String(input||'').trim();
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s))return null;
 const time=Date.parse(s);
 return Number.isFinite(time)&&new Date(time).toISOString()===s.replace('Z','.000Z')?time:null;
}
function sourceUrl(raw){
 const s=String(raw||'').trim();
 if(s.length>500||!s)return null;
 try{
  const u=new URL(s);
  if(u.protocol!=='https:'||u.hostname!=='dash.cloudflare.com'||u.username||u.password||u.port)return null;
  // Do not write dashboard query strings or hash fragments into export receipts.
  return `${u.origin}${u.pathname}`;
 }catch{return null;}
}
function receiptLabel(raw){
 const s=String(raw||'').trim();
 return s.length>0&&s.length<=160&&!/[\x00-\x1f\x7f<>]/.test(s)?s:null;
}
function reading(raw){
 const s=String(raw??'').trim();
 if(!/^(0|[1-9]\d*)$/.test(s))return null;
 const n=Number(s);
 return Number.isSafeInteger(n)&&n>=0?n:null;
}
function expectedRange(day,month,group){
 const start=group==='r2'?validMonth(month):validDay(day);
 if(!start)return null;
 const end=new Date(start.getTime());
 if(group==='r2')end.setUTCMonth(end.getUTCMonth()+1);
 else end.setUTCDate(end.getUTCDate()+1);
 return {start:start.getTime(),end:end.getTime(),from:start.toISOString(),to:end.toISOString()};
}
export function reviewSourceReceipts469({day='',month='',planConfirmations={},evidence={},values={}}={}){
 const holds=[],groups={},metrics=[],hotspots=[];
 for(const group of ['d1','workers','r2']){
  const period=expectedRange(day,month,group),record=evidence[group]||{};
  const url=sourceUrl(record.url),reference=receiptLabel(record.reference);
  const from=validUtcInstant(record.windowStart),to=validUtcInstant(record.windowEnd);
  const planConfirmed=planConfirmations[group]===true;
  const matchingWindow=!!(period&&from===period.start&&to!==null&&to>from&&to<=period.end);
  const complete=!!(planConfirmed&&url&&reference&&matchingWindow);
  const why=[];
  if(!period)why.push('Choose a valid UTC calendar day/month.');
  if(!planConfirmed)why.push('Owner must confirm this is the actual Cloudflare Free plan for this resource.');
  if(!url)why.push('Use a Cloudflare dashboard HTTPS source link (without credentials).');
  if(!reference)why.push('Record a provider receipt or screenshot reference (not a secret).');
  if(!matchingWindow)why.push('Provider source window must begin at UTC day/month boundary and end within that window.');
  if(why.length)holds.push(`${group.toUpperCase()}: ${why.join(' ')}`);
  groups[group]={status:complete?'SOURCE_LINKED_OWNER_REVIEW':'HOLD_SOURCE_OR_WINDOW',planConfirmed,source:url,receiptReference:reference,
   actualWindowStart:from===null?null:new Date(from).toISOString(),actualWindowEnd:to===null?null:new Date(to).toISOString(),
   expectedWindowStart:period?.from||null,expectedWindowEnd:period?.to||null,partialPeriod:Boolean(matchingWindow&&to<period.end),holds:why};
 }
 for(const item of FREE_PLAN_REFERENCE_469){
  const observed=reading(values[item.key]),linked=groups[item.group].status==='SOURCE_LINKED_OWNER_REVIEW';
  const ratio=linked&&observed!==null?observed/item.allowance:null;
  const status=ratio===null?'HOLD_MISSING_SOURCE_OR_COUNT':ratio>=1?'REVIEW_ABOVE_REFERENCE':ratio>=.75?'REVIEW_NEAR_REFERENCE':'BELOW_REFERENCE_SO_FAR';
  if(observed===null)holds.push(`${item.label}: missing non-negative integer provider count.`);
  const metric={key:item.key,group:item.group,label:item.label,observed,unit:item.unit,referenceAllowance:item.allowance,
   referenceKind:item.kind,ratio,status,source:groups[item.group].source,receiptReference:groups[item.group].receiptReference,
   providerVerified:false};
  metrics.push(metric);
  if(status==='REVIEW_ABOVE_REFERENCE'||status==='REVIEW_NEAR_REFERENCE')hotspots.push({
   key:item.key,priority:status==='REVIEW_ABOVE_REFERENCE'?'OVER_REFERENCE':'NEAR_REFERENCE',
   observed,allowance:item.allowance,ratio,reviewTarget:item.reviewTarget,
   nextAction:'HOLD: owner to confirm the original provider reading and obtain same-window route/query attribution before proposing a targeted fix.',
   automaticFixAuthorized:false
  });
 }
 holds.push('Dashboard links and operator-entered receipts are not an independent provider verification or billing invoice. No automatic changes are authorized.');
 holds.push('Worker CPU p95 and R2 storage bytes are diagnostic measures, not directly comparable to per-invocation CPU limits or monthly GB-month. Review them in their original provider window.');
 return {document_type:'DEVIL_N_DOVE_BUILD469_SOURCE_CAPTURE_HOLD',state:holds.length>2?'HOLD_SOURCE_EVIDENCE_INCOMPLETE':'HOLD_OWNER_PROVIDER_VERIFICATION',
  referencePlan:'Cloudflare Free — only where independently confirmed by the owner',day,month,groups,metrics,hotspots,holds,
  providerVerified:false,routeAttributionVerified:false,automaticQuotaIncrease:false,automaticR2Delete:false,
  automaticD1Write:false,automaticCodeChange:false,paidMonitoringEnabled:false};
}
