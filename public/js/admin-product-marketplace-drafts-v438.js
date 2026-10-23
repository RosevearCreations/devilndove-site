// Build 439 — Etsy Product Editor live connection, Canada-only profiles + unpublished draft.
// No provider call runs on page load. Every Etsy write requires an explicit click.
(() => {
  'use strict';
  const productId=Number(new URLSearchParams(location.search).get('product_id')||0);
  const $=id=>document.getElementById(id),etsyStatus=$('dd438EtsyStatus'),metaStatus=$('dd438MetaStatus');
  if(!etsyStatus||!window.DDAuth)return;
  const state={ready:false,working:false,taxonomy:[],fingerprint:'',existing:null,verifiedShippingId:0,
    connected:false,productDetails:null,shippingFailed:false,createdListingId:null,attemptFailed:false};
  const status=(el,message,tone='')=>{if(el){el.textContent=message;el.dataset.tone=tone;}};
  const read=async(response)=>{const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok){
    const error=new Error(data?.error||`Request failed (${response.status})`);
    error.code=data?.code||'';error.blockers=data?.blockers||[];error.diagnostic=data?.diagnostic||'';
    error.providerMessage=data?.provider_message||'';error.providerStatus=data?.provider_http_status||'';throw error;
  }return data;};
  const api=(path,body)=>window.DDAuth.apiFetch(path,body?{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body),cache:'no-store'}:{method:'GET',cache:'no-store'}).then(read);
  const errorText=e=>[e.message,e.providerMessage,e.providerStatus?`HTTP ${e.providerStatus}`:'',
    e.diagnostic,(e.blockers||[]).length?'Blockers: '+e.blockers.join(', '):''].filter(Boolean).join(' • ');
  const canCreate=()=>state.ready&&!state.working&&state.verifiedShippingId>0&&
    state.verifiedShippingId===Number($('dd439EtsyShipping')?.value)&&
    Number($('dd439EtsyReadiness')?.value)>0&&Number($('dd438EtsyCategory')?.value)>0&&
    Boolean($('dd439EtsyCanadaConfirm')?.checked)&&Boolean($('dd438EtsyConfirm')?.checked);
  function step(id,label,level=''){
    const node=$(id);if(!node)return;
    node.textContent=label;node.dataset.state=level;
  }
  function checklist(){
    const product=state.productDetails;
    step('dd440EtsyProductStep',product?(Number(product.price_cents)>0&&Number(product.description_length)>0&&Number(product.quantity)>0?'Saved ✓':'Needs attention'):'Not tested',
      product&&(Number(product.price_cents)<=0||Number(product.description_length)<=0||Number(product.quantity)<=0)?'hold':product?'ok':'');
    step('dd440EtsyConnectionStep',state.connected?'Connected ✓':'Not tested',state.connected?'ok':'');
    step('dd440EtsyShippingStep',state.verifiedShippingId>0?'Canada only ✓':state.shippingFailed?'HOLD — profile':'Not verified',
      state.verifiedShippingId>0?'ok':state.shippingFailed?'hold':'');
    if(state.createdListingId){step('dd440EtsyCreateStep',`Draft #${state.createdListingId} ✓`,'ok');}
    else if(state.attemptFailed){step('dd440EtsyCreateStep','Review attempt','hold');}
    else step('dd440EtsyCreateStep',canCreate()?'Ready to create':'Waiting',canCreate()?'ok':'');
  }
  function updateButtons(){
    for(const id of ['dd438EtsyTest','dd438EtsyRefresh'])if($(id))$(id).disabled=state.working;
    if($('dd439EtsyCheckShipping'))$('dd439EtsyCheckShipping').disabled=state.working||!Number($('dd439EtsyShipping')?.value);
    if($('dd438EtsyCreate'))$('dd438EtsyCreate').disabled=!canCreate();
    checklist();
  }
  function setBusy(yes){state.working=yes;updateButtons();}
  function setOptions(id,items,label){
    const select=$(id);if(!select)return;
    select.replaceChildren(new Option(items.length?label:'No Etsy profiles found — configure them in Etsy',''));
    for(const item of items)select.add(new Option(item.name,String(item.id)));
    updateButtons();
  }
  function categories(query=''){
    const select=$('dd438EtsyCategory');if(!select)return;
    const previous=select.value,needle=String(query||'').trim().toLowerCase();
    const items=state.taxonomy.filter(t=>!needle||t.name.toLowerCase().includes(needle)).slice(0,120);
    select.replaceChildren(new Option(items.length?'Choose verified Etsy category…':'No categories match; change the search',''));
    for(const t of items)select.add(new Option(t.name,String(t.id)));
    if(items.some(t=>String(t.id)===previous))select.value=previous;
    updateButtons();
  }
  $('dd438EtsySearch')?.addEventListener('input',event=>categories(event.target.value));
  $('dd438EtsyCategory')?.addEventListener('change',updateButtons);
  $('dd439EtsyReadiness')?.addEventListener('change',updateButtons);
  for(const id of ['dd439EtsyCanadaConfirm','dd438EtsyConfirm'])$(id)?.addEventListener('change',updateButtons);
  $('dd439EtsyShipping')?.addEventListener('change',()=>{
    state.verifiedShippingId=0;state.shippingFailed=false;
    status($('dd439EtsyShippingStatus'),'Shipping profile changed. Verify the new profile before creating a draft.','warn');
    updateButtons();
  });
  const friendlyBlockers=items=>(items||[]).map(value=>({
    product_description_required_max_15000:'Save a Product description (up to 15,000 characters) in the Description tab',
    positive_saved_cad_price_required:'Save a real CAD price above $0.00 in the Pricing & Stock tab',
    positive_inventory_required:'Save an available quantity of at least 1',
    product_name_required_max_140:'Save a Product name (up to 140 characters)',
    previous_etsy_remote_attempt_needs_reconciliation:'A prior Etsy attempt must be reconciled before another draft can be attempted',
    etsy_listing_already_created_for_product:'This Product already has a recorded Etsy draft'
  }[value]||value)).join(' • ');
  function offerExisting(data){
    const link=$('dd438EtsyExisting');if(!link)return;
    const id=data?.existing_listing?.listing_id;
    if(id&&/^\d+$/.test(String(id))){link.hidden=false;link.href='https://www.etsy.com/your/shops/me/listings/drafts';
      link.textContent=`Etsy draft #${id} already recorded — open Etsy drafts`;}
    else {link.hidden=true;link.removeAttribute('href');}
  }
  async function test(){
    if(!productId){status(etsyStatus,'Save the Product first, then return to the Etsy tab.','warn');return;}
    if(document.querySelector('#productEditorForm')?.dataset.productDirty==='1'){
      status(etsyStatus,'Unsaved Product changes detected. Press Save Product before testing Etsy.','warn');return;
    }
    state.ready=false;state.connected=false;state.productDetails=null;state.verifiedShippingId=0;
    state.shippingFailed=false;state.attemptFailed=false;setBusy(true);status(etsyStatus,'Checking saved Etsy connection and Product…');
    try{
      // The lifecycle diagnostics endpoint is optional: a failure there must not
      // hide the authoritative Etsy draft preflight or live-shop test.
      const oauth=await api('/api/admin/oauth-connections').catch(()=>({connections:[]}));
      const conn=(oauth.connections||[]).find(x=>x.provider_key==='etsy');
      if(conn&&['refresh_due','refresh_due_soon'].includes(conn.health)){
        status(etsyStatus,'Etsy access token is near expiry. Refreshing the already-granted connection…');
        await api('/api/admin/oauth-connections',{action:'refresh',provider:'etsy'});
      }
      const pre=await api(`/api/admin/product-etsy-draft?product_id=${productId}`);offerExisting(pre);
      if(pre.blockers.length){
        // A shop can be valid even when a Product is missing content. Test live connection separately.
        status(etsyStatus,`Stored preflight: ${pre.blockers.join(', ')}. Testing authorized shop…`,'warn');
      }
      const verified=await api('/api/admin/product-etsy-draft',{action:'test_connection',product_id:productId});
      state.fingerprint=verified.fingerprint;state.taxonomy=verified.options?.taxonomy||[];
      const saved=verified.product||{};
      state.connected=true;state.productDetails=saved;
      status($('dd439EtsyProductSummary'),`Saved Product #${saved.id||productId}: ${saved.name||'(missing name)'} • CAD $${(Number(saved.price_cents||0)/100).toFixed(2)} • ${saved.quantity||0} available • Description (${saved.description_length||0} characters): ${saved.description_preview||'(missing saved description)'}`,
        (Number(saved.price_cents)>0&&Number(saved.description_length)>0)?'ok':'warn');
      const options=verified.options||{};
      setOptions('dd439EtsyShipping',options.shipping||[],'Choose an Etsy shipping profile…');
      setOptions('dd439EtsyReadiness',options.readiness||[],'Choose an Etsy processing profile…');
      const connectionView=verified.connection||{};
      status($('dd439EtsyConnection'),`Shop: ${verified.shop?.shop_name||verified.shop?.name||'Unknown'} #${verified.shop?.shop_id||'?'} • Grant: ${connectionView.status||'unknown'} • Scope: ${(connectionView.scopes||[]).join(', ')||'not available'} • Token expiry: ${connectionView.access_expires_at||'unknown'}`,'ok');
      const name=String(verified.product?.name||'').toLowerCase();
      $('dd438EtsySearch').value=name.includes('soap')?'soap':'';
      categories($('dd438EtsySearch').value);
      const blockers=verified.blockers||[];
      state.ready=blockers.length===0&&Boolean(options.shipping?.length)&&Boolean(options.readiness?.length);
      offerExisting(verified);
      if(state.ready){status(etsyStatus,`Live Etsy connection verified for ${verified.shop?.shop_name||verified.shop?.name||'our shop'} (CAD). Select a category, shipping and processing profiles, and verify Canada-only delivery before creating an unpublished draft.`,'ok');}
      else status(etsyStatus,`Etsy connection is live, but draft creation is blocked: ${friendlyBlockers(blockers)||'Etsy shipping or processing profile unavailable'}. Fix and Save Product, then Test again.`,'warn');
    }catch(error){state.ready=false;status(etsyStatus,`Etsy verification stopped: ${errorText(error)}. No draft was created. If refresh is unavailable, reconnect in IT Integrations.`,'error');}
    finally{setBusy(false);}
  }
  $('dd439EtsyCheckShipping')?.addEventListener('click',async()=>{
    const id=Number($('dd439EtsyShipping')?.value||0);
    if(!id||state.working)return;
    state.verifiedShippingId=0;setBusy(true);
    status($('dd439EtsyShippingStatus'),'Checking the actual Etsy destinations for this shipping profile…');
    try{
      const result=await api('/api/admin/product-etsy-draft',{action:'test_shipping',product_id:productId,shipping_profile_id:id});
      if(result.shipping_profile_verified){state.verifiedShippingId=id;
        status($('dd439EtsyShippingStatus'),`Verified: ${result.shipping_review?.destinations} Canadian destination(s), with no foreign or worldwide destinations. Select the two owner confirmations below.`,'ok');}
      else {state.shippingFailed=true;status($('dd439EtsyShippingStatus'),`HOLD — ${result.shipping_review?.reason||'Profile not Canada-only'}. The Product is saved correctly; choose a Canada-only Etsy shipping profile or configure one in Etsy shipping settings. No draft was attempted.`,'warn');}
    }catch(error){state.shippingFailed=true;status($('dd439EtsyShippingStatus'),`Profile verification failed: ${errorText(error)}. No draft was attempted.`,'error');}
    finally{setBusy(false);}
  });
  async function create(){
    if(!canCreate())return;
    const id=Number($('dd438EtsyCategory')?.value||0),maker=$('dd438EtsyWhoMade')?.value,
      era=$('dd438EtsyWhenMade')?.value,supply=Boolean($('dd438EtsySupply')?.checked),
      shippingId=Number($('dd439EtsyShipping')?.value||0),readinessId=Number($('dd439EtsyReadiness')?.value||0);
    if(!id){status(etsyStatus,'Select a verified Etsy category first.','warn');return;}
    if(!$('dd438EtsyConfirm')?.checked){status(etsyStatus,'Confirm that only an unpublished Etsy draft should be created.','warn');return;}
    if(document.querySelector('#productEditorForm')?.dataset.productDirty==='1'){
      status(etsyStatus,'Save Product changes before creating a remote draft.','warn');return;
    }
    setBusy(true);state.ready=false;
    status(etsyStatus,'Creating exactly ONE unpublished Etsy draft. Do not refresh or click again until a result is shown…');
    try{
      const result=await api('/api/admin/product-etsy-draft',{action:'create_draft',product_id:productId,
        taxonomy_id:id,shipping_profile_id:shippingId,readiness_state_id:readinessId,
        who_made:maker,when_made:era,is_supply:supply,fingerprint:state.fingerprint,
        request_key:crypto.randomUUID(),confirm_unpublished_draft_only:true,confirm_no_automatic_retry:true,
        confirm_canada_only_shipping_profile:true});
      const link=$('dd438EtsyExisting');if(link){link.hidden=false;link.href='https://www.etsy.com/your/shops/me/listings/drafts';
        link.textContent=`Open Etsy drafts — listing #${result.listing_id}`;}
      state.createdListingId=result.listing_id;
      status(etsyStatus,`Success — Etsy confirmed unpublished draft #${result.listing_id}. Local receipt recorded. No publication, automatic retry, image upload or U.S. shipping change occurred.`,'ok');
    }catch(error){state.attemptFailed=true;status(etsyStatus,`Etsy draft was NOT confirmed: ${errorText(error)}. Do not retry until we reconcile the attempt; we keep a one-attempt safety record.`,'error');}
    finally{state.ready=false;setBusy(false);}
  }
  $('dd438EtsyTest')?.addEventListener('click',test);
  $('dd438EtsyRefresh')?.addEventListener('click',()=>{
    state.ready=false;setBusy(true);status(etsyStatus,'Refreshing existing Etsy grant…');
    api('/api/admin/oauth-connections',{action:'refresh',provider:'etsy'})
      .then(()=>{status(etsyStatus,'Refresh succeeded. Press Test Etsy connection to verify our shop.','ok');})
      .catch(e=>status(etsyStatus,`Refresh failed: ${errorText(e)}. Reauthorization may be needed in IT Integrations.`,'error'))
      .finally(()=>setBusy(false));
  });
  $('dd438EtsyCreate')?.addEventListener('click',create);
  $('dd438MetaTest')?.addEventListener('click',async()=>{
    if(!metaStatus)return;status(metaStatus,'Checking existing Facebook/Meta authorization records (no publication)…');
    try{const data=await api('/api/admin/oauth-connections');
      const record=(data.connections||[]).find(x=>['facebook','meta','facebook_marketplace'].includes(x.provider_key));
      status(metaStatus,record?`Provider: ${record.provider_key} • ${record.connection_status} • ${record.health}. This is OAuth status only; Marketplace listing permissions and a supported posting API still require verification. No listing was created.`:
        'No saved Facebook/Meta provider connection found. Add keys and complete the approved authorization flow in IT Integrations. Marketplace draft submission stays disabled.','warn');
    }catch(e){status(metaStatus,`Meta connection read failed: ${errorText(e)}. No Marketplace action was attempted.`,'error');}
  });
  if(!productId)status(etsyStatus,'Save Product first; external channels need its saved Product ID.','warn');
})();
