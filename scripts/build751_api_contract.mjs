// Build 751 exact original provider readback D1 + Resend mock only; zero real customer requests.
import assert from 'node:assert/strict';
import {onRequestGet,onRequestPost} from '../functions/api/admin/customer-care-sla-751.js';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const uuid=()=>crypto.randomUUID();
const task=uuid(),caseId=uuid(),incoming=uuid(),sent=uuid(),messageId='<sent-original@resend.example>';
const date=new Date().toISOString().slice(0,10);
const started=new Date(Date.now()-5*3600000).toISOString();
const sentAt=new Date(Date.now()-4*3600000).toISOString();
const receivedAt=new Date(Date.now()-3*3600000).toISOString();
const records=new Map(),queries=[];
records.set('site.admin.customerjourney.workqueue.v749',{is_public:0,setting_value:JSON.stringify({
 schema:749,version:2,receipts:[
 {id:uuid(),kind:'review_followup',subject_id:task,decision:'pass',actor_user_id:92},
 {id:task,kind:'task_open',order_id:17,case_id:caseId,case_type:'customer_support',
 actor_user_id:91,assignee_user_id:91,recorded_at:started,
 source_order_updated_at:'2026-11-22T21:00:00Z',source_case_version:1}]})});
records.set('site.admin.aftersale.v746.17',{is_public:0,setting_value:JSON.stringify({
 schema:746,version:1,receipts:[{receipt_id:caseId,source_order_id:17,
 case_type:'customer_support',stage:'received'}]})});
records.set('site.admin.customerjourney.carecustody.v750',{is_public:0,setting_value:JSON.stringify({
 schema:750,version:1,receipts:[{id:uuid(),kind:'archive_review',decision:'approve',
 task_id:task,retention_review_on:date}]})});
let drift=false,wrongFrom=false,wrongThread=false,badDmarc=false,fetches=0;
const db={prepare(sql){return{bind(...args){return{
 async first(){queries.push(sql);
  if(sql.includes('FROM orders'))return args[0]===17?{
   order_id:17,updated_at:drift?'2026-11-22T22:00:00Z':'2026-11-22T21:00:00Z',customer_email:'buyer@example.org'}:null;
  if(sql.includes('FROM notification_outbox'))return args[0]===17&&args[1]===sent&&args[2]==='buyer@example.org'?
   {notification_outbox_id:721,provider_message_id:sent,status:'sent'}:null;
  if(sql.includes('FROM app_settings'))return records.get(args[0])||null;
  throw Error('Unexpected SELECT '+sql);
 },
 async run(){queries.push(sql);
  if(sql.startsWith('INSERT INTO app_settings')){
   const[k,value]=args;if(records.has(k))return{meta:{changes:0}};
   records.set(k,{setting_value:value,is_public:0});return{meta:{changes:1}};
  }
  if(sql.startsWith('UPDATE app_settings')){
   const[value,admin,k,prior]=args,row=records.get(k);
   if(!row||row.setting_value!==prior||![91,92,93].includes(admin))return{meta:{changes:0}};
   records.set(k,{setting_value:value,is_public:0});return{meta:{changes:1}};
  }
  if(sql.includes('admin_action_audit'))return{meta:{changes:1}};
  throw Error('Unexpected write '+sql);
 }
 };}};}};
const savedFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
 fetches++;assert.equal(options.method,'GET');assert.equal(options.redirect,'error');
 assert.equal(options.headers.Authorization,'Bearer mocked-private-key');
 let value;
 if(url==='https://api.resend.com/emails/receiving/'+incoming){
  value={id:incoming,from:wrongFrom?'intruder@example.net':'Buyer <buyer@example.org>',
   to:['inbound@devilndove.com'],message_id:'<received@resend.example>',
   headers:{'in-reply-to':wrongThread?'<unrelated@resend.example>':messageId},
   authentication:{dmarc:badDmarc?'fail':'pass'},created_at:receivedAt,
   text:'NEVER_STORE_RAW_PRIVATE_CUSTOMER_EMAIL'};
 }else if(url==='https://api.resend.com/emails/'+sent){
  value={id:sent,from:'Support <support@devilndove.com>',to:['buyer@example.org'],
   message_id:messageId,created_at:sentAt,html:'NEVER_STORE_RAW_SENT_EMAIL'};
 }else throw Error('Unexpected network URL '+url);
 return new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}});
};
const url='https://devilndove.com/api/admin/customer-care-sla-751';
function context(method,payload=null,admin=91,extra={},origin='https://devilndove.com',qs=''){
 const options={method,headers:method==='POST'?{'Content-Type':'application/json',Origin:origin}:{},
  ...(method==='POST'?{body:JSON.stringify(payload)}:{})};
 return{request:new Request(url+qs,options),
  data:{ddModuleAccess:{allowed:true,user:{user_id:admin,role:admin===999?'customer':'admin',is_active:1}}},
  env:{DB:db,RESEND_API_KEY:'mocked-private-key',CARE_INBOUND_EMAIL_751:'inbound@devilndove.com',...extra}};
}
async function call(method,payload=null,admin=91,extra={},origin='https://devilndove.com',qs=''){
 const res=await(method==='POST'?onRequestPost(context(method,payload,admin,extra,origin,qs)):
  onRequestGet(context(method,payload,admin,extra,origin,qs)));
 return{status:res.status,j:await res.json()};
}
const decisions={provider_readback:'readback',provider_review:'pass',sla_close:'close',
 sla_reopen:'reopen',retention_plan:'propose',retention_review:'approve',retention_check:'reviewed'};
