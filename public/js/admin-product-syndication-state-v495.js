/* Build 495: one understandable Etsy Product state, derived from saved draft
   linkage and existing safety gates. Read-only until an explicit owner action. */
(()=>{'use strict';
 const el=document.getElementById('dd495SimpleState'),form=document.getElementById('productEditorForm');
 const productId=Number(new URLSearchParams(location.search).get('product_id')||0);
 if(!el||!form||!window.DDAuth?.apiFetch)return;
 let linked=null,confirmed='',pending=false,linkError='';
 const $=id=>document.getElementById(id);
 const say=(value,tone='')=>{el.textContent=value;el.dataset.tone=tone;};
 const chosen=()=>$('dd488ChooseExisting')?.getAttribute('aria-pressed')==='true'?'existing':
  $('dd488ChooseNew')?.getAttribute('aria-pressed')==='true'?'new':'';
 function render(){
  if(confirmed){say(confirmed,'ok');return;}
  if(form.dataset.productAuthority!=='ready'){say('Waiting for the saved Product. No draft upload is available from an incomplete Product load.','hold');return;}
  if(linkError){say(`HOLD — Etsy draft linkage unverified: ${linkError}. Check the existing draft before attempting an ORIGINAL.`, 'hold');return;}
  if(linked){
   const ready=chosen()==='existing'&&$('dd486EtsyUpdate')?.disabled===false;
   say(ready?`This Product is ready to UPDATE the existing unpublished Etsy draft #${linked}. Review and approve one update below.`:
    `This Product has an ORIGINAL Etsy draft #${linked} already. Update this existing draft—do not create another. Photos remain in the same Product gallery.`,ready?'ok':'');
  }else if(pending)say('Checking whether the original Product has an existing Etsy draft…');
  else if(chosen()==='new'&&$('dd438EtsyCreate')?.disabled===false)say('The Product is ready to upload as an ORIGINAL unpublished Etsy draft. Review and authorize one create action below.','ok');
  else say('Original Product: complete the saved Product, live Etsy connection and Canada-only checks to enable Create Original Draft. No listing or photos sent yet.');
 }
 async function lookup(){
  if(!productId||pending||form.dataset.productAuthority!=='ready')return;
  pending=true;render();
  try{
   const response=await window.DDAuth.apiFetch(`/api/admin/product-etsy-existing-draft?product_id=${productId}`,{cache:'no-store'});
   const result=await response.json().catch(()=>null);
   if(!response.ok||!result?.ok)throw Error(result?.error||`HTTP ${response.status}`);
   linked=result.linked_listing_id||null;
   linkError='';
   if($('dd488ChooseNew'))$('dd488ChooseNew').disabled=!!linked;
   // Only infer existing intent from a VERIFIED local link. Never grant owner
   // approval or trigger a provider mutation when switching the visible workflow.
   if(linked&&chosen()!=='existing')$('dd488ChooseExisting')?.click();
  }catch(error){linkError=error.message;if($('dd488ChooseNew'))$('dd488ChooseNew').disabled=true;return;}
  finally{pending=false;render();}
 }
 document.addEventListener('dd:product-loaded',()=>void lookup());
 document.addEventListener('dd:save-succeeded',()=>{confirmed='';void lookup();});
 document.addEventListener('dd:etsy-draft-mode-changed',render);
 document.addEventListener('dd:etsy-draft-created',event=>{linked=String(event.detail?.listing_id||'');if($('dd488ChooseNew'))$('dd488ChooseNew').disabled=true;confirmed=linked?`Original Product uploaded as unpublished Etsy draft #${linked}. Images are not yet transferred and the listing is not published.`:'';render();});
 document.addEventListener('dd:etsy-existing-draft-updated',event=>{linked=String(event.detail?.listing_id||linked||'');confirmed=`This Product is UPDATED ✓ Existing Etsy draft #${linked} confirmed the saved title, description, price and quantity. Images remain separately approved.`;render();});
 for(const target of ['dd438EtsyCreate','dd486EtsyUpdate']){const node=$(target);if(node)new MutationObserver(render).observe(node,{attributes:true,attributeFilter:['disabled']});}
 if(form.dataset.productAuthority==='ready')void lookup();else render();
})();
