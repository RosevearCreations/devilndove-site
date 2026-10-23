import test from 'node:test';
import assert from 'node:assert/strict';
import {encryptOAuthSecret} from '../functions/api/_lib/oauthSecurity.js';
import {onRequestGet,onRequestPost} from '../functions/api/admin/product-etsy-draft.js';

const product={product_id:54,name:'Bar Soap Sweet Orange',description:'An orange soap',short_description:'soap',
  product_type:'physical',price_cents:900,currency:'CAD',inventory_quantity:3};
const shop={shop_id:'555',owner_user_id:'999',shop_name:'Devil n Dove',currency_code:'CAD',acceptance_status:'connected_verified'};
const key='550e8400-e29b-41d4-a716-446655440000';
const parcel={item_weight:'200',item_weight_unit:'g',item_length:'12',item_width:'9',item_height:'4',item_dimensions_unit:'cm'};

async function harness({rejectionStatus=400,priorClaim=true,remoteTitle=null,unknown=false}={}){
  const env={ETSY_API_KEYSTRING:'mock-key',ETSY_SHARED_SECRET:'mock-secret'};
  const conn={remote_subject_id:'999',connection_status:'connected',scopes_json:'["shops_r","listings_r","listings_w"]',
    access_expires_at:new Date(Date.now()+3600000).toISOString(),
    access_token_ciphertext:await encryptOAuthSecret(env,'mock-token','oauth-token|etsy|access')};
  const state={claims:priorClaim?[{admin_action_audit_id:12,created_at:'2026-10-23',details_json:JSON.stringify({request_key:key,product_id:54})}]:[],
    rejection:priorClaim&&!unknown?{admin_action_audit_id:13,details_json:JSON.stringify({request_key:key,provider_http_status:rejectionStatus})}:null,
    reconciliation:null,posts:0,visits:[],remoteTitle};
  env.DB={prepare(sql){let args=[];return {bind(...data){args=data;return this;},async first(){
    if(sql.includes('FROM products WHERE product_id'))return product;
    if(sql.includes('FROM oauth_provider_connections'))return conn;
    if(sql.includes('FROM etsy_oauth_shop_connections'))return shop;
    if(sql.includes("external_reference IS NOT NULL ORDER BY"))return null;
    if(sql.includes('SELECT COUNT(*) AS total'))return {total:state.claims.length};
    if(sql.startsWith('SELECT admin_action_audit_id,created_at,details_json'))return state.claims.at(-1)||null;
    if(sql.includes('SELECT admin_action_audit_id,details_json')&&sql.includes('etsy_product_editor_draft_rejected'))return state.rejection;
    if(sql.includes('SELECT admin_action_audit_id,details_json')&&sql.includes('etsy_product_editor_rejected_attempt_reconciled'))return state.reconciliation;
    if(sql.includes('SELECT external_reference FROM marketplace_syndication_drafts WHERE id='))return {external_reference:'888'};
    throw Error('Unexpected SELECT: '+sql);
  },async run(){
    if(sql.includes("SELECT ?,'etsy_product_editor_rejected_attempt_reconciled'")){
      if(state.reconciliation||state.claims.length!==1||rejectionStatus!==400)return {meta:{changes:0}};
      state.reconciliation={admin_action_audit_id:14,details_json:args[3]};return {meta:{changes:1}};
    }
    if(sql.includes("SELECT ?,'etsy_product_editor_draft_claimed'")){
      if(state.claims.length>1||(state.claims.length===1&&!state.reconciliation))return {meta:{changes:0}};
      state.claims.push({admin_action_audit_id:15,details_json:args[3]});return {meta:{changes:1}};
    }
    if(sql.includes('INSERT INTO marketplace_syndication_drafts'))return {meta:{changes:1}};
    if(sql.includes('INSERT INTO admin_action_audit'))return {meta:{changes:1}};
    throw Error('Unexpected INSERT: '+sql);
  }};}};
  const request=(body)=>({env,data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:1,email:'admin@example.invalid'}}},
    request:new Request('https://devilndove.com/api/admin/product-etsy-draft',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
  const fetchMock=async(url,options)=>{
    state.visits.push({url:String(url),method:options.method,body:String(options.body||'')});
    if(url.endsWith('/shops/555'))return Response.json({shop_id:555,user_id:999,currency_code:'CAD'});
    if(url.includes('/shops/555/listings?state=draft'))return Response.json({count:state.remoteTitle?1:0,
      results:state.remoteTitle?[{listing_id:777,title:state.remoteTitle,state:'draft'}]:[]});
    if(url.endsWith('/seller-taxonomy/nodes'))return Response.json({results:[{id:100,name:'Bath',children:[{id:124,name:'Soap'}]}]});
    if(url.endsWith('/shops/555/shipping-profiles'))return Response.json({results:[{shipping_profile_id:17,title:'Canada Only',origin_country_iso:'CA'}]});
    if(url.endsWith('/shops/555/readiness-state-definitions'))return Response.json({results:[{readiness_state_id:27,readiness_state:'ready_to_ship'}]});
    if(url.endsWith('/shops/555/shipping-profiles/17'))return Response.json({shipping_profile_id:17,origin_country_iso:'CA'});
    if(url.includes('/shops/555/shipping-profiles/17/destinations'))return Response.json({count:1,
      results:[{shipping_profile_id:17,destination_country_iso:'CA',destination_region:'none'}]});
    if(url.endsWith('/shops/555/listings')&&options.method==='POST'){
      state.posts++;return Response.json({listing_id:888,state:'draft'});
    }
    throw Error('Unexpected Etsy endpoint: '+url);
  };
  const testConnection=()=>onRequestPost(request({action:'test_connection',product_id:54}));
  const reconcile=(body={})=>onRequestPost(request({action:'reconcile_rejected_draft',product_id:54,
    confirm_etsy_drafts_checked:true,confirm_no_matching_draft:true,...body}));
  const create=async()=>{
    const connected=await (await testConnection()).json();
    return onRequestPost(request({action:'create_draft',product_id:54,taxonomy_id:124,
      shipping_profile_id:17,readiness_state_id:27,parcel,who_made:'i_did',when_made:'2020_2026',is_supply:false,
      request_key:'550e8400-e29b-41d4-a716-446655440001',fingerprint:connected.fingerprint,
      confirm_unpublished_draft_only:true,confirm_no_automatic_retry:true,confirm_canada_only_shipping_profile:true}));
  };
  return {state,request,fetchMock,testConnection,reconcile,create};
}

