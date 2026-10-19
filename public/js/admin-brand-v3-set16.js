/* Devil n Dove Brand V3 Set 16. Read-only standalone image enhancements.
   Each URL is an owner-uploaded WebP: no image => no new frame.
   Never replace UI controls, product/tool/supply media or Media Studio art. */
(()=>{
  "use strict";
  const assets=Object.freeze({
    "/admin/workshop-capabilities/": "151-admin-workshop-capabilities.webp",
    "/admin/workshop-knowledge/": "152-admin-workshop-knowledge.webp",
    "/admin/workshop-readiness/": "153-admin-workshop-readiness.webp",
    "/admin/project-work-orders/": "154-admin-project-work-orders.webp",
    "/admin/order-production-release-readiness/": "155-admin-production-release.webp",
    "/admin/order-inventory-fulfillment-readiness/": "156-admin-inventory-fulfillment.webp",
    "/admin/project-profitability-reconciliation/": "157-admin-project-profitability.webp",
    "/admin/mobile-workshop-assistant/": "158-admin-mobile-workshop.webp",
    "/admin/maker-story-coverage/": "159-admin-maker-stories.webp",
    "/admin/inventory-creator-intelligence/": "160-admin-inventory-intelligence.webp"
  });
  const load=()=>{
    const route=location.pathname.replace(/\/index\.html$/,'/').replace(/\/{2,}/g,'/');
    const normalized=route.endsWith('/')?route:route+'/';
    const filename=assets[normalized];
    if(!filename)return;
    const hero=document.querySelector('.hero, .page-hero');
    if(!hero || document.querySelector('[data-dd-brand-v3-set16]'))return;
    const image=new Image();
    image.decoding='async';
    image.loading='lazy';
    image.alt='';
    image.onload=()=>{
      if(!hero.isConnected||image.naturalWidth===0||document.querySelector('[data-dd-brand-v3-set16]'))return;
      const banner=document.createElement('div');
      banner.className='dd-brand-v3-set16-banner';
      banner.setAttribute('data-dd-brand-v3-set16',filename);
      banner.setAttribute('aria-hidden','true');
      banner.appendChild(image);
      hero.insertAdjacentElement('beforebegin',banner);
      document.body.classList.add('dd-brand-v3-set16-active');
    };
    image.onerror=()=>{ /* Preserve the original page until the asset is uploaded. */ };
    image.src='/assets/images/brand-v3/'+filename;
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});
  else load();
})();
