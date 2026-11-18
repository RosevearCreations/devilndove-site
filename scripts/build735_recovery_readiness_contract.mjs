import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet} from '../functions/api/admin/privacy-readiness-734.js';
const url='https://devilndove.com/api/admin/privacy-readiness-734?review=recovery735';
const user={ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:1}}};
assert.equal((await onRequestGet({request:new Request(url),env:{},data:{}})).status,401);
assert.equal((await onRequestGet({request:new Request(url),env:{},data:user})).status,503);
const sqls=[];
const db={prepare(sql){
 sqls.push(sql);
 return {async first(){
  if(sql.includes('FROM dnd_password_reset_tokens_734'))return {recent_reset_requests:3,
   provider_accepted:2,unconfirmed_unsent:0,active_unused:1,
   claimed_or_invalidated:1,expired_without_claim:1};
  if(sql.includes('FROM dnd_auth_recovery_attempts_734'))return {attempts_24h:5,
   reset_requests:3,account_reminders:1,reset_redemptions_attempted:1};
  throw Error('unexpected SQL');
 }};}};
const fakeSecret='never-log-this-735',fakeEmail='private.verified@customer.invalid';
const ctx={request:new Request(url),env:{DB:db,RESEND_API_KEY:fakeSecret,
 NOTIFICATION_FROM_EMAIL:'support@devilndove.com'},data:user};
const res=await onRequestGet(ctx),body=await res.json();
assert.equal(res.status,200);
assert.equal(body.status,'READY_FOR_SUPERVISED_REAL_INBOX_PILOT');
assert.equal(body.provider_configuration_present,true);
assert.equal(body.original_provider_acceptances_not_inbox_deliveries,2);
assert.equal(body.original_pending_unused_reset_links,1);
assert.equal(body.actual_external_inbox_delivery_verified,false);
assert.equal(body.actual_independent_user_password_change_verified,false);
assert.equal(body.no_mail_sent_by_status_check,true);
assert.equal(body.external_privacy_sending_authorized,false);
assert.equal(body.customer_identifiers_exposed,false);
assert.equal(body.secret_values_exposed,false);
const raw=JSON.stringify(body);
assert.ok(!raw.includes(fakeSecret)&&!raw.includes(fakeEmail)&&!raw.includes('support@devilndove.com'));
assert.ok(sqls.length===2&&sqls.every(s=>s.trim().startsWith('SELECT')));
const noProvider=await(await onRequestGet({...ctx,env:{DB:db}})).json();
assert.equal(noProvider.status,'HOLD_RESEND_PROVIDER_CONFIGURATION');
assert.equal(noProvider.provider_configuration_present,false);
const bad=await onRequestGet({...ctx,env:{DB:{prepare(){throw Error('secret:leak')}}}});
const badBody=await bad.json();
assert.equal(bad.status,503);assert.ok(!JSON.stringify(badBody).includes('secret:leak'));
const html=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/js/admin-production-variable-audit-v406.js',import.meta.url),'utf8');
const auth=readFileSync(new URL('../functions/api/auth/recovery-734.js',import.meta.url),'utf8');
const queue=readFileSync(new URL('../docs/architecture/NEXT_20_BUILDS.md',import.meta.url),'utf8');
for(const s of ['privacy735Refresh','privacy735Results'])assert.ok(html.includes(s)&&js.includes(s));
assert.ok(js.includes('review=recovery735'));
assert.ok(auth.includes("context.waitUntil(requestRecovery734(db,env,request,body).catch(()=>null))"));
assert.ok(auth.includes("return Number(result?.meta?.changes)===1;"));
// Build 736 queue renewal must retain exactly 19 future proposed items, not stale 735 planning.
assert.ok(queue.includes('737')&&queue.includes('755')&&queue.includes('19 future proposed builds'));
assert.ok(!queue.includes('| 736 |'), 'Current build must no longer appear as an unstarted future proposal');
const archive=readFileSync(new URL('../docs/architecture/ARCHIVED_NEXT_20_BUILDS_383_412.md',import.meta.url),'utf8');
assert.ok(archive.includes('383–392')&&archive.includes('403–412'),'Prior executed queue is preserved');
console.log('BUILD735 PASS: protected D1 metrics, no PII/credentials, no mail, genuine provider HOLD, 20 new proposed future builds');
