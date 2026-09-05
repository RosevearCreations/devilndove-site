// Release 467 Build 60 — transparent public-media recovery.
// If assets.devilndove.com fails, retry the same approved public R2 key through
// the same-origin read-only /api/product-media endpoint. No media is mutated.
(()=>{
  'use strict';
  if(window.DDProductMediaFallback?.installed)return;
  const PUBLIC_HOST='assets.devilndove.com';
  const FLAG='ddMediaFallbackAttempted';
  const PUBLIC_PREFIXES=['/products/','/Itemsforsale/','/itemsforsale/','/Toolshed/','/Tools/','/Supplies/','/toolshed/','/tools/','/supplies/'];

  function fallbackUrl(raw){
    try{
      const url=new URL(String(raw||''),window.location.href);
      if(url.protocol!=='https:'||url.hostname.toLowerCase()!==PUBLIC_HOST)return '';
      if(!PUBLIC_PREFIXES.some(prefix=>url.pathname.startsWith(prefix)))return '';
      const key=url.pathname.replace(/^\/+/, '');
      if(!key||key.includes('..')||key.includes('\\'))return '';
      return `/api/product-media?key=${encodeURIComponent(key)}`;
    }catch{return '';}
  }

  function recoverImage(img){
    if(!(img instanceof HTMLImageElement))return false;
    if(img.dataset[FLAG]==='1')return false;
    const fallback=fallbackUrl(img.currentSrc||img.src||img.getAttribute('src')||'');
    if(!fallback)return false;
    img.dataset[FLAG]='1';
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src=fallback;
    img.classList.add('dd-product-media-fallback-active');
    return true;
  }

  function scan(root=document){
    const images=[];
    if(root instanceof HTMLImageElement)images.push(root);
    if(root?.querySelectorAll)images.push(...root.querySelectorAll('img'));
    for(const img of images){
      const raw=img.currentSrc||img.src||img.getAttribute('src')||'';
      if(!fallbackUrl(raw))continue;
      if(img.complete&&Number(img.naturalWidth||0)===0)recoverImage(img);
    }
  }

  document.addEventListener('error',(event)=>{
    if(event.target instanceof HTMLImageElement)recoverImage(event.target);
  },true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>scan(document),{once:true});
  else scan(document);
  const observer=new MutationObserver((records)=>{
    for(const record of records){
      for(const node of record.addedNodes||[])if(node?.nodeType===1)scan(node);
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  window.DDProductMediaFallback={installed:true,fallbackUrl,recoverImage,scan};
})();
