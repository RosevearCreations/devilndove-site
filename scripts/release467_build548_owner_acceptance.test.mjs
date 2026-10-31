import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cleanSamples,compact} from '../functions/api/admin/system-health-547.js';
const file=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('Build 548 verifies saved history and named views with independent, owner-scoped D1 readback',()=>{
  const api=file('functions/api/admin/system-health-547.js');
  assert.match(api,/readback_confirmed:true,verified_last_at/);
  assert.match(api,/saved\?\.view_label===label/);
  assert.match(api,/readback_confirmed:false/);
  assert.match(api,/created_by_user_id=\?/);
  assert.match(api,/filters\.review===review/);
  assert.match(api,/\['all','open','closed'\]/);
  assert.doesNotMatch(api,/CREATE TABLE|DELETE FROM/);
  const sample={path:'/admin/',status:'200',ms:112,at:new Date().toISOString()};
  assert.equal(compact([sample,sample]).length,1);
  assert.equal(cleanSamples([{...sample,path:'/api/admin/runtime-incidents'}]),null);
});

test('Build 548 presents a truthful second-device owner acceptance checkpoint and functional priority filters',()=>{
  const page=file('admin/system-operations/index.html'),ui=file('public/js/admin-system-health-547.js');
  for(const id of ['dd548Heading','dd548Review','dd548Receipt','dd548DeviceStatus'])assert.match(page,new RegExp(`id="${id}"`));
  assert.match(page,/Not yet verified/);
  assert.match(page,/Open or under review/);
  assert.match(page,/Resolved or ignored/);
  assert.match(ui,/data\.readback_confirmed!==true/);
  assert.match(ui,/\['resolved','ignored'\]\.includes\(row\.review_status\)/);
  assert.match(ui,/review:\$\('dd548Review'\)/);
  assert.match(ui,/Saved and independently read back/);
  assert.match(file('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:54[89]|550)/);
});
