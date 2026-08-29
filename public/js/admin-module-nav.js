// Devil n Dove Release 454 — shared five-module Admin navigation.
(()=>{
'use strict';
const MODULES=[
  {key:'storefront',label:'Storefront',href:'/admin/storefront-merchandising/'},
  {key:'creators',label:'Creators',href:'/admin/creative-automation/'},
  {key:'socials',label:'Socials / CAIP',href:'/admin/caip-content-handoff/'},
  {key:'financials',label:'Financials',href:'/admin/accounting/'},
  {key:'it-platform',label:'I.T.',href:'/admin/it-platform/'}
];
function infer(){
  const declared=document.body?.dataset?.adminModule;
  if(declared)return declared;
  const p=location.pathname;
  if(/storefront|home-carousel|marketplace|catalog|product-lineage|product-image-quality|public-display-order/.test(p))return 'storefront';
  if(/creative-automation|creative-process|content-studio|creative-assets/.test(p))return 'creators';
  if(/caip|social-publishing|content-publications/.test(p))return 'socials';
  if(/accounting|orders|customer-documents/.test(p))return 'financials';
  if(/it-|startup-readiness|operational-continuity|release-control|deployment|promotion|go-live|live-ops/.test(p))return 'it-platform';
  return '';
}
function render(){
  if(!document.body||document.querySelector('.dd-admin-module-nav'))return;
  const shell=document.querySelector('.admin-shell');
  const top=shell?.querySelector('.nav');
  if(!shell||!top)return;
  const current=infer();
  const nav=document.createElement('nav');
  nav.className='dd-admin-module-nav';
  nav.setAttribute('aria-label','Admin modules');
  nav.innerHTML=`<div class="dd-admin-module-label"><strong>Application modules</strong><span class="small">Release 454 shared navigation</span></div><div class="dd-admin-module-tabs">${MODULES.map(m=>`<a class="dd-admin-module-link" data-module="${m.key}" href="${m.href}"${m.key===current?' aria-current="page"':''}>${m.label}</a>`).join('')}</div>`;
  top.insertAdjacentElement('afterend',nav);
  document.body.dataset.adminModuleResolved=current||'none';
}
window.DDAdminModuleNav={modules:MODULES.slice(),render,infer};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();
