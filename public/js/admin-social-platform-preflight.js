
// Build 684: browser prepares public claims only; all verification stays server-side.
(()=>{'use strict';const $=id=>document.getElementById(id);let state=null;
async function call(payload,id){
if(!window.DDAuth?.apiFetch)throw Error('Authenticated Admin required.');
const response=await DDAuth.apiFetch('/api/admin/social-post-queue'+(!payload&&id?'?campaign_queue_id='+id:''),
payload?{method:'POST',body:JSON.stringify(payload)}:undefined);
const value=await response.json();if(!response.ok||!value.ok)throw Error(value.error||'Runtime proof unavailable.');return value;
}
async function refresh(){
const id=Number($('dd684Campaign').value);if(!id){state=null;$('dd684Status').textContent='HOLD · Select a campaign.';return}
try{const d=await call(null,id),v=d.financial684||{};state=v;
$('dd684Status').textContent='Signer: '+(v.signer_enrolled?'VERIFIED':'HOLD')+
' · Master acceptance: '+(v.master_accepted?'VERIFIED':'HOLD')+
' · Receiver: '+(v.receiver_configured?'Configured':'HOLD')+
' · Continuity: '+(v.closed_cases||[]).filter(x=>x.current).length+' current closures'+
' · Transport: '+(v.connection||'HOLD')+' · Profit certification: HOLD';
const list=$('dd684Case');list.replaceChildren(new Option('Choose a reviewed case',''));
const seen=new Set();
for(const x of d.financial682?.reviews||[])if(x.current_evidence&&
['MASTER_RECEIPT_NOT_CURRENT','MASTER_INDEPENDENT_ADMISSION_UNVERIFIED'].includes(x.case_code)&&!seen.has(x.case_code)){
list.add(new Option(x.case_code,x.case_code));seen.add(x.case_code);}
}catch(e){state=null;$('dd684Status').textContent='HOLD · '+e.message;}
}
document.addEventListener('DOMContentLoaded',()=>{
if(!$('dd684-finance'))return;
(async()=>{try{const data=await call(),seen=new Set();
for(const q of data.queue||[])if(q.utm_campaign&&!seen.has(q.utm_campaign)){
seen.add(q.utm_campaign);$('dd684Campaign').add(new Option(q.utm_campaign+' · #'+q.social_post_queue_id,q.social_post_queue_id));
}}catch(e){$('dd684Status').textContent='HOLD · '+e.message}})();
$('dd684Campaign').addEventListener('change',()=>void refresh());
$('dd684Refresh').addEventListener('click',()=>void refresh());
$('dd684Prepare').addEventListener('click',()=>{
try{if(!state?.source_signer_receipt_id||!state.signer_id||!state.source_revision)
throw Error('Current independently signed source receipt not available.');
if(!$('dd684Nonce').value)$('dd684Nonce').value=crypto.randomUUID();
if(!$('dd684Time').value)$('dd684Time').value=new Date().toISOString();
const c={v:1,purpose:'devilndove_finance_signer_runtime_684',source:'devilndove',
queue_id:state.queue_id,campaign:state.campaign,source_revision:state.source_revision,
fingerprint_sha256:state.fingerprint_sha256,source_signer_receipt_id:state.source_signer_receipt_id,
signer_id:state.signer_id,nonce:$('dd684Nonce').value.trim(),issued_at:$('dd684Time').value.trim()};
$('dd684Claim').textContent=JSON.stringify(c);
$('dd684Result').textContent='Sign this exact UTF-8 JSON with the independently controlled Ed25519 key. Do not enter private keys.';
}catch(e){$('dd684Result').textContent='HOLD · '+e.message}});
async function send(action,fields){
if(!state?.fingerprint_sha256)throw Error('Refresh current campaign fingerprint.');
const d=await call({action,social_post_queue_id:Number($('dd684Campaign').value),
expected_fingerprint_sha256:state.fingerprint_sha256,owner_reviewed:true,...fields});
$('dd684Result').textContent=(d.result?.status||'Recorded')+' · Receipt #'+(d.result?.receipt_id||'—')+
' · Continuous runtime connection and independent audited profitability remain separate.';
await refresh();
}
$('dd684Enrollment').addEventListener('submit',async e=>{e.preventDefault();try{
if(!$('dd684EnrollReviewed').checked)throw Error('Explicit owner review required.');
await send('enroll_finance_signer_684',{nonce:$('dd684Nonce').value.trim(),
issued_at:$('dd684Time').value.trim(),signature:$('dd684Signature').value.trim()});
$('dd684Signature').value='';$('dd684EnrollReviewed').checked=false;
}catch(x){$('dd684Result').textContent='HOLD · '+x.message}});
$('dd684Master').addEventListener('submit',async e=>{e.preventDefault();try{
if(!$('dd684MasterReviewed').checked)throw Error('Owner review required.');
await send('verify_finance_master_684',{});$('dd684MasterReviewed').checked=false;
}catch(x){$('dd684Result').textContent='HOLD · '+x.message}});
$('dd684Continuity').addEventListener('submit',async e=>{e.preventDefault();try{
if(!$('dd684CloseReviewed').checked)throw Error('Owner closure review required.');
await send('close_finance_continuity_684',{case_code:$('dd684Case').value,
resolution_note:$('dd684Note').value.trim()});$('dd684CloseReviewed').checked=false;
}catch(x){$('dd684Result').textContent='HOLD · '+x.message}});
});
})();


// Build 683: private signer/Master intake UI.
(()=>{'use strict';const $=id=>document.getElementById(id);let latest=null;
async function api(payload,id){
if(!window.DDAuth?.apiFetch)throw Error('Authenticated Admin session required.');
const q=!payload&&id?'?campaign_queue_id='+encodeURIComponent(id):'';
const res=await DDAuth.apiFetch('/api/admin/social-post-queue'+q,payload?{method:'POST',body:JSON.stringify(payload)}:undefined);
const data=await res.json();if(!res.ok||!data.ok)throw Error(data.error||'Financial evidence unavailable');return data;
}
async function refresh(){
const id=Number($('dd683Campaign').value);if(!id){latest=null;$('dd683Status').textContent='HOLD · Select campaign.';return}
try{
const d=await api(null,id),v=d.financial683||{},b=d.financial682||{};latest=v;
$('dd683Status').textContent='Signer: '+(v.signer?.status||'HOLD')+' #'+(v.signer?.receipt_id||'—')+
' · Master: '+(v.master?.status||'HOLD')+' #'+(v.master?.receipt_id||'—')+
' · Discrepancies: '+(b.cases||[]).map(x=>x.code).join(', ')+
' · Connection: '+(v.master_connection||'HOLD')+' · Accounting certification: HOLD';
const select=$('dd683Case');select.replaceChildren(new Option('Choose previously reviewed case',''));
const seen=new Set();for(const item of b.reviews||[])if(!seen.has(item.case_code)){
seen.add(item.case_code);select.add(new Option(item.case_code,item.case_code));}
}catch(e){latest=null;$('dd683Status').textContent='HOLD · '+e.message;}
}
const claim=(kind)=>{
if(!latest?.source_revision||!latest.fingerprint_sha256||!latest.campaign)throw Error('Select an exact current source with configured revision.');
const n=kind==='source'?'Source':'Master',nonce=$('dd683'+n+'Nonce'),time=$('dd683'+n+'Time');
if(!nonce.value)nonce.value=crypto.randomUUID();
if(!time.value)time.value=new Date().toISOString();
if(kind==='source'){
if(!latest.signer?.signer_id)throw Error('Independent financial signer has not been enrolled in server environment.');
return{version:1,source:'devilndove',campaign:latest.campaign,queue_id:latest.queue_id,
source_revision:latest.source_revision,fingerprint_sha256:latest.fingerprint_sha256,
signer_id:latest.signer.signer_id,nonce:nonce.value.trim(),issued_at:time.value.trim()};
}
if(!latest.signer?.receipt_id||!latest.signer?.nonce)throw Error('Independently signed source receipt is required before Master claim.');
return{version:1,source:'devilndove',campaign:latest.campaign,queue_id:latest.queue_id,
source_revision:latest.source_revision,fingerprint_sha256:latest.fingerprint_sha256,
source_signer_receipt_id:latest.signer.receipt_id,source_signer_nonce:latest.signer.nonce,
master_revision:$('dd683MasterRevision').value.trim(),nonce:nonce.value.trim(),issued_at:time.value.trim()};
};
async function submit(action,extras){
const id=Number($('dd683Campaign').value);if(!id)throw Error('Choose campaign.');
const result=await api({action,social_post_queue_id:id,...extras});
$('dd683Result').textContent=(result.result?.status||'Saved')+' · Receipt #'+(result.result?.receipt_id||'—')+
' · Independent runtime connection and audited profitability remain HOLD.';
await refresh();
}
document.addEventListener('DOMContentLoaded',()=>{
if(!$('dd683-finance'))return;
(async()=>{try{const d=await api(),seen=new Set();for(const q of d.queue||[])if(q.utm_campaign&&!seen.has(q.utm_campaign)){
seen.add(q.utm_campaign);$('dd683Campaign').add(new Option(q.utm_campaign+' · #'+q.social_post_queue_id,q.social_post_queue_id));
}}catch(e){$('dd683Status').textContent='HOLD · '+e.message}})();
$('dd683Campaign').addEventListener('change',()=>void refresh());
$('dd683Refresh').addEventListener('click',()=>void refresh());
for(const kind of ['Source','Master'])$('dd683Prepare'+kind).addEventListener('click',()=>{
try{const text=JSON.stringify(claim(kind.toLowerCase()));$('dd683Claim').textContent=text;
$('dd683Result').textContent='Copy this exact UTF-8 JSON to the independently controlled Ed25519 signer. Private signing keys never enter this site.'}
catch(e){$('dd683Result').textContent='HOLD · '+e.message}
});
$('dd683Source').addEventListener('submit',async e=>{e.preventDefault();try{
await submit('admit_financial_signer_683',{nonce:$('dd683SourceNonce').value.trim(),
issued_at:$('dd683SourceTime').value.trim(),signature:$('dd683SourceSignature').value.trim(),
owner_reviewed:$('dd683SourceReviewed').checked});
$('dd683SourceSignature').value='';$('dd683SourceReviewed').checked=false;
}catch(x){$('dd683Result').textContent='HOLD · '+x.message}});
$('dd683Master').addEventListener('submit',async e=>{e.preventDefault();try{
await submit('correlate_financial_master_683',{nonce:$('dd683MasterNonce').value.trim(),
issued_at:$('dd683MasterTime').value.trim(),master_revision:$('dd683MasterRevision').value.trim(),
signature:$('dd683MasterSignature').value.trim(),owner_reviewed:$('dd683MasterReviewed').checked});
$('dd683MasterSignature').value='';$('dd683MasterReviewed').checked=false;
}catch(x){$('dd683Result').textContent='HOLD · '+x.message}});
$('dd683Closure').addEventListener('submit',async e=>{e.preventDefault();try{
await submit('close_financial_discrepancy_683',{case_code:$('dd683Case').value,
resolution_note:$('dd683Note').value.trim(),expected_fingerprint_sha256:latest?.fingerprint_sha256,
owner_reviewed:$('dd683ClosureReviewed').checked});
$('dd683ClosureReviewed').checked=false;
}catch(x){$('dd683Result').textContent='HOLD · '+x.message}});
});
})();

// Build 682 source-owned financial export & owner discrepancy audit.
(()=>{'use strict';const $=id=>document.getElementById(id);let pin='';
async function api(payload,query=''){
if(!window.DDAuth?.apiFetch)throw Error('Authenticated Admin session required');
const res=await window.DDAuth.apiFetch('/api/admin/social-post-queue'+query,
payload?{method:'POST',body:JSON.stringify(payload)}:undefined);
if(!res.ok){let msg='Source evidence unavailable';try{msg=(await res.json()).error||msg}catch{}throw Error(msg)}
return payload?res.json():res;
}
async function refresh(){
const id=Number($('dd682Campaign').value);
if(!id){$('dd682Status').textContent='HOLD · Choose campaign.';return}
try{
const data=await(await api(null,'?campaign_queue_id='+id)).json(),v=data.financial682||{};
pin=v.fingerprint_sha256||'';
const select=$('dd682Case');select.replaceChildren(new Option('Choose active discrepancy',''));
for(const c of v.cases||[])select.add(new Option(c.code+' · '+(c.last_review?.disposition||'UNREVIEWED'),c.code));
$('dd682Status').textContent='Source: '+(v.source_status||'HOLD')+' · '+(v.cases||[]).length+
' discrepancies · '+(v.reviews||[]).length+' owner audit entries · Master: '+(v.master_connection||'HOLD')+
' · Audit completeness: '+(v.complete?'complete':'HOLD');
}catch(e){$('dd682Status').textContent='HOLD · '+e.message}
}
document.addEventListener('DOMContentLoaded',()=>{
if(!$('dd682-finance'))return;
(async()=>{try{const d=await(await api()).json(),seen=new Set();for(const q of d.queue||[]){
if(q.utm_campaign&&!seen.has(q.utm_campaign)){seen.add(q.utm_campaign);
$('dd682Campaign').add(new Option(q.utm_campaign+' · #'+q.social_post_queue_id,q.social_post_queue_id))}
}}catch(e){$('dd682Status').textContent='HOLD · '+e.message}})();
$('dd682Campaign').addEventListener('change',()=>void refresh());
$('dd682Refresh').addEventListener('click',()=>void refresh());
$('dd682Export').addEventListener('click',async()=>{
const id=Number($('dd682Campaign').value);$('dd682Result').textContent='Preparing protected export…';
try{if(!id)throw Error('Choose a campaign');
const res=await api(null,'?export=financial682&campaign_queue_id='+id),blob=await res.blob();
const href=URL.createObjectURL(blob),a=document.createElement('a');
a.href=href;a.download='devilndove-financial-evidence-'+id+'.json';document.body.appendChild(a);a.click();a.remove();
setTimeout(()=>URL.revokeObjectURL(href),30000);
$('dd682Result').textContent='Sanitized source report exported. Master acceptance remains HOLD.';
}catch(e){$('dd682Result').textContent='HOLD · '+e.message}
});
$('dd682Review').addEventListener('submit',async e=>{
e.preventDefault();$('dd682Result').textContent='Recording source-pinned review…';
try{
const d=await api({action:'owner_discrepancy_review_682',social_post_queue_id:Number($('dd682Campaign').value),
case_code:$('dd682Case').value,disposition:$('dd682Disposition').value,
review_note:$('dd682Note').value.trim(),owner_reviewed:$('dd682Reviewed').checked,
expected_fingerprint_sha256:pin});
$('dd682Result').textContent=(d.result?.status||'Recorded')+' · Independent Master admission still HOLD.';
$('dd682Reviewed').checked=false;await refresh();
}catch(e){$('dd682Result').textContent='HOLD · '+e.message}
});
});})();

// Build 680 — owner-supervised profitability exceptions and freshness review.
(()=>{'use strict';const $=id=>document.getElementById(id);
async function call(payload,id){
if(!window.DDAuth?.apiFetch)throw Error('Admin login required');
const url='/api/admin/social-post-queue'+(!payload&&id?'?campaign_queue_id='+encodeURIComponent(id):'');
const r=await window.DDAuth.apiFetch(url,payload?{method:'POST',body:JSON.stringify(payload)}:undefined);
const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Financial evidence unavailable');return d;
}
async function load(){
const id=Number($('dd680Campaign').value);
if(!id){$('dd680Status').textContent='HOLD · Choose a campaign.';return;}
try{const d=await call(null,id),f=d.financial680||{},h=d.financial681||{};
$('dd680Status').textContent='Campaign: '+(f.campaign||'—')+' · Master ACK: '+(f.ack||'HOLD')+
' · Connection: '+(f.connection||'HOLD')+' · Source records: '+(f.evidence_count||0)+
' · Stale: '+(f.stale_count||0)+' · Open exceptions: '+(f.exceptions||[]).map(x=>x.reference).join(', ')+
' · Blockers: '+(f.blockers||[]).join(', ')+' · Independent profit certification: HOLD';
const open=$('dd681Open');open.replaceChildren(new Option('Choose open exception',''));
for(const e of h.exceptions||[])if(!e.resolved_at)open.add(new Option(e.reference+' · '+e.sla,e.queue_id+':'+e.reference));
$('dd681Sla').textContent='Audit: '+(h.status||'HOLD')+' · '+(h.exceptions||[]).map(e=>
e.reference+' '+e.sla+' (opened '+e.opened_at+', acknowledged '+(e.ack_at||'not yet')+')').join('; ');
$('dd681Master').textContent=(h.master_receipts||[]).map(r=>r.state+' at '+r.recorded_at+' · Master '+r.master_revision).join('; ')||'No signed Master receipt recorded. Connection HOLD.';
$('dd681History').textContent=(h.owner_history||[]).map(r=>r.kind+' · '+r.recorded_at).join('; ')||'No recorded owner acceptance.';
}catch(e){$('dd680Status').textContent='HOLD · '+e.message;}
}
document.addEventListener('DOMContentLoaded',()=>{
if(!$('dd680-ops'))return;
(async()=>{try{const d=await call(),names=new Set();
for(const q of d.queue||[])if(q.utm_campaign&&!names.has(q.utm_campaign)){
names.add(q.utm_campaign);$('dd680Campaign').add(new Option(q.utm_campaign+' · #'+q.social_post_queue_id,q.social_post_queue_id));
}}catch(e){$('dd680Status').textContent='HOLD · '+e.message;}})();
$('dd680Campaign').addEventListener('change',()=>void load());
$('dd680Refresh').addEventListener('click',()=>void load());
$('dd681Acknowledge').addEventListener('click',async()=>{
const [qid,ref]=String($('dd681Open').value||'').split(':');
$('dd681Result').textContent='Checking open exception and owner authority…';
try{
const d=await call({action:'owner_exception_ack_681',social_post_queue_id:Number(qid),
exception_reference:ref,owner_reviewed:$('dd681OwnerReview').checked});
$('dd681Result').textContent=(d.result?.status||'Recorded')+' · Financial certification remains HOLD.';
$('dd681OwnerReview').checked=false;await load();
}catch(e){$('dd681Result').textContent='HOLD · '+e.message;}
});

$('dd680Exception').addEventListener('submit',async e=>{
e.preventDefault();$('dd680Result').textContent='Recording owner decision…';
try{const d=await call({action:'owner_profit_exception_680',social_post_queue_id:Number($('dd680Campaign').value),
exception_reference:$('dd680Ref').value.trim(),kind:$('dd680Kind').value,
reason:$('dd680Kind').value==='open'?$('dd680Reason').value.trim():'',
resolution:$('dd680Kind').value==='resolve'?$('dd680Reason').value.trim():'',
owner_reviewed:$('dd680Owner').checked});
$('dd680Result').textContent=(d.result?.status||'Saved')+' · Independent certification still HOLD.';
$('dd680Owner').checked=false;await load();
}catch(e){$('dd680Result').textContent='HOLD · '+e.message;}
});
});})();

// Build 679 — independently signed order costs and source-level net contribution.
(()=>{
'use strict';
const $=id=>document.getElementById(id);
async function request(payload,id){
if(!window.DDAuth?.apiFetch)throw Error('Authenticated owner session required');
const url='/api/admin/social-post-queue'+(!payload&&id?'?campaign_queue_id='+encodeURIComponent(id):'');
const response=await window.DDAuth.apiFetch(url,payload?{method:'POST',body:JSON.stringify(payload)}:undefined);
const body=await response.json();
if(!response.ok||!body.ok)throw Error(body.error||'Source verification unavailable');
return body;
}
const cad=v=>(Number(v||0)/100).toFixed(2);
async function refresh(){
const id=Number($('dd679Campaign').value);
if(!id){$('dd679Summary').textContent='HOLD · Select a campaign.';return;}
try{
const data=await request(null,id),r=data.financial679||{},m=r.financial;
$('dd679Summary').textContent=[
'Source status: '+(r.status||'HOLD'),
'Orders: '+(r.orders_seen||0),'Verified order-cost records: '+(r.product_cost_receipts_seen||0),
m?'Tax-excluded receipts CAD '+cad(m.tax_excluded_receipts_cents):'Receipts HOLD',
m?'Advertising CAD '+cad(m.verified_ad_cost_cents):'Advertising HOLD',
m?'Other costs CAD '+cad(m.verified_operating_cost_cents):'Operating costs HOLD',
m?'Source net contribution CAD '+cad(m.net_contribution_cents):'Net contribution HOLD',
'Master: '+(r.master_handoff||'HOLD'),
'Evidence blockers: '+(r.blockers||[]).join(', ')
].join(' · ');
}catch(error){$('dd679Summary').textContent='HOLD · '+error.message;}
}
document.addEventListener('DOMContentLoaded',()=>{
if(!$('dd679-net'))return;
(async()=>{try{const d=await request(),seen=new Set();for(const item of d.queue||[]){
if(item.utm_campaign&&!seen.has(item.utm_campaign)){
seen.add(item.utm_campaign);
$('dd679Campaign').add(new Option(item.utm_campaign+' · #'+item.social_post_queue_id,item.social_post_queue_id));
}
}}catch(error){$('dd679Summary').textContent='HOLD · '+error.message;}})();
$('dd679Campaign').addEventListener('change',()=>void refresh());
$('dd679Reconcile').addEventListener('click',()=>void refresh());
$('dd679CostForm').addEventListener('submit',async event=>{
event.preventDefault();$('dd679CostStatus').textContent='Checking independently signed cost evidence…';
const payload={action:'verify_product_cost_679',social_post_queue_id:Number($('dd679Campaign').value),
order_id:Number($('dd679Order').value),axis:$('dd679Axis').value,
amount_cents:Math.round(Number($('dd679Amount').value)*100),
reference:$('dd679Reference').value.trim(),issuer:$('dd679Issuer').value.trim(),
source_sha256:$('dd679Digest').value.trim(),observed_at:$('dd679Observed').value.trim(),
verifier_signature:$('dd679Signature').value.trim(),owner_reviewed:$('dd679OwnerReview').checked};
try{const d=await request(payload);
$('dd679CostStatus').textContent=(d.result?.status||'Cost recorded')+' · No independent Master admission claimed.';
$('dd679Signature').value='';$('dd679OwnerReview').checked=false;await refresh();}
catch(error){$('dd679CostStatus').textContent='HOLD · '+error.message;}
});
$('dd679Signoff').addEventListener('submit',async event=>{
event.preventDefault();$('dd679SignoffStatus').textContent='Rechecking source settlement and costs…';
try{const d=await request({action:'owner_net_signoff_679',
social_post_queue_id:Number($('dd679Campaign').value),
owner_reviewed:$('dd679Reviewed').checked,confirm_scope:$('dd679Scope').checked});
$('dd679SignoffStatus').textContent=(d.result?.status||'Reviewed')+' · Master independent admission HOLD.';
$('dd679Reviewed').checked=false;$('dd679Scope').checked=false;await refresh();}
catch(error){$('dd679SignoffStatus').textContent='HOLD · '+error.message;}
});
});
})();

// Build 678 — exact signed expenses, read-only campaign reconciliation, explicit owner signoff.
(()=>{
'use strict';
const $=id=> document.getElementById(id);
const call=async (payload,queueId)=>{
if(!window.DDAuth?.apiFetch)throw Error('Authenticated admin required');
const url='/api/admin/social-post-queue'+(!payload&&queueId?'?campaign_queue_id='+encodeURIComponent(queueId):'');
const response=await window.DDAuth.apiFetch(url,payload?{method:'POST',body:JSON.stringify(payload)}:undefined);
const data=await response.json();
if(!response.ok||!data.ok)throw Error(data.error||'Campaign evidence unavailable');
return data;
};
async function reconcile(){
const id=Number($('dd678Campaign').value);
if(!id){$('dd678Summary').textContent='HOLD · Choose a campaign.';return;}
try{
const data=await call(null,id),f=data.financial678||{};
const m=f.metrics;
const fmt=n=>(Number(n||0)/100).toFixed(2);
$('dd678Summary').textContent=[
'Campaign: '+(f.campaign||'Unknown'),
'Expense receipts: '+(f.receipt_count||0),
'Verified expense evidence: '+(f.verified_receipt_count||0),
'Settled attributed orders: '+(f.paid_order_count||0),
m?'Gross attributed receipts CAD '+fmt(m.attributed_sales_cents):'Attributed receipts HOLD',
m?'Verified ad spend CAD '+fmt(m.verified_ad_cost_cents):'Advertising spend HOLD',
m?'Marketing contribution CAD '+fmt(m.marketing_contribution_cents)+'; marketing return '+m.marketing_roi_percent+'%':'Marketing return HOLD',
'Owner signoff: '+(f.signoff||'HOLD'),
'Net business profit: '+(f.profitability_status||'HOLD'),
'Blockers: '+(f.blockers||[]).join(', ')
].join(' · ');
}catch(e){$('dd678Summary').textContent='HOLD · '+e.message;}
}
document.addEventListener('DOMContentLoaded',()=>{
if(!$('dd678-finance'))return;
const queue=$('dd678Campaign');
(async()=>{try{
const data=await call();const seen=new Set();
for(const item of data.queue||[]){
if(!item.utm_campaign||seen.has(item.utm_campaign))continue;
seen.add(item.utm_campaign);
queue.add(new Option(item.utm_campaign+' · #'+item.social_post_queue_id,item.social_post_queue_id));
}
}catch(e){$('dd678Summary').textContent='HOLD · '+e.message;}})();
queue.addEventListener('change',()=>void reconcile());
$('dd678Refresh').addEventListener('click',()=>void reconcile());
$('dd678VerifyForm').addEventListener('submit',async e=>{
e.preventDefault();$('dd678VerifyResult').textContent='Checking independent signature…';
const payload={action:'expense_attestation_678',social_post_queue_id:Number(queue.value),
receipt_reference:$('dd678Receipt').value.trim(),vendor:$('dd678Vendor').value.trim(),
original_document_sha256:$('dd678Digest').value.trim(),checked_at:$('dd678Checked').value.trim(),
verifier_signature:$('dd678Signature').value.trim(),owner_reviewed:$('dd678Reviewed').checked};
try{const result=await call(payload);$('dd678VerifyResult').textContent=(result.result?.status||'Verified')+' · Receipt was independently signed; no ROI certified.';
$('dd678Signature').value='';$('dd678Reviewed').checked=false;await reconcile();}
catch(error){$('dd678VerifyResult').textContent='HOLD · '+error.message;}
});
$('dd678Signoff').addEventListener('submit',async e=>{
e.preventDefault();$('dd678SignoffResult').textContent='Checking current payment and expense evidence…';
try{const result=await call({action:'owner_marketing_signoff_678',social_post_queue_id:Number(queue.value),
owner_reviewed:$('dd678Owner').checked,confirm_gross_basis:$('dd678Gross').checked});
$('dd678SignoffResult').textContent=(result.result?.status||'Accepted')+' · Net business profitability remains HOLD.';
$('dd678Owner').checked=false;$('dd678Gross').checked=false;await reconcile();}
catch(error){$('dd678SignoffResult').textContent='HOLD · '+error.message;}
});
});
})();

