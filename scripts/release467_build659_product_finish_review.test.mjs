import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {onRequestGet,onRequestPost} from '../functions/api/admin/product-finish-review-659.js';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const url='https://devilndove.com/api/admin/product-finish-review-659';
function fixture(){
 const s={product:{product_id:53,name:'Real sterling ring',sku:'R53',slug:'ring-r53',status:'draft',
  review_status:'pending_review',product_type:'physical',product_category:'Rings',price_cents:3500,
  inventory_tracking:1,inventory_quantity:2,featured_image_url:'/real-ring.webp',updated_at:'2026-11-09'},
  images:[{product_image_id:7,image_url:'/real-ring.webp',alt_text:'Real ring sample',sort_order:1}],
  annotations:[{product_image_id:7,image_role:'hero',public_use_status:'internal_review',
   consent_record_id:null,width_px:2100,height_px:2100,updated_at:'2026-11-09'}],
  runs:[{product_production_run_id:1,run_key:'ACTUAL-RUN',output_quantity:2,
   run_status:'posted',posted_at:'2026-11-09',updated_at:'2026-11-09'}],
  lots:[{product_finished_inventory_lot_id:4,lot_key:'REAL-LOT',product_production_run_id:1,
   source_kind:'production_run',quantity_created:2,lot_status:'available',updated_at:'2026-11-09'}],
  docs:new Map(),writes:0,canonicalWrites:0,audits:0,conflict:false,publicJournal:false};
 s.prepare=(sql)=>({bind(...binds){return{async first(){
  if(sql.includes('FROM products'))return s.product&&Number(binds[0])===53?structuredClone(s.product):null;
  for(const [key,table] of [['images','product_images'],['annotations','product_image_annotations'],
   ['runs','product_production_runs'],['lots','product_finished_inventory_lots']])
   if(sql.includes('FROM '+table)&&sql.includes('COUNT(*)'))return {total:s[key].length};
  if(sql.includes('FROM app_settings')){const setting_value=s.docs.get(binds[0]);
   return setting_value?{setting_value,is_public:s.publicJournal?1:0}:null;}
  throw Error('Unexpected first: '+sql);
 },async all(){for(const [key,table] of [['images','product_images'],
   ['annotations','product_image_annotations'],['runs','product_production_runs'],
   ['lots','product_finished_inventory_lots']])if(sql.includes('FROM '+table))
    return {results:structuredClone(s[key].slice(0,21))};throw Error('Unexpected all: '+sql);
 },async run(){if(sql.includes('admin_action_audit')){s.audits++;return{meta:{changes:1}};}
   if(!sql.includes('app_settings')){s.canonicalWrites++;throw Error('Forbidden canonical write '+sql);}
   s.writes++;if(s.conflict)return {meta:{changes:0}};
   if(sql.includes('INSERT INTO app_settings')){if(s.docs.has(binds[0]))return{meta:{changes:0}};
    s.docs.set(binds[0],binds[1]);return{meta:{changes:1}};}
   if(s.docs.get(binds[2])!==binds[3])return {meta:{changes:0}};
   s.docs.set(binds[2],binds[0]);return {meta:{changes:1}};
 }};}});
 return s;
}
function ctx(s,{actor=10,role='admin',allowed=true,active=1,method='GET',body,origin=true,query='?product_id=53'}={}){
 const headers=body?{'Content-Type':'application/json',...(origin?{'Origin':'https://devilndove.com'}:{})}:{};
 return {env:{DB:s},data:{ddModuleAccess:{allowed,user:{user_id:actor,role,is_active:active}}},
  request:new Request(url+query,{method,headers,...(body?{body:JSON.stringify(body)}:{})})};
}
async function detail(s){return (await (await onRequestGet(ctx(s))).json());}
function review(d,extra={}){return {product_id:53,expected_version:d.version,
 expected_source_revision:d.source.source_revision,request_key:crypto.randomUUID(),
 sample_evidence:'observed_real_sample',rights_evidence:'original_permission_seen',
 safety_evidence:'original_document_seen',dovlin_design_evidence:'not_verified',
 declares_dovlin:false,decision:'owner_review_only',
 note:'I inspected the real ring sample and original saved Product/media evidence.',...extra};}
async function post(s,body,opts={}){const res=await onRequestPost(ctx(s,{method:'POST',body,...opts}));
 return {status:res.status,data:await res.json()};}
