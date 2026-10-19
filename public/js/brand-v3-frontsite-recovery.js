/* Devil n Dove Brand V3 — full customer site placeholder recovery.
   Only images that remain the explicit default Media Studio placeholder may be replaced.
   All published products, tools, supplies and owner-uploaded showcase pictures stay intact.
   No forms, stock, pricing or customer information are modified. */
(()=>{
 "use strict";
 const slots={"/":[["home.section.visual.1","81-workshop-process-header.webp"],["home.what.visual.2","99-home-resin-workshop-card.webp"],["home.what.visual.3","98-home-creative-paths-card.webp"]],"/about/":[["about.section.visual.1","97-about-what-we-do.webp"]],"/collections/":[["collections.section.visual.1","31-collections-overview-promo.webp"]],"/contact/":[["contact.section.visual.1","96-contact-where-to-find-us.webp"]],"/creations/":[["creations.section.visual.1","41-featured-creations.webp"]],"/custom-candle-making-ontario/":[["custom-candle-making-ontario.section.visual.1","74-candles-category.webp"]],"/custom-gifts-southern-ontario/":[["custom-gifts-southern-ontario.section.visual.1","76-custom-gifts-category.webp"]],"/custom-soap-making-ontario/":[["custom-soap-making-ontario.section.visual.1","40-creating-with-purpose-promo.webp"]],"/events/":[["events.section.visual.1","50-community.webp"]],"/gift-cards/":[["gift-cards.section.visual.1","19-gift-cards.webp"]],"/handmade-jewelry-ontario/":[["handmade-jewelry-ontario.section.visual.1","71-jewellery-category.webp"]],"/laser-engraving-ontario/":[["laser-engraving-ontario.section.visual.1","10-laser-engraved-category.webp"]],"/marketplaces/":[["marketplaces.hero.image","31-collections-overview-promo.webp"],["marketplaces.section.visual.1","46-vintage-treasures.webp"]],"/polymer-clay-earrings-ontario/":[["polymer-clay-earrings-ontario.section.visual.1","73-polymer-clay-category.webp"]],"/socials/":[["socials.hero.image","50-community.webp"],["socials.section.visual.1","49-pets-nature.webp"]],"/vintage-finds-ontario/":[["vintage-finds-ontario.section.visual.1","09-vintage-finds-category.webp"]],"/workshop-journal/coin-and-spoon-ring-care/":[["workshop-journal-coin-and-spoon-ring-care.hero.image","78-coin-spoon-rings-category.webp"],["workshop-journal-coin-and-spoon-ring-care.section.visual.1","78-coin-spoon-rings-category.webp"]],"/workshop-journal/handmade-vintage-sourced-guide/":[["workshop-journal-handmade-vintage-sourced-guide.hero.image","09-vintage-finds-category.webp"],["workshop-journal-handmade-vintage-sourced-guide.section.visual.1","46-vintage-treasures.webp"]],"/workshop-journal/":[["workshop-journal.section.visual.1","95-workshop-journal-story-visual.webp"]],"/workshop-journal/polymer-clay-earring-care/":[["workshop-journal-polymer-clay-earring-care.hero.image","73-polymer-clay-category.webp"],["workshop-journal-polymer-clay-earring-care.section.visual.1","73-polymer-clay-category.webp"]],"/workshop-journal/story/":[["workshop-journal-story.hero.image","82-our-story-banner.webp"]],"/workshop-made-gifts-ontario/":[["workshop-made-gifts-ontario.section.visual.1","76-custom-gifts-category.webp"]]};
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

 // Explicit decorative placements for approved supplemental batches 106–125.
 // Existing owner / Media Studio imagery is never changed or replaced.
 const additional={
 '/':[['home.newsletter.section.visual','106-newsletter-signup-banner.webp']],
 '/events/':[['events.hero.brand-v3-visual','107-events-markets-banner.webp']],
 '/gift-cards/':[['gift-cards.hero.brand-v3-visual','108-gift-card-banner.webp']],
 '/about/':[['about.story.brand-v3-visual','109-about-meet-the-maker.webp']],
 '/help/':[['help.faq.brand-v3-visual','110-help-faq-banner.webp']],
 '/search/':[['search.hero.brand-v3-visual','111-search-banner.webp']],
 '/collections/':[['collections.hero.brand-v3-visual','112-collections-banner.webp']],
 '/supplies/':[['supplies.hero.brand-v3-visual','113-materials-supplies-banner.webp']],
 '/tools/':[['tools.hero.brand-v3-visual','114-tools-equipment-banner.webp'],['tools.category.brand-v3-visual','123-tools-supplies-banner.webp']],
 '/custom-request/':[['custom-request.supplement.brand-v3-visual','115-custom-request-not-sure-banner.webp'],['custom-request.hero.brand-v3-visual','124-custom-requests-banner.webp']],
 '/creations/':[['creations.feature.brand-v3-visual','116-creations-feature-banner.webp']],
 '/custom-candle-making-ontario/':[['candles.hero.brand-v3-visual','117-candles-home-decor-banner.webp']],
 '/handmade-jewelry-ontario/':[['jewelry.hero.brand-v3-visual','118-jewelry-banner.webp'],['wire-wrapping.hero.brand-v3-visual','121-wire-wrapping-banner.webp']],
 '/workshop-journal/':[['resin-art.hero.brand-v3-visual','119-resin-art-banner.webp']],
 '/polymer-clay-earrings-ontario/':[['polymer-clay.hero.brand-v3-visual','120-polymer-clay-banner.webp']],
 '/workshop-journal/coin-and-spoon-ring-care/':[['metal-work.hero.brand-v3-visual','122-metal-work-banner.webp']],
 '/custom-gifts-southern-ontario/':[['gift-ideas.hero.brand-v3-visual','125-gift-ideas-banner.webp']]
 };

 // Additional verified page-route placements, asset batch 126-135.
 Object.assign(additional,{
  '/workshop-journal/':[...(additional['/workshop-journal/']||[]),['journal.feature.brand-v3-visual','126-workshop-journal-banner.webp']],
  '/vintage-finds-ontario/':[['lapidary.feature.brand-v3-visual','127-lapidary-stones-banner.webp']],
  '/laser-engraving-ontario/':[['fabrication.feature.brand-v3-visual','128-laser-cnc-3d-printing-banner.webp']],
  '/capabilities/':[['auto-detailing.feature.brand-v3-visual','129-auto-detailing-banner.webp']],
  '/collections/':[...(additional['/collections/']||[]),['paracord.feature.brand-v3-visual','130-paracord-creations-banner.webp']],
  '/shop/':[['apparel.feature.brand-v3-visual','131-apparel-merchandise-banner.webp']],
  '/marketplaces/':[['markets.feature.brand-v3-visual','132-market-events-banner.webp']],
  '/contact/':[['wholesale.feature.brand-v3-visual','133-wholesale-opportunities-banner.webp']],
  '/workshop-journal/coin-and-spoon-ring-care/':[...(additional['/workshop-journal/coin-and-spoon-ring-care/']||[]),['care.feature.brand-v3-visual','134-care-instructions-banner.webp']],
  '/terms/':[['policies.feature.brand-v3-visual','135-shipping-policies-banner.webp']]
 });
 function renderSupplemental(){
  let route=location.pathname.replace(/\\/index\\.html$/,'/');if(!route.endsWith('/'))route+='/';
  const placements=additional[route]||[];if(!placements.length)return;
  const host=document.querySelector('main')||document.querySelector('.container')||document.body;
  const firstHero=host.querySelector('.hero,.page-hero,.public-service-hero,h1');
  for(const [slot,file] of placements){
   if(document.querySelector('[data-brand-v3-placement="'+slot+'"]'))continue;
   const probe=new Image();probe.onload=()=>{
    if(!probe.naturalWidth||document.querySelector('[data-brand-v3-placement="'+slot+'"]'))return;
    const figure=document.createElement('figure');
    figure.className='dd-brand-v3-illustrative-frame dd-brand-v3-supplemental';
    figure.dataset.brandV3Placement=slot;
    figure.dataset.mediaSlot=slot;
    const img=document.createElement('img');
    img.src=base+file;img.alt='Decorative Devil n Dove artisan workshop artwork';
    img.loading='lazy';img.decoding='async';img.dataset.brandV3Recovered='1';
    figure.appendChild(img);
    if(firstHero){const section=firstHero.closest('section')||firstHero;section.insertAdjacentElement('afterend',figure);}
    else host.insertBefore(figure,host.firstChild);
   };
   probe.src=base+file;
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderSupplemental,{once:true});
 else renderSupplemental();

 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
 else run();
})();
