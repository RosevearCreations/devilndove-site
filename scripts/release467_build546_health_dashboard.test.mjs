import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('Build 546 adds a real interactive System Operations health dashboard with visible source labeling',()=>{
  const html=file('admin/system-operations/index.html');
  const js=file('public/js/admin-system-health-546.js');
  assert.match(html,/System Operations &amp; Health/);
  for(const id of ['dd546Health','dd546Refresh','dd546Routes','dd546History','dd546Incidents','dd546IncidentStatus'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/stored in this browser only/);
  assert.match(html,/admin-system-health-546\.js\?v=54[6789]/);
  assert.match(js,/HISTORY_KEY='dnd-system-route-history-546'/);
  assert.match(js,/\.slice\(-60\)/);
  assert.match(js,/AbortController/);
  assert.match(js,/Promise\.all\(ROUTES\.map/);
});

test('Build 546 is read-only, reports route timeouts and uses authenticated incident GET',()=>{
  const js=file('public/js/admin-system-health-546.js');
  assert.match(js,/status:error\.name==='AbortError'\?'TIMEOUT'/);
  assert.match(js,/Green deployment does not override these failures/);
  assert.match(js,/\/api\/admin\/runtime-incidents\?days=30&limit=15&review_status=all/);
  assert.match(js,/window\.DDAuth\?\.apiFetch/);
  assert.doesNotMatch(js,/method:\s*'POST'|method:\s*'DELETE'|setInterval\(/);
  assert.match(file('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:54[6789]|550|551|552|553|554|555|556|557|558|559|560|561|562|563|564|565)/);
  assert.match(file('css/admin-system-health-546.css'),/\.dd546-route-grid/);
});
