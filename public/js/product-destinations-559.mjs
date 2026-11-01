/* Build 559 — one Product, distinct destinations and honest publication states.
 * Readback never implies provider publication. No automatic provider POST. */
export const DESTINATIONS_559=Object.freeze([
  {key:'etsy',name:'Etsy',mode:'draft',url:'https://www.etsy.com/your/shops/me/tools/listings'},
  {key:'facebook_marketplace',name:'Facebook Marketplace',mode:'manual',url:'https://www.facebook.com/marketplace/create/item'},
  {key:'instagram',name:'Instagram',mode:'manual',url:'https://www.instagram.com/'},
  {key:'tiktok',name:'TikTok',mode:'manual',url:'https://www.tiktok.com/'},
  {key:'x',name:'X',mode:'manual',url:'https://x.com/'},
  {key:'facebook',name:'Facebook Pages',mode:'manual',url:'https://www.facebook.com/'},
  {key:'pinterest',name:'Pinterest',mode:'manual',url:'https://www.pinterest.com/'},
  {key:'youtube',name:'YouTube',mode:'manual',url:'https://www.youtube.com/'}
]);
const positive=x=>/^[1-9]\d{0,14}$/.test(String(x??''));
const clean=x=>String(x??'').trim();
const providerInfo=(rows,key,now)=>{
  const providers=Array.isArray(rows)?rows:[];
  const row=providers.find(x=>x.provider_key===key)||
    (['facebook','instagram'].includes(key)?providers.find(x=>x.provider_key==='meta'):null);
  if(!row||row.connection_status!=='connected')return {status:'No verified posting connection',state:'manual'};
  const expiry=row.access_expires_at?Date.parse(String(row.access_expires_at)):NaN;
  if(Number.isFinite(expiry)&&expiry<=now)return {status:'OAuth token expired — manual handoff',state:'attention'};
  return {status:'Local OAuth record only — posting not approved',state:'review'};
};
export function destinationProjection559({product,etsy,connections,intent,now=Date.now()}={}){
  const saved=positive(product?.product_id);
  const exact=etsy?.saved_link_readback_confirmed===true&&positive(etsy?.listing_id)&&
    positive(etsy?.receipt_id)&&!etsy?.conflict;
  const blocked=Boolean(etsy?.conflict||etsy?.ambiguous);
  const rows=DESTINATIONS_559.map(channel=>{
    if(channel.key==='etsy')return {...channel,
      connection:blocked?'Conflicting saved Etsy claim — review required':exact?'Unique saved Product link':'No verified draft link',
      state:blocked?'hold':exact?'linked':'review',remote_id:exact?clean(etsy.listing_id):null,
      remote_state:'Live Etsy status not checked on this dashboard',
      draft_update_allowed:exact&&!blocked,publication_available:false,
      instruction:exact?'Open the existing draft tools to verify the live Etsy listing before a separate draft update.':
        'Verify and connect the exact existing Etsy draft. Do not create a duplicate.'};
    const key=channel.key==='facebook_marketplace'?'facebook':channel.key;
    const auth=providerInfo(connections,key,now);
    return {...channel,connection:channel.key==='facebook_marketplace'?'Marketplace API posting is not authorized':auth.status,
      state:channel.key==='facebook_marketplace'?'manual':auth.state,remote_id:null,
      remote_state:'No verified external post or listing',draft_update_allowed:false,publication_available:false,
      instruction:'Copy saved Product text, choose approved original photos and complete the review in the destination.'};
  });
  return {product_id:saved?Number(product.product_id):null,product_name:saved?clean(product.name):'',
    product_status:saved?clean(product.status):'',saved,
    saved_intent:{etsy:intent?.etsy===true,facebook:intent?.facebook===true},
    destinations:rows,provider_contacted:false,publication_performed:false};
}

