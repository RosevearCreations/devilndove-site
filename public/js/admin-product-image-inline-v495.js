/* Build 495: edit canonical photograph metadata and score in the Product Editor.
   This is the same Product image authority used by the Image Editor. Nothing is
   copied, published, sent to Etsy/Meta, or silently granted public permission. */
(()=>{'use strict';
 const root=document.getElementById('productDistribution406Gallery');
 const notice=document.getElementById('dd495InlineImageStatus');
 const id=Number(new URLSearchParams(location.search).get('product_id')||0);
 if(!root||!notice||!window.DDAuth?.apiFetch)return;
 let busy=false;
 const status=(message,tone='')=>{notice.textContent=message;notice.dataset.tone=tone;};
 async function api(path,body){
  const response=await window.DDAuth.apiFetch(path,{method:body?'POST':'GET',cache:'no-store',
   ...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  const result=await response.json().catch(()=>null);
  if(!response.ok||!result?.ok)throw Error(result?.error||`Image request failed (${response.status})`);
  return result;
 }
 function field(label,value,kind='input',max=250){
  const wrap=document.createElement('label');wrap.className='dd495-image-field';
  const title=document.createElement('span');title.className='dd489-both';title.textContent=label;
  const input=document.createElement(kind==='textarea'?'textarea':'input');
  input.className='input';input.maxLength=max;input.value=value||'';
  wrap.append(title,input);return {wrap,input};
 }
 async function open(imageId,button){
  if(busy||!id)return;
  const mount=root.querySelector(`[data-dd495-inline="${imageId}"]`);
  if(!mount)return;
  if(mount.childNodes.length){mount.replaceChildren();button.textContent='Edit image requirements here';return;}
  busy=true;button.disabled=true;status(`Reading saved information for image #${imageId}…`);
  try{
   const data=await api(`/api/admin/product-image-editor?product_image_id=${imageId}`),original=data.image||{};
   if(Number(original.product_id)!==id)throw Error('This photo does not belong to the current Product.');
   const panel=document.createElement('div');panel.className='dd495-image-inline';
   const heading=document.createElement('strong');heading.textContent=`Image #${imageId} — fill once, use for all destinations`;
   const help=document.createElement('p');help.className='small';
   help.textContent='Orange/blue underlined labels indicate shared Etsy and Marketplace preparation. These details also support the store. Review ownership before granting public use; permission is never inferred from an upload.';
   const alt=field('Both: descriptive image alt text',original.alt_text,'textarea',1000);
   const title=field('Both: image title / search description',original.image_title,'input',250);
   const caption=field('Store and export: optional caption',original.caption,'textarea',2000);
   const approval=document.createElement('label');approval.className='dd495-image-field';
   const approvalTitle=document.createElement('span');approvalTitle.className='dd489-both';approvalTitle.textContent='Both: original photograph / public-use permission';
   const permission=document.createElement('select');permission.className='input';
   for(const [value,label] of [
    ['internal_review','Not approved — internal review'],['product_page_ok','Approved for own store/product page'],
    ['social_ok','Approved for social channels'],['all_public_ok','I approve this original for store, Etsy and Marketplace'],
    ['consent_needed','Permission/consent still needed'],['blocked','Do not use publicly']]){
    const opt=new Option(label,value);permission.add(opt);
   }
   permission.value=original.public_use_status||'internal_review';
   approval.append(approvalTitle,permission);
   const metrics=document.createElement('p');metrics.className='small';
   metrics.textContent=`Current quality score: ${original.quality_score==null?'Not measured':original.quality_score+'/100'} • ${original.acceptance_status||'Not reviewed'} • saved dimensions: ${original.width_px||'?'}×${original.height_px||'?'}. Storefront primary-photo quality has a separate 1200×1200 target; outbound channels require verified dimensions at least 800×800.`;
   const save=document.createElement('button');save.className='btn primary';save.type='button';save.textContent='Save this photo & refresh its score';
   const result=document.createElement('p');result.className='small';result.setAttribute('role','status');
   const chosen=[alt,title,caption].map(x=>x.wrap);
   panel.append(heading,help,...chosen,approval,metrics,save,result);mount.append(panel);
   button.textContent='Close image requirements';
   save.addEventListener('click',async()=>{
    if(busy)return;
    busy=true;save.disabled=true;button.disabled=true;result.textContent='Saving image metadata (same original file)…';
    let metadataVerified=false;
    try{
     const payload={action:'save_metadata',product_image_id:imageId,alt_text:alt.input.value.trim(),
      image_title:title.input.value.trim(),caption:caption.input.value.trim(),
      public_use_status:permission.value,sort_order:Number(original.sort_order||0),
      image_role:original.image_role||'',annotation_notes:original.annotation_notes||'',
      role_review_notes:original.role_review_notes||'',
      focal_point_x:original.focal_point_x??null,focal_point_y:original.focal_point_y??null,
      set_featured:false};
     const saved=await api('/api/admin/product-image-editor',payload);
     if(saved.save_confirmed!==true)throw Error('Image metadata persistence was not confirmed.');
     const verified=await api(`/api/admin/product-image-editor?product_image_id=${imageId}`);
     const image=verified.image||{};
     if(Number(image.product_id)!==id||String(image.alt_text||'').trim()!==payload.alt_text||
       String(image.public_use_status||'')!==payload.public_use_status||
       String(image.image_title||'').trim()!==payload.image_title)
       throw Error('Saved image metadata does not match its readback. No provider transfer allowed.');
     metadataVerified=true;
     result.textContent='Image details saved ✓. Checking browser image dimensions and scoring…';
     const img=mount.closest('.dd495-image-card')?.querySelector('img');
     if(img?.complete&&img.naturalWidth>0&&img.naturalHeight>0){
      try{
       const scored=await api('/api/admin/product-image-editor',{action:'score',product_image_id:imageId,
        width_px:img.naturalWidth,height_px:img.naturalHeight,load_status:'loaded'});
       result.textContent=`Saved ✓ Image #${imageId} — score ${scored.quality_score}/100, ${scored.acceptance_status}. Channel readiness will refresh below.`;
      }catch(error){result.textContent=`Image metadata SAVED and verified ✓. Quality score was not confirmed: ${error.message}. Retest scoring before sending photographs.`;}
     }else result.textContent=`Saved ✓ Image #${imageId}. Image could not be measured in this browser; scoring needs a later explicit image load.`;
     status(`Image #${imageId} metadata verified on the original Product gallery. No Etsy or Marketplace operation happened.`,'ok');
     document.dispatchEvent(new CustomEvent('dd:media-inline-updated',{detail:{product_id:id,product_image_id:imageId}}));
    }catch(error){result.textContent=`HOLD — ${error.message}. ${metadataVerified?'Image metadata was verified, but subsequent steps were not confirmed.':'Do not assume image approval or scoring persisted.'}`;
     status(`Image #${imageId}: ${error.message}`,'error');}
    finally{busy=false;save.disabled=false;button.disabled=false;}
   });
  }catch(error){status(`Could not edit image #${imageId}: ${error.message}`,'error');}
  finally{busy=false;button.disabled=false;}
 }
 root.addEventListener('click',event=>{
  const button=event.target.closest('button[data-dd495-edit]');if(!button||!root.contains(button))return;
  const imageId=Number(button.dataset.dd495Edit);
  if(Number.isInteger(imageId)&&imageId>0)void open(imageId,button);
 });
 document.addEventListener('dd:shared-product-gallery-loaded',event=>{
  if(Number(event.detail?.product_id)!==id)return;
  const all=event.detail.images||[],eligible=all.filter(x=>x.approved_for_distribution).length;
  status(`${all.length} original Product image(s) already attached. ${eligible} meet current channel-preparation checks. Edit any held image here; no second upload or separate photo editor is required.`);
 });
})();
