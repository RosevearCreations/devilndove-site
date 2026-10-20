/* Devil n Dove Brand V3 — 236–245 real page hero placements.
 * Decorative assets only; keeps all owner-selected photos and Media Studio slots intact.
 * Exact filenames loaded only after the corresponding resource has been found. */
(()=>{
 "use strict";
 const pages={
  "/custom-soap-making-ontario/":["ontario.custom-soap.hero.visual.236","236-custom-soap-making-ontario-banner.webp","Handcrafted soap and botanical artwork"],
  "/workshop-made-gifts-ontario/":["ontario.workshop-made-gifts.hero.visual.237","237-workshop-made-gifts-ontario-banner.webp","Handmade workshop gift artwork"],
  "/polymer-clay-earrings-ontario/":["ontario.polymer-clay-earrings.hero.visual.238","238-polymer-clay-earrings-ontario-banner.webp","Polymer clay earring workshop illustration"],
  "/laser-engraving-ontario/":["ontario.laser-engraving.hero.visual.239","239-laser-engraving-ontario-banner.webp","Laser engraving creative workshop illustration"],
  "/custom-candle-making-ontario/":["ontario.custom-candles.hero.visual.240","240-custom-candle-making-ontario-banner.webp","Custom candle making workshop artwork"],
  "/handmade-jewelry-ontario/":["ontario.handmade-jewelry.hero.visual.241","241-handmade-jewelry-ontario-banner.webp","Handmade jewellery workshop artwork"],
  "/vintage-finds-ontario/":["ontario.vintage-finds.hero.visual.242","242-vintage-finds-ontario-banner.webp","Illustrative vintage and found treasures artwork"],
  "/custom-gifts-southern-ontario/":["ontario.custom-gifts.hero.visual.243","243-custom-gifts-southern-ontario-banner.webp","Creative custom gifts workshop artwork"],
  "/marketplaces/":["marketplaces.discovery.hero.visual.244","244-marketplaces-discovery-banner.webp","Illustrative markets and marketplaces artwork"],
  "/search/":["search.discovery.hero.visual.245","245-search-discovery-banner.webp","Creative discovery artwork for site search"]
 };
 function mount(){
  const route=location.pathname.replace(/\/index\.html$/,"/").replace(/\/$/,"")+"/";
  const record=pages[route];if(!record)return;
  const [slot,file,alt]=record;
  if(document.querySelector('[data-brand-v3-placement="'+slot+'"]'))return;
  const hero=document.querySelector("main.public-service-hero, section.hero, main.hero, .page-hero");
  const heading=document.querySelector("h1");
  const anchor=hero||(heading&&(heading.closest("section,main,header")||heading));
  if(!anchor)return;
  const src="/assets/images/brand-v3/"+file;
  const test=new Image();
  test.onload=()=>{
   if(!test.naturalWidth||document.querySelector('[data-brand-v3-placement="'+slot+'"]'))return;
   const fig=document.createElement("figure");
   fig.className="dd-brand-v3-ontario-banner";
   fig.dataset.brandV3Placement=slot;
   fig.dataset.mediaSlot=slot;
   const img=document.createElement("img");
   img.src=src;img.alt=alt;img.width=1712;img.height=324;
   img.loading="lazy";img.decoding="async";
   fig.appendChild(img);anchor.insertAdjacentElement("afterend",fig);
  };
  test.src=src;
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});
 else mount();
})();
