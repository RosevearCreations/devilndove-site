/* Devil n Dove Brand V3 Set 15. Read-only standalone image enhancements.
   Each URL is an owner-uploaded WebP: no image => no new frame.
   Never replace UI controls, product/tool/supply media or Media Studio art. */
(()=>{
  "use strict";
  const assets=Object.freeze({
    "/admin/packaging-studio/": "141-admin-packaging-studio.webp",
    "/admin/creative-process/": "142-admin-creative-process.webp",
    "/admin/creative-assets/": "143-admin-creative-assets.webp",
    "/admin/visual-enrichment-studio/": "144-admin-visual-enrichment.webp",
    "/admin/inventory-replenishment/": "145-admin-inventory-replenishment.webp",
    "/admin/tool-lifecycle/": "146-admin-tool-lifecycle.webp",
    "/admin/supply-sourcing/": "147-admin-supply-sourcing.webp",
    "/admin/storefront-merchandising/": "148-admin-storefront-merchandising.webp",
    "/admin/catalog-health/": "149-admin-catalog-health.webp",
    "/admin/manufacturing-adoption/": "150-admin-manufacturing-readiness.webp"
  });
  const load=()=>{
    const route=location.pathname.replace(/\/index\.html$/,'/').replace(/\/{2,}/g,'/');
    const normalized=route.endsWith('/')?route:route+'/';
    const filename=assets[normalized];
    if(!filename)return;
    const hero=document.querySelector('.hero, .page-hero');
    if(!hero || document.querySelector('[data-dd-brand-v3-set15]'))return;
    const image=new Image();
    image.decoding='async';
    image.loading='lazy';
    image.alt='';
    image.onload=()=>{
      if(!hero.isConnected||image.naturalWidth===0||document.querySelector('[data-dd-brand-v3-set15]'))return;
      const banner=document.createElement('div');
      banner.className='dd-brand-v3-set15-banner';
      banner.setAttribute('data-dd-brand-v3-set15',filename);
      banner.setAttribute('aria-hidden','true');
      banner.appendChild(image);
      hero.insertAdjacentElement('beforebegin',banner);
      document.body.classList.add('dd-brand-v3-set15-active');
    };
    image.onerror=()=>{ /* Preserve the original page until the asset is uploaded. */ };
    image.src='/assets/images/brand-v3/'+filename;
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});
  else load();
})();
