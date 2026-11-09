import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {onRequestGet} from '../functions/api/admin/storefront-acceptance-660.js';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const root=fileURLToPath(new URL('..',import.meta.url));
const url='https://devilndove.com/api/admin/storefront-acceptance-660';
const receipt={receipt_id:'8eb7fc7a-35f7-45b3-9dbf-f785c906ef35',
 request_key:'e2f2cfdb-61a2-45ce-98d0-386cb66b9839',actor_user_id:10,
 requirement_id:'customer.mobile.checkout',decision:'accepted',
 observed_at:'2026-11-09T17:00:00.000Z',recorded_at:'2026-11-09T17:05:00.000Z',
 device_description:'Real Firefox Android',evidence_reference:'docs/operations/OWNER_FIELD_CHECKOUT.md',
 independently_verified:false};
function fixture(){
 const s={order:{order_id:91,order_number:'DND91',order_status:'paid',payment_status:'paid',
  payment_method:'paypal',fulfillment_type:'shipping',currency:'CAD',subtotal_cents:3000,
  discount_cents:0,shipping_cents:1500,tax_cents:585,total_cents:5085,
  shipping_country:'Canada',billing_country:'Canada',created_at:'2026-11-08',updated_at:'2026-11-09',
  customer_email:'PRIVATE@example.com'},
  items:[{order_item_id:2,product_id:53,product_name:'Original ring',product_type:'physical',
   unit_price_cents:3000,quantity:1,line_subtotal_cents:3000,requires_shipping:1}],
  payments:[{payment_id:7,provider:'paypal',payment_status:'paid',amount_cents:5085,
   currency:'CAD',paid_at:'2026-11-09',updated_at:'2026-11-09',provider_payment_id:'PRIVATE_PROVIDER_ID'}],
  refunds:[],owner:{schema:656,version:1,receipts:[receipt]},writes:0,publicJournal:false,
  broken:false};
 s.prepare=sql=>({bind(...binds){return{async first(){
  if(s.broken)throw Error('source not installed');
  if(sql.includes('FROM app_settings'))return {setting_value:JSON.stringify(s.owner),is_public:s.publicJournal?1:0};
  if(sql.includes('FROM orders'))return Number(binds[0])===91?structuredClone(s.order):null;
  for(const [key,table] of [['items','order_items'],['payments','payments'],['refunds','payment_refunds']])
   if(sql.includes('FROM '+table)&&sql.includes('COUNT(*)'))return{total:s[key].length};
  throw Error('Unexpected first: '+sql);
 },async all(){for(const [key,table] of [['items','order_items'],['payments','payments'],['refunds','payment_refunds']])
   if(sql.includes('FROM '+table))return{results:structuredClone(s[key].slice(0,20))};
  throw Error('Unexpected all: '+sql);
 },async run(){s.writes++;throw Error('Original data mutation forbidden');}};}});
 return s;}
function ctx(s,{query='',actor=10,role='admin',active=1,allowed=true}={}){
 return {request:new Request(url+query),env:{DB:s},
  data:{ddModuleAccess:{allowed,user:{user_id:actor,role,is_active:active}}}};}
