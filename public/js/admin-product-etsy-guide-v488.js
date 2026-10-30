/* Build 488: clear one-of-two Etsy draft intent and click-only readiness diagnostics. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),id=Number(new URLSearchParams(location.search).get('product_id')||0);
 if(!$('dd488EtsyGuide')||!window.DDAuth?.apiFetch)return;
 const form=$('productEditorForm');let busy=false,mode='';
 const intentKey=id?`dnd:etsy:mode:494:${id}`:null;
 const say=value=>$('dd488ReadinessStatus').textContent=value;
 function choose(next){
  mode=next;
  if(intentKey)try{sessionStorage.setItem(intentKey,mode);}catch{}
  document.dispatchEvent(new CustomEvent('dd:etsy-draft-mode-changed',{detail:{mode}}));
  $('dd488NewWorkflow').hidden=mode!=='new';$('dd486EtsyExisting').hidden=mode!=='existing';
  $('dd488ChooseNew').setAttribute('aria-pressed',String(mode==='new'));
  $('dd488ChooseExisting').setAttribute('aria-pressed',String(mode==='existing'));
  $('dd488ChoiceStatus').textContent=mode==='new'?'NEW draft selected. First verify the connected shop, listing requirements and Canada-only delivery. A new listing will not publish.':
   'EXISTING draft selected. Enter or verify the exact Etsy draft ID, link it to this Product if needed, then update saved fields and review photographs. Do not create another draft.';
 }
 const issue=(value,good=false)=>{const li=document.createElement('li');li.textContent=(good?'✓ ':'• ')+value;$('dd488ReadinessList').append(li);};
 async function read(url){const r=await window.DDAuth.apiFetch(url,{method:'GET',cache:'no-store'});const v=await r.json().catch(()=>null);if(!r.ok||!v?.ok)throw Error(v?.error||`HTTP ${r.status}`);return v;}
 async function check(){if(busy)return;const list=$('dd488ReadinessList');list.replaceChildren();
  if(!id){say('Save this Product first, then run Etsy readiness. No remote action.');return;}
  if(form?.dataset.productDirty==='1'){say('Unsaved edits: save the Product first. Etsy uses the saved version, never unsaved browser fields.');return;}
  busy=true;$('dd488CheckReadiness').disabled=true;say('Reading Product media approvals and existing local Etsy draft link (no Etsy API call)…');
  try{
   const [link,dist,images]=await Promise.all([
    read(`/api/admin/product-etsy-existing-draft?product_id=${id}`),
    read(`/api/admin/product-distribution-406?product_id=${id}&channel=etsy`),
    read(`/api/admin/product-etsy-images?product_id=${id}`)]);
   const linked=link.linked_listing_id||images.listing_id;
   issue(linked?`Existing Etsy draft #${linked} is linked locally. Choose UPDATE; verify its live draft state before the actual update.`:
    'No Etsy draft is linked to this Product. If one already exists in Etsy, choose UPDATE and link its exact listing ID; otherwise choose NEW.',!!linked);
   const gallery=Array.isArray(dist.gallery)?dist.gallery:[];
   const eligible=gallery.filter(row=>row.approved_for_distribution);
   const blocked=gallery.filter(row=>!row.approved_for_distribution);
   issue(`${eligible.length} approved canonical Product image(s); ${blocked.length} held. Image approval does not itself transfer a file.`,eligible.length>0);
   for(const row of blocked.slice(0,20))issue(`Image #${row.product_image_id}: ${(row.hold_reasons||['approval unavailable']).join('; ')}. Review in Product Media.`);
   const transferable=Array.isArray(images.images)?images.images.filter(row=>row.transferable&&!row.transferred&&!row.hold):[];
   issue(`${transferable.length} approved original R2 JPEG/PNG photo(s) eligible for transfer after draft verification.`,transferable.length>0);
   if(Number(images.hold_unconfirmed_claims||0)>0)issue('Previous image upload outcome unresolved: manually reconcile actual Etsy images; no retry.');
   issue('Etsy connection, current draft state and Canada-only shipping must be verified using the explicit controls below. This local diagnostic does not claim those provider checks passed.');
   say('Readiness check completed without an Etsy write. Choose NEW or UPDATE, correct the listed holds, then use the explicit Etsy actions below.');
  }catch(e){issue('Diagnostic unavailable: '+e.message);say('Read-only diagnostic could not complete. No Etsy action or approval changed.');}
  finally{busy=false;$('dd488CheckReadiness').disabled=false;}
 }
 $('dd488ChooseNew').addEventListener('click',()=>choose('new'));
 $('dd488ChooseExisting').addEventListener('click',()=>choose('existing'));
 $('dd488CheckReadiness').addEventListener('click',()=>void check());
 // Product photos are edited in-place; the advanced file editor is optional.
 $('dd488NewWorkflow').hidden=true;$('dd486EtsyExisting').hidden=true;
 if(intentKey)try{const previous=sessionStorage.getItem(intentKey);if(['new','existing'].includes(previous))choose(previous);}catch{}
})();
