import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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
 assert.equal(ids.length,50);
 assert.deepEqual(ids.map(x=>x.id),Array.from({length:50},(_,i)=>i+1));
 assert.equal(ids.find(x=>x.id===1).name,'01-home-hero.webp');
 assert.equal(ids.find(x=>x.id===20).name,'20-order-pickup.webp');
 assert.equal(ids.find(x=>x.id===21).name,'brand-feature-promo.webp');
 assert.equal(ids.find(x=>x.id===30).name,'laser-engraved-promo.webp');
 assert.equal(ids.find(x=>x.id===31).name,'31-collections-overview-promo.webp');
 assert.equal(ids.find(x=>x.id===41).name,'41-featured-creations.webp');
 assert.equal(ids.find(x=>x.id===50).name,'50-community.webp');
 assert.equal(new Set(ids.map(x=>x.name)).size,50);
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
  assert.match(html,/\/public\/js\/brand-v3-auto\.js\?v=50/,page);
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