export function renderUnifiedDestinations559({form,productId,caption}={}){
  const panel=document.querySelector('[data-editor-panel="publishing"]');
  if(!panel||!form)return;
  const mount=document.createElement('section');mount.className='dd559-board';mount.id='dd559Dashboard';
  mount.setAttribute('aria-labelledby','dd559Title');
  mount.innerHTML=`
    <div class="dd559-board-head"><div><h2 id="dd559Title">Where do we want to share this Product?</h2><p class="small">Save once here, then choose what to do in each destination. An external post is never automatic.</p></div><button class="btn" id="dd559Refresh" type="button">Refresh statuses</button></div>
    <div class="dd559-steps" aria-label="Four separate actions"><div><span>1</span><strong>Save Product</strong><small>Our own store record</small></div><div><span>2</span><strong>Update a draft</strong><small>Etsy, only after verification</small></div><div><span>3</span><strong>Prepare a handoff</strong><small>Copy approved content</small></div><div><span>4</span><strong>Publish externally</strong><small>Review and publish on that site</small></div></div>
    <p id="dd559Summary" class="dd559-summary" role="status" aria-live="polite">Open Destinations to read the saved Product status. No channel has been contacted.</p>
    <div class="dd559-grid" id="dd559Grid" aria-label="Individual destination statuses"></div>
    <details class="dd560-meta" id="dd560Meta"><summary>Meta account &amp; approved photo checks <small>(Facebook Marketplace, Pages, Instagram)</small></summary><div class="dd560-meta-inner"><p class="small">Read saved connections and approved Product originals. This never contacts Meta or publishes a post.</p><button class="btn" id="dd560Refresh" type="button">Check Meta handoff readiness</button><p id="dd560Status" role="status" aria-live="polite">Choose Check to review current saved evidence.</p><div id="dd560Results"></div></div></details>
    <details class="dd559-more" id="dd559More"><summary>More destinations: Pinterest, YouTube</summary><div class="dd559-grid" id="dd559MoreGrid"></div></details>
    <div class="dd559-handoff" id="dd559Handoff" hidden><label for="dd559Caption">Prepared text — review before posting</label><textarea class="input" id="dd559Caption" rows="7" readonly></textarea><p class="small" id="dd559HandoffStatus" role="status" aria-live="polite"></p><button class="btn" id="dd559CopyAgain" type="button">Copy text</button></div>`;
  const heading=panel.querySelector('.dd540-section-head');if(heading)heading.after(mount);else panel.prepend(mount);
  const byId=id=>document.getElementById(id);
  const remote=Object.create(null);
  let loading=false,loaded=false,latest=null;
  const saved=()=>productId>0&&form.dataset.productAuthority==='ready'&&form.dataset.productDirty!=='1';
  const setStatus=message=>{byId('dd559Summary').textContent=message;};
  const fields=name=>clean(form.elements.namedItem(name)?.value);
  const makeButton=(text,action,{disabled=false,primary=false}={})=>{
    const btn=document.createElement('button');btn.type='button';btn.textContent=text;
    btn.className=primary?'btn primary':'btn';btn.dataset.dd559Action=action;btn.disabled=disabled;return btn;
  };
  function card(row){
    const article=document.createElement('article');article.className='dd559-card';article.dataset.channel=row.key;
    const head=document.createElement('div');head.className='dd559-card-head';
    const name=document.createElement('h3');name.textContent=row.name;
    const badge=document.createElement('span');badge.className='dd559-badge';badge.dataset.state=row.state;
    badge.textContent=row.key==='etsy'&&row.remote_id?'Draft linked':row.state==='hold'?'HOLD':row.mode==='manual'?'Manual handoff':'Verify draft';
    head.append(name,badge);
    const connection=document.createElement('p');connection.className='dd559-connection';connection.textContent=row.connection;
    const ref=document.createElement('p');ref.className='dd559-remote';
    ref.textContent=row.remote_id?`Saved remote listing ID: #${row.remote_id} (live status not checked)`:'Remote post/listing ID: none confirmed';
    const note=document.createElement('p');note.className='small';note.textContent=row.instruction;
    const actions=document.createElement('div');actions.className='dd559-actions';
    if(row.key==='etsy'){
      actions.append(makeButton('Review existing Etsy draft','etsy-review'));
      actions.append(makeButton('Review draft update','etsy-update',{disabled:!saved()||!row.draft_update_allowed,primary:true}));
    }else{
      actions.append(makeButton('Prepare manual handoff','copy:'+row.key,{disabled:!saved()}));
      if(['facebook_marketplace','facebook','instagram'].includes(row.key))actions.append(makeButton('Check Meta readiness','meta-review'));
      actions.append(makeButton('View Product photos','view-photos'));
      const link=document.createElement('a');link.className='btn';link.href=row.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=`Open ${row.name}`;
      actions.append(link);
    }
    article.append(head,connection,ref,note,actions);return article;
  }
  function render(){
    const rows=latest?.destinations||destinationProjection559({product:{product_id:productId,name:fields('name')}}).destinations;
    const main=byId('dd559Grid'),more=byId('dd559MoreGrid');main.replaceChildren();more.replaceChildren();
    const order=['etsy','facebook_marketplace','facebook','instagram','tiktok','x','pinterest','youtube'];
    for(const row of [...rows].sort((a,b)=>order.indexOf(a.key)-order.indexOf(b.key))){
      remote[row.key]=row;const target=['pinterest','youtube'].includes(row.key)?more:main;target.append(card(row));
    }
    if(!saved())setStatus('Save Product first to use its latest description and price. No external destination was contacted.');
    else if(loaded)setStatus(`Saved Product #${productId} · ${latest.product_name||fields('name')}. Destination records are local readback only; remote posting is not verified.`);
  }
  async function refresh(){
    if(loading)return;
    if(!productId||form.dataset.productAuthority!=='ready'){setStatus('Wait until the saved Product is loaded. No external write was attempted.');return;}
    loading=true;byId('dd559Refresh').disabled=true;setStatus('Reading saved destination records — no provider contacted…');
    try{
      if(!window.DDAuth?.apiFetch)throw Error('Admin session is not available.');
      const response=await window.DDAuth.apiFetch(`/api/admin/product-destinations-559?product_id=${productId}`,{method:'GET',cache:'no-store'});
      const data=await response.json();
      if(!response.ok||data?.ok!==true||Number(data.product_id)!==productId)throw Error(data?.error||'Saved destination readback unavailable.');
      latest=data;loaded=true;render();
    }catch(error){loaded=false;latest=null;render();setStatus(`Destination readback unavailable: ${error.message}. No channel was contacted or updated.`);}
    finally{loading=false;byId('dd559Refresh').disabled=false;}
  }
  function showEtsy(){const details=byId('dd559EtsyTools');if(details){details.open=true;details.scrollIntoView({behavior:'smooth',block:'start'});}else setStatus('The existing Etsy draft controls are unavailable. Nothing was sent.');}
  let metaLoading=false,metaLoaded=false;
  const metaStatus=message=>{byId('dd560Status').textContent=message;};
  function drawMeta(data){
    const area=byId('dd560Results');area.replaceChildren();
    const count=document.createElement('p');count.className='dd560-result-summary';
    count.textContent=`${data.approved_photo_count} of ${data.reviewed_photo_count} original photos cleared for cross-channel handoff. No Meta post created.`;
    area.append(count);
    for(const destination of data.destinations||[]){
      const section=document.createElement('section');section.className='dd560-destination';
      const title=document.createElement('h3');title.textContent=destination.name;
      const status=document.createElement('p');status.className='dd560-manual-state';
      status.textContent=destination.handoff_ready?'Manual handoff ready · automatic posting unavailable':'Manual handoff needs review · automatic posting unavailable';
      const steps=document.createElement('ol');for(const item of destination.steps||[]){const li=document.createElement('li');li.textContent=item;steps.append(li);}
      const checks=document.createElement('ul');checks.className='dd560-blockers';
      for(const issue of destination.blockers||[]){const li=document.createElement('li');li.textContent=issue;checks.append(li);}
      section.append(title,status,steps,checks);area.append(section);
    }
    const images=document.createElement('div');images.className='dd560-photos';
    const label=document.createElement('h3');label.textContent='Approved Product originals';images.append(label);
    for(const photo of data.photos||[]){
      const link=document.createElement('a');link.href=photo.image_url;link.target='_blank';link.rel='noopener noreferrer';
      link.textContent=`Open original photo #${photo.product_image_id} · ${photo.width_px} × ${photo.height_px}`;
      const alt=document.createElement('small');alt.textContent=photo.alt_text;
      const item=document.createElement('div');item.append(link,alt);images.append(item);
    }
    if(!data.photos?.length){const none=document.createElement('p');none.textContent='No cross-channel-approved original photographs to open. Review approvals in the Media tab.';images.append(none);}
    area.append(images);
  }
  async function refreshMeta(){
    if(metaLoading)return;
    if(!saved()){metaStatus('Save the latest Product first. No Meta request made.');return;}
    metaLoading=true;byId('dd560Refresh').disabled=true;metaStatus('Checking local Meta connection and photo approval records…');
    try{
      if(!window.DDAuth?.apiFetch)throw Error('Admin session unavailable.');
      const response=await window.DDAuth.apiFetch(`/api/admin/product-meta-readiness-560?product_id=${productId}`,{method:'GET',cache:'no-store'});
      const data=await response.json();
      if(!response.ok||data?.ok!==true||Number(data.product_id)!==productId)throw Error(data?.error||'Local review unavailable.');
      drawMeta(data);metaLoaded=true;
      metaStatus('Local check complete. Review approved originals and finish posting on the destination site. No provider contacted.');
    }catch(error){metaLoaded=false;byId('dd560Results').replaceChildren();metaStatus(`Meta readiness unavailable: ${error.message}. No provider contacted or updated.`);}
    finally{metaLoading=false;byId('dd560Refresh').disabled=false;}
  }
  async function copyText(key){
    if(!saved()){setStatus('Save Product first. No manual handoff prepared.');return;}
    try{
      const text=caption({name:fields('name'),price:fields('price'),description:fields('description')||fields('short_description'),keywords:fields('keywords')});
      byId('dd559Caption').value=text;byId('dd559Handoff').hidden=false;
      byId('dd559HandoffStatus').textContent=`Prepared for ${remote[key]?.name||'the selected destination'}. Upload approved Product originals there manually. Nothing was published.`;
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);byId('dd559HandoffStatus').textContent+=' Text copied.';}
      else{byId('dd559Caption').focus();byId('dd559Caption').select();}
    }catch(error){setStatus(`Manual handoff not prepared: ${error.message}`);}
  }
  mount.addEventListener('click',event=>{
    const action=event.target.closest('[data-dd559-action]')?.dataset.dd559Action;
    if(!action)return;
    if(action==='etsy-review'){showEtsy();return;}
    if(action==='etsy-update'){
      if(!saved()||!remote.etsy?.draft_update_allowed){setStatus('Save Product and verify its exact existing Etsy listing before any update.');return;}
      showEtsy();const review=panel.querySelector('.dd543-more-checks'),update=byId('dd540UpdateDraft');
      if(review)review.open=true;
      if(update)update.focus();
      setStatus('The verified-draft controls are open for review. Choose their separate Update existing Etsy draft action only after the live draft checks pass. Nothing has been sent.');
      return;
    }
    if(action==='view-photos'){document.querySelector('.dd557-steps [data-editor-tab="media"]')?.click();return;}
    if(action==='meta-review'){
      const details=byId('dd560Meta');details.open=true;details.scrollIntoView({behavior:'smooth',block:'nearest'});
      if(!metaLoaded)void refreshMeta();return;
    }
    if(action.startsWith('copy:'))void copyText(action.slice(5));
  });
  byId('dd560Refresh').addEventListener('click',()=>void refreshMeta());
  byId('dd559CopyAgain').addEventListener('click',()=>{
    const text=byId('dd559Caption').value;if(!text)return;
    if(navigator.clipboard?.writeText)void navigator.clipboard.writeText(text).then(()=>{byId('dd559HandoffStatus').textContent='Text copied. Nothing was posted.';}).catch(()=>{byId('dd559HandoffStatus').textContent='Select and copy the prepared text manually.';});
    else{byId('dd559Caption').focus();byId('dd559Caption').select();}
  });
  byId('dd559Refresh').addEventListener('click',()=>void refresh());
  const maybeLoad=event=>{if(event?.detail?.tab==='publishing'&&!loaded)void refresh();};
  document.addEventListener('dd:editor-tab-opened',maybeLoad);
  document.addEventListener('dd:product-loaded',()=>{render();if(!panel.hidden&&!loaded)void refresh();});
  document.addEventListener('dd:save-succeeded',event=>{if(Number(event.detail?.product_id)===productId){
    loaded=false;metaLoaded=false;byId('dd560Results').replaceChildren();metaStatus('Product changed. Check current Meta and photo evidence again.');void refresh();
  }});
  document.addEventListener('dd:etsy-existing-draft-linked',()=>{loaded=false;void refresh();});
  const changed=()=>{
    if(metaLoaded){metaLoaded=false;byId('dd560Results').replaceChildren();metaStatus('Product fields changed. Save first, then check Meta and photo evidence again.');}
    render();
  };
  form.addEventListener('input',changed);form.addEventListener('change',changed);
  render();
  if(new URLSearchParams(location.search).get('tab')==='publishing')void refresh();
}
