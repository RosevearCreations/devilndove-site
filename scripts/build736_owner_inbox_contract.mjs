import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/recovery-inbox-pilot-736.js';
const origin='https://devilndove.com',url=origin+'/api/admin/recovery-inbox-pilot-736';
const admin={ddModuleAccess:{allowed:true,user:{user_id:8,email:'owner@example.invalid',role:'admin',is_active:1}}};
const headers={'Content-Type':'application/json',Origin:origin,'Sec-Fetch-Site':'same-origin'};
const req=(data,h=headers)=>new Request(url,{method:'POST',headers:h,body:JSON.stringify(data)});
const bad=await onRequestPost({request:req({action:'start',consent_confirmed:true,purpose:'OWNER_REGISTERED_INBOX_PILOT'}),env:{},data:{}});
assert.equal(bad.status,401);
const unauthorized=await onRequestGet({request:new Request(url),env:{},data:{}});
assert.equal(unauthorized.status,401);
const missing=await onRequestGet({request:new Request(url),env:{},data:admin});
assert.equal(missing.status,503);
const records=new Map();let sends=0,lastBody=null;
const db={prepare(sql){
 let values=[];
 return {bind(...args){values=args;return this;},
  async first(){
   if(sql.includes('FROM dnd_recovery_inbox_pilots_736')){
    if(sql.includes('WHERE pilot_id=?'))return records.get(values[0])||null;
    return Array.from(records.values()).filter(r=>r.admin_user_id===values[0])
     .sort((a,b)=>b.created_at.localeCompare(a.created_at))[0]||null;
   }
   throw Error('Unexpected original D1 query');
  },
  async run(){
   if(sql.startsWith('INSERT INTO dnd_recovery_inbox_pilots_736')){
    if(Array.from(records.values()).filter(r=>r.admin_user_id===values[1]).length>=2)return {meta:{changes:0}};
    records.set(values[0],{pilot_id:values[0],admin_user_id:values[1],
     recipient_sha256:values[2],code_sha256:values[3],created_at:'2026-11-18 12:00:00',
     expires_at:'2026-11-19 12:00:00',provider_accepted_at:null,provider_message_sha256:null,
     inbox_confirmed_at:null,invalidated_at:null,failed_attempts:0});
    return {meta:{changes:1}};
   }
   const r=records.get(values[sql.includes('WHERE pilot_id=?')?1:0]); // provider start uses values[1]
   if(sql.includes('SET invalidated_at=CURRENT_TIMESTAMP')){
    if(!r)return {meta:{changes:0}};r.invalidated_at='2026-11-18 12:00:00';return {meta:{changes:1}};
   }
   if(sql.includes('SET provider_accepted_at=CURRENT_TIMESTAMP')){
    if(!r)return {meta:{changes:0}};
    r.provider_accepted_at='2026-11-18 12:00:00';r.provider_message_sha256=values[0];
    return {meta:{changes:1}};
   }
   if(sql.includes('SET inbox_confirmed_at=CURRENT_TIMESTAMP')){
    const q=records.get(values[0]);
    if(!q||q.inbox_confirmed_at||q.code_sha256!==values[2]||!q.provider_accepted_at||q.failed_attempts>=5)
     return {meta:{changes:0}};
    q.inbox_confirmed_at='2026-11-18 12:05:00';return {meta:{changes:1}};
   }
   if(sql.includes('SET failed_attempts=failed_attempts+1')){
    const q=records.get(values[0]);
    if(!q||q.inbox_confirmed_at||q.failed_attempts>=5)return {meta:{changes:0}};
    q.failed_attempts++;return {meta:{changes:1}};
   }
   throw Error('Unexpected original D1 write');
  }
 };
}};
const env={DB:db,RESEND_API_KEY:'private-token-do-not-echo',NOTIFICATION_FROM_EMAIL:'support@example.invalid'};
const ctx=(request,extra={})=>({request,env,data:admin,...extra});
let response=await onRequestPost(ctx(req({action:'start',purpose:'OWNER_REGISTERED_INBOX_PILOT',consent_confirmed:false})));
assert.equal(response.status,403);assert.equal(sends,0);
response=await onRequestPost(ctx(req({action:'start',purpose:'OWNER_REGISTERED_INBOX_PILOT',consent_confirmed:true},
 {...headers,Origin:'https://attacker.invalid'})));
