// Build 750 genuine original-source contract with fake in-memory D1. NO real customer/provider writes.
import assert from 'node:assert/strict';
import {onRequestGet as get750,onRequestPost as post750} from '../functions/api/admin/customer-care-custody-750.js';
import {onRequestGet as get749,onRequestPost as post749} from '../functions/api/admin/customer-care-queue-749.js';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const TASK=crypto.randomUUID(),CASE=crypto.randomUUID(),PROGRESS=crypto.randomUUID();
const store=new Map(),sql=[];let updated='2026-11-22T14:00:00Z',caseVersion=1;
const sha='a'.repeat(64),wrong='b'.repeat(64);
const realOrder={order_id:17,updated_at:updated};
const orig={schema:749,version:2,receipts:[
 {id:PROGRESS,kind:'review_followup',decision:'pass',subject_id:TASK,
  actor_user_id:92,progress_id:crypto.randomUUID()},
 {id:TASK,kind:'task_open',order_id:17,case_id:CASE,case_type:'customer_support',
  actor_user_id:91,assignee_user_id:91,due_date:'2026-11-21',
  priority:'urgent',source_order_updated_at:updated,source_case_version:caseVersion}
]};
store.set('site.admin.customerjourney.workqueue.v749',{is_public:0,setting_value:JSON.stringify(orig)});
store.set('site.admin.aftersale.v746.17',{is_public:0,setting_value:JSON.stringify({
 schema:746,version:caseVersion,receipts:[{receipt_id:CASE,source_order_id:17,
  case_type:'customer_support',stage:'received',owner_user_id:91}]})});
const db={prepare(stmt){return{bind(...params){return{
 async first(){
  sql.push(stmt);
  if(stmt.includes('FROM orders'))return params[0]===17?{...realOrder,updated_at:updated}:null;
  if(stmt.includes('FROM users'))return [91,92,93].includes(params[0])?{user_id:params[0]}:null;
  if(stmt.includes('FROM app_settings'))return store.get(params[0])||null;
  throw Error('Unreviewed SELECT '+stmt);
 },
 async run(){
  sql.push(stmt);
  if(stmt.startsWith('INSERT INTO app_settings')){
   const[key,data]=params;
   if(store.has(key))return{meta:{changes:0}};
   store.set(key,{is_public:0,setting_value:data});return{meta:{changes:1}};
  }
  if(stmt.startsWith('UPDATE app_settings')){
   const[data,user,key,prior]=params,item=store.get(key);
   if(!item||item.setting_value!==prior||![91,92,93].includes(user))
    return{meta:{changes:0}};
   store.set(key,{is_public:0,setting_value:data});return{meta:{changes:1}};
  }
  if(stmt.includes('admin_action_audit'))return{meta:{changes:1}};
  throw Error('Unexpected mutation '+stmt);
 }
 };}};}};
function ctx(which,method,body=null,user=91,urlSuffix='',origin='https://devilndove.com'){
 const url='https://devilndove.com/api/admin/'+which+urlSuffix;
 const headers=method==='POST'?{
  Origin:origin,'Content-Type':'application/json',
  'User-Agent':'Mozilla/5.0 (Windows NT 10.0; rv:160.0) Gecko/20100101 Firefox/160.0'}:{};
 return{request:new Request(url,{method,headers,...(method==='POST'?{body:JSON.stringify(body)}:{})}),
  env:{DB:db},data:{ddModuleAccess:{allowed:true,user:{
   user_id:user,role:user===999?'member':'admin',is_active:1}}}};
}
async function invoke(which,method,body=null,user=91,urlSuffix='',origin='https://devilndove.com'){
 const res=await(which==='customer-care-custody-750'?
  (method==='GET'?get750:post750)(ctx(which,method,body,user,urlSuffix,origin)):
  (method==='GET'?get749:post749)(ctx(which,method,body,user,urlSuffix,origin)));
 return{status:res.status,data:await res.json()};
}
function payload(kind,version,additional={}){
 const decisions={response_record:'record',response_review:'pass',escalation_raise:'raise',
  escalation_ack:'acknowledge',escalation_clear:'resolved',retention_hold:'hold',
  retention_release:'release',archive_propose:'propose',archive_review:'approve',
  archive_restore:'restore'};
 return{kind,decision:decisions[kind],task_id:TASK,request_key:crypto.randomUUID(),
  expected_version:version,source_reference:'original-local-source-artifact-evidence-750',
  note:'Verified internal original task custody evidence is recorded without any customer action.',
  ...additional};
}
const get=(suffix='',user=91)=>invoke('customer-care-custody-750','GET',null,user,suffix);
const post=(p,user=91,origin='https://devilndove.com')=>
 invoke('customer-care-custody-750','POST',p,user,'',origin);
