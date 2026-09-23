// Release 467 Build 235 — Resume Work & Cross-Workspace Handoff.
// Presentation-only convergence over existing navigation, recent-work, favourites and Today Tasks authorities.
(() => {
  'use strict';
  const BUILD=235;
  const MANIFEST_URL='/data/admin-navigation-modules.json';
  if (!String(window.location.pathname||'').startsWith('/admin/')) return;
  const clean=(v,f='')=>String(v??'').trim()||f;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=(value)=>{try{const u=new URL(String(value||''),window.location.origin);let p=u.pathname.replace(/\/index\.html$/i,'/').replace(/\/+$/,'');return p||'/';}catch{return '';}};
  let manifestPaths=new Map();
  let dialog=null;
  let lastFocus=null;
  function flattenManifest(data){
    const map=new Map();
    for(const mod of Array.isArray(data?.modules)?data.modules:[]){
      if(mod?.href) map.set(normalize(mod.href),{href:mod.href,label:clean(mod.label,mod.href),area:clean(mod.label,'Admin')});
      for(const sec of Array.isArray(mod?.sections)?mod.sections:[]) for(const link of Array.isArray(sec?.links)?sec.links:[]){
        if(link?.href) map.set(normalize(link.href),{href:link.href,label:clean(link.label,link.href),area:clean(mod.label,'Admin'),section:clean(sec.label,'')});
      }
    }
    return map;
  }
  function allowed(row){
    const p=normalize(row?.href||row?.path);
    if(!p||!manifestPaths.has(p)) return null;
    const m=manifestPaths.get(p);
    return {href:m.href,label:clean(row?.label,m.label),area:m.area,section:m.section||'',at:row?.at||row?.visited_at||row?.pinned_at||''};
  }
  function unique(rows,limit=6){
    const seen=new Set(),out=[];
    for(const row of rows){const a=allowed(row);if(!a)continue;const k=normalize(a.href);if(seen.has(k)||k===normalize(window.location.pathname))continue;seen.add(k);out.push(a);if(out.length>=limit)break;}
    return out;
  }
  function sources(){
    const u=window.DDAdminUniversalSearchV161?.state||{};
    const memory=window.DDAdminWorkspaceMemory?.snapshot?.()?.memory||{};
    const fav126=window.DDAdminFavorites?.snapshot?.()||[];
    const recent=unique([...(Array.isArray(u.recent)?u.recent:[]),...(Array.isArray(memory.recent)?memory.recent:[]),...(memory.last?[memory.last]:[])],6);
    const favorites=unique([...(Array.isArray(u.favourites)?u.favourites:[]),...(Array.isArray(fav126)?fav126:[])],6);
    return {recent,favorites};
  }
  function handoffHref(href){
    const p=normalize(href); if(!p||!manifestPaths.has(p)) return '/admin/';
    try{const u=new URL(manifestPaths.get(p).href,window.location.origin);const current=`${window.location.pathname}${window.location.search}`;if(normalize(u.pathname)!==normalize(window.location.pathname)){u.searchParams.set('dd_return',current);u.searchParams.set('dd_return_label',clean(document.querySelector('h1')?.textContent,'previous workspace'));}return `${u.pathname}${u.search}${u.hash}`;}catch{return manifestPaths.get(p).href;}
  }
  function links(rows,empty){
    if(!rows.length)return `<p class="small">${esc(empty)}</p>`;
    return `<div class="dd-b235-links">${rows.map(r=>`<a class="btn secondary" href="${esc(handoffHref(r.href))}"><span>${esc(r.label)}</span><small>${esc(r.area)}${r.section?` · ${esc(r.section)}`:''}</small></a>`).join('')}</div>`;
  }
  function render(){
    if(!dialog)return;
    const {recent,favorites}=sources();
    const today=manifestPaths.get('/admin/today-tasks');
    dialog.innerHTML=`<section class="dd-b235-panel" role="dialog" aria-modal="true" aria-labelledby="ddB235Title">
      <div class="dd-b235-head"><div><p class="eyebrow">Release 467 Build 235</p><h2 id="ddB235Title">Resume / Continue work</h2><p class="small">Pick up where we left off, jump to a favourite, review Today Needs Attention, or open the existing universal search. Links only—nothing here executes a business action.</p></div><button class="dd-b235-close" type="button" aria-label="Close resume work">×</button></div>
      <div class="dd-b235-grid">
        <section><h3>Continue work</h3>${links(recent,'No recent manifest-backed workspaces are recorded yet.')}</section>
        <section><h3>Favourites</h3>${links(favorites,'No manifest-backed favourites are pinned yet.')}</section>
      </div>
      <section class="dd-b235-next"><h3>Needs attention</h3><p class="small">Today Tasks remains the authority for current attention and next-valid-action guidance.</p><div class="dd-b235-actions">${today?`<a class="btn" href="${esc(handoffHref(today.href))}">Open Today Needs Attention</a>`:''}<button class="btn secondary" type="button" data-dd-b235-search>Open universal search</button><a class="btn secondary" href="/admin/command-center/">Open Command Centre</a></div></section>
      <p class="small dd-b235-boundary">Navigation authority: <code>${esc(MANIFEST_URL)}</code>. Recent work and favourites remain browser convenience state owned by their existing modules.</p>
    </section>`;
    dialog.querySelector('.dd-b235-close')?.addEventListener('click',close);
    dialog.querySelector('[data-dd-b235-search]')?.addEventListener('click',()=>{close();document.querySelector('.dd-v161-launcher')?.click();});
  }
  function ensureStyle(){
    if(document.getElementById('ddB235Style'))return;
    const s=document.createElement('style');s.id='ddB235Style';s.textContent=`
    .dd-b235-launch{position:fixed;right:18px;bottom:70px;z-index:2147481990}
    .dd-b235-overlay[hidden]{display:none!important}.dd-b235-overlay{position:fixed;inset:0;z-index:2147483500;background:rgba(2,6,23,.76);display:grid;place-items:start center;padding:7vh 16px 24px;overflow:auto}
    .dd-b235-panel{width:min(900px,100%);background:var(--card,#111827);color:var(--text,#f8fafc);border:1px solid var(--border,#334155);border-radius:18px;padding:18px;box-shadow:0 24px 80px rgba(0,0,0,.5)}
    .dd-b235-head,.dd-b235-actions{display:flex;gap:10px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}.dd-b235-head h2{margin:.2rem 0}.dd-b235-close{border:0;background:transparent;color:inherit;font:inherit;font-size:1.7rem;cursor:pointer}
    .dd-b235-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.dd-b235-links{display:grid;gap:8px}.dd-b235-links .btn{display:flex;justify-content:space-between;gap:10px;text-align:left}.dd-b235-links small{opacity:.7}
    .dd-b235-next{border-top:1px solid var(--border,#334155);margin-top:18px;padding-top:14px}.dd-b235-boundary{margin-top:16px;opacity:.75}
    @media(max-width:700px){.dd-b235-grid{grid-template-columns:1fr}.dd-b235-launch{right:10px;bottom:60px}.dd-b235-overlay{padding:10px}.dd-b235-links .btn{display:block}.dd-b235-links small{display:block;margin-top:3px}}
    `;document.head.appendChild(s);
  }
  function ensureUI(){
    if(document.querySelector('[data-dd-b235-launch]'))return;
    ensureStyle();
    const b=document.createElement('button');b.type='button';b.className='btn dd-b235-launch';b.dataset.ddB235Launch='1';b.textContent='↺ Resume work';b.addEventListener('click',open);document.body.appendChild(b);
    dialog=document.createElement('div');dialog.className='dd-b235-overlay';dialog.hidden=true;dialog.addEventListener('mousedown',(e)=>{if(e.target===dialog)close();});document.body.appendChild(dialog);
  }
  function open(){lastFocus=document.activeElement;render();dialog.hidden=false;dialog.querySelector('a,button')?.focus();}
  function close(){if(!dialog)return;dialog.hidden=true;lastFocus?.focus?.();}
  async function start(){
    try{const r=await fetch(MANIFEST_URL,{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw new Error('manifest');manifestPaths=flattenManifest(await r.json());}catch{manifestPaths=new Map();}
    ensureUI();
    window.DDAdminResumeWorkV235=Object.freeze({build:BUILD,manifest:MANIFEST_URL,open,close,snapshot:()=>({manifest_paths:manifestPaths.size,...sources()})});
    document.dispatchEvent(new CustomEvent('dd:admin-resume-work-ready',{detail:{build:BUILD,manifest_paths:manifestPaths.size}}));
  }
  ['dd:workspace-memory-ready','dd:admin-favorites-ready','dd:admin-favorites-changed','dd:workspace-memory-cleared'].forEach(name=>document.addEventListener(name,()=>{if(dialog&&!dialog.hidden)render();}));
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&dialog&&!dialog.hidden)close();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void start(),{once:true});else void start();
})();