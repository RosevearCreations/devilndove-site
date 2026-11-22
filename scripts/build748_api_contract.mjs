// Build 748: fabricated in-memory D1 only. Never contacts production or real Orders.
import assert from 'node:assert/strict';
import {onRequestGet,onRequestPost} from '../functions/api/admin/customer-journey-closure-748.js';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const store=new Map(),sql=[];
const HANDOFF=crypto.randomUUID(),HANDOFF_REVIEW=crypto.randomUUID();
const admin1=91,admin2=92;let updatedAt='2026-11-22T12:00:00Z',caseVersion=1;
function caseDoc(){return{schema:746,version:caseVersion,receipts:[{
 receipt_id:HANDOFF,source_order_id:17,stage:'handoff_recorded',case_type:'customer_support',
 owner_user_id:admin1,evidence_reference:'owner-original-support-handoff-record-2026',
 recorded_at:'2026-11-22T11:00:00Z'}]};}
store.set('site.admin.aftersale.v746.17',{is_public:0,setting_value:JSON.stringify(caseDoc())});
store.set('site.admin.customerjourney.v747',{is_public:0,setting_value:JSON.stringify({
 schema:747,version:1,receipts:[{id:HANDOFF_REVIEW,kind:'review_handover',
 subject_id:HANDOFF,order_id:17,actor_user_id:admin2,decision:'pass'}]})});
const db={prepare(q){return{bind(...binds){return{
 async first(){sql.push(q);
  if(q.includes('FROM orders'))return binds[0]===17?{
   order_id:17,order_number:'TEST-17',order_status:'paid',updated_at:updatedAt}:null;
  if(q.includes('FROM app_settings'))return store.get(binds[0])||null;
  throw Error('Unexpected SELECT: '+q);
 },
 async run(){sql.push(q);
  if(q.startsWith('INSERT INTO app_settings')){
   const[key,data]=binds;if(store.has(key))return{meta:{changes:0}};
   store.set(key,{is_public:0,setting_value:data});return{meta:{changes:1}};
  }
  if(q.startsWith('UPDATE app_settings')){
   const[data,user,key,previous]=binds;
   const item=store.get(key);
   if(!item||item.setting_value!==previous||![admin1,admin2].includes(user))
    return{meta:{changes:0}};
   store.set(key,{is_public:0,setting_value:data});return{meta:{changes:1}};
  }
  if(q.includes('admin_action_audit'))return{meta:{changes:1}};
  throw Error('Unexpected mutation: '+q);
 }
 };}};}};
const uri='https://devilndove.com/api/admin/customer-journey-closure-748';
function context(method,body=null,user=admin1,origin='https://devilndove.com',id=null){
 const u={user_id:user,role:user===999?'member':'admin',is_active:1};
 return{request:new Request(uri+(id?'?order_id='+id:''),{
  method,headers:method==='POST'?{'Origin':origin,'Content-Type':'application/json'}:{},
  ...(method==='POST'?{body:JSON.stringify(body)}:{})}),env:{DB:db},
  data:{ddModuleAccess:{allowed:true,user:u}}};
}
async function call(method,body=null,user=admin1,origin='https://devilndove.com',id=null){
 const r=await(method==='POST'?onRequestPost(context(method,body,user,origin,id)):
  onRequestGet(context(method,body,user,origin,id)));
 return{status:r.status,body:await r.json()};
}
function item(kind,version,other={}){
 return{kind,expected_version:version,request_key:crypto.randomUUID(),
  note:'Original case evidence inspected by the authorized owner and independent operator.',
  source_reference:'original-private-evidence-file-20261122',decision:
   kind==='firefox_observation'?'observed':kind==='propose_closure'?'request':
   kind==='reopen_closure'?'reopen':'pass',...other};
}
assert.equal(moduleKeyForPath('/api/admin/customer-journey-closure-748'),MODULE_KEYS.STOREFRONT);
assert.equal(moduleKeyForPath('/admin/customer-journey-recovery/'),MODULE_KEYS.STOREFRONT);
assert.equal((await call('GET',null,999)).status,403);
assert.equal((await call('POST',item('firefox_observation',0),999)).status,403);
assert.equal((await call('GET',null,admin1,'https://devilndove.com','abc')).status,400);
const start=await call('GET');assert.equal(start.status,200);
assert.equal(start.body.journal.version,0);assert.equal(store.size,2,'Read may not create an evidence row');
const initialSource=await call('GET',null,admin1,'https://devilndove.com',17);
assert.equal(initialSource.status,200);
assert.equal(initialSource.body.original.eligible_handoffs[0].internal_handoff_verified,true);
assert.equal(initialSource.body.closure.state,'HOLD_NO_CLOSURE_PROPOSAL');
assert.equal((await call('POST',item('firefox_observation',0),admin1,'https://bad.example')).status,403);
assert.equal((await call('POST',item('firefox_observation',0,{
 browser_family:'chromium',device_class:'desktop',static_pass:7,static_hold:0,
 owner_clicked_confirmation:true}))).status,400);
