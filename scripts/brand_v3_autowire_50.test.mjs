import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const src=read('public/js/brand-v3-auto.js');
const css=read('css/styles.css');
const pages=['index.html','shop/index.html','custom-request/index.html','tools/index.html',
 'supplies/index.html','about/index.html','contact/index.html','collections/index.html',
 'pickup/index.html','gift-cards/index.html','saved/index.html','cart/index.html',
 'workshop-journal/index.html','gallery/index.html'];
test('exact 1-50 manifest uses stable, non-guessed brand-v3 filenames',()=>{
 const map=src.slice(src.indexOf('const assets={'),src.indexOf('};',src.indexOf('const assets={')));
 const ids=[...map.matchAll(/\b(\d+):'([^']+\.webp)'/g)].map(m=>({id:Number(m[1]),name:m[2]}));
 const initial=ids.filter(x=>x.id>=1&&x.id<=50);
 assert.equal(initial.length,50);
 assert.deepEqual(initial.map(x=>x.id),Array.from({length:50},(_,i)=>i+1));
 assert.equal(ids.find(x=>x.id===1).name,'01-home-hero.webp');
 assert.equal(ids.find(x=>x.id===20).name,'20-order-pickup.webp');
 assert.equal(ids.find(x=>x.id===21).name,'brand-feature-promo.webp');
 assert.equal(ids.find(x=>x.id===30).name,'laser-engraved-promo.webp');
 assert.equal(ids.find(x=>x.id===31).name,'31-collections-overview-promo.webp');
 assert.equal(ids.find(x=>x.id===41).name,'41-featured-creations.webp');
 assert.equal(ids.find(x=>x.id===50).name,'50-community.webp');
 assert.equal(new Set(initial.map(x=>x.name)).size,50);
 assert.equal(new Set(ids.map(x=>x.name)).size,ids.length);
});
test('Set 08 maps ten correctly named category and featured assets without modifying real product imagery',()=>{
 const map=src.slice(src.indexOf('const assets={'),src.indexOf('};',src.indexOf('const assets={')));
 const matches=[...map.matchAll(/\b(\d+):'([^']+\.webp)'/g)];
 const assets=Object.fromEntries(matches.map(m=>[Number(m[1]),m[2]]));
 const expected=[
  '71-jewellery-category.webp','72-resin-art-category.webp',
  '73-polymer-clay-category.webp','74-candles-category.webp',
  '75-workshop-experiments-category.webp','76-custom-gifts-category.webp',
  '77-cricut-apparel-category.webp','78-coin-spoon-rings-category.webp',
  '79-wire-wrapping-category.webp','80-featured-collection-banner.webp'
 ];
 for(let i=0;i<expected.length;i++){
  const id=71+i;
  assert.equal(assets[id],expected[i]);
  const path=new URL('../assets/images/brand-v3/'+expected[i],import.meta.url);
  assert.ok(existsSync(path),expected[i]+' must exist under brand-v3');
 }
 assert.match(src,/mountSet08CategoryGallery/);
 assert.match(src,/mountSet08FeaturedBanner/);
 assert.match(src,/Real Product media and/);
 assert.doesNotMatch(src,/\.shop-card-main-image\s*img\s*\{/);
});

test('drop-in behavior never creates broken-image boxes when assets absent',()=>{
 assert.match(src,/pic\.onload=\(\)=>done/);
 assert.match(src,/pic\.onerror=\(\)=>\{\}/);
 assert.match(src,/existing site photos|existing image|approved existing image/i);
 assert.match(src,/data-media-slot/);
 assert.doesNotMatch(src,/data-add-shop-cart-id|checkout\s*\(|POST\s*\(|fetch\s*\(/);
});
test('all fourteen customer-facing routes load shared image map',()=>{
 for(const page of pages){
  const html=read(page);
  assert.match(html,/\/public\/js\/brand-v3-auto\.js\?v=110/,page);
  assert.match(html,/\/css\/styles\.css/,page);
 }
});
test('default shop intent card backgrounds retain fallbacks until new images load',()=>{
 assert.match(src,/const ids=\[12,8,13,14,9,10,15\]/);
 assert.match(css,/DEVIL N DOVE BRAND V3 DROP-IN/);
 assert.match(css,/background-image:var\(--dd-brand-v3-card-photo\)/);
});
test('responsive promo grid maintains contrast and does not force CSS specificity',()=>{
 const block=css.slice(css.indexOf('/* DEVIL N DOVE BRAND V3 DROP-IN'));
 assert.match(block,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(block,/@media\(max-width:700px\)/);
 assert.doesNotMatch(block,/!important|https?:\/\//);
 assert.match(block,/focus-visible/);
});

test('Set 09 contains ten named decorative headers and preserves genuine product/workshop media',()=>{
 const map=src.slice(src.indexOf('const assets={'),src.indexOf('};',src.indexOf('const assets={')));
 const matches=[...map.matchAll(/\b(\d+):'([^']+\.webp)'/g)];
 const byId=new Map(matches.map(m=>[Number(m[1]),m[2]]));
 const names=[
  '81-workshop-process-header.webp','82-our-story-banner.webp',
  '83-contact-care-banner.webp','84-custom-request-banner.webp',
  '85-admin-dashboard-header.webp','86-admin-product-management-header.webp',
  '87-admin-inventory-header.webp','88-admin-orders-header.webp',
  '89-admin-production-calendar-header.webp','90-admin-workstations-header.webp'
 ];
 for(let i=0;i<names.length;i++){
  assert.equal(byId.get(i+81),names[i]);
  assert.ok(existsSync(new URL('../assets/images/brand-v3/'+names[i],import.meta.url)));
 }
 assert.match(src,/installSet09WorkshopProcess/);
 const theme=read('css/brand-v3-theme.css');
 for(const name of names.slice(4))assert.ok(theme.includes(name));
 assert.match(theme,/\.workshop-process-strip>\.media-managed-slot-frame img/);
 assert.match(theme,/object-fit:contain/);
 assert.doesNotMatch(src,/data-add-shop-cart-id|checkout\s*\(|POST\s*\(|fetch\s*\(/);
});

test('Set 10 named media placement is mapped; decorative images never rewrite product data',()=>{
 const map=src.slice(src.indexOf('const assets={'),src.indexOf('};',src.indexOf('const assets={')));
 const entries=[...map.matchAll(/\b(\d+):'([^']+\.webp)'/g)];
 const names=new Map(entries.map(m=>[Number(m[1]),m[2]]));
 const needed=[
 '91-shop-made-in-our-workshop-card.webp','92-shop-vintage-finds-card.webp',
 '93-shop-collectibles-oddities-card.webp','94-shop-found-sourced-card.webp',
 '95-workshop-journal-story-visual.webp','96-contact-where-to-find-us.webp',
 '97-about-what-we-do.webp','98-home-creative-paths-card.webp',
 '99-home-resin-workshop-card.webp','100-admin-dashboard-laser-header.webp'
 ];
 for(let i=0;i<needed.length;i++)assert.equal(names.get(i+91),needed[i]);
 assert.match(src,/installSet10ManagedPlaceholders/);
 assert.match(src,/data-media-placeholder/);
 const shop=read('public/js/shop.js');
 for(const name of needed.slice(0,4))assert.ok(shop.includes(name));
 assert.match(shop,/data-origin-collection/);
 const theme=read('css/brand-v3-theme.css');
 assert.match(theme,/background-size:contain/);
 assert.match(theme,/100-admin-dashboard-laser-header.webp/);
 // 91-100 are owner-upload assets: do not require physical files in GitHub CI.
 // Product stock, prices, cart handlers remain in original live Shop scripts.
});


test('Set 11 homepage navigation cards 101-110 map exact individual WebP files',()=>{
 const map=src.slice(src.indexOf('const assets={'),src.indexOf('};',src.indexOf('const assets={')));
 const matched=[...map.matchAll(/\b(\d+):'([^']+\.webp)'/g)];
 const byNumber=new Map(matched.map(m=>[Number(m[1]),m[2]]));
 const items=[
 ['101-home-workshop-journal-card.webp','/workshop-journal/'],
 ['102-home-gallery-card.webp','/gallery/'],
 ['103-home-creations-card.webp','/creations/'],
 ['104-home-collections-card.webp','/collections/'],
 ['105-home-marketplaces-card.webp','/marketplaces/'],
 ['106-home-events-card.webp','/events/'],
 ['107-home-local-pickup-card.webp','/pickup/'],
 ['108-home-tools-card.webp','/tools/'],
 ['109-home-supplies-card.webp','/supplies/'],
 ['110-home-members-area-card.webp','/members/']
 ];
 const home=read('index.html');
 const theme=read('css/brand-v3-theme.css');
 for(let i=0;i<items.length;i++){
  const id=i+101;
  assert.equal(byNumber.get(id),items[i][0]);
  assert.ok(existsSync(new URL('../assets/images/brand-v3/'+items[i][0],import.meta.url)));
  assert.match(home,new RegExp('data-dd-brand-v3-card-image="'+id+'"'));
  assert.ok(home.includes('href="'+items[i][1]+'"'));
 }
 assert.match(src,/installSet11HomeNavigation/);
 assert.match(src,/dd-brand-v3-home-art-ready/);
 assert.match(theme,/background-size:contain/);
 assert.match(home,/data-show-when-logged-in="" href="\/members\/"/);
});
