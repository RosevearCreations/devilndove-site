// Build 751 protected provider readback / retention SLA source proof, no live customer transactions.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('admin/storefront-acceptance/index.html');
const client=read('public/js/admin-customer-care-sla-751.js');
const server=read('functions/api/admin/customer-care-sla-751.js');
assert.equal(moduleKeyForPath('/api/admin/customer-care-sla-751'),MODULE_KEYS.STOREFRONT);
assert.equal(moduleKeyForPath('/admin/storefront-acceptance/'),MODULE_KEYS.STOREFRONT);
for(const id of ['a751Workflow','a751Load','a751Find','a751Rows','a751History',
 'a751ReadForm','a751ReviewForm','a751CloseForm','a751ReopenForm','a751PlanForm',
 'a751ApproveForm','a751CheckForm','a751ReadConsent','a751InboundId','a751OutboundId'])
 assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(html.includes('admin-customer-care-sla-751.js?v=751'));
assert.ok(client.includes("credentials:'same-origin'")&&client.includes("cache:'no-store'"));
assert.ok(!client.includes('localStorage')&&!client.includes('innerHTML'));
assert.ok(server.includes('verifiedAdminFromModule(ctx)'));
assert.ok(server.includes('site.admin.customerjourney.workqueue.v749'));
assert.ok(server.includes('site.admin.customerjourney.carecustody.v750'));
assert.ok(server.includes('site.admin.aftersale.v746.'));
assert.ok(server.includes("https://api.resend.com/"));
assert.ok(server.includes("method:'GET'")&&server.includes("redirect:'error'"));
assert.ok(server.includes('CARE_INBOUND_EMAIL_751')&&server.includes('notification_outbox'));
assert.ok(server.includes('DMARC_HOLD')&&server.includes('ORIGINAL_THREAD_MISMATCH'));
assert.ok(server.includes('NO_SELF_REVIEW')&&server.includes('NO_SELF_RETENTION_APPROVAL'));
assert.ok(server.includes('refund_executed:false')&&server.includes('record_deleted:false'));
assert.ok(!server.includes("method:'POST'")&&!server.includes('DELETE FROM'),'No provider send or delete');
const budget=JSON.parse(read('release465-performance-budget.json'));
assert.equal(budget.budget_reviews.find(x=>x.build==='751')?.new_limit_bytes,20195000);
assert.equal(budget.limits.max_runtime_source_bytes,20210000);
assert.equal(budget.budget_reviews.find(x=>x.build==='755')?.delta_bytes,15000);
assert.equal(budget.budget_reviews.find(x=>x.build==='751')?.new_file_limit,1886);
assert.equal(budget.limits.max_runtime_source_files,1887);
assert.equal(budget.budget_reviews.find(x=>x.build==='752')?.delta_files,1);
assert.equal(budget.limits.max_inline_data_uri_bytes,650000);
const inventory=JSON.parse(read('docs/operations/RELEASE_467_BUILD_556_ADMIN_ROUTE_INVENTORY.json'));
assert.equal(inventory.routes.find(x=>x.route==='/admin/storefront-acceptance/').evidence.forms,33);
assert.equal(inventory.routes.find(x=>x.route==='/admin/storefront-acceptance/').evidence.scripts,9);
for(const p of ['index.html','shop/index.html'])
 assert.ok(read(p).includes('data-dovlin-temporary-menu-hold="2026-11-21"'));
console.log('BUILD751 SOURCE PASS: verified Admin, original Order notification, exact Resend GET readback, source/DMARC/thread checks, independent SLA and retention no purge; Dovlin hold preserved.');
