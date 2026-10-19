/* Devil n Dove Brand V3 / Set 17 (161–170).
   Read-only page decoration: never replace forms, images or live data.
   On missing artwork the source Admin page stays unchanged. */
(()=>{
 "use strict";
 const assets=Object.freeze({
  "/admin/business-pipeline/": "161-admin-business-pipeline.webp",
  "/admin/trust-blocks/": "162-admin-trust-moderation.webp",
  "/admin/help/": "163-admin-help-centre.webp",
  "/admin/members/": "164-admin-members-access.webp",
  "/admin/custom-request/": "165-admin-custom-work-handoff.webp",
  "/admin/marketplace-readiness/": "166-admin-marketplace-readiness.webp",
  "/admin/analytics/": "167-admin-analytics-visitors.webp",
  "/admin/creative-automation/": "168-admin-creative-automation.webp",
  "/admin/product-editor/": "169-admin-product-editor.webp",
  "/admin/release-control/": "170-admin-release-control.webp"
 });
 function install(){
  const path=location.pathname.replace(/\/index\.html$/,'/').replace(/\/{2,}/g,'/');
  const route=path.endsWith('/')?path:path+'/';
  const filename=assets[route];
  if(!filename || document.querySelector('[data-dd-brand-v3-set17]'))return;
  const hero=document.querySelector('.hero,.page-hero');
  const main=document.querySelector('main');
  if(!hero && !main)return;
  const image=new Image();
  image.decoding='async';
  image.alt='';
  image.onload=()=>{
   if(!image.naturalWidth||document.querySelector('[data-dd-brand-v3-set17]'))return;
   const anchor=hero&&hero.isConnected?hero:(main&&main.isConnected?main:null);
   if(!anchor)return;
   const banner=document.createElement('div');
   banner.className='dd-brand-v3-set17-banner';
   banner.setAttribute('data-dd-brand-v3-set17',filename);
   banner.setAttribute('aria-hidden','true');
   banner.appendChild(image);
   if(anchor===hero)anchor.insertAdjacentElement('beforebegin',banner);
   else anchor.insertAdjacentElement('afterbegin',banner);
   document.body.classList.add('dd-brand-v3-set17-active');
  };
  image.onerror=()=>{ /* Silent fallback to existing Admin view. */ };
  image.src='/assets/images/brand-v3/'+filename;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
 else install();
})();
