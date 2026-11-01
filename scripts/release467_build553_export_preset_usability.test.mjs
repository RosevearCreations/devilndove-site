import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

const dom=()=>{
  const handlers=new Map(),elements=new Map();
  const mk=tag=>({tag,id:'',children:[],dataset:{},textContent:'',value:'',disabled:false,open:false,
    append(...children){this.children.push(...children);},replaceChildren(...children){this.children=[...children];},
    addEventListener(type,fn){handlers.set(`${this.id}:${type}`,fn);},remove(){},click(){this.wasClicked=true;},
    scrollIntoView(){},get options(){return this.children;}});
  const get=id=>{if(!elements.has(id)){const element=mk('div');element.id=id;elements.set(id,element);}return elements.get(id);};
  const document={getElementById:get,createElement:mk,body:{append(){}},
    addEventListener(type,fn){handlers.set(`document:${type}`,fn);},dispatchEvent(){return true;}};
  return{get,handlers,document};
};

test('Build 553 exports a verifiable owner-reported snapshot and rejects altered or stale files',async()=>{
  const {get,handlers,document}=dom();let downloaded,objectUrl;
  class MockBlob{constructor(parts,options){this.body=parts.join('');this.options=options;downloaded=this;}}
  const fakeUrl={createObjectURL(blob){objectUrl=blob;return 'blob:in-memory-test';},revokeObjectURL(){}};
  vm.runInNewContext(read('public/js/admin-system-health-551.js'),{document,Blob:MockBlob,URL:fakeUrl,setTimeout:()=>{},CustomEvent:class{},Date,JSON,window:{},console});
  const record={receipt:{kind:'history',path:'/shop/',at:'2026-10-31T14:00:00Z',status:'200',ms:150},reviewed_at:'2026-10-31T15:00:00Z',claim:'owner_reported_second_device_comparison'};
  handlers.get('document:dd:system-health-reconciled-549')({detail:{ownerReviews:[record],followUp:null}});
  assert.equal(get('dd552DownloadEvidence').disabled,false);
  assert.equal(get('dd553VerifyEvidenceFile').disabled,false);
  handlers.get('dd552DownloadEvidence:click')();
  assert.equal(objectUrl,downloaded);
  assert.equal(downloaded.options.type,'application/json');
  const payload=JSON.parse(downloaded.body);
  assert.equal(payload.format,'devilndove_owner_monitoring_evidence_553');
  assert.equal(payload.review_count,1);
  assert.equal(payload.evidence_type,'owner_reported_not_independent_device_proof');
  assert.match(get('dd553ExportStatus').textContent,/Prepared download/);
  const verify=async json=>{get('dd553VerifyEvidenceFile').files=[{size:json.length,text:async()=>json}];await handlers.get('dd553VerifyEvidenceFile:change')();};
  await verify(downloaded.body);
  assert.match(get('dd553ExportStatus').textContent,/LOCAL FILE MATCH/);
  assert.match(get('dd553ExportStatus').textContent,/not prove another device/i);
  const changed=JSON.parse(downloaded.body);changed.reviews[0].receipt.ms=151;
  await verify(JSON.stringify(changed));
  assert.match(get('dd553ExportStatus').textContent,/FILE NOT VERIFIED/);
  assert.match(get('dd553ExportStatus').textContent,/differ/);
  await verify('{invalid');
  assert.match(get('dd553ExportStatus').textContent,/valid JSON/);
  handlers.get('document:dd:system-health-unavailable-550')({detail:{reason:'401'}});
  assert.equal(get('dd552DownloadEvidence').disabled,true);
  assert.equal(get('dd553VerifyEvidenceFile').disabled,true);
  await verify(downloaded.body);
  assert.match(get('dd553ExportStatus').textContent,/FILE NOT VERIFIED/);
  assert.match(get('dd553ExportStatus').textContent,/freshly loaded/);
});

test('Build 553 restores only known incident presets from URL and clears stale rows after readback fails',()=>{
  const {get,handlers,document}=dom();
  const location={search:'?other=kept&incident_preset=open_24h',href:'https://devilndove.com/admin/system-operations/?other=kept&incident_preset=open_24h'};
  const history={replaceState(_state,_title,path){location.href='https://devilndove.com'+path;location.search=new URL(location.href).search;}};
  const window={location,history};
  get('dd550Priority').value='all';get('dd550Review').value='all';
  function Option(label,value){this.label=label;this.value=value;}
  vm.runInNewContext(read('public/js/admin-system-health-550.js'),{document,Date,URL,URLSearchParams,Option,window,JSON,console});
  assert.equal(get('dd552FollowUpPreset').value,'open_24h');
  assert.equal(get('dd552IncidentTimelineDetails').open,true);
  assert.match(get('dd553PresetStatus').textContent,/Restored/);
  const at=days=>new Date(Date.now()-days*86400000).toISOString();
  const incidents=[{id:1,review_status:'open',created_at:at(8)},{id:2,review_status:'resolved',created_at:at(9)},{id:3,review_status:'open',created_at:at(0.1)}];
  handlers.get('document:dd:system-health-reconciled-549')({detail:{history:[],presets:[],timeline:incidents}});
  assert.equal(get('dd549Timeline').children.length,1);
  get('dd552FollowUpPreset').value='open_7d';
  handlers.get('dd552FollowUpPreset:change')();
  assert.match(location.href,/incident_preset=open_7d/);
  assert.match(location.href,/other=kept/);
  handlers.get('document:dd:system-health-unavailable-550')();
  assert.match(get('dd550Count').textContent,/unavailable/);
  assert.match(get('dd553PresetStatus').textContent,/unavailable/);
  get('dd552FollowUpPreset').value='all';handlers.get('dd552FollowUpPreset:change')();
  assert.match(get('dd550Count').textContent,/unavailable/,'changing a filter must not resurrect stale incident records');
  handlers.get('dd553ResetPreset:click')();
  assert.equal(get('dd552FollowUpPreset').value,'all');
  assert.doesNotMatch(location.href,/incident_preset=/);
  assert.match(location.href,/other=kept/);
});

test('Build 553 clarifies owner evidence file verification and preserves production provenance',()=>{
  const html=read('admin/system-operations/index.html'),deploy=read('.github/workflows/production-pages-deploy-current.yml');
  for(const id of ['dd553EvidenceDetails','dd553VerifyEvidenceFile','dd553ExportStatus','dd553PresetStatus','dd553ResetPreset'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/Build (?:553|554|555|557|558|559)/);
  assert.match(html,/admin-system-health-553\.css\?v=553/);
  assert.match(html,/admin-system-health-550\.js\?v=553/);
  assert.match(html,/admin-system-health-551\.js\?v=(?:553|554)/);
  assert.match(html,/not independently verified second-device activity/);
  assert.match(deploy,/"build":(?:553|554|555|556|557|558|559)/);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build553_export_preset_usability\.test\.mjs/);
  for(const file of ['public/js/admin-system-health-550.js','public/js/admin-system-health-551.js']){
    assert.doesNotMatch(read(file),/localStorage|sessionStorage|DELETE FROM|UPDATE runtime_incidents/);
  }
});
