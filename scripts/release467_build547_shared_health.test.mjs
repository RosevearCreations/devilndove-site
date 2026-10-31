import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cleanSamples,compact} from '../functions/api/admin/system-health-547.js';
const file=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('Build 547 bounds shared history and rejects arbitrary path/invalid latency',()=>{
  const good={path:'/shop/',status:'200',ms:42,at:new Date().toISOString()};
  assert.deepEqual(cleanSamples([good])[0].name,'Shop');
  assert.equal(cleanSamples([{...good,path:'/api/admin/users'}]),null);
  assert.equal(cleanSamples([{...good,ms:-5}]),null);
  assert.equal(cleanSamples([{...good,status:'FAKE'}]),null);
  assert.equal(cleanSamples([{...good,at:'invalid'}]),null);
  assert.equal(cleanSamples([{...good,at:'2020-01-01T00:00:00.000Z'}]),null);
  assert.equal(cleanSamples([{...good,at:'2020-01-01T00:00:00.000Z'}],{fresh:false}).length,1);
  const rows=Array.from({length:70},(_,i)=>({...good,at:new Date(Date.now()-i*1000).toISOString()}));
  assert.equal(compact(rows).length,60);
  assert.equal(compact([good,good]).length,1);
});

test('Build 547 uses authenticated owner-scoped existing D1 saved views and read-only priority aggregation',()=>{
  const api=file('functions/api/admin/system-health-547.js');
  assert.match(api,/getAdminUserFromRequest/);
  assert.match(api,/created_by_user_id=\?/);
  assert.match(api,/admin_command_center_saved_views/);
  assert.match(api,/view_area=\?/);
  assert.match(api,/runtime_incidents/);
  assert.match(api,/action==='record'/);
  assert.match(api,/action==='save_view'/);
  assert.doesNotMatch(api,/CREATE TABLE|DROP TABLE|DELETE FROM/);
  assert.match(api,/sample_limit:60/);
  const html=file('admin/system-operations/index.html');
  for(const id of ['dd547SaveChecks','dd547Reload','dd547History','dd547Priorities','dd547SaveView','dd547Views'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(file('public/js/admin-system-health-546.js'),/dd:system-health-sampled/);
  assert.match(file('public/js/admin-system-health-547.js'),/document\.addEventListener\('dd:system-health-sampled'/);
  assert.match(file('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:54[789]|550|551|552)/);
});
