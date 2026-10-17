// Build 412 — operator-driven bounded queue, assignment, explicit local destination review.
(()=>{'use strict';const $=id=>document.getElementById(id);
const e={root:$('provider412'),load:$('provider412Load'),queue:$('provider412Queue'),status:$('provider412Status'),
product:$('provider412Product'),destination:$('provider412Destination'),draft:$('provider412Draft'),
detail:$('provider412Detail'),inspect:$('provider412Inspect'),assignee:$('provider412Assignee'),
assign:$('provider412Assign'),hold:$('provider412Hold'),review:$('provider412Review'),
note:$('provider412Note'),confirm:$('provider412Confirm'),proof:$('provider412Proof')};
if(!e.root||!window.DDAuth?.apiFetch)return;let selected=null,busy=false;
const say=s=>{e.status.textContent=s};
const controls=()=>{e.load.disabled=busy;e.inspect.disabled=busy||!Number(e.product.value)||
(e.destination.value==='etsy'&&!e.draft.value.trim());
e.assign.disabled=busy||!selected?.can_assign||!Number(e.assignee.value)||!e.confirm.checked||e.note.value.trim().length<12;
e.hold.disabled=busy||!selected?.evidence_receipts?.assignment||selected.assigned_user_id!==selected.reviewer_user_id||
!e.confirm.checked||e.note.value.trim().length<12;
e.review.disabled=busy||!selected?.can_review_local_evidence||!e.confirm.checked||!e.proof.checked||e.note.value.trim().length<12;};
function clear(){selected=null;e.detail.textContent='Select a queue item and inspect it before any decision.';controls();}
async function request(url,opt={}){const r=await window.DDAuth.apiFetch(url,{cache:'no-store',...opt}),x=await r.json().catch(()=>null);
if(!r.ok||!x?.ok)throw Error((x?.error||'Operation rejected')+(x?.blockers?.length?' — '+x.blockers.join(', '):''));return x;}
function choose(item){e.product.value=item.product_id;e.destination.value=item.destination;
e.draft.value=item.destination==='etsy'?(item.draft_id||''):'';clear();say('Selected escalation #'+item.escalation_receipt+'. Inspect before acting.');}
function showQueue(data){e.queue.replaceChildren();const arr=data.items||[];
if(!arr.length){e.queue.textContent='No OPEN escalation found in the most recent 100 audit events. Older cases are not included.';return;}
for(const item of arr){const btn=document.createElement('button');btn.type='button';btn.className='btn';
btn.style.margin='4px';btn.textContent='#'+item.escalation_receipt+' '+item.destination+' Product '+item.product_id+
' — '+(item.assignee_user_id?'assigned #'+item.assignee_user_id:'unassigned')+
(item.latest_review_decision?' — '+item.latest_review_decision:'');
btn.addEventListener('click',()=>choose(item));e.queue.append(btn);}}
async function loadQueue(){if(busy)return;busy=true;controls();say('Reading bounded saved escalation queue (no provider API)…');
try{const x=await request('/api/admin/provider-work-queue-412?mode=queue');showQueue(x);
say('Loaded '+x.queue_count+' open case(s). Latest 100 escalation events scanned; no automatic provider check.');}
catch(err){say('Queue not available: '+err.message)}finally{busy=false;controls();}}
async function inspect(){if(busy)return;busy=true;controls();say('Reading saved Product, owner escalation and assignment…');
try{const q=new URLSearchParams({mode:'detail',product_id:e.product.value,destination:e.destination.value});
if(e.destination.value==='etsy')q.set('draft_id',e.draft.value.trim());
selected=await request('/api/admin/provider-work-queue-412?'+q);
e.detail.textContent=JSON.stringify(selected,null,2);e.assignee.replaceChildren(new Option('Choose active Admin…',''));
for(const u of selected.admins||[])e.assignee.add(new Option((u.display_name||u.email||'Admin')+' (#'+u.user_id+')',String(u.user_id)));
if(selected.assigned_user_id)e.assignee.value=String(selected.assigned_user_id);
e.confirm.checked=false;e.proof.checked=false;say('Current: '+selected.escalation_status+'. Reviewer '+selected.reviewer_user_id+
'. Local-evidence review is restricted to assigned active Admin.');
}catch(err){selected=null;e.detail.textContent='No details loaded.';say('Cannot inspect: '+err.message)}
finally{busy=false;controls();}}
async function act(action){if(busy||!selected||!globalThis.crypto?.randomUUID)return;
busy=true;controls();say('Recording explicit '+action+' in local append-only audit…');
try{const x=await request('/api/admin/provider-work-queue-412',{method:'POST',
headers:{'Content-Type':'application/json'},body:JSON.stringify({
action,request_key:globalThis.crypto.randomUUID(),product_id:Number(e.product.value),
destination:e.destination.value,draft_id:e.draft.value.trim(),assignee_user_id:Number(e.assignee.value),
expected_source_signature:selected.source_signature,
expected_escalation_receipt:Number(selected.evidence_receipts.escalation),
expected_assignment_receipt:Number(selected.evidence_receipts.assignment),
expected_review_receipt:Number(selected.evidence_receipts.review),
owner_note:e.note.value.trim(),no_provider_retry:e.confirm.checked,
no_publication:e.confirm.checked,us_shipping_suspended:e.confirm.checked,
confirm_matching_build400_receipt:e.proof.checked,confirm_matching_build410_closure:e.proof.checked,
confirm_local_only_review:e.proof.checked})});
say(x.message+' Audit receipt #'+x.receipt+'. Refresh before subsequent decisions.');clear();e.confirm.checked=false;e.proof.checked=false;
}catch(err){say('Unconfirmed: '+err.message+'. Reload; no remote provider call.');clear();}
finally{busy=false;controls();}}
e.load.addEventListener('click',()=>void loadQueue());e.inspect.addEventListener('click',()=>void inspect());
e.assign.addEventListener('click',()=>void act('assign'));e.hold.addEventListener('click',()=>void act('review_hold'));
e.review.addEventListener('click',()=>void act('review_evidence'));
for(const k of [e.product,e.destination,e.draft])k.addEventListener('change',clear);
for(const k of [e.assignee,e.note,e.confirm,e.proof]){k.addEventListener('input',controls);k.addEventListener('change',controls);}
clear();})();
