// Build 411 — explicit, bounded source snapshots / manual escalation without background polling.
(()=>{'use strict';
const $=id=>document.getElementById(id),e={root:$('provider411'),product:$('provider411Product'),
 destination:$('provider411Destination'),draft:$('provider411Draft'),use410:$('provider411Use410'),
 load:$('provider411Load'),snapshot:$('provider411Capture'),escalate:$('provider411Escalate'),
 resolve:$('provider411Resolve'),note:$('provider411Note'),consent:$('provider411Consent'),
 proof:$('provider411Proof'),result:$('provider411Result'),history:$('provider411History')};
if(!e.root||!window.DDAuth?.apiFetch)return;
let data=null,busy=false;
function say(s){e.result.textContent=s}
function controls(){e.load.disabled=busy||!Number(e.product.value)||(e.destination.value==='etsy'&&!e.draft.value.trim());
e.snapshot.disabled=busy||!data||data.snapshot?.source_matches_snapshot&&!data.snapshot?.review_due;
e.escalate.disabled=busy||!data?.can_escalate||!e.consent.checked||e.note.value.trim().length<12;
e.resolve.disabled=busy||!data?.can_resolve||!e.consent.checked||!e.proof.checked||e.note.value.trim().length<12;}
function clear(){data=null;e.history.replaceChildren();say('Selection changed. Click Load; no provider requests are automatic.');controls();}
async function api(path,options={}){const r=await window.DDAuth.apiFetch(path,{cache:'no-store',...options}),b=await r.json().catch(()=>null);
if(!r.ok||!b?.ok)throw Error(b?.error||'Request failed');return b;}
function history(b){e.history.replaceChildren();
const summary=document.createElement('p');summary.textContent='Saved outcome: '+b.outcome+' · Snapshot: '+b.snapshot?.governance_status+
' · Escalation: '+b.escalation?.status+' · Live provider state not checked.';e.history.append(summary);
for(const r of b.timeline||[]){const item=document.createElement('div');item.className='small';item.textContent=
 '#'+r.receipt+' · '+r.event+' · '+(r.created_at||'unknown date')+(r.decision?' · '+r.decision:'');e.history.append(item);}}
async function load(){if(busy)return;busy=true;controls();say('Reading historical D1 evidence for exactly one destination…');
try{const q=new URLSearchParams({product_id:e.product.value,destination:e.destination.value});
if(e.destination.value==='etsy')q.set('draft_id',e.draft.value.trim());
data=await api('/api/admin/provider-evidence-411?'+q);history(data);
e.consent.checked=false;e.proof.checked=false;say('Local-only snapshot loaded. '+data.snapshot.governance_status+
'. Owner escalation never triggers an automatic email or external listing write.');
}catch(err){data=null;e.history.replaceChildren();say('Unable to load: '+err.message)}
finally{busy=false;controls();}}
async function act(action){if(!data||busy||!globalThis.crypto?.randomUUID)return;
busy=true;controls();say('Recording '+action+' in immutable D1 audit ledger…');
try{const b=await api('/api/admin/provider-evidence-411',{method:'POST',
 headers:{'Content-Type':'application/json'},body:JSON.stringify({
 product_id:Number(e.product.value),destination:e.destination.value,draft_id:e.draft.value.trim(),action,
 request_key:globalThis.crypto.randomUUID(),expected_signature:data.source_signature,
 expected_snapshot_receipt:Number(data.snapshot.snapshot_receipt),expected_escalation_receipt:Number(data.escalation.receipt),
 owner_note:e.note.value.trim(),no_provider_retry:e.consent.checked,
 no_publication:e.consent.checked,us_shipping_suspended:e.consent.checked,
 confirm_verified_draft_closure:e.proof.checked})});
say(b.message+' Audit #'+b.receipt+'. Reload evidence to continue.');data=null;e.history.replaceChildren();
e.consent.checked=false;e.proof.checked=false;
}catch(err){data=null;say('Unconfirmed local operation: '+err.message+'. Reload before retry.');}
finally{busy=false;controls();}}
e.load.addEventListener('click',()=>void load());
e.snapshot.addEventListener('click',()=>void act('snapshot'));
e.escalate.addEventListener('click',()=>void act('escalate'));
e.resolve.addEventListener('click',()=>void act('resolve'));
e.use410.addEventListener('click',()=>{const fromProduct=$('etsy410Product'),fromDraft=$('etsy410Draft'),fromDest=$('etsy410Destination');
if(fromProduct)e.product.value=fromProduct.value;if(fromDraft)e.draft.value=fromDraft.value;
if(fromDest)e.destination.value=fromDest.value;clear();});
for(const input of [e.product,e.draft,e.destination])input.addEventListener('change',clear);
for(const input of [e.note,e.consent,e.proof]){input.addEventListener('input',controls);input.addEventListener('change',controls);}
clear();
})();
