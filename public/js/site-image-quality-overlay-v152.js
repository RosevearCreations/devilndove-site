// Release 467 Build 152 — advisory quality badges for editable website images.\n// Release 467 Build 179 successor: scoped mutation roots, debounced scans, and single-concurrency scoring.
(function(){
  'use strict';
  const scorer=window.DDImageQualityScorer;if(!scorer)return;
  const cache=new Map();
  const pending=new WeakSet();
  const text=(v)=>String(v==null?'':v).trim();
  const esc=(v)=>text(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const round=(v)=>Math.round(Number(v||0)*10)/10;
  const isStudio=()=>document.body?.dataset?.adminPage==='media-content-studio';
  const editMode=()=>document.documentElement.classList.contains('media-page-edit-mode');
  const raster=(src)=>!/\.svg(?:$|[?#])/i.test(src||'');
  const key=(src)=>text(src).replace(/[?#].*$/,'');

  function style(){
    if(document.getElementById('ddImageQualityStyleV152'))return;
    const s=document.createElement('style');s.id='ddImageQualityStyleV152';
    s.textContent=`.dd-image-quality-v152{font:600 12px/1.35 system-ui,sans-serif;border:1px solid rgba(127,127,127,.28);border-radius:10px;padding:8px 10px;margin:7px 0;background:rgba(20,20,20,.06);color:inherit}.dd-image-quality-v152 strong{font-size:13px}.dd-image-quality-v152 .ddiq-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(95px,1fr));gap:4px 8px;margin-top:6px;font-weight:500}.dd-image-quality-v152 details{margin-top:6px}.dd-image-quality-v152 summary{cursor:pointer}.dd-image-quality-v152[data-score-band="excellent"],.dd-image-quality-v152[data-score-band="good"]{border-left:4px solid currentColor}.media-page-edit-mode [data-media-slot]+.dd-image-quality-v152{display:block;max-width:420px}.dd-image-quality-v152.ddiq-error,.dd-image-quality-v152.ddiq-placeholder{font-weight:500}`;
    document.head.appendChild(s);
  }

  function band(score){const n=Number(score||0);return n>=85?'excellent':n>=70?'good':n>=55?'usable':n>=40?'reshoot':'poor';}
  function existingPanel(img){const next=img.nextElementSibling;return next?.classList?.contains('dd-image-quality-v152')?next:null;}
  function panelFor(img,src){
    let panel=existingPanel(img);
    if(panel&&panel.dataset.ddiqSrc!==key(src)){panel.remove();panel=null;}
    if(panel)return panel;
    panel=document.createElement('div');panel.className='dd-image-quality-v152';panel.dataset.ddiqSrc=key(src);panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');img.insertAdjacentElement('afterend',panel);return panel;
  }
  function components(row){return `<div class="ddiq-grid"><span>Lighting ${round(row.lighting_score)}/20</span><span>Detail ${round(row.clarity_score)}/20</span><span>Background ${round(row.background_score)}/15</span><span>Framing ${round(row.framing_score)}/15</span><span>Resolution ${round(row.resolution_score)}/10</span><span>Colour ${round(row.color_balance_score)}/10</span><span>Artifacts ${round(row.artifact_score)}/5</span><span>Consistency ${round(row.consistency_score)}/5</span></div>`;}
  function render(panel,row){panel.dataset.scoreBand=band(row.total_score);panel.innerHTML=`<strong>${round(row.total_score)}/100 — ${esc(row.category)}</strong><div>${Number(row.width_px)} × ${Number(row.height_px)} px • same Release 448 product-photo rubric</div>${components(row)}<details ${Number(row.total_score)<70?'open':''}><summary>What to improve</summary><ul>${(row.recommendations||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul></details>`;}
  function renderError(panel,message){panel.className='dd-image-quality-v152 ddiq-error';panel.innerHTML=`<strong>Image score unavailable</strong><div>${esc(message||'This image could not be read by the browser scorer.')}</div>`;}
  function renderPlaceholder(panel){panel.className='dd-image-quality-v152 ddiq-placeholder';panel.innerHTML='<strong>Placeholder / SVG</strong><div>Quality scoring begins after a photographic or raster artwork file is assigned.</div>';}

  async function score(img){
    if(pending.has(img))return;
    const src=text(img.currentSrc||img.src);if(!src)return;
    const current=existingPanel(img);if(current?.dataset.ddiqSrc===key(src))return;
    const panel=panelFor(img,src);
    if(!raster(src)){renderPlaceholder(panel);return;}
    pending.add(img);panel.innerHTML='<strong>Scoring image…</strong><div>Lighting, detail, framing, resolution and quality checks.</div>';
    try{const cacheKey=key(src);let row=cache.get(cacheKey);if(!row){row=await scorer.scoreUrl(src);cache.set(cacheKey,row);}render(panel,row);}
    catch(error){renderError(panel,error?.message||'Canvas scoring failed.');}
    finally{pending.delete(img);}
  }

  const MAX_CONCURRENT_SCORES=1;
  const scoreQueue=[];const queued=new WeakSet();let scoring=false;let scanTimer=0;
  const yieldBrowser=()=>new Promise(resolve=>(window.requestIdleCallback?window.requestIdleCallback(()=>resolve(),{timeout:120}):window.setTimeout(resolve,0)));
  async function pumpScores(){
    if(scoring)return;scoring=true;
    try{while(scoreQueue.length){const img=scoreQueue.shift();queued.delete(img);await score(img);await yieldBrowser();}}
    finally{scoring=false;}
  }
  function queueScore(img){if(!img||queued.has(img)||pending.has(img))return;queued.add(img);scoreQueue.push(img);void pumpScores();}
  const viewportObserver='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){viewportObserver.unobserve(entry.target);queueScore(entry.target);}}),{rootMargin:'240px'}):null;
  function eligibleImages(){if(isStudio())return [...document.querySelectorAll('#mediaSlotBoard img,#mediaLibraryGrid img,#mediaSelectedPreview')];if(!editMode())return [];return [...document.querySelectorAll('img[data-media-slot]')];}
  function scan(){
    style();
    if(!isStudio()&&!editMode()){document.querySelectorAll('.dd-image-quality-v152').forEach(el=>el.remove());return;}
    eligibleImages().forEach(img=>{const src=text(img.currentSrc||img.src);const panel=existingPanel(img);if(panel&&panel.dataset.ddiqSrc===key(src))return;viewportObserver?viewportObserver.observe(img):queueScore(img);});
  }
  function scheduleScan(){if(scanTimer)return;scanTimer=window.setTimeout(()=>{scanTimer=0;scan();},80);}
  const mutation=new MutationObserver(scheduleScan);
  function observeRelevantRoots(){
    mutation.disconnect();
    const roots=isStudio()
      ?['mediaSlotBoard','mediaLibraryGrid','mediaMetadataPanel'].map(id=>document.getElementById(id)).filter(Boolean)
      :(editMode()?[document.body]:[]);
    roots.forEach(root=>mutation.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['src']}));
    scheduleScan();
  }
  document.addEventListener('dd:admin-ready',observeRelevantRoots);
  window.addEventListener('load',observeRelevantRoots,{once:true});
  if(document.readyState!=='loading')observeRelevantRoots();else document.addEventListener('DOMContentLoaded',observeRelevantRoots,{once:true});
})();