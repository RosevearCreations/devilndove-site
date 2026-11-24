// Build 756 — current-release human renewal and HttpOnly Users recovery source contract.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectContinuity756,renewalStatus756} from '../functions/api/admin/customer-care-retention-ops-752.js';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const api=read('functions/api/admin/customer-care-retention-ops-752.js');
const client=read('public/js/admin-customer-care-sla-751.js');
const acceptance=read('admin/storefront-acceptance/index.html');
const users=read('admin/users/index.html');
const directory=read('public/js/admin-users.js');
const auth=read('public/js/site-auth-ui.js');
assert.equal(moduleKeyForPath('/api/admin/customer-care-retention-ops-752'),MODULE_KEYS.STOREFRONT);
for(const id of ['a756Workflow','a756Load','a756Inspect','a756Rows','a756Status','a756Summary',
 'a756Selected','a756Task','a756Code','a756Previous','a756Current','a756Digest',
 'a756Subject','a756Note','a756Open','a756Confirm'])
 assert.ok(acceptance.includes('id="'+id+'"'),id);
assert.ok(acceptance.includes('admin-customer-care-sla-751.js?v=751-752-753-754-755-756'));
assert.ok(client.includes("credentials:'same-origin'")&&client.includes("cache:'no-store'"));
assert.ok(!client.includes('innerHTML')&&!client.includes('localStorage'));
assert.ok(users.includes('id="usersRecoveryStatus"'));
assert.ok(users.includes('Sign in again'));
assert.ok(users.includes('admin-users.js?v=756')&&users.includes('site-auth-ui.js?v=756'));
assert.ok(auth.includes('usersCookieRecovery'));
assert.ok(auth.includes('if (!window.DDAuth.isLoggedIn() && !usersCookieRecovery)'));
assert.ok(directory.includes('AbortController'));
assert.ok(directory.includes('12000'));
assert.ok(directory.includes('usersRecoveryStatus'));
assert.ok(!directory.includes('if (!mountEl || !window.DDAuth || !window.DDAuth.isLoggedIn()) return'));
for(const p of ['public/js/admin-create-user.js','public/js/admin-user-update.js',
 'public/js/admin-reset-password.js','public/js/admin-delete-user.js',
 'public/js/admin-cleanup-sessions.js','public/js/admin-security-summary.js',
 'public/js/admin-user-profiles.js']){
 const s=read(p);
 assert.ok(!s.includes('!window.DDAuth || !window.DDAuth.isLoggedIn()'),p);
}
for(const marker of ['site.admin.customerjourney.audit-continuity.v756',
 'ORIGINAL_CROSS_RELEASE_SOURCE_HOLD','CURRENT_RELEASE_SOURCE_DRIFT',
 'INDEPENDENT_CURRENT_ADMIN_REQUIRED','CONTINUITY_DIGEST_CHANGED',
 'CURRENT_RELEASE_CERTIFICATE_RENEWED','ORIGINAL_755_CERTIFICATE_NOT_FOUND',
 'no_provider_write:true','no_purge:true'])
 assert.ok(api.includes(marker),marker);
assert.ok(!api.includes('DELETE FROM')&&!api.includes('setInterval('));
const task='16b147a8-d11f-47e9-8fb5-c0fbc3949de0',code='RETENTION_REVIEW_ESCALATION',
 oldSha='a'.repeat(40),newSha='b'.repeat(40),oldDigest='c'.repeat(64),nowDigest='d'.repeat(64);
const report={acceptance:{result:'ORIGINAL_PRODUCTION_FIELD_SOURCE_VERIFIED'},
 original:{production_field_source_accepted:true,order_case_revision_current:true,
 task_id:task,exception_code:code},source:{production_main_sha:oldSha}};
const pair={first:{id:'a1',actor_user_id:1,source_sha:oldSha,snapshot_sha256:oldDigest},
 second:{id:'a2',actor_user_id:2,source_sha:oldSha,snapshot_sha256:oldDigest}};
const marker={ok:true,source_sha:newSha},versions={work:1,custody:2,sla:3,retention_ops:4,
 exceptions:5,witnesses:6,audits:7};
const checked={report,priorDigest:oldDigest,pair,accepted:true,digest:nowDigest,sourceVersions:versions};
let result=renewalStatus756(checked,{receipts:[]},task,code,marker);
assert.equal(result.status,'AWAITING_FIRST_RENEWAL_ADMIN');
assert.equal(result.certificate_renewed,false);
assert.equal(result.prior_valid,true);
const first={id:'n1',kind:'continuity_open',task_id:task,exception_code:code,
 actor_user_id:3,source_sha:newSha,previous_sha:oldSha,snapshot_sha256:nowDigest,source_versions:versions};
result=renewalStatus756(checked,{receipts:[first]},task,code,marker);
assert.equal(result.status,'AWAITING_SECOND_RENEWAL_ADMIN');
const second={id:'n2',kind:'continuity_confirm',subject_id:'n1',actor_user_id:4,
 source_sha:newSha,previous_sha:oldSha,snapshot_sha256:nowDigest,source_versions:versions};
result=renewalStatus756(checked,{receipts:[second,first]},task,code,marker);
assert.equal(result.status,'CURRENT_RELEASE_CERTIFICATE_RENEWED');
assert.equal(result.certificate_renewed,true);
assert.equal(renewalStatus756(checked,{receipts:[{...second,actor_user_id:3},first]},task,code,marker).certificate_renewed,false);
assert.equal(renewalStatus756(checked,{receipts:[{...second,source_sha:oldSha},first]},task,code,marker).certificate_renewed,false);
assert.equal(renewalStatus756(checked,{receipts:[{...second,snapshot_sha256:'f'.repeat(64)},first]},task,code,marker).certificate_renewed,false);
assert.equal(renewalStatus756(checked,{receipts:[{...second,source_versions:{...versions,sla:9}},first]},task,code,marker).certificate_renewed,false);
assert.equal(renewalStatus756({...checked,accepted:false},{receipts:[second,first]},task,code,marker).certificate_renewed,false);
assert.equal(inspectContinuity756(report,oldDigest,{...pair,second:{...pair.second,actor_user_id:1}},
 marker,{receipts:[]},task,code).prior_valid,false);
assert.equal(inspectContinuity756(report,oldDigest,pair,{ok:true,source_sha:oldSha},
 {receipts:[]},task,code).source_current,false);
assert.equal(inspectContinuity756({...report,original:{...report.original,order_case_revision_current:false}},
 oldDigest,pair,marker,{receipts:[]},task,code).prior_valid,false);
console.log('BUILD756 PASS: Users HttpOnly-only auth startup, timeout-visible recovery, old 755 receipt source reconstruction, distinct current Admins, new SHA & digest drift refusals.');
