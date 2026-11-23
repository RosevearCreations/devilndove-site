// Build 752 source contract: original-source private retention worklist, no third-party mutations.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const api=read('functions/api/admin/customer-care-retention-ops-752.js');
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
assert.equal(budget.limits.max_runtime_source_files,1887);
assert.equal(budget.limits.max_runtime_source_bytes,20195000);
assert.equal(budget.budget_reviews.find(x=>x.build==='752')?.delta_files,1);
assert.equal(budget.budget_reviews.find(x=>x.build==='751')?.new_file_limit,1886);
console.log('BUILD752 SOURCE PASS: Admin-only original D1 due queue, independent review, no external send or purge.');
