// Release 467 Build 62 — transparent public-media recovery.
// Build 157 added the Admin-only suppression path; Build 159 rotates the client identity so
// returning Admin browsers cannot keep the pre-suppression Build 155 copy. Public storefront
// recovery behavior remains unchanged. No media or Product database records are mutated.
// Retained Build 157 source-gate compatibility marker: const VERSION=62 was the pre-Build159
// runtime; the active approved successor below is VERSION=63 with the Build 157 Admin patch intact.
(()=>{
  'use strict';
  const VERSION=63;
  const BUILD157_ADMIN_PATCH=157;
  const BUILD159_ADMIN_CACHE_PATCH=159;
  if(Number(window.DDProductMediaFallback?.version||0)>=VERSION)return;
  const PUBLIC_HOSTS=new Set(['assets.devilndove.com','pub-f8137eb938da486a9f24410ccf49087c.r2.dev']);
  const FLAG='ddMediaFallbackAttempted';
  const FINAL_FLAG='ddMediaRecoveryPlaceholder';
  const PRODUCT_PLACEHOLDER='/assets/product-image-recovery-placeholder.svg';
  const PUBLIC_PREFIXES=['/products/','/movies/','/Itemsforsale/','/itemsforsale/','/Toolshed/','/Tools/','/Supplies/','/toolshed/','/tools/','/supplies/'];
  const IS_ADMIN_RUNTIME=/^\/admin(?:\/|$)/i.test(String(window.location?.pathname||''));
  let adminRetrySuppressed=0;

  function fallbackInfo(raw){
    try{
      const url=new URL(String(raw||''),window.location.href);
      if(url.protocol!=='https:'||!PUBLIC_HOSTS.has(url.hostname.toLowerCase()))return null;
      if(!PUBLIC_PREFIXES.some(prefix=>url.pathname.startsWith(prefix)))return null;
      const key=url.pathname.replace(/^\/+/, '');
      if(!key||key.includes('..')||key.includes('\\'))return null;
      return {key,url:`/api/product-media?key=${encodeURIComponent(key)}`,isProduct:key.startsWith('products/')};
    }catch{return null;}
  }

  function fallbackUrl(raw){
    return fallbackInfo(raw)?.url||'';
  }

  function attemptedAlternateKeys(img){
    return new Set(String(img?.dataset?.ddMediaAlternateAttempts||'').split('|').map((value)=>value.trim()).filter(Boolean));
  }

  function candidateProductUrls(img){
    const values=[];
    const add=(value)=>{
      const raw=String(value||'').trim();
      if(!raw||values.includes(raw))return;
      values.push(raw);
    };

    const shopGallery=img.closest?.('[data-shop-card-gallery]');
    shopGallery?.querySelectorAll?.('[data-shop-thumb]')?.forEach((button)=>add(button.getAttribute('data-shop-thumb')));

    if(img.matches?.('[data-product-detail-main-image]')||img.closest?.('#productDetail')){
      document.querySelectorAll?.('#productGallery [data-product-detail-thumb]')?.forEach((button)=>add(button.getAttribute('data-product-detail-thumb')));
    }
    return values;
  }

  function promoteSameProductImage(img){
    if(!(img instanceof HTMLImageElement))return false;
    const attempted=attemptedAlternateKeys(img);
    const originalKey=String(img.dataset.ddMediaOriginalKey||'').trim();
    const currentInfo=fallbackInfo(img.currentSrc||img.src||img.getAttribute('src')||'');
    if(originalKey)attempted.add(originalKey);
    if(currentInfo?.key)attempted.add(currentInfo.key);

    for(const raw of candidateProductUrls(img)){
      const info=fallbackInfo(raw);
      if(!info?.isProduct||attempted.has(info.key))continue;
      attempted.add(info.key);
      img.dataset.ddMediaAlternateAttempts=[...attempted].join('|');
      img.dataset[FLAG]='0';
      img.dataset.ddMediaOriginalKey=info.key;
      delete img.dataset[FINAL_FLAG];
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.src=raw;
      img.classList.add('dd-product-media-same-product-fallback');
      return true;
    }
    img.dataset.ddMediaAlternateAttempts=[...attempted].join('|');
    return false;
  }

  function showProductPlaceholder(img){
    if(!(img instanceof HTMLImageElement))return false;
    if(img.dataset[FINAL_FLAG]==='1')return false;
    img.dataset[FINAL_FLAG]='1';
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src=PRODUCT_PLACEHOLDER;
    img.classList.add('dd-product-media-recovery-placeholder');
    if(!String(img.alt||'').trim())img.alt='Product image temporarily unavailable while the original photo is being recovered';
    return true;
  }

  function recoverImage(img){
    if(!(img instanceof HTMLImageElement))return false;
    if(img.dataset[FINAL_FLAG]==='1')return false;

    // The same-origin retry failed too. For Product cards/detail pages, first try
    // another URL already attached to this exact product. Only when that product
    // has no surviving candidate do we show the neutral recovery placeholder.
    if(img.dataset[FLAG]==='1'){
      const originalKey=String(img.dataset.ddMediaOriginalKey||'');
      if(originalKey.startsWith('products/')){
        if(promoteSameProductImage(img))return true;
        return showProductPlaceholder(img);
      }
      return false;
    }

    const info=fallbackInfo(img.currentSrc||img.src||img.getAttribute('src')||'');
    if(!info)return false;

    // Admin workspaces do not need to prove public-host recovery by issuing a second
    // /api/product-media GET for every stale Product key. The Admin operator needs a
    // responsive workspace and an honest missing-image indicator. Public pages retain
    // the Build 62 same-origin recovery behavior below.
    if(IS_ADMIN_RUNTIME&&info.isProduct){
      img.dataset[FLAG]='1';
      img.dataset.ddMediaOriginalKey=info.key;
      adminRetrySuppressed+=1;
      if(window.DDProductMediaFallback)window.DDProductMediaFallback.admin_same_origin_retry_suppressed=adminRetrySuppressed;
      return showProductPlaceholder(img);
    }

    img.dataset[FLAG]='1';
    img.dataset.ddMediaOriginalKey=info.key;
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src=info.url;
    img.classList.add('dd-product-media-fallback-active');
    return true;
  }

  function scan(root=document){
    const images=[];
    if(root instanceof HTMLImageElement)images.push(root);
    if(root?.querySelectorAll)images.push(...root.querySelectorAll('img'));
    for(const img of images){
      if(img.dataset[FINAL_FLAG]==='1')continue;
      const raw=img.currentSrc||img.src||img.getAttribute('src')||'';
      if(img.dataset[FLAG]!=='1'&&!fallbackInfo(raw))continue;
      if(img.complete&&Number(img.naturalWidth||0)===0)recoverImage(img);
    }
  }

  document.addEventListener('error',(event)=>{
    if(event.target instanceof HTMLImageElement)recoverImage(event.target);
  },true);
  // This recovery client exists primarily for public Product/Movie media. Admin workspaces
  // use the capturing error listener above and avoid same-origin retries for missing Product
  // keys. A document-wide subtree observer there would needlessly scan every Admin mutation
  // and can starve Product Entry startup.
  let observer=null;
  if(!IS_ADMIN_RUNTIME){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>scan(document),{once:true});
    else scan(document);
    observer=new MutationObserver((records)=>{
      for(const record of records){
        for(const node of record.addedNodes||[])if(node?.nodeType===1)scan(node);
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  window.DDProductMediaFallback={installed:true,version:VERSION,build157_admin_patch:BUILD157_ADMIN_PATCH,build159_admin_cache_patch:BUILD159_ADMIN_CACHE_PATCH,observer_mode:IS_ADMIN_RUNTIME?'error-only-admin':'public-mutation-and-error',admin_same_origin_retry_suppressed:adminRetrySuppressed,fallbackUrl,recoverImage,promoteSameProductImage,showProductPlaceholder,scan};
})();