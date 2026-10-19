import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('css/styles.css');
function pages(dir=''){
 const entries=readdirSync(new URL('../'+dir,import.meta.url),{withFileTypes:true});
 return entries.flatMap(e=>{
  const path=(dir?dir+'/':'')+e.name;
  if(e.isDirectory()){
   if(['.git','node_modules','.wrangler','coverage','vendor'].includes(e.name))return [];
   return pages(path);
  }
  return /\.html$/.test(e.name)?[path]:[];
 });
}
test('approved navy/purple signature is in shared stylesheet for every importing page',()=>{
 assert.match(css,/Devil n Dove Signature Design V1/);
 assert.match(css,/--dd-purple:\s*#914cff/);
 assert.match(css,/--bg:#070d17/);
 const htmlFiles=pages();
 assert.ok(htmlFiles.length>50,'audit must include many HTML routes');
 const noShared=htmlFiles.filter(p=>!read(p).includes('/css/styles.css'));
 // Some intentionally stand-alone pages are not in this visual CSS path:
 assert.ok(noShared.length<htmlFiles.length/2,'most pages must load shared signature styling');
});
test('all signature imagery refers to actual, tracked artwork and no screenshot demonstration product',()=>{
 const block=css.slice(css.indexOf('/* Devil n Dove Signature Design V1'));
 const images=[...block.matchAll(/url\(['"]?(\/assets\/images\/site\/[^)'"]+)['"]?\)/g)].map(m=>m[1]);
 assert.ok(images.length>=10);
 for(const src of images)assert.ok(existsSync(new URL('..'+src,import.meta.url)),src+' missing');
 assert.doesNotMatch(block,/\bLorem ipsum\b|mockup-only/);
});
test('public navigation is accessible and Tools / Supplies are one click away',()=>{
 for(const page of ['shop/index.html','tools/index.html','supplies/index.html','custom-request/index.html']){
  const s=read(page);
  assert.match(s,/aria-label="Main navigation"/,page);
  assert.match(s,/href="\/tools\/"/,page);
  assert.match(s,/href="\/supplies\/"/,page);
  assert.match(s,/href="\/shop\/"/,page);
 }
});
test('desktop tools and supplies use three columns, not giant one-across items',()=>{
 for(const p of ['tools/index.html','supplies/index.html']){
  const s=read(p);
  assert.match(s,/class="subgrid"/);
  assert.match(s,/class="(?:tool|item) card"/);
 }
 assert.match(css,/body:has\(#toolsGrid\) \.subgrid,body:has\(#supGrid\) \.subgrid\{[\s\S]*?grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:680px\)/);
});
test('customer-facing references never imply automatic checkout or fabricate sale prices',()=>{
 const tools=read('tools/index.html'),supplies=read('supplies/index.html');
 assert.match(tools,/not products offered for checkout/);
 assert.match(supplies,/rather than direct store checkout/);
 assert.doesNotMatch(tools,/data-add-shop-cart-id|CAD 12\.99/);
 assert.doesNotMatch(supplies,/data-add-shop-cart-id|CAD 44\.06/);
 assert.doesNotMatch(tools,/safeText\(item\.notes\);/);
 assert.doesNotMatch(supplies,/const note = safeText\(item\.notes\);/);
});
test('dynamic shop rendering and manually gated Admin actions retain original hooks',()=>{
 const shop=read('shop/index.html'),admin=read('admin/index.html');
 const ops=read('admin/system-operations/index.html');
 for(const id of ['shopSearchInput','shopProducts','shopCategoryFilter','shopSortFilter','shopSearchButton'])
  assert.ok(shop.includes('id="'+id+'"'),id);
 for(const id of ['admin398LoadSnapshot','sellerDailyCommandCentreMount','adminHomeDashboardWorkspaces'])
  assert.ok(admin.includes('id="'+id+'"'),id);
 for(const id of ['opsRefresh','opsMount','opsStatus','receiptCheck','receiptKey'])
  assert.ok(ops.includes('id="'+id+'"'),id);
 assert.match(admin,/aria-label="Admin navigation"/);
 assert.match(ops,/aria-current="page"/);
});