const getQueue=(suffix='')=>invoke('customer-care-queue-749','GET',null,91,suffix);
const postQueue=(p)=>invoke('customer-care-queue-749','POST',p,91);
const future=new Date(Date.now()+365*86400000).toISOString().slice(0,10);
assert.equal(moduleKeyForPath('/api/admin/customer-care-custody-750'),MODULE_KEYS.STOREFRONT);
assert.equal((await get('',999)).status,403);
assert.equal((await post(payload('response_record',0),999)).status,403);
assert.equal((await post(payload('response_record',0),91,'https://evil.example')).status,403);
assert.equal((await get('?task_id=wrong')).status,400);
let s=await get();assert.equal(s.status,200);
assert.equal(s.data.summary.active,1);
assert.equal(s.data.summary.archived,0);
assert.equal(s.data.receipts.length,0);
assert.equal(store.size,2,'Pure GET may not create a private journal row');
s=await get('?task_id='+TASK);
assert.equal(s.data.selected.source_status,'ORIGINAL_ORDER_CASE_CURRENT');
assert.equal(s.data.selected.response_state,'HOLD_NO_ORIGINAL_RESPONSE_ARTIFACT');
let x=await post(payload('response_record',0,{sha256:wrong,source_channel:'email'}),92);
assert.equal(x.status,403,'Non-assignee cannot attest to original response');
x=await post(payload('response_record',0,{sha256:'bad',source_channel:'email'}));
assert.equal(x.status,400,'Invalid digest');
const original=payload('response_record',0,{sha256:sha,source_channel:'email'});
x=await post(original);assert.equal(x.status,200,JSON.stringify(x.data));
const responseId=x.data.receipt.id;
assert.equal(x.data.external_provider_verified,false);
assert.equal((await post(original)).data.replayed,true);
assert.equal((await post({...original,note:'A new conflicting response record with a changed original digest reference'})).status,409);
x=await post(payload('response_review',1,{subject_id:responseId,sha256:sha}),91);
assert.equal(x.status,403,'No self-review');
x=await post(payload('response_review',1,{subject_id:responseId,sha256:wrong}),92);
assert.equal(x.status,409,'Mismatch must fail closed');
x=await post(payload('response_review',1,{subject_id:responseId,sha256:sha}),92);
assert.equal(x.status,200,JSON.stringify(x.data));
const responseReviewId=x.data.receipt.id;
s=await get('?task_id='+TASK);
assert.equal(s.data.selected.response_state,'INDEPENDENT_LOCAL_ARTIFACT_HASH_MATCH');
assert.equal(s.data.selected.customer_reply_provider_confirmed,false);
const overdue=payload('escalation_raise',2,{escalation_reason:'overdue',escalation_owner_user_id:92});
x=await post(overdue);
assert.equal(x.status,200,JSON.stringify(x.data));
const escalationId=x.data.receipt.id;
assert.equal((await post(payload('escalation_raise',3,{escalation_reason:'blocked',escalation_owner_user_id:92}))).status,409);
x=await post(payload('escalation_ack',3,{subject_id:escalationId}),91);
assert.equal(x.status,403,'Only real escalation owner can acknowledge');
x=await post(payload('escalation_ack',3,{subject_id:escalationId}),92);
assert.equal(x.status,200);
x=await post(payload('escalation_clear',4,{subject_id:escalationId}),91);
assert.equal(x.status,403,'Raiser cannot independently resolve');
x=await post(payload('escalation_clear',4,{subject_id:escalationId}),92);
assert.equal(x.status,403,'ACK owner cannot independently resolve');
x=await post(payload('escalation_clear',4,{subject_id:escalationId}),93);
assert.equal(x.status,200);
s=await get('?task_id='+TASK);
assert.equal(s.data.selected.escalation_state,'RESOLVED_INTERNAL');
const legal=payload('retention_hold',5);
x=await post(legal);assert.equal(x.status,200);
const holdId=x.data.receipt.id;
assert.equal((await post(payload('archive_propose',6,{retention_review_on:future}))).status,409,
 'Active hold blocks proposal');
