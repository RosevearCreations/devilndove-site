// Build 749 source-bound fake D1 contract. No production or live customer writes.
import assert from 'node:assert/strict';
import {onRequestGet,onRequestPost} from '../functions/api/admin/customer-care-queue-749.js';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const records=new Map(),queries=[];
const caseId=crypto.randomUUID(),firefoxId=crypto.randomUUID(),firefoxReviewId=crypto.randomUUID();
let caseVersion=1,orderUpdated='2026-11-22T16:00:00Z';
records.set('site.admin.aftersale.v746.17',{is_public:0,setting_value:JSON.stringify({
 schema:746,version:caseVersion,receipts:[{receipt_id:caseId,source_order_id:17,
  case_type:'return_request',stage:'received',owner_user_id:91,
  recorded_at:'2026-11-22T15:00:00Z'}]})});
const firefoxDoc=()=>({schema:748,version:2,receipts:[
 {id:firefoxReviewId,kind:'review_firefox',subject_id:firefoxId,decision:'pass',actor_user_id:92},
 {id:firefoxId,kind:'firefox_observation',decision:'observed',static_pass:7,static_hold:0,
  client_reported_firefox:true,actor_user_id:91}
]});
records.set('site.admin.customerjourney.v748',{is_public:0,setting_value:JSON.stringify(firefoxDoc())});
const db={prepare(sql){return{bind(...args){return{
 async first(){
  queries.push(sql);
  if(sql.includes('FROM orders'))return args[0]===17?{order_id:17,updated_at:orderUpdated}:null;
  if(sql.includes('FROM users'))return [91,92,93].includes(args[0])?{user_id:args[0]}:null;
  if(sql.includes('FROM app_settings'))return records.get(args[0])||null;
  throw Error('Unreviewed SELECT SQL '+sql);
 },
 async run(){
  queries.push(sql);
  if(sql.startsWith('INSERT INTO app_settings')){
   const[k,value]=args;if(records.has(k))return{meta:{changes:0}};
   records.set(k,{setting_value:value,is_public:0});return{meta:{changes:1}};
  }
  if(sql.startsWith('UPDATE app_settings')){
   const[value,user,k,previous]=args;const row=records.get(k);
   if(!row||row.setting_value!==previous||![91,92,93].includes(user))return{meta:{changes:0}};
   records.set(k,{setting_value:value,is_public:0});return{meta:{changes:1}};
  }
  if(sql.includes('admin_action_audit'))return{meta:{changes:1}};
  throw Error('Unexpected mutation SQL '+sql);
 }
 };}};}};
const URL='https://devilndove.com/api/admin/customer-care-queue-749';
function ctx(method,body=null,actor=91,origin='https://devilndove.com',query=''){
 return{request:new Request(URL+query,{
  method,headers:method==='POST'?{'Origin':origin,'Content-Type':'application/json','User-Agent':'Mozilla/5.0 (Windows NT 10.0; rv:160.0) Gecko/20100101 Firefox/160.0'}:{},
  ...(method==='POST'?{body:JSON.stringify(body)}:{})}),env:{DB:db},
  data:{ddModuleAccess:{allowed:true,user:{user_id:actor,role:actor===999?'member':'admin',is_active:1}}}};
}
async function call(method,body=null,actor=91,origin='https://devilndove.com',query=''){
 const res=await(method==='POST'?onRequestPost(ctx(method,body,actor,origin,query)):onRequestGet(ctx(method,body,actor,origin,query)));
 return{status:res.status,json:await res.json()};
}
function input(kind,version,extra={}){
 const decisions={owner_ack_firefox:'acknowledged',task_open:'open',task_assign:'assign',
  task_progress:'attempted',review_followup:'pass',task_reopen:'reopen'};
 return{kind,decision:decisions[kind],expected_version:version,request_key:crypto.randomUUID(),
  source_reference:'real-original-source-document-20261122',
  note:'Original internal task progress supported by a specific nonpersonal record.',...extra};
}
function day(offset){
 const d=new Date(Date.now()+offset*86400000);
 return d.toISOString().slice(0,10);
}
assert.equal(moduleKeyForPath('/api/admin/customer-care-queue-749'),MODULE_KEYS.STOREFRONT);
assert.equal((await call('GET',null,999)).status,403);
assert.equal((await call('POST',input('task_open',0),999)).status,403);
assert.equal((await call('GET',null,91,'https://devilndove.com','?order_id=bad')).status,400);
let state=await call('GET');assert.equal(state.status,200);
assert.equal(state.json.viewer_admin_user_id,91);
assert.equal(state.json.queue.total,0);
assert.equal(state.json.firefox.state,'HOLD_OWNER_ACKNOWLEDGMENT_REQUIRED');
assert.equal(records.size,2,'GET must not create private queue row');
assert.equal((await call('POST',input('task_open',0),91,'https://bad.example')).status,403);
const ack=input('owner_ack_firefox',0,{observation_id:firefoxId,review_id:firefoxReviewId,
 owner_clicked_confirmation:true,browser_family:'firefox'});
