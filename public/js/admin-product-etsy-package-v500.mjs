/* Builds 500–501: one owner-approved Etsy package action, using existing server-side
 * at-most-once claims and provider readback. The browser never chooses a subset
 * of photos or silently creates a second listing for an existing Product. */
import {assessEtsyPackage500,verifiedEtsyPackage500} from './etsy-package-500.mjs';
import {etsyFailure503,etsyFixLocation503} from './etsy-owner-diagnostics-503.mjs';

const $=id=>document.getElementById(id);
const form=$('productEditorForm'),id=Number(new URLSearchParams(location.search).get('product_id')||0);
// Build 511: "linked:true" is an acknowledgement, never a listing ID.
export const numericEtsyListing511=value=>{
  if(typeof value!=='string'&&typeof value!=='number')return '';
  const text=String(value).trim();
  return /^[1-9]\d{0,14}$/.test(text)&&Number.isSafeInteger(Number(text))?text:'';
};
if(form&&$('dd500Package')&&window.DDAuth?.apiFetch){
  // Reuse the proven Build 505 image-matching controls, but disclose them only
  // when an existing draft already contains photos. The normal tab stays small.
  $('dd515PhotoRepairMount')?.append($('dd505PhotoReview'));
  const state={busy:false,linked:'',loaded:false,assessment:null,readIssues:[],settings:null,attempted:false,claim:null,claimReview:null,photoReview:null,ownerReadbackReady:false,
    previewId:'',previewTitleMatches:false,images:null,lastRemoteId:'',holdAfterWrite:false,
    refreshPromise:null,syncing:false,linkReadbackHold:false,closeout508:null,independent509:null,gateway509:null,
    witness510:null,separation510:null,evidence511:null,gateway511:null,evidence512:null,gateway512:null,evidence513:null,owner514:null,reassessment515:null,prerequisites515:null};
  if(id===53){$('dd500ListingId').value='4603838854';$('dd500CandidateNote').hidden=false;
    if($('dd503OwnerNote'))$('dd503OwnerNote').hidden=false;}
  if(id!==53)$('dd508CloseoutPanel').hidden=true;
  if(id!==53)$('dd509IndependentPanel').hidden=true;
  if(id!==53){$('dd510WitnessPanel').hidden=true;$('dd510GatewayPanel').hidden=true;
    $('dd511EvidencePanel').hidden=true;$('dd511GatewayPanel').hidden=true;
    $('dd512EtsyPanel').hidden=true;$('dd512GatewayPanel').hidden=true;
    $('dd513EtsyPanel').hidden=true;$('dd513GatewayPanel').hidden=true;
    $('dd514OwnerPanel').hidden=true;$('dd514GatewayPanel').hidden=true;
    $('dd515OwnerPanel').hidden=true;$('dd515GatewayPanel').hidden=true;}
  const ready=()=>id>0&&form.dataset.productAuthority==='ready'&&form.dataset.productDirty!=='1';
  const key=()=>crypto.randomUUID();
  const status=(message,hold=false)=>{const el=$('dd500Status');el.textContent=message;el.dataset.tone=hold?'hold':'ok';};
  const optionStatus=(message,hold=false)=>{const el=$('dd500OptionsStatus');el.textContent=message;el.dataset.tone=hold?'hold':'ok';};
  const saveState=(message,tone='')=>{
    const el=$('dd501SaveState');if(el){el.textContent=message;el.dataset.tone=tone;}
    const resume=$('dd501Resume');if(resume)resume.textContent=message;
  };
  function resetOwnerApproval(){state.ownerReadbackReady=false;
    state.closeout508=null;
    state.independent509=null;
    state.witness510=null;
    state.evidence511=null;
    state.evidence512=null;
    state.evidence513=null;
    state.owner514=null;
    state.reassessment515=null;state.prerequisites515=null;
    for(const field of ['dd515Exact','dd515Separate','dd515Hold','dd515NoWrite',
      'dd515NotAuthorized','dd515NoSecrets','dd515TwoSha','dd515NoGateway'])$(field).checked=false;
    $('dd515RecordOwner').disabled=true;$('dd515RecordGateway').disabled=true;
    $('dd515OwnerStatus').textContent='HOLD — Saved Product changed. Refresh the exact owner witness and source receipts.';
    $('dd515GatewayStatus').textContent='PENDING — Confirm current nonproduction test prerequisites and QL-248 consumer agreement independently.';
    for(const field of ['dd514Inspected','dd514Unresolved','dd514NoChanges','dd514Description','dd514Category','dd514Photos','dd514Reviewer'])$(field).checked=false;
    $('dd514RecordOwner').disabled=true;$('dd514RecordRecheck').disabled=true;
    $('dd514Status').textContent='HOLD — Product data changed. Refresh the exact listing, source photos and owner observation.';
    for(const field of ['dd513Unresolved','dd513NoEtsyWrite','dd513Description','dd513Tags','dd513Category','dd513Details','dd513Photo344','dd513Photo345','dd513Photo346','dd513Independent'])$(field).checked=false;
    $('dd513RecordFollowup').disabled=true;$('dd513RecordContent').disabled=true;
    $('dd513ContentStatus').textContent='HOLD — Product data changed. Recheck current Etsy content and original-photo evidence.';
    for(const field of ['dd512Witness','dd512NoChanges','dd512Photo344','dd512Photo345','dd512Photo346','dd512Visual','dd512Separate'])$(field).checked=false;
    $('dd512RecordWitness').disabled=true;$('dd512RecordPhotoRecheck').disabled=true;
    $('dd512Pairs').replaceChildren();
    $('dd512EtsyStatus').textContent='HOLD — Product data changed. Recheck the primary claim and three originals.';
    for(const field of ['dd511ManualClaim','dd511NoProvider','dd511Photo344','dd511Photo345','dd511Photo346','dd511Visual','dd511Independent'])$(field).checked=false;
    $('dd511RecordWitnessFollowup').disabled=true;$('dd511RecordPhotoRenewal').disabled=true;
    $('dd511PhotoPairs').replaceChildren();
    $('dd511EvidenceStatus').textContent='HOLD — Saved Product changed. Recheck its primary Etsy listing claim and photo evidence.';
    for(const field of ['dd510ConfirmWitness','dd510ConfirmNoChanges','dd510Original344','dd510Original345','dd510Original346','dd510VisualEquality'])$(field).checked=false;
    $('dd510RecordWitness').disabled=true;$('dd510RecordRetest').disabled=true;
    $('dd510PhotoPairs').replaceChildren();
    $('dd510ClaimStatus').textContent='HOLD — Saved Product changed. Refresh the primary listing claim and source/Etsy photo pairing before recording any observation.';
    for(const field of ['dd509NoEtsyChange','dd509ConfirmPhotos','dd509ConfirmMetadata','dd509ConfirmDelivery','dd509ConfirmSeparate'])$(field).checked=false;
    $('dd509RecordException').disabled=true;$('dd509IndependentAccept').disabled=true;
    $('dd509Status').textContent='HOLD — Saved Product details changed; refresh the actual original/Etsy photo pairs and owner approval evidence.';
    $('dd509Photos').replaceChildren();
    for(const field of ['dd508SameDraft','dd508EachPhoto','dd508Metadata','dd508Unpublished'])$(field).checked=false;
    $('dd508Record').disabled=true;
    $('dd508ReviewStatus').textContent='HOLD — Saved Product details changed. Review the actual Etsy draft and all three original photo receipts again.';
    $('dd504ApproveContent').checked=false;$('dd504Signoff').disabled=true;
    $('dd504Readback').textContent='Not yet verified after these changes. Check Etsy readback once the same draft is linked and updated.';
    $('dd504SignoffStatus').textContent='No new owner approval recorded. Etsy remains unpublished.';
  }
  function openEtsyReview(){
    const tab=document.querySelector('[data-editor-tab="etsy"]');
    if(tab?.getAttribute('aria-selected')!=='true')tab?.click();
  }
  function consumeCreateRequest(){
    if(!id)return false;
    const marker=`dnd:etsy:sync-after-create:501:${id}`;
    try{
      const value=JSON.parse(sessionStorage.getItem(marker)||'null');
      sessionStorage.removeItem(marker); // One Save authorizes at most one dispatch.
      return value?.authorized===true&&Number(value.product_id)===id&&
        Number.isFinite(value.at)&&Date.now()-value.at>=0&&Date.now()-value.at<300000;
    }catch{return false;}
  }
  async function api(path,body){
    const response=await window.DDAuth.apiFetch(path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'}:{method:'GET',cache:'no-store'});
    try{
      if(window.DDAuth.readApiJson)return await window.DDAuth.readApiJson(response,{fallbackMessage:'Etsy Product step could not finish.'});
      const value=await response.json().catch(()=>null);
      if(!response.ok||!value?.ok){const failure=Error(value?.error||`HTTP ${response.status} without a valid result.`);
        failure.httpStatus=response.status;failure.listing_id=value?.listing_id;throw failure;}
      return value;
    }catch(error){
      const failure=Error(etsyFailure503(path,body,error));
      failure.step=path;failure.httpStatus=error?.httpStatus||response.status;
      failure.listing_id=error?.payload?.listing_id||error?.listing_id;
      failure.code=error?.payload?.code||error?.code;
      failure.conflicting_product=error?.payload?.conflicting_product||null;
      throw failure;
    }
  }
  function check(message){const li=document.createElement('li');li.textContent=message;$('dd500Checklist').append(li);}
  function show(){
    const linked=Boolean(state.linked);
    const candidate=String($('dd500ListingId').value||'').trim();
    const hasCandidate=!linked&&/^[1-9]\d{0,14}$/.test(candidate);
    const conflict=hasCandidate&&state.claim?.state==='another_product';
    const claimMessage=$('dd504ClaimMessage'),claimBox=$('dd504Claim'),claimProduct=$('dd504ClaimProduct');
    if(claimBox){claimBox.hidden=!conflict;
      if(conflict){const other=state.claim.product||{};
        claimMessage.textContent=`STOP — Etsy draft #${candidate} is already assigned locally to Product #${other.product_id}${other.name?' (“'+other.name+'”)':''}${other.sku?' · SKU '+other.sku:''}. Compare both Products before deciding which is correct. We will not take this listing away or create another.`;
        claimProduct.hidden=!Number.isSafeInteger(Number(other.product_id))||Number(other.product_id)<1;
        if(!claimProduct.hidden)claimProduct.href=`/admin/product-editor/?product_id=${encodeURIComponent(String(other.product_id))}`;
      }
    }
    $('dd505OwnerResolution').hidden=!conflict;
    $('dd505PhotoReview').hidden=!linked;
    $('dd515PhotoRepair').hidden=!linked;
    $('dd505ResolveClaim').disabled=state.busy||!ready()||!state.claimReview?.safe_to_offer||
      !$('dd505ReviewedOther').checked||!$('dd505CorrectTarget').checked;
    $('dd500Identity').textContent=linked?`Product #${id} is linked to Etsy draft #${state.linked}. Changes use this same listing ID.`:
      state.lastRemoteId?`HOLD: Etsy returned listing #${state.lastRemoteId}, but Product #${id}'s saved link is unconfirmed. Inspect Etsy before any new attempt.`:
      hasCandidate?`Step 1 — Link existing Etsy draft #${candidate} to Product #${id}. Do not delete it or create a second draft.`:
      `Product #${id}: no Etsy listing ID is linked yet. Check Etsy Drafts before making a new one.`;
    $('dd500Open').href=linked||hasCandidate?`https://www.etsy.com/your/shops/me/listing-editor/edit/${encodeURIComponent(linked?state.linked:candidate)}`:
      'https://www.etsy.com/your/shops/me';
    $('dd500Open').textContent=linked||hasCandidate?`Open Etsy draft #${linked||candidate}`:'Open Etsy Shop Manager';
    $('dd500Link').hidden=linked;
    $('dd500NewSettings').hidden=linked;
    const send=$('dd500Send');send.textContent=hasCandidate?`Step 1: Verify and link existing Etsy draft #${candidate}`:
      linked?`Step 2: Update Etsy draft #${state.linked} + all approved photos`:'Create ONE new unpublished Etsy draft + all approved photos';
    send.disabled=state.busy||state.attempted||state.holdAfterWrite||state.linkReadbackHold||!ready()||conflict||
      (hasCandidate?!$('dd500LinkConsent').checked:
        !state.loaded||!state.assessment?.ready||!$('dd500Consent').checked||
        (!linked&&(!state.settings||!newSettingsReady()||Boolean(candidate))));
    $('dd500Refresh').disabled=state.busy;
    $('dd500OptionsLoad').disabled=state.busy;
    $('dd500LinkButton').hidden=hasCandidate;
    $('dd500LinkButton').disabled=state.busy||conflict||state.linkReadbackHold||!ready()||!/^[1-9]\d{0,14}$/.test(candidate)||!$('dd500LinkConsent').checked;
    $('dd500Checklist').replaceChildren();
    if(!ready())check('Save the Product and wait for its saved fields to load.');
    if(hasCandidate)check(`NEXT: Verify/link existing Etsy draft #${candidate} using the main button above. This is a read-only Etsy check and local ID link, not a new listing.`);
    if(conflict)check(`LOCAL LINK CONFLICT — This draft belongs to Product #${state.claim.product?.product_id}. Review that record using the button above; do not retry, delete or create another.`);
    for(const issue of state.readIssues)check('COULD NOT CHECK — '+issue);
    if(state.assessment){
      check(`${state.assessment.count} gallery photo(s): ${state.assessment.transferred} confirmed on Etsy; ${state.assessment.pending.length} to transfer.`);
      check('Etsy will receive all eligible Product originals, not an image selection made here.');
      for(const issue of state.assessment.issues)check('HOLD — '+issue);
    }else if(!state.readIssues.length)check('Checking the Product gallery, tag source and photo receipts…');
    if(id===53&&state.assessment&&![344,345,346].every(photo=>state.assessment.image_ids.includes(photo)))
      check('Product #53 must retain its three original photo IDs #344–346. New approved gallery photos may be added as normal.');
    check(linked?`Future updates target only Etsy listing #${state.linked}; no duplicate listing will be created.`:
      'For a new listing, complete the one-time category, Canadian shipping and parcel details, then use one Create button.');
    check('Store: same saved Product • Etsy: verified draft transfer • Facebook Marketplace: manual preparation only.');
    const fix=etsyFixLocation503(state.assessment?.issues||[]),fixButton=$('dd503Fix');
    if(fixButton){fixButton.hidden=!fix;fixButton.textContent=fix?.label||'Fix missing item';}
  }
  const packageKey=`dnd:etsy:package500:${id}`;
  function saveSettings(){if(!id)return;const fields=['Category','Shipping','Processing','Who','When','Weight','WeightUnit','Length','Width','Height','DimensionUnit'];
    const settings=Object.fromEntries(fields.map(name=>[name,$('dd500'+name).value]));settings.Supply=$('dd500Supply').checked;
    savedSetup=settings;try{sessionStorage.setItem(packageKey,JSON.stringify(settings));}catch{}
  }
  function restoreSettings(){let saved={};try{saved=JSON.parse(sessionStorage.getItem(packageKey)||'{}');}catch{}
    for(const name of ['Who','When','Weight','WeightUnit','Length','Width','Height','DimensionUnit'])if(saved[name])$('dd500'+name).value=saved[name];
    $('dd500Supply').checked=saved.Supply===true;return saved;
  }
  let savedSetup=restoreSettings(),taxonomy=[];
  function putOptions(name,items,previous){const select=$('dd500'+name);select.replaceChildren(new Option(`Select verified ${name.toLowerCase()}…`,''));
    for(const row of items)select.add(new Option(row.name,String(row.id)));
    if(items.some(row=>String(row.id)===String(previous)))select.value=String(previous);
  }
  function categoryFilter(){const term=$('dd500CategorySearch').value.toLowerCase().trim(),value=$('dd500Category').value||savedSetup.Category;
    putOptions('Category',taxonomy.filter(row=>!term||row.name.toLowerCase().includes(term)).slice(0,150),value);
  }
  async function loadOptions(){if(!ready()||state.busy||state.linked)return;
    state.busy=true;show();optionStatus('Verifying the connected Etsy shop, seller categories, shipping and processing profiles (read only)…');
    try{const data=await api('/api/admin/product-etsy-draft',{action:'test_connection',product_id:id});
      if(!data.live_connection_verified||!data.fingerprint)throw Error('Live Etsy connection was not verified.');
      state.settings=data;taxonomy=data.options?.taxonomy||[];
      putOptions('Shipping',data.options?.shipping||[],savedSetup.Shipping);
      putOptions('Processing',data.options?.readiness||[],savedSetup.Processing);
      categoryFilter();
      optionStatus(`Etsy shop ${data.shop?.shop_name||data.shop?.name||data.shop?.shop_id} verified. Choose a category and your existing Canada-only shipping/processing profiles. ${data.blockers?.length?'HOLD: '+data.blockers.join(', '):'Saved Product fields passed preflight.'}`,!!data.blockers?.length);
    }catch(error){state.settings=null;optionStatus('HOLD — '+error.message,true);}
    finally{state.busy=false;show();}
  }
  function parcel(){return {item_weight:$('dd500Weight').value,item_weight_unit:$('dd500WeightUnit').value,
    item_length:$('dd500Length').value,item_width:$('dd500Width').value,item_height:$('dd500Height').value,
    item_dimensions_unit:$('dd500DimensionUnit').value};}
  function newSettingsReady(){const data=parcel();return ['Category','Shipping','Processing'].every(name=>Number($('dd500'+name).value)>0)&&
    ['item_weight','item_length','item_width','item_height'].every(name=>/^\d{1,5}(?:\.\d{1,3})?$/.test(data[name])&&Number(data[name])>0)&&
    ['g','kg','oz','lb'].includes(data.item_weight_unit)&&['cm','mm','in'].includes(data.item_dimensions_unit)&&
    !state.settings?.blockers?.length;}
  async function packageSnapshot(){
    const results=await Promise.allSettled([
      api(`/api/admin/product-etsy-existing-draft?product_id=${id}${/^[1-9]\d{0,14}$/.test(String($('dd500ListingId').value||'').trim())?`&candidate_listing_id=${encodeURIComponent($('dd500ListingId').value.trim())}`:''}`),
      api(`/api/admin/product-distribution-406?product_id=${id}&channel=etsy`),
      api(`/api/admin/product-etsy-images?product_id=${id}`),
      api(`/api/admin/product-etsy-tags?product_id=${id}`)]);
    const failures=results.filter(result=>result.status==='rejected').map(result=>result.reason?.message||'An unknown read failed.');
    if(failures.length){const failure=Error('Not all saved Etsy Product checks could load.');
      failure.issues=failures;
      const partial=results[0];failure.partialLink=partial.status==='fulfilled'?numericEtsyListing511(partial.value?.linked_listing_id):'';
      throw failure;}
    const [link,distribution,images,tags]=results.map(result=>result.value);
    if([link.product_id,distribution.product_id,images.product_id,tags.product_id].some(value=>Number(value)!==id))
      throw Error('Saved Product, images and tags do not agree on Product identity.');
    const savedId=numericEtsyListing511(link.linked_listing_id);
    if(link.linked_listing_id&&!savedId){const error=Error('The saved Etsy ID was returned as a nonnumeric value, not a verified listing number. Recheck this exact Product receipt; never use #true or create a duplicate.');
      error.linkReadbackHold=true;throw error;}
    if(savedId&&link.saved_link_readback_confirmed!==true){const error=Error('The saved Etsy listing ID lacks an independent D1 primary receipt. Recheck this Product before any Etsy update; never create a duplicate.');
      error.partialLink=savedId;error.linkReadbackHold=true;throw error;}
    const assessment=assessEtsyPackage500(distribution,images,tags);
    // The saved Etsy listing is a separate D1 identity from the photo receipts.
    // A missing/stale media receipt must HOLD uploads, but cannot erase the
    // uniquely confirmed Product → listing ID or suppress the Product identity.
    if(savedId&&numericEtsyListing511(images.listing_id)!==savedId){
      const another=numericEtsyListing511(images.listing_id);
      assessment.issues.push(another?
        `Photo records point to Etsy #${another}, but this Product is linked to #${savedId}. The images cannot be transferred until the incorrect receipt is independently reconciled.`:
        `Etsy draft #${savedId} is saved, but its photo-record verification is missing. Check this exact draft and reconcile its images before uploading any more.`);
      assessment.media_identity_hold=true;
    }
    if(id===53&&![344,345,346].every(photo=>assessment.image_ids.includes(photo)))
      assessment.issues.push('Product #53 is missing one of its three original photos #344–346; inspect before transfer.');
    if(id===53&&tags.tag_source==='etsy_override'&&(tags.local_tags||[]).some(tag=>/\bsoap\s*bars?\b/i.test(String(tag))))
      assessment.issues.push('Etsy search tags: the saved override is “Soap bars”. Review whether that accurately describes Product #53. If not, choose shared Product tags or correct the Etsy override under Storefront / SEO before sending.');
    if(id===53){
      const description=String(form.elements.namedItem('description')?.value||'').trim();
      const short=String(form.elements.namedItem('short_description')?.value||'').trim();
      const title=String(form.elements.namedItem('name')?.value||'').trim();
      if((!description||description.toLowerCase()===title.toLowerCase())&&(!short||short.toLowerCase()===title.toLowerCase()))
        assessment.issues.push('Product description: the saved text appears to contain only the Product name. Add the actual item materials, size and details under Description before updating Etsy.');
    }
    assessment.ready=assessment.issues.length===0;
    return {link,images,tags,assessment};
  }
  async function refresh(){
    if(state.refreshPromise)return state.refreshPromise;
    if(state.busy||!ready())return false;
    const work=(async()=>{
      state.busy=true;show();status('Reading the saved Product ↔ Etsy ID and every gallery image (no provider write)…');
      try{const snapshot=await packageSnapshot();state.linked=numericEtsyListing511(snapshot.link.linked_listing_id);
        state.claim=snapshot.link.candidate_claim||null;
        if(state.linked){state.lastRemoteId='';state.linkReadbackHold=false;}
        state.readIssues=[];state.assessment=snapshot.assessment;state.images=snapshot.images;state.loaded=true;
        status(snapshot.assessment.ready?`Ready to review: all ${snapshot.assessment.count} gallery photos are included. ${state.linked?'Update Etsy #'+state.linked:'No existing Etsy link detected.'}`:
          `HOLD — ${snapshot.assessment.issues[0]||'Saved Product needs a correction.'} See each exact missing item above.`,!snapshot.assessment.ready);
        if(!state.linked&&!state.settings&&!$('dd500ListingId').value.trim())$('dd500NewSettings').open=true;
        return true;
      }catch(error){state.loaded=false;state.assessment=null;state.claim=null;
        state.readIssues=Array.isArray(error.issues)?error.issues:[error.message];
        state.linked=numericEtsyListing511(error.partialLink);
        state.linkReadbackHold=error.linkReadbackHold===true;
        status(`HOLD — ${state.readIssues.length} specific CHECK${state.readIssues.length===1?'':'S'} could not finish. See “What will be sent” for the failed step and safe next action. No Etsy transfer was attempted.`,true);
        return false;}
      finally{state.busy=false;show();}
    })();
    state.refreshPromise=work;
    try{return await work;}finally{if(state.refreshPromise===work)state.refreshPromise=null;}
  }
  async function reviewTrial506(){
    const el=$('dd506TrialStatus');if(!ready()){
      el.textContent='HOLD — Save the Product and wait for the saved record to load before comparing its Etsy receipt.';return;}
    el.textContent='Comparing saved Product ID, SKU, slug, Etsy listing ID, three originals and metadata (no Etsy changes)…';
    try{
      const snapshot=await packageSnapshot(),readback=await api(`/api/admin/product-etsy-existing-draft?product_id=${id}`);
      const confirmed=String(readback.linked_listing_id||'')===String(id===53?'4603838854':snapshot.link.linked_listing_id||'')&&
        readback.saved_link_readback_confirmed===true;
      const problems=[...snapshot.assessment.issues];
      if(!confirmed)problems.unshift(`Saved Etsy listing ID is not yet independently confirmed for Product #${id}. Use Step 1 once, or recheck if a local write was already attempted. Never create another draft.`);
      el.textContent=`Product #${id} • SKU ${readback.product_sku||'not set'} • slug ${readback.product_slug||'not set'} • Etsy ${readback.linked_listing_id||'not linked'} • local receipt ${readback.receipt_id||'not confirmed'} • ${snapshot.assessment.transferred}/${snapshot.assessment.count} photos confirmed. `+
        (problems.length?'HOLD — '+problems.join(' | '):'Local Product and metadata ready for a separate Etsy owner verification. The actual Etsy content is not approved by this check.');
    }catch(error){el.textContent=`HOLD — ${error.message} No Etsy changes attempted.`;}
  }
  async function reviewTrial507(){
    const output=$('dd507TrialStatus');
    if(!ready()){
      output.textContent='HOLD — First save this Product, then run the read-only Etsy comparison.';return;
    }
    const listingId=String(state.linked||$('dd500ListingId').value||'').trim();
    if(!/^[1-9]\d{0,14}$/.test(listingId)){
      output.textContent='HOLD — Enter the exact existing Etsy draft number before comparison. Never create another draft.';return;
    }
    output.textContent='Reading the exact Etsy draft and the three original Product photo receipts. No Etsy changes…';
    try{
      const data=await api(`/api/admin/product-etsy-owner-trial-507?product_id=${id}&listing_id=${encodeURIComponent(listingId)}`);
      const issues=Array.isArray(data.issues)?data.issues:[];
      output.textContent=`Product #${id} • SKU ${data.product_sku||'not set'} • slug ${data.product_slug||'not set'} • Etsy #${listingId} `+
        `• local claim ${data.local_claim_state||'unverified'} • D1 receipt ${data.local_receipt_id||'not confirmed'} `+
        `• actual Etsy ${data.remote_readback_confirmed?'verified read-only':'NOT verified'} `+
        `• original photo receipts ${data.photo_receipts_confirmed||0}/${data.expected_originals?.length||data.approved_photo_count||0} `+
        `• tag source ${data.tag_source||'unconfirmed'}. `+
        (data.ready_for_owner_signoff?
          'All technical readbacks match. Inspect the actual Etsy draft and use the separate owner sign-off button; nothing has been published.':
          `HOLD — ${[...issues,...(data.remote_hold?[data.remote_hold]:[])].join(' | ')||'An independent owner check is still required.'}`);
      if(data.local_link_confirmed&&!state.linked){
        // Only refresh display from a separately verified, unique D1 claim.
        await refresh();
      }
    }catch(error){output.textContent=`HOLD — ${error.message}. No listing, Product or photograph was changed.`;}
  }
  const closeoutFields508=['dd508SameDraft','dd508EachPhoto','dd508Metadata','dd508Unpublished'];
  function updateCloseout508Button(){
    $('dd508Record').disabled=!(id===53&&ready()&&state.closeout508?.ready_for_owner_closeout===true&&
      String(state.closeout508.listing_id)==='4603838854'&&closeoutFields508.every(field=>$(field).checked));
  }
  async function reviewCloseout508(){
    state.closeout508=null;closeoutFields508.forEach(field=>$(field).checked=false);updateCloseout508Button();
    const output=$('dd508ReviewStatus');
    if(id!==53||!ready()){output.textContent='HOLD — Save Product #53 and wait for its saved record before owner closeout.';return;}
    output.textContent='Independently rechecking the actual unpublished Etsy draft, prior owner sign-off and original-photo receipts…';
    try{
      const receipt=await api(`/api/admin/product-etsy-owner-closeout-508?product_id=${id}`);
      const verified=Array.isArray(receipt.verified_media_pairs)?receipt.verified_media_pairs:[];
      const expected=[344,345,346];
      const matched=expected.every(photo=>verified.some(pair=>Number(pair.product_image_id)===photo&&
        String(pair.etsy_image_id||'').trim()!==''));
      state.closeout508=receipt.ready_for_owner_closeout&&receipt.prior_owner_signoff_confirmed&&matched&&
        String(receipt.listing_id)==='4603838854'?receipt:null;
      const count=expected.filter(photo=>verified.some(pair=>Number(pair.product_image_id)===photo&&String(pair.etsy_image_id||'').trim())).length;
      output.textContent=`Product #53 • existing Etsy draft #${receipt.listing_id||'NOT LINKED'} • prior witnessed sign-off ${receipt.prior_owner_signoff_confirmed?'confirmed':'missing'} `+
        `• original-photo remote receipts ${count}/3 • ${receipt.etsy_remote_photo_count??'?'} Etsy images • evidence digest ${String(receipt.evidence_fingerprint||'not yet available').slice(0,16)}. `+
        (state.closeout508?'READY FOR OWNER REVIEW — Inspect the real draft and confirm all four statements separately. No publication occurred.':
          `HOLD — ${[...(receipt.issues||[]),receipt.next_action||''].filter(Boolean).join(' | ')||'Verified owner and media receipts are still required.'}`);
    }catch(error){output.textContent=`HOLD — ${error.message} No owner approval or Etsy changes occurred.`;}
    updateCloseout508Button();
  }
  async function recordCloseout508(){
    updateCloseout508Button();if($('dd508Record').disabled||!state.closeout508)return;
    $('dd508Record').disabled=true;
    const receipt=state.closeout508;state.closeout508=null;
    $('dd508ReceiptStatus').textContent='Checking that the existing Etsy draft, prior sign-off, original photos and metadata have not changed…';
    try{
      const result=await api('/api/admin/product-etsy-owner-closeout-508',{
        action:'record_owner_closeout_508',product_id:53,listing_id:receipt.listing_id,
        evidence_fingerprint:receipt.evidence_fingerprint,request_key:key(),
        confirm_same_draft:true,confirm_each_original_photo:true,confirm_actual_metadata:true,
        confirm_unpublished_canada_only:true});
      if(!result.owner_closeout_recorded)throw Error('No independent closeout receipt was returned.');
      $('dd508ReceiptStatus').textContent=`LOCALLY RECORDED — receipt #${result.receipt_id||'recorded'} for existing Etsy draft #${result.listing_id}; three verified originals. Etsy is still unpublished. No provider write or duplicate draft.`;
      closeoutFields508.forEach(field=>$(field).checked=false);
    }catch(error){$('dd508ReceiptStatus').textContent=`HOLD — ${error.message} Refresh the actual Etsy evidence before another owner decision.`;}
    updateCloseout508Button();
  }
  async function reviewGateway508(){
    const output=$('dd508GatewayStatus');output.textContent='Checking server-side gateway credential presence and independently saved signed handshake receipts…';
    try{
      const r=await api('/api/admin/integration-gateway-readiness-508');
      output.textContent=`${r.state||'DISCONNECTED'} — key ID ${r.key_id_configured?'configured':'missing'}, server-only HMAC secret ${r.secret_configured?'configured':'missing'}, `+
        `signed health receipt ${r.accepted_health_receipt?'found':'missing'}, signed capabilities receipt ${r.accepted_capabilities_receipt?'found':'missing'}. `+
        `${(r.missing_or_next_steps||[]).join(' | ')||'Handshake is still in read-only TESTING; independent owner authorization required.'} `+
        'No secret disclosed; no data access, product transfers, events or commands enabled.';
    }catch(error){output.textContent=`DISCONNECTED — ${error.message}. No credential was exposed or provisioned.`;}
  }
  const independentFields509=['dd509ConfirmPhotos','dd509ConfirmMetadata','dd509ConfirmDelivery','dd509ConfirmSeparate'];
  const gatewayFields509=['dd509GatewayRotation','dd509GatewayTenant','dd509GatewaySecrets','dd509GatewayNoDispatch'];
  function update509Buttons(){
    const source=state.independent509;
    $('dd509RecordException').disabled=!(id===53&&ready()&&source?.exception_followup_allowed===true&&
      (String(source.listing_id)==='4603838854'||source.listing_id===null)&&$('dd509NoEtsyChange').checked&&
      $('dd509ExceptionCategory').value&&$('dd509NextAction').value.trim().length>=15);
    $('dd509IndependentAccept').disabled=!(id===53&&ready()&&source?.ready_for_independent_review===true&&
      $('dd509NoEtsyChange').checked&&independentFields509.every(field=>$(field).checked));
    $('dd509GatewayHandoff').disabled=!(state.gateway509?.ready_to_prepare_security_handoff===true&&
      gatewayFields509.every(field=>$(field).checked));
  }
  function photoURL509(value){try{const url=new URL(String(value||''),location.origin);
    return url.protocol==='https:'||url.origin===location.origin&&url.protocol==='http:'?url.href:null;
  }catch{return null;}}
  function renderPhotoPairs509(rows,hostId='dd509Photos'){
    const host=$(hostId);host.replaceChildren();
    for(const row of rows){
      const card=document.createElement('div');card.className='dd509-photo-card';
      const title=document.createElement('strong');title.textContent=`Original #${row.product_image_id} ↔ Etsy photo #${row.etsy_image_id||'not confirmed'}`;
      card.append(title);const pair=document.createElement('div');pair.className='dd509-pair';
      for(const [label,value] of [['Our source original',row.original_image_url],['Actual Etsy draft photo',row.etsy_image_url]]){
        const figure=document.createElement('figure'),src=photoURL509(value);
        if(src){const img=document.createElement('img');img.src=src;img.loading='lazy';img.alt=`${label} for Product #53 original #${row.product_image_id}`;figure.append(img);}
        else{const missing=document.createElement('p');missing.textContent='Image not available — HOLD';figure.append(missing);}
        const caption=document.createElement('figcaption');caption.textContent=label;figure.append(caption);pair.append(figure);
      }
      card.append(pair);const result=document.createElement('p');
      result.textContent=row.ready?'Current IDs and image URLs match a saved receipt; visually compare both photographs.':
        'HOLD — one or more current source/Etsy images or receipts are missing or conflicting.';
      card.append(result);host.append(card);
    }
  }
  async function independentReview509(){
    state.independent509=null;
    for(const field of ['dd509NoEtsyChange',...independentFields509])$(field).checked=false;
    update509Buttons();$('dd509Photos').replaceChildren();
    const output=$('dd509Status');if(id!==53||!ready()){
      output.textContent='HOLD — Save Product #53 and wait for the latest saved record before the independent review.';return;}
    output.textContent='Independently reading the exact same Etsy draft, three source photo URLs, remote images and the last owner closeout…';
    try{
      const r=await api(`/api/admin/product-etsy-independent-review-509?product_id=${id}`);
      state.independent509=(String(r.listing_id)==='4603838854'||r.listing_id===null)?r:null;
      renderPhotoPairs509(r.original_photo_receipts||[]);
      output.textContent=`Product #53 • Etsy #${r.listing_id||'not linked'} • photo freshness ${r.photo_freshness_ready?'verified IDs/URLs; visual review required':'HOLD'} `+
        `• owner closeout #${r.owner_closeout_receipt_id||'missing'} • separate reviewer ${r.separate_reviewer?'confirmed':'required'} `+
        `• current evidence ${String(r.evidence_fingerprint||'not available').slice(0,16)}. `+
        (r.ready_for_independent_review?'READY FOR A DIFFERENT VERIFIED ADMIN — inspect the actual photos and confirm each independent condition.':
          `HOLD — ${(r.issues||[]).join(' | ')||'Current owner/media evidence is not fully accepted.'}`);
    }catch(error){output.textContent=`HOLD — ${error.message}. No Etsy changes, sign-off or exception override occurred.`;}
    update509Buttons();
  }
  async function submitIndependent509(action){
    update509Buttons();if(!state.independent509)return;
    const followup=action==='record_exception_followup',button=$(followup?'dd509RecordException':'dd509IndependentAccept');
    if(button.disabled)return;button.disabled=true;
    const receipt=$('dd509Receipt');receipt.textContent='Rechecking the actual Etsy/photo fingerprint and saving one local reviewer decision…';
    try{
      const r=await api('/api/admin/product-etsy-independent-review-509',{
        action,product_id:53,listing_id:'4603838854',evidence_fingerprint:state.independent509.evidence_fingerprint||null,
        request_key:key(),confirm_no_etsy_changes:true,
        ...(followup?{category:$('dd509ExceptionCategory').value,next_action:$('dd509NextAction').value.trim()}:{
          confirm_all_originals:true,confirm_description_tags:true,confirm_canada_only_unpublished:true,confirm_independent_review:true})});
      receipt.textContent=followup?`EXCEPTION FOLLOW-UP #${r.receipt_id||'recorded'} saved locally. HOLD remains; nothing changed at Etsy.`:
        `INDEPENDENT RECEIPT #${r.receipt_id||'recorded'} recorded for current evidence. Etsy remains unpublished.`;
      state.independent509=null;
      for(const field of ['dd509NoEtsyChange',...independentFields509])$(field).checked=false;
    }catch(error){receipt.textContent=`HOLD — ${error.message}. Refresh the actual Etsy/photo evidence before another decision.`;
      state.independent509=null;}
    update509Buttons();
  }
  async function gatewayReview509(){
    state.gateway509=null;gatewayFields509.forEach(field=>$(field).checked=false);update509Buttons();
    const output=$('dd509GatewayStatus');output.textContent='Reading server-side credential readiness and signed source-side GET receipts…';
    try{const r=await api('/api/admin/integration-gateway-security-handoff-509');
      state.gateway509=r.ready_to_prepare_security_handoff?r:null;
      output.textContent=`${r.state||'DISCONNECTED'} • health GET ${r.accepted_health_receipt?'accepted':'missing'} • capabilities GET ${r.accepted_capabilities_receipt?'accepted':'missing'} `+
        `• environment ${r.environment||'not configured'}. `+
        (r.ready_to_prepare_security_handoff?'READY FOR OWNER SOURCE-SIDE SECURITY HANDOFF REVIEW ONLY. No business connection activated.':
          `HOLD — ${(r.missing_or_next_steps||[]).join(' | ')||'Signed gateway receipts and independently provisioned server-only credentials are required.'}`);
    }catch(error){output.textContent=`DISCONNECTED — ${error.message}. No credentials or business data were accessed.`;}
    update509Buttons();
  }
  async function gatewayHandoff509(){
    update509Buttons();if($('dd509GatewayHandoff').disabled||!state.gateway509)return;
    const stateBefore=state.gateway509;state.gateway509=null;update509Buttons();
    const output=$('dd509GatewayReceipt');output.textContent='Rechecking signed health/capabilities proof and recording a read-only owner security handoff…';
    try{const r=await api('/api/admin/integration-gateway-security-handoff-509',{
      action:'record_read_only_security_handoff',request_key:key(),environment:stateBefore.environment,
      confirm_rotation_plan:true,confirm_tenant_isolation:true,confirm_secrets_server_only:true,
      confirm_no_dispatch_or_data_access:true});
      output.textContent=`SECURITY HANDOFF #${r.receipt_id||'recorded'} saved for independent review. Still TESTING; no credentials provisioned or live connection approved.`;
    }catch(error){output.textContent=`HOLD — ${error.message}. Gateway permissions remain disabled.`;}
    gatewayFields509.forEach(field=>$(field).checked=false);update509Buttons();
  }
  const photoChecks510=['dd510Original344','dd510Original345','dd510Original346','dd510VisualEquality'];
  const separationChecks510=['dd510GatewayDifferent','dd510GatewayNonprod','dd510GatewayExternal','dd510GatewayNoPilot'];
  function update510Buttons(){
    const witness=state.witness510,source=state.separation510;
    $('dd510RecordWitness').disabled=!(id===53&&ready()&&witness&&
      $('dd510ConfirmWitness').checked&&$('dd510ConfirmNoChanges').checked&&
      $('dd510WitnessNote').value.trim().length>=15&&$('dd510WitnessNote').value.length<=500);
    $('dd510RecordRetest').disabled=!(id===53&&ready()&&witness?.local_link_confirmed===true&&
      witness.live_etsy_readback_confirmed===true&&witness.photo_freshness_ready===true&&
      /^[a-f0-9]{64}$/.test(String(witness.current_evidence_fingerprint||''))&&
      Array.isArray(witness.photo_pairs)&&witness.photo_pairs.length===3&&
      witness.photo_pairs.every(photo=>photo.ready===true)&&$('dd510ConfirmNoChanges').checked&&
      photoChecks510.every(field=>$(field).checked));
    $('dd510GatewayRecord').disabled=!(source?.review_ready===true&&
      Number(source.owner_security_handoff_receipt_id)>0&&separationChecks510.every(field=>$(field).checked));
  }
  async function witnessRead510(){
    state.witness510=null;
    for(const field of ['dd510ConfirmWitness','dd510ConfirmNoChanges',...photoChecks510])$(field).checked=false;
    $('dd510PhotoPairs').replaceChildren();update510Buttons();
    const out=$('dd510ClaimStatus');
    if(id!==53||!ready()){out.textContent='HOLD — Save Product #53 first and review its latest saved state.';return;}
    out.textContent='Reading the exact existing Etsy draft claim from the saved D1 primary; no Etsy changes…';
    try{
      const value=await api('/api/admin/product-etsy-witness-trail-510?product_id=53');
      state.witness510=value;renderPhotoPairs509(value.photo_pairs||[],'dd510PhotoPairs');
      out.textContent=`LOCAL CLAIM: ${value.local_claim_state||'unknown'} • receipt #${value.local_claim_receipt_id||'not confirmed'} `+
        `• existing listing #4603838854 • live Etsy draft ${value.live_etsy_readback_confirmed?'confirmed':'not verified'} `+
        `• three photo pairs ${value.photo_freshness_ready?'current receipts available (visual review required)':'HOLD'}. `+
        (value.issues||[]).join(' | ')+
        ' This is a local readback only; the existing listing is not duplicated or published.';
    }catch(error){out.textContent=`HOLD — ${error.message}. No listing ownership or remote photos were changed.`;}
    update510Buttons();
  }
  async function witnessRecord510(action){
    update510Buttons();const retest=action==='record_photo_retest';
    if($(retest?'dd510RecordRetest':'dd510RecordWitness').disabled||!state.witness510)return;
    const field=$(retest?'dd510RetestReceipt':'dd510WitnessReceipt'),source=state.witness510;
    field.textContent='Rechecking the same local draft claim and storing one audit observation…';
    state.witness510=null;update510Buttons();
    try{
      const result=await api('/api/admin/product-etsy-witness-trail-510',{
        action,product_id:53,listing_id:'4603838854',request_key:key(),confirm_no_etsy_changes:true,
        ...(retest?{evidence_fingerprint:source.current_evidence_fingerprint,
          confirm_original_344:true,confirm_original_345:true,confirm_original_346:true,confirm_visual_equality:true}:
          {expected_claim_state:source.local_claim_state,witness_note:$('dd510WitnessNote').value.trim(),confirm_checked_actual_etsy:true})});
      field.textContent=`LOCAL AUDIT #${result.witness_receipt_id||'recorded'} — ${result.message} No Etsy listing or Product link was changed.`;
      await witnessRead510();
    }catch(error){field.textContent=`HOLD — ${error.message}. Refresh current evidence before another witnessed action.`;}
  }
  async function separationRead510(){
    state.separation510=null;separationChecks510.forEach(field=>$(field).checked=false);update510Buttons();
    const out=$('dd510GatewayStatus');out.textContent='Reading QL-243 signed nonproduction source nonce receipts, owner handoff and independent-review separation…';
    try{const result=await api('/api/admin/integration-gateway-separation-510');state.separation510=result;
      out.textContent=`HOLD • QL-243 Devil n Dove source • health signed GET ${result.source_health_accepted?'local nonce accepted':'not evidenced'} `+
        `• capabilities signed GET ${result.source_capabilities_accepted?'local nonce accepted':'not evidenced'} `+
        `• owner source-side security handoff #${result.owner_security_handoff_receipt_id||'missing'} `+
        `• separate reviewer ${result.different_reviewer?'confirmed':'required'}. `+
        (result.blockers||[]).join(' | ')+
        ' Gateway Ed25519 receipts and owner pilot remain unverified.';
    }catch(error){out.textContent=`HOLD — ${error.message}. No gateway approval or live credentials were activated.`;}
    update510Buttons();
  }
  async function separationRecord510(){
    update510Buttons();if($('dd510GatewayRecord').disabled||!state.separation510)return;
    const prior=state.separation510;state.separation510=null;update510Buttons();
    const output=$('dd510GatewayReceipt');output.textContent='Recording a separate local reviewer decision, without connecting to the gateway…';
    try{const result=await api('/api/admin/integration-gateway-separation-510',{
      action:'record_nonproduction_separation_review',request_key:key(),
      owner_handoff_receipt_id:prior.owner_security_handoff_receipt_id,
      confirm_different_reviewer:true,confirm_nonproduction_only:true,
      confirm_gateway_external_proof_pending:true,confirm_owner_pilot_not_authorized:true});
      output.textContent=`LOCAL SEPARATION RECEIPT #${result.receipt_id||'recorded'} — ${result.message}`;
    }catch(error){output.textContent=`HOLD — ${error.message}. Gateway proof and owner pilot remain pending.`;}
    separationChecks510.forEach(field=>$(field).checked=false);
  }
  const photoFields511=['dd511Photo344','dd511Photo345','dd511Photo346','dd511Visual','dd511Independent'];
  function update511Buttons(){const source=state.evidence511;
    $('dd511RecordWitnessFollowup').disabled=!(id===53&&ready()&&source?.can_record_witness_followup===true&&
      $('dd511ManualClaim').checked&&$('dd511NoProvider').checked&&
      $('dd511NextAction').value.trim().length>=15&&$('dd511NextAction').value.length<=500);
    $('dd511RecordPhotoRenewal').disabled=!(id===53&&ready()&&source?.can_record_photo_renewal===true&&
      Number(source.previous_retest_id)>0&&/^[a-f0-9]{64}$/.test(String(source.current_evidence_fingerprint||''))&&
      $('dd511NoProvider').checked&&photoFields511.every(field=>$(field).checked));
  }
  async function reviewEvidence511(){state.evidence511=null;
    for(const field of ['dd511ManualClaim','dd511NoProvider',...photoFields511])$(field).checked=false;
    $('dd511PhotoPairs').replaceChildren();update511Buttons();
    const out=$('dd511EvidenceStatus');
    if(id!==53||!ready()){out.textContent='HOLD — Save Product #53 before independently reviewing its exact Etsy receipt.';return;}
    out.textContent='Reading saved D1 primary ownership, prior Build 510 owner witness/retest and current live Etsy image URLs…';
    try{const result=await api('/api/admin/product-etsy-evidence-renewal-511?product_id=53');
      state.evidence511=result;renderPhotoPairs509(result.original_photo_pairs||[],'dd511PhotoPairs');
      out.textContent=`Product #53 • actual Etsy #4603838854 • saved D1 claim ${result.claim_state||'unknown'} `+
        `• previous owner witness #${result.previous_witness_id||'not recorded'} `+
        `• prior three-original retest #${result.previous_retest_id||'not recorded'} `+
        `• current photos ${result.fresh_three_original_pairs?'three verified source/Etsy URL receipts':'HOLD'} `+
        `• prior fingerprint ${result.evidence_unchanged?'unchanged':'missing or renewed'} `+
        `• independent reviewer ${result.independent_reviewer?'different Admin verified':'required'}. `+
        (result.can_record_photo_renewal?'READY FOR SEPARATE HUMAN PHOTO COMPARISON ONLY.':'HOLD — '+(result.issues||[]).join(' | '))+
        ' No listing update, photo upload or acceptance was performed.';
    }catch(error){out.textContent=`HOLD — ${error.message}. The existing draft remains unchanged.`;}
    update511Buttons();
  }
  async function recordEvidence511(action){update511Buttons();
    const renew=action==='record_three_photo_renewal';
    const button=$(renew?'dd511RecordPhotoRenewal':'dd511RecordWitnessFollowup');
    if(button.disabled||!state.evidence511)return;
    const prior=state.evidence511,receipt=$(renew?'dd511PhotoReceipt':'dd511WitnessReceipt');
    state.evidence511=null;update511Buttons();receipt.textContent='Rechecking exact source evidence before recording a local decision…';
    try{const saved=await api('/api/admin/product-etsy-evidence-renewal-511',{
      action,request_key:key(),product_id:53,listing_id:'4603838854',confirm_no_provider_write:true,
      ...(renew?{prior_retest_id:prior.previous_retest_id,evidence_fingerprint:prior.current_evidence_fingerprint,
        confirm_original_344:true,confirm_original_345:true,confirm_original_346:true,
        confirm_actual_visual_match:true,confirm_independent_actor:true}:
        {expected_claim_state:prior.claim_state,next_action:$('dd511NextAction').value.trim(),confirm_manual_claim_review:true})});
      receipt.textContent=`LOCAL AUDIT #${saved.receipt_id||'recorded'} • ${saved.message} Final Etsy acceptance and gateway pilot remain HOLD.`;
      await reviewEvidence511();
    }catch(error){receipt.textContent=`HOLD — ${error.message}. Refresh before another local review; no provider action was retried.`;}
  }
  async function gatewayReceiptReview511(){const out=$('dd511GatewayStatus');
    out.textContent='Rechecking current nonproduction HMAC source receipts and independent owner-review chain without contacting a gateway…';
    try{const result=await api('/api/admin/integration-gateway-receipt-verification-511');
      out.textContent=`CONNECTION HOLD • nonproduction source key ${result.nonproduction_profile_configured?'configured':'not provisioned'} `+
        `• source health #${result.health_source_nonce_receipt_id||'missing'} `+
        `• source capabilities #${result.capabilities_source_nonce_receipt_id||'missing'} `+
        `• source evidence ${result.source_receipts_verified?'verified local D1 readback':'HOLD'} `+
        `• separate reviewer ${result.owner_separation_verified?'source-side local audit matched':'not evidenced'} `+
        `• gateway Ed25519/pins ${result.gateway_signed_receipts_verified?'independently verified':'NOT VERIFIED'} `+
        `• owner identity/pilot NOT AUTHORIZED. ${(result.blockers||[]).join(' | ')}`;
    }catch(error){out.textContent=`HOLD — ${error.message}. Gateway authentication and owner permissions are not approved.`;}
  }
  const photoChecks512=['dd512Photo344','dd512Photo345','dd512Photo346','dd512Visual','dd512Separate'];
  function buttons512(){const r=state.evidence512;
    $('dd512RecordWitness').disabled=!(id===53&&ready()&&r?.can_record_conflict_witness===true&&
      $('dd512Witness').checked&&$('dd512NoChanges').checked&&
      $('dd512Observation').value.trim().length>=20&&$('dd512Observation').value.length<=600);
    $('dd512RecordPhotoRecheck').disabled=!(id===53&&ready()&&r?.can_record_independent_photo_recheck===true&&
      $('dd512NoChanges').checked&&photoChecks512.every(field=>$(field).checked)&&
      Number(r.prior_photo_renewal_id)>0&&/^[a-f\d]{64}$/.test(String(r.current_evidence_fingerprint||'')));
  }
  async function review512(){state.evidence512=null;
    for(const field of ['dd512Witness','dd512NoChanges',...photoChecks512])$(field).checked=false;
    $('dd512Pairs').replaceChildren();buttons512();
    const out=$('dd512EtsyStatus');
    if(id!==53||!ready()){out.textContent='HOLD — Save the current Product #53 before reviewing the Etsy evidence.';return;}
    out.textContent='Reading the exact primary listing claim, conflicting media receipt IDs, Build 511 renewal and current Etsy images…';
    try{const result=await api('/api/admin/product-etsy-review-512?product_id=53');
      state.evidence512=result;renderPhotoPairs509(result.original_photo_pairs||[],'dd512Pairs');
      out.textContent=`Existing Etsy draft #4603838854 • primary claim ${result.claim_state||'unknown'} `+
        `• conflicting receipt IDs ${result.conflicting_photo_receipt_ids?.join(', ')||'none'} `+
        `• missing originals ${result.missing_original_ids?.join(', ')||'none'} `+
        `• Build 511 renewal #${result.prior_photo_renewal_id||'missing'} `+
        `• three current photos ${result.current_three_verified?'readback matched':'HOLD'} `+
        `• separate reviewer ${result.independent_reviewer?'confirmed':'needed'}. `+
        (result.issues||[]).join(' | ')+
        ' No previous receipt was overwritten and no Etsy provider action was performed.';
    }catch(error){out.textContent=`HOLD — ${error.message}. No local claim or Etsy photo was altered.`;}
    buttons512();
  }
  async function record512(photo){buttons512();
    if($(photo?'dd512RecordPhotoRecheck':'dd512RecordWitness').disabled||!state.evidence512)return;
    const stateBefore=state.evidence512,out=$(photo?'dd512PhotoStatus':'dd512WitnessStatus');
    state.evidence512=null;buttons512();out.textContent='Revalidating primary claim and current source evidence before saving a local receipt…';
    try{const result=await api('/api/admin/product-etsy-review-512',{
      action:photo?'independent_photo_recheck':'witness_conflict',request_key:key(),product_id:53,listing_id:'4603838854',
      confirm_no_changes:true,expected_claim_state:stateBefore.claim_state,
      expected_claim_receipt_id:stateBefore.claim_receipt_id,
      expected_conflicting_receipt_ids:stateBefore.conflicting_photo_receipt_ids,
      ...(photo?{prior_photo_renewal_id:stateBefore.prior_photo_renewal_id,
        evidence_fingerprint:stateBefore.current_evidence_fingerprint,
        confirm_photo_344:true,confirm_photo_345:true,confirm_photo_346:true,
        confirm_visual_match:true,confirm_separate_reviewer:true}:
        {confirm_inspected_existing_draft:true,observation:$('dd512Observation').value.trim()})});
      out.textContent=`LOCAL RECEIPT #${result.receipt_id||'recorded'} — ${result.message} Final approval remains separate.`;
      await review512();
    }catch(error){out.textContent=`HOLD — ${error.message}. No Etsy update or retry was triggered.`;}
  }
  async function gatewayReview512(){const out=$('dd512GatewayStatus');
    out.textContent='Reading separately pinned source-signature readiness and local public metadata receipts…';
    try{const r=await api('/api/admin/integration-ql245-source-evidence-512');
      state.gateway512=r;
      out.textContent=`DISCONNECTED • QL-245 public SPKI pin ${r.independently_sourced_spki_pin_configured?'present':'NOT PROVISIONED'} `+
        `• source signature local receipt #${r.prior_local_signature_receipt_id||'none'} `+
        `• six source signatures ${r.six_source_signatures_verified?'matched':'NOT VERIFIED'} `+
        `• assessor and live gateway audit NOT VERIFIED • owner pilot NOT AUTHORIZED. `+
        (r.issues||[]).join(' | ');
    }catch(error){out.textContent=`HOLD — ${error.message}. The gateway remains disconnected.`;}
  }
  function signatureButton512(){
    $('dd512InspectSignature').disabled=!(id===53&&ready()&&$('dd512PublicNoSecrets').checked&&
      $('dd512PublicNonprod').checked&&$('dd512PublicMetadata').value.trim().length>0&&
      $('dd512PublicSpki').value.trim().length>0&&$('dd512PublicSignature').value.trim().length>0);
  }
  async function inspectSignature512(){signatureButton512();if($('dd512InspectSignature').disabled)return;
    const out=$('dd512SignatureStatus');let payload;
    try{payload=JSON.parse($('dd512PublicMetadata').value);}catch{
      out.textContent='HOLD — Exact canonical 22-key JSON source metadata is required.';return;}
    $('dd512InspectSignature').disabled=true;
    out.textContent='Comparing the public Ed25519 source signature against an independently provisioned trust pin…';
    try{const r=await api('/api/admin/integration-ql245-source-evidence-512',{
      action:'inspect_signed_source_metadata',request_key:key(),payload,
      public_key_spki_base64:$('dd512PublicSpki').value.trim(),
      signature:$('dd512PublicSignature').value.trim(),
      confirm_nonproduction_only:true,confirm_no_owner_pilot:true,confirm_no_secrets:true});
      out.textContent=`LOCAL PUBLIC SIGNATURE RECEIPT #${r.local_receipt_id||'recorded'} — source signature matched. `+
        'Six-app signatures, independent originals, gateway audit, owner identity, and pilot remain UNVERIFIED.';
    }catch(error){out.textContent=`HOLD — ${error.message}. No source or gateway authority was granted.`;}
    signatureButton512();
  }
  const details513=['dd513Description','dd513Tags','dd513Category','dd513Details','dd513Photo344','dd513Photo345','dd513Photo346','dd513Independent'];
  function buttons513(){const e=state.evidence513;
    $('dd513RecordFollowup').disabled=!(id===53&&ready()&&e?.can_record_disposition_followup===true&&
      $('dd513Unresolved').checked&&$('dd513NoEtsyWrite').checked&&
      $('dd513DispositionNote').value.trim().length>=20&&$('dd513DispositionNote').value.length<=600);
    $('dd513RecordContent').disabled=!(id===53&&ready()&&e?.can_record_independent_content_recheck===true&&
      $('dd513NoEtsyWrite').checked&&details513.every(field=>$(field).checked)&&
      Number(e.prior_photo_recheck_id)>0&&/^[a-f0-9]{64}$/.test(String(e.current_evidence_fingerprint||'')));
  }
  async function reviewContent513(){state.evidence513=null;
    for(const field of ['dd513Unresolved','dd513NoEtsyWrite',...details513])$(field).checked=false;
    buttons513();const out=$('dd513ContentStatus');
    if(!ready()||id!==53){out.textContent='HOLD — Save our current Product #53 before reviewing the existing Etsy draft.';return;}
    out.textContent='Comparing the exact saved Product, SEO tags, Build 512 exception receipts and actual Etsy draft…';
    try{const r=await api('/api/admin/product-etsy-disposition-513?product_id=53');
      state.evidence513=r;
      out.textContent=`Existing Etsy #4603838854 • D1 claim ${r.source_claim_state||'unknown'} `+
        `• SKU ${r.product_sku||'missing'} • slug ${r.product_slug||'missing'} `+
        `• description ${r.description_sufficient?'substantive saved text':'needs real maker details'} `+
        `• tags ${r.tag_source||'unknown'} / ${r.tags_require_owner_correction?'review “Soap bars” or empty tags':'no soap mismatch detected'} `+
        `• live Etsy metadata ${r.etsy_readback_ready?'matching':'HOLD'} `+
        `• prior photo reviewer #${r.prior_photo_recheck_id||'missing'} `+
        `• historical conflict receipts ${r.conflicting_photo_receipt_ids?.join(', ')||'none'}. `+
        (r.issues||[]).join(' | ')+
        ' No existing claim, photo or Etsy field was changed.';
    }catch(error){out.textContent=`HOLD — ${error.message}. No Etsy mutation was attempted.`;}
    buttons513();
  }
  async function recordContent513(recheck){buttons513();
    if($(recheck?'dd513RecordContent':'dd513RecordFollowup').disabled||!state.evidence513)return;
    const prior=state.evidence513,out=$(recheck?'dd513RecheckStatus':'dd513FollowupStatus');
    state.evidence513=null;buttons513();out.textContent='Refreshing the exact claim and evidence before writing a local-only review receipt…';
    try{const r=await api('/api/admin/product-etsy-disposition-513',{
      action:recheck?'record_content_correction_recheck':'record_exception_disposition_followup',request_key:key(),
      product_id:53,listing_id:'4603838854',confirm_no_etsy_changes:true,
      expected_claim_state:prior.source_claim_state,expected_claim_receipt_id:prior.source_claim_receipt_id,
      expected_conflicting_receipt_ids:prior.conflicting_photo_receipt_ids,
      ...(recheck?{prior_photo_recheck_id:prior.prior_photo_recheck_id,
        evidence_fingerprint:prior.current_evidence_fingerprint,
        confirm_saved_description:true,confirm_product_specific_tags:true,
        confirm_etsy_category:true,confirm_price_quantity_delivery:true,
        confirm_original_344:true,confirm_original_345:true,confirm_original_346:true,
        confirm_distinct_reviewer:true}:
        {disposition_note:$('dd513DispositionNote').value.trim(),confirm_unresolved_exception_review:true})});
      out.textContent=`LOCAL EVIDENCE #${r.receipt_id||'recorded'} — ${r.message}`;
      await reviewContent513();
    }catch(error){out.textContent=`HOLD — ${error.message}. No Etsy update, publish or claim transfer occurred.`;}
  }
  async function reviewGateway513(){const out=$('dd513GatewayStatus');
    out.textContent='Rechecking QL-243 local HMAC source receipts, QL-245 public signature audit, and QL-246 independent proof requirements…';
    try{const r=await api('/api/admin/integration-ql246-source-comparison-513');
      out.textContent=`DISCONNECTED • local health source receipt #${r.source_health_nonce_receipt_id||'missing'} `+
        `• local capabilities #${r.source_capabilities_nonce_receipt_id||'missing'} `+
        `• local source separation ${r.source_side_separation_review_current?'matched':'missing'} `+
        `• challenged QL-246 SPKI pin ${r.ql246_trusted_pin_provisioned?'provisioned':'NOT PROVISIONED'} `+
        `• operator challenge ${r.ql246_operator_challenge_provisioned?'provisioned':'NOT PROVISIONED'} `+
        `• prior QL-245 local receipt #${r.prior_ql245_local_signature_receipt_id||'none'}. `+
        (r.remaining_gaps||[]).join(' | ')+
        ' No live gateway permission or QL-246 signed acceptance proof was granted.';
    }catch(error){out.textContent=`HOLD — ${error.message}. Integration remains DISCONNECTED.`;}
  }
  function publicButton513(){
    $('dd513InspectPublic').disabled=!(id===53&&ready()&&$('dd513NoSecrets').checked&&
      $('dd513NoPilot').checked&&$('dd513RawProof').value.trim().length>0);
  }
  async function inspectPublic513(){publicButton513();if($('dd513InspectPublic').disabled)return;
    const out=$('dd513SignatureStatus');$('dd513InspectPublic').disabled=true;
    out.textContent='Checking exact challenged public source bytes/signature with an independently trusted fingerprint…';
    try{const r=await api('/api/admin/integration-ql246-source-comparison-513',{
      action:'inspect_ql246_public_source_signature',request_key:key(),
      raw_public_json:$('dd513RawProof').value,
      confirm_nonproduction_only:true,confirm_no_private_keys:true,
      confirm_no_gateway_or_owner_approval:true});
      out.textContent=`LOCAL SIGNATURE #${r.local_receipt_id||'recorded'} — cryptographic source record matched; `+
        'real source GET, six-app proof, independent witness and owner pilot still NOT VERIFIED.';
    }catch(error){out.textContent=`PENDING — ${error.message}. No proof was fabricated or connection enabled.`;}
    publicButton513();
  }
  const checks514=['dd514Description','dd514Category','dd514Photos','dd514Reviewer'];
  function buttons514(){const e=state.owner514;
    $('dd514RecordOwner').disabled=!(id===53&&ready()&&e?.can_record_factual_owner_observation===true&&
      $('dd514Inspected').checked&&$('dd514Unresolved').checked&&$('dd514NoChanges').checked&&
      $('dd514Note').value.trim().length>=30&&$('dd514Note').value.length<=800);
    $('dd514RecordRecheck').disabled=!(id===53&&ready()&&e?.can_record_independent_disposition_recheck===true&&
      $('dd514NoChanges').checked&&checks514.every(field=>$(field).checked)&&
      Number(e.prior_content_recheck_id)>0&&/^[a-f0-9]{64}$/.test(String(e.current_evidence_fingerprint||'')));
  }
  async function reviewOwner514(){state.owner514=null;
    for(const field of ['dd514Inspected','dd514Unresolved','dd514NoChanges',...checks514])$(field).checked=false;
    buttons514();const out=$('dd514Status');
    if(id!==53||!ready()){out.textContent='HOLD — Save Product #53 before rechecking its existing Etsy draft.';return;}
    out.textContent='Reading the exact primary Etsy ID, Build 513 local content receipt and current three-original evidence…';
    try{const r=await api('/api/admin/product-etsy-owner-witness-514?product_id=53');state.owner514=r;
      out.textContent=`Draft #4603838854 • claim ${r.claim_state||'unverified'} `+
        `• prior owner observation #${r.prior_owner_witness_id||'none'} `+
        `• independent corrected-content receipt #${r.prior_content_recheck_id||'none'} `+
        `• conflicting photo receipts ${(r.conflicting_photo_receipt_ids||[]).join(', ')||'none'} `+
        `• status ${r.disposition_status||'HOLD'}. `+
        (r.issues||[]).join(' | ')+
        ' No Etsy change, final content approval or source-claim correction was attempted.';
    }catch(error){out.textContent=`HOLD — ${error.message}. No Etsy changes were made.`;}
    buttons514();
  }
  async function recordOwner514(independent){buttons514();
    const button=$(independent?'dd514RecordRecheck':'dd514RecordOwner');
    if(button.disabled||!state.owner514)return;
    const before=state.owner514,out=$(independent?'dd514RecheckResult':'dd514OwnerResult');
    state.owner514=null;buttons514();out.textContent='Rechecking the saved primary claim and receipt references before recording a local observation…';
    try{const r=await api('/api/admin/product-etsy-owner-witness-514',{
      action:independent?'record_independent_disposition_recheck':'record_factual_owner_witness',
      request_key:key(),product_id:53,listing_id:'4603838854',
      expected_claim_state:before.claim_state,expected_claim_receipt_id:before.claim_receipt_id,
      expected_conflicting_photo_receipt_ids:before.conflicting_photo_receipt_ids,
      confirm_existing_draft_only:true,confirm_no_etsy_changes:true,confirm_not_final_approval:true,
      ...(independent?{prior_content_recheck_id:before.prior_content_recheck_id,
        evidence_fingerprint:before.current_evidence_fingerprint,
        confirm_corrected_description:true,confirm_corrected_tags:true,
        confirm_current_category_delivery:true,confirm_all_three_originals:true,
        confirm_independent_reviewer:true}:
        {observation_note:$('dd514Note').value.trim(),
         confirm_direct_owner_draft_inspection:true,confirm_unresolved_media_conflicts:true})});
      out.textContent=`LOCAL RECEIPT #${r.receipt_id||'recorded'} — ${r.message}`;
      await reviewOwner514();
    }catch(error){out.textContent=`HOLD — ${error.message}. No source evidence was rewritten.`;}
  }
  async function reviewGateway514(){const out=$('dd514GatewayStatus');
    out.textContent='Checking QL-247 public-source and credential/negative-denial witness readiness…';
    try{const r=await api('/api/admin/integration-ql247-readiness-514');
      out.textContent=`${r.connection_state||'DISCONNECTED'} • Phase A ${r.phase_a?.public_ql246_source_proof_published?'signed proof':'missing signed proof'} `+
        `• independent pin ${r.phase_a?.trusted_ql246_public_pin_configured?'configured':'NOT PROVISIONED'} `+
        `• operator challenge ${r.phase_a?.independent_operator_challenge_configured?'configured':'NOT PROVISIONED'} `+
        `• Phase B ${r.phase_b?.status||'NOT AUTHORIZED'} `+
        `• owner pilot ${r.owner_pilot_authorization||'NOT GIVEN'}. `+
        (r.next_evidence||[]).join(' | ')+
        ' Never paste credentials into this screen; no gateway request was sent.';
    }catch(error){out.textContent=`HOLD — ${error.message}. No gateway connection was attempted.`;}
  }
  const ownerChecks515=['dd515Exact','dd515Separate','dd515Hold','dd515NoWrite'];
  const gatewayChecks515=['dd515NotAuthorized','dd515NoSecrets','dd515TwoSha','dd515NoGateway'];
  function ownerButton515(){const e=state.reassessment515;
    $('dd515RecordOwner').disabled=!(id===53&&ready()&&e?.can_record_independent_conflict_reassessment===true&&
      Number(e.prior_owner_witness_id)>0&&ownerChecks515.every(x=>$(x).checked)&&
      $('dd515Observation').value.trim().length>=30&&$('dd515Observation').value.length<=800&&
      (e.allowed_unresolved_dispositions||[]).includes($('dd515Disposition').value));
  }
  function gatewayButton515(){
    $('dd515RecordGateway').disabled=!(id===53&&ready()&&state.prerequisites515?.build===515&&
      gatewayChecks515.every(x=>$(x).checked)&&$('dd515TestNote').value.trim().length>=30&&
      $('dd515TestNote').value.length<=800);
  }
  async function reviewOwner515(){state.reassessment515=null;
    for(const x of ownerChecks515)$(x).checked=false;
    ownerButton515();const out=$('dd515OwnerStatus');
    if(id!==53||!ready()){out.textContent='HOLD — Save Product #53 before checking its real owner observation.';return;}
    out.textContent='Reading the current Build 514 witness, exact local claim and historical media receipt references…';
    try{const r=await api('/api/admin/product-etsy-conflict-reassessment-515?product_id=53');state.reassessment515=r;
      out.textContent=`Draft #4603838854 • claim ${r.source_claim_state||'unverified'} `+
        `• prior owner witness #${r.prior_owner_witness_id||'missing'} `+
        `• prior independent disposition #${r.prior_independent_disposition_id||'none'} `+
        `• conflicting media receipts ${(r.conflicting_photo_receipt_ids||[]).join(', ')||'none'} `+
        `• ${r.reassessment_outcome||'HOLD'}. `+
        (r.issues||[]).join(' | ')+
        ' Only an unresolved evidence note may be recorded; no Etsy ID/media repair or final approval.';
    }catch(error){out.textContent=`HOLD — ${error.message}. No Etsy transfer or publication was attempted.`;}
    ownerButton515();
  }
  async function recordOwner515(){ownerButton515();if($('dd515RecordOwner').disabled||!state.reassessment515)return;
    const before=state.reassessment515,out=$('dd515OwnerResult');state.reassessment515=null;
    ownerButton515();out.textContent='Rechecking the exact owner observation and local claim before recording a separate unresolved audit…';
    try{const r=await api('/api/admin/product-etsy-conflict-reassessment-515',{
      action:'record_independent_conflict_reassessment',request_key:key(),
      product_id:53,listing_id:'4603838854',
      prior_owner_witness_id:before.prior_owner_witness_id,
      expected_claim_state:before.source_claim_state,
      expected_claim_receipt_id:before.source_claim_receipt_id,
      expected_conflicting_receipt_ids:before.conflicting_photo_receipt_ids,
      expected_photo_fingerprint:before.source_evidence_fingerprint,
      disposition:$('dd515Disposition').value,observation_note:$('dd515Observation').value.trim(),
      confirm_exact_existing_draft:true,confirm_distinct_reviewer:true,
      confirm_unresolved_only:true,confirm_no_etsy_changes:true});
      out.textContent=`LOCAL RECEIPT #${r.receipt_id||'recorded'} — ${r.message}`;
      await reviewOwner515();
    }catch(error){out.textContent=`HOLD — ${error.message}. No provider action occurred.`;}
  }
  async function reviewGateway515(){state.prerequisites515=null;gatewayButton515();
    const out=$('dd515GatewayStatus');out.textContent='Reviewing QL-247 test scope, QL-248 two-SHA amendment and independent approval gaps…';
    try{const r=await api('/api/admin/integration-ql247-prerequisites-515');state.prerequisites515=r;
      out.textContent=`${r.connection_state||'DISCONNECTED'} • QL-248 ${r.ql248_two_revision_amendment?.status||'PROPOSED'} `+
        `• real authorized nonproduction test ${r.can_run_authenticated_test?'YES':'NO'} `+
        `• current source pin ${r.phase_a?.trusted_spki_pin_provisioned?'configured':'NOT PROVISIONED'} `+
        `• operator challenge ${r.phase_a?.operator_challenge_provisioned?'configured':'NOT PROVISIONED'} `+
        `• prior public-only prerequisite note #${r.last_local_prerequisite_note_id||'none'}. `+
        (r.required_operator_evidence||[]).join(' | ')+
        ' No keys, signed proof, gateway GET, pilot, product write or live communication enabled.';
    }catch(error){out.textContent=`HOLD — ${error.message}. Gateway remains DISCONNECTED.`;}
    gatewayButton515();
  }
  async function recordGateway515(){gatewayButton515();if($('dd515RecordGateway').disabled||!state.prerequisites515)return;
    const out=$('dd515GatewayResult');state.prerequisites515=null;gatewayButton515();
    out.textContent='Saving a factual local missing-prerequisite note only…';
    try{const r=await api('/api/admin/integration-ql247-prerequisites-515',{
      action:'record_local_test_prerequisite_review',request_key:key(),
      source_system:'devilndove',business_id:'devilndove',tenant_id:null,
      prerequisite_note:$('dd515TestNote').value.trim(),
      confirm_no_nonproduction_test_authorization:true,
      confirm_no_credential_or_secret_provision:true,
      confirm_two_sha_proposed_only:true,confirm_no_gateway_request:true});
      out.textContent=`LOCAL NOTE #${r.local_prerequisite_receipt_id||'recorded'} — ${r.message}`;
      await reviewGateway515();
    }catch(error){out.textContent=`HOLD — ${error.message}. No connection or key was authorized.`;}
  }
  // Build 501: the owner opts in once with the Etsy checkbox. A confirmed
  // local Save (or approved gallery save) can now drive the complete package.
  // The *server* must still confirm the saved channel preference. Never send
  // when the Product, shipping, images or a prior remote result is uncertain.
  async function syncAfterSave(source){
    if(state.syncing){saveState('Etsy is already synchronizing this Product. Wait for that result; no duplicate transfer will start.','working');return;}
    if(state.busy&&!state.refreshPromise){saveState('Etsy is already checking this Product. Wait for that result; no duplicate transfer will start.','working');return;}
    if(state.holdAfterWrite){
      saveState('HOLD — an earlier Etsy attempt needs independent review before another write. Open Etsy Drafts and reconcile its listing ID.','hold');return;
    }
    state.syncing=true;
    try{
      const intent=await api(`/api/admin/product-channel-intent?product_id=${id}`);
      if(Number(intent.product_id||id)!==id||intent.preferences?.etsy!==true){
        saveState('Etsy sync is OFF or the saved Etsy checkbox could not be verified. Our local Product was saved; nothing was sent to Etsy.','hold');return;
      }
      if(!ready()){
        saveState('HOLD — save the remaining Product edits before updating Etsy. The saved Product is safe.','hold');return;
      }
      if(state.refreshPromise)await state.refreshPromise;
      if(!state.loaded)await refresh();
      // The owner already supplied and separately consented to the exact
      // existing Etsy draft. Resolve that identity BEFORE requiring gallery
      // or tag readiness, which cannot establish the local listing link.
      // This only verifies Etsy and saves the local receipt; it never creates
      // a second listing. A failed link stops before any provider update.
      const candidate=String($('dd500ListingId').value||'').trim();
      if(!state.linked&&/^[1-9]\d{0,14}$/.test(candidate)){
        if(!$('dd500LinkConsent').checked){
          saveState(`STEP 1 — Product saved. Check the exact draft #${candidate} in Etsy, tick its link authorization, then select Verify/link. No duplicate will be created.`,'hold');
          openEtsyReview();return;
        }
        await linkExisting();
        if(!state.linked){
          saveState(`STEP 1 HOLD — existing Etsy draft #${candidate} was not verified and linked. Read the precise verification error below; do not Create another.`,'hold');
          openEtsyReview();return;
        }
        state.loaded=false;await refresh();
      }
      if(!state.loaded||!state.assessment?.ready){
        const exact=state.readIssues[0]||state.assessment?.issues?.[0]||'The saved Etsy checklist could not be verified.';
        saveState(`HOLD — Product saved locally, but Etsy is waiting at: ${exact} Open Etsy → “What will be sent” for the exact item. No partial package was sent.`,'hold');
        openEtsyReview();return;
      }
      if(state.linked===''){
        const candidate=$('dd500ListingId').value.trim();
        if(candidate){
          saveState(`HOLD — Product saved. Verify and link existing Etsy draft #${candidate} once. We will update it, never create a duplicate.`,'hold');
          openEtsyReview();return;
        }
        if(!state.settings)await loadOptions();
        if(!state.settings||!newSettingsReady()){
          saveState('HOLD — Product saved. Complete the one-time Etsy category, Canada-only shipping/processing and packed measurements under Etsy. Then press Create complete Etsy draft + photos.','hold');
          $('dd500NewSettings').open=true;openEtsyReview();return;
        }
      }
      saveState(`Saving ${source==='media'?'new gallery photographs':'the Product changes'} to the same unpublished Etsy draft, including all eligible photos…`,'working');
      const succeeded=await send({fromSave:true});
      saveState($('dd500Status').textContent,succeeded?'ok':'hold');
      if(!succeeded)openEtsyReview();
    }catch(error){saveState(`HOLD — local Product saved; Etsy sync could not be verified: ${error.message}. Review the Etsy tab before attempting again.`,'hold');openEtsyReview();}
    finally{state.syncing=false;}
  }
  async function linkExisting(){if(!ready()||state.busy||state.linked)return;
    const listingId=$('dd500ListingId').value.trim();if(!/^[1-9]\d{0,14}$/.test(listingId)||!$('dd500LinkConsent').checked)return;
    if(state.claim?.state==='another_product'){status(`STOP — draft #${listingId} belongs to local Product #${state.claim.product?.product_id}. Use “Review the other Product”; no Etsy action was attempted.`,true);return;}
    state.busy=true;show();status(`Checking Etsy listing #${listingId} without changing it…`);
    try{const common={product_id:id,listing_id:listingId,confirm_unpublished_only:true,
      confirm_canada_only:true,confirm_exact_etsy_listing:true};
      const preview=await api('/api/admin/product-etsy-existing-draft',{...common,action:'inspect_listing',request_key:key()});
      if(preview.verified_unpublished!==true||preview.verified_canada_only!==true||String(preview.listing_id)!==listingId)
        throw Error('Etsy listing identity and Canada-only draft status were not verified.');
      state.previewId=listingId;state.previewTitleMatches=preview.title_matches===true;
      if(!state.previewTitleMatches&&!$('dd500OlderTitle').checked){
        $('dd500OlderTitleRow').hidden=false;
        throw Error(`Title check: Etsy says “${preview.etsy_title}”; this Product says “${preview.product_title}”. If it is the same item, confirm the older title and click Verify again.`);
      }
      const result=await api('/api/admin/product-etsy-existing-draft',{...common,action:'link_existing',
        request_key:key(),confirm_prior_title_difference:!state.previewTitleMatches&&$('dd500OlderTitle').checked});
      if(!result.linked||String(result.listing_id)!==listingId||result.saved_link_readback_confirmed!==true||!result.receipt_id)
        throw Error('The server did not independently confirm the saved Product and Etsy receipt. Recheck saved details before any other action.');
      const saved=await api(`/api/admin/product-etsy-existing-draft?product_id=${id}&candidate_listing_id=${encodeURIComponent(listingId)}`);
      if(String(saved.linked_listing_id)!==listingId||saved.saved_link_readback_confirmed!==true){
        state.lastRemoteId=listingId;state.linkReadbackHold=true;
        throw Error(`Local receipt #${result.receipt_id} was confirmed during linking, but a subsequent read could not confirm Product #${id}. Recheck saved details; never create a second Etsy draft.`);
      }
      state.linked=listingId;state.settings=null;$('dd500Consent').checked=false;
      document.dispatchEvent(new CustomEvent('dd:etsy-existing-draft-linked',{detail:{product_id:id,listing_id:listingId}}));
      status(`Verified and saved Etsy listing #${listingId} against Product #${id}. No new listing created. Review the package, then click Update.`);
    }catch(error){if(error.conflicting_product){state.claim={state:'another_product',product:error.conflicting_product};}
      if(error.code==='etsy_506_persistence_readback_hold'){state.lastRemoteId=listingId;state.linkReadbackHold=true;}
      status('HOLD — '+error.message,true);}
    finally{state.busy=false;show();if(state.linked||state.linkReadbackHold)void refresh();}
  }
  async function inspectLocalClaim505(){
    const listingId=$('dd500ListingId').value.trim();
    if(!ready()||state.linked||state.claim?.state!=='another_product'||!listingId)return;
    state.claimReview=null;$('dd505ResolveClaim').disabled=true;
    $('dd505ClaimReview').textContent='Checking both local Products, the exact Etsy draft and previous provider activity (read only)…';
    try{
      const response=await api(`/api/admin/product-etsy-owner-reconcile-505?mode=claim&product_id=${id}&listing_id=${encodeURIComponent(listingId)}`);
      const review=response.review||{};
      if(review.state!=='another_product'||review.claim?.product_id!==state.claim.product?.product_id)throw Error('The local claimant changed. Refresh the saved Product before a decision.');
      state.claimReview=review;
      $('dd505ClaimReview').textContent=review.safe_to_offer?
        `LOCAL CORRECTION AVAILABLE — Etsy says “${review.etsy_title}”, matching this Product. Other local Product #${review.claim.product_id} is “${review.claim.product_name}” (${review.claim.sku||'no SKU'}). No previous Etsy writes were recorded against the claimant. Only move the local ID if we checked both items and agree.`:
        `HOLD — ${review.issues?.join(' ')||'This claim needs separate owner review.'} Nothing was moved.`;
    }catch(error){state.claimReview=null;$('dd505ClaimReview').textContent=`HOLD — ${error.message} No record changed.`;}
    show();
  }
  async function resolveLocalClaim505(){
    const review=state.claimReview,listingId=$('dd500ListingId').value.trim();
    if(!review?.safe_to_offer||!$('dd505ReviewedOther').checked||!$('dd505CorrectTarget').checked||!ready())return;
    $('dd505ResolveClaim').disabled=true;
    $('dd505ClaimReview').textContent='Rechecking Etsy and both Product records before moving one local listing link…';
    try{
      const response=await api('/api/admin/product-etsy-owner-reconcile-505',{action:'resolve_local_claim',product_id:id,listing_id:listingId,
        expected_claimant_product_id:review.claim.product_id,expected_receipt_id:review.claim.receipt_id,request_key:key(),
        confirm_claimant_reviewed:true,confirm_correct_product:true,confirm_unpublished_canada_only:true});
      if(!response.claim_reassigned||String(response.listing_id)!==listingId)throw Error('The local Etsy receipt was not confirmed.');
      state.claimReview=null;state.claim=null;state.loaded=false;resetOwnerApproval();
      $('dd505ReviewedOther').checked=false;$('dd505CorrectTarget').checked=false;
      $('dd505ClaimReview').textContent=`Confirmed — local Etsy draft #${listingId} now belongs to Product #${id}. Etsy itself was not changed.`;
      document.dispatchEvent(new CustomEvent('dd:etsy-existing-draft-linked',{detail:{product_id:id,listing_id:listingId}}));
      await refresh();
    }catch(error){$('dd505ClaimReview').textContent=`HOLD — ${error.message} Re-read the saved listing ID before another action.`;
      state.claimReview=null;await refresh();}
    show();
  }
  function selectedPhoto505(selectName,listName,idField){
    return state.photoReview?.[listName]?.find(row=>String(row[idField])===$(selectName==='original'?$('dd505Original'):$('dd505Remote')).value)||null;
  }
  function photoSelection505(){
    const original=selectedPhoto505('original','originals','product_image_id');
    const remote=selectedPhoto505('remote','etsy_photos','etsy_image_id');
    for(const [element,image] of [['dd505OriginalPreview',original],['dd505RemotePreview',remote]]){
      const view=$(element),url=String(image?.image_url||'');
      // An image preview never executes links or HTML from source metadata.
      if(url.startsWith('/')||/^https:\/\//i.test(url)){view.src=url;view.hidden=false;}
      else{view.hidden=true;view.removeAttribute('src');}
    }
    $('dd505MatchPhoto').disabled=!ready()||!original||!remote||!$('dd505WitnessPhoto').checked||
      Boolean(state.photoReview?.unresolved_upload_attempts);
  }
  async function inspectExistingPhotos505(){
    state.photoReview=null;$('dd505MatchPhoto').disabled=true;
    $('dd505PhotoStatus').textContent='Reading Etsy’s actual unpublished listing images and the saved original gallery (no changes)…';
    if(!ready()||!state.linked){$('dd505PhotoStatus').textContent='HOLD — first save and link the existing draft.';return;}
    try{
      const receipt=await api(`/api/admin/product-etsy-owner-reconcile-505?mode=photos&product_id=${id}&listing_id=${encodeURIComponent(state.linked)}`);
      if(String(receipt.listing_id)!==state.linked)throw Error('Etsy listing ID differs from this Product.');
      state.photoReview=receipt;
      const matchedLocal=new Set(receipt.matched.map(row=>String(row.product_image_id)));
      const matchedRemote=new Set(receipt.matched.map(row=>String(row.etsy_image_id)));
      for(const [select,list,keyField,matched] of [[$('dd505Original'),receipt.originals,'product_image_id',matchedLocal],[$('dd505Remote'),receipt.etsy_photos,'etsy_image_id',matchedRemote]]){
        select.replaceChildren(new Option('Select an unmatched photograph…',''));
        for(const row of list.filter(row=>!matched.has(String(row[keyField]))))select.add(new Option(`#${row[keyField]}${row.alt_text?' — '+row.alt_text.slice(0,70):''}`,String(row[keyField])));
        select.disabled=select.options.length<2;
      }
      $('dd505WitnessPhoto').checked=false;photoSelection505();
      $('dd505PhotoStatus').textContent=receipt.unresolved_upload_attempts?
        'HOLD — an earlier photo upload is unresolved. We must reconcile its actual outcome before accepting a new match. No upload was attempted.':
        `${receipt.matched.length} original photograph(s) already matched. ${receipt.originals.length-receipt.matched.length} local original(s) and ${receipt.etsy_photos.length-receipt.matched.length} existing Etsy photo(s) remain unmatched. Select the exact same image in both columns, then confirm.`;
    }catch(error){$('dd505PhotoStatus').textContent=`HOLD — ${error.message} Nothing was uploaded or mapped.`;}
  }
  async function matchExistingPhoto505(){
    const original=selectedPhoto505('original','originals','product_image_id'),remote=selectedPhoto505('remote','etsy_photos','etsy_image_id');
    if(!original||!remote||!$('dd505WitnessPhoto').checked||!state.linked||!ready())return;
    $('dd505MatchPhoto').disabled=true;$('dd505PhotoStatus').textContent=`Rechecking existing Etsy photograph #${remote.etsy_image_id} against original #${original.product_image_id}…`;
    try{
      const result=await api('/api/admin/product-etsy-owner-reconcile-505',{action:'match_existing_photo',product_id:id,listing_id:state.linked,
        product_image_id:original.product_image_id,etsy_image_id:remote.etsy_image_id,request_key:key(),
        confirm_unpublished_canada_only:true,confirm_exact_photo_match:true});
      if(!result.photo_matched)throw Error('The matching photo receipt was not confirmed.');
      resetOwnerApproval();
      document.dispatchEvent(new CustomEvent('dd:etsy-photo-verified',{detail:{product_id:id,listing_id:state.linked,product_image_id:original.product_image_id}}));
      await inspectExistingPhotos505();
      await refresh();
    }catch(error){$('dd505PhotoStatus').textContent=`HOLD — ${error.message} Re-read the existing photos before any retry.`;
      state.photoReview=null;photoSelection505();}
  }
  async function sendImages(listingId){
    const inventory=await api(`/api/admin/product-etsy-images?product_id=${id}&reconcile=1`);
    if(String(inventory.listing_id)!==String(listingId)||inventory.remote_reconciliation?.ready!==true||
      !['matched','ready_for_separate_owner_approval'].includes(inventory.photo_gap_492?.state))
      throw Error('Existing Etsy photos and recorded receipts do not match. Inspect Etsy; no images were resent.');
    let transferred=0;
    for(const imageId of state.assessment.pending){
      status(`Uploading complete package to Etsy #${listingId}: photo #${imageId} (${transferred+1}/${state.assessment.pending.length}). Do not leave this page…`);
      const result=await api('/api/admin/product-etsy-images',{action:'transfer_one',product_id:id,product_image_id:imageId,
        request_key:key(),confirm_approved_media:true,confirm_unpublished_only:true,confirm_canada_only:true});
      if(result.verified_remote_readback!==true||!result.etsy_image_id||String(result.listing_id)!==String(listingId))
        throw Error(`Photo #${imageId} did not return a verified Etsy image ID. Check Etsy before attempting any more uploads.`);
      transferred++;
      document.dispatchEvent(new CustomEvent('dd:etsy-photo-verified',{detail:{product_id:id,listing_id:listingId,product_image_id:imageId}}));
    }
  }
  async function sendTags(listingId){
    const compare=await api(`/api/admin/product-etsy-tags?product_id=${id}&reconcile=1`);
    if(String(compare.listing_id)!==String(listingId)||!compare.verified_draft||!compare.verified_canada_only||
      compare.unresolved_attempt||!compare.ready)throw Error('Native Etsy tags could not be verified or a prior tag attempt is unresolved.');
    if(compare.matching_tags)return;
    status(`Sending saved Product search tags to Etsy draft #${listingId}…`);
    const result=await api('/api/admin/product-etsy-tags',{action:'update_native_tags',product_id:id,listing_id:listingId,
      reviewed_tags:compare.local_tags,request_key:key(),confirm_saved_product_tags:true,
      confirm_replace_existing_tags:true,confirm_unpublished_only:true,confirm_canada_only:true});
    if(result.native_tags_verified!==true||String(result.listing_id)!==String(listingId))
      throw Error('Etsy tag readback did not confirm the saved search phrases.');
    document.dispatchEvent(new CustomEvent('dd:etsy-native-tags-verified',{detail:{product_id:id,listing_id:listingId}}));
  }
  async function sendAdvanced(listingId){
    const preview=await api(`/api/admin/product-etsy-advanced-sync?product_id=${id}`);
    if(String(preview.listing_id)!==String(listingId)||!preview.verified_unpublished||!preview.verified_canada_only||
      preview.unresolved_attempt)throw Error('Advanced Etsy draft comparison was not safe; the package is on HOLD.');
    if(!preview.ready)throw Error('Advanced Etsy fields are not ready. Review the optional advanced settings on HOLD.');
    if(!preview.changed_fields?.length)return;
    status(`Synchronizing ${preview.changed_fields.length} saved advanced Etsy field(s) on draft #${listingId}…`);
    const result=await api('/api/admin/product-etsy-advanced-sync',{action:'sync_metadata_once',product_id:id,
      listing_id:listingId,review_fingerprint:preview.review_fingerprint,request_key:key(),
      confirm_reviewed_changes:true,confirm_unpublished_only:true,confirm_canada_only:true,
      confirm_no_photo_or_shipping_change:true});
    if(!result.verified_advanced_metadata||!result.still_unpublished||String(result.listing_id)!==String(listingId))
      throw Error('Advanced fields did not return a confirmed unpublished Etsy readback.');
  }
  async function acceptance(listingId){
    const [linked,photos,tags,distribution,facebook]=await Promise.all([
      api(`/api/admin/product-etsy-existing-draft?product_id=${id}`),
      api(`/api/admin/product-etsy-images?product_id=${id}&reconcile=1`),
      api(`/api/admin/product-etsy-tags?product_id=${id}&reconcile=1`),
      api(`/api/admin/product-distribution-406?product_id=${id}&channel=etsy`),
      api(`/api/admin/product-distribution-406?product_id=${id}&channel=facebook`)]);
    const gallery=distribution.gallery||[],same=gallery.length===(facebook.gallery||[]).length&&
      gallery.every(photo=>(facebook.gallery||[]).some(x=>Number(x.product_image_id)===Number(photo.product_image_id)&&x.image_url===photo.image_url));
    if(String(linked.linked_listing_id)!==String(listingId)||!verifiedEtsyPackage500(id,linked,photos,tags,gallery.length)||!same)
      throw Error('Live acceptance is incomplete: check Etsy image receipts, tags, linking and the shared Marketplace gallery. No publication occurred.');
    return gallery.length;
  }
  async function ownerPhotoReadback(){
    state.ownerReadbackReady=false;$('dd504Signoff').disabled=true;
    $('dd504Readback').textContent='Reading the saved Product, actual Etsy listing, search tags and all original photo receipts…';
    if(!ready()){$('dd504Readback').textContent='HOLD — Save or review the latest Product changes first.';return;}
    try{const result=await api(`/api/admin/product-etsy-owner-signoff-504?product_id=${id}`);
      const total=result.expected_photo_ids?.length||0,confirmed=result.confirmed_photo_ids?.length||0;
      const tally=`${confirmed}/${total} expected original photos verified; Etsy currently reports ${result.etsy_remote_photo_count??'?'} photos.`;
      state.ownerReadbackReady=result.ready===true&&String(result.listing_id||'')===String(state.linked||'')&&total>0;
      $('dd504Readback').textContent=state.ownerReadbackReady?
        `VERIFIED — ${tally} Draft #${result.listing_id}, details, price, quantity and native tags match. Review the actual Etsy category and shipping before approving.`:
        `HOLD — ${tally} ${result.issues?.join(' ')||'The saved Product is not yet fully matched to the Etsy draft.'} No Etsy change was made.`;
      $('dd504Signoff').disabled=!state.ownerReadbackReady||!$('dd504ApproveContent').checked;
    }catch(error){$('dd504Readback').textContent=`HOLD — ${error.message} No Etsy photo was sent and no approval was recorded.`;}
  }
  async function ownerSignoff(){
    if(!state.ownerReadbackReady||!$('dd504ApproveContent').checked||!ready()||!state.linked)return;
    $('dd504Signoff').disabled=true;
    $('dd504SignoffStatus').textContent='Rechecking the actual Etsy draft once more before recording owner approval…';
    try{const result=await api('/api/admin/product-etsy-owner-signoff-504',{action:'approve_verified_draft',product_id:id,
      listing_id:state.linked,request_key:key(),confirm_actual_etsy_content:true,confirm_canada_only:true,confirm_unpublished_only:true});
      if(!result.owner_approval_recorded)throw Error('The server did not return an approval receipt.');
      $('dd504SignoffStatus').textContent=`APPROVED locally — Product #${id}, Etsy draft #${state.linked}, ${result.confirmed_photo_ids?.length||0} verified original photographs. No publication occurred.`;
      state.ownerReadbackReady=false;$('dd504ApproveContent').checked=false;
    }catch(error){$('dd504SignoffStatus').textContent=`HOLD — ${error.message} Refresh readback before any new approval attempt.`;
      state.ownerReadbackReady=false;}
  }
  async function send({fromSave=false}={}){
    if(state.busy||state.attempted||state.holdAfterWrite||!ready()||!state.assessment?.ready||
      !(fromSave||$('dd500Consent').checked)||!globalThis.crypto?.randomUUID)return false;
    const existing=Boolean(state.linked),mode=existing?'existing':'new';
    if(!existing&&(!state.settings||!newSettingsReady()||$('dd500ListingId').value.trim()))return false;
    state.busy=true;show();status(`Rechecking all Product photos and Etsy listing ID before one ${mode} package action…`);
    let writeStarted=false;
    let succeeded=false;
    try{
      const snapshot=await packageSnapshot();
      if(!snapshot.assessment.ready||String(snapshot.link.linked_listing_id||'')!==state.linked)
        throw Error('Saved Product photos, permissions, tags or Etsy listing changed. Refresh before approval.');
      const approval=await api('/api/admin/product-etsy-unified-approval',{product_id:id,mode,request_key:key(),owner_authorized:true});
      if(!approval.dispatch_authorized||!approval.receipt_id)throw Error('Owner approval receipt could not be confirmed.');
      let listingId=state.linked;
      if(existing){
        status(`Updating saved Product fields on original Etsy draft #${listingId}; no new draft will be created…`);
        writeStarted=true;state.attempted=true;show();
        const result=await api('/api/admin/product-etsy-existing-draft',{action:'update_saved_fields',product_id:id,
          listing_id:listingId,request_key:key(),confirm_unpublished_only:true,confirm_canada_only:true,
          confirm_saved_product_fields:true});
        if(!result.updated||String(result.listing_id)!==listingId||!result.still_unpublished)
          throw Error('Saved Etsy fields did not return a confirmed unpublished draft result.');
      }else{
        const tested=await api('/api/admin/product-etsy-draft',{action:'test_connection',product_id:id});
        if(!tested.live_connection_verified||tested.blockers?.length||
          !tested.options?.taxonomy?.some(x=>x.id===Number($('dd500Category').value))||
          !tested.options?.shipping?.some(x=>x.id===Number($('dd500Shipping').value))||
          !tested.options?.readiness?.some(x=>x.id===Number($('dd500Processing').value)))
          throw Error('Etsy shop or selected setup changed; reload the live category and shipping choices.');
        const shipping=await api('/api/admin/product-etsy-draft',{action:'test_shipping',product_id:id,
          shipping_profile_id:Number($('dd500Shipping').value)});
        if(!shipping.shipping_profile_verified)throw Error('Shipping destinations were not verified as strictly Canada-only.');
        status('Creating ONE unpublished Etsy draft and saving its returned listing number to the Product…');
        writeStarted=true;state.attempted=true;show();
        const created=await api('/api/admin/product-etsy-draft',{action:'create_draft',product_id:id,
          taxonomy_id:Number($('dd500Category').value),shipping_profile_id:Number($('dd500Shipping').value),
          readiness_state_id:Number($('dd500Processing').value),who_made:$('dd500Who').value,
          when_made:$('dd500When').value,is_supply:$('dd500Supply').checked,parcel:parcel(),
          fingerprint:tested.fingerprint,request_key:key(),confirm_unpublished_draft_only:true,
          confirm_no_automatic_retry:true,confirm_canada_only_shipping_profile:true});
        if(!created.created||!created.listing_id||created.listing_state!=='draft')throw Error('Etsy draft creation was not independently confirmed.');
        listingId=String(created.listing_id);
        state.lastRemoteId=listingId;
        const linked=await api(`/api/admin/product-etsy-existing-draft?product_id=${id}`);
        if(String(linked.linked_listing_id)!==listingId)throw Error(`Etsy returned #${listingId}, but the saved Product link was not confirmed. Record this number and inspect Etsy before any retry.`);
        state.linked=listingId;
        state.lastRemoteId='';
        document.dispatchEvent(new CustomEvent('dd:etsy-draft-created',{detail:{product_id:id,listing_id:listingId}}));
      }
      await sendImages(listingId);
      await sendTags(listingId);
      await sendAdvanced(listingId);
      const count=await acceptance(listingId);
      $('dd500Consent').checked=false;
      status(`Verified ✓ Etsy draft #${listingId} is linked to Product #${id}; ${count}/${count} original photos and native tags match live readback. Our store uses the same gallery; Facebook Marketplace remains manual. Nothing published.`);
      succeeded=true;
      $('dd497ChannelRemote')?.click();
    }catch(error){if(error.listing_id)state.lastRemoteId=String(error.listing_id);
      if(writeStarted)state.holdAfterWrite=true;
      status(`HOLD — ${error.message}${state.lastRemoteId?' Etsy listing ID: #'+state.lastRemoteId+'.':''}${writeStarted?' A provider action may have been attempted; inspect Etsy and audit receipts before trying again.':' No Etsy provider write was sent.'}`,true);
      // Keep the six historical sections closed. The single HOLD summary is
      // always visible; advanced repair is an optional owner decision.
    }finally{state.busy=false;state.attempted=!succeeded&&writeStarted;show();}
    return succeeded;
  }
  $('dd500Refresh').addEventListener('click',()=>void refresh());
  $('dd504CheckPhotos').addEventListener('click',()=>void ownerPhotoReadback());
  $('dd506TrialCheck').addEventListener('click',()=>void reviewTrial506());
  $('dd507TrialCheck').addEventListener('click',()=>void reviewTrial507());
  $('dd508Preflight').addEventListener('click',()=>void reviewCloseout508());
  closeoutFields508.forEach(field=>$(field).addEventListener('change',updateCloseout508Button));
  $('dd508Record').addEventListener('click',()=>void recordCloseout508());
  $('dd508GatewayCheck').addEventListener('click',()=>void reviewGateway508());
  $('dd509Review').addEventListener('click',()=>void independentReview509());
  for(const field of ['dd509ExceptionCategory','dd509NextAction','dd509NoEtsyChange',...independentFields509])
    $(field).addEventListener(field==='dd509NextAction'?'input':'change',update509Buttons);
  $('dd509RecordException').addEventListener('click',()=>void submitIndependent509('record_exception_followup'));
  $('dd509IndependentAccept').addEventListener('click',()=>void submitIndependent509('record_independent_acceptance'));
  $('dd509GatewayReview').addEventListener('click',()=>void gatewayReview509());
  gatewayFields509.forEach(field=>$(field).addEventListener('change',update509Buttons));
  $('dd509GatewayHandoff').addEventListener('click',()=>void gatewayHandoff509());
  $('dd510ReadClaim').addEventListener('click',()=>void witnessRead510());
  $('dd510WitnessNote').addEventListener('input',update510Buttons);
  for(const field of ['dd510ConfirmWitness','dd510ConfirmNoChanges',...photoChecks510])$(field).addEventListener('change',update510Buttons);
  $('dd510RecordWitness').addEventListener('click',()=>void witnessRecord510('record_candidate_witness'));
  $('dd510RecordRetest').addEventListener('click',()=>void witnessRecord510('record_photo_retest'));
  $('dd510GatewayReview').addEventListener('click',()=>void separationRead510());
  separationChecks510.forEach(field=>$(field).addEventListener('change',update510Buttons));
  $('dd510GatewayRecord').addEventListener('click',()=>void separationRecord510());
  $('dd511ReviewEvidence').addEventListener('click',()=>void reviewEvidence511());
  $('dd511NextAction').addEventListener('input',update511Buttons);
  for(const field of ['dd511ManualClaim','dd511NoProvider',...photoFields511])$(field).addEventListener('change',update511Buttons);
  $('dd511RecordWitnessFollowup').addEventListener('click',()=>void recordEvidence511('record_claim_witness_followup'));
  $('dd511RecordPhotoRenewal').addEventListener('click',()=>void recordEvidence511('record_three_photo_renewal'));
  $('dd511ReviewGateway').addEventListener('click',()=>void gatewayReceiptReview511());
  $('dd512ReviewEtsy').addEventListener('click',()=>void review512());
  $('dd512Observation').addEventListener('input',buttons512);
  for(const field of ['dd512Witness','dd512NoChanges',...photoChecks512])$(field).addEventListener('change',buttons512);
  $('dd512RecordWitness').addEventListener('click',()=>void record512(false));
  $('dd512RecordPhotoRecheck').addEventListener('click',()=>void record512(true));
  $('dd512ReviewGateway').addEventListener('click',()=>void gatewayReview512());
  for(const field of ['dd512PublicNoSecrets','dd512PublicNonprod'])$(field).addEventListener('change',signatureButton512);
  for(const field of ['dd512PublicMetadata','dd512PublicSpki','dd512PublicSignature'])$(field).addEventListener('input',signatureButton512);
  $('dd512InspectSignature').addEventListener('click',()=>void inspectSignature512());
  $('dd513ReviewContent').addEventListener('click',()=>void reviewContent513());
  $('dd513DispositionNote').addEventListener('input',buttons513);
  for(const field of ['dd513Unresolved','dd513NoEtsyWrite',...details513])$(field).addEventListener('change',buttons513);
  $('dd513RecordFollowup').addEventListener('click',()=>void recordContent513(false));
  $('dd513RecordContent').addEventListener('click',()=>void recordContent513(true));
  $('dd513ReviewGateway').addEventListener('click',()=>void reviewGateway513());
  $('dd513RawProof').addEventListener('input',publicButton513);
  for(const field of ['dd513NoSecrets','dd513NoPilot'])$(field).addEventListener('change',publicButton513);
  $('dd513InspectPublic').addEventListener('click',()=>void inspectPublic513());
  $('dd514Review').addEventListener('click',()=>void reviewOwner514());
  $('dd514Note').addEventListener('input',buttons514);
  for(const field of ['dd514Inspected','dd514Unresolved','dd514NoChanges',...checks514])$(field).addEventListener('change',buttons514);
  $('dd514RecordOwner').addEventListener('click',()=>void recordOwner514(false));
  $('dd514RecordRecheck').addEventListener('click',()=>void recordOwner514(true));
  $('dd514ReviewGateway').addEventListener('click',()=>void reviewGateway514());
  $('dd515ReviewOwner').addEventListener('click',()=>void reviewOwner515());
  $('dd515Disposition').addEventListener('change',ownerButton515);
  $('dd515Observation').addEventListener('input',ownerButton515);
  for(const x of ownerChecks515)$(x).addEventListener('change',ownerButton515);
  $('dd515RecordOwner').addEventListener('click',()=>void recordOwner515());
  $('dd515ReviewGateway').addEventListener('click',()=>void reviewGateway515());
  $('dd515TestNote').addEventListener('input',gatewayButton515);
  for(const x of gatewayChecks515)$(x).addEventListener('change',gatewayButton515);
  $('dd515RecordGateway').addEventListener('click',()=>void recordGateway515());
  $('dd504ApproveContent').addEventListener('change',()=>{$('dd504Signoff').disabled=!state.ownerReadbackReady||!$('dd504ApproveContent').checked;});
  $('dd504Signoff').addEventListener('click',()=>void ownerSignoff());
  $('dd505InspectClaim').addEventListener('click',()=>void inspectLocalClaim505());
  $('dd505ResolveClaim').addEventListener('click',()=>void resolveLocalClaim505());
  for(const field of ['dd505ReviewedOther','dd505CorrectTarget'])$(field).addEventListener('change',show);
  $('dd505LoadPhotos').addEventListener('click',()=>void inspectExistingPhotos505());
  for(const field of ['dd505Original','dd505Remote'])$(field).addEventListener('change',()=>{$('dd505WitnessPhoto').checked=false;photoSelection505();});
  $('dd505WitnessPhoto').addEventListener('change',photoSelection505);
  $('dd505MatchPhoto').addEventListener('click',()=>void matchExistingPhoto505());
  $('dd500OptionsLoad').addEventListener('click',()=>void loadOptions());
  $('dd500CategorySearch').addEventListener('input',categoryFilter);
  $('dd500LinkButton').addEventListener('click',()=>void linkExisting());
  $('dd500Send').addEventListener('click',()=>{
    const candidate=$('dd500ListingId').value.trim();
    if(!state.linked&&/^[1-9]\d{0,14}$/.test(candidate))void linkExisting();
    else void send();
  });
  $('dd503Fix')?.addEventListener('click',()=>{
    const fix=etsyFixLocation503(state.assessment?.issues||[]);if(!fix)return;
    const tab=document.querySelector(`[data-editor-tab="${fix.tab}"]`);tab?.click();
    if(fix.tab==='seo')form.elements.namedItem('keywords')?.focus();
    if(fix.tab==='description')form.elements.namedItem('description')?.focus();
  });
  for(const name of ['Category','Shipping','Processing','Who','When','Weight','WeightUnit','Length','Width','Height','DimensionUnit'])
    for(const event of ['input','change'])$('dd500'+name).addEventListener(event,()=>{saveSettings();show();});
  $('dd500Supply').addEventListener('change',saveSettings);
  for(const name of ['Consent','LinkConsent','ListingId'])for(const event of ['input','change'])$('dd500'+name).addEventListener(event,()=>{
    if(name==='ListingId'){$('dd500OlderTitleRow').hidden=true;$('dd500OlderTitle').checked=false;state.claim=null;state.claimReview=null;state.photoReview=null;resetOwnerApproval();}show();});
  form.addEventListener('input',event=>{if(event.target.closest('#dd500Package'))return;state.loaded=false;resetOwnerApproval();show();});
  // Build 515: saving the local Product no longer silently runs a hidden Etsy
  // upload. The Etsy tab is the explicit place for Create or Update.
  document.addEventListener('dd:save-succeeded',event=>{
    state.loaded=false;resetOwnerApproval();$('dd500Consent').checked=false;
    if(!state.holdAfterWrite)state.attempted=false;
    saveState(event.detail?.destinations_confirmed===false?
      'Product saved; destination settings need review. No Etsy write attempted.':
      'Product saved. Open the Etsy tab and choose Create or Update when ready. No automatic Etsy write.','');
    void refresh();
  });
  document.addEventListener('dd:product-loaded',()=>void refresh());
  document.addEventListener('dd:media-inline-updated',event=>{
    if(Number(event.detail?.product_id)!==id)return;
    state.loaded=false;resetOwnerApproval();$('dd500Consent').checked=false;
    void refresh();
  });
  document.addEventListener('dd:product-channel-tags-changed',()=>{state.loaded=false;resetOwnerApproval();void refresh();});
  document.addEventListener('dd:editor-tab-opened',event=>{
    if(event.detail?.tab==='etsy'&&ready())void (async()=>{
      await refresh();
      if(!state.linked&&!state.settings&&!$('dd500ListingId').value.trim())await loadOptions();
    })();
  });
  show();if(ready())void refresh();
}