// Build 676 — owner-attested campaign costs, verified settlement and attribution HOLD.
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const request=async payload=>{if(!window.DDAuth?.apiFetch)throw Error('Authenticated admin required');
const res=await window.DDAuth.apiFetch('/api/admin/social-post-queue',payload?
{method:'POST',body:JSON.stringify(payload)}:undefined),data=await res.json();
if(!res.ok||!data.ok)throw Error(data.error||'Evidence unavailable');return data;};
async function load(){
try{const data=await request(),queue=$('dd676Queue'),old=queue.value;
queue.replaceChildren(new Option('Choose campaign',''));
for(const item of data.queue||[])if(item.utm_campaign)queue.add(new Option(item.utm_campaign+' · #'+item.social_post_queue_id,item.social_post_queue_id));
queue.value=old;
const finance=data.financial676||{},tbody=$('dd676Rows');tbody.replaceChildren();
for(const item of finance.items||[]){const row=document.createElement('tr');
const values=[item.campaign,item.kind,item.reference,(Number(item.amount_cents||0)/100).toFixed(2),item.observed_at,item.attribution_verified?'Order/session matched · ROI HOLD':'HOLD'];
for(const value of values){const cell=document.createElement('td');cell.textContent=String(value??'—');row.append(cell);}tbody.append(row);}
$('dd676Status').textContent='Financial ROI: '+(finance.certification||'HOLD')+' · Checkout sessions can now bind paid orders to first-party campaign evidence. Expense receipts remain owner-attested, not independently vendor-verified. No certified ROI claim.';
}catch(error){$('dd676Status').textContent='HOLD · '+error.message;}
}
document.addEventListener('DOMContentLoaded',()=>{
if(!$('dd676-finance'))return;
$('dd676Form').addEventListener('submit',async event=>{event.preventDefault();
const kind=$('dd676Kind').value,cost=Number($('dd676Cost').value);
const payload={action:'financial_evidence_676',social_post_queue_id:Number($('dd676Queue').value),
kind,currency:'CAD',cost_cents:Math.round(cost*100),receipt_reference:$('dd676Reference').value.trim(),
order_id:Number($('dd676Order').value),owner_reviewed:$('dd676Confirm').checked};
$('dd676Result').textContent='Checking source evidence…';
try{const data=await request(payload);$('dd676Result').textContent=(data.result?.status||'Evidence recorded')+' · ROI remains HOLD.';$('dd676Confirm').checked=false;await load();}
catch(error){$('dd676Result').textContent='HOLD · '+error.message;}
});void load();
});
})();
// Build 675 — independently sourced engagement snapshots and evidence-labelled attribution.
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const append=(target,values)=>{const row=document.createElement('tr');for(const value of values){const cell=document.createElement('td');cell.textContent=String(value??'—');row.append(cell);}target.append(row);};
const request=async body=>{if(!window.DDAuth?.apiFetch)throw Error('Admin authentication required');
const res=await window.DDAuth.apiFetch('/api/admin/social-post-queue',body?{method:'POST',body:JSON.stringify(body)}:undefined);
const data=await res.json();if(!res.ok||!data.ok)throw Error(data.error||'Evidence unavailable');return data;};
async function load(){try{const data=await request(),funnel=$('dd675Funnel'),snap=$('dd675Snapshots');funnel.replaceChildren();snap.replaceChildren();
const rollups=data.utm_rollups||[],evidence=data.engagement675?.snapshots||[];
for(const row of rollups)append(funnel,[row.utm_campaign,row.utm_source+' / '+row.utm_medium,row.page_views,row.visitor_sessions||row.session_count,row.checkout_starts,row.custom_request_count]);
for(const row of evidence)append(snap,[row.campaign+' / '+row.platform,row.provider_id,Object.entries(row.metrics||{}).map(([key,value])=>key+': '+value).join(' · '),row.observed_at]);
if(!rollups.length)append(funnel,['No attributed campaign evidence','','','','','']);
if(!evidence.length)append(snap,['No independently verified engagement snapshots','','','']);
const selector=$('dd675Queue'),prior=selector.value;selector.replaceChildren(new Option('Choose a published item',''));
for(const q of data.queue||[])if(q.post_status==='posted'||q.published_at)selector.add(new Option('#'+q.social_post_queue_id+' · '+(q.title||'Post').slice(0,55),q.social_post_queue_id));
selector.value=prior;// Keep the owner's selected post if still present.
$('dd675Roi').textContent='ROI: UNAVAILABLE · Confirmed attributed sales revenue and evidenced campaign spend are not both present. Visits, checkouts and enquiries are separate indicators, not financial return.';
}catch(error){$('dd675Roi').textContent='HOLD · '+error.message;}}
document.addEventListener('DOMContentLoaded',()=>{if(!$('dd675-roi'))return;$('dd675Refresh')?.addEventListener('click',load);
$('dd675Verify').addEventListener('submit',async e=>{e.preventDefault();$('dd675Result').textContent='Requesting read-only provider evidence…';
try{const data=await request({action:'verify_engagement_675',social_post_queue_id:Number($('dd675Queue').value),platform_key:$('dd675Platform').value});
const result=data.result||{};$('dd675Result').textContent=result.verified?'Verified '+result.platform+' metrics from provider; snapshot recorded.':'HOLD · '+(result.status||'No verified metrics');await load();
}catch(error){$('dd675Result').textContent='HOLD · '+error.message;}});
void load();
});
})();
// Build 674 — owner campaign calendar and source-grounded cross-channel command centre.
(()=>{
'use strict';
const $=id=>document.getElementById(id),add=(row,values)=>{for(const v of values){const c=document.createElement('td');c.textContent=String(v??'—');row.append(c);}};
let queue=[],receipts=[];
const request=async body=>{const res=await window.DDAuth.apiFetch('/api/admin/social-post-queue',body?{method:'POST',body:JSON.stringify(body)}:undefined);const json=await res.json();if(!res.ok||!json.ok)throw Error(json.error||'Campaign data unavailable');return json;};
function render(){
const month=$('dd674Month').value,campaign=$('dd674Campaign').value,body=$('dd674Calendar');body.replaceChildren();
const selected=queue.filter(q=>(!campaign||(q.utm_campaign||'')===campaign)&&String(q.scheduled_at||q.created_at||'').slice(0,7)===month);
for(const q of selected){const row=document.createElement('tr');add(row,[String(q.scheduled_at||q.created_at||'').slice(0,16),q.utm_campaign||'Unattributed',(q.target_platforms||[]).join(', '),q.approval_status+' / '+q.post_status]);row.children[1].append(document.createTextNode(' · '+(q.title||'')));body.append(row);}
if(!selected.length){const r=document.createElement('tr');add(r,['No matching scheduled or created drafts.','','','']);body.append(r);}
const byChannel=new Map();
for(const r of receipts){const name=r.platform_key||'unknown',s=byChannel.get(name)||{ack:0,verified:0,failed:0,hold:0};if(r.attempt_status==='api_posted')s.ack++;if(r.attempt_status==='receipt_verified')s.verified++;if(r.attempt_status==='api_failed')s.failed++;if(['blocked_account_unverified','recovery_requested'].includes(r.attempt_status))s.hold++;byChannel.set(name,s);}
const channelBody=$('dd674Channels');channelBody.replaceChildren();for(const [name,s] of byChannel){const row=document.createElement('tr');add(row,[name,s.ack,s.verified,s.failed,s.hold]);channelBody.append(row);}
$('dd674Summary').textContent=`${selected.length} visible posts · ${new Set(selected.map(q=>q.utm_campaign).filter(Boolean)).size} named campaigns · ${receipts.length} recent channel outcomes. Results are recorded evidence only; no inferred reach.`;
}
async function load(){try{const data=await request();queue=data.queue||[];receipts=data.receipts673?.channels||[];const campaigns=[...new Set(queue.map(q=>q.utm_campaign).filter(Boolean))].sort();const selector=$('dd674Campaign'),prior=selector.value;selector.replaceChildren(new Option('All campaigns',''));for(const c of campaigns)selector.add(new Option(c,c));selector.value=campaigns.includes(prior)?prior:'';const draft=$('dd674Queue');draft.replaceChildren(new Option('Choose a draft',''));for(const q of queue.filter(q=>q.post_status!=='posted'&&q.post_status!=='archived'))draft.add(new Option('#'+q.social_post_queue_id+' · '+(q.title||'Draft').slice(0,60),q.social_post_queue_id));render();}catch(e){$('dd674Message').textContent='HOLD · '+e.message;}}
document.addEventListener('DOMContentLoaded',()=>{if(!$('dd674-marketing'))return;$('dd674Month').value=new Date().toISOString().slice(0,7);$('dd674Month').addEventListener('change',render);$('dd674Campaign').addEventListener('change',render);
$('dd674Schedule').addEventListener('submit',async event=>{event.preventDefault();const id=Number($('dd674Queue').value),date=new Date($('dd674Date').value);if(!id||!Number.isFinite(date.getTime()))return;$('dd674Message').textContent='Saving owner-review schedule…';
try{await request({action:'campaign_schedule_674',social_post_queue_id:id,campaign_name:$('dd674Name').value.trim(),scheduled_at:date.toISOString(),schedule_timezone:Intl.DateTimeFormat().resolvedOptions().timeZone});$('dd674Message').textContent='Campaign schedule saved as draft; approval reset to needs review. No post published.';await load();}catch(e){$('dd674Message').textContent='HOLD · '+e.message;}});
void load();
});
})();
// Build 673 — per-channel receipt status, independently checked evidence and one-channel recovery.
(()=>{
'use strict';
const el=id=>document.getElementById(id);
const call=async (action,values={})=>{
if(!window.DDAuth?.apiFetch)throw Error('Authenticated admin session required.');
const response=await window.DDAuth.apiFetch('/api/admin/social-post-queue',action
?{method:'POST',body:JSON.stringify({action,...values})}:undefined);
const data=await response.json();
if(!response.ok||!data.ok)throw Error(data.error||'Social evidence unavailable.');
return data;
};
const cell=(row,value)=>{const td=document.createElement('td');td.textContent=String(value??'—');row.append(td);return td;};
const load=async()=>{
const area=el('dd673Rows');if(!area)return;
try{
const data=await call();const view=data.receipts673||{channels:[],totals:{}};
const counts=view.totals;
el('dd673Totals').textContent=`Provider acknowledged: ${counts.provider_acknowledged||0} · Independently verified: ${counts.independently_verified||0} · Failed: ${counts.failed||0} · HOLD: ${counts.on_hold||0} · Manual records: ${counts.manually_recorded||0}. Counts reflect the latest 150 recorded attempts, not audience reach.`;
area.replaceChildren();
for(const entry of view.channels){
const row=document.createElement('tr');
cell(row,`#${entry.social_post_queue_id} · ${entry.title||''}`);
cell(row,entry.platform_key);cell(row,entry.attempt_status);
const idCell=cell(row,entry.external_post_id||'Not recorded');
if(entry.external_post_url?.startsWith('https://')){
const link=document.createElement('a');link.href=entry.external_post_url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=' · Open provider link';idCell.append(link);
}
cell(row,entry.attempted_at);const actions=cell(row,'');
if(['api_posted','receipt_verified'].includes(entry.attempt_status)){
const button=document.createElement('button');button.type='button';button.className='btn secondary';button.textContent='Verify provider receipt';
button.addEventListener('click',()=>run(button,'verify_publication_673',entry));actions.append(button);
}else if(entry.attempt_status==='api_failed'){
const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';
label.append(check,document.createTextNode(' Checked provider: no duplicate'));
const button=document.createElement('button');button.type='button';button.className='btn secondary';button.textContent='Retry failed channel';
button.addEventListener('click',()=>{if(!check.checked){el('dd673Result').textContent='HOLD · Confirm the destination was checked for an existing post.';return;}
run(button,'retry_failed_673',entry,{owner_checked_no_duplicate:true});});
actions.append(label,button);
}
area.append(row);
}
if(!view.channels.length)area.append(Object.assign(document.createElement('tr'),{textContent:'No recorded deliveries yet.'}));
}catch(error){el('dd673Totals').textContent='HOLD · '+error.message;}
};
async function run(button,action,entry,extra={}){
button.disabled=true;el('dd673Result').textContent='Checking the selected channel…';
try{const data=await call(action,{social_post_queue_id:entry.social_post_queue_id,platform_key:entry.platform_key,...extra});
const result=data.result||{};
el('dd673Result').textContent=result.verified?'VERIFIED · Provider confirms the same publication ID.':
result.status&&!result.verified?`HOLD · ${result.status}; no new post created.`:
'Recovery request completed. Inspect the latest channel status below; no other channels were retried.';
await load();
}catch(error){el('dd673Result').textContent='HOLD · '+error.message;}
finally{button.disabled=false;}
}
document.addEventListener('DOMContentLoaded',()=>{if(!el('dd673-receipts'))return;el('dd673Refresh')?.addEventListener('click',load);void load();});
})();
// Build 672 — read-only account identity and exact public derivative owner approval.
(()=>{
'use strict';
const byId=id=> document.getElementById(id);
const text=value=> String(value ?? '');
const api=async (action,extras={})=>{
if (!window.DDAuth?.apiFetch) throw new Error('Admin authentication is unavailable.');
const response=await window.DDAuth.apiFetch('/api/admin/social-post-queue',action
?{ method:'POST',body:JSON.stringify({ action,...extras }) }
:undefined);
const result=await response.json();
if (!response.ok || !result.ok) throw new Error(result.error || result.message || 'Request failed.');
return result;
};
const show=(id,message)=>{ const node=byId(id);if (node) node.textContent=message;};
document.addEventListener('DOMContentLoaded',()=>{
if (!byId('dd672-owner-gate')) return;
const verify=byId('dd672Verify');
verify?.addEventListener('click',async ()=>{
verify.disabled=true;
show('dd672Accounts','Checking configured destinations with each provider…');
try{
const data=await api('verify_accounts_672');
const lines=(data.accounts || []).map(account=>
`${account.platform}: ${account.verified ? 'VERIFIED' : 'HOLD'} · ${account.verified ? (account.account_name || account.account_id || 'Identity confirmed') : account.status}`);
show('dd672Accounts',lines.join(' | ') || 'No destinations available.');
} catch (error){ show('dd672Accounts','HOLD · '+ error.message);}
finally{ verify.disabled=false;}
});
const load=async ()=>{
const select=byId('dd672Queue');
select.replaceChildren(new Option('Choose an unposted CAIP draft',''));
try{
const data=await api();
const queue=(data.queue || []).filter(item=> item.source_type==='caip_project'&& item.post_status !=='posted');
for (const item of queue){
const id=item.social_post_queue_id;
select.add(new Option(`#${id} · Project ${item.source_id} · ${text(item.caption || item.title).slice(0, 65)}`,id));
}
show('dd672Status',queue.length ? 'Select a draft, then approve its exact verified public derivative.':'HOLD · No unposted CAIP-linked drafts.');
} catch (error){ show('dd672Status','HOLD · '+ error.message);}
};
byId('dd672LoadQueue')?.addEventListener('click',load);
byId('dd672Derivative')?.addEventListener('submit',async event=>{
event.preventDefault();
const button=event.currentTarget.querySelector('[type="submit"]');
button.disabled=true;
show('dd672Status','Checking canonical CAIP rights, consent and exact URL…');
try{
const result=await api('approve_caip_derivative_672',{
social_post_queue_id:Number(byId('dd672Queue').value),
creative_asset_id:Number(byId('dd672Asset').value),
public_url:byId('dd672Url').value.trim(),
exact_media_reviewed:byId('dd672Reviewed').checked,
owner_confirmed:byId('dd672Owner').checked
});
show('dd672Status',`Recorded approval for CAIP asset #${result.creative_asset_id}. Post remains a draft; no publication was performed.`);
byId('dd672Reviewed').checked=false;
byId('dd672Owner').checked=false;
} catch (error){ show('dd672Status','HOLD · '+ error.message);}
finally{ button.disabled=false;}
});
void load();
});
})();
// Build 211 — browser-only social post preview and platform media preflight.
(()=>{
'use strict';
const $=(id)=> document.getElementById(id);
const limits={
instagram:{ caption:2200,imageRequired:true,label:'Instagram',formats:['jpg','jpeg'],minWidth:320,minRatio:0.8,maxRatio:1.91 },
facebook:{ caption:63206,imageRequired:false,label:'Facebook',formats:['jpg','jpeg','png','webp'],minWidth:500,minRatio:0.4,maxRatio:2.5 },
pinterest:{ caption:500,imageRequired:true,label:'Pinterest',formats:['jpg','jpeg','png','webp'],minWidth:600,minRatio:0.4,maxRatio:1.5 },
x:{ caption:280,imageRequired:false,label:'X',formats:['jpg','jpeg','png','webp'],minWidth:0,minRatio:0.1,maxRatio:10 }
};
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function extension(url){try{const p=new URL(url).pathname.toLowerCase();return (p.match(/\.([a-z0-9]+)$/)||[])[1]||'';}catch{return '';}}
  function result(kind,title,detail){return `<li class="social-check ${kind}"><strong>${esc(title)}</strong><span>${esc(detail)}</span></li>`;}
  function loadImage(url){return new Promise((resolve)=>{if(!url)return resolve(null);const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight,ratio:img.naturalWidth/img.naturalHeight});img.onerror=()=>resolve({error:true});img.src=url;});}
  async function run(){
    const key=$('socialPreflightPlatform')?.value||'instagram'; const rule=limits[key];
    const caption=($('socialPreflightCaption')?.value||'').trim(); const link=($('socialPreflightLink')?.value||'').trim(); const image=($('socialPreflightImage')?.value||'').trim();
    const checks=[];
    checks.push(caption ? result(caption.length<=rule.caption?'pass':'fail','Caption length',`${caption.length} of ${rule.caption} characters used.`) : result('warn','Caption missing','Add final reviewed copy before publishing.'));
    let linkOk=false; try{const u=new URL(link); linkOk=u.protocol==='https:'; checks.push(result(linkOk?'pass':'fail','Destination link',linkOk?'Public HTTPS link format looks valid.':'Use a complete public HTTPS URL.'));}catch{checks.push(result('fail','Destination link','Enter a complete public HTTPS URL.'));}
    if(!image){checks.push(result(rule.imageRequired?'fail':'warn','Image URL',rule.imageRequired?'This platform workflow requires an image.':'No image supplied; a text/link post may still be possible.'));}
    else {
      let imageUrlOk=false; try{const u=new URL(image);imageUrlOk=u.protocol==='https:';}catch{}
      checks.push(result(imageUrlOk?'pass':'fail','Image URL',imageUrlOk?'Image uses HTTPS.':'Use a complete public HTTPS image URL.'));
      const ext=extension(image); checks.push(result(rule.formats.includes(ext)?'pass':'warn','Image format',ext?`${ext.toUpperCase()} detected. Expected: ${rule.formats.join(', ')}.`:`The URL does not expose a file extension. Confirm the server returns a supported image type.`));
      const meta=await loadImage(image);
      if(meta?.error) checks.push(result('fail','Image access','The browser could not load this image. Confirm it is public, permits hotlinking, and is not behind admin authentication.'));
      else if(meta){
        checks.push(result(meta.width>=rule.minWidth?'pass':'warn','Image dimensions',`${meta.width} × ${meta.height}px. Recommended minimum width for this check: ${rule.minWidth}px.`));
        checks.push(result(meta.ratio>=rule.minRatio&&meta.ratio<=rule.maxRatio?'pass':'warn','Aspect ratio',`${meta.ratio.toFixed(2)}:1. Expected range for this workflow: ${rule.minRatio}:1 to ${rule.maxRatio}:1.`));
      }
    }
    const results=$('socialPreflightResults'); if(results) results.innerHTML=`<h3>${esc(rule.label)} preflight</h3><ul class="social-check-list">${checks.join('')}</ul><p class="small">Passing this check does not publish anything and does not prove media consent, copyright, product availability, or platform approval.</p>`;
    const preview=$('socialPreflightPreview'); if(preview){preview.hidden=false;$('socialPreviewPlatform').textContent=rule.label;$('socialPreviewCaption').textContent=caption||'Caption preview';const a=$('socialPreviewLink');a.href=linkOk?link:'#';a.textContent=linkOk?link:'Destination link not ready';const img=$('socialPreviewImage');if(image){img.src=image;img.hidden=false;}else{img.removeAttribute('src');img.hidden=true;}}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    $('socialPreflightRun')?.addEventListener('click',run);
    $('socialPreflightClear')?.addEventListener('click',()=>{['socialPreflightCaption','socialPreflightLink','socialPreflightImage'].forEach(id=>{if($(id))$(id).value='';});if($('socialPreflightResults'))$('socialPreflightResults').innerHTML='<p class="small">Preflight cleared. Nothing was saved or published.</p>';if($('socialPreflightPreview'))$('socialPreflightPreview').hidden=true;});
});
})();

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
function draw686(d){
if(!$('dd686-finance'))return;
const snapshot=d.financial685?.alerts686||null,global=d.financialRecoveryQueue686;
$('dd686Status').textContent=snapshot?
snapshot.level+' · '+snapshot.alerts.map(x=>x.code).join(' / ')+
' · server observation '+snapshot.observed_at+' · connection HOLD · financial certification HOLD':
'Select a campaign for current signed evidence. Portfolio incidents require owner review.';
const alerts=$('dd686Alerts');alerts.replaceChildren();
if(snapshot){
for(const a of snapshot.alerts){
const p=document.createElement('p');p.className='small';
p.textContent=a.level+' · '+a.code+' · '+a.action;alerts.appendChild(p);
}
if(!snapshot.alerts.length){const p=document.createElement('p');p.textContent='No receipt alert at this server observation; ongoing runtime telemetry remains HOLD.';alerts.appendChild(p);}
}else{const p=document.createElement('p');p.textContent='Choose a campaign to check signed receipt aging.';alerts.appendChild(p);}
$('dd686Escalate').disabled=!snapshot?.source_drift;
$('dd686Coverage').textContent=global?
(global.history_complete?'Bounded incident scan complete for recorded history. ':'HOLD: older incident history exceeds bounded scan; queue may be incomplete. ')+
'Open visible cases: '+global.total_visible_open+' · other campaigns are NOT independently revalidated by this view.':
'Owner incident history unavailable. HOLD.';
const list=$('dd686Queue');list.replaceChildren();
if(!global?.cases?.length){const li=document.createElement('li');li.textContent='No visible open incidents in the bounded ledger; this is not proof of Master connection.';list.appendChild(li);return;}
for(const item of global.cases){
const li=document.createElement('li');
const b=document.createElement('button');b.type='button';b.className='btn secondary';
b.textContent=item.priority+' · '+item.campaign+' · '+item.issue_code+
' · '+(item.age_minutes===null?'age unverified':item.age_minutes+' min old')+
' · Review campaign #'+item.queue_id;
b.addEventListener('click',()=>{const select=$('dd685Campaign'),value=String(item.queue_id);
if(!Array.from(select.options).some(o=>o.value===value))select.add(new Option(item.campaign+' · #'+value,value));
select.value=value;void refresh();});
li.appendChild(b);list.appendChild(li);
}
}
function draw687(d){
if(!$('dd687-finance'))return;
const v=d.financial687,q=d.financialRecoveryQueue686;
$('dd687Status').textContent=v?.campaign_queue_id?
v.status+' · Owner review target '+v.advisory_target_minutes+' minutes · Independent current Master '+(v.master_accepted_now?'VERIFIED':'HOLD')+
' · continuous connection HOLD · audited profits HOLD':
'HOLD · Select a campaign in the financial receipt panel above.';
$('dd687Stats').textContent=v?.campaign_queue_id?
'Open '+v.open_count+' · Due soon '+v.due_soon_count+' · Overdue '+v.overdue_count+
' · Recorded owner closures '+v.closed_count+' · Within advisory target '+v.closed_within_target_count+
' · Mean recorded closure '+(v.mean_recorded_closure_minutes??'unavailable')+' min':
'No selected campaign closure analytics.';
$('dd687Coverage').textContent=v?
(v.history_complete?'Selected campaign incident/receipt scan complete. ':'HOLD: incomplete, invalid or unpaired history. ')+
'These are bounded ledger observations, not certified recovery outcomes. Portfolio visible open cases: '+
(q?.total_visible_open??'unavailable')+(q&&!q.history_complete?' · Portfolio history incomplete.':''):
'Incident history not available.';
$('dd687Renewal').textContent=v?.renewal?
v.renewal.current_status+' · Latest recorded receipt #'+(v.renewal.latest_recorded_receipt_id||'—')+
' · Historical renewal entries '+v.renewal.recorded_renewal_count+
' · Current verified receipt #'+(v.renewal.current_verified_receipt_id||'—')+
' · expiry '+(v.renewal.expires_at||'HOLD')+
' · Historical entries are NOT automatically reverified.':
'No selected campaign renewal evidence. HOLD.';
const receipts=$('dd687Receipts');receipts.replaceChildren();
for(const r of v?.renewal?.receipts||[]){
const li=document.createElement('li');li.textContent='Receipt #'+r.receipt_id+' · '+r.state+
' · issued '+(r.issued_at||'unavailable')+' · recorded '+(r.recorded_at||'unavailable');
receipts.appendChild(li);
}
if(!receipts.childElementCount){const li=document.createElement('li');li.textContent='No recorded Master acceptance for this campaign. HOLD.';receipts.appendChild(li);}
const list=$('dd687Followups');list.replaceChildren();
for(const x of v?.owner_followups||[]){
const li=document.createElement('li');
li.textContent=x.sla_state+' · '+x.issue_code+' · '+x.age_minutes+' min · Review due '+x.due_at+
' · Case '+x.case_id;
list.appendChild(li);
}
if(!list.childElementCount){const li=document.createElement('li');
li.textContent=v?.history_complete?'No open owner cases in this bounded campaign history.':'No complete owner case proof available; HOLD.';
list.appendChild(li);}
}
let audit688=null;
function chooseCases688(){
const select=$('dd688Case');if(!select)return;
select.replaceChildren(new Option('Select exact current case',''));
const action=$('dd688Decision')?.value;
const list=action==='signoff_closure'?audit688?.closed_cases:audit688?.breaches;
for(const x of list||[]){
const reviewed=action==='signoff_closure'?x.owner_signed_off:x.owner_reviewed;
if(reviewed)continue;
const receipt=action==='signoff_closure'?x.closure_receipt_id:x.open_receipt_id;
select.add(new Option((action==='signoff_closure'?'Closed':'Overdue')+' · '+x.case_id+
' · exact receipt #'+receipt,x.case_id+'|'+receipt));
}
}
function draw688(d){
if(!$('dd688-finance'))return;
const v=d.financial688;
audit688=v||null;
$('dd688Status').textContent=v?.campaign_queue_id?
v.status+' · bounded incident history '+(v.history_complete?'COMPLETE':'HOLD')+
' · current independently verified Master '+(v.master_accepted_now?'YES':'HOLD')+
' · continuous connection HOLD · financial certification HOLD':
'HOLD · Select a campaign and refresh the protected financial evidence.';
$('dd688Renewal').textContent=v?.renewal_audit?
'Historical signed Master receipt chain: '+(v.renewal_audit.lineage_complete?'PINS MATCH':'HOLD / INCOMPLETE')+
' · recorded receipts '+v.renewal_audit.record_count+
' · historical renewals '+v.renewal_audit.historical_renewal_count+
' · current independently reverified receipt #'+(v.renewal_audit.current_independently_reverified_receipt_id||'—')+
' · historical signatures not reverified by this report.':'No Master receipt chain loaded. HOLD.';
$('dd688Metrics').textContent=v?.campaign_queue_id?
'Overdue '+v.breach_count+' · due soon '+v.due_soon_count+
' · unreviewed breaches '+v.unreviewed_breach_count+
' · recorded closure signoffs '+v.signoff_count+
' · awaiting closure signoff '+v.pending_closure_signoff_count+
' · excluded/stale review entries '+v.invalid_or_stale_review_count:
'No owner escalation metrics until a campaign is selected.';
const breaches=$('dd688Breaches');breaches.replaceChildren();
for(const x of v?.breaches||[]){
const li=document.createElement('li');
li.textContent=x.severity+' · '+x.issue_code+' · '+x.case_id+
' · overdue '+x.age_minutes+' min · due '+x.due_at+
' · review '+(x.owner_reviewed?'RECORDED':'REQUIRED');breaches.appendChild(li);
}
if(!breaches.childElementCount){const li=document.createElement('li');
li.textContent='No overdue cases in the bounded current view; this does not certify Master acceptance.';
breaches.appendChild(li);}
const list=$('dd688Signoffs');list.replaceChildren();
for(const x of v?.owner_reviews||[]){
const li=document.createElement('li');li.textContent=x.decision+' · case '+x.case_id+
' · owner audit #'+x.receipt_id+' · recorded '+x.recorded_at;
list.appendChild(li);
}
if(!list.childElementCount){const li=document.createElement('li');
li.textContent='No matching owner escalation/signoff receipts recorded in the bounded ledger.';list.appendChild(li);}
chooseCases688();
}
let audit689=null;
function chooseAudit689(){
const select=$('dd689Source');if(!select)return;
select.replaceChildren(new Option('Select matching current owner receipt',''));
const decision=$('dd689Decision')?.value;
if(!audit689?.history_complete||!audit689?.master_accepted_now)return;
const prior=audit689.owner_action_history||[];
let options=[];
if(decision==='replay_escalation')options=prior.filter(x=>x.decision==='escalate_breach'&&
x.replay_state==='HISTORICAL_OWNER_ACTION_REPLAY_MATCH').map(x=>({
case_id:x.case_id,receipt_id:x.receipt_id}));
else if(decision==='resolve_renewal_drift')options=(audit689.drift_resolution_candidates||[])
.filter(x=>!x.owner_resolution_recorded&&x.reference_receipt_id)
.map(x=>({case_id:x.case_id,receipt_id:x.reference_receipt_id}));
else if(decision==='accept_owner_audit')options=(audit689.audit_acceptance_candidates||[])
.filter(x=>!x.owner_audit_accepted&&x.reference_receipt_id)
.map(x=>({case_id:x.case_id,receipt_id:x.reference_receipt_id}));
for(const x of options){
if((audit689.owner_audit_receipts||[]).some(a=>a.decision===decision&&
a.reference_receipt_id===x.receipt_id))continue;
select.add(new Option(x.case_id+' · owner evidence #'+x.receipt_id,
x.case_id+'|'+x.receipt_id));
}
}
function draw689(d){
if(!$('dd689-finance'))return;
const v=d.financial689||null;
audit689=v;
$('dd689Status').textContent=v?.campaign_queue_id?
v.status+' · replay history '+(v.history_complete?'COMPLETE':'HOLD')+
' · source Master '+(v.master_accepted_now?'CURRENT VERIFIED':'HOLD')+
' · connection HOLD · certified profit HOLD':
'HOLD · Select a campaign and read current protected financial evidence.';
$('dd689Renewal').textContent=v?.renewal?
'Renewal continuity: '+v.renewal.status+
' · last recorded Master #'+(v.renewal.latest_recorded_receipt_id||'—')+
' · currently reverified #'+(v.renewal.current_reverified_receipt_id||'—')+
' · source drift '+(v.renewal.source_drift?'FLAGGED':'not flagged')+
' · historical signatures not independently reverified here.':
'No signed Master renewal lineage loaded.';
$('dd689Counters').textContent=v?.campaign_queue_id?
'Exact owner replay entries '+v.exact_replay_count+
' · mismatches '+v.invalid_replay_count+
' · append-only owner audit receipts '+v.owner_audit_receipt_count+
' · renewal drift candidates '+(v.drift_resolution_candidates||[]).length+
' · owner acceptance candidates '+(v.audit_acceptance_candidates||[]).length:
'No owner audit counts available.';
const replay=$('dd689Replay');replay.replaceChildren();
for(const x of v?.owner_action_history||[]){
const li=document.createElement('li');li.textContent=x.replay_state+
' · '+x.decision+' · '+x.case_id+
' · prior owner receipt #'+x.receipt_id+
' · underlying evidence #'+x.evidence_receipt_id;
replay.appendChild(li);
}
if(!replay.childElementCount){const li=document.createElement('li');
li.textContent='No owner escalation/signoff to replay from the bounded ledger.';replay.appendChild(li);}
const decisions=$('dd689Decisions');decisions.replaceChildren();
for(const x of v?.owner_audit_receipts||[]){
const li=document.createElement('li');li.textContent=x.decision+' · '+x.case_id+
' · durable owner audit receipt #'+x.receipt_id+
' · previous owner receipt #'+x.reference_receipt_id;
decisions.appendChild(li);
}
if(!decisions.childElementCount){const li=document.createElement('li');
li.textContent='No recorded 689 owner audit acknowledgments; history alone is not acceptance.';decisions.appendChild(li);}
chooseAudit689();
}
let audit690=null;
function chooseCases690(){
const select=$('dd690Source');if(!select)return;
select.replaceChildren(new Option('Choose matching current evidence',''));
const decision=$('dd690Decision')?.value,view=audit690;
if(!view?.history_complete)return;
const items=decision==='review_replay_exception'?
(view.replay_exceptions||[]).filter(x=>x.reference_receipt_id&&!x.owner_reviewed):
view.master_accepted_now?(view.closure_candidates||[]).filter(x=>
!x.owner_reconciled&&x.status==='CURRENT_REVIEW_ELIGIBLE'):[];
for(const x of items){
const ref=decision==='review_replay_exception'?x.reference_receipt_id:x.receipt_id;
if(!x.case_id||!ref)continue;
select.add(new Option((x.issue_code||'Owner accepted closure')+' · '+x.case_id+
' · original receipt #'+ref,x.case_id+'|'+ref));
}
}
function draw690(d){
if(!$('dd690-finance'))return;
const v=d.financial690||null;audit690=v;
$('dd690Status').textContent=v?.campaign_queue_id?
v.status+' · bounded owner history '+(v.history_complete?'COMPLETE':'HOLD')+
' · independently verified Master '+(v.master_accepted_now?'CURRENT':'HOLD')+
' · connection HOLD · financial certification HOLD':
'HOLD · Select a financial campaign and refresh its protected source evidence.';
const rn=v?.renewal;
$('dd690Renewal').textContent=rn?
'Master renewal status '+rn.status+
' · exact current signed acceptance #'+(rn.current_independently_reverified_receipt_id||'—')+
' · seconds to expiry '+(rn.seconds_to_expiry??'unknown')+
' · source-matched historical entries '+rn.record_count+
' · gaps over 20 minutes '+rn.historical_gap_over_20_minutes_count+
' · last sampled '+rn.observed_at+' · no background polling or historical signature verification.':
'Master receipt renewal status HOLD until evidence loads.';
$('dd690Stats').textContent=v?.campaign_queue_id?
'Replay issues '+v.replay_exception_count+
' · unreviewed exact issues '+v.unreviewed_replay_exception_count+
' · closure reconciliations '+v.reconciled_closure_count+
' · eligible owner closures '+v.eligible_closure_count+
' · invalid owner records '+v.invalid_owner_history_count:
'Owner reconciliation status unavailable.';
const cases=$('dd690Exceptions');cases.replaceChildren();
for(const x of v?.replay_exceptions||[]){
const li=document.createElement('li');li.textContent=x.issue_code+
' · case '+(x.case_id||'unpaired history')+
' · source receipt #'+(x.reference_receipt_id||'unknown')+
' · '+(x.owner_reviewed?'OWNER INVESTIGATION RECORDED — EVIDENCE STILL HOLD':'REVIEW REQUIRED');
cases.appendChild(li);
}
if(!cases.childElementCount){const li=document.createElement('li');
li.textContent='No replay exception identified in the bounded current readback; external acceptance remains separately gated.';
cases.appendChild(li);}
const closures=$('dd690Closures');closures.replaceChildren();
for(const x of v?.closure_candidates||[]){
const li=document.createElement('li');li.textContent=x.case_id+
' · owner audit receipt #'+x.receipt_id+
' · '+(x.owner_reconciled?'OWNER RECONCILIATION RECORDED':'RECONCILIATION NOT RECORDED')+
' · '+x.status;
closures.appendChild(li);
}
if(!closures.childElementCount){const li=document.createElement('li');
li.textContent='No independently evidenced previous owner acceptance available.';
closures.appendChild(li);}
chooseCases690();
}
let audit691=null;
function chooseSources691(){
const select=$('dd691Source');if(!select)return;
select.replaceChildren(new Option('Choose an exact source receipt',''));
const action=$('dd691Decision')?.value,v=audit691;
if(!v?.history_complete)return;
if(action==='escalate_replay_aging'){
for(const x of v.replay_exception_aging||[]){
if(!x.reference_receipt_id||!x.case_id||x.escalation_recorded||
x.age_minutes===null||x.age_minutes<120)continue;
select.add(new Option('Aged '+x.age_minutes+' min · '+x.case_id+' · receipt #'+
x.reference_receipt_id,x.case_id+'|'+x.reference_receipt_id+'|0'));
}
}else if(action==='escalate_renewal_gap'){
for(const x of v.renewal?.gap_evidence||[]){
if(!x.source_pins_match||x.owner_escalation_recorded||x.gap_minutes<=20)continue;
select.add(new Option('Gap '+x.gap_minutes+' min · '+x.older_receipt_id+
' → '+x.newer_receipt_id,'|'+x.older_receipt_id+'|'+x.newer_receipt_id));
}
}else if(action==='accept_closure_continuity'&&v.master_accepted_now){
for(const x of v.owner_closure_evidence||[]){
if(!x.reference_receipt_id||!x.case_id||x.owner_continuity_accepted)continue;
select.add(new Option('Original owner closure · '+x.case_id+
' · receipt #'+x.reference_receipt_id,x.case_id+'|'+x.reference_receipt_id+'|0'));
}
}
}
function draw691(data){
if(!$('dd691-finance'))return;
const v=data.financial691||null;audit691=v;
$('dd691Status').textContent=v?.campaign_queue_id?
v.status+' · bounded evidence '+(v.history_complete?'COMPLETE':'HOLD')+
' · current Master '+(v.master_accepted_now?'INDEPENDENTLY REVERIFIED':'HOLD')+
' · live connection HOLD · financial certification HOLD':
'HOLD · Select and refresh a protected financial campaign.';
$('dd691Stats').textContent=v?.campaign_queue_id?
'Replay exceptions '+v.replay_exception_count+' · overdue '+v.overdue_count+
' · critical aging '+v.critical_aged_count+
' · awaiting owner aging escalation '+v.unreviewed_overdue_count+
' · accepted owner closures '+(v.closure_count-v.pending_owner_closure_acceptance)+
' / '+v.closure_count:'No bounded owner evidence yet.';
const rn=v?.renewal;
$('dd691Renewal').textContent=rn?
'Sampled '+(rn.sampled_at||'unknown')+' · '+rn.status+
' · seconds to signed receipt expiry '+(rn.seconds_to_expiry??'unknown')+
' · recorded gaps '+rn.gap_count+
' · pending owner gap review '+rn.unreviewed_gap_count+
' · historical signatures not reverified · gaps are not evidence of a runtime outage.':
'Historical independent Master receipt evidence HOLD.';
const put=(id,items,label)=>{
const list=$(id);list.replaceChildren();
for(const item of items||[]){const li=document.createElement('li');li.textContent=label(item);
list.appendChild(li);}
if(!list.childElementCount){const li=document.createElement('li');
li.textContent='No matching bounded evidence has been recorded for this category.';
list.appendChild(li);}
};
put('dd691Exceptions',v?.replay_exception_aging,x=>
x.age_status+' · '+x.issue_code+' · '+(x.case_id||'unpaired evidence')+
' · original receipt #'+(x.reference_receipt_id||'unknown')+
' · '+(x.age_minutes===null?'age unknown':x.age_minutes+' min')+
' · owner escalation '+(x.escalation_recorded?'RECORDED':'REQUIRED IF OVERDUE')+
' · evidence repair HOLD');
put('dd691Gaps',rn?.gap_evidence,x=>
'Recorded interval '+x.gap_minutes+' min · older receipt #'+x.older_receipt_id+
' · newer receipt #'+x.newer_receipt_id+' · source pin '+(x.source_pins_match?'MATCH':'HOLD')+
' · owner review '+(x.owner_escalation_recorded?'RECORDED':'PENDING')+
' · runtime outage not established');
put('dd691Closures',v?.owner_closure_evidence,x=>
x.case_id+' · prior owner closure #'+x.reference_receipt_id+
' · current Master '+(x.current_master_rechecked?'VERIFIED':'HOLD')+
' · owner continuity '+(x.owner_continuity_accepted?'RECORDED':'NOT RECORDED'));
chooseSources691();
}
let audit692=null;
function chooseSources692(){
const select=$('dd692Source');if(!select)return;
select.replaceChildren(new Option('Select matching exact evidence',''));
const action=$('dd692Decision')?.value,v=audit692;
if(!v?.history_complete)return;
if(action==='record_sla_followup'){
for(const x of v.sla?.followups||[]){
if(!x.escalation_receipt_id||!x.case_id||x.owner_followup_recorded||
x.elapsed_minutes===null||x.elapsed_minutes<120)continue;
select.add(new Option(x.sla_state+' · '+x.case_id+' · escalation receipt #'+x.escalation_receipt_id,
x.case_id+'|'+x.escalation_receipt_id+'|0'));
}
}else if(action==='review_master_provenance'){
for(const x of v.provenance?.historical_receipt_pairs||[]){
if(x.provenance_state!=='HISTORICAL_SOURCE_RECEIPT_PINS_MATCH_NOT_SIGNATURE_REVERIFIED'||
x.owner_provenance_reviewed)continue;
select.add(new Option('Recorded gap '+x.gap_minutes+' min · older #'+x.older_receipt_id+
' → newer #'+x.newer_receipt_id,'|'+x.older_receipt_id+'|'+x.newer_receipt_id));
}
}else if(action==='reconcile_closure_audit'&&v.master_accepted_now){
for(const x of v.closure?.evidence||[]){
if(!x.continuity_receipt_id||!x.case_id||x.owner_audit_reconciled||
!x.historical_owner_acceptance_recorded)continue;
select.add(new Option('Prior owner closure · '+x.case_id+' · continuity #'+x.continuity_receipt_id,
x.case_id+'|'+x.continuity_receipt_id+'|0'));
}
}
}
function draw692(data){
if(!$('dd692-finance'))return;
const v=data.financial692||null;audit692=v;
$('dd692Status').textContent=v?.campaign_queue_id?
v.status+' · owner history '+(v.history_complete?'COMPLETE':'HOLD')+
' · current independently signed Master '+(v.master_accepted_now?'VERIFIED':'HOLD')+
' · live connection HOLD · certified profitability HOLD':
'HOLD · Select a financial campaign and refresh protected source evidence.';
$('dd692Stats').textContent=v?.campaign_queue_id?
'SLA follow-ups '+v.sla.followup_count+' · due soon '+v.sla.due_soon_count+
' · overdue '+v.sla.overdue_count+' · critical '+v.sla.critical_count+
' · unreviewed overdue '+v.sla.unreviewed_overdue_count+
' · prior owner closure audit '+v.closure.owner_audit_reconciled_count+
' / '+v.closure.record_count:
'No source-pinned owner audit history available.';
const p=v?.provenance;
$('dd692Provenance').textContent=p?
'Currently verified signed Master #'+(p.current_exact_master_receipt_id||'—')+
' · historical source-pinned receipts '+p.historical_source_receipt_count+
' · recorded gaps '+p.recorded_gap_count+
' · unreviewed pair provenance '+p.pending_owner_provenance_count+
' · source HOLD '+p.source_provenance_hold_count+
' · historical signatures NOT reverified · recorded gaps are not receiver-outage proof.':
'Independent current Master evidence HOLD.';
const place=(id,items,render)=>{
const target=$(id);target.replaceChildren();
for(const x of items||[]){const li=document.createElement('li');li.textContent=render(x);
target.appendChild(li);}
if(!target.childElementCount){const li=document.createElement('li');
li.textContent='No matching bounded owner evidence recorded here.';target.appendChild(li);}
};
place('dd692Followups',v?.sla?.followups,x=>
x.sla_state+' · '+(x.case_id||'unpaired case')+
' · escalation receipt #'+x.escalation_receipt_id+
' · elapsed '+(x.elapsed_minutes??'unknown')+' minutes'+
' · owner follow-up '+(x.owner_followup_recorded?'RECORDED':'PENDING')+
' · original evidence remains HOLD if not independently repaired');
place('dd692Pairs',p?.historical_receipt_pairs,x=>
x.provenance_state+' · original receipt #'+x.older_receipt_id+
' · next receipt #'+x.newer_receipt_id+
' · recorded interval '+x.gap_minutes+' minutes'+
' · owner provenance review '+(x.owner_provenance_reviewed?'RECORDED':'PENDING'));
place('dd692Closures',v?.closure?.evidence,x=>
(x.case_id||'unknown')+' · prior owner continuity #'+(x.continuity_receipt_id||'missing')+
' · current Master '+(x.master_currently_reverified?'VERIFIED':'HOLD')+
' · 692 audit '+(x.owner_audit_reconciled?'RECORDED':'NOT RECORDED'));
chooseSources692();
}
let audit693=null;
function chooseSources693(){
const select=$('dd693Source');if(!select)return;
select.replaceChildren(new Option('Choose exact source evidence',''));
const action=$('dd693Decision')?.value,v=audit693;
if(!v?.history_complete)return;
if(action==='repeat_sla_followup'){
for(const x of v.followups?.items||[]){
if(!x.followup_receipt_id||!x.case_id||x.repeat_followup_recorded||
x.age_minutes===null||x.age_minutes<120)continue;
select.add(new Option(x.age_status+' · '+x.case_id+
' · prior follow-up #'+x.followup_receipt_id,
x.case_id+'|'+x.followup_receipt_id+'|0'));
}
}else if(action==='review_provenance_exception'){
for(const x of v.provenance?.pairs||[]){
if(x.source_pins_match||x.exception_review_recorded)continue;
select.add(new Option('HOLD source pins · pair #'+x.older_receipt_id+
' → #'+x.newer_receipt_id,'|'+x.older_receipt_id+'|'+x.newer_receipt_id));
}
}else if(action==='revalidate_master_provenance'&&v.provenance?.current_master_independently_reverified){
for(const x of v.provenance?.pairs||[]){
if(!x.source_pins_match||!x.previous_owner_receipt_id||x.revalidation_recorded)continue;
select.add(new Option('Current-source recheck · pair #'+x.older_receipt_id+
' → #'+x.newer_receipt_id,'|'+x.older_receipt_id+'|'+x.newer_receipt_id));
}
}else if(action==='accept_owner_audit_history'&&v.master_accepted_now){
for(const x of v.audit?.history||[]){
if(!x.case_id||!x.prior_owner_audit_receipt_id||x.owner_acceptance_recorded)continue;
select.add(new Option('Prior audit · '+x.case_id+
' · receipt #'+x.prior_owner_audit_receipt_id,
x.case_id+'|'+x.prior_owner_audit_receipt_id+'|0'));
}
}
}
function draw693(d){
if(!$('dd693-finance'))return;
const v=d.financial693||null;audit693=v;
$('dd693Status').textContent=v?.campaign_queue_id?
v.status+' · bounded owner ledger '+(v.history_complete?'COMPLETE':'HOLD')+
' · current independently signed Master '+(v.master_accepted_now?'VERIFIED':'HOLD')+
' · continuous connection HOLD · audited profitability HOLD':
'HOLD · Select an exact financial campaign and refresh protected evidence.';
$('dd693Stats').textContent=v?.campaign_queue_id?
'Follow-ups '+v.followups.record_count+' · overdue '+v.followups.overdue_count+
' · critical '+v.followups.critical_count+
' · pending overdue '+v.followups.pending_overdue_count+
' · source exceptions '+v.provenance.source_exception_count+
' · owner audit acceptances '+v.audit.owner_accepted_count+' / '+v.audit.prior_acceptance_count:
'Financial owner audit history unavailable.';
const pr=v?.provenance;
$('dd693Provenance').textContent=pr?
'Current signed Master #'+(pr.current_master_receipt_id||'—')+
' · independent current verification '+(pr.current_master_independently_reverified?'YES':'HOLD')+
' · historical pairs '+pr.historical_pair_count+
' · pending provenance rechecks '+pr.pending_owner_revalidation_count+
' · unresolved source mismatches '+pr.source_exception_count+
' · historical signatures not reverified; no runtime outage or continuous connection proof.':
'Current independent Master acceptance unavailable.';
const render=(id,items,fn)=>{
const list=$(id);list.replaceChildren();
for(const x of items||[]){const li=document.createElement('li');li.textContent=fn(x);
list.appendChild(li);}
if(!list.childElementCount){const li=document.createElement('li');
li.textContent='No matching evidence in the current bounded audit window.';
list.appendChild(li);}
};
render('dd693Followups',v?.followups?.items,x=>
x.age_status+' · '+x.case_id+' · prior owner follow-up #'+x.followup_receipt_id+
' · age '+(x.age_minutes??'unknown')+' minutes'+
' · next owner review '+(x.repeat_followup_recorded?'RECORDED':'PENDING')+
' · underlying financial issue remains evidence-gated');
render('dd693Pairs',pr?.pairs,x=>
x.revalidation_state+' · older #'+x.older_receipt_id+
' / newer #'+x.newer_receipt_id+
' · previous owner #'+(x.previous_owner_receipt_id||'—')+
' · exception review '+(x.exception_review_recorded?'RECORDED':'PENDING')+
' · new provenance review '+(x.revalidation_recorded?'RECORDED':'PENDING'));
render('dd693Acceptance',v?.audit?.history,x=>
x.case_id+' · prior audit #'+x.prior_owner_audit_receipt_id+
' · original continuity #'+x.original_continuity_receipt_id+
' · current independently signed Master '+(x.current_signed_master_rechecked?'VERIFIED':'HOLD')+
' · owner acceptance '+(x.owner_acceptance_recorded?'RECORDED':'NOT RECORDED'));
chooseSources693();
}
let audit694=null;
function chooseSources694(){
const select=$('dd694Source');if(!select)return;
select.replaceChildren(new Option('Select exact source-bound evidence',''));
const decision=$('dd694Decision')?.value,v=audit694;
if(!v?.history_complete||!v?.master_accepted_now)return;
if(decision==='record_sla_resolution'){
for(const x of v.resolution?.items||[]){
if(!x.case_id||!x.recheck_receipt_id||!x.eligible_for_owner_resolution||
x.owner_resolution_recorded)continue;
select.add(new Option('Review '+x.case_id+' · SLA recheck #'+x.recheck_receipt_id,
x.case_id+'|'+x.recheck_receipt_id+'|0'));
}
}else if(decision==='close_revalidated_provenance'){
for(const x of v.provenance?.pairs||[]){
if(!x.eligible_for_owner_provenance_closure||x.owner_provenance_closure_recorded)continue;
select.add(new Option('Original source-pinned receipts #'+x.older_receipt_id+
' → #'+x.newer_receipt_id,'|'+x.older_receipt_id+'|'+x.newer_receipt_id));
}
}else if(decision==='accept_owner_continuity'){
for(const x of v.owner_audit?.history||[]){
if(!x.case_id||!x.owner_acceptance_receipt_id||!x.historically_accepted||
x.continuity_acknowledged)continue;
select.add(new Option('Audit '+x.case_id+' · owner receipt #'+x.owner_acceptance_receipt_id,
x.case_id+'|'+x.owner_acceptance_receipt_id+'|0'));
}
}
}
function draw694(d){
if(!$('dd694-finance'))return;
const v=d.financial694||null;audit694=v;
$('dd694Status').textContent=v?.campaign_queue_id?
v.status+' · bounded owner ledger '+(v.history_complete?'COMPLETE':'HOLD')+
' · current independently signed Master '+(v.master_accepted_now?'VERIFIED':'HOLD')+
' · continuous connection HOLD · certified financial results HOLD':
'HOLD · Select an exact campaign and refresh its original financial source evidence.';
$('dd694Stats').textContent=v?.campaign_queue_id?
'Source-bound SLA owner cases '+v.resolution.record_count+
' · pending owner resolutions '+v.resolution.pending_owner_resolution_count+
' · recorded owner reviews '+v.resolution.owner_resolved_count+
' · unresolved Master source mismatches '+v.provenance.source_exception_hold_count+
' · owner continuity '+v.owner_audit.owner_continuity_recorded_count+
' / '+v.owner_audit.historical_acceptance_count:
'Original signed owner resolution data unavailable.';
const prov=v?.provenance;
$('dd694Provenance').textContent=prov?
'Current independently verified Master receipt #'+(prov.current_independent_master_receipt_id||'—')+
' · signed proof '+(prov.current_independently_verified?'CURRENT':'HOLD')+
' · historical pinned entries '+prov.source_pinned_historical_receipt_count+
' · eligible source-pinned owner closure reviews '+prov.eligible_owner_closure_count+
' · pending '+prov.pending_owner_closure_count+
' · source mismatches '+prov.source_exception_hold_count+
' · historical signatures not reverified; mismatches cannot be auto-closed.':
'Independent Master provenance evidence not available.';
const render=(id,items,fn)=>{
const target=$(id);target.replaceChildren();
for(const x of items||[]){const item=document.createElement('li');item.textContent=fn(x);
target.appendChild(item);}
if(!target.childElementCount){const li=document.createElement('li');
li.textContent='No source-bound evidence in the current bounded history.';target.appendChild(li);}
};
render('dd694Resolution',v?.resolution?.items,x=>
x.case_id+' · prior SLA follow-up #'+x.followup_receipt_id+
' · exact owner recheck #'+(x.recheck_receipt_id||'missing')+
' · linked accepted audit #'+(x.linked_owner_acceptance_receipt_id||'missing')+
' · '+(x.eligible_for_owner_resolution?'OWNER REVIEW ELIGIBLE':'HOLD SOURCE OR OWNER ACCEPTANCE')+
' · recorded '+(x.owner_resolution_recorded?'YES':'NO')+
' · external remediation not proven');
render('dd694Pairs',prov?.pairs,x=>
x.status+' · original receipt #'+x.older_receipt_id+
' / next receipt #'+x.newer_receipt_id+
' · prior independent recheck #'+(x.review_receipt_id||'missing')+
' · eligible '+(x.eligible_for_owner_provenance_closure?'YES':'NO')+
' · owner closure review '+(x.owner_provenance_closure_recorded?'RECORDED':'PENDING')+
' · original incident repair not proven');
render('dd694Acceptance',v?.owner_audit?.history,x=>
x.case_id+' · original audit #'+x.prior_owner_audit_receipt_id+
' · signed owner acceptance #'+(x.owner_acceptance_receipt_id||'missing')+
' · current signed proof '+(x.current_independent_master_rechecked?'VERIFIED':'HOLD')+
' · continuity '+(x.continuity_acknowledged?'RECORDED':'PENDING'));
chooseSources694();
}
let audit695=null;
function chooseSources695(){
const s=$('dd695Source');if(!s)return;
s.replaceChildren(new Option('Choose original source receipt pair',''));
const correction=$('dd695Decision').value==='intake_source_correction',v=audit695;
for(const id of ['dd695Custodian','dd695Reference','dd695Digest','dd695Observed'])
$(id).required=correction;
if(!v?.history_complete)return;
for(const x of (correction?v.source_correction?.items:v.master_closure?.items)||[]){
if(!correction&&(!x.eligible_for_master_revalidation||x.revalidated_for_current_master))continue;
s.add(new Option('Original #'+x.older_receipt_id+' / #'+x.newer_receipt_id+
(correction?' · mismatch · HOLD':' · prior closure #'+x.original_owner_closure_receipt_id),
x.older_receipt_id+'|'+x.newer_receipt_id+'|'+(x.original_owner_closure_receipt_id||0)));
}
}
function draw695(d){
if(!$('dd695-finance'))return;
const v=d.financial695||null;audit695=v;
$('dd695Status').textContent=v?.campaign_queue_id?
v.status+' · bounded history '+(v.history_complete?'COMPLETE':'HOLD')+
' · current Master '+(v.master_accepted_now?'SIGNED / ACCEPTED':'HOLD')+
' · external correction unverified · continuous connection HOLD':
'HOLD · Select and refresh an original financial campaign.';
$('dd695Stats').textContent=v?.campaign_queue_id?
'Follow-up due '+v.aging.due_count+' · critical '+v.aging.critical_count+
' · mismatched source pairs '+v.source_correction.mismatch_count+
' · unverified external references '+v.source_correction.evidence_intake_count+
' · current Master revalidations pending '+v.master_closure.pending_count:
'Original source-bound financial owner history unavailable.';
function render(id,items,fn){
const ul=$(id);ul.replaceChildren();
for(const x of items||[]){const li=document.createElement('li');li.textContent=fn(x);ul.appendChild(li);}
if(!ul.childElementCount){const li=document.createElement('li');li.textContent='No source-bound entries in bounded history.';ul.appendChild(li);}
}
render('dd695Aging',v?.aging?.items,x=>x.case_id+
' · original owner recheck #'+(x.source_recheck_receipt_id||'—')+
' · owner resolution #'+(x.owner_resolution_receipt_id||'—')+
' · age '+(x.age_minutes??'unknown')+' min · '+
(x.owner_followup_critical?'CRITICAL OWNER REVIEW':x.owner_followup_due?'OWNER REVIEW DUE':'MONITOR')+
' · underlying repair not proven');
render('dd695Correction',v?.source_correction?.items,x=>
'Original #'+x.older_receipt_id+' / #'+x.newer_receipt_id+
' · source mismatch HOLD · correction not independently verified');
render('dd695Master',v?.master_closure?.items,x=>
'Original #'+x.older_receipt_id+' / #'+x.newer_receipt_id+
' · prior owner closure #'+(x.original_owner_closure_receipt_id||'—')+
' · '+(x.revalidated_for_current_master?'OWNER REVALIDATION RECORDED':x.eligible_for_master_revalidation?'REVALIDATION REQUIRED':'SOURCE/MASTER HOLD'));
chooseSources695();
}

