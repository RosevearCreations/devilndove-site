/* Brand V3 — dedicated, decorative secondary image placements 266–275.
 * Load exact assets only when present. Do not touch product photos, Media Studio,
 * checkout or account data, or customer-supplied content. */
(()=>{
 "use strict";
 const pages={
  "/terms/":["terms.shopping-guidance.v3-266","266-terms-shopping-guidance-banner.webp","Illustrative artisan artwork for shopping terms"],
  "/toolshed/duplicates/":["toolshed.duplicate-photos.v3-267","267-duplicate-photo-review-banner.webp","Illustrative artwork for workshop photo-library review"],
  "/shop/product/":["shop.product-detail.v3-268","268-product-details-discovery-banner.webp","Decorative jewellery and workshop details"],
  "/pickup/":["pickup.collection-guidance.v3-269","269-local-pickup-guidance-banner.webp","Decorative gift packaging and pickup artwork"],
  "/events/":["events.community-guide.v3-270","270-events-community-guide-banner.webp","Decorative creative-market artwork"],
  "/gallery/":["gallery.creative-inspiration.v3-271","271-gallery-inspiration-banner.webp","Illustrative craft studio and gallery artwork"],
  "/about/":["about.workshop-story.v3-272","272-about-workshop-story-banner.webp","Decorative artisan workshop and handmade materials"],
  "/contact/":["contact.project-ideas.v3-273","273-contact-project-ideas-banner.webp","Decorative planning desk and project notes"],
  "/gift-cards/":["gift-cards.celebrations.v3-274","274-gift-cards-celebrations-banner.webp","Decorative gifts and handmade artwork"],
  "/collections/":["collections.exploration.v3-275","275-collections-exploration-banner.webp","Illustrative materials and workshop collections"]
 };
 function mount(){
  const route=location.pathname.replace(/\/index\.html$/,"/").replace(/\/+$/,"")+"/";
  const entry=pages[route];if(!entry)return;
  const [slot,filename,alt]=entry;
  if(document.querySelector('[data-brand-v3-placement="'+slot+'"]'))return;
  const footer=document.querySelector(".container > .footer, .footer, footer");
  const hero=document.querySelector("main.hero, .policy-hero, section.hero, .page-hero, .hero");
  const heading=document.querySelector("h1");
  const anchor=footer||hero||(heading&&(heading.closest("section,main,header")||heading));
  if(!anchor)return;
  const source="/assets/images/brand-v3/"+filename;
  const probe=new Image();
  probe.onload=()=>{
   if(!probe.naturalWidth||document.querySelector('[data-brand-v3-placement="'+slot+'"]'))return;
   const figure=document.createElement("figure");
   figure.className="dd-brand-v3-secondary-banner";
   figure.dataset.brandV3Placement=slot;
   figure.dataset.mediaSlot=slot;
   const img=document.createElement("img");
   img.src=source;img.alt=alt;img.width=1712;img.height=324;
   img.loading="lazy";img.decoding="async";
   figure.appendChild(img);
   anchor.insertAdjacentElement(footer?"beforebegin":"afterend",figure);
  };
  probe.src=source;
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});
 else mount();
})();
