// Build 410 destination evidence dashboard. Click-only local reads and local-only operator case receipts.
(()=>{'use strict';
const $=id=>document.getElementById(id);
const e={root:$('etsy410'),product:$('etsy410Product'),draft:$('etsy410Draft'),destination:$('etsy410Destination'),
load:$('etsy410Load'),state:$('etsy410State'),evidence:$('etsy410Evidence'),hold:$('etsy410Hold'),
close:$('etsy410Close'),note:$('etsy410Note'),consent:$('etsy410Consent'),proof:$('etsy410Proof')};
if(!e.root||!window.DDAuth?.apiFetch)return;
let snapshot=null,busy=false;
const say=s=>{e.state.textContent=s};
function reset(){snapshot=null;e.evidence.textContent='No provider calls; load evidence by clicking the button.';say('Not loaded.');controls();}
function controls(){const etsy=snapshot?.destination==='etsy';
 e.load.disabled=busy||!Number(e.product.value)||(e.destination.value==='etsy'&&!e.draft.value);
 e.hold.disabled=busy||!etsy||!snapshot.can_open_hold||!e.consent.checked||e.note.value.trim().length<12;
 e.close.disabled=busy||!etsy||!snapshot.can_close_with_proof||!e.consent.checked||!e.proof.checked||e.note.value.trim().length<12;}
async function api(url,init={}){const r=await window.DDAuth.apiFetch(url,{cache:'no-store',...init}),x=await r.json().catch(()=>null);
 if(!r.ok||!x?.ok)throw Error((x?.error||'Request failed')+(x?.blockers?.length?': '+x.blockers.join(', '):''));return x;}
async function load(){if(busy)return;busy=true;controls();say('Reading stored Product, claim and reconciliation evidence…');
 try{const u=new URLSearchParams({product_id:e.product.value,destination:e.destination.value});
 if(e.destination.value==='etsy')u.set('draft_id',e.draft.value.trim());
 snapshot=await api('/api/admin/provider-draft-recovery-410?'+u.toString());
 say((snapshot.case_state||snapshot.outcome)+' — '+(snapshot.provider_verification_snapshot?'Build 400 verified receipt on file. This is NOT a live Etsy check.':
 'No confirmed live provider outcome. Never repeat a remote draft attempt.'));
 e.evidence.textContent=JSON.stringify(snapshot,null,2);
 e.consent.checked=false;e.proof.checked=false;
 }catch(err){snapshot=null;say('Evidence unavailable: '+err.message);e.evidence.textContent='No changes made.';}
 finally{busy=false;controls();}}
async function record(action){if(busy||!snapshot||!globalThis.crypto?.randomUUID)return;
 busy=true;controls();say('Recording local-only case. Etsy and Meta are not contacted.');
 try{const x=await api('/api/admin/provider-draft-recovery-410',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
 action,product_id:Number(e.product.value),draft_id:e.draft.value.trim(),destination:'etsy',
 request_key:globalThis.crypto.randomUUID(),expected_evidence_token:snapshot.evidence_token,
 expected_case_receipt:Number(snapshot.case_receipt),operator_note:e.note.value.trim(),
 confirmed_no_retry:e.consent.checked,confirmed_no_publication:e.consent.checked,
 us_shipping_disabled:e.consent.checked,confirmed_build400_verified_unpublished_draft:e.proof.checked})});
 say(x.message+' Receipt #'+x.case_receipt+'. Reload before further decisions.');
 snapshot=null;e.evidence.textContent='New case recorded locally; refresh evidence.';e.consent.checked=false;e.proof.checked=false;
 }catch(err){snapshot=null;say('Not confirmed: '+err.message+'. Refresh before retrying.');}
 finally{busy=false;controls();}}
e.load.addEventListener('click',()=>void load());
e.hold.addEventListener('click',()=>void record('hold'));
e.close.addEventListener('click',()=>void record('close'));
for(const v of [e.product,e.draft,e.destination])v.addEventListener('change',reset);
for(const v of [e.note,e.consent,e.proof])v.addEventListener('input',controls);
for(const v of [e.consent,e.proof])v.addEventListener('change',controls);
reset();
})();
