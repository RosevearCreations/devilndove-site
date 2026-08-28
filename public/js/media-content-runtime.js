// Devil n Dove Release 448 — explicit static-page media/content runtime + page-specific presentation adapters.
// Public visitors only receive published D1 overrides. Admin edit controls are created only
// after dd:admin-ready confirms access. Authored content remains the fallback authority.
(()=>{
  'use strict';
  const EDIT_SESSION_KEY='dd-media-page-edit-mode';
  let adminReady=false;
  let editLinksBuilt=false;

  function pagePath(){let p=location.pathname||'/';if(p.length>1&&p.endsWith('/'))p=p.slice(0,-1);return p||'/';}
  function safeSelector(selector){try{return document.querySelector(selector);}catch{return null;}}
  function clamp(value){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0.5;}
  function applyImage(item){const el=safeSelector(item.target_selector);if(!el||!item.public_url)return false;if(item.slot_type==='background'||item.target_attribute==='background-image'){el.style.backgroundImage=`url("${String(item.public_url).replace(/["\\]/g,'\\$&')}")`;el.style.backgroundPosition=`${Math.round(clamp(item.focal_x)*100)}% ${Math.round(clamp(item.focal_y)*100)}%`;el.dataset.mediaContentOverride='1';return true;}if(el.tagName==='IMG'||item.target_attribute==='src'){el.setAttribute('src',String(item.public_url));if(el.tagName==='IMG'){el.alt=item.decorative?'':String(item.alt_text||el.alt||'');if(item.image_title)el.title=String(item.image_title);else el.removeAttribute('title');el.style.objectPosition=`${Math.round(clamp(item.focal_x)*100)}% ${Math.round(clamp(item.focal_y)*100)}%`;}el.dataset.mediaContentOverride='1';return true;}return false;}
  function applyContent(item){const el=safeSelector(item.target_selector);if(!el)return false;const type=String(item.slot_type||'text');const value=String(item.value??item.text??'');if(type==='link'||item.target_attribute==='href')el.setAttribute('href',value);else if(type==='color'||item.target_attribute==='background-color')el.style.backgroundColor=value;else el.textContent=value;el.dataset.mediaContentOverride='1';return true;}

  function requestedEditMode(){
    const q=String(new URLSearchParams(location.search).get('media-edit')||'').toLowerCase();
    if(['1','true','on','yes'].includes(q))return true;
    if(['0','false','off','no'].includes(q))return false;
    try{return sessionStorage.getItem(EDIT_SESSION_KEY)==='1';}catch{return false;}
  }
  function persistEditMode(enabled){try{sessionStorage.setItem(EDIT_SESSION_KEY,enabled?'1':'0');}catch{}}
  function targetForSlot(key){try{return document.querySelector(`[data-media-slot="${CSS.escape(key)}"],[data-content-slot="${CSS.escape(key)}"],[data-link-slot="${CSS.escape(key)}"],[data-color-slot="${CSS.escape(key)}"]`);}catch{return null;}}

  function buildEditLinks(){
    if(editLinksBuilt)return;
    editLinksBuilt=true;
    document.documentElement.dataset.mediaEditLinks='1';
    const path=location.pathname||'/';
    document.querySelectorAll('[data-media-slot]').forEach(el=>{
      const key=el.getAttribute('data-media-slot');if(!key)return;
      const host=el.parentElement;if(!host||host.querySelector(`.media-inline-admin-edit[data-slot="${CSS.escape(key)}"]`))return;
      const link=document.createElement('a');link.className='media-inline-admin-edit media-inline-image-edit';link.dataset.slot=key;link.href=`/admin/media-content-studio/?path=${encodeURIComponent(path)}&slot=${encodeURIComponent(key)}`;link.textContent=el.dataset.mediaPlaceholder==='1'?'Replace placeholder':'Edit image';link.title=`Open Media Studio for ${el.dataset.mediaLabel||key}`;host.classList.add('media-inline-edit-host');el.insertAdjacentElement('afterend',link);
    });
    document.querySelectorAll('[data-content-slot],[data-link-slot],[data-color-slot]').forEach(el=>{
      const key=el.getAttribute('data-content-slot')||el.getAttribute('data-link-slot')||el.getAttribute('data-color-slot');if(!key)return;
      const host=el.parentElement;if(host?.querySelector(`.media-inline-admin-edit[data-slot="${CSS.escape(key)}"]`))return;
      const link=document.createElement('a');link.dataset.slot=key;link.className='media-inline-admin-edit media-inline-text-edit';link.href=`/admin/media-content-studio/?path=${encodeURIComponent(path)}&slot=${encodeURIComponent(key)}`;link.textContent=el.hasAttribute('data-color-slot')?'Edit colour':el.hasAttribute('data-link-slot')?'Edit link':'Edit text';link.title=`Open Media Studio for ${el.dataset.contentLabel||key}`;el.insertAdjacentElement('afterend',link);
    });
  }

  function updateToolbar(enabled){
    const toolbar=document.getElementById('mediaPageEditToolbar');if(!toolbar)return;
    const button=toolbar.querySelector('[data-media-page-edit-toggle]');const status=toolbar.querySelector('[data-media-page-edit-status]');
    if(button){button.setAttribute('aria-pressed',enabled?'true':'false');button.textContent=enabled?'Editing ON':'Edit page';button.classList.toggle('active',enabled);}
    if(status)status.textContent=enabled?'Editable locations are visible. Turn editing off for a clean page preview.':'Clean preview. Turn editing on to reveal editable locations.';
  }

  function setEditMode(enabled,{persist=true,focusHash=false}={}){
    if(!adminReady)return;
    if(enabled)buildEditLinks();
    document.documentElement.classList.toggle('media-page-edit-mode',!!enabled);
    document.documentElement.dataset.mediaPageEditMode=enabled?'on':'off';
    if(persist)persistEditMode(!!enabled);
    updateToolbar(!!enabled);
    if(enabled&&focusHash){
      const wanted=decodeURIComponent((location.hash||'').replace(/^#/,''));const target=wanted?targetForSlot(wanted):null;
      if(target){target.classList.add('media-inline-highlight');setTimeout(()=>target.scrollIntoView({behavior:'smooth',block:'center'}),30);setTimeout(()=>target.classList.remove('media-inline-highlight'),5000);}
    }
  }

  function ensureEditToolbar(){
    if(document.getElementById('mediaPageEditToolbar'))return;
    const toolbar=document.createElement('aside');toolbar.id='mediaPageEditToolbar';toolbar.className='media-page-edit-toolbar';toolbar.setAttribute('aria-label','Page editing controls');
    toolbar.innerHTML='<div><strong>Admin page preview</strong><span data-media-page-edit-status>Clean preview. Turn editing on to reveal editable locations.</span></div><button class="media-page-edit-toggle" data-media-page-edit-toggle type="button" aria-pressed="false">Edit page</button><a class="media-page-edit-studio-link" href="/admin/media-content-studio/">Media Studio</a>';
    document.body.appendChild(toolbar);
    toolbar.querySelector('[data-media-page-edit-toggle]')?.addEventListener('click',()=>setEditMode(!document.documentElement.classList.contains('media-page-edit-mode'),{persist:true,focusHash:true}));
  }

  function loadPageEnhancements(){
    if(pagePath()!=='/movies'||document.querySelector('script[data-dd-movie-carousel-adapter]'))return;
    const script=document.createElement('script');script.src='/public/js/movie-media-carousel.js?v=448';script.defer=true;script.dataset.ddMovieCarouselAdapter='448';document.head.appendChild(script);
  }

  document.addEventListener('dd:admin-ready',e=>{
    if(!e.detail?.ok)return;
    adminReady=true;ensureEditToolbar();
    const enabled=requestedEditMode();setEditMode(enabled,{persist:true,focusHash:enabled});
  });

  async function run(){try{const response=await fetch(`/api/public-media-content-manifest?path=${encodeURIComponent(pagePath())}`,{credentials:'same-origin',headers:{Accept:'application/json'}});if(!response.ok)return;const data=await response.json();if(!data?.ok)return;const images=Array.isArray(data.images)?data.images:[],content=Array.isArray(data.content)?data.content:[];if(!images.length&&!content.length)return;const applyAll=()=>{let unresolved=0;images.forEach(item=>{if(!applyImage(item))unresolved++;});content.forEach(item=>{if(!applyContent(item))unresolved++;});return unresolved;};let unresolved=applyAll();document.documentElement.dataset.mediaContentStudio=unresolved?'partial':'applied';if(unresolved){const observer=new MutationObserver(()=>{unresolved=applyAll();document.documentElement.dataset.mediaContentStudio=unresolved?'partial':'applied';if(!unresolved)observer.disconnect();});observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),8000);}}catch{}}
  function start(){loadPageEnhancements();run();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