let audit696=null;
function chooseSources696(){
const el=$('dd696Source');if(!el)return;
el.replaceChildren(new Option('Choose original source-bound record',''));
const kind=$('dd696Decision').value,v=audit696;
for(const id of ['dd696Signer','dd696Nonce','dd696Issued','dd696Signature'])
$(id).required=kind==='verify_correction_attestation';
$('dd696Prepare').disabled=kind!=='verify_correction_attestation';
if(!v?.history_complete)return;
if(kind==='verify_correction_attestation'){
const mismatch=new Set((v.source_verification?.original_mismatch_items||[]).map(x=>x.older_receipt_id+'|'+x.newer_receipt_id));
for(const x of v.source_verification?.unverified_intakes||[]){
if(!mismatch.has(x.older_receipt_id+'|'+x.newer_receipt_id))continue;
el.add(new Option('Independent intake #'+x.receipt_id+' · original #'+x.older_receipt_id+
' / #'+x.newer_receipt_id+' · '+x.external_custodian_id,
x.older_receipt_id+'|'+x.newer_receipt_id+'|'+x.receipt_id+'|'));
}
}else if(kind==='escalate_aging_followup'){
for(const x of v.aging?.items||[]){
if(x.escalation_recorded||!(x.age_minutes>=120))continue;
el.add(new Option(x.case_id+' · owner case #'+x.original_resolution_receipt_id+
' · age '+x.age_minutes+' min',
x.original_resolution_receipt_id+'|0|0|'+x.case_id));
}
}else if(kind==='recheck_master_continuity'){
for(const x of v.master_closure?.items||[]){
if(!x.eligible_for_continuity||x.current_master_continuity_recorded)continue;
el.add(new Option('Prior signed Master closure #'+x.prior_master_revalidation_receipt_id+
' · original #'+x.older_receipt_id+' / #'+x.newer_receipt_id,
x.older_receipt_id+'|'+x.newer_receipt_id+'|'+x.prior_master_revalidation_receipt_id+'|'));
}
}
}
function claimFor696(){
if($('dd696Decision').value!=='verify_correction_attestation')
throw Error('Select the independently signed correction intake decision.');
if(!state?.queue_id||!audit696?.history_complete)
throw Error('Refresh original source/custodian evidence first.');
const [refStr,newerStr,intakeStr]=$('dd696Source').value.split('|');
const ref=Number(refStr),newer=Number(newerStr),intakeId=Number(intakeStr),
source=(audit696.source_verification?.unverified_intakes||[]).find(x=>x.receipt_id===intakeId&&
x.older_receipt_id===ref&&x.newer_receipt_id===newer);
if(!source)throw Error('Choose original source-bound correction evidence.');
const signer=$('dd696Signer').value.trim(),nonce=$('dd696Nonce').value.trim(),
issued=$('dd696Issued').value.trim();
if(!/^[A-Za-z0-9_-]{16,100}$/.test(nonce)||!signer||!issued)
throw Error('Enter independent signer ID, one-time nonce, and signed UTC issue timestamp.');
if(signer!==audit696.source_verification.expected_signer_id)
throw Error('Configured independent signer ID does not match. HOLD.');
return{v:1,purpose:'devilndove_finance_correction_attestation_696',source:'devilndove',
queue_id:state.queue_id,reference_receipt_id:ref,newer_receipt_id:newer,
original_intake_receipt_id:intakeId,
external_evidence_sha256:source.external_evidence_sha256,
external_custodian_id:source.external_custodian_id,
fingerprint_sha256:state.fingerprint_sha256,source_revision:state.source_revision,
signer_id:signer,nonce,issued_at:issued,
decision:'source_correction_evidence_authenticated'};
}
function draw696(d){
if(!$('dd696-finance'))return;
const v=d.financial696||null;audit696=v;
$('dd696Status').textContent=v?.campaign_queue_id?
v.status+' · bounded history '+(v.history_complete?'COMPLETE':'HOLD')+
' · current signed Master '+(v.master_accepted_now?'VERIFIED':'HOLD')+
' · original source mismatch '+(v.source_mismatch_cleared?'CLEARED':'HOLD')+
' · continuous connection HOLD · audited finance HOLD':
'HOLD · Choose and refresh exact financial source campaign.';
$('dd696Stats').textContent=v?.campaign_queue_id?
'Original source mismatches '+v.source_verification.original_mismatch_count+
' · independently signed custodian attestations '+v.source_verification.authenticated_custodian_signature_count+
' · signer '+(v.source_verification.signer_configured?'CONFIGURED':'HOLD')+
' · owner aging escalations pending '+v.aging.pending_escalation_count+
' · Master continuity pending '+v.master_closure.pending_continuity_count:
'Independent correction evidence not available.';
function render(id,items,fn){
const el=$(id);el.replaceChildren();
for(const x of items||[]){const li=document.createElement('li');li.textContent=fn(x);el.appendChild(li);}
if(!el.childElementCount){const li=document.createElement('li');
li.textContent='No exact-source entries in bounded history.';el.appendChild(li);}
}
render('dd696Corrections',v?.source_verification?.original_mismatch_items,x=>
'Original #'+x.older_receipt_id+' / #'+x.newer_receipt_id+
' · correction evidence can be signed by independent custodian; source mismatch remains HOLD');
render('dd696Aging',v?.aging?.items,x=>
x.case_id+' · resolution #'+x.original_resolution_receipt_id+
' · '+x.age_minutes+' min'+(x.critical?' CRITICAL':' FOLLOW-UP')+
' · owner escalation '+(x.escalation_recorded?'RECORDED #'+x.owner_escalation_receipt_id:'PENDING')+
' · original financial remediation not proven');
render('dd696Master',v?.master_closure?.items,x=>
'Original #'+x.older_receipt_id+' / #'+x.newer_receipt_id+
' · prior signed revalidation #'+(x.prior_master_revalidation_receipt_id||'—')+
' · continuity '+(x.current_master_continuity_recorded?'RECORDED':'SOURCE/MASTER HOLD'));
chooseSources696();
}

