// Build 757 — verified admin recovery and independent cross-release witness regression.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renewalStatus756} from '../functions/api/admin/customer-care-retention-ops-752.js';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const auth=read('public/js/site-auth-ui.js');
const users=read('public/js/admin-users.js');
const html=read('admin/users/index.html');
const original=read('functions/api/admin/customer-care-retention-ops-752.js');
assert.match(auth,/const usersCookieRecovery/);
assert.match(auth,/if \(status === 401 \|\| status === 403\)/);
assert.ok(!auth.includes('status === 401 || status === 403 || !window.DDAuth.isLoggedIn()'),
  'network failure must not clear valid HttpOnly cookie session');
assert.ok(users.includes('event.detail.verified !== true'), 'provisional admin must not fetch directory');
assert.ok(users.includes('event.detail.degraded === true'), 'degraded auth must not fetch directory');
assert.ok(users.includes('initialState?.verified === true'), 'initial read requires verified session');
assert.ok(!users.includes('if (window.DDAuth.isLoggedIn()) { renderUi(); loadUsers(); }'));
assert.match(users,/new AbortController\(\)/);
assert.match(users,/12000/);
assert.ok(html.includes('usersRecoveryStatus'));
assert.ok(original.includes('CONTINUITY_DIGEST_CHANGED'));
assert.ok(original.includes('INDEPENDENT_CURRENT_ADMIN_REQUIRED'));
const task='16b147a8-d11f-47e9-8fb5-c0fbc3949de0';
const code='RETENTION_REVIEW_ESCALATION',oldSha='a'.repeat(40),sha='b'.repeat(40);
const oldDigest='c'.repeat(64),digest='d'.repeat(64);
const versions={work:1,custody:2,sla:3,retention_ops:4,exceptions:5,witnesses:6,audits:7};
const report={acceptance:{result:'ORIGINAL_PRODUCTION_FIELD_SOURCE_VERIFIED'},
 original:{production_field_source_accepted:true,order_case_revision_current:true,task_id:task,exception_code:code},
 source:{production_main_sha:oldSha}};
const pair={first:{id:'a1',actor_user_id:1,source_sha:oldSha,snapshot_sha256:oldDigest},
 second:{id:'a2',actor_user_id:2,source_sha:oldSha,snapshot_sha256:oldDigest}};
const checked={report,priorDigest:oldDigest,pair,accepted:true,digest,sourceVersions:versions};
const marker={ok:true,source_sha:sha};
const first={id:'n1',kind:'continuity_open',task_id:task,exception_code:code,actor_user_id:3,
 source_sha:sha,previous_sha:oldSha,snapshot_sha256:digest,source_versions:versions};
const second={id:'n2',kind:'continuity_confirm',subject_id:'n1',actor_user_id:4,
 source_sha:sha,previous_sha:oldSha,snapshot_sha256:digest,source_versions:versions};
function certified(c,r,m=marker){return renewalStatus756(c,{receipts:r},task,code,m).certificate_renewed;}
assert.equal(certified(checked,[second,first]),true,'two original distinct admins with matching evidence');
assert.equal(certified(checked,[first]),false,'one admin is insufficient');
assert.equal(certified(checked,[{...second,actor_user_id:3},first]),false,'same admin refused');
assert.equal(certified(checked,[{...second,snapshot_sha256:'e'.repeat(64)},first]),false,'digest drift refused');
assert.equal(certified(checked,[{...second,source_sha:oldSha},first]),false,'old release refused');
assert.equal(certified({...checked,accepted:false},[second,first]),false,'original field hold preserved');
assert.equal(certified(checked,[second,first],{ok:false,source_sha:sha}),false,'unverified production source refused');
console.log('BUILD757 PASS: network session retention, server verified Admin gate, timeout recovery, genuine distinct-human source-bound audit drift refusals');
