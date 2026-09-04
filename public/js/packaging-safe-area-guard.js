/* Build 41 — Packaging Studio printable safe-area guard.
   Client-only, fail-closed protection for label text, ingredients, artwork and brand/logo content. */
(() => {
  'use strict';
  if (!location.pathname.startsWith('/admin/packaging-studio')) return;

  const EXPORTS='[data-packaging-export],#printOptimizedSheet';
  const PROTECTED='text,image,foreignObject,[data-packaging-safe-protected],g[id*="logo" i],g[class*="logo" i],g[id*="artwork" i],g[class*="artwork" i],g[id*="brand" i],g[class*="brand" i],g[id*="rose" i],g[class*="rose" i],g[id*="seal" i],g[class*="seal" i]';
  const GUIDE='[data-guide],[id*="guide" i],[class*="guide" i]';
  const byId=(name)=>document.getElementById(name);
  const number=(value)=>Number.isFinite(Number(value))?Number(value):NaN;
  let timer=0;
  let last={ready:false,reason:'not_checked',failures:[]};

  function meaningful(node){
    const tag=String(node.tagName||'').toLowerCase();
    if(tag==='text')return Boolean(String(node.textContent||'').trim());
    if(tag==='image')return Boolean(node.getAttribute('href')||node.getAttributeNS('http://www.w3.org/1999/xlink','href'));
    return true;
  }
  function protectedNodes(svg){
    const rows=[...svg.querySelectorAll(PROTECTED)].filter((node)=>!node.closest(GUIDE)&&meaningful(node));
    return rows.filter((node,index)=>!rows.some((other,otherIndex)=>otherIndex<index&&other.contains(node)));
  }
  function cloneForMeasurement(source){
    const host=document.createElement('div');
    host.setAttribute('aria-hidden','true');
    host.style.cssText='position:fixed;left:-12000px;top:0;width:1000px;visibility:hidden;pointer-events:none;z-index:-1';
    const svg=source.cloneNode(true);
    svg.style.cssText='display:block;width:1000px;height:auto;max-width:none';
    host.appendChild(svg);document.body.appendChild(host);return {host,svg};
  }
  function safeGeometry(svg,widthMm,heightMm,marginMm,shape){
    const root=svg.getBoundingClientRect();
    if(!(root.width>0&&root.height>0&&widthMm>0&&heightMm>0&&marginMm>=0))return null;
    if(marginMm*2>=widthMm||marginMm*2>=heightMm)return null;
    const mx=root.width*marginMm/widthMm,my=root.height*marginMm/heightMm;
    const left=root.left+mx,right=root.right-mx,top=root.top+my,bottom=root.bottom-my;
    const kind=String(shape||'').toLowerCase();
    return {left,right,top,bottom,ellipse:kind==='round'||kind==='oval',cx:(left+right)/2,cy:(top+bottom)/2,rx:(right-left)/2,ry:(bottom-top)/2};
  }
  function inside(node,safe){
    const rect=node.getBoundingClientRect(),tol=.75;
    if(!(rect.width>0&&rect.height>0))return {ok:false,why:'could not be measured'};
    if(!safe.ellipse)return {ok:rect.left>=safe.left-tol&&rect.right<=safe.right+tol&&rect.top>=safe.top-tol&&rect.bottom<=safe.bottom+tol,why:'exceeds the printable safe area'};
    if(!(safe.rx>0&&safe.ry>0))return {ok:false,why:'safe area is invalid'};
    const corners=[[rect.left,rect.top],[rect.right,rect.top],[rect.right,rect.bottom],[rect.left,rect.bottom]];
    const ok=corners.every(([x,y])=>{const dx=(x-safe.cx)/safe.rx,dy=(y-safe.cy)/safe.ry;return dx*dx+dy*dy<=1.0025;});
    return {ok,why:'exceeds the printable safe area'};
  }
  function label(node,index){
    const tag=String(node.tagName||'element').toLowerCase();
    const identity=node.id||String(node.getAttribute('class')||'').trim().split(/\s+/)[0]||(tag==='text'?String(node.textContent||'').trim().replace(/\s+/g,' ').slice(0,42):'')||`protected-${index+1}`;
    return `${tag}:${identity}`;
  }
  function validate(){
    const source=byId('packagingSvgPreview')?.querySelector('svg');
    const widthMm=number(byId('packagingTemplateWidth')?.value),heightMm=number(byId('packagingTemplateHeight')?.value),marginMm=number(byId('packagingSafeMarginMm')?.value);
    const shape=byId('packagingTemplateShape')?.value||byId('packagingSvgPreview')?.dataset?.previewShape||'';
    const failures=[];
    if(!source)failures.push('SVG preview is unavailable.');
    if(!(widthMm>0))failures.push('Physical label width is unavailable.');
    if(!(heightMm>0))failures.push('Physical label height is unavailable.');
    if(!(marginMm>=0))failures.push('Printable safe margin is unavailable.');
    if(failures.length)return {ready:false,reason:'missing_geometry',failures};
    const {host,svg}=cloneForMeasurement(source);
    try{
      const safe=safeGeometry(svg,widthMm,heightMm,marginMm,shape);
      if(!safe)return {ready:false,reason:'invalid_safe_area',failures:['Printable safe area could not be measured.']};
      const nodes=protectedNodes(svg);
      if(!nodes.length)return {ready:false,reason:'no_protected_content',failures:['No measurable protected label content was found.']};
      nodes.forEach((node,index)=>{const result=inside(node,safe);if(!result.ok)failures.push(`${label(node,index)} — ${result.why}`);});
      return {ready:failures.length===0,reason:failures.length?'protected_content_outside_safe_area':'safe',failures};
    }catch(error){return {ready:false,reason:'validation_exception',failures:[`Safe-area validation failed closed: ${error?.message||'unknown error'}`]};}
    finally{host.remove();}
  }
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function statusMount(){
    const parent=byId('packagingComplianceResults');if(!parent)return null;
    let mount=byId('packagingSafeAreaGuard');
    if(!mount){mount=document.createElement('div');mount.id='packagingSafeAreaGuard';mount.className='packaging-safe-area-status';parent.appendChild(mount);}
    return mount;
  }
  function apply(result){
    last=result;document.body.dataset.packagingSafeArea=result.ready?'safe':'blocked';
    document.querySelectorAll(EXPORTS).forEach((button)=>{button.disabled=!result.ready;button.setAttribute('aria-disabled',result.ready?'false':'true');});
    const mount=statusMount();if(!mount)return;
    mount.dataset.state=result.ready?'safe':'blocked';
    if(result.ready)mount.innerHTML='<strong>✓ Printable safe area verified</strong><span>Protected text, ingredients, artwork and brand/logo content are inside the configured safe area. Export and print are enabled.</span>';
    else mount.innerHTML=`<strong>! Export / print blocked — printable safe area is not proven</strong><span>Build 41 fails closed when protected label content is outside the safe area or cannot be measured.</span>${result.failures.length?`<ul>${result.failures.slice(0,8).map((x)=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`:''}`;
  }
  function refresh(){apply(validate());}
  function schedule(){clearTimeout(timer);timer=setTimeout(refresh,100);}
  function start(){
    const main=byId('packagingStudioMain');
    if(main)new MutationObserver(schedule).observe(main,{childList:true,subtree:true,attributes:true,characterData:true});
    document.addEventListener('input',(event)=>{if(event.target?.closest?.('#packagingStudioMain'))schedule();},true);
    document.addEventListener('change',(event)=>{if(event.target?.closest?.('#packagingStudioMain'))schedule();},true);
    document.addEventListener('click',(event)=>{const button=event.target?.closest?.(EXPORTS);if(!button)return;const result=validate();apply(result);if(!result.ready){event.preventDefault();event.stopPropagation();}},true);
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  globalThis.DDPackagingSafeArea=Object.freeze({build:41,validate,refresh,get lastResult(){return last;}});
})();
