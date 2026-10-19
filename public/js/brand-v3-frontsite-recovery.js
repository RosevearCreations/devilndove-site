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

 // Brand V3 batch 136-145: exact, upload-activated decorative placements.
 Object.assign(additional,{
 '/gallery/':[['gallery.hero.brand-v3-visual','136-photo-gallery-banner.webp']],
 '/events/':[...(additional['/events/']||[]),['events.upcoming.brand-v3-visual','137-upcoming-events-banner.webp']],
 '/marketplaces/':[...(additional['/marketplaces/']||[]),['marketplaces.hero.brand-v3-visual','138-marketplaces-banner.webp']],
 '/login/':[['account.hero.brand-v3-visual','139-my-account-banner.webp']],
 '/about/':[...(additional['/about/']||[]),['about.reviews.brand-v3-visual','140-reviews-banner.webp'],['about.sustainability.brand-v3-visual','142-sustainability-banner.webp']],
 '/contact/':[...(additional['/contact/']||[]),['contact.collaboration.brand-v3-visual','141-collaborations-banner.webp'],['contact.hero.brand-v3-visual','145-contact-banner.webp']],
 '/workshop-journal/':[...(additional['/workshop-journal/']||[]),['journal.behind-scenes.brand-v3-visual','143-behind-the-scenes-banner.webp']],
 '/help/':[...(additional['/help/']||[]),['help.questions.brand-v3-visual','144-faq-banner.webp']]
 });

 // Brand V3 146–155: filenames are distinct from existing Admin images.
 Object.assign(additional,{
 '/collections/':[...(additional['/collections/']||[]),['collections.overview.v3-146','146-collections-overview-banner.webp']],
 '/supplies/':[...(additional['/supplies/']||[]),['supplies.materials.v3-147','147-materials-supplies-banner.webp']],
 '/tools/':[...(additional['/tools/']||[]),['tools.equipment.v3-148','148-tools-equipment-banner.webp']],
 '/custom-request/':[...(additional['/custom-request/']||[]),['custom-request.story.v3-149','149-custom-requests-banner.webp']],
 '/gift-cards/':[...(additional['/gift-cards/']||[]),['gift-cards.promo.v3-150','150-gift-cards-banner.webp']],
 '/shop/':[...(additional['/shop/']||[]),['shop.browse.v3-151','151-shop-all-creations-banner.webp']],
 '/': [...(additional['/']||[]),['home.featured-creations.v3-152','152-featured-creations-banner.webp']],
 '/events/':[...(additional['/events/']||[]),['events.markets.v3-153','153-events-markets-banner.webp']],
 '/about/':[...(additional['/about/']||[]),['about.story.v3-154','154-about-banner.webp']],
 '/help/':[...(additional['/help/']||[]),['help.support.v3-155','155-help-support-banner.webp']]
 });

 // Brand V3 156–165 — verified 1712x324 standalone WebP placements.
 Object.assign(additional,{
 '/vintage-finds-ontario/':[...(additional['/vintage-finds-ontario/']||[]),['vintage.feature.v3-156','156-vintage-finds-feature-banner.webp']],
 '/workshop-journal/':[...(additional['/workshop-journal/']||[]),['journal.learning.v3-157','157-workshop-learning-banner.webp']],
 '/collections/':[...(additional['/collections/']||[]),['collections.seasonal.v3-158','158-seasonal-collections-banner.webp']],
 '/custom-gifts-southern-ontario/':[...(additional['/custom-gifts-southern-ontario/']||[]),['gifts.artisan.v3-159','159-artisan-gifts-banner.webp']],
 '/capabilities/':[...(additional['/capabilities/']||[]),['capabilities.services.v3-160','160-creative-services-banner.webp']],
 '/events/':[...(additional['/events/']||[]),['events.community.v3-161','161-maker-community-banner.webp']],
 '/supplies/':[...(additional['/supplies/']||[]),['supplies.reuse.v3-162','162-materials-reuse-banner.webp']],
 '/workshop-journal/story/':[...(additional['/workshop-journal/story/']||[]),['journal.process.v3-163','163-behind-the-scenes-workshop-banner.webp']],
 '/about/':[...(additional['/about/']||[]),['about.story.v3-164','164-our-story-banner.webp']],
 '/help/':[...(additional['/help/']||[]),['help.questions.v3-165','165-questions-support-banner.webp']]
 });

 // Brand V3 166–175: exact matched standalone 1712x324 decorative banners.
 Object.assign(additional,{
 '/workshop-journal/':[...(additional['/workshop-journal/']||[]),['journal.creative-process.v3-166','166-creative-process-banner.webp']],
 '/tools/':[...(additional['/tools/']||[]),['tools.workshop-equipment.v3-167','167-workshop-tools-banner.webp']],
 '/supplies/':[...(additional['/supplies/']||[]),['supplies.materials-exploration.v3-168','168-materials-exploration-banner.webp']],
 '/custom-request/':[...(additional['/custom-request/']||[]),['custom-request.personalized.v3-169','169-personalized-creations-banner.webp']],
 '/gallery/':[...(additional['/gallery/']||[]),['gallery.maker-showcase.v3-170','170-maker-gallery-banner.webp']],
 '/custom-gifts-southern-ontario/':[...(additional['/custom-gifts-southern-ontario/']||[]),['gifts.inspiration.v3-171','171-gift-inspiration-banner.webp']],
 '/handmade-jewelry-ontario/':[...(additional['/handmade-jewelry-ontario/']||[]),['jewelry.handmade.v3-172','172-handmade-jewelry-banner.webp']],
 '/creations/':[...(additional['/creations/']||[]),['creations.resin-experiments.v3-173','173-resin-experiments-banner.webp']],
 '/vintage-finds-ontario/':[...(additional['/vintage-finds-ontario/']||[]),['vintage.collectors.v3-174','174-collectors-corner-banner.webp']],
 '/events/':[...(additional['/events/']||[]),['events.community-news.v3-175','175-community-events-banner.webp']]
 });

 // Brand V3 176–185: individually composed 1712×324 customer-page banners.
 Object.assign(additional,{
 '/':[...(additional['/']||[]),['home.workshop-discovery.v3-176','176-home-workshop-discovery-banner.webp']],
 '/shop/':[...(additional['/shop/']||[]),['shop.discovery.v3-177','177-shop-discovery-banner.webp']],
 '/collections/':[...(additional['/collections/']||[]),['collections.explore.v3-178','178-collections-explore-banner.webp']],
 '/gallery/':[...(additional['/gallery/']||[]),['gallery.inspiration.v3-179','179-gallery-inspiration-banner.webp']],
 '/custom-request/':[...(additional['/custom-request/']||[]),['custom-request.ideas.v3-180','180-custom-work-ideas-banner.webp']],
 '/gift-cards/':[...(additional['/gift-cards/']||[]),['gift-cards.discovery.v3-181','181-gift-cards-discovery-banner.webp']],
 '/supplies/':[...(additional['/supplies/']||[]),['supplies.workshop-materials.v3-182','182-workshop-materials-banner.webp']],
 '/tools/':[...(additional['/tools/']||[]),['tools.feature.v3-183','183-workshop-tools-feature-banner.webp']],
 '/workshop-journal/':[...(additional['/workshop-journal/']||[]),['journal.stories.v3-184','184-workshop-stories-banner.webp']],
 '/contact/':[...(additional['/contact/']||[]),['contact.connect.v3-185','185-contact-connect-banner.webp']]
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