async function withFetch(mock,fn){const original=globalThis.fetch;globalThis.fetch=mock;
  try{return await fn();}finally{globalThis.fetch=original;}}

test('only a matching proven HTTP 400 can be reconciled; never automatic POST',async()=>{
  for(const variant of [{rejectionStatus:500},{unknown:true},{priorClaim:false}]){
    const h=await harness(variant);
    await withFetch(h.fetchMock,async()=>{
      const res=await h.reconcile();assert.equal(res.status,409);
      assert.equal(h.state.posts,0);assert.equal(h.state.reconciliation,null);
    });
  }
});

test('owner checkbox and full read-only Etsy draft scan protect duplicate creation',async()=>{
  const h=await harness({remoteTitle:product.name});
  await withFetch(h.fetchMock,async()=>{
    const unchecked=await h.reconcile({confirm_no_matching_draft:false});assert.equal(unchecked.status,400);
    const held=await h.reconcile();assert.equal(held.status,409);
    assert.equal((await held.json()).code,'etsy_matching_remote_draft_found');
    assert.equal(h.state.reconciliation,null);assert.equal(h.state.posts,0);
    assert.deepEqual(h.state.visits.map(x=>x.method),['GET','GET']);
  });
});

test('confirmed 400 permits one owner-reconciled second manual attempt, then fences third',async()=>{
  const h=await harness();
  await withFetch(h.fetchMock,async()=>{
    const initial=await (await h.testConnection()).json();
    assert.equal(initial.recovery.eligible,true);
    const held=await h.create();assert.equal(held.status,409);assert.equal(h.state.posts,0);
    const approved=await h.reconcile();assert.equal(approved.status,200);
    assert.equal((await approved.json()).reconciled,true);assert.equal(h.state.posts,0);
    const next=await (await h.testConnection()).json();
    assert.equal(next.recovery.state,'owner_reconciled_one_final_attempt');
    assert.ok(!next.blockers.includes('previous_etsy_remote_attempt_needs_reconciliation'));
    const created=await h.create();assert.equal(created.status,200);
    assert.equal((await created.json()).listing_id,'888');assert.equal(h.state.posts,1);
    const fields=new URLSearchParams(h.state.visits.find(x=>x.method==='POST').body);
    for(const [field,value] of Object.entries(parcel))assert.equal(fields.get(field),value);
    const third=await h.create();assert.equal(third.status,409);assert.equal(h.state.posts,1);
  });
});

test('missing measurements fail before a provider write or a durable claim',async()=>{
  const h=await harness({priorClaim:false});
  await withFetch(h.fetchMock,async()=>{
    const connected=await (await h.testConnection()).json();
    const res=await onRequestPost(h.request({action:'create_draft',product_id:54,taxonomy_id:124,
      shipping_profile_id:17,readiness_state_id:27,who_made:'i_did',when_made:'2020_2026',is_supply:false,
      request_key:key,fingerprint:connected.fingerprint,confirm_unpublished_draft_only:true,
      confirm_no_automatic_retry:true,confirm_canada_only_shipping_profile:true}));
    assert.equal(res.status,400);assert.equal((await res.json()).code,'etsy_missing_or_invalid_parcel');
    assert.equal(h.state.posts,0);assert.equal(h.state.claims.length,0);
  });
});
