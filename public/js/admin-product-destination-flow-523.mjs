/* Build 523 — one saved Product, one canonical gallery, optional owner-authorized
 * Etsy draft POST and a truthful manual Facebook Marketplace handoff.
 * Existing Etsy drafts are untouched. No automatic provider request on Save. */
import {assessProductDraft523,LEGACY_OWNER_TRIAL_IDS_523} from './product-destination-gates-523.mjs';
import {verifySavedEtsyReceipt524,prepareMarketplaceHandoff524} from './product-destination-receipts-524.mjs';
import {selectedMarketplacePhotos532} from './marketplace-photo-handoff-532.mjs';
import {ownerDraftDecision534,ownerDraftHistory534} from './etsy-owner-draft-history-534.mjs';
import {evaluateEtsyLiveOwnerReview535} from './etsy-live-owner-review-535.mjs';
// Build 533: the draft controller MUST finish initializing before this flow
// evaluates its readiness. Module-script tag order alone does not enforce
// dependency completion for separate module graphs.
import './admin-product-etsy-package-v500.mjs?v=528';

const $=id=>document.getElementById(id),form=$('productEditorForm'),root=$('dd523Flow');
if(form&&root&&window.DDAuth?.apiFetch){
 const id=Number(new URLSearchParams(location.search).get('product_id')||0);
 const etsy=$('productChannel405Etsy'),facebook=$('productChannel405Facebook'),ack=$('dd523EtsyAcknowledge');
 const post=$('dd523EtsyPost'),reviewButton=$('dd523Review'),manual=$('dd523MarketplacePrepare');
 const marketplacePanel=root.querySelector('.dd523-marketplace');
 const message=$('dd523Readiness'),issues=$('dd523Issues'),result=$('dd523PostStatus'),identity=$('dd523Identity');
 const setup=$('dd523EtsySetupMount');
 const history=$('dd534HistoricalDraft'),historyMessage=$('dd534HistoricalDraftMessage');
 const setupReadback=$('dd534SetupReadback');
 const liveRead=$('dd535ReadLive'),liveStatus=$('dd535LiveStatus'),liveEvidence=$('dd535LiveEvidence');
 const receiptStatus=$('dd524ReceiptStatus'),receiptButton=$('dd524ReadReceipt');
 const originalSettings=$('dd500NewSettings');
 if(originalSettings)setup.append(originalSettings); // One real set of Etsy fields, inside Product input.
 // Retain all historical Etsy trial/repair controls, but move the sprawling
 // diagnostic surface behind a collapsed disclosure. New products use the
 // short Review and send panel instead of the legacy multi-step UI.
 const originalEtsyPanel=$('dd500Package');
 if(originalEtsyPanel){const technical=document.createElement('details');technical.className='dd523-technical-etsy';
  const caption=document.createElement('summary');caption.textContent='Older Etsy draft diagnostics and recovery (advanced only)';
  originalEtsyPanel.before(technical);technical.append(caption,originalEtsyPanel);}
 const state={busy:false,liveBusy:false,etsyReady:false,facebookReady:false,read:null,provider:null,unsafe:false,unsafeReason:'',
  lastVerifiedFingerprint:'',lastListingId:'',savedReceipt:null};
 const confirmedListing=()=>state.savedReceipt?.verified===true&&state.savedReceipt.listing_id===state.lastListingId?
  state.lastListingId:'';
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
  const verifiedId=confirmedListing(),prior=ownerDraftDecision534(id,verifiedId);
  setup.hidden=!choices.etsy||legacy||id<1;
  reviewButton.disabled=state.busy||!id;
  ack.disabled=true; // Retired duplicate checkbox; confirmation stays at draft POST.
  post.disabled=state.busy||!choices.etsy||state.unsafe||legacy||id<1||prior.requiresExistingDraftCheck||
   Boolean(state.lastListingId&&!verifiedId);
  post.hidden=!choices.etsy;
  manual.disabled=state.busy||!choices.facebook||legacy||id<1;
  if(marketplacePanel)marketplacePanel.hidden=!choices.facebook;
  post.textContent=verifiedId?`Update Etsy draft #${verifiedId}`:
   prior.requiresExistingDraftCheck?'Verify existing Etsy draft before updating':'Create Etsy draft';
  if(history){history.hidden=!prior.requiresExistingDraftCheck;
   historyMessage.textContent=prior.report?
    `Our earlier owner trial reported Etsy draft #${prior.report.listingId} for ${prior.report.productName} (SKU ${prior.report.sku}). This is NOT a current Etsy verification or saved link. Inspect it in the connected Etsy shop and link it to this Product before updating. We will not create another draft.`:'';}
  if(setupReadback){
   const label=name=>{const element=$('dd500'+name);
    return element?.value?element.selectedOptions?.[0]?.textContent?.trim()||'selected':'not selected';};
   setupReadback.textContent=verifiedId?
    `Saved primary Etsy ID #${verifiedId}: use the actual draft readback to confirm its category, Canada-only shipping, photographs and tags. First-time setup is not required for this update.`:
    `New-draft setup shown in editor (not remote acceptance): category ${label('Category')} · shipping ${label('Shipping')} · processing ${label('Processing')} · packed ${$('dd500Weight')?.value||'?'} ${$('dd500WeightUnit')?.value||''}, ${[$('dd500Length')?.value,$('dd500Width')?.value,$('dd500Height')?.value].join(' × ')} ${$('dd500DimensionUnit')?.value||''}.`;
  }
  const p=product();
  identity.textContent=`Product ${id?'#'+id:'not yet saved'} · ${p.name||'Untitled'} · SKU ${p.sku||'not set'} · Slug ${p.slug||'not set'} · Etsy listing ID: ${verifiedId||'not confirmed'}${!verifiedId&&state.lastListingId?' (candidate #'+state.lastListingId+')':''}`;
  receiptButton.disabled=state.busy||id<1;
  if(liveRead)liveRead.disabled=state.busy||state.liveBusy||id<1;
  if(legacy)postStatus(`Existing Product #${id} belongs to the two earlier Etsy trial records. We will leave those drafts and their IDs untouched; use a new Product for this new workflow.`,'warn');
 }
 async function get(path){const r=await window.DDAuth.apiFetch(path,{method:'GET',cache:'no-store'});
  if(window.DDAuth.readApiJson)return window.DDAuth.readApiJson(r,{fallbackMessage:'Product/gallery check failed.'});
  const data=await r.json().catch(()=>null);if(!r.ok||!data?.ok)throw Error(data?.error||`HTTP ${r.status}`);return data;}
 async function readReceipt524({expectedListingId=''}={}){
  if(id<1||LEGACY_OWNER_TRIAL_IDS_523.includes(id))return {verified:false,unlinked:true,issues:[]};
  try{
   // Build 535: the primary D1 Product-key lookup can miss a saved unique
   // listing claim recovered by exact listing ID. Query the candidate on
   // the SAME read-only primary endpoint; it only returns a link when the
   // unique claim is genuinely owned by this Product.
   const candidate=/^[1-9]\d{0,14}$/.test(String(expectedListingId||''))?
    String(expectedListingId):ownerDraftHistory534(id)?.listingId||'';
   const query=`/api/admin/product-etsy-existing-draft?product_id=${id}${candidate?`&candidate_listing_id=${encodeURIComponent(candidate)}`:''}`;
   const readback=await get(query);
   const proof=verifySavedEtsyReceipt524({productId:id,expectedListingId,readback});
   state.savedReceipt=proof;
   if((proof.verified||proof.unlinked)&&state.unsafeReason==='readback'){state.unsafe=false;state.unsafeReason='';}
   if(proof.verified){state.lastListingId=proof.listing_id;
    receiptStatus.textContent=`Saved primary D1 receipt #${proof.receipt_id}: Product #${id} · SKU ${proof.sku||'not set'} · Slug ${proof.slug||'not set'} → unpublished Etsy draft #${proof.listing_id}.`;
    receiptStatus.dataset.tone='ok';
   }else if(proof.unlinked){state.lastListingId='';receiptStatus.textContent=`Product #${id} has no saved Etsy draft ID. No draft was created by this read.`;receiptStatus.dataset.tone='';}
   else{state.unsafe=true;state.unsafeReason='readback';receiptStatus.textContent=`The saved Etsy ID cannot be confirmed: ${proof.issues.join(' ')} Candidate claim: ${readback.candidate_receipt_state||'unknown'}. Inspect and link this existing draft; do not create another.`;receiptStatus.dataset.tone='error';}
   if(proof.verified||proof.unlinked)document.dispatchEvent(new CustomEvent('dd:etsy-saved-receipt-532',
    {detail:{product_id:id,listing_id:proof.verified?proof.listing_id:null,verified:proof.verified}}));
   render();return proof;
   }catch(error){state.savedReceipt=null;state.unsafe=true;state.unsafeReason='readback';receiptStatus.textContent=`Could not check the saved Etsy ID: ${error.message}. Review Etsy Drafts before another write.`;
   receiptStatus.dataset.tone='error';render();return {verified:false,unlinked:false,issues:[error.message]};}
 }
 async function reviewLive535(){
  if(!liveRead||liveRead.disabled)return;
  state.liveBusy=true;liveRead.disabled=true;
  liveStatus.textContent='Checking the exact saved primary claim, live Etsy gallery and native tags (read only). Nothing is uploaded.';
  liveEvidence.replaceChildren();
  try{
   const candidate=confirmedListing()||state.lastListingId||ownerDraftHistory534(id)?.listingId||'';
   const receipt=await readReceipt524({expectedListingId:candidate});
   if(!receipt.verified){liveStatus.textContent='The Product and Etsy ID are not yet linked by a verified primary receipt. Use “Inspect earlier Etsy draft” to verify and link the same unpublished draft. No new listing was made.';return;}
   const [photoResult,tagResult]=await Promise.allSettled([
    get(`/api/admin/product-etsy-images?product_id=${id}&reconcile=1`),
    get(`/api/admin/product-etsy-tags?product_id=${id}&reconcile=1`)]);
   const photos=photoResult.status==='fulfilled'?photoResult.value:null;
   const tags=tagResult.status==='fulfilled'?tagResult.value:null;
   const verdict=evaluateEtsyLiveOwnerReview535({productId:id,listingId:receipt.listing_id,receipt,photos,tags});
   const details=[`Exact primary D1 receipt: ${verdict.identityReady?'verified #'+receipt.receipt_id:'not verified'}.`,
    `Real Etsy photos: ${verdict.remotePhotoCount===null?'not verified':verdict.remotePhotoCount} / ${verdict.expectedPhotoCount===null?'unknown':verdict.expectedPhotoCount} saved gallery originals; exact photo pairs: ${verdict.photosReady?'verified':'need review'}.`,
    `Actual native Etsy tags: ${verdict.tagsReady?'match saved Product tags':'not yet accepted'}.`,
    ...verdict.issues];
   if(photoResult.status==='rejected')details.push('Photo readback error: '+String(photoResult.reason?.message||'unavailable'));
   if(tagResult.status==='rejected')details.push('Tag readback error: '+String(tagResult.reason?.message||'unavailable'));
   liveEvidence.replaceChildren(...details.map(s=>{const li=document.createElement('li');li.textContent=s;return li;}));
   liveStatus.textContent=verdict.ready?`Verified live Etsy draft #${receipt.listing_id}: all saved photos and tags match. Owner visual acceptance is still a separate choice.`:
    `Live Etsy draft #${receipt.listing_id} still needs the specific photo/tag work shown below. No provider write occurred.`;
   liveStatus.dataset.tone=verdict.ready?'ok':'warn';
  }catch(error){liveStatus.textContent=`Live Etsy review could not finish: ${error.message}. The saved Product and actual Etsy draft were not changed.`;liveStatus.dataset.tone='error';}
  finally{state.liveBusy=false;render();}
 }
 function invalidate(){state.etsyReady=false;state.facebookReady=false;state.read=null;state.provider=null;state.lastVerifiedFingerprint='';ack.checked=false;
  say('Product or channel selection changed. Save the Product, then recheck every original photo before POST.');list(['Review the changed fields and original-image approvals.']);render();}
 async function check({preserveAck=false}={}){
  if(state.busy)return false;
  const wasAck=preserveAck&&ack.checked;
  state.busy=true;state.etsyReady=false;state.facebookReady=false;ack.checked=false;render();
  try{
   if(!saved())throw Error(id?'Product edits, saved channel preferences or the authoritative record have not finished saving.':'Save this Product first, then upload/approve its images.');
   const choice=selected();if(!choice.etsy&&!choice.facebook)throw Error('Select Etsy, Facebook Marketplace or both, then Save Product.');
   say('Checking saved Product details and original photos for the selected destinations (read only)…');
   // Facebook-only must never depend on Etsy's distribution record or OAuth.
   const [etsySource,facebookSource]=await Promise.all([
    choice.etsy?get(`/api/admin/product-distribution-406?product_id=${id}&channel=etsy`):Promise.resolve(null),
    choice.facebook?get(`/api/admin/product-distribution-406?product_id=${id}&channel=facebook`):Promise.resolve(null)]);
   const responses=[etsySource,facebookSource].filter(Boolean);
   if(responses.some(r=>Number(r.product_id)!==id))throw Error('Saved Product/photo identity did not match.');
   if(etsySource&&facebookSource){const ids=x=>(x.gallery||[]).map(im=>Number(im.product_image_id)).sort((a,b)=>a-b).join(',');
    if(ids(etsySource)!==ids(facebookSource))throw Error('Etsy and Marketplace returned different original Product galleries.');}
   const gallery=etsySource?.gallery||facebookSource?.gallery||[];
   const base={productId:id,product:product(),authorityReady:saved(),dirty:false,channelSelected:true};
   const common=choice.etsy?assessProductDraft523({...base,images:gallery,channel:'etsy'}):null;
   const blockers=[...(common?.issues||[])];
   const facebookReview=choice.facebook?selectedMarketplacePhotos532(facebookSource,id):null;
   const facebookSourceCheck=choice.facebook&&facebookReview?.ready?
    assessProductDraft523({...base,images:facebookReview.photos,channel:'facebook'}):null;
   state.facebookReady=Boolean(choice.facebook&&facebookReview?.ready&&facebookSourceCheck?.ready);
   const facebookIssues=[...(facebookReview?.issues||[]),...(facebookSourceCheck?.issues||[])];
   if(choice.etsy){
    const controller=window.DDEtsyDraftFlow523;
    if(!controller)blockers.push('The Etsy controls did not initialize. Open “Already have an Etsy draft?” to inspect the saved ID. If the controls remain unavailable, reload this page once; no Etsy request was sent.');
    else {
     state.provider=await controller.inspect();state.lastListingId=String(state.provider.linked_listing_id||'');
     blockers.push(...(state.provider.issues||[]));
     const actual=await readReceipt524({expectedListingId:state.lastListingId});
     if(!actual.verified&&!actual.unlinked)blockers.push(...actual.issues);
     if(state.provider.linked_listing_id&&!actual.verified)blockers.push('Existing Etsy listing ID is missing its unique primary saved claim.');
     if(state.provider.ready!==true&&!(state.provider.issues||[]).length)
      blockers.push('The actual Etsy shop and package readback are not ready for a draft POST.');
     if(Number(state.provider.images)!==common.gallery.count)
      blockers.push('Etsy package image count does not match every saved original photo. Resolve the source/gallery mismatch before POST.');
     const prior=ownerDraftDecision534(id,confirmedListing());
     if(prior.requiresExistingDraftCheck)blockers.unshift(`An earlier owner trial reported Etsy draft #${prior.report.listingId} for this Product. Verify and link the existing draft first; a second draft must not be created.`);
     state.etsyReady=common.ready&&state.provider.ready===true&&!state.unsafe;
    }
   }
   state.read={gallery:common?.gallery,originals:gallery,facebookOriginals:facebookReview?.photos||[],issues:blockers};
   state.lastVerifiedFingerprint=fingerprint();
   const messages=[...new Set([...blockers,...facebookIssues.map(s=>'Marketplace: '+s)])];
   if(messages.length){list(messages);say(`Please review ${messages.length} item${messages.length===1?'':'s'} shown below. No Etsy or Facebook write was made.`,'warn');}
   else {list([`${gallery.length} saved original Product photo(s) checked.`,
      choice.etsy?'Etsy draft setup and current Product identity are ready for your explicit confirmation.':'Marketplace photos are ready for a manual listing copy.']);
    say(`Ready for owner review. ${choice.etsy?(state.lastListingId?'Update Etsy #'+state.lastListingId:'Create one unpublished Etsy draft'):'No Etsy POST selected'}. ${choice.facebook?'Marketplace remains manual.':''}`,'ok');}
   if(blockers.length)state.etsyReady=false;
   ack.checked=wasAck&&state.etsyReady;
   return choice.etsy?state.etsyReady:state.facebookReady;
  }catch(error){list([error.message]);say('Could not complete the review: '+error.message+' No marketplace request was sent.','error');return false;}
  finally{state.busy=false;render();}
 }
 async function postEtsy(){
  if(!etsy.checked||state.unsafe||LEGACY_OWNER_TRIAL_IDS_523.includes(id)||state.busy)return;
  if(ownerDraftDecision534(id,confirmedListing()).requiresExistingDraftCheck){
   postStatus('This Product already has an owner-reported Etsy draft. Use “Inspect earlier Etsy draft” and verify its ID before an update. No Etsy write was made.','warn');return;}
  const confirmed=await check();
  if(!confirmed||!state.etsyReady||state.lastVerifiedFingerprint!==fingerprint()||!confirmedListing()&&Boolean(state.lastListingId))return;
  if(ownerDraftDecision534(id,confirmedListing()).requiresExistingDraftCheck)return;
  const target=state.lastListingId?`update unpublished Etsy draft #${state.lastListingId}`:'create one NEW unpublished Etsy draft';
  if(!state.lastListingId&&!window.confirm(`Before creating a new Etsy listing, did we check Etsy Shop Manager → Listings → Drafts for this SAME product and confirm an older draft does NOT already exist? Choose Cancel to verify and link the existing Etsy ID.`))return;
  if(!window.confirm(`POST now to ${target} for Product #${id}, using every approved original photo? Nothing will be published. Cancel to review.`))return;
  state.busy=true;state.etsyReady=false;state.unsafe=true;state.unsafeReason='provider-attempt';render();
  postStatus(`Submitting one owner-approved Etsy ${state.lastListingId?'update':'draft creation'} attempt. Do not refresh or retry until its real result is confirmed.`,'warn');
  try{
   const response=await window.DDEtsyDraftFlow523.post();
   if(response.posted&&/^[1-9]\d{0,14}$/.test(String(response.linked_listing_id||''))){
    const proof=await readReceipt524({expectedListingId:String(response.linked_listing_id)});
    if(!proof.verified){postStatus(`HOLD — Etsy returned #${response.linked_listing_id}, but the exact primary Product receipt was not verified. Inspect Etsy and saved Product before any retry.`,'error');return;}
    state.lastListingId=proof.listing_id;state.unsafe=false;state.unsafeReason='';
    postStatus(`Verified: Etsy unpublished draft #${state.lastListingId} is linked to Product #${id} by primary receipt #${proof.receipt_id}. Nothing published.`,'ok');
    $('dd498IdentityRefresh')?.click();
    document.dispatchEvent(new CustomEvent('dd:etsy-draft-flow-523-complete',{
     detail:{product_id:id,listing_id:state.lastListingId,unpublished:true}}));
   }else {
    // Etsy may have created the draft successfully before an image/tag step
    // failed. Show its genuine saved ID on the front tab even on partial HOLD.
    const partialId=String(response.linked_listing_id||'');
    let partialVerified=false;
    if(/^[1-9]\d{0,14}$/.test(partialId)){
      const receipt=await readReceipt524({expectedListingId:partialId});
      partialVerified=receipt.verified===true;
      if(partialVerified){state.lastListingId=receipt.listing_id;$('dd498IdentityRefresh')?.click();}
    }
    // A purely local/live-read preflight failure is fixable on this page.
    // Keep the hard lock only when the package reports an attempted write.
    if(response.hold_after_write===false){state.unsafe=false;state.unsafeReason='';}
    postStatus(`HOLD — ${partialVerified?'Etsy draft #'+state.lastListingId+' is saved and linked; remaining image/tag work is unconfirmed. ':' '}${response.status||response.issues?.[0]||'Etsy write result unconfirmed.'} ${response.hold_after_write===false?'No provider write began; correct the indicated photo or setup issue and check again.':'A provider action may have occurred. Inspect the original Etsy draft and saved ID before retrying.'}`,'error');
   }
  }catch(error){postStatus(`HOLD — ${error.message}. An Etsy attempt may have occurred. Verify the real remote draft and saved ID before retrying.`,'error');}
  finally{state.busy=false;ack.checked=false;render();}
 }
 function prepareMarketplace(){
  if(!state.facebookReady||state.busy||!facebook.checked||state.lastVerifiedFingerprint!==fingerprint())return;
  const handoff=prepareMarketplaceHandoff524({productId:id,product:product(),images:state.read?.facebookOriginals||[],
   authorityReady:saved(),dirty:false,channelSelected:true});
  if(!handoff.ready){postStatus(`HOLD — ${handoff.issues.join(' ')} No Marketplace handoff prepared.`,'error');return;}
  $('dd523MarketplaceTitle').value=handoff.title;$('dd523MarketplacePrice').value=handoff.price_cad;
  $('dd523MarketplaceDescription').value=handoff.description;
  $('dd524MarketplacePhotos').replaceChildren(...handoff.photos.map(photo=>{const item=document.createElement('li');
   const link=document.createElement('a');link.href=photo.url;link.rel='noopener noreferrer';link.target='_blank';
   link.textContent=`Open approved original photo #${photo.id} (${photo.width} × ${photo.height})`;item.append(link);
   const note=document.createElement('span');note.textContent=` — ${photo.alt}. Save this original image to the computer before uploading it manually in Facebook.`;
   item.append(note);return item;}));
  $('dd523MarketplaceCopy').hidden=false;
  postStatus(`Prepared MANUAL Marketplace handoff: ${handoff.photos.length} specifically selected and approved original photo(s) for Product #${id}. No Facebook authorization or API posting was used.`,'ok');
 }
 // Build 527: after one verified local Save, a checked destination initiates
 // its review in the same screen. Every Etsy write still requires the owner's
 // *new* confirm dialog and exact saved listing-ID/remote state checks. There
 // are no unattended POSTs, browser retries or third-party Facebook writes.
 async function reviewAfterVerifiedSave527(){
  if(state.busy||!saved())return;
  if(etsy.checked){postStatus('Saved Product verified. Checking the linked Etsy draft and originals before asking permission…');
   await postEtsy();
   if(facebook.checked&&state.facebookReady)prepareMarketplace();
  }else if(facebook.checked){await check();if(state.facebookReady)prepareMarketplace();}
 }
 let consumedRedirectPrompt527=false;
 function resumeNewProductReview527(){
  if(consumedRedirectPrompt527||id<1||!saved())return;
  const key=`dnd:etsy:after-save-527:${id}`;let receipt=null;
  try{receipt=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
  if(!receipt)return;
  consumedRedirectPrompt527=true;
  try{sessionStorage.removeItem(key);}catch{}
  if(Number(receipt.product_id)!==id||receipt.review_only!==true||Date.now()-Number(receipt.at||0)>10*60*1000||!etsy.checked)return;
  void reviewAfterVerifiedSave527();
 }
 $('dd523OpenMedia')?.addEventListener('click',()=>{document.querySelector('[data-editor-tab="media"]')?.click();
  $('productDistribution406')?.scrollIntoView({block:'start',behavior:'smooth'});});
 $('dd533ExistingDraft')?.addEventListener('click',()=>{
  const advanced=$('dd500Package')?.closest('details');if(advanced)advanced.open=true;
  const field=$('dd500ListingId');if(!field)return;
  field.scrollIntoView({block:'center',behavior:'smooth'});field.focus({preventScroll:true});
  postStatus('If Etsy already has this product as an unpublished draft, enter its exact Etsy listing ID here. Inspect and link the SAME draft after Etsy confirms it. Do not create a second draft.','warn');
 });
 $('dd534InspectHistorical')?.addEventListener('click',()=>{
  const prior=ownerDraftDecision534(id,confirmedListing());
  if(!prior.requiresExistingDraftCheck)return;
  const field=$('dd500ListingId');if(field){field.value=prior.report.listingId;field.dispatchEvent(new Event('input',{bubbles:true}));}
  $('dd533ExistingDraft')?.click();
  postStatus(`Entered previously reported draft #${prior.report.listingId} for inspection only. Open that exact Etsy draft, confirm it is ours and unpublished, tick the link consent, then choose Verify and save Etsy listing ID. Nothing was uploaded.`,'warn');
 });
 $('dd534GoTags')?.addEventListener('click',()=>{
  document.querySelector('[data-dd532-jump="seo"]')?.click();
  form.elements.namedItem('keywords')?.focus({preventScroll:true});
 });
 $('dd534GoProcessing')?.addEventListener('click',()=>{
  document.querySelector('[data-editor-tab="etsy"]')?.click();
  const technical=$('dd500Package')?.closest('details');if(technical)technical.open=true;
  const fields=$('dd500NewSettings');if(fields)fields.open=true;
  $('dd500Processing')?.scrollIntoView({block:'center',behavior:'smooth'});
  $('dd500Processing')?.focus({preventScroll:true});
 });
 liveRead?.addEventListener('click',()=>void reviewLive535());
 $('dd535GoPhotoSync')?.addEventListener('click',()=>{
  const technical=$('dd500Package')?.closest('details');if(technical)technical.open=true;
  $('dd500Refresh')?.click();
  $('dd516PhotoAction')?.scrollIntoView({block:'center',behavior:'smooth'});
  liveStatus.textContent='Photo transfer uses the existing “Sync missing original photos to Etsy” control, only for this linked unpublished draft, with fresh image checks and explicit consent. Do not upload twice.';
 });
 $('dd535GoTagSync')?.addEventListener('click',()=>{
  const target=$('dd497NativeTags');
  for(let parent=target?.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
  target?.scrollIntoView({block:'center',behavior:'smooth'});
  $('dd497TagsLoad')?.click();
  liveStatus.textContent='Review saved tags and compare actual Etsy tags. The native-tag update is a separate, explicitly approved action on the same draft.';
 });
 $('dd535GoOwnerPhotos')?.addEventListener('click',()=>{
  const details=$('dd525OwnerTrial')?.closest('details');if(details)details.open=true;
  $('dd525OwnerTrial')?.scrollIntoView({block:'center',behavior:'smooth'});
  liveStatus.textContent='First read actual original/Etsy photo pairs. Owner acceptance stays disabled until EVERY real matching photo has been inspected.';
 });
 for(const name of ['Category','Shipping','Processing','Weight','WeightUnit','Length','Width','Height','DimensionUnit'])
  $('dd500'+name)?.addEventListener('change',render);
 reviewButton.addEventListener('click',()=>void check());
 ack.addEventListener('change',render);post.addEventListener('click',()=>void postEtsy());
 manual.addEventListener('click',async()=>{await check();if(state.facebookReady)prepareMarketplace();});
 receiptButton.addEventListener('click',()=>void readReceipt524());
 for(const checkbox of [etsy,facebook])checkbox.addEventListener('change',invalidate);
 form.addEventListener('input',event=>{if(event.target.closest('#dd523Flow')||event.target.closest('#dd500NewSettings')){if(event.target.closest('#dd500NewSettings'))invalidate();return;}
  if(event.target.matches('input,textarea,select'))invalidate();});
 form.addEventListener('change',event=>{if(event.target.closest('#dd500NewSettings'))invalidate();});
 document.addEventListener('dd:product-loaded',()=>{invalidate();queueMicrotask(resumeNewProductReview527);});
 document.addEventListener('dd:product-channel-loaded',event=>{if(Number(event.detail?.product_id)===id)queueMicrotask(resumeNewProductReview527);});
 document.addEventListener('dd:save-succeeded',event=>{
  invalidate();
  if(Number(event.detail?.product_id)===id&&event.detail?.destinations_confirmed===true&&event.detail?.newer_edits!==true&&
    (event.detail?.etsy_preference_saved===true||facebook.checked))void reviewAfterVerifiedSave527();
 });
 document.addEventListener('dd:media-inline-updated',()=>invalidate());
 document.addEventListener('dd:product-channel-tags-changed',()=>invalidate());
 document.addEventListener('dd:etsy-draft-created',event=>{if(Number(event.detail?.product_id)===id){state.lastListingId=String(event.detail.listing_id||'');render();}});
 document.addEventListener('dd:etsy-existing-draft-linked',event=>{
  if(Number(event.detail?.product_id)===id)void readReceipt524({expectedListingId:String(event.detail?.listing_id||'')});
 });
 if(!id)reviewButton.disabled=true;
 render();if(id>0&&!LEGACY_OWNER_TRIAL_IDS_523.includes(id))void readReceipt524();
}
