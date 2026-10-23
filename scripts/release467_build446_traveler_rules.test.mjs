import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const api=readFileSync(new URL('../functions/api/admin/guided-manufacturing.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../public/js/admin-guided-manufacturing.js',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/current-application-quality.yml',import.meta.url),'utf8');
test('every operator write requires same-origin authentication and idempotent source keys',()=>{
 assert.match(api,/getAdminUserFromRequest/);assert.match(api,/headers\.get\('Origin'\)/);assert.match(api,/payload_sha256/);
 assert.match(api,/previous\.payload_sha256===digest/);assert.match(api,/prior\.payload_sha256===digest/);
});
test('UI retains pending retry keys and uses only genuine source time and evidence receipts',()=>{
 assert.match(ui,/pending\.set/);assert.match(ui,/pendingRunKey/);assert.match(ui,/crypto\.getRandomValues/);
 assert.match(ui,/available_time_receipts/);assert.match(ui,/available_evidence_events/);
 assert.match(ui,/new Date\(local\)\.toISOString/);
});
test('Build446 migration regression must run in deployment-quality workflow',()=>{
 assert.match(workflow,/release467_build446_traveler_sql_regression\.py/);
 assert.match(api,/automatic_completion:false,work_order_time_posting:false,inventory_mutation:false/);
});
