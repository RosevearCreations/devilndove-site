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


test('Set 12 has ten Admin workspace image assets mapped to native links and CSS',()=>{
 const manifest=read('public/js/brand-v3-auto.js');
 const home=read('admin/index.html');
 const styles=read('css/brand-v3-theme.css');
 const matches=[...manifest.matchAll(/\b(\d+):'([^']+\.webp)'/g)];
 const names=new Map(matches.map(m=>[Number(m[1]),m[2]]));
 const files=["111-admin-dashboard-overview-card.webp","112-admin-product-management-card.webp","113-admin-inventory-operations-card.webp","114-admin-orders-fulfillment-card.webp","115-admin-production-calendar-card.webp","116-admin-workstations-capacity-card.webp","117-admin-materials-costing-card.webp","118-admin-commissions-quotes-card.webp","119-admin-cross-project-accounting-card.webp","120-admin-system-operations-card.webp"];
 const routes=["/admin/","/admin/products/","/admin/inventory-operations/","/admin/orders/","/admin/project-resource-calendar/","/admin/project-capacity-planner/","/admin/project-material-planner/","/admin/commission-workbench/","/admin/cross-project-accounting/","/admin/system-operations/"];
 for(let i=0;i<10;i++){
  const id=i+111;
  assert.equal(names.get(id),files[i]);
  assert.ok(existsSync(new URL('../assets/images/brand-v3/'+files[i],import.meta.url)));
  assert.ok(home.includes('data-dd-brand-v3-admin-art="'+id+'"'));
  assert.ok(home.includes('href="'+routes[i]+'"'));
  assert.ok(styles.includes('/assets/images/brand-v3/'+files[i]));
 }
 assert.match(home,/id="ddBrandV3AdminWorkspaces"/);
 assert.match(home,/admin398LoadSnapshot/);
 assert.match(home,/adminHomeDashboardWorkspaces/);
 assert.match(styles,/background-size:contain/);
});


test('Set 13 Admin banners 121-130 have exact filenames and routes without changing live operations',()=>{
 const manifest=read('public/js/brand-v3-auto.js');
 const loader=read('public/js/admin-brand-v3-set13.js');
 const css=read('css/brand-v3-theme.css');
 const middleware=read('functions/_middleware.js');
 const files=["121-admin-users-management.webp","122-admin-security-access-control.webp","123-admin-system-configuration.webp","124-admin-media-library-assets.webp","125-admin-tools-consumables.webp","126-admin-suppliers-purchases.webp","127-admin-workflow-production.webp","128-admin-reports-analytics.webp","129-admin-backup-maintenance.webp","130-admin-marketplace-integrations.webp"];
 const routes=["/admin/users/","/admin/membership/","/admin/it/","/admin/media-content-studio/","/admin/inventory-operations/","/admin/project-material-planner/","/admin/project-workflow-routing/","/admin/project-discovery-overview/","/admin/operational-continuity/","/admin/it-integrations/"];
 for(let i=0;i<files.length;i++){
  const id=121+i;
  const route=routes[i];
  const page=read(route.substring(1)+'index.html');
  assert.ok(manifest.includes(id+":'"+files[i]+"'"),files[i]);
  assert.ok(loader.includes('"'+route+'": "'+files[i]+'"'),route);
  assert.ok(page.includes('/public/js/admin-brand-v3-set13.js?v=13'),route);
 }
 assert.match(loader,/image.onload/);
 assert.match(loader,/image.onerror/);
 assert.match(loader,/insertAdjacentElement/);
 assert.match(css,/dd-brand-v3-set13-banner/);
 assert.match(css,/object-fit:contain/);
 assert.match(middleware,/brand-v3-visual-20261019-set13/);
 // Owner-supplied binary WebPs are uploaded separately from the code commit.
 assert.doesNotMatch(loader,/fetch\(|POST\s*\(|\/api\//);
});


test('Set 14 Admin banners 131-140 map all ten named files to existing pages without modifying operations',()=>{
 const manifest=read('public/js/brand-v3-auto.js');
 const loader=read('public/js/admin-brand-v3-set14.js');
 const css=read('css/brand-v3-theme.css');
 const middleware=read('functions/_middleware.js');
 const files=["131-admin-product-media-photography.webp","132-admin-design-creative-development.webp","133-admin-task-management-work-orders.webp","134-admin-shipping-logistics.webp","135-admin-customer-support-communications.webp","136-admin-finance-accounting.webp","137-admin-sales-business-analytics.webp","138-admin-integrations-api-connections.webp","139-admin-website-brand-customization.webp","140-admin-system-health-maintenance.webp"];
 const routes=["/admin/product-image-quality/","/admin/creative-project-pilot/","/admin/today-tasks/","/admin/order-fulfillment-care/","/admin/customer-documents/","/admin/finance/","/admin/finance-product-inventory-unit-economics/","/admin/it-platform/","/admin/content-studio/","/admin/reliability/"];
 const entries=[...manifest.matchAll(/\b(\d+):'([^']+\.webp)'/g)];
 const assets=new Map(entries.map(match=>[Number(match[1]),match[2]]));
 for(let i=0;i<files.length;i++){
  const number=i+131;
  const html=read(routes[i].slice(1)+'index.html');
  assert.equal(assets.get(number),files[i],files[i]);
  assert.ok(loader.includes('"'+routes[i]+'": "'+files[i]+'"'),routes[i]);
  assert.ok(html.includes('/public/js/admin-brand-v3-set14.js?v=14'),routes[i]);
  // The upload is independent: no test claims the WebP exists until uploaded.
 }
 assert.match(loader,/testImage.onload/);
 assert.match(loader,/testImage.onerror/);
 assert.match(loader,/insertAdjacentElement/);
 assert.match(css,/dd-brand-v3-set14-banner/);
 assert.match(css,/object-fit:contain/);
 assert.match(middleware,/brand-v3-visual-20261019-set14/);
 assert.doesNotMatch(loader,/fetch\(|XMLHttpRequest|\/api\/|checkout\s*\(/);
});
