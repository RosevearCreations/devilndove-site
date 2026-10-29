/* Build 523 — one saved Product, one canonical gallery, optional owner-authorized
 * Etsy draft POST and a truthful manual Facebook Marketplace handoff.
 * Existing Etsy drafts are untouched. No automatic provider request on Save. */
import {assessProductDraft523,LEGACY_OWNER_TRIAL_IDS_523} from './product-destination-gates-523.mjs';

const $=id=>document.getElementById(id),form=$('productEditorForm'),root=$('dd523Flow');
if(form&&root&&window.DDAuth?.apiFetch){
 const id=Number(new URLSearchParams(location.search).get('product_id')||0);
 const etsy=$('productChannel405Etsy'),facebook=$('productChannel405Facebook'),ack=$('dd523EtsyAcknowledge');
 const post=$('dd523EtsyPost'),reviewButton=$('dd523Review'),manual=$('dd523MarketplacePrepare');
 const message=$('dd523Readiness'),issues=$('dd523Issues'),result=$('dd523PostStatus'),identity=$('dd523Identity');
 const setup=$('dd523EtsySetupMount');
 const originalSettings=$('dd500NewSettings');
 if(originalSettings)setup.append(originalSettings); // One real set of Etsy fields, inside Product input.
 // Retain all historical Etsy trial/repair controls, but move the sprawling
 // diagnostic surface behind a collapsed disclosure. New products use the
 // short Review and send panel instead of the legacy multi-step UI.
 const originalEtsyPanel=$('dd500Package');
 if(originalEtsyPanel){const technical=document.createElement('details');technical.className='dd523-technical-etsy';
  const caption=document.createElement('summary');caption.textContent='Older Etsy draft diagnostics and recovery (advanced only)';
  originalEtsyPanel.before(technical);technical.append(caption,originalEtsyPanel);}
 const state={busy:false,etsyReady:false,facebookReady:false,read:null,provider:null,unsafe:false,
  lastVerifiedFingerprint:'',lastListingId:''};
 const selected=()=>({etsy:etsy.checked,facebook:facebook.checked});
 const value=name=>String(form.elements.namedItem(name)?.value||'').trim();
 const product=()=>({name:value('name'),description:value('description')||value('short_description'),price:value('price'),
  quantity:value('inventory_quantity'),weight_grams:value('weight_grams'),sku:value('sku'),slug:value('slug')});
 const fingerprint=()=>JSON.stringify([product(),selected(),form.dataset.productDirty,form.dataset.productAuthority]);
 const saved=()=>id>0&&form.dataset.productAuthority==='ready'&&form.dataset.productDirty!=='1'&&
  window.DDProductChannels405?.isLoaded?.()===true&&!window.DDProductChannels405?.isDirty?.();
 const say=(text,tone='')=>{message.textContent=text;message.dataset.tone=tone;};
 const postStatus=(text,tone='')=>{result.textContent=text;result.dataset.tone=tone;};
 const list=(rows)=>issues.replaceChildren(...rows.map(s=>{const li=document.createElement('li');li.textContent=s;return li;}));
 function render(){
  const choices=selected(),legacy=LEGACY_OWNER_TRIAL_IDS_523.includes(id);
  setup.hidden=!choices.etsy||legacy||id<1;
  reviewButton.disabled=state.busy||!id;
  ack.disabled=state.busy||!choices.etsy||!state.etsyReady||state.unsafe||legacy;
  post.disabled=state.busy||!choices.etsy||!ack.checked||!state.etsyReady||state.unsafe||legacy;
  manual.disabled=state.busy||!choices.facebook||!state.facebookReady||state.unsafe||legacy;
  post.textContent=state.lastListingId?`POST update to unpublished Etsy #${state.lastListingId}`:'POST one unpublished Etsy draft';
  const p=product();
  identity.textContent=`Product ${id?'#'+id:'not yet saved'} · ${p.name||'Untitled'} · SKU ${p.sku||'not set'} · Slug ${p.slug||'not set'} · Etsy listing ID: ${state.lastListingId||'not linked'}`;
  if(legacy)postStatus(`Existing Product #${id} belongs to the two earlier Etsy trial records. We will leave those drafts and their IDs untouched; use a new Product for this new workflow.`,'warn');
 }
 async function get(path){const r=await window.DDAuth.apiFetch(path,{method:'GET',cache:'no-store'});
  if(window.DDAuth.readApiJson)return window.DDAuth.readApiJson(r,{fallbackMessage:'Product/gallery check failed.'});
  const data=await r.json().catch(()=>null);if(!r.ok||!data?.ok)throw Error(data?.error||`HTTP ${r.status}`);return data;}
 function invalidate(){state.etsyReady=false;state.facebookReady=false;state.read=null;state.provider=null;state.lastVerifiedFingerprint='';ack.checked=false;
  say('Product or channel selection changed. Save the Product, then recheck every original photo before POST.');list(['Review the changed fields and original-image approvals.']);render();}
 async function check({preserveAck=false}={}){
  if(state.busy)return false;
  const wasAck=preserveAck&&ack.checked;
  state.busy=true;state.etsyReady=false;state.facebookReady=false;ack.checked=false;render();
  try{
   if(!saved())throw Error(id?'Product edits, saved channel preferences or the authoritative record have not finished saving.':'Save this Product first, then upload/approve its images.');
   const choice=selected();if(!choice.etsy&&!choice.facebook)throw Error('Select Etsy, Facebook Marketplace or both, then Save Product.');
   say('Reading the saved Product and every original image (no provider write)…');
   const responses=await Promise.all([get(`/api/admin/product-distribution-406?product_id=${id}&channel=etsy`),
    ...(choice.facebook?[get(`/api/admin/product-distribution-406?product_id=${id}&channel=facebook`)]:[])]);
   const gallery=responses[0].gallery||[];
   if(responses.some(r=>Number(r.product_id)!==id))throw Error('Saved Product/gallery identity mismatched.');
   if(responses.length===2){const ids=x=>(x.gallery||[]).map(im=>Number(im.product_image_id)).sort((a,b)=>a-b).join(',');
    if(ids(responses[0])!==ids(responses[1]))throw Error('Etsy and Marketplace did not return the same canonical original gallery.');}
   const base={productId:id,product:product(),images:gallery,authorityReady:saved(),dirty:false,channelSelected:true};
   const common=assessProductDraft523({...base,channel:choice.etsy?'etsy':'facebook'});
   const blockers=[...common.issues];
   if(choice.etsy){
    const controller=window.DDEtsyDraftFlow523;
    if(!controller)blockers.push('Etsy provider workflow has not loaded; refresh this Product before any POST.');
    else {
     state.provider=await controller.inspect();state.lastListingId=String(state.provider.linked_listing_id||'');
     blockers.push(...(state.provider.issues||[]));
     if(state.provider.ready!==true&&!(state.provider.issues||[]).length)
      blockers.push('The actual Etsy shop and package readback are not ready for a draft POST.');
     if(Number(state.provider.images)!==common.gallery.count)
      blockers.push('Etsy package image count does not match every saved original photo. Resolve the source/gallery mismatch before POST.');
     state.etsyReady=common.ready&&state.provider.ready===true&&!state.unsafe;
    }
   }
   state.facebookReady=choice.facebook&&common.ready&&!state.unsafe;
   state.read={gallery:common.gallery,issues:blockers};state.lastVerifiedFingerprint=fingerprint();
   if(blockers.length){list([...new Set(blockers)]);say(`Needs attention: ${blockers.length} Product, image or Etsy setup requirement(s). Nothing was POSTed.`,'warn');}
   else {list([`${common.gallery.count} actual original photo(s) checked: verified ≥800 × 800 px, alt text, HTTPS and full public-use permission.`,
      choice.etsy?'Etsy native category, Canada-only shipping, processing and parcel fields are verified for this draft action.':'Facebook handoff uses the same saved Product.']);
    say(`Ready for owner review. ${choice.etsy?(state.lastListingId?'Update Etsy #'+state.lastListingId:'Create one unpublished Etsy draft'):'No Etsy POST selected'}. ${choice.facebook?'Marketplace remains manual.':''}`,'ok');}
   if(blockers.length)state.etsyReady=false;
   ack.checked=wasAck&&state.etsyReady;
   return choice.etsy?state.etsyReady:state.facebookReady;
  }catch(error){list([error.message]);say('HOLD — '+error.message+' No provider POST was attempted.','error');return false;}
  finally{state.busy=false;render();}
 }
 async function postEtsy(){
  if(!ack.checked||!etsy.checked||state.unsafe||LEGACY_OWNER_TRIAL_IDS_523.includes(id)||state.busy)return;
  const confirmed=await check({preserveAck:true});
  if(!confirmed||!ack.checked||!state.etsyReady||state.lastVerifiedFingerprint!==fingerprint())return;
  const target=state.lastListingId?`update unpublished Etsy draft #${state.lastListingId}`:'create one NEW unpublished Etsy draft';
  if(!window.confirm(`POST now to ${target} for Product #${id}, using every approved original photo? Nothing will be published. Cancel to review.`))return;
  state.busy=true;state.etsyReady=false;state.unsafe=true;render();
  postStatus(`Submitting one owner-approved Etsy ${state.lastListingId?'update':'draft creation'} attempt. Do not refresh or retry until its real result is confirmed.`,'warn');
  try{
   const response=await window.DDEtsyDraftFlow523.post();
   if(response.posted&&/^[1-9]\d{0,14}$/.test(String(response.linked_listing_id||''))){
    state.lastListingId=String(response.linked_listing_id);state.unsafe=false;
    postStatus(`Verified: Etsy unpublished draft #${state.lastListingId} is linked to Product #${id}. Refresh saved Etsy ID to confirm the Product record. Nothing published.`,'ok');
    $('dd498IdentityRefresh')?.click();
    document.dispatchEvent(new CustomEvent('dd:etsy-draft-flow-523-complete',{
     detail:{product_id:id,listing_id:state.lastListingId,unpublished:true}}));
   }else postStatus(`HOLD — ${response.status||response.issues?.[0]||'Etsy write result unconfirmed.'} Inspect Etsy and the saved ID before another attempt.`,'error');
  }catch(error){postStatus(`HOLD — ${error.message}. An Etsy attempt may have occurred. Verify the real remote draft and saved ID before retrying.`,'error');}
  finally{state.busy=false;ack.checked=false;render();}
 }
 function prepareMarketplace(){
  if(!state.facebookReady||state.busy||state.unsafe||!facebook.checked||state.lastVerifiedFingerprint!==fingerprint())return;
  const p=product();$('dd523MarketplaceTitle').value=p.name;$('dd523MarketplacePrice').value=p.price;
  $('dd523MarketplaceDescription').value=p.description;$('dd523MarketplaceCopy').hidden=false;
  postStatus(`Prepared a manual Facebook Marketplace handoff for Product #${id} from the same approved gallery. No Facebook POST was performed; copy the fields, attach the originals in Facebook, and review there.`,'ok');
 }
 $('dd523OpenMedia')?.addEventListener('click',()=>{document.querySelector('[data-editor-tab="media"]')?.click();
  $('productDistribution406')?.scrollIntoView({block:'start',behavior:'smooth'});});
 reviewButton.addEventListener('click',()=>void check());
 ack.addEventListener('change',render);post.addEventListener('click',()=>void postEtsy());
 manual.addEventListener('click',prepareMarketplace);
 for(const checkbox of [etsy,facebook])checkbox.addEventListener('change',invalidate);
 form.addEventListener('input',event=>{if(event.target.closest('#dd523Flow')||event.target.closest('#dd500NewSettings')){if(event.target.closest('#dd500NewSettings'))invalidate();return;}
  if(event.target.matches('input,textarea,select'))invalidate();});
 form.addEventListener('change',event=>{if(event.target.closest('#dd500NewSettings'))invalidate();});
 document.addEventListener('dd:product-loaded',()=>invalidate());
 document.addEventListener('dd:save-succeeded',()=>invalidate());
 document.addEventListener('dd:media-inline-updated',()=>invalidate());
 document.addEventListener('dd:product-channel-tags-changed',()=>invalidate());
 document.addEventListener('dd:etsy-draft-created',event=>{if(Number(event.detail?.product_id)===id){state.lastListingId=String(event.detail.listing_id||'');render();}});
 if(!id)reviewButton.disabled=true;
 render();
}