assert.equal((await call('POST',ack,92)).status,403,'Original observer alone may acknowledge');
let x=await call('POST',ack,91);
assert.equal(x.status,200,JSON.stringify(x.json));
const ackId=x.json.receipt.id;
assert.equal(x.json.refund_executed,false);
assert.equal((await call('POST',ack,91)).json.replayed,true,'Exact original request idempotency');
assert.equal((await call('POST',{...ack,source_reference:'a different original Firefox evidence file'})).status,409);
state=await call('GET');assert.equal(state.json.firefox.state,'OWNER_ACKNOWLEDGED_REVIEWED_FIREFOX_EVIDENCE');
assert.equal(state.json.firefox.independently_verified_physical_device,false);
const fakeObs=crypto.randomUUID();
assert.equal((await call('POST',input('owner_ack_firefox',1,{observation_id:fakeObs,review_id:firefoxReviewId,
 owner_clicked_confirmation:true}))).status,409,'Cannot invent Firefox source');
const badAssignee=await call('POST',input('task_open',1,{order_id:17,case_id:caseId,
 assignee_user_id:777,priority:'urgent',due_date:day(2)}));
assert.equal(badAssignee.status,409,'Assignee must be an existing active Admin');
const invalidOrder=await call('POST',input('task_open',1,{order_id:999,case_id:caseId,
 assignee_user_id:91,priority:'normal',due_date:day(1)}));
assert.equal(invalidOrder.status,404);
const invalidCase=await call('POST',input('task_open',1,{order_id:17,case_id:crypto.randomUUID(),
 assignee_user_id:91,priority:'normal',due_date:day(1)}));
assert.equal(invalidCase.status,409);
const invalidDate=await call('POST',input('task_open',1,{order_id:17,case_id:caseId,
 assignee_user_id:91,priority:'normal',due_date:'2026-02-30'}));
assert.equal(invalidDate.status,400);
const open=input('task_open',1,{order_id:17,case_id:caseId,assignee_user_id:91,
 priority:'urgent',due_date:day(-1)});
x=await call('POST',open);assert.equal(x.status,200,JSON.stringify(x.json));
const taskId=x.json.receipt.id;
state=await call('GET');
assert.equal(state.json.queue.total,1);
assert.equal(state.json.queue.overdue,1);
assert.equal(state.json.queue.tasks[0].state,'OPEN_SOURCE_UNRECHECKED');
assert.equal(state.json.queue.tasks[0].assignee_user_id,91);
const selected=await call('GET',null,91,'https://devilndove.com','?task_id='+taskId);
assert.equal(selected.json.selected_task.source_check,'ORIGINAL_ORDER_CASE_CURRENT');
assert.equal(selected.json.selected_task.state,'OPEN_SOURCE_UNRECHECKED');
assert.equal((await call('POST',input('task_open',2,{order_id:17,case_id:caseId,
 assignee_user_id:91,priority:'normal',due_date:day(1)}))).status,409,'No duplicate source task');
