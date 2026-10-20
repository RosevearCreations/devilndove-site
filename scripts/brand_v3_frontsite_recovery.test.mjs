import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const read=(p)=>fs.readFileSync(p,'utf8');
const recovery=read('public/js/brand-v3-frontsite-recovery.js');
const raw=recovery.match(/\bconst slots=(\{[^\n]+\});/);
assert.ok(raw,'exact JSON route-to-slot map must be present');
const routes=JSON.parse(raw[1]);
test('fullsite Brand V3 is injected into general and fast public HTML paths',()=>{
 const middleware=read('functions/_middleware.js');
 assert.equal((middleware.match(/brand-v3-frontsite-recovery.js\?v=295/g)||[]).length,2);
 assert.equal((middleware.match(/brand-v3-frontsite-recovery.css\?v=295/g)||[]).length,2);
 assert.match(middleware,/brand-v3-visual-20261019-set14-fullsite190/);
});
test('each of 29 intended owner-safe placeholder slots exists on its exact public page',()=>{
 let count=0;
 for(const [route,slots] of Object.entries(routes)){
  const page=route==='/'?'index.html':path.posix.join(route.slice(1),'index.html');
  const html=read(page);
  for(const [slot,name] of slots){
   count++;
   assert.ok(html.includes('data-media-slot="'+slot+'"'),page+' missing '+slot);
   assert.ok(html.includes('data-media-placeholder="1"'),page+' no placeholder support');
   assert.ok(fs.existsSync('assets/images/brand-v3/'+name),name+' not found');
  }
 }
 assert.equal(Object.keys(routes).length,22);
 assert.equal(count,29);
});
test('slot recovery cannot overwrite user-chosen Media Studio imagery',()=>{
 assert.match(recovery,/data-media-placeholder/);
 assert.match(recovery,/current\.startsWith\('\/assets\/placeholders\/'\)/);
 assert.match(recovery,/art\.onerror/);
 assert.doesNotMatch(recovery,/\/api\/|fetch\(|POST\s*\(/);
 const theme=read('css/brand-v3-frontsite-recovery.css');
 assert.match(theme,/object-fit:contain/);
 assert.match(theme,/shop-product-card/);
});


test('Homepage category cards and Shop origin cards display actual category artwork',()=>{
 const home=read('index.html');
 const shop=read('public/js/shop.js');
 const shopHtml=read('shop/index.html');
 const css=read('css/brand-v3-frontsite-recovery.css');
 const expected=[
  ['polymer','73-polymer-clay-category.webp'],['rings','78-coin-spoon-rings-category.webp'],
  ['laser','10-laser-engraved-category.webp'],['resin','72-resin-art-category.webp'],
  ['3d','75-workshop-experiments-category.webp'],['vintage','09-vintage-finds-category.webp']
 ];
 for(const [key,file] of expected){
  assert.ok(home.includes('data-home-path-card="'+key+'"'));
  assert.ok(home.includes('src="/assets/images/brand-v3/'+file+'"'));
  assert.ok(fs.existsSync('assets/images/brand-v3/'+file),file);
 }
 for(const file of [
  '91-shop-made-in-our-workshop-card.webp','92-shop-vintage-finds-card.webp',
  '93-shop-collectibles-oddities-card.webp','94-shop-found-sourced-card.webp'
 ])assert.ok(fs.existsSync('assets/images/brand-v3/'+file),file);
 assert.match(shop,/dd-brand-v3-origin-image" src="\/assets\/images\/brand-v3\//);
 assert.doesNotMatch(shop,/style="background-image:url\('\/assets\/images\/brand-v3\//);
 assert.match(shopHtml,/shop\.js\?v=467b75-set10-brand-v3-195/);
 assert.match(css,/dd-brand-v3-home-category-art/);
 assert.match(css,/object-fit:contain/);
});
test('Custom Request five updated decorative images preserve original fallback until uploaded',()=>{
 const html=read('custom-request/index.html');
 const upgrade=read('public/js/custom-request-brand-v3-cards.js');
 const css=read('css/brand-v3-frontsite-recovery.css');
 const assets=[
  '191-custom-request-what-made.webp','192-custom-request-making-method.webp',
  '193-custom-request-material-ideas.webp','194-custom-request-occasion-use.webp',
  '195-custom-request-not-sure.webp'
 ];
 for(const file of assets)assert.ok(html.includes('data-dd-brand-v3-custom-upgrade="'+file+'"'));
 assert.match(upgrade,/next\.onload/);
 assert.match(upgrade,/next\.onerror/);
 assert.match(html,/Start from the part you already know/);
 assert.match(css,/custom-discovery-gallery/);
 assert.doesNotMatch(upgrade,/\/api\/|fetch\(|XMLHttpRequest/);
});
