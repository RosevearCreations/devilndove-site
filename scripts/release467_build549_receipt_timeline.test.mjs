import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {matchingReceipt} from '../functions/api/admin/system-health-547.js';
const file=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('Build 549 only matches a validated route/timestamp receipt from scoped saved history',()=>{
  const at='2026-10-31T10:00:00.000Z',samples=[{path:'/shop/',at,status:'200',ms:100}];
  assert.equal(matchingReceipt(samples,{path:'/shop/',at}),true);
  assert.equal(matchingReceipt(samples,{path:'/admin/',at}),false);
  assert.equal(matchingReceipt(samples,{path:'/api/admin/users',at}),false);
  assert.equal(matchingReceipt(samples,{path:'/shop/',at:'invalid'}),false);
  const api=file('functions/api/admin/system-health-547.js');
  assert.match(api,/created_by_user_id=\?/);
  assert.match(api,/owner_scoped:true/);
  assert.match(api,/receipt_view/);
  assert.match(api,/receipt_path/);
  assert.match(api,/incident_timeline/);
  assert.match(api,/ORDER BY datetime\(created_at\) DESC/);
  assert.doesNotMatch(api,/CREATE TABLE|DELETE FROM/);
});

test('Build 549 offers truthful cross-device owner receipt review and read-only incident milestones',()=>{
  const page=file('admin/system-operations/index.html'),ui=file('public/js/admin-system-health-549.js'),shared=file('public/js/admin-system-health-547.js');
  for(const id of ['dd549Heading','dd549ReceiptCode','dd549Verify','dd549Copy','dd549Timeline','dd549OwnerReview'])assert.match(page,new RegExp(`id="${id}"`));
  assert.match(page,/Not independently confirmed/);
  assert.match(page,/not every historical status transition/);
  assert.match(ui,/dd:health-receipt-549/);
  assert.match(ui,/receiptQuery/);
  assert.match(ui,/data\.receipt_check\?\.found/);
  assert.match(ui,/No incident or Product record was changed/);
  assert.doesNotMatch(ui,/method:'POST'|method:'DELETE'/);
  assert.match(shared,/dd:system-health-reconciled-549/);
  assert.match(file('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:549|550|551|552|553|554|555|556|557|558|559|560|561)/);
});
