/* Devil n Dove Brand V3 Set 18: ten mapped, standalone Admin backgrounds.
   Strictly decorative: no API calls, metric overrides or changes to business actions.
   Missing WebP => preserve the original page without a broken image. */
(()=>{
  "use strict";
  const pages=Object.freeze({
    "/admin/command-center/": "171-admin-command-center.webp",
    "/admin/order-finance-settlement-readiness/": "172-admin-order-finance-settlement.webp",
    "/admin/inventory-finance-valuation-readiness/": "173-admin-inventory-valuation.webp",
    "/admin/vendor-reviews/": "174-admin-vendor-reviews.webp",
    "/admin/social-publishing/": "175-admin-social-publishing.webp",
    "/admin/local-seo-review/": "176-admin-local-seo-review.webp",
    "/admin/month-end/": "177-admin-month-end-cockpit.webp",
    "/admin/mobile-inventory/": "178-admin-mobile-inventory.webp",
    "/admin/gift-cards/": "179-admin-gift-card-management.webp",
    "/admin/deployment-preflight/": "180-admin-deployment-preflight.webp"
  });
  const activate=()=>{
    const normalized=location.pathname.replace(/\/index\.html$/,"/").replace(/\/{2,}/g,"/");
    const route=normalized.endsWith("/")?normalized:normalized+"/";
    const filename=pages[route];
    if(!filename || document.querySelector("[data-dd-brand-v3-set18]"))return;
    const heading=document.querySelector(".hero, .page-hero");
    const main=document.querySelector("main");
    if(!heading && !main)return;
    const image=new Image();
    image.decoding="async";
    image.alt="";
    image.onload=()=>{
      if(image.naturalWidth<1 || document.querySelector("[data-dd-brand-v3-set18]"))return;
      const anchor=heading?.isConnected?heading:(main?.isConnected?main:null);
      if(!anchor)return;
      const banner=document.createElement("div");
      banner.className="dd-brand-v3-set18-banner";
      banner.setAttribute("aria-hidden","true");
      banner.setAttribute("data-dd-brand-v3-set18",filename);
      banner.appendChild(image);
      if(anchor===heading)anchor.insertAdjacentElement("beforebegin",banner);
      else anchor.insertAdjacentElement("afterbegin",banner);
      document.body.classList.add("dd-brand-v3-set18-active");
    };
    image.onerror=()=>{ /* Missing upload: keep existing Admin layout. */ };
    image.src="/assets/images/brand-v3/"+filename;
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",activate,{once:true});
  else activate();
})();
