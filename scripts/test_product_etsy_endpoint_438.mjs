import test from 'node:test';
import assert from 'node:assert/strict';
import {encryptOAuthSecret} from '../functions/api/_lib/oauthSecurity.js';
import {onRequestPost} from '../functions/api/admin/product-etsy-draft.js';

const source={product_id:54,name:'Bar Soap Sweet Orange',description:'Handmade orange soap',short_description:'soap',
  product_type:'physical',price_cents:1200,currency:'CAD',inventory_quantity:4};
const shop={shop_id:'555',owner_user_id:'999',shop_name:'Devil n Dove',currency_code:'CAD',acceptance_status:'connected_verified'};

function mockDb(conn,changes){
  return {prepare(sql){let values=[];return {bind(...args){values=args;return this;},async first(){
    if(sql.includes('FROM products WHERE product_id'))return source;
    if(sql.includes('FROM oauth_provider_connections'))return conn;
    if(sql.includes('FROM etsy_oauth_shop_connections'))return shop;
    if(sql.includes("external_reference IS NOT NULL ORDER BY"))return null;
    if(sql.includes('SELECT COUNT(*) AS total'))return {total:changes.claimed?1:0};
    if(sql.includes("action_type='etsy_product_editor_draft_claimed'"))return changes.claimed?{admin_action_audit_id:22,created_at:'2026-10-22'}:null;
    if(sql.includes("action_type='etsy_product_editor_draft_rejected'"))return null;
    if(sql.includes("action_type='etsy_product_editor_rejected_attempt_reconciled'"))return null;
    if(sql.includes('SELECT external_reference FROM marketplace_syndication_drafts WHERE id='))return {external_reference:'9991'};
    throw Error('Unexpected first: '+sql);
  },async run(){
    if(sql.includes("SELECT ?,'etsy_product_editor_draft_claimed'")){if(changes.claimed)return {meta:{changes:0}};changes.claimed=true;return {meta:{changes:1}};}
    if(sql.includes('INSERT INTO marketplace_syndication_drafts')){changes.saved=true;return {meta:{changes:1}};}
    if(sql.includes('INSERT INTO admin_action_audit'))return {meta:{changes:1}};
    throw Error('Unexpected run: '+sql);
  }};}};
}

test('live Etsy check does only GET; draft click does one POST; repeat is fenced',async()=>{
  const env={ETSY_API_KEYSTRING:'mock-key',ETSY_SHARED_SECRET:'mock-etsy-secret'};
  const access=await encryptOAuthSecret(env,'mock-token','oauth-token|etsy|access');
  const conn={remote_subject_id:'999',connection_status:'connected',scopes_json:'["shops_r","listings_w"]',
    access_expires_at:new Date(Date.now()+3600000).toISOString(),access_token_ciphertext:access};
  env.DB=mockDb(conn,{claimed:false});
  const visited=[];let allowCanada=false;const originalFetch=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{
    visited.push({url,method:options.method,body:String(options.body||'')});
    if(url.endsWith('/shops/555'))return Response.json({shop_id:555,user_id:999,currency_code:'CAD'});
    if(url.endsWith('/seller-taxonomy/nodes'))return Response.json({results:[{id:123,name:'Bath',children:[{id:124,name:'Soap'}]}]});
    if(url.endsWith('/shops/555/shipping-profiles'))return Response.json({results:[{shipping_profile_id:17,title:'Canada only',origin_country_iso:'CA'}]});
    if(url.endsWith('/shops/555/readiness-state-definitions'))return Response.json({results:[{readiness_state_id:27,readiness_state:'ready_to_ship'}]});
    if(url.endsWith('/shops/555/shipping-profiles/17'))return Response.json({shipping_profile_id:17,origin_country_iso:'CA'});
    if(url.includes('/shops/555/shipping-profiles/17/destinations'))return Response.json({count:1,
      results:[{shipping_profile_id:17,destination_country_iso:allowCanada?'CA':'US',destination_region:null}]});
    if(url.endsWith('/shops/555/listings'))return Response.json({listing_id:9991,state:'draft'});
    throw Error('Unexpected provider path '+url);
  };
  const context=(body)=>({request:new Request('https://devilndove.com/api/admin/product-etsy-draft',{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),env,
    data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:1,email:'admin@example.invalid'}}}});
  try{
    const live=await onRequestPost(context({action:'test_connection',product_id:54}));
    const evidence=await live.json();assert.equal(evidence.ok,true);assert.equal(evidence.live_connection_verified,true);
    assert.deepEqual(visited.map(x=>x.method),['GET','GET','GET','GET']);
    assert.equal(evidence.options.shipping[0].id,17);
    assert.equal(evidence.options.readiness[0].id,27);
    const shipping=await onRequestPost(context({action:'test_shipping',product_id:54,shipping_profile_id:17}));
    assert.equal((await shipping.json()).shipping_profile_verified,false);
    const request={action:'create_draft',product_id:54,taxonomy_id:124,shipping_profile_id:17,
      readiness_state_id:27,confirm_canada_only_shipping_profile:true,
      parcel:{item_weight:'200',item_weight_unit:'g',item_length:'12',item_width:'9',item_height:'4',item_dimensions_unit:'cm'},
      who_made:'i_did',when_made:'2020_2026',is_supply:false,fingerprint:evidence.fingerprint,
      request_key:'550e8400-e29b-41d4-a716-446655440000',confirm_unpublished_draft_only:true,
      confirm_no_automatic_retry:true};
    const held=await onRequestPost(context(request));
    assert.equal(held.status,409);
    assert.equal((await held.json()).code,'etsy_shipping_not_canada_only');
    assert.equal(visited.filter(x=>x.method==='POST').length,0);
    allowCanada=true;
    const shipOk=await onRequestPost(context({action:'test_shipping',product_id:54,shipping_profile_id:17}));
    assert.equal((await shipOk.json()).shipping_profile_verified,true);
    const create=await onRequestPost(context(request));
    const saved=await create.json();assert.equal(saved.created,true);assert.equal(saved.listing_id,'9991');
    const posts=visited.filter(x=>x.method==='POST');assert.equal(posts.length,1);
    assert.equal(new URLSearchParams(posts[0].body).get('state'),null);
    assert.equal(new URLSearchParams(posts[0].body).get('shipping_profile_id'),'17');
    assert.equal(new URLSearchParams(posts[0].body).get('readiness_state_id'),'27');
    assert.equal(new URLSearchParams(posts[0].body).get('item_weight_unit'),'g');
    const repeat=await onRequestPost(context(request));
    assert.equal(repeat.status,409);assert.equal(visited.filter(x=>x.method==='POST').length,1);
  }finally{globalThis.fetch=originalFetch;}
});
