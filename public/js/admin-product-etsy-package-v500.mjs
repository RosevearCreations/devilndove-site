/* Build 500: one owner-approved Etsy package action, using existing server-side
 * at-most-once claims and provider readback. The browser never chooses a subset
 * of photos or silently creates a second listing for an existing Product. */
import {assessEtsyPackage500,verifiedEtsyPackage500} from './etsy-package-500.mjs';

const $=id=>document.getElementById(id);
const form=$('productEditorForm'),id=Number(new URLSearchParams(location.search).get('product_id')||0);
if(form&&$('dd500Package')&&window.DDAuth?.apiFetch){
  const state={busy:false,linked:'',loaded:false,assessment:null,settings:null,attempted:false,
    previewId:'',previewTitleMatches:false,images:null,lastRemoteId:''};
  if(id===53){$('dd500ListingId').value='4603838854';$('dd500CandidateNote').hidden=false;}
  const ready=()=>id>0&&form.dataset.productAuthority==='ready'&&form.dataset.productDirty!=='1';
  const key=()=>crypto.randomUUID();
  const status=(message,hold=false)=>{const el=$('dd500Status');el.textContent=message;el.dataset.tone=hold?'hold':'ok';};
  const optionStatus=(message,hold=false)=>{const el=$('dd500OptionsStatus');el.textContent=message;el.dataset.tone=hold?'hold':'ok';};
  async function api(path,body){
    const response=await window.DDAuth.apiFetch(path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'}:{method:'GET',cache:'no-store'});
    const value=await response.json().catch(()=>null);
    if(!response.ok||!value?.ok){const failure=Error(value?.error||`Request failed (HTTP ${response.status}).`);
      failure.listing_id=value?.listing_id;throw failure;}
    return value;
  }
  function check(message){const li=document.createElement('li');li.textContent=message;$('dd500Checklist').append(li);}
  function show(){
    const linked=Boolean(state.linked);
    $('dd500Identity').textContent=linked?`Product #${id} is linked to Etsy draft #${state.linked}. Changes use this same listing ID.`:
      state.lastRemoteId?`HOLD: Etsy returned listing #${state.lastRemoteId}, but Product #${id}'s saved link is unconfirmed. Inspect Etsy before any new attempt.`:
      `Product #${id}: no Etsy listing ID is linked yet. If we already made this draft, link its actual ID before creating another.`;
    $('dd500Open').href=linked?`https://www.etsy.com/your/shops/me/listing-editor/edit/${state.linked}`:
      'https://www.etsy.com/your/shops/me/listings/drafts';
    $('dd500Open').textContent=linked?`Open Etsy listing #${state.linked}`:'Open Etsy Drafts';
    $('dd500Link').hidden=linked;
    $('dd500NewSettings').hidden=linked;
    const send=$('dd500Send');send.textContent=linked?'Update this Etsy listing + all photos':'Create complete Etsy draft + all photos';
    send.disabled=state.busy||state.attempted||!ready()||!state.loaded||!state.assessment?.ready||!$('dd500Consent').checked||
      (!linked&&(!state.settings||!newSettingsReady()||Boolean($('dd500ListingId').value.trim())));
    $('dd500Refresh').disabled=state.busy;
    $('dd500OptionsLoad').disabled=state.busy;
    $('dd500LinkButton').disabled=state.busy||!ready()||!/^[1-9]\d{0,14}$/.test($('dd500ListingId').value.trim())||!$('dd500LinkConsent').checked;
    $('dd500Checklist').replaceChildren();
    if(!ready())check('Save the Product and wait for its saved fields to load.');
    if(state.assessment){
      check(`${state.assessment.count} gallery photo(s): ${state.assessment.transferred} confirmed on Etsy; ${state.assessment.pending.length} to transfer.`);
      check('Etsy will receive all eligible Product originals, not an image selection made here.');
      for(const issue of state.assessment.issues)check('HOLD — '+issue);
    }else check('Read the saved gallery and Etsy receipts to confirm the complete package.');
    if(id===53&&state.assessment&&JSON.stringify([...state.assessment.image_ids].sort((a,b)=>a-b))!==JSON.stringify([344,345,346]))
      check('Product #53 must be reviewed: expected original photo IDs #344–346 before the authorized three-photo transfer.');
    check(linked?`Future updates target only Etsy listing #${state.linked}; no duplicate listing will be created.`:
      'For a new listing, complete the one-time category, Canadian shipping and parcel details, then use one Create button.');
    check('Store: same saved Product • Etsy: verified draft transfer • Facebook Marketplace: manual preparation only.');
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
    const [link,distribution,images,tags]=await Promise.all([
      api(`/api/admin/product-etsy-existing-draft?product_id=${id}`),
      api(`/api/admin/product-distribution-406?product_id=${id}&channel=etsy`),
      api(`/api/admin/product-etsy-images?product_id=${id}`),
      api(`/api/admin/product-etsy-tags?product_id=${id}`)]);
    if([link.product_id,distribution.product_id,images.product_id,tags.product_id].some(value=>Number(value)!==id))
      throw Error('Saved Product, images and tags do not agree on Product identity.');
    if(link.linked_listing_id&&String(images.listing_id||'')!==String(link.linked_listing_id))
      throw Error('Etsy listing ID and saved photo receipt disagree.');
    const assessment=assessEtsyPackage500(distribution,images,tags);
    if(id===53&&JSON.stringify([...assessment.image_ids].sort((a,b)=>a-b))!==JSON.stringify([344,345,346]))
      assessment.issues.push('Product #53 photo IDs differ from the three originals #344–346; inspect before transfer.');
    assessment.ready=assessment.issues.length===0;
    return {link,images,tags,assessment};
  }
  async function refresh(){if(state.busy||!ready())return;
    state.busy=true;show();status('Reading the saved Product ↔ Etsy ID and every gallery image (no provider write)…');
    try{const snapshot=await packageSnapshot();state.linked=String(snapshot.link.linked_listing_id||'');
      if(state.linked)state.lastRemoteId='';
      state.assessment=snapshot.assessment;state.images=snapshot.images;state.loaded=true;
      status(snapshot.assessment.ready?`Ready to review: all ${snapshot.assessment.count} gallery photos are included. ${state.linked?'Update Etsy #'+state.linked:'No existing Etsy link detected.'}`:
        `HOLD — ${snapshot.assessment.issues.length} package requirement(s) need attention. See the list above.`,!snapshot.assessment.ready);
      if(!state.linked&&!state.settings)$('dd500NewSettings').open=true;
    }catch(error){state.loaded=false;state.assessment=null;status('HOLD — '+error.message,true);}
    finally{state.busy=false;show();}
  }
  async function linkExisting(){if(!ready()||state.busy||state.linked)return;
    const listingId=$('dd500ListingId').value.trim();if(!/^[1-9]\d{0,14}$/.test(listingId)||!$('dd500LinkConsent').checked)return;
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
      if(!result.linked||String(result.listing_id)!==listingId)throw Error('Confirmed Etsy listing ID was not saved.');
      const saved=await api(`/api/admin/product-etsy-existing-draft?product_id=${id}`);
      if(String(saved.linked_listing_id)!==listingId)throw Error('Etsy listing ID was not confirmed by the saved Product readback.');
      state.linked=listingId;state.settings=null;$('dd500Consent').checked=false;
      document.dispatchEvent(new CustomEvent('dd:etsy-existing-draft-linked',{detail:{product_id:id,listing_id:listingId}}));
      status(`Verified and saved Etsy listing #${listingId} against Product #${id}. No new listing created. Review the package, then click Update.`);
    }catch(error){status('HOLD — '+error.message,true);}
    finally{state.busy=false;show();if(state.linked)void refresh();}
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
  async function send(){
    if(state.busy||state.attempted||!ready()||!state.assessment?.ready||!$('dd500Consent').checked||!globalThis.crypto?.randomUUID)return;
    const existing=Boolean(state.linked),mode=existing?'existing':'new';
    if(!existing&&(!state.settings||!newSettingsReady()||$('dd500ListingId').value.trim()))return;
    state.busy=true;show();status(`Rechecking all Product photos and Etsy listing ID before one ${mode} package action…`);
    let writeStarted=false;
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
      $('dd497ChannelRemote')?.click();
    }catch(error){if(error.listing_id)state.lastRemoteId=String(error.listing_id);
      status(`HOLD — ${error.message}${state.lastRemoteId?' Etsy listing ID: #'+state.lastRemoteId+'.':''}${writeStarted?' A provider action may have been attempted; inspect Etsy and audit receipts before trying again.':' No Etsy provider write was sent.'}`,true);
      $('dd500Legacy').open=true;
    }finally{state.busy=false;show();}
  }
  $('dd500Refresh').addEventListener('click',()=>void refresh());
  $('dd500OptionsLoad').addEventListener('click',()=>void loadOptions());
  $('dd500CategorySearch').addEventListener('input',categoryFilter);
  $('dd500LinkButton').addEventListener('click',()=>void linkExisting());
  $('dd500Send').addEventListener('click',()=>void send());
  for(const name of ['Category','Shipping','Processing','Who','When','Weight','WeightUnit','Length','Width','Height','DimensionUnit'])
    for(const event of ['input','change'])$('dd500'+name).addEventListener(event,()=>{saveSettings();show();});
  $('dd500Supply').addEventListener('change',saveSettings);
  for(const name of ['Consent','LinkConsent','ListingId'])for(const event of ['input','change'])$('dd500'+name).addEventListener(event,()=>{
    if(name==='ListingId'){$('dd500OlderTitleRow').hidden=true;$('dd500OlderTitle').checked=false;}show();});
  form.addEventListener('input',event=>{if(event.target.closest('#dd500Package'))return;state.loaded=false;show();});
  document.addEventListener('dd:save-succeeded',()=>{state.attempted=false;state.loaded=false;$('dd500Consent').checked=false;void refresh();});
  document.addEventListener('dd:product-loaded',()=>void refresh());
  document.addEventListener('dd:media-inline-updated',()=>{state.loaded=false;$('dd500Consent').checked=false;void refresh();});
  document.addEventListener('dd:product-channel-tags-changed',()=>{state.loaded=false;void refresh();});
  document.addEventListener('dd:editor-tab-opened',event=>{
    if(event.detail?.tab==='etsy'&&ready())void (async()=>{await refresh();if(!state.linked&&!state.settings)await loadOptions();})();
  });
  show();if(ready())void refresh();
}
