import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareTikTokCaption561,projectTikTokHandoff561,TIKTOK_CAPTION_LIMIT_561}
  from '../functions/api/_lib/productTikTokHandoff561.mjs';
import {onRequestGet} from '../functions/api/admin/product-tiktok-handoff-561.js';
const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const product={product_id:54,name:'Sweet Orange Soap',status:'draft',description:'Handcrafted soap with sweet orange aroma.',
  short_description:'A fresh Sweet Orange soap bar.',price_cents:1200,currency:'CAD'};
const originals=[
  {product_image_id:342,image_url:'https://devilndove.com/images/342.jpg',alt_text:'Orange soap bars',width_px:1209,height_px:907,public_use_status:'all_public_ok'},
  {product_image_id:341,image_url:'https://devilndove.com/images/341.jpg',alt_text:'Wrapped soap bar',width_px:1209,height_px:907,public_use_status:'internal_review'},
  {product_image_id:343,image_url:'https://devilndove.com/images/343.jpg',alt_text:'Labeled orange soap',width_px:1853,height_px:1391,public_use_status:'all_public_ok'},
  {product_image_id:344,image_url:'javascript:alert(1)',alt_text:'Unsafe photo',width_px:2000,height_px:2000,public_use_status:'all_public_ok'}
];

test('Build 561 prepares a truthfully labeled local TikTok draft packet and only approved photo originals',()=>{
  const handoff=projectTikTokHandoff561({product,images:originals,oauth:[{provider_key:'tiktok',connection_status:'connected',
    scopes_json:JSON.stringify(['video.upload','video.publish']),access_expires_at:'2027-01-01T00:00:00Z'}],
    platforms:[{platform_key:'tiktok',api_ready:1}],now:Date.parse('2026-11-01T00:00:00Z')});
  assert.equal(handoff.manual_handoff_ready,true);
  assert.equal(handoff.approved_photo_count,2);
  assert.deepEqual(handoff.photos.map(p=>p.product_image_id),[342,343]);
  assert.equal(handoff.caption,`Sweet Orange Soap\n\nA fresh Sweet Orange soap bar.\n\nCAD $12.00`);
  assert.equal(handoff.caption_length,handoff.caption.length);
  assert.equal(JSON.stringify(handoff).includes('javascript:'),false);
  assert.equal(handoff.mode,'manual_draft_handoff');
  assert.equal(handoff.local_packet_state,'prepared_on_request_not_saved_on_tiktok');
  assert.equal(handoff.connection_state,'local_oauth_only');
  assert.equal(handoff.upload_scope_saved,true);assert.equal(handoff.publish_scope_saved,true);
  assert.equal(handoff.local_api_ready_claim,true);
  for(const key of ['creator_live_verified','app_audit_verified','media_domain_verified','api_upload_allowed','api_publish_allowed','publication_performed','provider_contacted'])
    assert.equal(handoff[key],false,key);
  assert.equal(handoff.remote_draft_id,null);assert.equal(handoff.remote_post_id,null);
});

test('Build 561 does not conflate missing/expired TikTok OAuth with lack of manual handoff',()=>{
  const offline=projectTikTokHandoff561({product,images:originals,oauthUnavailable:true});
  assert.equal(offline.manual_handoff_ready,true);
  assert.equal(offline.connection_state,'unavailable');
  assert.match(offline.account_checks.join(' '),/OAuth status could not be read/);
  const expired=projectTikTokHandoff561({product,images:originals,now:Date.parse('2026-11-01'),
    oauth:[{provider_key:'tiktok',connection_status:'connected',scopes_json:'not-json',access_expires_at:'2026-01-01T00:00:00Z'}]});
  assert.equal(expired.connection_state,'needs_attention');
  assert.match(expired.account_checks.join(' '),/expired/);
  assert.match(expired.account_checks.join(' '),/video\.publish/);
  assert.equal(expired.api_publish_allowed,false);
});

