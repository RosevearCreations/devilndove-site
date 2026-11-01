import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectProductRecovery563} from '../functions/api/_lib/productChannelRecovery563.mjs';
import {onRequestGet} from '../functions/api/admin/product-channel-recovery-563.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const product={product_id:54,name:'Sweet Orange',status:'draft'};
const queue=[{social_post_queue_id:17,source_type:'product',source_id:'54',target_platforms_json:'["x","pinterest"]',post_status:'ready',do_not_repost:0},
  {social_post_queue_id:18,source_type:'job_update',source_id:'54',target_platforms_json:'["x"]'}];
const attempts=[{social_post_attempt_id:5,social_post_queue_id:17,platform_key:'x',attempt_status:'timeout',external_post_id:null,attempted_at:'2026-11-01T14:00:00Z'},
  {social_post_attempt_id:6,social_post_queue_id:18,platform_key:'x',attempt_status:'posted',external_post_id:'not_product'}];

test('Build 563 quarantines uncertain outcomes without creating duplicate provider posts',()=>{
  const model=projectProductRecovery563({product,queue,attempts});
  const x=model.destinations.find(x=>x.channel==='x');
  assert.equal(x.state,'uncertain');assert.equal(x.hold_repost,true);
  assert.deepEqual(x.local_queue_ids,[17]);assert.equal(x.attempt_count,1);
  assert.equal(x.external_reference,null);assert.equal(x.external_reference_verified_live,false);
  assert.match(x.next_action,/Open the provider/);
  for(const key of ['provider_contacted','publication_performed','automatic_retry','remote_status_verified','remote_update_authorized'])
    assert.equal(model[key],false,key);
});

test('Build 563 preserves unique local Etsy claim without asserting live status',()=>{
  const model=projectProductRecovery563({product,drafts:[{channel_key:'etsy',external_reference:'4601705477'}]});
  const etsy=model.destinations.find(x=>x.channel==='etsy');
  assert.equal(etsy.state,'local_receipt_only');assert.equal(etsy.hold_repost,true);
  assert.equal(etsy.external_reference,'4601705477');assert.equal(etsy.external_reference_verified_live,false);
  assert.match(etsy.blockers.join(' '),/does not prove current live draft/);
});

test('Build 563 detects conflicting remote IDs and fails closed on missing sources',()=>{
  const evidence=[{social_post_attempt_id:1,social_post_queue_id:17,platform_key:'pinterest',attempt_status:'posted_manual',external_post_id:'pin-A'},
    {social_post_attempt_id:2,social_post_queue_id:17,platform_key:'pinterest',attempt_status:'posted_manual',external_post_id:'pin-B'}];
  const model=projectProductRecovery563({product,queue,attempts:evidence,queueUnavailable:false});
  const pin=model.destinations.find(x=>x.channel==='pinterest');
  assert.equal(pin.state,'conflict');assert.equal(pin.external_reference,null);assert.equal(pin.hold_repost,true);
  const unavailable=projectProductRecovery563({product,queueUnavailable:true,attemptsUnavailable:true,draftsUnavailable:true});
  assert.equal(unavailable.destinations.find(x=>x.channel==='x').state,'unavailable');
  assert.equal(unavailable.destinations.find(x=>x.channel==='etsy').state,'unavailable');
});

test('Build 563 admin GET is auth gated, bounded, and SELECT-only without provider calls',async()=>{
  const url='https://devilndove.com/api/admin/product-channel-recovery-563?product_id=54';
  const denied=await onRequestGet({request:new Request(url),env:{}});assert.equal(denied.status,401);
  const sql=[];const db={withSession:()=>db,prepare(statement){sql.push(statement);return{bind(){return this;},
    async first(){return product;},async all(){
      if(statement.includes('FROM marketplace_syndication_drafts'))return {results:[{channel_key:'etsy',external_reference:'4601705477'}]};
      if(statement.includes('FROM social_post_attempts'))return {results:attempts};
      return {results:queue};}};}};
  const result=await onRequestGet({request:new Request(url),env:{DB:db},
    data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:7}}}});
  const data=await result.json();assert.equal(result.status,200,JSON.stringify(data));
  assert.equal(data.build,563);assert.equal(data.destinations.length,8);
  assert.equal(data.provider_contacted,false);assert.equal(data.publication_performed,false);
  assert.ok(sql.every(x=>/^\s*SELECT\b/i.test(x)));
  assert.equal(typeof (await import('../functions/api/admin/product-channel-recovery-563.js')).onRequestPost,'undefined');
});

test('Build 563 UI has lazy readback, save invalidation, no provider update, and exact release marker',()=>{
  const page=read('admin/product-editor/index.html'),ui=read('public/js/product-destinations-559.mjs');
  const api=read('functions/api/admin/product-channel-recovery-563.js');
  assert.match(page,/Devil n Dove • Build 563/);assert.match(page,/admin-product-recovery-563\.css\?v=563/);
  assert.match(ui,/id="dd563Recovery"/);assert.match(ui,/product-channel-recovery-563\?product_id=/);
  assert.match(ui,/invalidateRecovery\('Product saved/);assert.match(ui,/if\(!recoveryLoaded\)void refreshRecovery\(\)/);
  assert.doesNotMatch(api,/\bfetch\(|method:\s*['"]POST|\.run\(|decryptOAuthSecret/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:563|564|565)/);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build563_channel_recovery\.test\.mjs/);
});
