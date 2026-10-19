/* Devil n Dove Brand V3 — Set 13 Admin decorative banners, IDs 121-130.
   Exact filename-to-route map. No API reads/writes, no changes to controls,
   data, permissions, authentication or live product imagery.
   If a WebP is absent, the original Admin page remains unmodified. */
(()=>{
 "use strict";
 const assignments=Object.freeze({
  "/admin/users/": "121-admin-users-management.webp",
  "/admin/membership/": "122-admin-security-access-control.webp",
  "/admin/it/": "123-admin-system-configuration.webp",
  "/admin/media-content-studio/": "124-admin-media-library-assets.webp",
  "/admin/inventory-operations/": "125-admin-tools-consumables.webp",
  "/admin/project-material-planner/": "126-admin-suppliers-purchases.webp",
  "/admin/project-workflow-routing/": "127-admin-workflow-production.webp",
  "/admin/project-discovery-overview/": "128-admin-reports-analytics.webp",
  "/admin/operational-continuity/": "129-admin-backup-maintenance.webp",
  "/admin/it-integrations/": "130-admin-marketplace-integrations.webp"
 });
 function mount(){
  const path=location.pathname.replace(/\/index\.html$/,'/').replace(/\/{2,}/g,'/');
  const key=path.endsWith('/')?path:path+'/';
  const filename=assignments[key];
  if(!filename)return;
  const hero=document.querySelector('.hero, .page-hero');
  if(!hero||hero.parentElement?.querySelector(':scope > .dd-brand-v3-set13-banner'))return;
  const url='/assets/images/brand-v3/'+filename;
  const image=new Image();
  image.decoding='async';
  image.alt='';
  image.onload=()=>{
   if(!hero.isConnected || image.naturalWidth<=0 || image.naturalHeight<=0)return;
   const banner=document.createElement('div');
   banner.className='dd-brand-v3-set13-banner';
   banner.setAttribute('aria-hidden','true');
   banner.dataset.ddBrandV3Asset=filename;
   banner.appendChild(image);
   hero.insertAdjacentElement('beforebegin',banner);
  };
  image.onerror=()=>{ /* No empty or broken frame while owner uploads artwork. */ };
  image.src=url;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
})();
