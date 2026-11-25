// Build 760 — original Canada checkout source, merchant product media and public policy contract.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {merchantConfiguration,merchantCoverage,merchantRssXml,merchantProductImage} from '../functions/api/_lib/merchantSearchDistribution.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const checkoutServer=read('functions/api/checkout-create-order.js');
const checkoutClient=read('public/js/checkout-reliability-core.js');
assert.match(checkoutServer,/return \["shipping", "mixed"\].*1500 : 0/);
assert.match(checkoutClient,/SHIPPING_FLAT_CENTS = 1500/);
const cfg=merchantConfiguration({});
assert.equal(cfg.shipping_price_cad,15,'missing Merchant env must never imply free shipping');
assert.equal(cfg.shipping_source,'checkout_authoritative_15_cad');
assert.equal(cfg.shipping_rate_mismatch,false);
assert.equal(cfg.returns_confirmed,true,'real published website return policy exists');
assert.equal(cfg.merchant_account_returns_confirmed,false,'website != Google account verification');
assert.equal(cfg.return_policy_url,'https://devilndove.com/returns/');
assert.equal(cfg.handling_min_business_days,5);
assert.equal(cfg.transit_max_business_days,15);
assert.equal(merchantConfiguration({MERCHANT_CA_SHIPPING_PRICE_CAD:'15.00'}).shipping_confirmed,true);
for(const wrong of ['0','0.00','5','none','1e3','-1']){
 const bad=merchantConfiguration({MERCHANT_CA_SHIPPING_PRICE_CAD:wrong,MERCHANT_ACCOUNT_SHIPPING_CONFIRMED:'true'});
 assert.equal(bad.shipping_confirmed,false,'a conflicting account env must fail closed: '+wrong);
 assert.equal(bad.shipping_price_cad,null);
}
assert.equal(merchantProductImage('/assets/placeholders/product.jpg'),'');
assert.equal(merchantProductImage('/assets/images/brand-v3/123.webp'),'');
assert.equal(merchantProductImage('http://untrusted.test/sku.png'),'');
assert.equal(merchantProductImage('/media/products/sku-123'),'https://devilndove.com/media/products/sku-123');
const base={product_id:5,slug:'ring-5',sku:'R5',name:'Handmade ring',short_description:'Handmade artisan ring produced in Southern Ontario.',price_cents:2500,currency:'CAD',requires_shipping:1,product_type:'physical',sale_channel:'onsite',merchandise_origin:'handmade',inventory_tracking:1,inventory_quantity:3,review_status:'approved',status:'active',featured_image_url:'https://devilndove.com/media/products/ring5-main'};
const products=[base,{...base,product_id:6,slug:'missing-photo',name:'Missing photo',featured_image_url:'/assets/placeholders/product.jpg'}];
const images=[{product_id:5,image_url:'https://devilndove.com/media/products/ring5-detail',sort_order:1,product_image_id:2},{product_id:5,image_url:'https://devilndove.com/media/products/ring5-detail',sort_order:2,product_image_id:3},{product_id:6,image_url:'/assets/images/brand-v3/hero.webp',sort_order:1,product_image_id:4}];
const db={prepare(sql){return {all:async()=>({results:sql.includes('FROM products p')?products:images})};}};
const cov=await merchantCoverage(db);
assert.equal(cov.eligible.length,1);
assert.equal(cov.blocked.length,1);
assert.ok(cov.blocked[0].blockers.includes('missing_original_product_image'));
assert.equal(cov.eligible[0].image_count,2);
assert.deepEqual(cov.eligible[0].additional_image_links,['https://devilndove.com/media/products/ring5-detail']);
const xml=merchantRssXml(cov);
for(const required of ['<g:price>15.00 CAD</g:price>','<g:min_handling_time>5</g:min_handling_time>','<g:max_handling_time>10</g:max_handling_time>','<g:min_transit_time>3</g:min_transit_time>','<g:max_transit_time>15</g:max_transit_time>','<g:additional_image_link>https://devilndove.com/media/products/ring5-detail</g:additional_image_link>'])
 assert.ok(xml.includes(required),required);
assert.ok(!xml.includes('0.00 CAD</g:price>'));
const denied=await merchantCoverage(db,{MERCHANT_CA_SHIPPING_PRICE_CAD:'0'});
assert.equal(denied.eligible.length,0);
assert.ok(denied.blocked[0].blockers.includes('merchant_shipping_not_confirmed'));
function policy(path){
 const html=read(path);
 assert.match(html,/<h1[^>]*>/);
 assert.match(html,/rel="canonical"/);
 const raw=html.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/);
 assert.ok(raw,'indexable JSON-LD '+path);
 return {html,json:JSON.parse(raw[1])};
}
const ship=policy('shipping/index.html');
const returns=policy('returns/index.html');
assert.match(ship.html,/\$15\.00 CAD/);
assert.match(ship.html,/5–10 business days/);
assert.match(ship.html,/3–15 business days/);
assert.equal(ship.json.hasShippingService.shippingConditions.shippingRate.value,15);
assert.equal(ship.json.hasShippingService.shippingConditions.shippingDestination.addressCountry,'CA');
assert.equal(returns.json.hasMerchantReturnPolicy.merchantReturnDays,14);
assert.equal(returns.json.hasMerchantReturnPolicy.applicableCountry,'CA');
assert.match(returns.html,/buyer pays the actual return postage/);
assert.match(returns.html,/statutory rights/);
const sitemap=read('sitemap.xml');
for(const loc of ['https://devilndove.com/shipping/','https://devilndove.com/returns/'])
 assert.ok(sitemap.includes(loc));
for(const source of ['index.html','shop/index.html','shop/product/index.html','cart/index.html','checkout/index.html','terms/index.html','help/index.html']){
 const html=read(source);
 for(const href of ['href="/shipping/"','href="/returns/"'])assert.ok(html.includes(href),source+': '+href);
}
assert.ok(!read('functions/api/merchant-feed.js').includes('fetch('),'public feed must not write to Google');
console.log('BUILD760 PASS: Canada-only $15 checkout parity, explicit 5–10/3–15 delivery, published 14-day eligible returns, original gallery media, feed misconfiguration HOLD and crawlable buyer policy links.');