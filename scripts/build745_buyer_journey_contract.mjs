// Build 745 exact static source-contract checks (no network, customer or provider mutations).
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const page=read('admin/storefront-acceptance/index.html');
const js=read('public/js/admin-storefront-acceptance-660.js');
const names=['Shop and product search','Shopping cart','Checkout form','Local pickup',
 'Contact and support','Sale terms','Customer Help Centre'];
const paths=['/shop/','/cart/','/checkout/','/pickup/','/contact/','/terms/','/help/'];
for(const name of names)assert.ok(js.includes("name:'"+name+"'"),'missing probe '+name);
for(const path of paths){
 assert.ok(js.includes("path:'"+path+"'"),'probe path missing '+path);
 assert.ok(existsSync(new URL(path.slice(1)+'index.html',root)),'source route missing '+path);
}
assert.ok(js.includes("method:'GET'")&&js.includes("credentials:'omit'")&&js.includes("cache:'no-store'"));
assert.ok(js.includes("redirect:'manual'"));
assert.ok(js.includes("timeout")||js.includes("8000"));
assert.ok(js.includes("result.structure='PASS_STATIC_STRUCTURE'"));
assert.ok(js.includes("provider_settlement_verified:false"));
assert.ok(js.includes("order_created:false"));
assert.ok(js.includes("dovlin_collection_changed:false"));
assert.ok(!js.includes("path:'/dovlin/"));
assert.ok(page.includes('id="a745Run"')&&page.includes('id="a745Results"'));
assert.ok(page.includes('id="a745Export"')&&page.includes('id="a745Status"'));
assert.ok(page.includes('does not</strong> click a checkout button'));
assert.ok(page.includes('No information from the unreleased Dovlin collection'));
assert.ok(!page.includes('checkoutForm')||page.includes('inspect'));
for(const p of ['index.html','shop/index.html']){
 const text=read(p);
 assert.ok(text.includes('data-dovlin-temporary-menu-hold="2026-11-21"'));
 assert.ok(text.includes('style="display:none!important"'));
}
for(const src of ['public/js/shop.js','public/js/cart-page.js','public/js/checkout.js'])assert.ok(existsSync(new URL(src,root)));
assert.ok(!/fetch\([^;]*method:\s*['"]POST/.test(js),'customer journey inspector cannot submit POST');
console.log('BUILD745 SOURCE CONTRACT GREEN: 7 known customer paths; no Dovlin, same-origin GET-only manual checks, privacy-safe export, hidden Dovlin navigation preserved.');