let audit697=null;
function chooseSources697(){
const select=$('dd697Source');if(!select)return;
select.replaceChildren(new Option('Choose source-bound prior receipt',''));
const kind=$('dd697Decision').value,v=audit697,
signed=kind==='reconcile_correction_evidence';
for(const id of ['dd697Signer','dd697Nonce','dd697Issued','dd697Signature'])
$(id).required=signed;
$('dd697Prepare').disabled=!signed;
$('dd697Disposition').disabled=kind!=='review_escalation_resolution';
$('dd697Claim').value='';
if(!v?.history_complete)return;
if(signed){
for(const x of v.reconciliation?.items||[]){
if(x.independent_reconciliation_recorded)continue;
select.add(new Option('Custodian #'+x.custodian_attestation_receipt_id+
' · original source #'+x.older_receipt_id+' / #'+x.newer_receipt_id,
x.older_receipt_id+'|'+x.newer_receipt_id+'|'+x.custodian_attestation_receipt_id+'|'));
}
}else if(kind==='review_escalation_resolution'){
for(const x of v.aging?.items||[]){
if(x.owner_review_recorded)continue;
select.add(new Option(x.case_id+' · prior owner escalation #'+x.escalation_receipt_id,
x.original_resolution_receipt_id+'|0|'+x.escalation_receipt_id+'|'+x.case_id));
}
}else if(kind==='renew_master_attestation'){
for(const x of v.master?.items||[]){
if(!x.eligible_for_renewal||x.renewal_review_recorded)continue;
select.add(new Option('Signed Master continuity #'+x.prior_continuity_receipt_id+
' · original source #'+x.older_receipt_id+' / #'+x.newer_receipt_id,
x.older_receipt_id+'|'+x.newer_receipt_id+'|'+x.prior_continuity_receipt_id+'|'));
}
}
}
function claimFor697(){
if(!state?.queue_id||!audit697?.history_complete||
$('dd697Decision').value!=='reconcile_correction_evidence')
throw Error('Select exact current signed custodian reconciliation evidence.');
const [refStr,newerStr,priorStr]=$('dd697Source').value.split('|');
const ref=Number(refStr),newer=Number(newerStr),prior=Number(priorStr);
const item=(audit697.reconciliation?.items||[]).find(x=>
x.older_receipt_id===ref&&x.newer_receipt_id===newer&&
x.custodian_attestation_receipt_id===prior&&!x.independent_reconciliation_recorded);
const signer=$('dd697Signer').value.trim(),nonce=$('dd697Nonce').value.trim(),
issued=$('dd697Issued').value.trim();
if(!item||!audit697.reconciliation.signer_configured||
signer!==audit697.reconciliation.expected_reconciler_id||
!/^[A-Za-z0-9_-]{16,100}$/.test(nonce)||!issued)
throw Error('Original authenticated custodian receipt and distinct independent reconciler signer configuration required. HOLD.');
return{v:1,purpose:'devilndove_finance_independent_reconciliation_697',source:'devilndove',
queue_id:state.queue_id,older_receipt_id:ref,newer_receipt_id:newer,
custodian_attestation_receipt_id:prior,
fingerprint_sha256:state.fingerprint_sha256,source_revision:state.source_revision,
reconciler_id:signer,nonce,issued_at:issued,
decision:'evidence_pair_reconciled_not_source_repair'};
}
function draw697(d){
if(!$('dd697-finance'))return;
const v=d.financial697||null;audit697=v;
$('dd697Status').textContent=v?.campaign_queue_id?
v.status+' · bounded evidence '+(v.history_complete?'COMPLETE':'HOLD')+
' · source repair HOLD · independently current Master '+(v.master_accepted_now?'VERIFIED':'HOLD')+
' · audited financials and continuous connection HOLD':
'HOLD · Choose and refresh exact financial campaign.';
$('dd697Stats').textContent=v?.campaign_queue_id?
'Original mismatches '+v.reconciliation.original_mismatch_count+
' · two-party signed reconciliations '+v.reconciliation.independently_reconciled_count+
' · distinct reconciler '+(v.reconciliation.signer_configured?'CONFIGURED':'HOLD')+
' · owner escalation reviews pending '+v.aging.pending_resolution_review_count+
' · signed Master renewal reviews pending '+v.master.pending_renewal_review_count:
'Original Build 697 source-bound evidence unavailable.';
function render(id,items,fn){
const el=$(id);el.replaceChildren();
for(const x of items||[]){const li=document.createElement('li');li.textContent=fn(x);el.appendChild(li);}
if(!el.childElementCount){const li=document.createElement('li');li.textContent='No eligible original evidence in bounded history.';el.appendChild(li);}
}
render('dd697Corrections',v?.reconciliation?.items,x=>
'Custodian #'+x.custodian_attestation_receipt_id+' · original #'+x.older_receipt_id+
' / #'+x.newer_receipt_id+' · second-party reconciliation '+
(x.independent_reconciliation_recorded?'AUTHENTICATED #'+x.reconciliation_receipt_id:'PENDING')+
' · source repair HOLD');
render('dd697Aging',v?.aging?.items,x=>
x.case_id+' · escalation #'+x.escalation_receipt_id+
' · owner resolution review '+(x.owner_review_recorded?'RECORDED #'+x.owner_review_receipt_id:'PENDING')+
' · external incident remediation HOLD');
render('dd697Master',v?.master?.items,x=>
'Original #'+x.older_receipt_id+' / #'+x.newer_receipt_id+
' · prior continuity #'+(x.prior_continuity_receipt_id||'—')+
' · renewal '+(x.renewal_review_recorded?'OWNER REVIEW RECORDED':'SOURCE/MASTER HOLD')+
' · no new external signature inferred');
chooseSources697();
}

let audit698=null;
function chooseSources698(){
const el=$('dd698Source');if(!el)return;
el.replaceChildren(new Option('Select original source-bound receipt',''));
const decision=$('dd698Decision').value,v=audit698,
intake=decision==='intake_source_repair_proof';
for(const id of ['dd698Reference','dd698Digest','dd698Observed'])
$(id).required=intake;
$('dd698Disposition').disabled=decision!=='record_escalation_recovery';
if(!v?.history_complete)return;
if(intake){
for(const x of v.source_repair?.items||[]){
if(x.repair_proof_intake_recorded)continue;
el.add(new Option('Signed reconciliation #'+x.reconciliation_receipt_id+
' · original #'+x.older_receipt_id+' / #'+x.newer_receipt_id,
x.older_receipt_id+'|'+x.newer_receipt_id+'|'+x.reconciliation_receipt_id+'|'));
}
}else if(decision==='record_escalation_recovery'){
for(const x of v.recovery?.items||[]){
if(x.recovery_followup_recorded)continue;
el.add(new Option(x.case_id+' · original owner review #'+x.owner_review_receipt_id,
x.original_resolution_receipt_id+'|0|'+x.owner_review_receipt_id+'|'+x.case_id));
}
}else if(decision==='record_master_drift'){
for(const x of v.master?.items||[]){
if(x.drift_review_recorded)continue;
el.add(new Option('Master renewal #'+x.renewal_receipt_id+
' · original #'+x.older_receipt_id+' / #'+x.newer_receipt_id,
x.older_receipt_id+'|'+x.newer_receipt_id+'|'+x.renewal_receipt_id+'|'));
}
}
}
function draw698(d){
if(!$('dd698-finance'))return;
const v=d.financial698||null;audit698=v;
$('dd698Status').textContent=v?.campaign_queue_id?
v.status+' · original owner history '+(v.history_complete?'COMPLETE':'HOLD')+
' · current Master drift '+(v.master.drift_detected?'DETECTED/HOLD':'NOT DETECTED')+
' · source repair and financial certification HOLD':
'HOLD · Select and refresh original financial campaign.';
$('dd698Stats').textContent=v?.campaign_queue_id?
'Original mismatches '+v.source_repair.original_mismatch_count+
' · source repair proof intakes pending '+v.source_repair.pending_intake_count+
' · owner recovery follow-ups pending '+v.recovery.pending_followup_count+
' · Master renewal drift reviews pending '+v.master.pending_drift_review_count:
'Original source-bound financial evidence unavailable.';
function render(id,items,format){
const el=$(id);el.replaceChildren();
for(const x of items||[]){const li=document.createElement('li');li.textContent=format(x);el.appendChild(li);}
if(!el.childElementCount){const li=document.createElement('li');li.textContent='No eligible source-bound entries.';el.appendChild(li);}
}
render('dd698Sources',v?.source_repair?.items,x=>
'Original #'+x.older_receipt_id+' / #'+x.newer_receipt_id+
' · independent reconciliation #'+x.reconciliation_receipt_id+
' · external document '+(x.repair_proof_intake_recorded?'INTAKE #'+x.repair_proof_receipt_id:'NOT INTAKEN')+
' · original source repair HOLD');
render('dd698Recovery',v?.recovery?.items,x=>
x.case_id+' · original escalation #'+x.escalation_receipt_id+
' · owner review #'+x.owner_review_receipt_id+
' · recovery follow-up '+(x.recovery_followup_recorded?'RECORDED #'+x.recovery_receipt_id:'PENDING')+
' · independent external remediation HOLD');
render('dd698Master',v?.master?.items,x=>
'Renewal #'+x.renewal_receipt_id+' · previous owner continuity #'+x.prior_continuity_receipt_id+
' · current Master #'+(v?.master?.observed_master_receipt_id||'missing')+
' · drift '+(v.master.drift_detected?'DETECTED':'NOT DETECTED')+
' · owner drift review '+(x.drift_review_recorded?'RECORDED':'PENDING')+
' · no new independent signature inferred');
chooseSources698();
}

