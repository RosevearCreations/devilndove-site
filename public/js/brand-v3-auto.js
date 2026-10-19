/* Devil n Dove brand-v3 drop-in image mapping 01–50.
   The owner installs exact files under /assets/images/brand-v3/ and redeploys.
   Preload-before-swap means missing files never replace existing site photos.
   Decorative campaigns never alter Product inventory, price, stock or checkout. */
(()=>{
'use strict';
const base='/assets/images/brand-v3/';
const assets={
 1:'01-home-hero.webp',2:'02-shop-hero.webp',3:'03-custom-work-hero.webp',
 4:'04-tools-hero.webp',5:'05-supplies-hero.webp',6:'06-about-hero.webp',
 7:'07-contact-hero.webp',8:'08-one-of-a-kind-category.webp',
 9:'09-vintage-finds-category.webp',10:'10-laser-engraved-category.webp',
 11:'11-search-discovery.webp',12:'12-under-25.webp',13:'13-local-pickup.webp',
 14:'14-custom-gifts.webp',15:'15-workshop-experiments.webp',
 16:'16-behind-the-scenes.webp',17:'17-saved-favourites.webp',
 18:'18-cart.webp',19:'19-gift-cards.webp',20:'20-order-pickup.webp',
 21:'brand-feature-promo.webp',22:'jewellery-collection-promo.webp',
 23:'custom-work-promo.webp',24:'workshop-tools-promo.webp',
 25:'materials-supplies-promo.webp',26:'brand-story-promo.webp',
 27:'contact-help-promo.webp',28:'one-of-kind-promo.webp',
 29:'vintage-finds-promo.webp',30:'laser-engraved-promo.webp',
 31:'31-collections-overview-promo.webp',32:'32-jewellery-promo.webp',
 33:'33-resin-art-promo.webp',34:'34-home-decor-promo.webp',
 35:'35-apparel-promo.webp',36:'36-gift-cards-promo.webp',
 37:'37-local-pickup-promo.webp',38:'38-shipping-promo.webp',
 39:'39-workshop-journal-promo.webp',40:'40-creating-with-purpose-promo.webp',
 41:'41-featured-creations.webp',42:'42-new-arrivals.webp',
 43:'43-best-sellers.webp',44:'44-workshop-tools.webp',
 45:'45-materials-supplies.webp',46:'46-vintage-treasures.webp',
 47:'47-custom-creations.webp',48:'48-gift-ideas.webp',
 49:'49-pets-nature.webp',50:'50-community.webp',
 71:'71-jewellery-category.webp',72:'72-resin-art-category.webp',
 73:'73-polymer-clay-category.webp',74:'74-candles-category.webp',
 75:'75-workshop-experiments-category.webp',76:'76-custom-gifts-category.webp',
 77:'77-cricut-apparel-category.webp',78:'78-coin-spoon-rings-category.webp',
 79:'79-wire-wrapping-category.webp',80:'80-featured-collection-banner.webp'
};
const plans={
 '/':{hero:1, cards:[[21,'Our creative workshop','/about/'],[16,'Behind the workshop','/workshop-journal/'],[39,'Workshop stories','/workshop-journal/']]},
 '/shop/':{hero:2,cards:[[11,'Find something special','#shopSearchInput'],[42,'New arrivals','/shop/?sort=newest'],[28,'One-of-a-kind','/shop/?discover=one-of-a-kind'],[29,'Vintage finds','/shop/?merchandise_origin=vintage'],[30,'Laser engraved','/shop/?discover=laser-engraved']]},
 '/custom-request/':{hero:3,cards:[[14,'Custom gifts','/shop/?discover=custom-gifts'],[23,'Custom work ideas','/gallery/'],[47,'Custom creations','#customRequestForm']]},
 '/tools/':{hero:4,cards:[[24,'Workshop tools','#toolsGrid'],[44,'Tools and equipment','#toolsGrid']]},
 '/supplies/':{hero:5,cards:[[25,'Materials and supplies','#supGrid'],[45,'Explore materials','#supGrid']]},
 '/about/':{hero:6,cards:[[26,'Our story','/about/'],[40,'Creating with purpose','/about/'],[49,'Nature-inspired work','/gallery/'],[50,'Our maker community','/workshop-journal/']]},
 '/contact/':{hero:7,cards:[[27,'Contact and help','/contact/'],[38,'Shipping questions','/contact/']]},
 '/collections/':{hero:31,cards:[[22,'Jewellery','/shop/?q=jewellery'],[32,'Handmade jewellery','/shop/?q=earrings'],[33,'Resin creations','/shop/?q=resin'],[34,'Home décor','/shop/?q=home%20decor'],[35,'Apparel and accessories','/shop/?q=apparel'],[43,'Explore favourite styles','/shop/'],[46,'Vintage treasures','/shop/?merchandise_origin=vintage']]},
 '/pickup/':{hero:13,cards:[[20,'Order pickup','/pickup/'],[37,'Local pickup','/shop/?discover=local-pickup']]},
 '/gift-cards/':{hero:19,cards:[[36,'Gift cards','/gift-cards/'],[48,'Gift ideas','/shop/']]},
 '/saved/':{hero:17,cards:[]},
 '/cart/':{hero:18,cards:[]},
 '/workshop-journal/':{hero:16,cards:[[15,'Workshop experiments','/workshop-journal/'],[39,'Behind the scenes','/workshop-journal/']]},
 '/gallery/':{hero:41,cards:[]}
};
const pictureSelectors=[
 '.public-service-hero-media img','.hero-media img',
 '.hero img.media-managed-image','img[data-media-slot$=".hero.image"]',
 '.public-media-band img.public-audit-photo'
];
function preload(id,done){
 const name=assets[id];if(!name)return;
 const pic=new Image();pic.decoding='async';
 pic.onload=()=>done(base+name,pic);
 pic.onerror=()=>{}; // leave approved existing image untouched
 pic.src=base+name;
}
function installHero(id){
 preload(id,url=>{
  // Don't override a merchant media slot that Media & Content Studio has changed.
  const original=document.querySelector(pictureSelectors.join(','));
  if(original&&/\/(?:assets\/images\/site|assets\/placeholders)\//.test(original.getAttribute('src')||'')){
   original.setAttribute('src',url);
   original.setAttribute('data-brand-v3-asset',String(id));
   original.setAttribute('alt','Illustrative Devil n Dove artisan workshop collection artwork');
   return;
  }
  const host=document.querySelector('.hero, .page-hero, .public-media-band');
  if(!host)return;
  const wrap=document.createElement('figure');
  wrap.className='dd-brand-v3-banner';
  const img=document.createElement('img');
  img.src=url;img.alt='Devil n Dove artisan workshop brand illustration';
  img.loading='lazy';img.decoding='async';
  wrap.append(img);
  host.insertAdjacentElement('afterend',wrap);
 });
}
function installShopIntent(){
 const cards=document.querySelectorAll('.shop-collection-card-grid > .shop-collection-card');
 const ids=[12,8,13,14,9,10,15];
 if(cards.length!==7)return;
 cards.forEach((card,i)=>{
  preload(ids[i],url=>{card.style.setProperty('--dd-brand-v3-card-photo','url("'+url+'")');});
 });
}
function mountCards(cards){
 if(!cards?.length)return;
 const anchor=document.querySelector('.hero, .page-hero, .public-media-band, #build208ShopCapabilityNavigation');
 const host=anchor?.parentElement || document.querySelector('.container') || document.querySelector('main');
 if(!host)return;
 const section=document.createElement('section');section.className='dd-brand-v3-promos card';
 section.setAttribute('aria-label','Explore more from Devil n Dove');
 section.hidden=true;
 const header=document.createElement('h2');header.textContent='Explore the workshop';
 const grid=document.createElement('div');grid.className='dd-brand-v3-promo-grid';
 section.append(header,grid);
 (anchor||host.firstElementChild)?.insertAdjacentElement?.('afterend',section);
 cards.forEach(([id,label,href])=>{
  // A tile becomes visible only when its actual file loads.
  preload(id,url=>{
   const link=document.createElement('a');link.className='dd-brand-v3-promo-card';
   // Existing routes and filter URLs are authoritative; no fabricated pages.
   link.href=href;
   const img=document.createElement('img');img.src=url;img.alt='';
   img.loading='lazy';img.decoding='async';
   const title=document.createElement('span');title.textContent=label;
   link.append(img,title);grid.append(link);section.hidden=false;
  });
 });
}

/* Set 08: decorative category artwork only. Real Product media and
   Shop card controls, prices, stock, filters and cart remain untouched.
   Missing files fail closed via preload() until the exact WebPs exist. */
const set08Categories=[
 [71,'Jewellery','/shop/?q=jewellery'],
 [72,'Resin Art','/shop/?q=resin'],
 [73,'Polymer Clay','/shop/?q=polymer%20clay'],
 [74,'Candles','/shop/?q=candle'],
 [75,'Workshop Experiments','/workshop-journal/'],
 [76,'Custom Gifts','/shop/?discover=custom-gifts'],
 [77,'Cricut & Apparel','/shop/?q=apparel'],
 [78,'Coin & Spoon Rings','/shop/?q=ring'],
 [79,'Wire Wrapping','/shop/?q=wire%20wrapped']
];
function mountSet08CategoryGallery(){
 const shop=document.querySelector('#shopIntentHeading');
 const anchor=shop?.closest('section')||document.querySelector('.public-media-band, .hero');
 if(!anchor)return;
 const section=document.createElement('section');
 section.className='dd-brand-v3-category-gallery';
 section.setAttribute('aria-label','Explore Devil n Dove maker categories');
 section.hidden=true;
 const heading=document.createElement('h2');heading.textContent='Explore creative categories';
 const grid=document.createElement('div');grid.className='dd-brand-v3-category-grid';
 section.append(heading,grid);anchor.insertAdjacentElement('afterend',section);
 const ordered=set08Categories.map(([id,label,href],index)=>({id,label,href,index,element:null}));
 ordered.forEach(item=>{
  preload(item.id,url=>{
   const a=document.createElement('a');
   a.href=item.href;
   a.className='dd-brand-v3-category-tile';
   a.setAttribute('aria-label','Explore '+item.label);
   const img=document.createElement('img');
   img.src=url;img.alt='';img.loading='lazy';img.decoding='async';
   const title=document.createElement('span');title.textContent=item.label;
   a.append(img,title);
   item.element=a;
   grid.replaceChildren(...ordered.filter(x=>x.element).map(x=>x.element));
   section.hidden=false;
  });
 });
}
function mountSet08FeaturedBanner(){
 const anchor=document.querySelector('#homeFeaturedProductsMount');
 if(!anchor)return;
 preload(80,url=>{
  if(document.querySelector('[data-dd-brand-v3-featured-80]'))return;
  const section=document.createElement('section');
  section.className='dd-brand-v3-featured-banner';
  section.setAttribute('data-dd-brand-v3-featured-80','1');
  const link=document.createElement('a');
  link.href='/collections/';
  link.setAttribute('aria-label','Explore our collections');
  const img=document.createElement('img');
  img.src=url;
  img.alt='Illustrative Devil n Dove featured artisan collection artwork';
  img.decoding='async';img.loading='lazy';
  const caption=document.createElement('span');caption.textContent='Explore our collections';
  link.append(img,caption);section.append(link);
  anchor.insertAdjacentElement('afterend',section);
 });
}

function start(){
 const path=location.pathname.replace(/\/index\.html$/,'/').replace(/\/{2,}/g,'/');
 const key=path.endsWith('/')?path:path+'/';
 const plan=plans[key];if(!plan)return;
 installHero(plan.hero);
 if(key==='/shop/')installShopIntent();
 mountCards(plan.cards);
 if(key==='/shop/'||key==='/collections/')mountSet08CategoryGallery();
 if(key==='/')mountSet08FeaturedBanner();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();
