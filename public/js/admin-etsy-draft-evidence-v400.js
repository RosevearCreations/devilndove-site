
(()=>{'use strict';
const get=id=>document.getElementById(id);
const e={draft:get('etsy400DraftId'),listing:get('etsy400ListingId'),load:get('etsy400Load'),
 verify:get('etsy400Verify'),reconcile:get('etsy400Link'),confirm:get('etsy400Confirm'),
 status:get('etsy400Status'),evidence:get('etsy400Evidence'),staged:get('etsy399DraftSelect')};
if(!e.load||!window.DDAuth?.apiFetch)return;
let busy=false,verified=null,claim=false;
const draftId=()=>e.draft.value.trim()||String(e.staged?.value||'').trim();
const render=b=>{e.evidence.textContent=JSON.stringify(b,null,2);
 e.status.textContent=b.message||b.error||'Stored evidence read.';};
const lock=b=>{busy=b;e.load.disabled=b;e.verify.disabled=b||!claim;
 e.reconcile.disabled=b||!verified?.provider_verified||!e.confirm.checked;};
async function api(path,init){const res=await window.DDAuth.apiFetch(path,{cache:'no-store',...init});
 const b=await res.json().catch(()=>({error:'Unparseable response'}));render(b);if(!res.ok||!b.ok)throw Error(b.error||'Rejected');return b;}
e.load.addEventListener('click',async()=>{
 const id=draftId();if(busy)return;if(!id){e.status.textContent='Select a local draft first.';return;}
 verified=null;claim=false;e.confirm.checked=false;lock(true);
 try{const b=await api('/api/admin/etsy-remote-draft-evidence?draft_id='+encodeURIComponent(id),{method:'GET'});
  e.draft.value=id;if(b.linked_listing_id)e.listing.value=b.linked_listing_id;
  claim=!!b.claim_receipt;
 }catch{}finally{lock(false);}
});
e.verify.addEventListener('click',async()=>{
 if(busy||!claim)return;verified=null;lock(true);e.status.textContent='Reading Etsy listing, GET only…';
 try{verified=await api('/api/admin/etsy-remote-draft-evidence',{method:'POST',
  headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verify_etsy_draft',draft_id:draftId(),listing_id:e.listing.value.trim()})});
 }catch{}finally{lock(false);}
});
e.confirm.addEventListener('change',()=>lock(busy));
for(const input of [e.listing,e.draft])input.addEventListener('input',()=>{verified=null;e.reconcile.disabled=true;});
e.staged?.addEventListener('change',()=>{e.draft.value=e.staged.value;verified=null;claim=false;e.verify.disabled=true;e.reconcile.disabled=true;});
e.reconcile.addEventListener('click',async()=>{
 if(busy||!verified?.provider_verified||!e.confirm.checked)return;
 if(e.listing.value.trim()&&String(verified.evidence?.listing_id)!==e.listing.value.trim()){e.status.textContent='Listing ID changed: verify again.';return;}
 lock(true);e.status.textContent='Re-checking Etsy; writing local link only…';
 try{await api('/api/admin/etsy-remote-draft-evidence',{method:'POST',
  headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reconcile_verified_draft',
  draft_id:draftId(),listing_id:e.listing.value.trim(),confirmed_manual_link:true})});
 }catch{}finally{verified=null;e.confirm.checked=false;lock(false);}
});
})();
