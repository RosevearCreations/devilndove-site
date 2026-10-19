/* Devil n Dove Brand V3 — full customer site placeholder recovery.
   Only images that remain the explicit default Media Studio placeholder may be replaced.
   All published products, tools, supplies and owner-uploaded showcase pictures stay intact.
   No forms, stock, pricing or customer information are modified. */
(()=>{
 "use strict";
 const slots={"/":[["home.section.visual.1","81-workshop-process-header.webp"],["home.what.visual.2","99-home-resin-workshop-card.webp"],["home.what.visual.3","98-home-creative-paths-card.webp"]],"/about/":[["about.section.visual.1","97-about-what-we-do.webp"]],"/collections/":[["collections.section.visual.1","31-collections-overview-promo.webp"]],"/contact/":[["contact.section.visual.1","96-contact-where-to-find-us.webp"]],"/creations/":[["creations.section.visual.1","41-featured-creations.webp"]],"/custom-candle-making-ontario/":[["custom-candle-making-ontario.section.visual.1","74-candles-category.webp"]],"/custom-gifts-southern-ontario/":[["custom-gifts-southern-ontario.section.visual.1","76-custom-gifts-category.webp"]],"/custom-soap-making-ontario/":[["custom-soap-making-ontario.section.visual.1","40-creating-with-purpose-promo.webp"]],"/events/":[["events.section.visual.1","50-community.webp"]],"/gift-cards/":[["gift-cards.section.visual.1","19-gift-cards.webp"]],"/handmade-jewelry-ontario/":[["handmade-jewelry-ontario.section.visual.1","71-jewellery-category.webp"]],"/laser-engraving-ontario/":[["laser-engraving-ontario.section.visual.1","10-laser-engraved-category.webp"]],"/marketplaces/":[["marketplaces.hero.image","31-collections-overview-promo.webp"],["marketplaces.section.visual.1","46-vintage-treasures.webp"]],"/polymer-clay-earrings-ontario/":[["polymer-clay-earrings-ontario.section.visual.1","73-polymer-clay-category.webp"]],"/socials/":[["socials.hero.image","50-community.webp"],["socials.section.visual.1","49-pets-nature.webp"]],"/vintage-finds-ontario/":[["vintage-finds-ontario.section.visual.1","09-vintage-finds-category.webp"]],"/workshop-journal/coin-and-spoon-ring-care/":[["workshop-journal-coin-and-spoon-ring-care.hero.image","78-coin-spoon-rings-category.webp"],["workshop-journal-coin-and-spoon-ring-care.section.visual.1","78-coin-spoon-rings-category.webp"]],"/workshop-journal/handmade-vintage-sourced-guide/":[["workshop-journal-handmade-vintage-sourced-guide.hero.image","09-vintage-finds-category.webp"],["workshop-journal-handmade-vintage-sourced-guide.section.visual.1","46-vintage-treasures.webp"]],"/workshop-journal/":[["workshop-journal.section.visual.1","95-workshop-journal-story-visual.webp"]],"/workshop-journal/polymer-clay-earring-care/":[["workshop-journal-polymer-clay-earring-care.hero.image","73-polymer-clay-category.webp"],["workshop-journal-polymer-clay-earring-care.section.visual.1","73-polymer-clay-category.webp"]],"/workshop-journal/story/":[["workshop-journal-story.section.visual.1","82-our-story-banner.webp"]],"/workshop-made-gifts-ontario/":[["workshop-made-gifts-ontario.section.visual.1","76-custom-gifts-category.webp"]]};
 const base='/assets/images/brand-v3/';
 function run(){
   let route=location.pathname.replace(/\/index\.html$/,'/').replace(/\/{2,}/g,'/');
   if(!route.endsWith('/'))route+='/';
   const candidates=slots[route]||[];
   if(!candidates.length)return;
   for(const [slot,file] of candidates){
     const image=[...document.querySelectorAll('img[data-media-slot]')].find(el=>el.getAttribute('data-media-slot')===slot);
     if(!image||image.getAttribute('data-media-placeholder')!=='1')continue;
     if(!(image.getAttribute('src')||'').startsWith('/assets/placeholders/'))continue;
     const art=new Image();
     art.decoding='async';
     art.onload=()=>{
       if(!image.isConnected||!art.naturalWidth||image.getAttribute('data-media-placeholder')!=='1')return;
       const current=image.getAttribute('src')||'';
       if(!current.startsWith('/assets/placeholders/'))return;
       image.src=base+file;
       image.setAttribute('data-brand-v3-recovered','1');
       image.setAttribute('alt','Illustrative Devil n Dove artisan workshop artwork');
       image.removeAttribute('data-media-placeholder');
       const frame=image.closest('.media-managed-placeholder,.media-managed-slot-frame');
       if(frame){
         frame.classList.remove('media-managed-placeholder');
         frame.classList.add('dd-brand-v3-illustrative-frame');
         const caption=frame.querySelector('figcaption');
         if(caption && /replace this image|site image placeholder|managed site image slot/i.test(caption.textContent||''))caption.remove();
       }
     };
     art.onerror=()=>{/* Keep original slot if asset absent. */};
     art.src=base+file;
   }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
 else run();
})();