assert.equal((await call('POST',input('task_assign',2,{subject_id:taskId,
 assignee_user_id:777}))).status,409,'Cannot assign nonexistent Admin');
const transfer=input('task_assign',2,{subject_id:taskId,assignee_user_id:93});
x=await call('POST',transfer,91);assert.equal(x.status,200);
assert.equal((await call('POST',input('task_progress',3,{subject_id:taskId}),91)).status,403,
 'Previous assignee cannot masquerade as current assignee');
x=await call('POST',input('task_progress',3,{subject_id:taskId,decision:'attempted',due_date:day(1)}),93);
assert.equal(x.status,200,JSON.stringify(x.json));
state=await call('GET');
assert.equal(state.json.queue.overdue,0);
assert.equal(state.json.queue.due_soon,1);
assert.equal(state.json.queue.tasks[0].assignee_user_id,93);
x=await call('POST',input('task_progress',4,{subject_id:taskId,decision:'ready_review'}),93);
assert.equal(x.status,200);
x=await call('POST',input('review_followup',5,{subject_id:taskId}),91);
assert.equal(x.status,403,'Opening Admin cannot approve follow-up');
x=await call('POST',input('review_followup',5,{subject_id:taskId}),93);
assert.equal(x.status,403,'Progress author cannot approve follow-up');
x=await call('POST',input('review_followup',5,{subject_id:taskId}),92);
assert.equal(x.status,200,JSON.stringify(x.json));
assert.equal(x.json.independent_external_customer_reply,false);
state=await call('GET');
assert.equal(state.json.queue.tasks[0].state,'INTERNAL_FOLLOWUP_REVIEW_RECORDED_SOURCE_UNRECHECKED');
assert.equal(state.json.queue.tasks[0].overdue,false);
let audit=await call('GET',null,91,'https://devilndove.com','?task_id='+taskId);
assert.equal(audit.json.selected_task.source_check,'ORIGINAL_ORDER_CASE_CURRENT');
assert.equal(audit.json.selected_task.external_customer_action_confirmed,false);
orderUpdated='2026-11-22T17:00:00Z';
audit=await call('GET',null,91,'https://devilndove.com','?task_id='+taskId);
assert.equal(audit.json.selected_task.state,'HOLD_SOURCE_CHANGED');
assert.equal((await call('POST',input('task_reopen',6,{subject_id:taskId}),91)).status,409,
 'Changing original Order must hold further task work');
orderUpdated='2026-11-22T16:00:00Z';
x=await call('POST',input('task_reopen',6,{subject_id:taskId}),91);
assert.equal(x.status,200,JSON.stringify(x.json));
state=await call('GET');
assert.equal(state.json.queue.tasks[0].state,'REOPENED_FOLLOWUP_REQUIRED');
assert.equal((await call('POST',input('review_followup',7,{subject_id:taskId}),92)).status,409,
 'Reopened work requires a new ready-for-review progress receipt');
assert.equal((await call('POST',input('task_progress',6,{subject_id:taskId}),93)).status,409,
 'Out-of-date version cannot create a new receipt');
assert.equal(records.get('site.admin.customerjourney.workqueue.v749').is_public,0);
assert.ok(queries.every(q=>!/^(?:UPDATE|INSERT|DELETE)\s+(?:orders|payments|payment_refunds|inventory|products|users|sessions|accounting_entries)\b/i.test(q.trim())),
 'No original sale/customer/provider mutation');
console.log('BUILD749 PRIVATE QUEUE PASS: real Order+Build746 source, verified admin assignee, Firefox 748 independent original owner ACK, no self-review, bounded due/overdue, reassignment, progress, second-Admin follow-up, read-time source drift HOLD, reopen, CAS and exact replay. NO external customer/financial action.');
