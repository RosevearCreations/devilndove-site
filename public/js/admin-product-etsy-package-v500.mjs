/* Builds 500–501: one owner-approved Etsy package action, using existing server-side
 * at-most-once claims and provider readback. The browser never chooses a subset
 * of photos or silently creates a second listing for an existing Product. */
import {assessEtsyPackage500,verifiedEtsyPackage500} from './etsy-package-500.mjs';
import {etsyFailure503,etsyFixLocation503} from './etsy-owner-diagnostics-503.mjs';

const $=id=>document.getElementById(id);
const form=$('productEditorForm'),id=Number(new URLSearchParams(location.search).get('product_id')||0);
if(form&&$('dd500Package')&&window.DDAuth?.apiFetch){
  const state={busy:false,linked:'',loaded:false,assessment:null,readIssues:[],settings:null,attempted:false,claim:null,claimReview:null,photoReview:null,ownerReadbackReady:false,
    previewId:'',previewTitleMatches:false,images:null,lastRemoteId:'',holdAfterWrite:false,
    refreshPromise:null,syncing:false,linkReadbackHold:false};
  if(id===53){$('dd500ListingId').value='4603838854';$('dd500CandidateNote').hidden=false;
    if($('dd503OwnerNote'))$('dd503OwnerNote').hidden=false;}
  const ready=()=>id>0&&form.dataset.productAuthority==='ready'&&form.dataset.productDirty!=='1';
  const key=()=>crypto.randomUUID();
  const status=(message,hold=false)=>{const el=$('dd500Status');el.textContent=message;el.dataset.tone=hold?'hold':'ok';};
  const optionStatus=(message,hold=false)=>{const el=$('dd500OptionsStatus');el.textContent=message;el.dataset.tone=hold?'hold':'ok';};
  const saveState=(message,tone='')=>{
    const el=$('dd501SaveState');if(el){el.textContent=message;el.dataset.tone=tone;}
    const resume=$('dd501Resume');if(resume)resume.textContent=message;
  };
  function resetOwnerApproval(){state.ownerReadbackReady=false;
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
      const partial=results[0];failure.partialLink=partial.status==='fulfilled'?partial.value?.linked_listing_id:null;
      throw failure;}
    const [link,distribution,images,tags]=results.map(result=>result.value);
    if([link.product_id,distribution.product_id,images.product_id,tags.product_id].some(value=>Number(value)!==id))
      throw Error('Saved Product, images and tags do not agree on Product identity.');
    if(link.linked_listing_id&&link.saved_link_readback_confirmed!==true)
      throw Error('The saved Etsy listing ID lacks an independent D1 primary receipt. Recheck the Product ID before any Etsy update; never create a duplicate.');
    if(link.linked_listing_id&&String(images.listing_id||'')!==String(link.linked_listing_id))
      throw Error('Etsy listing ID and saved photo receipt disagree.');
    const assessment=assessEtsyPackage500(distribution,images,tags);
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
      try{const snapshot=await packageSnapshot();state.linked=String(snapshot.link.linked_listing_id||'');
        state.claim=snapshot.link.candidate_claim||null;
        if(state.linked){state.lastRemoteId='';state.linkReadbackHold=false;}
        state.readIssues=[];state.assessment=snapshot.assessment;state.images=snapshot.images;state.loaded=true;
        status(snapshot.assessment.ready?`Ready to review: all ${snapshot.assessment.count} gallery photos are included. ${state.linked?'Update Etsy #'+state.linked:'No existing Etsy link detected.'}`:
          `HOLD — ${snapshot.assessment.issues[0]||'Saved Product needs a correction.'} See each exact missing item above.`,!snapshot.assessment.ready);
        if(!state.linked&&!state.settings&&!$('dd500ListingId').value.trim())$('dd500NewSettings').open=true;
        return true;
      }catch(error){state.loaded=false;state.assessment=null;state.claim=null;
        state.readIssues=Array.isArray(error.issues)?error.issues:[error.message];
        if(error.partialLink)state.linked=String(error.partialLink);
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
  document.addEventListener('dd:save-succeeded',event=>{
    state.loaded=false;resetOwnerApproval();$('dd500Consent').checked=false;
    if(!state.holdAfterWrite)state.attempted=false;
    if(event.detail?.etsy_sync_requested===true&&event.detail?.destinations_confirmed===true&&!event.detail?.newer_edits){
      void (async()=>{await refresh();await syncAfterSave('product');})();
    }else{
      saveState(event.detail?.destinations_confirmed===false?'HOLD — Product saved but Etsy checkbox persistence was not confirmed. No Etsy write attempted.':
        'Product saved locally. Etsy sync is OFF or this Save was not authorized for Etsy.','');
      void refresh();
    }
  });
  document.addEventListener('dd:product-loaded',()=>void (async()=>{
    const resumed=consumeCreateRequest();
    await refresh();
    if(resumed)await syncAfterSave('product');
  })());
  document.addEventListener('dd:media-inline-updated',event=>{
    if(Number(event.detail?.product_id)!==id)return;
    state.loaded=false;resetOwnerApproval();$('dd500Consent').checked=false;
    void (async()=>{await refresh();if(ready())await syncAfterSave('media');})();
  });
  document.addEventListener('dd:product-channel-tags-changed',()=>{state.loaded=false;resetOwnerApproval();void refresh();});
  document.addEventListener('dd:editor-tab-opened',event=>{
    if(event.detail?.tab==='etsy'&&ready())void (async()=>{
      await refresh();
      if(!state.linked&&!state.settings&&!$('dd500ListingId').value.trim())await loadOptions();
    })();
  });
  show();if(ready())void (async()=>{
    const resumed=consumeCreateRequest();
    await refresh();
    if(resumed)await syncAfterSave('product');
  })();
}