let audit699=null;
function select699(){
const el=$('dd699Source');if(!el)return;
el.replaceChildren(new Option('Choose original source repair proof intake',''));
if(!audit699?.history_complete)return;
for(const x of audit699.independent_verification?.items||[]){
if(x.independent_document_signature_verified||!x.external_document_sha256)continue;
el.add(new Option('Original intake #'+x.repair_intake_receipt_id+
' · source #'+x.older_receipt_id+' / #'+x.newer_receipt_id,
x.older_receipt_id+'|'+x.newer_receipt_id+'|'+x.repair_intake_receipt_id));
}
}
function claimFor699(){
if(!state?.queue_id||!audit699?.history_complete)
throw Error('Refresh exact current financial campaign first.');
const [a,b,c]=$('dd699Source').value.split('|').map(Number);
const x=(audit699.independent_verification?.items||[]).find(item=>
item.older_receipt_id===a&&item.newer_receipt_id===b&&
item.repair_intake_receipt_id===c&&!item.independent_document_signature_verified);
const signer=$('dd699Signer').value.trim(),nonce=$('dd699Nonce').value.trim(),
issued=$('dd699Issued').value.trim();
if(!x||!x.external_document_sha256||!audit699.independent_verification.signer_configured||
signer!==audit699.independent_verification.expected_verifier_id||
!/^[A-Za-z0-9_-]{16,100}$/.test(nonce)||!issued)
throw Error('Exact Build 698 intake and configured third-party verifier required. HOLD.');
return{v:1,purpose:'devilndove_independent_source_repair_document_witness_699',
source:'devilndove',queue_id:state.queue_id,
older_receipt_id:a,newer_receipt_id:b,repair_intake_receipt_id:c,
external_document_sha256:x.external_document_sha256,external_reference:x.external_reference,
source_revision:state.source_revision,fingerprint_sha256:state.fingerprint_sha256,
independent_verifier_id:signer,nonce,issued_at:issued,
decision:'document_provenance_authenticated_live_source_repair_unverified'};
}
function draw699(d){
if(!$('dd699-finance'))return;
audit699=d.financial699||null;const v=audit699;
$('dd699Status').textContent=v?.campaign_queue_id?
v.status+' · original bounded history '+(v.history_complete?'COMPLETE':'HOLD')+
' · live source repair HOLD · financial certification HOLD':
'HOLD · Select current original financial campaign.';
$('dd699Stats').textContent=v?.campaign_queue_id?
'Original mismatches '+v.independent_verification.original_mismatch_count+
' · repair document intake '+v.independent_verification.document_intake_count+
' · independent signed document '+v.independent_verification.independently_signed_document_count+
' · pending signatures '+v.independent_verification.pending_signature_count+
' · distinct verifier '+(v.independent_verification.signer_configured?'CONFIGURED':'HOLD')+
' · source readback verified '+v.independent_verification.source_readback_verified_count:
'Original independently signed document evidence not loaded.';
const list=$('dd699Cases');list.replaceChildren();
for(const x of v?.independent_verification?.items||[]){
const li=document.createElement('li');
li.textContent='Original intake #'+x.repair_intake_receipt_id+' · source #'+
x.older_receipt_id+' / #'+x.newer_receipt_id+' · SHA-256 '+
(x.external_document_sha256||'not available')+
' · distinct verifier signature '+(x.independent_document_signature_verified?
'VERIFIED #'+x.independent_witness_receipt_id:'PENDING')+
' · live repair source readback HOLD';
list.appendChild(li);
}
if(!list.childElementCount){const li=document.createElement('li');li.textContent='No exact original source repair intake in complete bounded history.';list.appendChild(li);}
select699();
}









 let audit710=null;
 function draw710(data){
  if(!$('dd710-finance'))return;
  const v=data.financial710||null;audit710=v;
  $('dd710FinanceStatus').textContent=v?.campaign_queue_id?
    v.status+' · exact original source history '+(v.history_complete?'VERIFIED':'HOLD')+
    ' · actual book closure HOLD':
    'HOLD · Select exact original financial campaign and refresh.';
  $('dd710FinanceStats').textContent=v?.campaign_queue_id?
    'Original escalations '+v.eligible_count+' · overdue follow-ups due '+
    v.due_followup_count+' · follow-up receipts '+v.completed_followup_count+
    ' · verified ninth provenance '+v.provenance_audited_count+' · invalid '+v.invalid_count:
    'Requires original signed ninth-reviewer evidence and 709 custody escalation.';
  const follow=$('dd710FollowupSource'),provenance=$('dd710ProvenanceSource'),
    list=$('dd710FinanceCases');
  follow.replaceChildren(new Option('Select original overdue owner custody escalation',''));
  provenance.replaceChildren(new Option('Select verified original owner follow-up',''));
  list.replaceChildren();
  for(const x of v?.items||[]){
    const age=x.followup_710_age;
    const li=document.createElement('li');
    li.textContent='Original escalation #'+x.custody_exception_escalation_receipt_id_709+
      ' / ninth signed #'+x.review_706_receipt_id+
      ' / original 708 custody #'+(x.custody_708_receipt_id||'HOLD')+
      ' · '+age.status+' ('+(age.age_hours??'unknown')+'h)'+
      ' · owner follow-up '+(x.followup_710_verified?'VERIFIED #'+x.followup_710_receipt_id:'HOLD')+
      ' · ninth source '+(x.provenance_710_verified?'SHA VERIFIED #'+x.provenance_710_receipt_id:'HOLD')+
      ' · external notice/book close HOLD';
    list.appendChild(li);
    if(v.history_complete&&x.followup_710_due&&!x.followup_710_verified)
      follow.add(new Option('Original 709 escalation #'+x.custody_exception_escalation_receipt_id_709+
        ' · '+age.age_hours+'h',String(x.custody_exception_escalation_receipt_id_709)));
    if(v.history_complete&&x.followup_710_verified&&!x.provenance_710_verified)
      provenance.add(new Option('Original follow-up #'+x.followup_710_receipt_id+
        ' / ninth signed #'+x.review_706_receipt_id,String(x.followup_710_receipt_id)));
  }
  if(!list.childElementCount){const li=document.createElement('li');
   li.textContent='No original Build 709 owner custody escalation eligible for overdue follow-up.';
   list.appendChild(li);}
 }
 let audit709=null;
 function draw709(data){
  if(!$('dd709-finance'))return;
  const v=data.financial709||null;audit709=v;
  $('dd709FinanceStatus').textContent=v?.campaign_queue_id?
   v.status+' · original source history '+(v.history_complete?'VERIFIED':'HOLD')+
   ' · bookkeeping closed FALSE':
   'HOLD · Reinspect exact original owner financial campaign.';
  $('dd709FinanceStats').textContent=v?.campaign_queue_id?
   'Eligible renewals '+v.eligible_count+' · due '+v.escalation_due_count+
   ' · critical 72h '+v.critical_72h_count+
   ' · owner escalation receipts '+v.escalated_count+' · invalid '+v.invalid_count:
   'Original Build 708 reviewer continuity must exist before aging.';
  const list=$('dd709FinanceCases'),sel=$('dd709EscalationSource');
  list.replaceChildren();
  sel.replaceChildren(new Option('Select one owner-reviewed 24+ hour original renewal',''));
  for(const x of v?.items||[]){
   const age=x.renewal_aging_709;
   const li=document.createElement('li');
   li.textContent='Original ninth #'+x.review_706_receipt_id+
     ' / 708 reviewer continuity #'+x.continuity_708_receipt_id+
     ' / custody '+(x.custody_708_receipt_id||'HOLD')+
     ' · '+age.status+
     ' · '+(age.age_hours===null?'unverified':age.age_hours+'h')+
     ' · owner escalation '+(x.custody_exception_escalated_709?'RECORDED #'+x.custody_exception_escalation_receipt_id_709:'HOLD')+
     ' · independent external review / accounting close HOLD';
   list.appendChild(li);
   if(v.history_complete&&age.escalation_due&&!x.custody_exception_escalated_709)
    sel.add(new Option('Original continuity #'+x.continuity_708_receipt_id+
       ' · '+age.age_hours+'h · 706 manifest source',
      String(x.continuity_708_receipt_id)));
  }
  if(!list.childElementCount){const li=document.createElement('li');
   li.textContent='No original 708 independent reviewer renewal recorded yet.';
   list.appendChild(li);}
 }
 let audit708=null;
 function draw708(data){
  if(!$('dd708-finance'))return;
  const v=data.financial708||null;audit708=v;
  $('dd708FinanceStatus').textContent=v?.campaign_queue_id?
   v.status+' · original source history '+(v.history_complete?'VERIFIED':'HOLD')+
   ' · financial book closure HOLD':
   'HOLD · Select exact original campaign and refresh 706/707 source.';
  $('dd708FinanceStats').textContent=v?.campaign_queue_id?
   'Eligible source chains '+v.eligible_count+' · renewed reviewer acceptance '+
   v.renewed_acceptance_count+' · renewed custody '+v.renewed_custody_count+
   ' · invalid '+v.invalid_count:
   'Original ninth review, prior Build 707 field acceptance and custody required.';
  const cont=$('dd708ContinuitySource'),cust=$('dd708CustodySource'),
   list=$('dd708FinanceCases');
  cont.replaceChildren(new Option('Select original 707 signed-source acceptance',''));
  cust.replaceChildren(new Option('Select verified 708 acceptance renewal',''));
  list.replaceChildren();
  for(const x of v?.items||[]){
   const li=document.createElement('li');
   li.textContent='Ninth signed #'+x.review_706_receipt_id+
     ' / 707 field #'+x.field_707_receipt_id+
     ' / original custody #'+x.custody_707_receipt_id+
     ' · 708 acceptance '+(x.continuity_708_verified?'VERIFIED #'+x.continuity_708_receipt_id:'HOLD')+
     ' · custody '+(x.custody_708_verified?'DIGEST VERIFIED #'+x.custody_708_receipt_id:'HOLD')+
     ' · external book closure HOLD';
   list.appendChild(li);
   if(v.history_complete&&!x.continuity_708_verified)
    cont.add(new Option('Original ninth #'+x.review_706_receipt_id+
      ' / 707 owner field #'+x.field_707_receipt_id,String(x.field_707_receipt_id)));
   if(v.history_complete&&x.continuity_708_verified&&!x.custody_708_verified)
    cust.add(new Option('708 owner acceptance #'+x.continuity_708_receipt_id,
      String(x.continuity_708_receipt_id)));
  }
  if(!list.childElementCount){const li=document.createElement('li');
   li.textContent='No original signed ninth reviewer and 707 custody chain eligible for renewal.';
   list.appendChild(li);}
 }

 let audit707=null;
 function draw707(data){
  if(!$('dd707-finance'))return;
  const v=data.financial707||null;audit707=v;
  $('dd707FinanceStatus').textContent=v?.campaign_queue_id?
   v.status+' · original receipt history '+(v.history_complete?'VERIFIED':'HOLD')+
   ' · financial books HOLD':
   'HOLD · Select and refresh exact original finance campaign.';
  $('dd707FinanceStats').textContent=v?.campaign_queue_id?
   'Eligible original ninth reviews '+v.eligible_count+
   ' · field accepted '+v.field_accepted_count+
   ' · custody audited '+v.audited_custody_count+
   ' · invalid '+v.invalid_count:
   'Original ninth signed review and Build 706 retention SHA are required.';
  const field=$('dd707FieldSource'),custody=$('dd707CustodySource'),
   list=$('dd707FinanceCases');
  field.replaceChildren(new Option('Select original ninth signed review',''));
  custody.replaceChildren(new Option('Select original field acceptance',''));
  list.replaceChildren();
  for(const item of v?.items||[]){
   const li=document.createElement('li');
   li.textContent='Ninth signed original #'+item.review_706_receipt_id+
    ' · retention #'+item.retention_706_receipt_id+
    ' · owner field '+(item.field_707_verified?'VERIFIED #'+item.field_707_receipt_id:'HOLD')+
    ' · custody '+(item.custody_707_verified?'VERIFIED #'+item.custody_707_receipt_id:'HOLD')+
    ' · independent accounting close HOLD';
   list.appendChild(li);
   if(v.history_complete&&!item.field_707_verified)
    field.add(new Option('Ninth signed #'+item.review_706_receipt_id+
     ' / retention #'+item.retention_706_receipt_id,String(item.review_706_receipt_id)));
   if(v.history_complete&&item.field_707_verified&&!item.custody_707_verified)
    custody.add(new Option('Owner field #'+item.field_707_receipt_id+
     ' / ninth signed #'+item.review_706_receipt_id,String(item.field_707_receipt_id)));
  }
  if(!list.childElementCount){
   const li=document.createElement('li');
   li.textContent='No eligible signed original ninth-reviewer source and retained manifest yet.';
   list.appendChild(li);
  }
 }

let audit706=null;
function draw706(data){
 if(!$('dd706-finance'))return;
 const v=data.financial706||null;audit706=v;
 $('dd706FinanceStatus').textContent=v?.campaign_queue_id?
  v.status+' · original financial evidence history '+
  (v.history_complete?'COMPLETE':'HOLD')+' · actual book close HOLD':
  'HOLD · Select original financial campaign and refresh exact source.';
 $('dd706FinanceStats').textContent=v?.campaign_queue_id?
  'Ninth independent signer '+(v.ninth_signer_configured?'CONFIGURED':'HOLD')+
   ' · eligible '+v.eligible_count+
   ' · signed exception reviews '+v.independently_reviewed_count+
   ' · owner retained '+v.retained_evidence_count+
   ' · invalid '+v.invalid_count:
  'Original source-bound Build 705 owner review and external ninth signer required.';
 $('dd706ReviewSigner').value=v?.ninth_signer_id||'';
 const list=$('dd706FinanceCases'),review=$('dd706ReviewSource'),
   retain=$('dd706RetentionSource');
 list.replaceChildren();
 review.replaceChildren(new Option('Select exact original two-readback owner decision',''));
 retain.replaceChildren(new Option('Select independently signed ninth reviewer receipt',''));
 for(const x of v?.items||[]){
  const li=document.createElement('li');
  li.textContent='Original posting #'+x.posting_receipt_id+
   ' · 704 source #'+x.live_receipt_id+
   ' · 705 continuity #'+x.continuity_receipt_id+
   ' · 705 owner review #'+x.review_receipt_id+
   ' · ninth reviewer '+(x.review_706_verified?'VERIFIED #'+x.review_706_receipt_id:'HOLD')+
   ' · financial retention '+(x.retention_706_verified?'SOURCE HASH VERIFIED #'+x.retention_706_receipt_id:'HOLD')+
   ' · actual financial book close HOLD';
  list.appendChild(li);
  if(v.history_complete&&!x.review_706_verified)
   review.add(new Option('705 owner review #'+x.review_receipt_id+
    ' / independent posting #'+x.continuity_receipt_id,
    String(x.continuity_receipt_id)));
  if(v.history_complete&&x.review_706_verified&&!x.retention_706_verified)
   retain.add(new Option('Ninth signed reviewer #'+x.review_706_receipt_id+
    ' · '+x.review_706_disposition,String(x.review_706_receipt_id)));
 }
 if(!list.childElementCount){
  const li=document.createElement('li');
  li.textContent='Original Build 705 signed continuity, owner review and ninth independent signer still required.';
  list.appendChild(li);
 }
}
function claimFor706(){
 if(!state?.queue_id||!audit706?.history_complete||!audit706.ninth_signer_configured)
  throw Error('Refresh exact original signed source and independently enrolled ninth reviewer first.');
 const id=Number($('dd706ReviewSource').value),
   x=(audit706.items||[]).find(y=>y.continuity_receipt_id===id&&!y.review_706_verified),
   digest=$('dd706ReviewDigest').value.trim().toLowerCase(),
   disposition=$('dd706ReviewDisposition').value,
   signer=$('dd706ReviewSigner').value.trim(),
   nonce=$('dd706ReviewNonce').value.trim(),
   issued=$('dd706ReviewIssued').value.trim();
 if(!x||!(/^[a-f0-9]{64}$/).test(digest)||
   !['hold_unresolved_continuity_exception','no_new_continuity_exception_observed'].includes(disposition)||
   x.review_decision==='hold_posting_continuity_drift'&&
     disposition!=='hold_unresolved_continuity_exception'||
   signer!==audit706.ninth_signer_id||
   !(/^[A-Za-z0-9_-]{16,100}$/).test(nonce)||!issued)
  throw Error('Original second signed source/owner review, packet SHA, ninth signer and fresh nonce/UTC required. A pre-existing owner HOLD cannot be cleared by ninth signature.');
 return {v:1,purpose:'devilndove_independent_bookkeeping_continuity_exception_review_706',
  source:'devilndove',queue_id:state.queue_id,
  original_live_receipt_id:x.live_receipt_id,
  continuity_receipt_id:id,
  original_owner_review_receipt_id:x.review_receipt_id,
  posting_receipt_id:x.posting_receipt_id,
  posting_document_sha256:x.posting_document_sha256,
  bookkeeping_ledger_sha256:x.bookkeeping_ledger_sha256,
  external_posting_reference:x.external_posting_reference,
  source_revision:state.source_revision,fingerprint_sha256:state.fingerprint_sha256,
  review_packet_sha256:digest,reviewer_disposition:disposition,
  independent_reviewer_id:signer,nonce,issued_at:issued,
  decision:'independent_continuity_exception_review_not_financial_closure'};
}

let audit705=null;
function draw705(data){
 if(!$('dd705-finance'))return;
 const v=data.financial705||null;audit705=v;
 $('dd705FinanceStatus').textContent=v?.campaign_queue_id?
   v.status+' · original posting history '+(v.history_complete?'COMPLETE':'HOLD')+
     ' · actual financial book close HOLD':
   'HOLD · Select and refresh original financial campaign.';
 $('dd705FinanceStats').textContent=v?.campaign_queue_id?
   'Independent source '+(v.independent_source_configured?'CONFIGURED':'HOLD')+
   ' · eligible '+v.eligible_count+
   ' · signed fresh receipts '+v.continuity_verified_count+
   ' · owner reviewed '+v.owner_reviewed_count+
   ' · invalid '+v.invalid_count:
   'No original signed live posting ready for continuity review.';
 const list=$('dd705FinanceCases'),renew=$('dd705FinanceSource'),
   owner=$('dd705FinanceOwnerSource');
 list.replaceChildren();
 renew.replaceChildren(new Option('Choose original signed posting readback',''));
 owner.replaceChildren(new Option('Choose second signed source receipt',''));
 for(const x of v?.items||[]){
   const li=document.createElement('li');
   li.textContent='Posting #'+x.posting_receipt_id+' · original live #'+x.live_receipt_id+
     ' · owner readiness #'+x.financial_readiness_receipt_id+
     ' · second signed source '+(x.continuity_verified?
       'VERIFIED #'+x.continuity_receipt_id:'HOLD')+
     ' · owner evidence review '+(x.review_receipt_id||'pending')+
     ' · bookkeeping closure HOLD';
   list.appendChild(li);
   if(!x.continuity_verified&&v.history_complete)
     renew.add(new Option('Original independent live receipt #'+x.live_receipt_id,
       String(x.live_receipt_id)));
   if(x.continuity_verified&&!x.review_decision&&v.history_complete)
     owner.add(new Option('Fresh independent continuity #'+x.continuity_receipt_id,
       String(x.continuity_receipt_id)));
 }
 if(!list.childElementCount){
   const li=document.createElement('li');
   li.textContent='No independently signed original posting with verified Build 704 owner readiness.';
   list.appendChild(li);
 }
}

let audit704=null;
function draw704(data){
 if(!$('dd704-finance'))return;
 audit704=data.financial704||null;
 const v=audit704;
 $('dd704FinanceStatus').textContent=v?.campaign_queue_id?
  v.status+' · exact original source history '+(v.history_complete?'COMPLETE':'HOLD')+
  ' · actual book close remains HOLD':
  'HOLD · Select original campaign and refresh live posting source evidence.';
 $('dd704FinanceStats').textContent=v?.campaign_queue_id?
   'Eighth verifier '+(v.independent_signer_configured?'CONFIGURED':'HOLD')+
   ' · pinned origin '+(v.origin_authorized?'AUTHORIZED':'HOLD')+
   ' · eligible '+v.readback.eligible+
   ' · signed live receipts '+v.readback.verified_count+
   ' · owner decisions '+v.readback.owner_reviewed_count+
   ' · invalid '+v.readback.invalid_count:
   'Original owner-accepted posting and pinned source required.';
 const list=$('dd704FinanceCases'),posting=$('dd704FinancePosting'),
   live=$('dd704FinanceLiveSource');
 list.replaceChildren();
 posting.replaceChildren(new Option('Select original owner-accepted posting document',''));
 live.replaceChildren(new Option('Select independently signed live posting source receipt',''));
 for(const x of v?.readback?.items||[]){
   const li=document.createElement('li');
   li.textContent='Original posting #'+x.posting_receipt_id+
     ' · owner document acceptance #'+x.owner_acceptance_receipt_id+
     ' · independent live source '+(x.independent_live_source_verified?
       'VERIFIED #'+x.live_receipt_id:'HOLD')+
     ' · financial owner readiness '+(x.financial_readiness_receipt_id||'pending')+
     ' · actual book close HOLD';
   list.appendChild(li);
   if(!x.independent_live_source_verified&&v.history_complete)
     posting.add(new Option('Original posting document #'+x.posting_receipt_id+
      ' / owner acceptance #'+x.owner_acceptance_receipt_id,
      String(x.posting_receipt_id)));
   if(x.independent_live_source_verified&&!x.financial_readiness_decision&&
      v.history_complete)
     live.add(new Option('Independent live source receipt #'+x.live_receipt_id,
      String(x.live_receipt_id)));
 }
 if(!list.childElementCount){
  const li=document.createElement('li');
  li.textContent='No original owner-accepted posting document eligible for independent live readback.';
  list.appendChild(li);
 }
}

