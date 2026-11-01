import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('Build 552 retains older controls in Advanced and offers explicit owner evidence recovery',()=>{
  const html=read('admin/system-operations/index.html'),ui=read('public/js/admin-system-health-551.js');
  assert.match(html,/Build (?:552|553|554|555|557|558|559|560|561|562|563)/);
  for(const id of ['dd552Heading','dd552Advanced','dd552FollowUpPreset','dd552IncidentTimelineDetails','dd552DownloadEvidence','dd546Refresh','dd547SaveChecks','dd549Verify','dd551OwnerCheck'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/<details class="dd552-advanced" id="dd552Advanced">/);
  assert.match(html,/<details id="dd552IncidentTimelineDetails"/);
  assert.match(html,/admin-system-health-552\.css\?v=552/);
  assert.match(ui,/Load receipt for recheck/);
  assert.match(ui,/dd:health-receipt-changed-551/);
  assert.match(ui,/dd552DownloadEvidence/);
  assert.match(ui,/application\/json/);
  assert.match(ui,/owner_reported_not_independent_device_proof/);
  assert.doesNotMatch(ui,/DELETE|localStorage/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:552|553|554|555|556|557|558|559|560|561|562|563|564|565|566)/);
});

test('Build 552 follow-up presets filter the bounded read-only incident list',()=>{
  const handlers=new Map(),elements=new Map();
  const mk=tag=>({tag,children:[],dataset:{},textContent:'',value:'',append(...children){this.children.push(...children);},replaceChildren(...children){this.children=[...children];},addEventListener(type,fn){handlers.set(`${this.id}:${type}`,fn);},get options(){return this.children;}});
  const get=id=>{if(!elements.has(id)){const element=mk('div');element.id=id;elements.set(id,element);}return elements.get(id);};
  get('dd550Priority').value='all';get('dd550Review').value='all';get('dd552FollowUpPreset').value='all';
  const document={getElementById:get,createElement:mk,addEventListener(type,fn){handlers.set(`document:${type}`,fn);},dispatchEvent(){return true;}};
  const FakeDate=class extends Date{static now(){return Date.parse('2026-10-31T15:00:00Z');}};
  function Option(label,value){this.label=label;this.value=value;}
  vm.runInNewContext(read('public/js/admin-system-health-550.js'),{document,Date:FakeDate,Option,CustomEvent:class{},JSON,window:{},console});
  const at=days=>new Date(FakeDate.now()-days*86400000).toISOString();
  const rows=[{id:1,review_status:'open',created_at:at(8),reviewed_at:null},{id:2,review_status:'resolved',created_at:at(10),reviewed_at:at(1)},{id:3,review_status:'reviewing',created_at:at(2),reviewed_at:at(1)},{id:4,review_status:'open',created_at:at(0.05),reviewed_at:null},{id:5,review_status:'open',created_at:'invalid',reviewed_at:null}];
  handlers.get('document:dd:system-health-reconciled-549')({detail:{history:[],presets:[],timeline:rows}});
  assert.equal(get('dd549Timeline').children.length,5);
  const choose=(value,expected)=>{get('dd552FollowUpPreset').value=value;handlers.get('dd552FollowUpPreset:change')();assert.equal(get('dd549Timeline').children.length,expected);assert.equal(get('dd552IncidentTimelineDetails').open,true);};
  choose('open',4);choose('open_24h',2);choose('open_7d',1);choose('open_unreviewed',3);choose('all',5);
  assert.match(get('dd550Count').textContent,/maximum 25/);
  assert.equal(rows[0].review_status,'open');
});