const input=(kind,v,additional={})=>({kind,decision:decisions[kind],task_id:task,
 expected_version:v,request_key:uuid(),source_reference:'original-real-provider-test-fixture-751',
 note:'Synthetic read-only source evidence for exact original receipt regression testing.',...additional});
try{
 assert.equal(moduleKeyForPath('/api/admin/customer-care-sla-751'),MODULE_KEYS.STOREFRONT);
 assert.equal((await call('GET',null,999)).status,403);
 assert.equal((await call('POST',input('provider_readback',0),999)).status,403);
 assert.equal((await call('POST',input('provider_readback',0),91,{},'https://evil.example')).status,403);
 assert.equal((await call('GET',null,91,{},'https://devilndove.com','?task_id=invalid')).status,400);
 let x=await call('GET');assert.equal(x.status,200);
 assert.equal(x.j.summary.tasks,1);assert.equal(fetches,0,'Page GET never contacts Resend');
 assert.equal(records.size,3,'Page GET never creates private journal');
 const payload=input('provider_readback',0,{inbound_id:incoming,outbound_id:sent,owner_clicked_readback:true});
 assert.equal((await call('POST',payload,91,{CARE_INBOUND_EMAIL_751:''})).status,409);
 assert.equal(fetches,0);
 wrongFrom=true;assert.equal((await call('POST',payload)).status,409);wrongFrom=false;
 badDmarc=true;assert.equal((await call('POST',payload)).status,409);badDmarc=false;
 wrongThread=true;assert.equal((await call('POST',payload)).status,409);wrongThread=false;
 x=await call('POST',payload);assert.equal(x.status,200,JSON.stringify(x.j));
 const providerId=x.j.receipt.id;assert.equal(x.j.receipt.received_email_id,incoming);
 assert.equal((await call('POST',payload)).j.replayed,true);
 assert.equal((await call('POST',{...payload,note:'This is a changed original private evidence replay.'})).status,409);
 assert.equal((await call('POST',input('provider_review',1,{subject_id:providerId}),91)).status,403);
 x=await call('POST',input('provider_review',1,{subject_id:providerId}),92);
 assert.equal(x.status,200,JSON.stringify(x.j));
 let report=await call('GET',null,91,{},'https://devilndove.com','?task_id='+task);
 assert.equal(report.j.selected.independently_reviewed_provider_thread,true);
 assert.equal(report.j.selected.reply_sla,'WITHIN_TARGET');
 assert.equal(report.j.selected.first_reply_minutes,120);
 assert.equal(report.j.selected.provider_cannot_verify_human_identity,true);
 assert.equal((await call('POST',input('sla_close',2),91)).status,409);
 x=await call('POST',input('sla_close',2),93);
 assert.equal(x.status,200,JSON.stringify(x.j));const closure=x.j.receipt.id;
 const proposal=input('retention_plan',3,{review_on:date});
 x=await call('POST',proposal);assert.equal(x.status,200,JSON.stringify(x.j));
 const planId=x.j.receipt.id;
 assert.equal((await call('POST',input('retention_review',4,{subject_id:planId}),91)).status,403);
 x=await call('POST',input('retention_review',4,{subject_id:planId}),92);
 assert.equal(x.status,200,JSON.stringify(x.j));
 report=await call('GET',null,91,{},'https://devilndove.com','?view=due');
 assert.equal(report.j.rows.length,1);
 x=await call('POST',input('retention_check',5,{subject_id:planId}));
 assert.equal(x.status,200,JSON.stringify(x.j));
 x=await call('POST',input('sla_reopen',6,{subject_id:closure}));
 assert.equal(x.status,200);
 drift=true;
 assert.equal((await call('POST',input('provider_readback',7,{inbound_id:uuid(),outbound_id:sent,owner_clicked_readback:true}))).status,409);
 const stored=JSON.stringify(records.get('site.admin.customerjourney.provider-sla.v751'));
 assert.ok(!stored.includes('NEVER_STORE_RAW_PRIVATE_CUSTOMER_EMAIL'));
 assert.ok(!stored.includes('NEVER_STORE_RAW_SENT_EMAIL'));
 assert.ok(!stored.includes('mocked-private-key'));
 assert.equal(JSON.parse(records.get('site.admin.customerjourney.provider-sla.v751').setting_value).receipts.length,7);
 assert.ok(queries.every(x=>!/^(?:UPDATE|INSERT|DELETE)\s+(?:orders|notification_outbox|payments|inventory|users|sessions|payment_refunds)\b/i.test(x.trim())));
 console.log('BUILD751 PROVIDER CONTRACT PASS: original Order/outbox, Resend GET-only inbound/outbound, DMARC/thread/source HOLD, second Admin live reread, SLA 48/72h, reviewed manual retention due, no raw content/provider writes.');
}finally{globalThis.fetch=savedFetch;}
