// Build 747: all records are fake in-memory D1; never touch Production.
import assert from 'node:assert/strict';
import {onRequestGet,onRequestPost} from '../functions/api/admin/customer-journey-747.js';
const records=new Map(),sql=[];
const id1=91,id2=92;
const handoffId=crypto.randomUUID();
records.set('site.admin.aftersale.v746.17',{is_public:0,setting_value:JSON.stringify({
 schema:746,version:1,receipts:[{receipt_id:handoffId,stage:'handoff_recorded',
 case_type:'pickup_coordination',owner_user_id:id1,evidence_reference:'Original internal pickup handoff file 2026'}]})});
const db={prepare(query){return{bind(...binds){return{
 async first(){
  sql.push(query);
  if(query.includes('FROM orders'))return binds[0]===17?{order_id:17}:null;
  if(query.includes('FROM app_settings'))return records.get(binds[0])||null;
  throw Error('Unexpected select: '+query);
 },
 async run(){
  sql.push(query);
  if(query.startsWith('INSERT INTO app_settings')){
   const [key,data]=binds;if(records.has(key))return{meta:{changes:0}};
   records.set(key,{is_public:0,setting_value:data});return{meta:{changes:1}};
  }
  if(query.startsWith('UPDATE app_settings')){
   const [data,actor,key,expected]=binds;
   const r=records.get(key);
   if(!r||r.setting_value!==expected||![id1,id2].includes(actor))return{meta:{changes:0}};
   records.set(key,{is_public:0,setting_value:data});return{meta:{changes:1}};
  }
  if(query.includes('admin_action_audit'))return{meta:{changes:1}};
  throw Error('Unsafe write: '+query);
 }
 };}};}};
function ctx(method,body,user=id1,origin='https://devilndove.com'){
 const request=new Request('https://devilndove.com/api/admin/customer-journey-747',{
  method,headers:method==='POST'?{'Content-Type':'application/json',Origin:origin}:{},
  ...(method==='POST'?{body:JSON.stringify(body)}:{})});
 const u={user_id:user,role:user===777?'member':'admin',is_active:1};
 return{request,env:{DB:db},data:{ddModuleAccess:{allowed:true,user:u}}};
}
async function call(method,body,user=id1,origin){const r=await(method==='POST'?
 onRequestPost(ctx(method,body,user,origin)):onRequestGet(ctx(method,body,user)));
 return{status:r.status,data:await r.json()};}
function payload(kind,version,other={}){return{
 kind,request_key:crypto.randomUUID(),expected_version:version,
 note:'Original evidence witnessed in real desktop and mobile Admin review.',
 source_reference:'original-file-proof-20261121-abc',decision:'pass',...other
};}
assert.equal((await call('GET',null,777)).status,403);
const initial=await call('GET');
assert.equal(initial.status,200);assert.equal(initial.data.journal.version,0);
assert.equal(records.size,1,'Read must not create private ledger');
const invalidOrigin=await call('POST',payload('device',0,{route:'/shop/',device:'desktop',browser:'firefox'}),id1,'https://evil.example');
assert.equal(invalidOrigin.status,403);
const badRoute=await call('POST',payload('device',0,{route:'/dovlin/',device:'desktop',browser:'firefox'}));
assert.equal(badRoute.status,400);
const desktop=payload('device',0,{route:'/shop/',device:'desktop',browser:'firefox'});
let x=await call('POST',desktop);assert.equal(x.status,200,JSON.stringify(x.data));
const desktopId=x.data.receipt.id;
assert.equal((await call('POST',desktop)).data.replayed,true);
const misuse=await call('POST',{...desktop,note:'Different evidence with recycled key for this observed shop.'});
assert.equal(misuse.status,409);
x=await call('POST',payload('review_device',1,{subject_id:desktopId}),id1);
assert.equal(x.status,403,'No self review');
x=await call('POST',payload('review_device',1,{subject_id:desktopId}),id2);
assert.equal(x.status,200,JSON.stringify(x.data));
const mobile=payload('device',2,{route:'/shop/',device:'mobile',browser:'chromium'});
x=await call('POST',mobile,id2);assert.equal(x.status,200);
const mobileId=x.data.receipt.id;
x=await call('POST',payload('review_device',3,{subject_id:mobileId}),id1);
assert.equal(x.status,200,JSON.stringify(x.data));
let j=(await call('GET')).data.journal;
assert.equal(j.version,4);
assert.equal(j.routes.find(x=>x.route==='/shop/').cross_device_reviewed,true);
assert.equal(j.routes.find(x=>x.route==='/cart/').cross_device_reviewed,false);
assert.equal(j.customer_device_independently_verified,false);
assert.equal(j.refund_executed,false);
x=await call('POST',payload('review_handover',4,{order_id:17,subject_id:handoffId}),id1);
assert.equal(x.status,403,'Handoff original author cannot self verify');
x=await call('POST',payload('review_handover',4,{order_id:999,subject_id:handoffId}),id2);
assert.equal(x.status,404,'Unrecognized canonical order HOLD');
x=await call('POST',payload('review_handover',4,{order_id:17,subject_id:crypto.randomUUID()}),id2);
assert.equal(x.status,409,'No fabricated original handoff');
x=await call('POST',payload('review_handover',4,{order_id:17,subject_id:handoffId}),id2);
assert.equal(x.status,200,JSON.stringify(x.data));
assert.equal(x.data.receipt.external_refund_or_pickup_confirmed,false);
assert.equal((await call('POST',payload('device',4,{route:'/help/',device:'tablet',browser:'safari'}))).status,409,'Stale version fail closed');
j=(await call('GET')).data.journal;
assert.equal(j.version,5);
assert.equal(j.receipts[0].kind,'review_handover');
assert.equal(j.receipts[0].order_id,17);
assert.equal(j.provider_payment_verified,false);
assert.equal(j.customer_notified,false);
assert.ok([...records.values()].every(v=>v.is_public===0));
assert.ok(sql.every(q=>!/^(?:UPDATE|INSERT|DELETE)\s+(?:orders|payments|payment_refunds|products|inventory|accounting_entries)\b/i.test(q.trim())));
console.log('BUILD747 PRIVATE ORIGINAL D1 PASS: two-Admin device and handover checks, real source binding, conflict/replay, no financial or provider mutation.');
