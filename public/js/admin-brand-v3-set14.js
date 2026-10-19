/* Devil n Dove brand-v3 Set 14 — 131-140 individual Admin banners.
   Presentation only: no network requests beyond image loads, no Admin
   state changes, no fabricated records, metrics or hidden controls. */
(()=>{
 'use strict';
 const assignments=Object.freeze({
  "/admin/product-image-quality/": "131-admin-product-media-photography.webp",
  "/admin/creative-project-pilot/": "132-admin-design-creative-development.webp",
  "/admin/today-tasks/": "133-admin-task-management-work-orders.webp",
  "/admin/order-fulfillment-care/": "134-admin-shipping-logistics.webp",
  "/admin/customer-documents/": "135-admin-customer-support-communications.webp",
  "/admin/finance/": "136-admin-finance-accounting.webp",
  "/admin/finance-product-inventory-unit-economics/": "137-admin-sales-business-analytics.webp",
  "/admin/it-platform/": "138-admin-integrations-api-connections.webp",
  "/admin/content-studio/": "139-admin-website-brand-customization.webp",
  "/admin/reliability/": "140-admin-system-health-maintenance.webp"
 });
 function install(){
  const route=location.pathname.replace(/\/index\.html$/,'/').replace(/\/{2,}/g,'/');
  const key=route.endsWith('/')?route:route+'/';
  const filename=assignments[key];
  if(!filename)return;
  const hero=document.querySelector('.hero,.page-hero');
  if(!hero)return;
  const testImage=new Image();
  testImage.decoding='async';
  testImage.alt='';
  testImage.onload=()=>{
   if(!hero.isConnected||testImage.naturalWidth===0||document.querySelector('.dd-brand-v3-set14-banner'))return;
   const banner=document.createElement('div');
   banner.className='dd-brand-v3-set14-banner';
   banner.setAttribute('aria-hidden','true');
   banner.dataset.ddBrandV3Asset=filename;
   banner.appendChild(testImage);
   hero.insertAdjacentElement('beforebegin',banner);
   document.body.classList.add('dd-brand-v3-set14-active');
  };
  testImage.onerror=()=>{/* Not uploaded yet: preserve original page without an empty image slot. */};
  testImage.src='/assets/images/brand-v3/'+filename;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
 else install();
})();
