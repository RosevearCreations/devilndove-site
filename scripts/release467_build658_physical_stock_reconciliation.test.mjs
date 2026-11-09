import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {POLICY,normalizeCount,normalizeReview,decodeJournal,latestPair}
 from '../functions/api/_lib/physicalStock658.mjs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/physical-stock-658.js';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const url='https://devilndove.com/api/admin/physical-stock-658';
function fixture(){
 const state={item:{site_item_inventory_id:31,source_type:'supply',external_key:'S31',
    item_name:'Actual jewelry casting wax',category:'Jewelry',is_active:1,stock_unit_label:'bag',
    usage_unit_label:'gram',usage_units_per_stock_unit:50,on_hand_quantity:3,reserved_quantity:1,
    incoming_quantity:0,last_counted_at:null,updated_at:'2026-11-09'},
   base:{site_item_inventory_id:31,purchase_unit_label:'bag',base_unit_label:'gram',
    base_units_per_purchase_unit:50,base_on_hand_quantity:150,base_reserved_quantity:50,
    base_incoming_quantity:0,updated_at:'2026-11-09'},
   lots:[{inventory_purchase_lot_id:9,lot_code:'REAL-BATCH9',lot_status:'available',quantity_remaining:3,
     quantity_received:5,storage_location:'casting shelf',expiry_date:null,updated_at:'2026-11-09'}],
   docs:new Map(),audit:[],writes:0,inventoryWrites:0,conflict:false,missingBase:false};
 state.prepare=(sql)=>({bind(...binds){return{
   async first(){
     if(sql.includes('FROM site_item_inventory'))return state.item?.site_item_inventory_id===Number(binds[0])?
      structuredClone(state.item):null;
     if(sql.includes('FROM site_inventory_base_balances'))return state.missingBase?null:structuredClone(state.base);
     if(sql.includes('COUNT(*) AS lot_count'))return {lot_count:state.lots.length,
       lot_remaining_purchase:state.lots.reduce((n,l)=>n+l.quantity_remaining,0)};
     if(sql.includes('FROM app_settings')){const setting_value=state.docs.get(binds[0]);
       return setting_value?{setting_value,is_public:0}:null;}
     throw Error('Unexpected query first: '+sql.slice(0,90));
   },async all(){
     if(sql.includes('FROM inventory_purchase_lots'))return {results:structuredClone(state.lots).reverse().slice(0,26)};
     if(sql.includes('FROM site_item_inventory'))return {results:[structuredClone(state.item)]};
     throw Error('Unexpected query all: '+sql.slice(0,90));
   },async run(){
     if(sql.includes('INSERT INTO admin_action_audit')){state.audit.push(binds);return{meta:{changes:1}};}
     if(sql.includes('site_item_inventory')||sql.includes('site_inventory_base_balances')||
       sql.includes('site_inventory_movements')||sql.includes('inventory_purchase_lots')){
       state.inventoryWrites++;throw Error('Forbidden canonical stock mutation');}
     if(!sql.includes('app_settings'))throw Error('Unexpected mutation: '+sql);
     state.writes++;if(state.conflict)return{meta:{changes:0}};
     if(sql.includes('INSERT INTO app_settings')){if(state.docs.has(binds[0]))return{meta:{changes:0}};
       state.docs.set(binds[0],binds[1]);return{meta:{changes:1}};}
     if(state.docs.get(binds[2])!==binds[3])return{meta:{changes:0}};
     state.docs.set(binds[2],binds[0]);return{meta:{changes:1}};
   }
 };},async all(){return this.bind().all();}});
 return state;
}
function ctx(s,{actor=10,allowed=true,role='admin',active=1,method='GET',body,origin=true,query=''}={}){
 const headers=body?{'Content-Type':'application/json',...(origin?{'Origin':'https://devilndove.com'}:{})}:{};
 return {env:{DB:s},data:{ddModuleAccess:{allowed,user:{user_id:actor,role,is_active:active}}},
   request:new Request(url+query,{method,headers,...(body?{body:JSON.stringify(body)}:{})})};
}
async function detail(s,actor=10){return (await (await onRequestGet(ctx(s,{actor,query:'?item_id=31'}))).json());}
function count(d,extra={}){return {action:'record_count',item_id:31,
  expected_source_revision:d.source.source_revision,expected_version:d.version,request_key:crypto.randomUUID(),
  counted_base_quantity:135,observed_at:new Date().toISOString(),observed_location:'Casting shelf A',
  lot_id:9,note:'Actually counted remaining wax in storage bin before a workshop session.',
  personally_counted:true,owner_confirmation:true,...extra};}
