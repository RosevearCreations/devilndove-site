/* Brand V3 256–265 — exactly mapped page illustrations.
 * Visual decoration only. Never read or modify checkout, quotes, consent, privacy,
 * payment, customer identity, orders, or product photography. */
(()=>{
 "use strict";
 const pages={
  "/checkout/":["checkout.hero.visual.256","256-checkout-review-banner.webp","Decorative artisan artwork for checkout"],
  "/checkout/confirmation/":["checkout-confirmation.hero.visual.257","257-order-confirmation-banner.webp","Decorative artisan artwork for the order confirmation page"],
  "/custom-request/consent/":["custom-consent.hero.visual.258","258-custom-request-consent-banner.webp","Decorative artisan artwork for the consent response page"],
  "/custom-request/order/":["custom-order.hero.visual.259","259-custom-order-status-banner.webp","Decorative artisan artwork for custom order status"],
  "/custom-request/pay/":["custom-payment.hero.visual.260","260-custom-payment-review-banner.webp","Decorative artisan artwork for custom payment review"],
  "/custom-request/proof/":["custom-proof.hero.visual.261","261-custom-design-proof-banner.webp","Decorative artisan artwork for design proof review"],
  "/custom-request/quote/":["custom-quote.hero.visual.262","262-custom-quote-review-banner.webp","Decorative artisan artwork for custom quote review"],
  "/custom-request/supplied-item/":["supplied-item.hero.visual.263","263-customer-supplied-item-banner.webp","Decorative artisan artwork for supplied materials guidance"],
  "/data-deletion/":["data-deletion.hero.visual.264","264-data-deletion-guidance-banner.webp","Decorative artisan artwork for data deletion guidance"],
  "/privacy/":["privacy.hero.visual.265","265-privacy-information-banner.webp","Decorative artisan artwork for privacy information"]
 };
 function render(){
  const route=location.pathname.replace(/\/index\.html$/,"/").replace(/\/+$/,"")+"/";
  const found=pages[route];
  if(!found)return;
  const [slot,filename,alt]=found;
  if(document.querySelector('[data-brand-v3-placement="'+slot+'"]'))return;
  const hero=document.querySelector("section.hero, main.hero, .page-hero, .hero");
  if(!hero)return;
  const source="/assets/images/brand-v3/"+filename;
  const probe=new Image();
  probe.onload=()=>{
   if(!probe.naturalWidth||document.querySelector('[data-brand-v3-placement="'+slot+'"]'))return;
   const fig=document.createElement("figure");
   fig.className="dd-brand-v3-flow-banner";
   fig.dataset.brandV3Placement=slot;
   fig.dataset.mediaSlot=slot;
   const img=document.createElement("img");
   img.src=source;
   img.alt=alt;
   img.width=1712;
   img.height=324;
   img.loading="lazy";
   img.decoding="async";
   fig.appendChild(img);
   hero.insertAdjacentElement("afterend",fig);
  };
  probe.src=source;
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",render,{once:true});
 else render();
})();
