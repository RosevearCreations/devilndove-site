// Build 399 — all remote Etsy calls require a direct operator click.
// No fetch on startup, no provider auto-retry, and absolutely no publication path.
(()=>{'use strict';
const el=id=>document.getElementById(id),ids={
 product:el('etsy399ProductId'),check:el('etsy399Check'),draft:el('etsy399DraftSelect'),
 status:el('etsy399Status'),readiness:el('etsy399Readiness'),options:el('etsy399Options'),
 optionStatus:el('etsy399OptionStatus'),taxonomy:el('etsy399Taxonomy'),shipping:el('etsy399Shipping'),
 ready:el('etsy399ReadinessProfile'),who:el('etsy399WhoMade'),when:el('etsy399WhenMade'),
 supply:el('etsy399Supply'),review:el('etsy399Review'),c1:el('etsy399ConfirmDraft'),
 c2:el('etsy399ConfirmRetry'),create:el('etsy399Create'),result:el('etsy399Result')};
if(!ids.product||!ids.check||!ids.draft||!window.DDAuth?.apiFetch)return;
let snapshot=null,options=null,busy=false;
async function api(url,init={}){
 const res=await window.DDAuth.apiFetch(url,{cache:'no-store',...init});
 const body=await res.json().catch(()=>null);
 if(!res.ok||!body?.ok)throw new Error((body?.error||'Request rejected')+
 (body?.blockers?.length?' — '+body.blockers.join(', '):'')+(body?.receipt_id?' Receipt #'+body.receipt_id:''));
 return body;
}
const idValid=n=>/^[1-9]\d*$/.test(String(n||''));
const currency=n=>'CAD $'+(Number(n||0)/100).toFixed(2);
const updateBusy=flag=>{busy=flag;ids.check.disabled=flag;ids.options.disabled=flag||!snapshot?.ready_for_operator_options;
 ids.create.disabled=flag||!snapshot?.ready_for_operator_options||!options;};
function reset(){
 snapshot=null;options=null;ids.create.disabled=true;ids.options.disabled=true;
 for(const s of [ids.taxonomy,ids.shipping,ids.ready])s.replaceChildren(new Option('Check readiness & read live Etsy options first',''));
 ids.c1.checked=false;ids.c2.checked=false;ids.result.textContent='Nothing sent to Etsy. Published listing creation remains disabled.';
}
async function getSnapshot(draftId){
 const id=String(ids.product.value).trim();if(!idValid(id))throw new Error('Select a valid Product ID above.');
 const path='/api/admin/etsy-remote-draft-trial?product_id='+encodeURIComponent(id)+(draftId?'&draft_id='+encodeURIComponent(draftId):'');
 return api(path,{method:'GET'});
}
function showSnapshot(data,updateDrafts){
 snapshot=data;options=null;ids.create.disabled=true;ids.options.disabled=!data.ready_for_operator_options;
 ids.c1.checked=false;ids.c2.checked=false;
 if(updateDrafts){
  ids.draft.replaceChildren(new Option('Select a local draft…',''));
  for(const d of data.drafts||[])ids.draft.add(new Option(d.title+' | '+String(d.id).slice(0,12)+' | '+d.status+
   (d.external_reference?' | already linked #'+d.external_reference:''),d.id));
 }
 const ready=data.ready_for_operator_options;
 ids.readiness.textContent=(ready?'Ready to load Etsy options.':'Blocked until: '+(data.blockers||[]).join(', ')+'.')+
  (data.previous_attempt_receipt?' Existing claim receipt #'+data.previous_attempt_receipt+'. No repeat Etsy POST allowed.':'');
 ids.review.textContent=data.selected_draft?
  'Product #'+data.product.id+' '+data.product.name+' — '+currency(data.selected_draft.price_cents)+
  ', quantity '+data.selected_draft.quantity+'. Saved draft title: '+data.selected_draft.title+
  '. Draft description remains the exact local version; no changes to Product or stock.':
  'Select an existing local draft from this Product to review its exact saved contents.';
 ids.status.textContent=ready?'Local draft and OAuth prerequisites checked. Read live Etsy options next.':
  'No Etsy write made. Follow the listed prerequisites before a controlled draft trial.';
}
async function check(updateDrafts=false){
 if(busy)return;updateBusy(true);reset();
 ids.status.textContent='Reading local Product, saved draft and authorized Etsy connection state…';
 try{
  const data=await getSnapshot(updateDrafts?'':ids.draft.value);
  showSnapshot(data,updateDrafts);
 }catch(e){ids.status.textContent='Preflight unavailable: '+e.message+' No provider call or draft created.';}
 finally{updateBusy(false);}
}
function fill(select,items,name){
 select.replaceChildren(new Option('Choose a verified '+name+'…',''));
 for(const item of items)select.add(new Option(String(item.name||'Unnamed')+' (#'+Number(item.id)+')',String(item.id)));
}
ids.check.addEventListener('click',()=>void check(true));
ids.draft.addEventListener('change',()=>void check(false));
ids.product.addEventListener('change',()=>{reset();ids.draft.replaceChildren(new Option('Check readiness again',''));});
ids.options.addEventListener('click',async()=>{
 if(busy||!snapshot?.ready_for_operator_options)return;
 updateBusy(true);ids.optionStatus.textContent='Etsy read-only GET: checking its live categories, shipping and processing profiles…';
 try{
  const data=await api('/api/admin/etsy-remote-draft-trial',{method:'POST',
   headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'load_remote_options',product_id:Number(ids.product.value)})});
  options=data.options;
  fill(ids.taxonomy,options.taxonomy,'Soap category');
  fill(ids.shipping,options.shipping,'shipping profile');
  fill(ids.ready,options.readiness,'processing profile');
  ids.optionStatus.textContent='Etsy returned '+options.taxonomy.length+' Soap category options, '+
   options.shipping.length+' shipping profiles and '+options.readiness.length+' processing profiles. No Etsy write.';
 }catch(e){ids.optionStatus.textContent='Etsy read-only options unavailable: '+e.message+'. No listing created.';}
 finally{updateBusy(false);}
});
ids.create.addEventListener('click',async()=>{
 if(busy||!snapshot?.ready_for_operator_options||!options)return;
 if(!ids.c1.checked||!ids.c2.checked){ids.result.textContent='Confirm BOTH one-draft and no-retry safeguards first.';return;}
 const tax=ids.taxonomy.value,ship=ids.shipping.value,ready=ids.ready.value;
 if(!idValid(tax)||!idValid(ship)||!idValid(ready)||!ids.who.value||!ids.when.value||!['true','false'].includes(ids.supply.value)){
  ids.result.textContent='Choose real Etsy taxonomy, shipping and processing profiles and product maker details.';return;
 }
 if(!globalThis.crypto?.randomUUID){ids.result.textContent='Secure one-time request ID unavailable. No Etsy write.';return;}
 const key=globalThis.crypto.randomUUID();
 const snapshotAtClick=snapshot;
 updateBusy(true);ids.create.disabled=true;ids.create.textContent='Submitting ONE Etsy draft…';
 ids.result.textContent='Submitting at most one unpublished listing. DO NOT refresh or repeat this action if the response is uncertain.';
 try{
  const r=await api('/api/admin/etsy-remote-draft-trial',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   action:'create_unpublished_etsy_draft',product_id:Number(ids.product.value),
   draft_id:snapshotAtClick.selected_draft.id,request_key:key,fingerprint:snapshotAtClick.fingerprint,
   taxonomy_id:Number(tax),shipping_profile_id:Number(ship),readiness_state_id:Number(ready),
   who_made:ids.who.value,when_made:ids.when.value,is_supply:ids.supply.value==='true',
   confirmed_unpublished_draft_only:true,confirmed_no_auto_retry:true
  })});
  ids.result.textContent='Etsy confirmed UNPUBLISHED draft listing #'+r.listing_id+
   ', shop #'+r.shop_id+', audit claim #'+r.claim_receipt+'. Verify this listing under Etsy Drafts. Nothing published.';
  ids.create.disabled=true;options=null;snapshot=null;
 }catch(e){
  ids.result.textContent='Outcome rejected or unknown: '+e.message+
   '. Inspect Etsy Draft Listings and the Devil n Dove audit ledger before ANY new attempt. Automatic retry is disabled.';
  options=null;snapshot=null;
 }finally{busy=false;ids.check.disabled=false;ids.options.disabled=true;ids.create.disabled=true;ids.create.textContent='Create ONE unpublished Etsy draft — requires confirmation';}
});
})();