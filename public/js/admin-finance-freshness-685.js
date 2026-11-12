// Build 685: owner-only Master freshness, external recheck and reviewed incident decisions.
// Local expiry countdown is client-only; no background network polling, auto closure or private keys.
(()=>{'use strict';
const $=id=>document.getElementById(id);
let state=null;
const endpoint='/api/admin/social-post-queue';
async function api(payload,id){
if(!window.DDAuth?.apiFetch)throw Error('Authenticated Admin required.');
const res=await window.DDAuth.apiFetch(endpoint+(payload?'':'?campaign_queue_id='+encodeURIComponent(id)),
payload?{method:'POST',body:JSON.stringify(payload)}:undefined);
const d=await res.json();
if(!res.ok||!d.ok||d.degraded)throw Error(d.error||d.backend_warning||'Protected financial proof unavailable.');
return d;
}
function clock(){
if(!state?.queue_id)return;
const until=Date.parse(state.expires_at||''),seconds=Math.floor((until-Date.now())/1000);
$('dd685Clock').textContent=Number.isFinite(until)?(seconds>0?
'Last independent signed receipt expires in '+Math.ceil(seconds/60)+' minute(s) · '+state.expires_at:
'EXPIRED · Previous signed receipt is not evidence of current Master acceptance. Refresh or revalidate.'):
'No current verified Master receipt expiry. HOLD.';
if(state.master_fresh&&(!Number.isFinite(until)||seconds<=0)){
state.master_fresh=false;state.status='HOLD_EXPIRED_MASTER_RECEIPT';
$('dd685Status').textContent='HOLD_EXPIRED_MASTER_RECEIPT · Owner revalidation required. Connection remains HOLD.';
}
}
async function refresh(){
const id=Number($('dd685Campaign').value);
if(!id){state=null;$('dd685Status').textContent='HOLD · Select a campaign.';return;}
try{
const d=await api(null,id),v=d.financial685;
if(!v||v.queue_id!==id)throw Error('Fresh exact financial evidence was not returned.');
state=v;
$('dd685Status').textContent=(v.master_fresh?'VERIFIED_CURRENT':'HOLD')+
' · '+v.status+' · Master receipt #'+(v.last_master_receipt_id||'—')+
' · Signer '+(v.signer_enrolled?'VERIFIED':'HOLD')+
' · Receiver '+(v.receiver_configured?'configured':'HOLD')+
' · Connection '+v.connection+' · Audited profit HOLD';
const select=$('dd685Case');select.replaceChildren(new Option('Select active exception to close',''));
for(const c of v.open_cases||[])select.add(new Option(c.issue_code+' · '+c.case_id,c.case_id));
$('dd685History').textContent=(v.exceptions||[]).length?
'Latest owner exception evidence: '+v.exceptions.slice(0,8).map(c=>c.issue_code+' · '+c.status+' #'+c.receipt_id).join(' | '):
'No owner financial exceptions have been recorded for this campaign.';
clock();
}catch(e){state=null;$('dd685Status').textContent='HOLD · '+e.message;$('dd685Clock').textContent='Current signed evidence unavailable.';}
}
async function send(action,fields){
if(!state?.queue_id)throw Error('Select and refresh the exact current campaign first.');
const d=await api({action,social_post_queue_id:state.queue_id,
expected_fingerprint_sha256:state.fingerprint_sha256,owner_reviewed:true,...fields},state.queue_id);
$('dd685Result').textContent=(d.result?.status||'Recorded')+' · Durable receipt #'+(d.result?.receipt_id||'—')+
' · Independent continuous runtime telemetry and audited profitability remain HOLD.';
await refresh();
}
document.addEventListener('DOMContentLoaded',()=>{
if(!$('dd685-finance'))return;
(async()=>{try{
const d=await api(null);const seen=new Set();
for(const q of d.queue||[])if(q.utm_campaign&&!seen.has(q.social_post_queue_id)){
seen.add(q.social_post_queue_id);
$('dd685Campaign').add(new Option(q.utm_campaign+' · #'+q.social_post_queue_id,q.social_post_queue_id));
}
}catch(e){$('dd685Status').textContent='HOLD · '+e.message;}})();
$('dd685Campaign').addEventListener('change',()=>void refresh());
$('dd685Refresh').addEventListener('click',()=>void refresh());
$('dd685Revalidate').addEventListener('click',async()=>{
try{
if(!$('dd685RecheckReviewed').checked)throw Error('Owner must confirm the independent Master recheck.');
await send('revalidate_finance_master_685',{});
$('dd685RecheckReviewed').checked=false;
}catch(e){$('dd685Result').textContent='HOLD · '+e.message;}
});
$('dd685Recovery').addEventListener('submit',async e=>{
e.preventDefault();
try{
if(!$('dd685Reviewed').checked)throw Error('Owner evidence review is required.');
const decision=$('dd685Decision').value;
if(decision==='open'&&state.master_fresh)throw Error('No current independently observed issue to open.');
await send('owner_finance_recovery_685',{decision,issue_code:state.status,
case_id:$('dd685Case').value,resolution_note:$('dd685Note').value.trim(),
expected_master_acceptance_receipt_id:state.verified_master_receipt_id});
$('dd685Reviewed').checked=false;
}catch(err){$('dd685Result').textContent='HOLD · '+err.message;}
});
setInterval(clock,15000); // Local UI expiry only; makes no network requests.
});
})();
