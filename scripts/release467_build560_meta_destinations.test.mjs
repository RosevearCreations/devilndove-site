import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectMetaReadiness560} from '../functions/api/_lib/productMetaReadiness560.mjs';
import {onRequestGet} from '../functions/api/admin/product-meta-readiness-560.js';
import {destinationProjection559} from '../public/js/product-destinations-559.mjs';

const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const product={product_id:54,name:'Bar Soap Sweet Orange',status:'draft'};
const originals=[
  {product_image_id:342,image_url:'https://devilndove.com/images/342.jpg',alt_text:'Orange soap bars',width_px:1209,height_px:907,public_use_status:'all_public_ok'},
  {product_image_id:341,image_url:'https://devilndove.com/images/341.jpg',alt_text:'Soap in clear wrapper',width_px:1209,height_px:907,public_use_status:'internal_review'},
  {product_image_id:343,image_url:'https://devilndove.com/images/343.jpg',alt_text:'Labeled orange soap',width_px:1853,height_px:1391,public_use_status:'all_public_ok'},
  {product_image_id:344,image_url:'javascript:alert(1)',alt_text:'Unsafe photo',width_px:2000,height_px:2000,public_use_status:'all_public_ok'}
];
const byKey=(view,key)=>view.destinations.find(destination=>destination.key===key);

test('Build 560 refuses Meta API posting even when local settings and OAuth claim fully ready',()=>{
  const result=projectMetaReadiness560({product,images:originals,
    platforms:[{platform_key:'facebook',api_ready:1},{platform_key:'instagram',api_ready:1}],
    oauth:[{provider_key:'meta',connection_status:'connected',scopes_json:JSON.stringify([
      'pages_show_list','pages_manage_posts','pages_read_engagement','instagram_content_publish']),access_expires_at:'2027-01-01T00:00:00Z'}],
    now:Date.parse('2026-11-01T00:00:00Z')});
  assert.equal(result.approved_photo_count,2);
  assert.deepEqual(result.photos.map(photo=>photo.product_image_id),[342,343]);
  assert.equal(JSON.stringify(result).includes('javascript:'),false);
  for(const destination of result.destinations){
    assert.equal(destination.mode,'manual_handoff');assert.equal(destination.handoff_ready,true);
    assert.equal(destination.api_publishing_allowed,false);assert.equal(destination.remote_post_id,null);
    assert.equal(destination.external_publication_confirmed,false);
    assert.ok(destination.blockers.length>0);
  }
  assert.equal(byKey(result,'facebook').local_platform_api_ready_claim,true);
  assert.equal(byKey(result,'instagram').account_verified_for_publishing,false);
  assert.match(byKey(result,'facebook_marketplace').blockers.join(' '),/Marketplace listing API posting is not independently supported/);
  assert.equal(result.provider_contacted,false);assert.equal(result.publication_performed,false);
});

test('Build 560 recognizes the shared Meta OAuth record without calling it a posting grant',()=>{
  const result=destinationProjection559({product,connections:[{provider_key:'meta',connection_status:'connected',access_expires_at:null}]});
  for(const channel of ['facebook','instagram']){
    const row=result.destinations.find(item=>item.key===channel);
    assert.match(row.connection,/Local OAuth record only/);
    assert.equal(row.publication_available,false);
  }
  assert.match(result.destinations.find(item=>item.key==='facebook_marketplace').connection,/not authorized/);
});

test('Build 560 handles absent, expired or incomplete OAuth and unapproved photos without pretending readiness',()=>{
  const empty=projectMetaReadiness560({product,images:originals.map(im=>({...im,public_use_status:'internal_review'}))});
  assert.equal(empty.approved_photo_count,0);
  assert.equal(byKey(empty,'facebook_marketplace').handoff_ready,false);
  assert.match(byKey(empty,'facebook').blockers.join(' '),/No saved Meta OAuth connection/);
  const expired=projectMetaReadiness560({product,images:originals,now:Date.parse('2026-11-01'),oauth:[{
    provider_key:'meta',connection_status:'connected',scopes_json:'broken',access_expires_at:'2026-01-01T00:00:00Z'}]});
  assert.equal(byKey(expired,'facebook').connection_state,'needs_attention');
  assert.match(byKey(expired,'facebook').blockers.join(' '),/expired/);
  assert.match(byKey(expired,'facebook').blockers.join(' '),/pages_manage_posts/);
  const missing=projectMetaReadiness560({images:originals,annotationUnavailable:true});
  assert.equal(missing.product_id,null);
  assert.equal(byKey(missing,'instagram').handoff_ready,false);
});

test('Build 560 endpoint enforces authenticated GET and local primary D1 readback only',async()=>{
  const route='https://devilndove.com/api/admin/product-meta-readiness-560?product_id=54';
  const denied=await onRequestGet({request:new Request(route),env:{}});
  assert.equal(denied.status,401);assert.equal((await denied.json()).provider_contacted,false);
  const sqls=[];
  const db={withSession:()=>db,prepare(sql){sqls.push(sql);return {
    bind(){return this;},async first(){if(sql.includes('FROM products'))return product;throw Error('Unexpected first '+sql);},
    async all(){
      if(sql.includes('FROM oauth_provider_connections'))return {results:[]};
      if(sql.includes('FROM social_platform_connections'))return {results:[]};
      if(sql.includes('FROM product_images pi'))return {results:originals};
      throw Error('Unexpected all '+sql);
    }
  };}};
  const allowed=await onRequestGet({request:new Request(route),env:{DB:db},
    data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:7}}}});
  const payload=await allowed.json();
  assert.equal(allowed.status,200,JSON.stringify(payload));assert.equal(payload.build,560);
  assert.equal(payload.photos.length,2);assert.equal(payload.destinations.length,3);
  assert.equal(payload.provider_contacted,false);assert.equal(payload.publication_performed,false);
  assert.ok(sqls.every(sql=>/^\s*SELECT\b/i.test(sql)));
  const unsupported=new Request(route,{method:'POST'});
  assert.equal(typeof (await import('../functions/api/admin/product-meta-readiness-560.js')).onRequestPost,'undefined');
  assert.equal(unsupported.method,'POST');
});

test('Build 560 keeps Meta evidence behind one owner click and does not ship Graph writes',()=>{
  const page=file('admin/product-editor/index.html'),ui=file('public/js/product-destinations-559.mjs');
  const api=file('functions/api/admin/product-meta-readiness-560.js');
  const pure=file('functions/api/_lib/productMetaReadiness560.mjs');
  assert.match(page,/Devil n Dove • Build 560/);
  assert.match(page,/admin-product-meta-560\.css\?v=560/);
  assert.match(ui,/id="dd560Meta"/);
  assert.match(ui,/meta-review/);
  assert.match(ui,/product-meta-readiness-560\?product_id=/);
  assert.match(ui,/Check Meta handoff readiness/);
  assert.match(ui,/if\(!metaLoaded\)void refreshMeta\(\)/);
  assert.match(api,/verifiedAdminFromModule\(c\)/);
  assert.match(api,/withSession\('first-primary'\)/);
  assert.match(api,/readCanonicalDistributionGallery/);
  assert.match(pure,/allowedImage/);
  assert.doesNotMatch(api,/\bfetch\(|method:\s*['"]POST|access_token_ciphertext|decryptOAuthSecret|\.run\(/);
  assert.match(file('.github/workflows/production-pages-deploy-current.yml'),/"build":560/);
  assert.match(file('.github/workflows/current-application-quality.yml'),/release467_build560_meta_destinations\.test\.mjs/);
});
