/* Devil n Dove brand-v3 Set 19 — filenames 181-190.
   Decorate existing Admin screens with owner-uploaded artwork only.
   NO fake database figures, no form or photo replacement, no new API access. */
(()=>{
 "use strict";
 const routeToAsset=Object.freeze({
  "/admin/business-health/": "181-admin-business-operations.webp",
  "/admin/content-publications/": "182-admin-website-content.webp",
  "/admin/catalog-media/": "183-admin-product-media-lifecycle.webp",
  "/admin/evidence-gap-owner-queue/": "184-admin-customer-evidence.webp",
  "/admin/inventory-intelligence/": "185-admin-inventory-optimization.webp",
  "/admin/home-carousel/": "186-admin-home-promotions.webp",
  "/admin/accounting/": "187-admin-accounting-reporting.webp",
  "/admin/marketplace-mapping/": "188-admin-marketplace-mapping.webp",
  "/admin/operations/": "189-admin-operational-fulfilment.webp",
  "/admin/application-modules/": "190-admin-application-modules.webp"
 });
 function mount(){
  const path=location.pathname.replace(/\/index\.html$/,'/').replace(/\/{2,}/g,'/');
  const route=path.endsWith('/')?path:path+'/';
  const file=routeToAsset[route];
  if(!file||document.querySelector("[data-dd-brand-v3-set19]"))return;
  const header=document.querySelector('.hero,.page-hero');
  const main=document.querySelector('main');
  const anchor=header||main;
  if(!anchor)return;
  const img=new Image();
  img.decoding='async';
  img.alt='';
  img.onload=()=>{
   if(!img.naturalWidth||!anchor.isConnected||document.querySelector("[data-dd-brand-v3-set19]"))return;
   const banner=document.createElement('div');
   banner.className='dd-brand-v3-set19-banner';
   banner.setAttribute('data-dd-brand-v3-set19',file);
   banner.setAttribute('aria-hidden','true');
   banner.appendChild(img);
   if(header)header.insertAdjacentElement('beforebegin',banner);
   else main.insertAdjacentElement('afterbegin',banner);
   document.body.classList.add('dd-brand-v3-set19-active');
  };
  img.onerror=()=>{/* No file yet: leave the original UI unchanged. */};
  img.src='/assets/images/brand-v3/'+file;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
})();
