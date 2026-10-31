/* Build 544: isolated, explicit owner-controlled connection and photo transfer.
   No legacy Etsy DOM state is read or modified. No listing is created or published. */
const $=id=>document.getElementById(id);
const root=$('dd544EtsyFlow');
const productId=Number(new URLSearchParams(location.search).get('product_id')||0);
const form=$('productEditorForm');
const state={busy:false,linked:'',inspected:'',titleMatches:false,images:[],loaded:false,hold:false};
const valid=id=>/^[1-9]\d{0,14}$/.test(String(id||''));
const dirty=()=>form?.dataset.productDirty==='1';
const say=(id,message)=>{if($(id))$(id).textContent=message;};
async function api(path,payload){
  if(!window.DDAuth?.apiFetch)throw Error('Please sign in as an administrator.');
  const response=await window.DDAuth.apiFetch(path,{method:payload?'POST':'GET',cache:'no-store',...(payload?{headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}:{})});
  const data=await response.json().catch(()=>({error:'The server response was unreadable.'}));
  if(!response.ok||!data.ok)throw Error(data.error||`Server error (${response.status})`);
  return data;
}
function controls(){
  if(!root)return;
  const choice=$('dd544Listing').value.trim();
  $('dd544Inspect').disabled=state.busy||!valid(choice)||!$('dd544Exact').checked||!!state.linked||dirty();
  $('dd544Link').disabled=state.busy||!valid(choice)||choice!==state.inspected||!!state.linked||!$('dd544Exact').checked||(!state.titleMatches&&!$('dd544Older').checked)||dirty();
  $('dd544Refresh').disabled=state.busy||!productId;
  $('dd544Send').disabled=state.busy||!state.loaded||!state.linked||state.hold||dirty()||form?.dataset.productAuthority!=='ready'||!$('dd544Consent').checked||!state.images.some(x=>x.transferable&&!x.transferred&&!x.hold);
}
function gallery(){
  const container=$('dd544PhotosList');container.replaceChildren();
  if(!state.images.length){const p=document.createElement('p');p.textContent='No approved Product photographs available. Add and approve originals in Media first.';container.append(p);return;}
  for(const photo of state.images){
    const row=document.createElement('div');row.className='dd544-photo';
    const image=document.createElement('img');image.loading='lazy';image.alt=photo.alt_text||'Product photograph';
    if(/^https:\/\//.test(String(photo.image_url||'')))image.src=photo.image_url;
    const description=document.createElement('div');const title=document.createElement('strong');title.textContent=`Product photo #${photo.product_image_id}`;
    const detail=document.createElement('p');detail.textContent=photo.transferred?'✓ Confirmed on Etsy':photo.hold?'HOLD — inspect Etsy before trying again':photo.transferable?'Approved — ready to send':'Requires an approved original JPEG/PNG';
    const alt=document.createElement('p');alt.className='small';alt.textContent=photo.alt_text||'No alt text';
    description.append(title,detail,alt);row.append(image,description);container.append(row);
  }
}
async function load(){
  if(!root||!productId||state.busy)return;
  state.busy=true;controls();say('dd544ConnectStatus','Checking the saved connection to Etsy…');
  try{
    const candidate=productId===54?'4601705477':'';
    const receipt=await api(`/api/admin/product-etsy-existing-draft?product_id=${productId}${candidate?'&candidate_listing_id='+candidate:''}`);
    const linked=receipt.saved_link_readback_confirmed===true&&Number(receipt.product_id)===productId&&valid(receipt.linked_listing_id)&&!!String(receipt.receipt_id||'').trim();
    const conflict=linked&&candidate&&String(receipt.linked_listing_id)!==candidate;
    state.linked=linked&&!conflict?String(receipt.linked_listing_id):'';
    if(state.linked){$('dd544Listing').value=state.linked;say('dd544ConnectStatus',`✓ Existing Etsy draft #${state.linked} connected and confirmed by saved receipt.`);}
    else{
      if(candidate&&!$('dd544Listing').value)$('dd544Listing').value=candidate;
      say('dd544ConnectStatus',conflict?'HOLD — this Product is connected to a different listing. Do not change it until the conflict is resolved.':receipt.candidate_receipt_state==='another_product'||receipt.candidate_receipt_state==='multiple_local_claims'?'HOLD — another Product may already claim this listing. Review the actual Etsy draft before connecting.':'Not connected yet. Check the existing listing number, tick the confirmation, and choose Verify existing draft.');
    }
    const photos=await api(`/api/admin/product-etsy-images?product_id=${productId}`);
    state.images=Array.isArray(photos.images)?photos.images:[];
    state.loaded=true;state.hold=Boolean(Number(photos.hold_unconfirmed_claims||0))||state.images.some(x=>x.hold)||conflict;
    if(state.linked&&photos.listing_id&&String(photos.listing_id)!==state.linked)state.hold=true;
    gallery();
    say('dd544PhotosStatus',state.hold?'HOLD — existing Etsy photo claims or listing identity need manual review. No upload allowed.':state.linked?`${state.images.filter(x=>x.transferred).length} photograph(s) confirmed on draft #${state.linked}. Review the remaining photographs below.`:'Connect the existing draft in Step 1 before sending any photos.');
  }catch(error){state.loaded=false;state.hold=true;say('dd544ConnectStatus',`Could not verify the existing draft: ${error.message}`);say('dd544PhotosStatus','No photographs were sent. Refresh after checking the connection.');}
  finally{state.busy=false;controls();}
}
async function inspect(){
  if(state.busy||dirty()||!$('dd544Exact').checked)return;
  const choice=$('dd544Listing').value.trim();if(!valid(choice))return;
  state.busy=true;controls();say('dd544ConnectStatus','Verifying the exact unpublished Etsy listing and Canada-only shipping…');
  try{
    const data=await api('/api/admin/product-etsy-existing-draft',{action:'inspect_listing',product_id:productId,listing_id:choice,request_key:crypto.randomUUID(),confirm_exact_etsy_listing:true,confirm_unpublished_only:true,confirm_canada_only:true,confirm_prior_title_difference:false,confirm_saved_product_fields:false});
    if(String(data.listing_id)!==choice)throw Error('The Etsy listing ID did not match.');
    state.inspected=choice;state.titleMatches=data.title_matches===true;
    say('dd544Preview',`Etsy: “${data.etsy_title}” · Our Product: “${data.product_title}”. ${state.titleMatches?'Titles match.':'Titles differ — confirm the actual Product identity below.'}`);
    $('dd544OlderWrap').hidden=state.titleMatches;
    say('dd544ConnectStatus','✓ Etsy draft verified. Choose Connect verified draft to save the Product link.');
  }catch(error){state.inspected='';say('dd544ConnectStatus',`HOLD — ${error.message} No Etsy listing was changed.`);}
  finally{state.busy=false;controls();}
}
async function connect(){
  const choice=$('dd544Listing').value.trim();if(state.busy||dirty()||choice!==state.inspected||(!state.titleMatches&&!$('dd544Older').checked))return;
  state.busy=true;controls();say('dd544ConnectStatus','Saving a verified connection to the existing draft…');
  try{
    const data=await api('/api/admin/product-etsy-existing-draft',{action:'link_existing',product_id:productId,listing_id:choice,request_key:crypto.randomUUID(),confirm_exact_etsy_listing:true,confirm_unpublished_only:true,confirm_canada_only:true,confirm_prior_title_difference:!state.titleMatches&&$('dd544Older').checked,confirm_saved_product_fields:false});
    if(!data.saved_link_readback_confirmed||!data.receipt_id||String(data.listing_id)!==choice)throw Error('The saved link was not independently confirmed.');
    state.linked=choice;say('dd544ConnectStatus',`✓ Connected to existing Etsy draft #${choice}. Nothing was published or duplicated.`);
    document.dispatchEvent(new CustomEvent('dd:etsy-existing-draft-linked',{detail:{product_id:productId,listing_id:choice}}));
  }catch(error){say('dd544ConnectStatus',`HOLD — ${error.message} Verify the saved link before trying again.`);}
  finally{state.busy=false;controls();if(state.linked)void load();}
}
async function send(){
  if(state.busy||dirty()||!state.linked||state.hold||!$('dd544Consent').checked||form?.dataset.productAuthority!=='ready')return;
  const batch=state.images.filter(x=>x.transferable&&!x.transferred&&!x.hold);if(!batch.length)return;
  state.busy=true;controls();let confirmed=0;
  for(const photo of batch){
    say('dd544PhotosStatus',`Sending photo #${photo.product_image_id} to draft #${state.linked} (${confirmed} of ${batch.length} confirmed). Please keep this tab open.`);
    try{
      const result=await api('/api/admin/product-etsy-images',{action:'transfer_one',product_id:productId,product_image_id:photo.product_image_id,request_key:crypto.randomUUID(),confirm_approved_media:true,confirm_unpublished_only:true,confirm_canada_only:true});
      if(!result.uploaded||!result.etsy_image_id||result.verified_remote_readback!==true)throw Error('The live Etsy photo ID could not be verified.');
      photo.transferred=true;confirmed++;gallery();
    }catch(error){photo.hold=true;state.hold=true;gallery();say('dd544PhotosStatus',`STOP — ${confirmed} photo(s) confirmed. ${error.message} Open the actual Etsy draft and inspect its photos. Do not retry an uncertain upload.`);break;}
  }
  if(!state.hold)say('dd544PhotosStatus',`✓ ${confirmed} new photo(s) verified by Etsy photo-ID readback on unpublished draft #${state.linked}. Check the order in Etsy before publishing.`);
  state.busy=false;controls();
}
if(root){
  if(productId===54)$('dd544Listing').value='4601705477';
  $('dd544Listing').addEventListener('input',()=>{state.inspected='';state.titleMatches=false;$('dd544OlderWrap').hidden=true;controls();});
  for(const id of ['dd544Exact','dd544Older','dd544Consent'])$(id).addEventListener('change',controls);
  $('dd544Inspect').addEventListener('click',()=>void inspect());
  $('dd544Link').addEventListener('click',()=>void connect());
  $('dd544Refresh').addEventListener('click',()=>void load());
  $('dd544Send').addEventListener('click',()=>void send());
  form?.addEventListener('input',controls);form?.addEventListener('change',controls);
  document.addEventListener('dd:save-succeeded',()=>{state.loaded=false;void load();});
  document.addEventListener('dd:editor-tab-opened',event=>{if(event.detail?.tab==='publishing'&&!state.loaded)void load();});
  // Build 557: do not wake Etsy's two live receipt reads merely because the
  // owner opened Details. Destinations loads on explicit tab access; deep-links
  // to that tab still load immediately. This also reduces 524 timeout pressure.
  controls();
  if(productId&&new URLSearchParams(location.search).get('tab')==='publishing')void load();
}