assert.equal(response.status,403);assert.equal(sends,0);
response=await onRequestGet(ctx(new Request(url)));
assert.equal(response.status,200);assert.equal(sends,0);
const origFetch=globalThis.fetch;
globalThis.fetch=async (input,options)=>{
 sends++;assert.equal(input,'https://api.resend.com/emails');
 assert.ok(options.headers['Idempotency-Key'].startsWith('dnd-owner-inbox-'));
 lastBody=JSON.parse(options.body);
 assert.deepEqual(lastBody.to,['owner@example.invalid']);
 assert.equal(lastBody.from,'support@example.invalid');
 return new Response(JSON.stringify({id:'12345678-1234-4234-8234-123456789012'}),{status:200,
  headers:{'Content-Type':'application/json'}});
};
try{
 response=await onRequestPost(ctx(req({action:'start',purpose:'OWNER_REGISTERED_INBOX_PILOT',consent_confirmed:true})));
 assert.equal(response.status,200);
 const started=await response.json();assert.equal(started.status,'PROVIDER_ACCEPTED_AWAITING_OWNER_INBOX_CODE');
 assert.equal(started.owner_inbox_code_confirmed,false);
 assert.equal(started.provider_delivered_webhook_verified,false);
 assert.equal(sends,1);
 const actualCode=lastBody.html.match(/<strong>([0-9A-F]{32})<\/strong>/)?.[1];
 assert.match(actualCode,/^[0-9A-F]{32}$/);
 assert.ok(!JSON.stringify(started).includes(actualCode));
 const id=started.original_pilot_id;
 assert.ok(!JSON.stringify([...records.values()]).includes(actualCode));
 response=await onRequestGet(ctx(new Request(url)));
 assert.equal((await response.json()).status,'AWAITING_OWNER_INBOX_CODE');
 response=await onRequestPost(ctx(req({action:'confirm',pilot_id:id,code:'A'.repeat(32)})));
 assert.equal(response.status,409);
 assert.equal(records.get(id).failed_attempts,1);
 response=await onRequestPost(ctx(req({action:'confirm',pilot_id:id,code:actualCode})));
 assert.equal(response.status,200);
 let verified=await response.json();
 assert.equal(verified.status,'ORIGINAL_OWNER_INBOX_CODE_CONFIRMED');
 assert.equal(verified.actual_customer_reset_delivery_verified,false);
 response=await onRequestPost(ctx(req({action:'confirm',pilot_id:id,code:actualCode})));
 assert.equal(response.status,409);
 response=await onRequestGet(ctx(new Request(url)));
 assert.equal((await response.json()).owner_inbox_code_confirmed,true);
 assert.equal(sends,1);
}finally{globalThis.fetch=origFetch;}
const source=readFileSync(new URL('../functions/api/admin/recovery-inbox-pilot-736.js',import.meta.url),'utf8');
for(const value of ['consent_confirmed','OWNER_REGISTERED_INBOX_PILOT','provider_accepted_at',
 'inbox_confirmed_at','failed_attempts<5','Idempotency-Key','newCode',
 'provider_delivered_webhook_verified:false','external_customer_inbox_verified:false'])
 assert.ok(source.includes(value),value);
const html=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/js/admin-production-variable-audit-v406.js',import.meta.url),'utf8');
for(const id of ['recovery736Consent','recovery736Start','recovery736Confirm','recovery736Code','recovery736Refresh'])
 assert.ok(html.includes(id)&&js.includes(id),id);
assert.ok(js.includes('window.confirm('));
console.log('BUILD736 PASS: no unauthenticated/cross-origin/test-without-consent sends; original owner mailbox only, provider != inbox, source hash and replay resistance');
