// Build 414 — operator-click-only follow-up completion, SLA exception route and handoff proof.
(()=>{'use strict';const $=id=>document.getElementById(id);
const e={root:$('provider414'),queueBtn:$('provider414QueueBtn'),queue:$('provider414Queue'),
product:$('provider414Product'),destination:$('provider414Destination'),draft:$('provider414Draft'),
inspect:$('provider414Inspect'),status:$('provider414Status'),details:$('provider414Details'),
note:$('provider414Note'),routeTo:$('provider414RouteTo'),routeChoice:$('provider414RouteChoice'),
consent:$('provider414Consent'),proof:$('provider414Proof'),
complete:$('provider414Complete'),route:$('provider414Route'),governance:$('provider414Governance')};
if(!e.root||!window.DDAuth?.apiFetch)return;let current=null,busy=false;
const say=t=>{e.status.textContent=t;};
function controls(){const ready=current&&current.escalation_status==='OPEN_OWNER_REVIEW',assigned=ready&&current.assigned_user_id===current.viewer_user_id,
 noteOk=e.note.value.trim().length>=12,ack=e.consent.checked;
 e.queueBtn.disabled=busy;e.inspect.disabled=busy||!Number(e.product.value)||(e.destination.value==='etsy'&&!e.draft.value.trim());
 e.complete.disabled=busy||!assigned||!current?.followup?.verified||current?.completion?.current||!current?.source_snapshot_current||
 !['NOT_REQUIRED','VERIFIED_HANDOFF_CHAIN'].includes(current?.handoff?.status)||
 (current?.handoff?.status==='VERIFIED_HANDOFF_CHAIN'&&!current?.governance?.verified)||!ack||!e.proof.checked||!noteOk;
 e.governance.disabled=busy||!assigned||current?.handoff?.status!=='VERIFIED_HANDOFF_CHAIN'||current?.governance?.verified||!current?.source_snapshot_current||!ack||!e.proof.checked||!noteOk;
 e.route.disabled=busy||!ready||!(current?.exception_reasons||[]).length||!Number(e.routeTo.value)||!e.routeChoice.value||!ack||!noteOk;
}
function reset(){current=null;e.details.textContent='Select a case and inspect the current saved D1 evidence.';controls();}
async function api(path,options={}){const r=await window.DDAuth.apiFetch(path,{cache:'no-store',...options}),x=await r.json().catch(()=>null);if(!r.ok||!x?.ok)throw Error(x?.error||'Request rejected');return x;}
function choose(s){e.product.value=s.product_id;e.destination.value=s.destination;
e.draft.value=s.destination==='etsy'?(s.draft_id||''):'';reset();say('Selected escalation #'+s.escalation_receipt+'. Inspect before action.');}
async function loadQueue(){if(busy)return;busy=true;controls();say('Reading bounded OPEN escalation queue…');try{
 const data=await api('/api/admin/provider-completion-414?mode=queue');e.queue.replaceChildren();
 if(!data.items?.length)e.queue.textContent='No open cases in the latest 100 escalation receipts; older cases may be outside this view.';
 for(const item of data.items){const b=document.createElement('button');b.type='button';b.className='btn';b.style.margin='4px';
 b.textContent='#'+item.escalation_receipt+' '+item.destination+' Product '+item.product_id+' — '+item.sla_status+
 (item.completion_receipt?' · recorded completion #'+item.completion_receipt:'');
 b.addEventListener('click',()=>choose(item));e.queue.append(b);}
 say('Loaded '+data.count+' case(s). Targets are internal only; no provider status was checked.');
 }catch(err){say('Queue unavailable: '+err.message);}finally{busy=false;controls();}}
async function inspect(){if(busy)return;busy=true;controls();say('Verifying stored assignment, follow-up and handoff evidence…');
 try{const q=new URLSearchParams({mode:'detail',product_id:e.product.value,destination:e.destination.value});
 if(e.destination.value==='etsy')q.set('draft_id',e.draft.value.trim());
 current=await api('/api/admin/provider-completion-414?'+q);
 e.details.textContent=JSON.stringify(current,null,2);
 e.routeTo.replaceChildren(new Option('Choose active Admin owner…',''));
 for(const p of current.admins||[])e.routeTo.add(new Option((p.display_name||'Admin')+' (#'+p.user_id+')',String(p.user_id)));
 e.consent.checked=false;e.proof.checked=false;
 say('SLA '+current.sla.status+' · handoff '+current.handoff.status+' · completion '+current.completion.status+
 ' · '+(current.exception_reasons||[]).length+' local exception reason(s). No provider calls.');
 }catch(err){current=null;e.details.textContent='Evidence not available.';say('Inspect failed: '+err.message)}
 finally{busy=false;controls();}}
async function record(action){if(!current||busy||!globalThis.crypto?.randomUUID)return;busy=true;controls();
 say('Recording '+action+' as an immutable local audit receipt…');
 try{const receipt=await api('/api/admin/provider-completion-414',{method:'POST',
  headers:{'Content-Type':'application/json'},body:JSON.stringify({action,request_key:globalThis.crypto.randomUUID(),
 destination:e.destination.value,product_id:Number(e.product.value),draft_id:e.draft.value.trim(),
 expected_source_signature:current.source_signature,expected_receipts:current.evidence_receipts,
 owner_note:e.note.value.trim(),route_choice:e.routeChoice.value,route_to_user_id:Number(e.routeTo.value),
 no_provider_retry:e.consent.checked,no_publication:e.consent.checked,us_shipping_suspended:e.consent.checked,
 confirm_local_followup_completed:e.proof.checked,confirm_no_provider_completion_claim:e.proof.checked,
 confirm_manual_exception_review:e.consent.checked,confirm_verified_handoff_chain:e.proof.checked})});
 say(receipt.message+' Receipt #'+receipt.receipt+'. Reload to continue; no provider changes.');reset();
 e.consent.checked=false;e.proof.checked=false;
 }catch(err){reset();say('Local action unconfirmed: '+err.message+'. Reload; no provider call was made.')}
 finally{busy=false;controls();}}
e.queueBtn.addEventListener('click',()=>void loadQueue());e.inspect.addEventListener('click',()=>void inspect());
e.complete.addEventListener('click',()=>void record('complete_followup'));e.route.addEventListener('click',()=>void record('route_exception'));
e.governance.addEventListener('click',()=>void record('verify_handoff'));
for(const i of [e.product,e.destination,e.draft])i.addEventListener('change',reset);
for(const i of [e.note,e.routeChoice,e.routeTo,e.consent,e.proof]){i.addEventListener('input',controls);i.addEventListener('change',controls);}
reset();
})();