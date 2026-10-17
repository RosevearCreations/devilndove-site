// Build 413 — click-to-load SLA and follow-up, handoff evidence only, no polling.
(()=>{'use strict';const $=id=>document.getElementById(id);
const e={root:$('provider413'),queue:$('provider413Queue'),queueBtn:$('provider413QueueBtn'),
product:$('provider413Product'),destination:$('provider413Destination'),draft:$('provider413Draft'),
detailBtn:$('provider413DetailBtn'),detail:$('provider413Detail'),status:$('provider413Status'),
target:$('provider413Target'),plan:$('provider413Plan'),note:$('provider413Note'),
consent:$('provider413Consent'),ack:$('provider413Ack'),request:$('provider413Request'),
followup:$('provider413Followup')};
if(!e.root||!window.DDAuth?.apiFetch)return;let data=null,busy=false;
const say=s=>{e.status.textContent=s};
function controls(){const assigned=data?.assigned_user_id===data?.viewer_user_id;
 e.queueBtn.disabled=busy;e.detailBtn.disabled=busy||!Number(e.product.value)||(e.destination.value==='etsy'&&!e.draft.value.trim());
 e.request.disabled=busy||!data||!assigned||!e.consent.checked||!Number(e.target.value)||Number(e.target.value)===data.assigned_user_id||
 ['PENDING_REASSIGNMENT','AWAITING_RECEIVER_ACK','UNEXPECTED_ASSIGNMENT_HOLD'].includes(data.handoff?.status)||e.note.value.trim().length<12;
 e.ack.disabled=busy||!data||!assigned||data.handoff?.status!=='AWAITING_RECEIVER_ACK'||!e.consent.checked||e.note.value.trim().length<12;
 e.followup.disabled=busy||!data||!assigned||data.followup?.blockers?.length!==0||!e.consent.checked||!e.plan.value||e.note.value.trim().length<12;}
function clear(){data=null;e.detail.textContent='Choose a case and load local evidence.';controls();}
async function call(url,options={}){const r=await window.DDAuth.apiFetch(url,{cache:'no-store',...options}),x=await r.json().catch(()=>null);if(!r.ok||!x?.ok)throw Error(x?.error||'Request failed');return x;}
function select(s){e.product.value=s.product_id;e.destination.value=s.destination;e.draft.value=s.destination==='etsy'?s.draft_id||'':'';clear();say('Selected case #'+s.escalation_receipt+'. Load detail.');}
async function queue(){if(busy)return;busy=true;controls();say('Reading bounded internal SLA queue…');try{
const d=await call('/api/admin/provider-followup-413?mode=queue');e.queue.replaceChildren();
if(!d.items.length)e.queue.textContent='No open case in the most recent 100 escalation events.';
for(const s of d.items){const btn=document.createElement('button');btn.type='button';btn.className='btn';btn.style.margin='4px';
btn.textContent='#'+s.escalation_receipt+' '+s.destination+' Product '+s.product_id+' — '+s.sla_status+
 ' · '+s.handoff_status;btn.addEventListener('click',()=>select(s));e.queue.append(btn);}
say('Loaded '+d.count+' cases; 24h / 72h internal targets only. Older entries may be outside the bounded scan.');
}catch(err){say('Queue unavailable: '+err.message)}finally{busy=false;controls();}}
async function detail(){if(busy)return;busy=true;controls();say('Loading stored SLA and assignment evidence…');
try{const p=new URLSearchParams({mode:'detail',product_id:e.product.value,destination:e.destination.value});
if(e.destination.value==='etsy')p.set('draft_id',e.draft.value.trim());
data=await call('/api/admin/provider-followup-413?'+p);e.detail.textContent=JSON.stringify(data,null,2);
e.target.replaceChildren(new Option('Target active Admin…',''));for(const a of data.admins||[])e.target.add(new Option((a.display_name||'Admin')+' (#'+a.user_id+')',String(a.user_id)));
e.consent.checked=false;say('Handoff: '+data.handoff.status+'; SLA: '+data.sla.status+'. No provider calls or notifications.');
}catch(err){data=null;e.detail.textContent='No evidence loaded.';say('Cannot load: '+err.message)}
finally{busy=false;controls();}}
async function act(action){if(!data||busy||!globalThis.crypto?.randomUUID)return;busy=true;controls();say('Recording local audit evidence…');
try{const b=await call('/api/admin/provider-followup-413',{method:'POST',headers:{'Content-Type':'application/json'},
body:JSON.stringify({action,request_key:globalThis.crypto.randomUUID(),destination:e.destination.value,
product_id:Number(e.product.value),draft_id:e.draft.value.trim(),expected_source_signature:data.source_signature,
expected_escalation_receipt:Number(data.evidence_receipts.escalation),
expected_assignment_receipt:Number(data.evidence_receipts.assignment),
expected_handoff_receipt:Number(data.evidence_receipts.handoff),
expected_followup_receipt:Number(data.evidence_receipts.followup),
expected_request_receipt:data.handoff.request_receipt,target_user_id:Number(e.target.value),plan:e.plan.value,
owner_note:e.note.value.trim(),no_provider_retry:e.consent.checked,no_publication:e.consent.checked,
us_shipping_suspended:e.consent.checked,confirm_manual_owner_followup:e.consent.checked})});
say(b.message+' Receipt #'+b.receipt+'. Reload to continue.');clear();e.consent.checked=false;
}catch(err){say('Not confirmed: '+err.message+'. Reload before reattempting.');clear();}
finally{busy=false;controls();}}
e.queueBtn.addEventListener('click',()=>void queue());e.detailBtn.addEventListener('click',()=>void detail());
e.request.addEventListener('click',()=>void act('request_handoff'));e.ack.addEventListener('click',()=>void act('ack_handoff'));
e.followup.addEventListener('click',()=>void act('record_followup'));
for(const x of [e.product,e.destination,e.draft])x.addEventListener('change',clear);
for(const x of [e.target,e.plan,e.note,e.consent]){x.addEventListener('input',controls);x.addEventListener('change',controls);}
clear();})();
