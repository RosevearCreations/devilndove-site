#!/usr/bin/env node
// Release 467 Build 434: public search merchandise/ref pages, no network or D1 writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = path => fs.readFileSync(path,'utf8');
const policySource=read('public/js/search-boundary-434.js');
const searchSource=read('public/js/site-search.js');
const legacySource=read('site-search.js');
const context={module:{exports:{}}};
context.globalThis=context;
vm.runInNewContext(policySource,context,{filename:'search-boundary-434.js'});
const policy=context.module.exports;
const product=(changes={})=>({
  product_id:23,slug:'silver-ring',name:'Silver Ring',status:'active',
  review_status:'published',product_type:'physical',price_cents:2800,...changes
});

test('only true approved product records can become storefront search results',()=>{
  assert.equal(policy.canShowProduct(product()),true);
  for(const row of [
    product({product_id:null}),product({slug:''}),product({slug:'../cart'}),
    product({status:'draft'}),product({review_status:'pending'}),
    product({item_kind:'tool'}),product({source_type:'supply'}),
    product({inventory_only:true}),product({is_inventory_only:true})
  ])assert.equal(policy.canShowProduct(row),false,JSON.stringify(row));
});

test('only Product, Creation and Page search cards with safe canonical routes are permitted',()=>{
  const allowed=[
    {type:'Product',name:'Ring',url:'/shop/product/?slug=silver-ring'},
    {type:'Creation',name:'Maker work',url:'/creations/'},
    {type:'Page',name:'Movie Shelf',url:'/movies/'},
    {type:'Page',name:'Tools reference',url:'/tools/'},
    {type:'Page',name:'Supplies reference',url:'/supplies/'},
    {type:'Page',name:'Toolshed reference',url:'/toolshed/'}
  ];
  for(const item of allowed)assert.equal(policy.canShowResult(item),true,JSON.stringify(item));
  for(const item of [
    {type:'Tool',name:'Tool',url:'/tools/'},{type:'Supply',name:'Supply',url:'/supplies/'},
    {type:'Movie',name:'DVD',url:'/movies/'},{type:'Product',name:'Tool',url:'/tools/'},
    {type:'Product',name:'Invalid',url:'javascript:alert(1)'},{type:'Page',name:'Admin',url:'/admin/'}
  ])assert.equal(policy.canShowResult(item),false,JSON.stringify(item));
  assert.match(policy.resultContext({type:'Page',url:'/movies/'}),/not a shop listing/i);
  assert.match(policy.resultContext({type:'Page',url:'/tools/'}),/not offered for checkout/i);
  assert.equal(policy.resultAction({type:'Product'}),'View product');
});

test('active and legacy search files are identical and contain no tool/supply/movie record fetch',()=>{
  assert.equal(legacySource,searchSource,'legacy static alias may not re-enable inventory search');
  for(const src of [searchSource,legacySource]){
    for(const api of ['/api/tools','/api/supplies','/api/movies']){
      assert.ok(!src.includes(api),api+' must not be queried in public search');
    }
    assert.match(src,/boundary\.canShowProduct/);
    assert.match(src,/boundary\.canShowResult/);
    assert.match(src,/data-search-reference-only/);
  }
  const html=read('search/index.html');
  assert.ok(html.indexOf('search-boundary-434.js?v=434')>=0);
  assert.ok(html.indexOf('search-boundary-434.js?v=434')<html.indexOf('site-search.js?v=434'));
  assert.match(html,/\/movies\/.*Movie Shelf/);
  assert.match(html,/tools.*not for sale/i);
});

test('live UI script filters injected private inventory results and keeps Movie Shelf navigation', async()=>{
  const els={};
  const domId=['siteSearchInput','siteSearchButton','siteSearchReset','siteSearchSummary',
    'siteSearchResults','siteSearchEmpty'];
  for(const id of domId)els[id]={
    value:'',innerHTML:'',textContent:'',style:{display:''},handlers:{},
    addEventListener(name,callback){this.handlers[name]=callback;}
  };
  els.siteSearchInput.value='silver';
  let domReady=null;
  const responses={
    '/api/products':{ok:true,products:[
      product(),product({product_id:99,name:'Private silver tool',slug:'private-tool',item_kind:'tool'}),
      product({product_id:100,name:'Draft silver supply',slug:'supply',review_status:'draft'})
    ]},
    '/api/creations':{ok:true,items:[]}
  };
  const calls=[];
  const page={
    document:{getElementById:id=>els[id]||null,addEventListener(name,cb){if(name==='DOMContentLoaded')domReady=cb;}},
    window:{DDSearchBoundary434:policy,location:{href:'https://devilndove.com/search/'}},
    URL, console,
    fetch:async(url,options)=>{
      calls.push(url);
      const payload=Object.keys(responses).find(prefix=>String(url).startsWith(prefix));
      return {ok:true,json:async()=>payload?responses[payload]:{ok:true}};
    }
  };
  vm.runInNewContext(searchSource,page,{filename:'public/js/site-search.js'});
  assert.equal(typeof domReady,'function');
  domReady();
  await els.siteSearchButton.handlers.click();
  assert.ok(els.siteSearchResults.innerHTML.includes('Silver Ring'));
  assert.ok(!els.siteSearchResults.innerHTML.includes('Private silver tool'));
  assert.ok(!els.siteSearchResults.innerHTML.includes('Draft silver supply'));
  assert.ok(calls.some(url=>String(url).startsWith('/api/products')));
  assert.ok(!calls.some(url=>/\/api\/(?:tools|supplies|movies)/.test(String(url))));
  els.siteSearchInput.value='movie';
  await els.siteSearchButton.handlers.click();
  assert.ok(els.siteSearchResults.innerHTML.includes('Movie Shelf'));
  assert.ok(els.siteSearchResults.innerHTML.includes('not a shop listing'));
  assert.ok(els.siteSearchResults.innerHTML.includes('href="/movies/"'));
});

test('Tools, Supplies and Toolshed remain informative and do not acquire checkout actions',()=>{
  for(const p of ['tools/index.html','supplies/index.html','toolshed/index.html']){
    const src=read(p);
    assert.doesNotMatch(src,/\/api\/checkout|\/api\/cart|\/shop\/product\/\?/i,p+' checkout route exposed');
    assert.doesNotMatch(src,/\bAdd to cart\b/i,p+' misleading cart CTA');
    assert.match(src,/workshop|reference|toolshed/i);
  }
  const api=read('functions/api/products.js');
  assert.match(api,/p\.status = 'active'/);
  assert.match(api,/review_status/);
  for(const kind of ['tools','supplies']){
    const src=read('functions/api/'+kind+'.js');
    assert.match(src,/FROM catalog_items ci/);
    assert.match(src,/COALESCE\(ci\.visible_public, 1\) = 1/);
  }
});
