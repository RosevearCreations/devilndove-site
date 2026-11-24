// Build 755 — deterministic original receipts, SHA-256 export and independent review negatives.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {revalidateSla755,acceptance755,sha755} from '../functions/api/admin/customer-care-retention-ops-752.js';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const server=read('functions/api/admin/customer-care-retention-ops-752.js');
const ui=read('public/js/admin-customer-care-sla-751.js');
const html=read('admin/storefront-acceptance/index.html');
assert.equal(moduleKeyForPath('/api/admin/customer-care-retention-ops-752'),MODULE_KEYS.STOREFRONT);
for(const id of ['a755Workflow','a755Load','a755Inspect','a755Download','a755Rows',
 'a755Status','a755Summary','a755Task','a755Code','a755Subject','a755Hash','a755Note',
 'a755Open','a755Certify','a755Selected'])
 assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(html.includes('admin-customer-care-sla-751.js?v=751-752-753-754-755'));
assert.ok(ui.includes("credentials:'same-origin'")&&ui.includes("cache:'no-store'"));
assert.ok(ui.includes('URL.createObjectURL')&&ui.includes("download='devilndove-build755-private-audit-'"));
assert.ok(!ui.includes('localStorage')&&!ui.includes('innerHTML')&&!ui.includes('setInterval('));
for(const phrase of ['site.admin.customerjourney.acceptance-audit.v755',
 'DISTINCT_ADMIN_AND_SAME_SOURCE_REQUIRED','ORIGINAL_TWO_ADMIN_FIELD_WITNESS_REQUIRED',
 'AUDIT_SOURCE_DIGEST_CHANGED','ORIGINAL_AUDIT_SOURCE_DRIFT',
 'no_external_send:true','no_purge:true','sameVersions754(',
 'sha755','ORIGINAL_PRODUCTION_FIELD_SOURCE_VERIFIED'])
 assert.ok(server.includes(phrase),phrase);
assert.ok(!server.includes('DELETE FROM')&&!server.includes('setInterval('));
const tid='16b147a8-d11f-47e9-8fb5-c0fbc3949de0';
const code='RETENTION_REVIEW_ESCALATION';
const sha='a'.repeat(40),marker={ok:true,source_sha:sha,workflow_run_id:'45294756449'};
const task={kind:'task_open',id:tid,order_id:25,case_id:'case',
 case_type:'warranty',source_case_version:2,source_order_updated_at:'2026-11-20'};
const work={version:1,receipts:[task]};
const custody={version:2,receipts:[{id:'archive',kind:'archive_review',task_id:tid,decision:'approve'}]};
const plan={id:'plan',kind:'retention_plan',task_id:tid,review_on:'2026-11-22'};
const sla={version:3,receipts:[
 {id:'check',kind:'retention_check',subject_id:plan.id,decision:'reviewed'},
 {id:'approve',kind:'retention_review',subject_id:plan.id,decision:'approve'},
 plan,
 {id:'prov',kind:'provider_readback',task_id:tid,metadata_sha256:'feed'},
 {id:'prov2',kind:'provider_review',subject_id:'prov',decision:'pass',
  metadata_sha256:'feed',actor_user_id:9},
 {id:'care-close',kind:'sla_close',task_id:tid}
]};
sla.receipts.find(x=>x.id==='prov').actor_user_id=8;
const ops={version:4,receipts:[
 {id:'ack2',kind:'review_confirm',subject_id:'ack',actor_user_id:3},
 {id:'ack',kind:'review_ack',task_id:tid,plan_id:plan.id,actor_user_id:2}]};
const s={work,custody,sla,ops};
const e={version:5,receipts:[
 {id:'review',kind:'exception_review',subject_id:'raise',decision:'pass',actor_user_id:2},
 {id:'raise',kind:'exception_raise',task_id:tid,exception_code:code,actor_user_id:1}
]};
const versions={work:1,custody:2,sla:3,retention_ops:4,exceptions:5};
const open={id:'w1',kind:'witness_open',task_id:tid,exception_code:code,actor_user_id:3,
 source_sha:sha,source_versions:versions};
