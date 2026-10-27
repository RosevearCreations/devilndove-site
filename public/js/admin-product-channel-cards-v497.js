/* Build 497: three honest cards from the SAME canonical Product and images.
   Remote checks require a deliberate click and NEVER write to providers. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),form=$('productEditorForm');
 const id=Number(new URLSearchParams(location.search).get('product_id')||0);
 if(!$('dd497ChannelCards')||!form||!window.DDAuth?.apiFetch)return;
 let busy=false,loaded=false;
 const saved=()=>id>0&&form.dataset.productAuthority==='ready'&&form.dataset.productDirty!=='1';
 const say=message=>{$('dd497ChannelStatus').textContent=message;};
 async function get(path){const response=await window.DDAuth.apiFetch(path,{method:'GET',cache:'no-store'});
  const value=await response.json().catch(()=>null);
  if(!response.ok||!value?.ok)throw Error(value?.error||`HTTP ${response.status}`);
  return value;
 }
 function card(title,status,description,items=[],kind='hold'){
  const section=document.createElement('section');section.className='dd497-channel-card';section.dataset.state=kind;
  const h=document.createElement('h4');h.textContent=title;
  const p=document.createElement('p');p.textContent=status;
  const note=document.createElement('p');note.className='small';note.textContent=description;
  const list=document.createElement('ul');list.className='small';
  for(const message of items){const item=document.createElement('li');item.textContent=message;list.append(item);}
  section.append(h,p,note,list);return section;
 }
 async function review(remote){if(busy||!saved()){say('HOLD — Save and reload this Product before trusting the three-channel cards.');return;}
  busy=true;controls();say(remote?'Reading live Etsy draft tags and photos; no edits or upload…':'Reading canonical Product information and local channel receipts…');
  try{
   const [etsy,facebook,draft,images,tags]=await Promise.all([
    get(`/api/admin/product-distribution-406?product_id=${id}&channel=etsy`),
    get(`/api/admin/product-distribution-406?product_id=${id}&channel=facebook`),
    get(`/api/admin/product-etsy-existing-draft?product_id=${id}`),
    get(`/api/admin/product-etsy-images?product_id=${id}`),
    get(`/api/admin/product-etsy-tags?product_id=${id}`)]);
   if([etsy.product_id,facebook.product_id,images.product_id,tags.product_id].some(value=>Number(value)!==id))throw Error('Product identity mismatch between channels.');
   const gallery=etsy.gallery||[],fbGallery=facebook.gallery||[];
   const identity=gallery.length===fbGallery.length&&gallery.every(photo=>fbGallery.some(fb=>
    Number(fb.product_image_id)===Number(photo.product_image_id)&&fb.image_url===photo.image_url));
   const approved=gallery.filter(photo=>photo.approved_for_distribution),holds=gallery.filter(photo=>!photo.approved_for_distribution);
   const common=approved.map(photo=>`Original #${photo.product_image_id}`);
   const linked=String(draft.linked_listing_id||'');
   const receipts=(images.images||[]).filter(photo=>photo.transferred);
   const localComplete=identity&&approved.length>0&&holds.length===0&&
     receipts.length===approved.length&&Number(images.hold_unconfirmed_claims||0)===0;
   let live=null,liveTags=null;
   if(remote){
    if(!linked||linked!==String(images.listing_id||''))throw Error('Existing Etsy draft is not consistently linked. No remote acceptance possible.');
    [live,liveTags]=await Promise.all([
     get(`/api/admin/product-etsy-images?product_id=${id}&reconcile=1`),
     get(`/api/admin/product-etsy-tags?product_id=${id}&reconcile=1`)]);
   }
   const photoMatch=live?.remote_reconciliation?.ready===true&&live?.photo_gap_492?.state==='matched';
   const tagMatch=liveTags?.matching_tags===true&&!liveTags?.unresolved_attempt&&tags.ready;
   const etsyReady=localComplete&&photoMatch&&tagMatch&&liveTags?.verified_canada_only&&
    String(liveTags.listing_id)===linked;
   const root=$('dd497ChannelCards');root.replaceChildren();
   const storeName=String(etsy.product?.name||'').trim();
   root.append(card('Our online store',gallery.length?'Shared source catalog available':'No photos in source catalog',
    'Same saved Product photo IDs. This is a catalog check, not a public checkout test.',
    [`Product #${id}: ${storeName||'name missing'}`,`${gallery.length} attached original(s), ${approved.length} externally approved`],
    gallery.length&&storeName?'ready':'hold'));
   root.append(card('Etsy draft',etsyReady?'VERIFIED — images and native tags match':
     localComplete?'Local image receipts present; live Etsy verification required':'HOLD — still needs photo or tag work',
     linked?`Existing draft #${linked}; Canada-only and unpublished checks apply.`:'No linked Etsy draft; never create a duplicate.',
     [`${receipts.length}/${approved.length} approved photo(s) with local receipts`,
      `${tags.local_tags.length} saved search tags; ${remote?tagMatch?'live tags matched':'live tags held/different':'live tags not yet compared'}`,
      remote?`Remote photo receipt state: ${live?.remote_reconciliation?.reason||'unknown'}`:'Click live verification before claiming Etsy completion'],
     etsyReady?'ready':'hold'));
   root.append(card('Facebook Marketplace','Manual card preparation only',
    'Shared image authority is ready for a manual handoff where approved. Automated Marketplace publication remains OFF.',
    [`Same original gallery across channels: ${identity?'yes':'HOLD — mismatch'}`,
     `${common.length} approved shared photo(s): ${common.join(', ')||'none'}`,
     `${holds.length} photo(s) still held`],identity&&approved.length>0&&holds.length===0?'ready':'hold'));
   say(!identity?'HOLD — original image identity differs between Etsy and Marketplace; review shared Product gallery.':
    remote?etsyReady?'Verified ✓ Etsy native tags and the complete original photo receipt inventory match the live unpublished draft. Facebook is still manual.':
     'HOLD — at least one Etsy live-photo, draft-link, native-tag, permission or local-transfer condition is incomplete. Do not claim three-channel publication.':
     'Local card comparison complete. Only our store source and manual Marketplace preparation were checked; click live verification for Etsy.');
   loaded=true;
  }catch(error){loaded=false;$('dd497ChannelCards').replaceChildren(card('Acceptance on hold','HOLD — '+error.message,
    'Nothing was sent or changed at Etsy or Facebook.'));say('Cannot verify the three cards until the outstanding evidence is refreshed.');}
  finally{busy=false;controls();}
 }
 function controls(){$('dd497ChannelLocal').disabled=busy||!saved();$('dd497ChannelRemote').disabled=busy||!saved();}
 $('dd497ChannelLocal').addEventListener('click',()=>void review(false));
 $('dd497ChannelRemote').addEventListener('click',()=>void review(true));
 function invalidate(){loaded=false;say('Product, photo or Etsy state changed. Refresh acceptance evidence; old cards are no longer proof.');
  $('dd497ChannelCards').replaceChildren();controls();}
 for(const event of ['dd:save-succeeded','dd:media-inline-updated','dd:etsy-draft-created',
  'dd:etsy-existing-draft-updated','dd:etsy-photo-verified','dd:etsy-native-tags-verified'])
  document.addEventListener(event,invalidate);
 form.addEventListener('input',controls);document.addEventListener('dd:product-loaded',controls);
 controls();
})();
