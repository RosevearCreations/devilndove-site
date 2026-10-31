/* Build 555: read-only acceptance evidence, tied to an exact receipt and fresh saved-source readback. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
if(!$('dd555Evidence'))return;
let sourceReady=false,ownerReviews=[],verifiedReceipt=null,readbackAt=null,saveAwaitingReload=false;
const levels=['critical','error','warning','info'];
const say=(id,message,state='waiting')=>{const el=$(id);if(!el)return;el.textContent=message;el.dataset.state=state;};
const date=raw=>{const parsed=Date.parse(raw||'');return Number.isFinite(parsed)?new Date(parsed).toLocaleString():'unavailable';};
function receiptKey(receipt){
  if(!receipt||typeof receipt!=='object')return null;
  if(receipt.kind==='history'){
    const at=Date.parse(receipt.at||'');
    if(typeof receipt.path!=='string'||!Number.isFinite(at)||typeof receipt.status!=='string'||!Number.isInteger(receipt.ms))return null;
    return JSON.stringify(['history',receipt.path,new Date(at).toISOString(),receipt.status,receipt.ms]);
  }
  if(receipt.kind==='view'&&typeof receipt.key==='string'&&typeof receipt.label==='string'&&typeof receipt.updated_at==='string')
    return JSON.stringify(['view',receipt.key,receipt.label,receipt.updated_at]);
  return null;
}
function acceptance(){
  if(!sourceReady){say('dd555AcceptanceStatus','Shared evidence is unavailable. Reload before treating any earlier acknowledgment as current.','warning');return;}
  if(saveAwaitingReload){say('dd555AcceptanceStatus','Owner save was acknowledged by the write endpoint. Waiting for a fresh shared-record readback before showing it as retained evidence.','review');return;}
  if(!verifiedReceipt){
    const latest=ownerReviews[0];
    say('dd555AcceptanceStatus',latest?`${ownerReviews.length} saved owner-reported acknowledgment(s) read back. Latest: ${date(latest.reviewed_at)}. Choose and verify the exact receipt to match it.`:'No saved owner-reported comparison was returned. Choose a receipt and verify it before making any owner acknowledgment.','review');return;
  }
  const key=receiptKey(verifiedReceipt);
  const matched=ownerReviews.find(review=>receiptKey(review?.receipt)===key);
  say('dd555AcceptanceStatus',matched?`MATCH — this exact verified receipt has a retained owner-reported acknowledgment from ${date(matched.reviewed_at)}. Database record read back ${date(readbackAt)}. This is NOT independent second-device proof.`:'EXACT RECEIPT VERIFIED — no retained owner acknowledgment matches this receipt. Compare it on the second signed-in device and save the owner-reported acknowledgment below.','ready');
}
function incidents(detail){
  const aging=detail.followUp,summary=detail.incidentSummary,timeline=detail.timeline;
  if(!aging||aging.window_days!==30||!Array.isArray(summary)||!Array.isArray(timeline)){
    say('dd555IncidentStatus','Incident source unavailable or incomplete. Do not infer that there are zero incidents.','warning');
    say('dd555IncidentContext','Reload shared monitoring. Incident details are bounded to the latest 25; aging and priority totals cover the past 30 days.','warning');return;
  }
  const count=value=>Number.isSafeInteger(Number(value))&&Number(value)>=0?Number(value):0;
  const total=count(aging.total),open=count(aging.open),closed=Math.max(0,total-open);
  say('dd555IncidentStatus',`30-day records: ${total} total; ${open} open / reviewing; ${closed} resolved / ignored. Open for 24+ hours: ${count(aging.open_24h)}; open for 7+ days: ${count(aging.open_7d)}; open with no review date: ${count(aging.open_without_review)}.`,'ready');
  const priorities=levels.map(level=>`${level}: ${summary.filter(row=>String(row.severity).toLowerCase()===level).reduce((sum,row)=>sum+count(row.count),0)}`).join(' · ');
  say('dd555IncidentContext',`Priority totals for the past 30 days: ${priorities}. Detailed timeline: latest ${Math.min(timeline.length,25)} records only, not all ${total}. Aging groups overlap. Review actions remain manual; this page does not resolve or escalate incidents.`,'ready');
}
document.addEventListener('dd:system-health-reconciled-549',event=>{
  const data=event.detail||{};const validStamp=typeof data.readbackAt==='string'&&Number.isFinite(Date.parse(data.readbackAt));
  sourceReady=data.scope==='signed_in_admin'&&validStamp;readbackAt=sourceReady?data.readbackAt:null;
  ownerReviews=sourceReady&&Array.isArray(data.ownerReviews)?data.ownerReviews:[];
  verifiedReceipt=null;saveAwaitingReload=false;
  say('dd555SourceStatus',sourceReady?`CURRENT — signed-in administrator database response at ${date(readbackAt)}. ${Array.isArray(data.history)?data.history.length:0} retained route checks, ${Array.isArray(data.presets)?data.presets.length:0} views, ${ownerReviews.length} owner acknowledgments.`:'Readback lacked a valid administrator scope or server timestamp. Nothing is accepted from this response.',sourceReady?'ready':'warning');
  if(sourceReady)incidents(data);else incidents({});acceptance();
});
document.addEventListener('dd:system-health-unavailable-550',()=>{
  sourceReady=false;readbackAt=null;ownerReviews=[];verifiedReceipt=null;saveAwaitingReload=false;
  say('dd555SourceStatus','UNAVAILABLE — no fresh signed-in database readback. Sign in or reload. Previous evidence is not current.','warning');
  incidents({});acceptance();
});
document.addEventListener('dd:health-receipt-verified-551',event=>{
  verifiedReceipt=sourceReady&&event.detail?.comparison?.found===true&&receiptKey(event.detail?.receipt)?event.detail.receipt:null;
  acceptance();
});
function reset(){verifiedReceipt=null;acceptance();}
document.addEventListener('dd:health-receipt-changed-551',reset);
document.addEventListener('dd:health-receipt-549',reset);
$('dd549ReceiptCode')?.addEventListener('input',reset);
document.addEventListener('dd:owner-review-recorded-554',event=>{
  if(event.detail?.readbackConfirmed!==true)return;
  verifiedReceipt=null;saveAwaitingReload=true;acceptance();
});
document.addEventListener('dd:owner-review-save-unconfirmed-554',()=>{
  verifiedReceipt=null;saveAwaitingReload=false;
  say('dd555AcceptanceStatus','Owner acknowledgment save is not confirmed. Reload the saved records before deciding whether to try again.','warning');
});
})();
