import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
function harness(){
  const nodes=new Map(),events=new Map();
  const get=id=>{if(!nodes.has(id))nodes.set(id,{id,textContent:'',dataset:{},value:'',addEventListener(type,callback){on(`${id}:${type}`,callback);}});return nodes.get(id);};
  const on=(name,fn)=>events.set(name,[...(events.get(name)||[]),fn]);
  const document={getElementById:get,addEventListener(type,fn){on(`doc:${type}`,fn);}};
  const trigger=(name,detail)=>{for(const fn of events.get(name)||[])fn({detail});};
  vm.runInNewContext(source('public/js/admin-system-health-555.js'),{document,Date,JSON,Number,String,Array});
  return {get,trigger};
}
const history={kind:'history',path:'/shop/',at:'2026-10-31T16:00:00Z',status:'200',ms:16};
const view={kind:'view',key:'system-health-preset-42-daily-check',label:'Daily check',updated_at:'2026-10-31 15:00:00'};
const fresh=(more={})=>({scope:'signed_in_admin',readbackAt:'2026-10-31T17:00:00Z',history:[history],presets:[view],ownerReviews:[],followUp:{window_days:30,total:7,open:4,open_24h:3,open_7d:1,open_without_review:2},incidentSummary:[{severity:'critical',review_status:'open',count:1},{severity:'error',review_status:'resolved',count:2},{severity:'warning',review_status:'open',count:4}],timeline:[{id:55}],...more});

test('Build 555 requires timestamped signed-in readback and a checked exact receipt to match owner evidence',()=>{
  const {get,trigger}=harness();
  trigger('doc:dd:health-receipt-verified-551',{receipt:history,comparison:{found:true}});
  assert.match(get('dd555AcceptanceStatus').textContent,/unavailable/i);
  trigger('doc:dd:system-health-reconciled-549',fresh({ownerReviews:[{receipt:view,reviewed_at:'2026-10-31T16:15:00Z'}]}));
  assert.match(get('dd555SourceStatus').textContent,/CURRENT.*signed-in administrator/);
  assert.match(get('dd555SourceStatus').textContent,/1 owner acknowledgments/);
  assert.match(get('dd555AcceptanceStatus').textContent,/Choose and verify the exact receipt/);
  trigger('doc:dd:health-receipt-verified-551',{receipt:history,comparison:{found:true}});
  assert.match(get('dd555AcceptanceStatus').textContent,/no retained owner acknowledgment matches this receipt/);
  trigger('doc:dd:health-receipt-verified-551',{receipt:view,comparison:{found:true}});
  assert.match(get('dd555AcceptanceStatus').textContent,/MATCH — this exact verified receipt/);
  assert.match(get('dd555AcceptanceStatus').textContent,/NOT independent second-device proof/);
  trigger('dd549ReceiptCode:input');
  assert.doesNotMatch(get('dd555AcceptanceStatus').textContent,/MATCH —/);
  trigger('doc:dd:system-health-unavailable-550');
  assert.match(get('dd555SourceStatus').textContent,/UNAVAILABLE/);
  assert.match(get('dd555AcceptanceStatus').textContent,/unavailable/);
});

test('Build 555 handles owner evidence readback after write and never treats an unconfirmed write as acceptance',()=>{
  const {get,trigger}=harness();
  trigger('doc:dd:system-health-reconciled-549',fresh());
  trigger('doc:dd:health-receipt-verified-551',{receipt:history,comparison:{found:true}});
  trigger('doc:dd:owner-review-recorded-554',{readbackConfirmed:true,reviewedAt:'2026-10-31T17:01:00Z'});
  assert.match(get('dd555AcceptanceStatus').textContent,/Waiting for a fresh shared-record readback/);
  trigger('doc:dd:system-health-reconciled-549',fresh({ownerReviews:[{receipt:{...history,at:'2026-10-31T16:00:00.000Z'},reviewed_at:'2026-10-31T17:01:00Z'}]}));
  assert.match(get('dd555AcceptanceStatus').textContent,/Choose and verify the exact receipt/);
  trigger('doc:dd:health-receipt-verified-551',{receipt:history,comparison:{found:true}});
  assert.match(get('dd555AcceptanceStatus').textContent,/MATCH —/,'timestamp normalization recognizes the same saved receipt');
  trigger('doc:dd:owner-review-save-unconfirmed-554');
  assert.match(get('dd555AcceptanceStatus').textContent,/save is not confirmed/);
  trigger('doc:dd:system-health-reconciled-549',fresh({ownerReviews:[{receipt:history,reviewed_at:'2026-10-31T17:01:00Z'}]}));
  assert.doesNotMatch(get('dd555AcceptanceStatus').textContent,/MATCH —/,'a fresh receipt verification is always required');
});

test('Build 555 separates 30-day incident priority/aging totals from the latest bounded timeline',()=>{
  const {get,trigger}=harness();
  trigger('doc:dd:system-health-reconciled-549',fresh());
  assert.match(get('dd555IncidentStatus').textContent,/7 total; 4 open \/ reviewing; 3 resolved \/ ignored/);
  assert.match(get('dd555IncidentStatus').textContent,/24\+ hours: 3/);
  assert.match(get('dd555IncidentContext').textContent,/critical: 1 · error: 2 · warning: 4 · info: 0/);
  assert.match(get('dd555IncidentContext').textContent,/latest 1 records only, not all 7/);
  trigger('doc:dd:system-health-reconciled-549',fresh({scope:'unknown'}));
  assert.match(get('dd555SourceStatus').textContent,/lacked a valid administrator scope/);
  assert.match(get('dd555IncidentStatus').textContent,/unavailable/);
  trigger('doc:dd:system-health-reconciled-549',fresh({readbackAt:null}));
  assert.match(get('dd555AcceptanceStatus').textContent,/unavailable/);
});

test('Build 555 release wiring, owner queue and read-only safe UX remain explicit',()=>{
  const page=source('admin/system-operations/index.html');
  for(const id of ['dd555Evidence','dd555SourceStatus','dd555AcceptanceStatus','dd555IncidentStatus','dd555IncidentContext'])assert.match(page,new RegExp(`id="${id}"`));
  assert.match(page,/Release 467 • Build 555/);
  assert.match(page,/admin-system-health-555\.js\?v=555/);
  assert.match(page,/admin-system-health-555\.css\?v=555/);
  assert.match(source('functions/api/admin/system-health-547.js'),/readback_at:new Date\(\)\.toISOString\(\)/);
  assert.match(source('public/js/admin-system-health-547.js'),/incidentSummary:lastPriorities,readbackAt:data\.readback_at/);
  assert.match(source('.github/workflows/production-pages-deploy-current.yml'),/"build":555/);
  assert.match(source('.github/workflows/current-application-quality.yml'),/release467_build555_owner_acceptance_evidence\.test\.mjs/);
  const plan=source('docs/operations/RELEASE_467_BUILD_555_OWNER_ACCEPTANCE_AND_NEXT_QUEUED_BUILDS_556_567.md');
  for(let build=556;build<=567;build++)assert.match(plan,new RegExp(`\\*\\*${build} —`));
  assert.doesNotMatch(source('public/js/admin-system-health-555.js'),/fetch\(|apiFetch|localStorage|sessionStorage|navigator\.sendBeacon/);
});
