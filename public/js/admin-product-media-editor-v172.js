// Release 467 Build 173 — Product Media save/refresh reliability with corrected publication guard.
// Explicit operator actions only: no catalog scan, R2 listing, autosave, observer, or background refresh.
(() => {
  'use strict';
  const byId=(id)=>document.getElementById(id);
  const status=byId('productMediaV164Status'),searchForm=byId('productMediaV164SearchForm'),searchInput=byId('productMediaV164Search'),searchResults=byId('productMediaV164SearchResults');
  const identity=byId('productMediaV164Identity'),gallery=byId('productMediaV164Gallery'),editor=byId('productMediaV164Editor'),editorForm=byId('productMediaV164EditorForm'),receipt=byId('productMediaV172SaveReceipt');
  if(!status||!gallery||!editorForm||!window.DDAuth)return;

  const state={productId:0,product:null,images:[],selected:null,inFlight:false,stoppedForQuota:false,pendingFile:null};
  const PLACEHOLDER='/assets/product-image-recovery-placeholder.svg';
  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(ch)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const setStatus=(message,tone='')=>{status.textContent=message;status.dataset.tone=tone;status.hidden=!message;};
  const setReceipt=(message,tone='ok')=>{if(!receipt)return;receipt.textContent=message;receipt.dataset.tone=tone;receipt.hidden=!message;};
  const clearReceipt=()=>setReceipt('','');
  const nowText=()=>new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit',second:'2-digit'}).format(new Date());
  const readJson=async(response,fallback)=>{const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok){const error=new Error(data?.error||fallback||`Request failed (${response.status}).`);error.code=data?.code||'';error.status=response.status;throw error;}return data;};
  const isQuota=(error)=>error?.code==='d1_read_capacity_unavailable'||(error?.status===503&&/D1|quota|rows read|capacity/i.test(String(error?.message||'')));
  const rowsText=(data)=>Number.isFinite(Number(data?.d1_rows_read))?` D1 rows read: ${Number(data.d1_rows_read)}.`:'';
  const warningText=(data)=>String(data?.warning||'').trim()?` ${String(data.warning).trim()}`:'';

  function mediaCandidates(raw){
    const value=String(raw||'').trim();if(!value)return [PLACEHOLDER];
    try{
      const url=new URL(value,location.origin);const list=[];
      if(url.pathname==='/api/product-media'){
        const key=String(url.searchParams.get('key')||'').trim();if(key)list.push(`/media/product?key=${encodeURIComponent(key)}&admin_recovery=1`);list.push(value,PLACEHOLDER);return [...new Set(list)];
      }
      if(url.pathname==='/media/product'){url.searchParams.set('admin_recovery','1');list.push(`${url.pathname}${url.search}`,PLACEHOLDER);return list;}
      if(url.hostname==='assets.devilndove.com'||url.hostname.endsWith('.r2.dev')){const key=url.pathname.replace(/^\/+/, '');list.push(value,`/media/product?key=${encodeURIComponent(key)}&admin_recovery=1`,PLACEHOLDER);return [...new Set(list)];}
      return [value,PLACEHOLDER];
    }catch{return [PLACEHOLDER];}
  }
  function armImage(img,raw,notice=null){
    if(!img)return;const candidates=mediaCandidates(raw);let index=0;const use=()=>{img.src=candidates[index]||PLACEHOLDER;};
    img.onerror=()=>{if(index<candidates.length-1){index+=1;use();return;}if(notice)notice.textContent='Image could not be displayed.';};
    img.onload=()=>{if(notice)notice.textContent=img.src.includes('product-image-recovery-placeholder.svg')?'Original image is unavailable; placeholder shown.':'';};use();
  }
  function armGalleryImages(){gallery.querySelectorAll('img[data-media-raw]').forEach((img)=>armImage(img,img.dataset.mediaRaw||''));}
  function updateUrl(id){const url=new URL(location.href);if(id)url.searchParams.set('product_id',String(id));else url.searchParams.delete('product_id');history.replaceState({},'',`${url.pathname}${url.search}`);}
  function selectedIndex(){return state.selected?state.images.findIndex((row)=>Number(row.product_image_id)===Number(state.selected.product_image_id)&&row.editable!==false):-1;}
  function syncButtons(){
    const hasProduct=state.productId>0,hasSelected=!!state.selected&&Number(state.selected.product_image_id)>0,index=selectedIndex();
    byId('productMediaV164AddButton').disabled=!hasProduct||state.inFlight;
    byId('productMediaV164ReplaceButton').disabled=!hasSelected||state.inFlight;
    byId('productMediaV164RemoveButton').disabled=!hasSelected||state.inFlight;
    byId('productMediaV164MoveLeft').disabled=!hasSelected||index<=0||state.inFlight;
    byId('productMediaV164MoveRight').disabled=!hasSelected||index<0||index>=state.images.filter((row)=>row.editable!==false).length-1||state.inFlight;
  }
  function imageCard(row,index){
    const body=`<img loading="lazy" data-media-raw="${esc(row.image_url||'')}" alt="${esc(row.alt_text||'')}"/><span><strong>${index===0?'#1 ':''}${esc(row.alt_text||`Image ${index+1}`)}</strong><small>${row.editable===false?'Recovered reference • display only':`order ${Number(row.sort_order??index)} • score ${row.quality_score==null?'not measured':Number(row.quality_score)} • ${esc(row.acceptance_status||'not reviewed')}`}</small>${row.editable===false?`<small>${esc(row.source||'reference')} — use Add image to create an editable gallery row.</small>`:''}</span>`;
    if(row.editable===false||Number(row.product_image_id||0)<=0)return `<div class="dd-media-edit-card dd-media-reference" data-reference="1">${body}</div>`;
    const selected=Number(state.selected?.product_image_id||0)===Number(row.product_image_id||0)?' is-selected':'';
    return `<button type="button" class="dd-media-edit-card${selected}" data-image-id="${Number(row.product_image_id)}">${body}</button>`;
  }
  function renderGallery(){
    if(!state.product){identity.innerHTML='<strong>No Product selected.</strong><div class="small">Search only when you need to choose a Product.</div>';gallery.innerHTML='<p class="small">No gallery loaded. No D1 gallery query has run.</p>';editor.hidden=true;syncButtons();return;}
    const editableCount=state.images.filter((row)=>row.editable!==false&&Number(row.product_image_id)>0).length;
    const recoveredCount=state.images.length-editableCount;
    identity.innerHTML=`<strong>${esc(state.product.name||`Product #${state.productId}`)}</strong><div class="small">#${state.productId}${state.product.sku?` • ${esc(state.product.sku)}`:''} • ${esc(state.product.status||'draft')} • ${editableCount} editable gallery image${editableCount===1?'':'s'}${recoveredCount?` • ${recoveredCount} recovered display reference${recoveredCount===1?'':'s'}`:''}</div><div class="dd-product-actions"><a class="btn" href="/admin/product-editor/?product_id=${state.productId}">Product Editor</a>${state.product.slug?`<a class="btn" target="_blank" rel="noopener" href="/shop/product/?slug=${encodeURIComponent(state.product.slug)}">Storefront Preview</a>`:''}</div>`;
    if(!state.images.length){gallery.innerHTML='<p class="small">This Product has no gallery images. Use “Add image” to attach one. No R2 library scan was performed.</p>';editor.hidden=true;state.selected=null;syncButtons();return;}
    gallery.innerHTML=state.images.map(imageCard).join('');armGalleryImages();gallery.querySelectorAll('[data-image-id]').forEach((button)=>button.addEventListener('click',()=>loadImage(Number(button.dataset.imageId))));syncButtons();
  }

  async function fetchProduct(id){
    state.productId=Number(id||0);if(!state.productId){state.product=null;state.images=[];state.selected=null;renderGallery();return null;}
    const response=await window.DDAuth.apiFetch(`/api/admin/product-media-editor?product_id=${encodeURIComponent(state.productId)}`,{method:'GET',cache:'no-store'});const data=await readJson(response,'Could not load Product media.');
    state.product=data.product||null;state.images=Array.isArray(data.images)?data.images:[];state.selected=null;updateUrl(state.productId);renderGallery();return data;
  }
  async function loadProduct(id){
    if(state.inFlight||state.stoppedForQuota)return;state.inFlight=true;syncButtons();setStatus('Loading one Product gallery only…');clearReceipt();
    try{const data=await fetchProduct(id);setStatus(`Product media loaded. Image details stay unloaded until you select one.${rowsText(data)}`,'ok');}
    catch(error){if(isQuota(error))state.stoppedForQuota=true;setStatus(`${error.message}${isQuota(error)?' Automatic retries are stopped.':''}`,'error');}
    finally{state.inFlight=false;syncButtons();}
  }
  function displayPercent(value){const n=Number(value);if(!Number.isFinite(n))return '';return n>=0&&n<=1?String(Math.round(n*1000)/10):String(n);}
  function fillEditor(data){
    const image=data.image||{};state.selected=image;editor.hidden=false;armImage(byId('productMediaV164Preview'),image.image_url,byId('productMediaV164PreviewNotice'));byId('productMediaV164Preview').alt=image.alt_text||'';byId('productMediaV164ImageId').textContent=`Image #${Number(image.product_image_id||0)}${data.primary?' • FEATURED':''}`;
    for(const name of ['alt_text','image_title','caption','annotation_notes','image_role','public_use_status','role_review_notes','sort_order']){const field=editorForm.elements.namedItem(name);if(field)field.value=image[name]??'';}
    const fx=editorForm.elements.namedItem('focal_point_x'),fy=editorForm.elements.namedItem('focal_point_y');if(fx)fx.value=displayPercent(image.focal_point_x);if(fy)fy.value=displayPercent(image.focal_point_y);
    byId('productMediaV164Score').textContent=image.quality_score==null?'Not measured':`${Number(image.quality_score)}/100 • ${image.acceptance_status||'review'}`;byId('productMediaV164SetFeatured').checked=Boolean(data.primary);renderGallery();syncButtons();
    if(data.annotation_warning)setStatus(`Image loaded. ${data.annotation_warning}${rowsText(data)}`,'ok');
  }
  async function fetchImage(id){
    const response=await window.DDAuth.apiFetch(`/api/admin/product-image-editor?product_image_id=${encodeURIComponent(id)}`,{method:'GET',cache:'no-store'});const data=await readJson(response,'Could not load image details.');fillEditor(data);return data;
  }
  async function loadImage(id){
    if(state.inFlight||!id)return;state.inFlight=true;syncButtons();setStatus('Loading this image only…');clearReceipt();
    try{const data=await fetchImage(id);setStatus(`Selected image loaded. No scoring was run.${rowsText(data)}`,'ok');}
    catch(error){if(isQuota(error))state.stoppedForQuota=true;setStatus(`${error.message}${isQuota(error)?' Automatic retries are stopped.':''}`,'error');}
    finally{state.inFlight=false;syncButtons();}
  }
  function metadataPayload(){
    const image=state.selected||{};const get=(name)=>String(editorForm.elements.namedItem(name)?.value??'').trim();const percent=(name)=>{const n=Number(get(name));return Number.isFinite(n)?Math.max(0,Math.min(100,n))/100:null;};
    return {action:'save_metadata',product_image_id:Number(image.product_image_id||0),alt_text:get('alt_text'),image_title:get('image_title'),caption:get('caption'),focal_point_x:percent('focal_point_x'),focal_point_y:percent('focal_point_y'),annotation_notes:get('annotation_notes'),image_role:get('image_role'),public_use_status:get('public_use_status')||'internal_review',role_review_notes:get('role_review_notes'),sort_order:Number(get('sort_order')||0),set_featured:Boolean(byId('productMediaV164SetFeatured').checked)};
  }
  editorForm.addEventListener('submit',async(event)=>{
    event.preventDefault();if(state.inFlight||!state.selected)return;state.inFlight=true;syncButtons();setStatus('Saving selected image details…');clearReceipt();
    try{
      const body=metadataPayload();const response=await window.DDAuth.apiFetch('/api/admin/product-image-editor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await readJson(response,'Image save failed.');
      const row=state.images.find((item)=>Number(item.product_image_id)===Number(state.selected.product_image_id));if(row){row.alt_text=body.alt_text;row.sort_order=body.sort_order;if(body.set_featured&&state.product)state.product.featured_image_url=row.image_url;}state.selected={...state.selected,...body};renderGallery();
      const saved=`Saved ✓ Image #${Number(data.product_image_id||body.product_image_id)} at ${nowText()}`;setReceipt(saved,'ok');setStatus(`${data.message||'Image details saved.'}${warningText(data)} Scoring did not run automatically.${rowsText(data)}`,'ok');
    }catch(error){if(isQuota(error))state.stoppedForQuota=true;setReceipt('Save failed — changes were not confirmed.','error');setStatus(`${error.message}${isQuota(error)?' Automatic retries are stopped.':''}`,'error');}
    finally{state.inFlight=false;syncButtons();}
  });
  byId('productMediaV164ScoreButton')?.addEventListener('click',async()=>{
    if(state.inFlight||!state.selected)return;state.inFlight=true;syncButtons();setStatus('Measuring and scoring only the selected image…');const preview=byId('productMediaV164Preview');const measure=()=>({width_px:Number(preview.naturalWidth||0),height_px:Number(preview.naturalHeight||0),load_status:preview.complete&&preview.naturalWidth>0&&!preview.src.includes('product-image-recovery-placeholder.svg')?'loaded':'error'});
    try{if(!preview.complete)await new Promise((resolve)=>{const done=()=>resolve();preview.addEventListener('load',done,{once:true});preview.addEventListener('error',done,{once:true});setTimeout(done,5000);});const body={action:'score',product_image_id:Number(state.selected.product_image_id),...measure()};const response=await window.DDAuth.apiFetch('/api/admin/product-image-editor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await readJson(response,'Image scoring failed.');byId('productMediaV164Score').textContent=`${Number(data.quality_score||0)}/100 • ${data.acceptance_status||'review'}`;const row=state.images.find((item)=>Number(item.product_image_id)===Number(state.selected.product_image_id));if(row){row.quality_score=data.quality_score;row.acceptance_status=data.acceptance_status;}renderGallery();setReceipt(`Saved ✓ score for Image #${Number(state.selected.product_image_id)} at ${nowText()}`,'ok');setStatus(`Selected image scored. No other Product images were read or rescored.${rowsText(data)}`,'ok');}
    catch(error){if(isQuota(error))state.stoppedForQuota=true;setStatus(`${error.message}${isQuota(error)?' Automatic retries are stopped.':''}`,'error');}
    finally{state.inFlight=false;syncButtons();}
  });

  function imageFromFile(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read the selected image file.'));};img.src=url;});}
  function canvasBlob(canvas,type='image/jpeg',quality=.88){return new Promise((resolve,reject)=>canvas.toBlob((blob)=>blob?resolve(blob):reject(new Error('Could not prepare the edited image.')),type,quality));}
  function cropForPreset(width,height,preset,maxSide){
    if(preset==='square_1200'){const side=Math.min(width,height);return {sx:(width-side)/2,sy:(height-side)/2,sw:side,sh:side,ow:1200,oh:1200,label:'square 1200×1200'};}
    if(preset==='landscape_1600'){const ratio=4/3;let sw=width,sh=width/ratio;if(sh>height){sh=height;sw=height*ratio;}const ow=Math.min(1600,Math.round(sw));return {sx:(width-sw)/2,sy:(height-sh)/2,sw,sh,ow,oh:Math.round(ow/ratio),label:'landscape 4:3'};}
    if(preset==='max_side'){const scale=Math.min(1,maxSide/Math.max(width,height));return {sx:0,sy:0,sw:width,sh:height,ow:Math.max(1,Math.round(width*scale)),oh:Math.max(1,Math.round(height*scale)),label:`max side ${maxSide}px`};}
    return {sx:0,sy:0,sw:width,sh:height,ow:width,oh:height,label:'original'};
  }
  async function prepareFile(){
    const pending=state.pendingFile;if(!pending?.file)return null;const preset=String(byId('productMediaV164Preset').value||'original');const maxSide=Math.max(800,Math.min(2600,Number(byId('productMediaV164MaxSide').value||1600)));const quality=Math.max(55,Math.min(95,Number(byId('productMediaV164Quality').value||88)))/100;
    const img=await imageFromFile(pending.file);const width=Number(img.naturalWidth||0),height=Number(img.naturalHeight||0);if(!width||!height)throw new Error('Image dimensions could not be read.');const crop=cropForPreset(width,height,preset,maxSide);
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(crop.ow));canvas.height=Math.max(1,Math.round(crop.oh));const ctx=canvas.getContext('2d');ctx.drawImage(img,crop.sx,crop.sy,crop.sw,crop.sh,0,0,canvas.width,canvas.height);
    const preview=byId('productMediaV164FilePreview'),pctx=preview.getContext('2d');preview.width=420;preview.height=Math.max(120,Math.round(420*(canvas.height/canvas.width)));pctx.clearRect(0,0,preview.width,preview.height);pctx.drawImage(canvas,0,0,preview.width,preview.height);
    let outFile=pending.file;if(preset!=='original'){const blob=await canvasBlob(canvas,'image/jpeg',quality);const base=(pending.file.name||'product-image').replace(/\.[^.]+$/,'').replace(/[^a-z0-9_-]+/gi,'-')||'product-image';outFile=new File([blob],`${base}-${preset}.jpg`,{type:'image/jpeg',lastModified:Date.now()});}
    const orientation=Math.abs(canvas.width-canvas.height)<=Math.max(24,canvas.width*.03)?'square':canvas.width>canvas.height?'landscape':'portrait';const info={file:outFile,width:canvas.width,height:canvas.height,orientation,preset,label:crop.label};state.pendingFile={...pending,...info};byId('productMediaV164FileNote').textContent=`${pending.mode==='replace'?'Replacement':'New image'} • ${canvas.width}×${canvas.height} • ${orientation} • ${crop.label} • ${(outFile.size/1024).toFixed(1)} KB`;return state.pendingFile;
  }
  function beginFile(mode,file){if(!file)return;state.pendingFile={mode,file};byId('productMediaV164FileTools').hidden=false;byId('productMediaV164FileHeading').textContent=mode==='replace'?'Prepare replacement image':'Prepare new gallery image';prepareFile().catch((error)=>setStatus(error.message,'error'));}
  function cancelFile(){state.pendingFile=null;byId('productMediaV164FileTools').hidden=true;byId('productMediaV164AddInput').value='';byId('productMediaV164ReplaceInput').value='';}
  ['productMediaV164Preset','productMediaV164MaxSide','productMediaV164Quality'].forEach((id)=>byId(id)?.addEventListener('change',()=>{if(state.pendingFile)prepareFile().catch((error)=>setStatus(error.message,'error'));}));
  byId('productMediaV164AddButton')?.addEventListener('click',()=>byId('productMediaV164AddInput').click());byId('productMediaV164ReplaceButton')?.addEventListener('click',()=>byId('productMediaV164ReplaceInput').click());
  byId('productMediaV164AddInput')?.addEventListener('change',(event)=>beginFile('add',event.target.files?.[0]));byId('productMediaV164ReplaceInput')?.addEventListener('change',(event)=>beginFile('replace',event.target.files?.[0]));byId('productMediaV164CancelFile')?.addEventListener('click',cancelFile);
  byId('productMediaV164ApplyFile')?.addEventListener('click',async()=>{
    if(state.inFlight||!state.pendingFile||!state.productId)return;state.inFlight=true;syncButtons();const mode=state.pendingFile.mode;setStatus(mode==='replace'?'Replacing selected image…':'Adding image…');clearReceipt();
    try{
      const prepared=await prepareFile();if(prepared.mode==='replace'&&!state.selected)throw new Error('Select an image before replacing it.');const form=new FormData();form.append('action',prepared.mode);form.append('file',prepared.file);form.append('product_id',String(state.productId));form.append('product_image_id',String(state.selected?.product_image_id||0));form.append('sort_order',String(prepared.mode==='replace'?(state.selected?.sort_order??0):state.images.filter((row)=>row.editable!==false).length));form.append('alt_text',prepared.file.name.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' '));form.append('width_px',String(prepared.width));form.append('height_px',String(prepared.height));form.append('image_orientation',prepared.orientation);
      const response=await window.DDAuth.apiFetch('/api/admin/product-image-file',{method:'POST',body:form,headers:{}});const data=await readJson(response,'Image file update failed.');const targetId=Number(data.product_image_id||0);cancelFile();
      await fetchProduct(state.productId);if(targetId)await fetchImage(targetId);
      const label=prepared.mode==='replace'?'Replacement image saved':'New image saved';setReceipt(`Saved ✓ ${label} as Image #${targetId} at ${nowText()}`,'ok');setStatus(`${data.message||label+'.'}${warningText(data)}${rowsText(data)}`,'ok');
    }catch(error){if(isQuota(error))state.stoppedForQuota=true;setReceipt('Save failed — image was not confirmed in the Product gallery.','error');setStatus(`${error.message}${isQuota(error)?' Automatic retries are stopped.':''}`,'error');}
    finally{state.inFlight=false;syncButtons();}
  });
  byId('productMediaV164RemoveButton')?.addEventListener('click',async()=>{
    if(state.inFlight||!state.selected)return;const label=state.selected.alt_text||`Image #${state.selected.product_image_id}`;if(!window.confirm(`Remove ${label} from this Product gallery? The R2 source file will be preserved.`))return;state.inFlight=true;syncButtons();setStatus('Removing selected image from this Product…');clearReceipt();
    try{const imageId=Number(state.selected.product_image_id);const response=await window.DDAuth.apiFetch('/api/admin/product-image-editor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'remove',product_image_id:imageId})});const data=await readJson(response,'Image removal failed.');state.selected=null;editor.hidden=true;await fetchProduct(state.productId);setReceipt(`Saved ✓ Image #${imageId} removed at ${nowText()}`,'ok');setStatus(`${data.message||'Image removed from the Product.'} R2 source was preserved.${rowsText(data)}`,'ok');}
    catch(error){if(isQuota(error))state.stoppedForQuota=true;setStatus(`${error.message}${isQuota(error)?' Automatic retries are stopped.':''}`,'error');}
    finally{state.inFlight=false;syncButtons();}
  });
  async function moveSelected(delta){
    if(state.inFlight||!state.selected)return;const editable=state.images.filter((row)=>row.editable!==false&&Number(row.product_image_id)>0),index=editable.findIndex((row)=>Number(row.product_image_id)===Number(state.selected.product_image_id)),target=index+delta;if(index<0||target<0||target>=editable.length)return;const copy=[...editable];[copy[index],copy[target]]=[copy[target],copy[index]];const ids=copy.map((row)=>Number(row.product_image_id));state.inFlight=true;syncButtons();setStatus('Saving gallery order…');clearReceipt();
    try{const response=await window.DDAuth.apiFetch('/api/admin/product-image-editor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reorder',product_image_id:Number(state.selected.product_image_id),ordered_ids:ids})});const data=await readJson(response,'Image reorder failed.');await fetchProduct(state.productId);await fetchImage(Number(state.selected?.product_image_id||ids[target]));setReceipt(`Saved ✓ gallery order at ${nowText()}`,'ok');setStatus(`Gallery order saved.${rowsText(data)}`,'ok');}
    catch(error){setStatus(error.message||'Image reorder failed.','error');}
    finally{state.inFlight=false;syncButtons();}
  }
  byId('productMediaV164MoveLeft')?.addEventListener('click',()=>moveSelected(-1));byId('productMediaV164MoveRight')?.addEventListener('click',()=>moveSelected(1));

  searchForm?.addEventListener('submit',async(event)=>{
    event.preventDefault();if(state.inFlight)return;const q=String(searchInput?.value||'').trim();if(!q){searchResults.innerHTML='<span class="small">Enter a Product ID, name, SKU or slug.</span>';return;}state.inFlight=true;syncButtons();setStatus('Searching one bounded Product page…');clearReceipt();
    try{const params=new URLSearchParams({q,limit:'12'});const response=await window.DDAuth.apiFetch(`/api/admin/product-browser?${params}`,{method:'GET',cache:'no-store'});const data=await readJson(response,'Product search failed.');const products=Array.isArray(data.products)?data.products:[];searchResults.innerHTML=products.map((p)=>`<button class="btn" type="button" data-product-id="${Number(p.product_id||0)}">${esc(p.name||`Product #${p.product_id}`)}${p.sku?` • ${esc(p.sku)}`:''}</button>`).join('')||'<span class="small">No Products matched.</span>';searchResults.querySelectorAll('[data-product-id]').forEach((button)=>button.addEventListener('click',()=>loadProduct(Number(button.dataset.productId))));setStatus(`Product search complete.${rowsText(data)}`,'ok');}
    catch(error){if(isQuota(error))state.stoppedForQuota=true;setStatus(`${error.message}${isQuota(error)?' Automatic retries are stopped.':''}`,'error');}
    finally{state.inFlight=false;syncButtons();}
  });
  const initial=Number(new URLSearchParams(location.search).get('product_id')||0);if(Number.isInteger(initial)&&initial>0)loadProduct(initial);else renderGallery();
})();