let audit703=null;
function draw703(data){
 if(!$('dd703-finance'))return;
 const v=data.financial703||null;audit703=v;
 $('dd703FinanceStatus').textContent=v?.campaign_queue_id?
   v.status+' · original posting not externally read back · book close HOLD':
   'HOLD · Select original campaign and refresh source-bound evidence.';
 $('dd703FinanceStats').textContent=v?.campaign_queue_id?
   'Seventh signer '+(v.independent_signer_configured?'CONFIGURED':'HOLD')+
   ' · eligible '+v.posting.eligible_count+
   ' · signed documents '+v.posting.signed_count+
   ' · owner accepted '+v.posting.owner_accepted_count+
   ' · invalid '+v.posting.invalid_count:
   'Original Build 702 independent closure recommendation required.';
 const list=$('dd703FinanceCases'),posting=$('dd703FinanceSource'),
   owner=$('dd703FinanceOwnerSource');
 list.replaceChildren();posting.replaceChildren(new Option('Choose original independent closure recommendation',''));
 owner.replaceChildren(new Option('Choose verified original posting document receipt',''));
 for(const item of v?.posting?.items||[]){
   const li=document.createElement('li');
   li.textContent='Original source #'+item.original_live_source_receipt_id+
     ' · signed recommendation #'+item.decision_receipt_id+
     ' · posting '+(item.posting_document_signed?
       'SIGNED DOCUMENT #'+item.posting_receipt_id:'HOLD')+
     ' · owner review '+(item.owner_acceptance_receipt_id||'pending')+
     ' · actual financial book close HOLD';
   list.appendChild(li);
   if(!item.posting_document_signed&&v.history_complete)
     posting.add(new Option('Closure decision #'+item.decision_receipt_id,
       String(item.decision_receipt_id)));
   if(item.posting_document_signed&&!item.owner_acceptance_decision&&v.history_complete)
     owner.add(new Option('Posting document #'+item.posting_receipt_id,
       String(item.posting_receipt_id)));
 }
 if(!list.childElementCount){
   const li=document.createElement('li');
   li.textContent='No verified Build 702 manual close recommendation.';
   list.appendChild(li);
 }
}
function claimFor703(){
 if(!state?.queue_id||!audit703?.history_complete||!audit703.independent_signer_configured)
   throw Error('Refresh original complete source and independent seventh signer first.');
 const decisionId=Number($('dd703FinanceSource').value);
 const candidate=(audit703.posting?.items||[]).find(x=>x.decision_receipt_id===decisionId&&
   !x.posting_document_signed);
 const digest=$('dd703FinanceDigest').value.trim().toLowerCase(),
   reference=$('dd703FinanceReference').value.trim(),
   signer=$('dd703FinanceSigner').value.trim(),nonce=$('dd703FinanceNonce').value.trim(),
   issued=$('dd703FinanceIssued').value.trim();
 if(!candidate||!(/^[a-f0-9]{64}$/).test(digest)||
   !(/^[A-Za-z0-9][A-Za-z0-9_.:/#-]{7,159}$/).test(reference)||
   signer!==audit703.independent_signer_id||!nonce||!issued)
   throw Error('Exact source, external posting document digest/reference and seventh signer required.');
 return {v:1,purpose:'devilndove_independent_external_bookkeeping_posting_document_703',
   source:'devilndove',queue_id:state.queue_id,
   original_live_source_receipt_id:candidate.original_live_source_receipt_id,
   bookkeeping_review_receipt_id:candidate.bookkeeping_review_receipt_id,
   closure_decision_receipt_id:decisionId,
   bookkeeping_ledger_sha256:candidate.bookkeeping_ledger_sha256,
   posting_document_sha256:digest,external_posting_reference:reference,
   source_revision:state.source_revision,fingerprint_sha256:state.fingerprint_sha256,
   independent_posting_verifier_id:signer,nonce,issued_at:issued,
   decision:'external_bookkeeping_posting_document_intake_not_live_posting_proof'};
}

let audit702=null;
function draw702(data){
 if(!$('dd702-finance'))return;
 const v=data.financial702||null;audit702=v;
 $('dd702FinanceStatus').textContent=v?.campaign_queue_id?
   v.status+' · original source history '+(v.history_complete?'COMPLETE':'HOLD')+
   ' · actual bookkeeping close HOLD':
   'HOLD · Select and refresh original financial campaign.';
 $('dd702FinanceStats').textContent=v?.campaign_queue_id?
   'Independent sixth signer '+(v.independent_signer_configured?'CONFIGURED':'HOLD')+
   ' · signed decisions '+v.review.recorded_count+' · pending '+v.review.pending_count+
   ' · invalid '+v.review.invalid_count:
   'No source-bound independent closure decision.';
 const list=$('dd702FinanceCases');list.replaceChildren();
 const select=$('dd702FinanceSource');select.replaceChildren(
   new Option('Choose exact independently reviewed ledger',''));
 for(const item of v?.review?.items||[]){
   const li=document.createElement('li');
   li.textContent='Original live source #'+item.original_live_source_receipt_id+
    ' · independently verified bookkeeper receipt #'+item.bookkeeping_review_receipt_id+
    ' · closure decision '+(item.signed_closure_decision_recorded?
      'VERIFIED #'+item.decision_receipt_id+' / '+item.signed_decision:'PENDING')+
    ' · accounting posting HOLD';
   list.appendChild(li);
   if(!item.signed_closure_decision_recorded&&v.history_complete)
     select.add(new Option('Bookkeeper review #'+item.bookkeeping_review_receipt_id+
       ' · source #'+item.original_live_source_receipt_id,
       String(item.bookkeeping_review_receipt_id)));
 }
 if(!list.childElementCount){const li=document.createElement('li');
   li.textContent='No fresh Build 701 independently signed bookkeeping receipt.';list.appendChild(li);}
}
function claimFor702(){
 if(!state?.queue_id||!audit702?.history_complete||
   !audit702.independent_signer_configured)
   throw Error('Refresh exact current original independent financial history and sixth signer first.');
 const reviewId=Number($('dd702FinanceSource').value),
   original=(audit702.review?.items||[]).find(x=>
     x.bookkeeping_review_receipt_id===reviewId&&!x.signed_closure_decision_recorded),
   decision=$('dd702FinanceDecision').value,
   remaining=Number($('dd702FinanceExceptions').value),
   signer=$('dd702FinanceSigner').value.trim(),
   nonce=$('dd702FinanceNonce').value.trim(),
   issued=$('dd702FinanceIssued').value.trim();
 if(!original||!['hold_discrepancy','recommend_owner_manual_close'].includes(decision)||
   !Number.isSafeInteger(remaining)||remaining<0||remaining>10000||
   (decision==='recommend_owner_manual_close'&&remaining!==0)||
   signer!==audit702.expected_signer_id||!nonce||!issued||
   !/^[a-f0-9]{64}$/.test(original.bookkeeping_ledger_sha256||''))
   throw Error('Exact original bookkeeper receipt, sixth signer, decision and bounded exception count required. HOLD.');
 return {v:1,purpose:'devilndove_independent_bookkeeping_closure_decision_702',
   source:'devilndove',queue_id:state.queue_id,
   original_live_source_receipt_id:original.original_live_source_receipt_id,
   bookkeeping_review_receipt_id:reviewId,
   older_receipt_id:original.older_receipt_id,newer_receipt_id:original.newer_receipt_id,
   external_document_sha256:original.external_document_sha256,
   bookkeeping_ledger_sha256:original.bookkeeping_ledger_sha256,
   source_revision:state.source_revision,fingerprint_sha256:state.fingerprint_sha256,
   independent_closure_signer_id:signer,
   remaining_exception_count:remaining,decision,nonce,issued_at:issued};
}

let audit701=null;
function draw701(d){
 if(!$('dd701-finance'))return;
 audit701=d.financial701||null;const v=audit701;
 $('dd701Status').textContent=v?.campaign_queue_id?
   v.status+' · current original source history '+(v.history_complete?'COMPLETE':'HOLD')+
   ' · bookkeeping close HOLD':'HOLD · Select and refresh the original campaign.';
 $('dd701Stats').textContent=v?.campaign_queue_id?
   'Independent signer '+(v.independent_signer_configured?'CONFIGURED':'HOLD')+
   ' · valid reviews '+v.review.recorded_count+
   ' · pending '+v.review.pending_count+' · invalid '+v.review.invalid_count:
   'Original fifth signer and source review not available.';
 const list=$('dd701Cases');list.replaceChildren();
 const select=$('dd701Source');select.replaceChildren(new Option('Choose actual signed source receipt',''));
 for(const x of v?.review?.items||[]){
   const li=document.createElement('li');
   li.textContent='Signed source #'+x.original_live_source_receipt_id+
     ' · bookkeeper review '+(x.independent_bookkeeping_evidence_reviewed?
       'VERIFIED #'+x.bookkeeping_review_receipt_id:'PENDING')+
     ' · accounting close HOLD';
   list.appendChild(li);
   if(!x.independent_bookkeeping_evidence_reviewed&&v.history_complete)
     select.add(new Option('Original live source receipt #'+x.original_live_source_receipt_id,
       String(x.original_live_source_receipt_id)));
 }
 if(!list.childElementCount){const li=document.createElement('li');
   li.textContent='No independently signed Build 700 source proof. HOLD.';list.appendChild(li);}
}
function claimFor701(){
 if(!state?.queue_id||!audit701?.history_complete||
   !audit701.independent_signer_configured)throw Error('Refresh exact original signed financial source first.');
 const id=Number($('dd701Source').value),source=(audit701.review?.items||[])
   .find(x=>x.original_live_source_receipt_id===id&&!x.independent_bookkeeping_evidence_reviewed);
 const digest=$('dd701Digest').value.trim().toLowerCase(),
   signer=$('dd701Signer').value.trim(),nonce=$('dd701Nonce').value.trim(),
   issued=$('dd701Issued').value.trim();
 if(!source||!/^[a-f0-9]{64}$/.test(digest)||
   signer!==audit701.independent_verifier_id||!nonce||!issued)
   throw Error('Original source, external SHA-256 and independently configured fifth signer required. HOLD.');
 return {v:1,purpose:'devilndove_independent_bookkeeping_evidence_review_701',
   source:'devilndove',queue_id:state.queue_id,original_live_source_receipt_id:id,
   older_receipt_id:source.older_receipt_id,newer_receipt_id:source.newer_receipt_id,
   external_document_sha256:source.external_document_sha256,
   bookkeeping_ledger_sha256:digest,source_revision:state.source_revision,
   fingerprint_sha256:state.fingerprint_sha256,independent_bookkeeper_id:signer,
   nonce,issued_at:issued,
   decision:'independent_bookkeeping_evidence_review_not_accounting_close'};
}

let audit700=null;
function select700(){
const el=$('dd700FinanceSource');if(!el)return;
el.replaceChildren(new Option('Select original independently signed source witness',''));
if(!audit700?.history_complete)return;
for(const x of audit700.readback?.items||[]){
if(x.source_readback_recorded)continue;
el.add(new Option('Original intake #'+x.repair_intake_receipt_id+
' · independent document witness #'+x.independent_document_witness_receipt_id,
[x.older_receipt_id,x.newer_receipt_id,x.repair_intake_receipt_id,
x.independent_document_witness_receipt_id].join('|')));
}
}
function draw700(d){
if(!$('dd700-finance'))return;
const v=d.financial700||null;audit700=v;
$('dd700FinanceStatus').textContent=v?.campaign_queue_id?
v.status+' · original source revision evidence '+(v.history_complete?'COMPLETE':'HOLD')+
' · financial bookkeeping closure HOLD':
'HOLD · Select original campaign and refresh.';
$('dd700FinanceStats').textContent=v?.campaign_queue_id?
'Eligible original witness cases '+v.readback.eligible_cases+
' · independent live source receipts '+v.readback.source_receipt_count+
' · waiting '+v.readback.pending_count+
' · source verifier '+(v.readback.configured?'CONFIGURED':'HOLD')+
' · accounting correction and certification HOLD':
'No exact independent live source-of-record receipt.';
const list=$('dd700FinanceCases');list.replaceChildren();
for(const x of v?.readback?.items||[]){
const li=document.createElement('li');
li.textContent='Original source #'+x.older_receipt_id+' / #'+x.newer_receipt_id+
' · document intake #'+x.repair_intake_receipt_id+
' · independent document witness #'+x.independent_document_witness_receipt_id+
' · source snapshot '+(x.source_readback_independently_signed?
'INDEPENDENTLY SIGNED RECEIPT #'+x.source_readback_receipt_id:'NOT READ BACK')+
' · financial close HOLD';
list.appendChild(li);
}
if(!list.childElementCount){
const li=document.createElement('li');
li.textContent='No eligible independently signed document witness from Build 699.';
list.appendChild(li);
}
select700();
}
async function refresh(){
const id=Number($('dd685Campaign').value);
if(!id){state=null;$('dd685Status').textContent='HOLD · Select a campaign.';}
try{
const d=await api(null,id||0),v=d.financial685;
draw686(d);
draw687(d);
draw688(d);
draw689(d);
draw690(d);
draw691(d);
draw692(d);
draw693(d);
draw694(d);
draw695(d);
draw696(d);
draw697(d);
draw698(d);
draw699(d);
draw700(d);
draw701(d);
draw702(d);draw703(d);draw704(d);draw705(d);draw706(d);draw707(d);draw708(d);draw709(d);draw710(d);
if(!id)return;
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
const d=await api(null);draw686(d);draw687(d);draw688(d);draw689(d);draw690(d);draw691(d);draw692(d);draw693(d);draw694(d);draw695(d);draw696(d);draw697(d);draw698(d);draw699(d);draw700(d);draw701(d);draw702(d);draw703(d);draw704(d);draw705(d);draw706(d);draw707(d);draw708(d);const seen=new Set();
for(const q of d.queue||[])if(q.utm_campaign&&!seen.has(q.social_post_queue_id)){
seen.add(q.social_post_queue_id);
$('dd685Campaign').add(new Option(q.utm_campaign+' · #'+q.social_post_queue_id,q.social_post_queue_id));
}
}catch(e){$('dd685Status').textContent='HOLD · '+e.message;}})();
$('dd685Campaign').addEventListener('change',()=>void refresh());
$('dd685Refresh').addEventListener('click',()=>void refresh());
$('dd686Refresh').addEventListener('click',()=>void refresh());
$('dd687Refresh').addEventListener('click',()=>void refresh());

$('dd688Refresh').addEventListener('click',()=>void refresh());

$('dd689Refresh').addEventListener('click',()=>void refresh());

$('dd690Refresh').addEventListener('click',()=>void refresh());
$('dd691Refresh').addEventListener('click',()=>void refresh());
$('dd692Refresh').addEventListener('click',()=>void refresh());
$('dd693Refresh').addEventListener('click',()=>void refresh());
$('dd694Refresh').addEventListener('click',()=>void refresh());
$('dd695Refresh').addEventListener('click',()=>void refresh());
$('dd696Refresh').addEventListener('click',()=>void refresh());
$('dd697Refresh').addEventListener('click',()=>void refresh());
$('dd698Refresh').addEventListener('click',()=>void refresh());
$('dd699Refresh').addEventListener('click',()=>void refresh());









 $('dd710FinanceRefresh').addEventListener('click',()=>void refresh());
 $('dd710FollowupForm').addEventListener('submit',async event=>{
  event.preventDefault();const button=$('dd710FollowupSubmit');button.disabled=true;
  try{
   const escalationId=Number($('dd710FollowupSource').value),
    x=audit710?.items?.find(x=>x.custody_exception_escalation_receipt_id_709===escalationId&&
      x.followup_710_due&&!x.followup_710_verified),
    disposition=$('dd710FollowupDisposition').value,
    note=$('dd710FollowupNote').value.trim();
   if(!state?.queue_id||!audit710?.history_complete||!x||
     !$('dd710FollowupReviewed').checked||note.length<25||note.length>600||
     !['manual_independent_reviewer_contact_pending','owner_manual_source_followup_pending'].includes(disposition))
    throw Error('Original 24-hour overdue escalation and owner review of exact 706/708 evidence required.');
   const d=await api({action:'owner_custody_escalation_followup_710',
    social_post_queue_id:state.queue_id,original_709_escalation_receipt_id:escalationId,
    followup_disposition:disposition,
    expected_source_revision:state.source_revision,
    expected_fingerprint_sha256:state.fingerprint_sha256,
    expected_706_manifest_sha256:x.retention_manifest_sha256,
    expected_708_custody_digest_sha256:x.custody_708_digest_sha256||null,
    owner_followup_reviewed:true,resolution_note:note},state.queue_id);
   $('dd710FollowupResult').textContent=d.result.status+' · receipt #'+d.result.receipt_id+
     '. No independent reviewer contact or bookkeeping close was independently confirmed.';
   $('dd710FollowupReviewed').checked=false;await refresh();
  }catch(e){$('dd710FollowupResult').textContent='HOLD · '+e.message;}
  finally{button.disabled=false;}
 });
 $('dd710ProvenanceForm').addEventListener('submit',async event=>{
  event.preventDefault();const button=$('dd710ProvenanceSubmit');button.disabled=true;
  try{
   const followupId=Number($('dd710ProvenanceSource').value),
    x=audit710?.items?.find(x=>x.followup_710_receipt_id===followupId&&
      x.followup_710_verified&&!x.provenance_710_verified),
    note=$('dd710ProvenanceNote').value.trim();
   if(!state?.queue_id||!audit710?.history_complete||!x||
     !$('dd710ProvenanceReviewed').checked||note.length<25||note.length>600)
    throw Error('Original protected overdue follow-up and prior independently signed ninth-reviewer custody source required.');
   const d=await api({action:'owner_ninth_reviewer_provenance_audit_710',
    social_post_queue_id:state.queue_id,original_710_followup_receipt_id:followupId,
    expected_source_revision:state.source_revision,
    expected_fingerprint_sha256:state.fingerprint_sha256,
    expected_706_manifest_sha256:x.retention_manifest_sha256,
    expected_708_custody_digest_sha256:x.custody_708_digest_sha256||null,
    owner_provenance_reviewed:true,resolution_note:note},state.queue_id);
   $('dd710ProvenanceResult').textContent=d.result.status+' · receipt #'+d.result.receipt_id+
     ' · SHA-256 '+d.result.provenance_manifest_sha256+
     '. No new independent signature, external notice or financial closure claimed.';
   $('dd710ProvenanceReviewed').checked=false;await refresh();
  }catch(e){$('dd710ProvenanceResult').textContent='HOLD · '+e.message;}
  finally{button.disabled=false;}
 });
 $('dd710FinanceExport').addEventListener('click',async()=>{
  try{
   const id=Number($('dd685Campaign').value);
   if(!id||id!==state?.queue_id||!window.DDAuth?.apiFetch)
    throw Error('Authenticated exact original campaign required.');
   const response=await window.DDAuth.apiFetch(endpoint+
     '?export=financial710&campaign_queue_id='+encodeURIComponent(id));
   if(!response.ok)throw Error('Protected 710 original ninth-source evidence export rejected. HTTP '+response.status);
   const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='devilndove-overdue-custody-ninth-provenance-'+id+'-710.json';
   document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
   $('dd710ProvenanceResult').textContent='Protected original source-bound provenance dossier exported. Books remain HOLD.';
  }catch(e){$('dd710ProvenanceResult').textContent='HOLD · '+e.message;}
 });
 $('dd709FinanceRefresh').addEventListener('click',()=>void refresh());
 $('dd709EscalationForm').addEventListener('submit',async event=>{
  event.preventDefault();const btn=$('dd709EscalationSubmit');btn.disabled=true;
  try{
   const id=Number($('dd709EscalationSource').value),
    x=audit709?.items?.find(x=>x.continuity_708_receipt_id===id&&
      x.renewal_aging_709.escalation_due&&!x.custody_exception_escalated_709),
    note=$('dd709EscalationNote').value.trim();
   if(!state?.queue_id||!audit709?.history_complete||!x||
      !$('dd709EscalationReviewed').checked||note.length<25||note.length>600)
    throw Error('Select eligible original ninth-signed source, 24h aged owner review and source-pinned custody SHA.');
   const d=await api({action:'owner_financial_custody_exception_escalation_709',
    social_post_queue_id:state.queue_id,original_708_continuity_receipt_id:id,
    expected_source_revision:state.source_revision,
    expected_fingerprint_sha256:state.fingerprint_sha256,
    expected_706_manifest_sha256:x.retention_manifest_sha256,
    expected_708_custody_digest_sha256:x.custody_708_digest_sha256||null,
    owner_exception_reviewed:true,resolution_note:note},state.queue_id);
   $('dd709EscalationResult').textContent=d.result.status+
    ' · protected custody exception #'+d.result.receipt_id+
    ' · age '+d.result.age_hours+'h. No external escalation sent, no newly signed independent reviewer or book closure.';
   $('dd709EscalationReviewed').checked=false;
   await refresh();
  }catch(e){$('dd709EscalationResult').textContent='HOLD · '+e.message;}
  finally{btn.disabled=false;}
 });
 $('dd709FinanceExport').addEventListener('click',async()=>{
  try{
   const id=Number($('dd685Campaign').value);
   if(!id||id!==state?.queue_id||!window.DDAuth?.apiFetch)
    throw Error('Authenticated original financial owner and exact campaign required.');
   const res=await window.DDAuth.apiFetch(endpoint+
    '?export=financial709&campaign_queue_id='+encodeURIComponent(id));
   if(!res.ok)throw Error('Original source-bound escalation dossier denied. HTTP '+res.status);
   const blob=await res.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='devilndove-ninth-renewal-aging-'+id+'-709.json';
   document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
   $('dd709EscalationResult').textContent='Protected 709 original ninth-signer renewal aging dossier downloaded; external escalation remains manual and books HOLD.';
  }catch(e){$('dd709EscalationResult').textContent='HOLD · '+e.message;}
 });
 $('dd708FinanceRefresh').addEventListener('click',()=>void refresh());
 $('dd708ContinuityForm').addEventListener('submit',async event=>{
  event.preventDefault();const button=$('dd708ContinuitySubmit');button.disabled=true;
  try{
   const id=Number($('dd708ContinuitySource').value),
    x=audit708?.items?.find(x=>x.field_707_receipt_id===id&&
     x.field_707_verified&&x.custody_707_verified&&!x.continuity_708_verified),
    note=$('dd708ContinuityNote').value.trim();
   if(!state?.queue_id||!audit708?.history_complete||!x||
      !$('dd708ContinuityReviewed').checked||note.length<25||note.length>600)
    throw Error('Select exact original ninth-signed 706/707 acceptance and custody, and review manually.');
   if(!crypto?.randomUUID)throw Error('Secure renewal challenge requires HTTPS.');
   const d=await api({action:'owner_ninth_reviewer_continuity_708',
    social_post_queue_id:state.queue_id,original_707_field_receipt_id:id,
    renewal_nonce:'finance708-'+crypto.randomUUID(),
    expected_source_revision:state.source_revision,
    expected_fingerprint_sha256:state.fingerprint_sha256,
    expected_manifest_sha256:x.retention_manifest_sha256,
    expected_review_packet_sha256:x.review_packet_sha256,
    owner_continuity_reviewed:true,resolution_note:note},state.queue_id);
   $('dd708ContinuityResult').textContent=d.result.status+
    ' · source-bound receipt #'+d.result.receipt_id+
    ' · original ninth signature reverified; no new independent signature or book close.';
   $('dd708ContinuityReviewed').checked=false;await refresh();
  }catch(error){$('dd708ContinuityResult').textContent='HOLD · '+error.message;}
  finally{button.disabled=false;}
 });
 $('dd708CustodyForm').addEventListener('submit',async event=>{
  event.preventDefault();const button=$('dd708CustodySubmit');button.disabled=true;
  try{
   const id=Number($('dd708CustodySource').value),
    x=audit708?.items?.find(x=>x.continuity_708_receipt_id===id&&
     x.continuity_708_verified&&!x.custody_708_verified),
    note=$('dd708CustodyNote').value.trim();
   if(!state?.queue_id||!audit708?.history_complete||!x||
      !$('dd708CustodyReviewed').checked||note.length<25||note.length>600)
    throw Error('Original source-bound 708 acceptance and explicit owner evidence custody review required.');
   const d=await api({action:'owner_financial_custody_renewal_708',
    social_post_queue_id:state.queue_id,owner_continuity_receipt_id:id,
    expected_source_revision:state.source_revision,
    expected_fingerprint_sha256:state.fingerprint_sha256,
    expected_manifest_sha256:x.retention_manifest_sha256,
    owner_custody_rechecked:true,resolution_note:note},state.queue_id);
   $('dd708CustodyResult').textContent=d.result.status+' · receipt #'+d.result.receipt_id+
    ' · canonical renewed SHA-256 '+d.result.renewal_manifest_sha256+
    '. No bank posting, permanent retention guarantee or external financial close.';
   $('dd708CustodyReviewed').checked=false;await refresh();
  }catch(error){$('dd708CustodyResult').textContent='HOLD · '+error.message;}
  finally{button.disabled=false;}
 });
 $('dd708FinanceExport').addEventListener('click',async()=>{
  try{
   const id=Number($('dd685Campaign').value);
   if(!id||id!==state?.queue_id||!window.DDAuth?.apiFetch)
    throw Error('Select authenticated original financial campaign.');
   const response=await window.DDAuth.apiFetch(endpoint+
     '?export=financial708&campaign_queue_id='+encodeURIComponent(id));
   if(!response.ok)throw Error('Protected source-bound export denied. HTTP '+response.status);
   const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='devilndove-ninth-custody-renewal-'+id+'-708.json';
   document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
   $('dd708CustodyResult').textContent='Protected source-bound continuity and custody renewal export prepared. Books HOLD.';
  }catch(error){$('dd708CustodyResult').textContent='HOLD · '+error.message;}
 });

 $('dd707FinanceRefresh').addEventListener('click',()=>void refresh());
 $('dd707FieldForm').addEventListener('submit',async event=>{
  event.preventDefault();const button=$('dd707FieldSubmit');button.disabled=true;
  try{
   const id=Number($('dd707FieldSource').value),
    source=audit707?.items?.find(x=>x.review_706_receipt_id===id&&
     x.review_706_verified&&x.retention_706_verified&&!x.field_707_verified),
    note=$('dd707FieldNote').value.trim();
   if(!state?.queue_id||!audit707?.history_complete||!source||
      !$('dd707FieldReviewed').checked||note.length<25||note.length>600)
    throw Error('Original signed ninth review, retained SHA manifest and field-owner review required.');
   const d=await api({action:'owner_ninth_reviewer_field_acceptance_707',
    social_post_queue_id:state.queue_id,original_ninth_review_receipt_id:id,
    expected_source_revision:state.source_revision,
    expected_fingerprint_sha256:state.fingerprint_sha256,
    expected_manifest_sha256:source.retention_manifest_sha256,
    expected_review_packet_sha256:source.review_packet_sha256,
    owner_original_field_reviewed:true,resolution_note:note},state.queue_id);
   $('dd707FieldResult').textContent=d.result.status+
     ' · receipt #'+d.result.receipt_id+
     '. Original ninth signature verified; independent physical phone and financial close still HOLD.';
   $('dd707FieldReviewed').checked=false;await refresh();
  }catch(error){$('dd707FieldResult').textContent='HOLD · '+error.message;}
  finally{button.disabled=false;}
 });
 $('dd707CustodyForm').addEventListener('submit',async event=>{
  event.preventDefault();const button=$('dd707CustodySubmit');button.disabled=true;
  try{
   const id=Number($('dd707CustodySource').value),
    source=audit707?.items?.find(x=>x.field_707_receipt_id===id&&
      x.field_707_verified&&!x.custody_707_verified),
    note=$('dd707CustodyNote').value.trim();
   if(!state?.queue_id||!audit707?.history_complete||!source||
     !$('dd707CustodyReviewed').checked||note.length<25||note.length>600)
    throw Error('Verified original ninth review and field acceptance, current source and owner audit required.');
   const d=await api({action:'owner_financial_custody_audit_707',
    social_post_queue_id:state.queue_id,field_acceptance_receipt_id:id,
    expected_source_revision:state.source_revision,
    expected_fingerprint_sha256:state.fingerprint_sha256,
    expected_manifest_sha256:source.retention_manifest_sha256,
    owner_custody_reviewed:true,resolution_note:note},state.queue_id);
   $('dd707CustodyResult').textContent=d.result.status+
    ' · durable source-bound receipt #'+d.result.receipt_id+
    ' · manifest SHA-256 '+d.result.manifest_sha256+
    '. No accounting close or retention permanence certified.';
   $('dd707CustodyReviewed').checked=false;await refresh();
  }catch(error){$('dd707CustodyResult').textContent='HOLD · '+error.message;}
  finally{button.disabled=false;}
 });
 $('dd707FinanceExport').addEventListener('click',async()=>{
  try{
   const id=Number($('dd685Campaign').value);
   if(!id||id!==state?.queue_id||!window.DDAuth?.apiFetch)
    throw Error('Authenticated original owner and exact selected campaign required.');
   const response=await window.DDAuth.apiFetch(endpoint+
     '?export=financial707&campaign_queue_id='+encodeURIComponent(id));
   if(!response.ok)throw Error('Original protected custody export denied. HTTP '+response.status);
   const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='devilndove-ninth-field-custody-'+id+'-707.json';
   document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   $('dd707CustodyResult').textContent='Source-bound field and custody readback exported. Financial books HOLD.';
  }catch(error){$('dd707CustodyResult').textContent='HOLD · '+error.message;}
 });

 $('dd706FinanceRefresh').addEventListener('click',()=>void refresh());
$('dd706ReviewPrepare').addEventListener('click',()=>{
 try{
  if(!$('dd706ReviewNonce').value.trim()){
   if(!crypto?.randomUUID)throw Error('Secure nonce generation requires HTTPS.');
   $('dd706ReviewNonce').value='finance706-'+crypto.randomUUID();
  }
  if(!$('dd706ReviewIssued').value.trim())
   $('dd706ReviewIssued').value=new Date().toISOString();
  const claim=claimFor706();
  $('dd706ReviewClaim').value=JSON.stringify(claim);
  $('dd706ReviewResult').textContent='Canonical original review claim prepared. Obtain ninth independent Ed25519 signature OFF-platform. Never enter a private key here.';
 }catch(error){$('dd706ReviewResult').textContent='HOLD · '+error.message;}
});
$('dd706FinanceReviewForm').addEventListener('submit',async event=>{
 event.preventDefault();const button=$('dd706ReviewSubmit');button.disabled=true;
 try{
  const claim=claimFor706(),note=$('dd706ReviewNote').value.trim(),
   signature=$('dd706ReviewSignature').value.trim();
  if(!$('dd706ReviewReviewed').checked||note.length<25||note.length>600||
    !(/^[A-Za-z0-9+/_=-]{80,120}$/).test(signature)||
    $('dd706ReviewClaim').value!==JSON.stringify(claim))
   throw Error('Original source-bound canonical claim, independent ninth signer signature, and explicit owner review required.');
  const d=await api({action:'independent_continuity_exception_review_706',
   social_post_queue_id:state.queue_id,
   continuity_receipt_id:claim.continuity_receipt_id,
   expected_posting_document_sha256:claim.posting_document_sha256,
   expected_source_revision:state.source_revision,
   expected_fingerprint_sha256:state.fingerprint_sha256,
   review_packet_sha256:claim.review_packet_sha256,
   reviewer_disposition:claim.reviewer_disposition,
   independent_reviewer_id:claim.independent_reviewer_id,
   nonce:claim.nonce,issued_at:claim.issued_at,signature,
   owner_reviewed:true,resolution_note:note},state.queue_id);
  $('dd706ReviewResult').textContent=d.result.status+
   ' · signed reviewer receipt #'+d.result.receipt_id+
   '. No external posting, final ledger closure or financial certification inferred.';
  $('dd706ReviewReviewed').checked=false;
  $('dd706ReviewSignature').value='';
  $('dd706ReviewClaim').value='';
  $('dd706ReviewNonce').value='';
  $('dd706ReviewIssued').value='';
  await refresh();
 }catch(error){$('dd706ReviewResult').textContent='HOLD · '+error.message;}
 finally{button.disabled=false;}
});
$('dd706RetentionForm').addEventListener('submit',async event=>{
 event.preventDefault();const button=$('dd706RetentionSubmit');button.disabled=true;
 try{
  const reviewId=Number($('dd706RetentionSource').value),
   x=(audit706?.items||[]).find(y=>y.review_706_receipt_id===reviewId&&
    y.review_706_verified&&!y.retention_706_verified),
   disposition=$('dd706RetentionDisposition').value,
   note=$('dd706RetentionNote').value.trim();
  if(!audit706?.history_complete||!x||
    !['retain_exception_on_hold','retain_for_final_manual_financial_review'].includes(disposition)||
    x.review_706_disposition==='hold_unresolved_continuity_exception'&&
      disposition!=='retain_exception_on_hold'||
    !$('dd706RetentionReviewed').checked||note.length<25||note.length>600)
   throw Error('Exact verified ninth-signer exception receipt and explicit original owner retention decision required. Unresolved exception must remain HOLD.');
  const d=await api({action:'owner_financial_evidence_retention_706',
   social_post_queue_id:state.queue_id,
   independent_exception_review_receipt_id:reviewId,
   retention_disposition:disposition,
   expected_source_revision:state.source_revision,
   expected_fingerprint_sha256:state.fingerprint_sha256,
   expected_posting_document_sha256:x.posting_document_sha256,
   owner_reviewed:true,resolution_note:note},state.queue_id);
  $('dd706RetentionResult').textContent=d.result.status+
   ' · immutable original evidence receipt #'+d.result.receipt_id+
   ' · retained manifest SHA-256 '+d.result.manifest_sha256+
   '. Books still HOLD until distinct real accounting closure.';
  $('dd706RetentionReviewed').checked=false;
  await refresh();
 }catch(error){$('dd706RetentionResult').textContent='HOLD · '+error.message;}
 finally{button.disabled=false;}
});
$('dd706FinanceExport').addEventListener('click',async()=>{
 try{
  const id=Number($('dd685Campaign').value);
  if(!id||id!==state?.queue_id||!window.DDAuth?.apiFetch)
    throw Error('Authenticated original owner and exact campaign required.');
  const res=await window.DDAuth.apiFetch(endpoint+
    '?export=financial706&campaign_queue_id='+encodeURIComponent(id));
  if(!res.ok)throw Error('Original protected signed retention export denied. HTTP '+res.status);
  const blob=await res.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='devilndove-independent-review-retention-'+id+'-706.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('dd706RetentionResult').textContent='Protected ninth-signed review and original SHA-256 retention manifest exported; actual bookkeeping closure remains HOLD.';
 }catch(error){$('dd706RetentionResult').textContent='HOLD · '+error.message;}
});

$('dd705FinanceRefresh').addEventListener('click',()=>void refresh());
$('dd705FinanceRenewForm').addEventListener('submit',async event=>{
 event.preventDefault();const button=$('dd705FinanceRenewSubmit');button.disabled=true;
 try{
   const originalId=Number($('dd705FinanceSource').value),
    item=(audit705?.items||[]).find(x=>x.live_receipt_id===originalId&&!x.continuity_verified),
    note=$('dd705FinanceRenewNote').value.trim();
   if(!state?.queue_id||!audit705?.history_complete||!audit705.independent_source_configured||
      !item||!$('dd705FinanceRenewReviewed').checked||note.length<25||note.length>600)
     throw Error('Original signed source, Build 704 owner readiness and explicit original owner continuity reason required.');
   const d=await api({action:'live_posting_continuity_705',
    social_post_queue_id:state.queue_id,prior_live_receipt_id:originalId,
    expected_source_revision:state.source_revision,
    expected_fingerprint_sha256:state.fingerprint_sha256,
    owner_reviewed:true,resolution_note:note},state.queue_id);
   $('dd705FinanceRenewResult').textContent=d.result.status+
     ' · fresh independent signed source receipt #'+d.result.receipt_id+
     '. Actual financial bookkeeping close remains HOLD.';
   $('dd705FinanceRenewReviewed').checked=false;await refresh();
 }catch(error){$('dd705FinanceRenewResult').textContent='HOLD · '+error.message;}
 finally{button.disabled=false;}
});
$('dd705FinanceOwnerForm').addEventListener('submit',async event=>{
 event.preventDefault();const button=$('dd705FinanceOwnerSubmit');button.disabled=true;
 try{
   const continuityId=Number($('dd705FinanceOwnerSource').value),
     original=(audit705?.items||[]).find(x=>x.continuity_receipt_id===continuityId&&
        x.continuity_verified&&!x.review_decision),
     decision=$('dd705FinanceDecision').value,
     note=$('dd705FinanceOwnerNote').value.trim();
   if(!original||!audit705.history_complete||
     !['hold_posting_continuity_drift','recommend_manual_financial_closure_review'].includes(decision)||
     !$('dd705FinanceOwnerReviewed').checked||note.length<25||note.length>600)
     throw Error('Select the exact fresh signed receipt and explicitly review the original owner financial evidence.');
   const d=await api({action:'owner_financial_evidence_review_705',
      social_post_queue_id:state.queue_id,continuity_receipt_id:continuityId,
      expected_posting_document_sha256:original.posting_document_sha256,
      expected_source_revision:state.source_revision,
      expected_fingerprint_sha256:state.fingerprint_sha256,
      owner_reviewed:true,decision,resolution_note:note},state.queue_id);
   $('dd705FinanceOwnerResult').textContent=d.result.status+
      ' · protected owner review receipt #'+d.result.receipt_id+
      ' · actual financial books remain HOLD.';
   $('dd705FinanceOwnerReviewed').checked=false;await refresh();
 }catch(error){$('dd705FinanceOwnerResult').textContent='HOLD · '+error.message;}
 finally{button.disabled=false;}
});
$('dd705FinanceExport').addEventListener('click',async()=>{
 try{
   const id=Number($('dd685Campaign').value);
   if(!id||id!==state?.queue_id||!window.DDAuth?.apiFetch)
     throw Error('Authenticated original owner and exact current campaign required.');
   const res=await window.DDAuth.apiFetch(endpoint+'?export=financial705&campaign_queue_id='+encodeURIComponent(id));
   if(!res.ok)throw Error('Protected signed continuity export rejected. HTTP '+res.status);
   const blob=await res.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='devilndove-posting-continuity-'+id+'-705.json';
   document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   $('dd705FinanceOwnerResult').textContent='Source-bound signed posting continuity and owner evidence exported. Actual books remain HOLD.';
 }catch(error){$('dd705FinanceOwnerResult').textContent='HOLD · '+error.message;}
});

$('dd704FinanceRefresh').addEventListener('click',()=>void refresh());
$('dd704FinanceLiveForm').addEventListener('submit',async event=>{
 event.preventDefault();const button=$('dd704FinanceLiveSubmit');button.disabled=true;
 try{
   const postingId=Number($('dd704FinancePosting').value),
     source=(audit704?.readback?.items||[]).find(x=>x.posting_receipt_id===postingId&&
       !x.independent_live_source_verified),
     note=$('dd704FinanceLiveNote').value.trim();
   if(!state?.queue_id||!audit704?.history_complete||!source||
     !audit704.independent_signer_configured||!audit704.origin_authorized||
     !$('dd704FinanceLiveReviewed').checked||note.length<20||note.length>400)
     throw Error('Fresh original owner-accepted posting, independent source and explicit original owner reason required.');
   const d=await api({action:'live_posting_source_readback_704',
     social_post_queue_id:state.queue_id,posting_receipt_id:postingId,
     expected_source_revision:state.source_revision,
     expected_fingerprint_sha256:state.fingerprint_sha256,
     owner_reviewed:true,resolution_note:note},state.queue_id);
   $('dd704FinanceLiveResult').textContent=d.result.status+
     ' · signed source readback receipt #'+d.result.receipt_id+
     '. Actual books still HOLD pending explicit final owner closure.';
   $('dd704FinanceLiveReviewed').checked=false;await refresh();
 }catch(error){$('dd704FinanceLiveResult').textContent='HOLD · '+error.message;}
 finally{button.disabled=false;}
});
$('dd704FinanceOwnerForm').addEventListener('submit',async event=>{
 event.preventDefault();const button=$('dd704FinanceOwnerSubmit');button.disabled=true;
 try{
   const liveId=Number($('dd704FinanceLiveSource').value),
     x=(audit704?.readback?.items||[]).find(x=>x.live_receipt_id===liveId&&
       x.independent_live_source_verified&&!x.financial_readiness_decision),
     decision=$('dd704FinanceDecision').value,
     note=$('dd704FinanceOwnerNote').value.trim();
   if(!x||!audit704?.history_complete||!$('dd704FinanceOwnerReviewed').checked||
     !['hold_external_posting','ready_for_final_owner_closure_review'].includes(decision)||
     note.length<25||note.length>600)
     throw Error('Select fresh independently signed original live source and explicitly review actual owner readiness.');
   const d=await api({action:'owner_financial_readiness_704',
     social_post_queue_id:state.queue_id,live_receipt_id:liveId,decision,
     expected_posting_document_sha256:x.posting_document_sha256,
     expected_source_revision:state.source_revision,
     expected_fingerprint_sha256:state.fingerprint_sha256,
     owner_reviewed:true,resolution_note:note},state.queue_id);
   $('dd704FinanceOwnerResult').textContent=d.result.status+
     ' · owner readiness receipt #'+d.result.receipt_id+
     '. No actual financial book close or certification.';
   $('dd704FinanceOwnerReviewed').checked=false;await refresh();
 }catch(error){$('dd704FinanceOwnerResult').textContent='HOLD · '+error.message;}
 finally{button.disabled=false;}
});
$('dd704FinanceExport').addEventListener('click',async()=>{
 try{
   const id=Number($('dd685Campaign').value);
   if(!id||id!==state?.queue_id||!window.DDAuth?.apiFetch)
     throw Error('Exact original campaign and authenticated owner required.');
   const res=await window.DDAuth.apiFetch(endpoint+'?export=financial704&campaign_queue_id='+encodeURIComponent(id));
   if(!res.ok)throw Error('Source-bound original live posting export denied. HTTP '+res.status);
   const blob=await res.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='devilndove-live-posting-readiness-'+id+'-704.json';
   document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
   $('dd704FinanceOwnerResult').textContent='Protected signed source snapshot ledger exported. Actual books remain HOLD.';
 }catch(error){$('dd704FinanceOwnerResult').textContent='HOLD · '+error.message;}
});

$('dd703FinanceRefresh').addEventListener('click',()=>void refresh());
$('dd703FinancePrepare').addEventListener('click',()=>{
 try{
   const claim=claimFor703();$('dd703FinanceClaim').value=JSON.stringify(claim);
   $('dd703FinancePostingResult').textContent='Exact posting document claim prepared. Obtain independent seventh signer response off-platform; no private key is entered.';
 }catch(error){$('dd703FinancePostingResult').textContent='HOLD · '+error.message;}
});
$('dd703FinancePostingForm').addEventListener('submit',async event=>{
 event.preventDefault();const button=$('dd703FinancePostingSubmit');button.disabled=true;
 try{
   if(!$('dd703FinancePostingReviewed').checked)
     throw Error('Original owner must explicitly review external posting document provenance.');
   const claim=claimFor703(),note=$('dd703FinancePostingNote').value.trim();
   if($('dd703FinanceClaim').value!==JSON.stringify(claim))
     throw Error('Original posting claim changed. Prepare and sign fresh exact claim.');
   if(note.length<20||note.length>400)throw Error('Provide 20–400 original owner review characters.');
   const data=await api({action:'independent_posting_document_703',
     social_post_queue_id:state.queue_id,
     closure_decision_receipt_id:claim.closure_decision_receipt_id,
     posting_document_sha256:claim.posting_document_sha256,
     external_posting_reference:claim.external_posting_reference,
     independent_posting_verifier_id:claim.independent_posting_verifier_id,
     nonce:claim.nonce,issued_at:claim.issued_at,
     signature:$('dd703FinanceSignature').value.trim(),
     expected_source_revision:state.source_revision,
     expected_fingerprint_sha256:state.fingerprint_sha256,
     owner_reviewed:true,resolution_note:note},state.queue_id);
   $('dd703FinancePostingResult').textContent=data.result.status+
     ' · evidence receipt #'+data.result.receipt_id+
     ' · external posting and actual books close remain HOLD.';
   $('dd703FinanceClaim').value='';$('dd703FinanceSignature').value='';
   $('dd703FinancePostingReviewed').checked=false;await refresh();
 }catch(error){$('dd703FinancePostingResult').textContent='HOLD · '+error.message;}
 finally{button.disabled=false;}
});
$('dd703FinanceOwnerForm').addEventListener('submit',async event=>{
 event.preventDefault();const button=$('dd703FinanceOwnerSubmit');button.disabled=true;
 try{
   const postingId=Number($('dd703FinanceOwnerSource').value),
     caseInfo=(audit703?.posting?.items||[]).find(x=>x.posting_receipt_id===postingId&&
       x.posting_document_signed&&!x.owner_acceptance_decision),
     decision=$('dd703FinanceOwnerDecision').value,
     note=$('dd703FinanceOwnerNote').value.trim();
   if(!caseInfo||!audit703.history_complete||!$('dd703FinanceOwnerReviewed').checked||
     note.length<25||note.length>600)
     throw Error('Select actual signed original posting document and review all original owner evidence.');
   if(!['hold_posting_discrepancy','accept_document_for_manual_financial_close'].includes(decision))
     throw Error('Choose explicit original owner review disposition.');
   const data=await api({action:'owner_financial_closure_703',
     social_post_queue_id:state.queue_id,
     posting_receipt_id:postingId,decision,
     expected_posting_document_sha256:caseInfo.posting_document_sha256,
     expected_source_revision:state.source_revision,
     expected_fingerprint_sha256:state.fingerprint_sha256,
     owner_reviewed:true,resolution_note:note},state.queue_id);
   $('dd703FinanceOwnerResult').textContent=data.result.status+
     ' · protected owner audit receipt #'+data.result.receipt_id+
     ' · no independent provider readback or actual book close inferred.';
   $('dd703FinanceOwnerReviewed').checked=false;await refresh();
 }catch(error){$('dd703FinanceOwnerResult').textContent='HOLD · '+error.message;}
 finally{button.disabled=false;}
});
$('dd703FinanceExport').addEventListener('click',async()=>{
 try{
   const id=Number($('dd685Campaign').value);
   if(!id||id!==state?.queue_id||!window.DDAuth?.apiFetch)
     throw Error('Signed-in Admin and exact selected original campaign required.');
   const res=await window.DDAuth.apiFetch(endpoint+'?export=financial703&campaign_queue_id='+encodeURIComponent(id));
   if(!res.ok)throw Error('Protected original posting and owner receipt export denied. HTTP '+res.status);
   const blob=await res.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='devilndove-posting-owner-review-'+id+'-703.json';
   document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
   $('dd703FinanceOwnerResult').textContent='Protected ledger exported; actual external posting and bookkeeping close remain HOLD.';
 }catch(error){$('dd703FinanceOwnerResult').textContent='HOLD · '+error.message;}
});

$('dd702FinanceRefresh').addEventListener('click',()=>void refresh());
$('dd702FinancePrepare').addEventListener('click',()=>{
 try{
   const claim=claimFor702();$('dd702FinanceClaim').value=JSON.stringify(claim);
   $('dd702FinanceResult').textContent='Exact source-bound claim prepared for an independent sixth signer. No private key belongs in this form.';
 }catch(error){$('dd702FinanceResult').textContent='HOLD · '+error.message;}
});
$('dd702FinanceForm').addEventListener('submit',async event=>{
 event.preventDefault();const button=$('dd702FinanceSubmit');button.disabled=true;
 try{
   if(!$('dd702FinanceReviewed').checked)
     throw Error('Original owner must explicitly review independent closure decision and all remaining exceptions.');
   const claim=claimFor702(),note=$('dd702FinanceNote').value.trim();
   if($('dd702FinanceClaim').value!==JSON.stringify(claim))
     throw Error('Original financial claim changed. Prepare and sign a new exact claim.');
   if(note.length<20||note.length>400)throw Error('Provide a 20–400 character source-bound owner note.');
   const data=await api({action:'owner_bookkeeping_decision_702',
     social_post_queue_id:state.queue_id,
     bookkeeping_review_receipt_id:claim.bookkeeping_review_receipt_id,
     decision:claim.decision,remaining_exception_count:claim.remaining_exception_count,
     independent_closure_signer_id:claim.independent_closure_signer_id,
     nonce:claim.nonce,issued_at:claim.issued_at,
     signature:$('dd702FinanceSignature').value.trim(),
     expected_source_revision:state.source_revision,
     expected_fingerprint_sha256:state.fingerprint_sha256,
     owner_reviewed:true,resolution_note:note},state.queue_id);
   $('dd702FinanceResult').textContent=data.result.status+' · independently signed decision #'+
     data.result.receipt_id+' · financial source, bookkeeping postings, accounting close and CONNECTED still HOLD.';
   $('dd702FinanceReviewed').checked=false;
   $('dd702FinanceClaim').value='';$('dd702FinanceSignature').value='';
   await refresh();
 }catch(error){$('dd702FinanceResult').textContent='HOLD · '+error.message;}
 finally{button.disabled=false;}
});
$('dd702FinanceExport').addEventListener('click',async()=>{
 try{
   const id=Number($('dd685Campaign').value);
   if(!id||id!==state?.queue_id||!window.DDAuth?.apiFetch)
     throw Error('Signed-in Admin and exact current campaign required.');
   const response=await window.DDAuth.apiFetch(endpoint+'?export=financial702&campaign_queue_id='+encodeURIComponent(id));
   if(!response.ok)throw Error('Protected independent decision export denied. HTTP '+response.status);
   const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='devilndove-bookkeeping-decision-'+id+'-702.json';
   document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
   $('dd702FinanceResult').textContent='Signed decision ledger exported. Actual ledger close/POST remains HOLD.';
 }catch(error){$('dd702FinanceResult').textContent='HOLD · '+error.message;}
});

$('dd701Refresh').addEventListener('click',()=>void refresh());
$('dd701Prepare').addEventListener('click',()=>{
 try{$('dd701Claim').value=JSON.stringify(claimFor701());
   $('dd701Result').textContent='Exact independent bookkeeping claim prepared. A separate fifth signer must sign off-platform.';}
 catch(error){$('dd701Result').textContent='HOLD · '+error.message;}
});
$('dd701Form').addEventListener('submit',async event=>{
 event.preventDefault();const button=$('dd701Submit');button.disabled=true;
 try{
   if(!$('dd701Reviewed').checked)throw Error('Explicit original owner bookkeeping review required.');
   const claim=claimFor701(),note=$('dd701Note').value.trim();
   if($('dd701Claim').value!==JSON.stringify(claim))throw Error('Bookkeeping source changed; prepare and independently sign the exact current claim.');
   if(note.length<20||note.length>400)throw Error('Owner review note must be 20–400 characters.');
   const response=await api({action:'owner_bookkeeping_review_701',
     social_post_queue_id:state.queue_id,
     original_live_source_receipt_id:claim.original_live_source_receipt_id,
     bookkeeping_ledger_sha256:claim.bookkeeping_ledger_sha256,
     independent_bookkeeper_id:claim.independent_bookkeeper_id,
     nonce:claim.nonce,issued_at:claim.issued_at,
     signature:$('dd701Signature').value.trim(),
     expected_source_revision:state.source_revision,
     expected_fingerprint_sha256:state.fingerprint_sha256,
     owner_reviewed:true,resolution_note:note},state.queue_id);
   $('dd701Result').textContent=response.result.status+' · signed review receipt #'+
     response.result.receipt_id+' · source correction and accounting close still HOLD.';
   $('dd701Claim').value='';$('dd701Signature').value='';
   $('dd701Reviewed').checked=false;await refresh();
 }catch(error){$('dd701Result').textContent='HOLD · '+error.message;}
 finally{button.disabled=false;}
});
$('dd701Export').addEventListener('click',async()=>{
 try{
   const id=Number($('dd685Campaign').value);
   if(!id||id!==state?.queue_id||!window.DDAuth?.apiFetch)
     throw Error('Refresh and authenticate for the exact campaign first.');
   const response=await window.DDAuth.apiFetch(endpoint+'?export=financial701&campaign_queue_id='+encodeURIComponent(id));
   if(!response.ok)throw Error('Protected bookkeeping review export denied. HTTP '+response.status);
   const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='devilndove-bookkeeping-review-'+id+'-701.json';
   document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
   $('dd701Result').textContent='Protected review exported · no accounting close or CONNECTED assertion.';
 }catch(error){$('dd701Result').textContent='HOLD · '+error.message;}
});

$('dd700FinanceRefresh').addEventListener('click',()=>void refresh());
$('dd700FinanceForm').addEventListener('submit',async event=>{
event.preventDefault();
const submit=$('dd700FinanceSubmit');submit.disabled=true;
try{
if(!audit700?.history_complete||!state?.queue_id)
throw Error('Refresh the complete protected original source chain first.');
if(!$('dd700FinanceReviewed').checked)
throw Error('Original owner must explicitly approve one external read-only source request.');
const [older,newer,intake,witness]=$('dd700FinanceSource').value.split('|').map(Number);
if(![older,newer,intake,witness].every(n=>Number.isSafeInteger(n)&&n>0))
throw Error('Select exact independent document witness and original source receipts.');
const note=$('dd700FinanceNote').value.trim();
if(note.length<20||note.length>400)throw Error('Owner reason must be 20–400 characters.');
$('dd700FinanceResult').textContent='Requesting one original external source-of-record readback. No automatic retries…';
const d=await api({action:'owner_live_source_readback_700',
social_post_queue_id:state.queue_id,
older_receipt_id:older,newer_receipt_id:newer,
repair_intake_receipt_id:intake,independent_document_witness_receipt_id:witness,
expected_fingerprint_sha256:state.fingerprint_sha256,
expected_source_revision:state.source_revision,
owner_reviewed:true,resolution_note:note},state.queue_id);
$('dd700FinanceResult').textContent=d.result.status+' · independently signed original live source receipt #'+
d.result.receipt_id+' · financial bookkeeping closure NOT inferred.';
$('dd700FinanceReviewed').checked=false;$('dd700FinanceNote').value='';
await refresh();
}catch(error){$('dd700FinanceResult').textContent='HOLD · '+error.message;}
finally{submit.disabled=false;}
});
$('dd700FinanceExport').addEventListener('click',async()=>{
try{
const id=Number($('dd685Campaign').value);
if(!id||!state?.queue_id||id!==state.queue_id)
throw Error('Refresh the exact current campaign first.');
if(!window.DDAuth?.apiFetch)throw Error('Admin sign-in required.');
const r=await window.DDAuth.apiFetch(endpoint+'?export=financial700&campaign_queue_id='+encodeURIComponent(id));
if(!r.ok)throw Error('Protected export denied. HTTP '+r.status);
const blob=await r.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');
link.href=url;link.download='devilndove-finance-live-source-'+id+'-700.json';
document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
$('dd700FinanceResult').textContent='Protected live-source evidence exported. Original financial close still HOLD.';
}catch(error){$('dd700FinanceResult').textContent='HOLD · '+error.message;}
});

$('dd699Prepare').addEventListener('click',()=>{
try{
$('dd699Claim').value=JSON.stringify(claimFor699());
$('dd699Result').textContent='Exact original-source document witness claim prepared for a DISTINCT independent signer. Never paste private keys. Live repair remains HOLD.';
}catch(e){$('dd699Result').textContent='HOLD · '+e.message;}
});
$('dd699Form').addEventListener('submit',async e=>{
e.preventDefault();const button=$('dd699Submit');button.disabled=true;
try{
if(!$('dd699Reviewed').checked)throw Error('Explicit original owner review is required.');
const claim=claimFor699();
if($('dd699Claim').value!==JSON.stringify(claim))
throw Error('Original claim changed. Prepare a fresh independent signature.');
const note=$('dd699Note').value.trim();
if(note.length<20||note.length>400)throw Error('Original review note must be 20–400 characters.');
const d=await api({action:'owner_finance_review_699',
social_post_queue_id:state.queue_id,older_receipt_id:claim.older_receipt_id,
newer_receipt_id:claim.newer_receipt_id,
repair_intake_receipt_id:claim.repair_intake_receipt_id,
expected_fingerprint_sha256:state.fingerprint_sha256,
expected_source_revision:state.source_revision,
independent_verifier_id:claim.independent_verifier_id,
nonce:claim.nonce,issued_at:claim.issued_at,signature:$('dd699Signature').value.trim(),
owner_reviewed:true,resolution_note:note},state.queue_id);
$('dd699Result').textContent=d.result.status+' · protected original signed document witness receipt #'+
d.result.receipt_id+' · live original source repair NOT verified.';
$('dd699Reviewed').checked=false;$('dd699Note').value='';
$('dd699Signature').value='';$('dd699Claim').value='';
await refresh();
}catch(error){$('dd699Result').textContent='HOLD · '+error.message;}
finally{button.disabled=false;}
});
$('dd699Export').addEventListener('click',async()=>{
try{
const id=Number($('dd685Campaign').value);
if(!id||!state?.queue_id||id!==state.queue_id)throw Error('Select exact original financial campaign.');
if(!window.DDAuth?.apiFetch)throw Error('Authenticated Admin required.');
const response=await window.DDAuth.apiFetch(endpoint+'?export=financial699&campaign_queue_id='+encodeURIComponent(id));
if(!response.ok)throw Error('Protected export denied. HTTP '+response.status);
const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
a.href=url;a.download='devilndove-finance-source-witness-'+id+'-699.json';
document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
$('dd699Result').textContent='Protected original signed document evidence exported. Live source repair remains HOLD.';
}catch(error){$('dd699Result').textContent='HOLD · '+error.message;}
});

$('dd698Decision').addEventListener('change',chooseSources698);
chooseSources698();
$('dd698Form').addEventListener('submit',async event=>{
event.preventDefault();const button=$('dd698Submit');button.disabled=true;
try{
if(!state?.queue_id||!audit698?.history_complete)
throw Error('Refresh complete bounded original source before owner review.');
if(!$('dd698Reviewed').checked)throw Error('Explicit original owner review required.');
const [a,b,c,caseId]=$('dd698Source').value.split('|'),
ref=Number(a),newer=Number(b),previous=Number(c),
decision=$('dd698Decision').value,note=$('dd698Note').value.trim();
if(!Number.isSafeInteger(ref)||ref<1||!Number.isSafeInteger(previous)||previous<1||
note.length<20||note.length>400)
throw Error('Select original source, prior receipt and 20–400 character review note.');
let extra={};
if(decision==='intake_source_repair_proof'){
const observed=$('dd698Observed').value;
if(!observed)throw Error('External source observed time required.');
extra={external_reference:$('dd698Reference').value.trim(),
external_document_sha256:$('dd698Digest').value.trim().toLowerCase(),
external_observed_at:new Date(observed).toISOString()};
}else if(decision==='record_escalation_recovery')
extra={case_id:caseId,followup_disposition:$('dd698Disposition').value};
else if(decision==='record_master_drift')
extra={expected_master_receipt_id:state.verified_master_receipt_id,
expected_prior_master_receipt_id:audit698.master.prior_master_receipt_id};
const d=await api({action:'owner_finance_review_698',
social_post_queue_id:state.queue_id,decision,reference_receipt_id:ref,
newer_receipt_id:newer,prior_receipt_id:previous,
expected_fingerprint_sha256:state.fingerprint_sha256,
expected_source_revision:state.source_revision,owner_reviewed:true,
resolution_note:note,...extra},state.queue_id);
$('dd698Result').textContent=d.result.status+' · durable original owner receipt #'+
d.result.receipt_id+' · source repair, independent Master re-attestation and audited finance HOLD.';
$('dd698Note').value='';$('dd698Reviewed').checked=false;
await refresh();
}catch(e){$('dd698Result').textContent='HOLD · '+e.message;}
finally{button.disabled=false;}
});
$('dd698Export').addEventListener('click',async()=>{
try{
const id=Number($('dd685Campaign').value);
if(!id||!state?.queue_id||id!==state.queue_id)throw Error('Refresh exact original campaign.');
if(!window.DDAuth?.apiFetch)throw Error('Authenticated Admin required.');
const r=await window.DDAuth.apiFetch(endpoint+'?export=financial698&campaign_queue_id='+encodeURIComponent(id));
if(!r.ok)throw Error('Protected export denied. HTTP '+r.status);
const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
a.href=url;a.download='devilndove-finance-recovery-'+id+'-698.json';
document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
$('dd698Result').textContent='Protected source-bound review exported; original source repair unverified.';
}catch(e){$('dd698Result').textContent='HOLD · '+e.message;}
});

$('dd697Decision').addEventListener('change',chooseSources697);
chooseSources697();
$('dd697Prepare').addEventListener('click',()=>{
try{
const claim=claimFor697();$('dd697Claim').value=JSON.stringify(claim);
$('dd697Result').textContent='Exact claim prepared. Obtain a signed reply from a DIFFERENT independent reconciler. Original source repair remains HOLD.';
}catch(e){$('dd697Result').textContent='HOLD · '+e.message;}
});
$('dd697Form').addEventListener('submit',async e=>{
e.preventDefault();const btn=$('dd697Submit');btn.disabled=true;
try{
if(!state?.queue_id||!audit697?.history_complete)
throw Error('Refresh exact complete bounded source history first.');
if(!$('dd697Reviewed').checked)throw Error('Explicit original owner review required.');
const [a,b,c,caseId]=$('dd697Source').value.split('|'),
ref=Number(a),newer=Number(b),prior=Number(c),
decision=$('dd697Decision').value,note=$('dd697Note').value.trim();
if(!Number.isSafeInteger(ref)||ref<1||!Number.isSafeInteger(prior)||prior<1||
note.length<20||note.length>400)
throw Error('Choose exact prior evidence and provide 20–400 character owner review.');
let fields={};
if(decision==='reconcile_correction_evidence'){
const claim=claimFor697();
if($('dd697Claim').value!==JSON.stringify(claim))
throw Error('Canonical original claim changed. Prepare fresh independent signature.');
fields={reconciler_id:claim.reconciler_id,nonce:claim.nonce,
issued_at:claim.issued_at,signature:$('dd697Signature').value.trim()};
}else if(decision==='review_escalation_resolution')
fields={case_id:caseId,disposition:$('dd697Disposition').value};
else if(decision==='renew_master_attestation')
fields={expected_master_receipt_id:state.verified_master_receipt_id};
const d=await api({action:'owner_finance_review_697',
social_post_queue_id:state.queue_id,decision,reference_receipt_id:ref,
newer_receipt_id:newer,prior_receipt_id:prior,
expected_fingerprint_sha256:state.fingerprint_sha256,
expected_source_revision:state.source_revision,owner_reviewed:true,
resolution_note:note,...fields},state.queue_id);
$('dd697Result').textContent=d.result.status+' · durable source-bound receipt #'+
d.result.receipt_id+' · original source repair, audited financials and connection HOLD.';
$('dd697Reviewed').checked=false;$('dd697Note').value='';
$('dd697Signature').value='';$('dd697Claim').value='';
await refresh();
}catch(e){$('dd697Result').textContent='HOLD · '+e.message;}
finally{btn.disabled=false;}
});
$('dd697Export').addEventListener('click',async()=>{
try{
const id=Number($('dd685Campaign').value);
if(!id||!state?.queue_id||id!==state.queue_id)throw Error('Refresh exact original campaign.');
if(!window.DDAuth?.apiFetch)throw Error('Authenticated Admin required.');
const r=await window.DDAuth.apiFetch(endpoint+'?export=financial697&campaign_queue_id='+encodeURIComponent(id));
if(!r.ok)throw Error('Protected export failed. HTTP '+r.status);
const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
a.href=url;a.download='devilndove-finance-reconciliation-'+id+'-697.json';
document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
$('dd697Result').textContent='Protected source-bound evidence exported. Independent source repair remains HOLD.';
}catch(e){$('dd697Result').textContent='HOLD · '+e.message;}
});

$('dd696Decision').addEventListener('change',chooseSources696);
chooseSources696();
$('dd696Prepare').addEventListener('click',()=>{
try{
const c=claimFor696();$('dd696Claim').value=JSON.stringify(c);
$('dd696Result').textContent='Canonical claim prepared. Obtain independent custodian signature; never paste a private key here.';
}catch(e){$('dd696Result').textContent='HOLD · '+e.message;}
});
$('dd696Form').addEventListener('submit',async e=>{
e.preventDefault();const btn=$('dd696Submit');btn.disabled=true;
try{
if(!state?.queue_id||!audit696?.history_complete)throw Error('Refresh complete bounded original evidence first.');
if(!$('dd696Reviewed').checked)throw Error('Explicit original owner review required.');
const [a,b,c,caseId]=$('dd696Source').value.split('|'),
ref=Number(a),newer=Number(b),other=Number(c),
decision=$('dd696Decision').value,note=$('dd696Note').value.trim();
if(!Number.isSafeInteger(ref)||ref<1||note.length<20||note.length>400)
throw Error('Select exact evidence and supply 20–400 character owner review.');
let fields={};
if(decision==='verify_correction_attestation'){
const claim=claimFor696();
if($('dd696Claim').value!==JSON.stringify(claim))
throw Error('Original canonical claim changed. Prepare and obtain a fresh external signature.');
fields={original_intake_receipt_id:other,signer_id:claim.signer_id,
nonce:claim.nonce,issued_at:claim.issued_at,signature:$('dd696Signature').value.trim()};
}else if(decision==='escalate_aging_followup')fields={case_id:caseId};
else if(decision==='recheck_master_continuity')fields={
prior_master_revalidation_receipt_id:other,
expected_master_receipt_id:state.verified_master_receipt_id};
const d=await api({action:'owner_finance_review_696',
social_post_queue_id:state.queue_id,decision,reference_receipt_id:ref,
newer_receipt_id:newer,expected_fingerprint_sha256:state.fingerprint_sha256,
expected_source_revision:state.source_revision,owner_reviewed:true,
resolution_note:note,...fields},state.queue_id);
$('dd696Result').textContent=d.result.status+' · receipt #'+d.result.receipt_id+
' · original source mismatch and certified financial closure remain HOLD.';
$('dd696Reviewed').checked=false;$('dd696Note').value='';
$('dd696Signature').value='';$('dd696Claim').value='';
await refresh();
}catch(err){$('dd696Result').textContent='HOLD · '+err.message;}
finally{btn.disabled=false;}
});
$('dd696Export').addEventListener('click',async()=>{
try{
const id=Number($('dd685Campaign').value);
if(!id||!state?.queue_id||id!==state.queue_id)throw Error('Refresh original protected campaign.');
if(!window.DDAuth?.apiFetch)throw Error('Authenticated owner session required.');
const r=await window.DDAuth.apiFetch(endpoint+'?export=financial696&campaign_queue_id='+encodeURIComponent(id));
if(!r.ok)throw Error('Protected export refused. HTTP '+r.status);
const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
a.href=url;a.download='devilndove-finance-correction-'+id+'-696.json';
document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
$('dd696Result').textContent='Protected bounded original evidence exported; source repair not inferred.';
}catch(err){$('dd696Result').textContent='HOLD · '+err.message;}
});

$('dd695Decision').addEventListener('change',chooseSources695);
chooseSources695();
$('dd695Form').addEventListener('submit',async e=>{
e.preventDefault();const btn=$('dd695Submit');btn.disabled=true;
try{
if(!state?.queue_id||!audit695?.history_complete)throw Error('Exact original campaign and complete source history required.');
if(!$('dd695Reviewed').checked)throw Error('Original owner review required.');
const [a,b,c]=$('dd695Source').value.split('|'),ref=Number(a),newer=Number(b),
decision=$('dd695Decision').value,note=$('dd695Note').value.trim();
if(!Number.isSafeInteger(ref)||ref<1||!Number.isSafeInteger(newer)||newer<1)
throw Error('Select exact original source receipt pair.');
if(note.length<20||note.length>400)throw Error('Enter a substantial 20–400 character owner note.');
const externalTime=$('dd695Observed').value;
if(decision==='intake_source_correction'&&!externalTime)throw Error('Original external evidence observed time required.');
const d=await api({action:'owner_finance_review_695',social_post_queue_id:state.queue_id,
decision,reference_receipt_id:ref,newer_receipt_id:newer,
expected_prior_closure_receipt_id:Number(c),
expected_fingerprint_sha256:state.fingerprint_sha256,
expected_source_revision:state.source_revision,
expected_master_receipt_id:state.verified_master_receipt_id,
external_custodian_id:$('dd695Custodian').value.trim(),
external_evidence_reference:$('dd695Reference').value.trim(),
external_evidence_sha256:$('dd695Digest').value.trim().toLowerCase(),
external_observed_at:externalTime?new Date(externalTime).toISOString():null,
owner_reviewed:true,resolution_note:note},state.queue_id);
$('dd695Result').textContent=d.result.status+' · durable owner receipt #'+d.result.receipt_id+
' · source repair, continuous connection and financial certification HOLD.';
$('dd695Note').value='';$('dd695Reviewed').checked=false;await refresh();
}catch(err){$('dd695Result').textContent='HOLD · '+err.message;}
finally{btn.disabled=false;}
});
$('dd695Export').addEventListener('click',async()=>{
try{
const id=Number($('dd685Campaign').value);
if(!id||!state?.queue_id||state.queue_id!==id)throw Error('Refresh exact protected financial campaign.');
if(!window.DDAuth?.apiFetch)throw Error('Authenticated Admin required.');
const r=await window.DDAuth.apiFetch(endpoint+'?export=financial695&campaign_queue_id='+encodeURIComponent(id));
if(!r.ok)throw Error('Protected export denied. HTTP '+r.status);
const b=await r.blob(),url=URL.createObjectURL(b),a=document.createElement('a');
a.href=url;a.download='devilndove-finance-review-'+id+'-695.json';
document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
$('dd695Result').textContent='Protected evidence exported; independent correction still unverified.';
}catch(err){$('dd695Result').textContent='HOLD · '+err.message;}
});

$('dd694Decision').addEventListener('change',chooseSources694);
$('dd694Form').addEventListener('submit',async event=>{
event.preventDefault();const btn=$('dd694Submit');btn.disabled=true;
try{
if(!state?.queue_id||!audit694?.history_complete||!audit694?.master_accepted_now)
throw Error('Fresh exact independently signed Master and complete owner history required.');
if(!$('dd694Reviewed').checked)throw Error('Explicit owner review required.');
const [caseId,refStr,secondStr]=$('dd694Source').value.split('|');
const ref=Number(refStr),second=Number(secondStr),
decision=$('dd694Decision').value,note=$('dd694Note').value.trim();
if(!Number.isSafeInteger(ref)||ref<1)throw Error('Select exact owner evidence receipt.');
if(note.length<20||note.length>400)throw Error('Enter a 20–400 character original owner evidence note.');
const result=await api({action:'owner_finance_resolution_694',
social_post_queue_id:state.queue_id,decision,case_id:caseId||'',
reference_receipt_id:ref,newer_receipt_id:second,
expected_fingerprint_sha256:state.fingerprint_sha256,
expected_source_revision:state.source_revision,
expected_master_receipt_id:state.verified_master_receipt_id,
owner_reviewed:true,resolution_note:note},state.queue_id);
$('dd694Result').textContent=result.result.status+' · durable owner receipt #'+
result.result.receipt_id+
' · source incident repair, independent continuous connection and financial certification remain HOLD.';
$('dd694Reviewed').checked=false;$('dd694Note').value='';
await refresh();
}catch(e){$('dd694Result').textContent='HOLD · '+e.message;}
finally{btn.disabled=false;}
});
$('dd694Export').addEventListener('click',async()=>{
try{
const id=Number($('dd685Campaign').value);
if(!id||!state?.queue_id||state.queue_id!==id)
throw Error('Select and refresh exact protected financial campaign.');
if(!window.DDAuth?.apiFetch)throw Error('Authenticated Admin session required.');
const r=await window.DDAuth.apiFetch(endpoint+'?export=financial694&campaign_queue_id='+encodeURIComponent(id));
if(!r.ok)throw Error('Protected export refused. HTTP '+r.status);
const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
a.href=url;a.download='devilndove-finance-resolution-'+id+'-694.json';
document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
$('dd694Result').textContent='Protected bounded owner resolution ledger exported with source HOLD controls.';
}catch(e){$('dd694Result').textContent='HOLD · '+e.message;}
});

$('dd693Decision').addEventListener('change',chooseSources693);
$('dd693Form').addEventListener('submit',async e=>{
e.preventDefault();const button=$('dd693Submit');button.disabled=true;
try{
if(!state?.queue_id||!audit693?.history_complete)
throw Error('Exact, complete owner receipt ledger required.');
if(!$('dd693Reviewed').checked)throw Error('Explicit owner review consent required.');
const [caseId,refStr,newerStr]=$('dd693Source').value.split('|'),
ref=Number(refStr),newer=Number(newerStr),
decision=$('dd693Decision').value,note=$('dd693Note').value.trim();
if(!Number.isSafeInteger(ref)||ref<1)throw Error('Select an exact source-bound owner receipt.');
if(note.length<20||note.length>400)throw Error('Record 20–400 characters of reviewed owner evidence.');
if((decision==='revalidate_master_provenance'||decision==='accept_owner_audit_history')&&
!audit693.provenance.current_master_independently_reverified)
throw Error('Current independently signed Master acceptance required. HOLD.');
if(decision==='accept_owner_audit_history'&&!audit693.master_accepted_now)
throw Error('Unresolved provenance or Master HOLD prevents owner audit acceptance.');
const prior=decision==='revalidate_master_provenance'?
(audit693.provenance?.pairs||[]).find(x=>x.older_receipt_id===ref&&
x.newer_receipt_id===newer)?.previous_owner_receipt_id:null;
const d=await api({action:'owner_finance_audit_693',
social_post_queue_id:state.queue_id,decision,case_id:caseId||'',
reference_receipt_id:ref,newer_receipt_id:newer,
prior_owner_review_receipt_id:prior,
expected_fingerprint_sha256:state.fingerprint_sha256,
expected_source_revision:state.source_revision,
expected_master_receipt_id:state.verified_master_receipt_id,
owner_reviewed:true,resolution_note:note},state.queue_id);
$('dd693Result').textContent=d.result.status+' · durable owner audit receipt #'+
d.result.receipt_id+' · external Master connection and financial certification remain separately gated.';
$('dd693Reviewed').checked=false;$('dd693Note').value='';
await refresh();
}catch(error){$('dd693Result').textContent='HOLD · '+error.message;}
finally{button.disabled=false;}
});
$('dd693Export').addEventListener('click',async()=>{
try{
const id=Number($('dd685Campaign').value);
if(!id||!state?.queue_id||id!==state.queue_id)throw Error('Select and refresh an exact campaign.');
if(!window.DDAuth?.apiFetch)throw Error('Authenticated Admin session required.');
const r=await window.DDAuth.apiFetch(endpoint+'?export=financial693&campaign_queue_id='+encodeURIComponent(id));
if(!r.ok)throw Error('Protected audit export refused. HTTP '+r.status);
const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
a.href=url;a.download='devilndove-finance-audit-'+id+'-693.json';
document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
$('dd693Result').textContent='Protected bounded owner audit history exported with all unresolved HOLD evidence.';
}catch(error){$('dd693Result').textContent='HOLD · '+error.message;}
});

$('dd692Decision').addEventListener('change',chooseSources692);
$('dd692Form').addEventListener('submit',async event=>{
event.preventDefault();const btn=$('dd692Submit');btn.disabled=true;
try{
if(!state?.queue_id||!audit692?.history_complete)
throw Error('Complete bounded owner source history is required.');
if(!$('dd692Reviewed').checked)throw Error('Explicit owner evidence review is required.');
const [caseId,refStr,nextStr]=$('dd692Source').value.split('|');
const ref=Number(refStr),newer=Number(nextStr),
decision=$('dd692Decision').value,note=$('dd692Note').value.trim();
if(!Number.isSafeInteger(ref)||ref<1)throw Error('Select an exact original evidence receipt.');
if(note.length<20||note.length>400)throw Error('Provide a substantial 20–400 character owner note.');
if(decision==='reconcile_closure_audit'&&!audit692.master_accepted_now)
throw Error('Currently independently verified signed Master receipt required. HOLD.');
const response=await api({action:'owner_finance_followup_692',
social_post_queue_id:state.queue_id,decision,case_id:caseId||'',
reference_receipt_id:ref,newer_receipt_id:newer,
expected_fingerprint_sha256:state.fingerprint_sha256,
expected_source_revision:state.source_revision,
expected_master_receipt_id:state.verified_master_receipt_id,
owner_reviewed:true,resolution_note:note},state.queue_id);
$('dd692Result').textContent=response.result.status+
' · exact durable owner review #'+response.result.receipt_id+
' · external Master and financial certification remain separately evidence-gated.';
$('dd692Reviewed').checked=false;$('dd692Note').value='';
await refresh();
}catch(error){$('dd692Result').textContent='HOLD · '+error.message;}
finally{btn.disabled=false;}
});
$('dd692Export').addEventListener('click',async()=>{
try{
const id=Number($('dd685Campaign').value);
if(!id||!state?.queue_id||state.queue_id!==id)
throw Error('Select and refresh exact financial campaign first.');
if(!window.DDAuth?.apiFetch)throw Error('Protected Admin session required.');
const r=await window.DDAuth.apiFetch(endpoint+'?export=financial692&campaign_queue_id='+encodeURIComponent(id));
if(!r.ok)throw Error('Protected owner report refused. HTTP '+r.status);
const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
a.href=url;a.download='devilndove-finance-owner-'+id+'-692.json';
document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
$('dd692Result').textContent='Protected financial owner review exported, with all evidence HOLD gates visible.';
}catch(error){$('dd692Result').textContent='HOLD · '+error.message;}
});

$('dd691Decision').addEventListener('change',chooseSources691);
$('dd691Form').addEventListener('submit',async event=>{
event.preventDefault();const btn=$('dd691Submit');btn.disabled=true;
try{
if(!state?.queue_id||!audit691?.history_complete)throw Error('Complete exact protected evidence required.');
if(!$('dd691Reviewed').checked)throw Error('Explicit owner review required.');
const [caseId,refStr,newerStr]=$('dd691Source').value.split('|');
const ref=Number(refStr),newer=Number(newerStr),decision=$('dd691Decision').value;
if(!Number.isSafeInteger(ref)||ref<=0)throw Error('Select an exact source receipt.');
if(decision==='accept_closure_continuity'&&!audit691.master_accepted_now)
throw Error('Current independently reverified signed Master required. HOLD.');
const note=$('dd691Note').value.trim();
if(note.length<20||note.length>400)throw Error('Enter a 20–400 character owner evidence note.');
const result=await api({action:'owner_finance_continuity_691',social_post_queue_id:state.queue_id,
decision,case_id:caseId||'',reference_receipt_id:ref,newer_receipt_id:newer,
expected_fingerprint_sha256:state.fingerprint_sha256,
expected_source_revision:state.source_revision,
expected_master_receipt_id:state.verified_master_receipt_id,
owner_reviewed:true,resolution_note:note},state.queue_id);
$('dd691Result').textContent=result.result.status+' · durable owner receipt #'+
result.result.receipt_id+' · external Master and certified financial state remain separately gated.';
$('dd691Reviewed').checked=false;$('dd691Note').value='';
await refresh();
}catch(e){$('dd691Result').textContent='HOLD · '+e.message;}finally{btn.disabled=false;}
});
$('dd691Export').addEventListener('click',async()=>{
try{
const id=Number($('dd685Campaign').value);
if(!id||!state?.queue_id||state.queue_id!==id)throw Error('Select and refresh the exact campaign first.');
if(!window.DDAuth?.apiFetch)throw Error('Signed-in Admin session required.');
const r=await window.DDAuth.apiFetch(endpoint+'?export=financial691&campaign_queue_id='+encodeURIComponent(id));
if(!r.ok)throw Error('Protected owner export refused. HTTP '+r.status);
const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
a.href=url;a.download='devilndove-finance-continuity-'+id+'-691.json';
document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
$('dd691Result').textContent='Protected owner continuity report exported with unresolved HOLD evidence.';
}catch(e){$('dd691Result').textContent='HOLD · '+e.message;}
});

$('dd690Decision').addEventListener('change',chooseCases690);
$('dd690Form').addEventListener('submit',async e=>{
e.preventDefault();
const submit=$('dd690Submit');submit.disabled=true;
try{
const v=audit690;
if(!state?.queue_id||!v?.history_complete)throw Error('Complete source and owner history required.');
if(!$('dd690Reviewed').checked)throw Error('Owner review consent is required.');
const choice=$('dd690Source').value,index=choice.lastIndexOf('|');
if(index<1)throw Error('Select exact case and original evidence receipt.');
const note=$('dd690Note').value.trim();
if(note.length<20||note.length>400)throw Error('Provide a 20–400 character case evidence note.');
const decision=$('dd690Decision').value;
if(decision==='reconcile_owner_closure'&&!v.master_accepted_now)
throw Error('Independent current Master verification required. HOLD.');
const d=await api({action:'owner_finance_reconcile_690',
social_post_queue_id:state.queue_id,decision,
case_id:choice.slice(0,index),reference_receipt_id:Number(choice.slice(index+1)),
expected_fingerprint_sha256:state.fingerprint_sha256,
expected_source_revision:state.source_revision,
expected_master_receipt_id:state.verified_master_receipt_id,
owner_reviewed:true,resolution_note:note},state.queue_id);
$('dd690Result').textContent=d.result.status+' · exact recorded owner receipt #'+d.result.receipt_id+
' · no external replay, automatic repair, or financial certification.';
$('dd690Reviewed').checked=false;$('dd690Note').value='';
await refresh();
}catch(e){$('dd690Result').textContent='HOLD · '+e.message;}
finally{submit.disabled=false;}
});
$('dd690Export').addEventListener('click',async()=>{
try{
const id=Number($('dd685Campaign').value);
if(!id||!state?.queue_id||state.queue_id!==id)throw Error('Choose and refresh the selected campaign first.');
if(!window.DDAuth?.apiFetch)throw Error('Authenticated Admin session required.');
const r=await window.DDAuth.apiFetch(endpoint+'?export=financial690&campaign_queue_id='+encodeURIComponent(id));
if(!r.ok)throw Error('Protected export refused. HTTP '+r.status);
const blob=await r.blob(),url=URL.createObjectURL(blob);
const a=document.createElement('a');a.href=url;a.download='devilndove-finance-continuity-'+id+'-690.json';
document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
$('dd690Result').textContent='Protected sampled continuity report exported; unresolved HOLD evidence retained.';
}catch(e){$('dd690Result').textContent='HOLD · '+e.message;}
});

$('dd689Decision').addEventListener('change',chooseAudit689);
$('dd689AuditForm').addEventListener('submit',async e=>{
e.preventDefault();
const btn=$('dd689Submit');btn.disabled=true;
try{
if(!state?.queue_id||!audit689?.history_complete||!audit689?.master_accepted_now)
throw Error('Current independently verified signed Master evidence and replay-complete history required.');
if(!$('dd689Reviewed').checked)throw Error('Explicit owner evidence review is required.');
const selected=$('dd689Source').value,index=selected.lastIndexOf('|');
if(index<1)throw Error('Select an exact previously recorded owner evidence receipt.');
const note=$('dd689Note').value.trim();
if(note.length<20||note.length>400)throw Error('Add 20–400 characters of specific owner review evidence.');
const d=await api({action:'owner_finance_audit_689',social_post_queue_id:state.queue_id,
decision:$('dd689Decision').value,case_id:selected.slice(0,index),
reference_receipt_id:Number(selected.slice(index+1)),
expected_fingerprint_sha256:state.fingerprint_sha256,
expected_master_receipt_id:state.verified_master_receipt_id,
owner_reviewed:true,resolution_note:note},state.queue_id);
$('dd689Result').textContent=d.result.status+' · exact owner audit #'+
d.result.receipt_id+' recorded. No external Master replay or profit certification.';
$('dd689Reviewed').checked=false;$('dd689Note').value='';
await refresh();
}catch(error){$('dd689Result').textContent='HOLD · '+error.message;}
finally{btn.disabled=false;}
});
$('dd689Export').addEventListener('click',async()=>{
try{
const id=Number($('dd685Campaign').value);
if(!id||!state?.queue_id||id!==state.queue_id)throw Error('Select and refresh the exact campaign first.');
if(!window.DDAuth?.apiFetch)throw Error('Authenticated Admin required.');
const response=await window.DDAuth.apiFetch(endpoint+'?export=financial689&campaign_queue_id='+encodeURIComponent(id));
if(!response.ok)throw Error('Protected owner audit export refused. HTTP '+response.status);
const blob=await response.blob(),url=URL.createObjectURL(blob);
const a=document.createElement('a');a.href=url;
a.download='devilndove-finance-replay-'+id+'-689.json';
document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
$('dd689Result').textContent='Owner audit report exported with all unresolved HOLD gates shown.';
}catch(error){$('dd689Result').textContent='HOLD · '+error.message;}
});

$('dd688Decision').addEventListener('change',chooseCases688);
$('dd688OwnerReview').addEventListener('submit',async e=>{
e.preventDefault();
const button=$('dd688Submit');button.disabled=true;
try{
if(!state?.queue_id||!audit688?.history_complete)
throw Error('Refresh exact selected campaign and complete the owner audit history first.');
if(!$('dd688Reviewed').checked)throw Error('Explicit owner evidence review is required.');
const choice=$('dd688Case').value,pos=choice.lastIndexOf('|');
if(pos<1)throw Error('Choose the exact current incident evidence receipt.');
const note=$('dd688Note').value.trim();
if(note.length<20||note.length>400)throw Error('Enter a 20–400 character evidence note.');
const action=$('dd688Decision').value;
const answer=await api({action:'owner_finance_review_688',
social_post_queue_id:state.queue_id,decision:action,case_id:choice.slice(0,pos),
expected_evidence_receipt_id:Number(choice.slice(pos+1)),
expected_fingerprint_sha256:state.fingerprint_sha256,owner_reviewed:true,
resolution_note:note},state.queue_id);
$('dd688Result').textContent=answer.result.status+' · durable owner audit receipt #'+
answer.result.receipt_id+' · Master acceptance/financial certification are separate evidence gates.';
$('dd688Reviewed').checked=false;$('dd688Note').value='';
await refresh();
}catch(error){$('dd688Result').textContent='HOLD · '+error.message;}
finally{button.disabled=false;}
});
$('dd688Export').addEventListener('click',async()=>{
try{
const id=Number($('dd685Campaign').value);
if(!id||!state?.queue_id||id!==state.queue_id)throw Error('Refresh a selected campaign first.');
if(!window.DDAuth?.apiFetch)throw Error('Admin authentication is unavailable.');
const res=await window.DDAuth.apiFetch(endpoint+'?export=financial688&campaign_queue_id='+encodeURIComponent(id));
if(!res.ok)throw Error('Protected report export was refused. HTTP '+res.status);
const blob=await res.blob(),url=URL.createObjectURL(blob);
const a=document.createElement('a');a.href=url;a.download='devilndove-financial-owner-recovery-'+id+'-688.json';
document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
$('dd688Result').textContent='Protected owner evidence report prepared. Historical status does not certify Master acceptance.';
}catch(error){$('dd688Result').textContent='HOLD · '+error.message;}
});

$('dd687Review').addEventListener('click',()=>{
$('dd685Recovery').scrollIntoView({behavior:'smooth',block:'start'});
$('dd685Note').focus({preventScroll:true});
});
$('dd686Escalate').addEventListener('click',async()=>{
try{
if(!state?.alerts686?.source_drift)throw Error('Current signed source/Master drift must be read back first.');
if(!$('dd685Reviewed').checked)throw Error('Owner must review exact source evidence in the Build 685 form.');
const note=$('dd685Note').value.trim();
if(note.length<20||note.length>400)throw Error('Add a substantial 20–400 character owner evidence note.');
await send('owner_finance_recovery_685',{decision:'open',issue_code:state.status,
case_id:'',resolution_note:note,expected_master_acceptance_receipt_id:state.verified_master_receipt_id});
$('dd685Reviewed').checked=false;
$('dd686Result').textContent='Owner drift incident saved in append-only evidence. Independent Master acceptance remains HOLD.';
}catch(e){$('dd686Result').textContent='HOLD · '+e.message;}
});

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
