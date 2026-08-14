// Devil n Dove Build 257 — static-site Media & Content Management Studio.
// Product, inventory, supplies and tools are intentionally excluded from this workspace.
(()=>{
  'use strict';
  if(!window.DDAuth)return;

  const state={
    media:[],slots:[],pages:[],selected:null,uses:[],inspected:[],r2Cursor:'',
    pagePath:'/',inspectPath:'/',pageLabel:'Home',section:'all',sitewideArea:'',catalog:null
  };
  const id=(v)=>document.getElementById(v);
  const text=(v)=>String(v??'').trim();
  const esc=(v)=>String(v??'').replace(/[&<>'"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const COMMON_PATHS=['/','/about/','/gallery/','/creations/','/workshop-journal/'];
  const BLOCKED_PATHS=['/admin','/shop','/tools','/toolshed','/supplies','/cart','/checkout','/login','/register','/members','/search','/account-help','/bootstrap-admin','/custom-request/order','/custom-request/pay','/custom-request/quote','/custom-request/consent'];
  const DYNAMIC_SELECTOR=[
    '#grid','#catalog','#movieGrid','#homeFeaturedProductsMount','#shopGrid','#productsGrid','#toolsGrid','#suppliesGrid',
    '[data-product-grid]','[data-product-card]','[data-product-id]','[data-inventory-item]','[data-tools-grid]','[data-supplies-grid]',
    '.catalog-grid[data-dynamic]','.product-grid','.product-card','.inventory-grid','.inventory-item'
  ].join(',');

  function normalizePath(value){
    let p=text(value)||'/';
    if(p==='@site')return '@site';
    try{if(/^https?:\/\//i.test(p))p=new URL(p,location.origin).pathname;}catch{}
    if(!p.startsWith('/'))p='/'+p;
    p=p.replace(/\/{2,}/g,'/');
    if(p.length>1&&!p.endsWith('/'))p+='/';
    return p||'/';
  }
  function apiPath(value){
    const p=normalizePath(value);
    return p==='@site'?'@site':(p.length>1?p.slice(0,-1):'/');
  }
  function blockedPath(value){
    const p=apiPath(value).toLowerCase();
    if(p==='@site')return false;
    return BLOCKED_PATHS.some(prefix=>p===prefix||p.startsWith(prefix+'/'));
  }
  function pathValue(){return text(id('mediaPagePath')?.value)||'/';}
  function inspectPathValue(){return normalizePath(id('mediaInspectPath')?.value||'/');}

  function msg(message,type='info'){
    const el=id('mediaStudioMessage'); if(!el)return;
    el.hidden=false; el.className=`card small media-studio-message ${type}`; el.textContent=message;
  }
  async function read(response,fallback='Request failed.'){
    const raw=await response.text().catch(()=>''),ct=text(response.headers.get('content-type')).toLowerCase();let data=null;
    if(raw&&(ct.includes('json')||/^\s*[\[{]/.test(raw))){try{data=JSON.parse(raw);}catch{}}
    if(response.ok&&data?.ok)return data;
    throw new Error(data?.error||data?.detail||`${fallback} (${response.status||'network'})`);
  }
  async function api(body){return read(await window.DDAuth.apiFetch('/api/admin/media-content-studio',{method:'POST',body:JSON.stringify(body)}),'Media Studio update failed.');}

  function currentQuery(){
    const params=new URLSearchParams({path:apiPath(pathValue()),limit:'160'});
    const q=text(id('mediaSearch')?.value),type=text(id('mediaTypeFilter')?.value),assignment=text(id('mediaAssignmentFilter')?.value);
    if(q)params.set('q',q); if(type)params.set('media_type',type); if(assignment)params.set('assignment',assignment);
    if(state.selected?.media_asset_id)params.set('media_id',String(state.selected.media_asset_id));
    return params;
  }

  function catalogPages(){return (state.catalog?.groups||[]).flatMap(g=>(g.pages||[]).map(p=>({...p,group_key:g.key,group_label:g.label})));}
  function findCatalogPage(path){const wanted=normalizePath(path);return catalogPages().find(p=>normalizePath(p.path)===wanted)||null;}
  function selectedSection(){return state.sitewideArea||text(id('mediaSectionFilter')?.value)||'all';}

  async function loadCatalog(){
    try{
      const response=await fetch('/public/data/media-content-page-catalog.json?v=257',{cache:'no-store'});
      if(!response.ok)throw new Error('Page directory unavailable.');
      state.catalog=await response.json();
    }catch{
      state.catalog={groups:[{key:'core',label:'Core website',pages:[
        {path:'/',label:'Home'},{path:'/about/',label:'About'},{path:'/gallery/',label:'Gallery'},
        {path:'/creations/',label:'Showcase / Creations'},{path:'/workshop-journal/',label:'Workshop / Workroom Journal'}
      ]}]};
    }
    renderPageDirectory();
  }

  function renderPageDirectory(){
    const select=id('mediaPageSelect'); if(!select)return;
    const groups=state.catalog?.groups||[];
    select.innerHTML=groups.map(group=>`<optgroup label="${esc(group.label)}">${(group.pages||[]).map(page=>`<option value="${esc(page.path)}">${esc(page.label)}</option>`).join('')}</optgroup>`).join('');
    if(state.pagePath!=='@site'){
      const normalized=normalizePath(state.inspectPath||state.pagePath);
      const match=catalogPages().find(p=>normalizePath(p.path)===normalized);
      if(match)select.value=match.path;
    }
    const common=id('mediaCommonPages');
    const pages=catalogPages().filter(p=>COMMON_PATHS.includes(normalizePath(p.path)));
    common.innerHTML=pages.map(p=>`<button class="media-page-chip" type="button" data-common-path="${esc(p.path)}"><strong>${esc(p.label)}</strong></button>`).join('');
    common.querySelectorAll('[data-common-path]').forEach(button=>button.addEventListener('click',()=>choosePage(button.dataset.commonPath,'all')));
    renderDirectorySummary();
  }

  function renderDirectorySummary(){
    const el=id('mediaDirectorySummary'); if(!el)return;
    const registered=state.pages.find(p=>String(p.page_path)===String(state.pagePath));
    const label=state.pagePath==='@site'?`Site-wide ${state.sitewideArea==='header'?'Header & Navigation':state.sitewideArea==='footer'?'Footer':state.sitewideArea==='background'?'Backgrounds':'presentation'}`:state.pageLabel;
    const count=Number(registered?.slot_count||0);
    el.innerHTML=`<strong>${esc(label)}</strong><span>${esc(state.inspectPath||'/')}</span><span>${count?`${count} registered editable locations`:'Not registered yet — scan first'}</span>`;
  }

  function choosePage(path,section='all'){
    const page=findCatalogPage(path);
    if(!page||blockedPath(path)){
      msg('That route is not part of the static-site Media Studio directory. Product, tools, supplies and operational routes use their own editors.','error');
      return;
    }
    state.sitewideArea=''; state.pagePath=apiPath(path); state.inspectPath=normalizePath(path); state.pageLabel=page.label; state.section=section;
    id('mediaPagePath').value=state.pagePath; id('mediaInspectPath').value=state.inspectPath; id('mediaPageSelect').value=page.path; id('mediaSectionFilter').value=section;
    state.inspected=[]; id('mediaRegisterSlots').disabled=true; renderInspection(); load();
  }

  function chooseSitewide(area){
    if(!['header','footer','background'].includes(area))return;
    state.sitewideArea=area; state.pagePath='@site'; state.inspectPath='/'; state.pageLabel=area==='header'?'Header & Navigation':area==='footer'?'Footer':'Site Backgrounds'; state.section=area;
    id('mediaPagePath').value='@site'; id('mediaInspectPath').value='/'; id('mediaSectionFilter').value=area==='background'?'background':'all';
    state.inspected=[]; id('mediaRegisterSlots').disabled=true; renderInspection(); load();
  }

  async function load(){
    state.pagePath=apiPath(pathValue()); state.section=selectedSection();
    id('mediaCurrentPageLabel').textContent=state.pagePath==='@site'?`Site-wide: ${state.pageLabel}`:`Page: ${state.pageLabel}`;
    try{
      const data=await read(await window.DDAuth.apiFetch(`/api/admin/media-content-studio?${currentQuery()}`),'Media Studio could not load.');
      state.media=data.media||[]; state.slots=data.slots||[]; state.pages=data.pages||[]; state.uses=data.media_uses||[];
      if(state.selected){const fresh=state.media.find(x=>Number(x.media_asset_id)===Number(state.selected.media_asset_id));state.selected=fresh||null;}
      renderAll();
    }catch(e){msg(e.message,'error');}
  }

  function fmtBytes(v){const n=Number(v||0);if(!n)return 'size unknown';if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`;}
  function renderLibrary(){
    const el=id('mediaLibraryGrid');
    if(!state.media.length){el.innerHTML='<p class="small">No static-site media matched this filter. Product/inventory/tool/supply media is intentionally not included here.</p>';return;}
    el.innerHTML=state.media.map(m=>`<button type="button" class="media-thumb ${state.selected?.media_asset_id===m.media_asset_id?'selected':''}" data-media-id="${m.media_asset_id}"><span class="media-thumb-img">${m.public_url?`<img loading="lazy" src="${esc(m.public_url)}" alt=""/>`:'<span class="media-no-preview">No preview</span>'}</span><span class="media-thumb-copy"><strong>${esc(m.display_name||m.original_filename||m.object_key)}</strong><small>${esc(m.media_type||'photo')} • ${Number(m.assignment_count||0)?`Assigned ${m.assignment_count}`:'Unassigned'}</small><small>${esc(m.width_px&&m.height_px?`${m.width_px}×${m.height_px}`:fmtBytes(m.file_size_bytes))}</small></span></button>`).join('');
    el.querySelectorAll('[data-media-id]').forEach(b=>b.addEventListener('click',()=>selectMedia(Number(b.dataset.mediaId))));
  }
  async function selectMedia(mediaId){
    state.selected=state.media.find(x=>Number(x.media_asset_id)===mediaId)||null; renderLibrary(); renderSelected(); if(!state.selected)return;
    try{const params=currentQuery();params.set('media_id',String(mediaId));const data=await read(await window.DDAuth.apiFetch(`/api/admin/media-content-studio?${params}`),'Could not load image uses.');state.uses=data.media_uses||[];state.slots=data.slots||state.slots;renderSelected();renderSlots();}
    catch(e){msg(e.message,'error');}
  }
  function setVal(key,value){const el=id(key);if(el)el.value=value??'';}
  function renderSelected(){
    const empty=id('mediaSelectedEmpty'),editor=id('mediaSelectedEditor'),m=state.selected;
    if(!m){empty.hidden=false;editor.hidden=true;id('mediaSelectedId').textContent='No selection';return;}
    empty.hidden=true;editor.hidden=false;id('mediaSelectedId').textContent=`Media #${m.media_asset_id}`;
    const img=id('mediaSelectedPreview');img.src=m.public_url||'/assets/mark.png';img.style.objectPosition=`${Math.round(Number(m.focal_x??.5)*100)}% ${Math.round(Number(m.focal_y??.5)*100)}%`;
    id('mediaSelectedTechnical').textContent=[m.original_filename||m.object_key,m.width_px&&m.height_px?`${m.width_px}×${m.height_px}`:'dimensions unknown',fmtBytes(m.file_size_bytes)].filter(Boolean).join(' • ');
    setVal('mediaDisplayName',m.display_name||'');setVal('mediaEditorType',m.media_type||'photo');setVal('mediaAltText',m.alt_text||'');setVal('mediaImageTitle',m.image_title||'');setVal('mediaTags',(m.tags||[]).join(', '));setVal('mediaCaption',m.caption||'');setVal('mediaDescription',m.description||'');setVal('mediaSearchKeywords',m.search_keywords||'');setVal('mediaSourceType',m.source_type||'');setVal('mediaFocalX',m.focal_x??.5);setVal('mediaFocalY',m.focal_y??.5);id('mediaDecorative').checked=Number(m.decorative||0)===1;setVal('mediaAttribution',m.attribution||'');setVal('mediaCapturedAt',m.captured_at?String(m.captured_at).slice(0,10):'');setVal('mediaLicenseNotes',m.license_notes||'');setVal('mediaConsentNotes',m.consent_notes||'');
    renderTargets();renderUses();
  }

  function sectionFromSlot(slot){
    const selector=String(slot.target_selector||'').toLowerCase(),label=String(slot.slot_label||'').toLowerCase();
    if(selector.includes('.nav')||selector.includes('header')||selector.includes(' nav')||label.includes('header')||label.includes('navigation'))return 'header';
    if(selector.includes('.footer')||selector.includes('footer')||label.includes('footer'))return 'footer';
    if(slot.slot_type==='background')return 'background';
    if(selector.includes('hero')||selector.includes('banner')||label.includes('hero')||label.includes('banner'))return 'banner';
    if(selector.includes('gallery')||selector.includes('showcase')||label.includes('gallery')||label.includes('showcase'))return 'gallery';
    return 'content';
  }
  function visibleSlots(){
    const wanted=state.sitewideArea||state.section||'all';
    return state.slots.filter(slot=>{
      const section=sectionFromSlot(slot);
      if(state.pagePath!=='@site'&&(section==='header'||section==='footer'))return false;
      if(wanted==='all')return true;
      return section===wanted;
    });
  }
  function renderTargets(){
    const select=id('mediaAssignmentTarget');if(!select)return;
    const slots=visibleSlots().filter(s=>s.slot_type==='image'||s.slot_type==='background');
    select.innerHTML='<option value="">Choose a static site image slot…</option>'+slots.map(s=>`<option value="${s.media_content_slot_id}">${s.media_asset_id?'✓ ':''}${esc(s.slot_label)}${s.media_asset_id?` — ${esc(s.display_name||s.original_filename||'occupied')}`:' — authored image'}</option>`).join('');
  }
  function renderUses(){
    const el=id('mediaExistingUses'),uses=state.uses||[];
    if(!uses.length){el.innerHTML='<p class="small">No active static-site assignments.</p>';return;}
    el.innerHTML=uses.map(u=>`<div class="media-use-row"><div><strong>${esc(u.slot_label)}</strong><span class="small">${esc(u.page_path==='@site'?'Site-wide':u.page_path)} • ${esc(u.slot_type)}</span></div><div>${u.page_path!=='@site'?`<a class="btn" target="_blank" href="${esc(u.page_path||'/')}">Open page</a>`:''}<button class="btn" type="button" data-remove-use="${u.media_content_slot_id}">Remove assignment</button></div></div>`).join('');
    el.querySelectorAll('[data-remove-use]').forEach(b=>b.addEventListener('click',()=>removeAssignment(Number(b.dataset.removeUse))));
  }
  function renderPages(){renderDirectorySummary();}

  function renderSlots(){
    const el=id('mediaPageSlots'),slots=visibleSlots();
    if(!slots.length){el.innerHTML='<div class="media-empty-slot-guide"><strong>No editable static locations registered for this selected area yet.</strong><p class="small">Click <b>Scan selected area</b>, review the static locations found, then <b>Make scanned locations editable</b>. Registration alone does not publish anything.</p></div>';return;}
    el.innerHTML=slots.map(s=>{
      const section=sectionFromSlot(s);
      if(s.slot_type==='text')return `<article class="media-slot-card text"><div class="media-slot-head"><div><strong>${esc(s.slot_label)}</strong><span class="small">${esc(section)} • text</span></div><span class="media-slot-status ${s.published?'published':''}">${s.published?'Published override':'Authored text'}</span></div><div class="media-source-snapshot small"><b>Original:</b> ${esc(s.source_snapshot||'')}</div><label><span class="small">Draft replacement text</span><textarea class="input" rows="4" data-text-slot="${s.media_content_slot_id}">${esc(s.draft_text??s.source_snapshot??'')}</textarea></label><div class="media-slot-actions"><button class="btn" data-save-draft="${s.media_content_slot_id}">Save draft</button><button class="btn primary" data-publish-text="${s.media_content_slot_id}">Publish text</button>${s.published?`<button class="btn" data-unpublish-text="${s.media_content_slot_id}">Use authored text again</button>`:''}</div></article>`;
      return `<article class="media-slot-card image"><div class="media-slot-head"><div><strong>${esc(s.slot_label)}</strong><span class="small">${esc(section)} • ${esc(s.slot_type)}</span></div><span class="media-slot-status ${s.media_asset_id?'assigned':''}">${s.media_asset_id?'✓ Assigned':'Authored image'}</span></div><div class="media-slot-preview"><div>${s.public_url?`<img src="${esc(s.public_url)}" alt=""/>`:'<div class="media-slot-placeholder">No Media Studio override</div>'}</div><div><p class="small"><b>Authored source:</b><br>${esc(s.source_snapshot||'not recorded')}</p>${s.media_asset_id?`<p class="small"><b>Assigned:</b> ${esc(s.display_name||s.original_filename||`Media ${s.media_asset_id}`)}</p>`:''}</div></div><div class="media-slot-actions"><button class="btn primary" data-assign-slot="${s.media_content_slot_id}" ${state.selected?'':'disabled'}>${state.selected?'Assign selected site image':'Select a site image first'}</button>${s.media_asset_id?`<button class="btn" data-remove-slot="${s.media_content_slot_id}">Remove override</button>`:''}</div></article>`;
    }).join('');
    el.querySelectorAll('[data-assign-slot]').forEach(b=>b.addEventListener('click',()=>assign(Number(b.dataset.assignSlot))));
    el.querySelectorAll('[data-remove-slot]').forEach(b=>b.addEventListener('click',()=>removeAssignment(Number(b.dataset.removeSlot))));
    el.querySelectorAll('[data-save-draft]').forEach(b=>b.addEventListener('click',()=>saveText(Number(b.dataset.saveDraft),false)));
    el.querySelectorAll('[data-publish-text]').forEach(b=>b.addEventListener('click',()=>saveText(Number(b.dataset.publishText),true)));
    el.querySelectorAll('[data-unpublish-text]').forEach(b=>b.addEventListener('click',()=>unpublishText(Number(b.dataset.unpublishText))));
  }
  function renderAll(){renderLibrary();renderSelected();renderPages();renderSlots();}

  function cssToken(v){return String(v||'').replace(/([^a-zA-Z0-9_-])/g,'\\$1');}
  function stableClasses(el){return Array.from(el.classList||[]).filter(c=>/^[a-zA-Z][a-zA-Z0-9_-]{1,60}$/.test(c)&&!/^js-|^is-|^has-|^active$|^selected$/.test(c)).slice(0,2);}
  function selectorSegment(node){
    const tag=node.tagName.toLowerCase(); if(node.id)return `#${cssToken(node.id)}`;
    const classes=stableClasses(node); return tag+classes.map(c=>`.${cssToken(c)}`).join('');
  }
  function selectorFor(el){
    if(el.id)return `#${cssToken(el.id)}`;
    const parts=[];let node=el;
    while(node&&node.nodeType===1&&node.tagName.toLowerCase()!=='html'){
      if(node.tagName.toLowerCase()==='body'){parts.unshift('body');break;}
      let segment=selectorSegment(node);
      const parent=node.parentElement;
      if(parent){const same=Array.from(parent.children||[]).filter(s=>selectorSegment(s)===segment);if(same.length>1)segment+=`:nth-of-type(${Array.from(parent.children).filter(s=>s.tagName===node.tagName).indexOf(node)+1})`;}
      parts.unshift(segment); node=parent; if(parts.length>7)break;
    }
    return parts.join(' > ');
  }
  function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
  function dynamicElement(el){try{return !!el.closest(DYNAMIC_SELECTOR);}catch{return false;}}
  function elementSection(el,type){
    if(el.closest?.('.nav,header,nav'))return 'header';
    if(el.closest?.('.footer,footer'))return 'footer';
    if(type==='background')return 'background';
    if(el.closest?.('.banner,.hero,[class*="hero"],[class*="banner"]'))return 'banner';
    if(el.closest?.('[class*="gallery"],[class*="showcase"],.published-gallery-features'))return 'gallery';
    return 'content';
  }
  function includeSection(section){
    const wanted=state.sitewideArea||text(id('mediaSectionFilter')?.value)||'all';
    if(state.pagePath==='@site')return section===wanted;
    if(section==='header'||section==='footer')return false;
    return wanted==='all'||section===wanted;
  }
  function humanLabel(el,type,index,section){
    const alt=text(el.getAttribute?.('alt')),aria=text(el.getAttribute?.('aria-label')),heading=text(el.textContent).replace(/\s+/g,' ').slice(0,80);
    const prefix={header:'Header',footer:'Footer',banner:'Banner / Hero',gallery:'Gallery / Showcase',background:'Background',content:'Content'}[section]||'Page';
    if(type==='image')return alt?`${prefix} image — ${alt.slice(0,70)}`:`${prefix} image ${index+1}`;
    if(type==='background')return aria?`${prefix} — ${aria}`:`${prefix} image ${index+1}`;
    return `${prefix} text — ${heading||`Text ${index+1}`}`;
  }

  async function inspectPage(){
    const path=inspectPathValue();
    if(blockedPath(path)){msg('That page is not a static Media Studio target. Product, tools, supplies, account and transactional pages use their own editors.','error');return;}
    id('mediaInspectorStatus').textContent='Scanning static page presentation without changing it…'; let frame=null;
    try{
      frame=document.createElement('iframe');frame.setAttribute('aria-hidden','true');frame.setAttribute('sandbox','allow-same-origin');frame.style.cssText='position:fixed;left:-12000px;top:0;width:1440px;height:1000px;opacity:0;pointer-events:none;';document.body.appendChild(frame);
      const loaded=new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Page scan timed out.')),12000);frame.onload=()=>{clearTimeout(timeout);resolve();};frame.onerror=()=>{clearTimeout(timeout);reject(new Error('The public page could not be loaded for scanning.'));};});
      frame.src=path; await loaded; await new Promise(resolve=>setTimeout(resolve,250));
      const doc=frame.contentDocument;if(!doc)throw new Error('The public page could not be read.');const win=frame.contentWindow,found=[];

      let imageIndex=0;
      for(const el of Array.from(doc.querySelectorAll('img[src]')).slice(0,220)){
        if(dynamicElement(el))continue;const section=elementSection(el,'image');if(!includeSection(section))continue;const selector=selectorFor(el);if(!selector)continue;
        found.push({slot_key:`image.${hash(selector)}`,slot_label:humanLabel(el,'image',imageIndex++,section),slot_type:'image',target_selector:selector,target_attribute:'src',source_snapshot:el.getAttribute('src')||'',source_alt_snapshot:el.getAttribute('alt')||'',is_required:section==='banner'&&el.closest?.('.hero')?1:0,section_group:section});
      }
      let bgIndex=0;
      for(const el of Array.from(doc.body?.querySelectorAll('*')||[]).slice(0,1500)){
        if(dynamicElement(el))continue;let background='';try{background=String(win?.getComputedStyle(el)?.backgroundImage||'');}catch{}
        if(!background||background==='none'||!background.includes('url('))continue;const section=elementSection(el,'background');if(!includeSection(section))continue;const selector=selectorFor(el);if(!selector)continue;
        found.push({slot_key:`background.${hash(selector)}`,slot_label:humanLabel(el,'background',bgIndex++,section),slot_type:'background',target_selector:selector,target_attribute:'background-image',source_snapshot:background.slice(0,1000),source_alt_snapshot:text(el.getAttribute?.('aria-label')),is_required:0,section_group:section});if(bgIndex>=120)break;
      }
      const textSelector='h1,h2,h3,p,li,a.btn,.badge,.nav a,.nav .brand div,.footer,footer p,footer a,footer li';
      let textIndex=0;
      for(const el of Array.from(doc.querySelectorAll(textSelector)).slice(0,300)){
        if(dynamicElement(el)||el.closest?.('script,style,noscript,form'))continue;const section=elementSection(el,'text');if(!includeSection(section))continue;
        const selector=selectorFor(el),value=text(el.textContent).replace(/\s+/g,' ');if(!selector||!value||value.length>5000)continue;
        found.push({slot_key:`text.${hash(selector)}`,slot_label:humanLabel(el,'text',textIndex++,section),slot_type:'text',target_selector:selector,target_attribute:'textContent',source_snapshot:value,source_alt_snapshot:'',is_required:el.tagName==='H1'?1:0,section_group:section});
      }
      const unique=new Map(found.map(x=>[`${x.slot_type}:${x.target_selector}`,x]));state.inspected=Array.from(unique.values()).slice(0,300);id('mediaRegisterSlots').disabled=!state.inspected.length;
      const sectionLabel=state.sitewideArea?state.pageLabel:(id('mediaSectionFilter').selectedOptions?.[0]?.textContent||'selected area');
      id('mediaInspectorStatus').textContent=`Scanned ${sectionLabel}: ${state.inspected.filter(x=>x.slot_type==='image').length} images, ${state.inspected.filter(x=>x.slot_type==='background').length} backgrounds and ${state.inspected.filter(x=>x.slot_type==='text').length} text locations. Dynamic product/inventory/tool/supply content was ignored.`;
      renderInspection();
    }catch(e){state.inspected=[];id('mediaRegisterSlots').disabled=true;id('mediaInspectorStatus').textContent='Scan failed.';msg(`Could not scan ${path}: ${e.message}`,'error');}
    finally{frame?.remove();}
  }
  function renderInspection(){
    const el=id('mediaInspectionPreview');if(!state.inspected.length){el.innerHTML='<p class="small">No static locations scanned yet.</p>';return;}
    el.innerHTML=state.inspected.map(x=>`<div class="media-inspection-row"><span class="media-slot-type">${esc(x.section_group||x.slot_type)}</span><div><strong>${esc(x.slot_label)}</strong><small>${esc(x.slot_type)} • ${esc(x.target_selector)}</small></div><code>${esc(String(x.source_snapshot||'').slice(0,140))}</code></div>`).join('');
  }
  async function registerSlots(){
    if(!state.inspected.length)return;
    try{const data=await api({action:'register_slots',page_path:state.pagePath,slots:state.inspected});msg(data.message,'success');state.slots=data.slots||[];state.inspected=[];id('mediaRegisterSlots').disabled=true;await load();}
    catch(e){msg(e.message,'error');}
  }
  async function saveMetadata(){
    if(!state.selected)return;
    try{const body={action:'save_media_metadata',media_asset_id:state.selected.media_asset_id,display_name:id('mediaDisplayName').value,media_type:id('mediaEditorType').value,alt_text:id('mediaAltText').value,image_title:id('mediaImageTitle').value,tags:id('mediaTags').value,caption:id('mediaCaption').value,description:id('mediaDescription').value,search_keywords:id('mediaSearchKeywords').value,source_type:id('mediaSourceType').value,focal_x:id('mediaFocalX').value,focal_y:id('mediaFocalY').value,decorative:id('mediaDecorative').checked,attribution:id('mediaAttribution').value,captured_at:id('mediaCapturedAt').value,license_notes:id('mediaLicenseNotes').value,consent_notes:id('mediaConsentNotes').value};const data=await api(body);msg(data.message,'success');await load();}
    catch(e){msg(e.message,'error');}
  }
  async function assign(slotId){
    if(!state.selected){msg('Select an image from the Static Site Media Library first.','error');return;}
    const slot=state.slots.find(s=>Number(s.media_content_slot_id)===Number(slotId));if(slot?.media_asset_id&&Number(slot.media_asset_id)!==Number(state.selected.media_asset_id)){if(!confirm(`“${slot.slot_label}” is occupied by ${slot.display_name||slot.original_filename||'another image'}. Replace only this site placement with ${state.selected.display_name||state.selected.original_filename}?`))return;}
    try{const data=await api({action:'assign_media',media_content_slot_id:slotId,media_asset_id:state.selected.media_asset_id});msg(data.message,'success');await load();}catch(e){msg(e.message,'error');}
  }
  async function removeAssignment(slotId){if(!confirm('Remove this Media Studio override and return this placement to the website image/text authored in code?'))return;try{const data=await api({action:'remove_assignment',media_content_slot_id:slotId});msg(data.message,'success');await load();}catch(e){msg(e.message,'error');}}
  async function saveText(slotId,publish){const field=document.querySelector(`[data-text-slot="${slotId}"]`);if(!field)return;if(publish&&!confirm('Publish this replacement text to this exact static website location?'))return;try{const data=await api({action:'save_content_block',media_content_slot_id:slotId,draft_text:field.value,publish});msg(data.message,'success');await load();}catch(e){msg(e.message,'error');}}
  async function unpublishText(slotId){if(!confirm('Stop using this text override and return to the website text authored in code?'))return;try{const data=await api({action:'unpublish_content',media_content_slot_id:slotId});msg(data.message,'success');await load();}catch(e){msg(e.message,'error');}}
  async function upload(){const file=id('mediaUploadFile').files?.[0];if(!file){msg('Choose an image file first.','error');return;}const form=new FormData();form.append('file',file);form.append('upload_scope',id('mediaUploadScope').value||'general');form.append('attach_to_product','0');form.append('variant_role','library');try{id('mediaUploadButton').disabled=true;const data=await read(await window.DDAuth.apiFetch('/api/admin/media-upload',{method:'POST',body:form}),'Image upload failed.');msg(`${data.message} It is in the static site library but not assigned anywhere.`,'success');id('mediaUploadFile').value='';await load();if(data.asset?.media_asset_id)await selectMedia(Number(data.asset.media_asset_id));}catch(e){msg(e.message,'error');}finally{id('mediaUploadButton').disabled=false;}}
  async function replaceFile(){if(!state.selected)return;const file=id('mediaReplaceFile').files?.[0];if(!file){msg('Choose the replacement image file first.','error');return;}const password=prompt('Confirm the administrator password to replace this public site image while keeping its placements.');if(password===null)return;const form=new FormData();form.append('media_asset_id',String(state.selected.media_asset_id));form.append('file',file);form.append('confirm_password',password);try{id('mediaReplaceButton').disabled=true;const data=await read(await window.DDAuth.apiFetch('/api/admin/media-content-replace',{method:'POST',body:form}),'Image replacement failed.');msg(data.message,'success');id('mediaReplaceFile').value='';await load();}catch(e){msg(e.message,'error');}finally{id('mediaReplaceButton').disabled=false;}}
  async function syncR2(){const prefix=id('mediaR2Prefix').value;if(!prefix){msg('Choose a static site-media folder before syncing R2. Product, tool, supply and inventory folders are intentionally unavailable here.','error');return;}try{const data=await api({action:'sync_r2',prefix,cursor:state.r2Cursor||'',limit:100});state.r2Cursor=data.next_cursor||'';id('mediaR2Status').textContent=`${data.message}${data.truncated?' More site-media objects remain; click again to continue.':' Sync page complete.'}`;msg(data.message,'success');await load();}catch(e){id('mediaR2Status').textContent=e.message;msg(e.message,'error');}}
  async function archive(){if(!state.selected)return;if(!confirm(`Archive ${state.selected.display_name||state.selected.original_filename}? Assigned site images must be unassigned first.`))return;try{const data=await api({action:'archive_media',media_asset_id:state.selected.media_asset_id});msg(data.message,'success');state.selected=null;await load();}catch(e){msg(e.message,'error');}}
  async function del(){if(!state.selected)return;const phrase=`DELETE ${state.selected.media_asset_id}`;const confirmText=prompt(`Permanent deletion is allowed only when this static site image is unassigned. Type ${phrase} to delete it from public R2 and retire the library record.`);if(confirmText!==phrase)return;try{const data=await api({action:'delete_media',media_asset_id:state.selected.media_asset_id,confirm:confirmText});msg(data.message,'success');state.selected=null;await load();}catch(e){msg(e.message,'error');}}

  function bind(){
    id('mediaRefreshStudio').addEventListener('click',load);id('mediaReloadLibrary').addEventListener('click',load);id('mediaInspectPage').addEventListener('click',inspectPage);id('mediaRegisterSlots').addEventListener('click',registerSlots);id('mediaOpenPublicPage').addEventListener('click',()=>window.open(inspectPathValue(),'_blank'));
    id('mediaPageSelect').addEventListener('change',()=>choosePage(id('mediaPageSelect').value,'all'));
    id('mediaSectionFilter').addEventListener('change',()=>{const value=id('mediaSectionFilter').value;if(value==='header'||value==='footer'){chooseSitewide(value);return;}if(state.sitewideArea){const page=findCatalogPage(id('mediaPageSelect').value)||findCatalogPage('/') ;state.sitewideArea='';state.pagePath=apiPath(page.path);state.inspectPath=normalizePath(page.path);state.pageLabel=page.label;id('mediaPagePath').value=state.pagePath;id('mediaInspectPath').value=state.inspectPath;}state.section=value;renderSelected();renderSlots();renderDirectorySummary();});
    document.querySelectorAll('[data-sitewide-area]').forEach(b=>b.addEventListener('click',()=>chooseSitewide(b.dataset.sitewideArea)));
    document.querySelectorAll('[data-page-path]').forEach(b=>b.addEventListener('click',()=>choosePage(b.dataset.pagePath,b.dataset.section||'all')));
    let timer;id('mediaSearch').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(load,300);});id('mediaTypeFilter').addEventListener('change',load);id('mediaAssignmentFilter').addEventListener('change',load);
    id('mediaSaveMetadata').addEventListener('click',saveMetadata);id('mediaAssignSelected').addEventListener('click',()=>{const slotId=Number(id('mediaAssignmentTarget').value||0);if(slotId)assign(slotId);else msg('Choose a registered static image placement first.','error');});
    id('mediaUploadButton').addEventListener('click',upload);id('mediaReplaceButton').addEventListener('click',replaceFile);id('mediaSyncR2').addEventListener('click',syncR2);id('mediaArchive').addEventListener('click',archive);id('mediaDelete').addEventListener('click',del);
    document.querySelectorAll('.mediaPresetFilter').forEach(b=>b.addEventListener('click',()=>{id('mediaTypeFilter').value=b.dataset.type||'';load();}));
  }

  async function start(){
    bind(); await loadCatalog();
    const params=new URLSearchParams(location.search),requested=params.get('path');
    if(requested&&requested!=='@site'&&findCatalogPage(requested)&&!blockedPath(requested))choosePage(requested,'all');
    else choosePage('/','all');
    if(params.get('media_type')){id('mediaTypeFilter').value=params.get('media_type');await load();}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
