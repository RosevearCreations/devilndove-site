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
 assert.equal((middleware.match(/brand-v3-frontsite-recovery.js\?v=190/g)||[]).length,2);
 assert.equal((middleware.match(/brand-v3-frontsite-recovery.css\?v=190/g)||[]).length,2);
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
