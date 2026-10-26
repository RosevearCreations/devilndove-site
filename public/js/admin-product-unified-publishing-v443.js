// Build 443: manual, owner-approved image transfer and honest Meta manual handoff.
// No provider calls run until an explicit click. Each selected image gets one remote attempt.
(() => {
  'use strict';
  const form=document.getElementById('productEditorForm');
  const id=Number(new URLSearchParams(location.search).get('product_id')||0);
  const $=name=>document.getElementById(name);
  if(!form||!window.DDAuth?.apiFetch)return;
  const state={busy:false,loaded:false,images:[],listingId:null,uncertain:false};
  const status=(name,value)=>{const node=$(name);if(node)node.textContent=value;};
  const dirty=()=>form.dataset.productDirty==='1';
  const api=async(path,body)=>{
    const res=await window.DDAuth.apiFetch(path,{method:body?'POST':'GET',cache:'no-store',
      ...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
    const data=await res.json().catch(()=>({error:'Server returned an unreadable response.'}));
    if(!res.ok||!data.ok)throw Error(data.error||`Request failed (${res.status})`);
    return data;
  };
  function update(){
    const send=$('dd443EtsyImagesSend'),consent=$('dd443EtsyImagesConsent');
    if($('dd443EtsyImagesLoad'))$('dd443EtsyImagesLoad').disabled=state.busy;
    if(send)send.disabled=state.busy||state.uncertain||!state.listingId||dirty()||
      !consent?.checked||!state.images.some(item=>!item.transferred&&!item.hold&&item.transferable);
  }
  function showGallery(){
    const root=$('dd443EtsyImagesList');if(!root)return;root.replaceChildren();
    if(!state.images.length){const p=document.createElement('p');p.className='small';
      p.textContent='No gallery photos are approved yet. Open Media to add/approve an original JPEG or PNG at least 800×800 pixels with alt text.';
      root.append(p);return;}
    for(const row of state.images){
      const item=document.createElement('div');item.className='dd443-image-row';
      const img=document.createElement('img');if(/^https:\/\//.test(String(row.image_url||'')))img.src=row.image_url;
      img.alt=row.alt_text||'Product gallery photo';img.loading='lazy';
      const body=document.createElement('div'),title=document.createElement('strong'),info=document.createElement('p');
      title.textContent=`Product photo #${row.product_image_id}`;
      info.className='dd443-image-state small';info.textContent=row.transferred?'✓ Confirmed uploaded to Etsy':
        row.hold?'HOLD — previous attempt needs human review':row.transferable?'Approved • ready for one-time transfer':
        'Needs a supported original Product R2 image (JPEG/PNG)';
      const alt=document.createElement('p');alt.className='small';alt.textContent=row.alt_text||'Missing alt text';
      body.append(title,info,alt);item.append(img,body);root.append(item);
    }
  }
  async function load(){
    if(state.busy||!id)return;
    state.busy=true;update();status('dd443EtsyImagesStatus','Loading saved draft receipt and approved Product photographs…');
    try{
      const data=await api(`/api/admin/product-etsy-images?product_id=${encodeURIComponent(id)}`);
      state.listingId=data.listing_id;state.images=Array.isArray(data.images)?data.images:[];
      state.loaded=true;state.uncertain=Number(data.hold_unconfirmed_claims||0)>0||state.images.some(image=>image.hold);
      showGallery();
      status('dd443EtsyImagesStatus',state.listingId?
        `Etsy draft #${state.listingId} • ${data.transferred} image(s) already confirmed • ${data.pending} awaiting review. ${state.uncertain?'HOLD: a previous image result needs reconciliation.':''}`:
        'No confirmed Product Editor Etsy draft is linked. If one already exists in Etsy, use “Update the Etsy draft we already created” above to verify and link its listing ID. Do NOT create another draft.');
    }catch(e){state.loaded=false;status('dd443EtsyImagesStatus',`Could not load current draft/photos: ${e.message}. No provider write.`);}
    finally{state.busy=false;update();}
  }
  async function send(){
    if(state.busy||state.uncertain||!state.listingId||!$('dd443EtsyImagesConsent')?.checked||dirty())return;
    if(!globalThis.crypto?.randomUUID){status('dd443EtsyImagesStatus','Secure one-time request keys are not available. Nothing sent.');return;}
    const batch=state.images.filter(image=>!image.transferred&&!image.hold&&image.transferable);
    if(!batch.length)return;
    state.busy=true;update();let confirmed=0;
    for(const image of batch){
      status('dd443EtsyImagesStatus',`Sending approved image #${image.product_image_id} to Etsy draft #${state.listingId} (${confirmed}/${batch.length} confirmed). Do not leave this page…`);
      try{
        const result=await api('/api/admin/product-etsy-images',{action:'transfer_one',product_id:id,
          product_image_id:image.product_image_id,request_key:crypto.randomUUID(),
          confirm_approved_media:true,confirm_unpublished_only:true,confirm_canada_only:true});
        if(!result.uploaded||!result.etsy_image_id)throw Error('Etsy image ID was not confirmed.');
        image.transferred=true;confirmed++;showGallery();
      }catch(e){
        image.hold=true;state.uncertain=true;showGallery();
        status('dd443EtsyImagesStatus',`STOP after ${confirmed} confirmed image(s): ${e.message} Check actual Etsy Drafts. We will not automatically retry the held photo.`);
        break;
      }
    }
    if(!state.uncertain)status('dd443EtsyImagesStatus',`Etsy confirmed ${confirmed} newly uploaded image(s) for draft #${state.listingId}. The listing remains unpublished. Check Etsy Drafts to review photo order.`);
    state.busy=false;update();
  }
  $('dd443EtsyImagesLoad')?.addEventListener('click',()=>void load());
  $('dd443EtsyImagesSend')?.addEventListener('click',()=>void send());
  $('dd443EtsyImagesConsent')?.addEventListener('change',update);
  if(id)$('dd443EtsyImagesEdit')?.setAttribute('href',`/admin/catalog-media/?product_id=${encodeURIComponent(id)}`);
  form.addEventListener('input',update);form.addEventListener('change',update);
  document.addEventListener('dd:save-succeeded',()=>{state.loaded=false;state.listingId=null;state.images=[];
    status('dd443EtsyImagesStatus','Product changed. Load fresh approved gallery before transferring photos.');update();});

  $('dd443MetaPrepare')?.addEventListener('click',()=>{
    if(!id||dirty()){
      status('dd443MetaManualStatus','Save this Product first, then prepare the current listing text. Nothing sent to Facebook.');return;
    }
    const get=name=>String(form.elements.namedItem(name)?.value||'').trim();
    if(!get('name')||!get('price')){status('dd443MetaManualStatus','Save a Product name and CAD price first.');return;}
    $('dd443MetaTitle').value=get('name');$('dd443MetaPrice').value=get('price');
    $('dd443MetaDescription').value=get('description')||get('short_description');
    $('dd443MetaCopyFields').hidden=false;
    status('dd443MetaManualStatus','Ready to copy. This is a MANUAL handoff, not a Facebook connection or listing publication.');
  });
  document.querySelectorAll('[data-dd443-copy]').forEach(button=>button.addEventListener('click',async()=>{
    const value=String($(button.dataset.dd443Copy)?.value||'');if(!value)return;
    try{await navigator.clipboard.writeText(value);status('dd443MetaManualStatus','Copied. Paste this field into Facebook Marketplace and review it there.');}
    catch{const target=$(button.dataset.dd443Copy);target?.focus();target?.select();
      status('dd443MetaManualStatus','Clipboard permission unavailable. Text selected; use Ctrl+C to copy.');}
  }));
  update();
})();
