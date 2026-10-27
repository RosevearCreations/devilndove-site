/* Build 496 — small honest, read-only channel summary from existing canonical
   Product photographs and already-recorded draft receipts. Never publish or
   infer per-image permission. An operator chooses every external write. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),form=$('productEditorForm');
 const list=$('dd496ReadinessList'),note=$('dd496ReadinessNote');
 const id=Number(new URLSearchParams(location.search).get('product_id')||0);
 if(!form||!list||!note||!window.DDAuth?.apiFetch)return;
 let busy=false,loaded=false;
 function line(message,state=''){
  const item=document.createElement('li');item.textContent=message;
  if(state)item.dataset.state=state;list.append(item);
 }
 function selectedTab(){return document.querySelector('[data-editor-panel="etsy"]')?.hidden===false;}
 async function read(url){
  const response=await window.DDAuth.apiFetch(url,{method:'GET',cache:'no-store'});
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data?.ok)throw Error(data?.error||`HTTP ${response.status}`);
  return data;
 }
 function fields(){
  const value=name=>String(form.elements.namedItem(name)?.value||'').trim();
  return {name:value('name'),description:value('description')||value('short_description'),
    price:Number(value('price')||0),quantity:Number(value('inventory_quantity')||0),
    tags:value('keywords').split(',').map(value=>value.trim()).filter(Boolean).length};
 }
 function local(){
  list.replaceChildren();
  if(!id){line('Save this Product once before checking Etsy.');return false;}
  if(form.dataset.productAuthority!=='ready'){
   line('The saved Product has not finished loading. Do not trust its completion score or attempt Etsy dispatch.','hold');
   return false;
  }
  const info=fields();
  if(form.dataset.productDirty==='1')line('Unsaved Product edits — Save Product before updating Etsy.','hold');
  line(`Saved Product #${id}: ${info.name||'name missing'} • CAD ${Number.isFinite(info.price)?info.price.toFixed(2):'unknown'} • quantity ${info.quantity||0}.`,info.name&&info.price>0&&info.quantity>0?'ready':'hold');
  if(!info.description)line('Description missing — add it in Description and Save Product.','hold');
  line(`${info.tags} SEO search phrase(s) in this Product. Etsy listing tags are not yet transferred automatically.`);
  return true;
 }
 async function refresh(){
  if(busy)return;
  if(!local()){note.textContent='No Etsy provider action was attempted.';return;}
  busy=true;$('dd496Refresh').disabled=true;loaded=false;
  line('Reading attached original photographs and saved Etsy draft receipts…');
  note.textContent='Reading local Product records only. No Etsy connection, photo transfer or listing update is performed.';
  try{
   const [photos,draft,transfers]=await Promise.all([
    read(`/api/admin/product-distribution-406?product_id=${id}&channel=etsy`),
    read(`/api/admin/product-etsy-existing-draft?product_id=${id}`),
    read(`/api/admin/product-etsy-images?product_id=${id}`)
   ]);
   if(Number(photos.product_id)!==id||Number(transfers.product_id)!==id)throw Error('Product identity does not match its image records.');
   local();
   const gallery=Array.isArray(photos.gallery)?photos.gallery:[];
   const clear=gallery.filter(photo=>photo.approved_for_distribution);
   const holds=gallery.filter(photo=>!photo.approved_for_distribution);
   line(`${gallery.length} original photo(s) attached to this Product; ${clear.length} explicitly approved for shared Etsy/Marketplace preparation.`,clear.length?'ready':'hold');
   for(const image of holds.slice(0,10))line(`Image #${image.product_image_id}: ${(image.hold_reasons||['permission or dimensions unverified']).join('; ')}. Fix in this Product's Media tab.`,'hold');
   const linked=String(draft.linked_listing_id||'').trim(),fromPhotos=String(transfers.listing_id||'').trim();
   if(linked&&fromPhotos&&linked!==fromPhotos){
    line(`HOLD — Product links Etsy draft #${linked}, but photo receipts target draft #${fromPhotos}. Do not create, update or transfer.`, 'hold');
   }else if(linked){
    line(`Existing Etsy draft #${linked} recorded. Select UPDATE, never Create Original. The listing is not automatically published.`, 'ready');
   }else if(fromPhotos){
    line(`Photo receipts reference draft #${fromPhotos}; verify the Product's missing draft link before any upload.`, 'hold');
   }else line('No existing Etsy draft linked. Check Etsy Drafts before authorizing an ORIGINAL.');
   const transferable=(transfers.images||[]).filter(item=>item.transferable&&!item.transferred&&!item.hold);
   line(`${Number(transfers.transferred||0)} photo transfer(s) locally confirmed; ${transferable.length} approved image(s) eligible for a first transfer; ${Number(transfers.hold_unconfirmed_claims||0)} unresolved attempt(s).`,Number(transfers.hold_unconfirmed_claims||0)?'hold':'');
   if(clear.length>transferable.length+Number(transfers.transferred||0))line('Some approved gallery images do not meet the original R2 JPEG/PNG transfer contract; review their source format before sending.','hold');
   note.textContent=linked?`Product #${id} can only update existing Etsy draft #${linked}. Confirm live Etsy draft identity and photographs separately. No Etsy write was performed.`:
    'An ORIGINAL draft is only appropriate after verifying that no existing draft exists. No Etsy write was performed.';
   loaded=true;
  }catch(error){local();line(`HOLD — Could not verify saved media and Etsy draft linkage: ${error.message}. Nothing was transferred.`, 'hold');note.textContent='Check saved Product authority and retry this read-only check later. Never assume a missing image was uploaded.';}
  finally{busy=false;$('dd496Refresh').disabled=false;}
 }
 function onOpen(){if(selectedTab()&&!loaded&&form.dataset.productAuthority==='ready')void refresh();}
 $('dd496Refresh')?.addEventListener('click',()=>void refresh());
 $('dd496FixImages')?.addEventListener('click',()=>{
  document.querySelector('[data-editor-tab="media"]')?.click();
  document.getElementById('productDistribution406')?.scrollIntoView({behavior:'smooth',block:'start'});
 });
 document.addEventListener('dd:editor-tab-opened',event=>{if(event.detail?.tab==='etsy')onOpen();});
 document.addEventListener('dd:product-loaded',onOpen);
 document.addEventListener('dd:save-succeeded',()=>{loaded=false;onOpen();});
 document.addEventListener('dd:media-inline-updated',()=>{loaded=false;onOpen();});
 document.addEventListener('dd:etsy-draft-created',()=>{loaded=false;onOpen();});
 document.addEventListener('dd:etsy-existing-draft-updated',()=>{loaded=false;onOpen();});
 form.addEventListener('input',()=>{loaded=false;if(selectedTab())local();});
 local();onOpen();
})();
