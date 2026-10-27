// Release 467 Build 175 — stable single-Product editor with canonical-gallery-only Media reads and zero-introspection saves.
// Startup authority remains one Product detail request. Browser handoff is display-only and
// never enables Save until authoritative Product detail has loaded. QA never runs on startup.
(() => {
  'use strict';
  const form=document.getElementById('productEditorForm'),status=document.getElementById('productEditorStatus'),title=document.getElementById('productEditorTitle'),identity=document.getElementById('productEditorIdentity');
  const mediaStatus=document.getElementById('productEditorMediaStatus'),mediaStrip=document.getElementById('productEditorMediaStrip'),saveButton=document.getElementById('productEditorSave');
  const qaStatus=document.getElementById('productEditorQaStatus'),qaResults=document.getElementById('productEditorQaResults'),qaRun=document.getElementById('productEditorQaRun');
  if(!form||!status||!window.DDAuth)return;
  const params=new URLSearchParams(location.search);const rawId=Number(params.get('product_id')||0);const state={productId:Number.isInteger(rawId)&&rawId>0?rawId:0,product:null,inFlight:false,quotaStop:false,saveNeedsReview:false,mediaLoaded:false,mediaLoading:false,images:[],authorityLoaded:false,qaRunning:false,qaData:null};
  const field=(name)=>form.elements.namedItem(name);const set=(name,value)=>{const el=field(name);if(el){
    const desired=value==null?'':String(value);
    if(el.tagName==='SELECT'&&desired&&![...el.options].some(option=>option.value===desired))el.add(new Option(desired+' (current)',desired));
    el.value=desired;
  }};const get=(name)=>String(field(name)?.value??'').trim();
  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(ch)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
  const setStatus=(message,tone='')=>{status.textContent=message;status.dataset.tone=tone;status.hidden=!message;};
  const readJson=async(response,fallback)=>window.DDAuth.readApiJson(response,{fallbackMessage:fallback||'Product request failed.'});
  const incident=(error,operation='load')=>window.DDRecovery468?.classify(error,operation)||{category:'review',guidance:String(error?.message||'Request failed.'),temporary:false,uncertainWrite:false};
  const quota=(error)=>['d1_503','worker_1102'].includes(incident(error).category);
  const incidentMessage=(error,operation='load')=>{const result=incident(error,operation);return `${result.guidance}${['d1_503','worker_1102'].includes(result.category)?' Automatic retries are stopped.':''}${result.cloudflareRay?` Cloudflare reference ${result.cloudflareRay}.`:''}`;};
  const rowsText=(data)=>Number.isFinite(Number(data?.d1_rows_read))?` D1 rows read: ${Number(data.d1_rows_read)}.`:'';
  const cents=(value)=>{const v=String(value??'').trim();if(!/^[0-9]+(?:\.[0-9]{1,2})?$/.test(v))throw new Error('Enter a valid CAD price with no more than two decimal places (for example 8.00). Nothing was saved.');const n=Number(v),minor=Math.round(n*100);if(!Number.isSafeInteger(minor)||minor<0)throw new Error('CAD price is out of range; nothing was saved.');return minor;};
  // Build 388: SEO suggestions are in-browser only, and never replace hand-edited SEO.
  const seoKeys=['meta_title','meta_description','h1_override','og_title','og_description'];
  const autoSeo=new Map();
  const seoSuggestion=()=>{
    const name=get('name');
    const raw=get('short_description')||get('description');
    const desc=raw.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
    return {meta_title:name.slice(0,70),meta_description:desc.slice(0,180),
      h1_override:name.slice(0,120),og_title:name.slice(0,160),og_description:desc.slice(0,200)};
  };
  function syncSeo(fromLoad=false){
    const suggestions=seoSuggestion();
    for(const key of seoKeys){
      const el=field(key);if(!el)continue;
      const old=autoSeo.get(key),current=String(el.value||'').trim();
      if(!current||old!==undefined&&current===old){
        if(current!==suggestions[key])el.value=suggestions[key];
        autoSeo.set(key,suggestions[key]);
      }else if(fromLoad){autoSeo.delete(key);}
    }
  }
  let baseline='',leavingAfterSave=false;
  const fingerprint=()=>JSON.stringify([...form.elements].filter(el=>el.name&&!['button','submit','reset','file'].includes(el.type)).map(el=>[el.name,el.value]));
  const markClean=()=>{baseline=fingerprint();form.dataset.productDirty='0';};
  function refreshDirty(){form.dataset.productDirty=baseline&&fingerprint()!==baseline?'1':'0';}
  // Build 443: local browser-session recovery, never an unsanctioned server autosave.
  const recoveryKey=state.productId?`dnd:product-editor:recovery:443:${state.productId}`:null;
  const recoveryBox=document.getElementById('dd443Recovery');let pendingRecovery=null;
  function clearRecovery(){if(recoveryKey)try{sessionStorage.removeItem(recoveryKey);}catch{}
    pendingRecovery=null;if(recoveryBox)recoveryBox.hidden=true;}
  function snapshotEdits(){if(!recoveryKey||!baseline)return;
    try{
      if(form.dataset.productDirty!=='1')return;
      const values={};for(const el of form.elements){if(el.name&&el.type!=='file'&&!el.disabled)values[el.name]=el.value;}
      sessionStorage.setItem(recoveryKey,JSON.stringify({version:443,product_id:state.productId,
        saved_at:Date.now(),baseline,values}));
    }catch{/* Storage can be blocked; never interrupt Product editing. */}
  }
  function offerRecovery(){if(!recoveryKey||!recoveryBox)return;
    let candidate=null;try{candidate=JSON.parse(sessionStorage.getItem(recoveryKey)||'null');}catch{}
    if(candidate?.version!==443||candidate.product_id!==state.productId||
      !candidate.values||Date.now()-candidate.saved_at>12*60*60*1000){clearRecovery();return;}
    pendingRecovery=candidate;recoveryBox.hidden=false;
    const same=candidate.baseline===baseline;
    const notice=document.getElementById('dd443RecoveryStatus');
    if(notice)notice.textContent=same?'This browser has edits we did not save. Restore and review them, or discard the temporary copy.':
      'The saved Product changed since this browser copy. Restoring could overwrite newer work; compare every field before saving.';
  }
  document.getElementById('dd443RecoveryRestore')?.addEventListener('click',()=>{
    if(!pendingRecovery||!state.authorityLoaded)return;
    if(pendingRecovery.baseline!==baseline&&!window.confirm('Saved Product data has changed since these edits. Restore the old browser copy for careful review?'))return;
    for(const [name,value] of Object.entries(pendingRecovery.values)){
      const el=field(name);if(!el||el.type==='file')continue;
      if(el.tagName==='SELECT'&&value&&![...el.options].some(option=>option.value===value))el.add(new Option(value+' (recovered)',value));
      el.value=String(value??'');
    }
    refreshDirty();if(recoveryBox)recoveryBox.hidden=true;
    setStatus('Unsaved browser edits restored for review. Press Save Product only when the fields are correct. No server or marketplace write occurred.','warn');
  });
  document.getElementById('dd443RecoveryDiscard')?.addEventListener('click',()=>{
    clearRecovery();setStatus('Temporary browser copy discarded. Our saved Product is unchanged.','ok');
  });
  form.addEventListener('input',event=>{
    if(seoKeys.includes(event.target.name))autoSeo.delete(event.target.name);
    if(['name','short_description','description'].includes(event.target.name))syncSeo();
    if(saveButton&&saveButton.textContent==='Saved ✓')saveButton.textContent='Save Product';
    refreshDirty();snapshotEdits();
  });
  form.addEventListener('change',()=>{refreshDirty();snapshotEdits();});
  window.addEventListener('beforeunload',event=>{
    snapshotEdits();
    if(leavingAfterSave||form.dataset.productDirty!=='1')return;
    event.preventDefault();event.returnValue='';
  });
  // Build389: load bounded configured dropdown values only on operator focus, not on startup.
  const optionKeys=['product_category','shipping_code','tax_class_id'];
  let optionsLoading=false,optionsLoaded=false,optionsError=false;
  const baseChoices={product_category:['Jewelry','Earrings','Rings','Necklaces','Bracelets','Pendants','Charms','Accessories','Candles','Home Decor','Artwork','Collectibles','Craft Supplies','Tools','Other'],shipping_code:['standard','tracked','letter_mail','local_pickup','oversize','digital_delivery']};
  function selectOptions(name,entries){
    const select=field(name);if(!select)return;
    const original=String(select.value||'').trim();
    const options=[...new Set([...entries,original].filter(Boolean))];
    select.replaceChildren(new Option(name==='product_category'?'Choose category…':'Choose shipping code (optional)',''));
    options.forEach(value=>select.add(new Option(value,value)));
    select.value=original;
  }
  async function loadOptions(){
    if(optionsLoading||optionsLoaded||optionsError)return;
    optionsLoading=true;
    try{
      const response=await window.DDAuth.apiFetch('/api/admin/product-editor-options',{method:'GET',cache:'no-store'});
      const data=await readJson(response,'Could not load configured Product choices');
      for(const name of ['product_category','shipping_code'])selectOptions(name,Array.isArray(data[name==='product_category'?'categories':'shipping_codes'])?data[name==='product_category'?'categories':'shipping_codes']:baseChoices[name]);
      const el=field('tax_class_id');if(el){
        const original=String(el.value||'');
        el.replaceChildren(new Option('Default / no assigned class',''));
        for(const tax of data.tax_classes||[]){if(Number(tax.tax_class_id)>0)el.add(new Option(String(tax.name)+(tax.is_active?'':' (inactive)')+' • '+String(tax.code),String(tax.tax_class_id)));}
        if(original&&![...el.options].some(o=>o.value===original))el.add(new Option('Existing tax class #'+original,original));
        el.value=original;
      }
      optionsLoaded=true;
    }catch(error){optionsError=true;setStatus('Dropdown options could not load; existing saved choices are retained. Retry load before changing category, shipping or tax class: '+error.message,'warn');}
    finally{optionsLoading=false;}
  }
  form.addEventListener('focusin',event=>{if(optionKeys.includes(event.target.name))loadOptions();});
  const moneyFields=['price','compare_at_price'];
  function normalizeMoney(name){const el=field(name);if(!el||!el.value.trim())return;const n=Number(el.value);if(Number.isFinite(n)&&n>=0&&Math.abs(n*100-Math.round(n*100))<1e-7){el.value=n.toFixed(2);refreshDirty();}}
  moneyFields.forEach(name=>field(name)?.addEventListener('blur',()=>normalizeMoney(name)));
  const MEDIA_PLACEHOLDER='/assets/product-image-recovery-placeholder.svg';
  function mediaCandidates(raw){
    const value=String(raw||'').trim();if(!value)return [MEDIA_PLACEHOLDER];
    try{
      const url=new URL(value,location.origin),list=[];
      if(url.pathname==='/api/product-media'){const key=String(url.searchParams.get('key')||'').trim();if(key)list.push(`/media/product?key=${encodeURIComponent(key)}&admin_recovery=1`);list.push(value,MEDIA_PLACEHOLDER);return [...new Set(list)];}
      if(url.pathname==='/media/product'){url.searchParams.set('admin_recovery','1');return [`${url.pathname}${url.search}`,MEDIA_PLACEHOLDER];}
      if(url.hostname==='assets.devilndove.com'||url.hostname.endsWith('.r2.dev')){const key=url.pathname.replace(/^\/+/, '');list.push(value);if(key)list.push(`/media/product?key=${encodeURIComponent(key)}&admin_recovery=1`);list.push(MEDIA_PLACEHOLDER);return [...new Set(list)];}
      return [value,MEDIA_PLACEHOLDER];
    }catch{return [MEDIA_PLACEHOLDER];}
  }
  function armMediaImage(img,raw){
    if(!img)return;const candidates=mediaCandidates(raw);let index=0;
    const use=()=>{img.src=candidates[index]||MEDIA_PLACEHOLDER;};
    img.onerror=()=>{if(index<candidates.length-1){index+=1;use();}};use();
  }
  const mediaKey=(raw)=>String(raw||'').trim().toLowerCase().replace(/[?#].*$/,'');
  function editorMediaRows(){
    const rows=(Array.isArray(state.images)?state.images:[]).map((row)=>({...row,source:'gallery',canonical_gallery:true,editable:Number(row?.product_image_id||0)>0}));
    const featured=String(get('featured_image_url')||state.product?.featured_image_url||'').trim();
    const featuredKey=mediaKey(featured);
    if(featured&&featuredKey&&!rows.some((row)=>mediaKey(row.image_url)===featuredKey)){
      rows.unshift({product_image_id:0,product_id:state.productId,image_url:featured,alt_text:get('name')||state.product?.name||'',sort_order:-1,source:'featured • Product authority',canonical_gallery:false,editable:false,featured_reference_from_product_authority:true});
    }
    return rows;
  }
  function browserSeed(){if(!state.productId)return null;try{const raw=sessionStorage.getItem(`dnd:product-editor-seed:${state.productId}`);if(!raw)return null;const seed=JSON.parse(raw);if(Number(seed?.product_id)!==state.productId)return null;if(Date.now()-Number(seed?.captured_at||0)>30*60*1000)return null;return seed;}catch{return null;}}
  function primeFromBrowser(){const seed=browserSeed();if(!seed)return false;title.textContent=seed.name?`Edit ${seed.name}`:'Edit Product';identity.textContent=`Product #${state.productId}${seed.product_number?` • No. ${seed.product_number}`:''}${seed.sku?` • ${seed.sku}`:''}`;const preview=document.getElementById('productEditorFeaturedPreview');if(preview&&seed.featured_image_url){armMediaImage(preview,seed.featured_image_url);preview.alt=seed.name?`Featured image for ${seed.name}`:'Featured image';}setStatus('Product Browser handoff shown while one authoritative Product read loads. Save remains disabled until authority is confirmed.','warn');return true;}
  function setSaveReady(ready){state.authorityLoaded=Boolean(ready);if(ready)form.dataset.productAuthority='ready';if(saveButton)saveButton.disabled=state.productId?(!state.authorityLoaded||state.quotaStop||state.saveNeedsReview):state.inFlight;if(qaRun)qaRun.disabled=!state.productId||!state.authorityLoaded||state.qaRunning;}
  function setFeaturedDraft(raw){const value=String(raw||'').trim();set('featured_image_url',value);if(state.product)state.product.featured_image_url=value;const preview=document.getElementById('productEditorFeaturedPreview');if(preview){armMediaImage(preview,value);preview.alt=get('name')?`Featured image for ${get('name')}`:'Featured image';}refreshDirty();snapshotEdits();renderMedia();state.qaData=null;renderQa();setStatus('Featured image changed in this Product draft. Press Save Product to commit it.','warn');}
  function fill(product){
    state.product=product||{};for(const key of ['name','slug','sku','product_category','color_name','color_names_text','shipping_code','review_status','short_description','description','product_type','status','currency','tax_class_id','weight_grams','inventory_quantity','digital_file_url','featured_image_url','sort_order','meta_title','meta_description','keywords','h1_override','canonical_url','og_title','og_description','og_image_url','merchandise_origin','sale_channel','external_listing_url','external_listing_label','condition_summary','era_label','sourcing_notes'])set(key,product?.[key]);set('price',(Number(product?.price_cents||0)/100).toFixed(2));set('compare_at_price',product?.compare_at_price_cents==null?'':(Number(product.compare_at_price_cents||0)/100).toFixed(2));set('taxable',Number(product?.taxable??1)===0?'0':'1');set('requires_shipping',Number(product?.requires_shipping??1)===1?'1':'0');set('inventory_tracking',Number(product?.inventory_tracking??0)===1?'1':'0');
    syncSeo(true);markClean();
    offerRecovery();
    title.textContent=product?.name?`Edit ${product.name}`:'Edit Product';identity.textContent=`Product #${Number(product?.product_id||state.productId)}${product?.product_number?` • No. ${product.product_number}`:''}${product?.sku?` • ${product.sku}`:''}`;
    const preview=document.getElementById('productEditorFeaturedPreview');if(preview){armMediaImage(preview,product?.featured_image_url);preview.alt=product?.name?`Featured image for ${product.name}`:'Featured image';}
    for(const id of ['productEditorMediaLink','productEditorMediaAdvancedLink']){const link=document.getElementById(id);if(link)link.href=`/admin/catalog-media/?product_id=${encodeURIComponent(state.productId)}`;}
  }
  function currentTab(){return document.querySelector('[data-editor-panel]:not([hidden])')?.dataset.editorPanel||'basics';}
  function openTab(id,focusName=''){
    const available=[...document.querySelectorAll('[data-editor-panel]')].some((panel)=>panel.dataset.editorPanel===id);const target=available?id:'basics';
    document.querySelectorAll('[data-editor-panel]').forEach((panel)=>panel.hidden=panel.dataset.editorPanel!==target);document.querySelectorAll('[data-editor-tab]').forEach((tab)=>tab.setAttribute('aria-selected',tab.dataset.editorTab===target?'true':'false'));
    document.dispatchEvent(new CustomEvent('dd:editor-tab-opened',{detail:{tab:target,product_id:state.productId}}));
    if(target==='media')loadMedia();
    if(focusName){const el=field(focusName);if(el){el.focus();el.scrollIntoView({block:'center'});}}
  }
  async function load(){
    if(!state.productId){set('inventory_quantity',1);title.textContent='Create Product';identity.textContent='New Product';setSaveReady(true);setStatus('New Product mode. No Product list was loaded.','ok');syncSeo(true);markClean();renderQa();return;}
    if(state.inFlight||state.quotaStop)return;
    if(form.dataset.productDirty==='1'&&!window.confirm('Unsaved Product edits are in this browser. Reload the server copy and offer Restore?'))return;
    snapshotEdits();state.inFlight=true;form.dataset.productAuthority='loading';setSaveReady(false);
    if(!browserSeed())setStatus('Loading one authoritative Product only…');
    try{
      const response=await window.DDAuth.apiFetch(`/api/admin/product-editor-detail?product_id=${encodeURIComponent(state.productId)}`,{method:'GET',cache:'no-store'});
      const data=await readJson(response,'Could not load Product.');
      if(Number(data.product?.product_id)!==state.productId||!String(data.product?.name||'').trim())throw new Error('Saved Product identity or name was not returned. The editor will not enable Save from incomplete authority data.');
      fill(data.product);state.saveNeedsReview=false;state.quotaStop=false;setSaveReady(true);
      document.dispatchEvent(new CustomEvent('dd:product-loaded',{detail:{product_id:state.productId}}));
      try{sessionStorage.removeItem(`dnd:product-editor-seed:${state.productId}`);}catch{}
      setStatus(`Product authority loaded. Compare any recovered browser edits before another Save. Optional gallery, scoring, pricing and QA remain unloaded until requested.${rowsText(data)}`,'ok');
      if(currentTab()==='media')loadMedia();
    }catch(error){
      setSaveReady(false);form.dataset.productAuthority='failed';if(quota(error))state.quotaStop=true;
      setStatus(incidentMessage(error,'load')+' No Etsy control may operate from this failed load. Your existing saved Product has not been erased. Use Retry load after the service recovers.','error');
      document.dispatchEvent(new CustomEvent('dd:product-load-failed',{detail:{product_id:state.productId,reason:incident(error,'load').category}}));
    }finally{state.inFlight=false;}
  }
  function renderMedia(){
    if(!mediaStrip)return;if(!state.productId){mediaStrip.innerHTML='<p class="small">Save the new Product first, then add images.</p>';return;}
    if(!state.mediaLoaded){mediaStrip.innerHTML='';return;}
    const rows=editorMediaRows();
    if(!rows.length){mediaStrip.innerHTML='<p class="small">No canonical gallery image or featured Product reference was found. Open Media &amp; Image Editor to add one.</p>';return;}
    const featured=String(get('featured_image_url')||'').trim();mediaStrip.innerHTML=rows.map((row,index)=>{const isFeatured=featured&&featured===String(row.image_url||'').trim();const canonical=Number(row.product_image_id||0)>0;const source=String(row.source|| (canonical?'gallery':'recovered reference'));return `<article class="dd-editor-media-card${isFeatured?' is-featured':''}"><img loading="lazy" data-media-raw="${esc(row.image_url||'')}" alt="${esc(row.alt_text||get('name')||'Product image')}"><div><strong>${isFeatured?'Featured':'Image '+(index+1)}</strong><div class="small">${esc(row.alt_text||'No alt text yet')}</div><div class="small">Source: ${esc(source)}${canonical?'':' • recovered existing reference'}</div></div><div class="dd-product-actions"><button class="btn" type="button" data-use-featured-url="${esc(row.image_url||'')}" ${isFeatured?'disabled':''}>Use as featured</button><button class="btn" type="button" data-dd495-jump-media="${Number(row.product_image_id||0)}">${canonical?'Complete image requirements here':'Review shared Product images'}</button></div></article>`;}).join('');
    mediaStrip.querySelectorAll('img[data-media-raw]').forEach((img)=>armMediaImage(img,img.dataset.mediaRaw||''));
    mediaStrip.querySelectorAll('[data-use-featured-url]').forEach((button)=>button.addEventListener('click',()=>setFeaturedDraft(button.dataset.useFeaturedUrl||'')));
    mediaStrip.querySelectorAll('[data-dd495-jump-media]').forEach(button=>button.addEventListener('click',()=>{
      const id=Number(button.dataset.dd495JumpMedia||0),section=document.getElementById('productDistribution406');
      section?.scrollIntoView({block:'start',behavior:'smooth'});
      if(id)document.querySelector(`[data-dd495-edit="${id}"]`)?.click();
    }));
  }
  async function loadMedia(){
    if(!state.productId||!state.authorityLoaded||state.mediaLoaded||state.mediaLoading||state.quotaStop)return;state.mediaLoading=true;if(mediaStatus)mediaStatus.textContent='Loading canonical gallery rows for this Product only…';
    try{
      const response=await window.DDAuth.apiFetch(`/api/admin/product-editor-media?product_id=${encodeURIComponent(state.productId)}`,{method:'GET',cache:'no-store'});
      const data=await readJson(response,'Could not load Product images.');state.images=Array.isArray(data.images)?data.images:[];state.mediaLoaded=true;renderMedia();
      const displayed=editorMediaRows();const featuredOnly=displayed.some((row)=>row.featured_reference_from_product_authority===true);
      if(mediaStatus)mediaStatus.textContent=`${state.images.length} canonical gallery image${state.images.length===1?'':'s'} loaded for this Product only.${featuredOnly?' Featured-only reference reused from already-loaded Product authority with zero additional D1 rows.':''} No Product-table, media-role, media-asset, quality, annotation or R2 recovery read was performed.${rowsText(data)}`;
    }
    catch(error){if(quota(error))state.quotaStop=true;if(mediaStatus)mediaStatus.textContent=incidentMessage(error,'load');}
    finally{state.mediaLoading=false;}
  }
  function renderQa(){
    if(!qaStatus||!qaResults)return;
    if(!state.productId){qaStatus.textContent='Save the new Product first, then run QA explicitly.';qaResults.innerHTML='';return;}
    if(!state.authorityLoaded){qaStatus.textContent='QA is available after authoritative Product detail loads.';qaResults.innerHTML='';return;}
    if(!state.qaData){qaStatus.textContent='QA has not run. Opening this tab performs zero D1 reads; press Run QA when you want a fresh check.';qaResults.innerHTML='';return;}
    const data=state.qaData;qaStatus.textContent=`${Number(data.passed||0)} passed • ${Number(data.failed||0)} need attention. QA is read-only and was not persisted.${rowsText(data)}`;
    const checks=Array.isArray(data.checks)?data.checks:[];
    qaResults.innerHTML=checks.map((check)=>{const target=check.fix_target||{};let action='';if(!check.ok){if(target.kind==='media'&&target.url)action=`<a class="btn" href="${esc(target.url)}">${esc(target.label||'Fix image')}</a>`;else action=`<button class="btn" type="button" data-qa-fix-tab="${esc(target.tab||'basics')}" data-qa-fix-field="${esc(target.field||'name')}">${esc(target.label||'Fix Product')}</button>`;}return `<article class="status-note ${check.ok?'success':'warning'}"><div><strong>${check.ok?'✓':'Needs attention:'} ${esc(check.label||check.code||'Product check')}</strong><div class="small">${esc(check.help||'')}</div></div>${action?`<div class="dd-product-actions">${action}</div>`:''}</article>`;}).join('');
    qaResults.querySelectorAll('[data-qa-fix-tab]').forEach((button)=>button.addEventListener('click',()=>openTab(button.dataset.qaFixTab||'basics',button.dataset.qaFixField||'')));
  }
  async function runQa(){
    if(!state.productId||!state.authorityLoaded||state.qaRunning)return;state.qaRunning=true;if(qaRun)qaRun.disabled=true;if(qaStatus)qaStatus.textContent='Running one explicit Product QA read…';
    try{const response=await window.DDAuth.apiFetch(`/api/admin/product-publish-qa?product_id=${encodeURIComponent(state.productId)}`,{method:'GET',cache:'no-store'});state.qaData=await readJson(response,'Product QA failed.');renderQa();}
    catch(error){state.qaData=null;if(qaStatus)qaStatus.textContent=`${error.message}${quota(error)?' No automatic retry will run; press Run QA to retry later.':''}`;if(qaResults)qaResults.innerHTML='';}
    finally{state.qaRunning=false;if(qaRun)qaRun.disabled=!state.productId||!state.authorityLoaded;}
  }
  function payload(){const p=state.product||{};return {source_editor_build390:true,product_id:state.productId||undefined,product_number:p.product_number??null,name:get('name'),slug:get('slug'),sku:get('sku'),product_category:get('product_category'),color_name:get('color_name'),color_names_text:get('color_names_text'),shipping_code:get('shipping_code'),review_status:get('review_status')||'pending_review',short_description:get('short_description'),description:get('description'),product_type:get('product_type')||'physical',status:get('status')||'draft',price_cents:cents(get('price')),compare_at_price_cents:get('compare_at_price')===''?null:cents(get('compare_at_price')),currency:get('currency')||'CAD',taxable:get('taxable')==='0'?0:1,tax_class_id:get('tax_class_id')===''?null:Number(get('tax_class_id')),requires_shipping:get('requires_shipping')==='1'?1:0,weight_grams:get('weight_grams')===''?null:Number(get('weight_grams')),inventory_tracking:get('inventory_tracking')==='1'?1:0,inventory_quantity:Math.max(0,Number(get('inventory_quantity')||0)),digital_file_url:get('digital_file_url'),featured_image_url:get('featured_image_url'),sort_order:Math.max(0,Number(get('sort_order')||0)),meta_title:get('meta_title'),meta_description:get('meta_description'),keywords:get('keywords'),h1_override:get('h1_override'),canonical_url:get('canonical_url'),og_title:get('og_title'),og_description:get('og_description'),og_image_url:get('og_image_url'),merchandise_origin:get('merchandise_origin')||p.merchandise_origin||'handmade',sale_channel:get('sale_channel')||p.sale_channel||'onsite',external_listing_url:get('external_listing_url'),external_listing_label:get('external_listing_label'),condition_summary:get('condition_summary'),era_label:get('era_label'),sourcing_notes:get('sourcing_notes')};}
  // Inputs are frozen only while one explicit POST is unresolved. This prevents
  // a late success from marking newer edits clean or silently discarding them.
  function freezeFields(){
    const locked=[];
    for(const el of form.elements){
      if(el.disabled||(!el.name&&!['productChannel405Etsy','productChannel405Facebook','productChannel471Consent'].includes(el.id))||!['INPUT','SELECT','TEXTAREA'].includes(el.tagName))continue;
      el.disabled=true;locked.push(el);
    }
    return ()=>locked.forEach(el=>{el.disabled=false;});
  }
  form.addEventListener('submit',async(event)=>{
    event.preventDefault();
    if(state.inFlight||state.quotaStop||state.saveNeedsReview){
      setStatus('Another Product save is blocked. Review the last outcome and reload the saved Product before attempting another write.','error');return;
    }
    if(state.productId&&!state.authorityLoaded){setStatus('Product authority has not loaded. Save is blocked to prevent stale edits.','error');return;}
    if(!get('name')){setStatus('Product name is required.','error');field('name')?.focus();return;}
    let body,channelSnapshot;
    try{body=payload();channelSnapshot=window.DDProductChannels405?.captureForProductSave?.()||{changed:false};}
    catch(error){setStatus(error.message,'error');if(/consent/i.test(error.message))document.getElementById('productChannel471Consent')?.focus();else field('price')?.focus();return;}
    if(body.price_cents===0){
      if(!window.confirm('This Product is priced at $0.00. Save it as a deliberately FREE Product? Cancel to correct the price.')){
        setStatus('Save cancelled. Enter the intended CAD price before saving.','warn');field('price')?.focus();return;
      }
      body.confirm_zero_price=true;
    }
    refreshDirty();snapshotEdits();
    const submittedFingerprint=fingerprint();
    state.inFlight=true;const unlockFields=freezeFields();
    if(saveButton){saveButton.disabled=true;saveButton.textContent='Saving…';}
    setStatus('One explicit Product write is in progress. Controls are temporarily locked; no automatic retry will run.');
    const endpoint=state.productId?'/api/admin/product-editor-save':'/api/admin/create-product';
    try{
      const response=await window.DDAuth.apiFetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data=await readJson(response,'Product save failed.');
      const savedId=Number(data?.product_id||data?.product?.product_id||state.productId||0);
      if(state.productId&&(!data.product_fields_confirmed||!data.price_cents_confirmed||Number(data.price_cents)!==body.price_cents||
        (data.compare_at_price_cents==null?null:Number(data.compare_at_price_cents))!==body.compare_at_price_cents)){
        const unconfirmed=new Error('Product price readback did not match the requested value.');
        unconfirmed.code='product_price_readback_unconfirmed';unconfirmed.httpStatus=409;throw unconfirmed;
      }
      // A successful Product save is independent of optional destination choices;
      // a destination failure must never ask the operator to repeat Product POST.
      let destinationsSaved=true;
      try{destinationsSaved=(await window.DDProductChannels405?.afterProductSave(savedId,channelSnapshot))!==false;}
      catch{destinationsSaved=false;}
      const newerEdits=fingerprint()!==submittedFingerprint;
      // Build 501: an opted-in Etsy Product save is one explicit authorization
      // for an unpublished draft sync. Save the canonical Product first. Never
      // dispatch a provider write when destination persistence is uncertain.
      const etsySyncRequested=Boolean(destinationsSaved&&!newerEdits&&
        document.getElementById('productChannel405Etsy')?.checked);
      if(!newerEdits){markClean();clearRecovery();}
      else {baseline=submittedFingerprint;refreshDirty();snapshotEdits();}
      if(!state.productId&&savedId){
        if(newerEdits){
          try{sessionStorage.setItem(`dnd:product-editor:recovery:443:${savedId}`,JSON.stringify({version:443,product_id:savedId,saved_at:Date.now(),baseline:submittedFingerprint,values:Object.fromEntries([...form.elements].filter(el=>el.name&&el.type!=='file').map(el=>[el.name,el.value]))}));}
          catch{state.saveNeedsReview=true;setStatus(`Product #${savedId} was created, but newer unsaved edits could not be transferred into browser recovery. Keep this tab open and manually compare with the saved Product. Do not create it again.`,'warn');return;}
        }
        if(etsySyncRequested){
          try{sessionStorage.setItem(`dnd:etsy:sync-after-create:501:${savedId}`,
            JSON.stringify({product_id:savedId,at:Date.now(),authorized:true}));}
          catch{/* The saved Product is intact; Etsy can be resumed manually. */}
        }
        leavingAfterSave=true;
        location.replace(`/admin/product-editor/?product_id=${encodeURIComponent(savedId)}&created=1${destinationsSaved?'':'&destination_save=unconfirmed'}`);
        return;
      }
      if(state.product){state.product.featured_image_url=body.featured_image_url;state.product.price_cents=body.price_cents;state.product.compare_at_price_cents=body.compare_at_price_cents;}
      state.qaData=null;renderMedia();renderQa();
      document.dispatchEvent(new CustomEvent('dd:save-succeeded',{detail:{form,message:'Product saved',
        product_id:savedId,etsy_sync_requested:etsySyncRequested,destinations_confirmed:destinationsSaved,
        newer_edits:newerEdits}}));
      if(saveButton)saveButton.textContent=newerEdits?'Newer edits unsaved':destinationsSaved?'Saved ✓':'Product saved; destinations pending';
      setStatus(newerEdits?'Product saved, but newer browser edits remain unsaved. Review before another Save.':
        !destinationsSaved?'Product saved and CAD price verified, but destination choices were NOT confirmed. Reconcile destinations separately; do not repeat Product Save.':
        `Saved ✓ CAD price verified as ${(Number(body.price_cents)/100).toFixed(2)}. Schema introspection reads: ${Number(data?.schema_introspection_reads||0)}. QA remains manual.${rowsText(data)}`,newerEdits||!destinationsSaved?'warn':'ok');
    }catch(error){
      const failure=incident(error,'save');
      // Write outcome may be unknown after 5xx/1102/timeout/readback mismatch.
      // Keep browser recovery and require an explicit authoritative reload.
      if(failure.uncertainWrite||/product_fields_readback_unconfirmed|product_price_readback_unconfirmed/.test(String(error?.code||''))){state.saveNeedsReview=true;state.quotaStop=quota(error);}
      refreshDirty();snapshotEdits();
      setStatus(`${incidentMessage(error,'save')}${!state.productId&&failure.uncertainWrite?' Check Products for an existing new Product before creating another.':''}`,'error');
      if(saveButton)saveButton.textContent=failure.uncertainWrite?'Review server copy first':'Save Product';
    }finally{
      unlockFields();state.inFlight=false;
      if(saveButton)saveButton.disabled=Boolean(state.inFlight||state.quotaStop||state.saveNeedsReview||(state.productId&&!state.authorityLoaded));
    }
  });
  document.getElementById('productEditorRetry')?.addEventListener('click',()=>{
    if(state.inFlight)return;
    if(!state.productId&&state.saveNeedsReview){setStatus('A new Product may already exist. Check Product Browser for a duplicate before any new Save. Reloading this blank form cannot verify the create outcome.','error');return;}
    state.quotaStop=false;load();
  });
  document.querySelectorAll('[data-editor-tab]').forEach((button)=>button.addEventListener('click',()=>openTab(button.dataset.editorTab||'basics')));
  qaRun?.addEventListener('click',runQa);
  field('featured_image_url')?.addEventListener('change',()=>setFeaturedDraft(get('featured_image_url')));
  const initialTab=String(params.get('tab')||'basics').trim();const initialFocus=String(params.get('focus')||'').trim();openTab(initialTab,initialFocus);
  if(state.productId){setSaveReady(false);primeFromBrowser();}else setSaveReady(true);
  renderQa();load();
})();