test('659 runtime routes and accessible on-demand Admin Product desk',()=>{
 assert.equal(moduleKeyForPath('/api/admin/product-finish-review-659'),MODULE_KEYS.STOREFRONT);
 const page=readFileSync(root+'admin/products/index.html','utf8');
 const client=readFileSync(root+'public/js/admin-product-finish-review-659.js','utf8');
 assert.match(page,/dd659Heading/);assert.match(page,/aria-live="polite"/);
 assert.match(page,/Dovlin original approved design/);assert.match(page,/Original media rights/i);
 assert.match(page,/admin-product-finish-review-659\.js/);
 assert.doesNotMatch(client,/innerHTML|localStorage|setInterval|setTimeout/);
 assert.match(client,/credentials:'same-origin'/);
});
test('659 reads actual one Product and bounded image/rights, production run and finished lot',async()=>{
 const s=fixture(),d=await detail(s);assert.equal(d.ok,true);
 assert.equal(d.source.facts.product.product_id,53);assert.equal(d.source.facts.images[0].product_image_id,7);
 assert.equal(d.source.facts.runs[0].run_status,'posted');
 assert.equal(d.source.facts.lots[0].lot_status,'available');
 assert.equal(d.source.independent_rights_verified,false);
 assert.equal(d.source.product_safety_certified,false);
 assert.equal(d.master_completion_percent,null);assert.equal(s.writes,0);
});
test('659 rejects role loss, anonymous and cross-origin before storage',async()=>{
 const s=fixture(),body=review(await detail(s));
 for(const denied of [{allowed:false},{role:'customer'},{active:0}]){
  assert.equal((await onRequestGet(ctx(s,denied))).status,401);
  assert.equal((await post(s,body,denied)).status,401);}
 assert.equal((await post(s,body,{origin:false})).status,403);assert.equal(s.writes,0);
});
test('659 records original source-bound owner attestation but never publishes or changes inventory',async()=>{
 const s=fixture(),body=review(await detail(s)),res=await post(s,body);
 assert.equal(res.status,200);assert.equal(res.data.receipt.review_state,'OWNER_ATTESTED_EXTERNAL_ACCEPTANCE_PENDING');
 assert.equal(res.data.receipt.external_verification,false);assert.equal(res.data.receipt.safety_certified,false);
 assert.equal(res.data.canonical_product_changed,false);assert.equal(s.canonicalWrites,0);
 assert.equal(s.product.inventory_quantity,2);assert.equal(s.audits,1);
 assert.ok(s.docs.has('site.admin.product_finish.v659.53'));
 assert.equal((await detail(s)).review_state,'OWNER_ATTESTED_EXTERNAL_ACCEPTANCE_PENDING');
});
test('659 HOLDs missing source rows, blocked rights and unreviewed samples',async()=>{
 for(const mutate of [s=>s.images=[],s=>s.runs=[],s=>s.lots=[],
  s=>s.annotations[0].public_use_status='blocked']){
  const s=fixture();mutate(s);const d=await detail(s);
  assert.equal((await post(s,review(d))).data.receipt.review_state,'OWNER_HOLD');}
 const s=fixture(),d=await detail(s);
 assert.equal((await post(s,review(d,{sample_evidence:'not_verified'}))).data.receipt.review_state,'OWNER_HOLD');
});
test('659 Dovlin original art stays owner-attested pending independent design/safety evidence',async()=>{
 const s=fixture();s.product.name='Dovlin 8 inch original plush';
 const d=await detail(s);assert.equal(d.source.dovlin,true);
 assert.match(d.source.holds.join(' '),/DOVLIN_ORIGINAL_ARTWORK/);
 assert.equal((await post(s,review(d))).data.code,'DOVLIN_MUST_BE_DECLARED');
 const r=await post(s,review(d,{declares_dovlin:true,
  dovlin_design_evidence:'approved_original_compared'}));
 assert.equal(r.status,200);assert.equal(r.data.receipt.review_state,'OWNER_ATTESTED_EXTERNAL_ACCEPTANCE_PENDING');
 assert.equal(r.data.receipt.external_verification,false);
 assert.equal(r.data.receipt.safety_certified,false);
});
test('659 prevents stale Product/media/lot source and CAS journal overwrite',async()=>{
 const s=fixture(),d=await detail(s);s.images[0].alt_text='Changed at source';
 assert.equal((await post(s,review(d))).data.code,'SOURCE_OR_JOURNAL_CHANGED');
 s.images[0].alt_text='Real ring sample';s.conflict=true;
 assert.equal((await post(s,review(d))).data.code,'CONCURRENT_REVIEW');
 assert.equal(s.canonicalWrites,0);
});
test('659 request-key lookup is idempotent and public journal fails closed',async()=>{
 const s=fixture(),body=review(await detail(s));await post(s,body);
 assert.equal((await post(s,body)).data.replayed,true);
 assert.equal((await post(s,{...body,note:'I changed the observation and original rights evidence.'})).data.code,'KEY_CONFLICT');
 const got=await (await onRequestGet(ctx(s,{query:'?product_id=53&request_key='+body.request_key}))).json();
 assert.equal(got.found,true);assert.equal(got.receipt.actor_user_id,10);
 s.publicJournal=true;assert.equal((await onRequestGet(ctx(s))).status,503);
});
test('659 rejects invalid review inputs and overbounded source without guessing readiness',async()=>{
 const s=fixture(),d=await detail(s);
 for(const edit of [{expected_version:2},{expected_source_revision:'guessed'},
  {sample_evidence:'certified'},{safety_evidence:'passed'},{note:'too short'}]){
  assert.notEqual((await post(s,review(d,edit))).status,200);}
 s.lots=Array.from({length:26},(_,i)=>({...s.lots[0],lot_key:'LOT-'+i}));
 const more=await detail(s);assert.equal(more.source.truncated,true);
 assert.equal((await post(s,review(more))).data.receipt.review_state,'OWNER_HOLD');
});
