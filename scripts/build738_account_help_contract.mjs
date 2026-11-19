import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/account-help-review-738.js';
import {moduleKeyForPath} from '../functions/api/_lib/appModuleRoutes.js';
import {onRequestPost as publicPost} from '../functions/api/auth/account-help-request.js';
const root='https://devilndove.com',adminUrl=root+'/api/admin/account-help-review-738';
assert.equal(moduleKeyForPath('/api/admin/account-help-review-738'),'it-platform','Review API must receive verified Admin middleware access');
const publicUrl=root+'/api/auth/account-help-request';
const user={ddModuleAccess:{allowed:true,user:{user_id:7,role:'admin',is_active:1,email:'owner@example.invalid'}}};
const headers={'Content-Type':'application/json',Origin:root,'Sec-Fetch-Site':'same-origin'};
const post=(url,body,h=headers)=>new Request(url,{method:'POST',headers:h,body:JSON.stringify(body)});
assert.equal((await onRequestGet({request:new Request(adminUrl),env:{},data:{}})).status,401);
assert.equal((await onRequestGet({request:new Request(adminUrl),env:{},data:user})).status,503);
assert.equal((await onRequestPost({request:post(adminUrl,{action:'mark_reviewed',case_id:1,owner_review_confirmed:true,reason_code:'REVIEWED'}),env:{},data:{}})).status,401);
assert.equal((await onRequestPost({request:post(adminUrl,{action:'mark_reviewed',case_id:1,owner_review_confirmed:true,reason_code:'REVIEWED'},
 {...headers,Origin:'https://untrusted.invalid'}),env:{DB:{}},data:user})).status,403);
const records=[{auth_recovery_request_id:12,request_type:'forgot_email',contact_email:'private@customer.invalid',
 possible_email:'other@customer.invalid',display_name:'Test User',note:'Need help',
 status:'open',created_at:'2026-11-18 10:00:00',updated_at:'2026-11-18 10:00:00'}];
let sqls=[];
const db={prepare(sql){
 sqls.push(sql);let args=[];return {bind(...values){args=values;return this;},
 async all(){
  if(sql.includes('COUNT(*) AS total'))return {results:[{status:'open',total:1}]};
  if(sql.includes('FROM auth_recovery_requests'))return {results:records.filter(x=>x.status===args[0])};
  throw Error('Unexpected SELECT');
 },
 async first(){
  if(sql.includes('FROM auth_recovery_requests'))return records.find(x=>x.auth_recovery_request_id===args[0])||null;
  throw Error('Unexpected SELECT');
 }};},
 async batch(statements){assert.equal(statements.length,2);return [{meta:{changes:1}},{meta:{changes:1}}];}};
const ctx=request=>({request,env:{DB:db},data:user});
let res=await onRequestGet(ctx(new Request(adminUrl+'?status=open&limit=200')));
assert.equal(res.status,200);let body=await res.json();
assert.equal(body.limit,25);assert.equal(body.cases[0].contact_masked,'p***@customer.invalid');
assert.ok(!JSON.stringify(body).includes('private@customer.invalid'));
res=await onRequestGet(ctx(new Request(adminUrl+'?id=12')));
body=await res.json();assert.equal(body.case.contact_email,'private@customer.invalid');
assert.equal(body.registered_account_matched,false);
res=await onRequestPost(ctx(post(adminUrl,{action:'mark_reviewed',case_id:12,
 owner_review_confirmed:true,reason_code:'SOURCE_REVIEWED'})));
assert.equal(res.status,200);body=await res.json();
assert.equal(body.account_identity_verified,false);
assert.equal(body.alternate_email_credential_delivery,false);
assert.equal(body.original_audit_recorded,true);
assert.ok(sqls.some(s=>s.includes('WHERE changes()=1')));
assert.ok(!sqls.some(s=>s.includes('JOIN users')||s.includes('DELETE FROM users')));
for(const bad of [
 {action:'mark_reviewed',case_id:12,owner_review_confirmed:false,reason_code:'REVIEWED'},
 {action:'send_alternate_password',case_id:12,owner_review_confirmed:true,reason_code:'REVIEWED'},
 {action:'close_request',case_id:0,owner_review_confirmed:true,reason_code:'REVIEWED'}
]){
 assert.equal((await onRequestPost(ctx(post(adminUrl,bad)))).status,400);
}
const unknown=await publicPost({request:post(publicUrl,{request_type:'forgot_email',contact_email:'public@customer.invalid'}),env:{}});
assert.equal(unknown.status,503,'Original DB absence must not falsely accept a request');
assert.equal((await publicPost({request:post(publicUrl,{request_type:'forgot_email',contact_email:'public@customer.invalid'},
 {...headers,Origin:'https://untrusted.invalid'}),env:{}})).status,403);
assert.equal((await publicPost({request:post(publicUrl,{request_type:'forgot_password',contact_email:'public@customer.invalid'}),env:{}})).status,400);
const source=readFileSync(new URL('../functions/api/auth/account-help-request.js',import.meta.url),'utf8');
const back=readFileSync(new URL('../functions/api/admin/account-help-review-738.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../admin/account-help-review/index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/js/admin-account-help-review-738.js',import.meta.url),'utf8');
const nav=readFileSync(new URL('../data/admin-navigation-modules.json',import.meta.url),'utf8');
for(const s of ['dd738Refresh','dd738Status','dd738MarkReviewed','dd738Close','dd738Confirm'])
 assert.ok(html.includes(s)&&js.includes(s),s);
assert.ok(nav.includes('/admin/account-help-review/'));
assert.ok(!source.includes('queuePublicNotification')&&!source.includes('processNotificationOutbox'));
assert.ok(source.includes("request.headers.get('CF-Connecting-IP')"));
assert.ok(source.includes('INSERT INTO auth_recovery_requests'));
assert.ok(back.includes('verifiedAdminFromModule')&&back.includes('admin_action_audit'));
console.log('BUILD738 PASS: private masked queue, selected-case staff access, manual non-sending decisions, no alternate credential, CSRF and DB HOLD');
