// Build 59 — transparent storefront Product-media recovery.
// If the public R2 custom hostname fails, retry the exact products/* object through
// the same-origin read-only /api/product-media endpoint. No media is mutated.
(()=>{
  'use strict';
  if(window.DDProductMediaFallback?.installed)return;
  const PUBLIC_HOST='assets.devilndove.com';
  const FLAG='ddMediaFallbackAttempted';

  function fallbackUrl(raw){
    try{
      const url=new URL(String(raw||''),window.location.href);
      if(url.protocol!=='https:'||url.hostname.toLowerCase()!==PUBLIC_HOST)return '';
      if(!url.pathname.startsWith('/products/'))return '';
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

  document.addEventListener('error',(event)=>{
    if(event.target instanceof HTMLImageElement)recoverImage(event.target);
  },true);

  window.DDProductMediaFallback={installed:true,fallbackUrl,recoverImage};
})();
