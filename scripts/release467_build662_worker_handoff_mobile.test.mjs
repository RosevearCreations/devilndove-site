import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleKeyForPath, MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
import {NEXT,canTransition} from '../functions/api/admin/_lib/workOrderRules.js';
import {keyValid} from '../functions/api/admin/_lib/writeReceipts.js';

const get=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const api=get('functions/api/admin/project-work-orders.js');
const client=get('public/js/admin-project-work-orders.js');
const page=get('admin/project-work-orders/index.html');
const queue=get('docs/operations/RELEASE_467_MASTER_SHELL_QUEUE_655_668.md');

test('original work orders route is Creators-scoped for page and API',()=>{
 assert.equal(moduleKeyForPath('/admin/project-work-orders/'),MODULE_KEYS.CREATORS);
 assert.equal(moduleKeyForPath('/api/admin/project-work-orders'),MODULE_KEYS.CREATORS);
});
test('Admin-only original work-order authority remains fail closed',()=>{
 assert.match(api,/verifiedAdminFromModule\(ctx\)/);
 assert.match(api,/role_policy:rolePolicy/);
 assert.match(api,/worker_writes:false,customer_writes:false/);
 assert.match(api,/master_completion_percent:null/);
 assert.match(api,/Origin/);
 assert.match(api,/atomicWriteReceipt/);
 assert.match(api,/STALE_OR_BLOCKED/);
 assert.doesNotMatch(api,/CREATE TABLE|ALTER TABLE|DROP TABLE/);
});
test('actual time write uses original receipts without invented employee assignment',()=>{
 assert.match(client,/body\.request_key='wo662_'/);
 assert.match(client,/crypto\.randomUUID\(\)/);
 assert.match(client,/pending=body/);
 assert.match(client,/JSON\.stringify\(pending\)/);
 assert.match(client,/Retry same original receipt/);
 assert.match(client,/Number\.isInteger\(body\.minutes\)/);
 assert.match(client,/body\.work_date/);
 assert.match(client,/No stock, customer, payroll or staff-role changes/);
 assert.equal(keyValid('wo662_'+'0123456789abcdef0123456789abcdef'),true);
});
test('only original allowed transitions and milestones permit completion',()=>{
 assert.ok(NEXT.in_progress.includes('paused'));
 assert.ok(NEXT.paused.includes('in_progress'));
 assert.equal(canTransition('in_progress','completed',[],0),'REAL_MILESTONE_REQUIRED');
 assert.equal(canTransition('paused','completed',[],1),'INVALID_TRANSITION');
 assert.equal(canTransition('ready','in_progress',['not_started'],0),'DEPENDENCIES_INCOMPLETE');
});
test('tablet and phone view exposes accessible touch workflow',()=>{
 assert.match(page,/name="viewport"/);
 assert.match(page,/@media\(max-width:850px\)/);
 assert.match(page,/@media\(max-width:520px\)/);
 assert.match(page,/min-height:44px/);
 assert.match(page,/focus-visible/);
 assert.match(client,/wo662-task-cards/);
 assert.match(client,/woFilter/);
 assert.match(client,/aria-live="polite"/);
 assert.match(page,/Build 662/);
});
test('role limitations are explicit, not an invented staff signoff',()=>{
 assert.match(client,/Separate worker\/customer access/);
 assert.match(client,/verified Admin/);
 assert.match(queue,/\*\*662\*\*/);
});