function review(d,extra={}){return {action:'review_count',item_id:31,
  expected_source_revision:d.source.source_revision,expected_version:d.version,request_key:crypto.randomUUID(),
  count_receipt_id:d.latest.count.receipt_id,decision:'approve',
  note:'Independently inspected original count evidence and actual item lot custody.',
  independent_review:true,owner_confirmation:true,...extra};}
async function post(s,body,actor=10){const response=await onRequestPost(ctx(s,{actor,method:'POST',body}));
 return {status:response.status,data:await response.json()};}

test('658 policy protects original stock, products, finance and Master Shell',()=>{
 assert.equal(POLICY.automaticStockCorrection,false);assert.equal(POLICY.automaticLotCorrection,false);
 assert.equal(POLICY.productStockMutation,false);assert.equal(POLICY.masterShellPublication,false);
 assert.equal(POLICY.independentSecondAdminRequired,true);
});
test('658 strictly rejects invented, extra-field, old, future and imprecise physical counts',()=>{
 const good=count({source:{source_revision:'a'.repeat(64)},version:0});
 for(const edit of [{counted_base_quantity:-1},{counted_base_quantity:1.12345},
  {observed_location:'?'},{personally_counted:false},{owner_confirmation:false},
  {observed_at:'2020-01-01T00:00:00.000Z'},{observed_at:'2099-01-01T00:00:00.000Z'},
  {expected_source_revision:'fabricated'},{note:'too short'},{customer_phone:'sensitive'}]){
   assert.throws(()=>normalizeCount({...good,...edit}),JSON.stringify(edit));}
 assert.equal(normalizeCount(good).counted_base_quantity,135);
});
test('658 separate reviewer decision fields are exact and cannot be auto-certified',()=>{
 const good={action:'review_count',item_id:31,expected_source_revision:'a'.repeat(64),expected_version:1,
  request_key:crypto.randomUUID(),count_receipt_id:crypto.randomUUID(),decision:'approve',
  note:'I inspected source inventory before independently reviewing this submission.',
  independent_review:true,owner_confirmation:true};
 assert.equal(normalizeReview(good).decision,'approve');
 for(const edit of [{independent_review:false},{decision:'posted'},
  {count_receipt_id:'not-a-receipt'},{payment_authorized:true}])assert.throws(()=>normalizeReview({...good,...edit}));
});
test('658 page/API require Storefront and display no automatic stock changes',()=>{
 assert.equal(moduleKeyForPath('/api/admin/physical-stock-658'),MODULE_KEYS.STOREFRONT);
 assert.equal(moduleKeyForPath('/admin/physical-stock/'),MODULE_KEYS.STOREFRONT);
 const page=readFileSync(resolve(root,'admin/physical-stock/index.html'),'utf8');
 const client=readFileSync(resolve(root,'public/js/admin-physical-stock-658.js'),'utf8');
 assert.match(page,/aria-live="polite"/);assert.match(page,/Independent review by a different Admin/);
 assert.doesNotMatch(client,/innerHTML|localStorage|setInterval|setTimeout/);
 assert.match(client,/addEventListener\('click'/);assert.match(client,/credentials:'same-origin'/);
});
test('658 denies session loss, role exclusion and cross-origin before storage',async()=>{
 const s=fixture(),d=await detail(s),body=count(d);
 for(const denied of [{allowed:false},{role:'customer'},{active:0}]){
  assert.equal((await onRequestGet(ctx(s,{...denied,query:'?item_id=31'}))).status,401);
  assert.equal((await onRequestPost(ctx(s,{...denied,method:'POST',body}))).status,401);}
 assert.equal((await onRequestPost(ctx(s,{method:'POST',body,origin:false}))).status,403);
 assert.equal(s.writes,0);
});
test('658 reads original base quantities, reservations, lot custody and bounded inventory list',async()=>{
 const s=fixture(),list=await (await onRequestGet(ctx(s))).json(),d=await detail(s);
 assert.equal(list.items.length,1);assert.equal(d.source.base.base_on_hand_quantity,150);
 assert.equal(d.source.base.base_reserved_quantity,50);assert.equal(d.source.lots[0].lot_code,'REAL-BATCH9');
 assert.equal(d.source.lot_total_matches_stock,true);assert.equal(d.version,0);
 assert.equal(s.writes,0);assert.equal(d.master_completion_percent,null);
});
test('658 genuine count persists one private item receipt but no stock, lot or Product writes',async()=>{
 const s=fixture(),d=await detail(s),body=count(d),res=await post(s,body);
 assert.equal(res.status,200);assert.equal(res.data.saved,true);assert.equal(res.data.correction_applied,false);
 assert.equal(res.data.receipt.difference_base,-15);assert.equal(s.item.on_hand_quantity,3);
 assert.equal(s.base.base_on_hand_quantity,150);assert.equal(s.inventoryWrites,0);
 assert.equal(s.writes,1);assert.equal(s.audit.length,1);
 assert.ok(s.docs.has('site.admin.physical_stock.v658.31'));
 const latest=await detail(s);assert.equal(latest.correction_state,'SECOND_ADMIN_REVIEW_REQUIRED');
});
test('658 denies same-actor approval; a distinct reviewer can approve source evidence only',async()=>{
 const s=fixture();await post(s,count(await detail(s)));const d=await detail(s);
 assert.equal((await post(s,review(d))).status,403);
 const res=await post(s,review(d),11);assert.equal(res.status,200);
 assert.equal(res.data.receipt.actor_user_id,11);
 assert.equal(res.data.receipt.correction_requires_original_inventory_authority,true);
 assert.match(res.data.receipt.correction_marker,/^DD-B658:/);
 assert.equal((await detail(s)).correction_state,'APPROVED_CORRECTION_PENDING_CANONICAL_POST');
 assert.equal(s.inventoryWrites,0);
});
test('658 lot mismatch and truncated lot evidence reject approval; HOLD remains possible',async()=>{
 for(const sourceEdit of [s=>s.lots[0].quantity_remaining=2,
   s=>s.lots=Array.from({length:26},(_,i)=>({...s.lots[0],inventory_purchase_lot_id:i+1,
     quantity_remaining:3/26}))]){
   const s=fixture();sourceEdit(s);await post(s,count(await detail(s),{lot_id:0}));
   const d=await detail(s);assert.equal((await post(s,review(d),11)).status,409);
   assert.equal((await post(s,review(d,{decision:'hold'}),11)).status,200);
 }
});
test('658 count below reservations cannot be approved as safe stock',async()=>{
 const s=fixture();await post(s,count(await detail(s),{counted_base_quantity:30}));
 assert.equal((await post(s,review(await detail(s)),11)).status,409);
});
test('658 quarantined or expired positive-quantity lots remain HOLD despite matching totals',async()=>{
 for(const changed of [l=>l.lot_status='quarantined',l=>l.expiry_date='2020-01-01']){
  const s=fixture();changed(s.lots[0]);await post(s,count(await detail(s)));
  assert.equal((await detail(s)).source.lot_custody_hold,true);
  assert.equal((await post(s,review(await detail(s)),11)).data.code,'LOT_OR_RESERVATION_HOLD');
 }
});
test('658 denies concurrent original changes, mismatched versions and unexpected archived item',async()=>{
 const s=fixture(),d=await detail(s),body=count(d);
 s.base.base_on_hand_quantity=149;
 assert.equal((await post(s,body)).data.code,'SOURCE_CHANGED');
 s.base.base_on_hand_quantity=150;assert.equal((await post(s,count(d,{expected_version:2}))).data.code,'STALE_REVIEW');
 s.item=null;assert.equal((await post(s,body)).status,404);
});
test('658 preserves request-key idempotency, rejects tampering and safeguards journal CAS',async()=>{
 const s=fixture(),body=count(await detail(s));await post(s,body);
 assert.equal((await post(s,body)).data.replayed,true);assert.equal(s.writes,1);
 assert.equal((await post(s,{...body,note:'A completely different physical inventory count and purpose was observed.'})).data.code,'REQUEST_CONFLICT');
 s.conflict=true;const d=await detail(s);const r=await post(s,review(d),11);
 assert.equal(r.data.code,'CAS_CONFLICT');assert.equal(s.inventoryWrites,0);
});
test('658 original receipt lookup works across owner accounts; public journal fails closed',async()=>{
 const s=fixture(),body=count(await detail(s));await post(s,body);
 const data=await (await onRequestGet(ctx(s,{actor:11,query:'?item_id=31&request_key='+body.request_key}))).json();
 assert.equal(data.found,true);assert.equal(data.receipt.actor_user_id,10);
 assert.throws(()=>decodeJournal({is_public:1,setting_value:s.docs.values().next().value}));
 assert.equal(latestPair(decodeJournal({is_public:0,setting_value:s.docs.values().next().value})).count.item_id,31);
});
test('658 requires original base authority; no runtime repair or invented balance',async()=>{
 const s=fixture();s.missingBase=true;
 assert.equal((await onRequestGet(ctx(s,{query:'?item_id=31'}))).status,503);
 assert.equal(s.writes,0);assert.equal(s.inventoryWrites,0);
});
test('658 a reviewed HOLD permits a fresh observed count but prevents duplicate open counts',async()=>{
 const s=fixture();await post(s,count(await detail(s)));
 let d=await detail(s);assert.equal((await post(s,count(d))).data.code,'COUNT_ALREADY_OPEN');
 await post(s,review(d,{decision:'hold'}),11);d=await detail(s);
 assert.equal((await post(s,count(d,{counted_base_quantity:140}))).status,200);
 assert.equal((await detail(s)).latest.count.counted_base_quantity,140);
});
