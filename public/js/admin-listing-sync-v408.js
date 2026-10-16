// Release 467 Build 408 — user-click-only operator acceptance, safe draft payload and local evidence.
(()=>{'use strict';
const $=id=>document.getElementById(id);
const root=$('listingSync408');if(!root||!window.DDAuth?.apiFetch)return;
const id=Number(new URLSearchParams(location.search).get('product_id')||0);
const channel=$('listingSync408Channel'),load=$('listingSync408Load'),accept=$('listingSync408Accept'),
prepare=$('listingSync408Prepare'),reconcile=$('listingSync408Reconcile'),consent=$('listingSync408Consent'),
status=$('listingSync408Status');
let snapshot=null,busy=false;
function say(text){status.textContent=text}
function buttons(){load.disabled=busy||!id;accept.disabled=busy||!snapshot||!consent.checked||snapshot.local_blockers.length>0;
prepare.disabled=busy||!snapshot||!snapshot.operator_accepted||!snapshot.local_draft_ready||snapshot.preparation_current||!consent.checked;
reconcile.disabled=busy||!snapshot||!snapshot.preparation_current||!consent.checked;}
async function api(path,opts){const r=await window.DDAuth.apiFetch(path,{cache:'no-store',...opts}),x=await r.json().catch(()=>null);
if(!r.ok||!x?.ok)throw Error((x?.error||'Request failed')+(x?.blockers?.length?' ('+x.blockers.join(', ')+')':''));return x;}
async function refresh(){if(!id||busy)return;busy=true;buttons();say('Checking existing Product and local evidence…');
try{snapshot=await api('/api/admin/listing-sync-408?product_id='+encodeURIComponent(id)+'&destination='+encodeURIComponent(channel.value));
consent.checked=false;
say('Local blockers: '+(snapshot.local_blockers.join(', ')||'none')+
'. Provider blockers: '+(snapshot.provider_blockers.join(', ')||'none')+
'. Acceptance #'+snapshot.acceptance_receipt+', draft preparation #'+snapshot.prepared_receipt+
', reconciliation #'+snapshot.reconciliation_receipt+
'. '+(snapshot.preparation_current?'Local preparation matches the approved Product. Provider has NOT been checked.':'No current reconciled local preparation.'));
}catch(e){snapshot=null;say('Evidence unavailable: '+e.message+' — no provider request was made.')}
finally{busy=false;buttons();}}
async function act(action){if(!snapshot||busy||!consent.checked||!globalThis.crypto?.randomUUID)return;
busy=true;buttons();say('Recording '+action+' locally, no marketplace request…');
try{const x=await api('/api/admin/listing-sync-408',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
action,product_id:id,destination:channel.value,request_key:globalThis.crypto.randomUUID(),confirmed_local_only:true,
confirmed_draft_only:true,us_shipping_disabled:true,no_auto_publish:true,
expected_acceptance_receipt:Number(snapshot.acceptance_receipt),expected_prepared_receipt:Number(snapshot.prepared_receipt),
expected_review_receipt:Number(snapshot.owner_review_receipt),expected_fingerprint:snapshot.source_fingerprint})});
say(x.message+' Receipt #'+x.receipt+'. Reload to refresh gated actions.');
snapshot=null;consent.checked=false;
}catch(e){say('No confirmed local change: '+e.message+'. Reload before retrying.');snapshot=null;}
finally{busy=false;buttons();}}
load.addEventListener('click',()=>void refresh());
channel.addEventListener('change',()=>{snapshot=null;consent.checked=false;say('Destination changed. Load evidence before any action.');buttons()});
consent.addEventListener('change',buttons);
accept.addEventListener('click',()=>void act('accept'));
prepare.addEventListener('click',()=>void act('prepare'));
reconcile.addEventListener('click',()=>void act('reconcile'));
say(id?'Click Load to inspect existing canonical Product evidence.':'Save a Product before accepting any destination.');buttons();
})();
