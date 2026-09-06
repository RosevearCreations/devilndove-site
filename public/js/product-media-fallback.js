// Release 467 Build 62 — transparent public-media recovery.
// If a historical public Product/Movie media host fails, retry the same approved R2
// key through the same-origin read-only /api/product-media endpoint. If a Product
// object is genuinely absent there too, prefer another image already attached to
// that same product before showing a neutral recovery placeholder. No media or
// Product database records are mutated.
(()=>{
  'use strict';
  const VERSION=62;
  if(Number(window.DDProductMediaFallback?.version||0)>=VERSION)return;
  const PUBLIC_HOSTS=new Set(['assets.devilndove.com','pub-f8137eb938da486a9f24410ccf49087c.r2.dev']);
  const FLAG='ddMediaFallbackAttempted';
  const FINAL_FLAG='ddMediaRecoveryPlaceholder';
  const PRODUCT_PLACEHOLDER='/assets/product-image-recovery-placeholder.svg';
  const PUBLIC_PREFIXES=['/products/','/movies/','/Itemsforsale/','/itemsforsale/','/Toolshed/','/Tools/','/Supplies/','/toolshed/','/tools/','/supplies/'];

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
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>scan(document),{once:true});
  else scan(document);
  const observer=new MutationObserver((records)=>{
    for(const record of records){
      for(const node of record.addedNodes||[])if(node?.nodeType===1)scan(node);
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  window.DDProductMediaFallback={installed:true,version:VERSION,fallbackUrl,recoverImage,promoteSameProductImage,showProductPlaceholder,scan};
})();