async function run(s,opts){const r=await onRequestGet(ctx(s,opts));return{status:r.status,data:await r.json()};}
test('660 Storefront module mapping, manual source inspection, accessible navigation, no automatic payment',()=>{
 assert.equal(moduleKeyForPath('/admin/storefront-acceptance/'),MODULE_KEYS.STOREFRONT);
 assert.equal(moduleKeyForPath('/api/admin/storefront-acceptance-660'),MODULE_KEYS.STOREFRONT);
 const page=readFileSync(root+'admin/storefront-acceptance/index.html','utf8');
 const client=readFileSync(root+'public/js/admin-storefront-acceptance-660.js','utf8');
 const hub=readFileSync(root+'admin/storefront/index.html','utf8');
 for(const text of ['href="/shop/"','href="/cart/"','href="/checkout/"','href="/terms/"',
  'aria-live="polite"','id="a660Load"','id="a660Inspect"'])assert.ok(page.includes(text),text);
 assert.match(hub,/storefront-acceptance/);
 assert.doesNotMatch(client,/innerHTML|localStorage|setTimeout|setInterval/);
 assert.match(client,/credentials:'same-origin'/);
});
test('660 private owner device/checkpoint results remain uncertified and no order read until requested',async()=>{
 const s=fixture(),result=await run(s);
 assert.equal(result.status,200);assert.equal(result.data.original_order,null);
 assert.equal(result.data.source_records_inspected,false);assert.equal(result.data.owner.checkpoints.length,8);
 assert.equal(result.data.owner.checkpoints.find(x=>x.id==='customer.mobile.checkout').decision,'accepted');
 assert.equal(result.data.owner.checkpoints.find(x=>x.id==='customer.desktop.checkout').decision,'unreviewed');
 assert.equal(result.data.independent_acceptance,false);assert.equal(s.writes,0);
});
test('660 one original Order inspection gives status and bounded refund facts without PII',async()=>{
 const s=fixture(),r=await run(s,{query:'?order_id=91'});
 assert.equal(r.status,200);assert.equal(r.data.original_order.facts.order.currency,'CAD');
 assert.equal(r.data.original_order.facts.totals.payments,1);
 assert.equal(r.data.original_order.facts.items[0].product_id,53);
 assert.equal(r.data.original_order.facts.payments[0].payment_status,'paid');
 assert.equal(r.data.original_order.provider_settlement_independently_verified,false);
 assert.equal(r.data.original_order.carrier_acceptance_independently_verified,false);
 assert.equal(r.data.original_order.return_request_intake_independently_verified,false);
 assert.equal(r.data.no_checkout_order_created,true);assert.equal(r.data.no_payment_or_refund_executed,true);
 const raw=JSON.stringify(r.data);assert.doesNotMatch(raw,/PRIVATE@|PRIVATE_PROVIDER_ID/);
 assert.equal(s.writes,0);
});
test('660 cross-border, non-CAD, no payment, refund failure and evidence bounds stay HOLD',async()=>{
 for(const edit of [s=>s.order.shipping_country='United States',s=>s.order.billing_country='US',
  s=>s.order.currency='USD',s=>s.payments=[],
  s=>s.refunds=[{refund_id:4,payment_id:7,provider:'paypal',amount_cents:500,
   currency:'CAD',refund_status:'requested',provider_sync_status:'failed'}],
  s=>s.items=Array.from({length:21},(_,i)=>({...s.items[0],order_item_id:i+1}))]){
  const s=fixture();edit(s);const d=(await run(s,{query:'?order_id=91'})).data.original_order;
  assert.ok(d.hold.length>0);if(s.items.length>20)assert.equal(d.truncated,true);
  assert.equal(s.writes,0);}
});
test('660 source revision changes after saved Order changes; no cached result remains',async()=>{
 const s=fixture(),old=(await run(s,{query:'?order_id=91'})).data.original_order;
 s.payments[0].payment_status='failed';const next=(await run(s,{query:'?order_id=91'})).data.original_order;
 assert.notEqual(old.source_revision,next.source_revision);
 assert.ok(next.hold.includes('NO_SAVED_PAID_PAYMENT_IN_SCOPE'));
});
test('660 malformed or absent Orders, lost Admin grants and public journals fail closed',async()=>{
 const s=fixture();for(const query of ['?order_id=0','?order_id=-1','?order_id=two'])
  assert.equal((await run(s,{query})).status,400);
 assert.equal((await run(s,{query:'?order_id=88'})).status,404);
 for(const opts of [{allowed:false},{role:'customer'},{active:0}])
  assert.equal((await run(s,opts)).status,401);
 s.publicJournal=true;assert.equal((await run(s)).status,503);
 s.publicJournal=false;s.broken=true;assert.equal((await run(s)).status,503);
 assert.equal(s.writes,0);
});