test('Build 561 refuses to treat missing Product facts, media approval or overflow as a ready handoff',()=>{
  const broken=projectTikTokHandoff561({product:{...product,status:'archived',price_cents:0,description:'',short_description:''},
    images:originals.map(image=>({...image,public_use_status:'internal_review'})),annotationUnavailable:true});
  assert.equal(broken.manual_handoff_ready,false);
  assert.ok(broken.manual_handoff_warnings.length>=4);
  const long=prepareTikTokCaption561({...product,short_description:'😀'.repeat(2100)});
  assert.ok(long.length>TIKTOK_CAPTION_LIMIT_561);
  const over=projectTikTokHandoff561({product:{...product,short_description:'😀'.repeat(2100)},images:originals});
  assert.equal(over.manual_handoff_ready,false);
  assert.match(over.manual_handoff_warnings.join(' '),/4,000 UTF-16/);
  const batch=Array.from({length:36},(_,i)=>({...originals[0],product_image_id:i+1}));
  const capped=projectTikTokHandoff561({product,images:batch});
  assert.equal(capped.photos.length,35);
  assert.equal(capped.manual_handoff_ready,false);
});

test('Build 561 admin GET reads only canonical local evidence and never triggers TikTok provider calls',async()=>{
  const url='https://devilndove.com/api/admin/product-tiktok-handoff-561?product_id=54';
  const denied=await onRequestGet({request:new Request(url),env:{}});
  assert.equal(denied.status,401);assert.equal((await denied.json()).provider_contacted,false);
  const sqls=[];
  const db={withSession:()=>db,prepare(sql){sqls.push(sql);return{
    bind(){return this;},async first(){if(sql.includes('FROM products'))return product;throw Error('Unexpected SELECT first '+sql);},
    async all(){
      if(sql.includes('FROM oauth_provider_connections'))return {results:[{provider_key:'tiktok',connection_status:'connected',scopes_json:'["video.upload"]'}]};
      if(sql.includes('FROM social_platform_connections'))return {results:[{platform_key:'tiktok',api_ready:1}]};
      if(sql.includes('FROM product_images pi'))return {results:originals};
      throw Error('Unexpected SELECT '+sql);
    }
  };}};
  const allowed=await onRequestGet({request:new Request(url),env:{DB:db},
    data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:7}}}});
  const body=await allowed.json();
  assert.equal(allowed.status,200,JSON.stringify(body));
  assert.equal(body.build,561);assert.equal(body.product_id,54);
  assert.equal(body.approved_photo_count,2);
  assert.equal(body.api_upload_allowed,false);assert.equal(body.api_publish_allowed,false);
  assert.equal(body.provider_contacted,false);assert.equal(body.publication_performed,false);
  assert.ok(sqls.every(sql=>/^\s*SELECT\b/i.test(sql)));
  assert.equal(typeof (await import('../functions/api/admin/product-tiktok-handoff-561.js')).onRequestPost,'undefined');
});

test('Build 561 TikTok editor keeps a one-click, nonpublishing draft preparation flow',()=>{
  const page=file('admin/product-editor/index.html'),ui=file('public/js/product-destinations-559.mjs');
  const api=file('functions/api/admin/product-tiktok-handoff-561.js');
  const pure=file('functions/api/_lib/productTikTokHandoff561.mjs');
  assert.match(page,/Devil n Dove • Build 56[1234567]/);
  assert.match(page,/admin-product-tiktok-561\.css\?v=561/);
  assert.match(ui,/id="dd561TikTok"/);
  assert.match(ui,/Prepare TikTok draft handoff/);
  assert.match(ui,/product-tiktok-handoff-561\?product_id=/);
  assert.match(ui,/if\(!tiktokLoaded\)void refreshTikTok\(\)/);
  assert.match(ui,/event\.stopPropagation\(\)/);
  assert.match(ui,/No draft or upload is created on TikTok/);
  assert.match(api,/verifiedAdminFromModule\(c\)/);
  assert.match(api,/withSession\('first-primary'\)/);
  assert.match(api,/readCanonicalDistributionGallery/);
  assert.match(pure,/allowedImage/);
  assert.doesNotMatch(api,/\bfetch\(|method:\s*['"]POST|access_token_ciphertext|decryptOAuthSecret|\.run\(/);
  assert.match(file('.github/workflows/production-pages-deploy-current.yml'),/"build":56[1234567]/);
  assert.match(file('.github/workflows/current-application-quality.yml'),/release467_build561_tiktok_draft_handoff\.test\.mjs/);
});
