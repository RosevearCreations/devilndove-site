// Build 753 — deterministic original-evidence exception tests; no live customer records.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectCareExceptions753} from '../functions/api/admin/customer-care-retention-ops-752.js';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const api=read('functions/api/admin/customer-care-retention-ops-752.js');
const client=read('public/js/admin-customer-care-sla-751.js');
const html=read('admin/storefront-acceptance/index.html');
assert.equal(moduleKeyForPath('/api/admin/customer-care-retention-ops-752'),MODULE_KEYS.STOREFRONT);
for(const name of ['a753Workflow','a753Heading','a753Load','a753View','a753Summary','a753Rows',
 'a753Status','a753Raise','a753Review','a753Subject','a753Decision','a753History'])
 assert.ok(html.includes('id="'+name+'"'),name);
assert.ok(html.includes('admin-customer-care-sla-751.js?v=751-752-753'));
assert.ok(client.includes("credentials:'same-origin'")&&client.includes("cache:'no-store'"));
assert.ok(!client.includes('innerHTML')&&!client.includes('localStorage'));
for(const marker of ['verifiedAdminFromModule(ctx)','EXCEPTIONS_KEY',
 'site.admin.customerjourney.sla-exceptions.v753','INDEPENDENT_REVIEW_REQUIRED',
 'ORIGINAL_EXCEPTION_NOT_ACTIVE','ORIGINAL_ORDER_CHANGED','ORIGINAL_CASE_CHANGED',
 'CONCURRENT_SOURCE_CHANGE','no_external_send:true','no_purge:true','REQUIRES_INDEPENDENT_LIVE_WITNESS'])
 assert.ok(api.includes(marker),marker);
assert.ok(!api.includes('DELETE FROM')&&!api.includes('setInterval('));
assert.ok(!/fetch\s*\(\s*['"]https?:/i.test(api.slice(api.indexOf('/** Build 753'))));
const clock=Date.parse('2026-11-23T18:00:00Z'),hour=3600000;
const taskId='16b147a8-d11f-47e9-8fb5-c0fbc3949de0';
const task={kind:'task_open',id:taskId,order_id:25,recorded_at:new Date(clock-100*hour).toISOString()};
const blank={work:{version:1,receipts:[task]},sla:{version:1,receipts:[]},
 custody:{version:1,receipts:[]},ops:{version:1,receipts:[]}};
let row=projectCareExceptions753(blank,[],clock)[0];
assert.deepEqual(row.exceptions.map(x=>x.code),['REPLY_SLA_EXCEPTION','CLOSURE_SLA_EXCEPTION']);
assert.equal(row.provider_thread_independently_reviewed,false);
const proof={kind:'provider_readback',task_id:taskId,id:'proof',metadata_sha256:'digest',
 actor_user_id:1,received_at:new Date(clock-70*hour).toISOString()};
const reviewer={kind:'provider_review',task_id:taskId,id:'review',subject_id:'proof',
 decision:'pass',metadata_sha256:'digest',actor_user_id:2};
const closure={kind:'sla_close',task_id:taskId,recorded_at:new Date(clock-30*hour).toISOString()};
const source={...blank,sla:{version:2,receipts:[closure,reviewer,proof]}};
row=projectCareExceptions753(source,[],clock)[0];
assert.deepEqual(row.exceptions,[]);
assert.equal(row.provider_thread_independently_reviewed,true);
const sameAdmin={...source,sla:{version:2,receipts:[closure,{...reviewer,actor_user_id:1},proof]}};
row=projectCareExceptions753(sameAdmin,[],clock)[0];
assert.ok(row.exceptions.some(x=>x.code==='REPLY_SLA_EXCEPTION'),'same Admin is never independent');
const lateSource={...source,sla:{version:2,receipts:[{...closure,recorded_at:new Date(clock-10*hour).toISOString()},
 {...reviewer}, {...proof,received_at:new Date(clock-30*hour).toISOString()}]}};
row=projectCareExceptions753(lateSource,[],clock)[0];
assert.deepEqual(row.exceptions.map(x=>x.code),['REPLY_SLA_EXCEPTION','CLOSURE_SLA_EXCEPTION']);
const past='2026-11-22',plan='planned-uuid',hold='hold-receipt';
const retention={...blank,custody:{version:2,receipts:[
 {kind:'retention_hold',task_id:taskId,id:hold},
 {kind:'archive_review',task_id:taskId,id:'archive',decision:'approve'}]},
 sla:{version:2,receipts:[{kind:'retention_plan',task_id:taskId,id:plan,review_on:past},
 {kind:'retention_review',task_id:taskId,id:'approve',subject_id:plan,decision:'approve'}]}};
row=projectCareExceptions753(retention,[],clock)[0];
assert.ok(row.exceptions.some(x=>x.code==='RETENTION_REVIEW_ESCALATION'));
assert.ok(row.exceptions.some(x=>x.code==='LEGAL_HOLD_REVIEW'));
const receipt={kind:'exception_raise',task_id:taskId,exception_code:'REPLY_SLA_EXCEPTION',id:'raised'};
row=projectCareExceptions753(blank,[receipt],clock)[0];
assert.equal(row.exceptions.find(x=>x.code==='REPLY_SLA_EXCEPTION').status,'AWAITING_INDEPENDENT_REVIEW');
row=projectCareExceptions753(blank,[{kind:'exception_review',subject_id:'raised',decision:'pass'},receipt],clock)[0];
assert.equal(row.exceptions.find(x=>x.code==='REPLY_SLA_EXCEPTION').status,'INDEPENDENTLY_REVIEWED');
console.log('BUILD753 SOURCE PASS: original 48/72-hour windows, HOLD provenance, retention escalation, legal hold, independent review; no live acceptance inferred.');
