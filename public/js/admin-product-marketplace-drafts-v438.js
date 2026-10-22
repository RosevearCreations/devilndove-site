// Build 438 — Etsy Product Editor live test + unpublished draft; separate Meta readiness.
// No provider call runs on page load. Every Etsy write requires an explicit click.
(() => {
  'use strict';
  const productId=Number(new URLSearchParams(location.search).get('product_id')||0);
  const $=id=>document.getElementById(id),etsyStatus=$('dd438EtsyStatus'),metaStatus=$('dd438MetaStatus');
  if(!etsyStatus||!window.DDAuth)return;
  const state={ready:false,working:false,taxonomy:[],fingerprint:'',existing:null};
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
  function setBusy(yes){state.working=yes;for(const id of ['dd438EtsyTest','dd438EtsyCreate','dd438EtsyRefresh']){
    const button=$(id);if(button)button.disabled=yes||(id==='dd438EtsyCreate'&&!state.ready);
  }}
  function categories(query=''){
    const select=$('dd438EtsyCategory');if(!select)return;
    const previous=select.value,needle=String(query||'').trim().toLowerCase();
    const items=state.taxonomy.filter(t=>!needle||t.name.toLowerCase().includes(needle)).slice(0,120);
    select.replaceChildren(new Option(items.length?'Choose verified Etsy category…':'No categories match; change the search',''));
    for(const t of items)select.add(new Option(t.name,String(t.id)));
    if(items.some(t=>String(t.id)===previous))select.value=previous;
    $('dd438EtsyCreate').disabled=state.working||!state.ready;
  }
  $('dd438EtsySearch')?.addEventListener('input',event=>categories(event.target.value));
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
    state.ready=false;setBusy(true);status(etsyStatus,'Checking saved Etsy connection and Product…');
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
      const name=String(verified.product?.name||'').toLowerCase();
      $('dd438EtsySearch').value=name.includes('soap')?'soap':'';
      categories($('dd438EtsySearch').value);
      const blockers=verified.blockers||[];
      state.ready=blockers.length===0;
      offerExisting(verified);
      if(state.ready){status(etsyStatus,`Live Etsy connection verified for ${verified.shop?.shop_name||verified.shop?.name||'our shop'} (CAD). Choose a category and confirm to create an unpublished draft. No listing has been created yet.`,'ok');}
      else status(etsyStatus,`Etsy connection is live, but this saved Product needs attention: ${blockers.join(', ')}. Fix and Save Product, then Test again.`,'warn');
    }catch(error){state.ready=false;status(etsyStatus,`Etsy verification stopped: ${errorText(error)}. No draft was created. If refresh is unavailable, reconnect in IT Integrations.`,'error');}
    finally{setBusy(false);}
  }
  async function create(){
    if(!state.ready||state.working)return;
    const id=Number($('dd438EtsyCategory')?.value||0),maker=$('dd438EtsyWhoMade')?.value,
      era=$('dd438EtsyWhenMade')?.value,supply=Boolean($('dd438EtsySupply')?.checked);
    if(!id){status(etsyStatus,'Select a verified Etsy category first.','warn');return;}
    if(!$('dd438EtsyConfirm')?.checked){status(etsyStatus,'Confirm that only an unpublished Etsy draft should be created.','warn');return;}
    if(document.querySelector('#productEditorForm')?.dataset.productDirty==='1'){
      status(etsyStatus,'Save Product changes before creating a remote draft.','warn');return;
    }
    setBusy(true);state.ready=false;
    status(etsyStatus,'Creating exactly ONE unpublished Etsy draft. Do not refresh or click again until a result is shown…');
    try{
      const result=await api('/api/admin/product-etsy-draft',{action:'create_draft',product_id:productId,
        taxonomy_id:id,who_made:maker,when_made:era,is_supply:supply,fingerprint:state.fingerprint,
        request_key:crypto.randomUUID(),confirm_unpublished_draft_only:true,confirm_no_automatic_retry:true});
      const link=$('dd438EtsyExisting');if(link){link.hidden=false;link.href='https://www.etsy.com/your/shops/me/listings/drafts';
        link.textContent=`Open Etsy drafts — listing #${result.listing_id}`;}
      status(etsyStatus,`Success — Etsy confirmed unpublished draft #${result.listing_id}. Local receipt recorded. No publication, automatic retry, image upload or U.S. shipping change occurred.`,'ok');
    }catch(error){status(etsyStatus,`Etsy draft was NOT confirmed: ${errorText(error)}. Do not retry until we reconcile the attempt; we keep a one-attempt safety record.`,'error');}
    finally{setBusy(false);$('dd438EtsyCreate').disabled=true;}
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