const second={id:'w2',kind:'witness_confirm',subject_id:'w1',actor_user_id:4,
 source_sha:sha,source_versions:versions};
const closure={id:'rc',kind:'retention_closure',task_id:tid,subject_id:'w2',
 source_sha:sha,source_versions:versions};
const w={version:6,receipts:[closure,second,open]};
const order={order_id:25,updated_at:'2026-11-20'};
const originalCase={schema:746,version:2,receipts:[{receipt_id:'case',source_order_id:25,case_type:'warranty'}]};
const pack=revalidateSla755(s,e,w,marker,tid,code,order,originalCase);
assert.equal(pack.original.production_field_source_accepted,true);
assert.equal(pack.sla.provider_thread_revalidated,true);
assert.equal(pack.retention.independent_review_closure_verified,true);
assert.equal(pack.acceptance.result,'ORIGINAL_PRODUCTION_FIELD_SOURCE_VERIFIED');
assert.equal(JSON.stringify(pack).includes('customer_email'),false);
assert.equal(JSON.stringify(pack).includes('note'),false);
const hash=await sha755(pack);assert.match(hash,/^[a-f0-9]{64}$/);
assert.equal(await sha755(pack),hash);
assert.notEqual(await sha755({...pack,source:{...pack.source,production_main_sha:'b'.repeat(40)}}),hash);
const first={id:'a1',kind:'audit_open',task_id:tid,exception_code:code,actor_user_id:12,
 source_sha:sha,snapshot_sha256:hash};
const secondAudit={id:'a2',kind:'audit_certify',subject_id:'a1',actor_user_id:13,
 source_sha:sha,snapshot_sha256:hash};
assert.equal(acceptance755(pack,hash,[secondAudit,first],sha).two_admin_audit_accepted,true);
assert.equal(acceptance755(pack,hash,[{...secondAudit,actor_user_id:12},first],sha).two_admin_audit_accepted,false);
assert.equal(acceptance755(pack,hash,[{...secondAudit,source_sha:'c'.repeat(40)},first],sha).two_admin_audit_accepted,false);
assert.equal(acceptance755(pack,hash,[{...secondAudit,snapshot_sha256:'f'.repeat(64)},first],sha).two_admin_audit_accepted,false);
assert.equal(acceptance755(pack,hash,[first],sha).two_admin_audit_accepted,false);
assert.equal(acceptance755(pack,hash,[secondAudit,first],'f'.repeat(40)).two_admin_audit_accepted,false);
let changed=revalidateSla755(s,e,w,marker,tid,code,{...order,updated_at:'changed'},originalCase);
assert.equal(changed.original.production_field_source_accepted,false);
assert.equal(acceptance755(changed,await sha755(changed),[secondAudit,first],sha).two_admin_audit_accepted,false);
changed=revalidateSla755(s,e,{version:6,receipts:[{...second,actor_user_id:3},open]},
 marker,tid,code,order,originalCase);
assert.equal(changed.original.production_field_source_accepted,false);
changed=revalidateSla755(s,e,w,{ok:false},tid,code,order,originalCase);
assert.equal(changed.acceptance.result,'HOLD_ORIGINAL_EVIDENCE');
changed=revalidateSla755({...s,sla:{...sla,receipts:sla.receipts.filter(x=>x.kind!=='provider_review')}},
 e,w,marker,tid,code,order,originalCase);
assert.equal(changed.sla.provider_thread_revalidated,false);
assert.equal(changed.original.production_field_source_accepted,true);
console.log('BUILD755 PASS: production SHA/source provenance, independent 751/753/754 receipts, distinct 755 auditors, hash drift, original Order and private no-send audit.');
