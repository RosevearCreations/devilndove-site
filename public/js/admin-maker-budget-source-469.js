/* Build 469: optional operator-only Cloudflare receipt review. Zero background requests. */
import {FREE_PLAN_REFERENCE_469,reviewSourceReceipts469} from './maker-budget-source-policy-469.mjs';

const el=id=>document.getElementById(id);
const output=el('rb469Results'),exportButton=el('rb469Export');
let lastReview=null;
const formatNumber=n=>new Intl.NumberFormat('en-CA').format(n);
function collect(){
 const evidence={},planConfirmations={},values={};
 for(const group of ['d1','workers','r2']){
  evidence[group]={url:el({d1:'rbD1Source',workers:'rbWorkersSource',r2:'rbR2Source'}[group]).value,
   reference:el(`rb469${group}Reference`).value,windowStart:el(`rb469${group}Start`).value,windowEnd:el(`rb469${group}End`).value};
  planConfirmations[group]=el(`rb469${group}Free`).checked;
 }
 for(const metric of FREE_PLAN_REFERENCE_469)values[metric.key]=el(`rbUse_${metric.key}`).value;
 return {day:el('rb469Day').value,month:el('rb469Month').value,evidence,planConfirmations,values};
}
function element(tag,content){const node=document.createElement(tag);if(content!==undefined)node.textContent=content;return node;}
function render(review){
 output.replaceChildren();
 output.append(element('p',`Status: ${review.state}. ${review.metrics.filter(m=>m.ratio!==null).length}/5 Free-plan references have same-window receipts and counts. Provider verification remains HOLD.`));
 const table=element('table'),head=element('thead'),headRow=element('tr');
 for(const caption of ['Cloudflare meter','Source count','Free-plan reference','Usage of reference','Evidence status'])headRow.append(element('th',caption));
 head.append(headRow);table.append(head);
 const body=element('tbody');
 for(const m of review.metrics){const row=element('tr');for(const entry of [m.label,m.observed===null?'Unknown':formatNumber(m.observed),
  `${formatNumber(m.referenceAllowance)} ${m.unit} (${m.referenceKind==='monthly_free_inclusion'?'included operations, not a hard block':'daily Free-plan limit'})`,
  m.ratio===null?'HOLD':`${(100*m.ratio).toFixed(1)}%`,m.status])row.append(element('td',entry));body.append(row);}
 table.append(body);const scroll=element('div');scroll.className='rb-sample';scroll.append(table);output.append(scroll);
 const title=element('h3',`${review.hotspots.length} evidence-linked near/over-reference candidates — not yet route-attributed`);output.append(title);
 if(!review.hotspots.length)output.append(element('p','No review candidates from the entered, source-linked readings. This does not prove there are no hotspots.'));
 for(const hotspot of review.hotspots){const block=element('p',`${hotspot.priority} · ${hotspot.key}: ${hotspot.reviewTarget} ${hotspot.nextAction}`);block.className='rb-hold';output.append(block);}
 const details=element('details'),summary=element('summary',`ⓘ ${review.holds.length} unresolved source and owner-review conditions`),list=element('ul');
 for(const hold of review.holds){list.append(element('li',hold));}details.append(summary,list);details.className='rb-help';output.append(details);
}
function invalidate(){lastReview=null;exportButton.disabled=true;output.textContent='Changed readings or source references. Press Review matching UTC windows to recalculate; no data is sent.';}
el('rb469Review').addEventListener('click',()=>{lastReview=reviewSourceReceipts469(collect());render(lastReview);exportButton.disabled=false;});
for(const group of ['d1','workers','r2']){
 for(const suffix of ['Reference','Start','End','Free'])el(`rb469${group}${suffix}`).addEventListener('change',invalidate);
}
for(const id of ['rb469Day','rb469Month','rbD1Source','rbWorkersSource','rbR2Source',...FREE_PLAN_REFERENCE_469.map(m=>`rbUse_${m.key}`)]){
 el(id).addEventListener('input',invalidate);
}
el('rb469Export').addEventListener('click',()=>{
 if(!lastReview)return;
 const receipt={...lastReview,preparedAtUtc:new Date().toISOString(),authority:'Operator-provided source pointers and counts only; independent Cloudflare billing validation HOLD',
  receiptStoredInCloudflare:false,approvedHotspotFixes:0};
 const url=URL.createObjectURL(new Blob([JSON.stringify(receipt,null,2)],{type:'application/json'}));
 const link=element('a');link.href=url;link.download='devilndove-build469-cloudflare-evidence-HOLD.json';link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
});