assert.equal((await post(payload('retention_release',6,{subject_id:holdId}),91)).status,403,
 'Cannot self-release legal hold');
x=await post(payload('retention_release',6,{subject_id:holdId}),92);
assert.equal(x.status,200);
const proposed=payload('archive_propose',7,{retention_review_on:future});
x=await post(proposed);assert.equal(x.status,200,JSON.stringify(x.data));
const proposalId=x.data.receipt.id;
assert.equal((await post(payload('archive_review',8,{subject_id:proposalId}),91)).status,403,
 'Archive proposal must not self approve');
updated='2026-11-22T18:00:00Z';
x=await post(payload('archive_review',8,{subject_id:proposalId}),92);
assert.equal(x.status,409,'Original source drift must HOLD approval');
updated='2026-11-22T14:00:00Z';
x=await post(payload('archive_review',8,{subject_id:proposalId}),92);
assert.equal(x.status,200,JSON.stringify(x.data));
assert.equal(x.data.original_evidence_deleted,false);
s=await get('?task_id='+TASK+'&view=archived');
assert.equal(s.data.summary.archived,1);
assert.equal(s.data.summary.active,0);
assert.equal(s.data.selected.archive_state,'ARCHIVED_IMMUTABLE_RECEIPTS');
assert.equal(s.data.rows.length,1);
assert.equal(s.data.selected.retention_review_on,future);
let originalQueue=await getQueue();
assert.equal(originalQueue.status,200,JSON.stringify(originalQueue.data));
assert.equal(originalQueue.data.queue.total,0,'Build749 active queue hides independently archived task');
assert.equal(originalQueue.data.queue.archived_hidden,1);
assert.equal(store.get('site.admin.customerjourney.workqueue.v749').is_public,0);
assert.equal(store.get('site.admin.customerjourney.carecustody.v750').is_public,0);
const archivedProgress={kind:'task_progress',decision:'attempted',subject_id:TASK,
 expected_version:2,request_key:crypto.randomUUID(),source_reference:'original-customer-source-750',
 note:'Attempted another follow-up but original case was independently archived.'};
x=await postQueue(archivedProgress);
assert.equal(x.status,409,'Cannot mutate archived task through older Build749 work queue');
x=await post(payload('response_record',9,{sha256:sha,source_channel:'email'}));
assert.equal(x.status,409,'No new response writes on archived task');
x=await post(payload('archive_restore',9));
assert.equal(x.status,200);
s=await get('?task_id='+TASK);
assert.equal(s.data.selected.archive_state,'RESTORED_TO_ACTIVE');
originalQueue=await getQueue();
assert.equal(originalQueue.data.queue.total,1,'Restore reactivates original queue without deleting receipts');
const raw=JSON.parse(store.get('site.admin.customerjourney.carecustody.v750').setting_value);
assert.equal(raw.receipts.length,10,'All original append-only custody events retained including restore');
assert.ok(raw.receipts.some(z=>z.id===responseReviewId));
assert.ok(raw.receipts.some(z=>z.id===proposalId));
assert.ok(sql.every(q=>!/^(?:UPDATE|INSERT|DELETE)\s+(?:orders|payments|payment_refunds|inventory|products|users|sessions|accounting_entries)\b/i.test(q.trim())),
 'No customer/financial/provider source mutation');
console.log('BUILD750 ORIGINAL PRIVATE D1 PASS: verified Admin, task/Order/Build746 custody, response local digest independently matched, escalation owner + independent clear, legal hold distinct release, two-Admin immutable archive, drift HOLD, prior Build749 queue suppression/restore, CAS/idempotency, no customer or provider action.');