assert.equal((await call('POST',item('firefox_observation',0,{
 browser_family:'firefox',device_class:'desktop',static_pass:6,static_hold:0,
 owner_clicked_confirmation:true}))).status,400,'All seven bounded routes required');
const observed=item('firefox_observation',0,{
 browser_family:'firefox',device_class:'desktop',static_pass:7,static_hold:0,
 owner_clicked_confirmation:true});
let result=await call('POST',observed);assert.equal(result.status,200,JSON.stringify(result.body));
const firefoxId=result.body.receipt.id;
assert.equal(result.body.receipt.actual_device_independently_verified,false);
assert.equal((await call('POST',observed)).body.replayed,true);
assert.equal((await call('POST',{...observed,static_pass:6,static_hold:1})).status,409);
result=await call('POST',item('review_firefox',1,{subject_id:firefoxId}),admin1);
assert.equal(result.status,403,'Cannot self-review original Firefox observation');
result=await call('POST',item('review_firefox',1,{subject_id:firefoxId}),admin2);
assert.equal(result.status,200,JSON.stringify(result.body));
let reread=await call('GET');
assert.equal(reread.body.journal.firefox_review_state,'INDEPENDENTLY_REVIEWED_OWNER_ATTESTATION');
assert.equal(reread.body.journal.receipts[0].customer_reply_verified,false);
result=await call('POST',item('propose_closure',2,{order_id:999,case_id:HANDOFF}));
assert.equal(result.status,404,'Unknown canonical order');
result=await call('POST',item('propose_closure',2,{order_id:17,case_id:crypto.randomUUID()}));
assert.equal(result.status,409,'Fabricated original handoff blocked');
const propose=item('propose_closure',2,{order_id:17,case_id:HANDOFF});
result=await call('POST',propose);assert.equal(result.status,200,JSON.stringify(result.body));
const proposalId=result.body.receipt.id;
assert.equal(result.body.receipt.source_review_id,HANDOFF_REVIEW);
result=await call('POST',item('review_closure',3,{subject_id:proposalId}),admin1);
assert.equal(result.status,403,'No self-approved care closure');
result=await call('POST',item('review_closure',3,{subject_id:proposalId}),admin2);
assert.equal(result.status,200,JSON.stringify(result.body));
assert.equal(result.body.receipt.external_provider_verified,false);
assert.equal(result.body.external_refund_executed,false);
let closure=await call('GET',null,admin1,'https://devilndove.com',17);
assert.equal(closure.body.closure.state,'INTERNAL_CARE_CLOSURE_REVIEWED');
assert.equal(closure.body.closure.external_customer_reply_verified,false);
updatedAt='2026-11-22T14:00:00Z';
closure=await call('GET',null,admin1,'https://devilndove.com',17);
assert.equal(closure.body.closure.state,'HOLD_SOURCE_DRIFT_REOPEN_REVIEW_REQUIRED');
updatedAt='2026-11-22T12:00:00Z';
const reopening=item('reopen_closure',4,{order_id:17,subject_id:proposalId});
result=await call('POST',reopening,admin1);
assert.equal(result.status,200,JSON.stringify(result.body));
closure=await call('GET',null,admin1,'https://devilndove.com',17);
assert.equal(closure.body.closure.state,'REOPENED_FOLLOWUP_REQUIRED');
assert.equal((await call('POST',item('review_closure',5,{subject_id:proposalId}),admin2)).status,409,
 'Superseded reopened proposal cannot be reapproved');
assert.equal((await call('POST',item('propose_closure',4,{order_id:17,case_id:HANDOFF}))).status,409,
 'Stale journal version blocked');
assert.equal(store.get('site.admin.customerjourney.v748').is_public,0);
assert.ok(sql.every(q=>!/^(?:UPDATE|INSERT|DELETE)\s+(?:orders|payments|payment_refunds|inventory|products|accounting_entries)\b/i.test(q.trim())));
console.log('BUILD748 PRIVATE ORIGINAL D1 PASS: Firefox self-review denial, strict seven-route source, approved 746/747 handoff, two-Admin care closure, source drift, reopen, idempotency, no financial/customer/provider side effect.');
