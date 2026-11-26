// Build 752 source contract: original-source private retention worklist, no third-party mutations.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const api=read('functions/api/admin/customer-care-retention-ops-752.js');
const html=read('admin/storefront-acceptance/index.html');
const browser=read('public/js/admin-customer-care-sla-751.js');
for(const id of ['a752Workflow','a752Heading','a752Load','a752View','a752Status','a752Summary','a752Rows',
 'a752ReviewForm','a752Kind','a752Task','a752Plan','a752Subject','a752Note','a752Save'])
 assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(html.includes('admin-customer-care-sla-751.js?v=751-752'));
assert.ok(browser.includes('/api/admin/customer-care-retention-ops-752'));
assert.ok(browser.includes("credentials:'same-origin'")&&browser.includes("cache:'no-store'"));
assert.ok(!browser.includes('localStorage')&&!browser.includes('innerHTML'));
const budget=JSON.parse(read('release465-performance-budget.json'));
assert.equal(moduleKeyForPath('/api/admin/customer-care-retention-ops-752'),MODULE_KEYS.STOREFRONT);
for(const phrase of [
 'verifiedAdminFromModule(ctx)',"site.admin.customerjourney.workqueue.v749",
 "site.admin.customerjourney.carecustody.v750","site.admin.customerjourney.provider-sla.v751",
 'SAME_ORIGIN_REQUIRED','INDEPENDENT_CONFIRM_REQUIRED','ORIGINAL_DUE_SCHEDULE_REQUIRED',
 'private, no-store','NO_APPROVED_SCHEDULE','DUE_LEGAL_HOLD',
 'SOURCE','review_ack','review_confirm','legal_hold_at_review','no_external_send:true','no_purge:true'
]) assert.ok(api.includes(phrase),phrase);
assert.ok(!api.includes('api.resend.com')&&!api.includes('DELETE FROM')&&!api.includes('method:\'POST\''));
assert.ok(!api.includes('setInterval(')&&!api.includes('scheduled('),'never create unapproved cron');
assert.equal(budget.limits.max_runtime_source_files,1888);
assert.equal(budget.budget_reviews.find(x=>x.build==='761')?.previous_runtime_file_limit,1887);
assert.equal(budget.budget_reviews.find(x=>x.build==='761')?.delta_files,1);
assert.equal(budget.budget_reviews.find(x=>x.build==='751')?.new_limit_bytes,20195000);
assert.equal(budget.budget_reviews.find(x=>x.build==='755')?.new_limit_bytes,20210000);
assert.equal(budget.limits.max_runtime_source_bytes,20270000);
assert.equal(budget.budget_reviews.find(x=>x.build==='761')?.previous_limit_bytes,20245000);
assert.equal(budget.budget_reviews.find(x=>x.build==='761')?.delta_bytes,25000);
assert.equal(budget.budget_reviews.find(x=>x.build==='759')?.previous_limit_bytes,20235000);
assert.equal(budget.budget_reviews.find(x=>x.build==='759')?.new_limit_bytes,20245000);
assert.equal(budget.budget_reviews.find(x=>x.build==='759')?.runtime_file_limit_unchanged,1887);
assert.equal(budget.budget_reviews.find(x=>x.build==='756')?.delta_bytes,25000);
assert.equal(budget.budget_reviews.find(x=>x.build==='755')?.delta_bytes,15000);
assert.equal(budget.budget_reviews.find(x=>x.build==='752')?.delta_files,1);
assert.equal(budget.budget_reviews.find(x=>x.build==='751')?.new_file_limit,1886);
console.log('BUILD752 SOURCE PASS: Admin-only original D1 due queue, independent review, no external send or purge.');
