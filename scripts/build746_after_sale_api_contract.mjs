// Build 746 fake-D1 acceptance. All records are fabricated in memory and not sent
// to Production. Original order identity required; cannot send, refund or ship.
import assert from 'node:assert/strict';
import {onRequestGet,onRequestPost} from '../functions/api/admin/after-sale-746.js';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const store=new Map(),sql=[];
const db={prepare(q){return{bind(...params){return{
 async first(){sql.push(q);
  if(q.includes('FROM orders'))return params[0]===91?{order_id:91,order_number:'DND-91',
   order_status:'paid',payment_status:'paid',fulfillment_type:'pickup',currency:'CAD',
   total_cents:4100,created_at:'2026-11-14',updated_at:'2026-11-17'}:null;
  if(q.includes('FROM app_settings'))return store.get(params[0])||null;
  throw Error('Unexpected read query '+q);
 },
 async run(){sql.push(q);
  if(q.startsWith('INSERT INTO app_settings')){
   const [key,data]=params;
   if(store.has(key))return{meta:{changes:0}};
   store.set(key,{setting_value:data,is_public:0});
   return{meta:{changes:1}};
  }
  if(q.startsWith('UPDATE app_settings')){
   const [data,actor,key,old]=params;
   const previous=store.get(key);
   if(actor!==91||!previous||previous.setting_value!==old)return{meta:{changes:0}};
   store.set(key,{setting_value:data,is_public:0});
   return{meta:{changes:1}};
  }
  if(q.includes('admin_action_audit'))return{meta:{changes:1}};
  throw Error('Unexpected mutation '+q);
 },
 async all(){throw Error('No list query authorized');}
 };}};}};
const url='https://devilndove.com/api/admin/after-sale-746';
const admin={ddModuleAccess:{allowed:true,user:{user_id:91,role:'admin',is_active:1}}};
const member={ddModuleAccess:{allowed:true,user:{user_id:93,role:'member',is_active:1}}};
function context(method,body,data=admin,env={DB:db},origin='https://devilndove.com'){
 return{request:new Request(url+(method==='GET'?'?order_id=91':''),{
  method,headers:method==='POST'?{'Origin':origin,'Content-Type':'application/json'}:{},
  ...(method==='POST'?{body:JSON.stringify(body)}:{})}),data,env};
}
async function response(v){return{status:v.status,body:await v.json()};}
assert.equal(moduleKeyForPath('/api/admin/after-sale-746'),MODULE_KEYS.STOREFRONT);
assert.equal((await response(await onRequestGet(context('GET',null,member)))).status,403);
assert.equal((await response(await onRequestPost(context('POST',{},member)))).status,403);
assert.equal((await response(await onRequestGet(context('GET',null,admin,{})))).status,503);
assert.equal((await response(await onRequestPost(context('POST',{},admin,{DB:db},'https://attacker.example')))).status,403);
const get=await response(await onRequestGet(context('GET')));
assert.equal(get.status,200);
assert.equal(get.body.order.order_id,91);
assert.equal(get.body.order.customer_data_excluded,true);
assert.equal(get.body.case_journal.version,0);
assert.equal(store.size,0,'GET must not create a case');
assert.equal(Object.hasOwn(get.body.order,'customer_email'),false);
assert.equal(Object.hasOwn(get.body.order,'shipping_address'),false);
assert.equal(get.body.customer_email_or_address_exposed,false);
const key=crypto.randomUUID();
const saveBody={order_id:91,expected_version:0,request_key:key,case_type:'return_request',
 stage:'received',notes:'Original buyer request received, but no return authorization was issued.',
 evidence_reference:''};
const saved=await response(await onRequestPost(context('POST',saveBody)));
assert.equal(saved.status,200,JSON.stringify(saved.body));
assert.equal(saved.body.saved,true);assert.equal(saved.body.current_version,1);
assert.equal(saved.body.refund_issued,false);
assert.equal(saved.body.customer_notified,false);
assert.equal(saved.body.pickup_completed,false);
assert.equal(saved.body.finance_posted,false);
assert.equal(store.size,1);
assert.equal([...store.values()][0].is_public,0);
const duplicate=await response(await onRequestPost(context('POST',saveBody)));
assert.equal(duplicate.status,200);
assert.equal(duplicate.body.replayed,true);
const conflict=await response(await onRequestPost(context('POST',{...saveBody,stage:'working'})));
assert.equal(conflict.status,409);
assert.equal(conflict.body.code,'IDEMPOTENCY_KEY_CONFLICT');
const stale=await response(await onRequestPost(context('POST',{...saveBody,request_key:crypto.randomUUID()})));
assert.equal(stale.status,409);
assert.equal(stale.body.code,'STALE_CASE');
const badStage=await response(await onRequestPost(context('POST',{...saveBody,
 expected_version:1,request_key:crypto.randomUUID(),stage:'resolved'})));
assert.equal(badStage.status,400);
const unknown=await response(await onRequestPost(context('POST',{...saveBody,
 order_id:999,expected_version:0,request_key:crypto.randomUUID()})));
assert.equal(unknown.status,404);
const handoff=await response(await onRequestPost(context('POST',{...saveBody,
 expected_version:1,request_key:crypto.randomUUID(),
 stage:'handoff_recorded',evidence_reference:'private original support handoff receipt'})));
assert.equal(handoff.status,200,JSON.stringify(handoff.body));
assert.equal(handoff.body.current_version,2);
const current=await response(await onRequestGet(context('GET')));
assert.equal(current.body.case_journal.history.length,2);
assert.equal(current.body.case_journal.history[0].stage,'handoff_recorded');
assert.equal(current.body.case_journal.refund_settlement_verified,false);
assert.equal(current.body.case_journal.pickup_completion_verified,false);
assert.equal(store.size,1);
assert.ok(sql.every(q=>!/^(?:UPDATE|INSERT|DELETE)\s+[\s\S]*\b(?:orders|payments|payment_refunds|inventory|products|accounting_entries)\b/i.test(q.trim())));
console.log('BUILD746 PRIVATE AFTER-SALE TEST PASS: original order, Server Admin only, no foreign origin, idempotency, concurrency, private journal, no fake refunds/pickup or financial writes.');
