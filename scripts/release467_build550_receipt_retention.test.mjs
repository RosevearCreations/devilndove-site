import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compareHistoryReceipt,compact} from '../functions/api/admin/system-health-547.js';
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('Build 550 checks retained receipt contents without confusing a changed record with a missing one',()=>{
  const row={path:'/shop/',at:'2026-10-31T10:00:00.000Z',status:'200',ms:132};
  assert.deepEqual(compareHistoryReceipt([row],row),{found:true,record_exists:true,changed:false});
  assert.deepEqual(compareHistoryReceipt([row],{...row,ms:200}),{found:false,record_exists:true,changed:true});
  assert.deepEqual(compareHistoryReceipt([row],{...row,status:'524'}),{found:false,record_exists:true,changed:true});
  assert.deepEqual(compareHistoryReceipt([row],{...row,path:'/admin/'}),{found:false,record_exists:false,changed:false});
  assert.deepEqual(compareHistoryReceipt([row],{...row,at:'invalid'}),{found:false,record_exists:false,changed:false});
  assert.equal(compareHistoryReceipt([row],{path:row.path,at:row.at}).found,true,'old receipt remains readable');
  const many=Array.from({length:65},(_,i)=>({path:'/shop/',at:new Date(Date.UTC(2026,9,31,10,i)).toISOString(),status:'200',ms:i}));
  assert.equal(compact(many).length,60,'server history retains at most sixty samples');
});

test('Build 550 offers recoverable owner-scoped receipt selection and read-only incident filtering',()=>{
  const api=read('functions/api/admin/system-health-547.js'),page=read('admin/system-operations/index.html'),ui=read('public/js/admin-system-health-550.js'),verify=read('public/js/admin-system-health-549.js');
  for(const name of ['dd550ReceiptPicker','dd550Retention','dd550Priority','dd550Review','dd550Count'])assert.match(page,new RegExp(`id="${name}"`));
  assert.match(page,/Build (?:550|551|552)/);assert.match(page,/Not independently confirmed/);
  assert.match(page,/maximum 25|latest review milestones/i);
  assert.match(page,/admin-system-health-550\.js\?v=(?:550|551|552)/);
  assert.match(ui,/dd:system-health-reconciled-549/);
  assert.match(ui,/receipt=\{kind:'history',path:row\.path,at:row\.at,status:row\.status,ms:row\.ms\}/);
  assert.match(ui,/receipt=\{kind:'view',key:view\.key,label:view\.label/);
  assert.match(ui,/incidents\.filter/);assert.match(ui,/Review recorded milestones/);
  assert.doesNotMatch(ui,/apiFetch|method:'POST'|method:'DELETE'|localStorage/);
  assert.match(verify,/receipt_status/);assert.match(verify,/receipt_updated/);
  assert.match(verify,/CHANGED/);
  assert.match(api,/created_by_user_id=\?/);
  assert.match(api,/record_exists/);
  assert.match(api,/receipt_label/);
  assert.match(api,/receipt_ms/);
  assert.match(api,/incident_timeline/);
  assert.doesNotMatch(api,/DELETE FROM|CREATE TABLE/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:550|551|552)/);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build550_receipt_retention\.test\.mjs/);
});
