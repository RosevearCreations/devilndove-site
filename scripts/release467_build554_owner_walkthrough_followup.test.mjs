import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

function dom(){
  const elements=new Map(),handlers=new Map(),events=[];
  const add=(key,handler)=>handlers.set(key,[...(handlers.get(key)||[]),handler]);
  const mk=tag=>({tag,id:'',dataset:{},children:[],textContent:'',value:'',disabled:false,checked:false,
    append(...items){this.children.push(...items);},replaceChildren(...items){this.children=[...items];},
    addEventListener(type,callback){add(`${this.id}:${type}`,callback);},click(){this.clicks=(this.clicks||0)+1;},scrollIntoView(){}});
  const get=id=>{if(!elements.has(id)){const item=mk('div');item.id=id;elements.set(id,item);}return elements.get(id);};
  const trigger=(key,detail)=>{for(const fn of handlers.get(key)||[])fn({detail});};
  const document={getElementById:get,createElement:mk,body:{append(){}},addEventListener(type,fn){add(`doc:${type}`,fn);},dispatchEvent(event){events.push(event);trigger(`doc:${event.type}`,event.detail);return true;}};
  return{get,handlers,events,document,trigger};
}

test('Build 554 owner walkthrough never claims the second device was observed',()=>{
  const {get,document,trigger}=dom();
  vm.runInNewContext(read('public/js/admin-system-health-554.js'),{document,window:{},Date,console});
  assert.match(get('dd554Step1').textContent,/Waiting/);
  assert.match(get('dd554Step4').textContent,/No confirmed/);
  trigger('doc:dd:system-health-sampled',{rows:[{status:'200'},{status:'524'}]});
  assert.match(get('dd554RoutesStatus').textContent,/1 returned HTTP 200, 1 returned another result/);
  trigger('doc:dd:system-health-reconciled-549',{history:[{},{}],presets:[{}],timeline:[{}],ownerReviews:[{}]});
  assert.match(get('dd554SharedStatus').textContent,/2 saved route checks/);
  assert.match(get('dd554IncidentStatus').textContent,/1 latest records/);
  const receipt={kind:'history',path:'/shop/',at:'2026-10-31T10:00:00Z',status:'200',ms:12};
  trigger('doc:dd:health-receipt-verified-551',{receipt,comparison:{found:true}});
  assert.match(get('dd554Step2').textContent,/Exact current receipt verified/);
  assert.match(get('dd554Step3').textContent,/cannot detect it/);
  get('dd551OwnerCheck').checked=true;trigger('dd551OwnerCheck:change');
  assert.match(get('dd554Step3').textContent,/owner-reported, not independent device proof/);
  assert.match(get('dd554Step4').textContent,/No confirmed/);
  trigger('doc:dd:owner-review-recorded-554',{readbackConfirmed:false});
  assert.match(get('dd554Step4').textContent,/No confirmed/);
  trigger('doc:dd:owner-review-recorded-554',{readbackConfirmed:true,reviewedAt:'2026-10-31T15:00:00Z'});
  assert.match(get('dd554Step4').textContent,/saved and read back/);
  assert.match(get('dd554Step4').textContent,/not independently verified/);
  trigger('doc:dd:health-receipt-changed-551');
  assert.match(get('dd554Step2').textContent,/No exact receipt/);
  trigger('doc:dd:system-health-unavailable-550');
  assert.match(get('dd554SharedStatus').textContent,/unavailable/);
  assert.match(get('dd554Step1').textContent,/Waiting/);
  assert.match(get('dd554Step4').textContent,/saved and read back/,'previously confirmed readback remains explicitly historical');
  get('dd554ReloadShared').clicks=0;trigger('dd554ReloadShared:click');
  assert.equal(get('dd547Reload').clicks,1);
  assert.match(get('dd554SharedStatus').textContent,/Reload requested/);
});

test('Build 554 emits owner acknowledgement only after confirmed server readback and resets stale approval',async()=>{
  const {get,document,events,trigger,handlers}=dom();
  const receipt={kind:'history',path:'/shop/',at:'2026-10-31T14:00:00Z',status:'200',ms:10};
  const raw=JSON.stringify(receipt);get('dd549ReceiptCode').value=raw;
  let confirmed=false,calls=0;
  const window={DDAuth:{apiFetch:async()=>{calls++;return{ok:true,json:async()=>({ok:true,readback_confirmed:confirmed,review:{reviewed_at:'2026-10-31T16:00:00Z'}})};}}};
  vm.runInNewContext(read('public/js/admin-system-health-551.js'),{document,window,Date,JSON,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},Blob:class{},URL:{},setTimeout:()=>{},console});
  const prepare=()=>{trigger('doc:dd:health-receipt-verified-551',{receipt,raw,comparison:{found:true}});get('dd551OwnerCheck').checked=true;trigger('dd551OwnerCheck:change');};
  prepare();trigger('doc:dd:system-health-reconciled-549',{ownerReviews:[],followUp:null});
  assert.equal(get('dd551SaveReview').disabled,true,'reload invalidates a previously verified receipt');
  prepare();assert.equal(get('dd551SaveReview').disabled,false);
  for(const handler of handlers.get('dd551SaveReview:click')||[])await handler();
  assert.equal(calls,1);
  assert.equal(events.some(event=>event.type==='dd:owner-review-recorded-554'),false);
  assert.equal(events.some(event=>event.type==='dd:owner-review-save-unconfirmed-554'),true);
  confirmed=true;prepare();
  for(const handler of handlers.get('dd551SaveReview:click')||[])await handler();
  assert.equal(calls,2);
  const saved=events.find(event=>event.type==='dd:owner-review-recorded-554');
  assert.equal(saved?.detail?.readbackConfirmed,true);
  assert.equal(saved?.detail?.reviewedAt,'2026-10-31T16:00:00Z');
});

test('Build 554 preserves read-only dashboard and exact release marker',()=>{
  const page=read('admin/system-operations/index.html'),client=read('public/js/admin-system-health-554.js');
  for(const id of ['dd554Guide','dd554ReloadShared','dd554Step1','dd554Step2','dd554Step3','dd554Step4','dd554RoutesStatus','dd554SharedStatus','dd554IncidentStatus'])assert.match(page,new RegExp(`id="${id}"`));
  assert.match(page,/Build (?:554|555)/);
  assert.match(page,/admin-system-health-554\.css\?v=554/);
  assert.match(page,/admin-system-health-554\.js\?v=554/);
  assert.match(page,/This guide never detects a second device/);
  assert.match(client,/dd:owner-review-recorded-554/);
  assert.doesNotMatch(client,/fetch\(|localStorage|sessionStorage|DELETE FROM|UPDATE runtime_incidents/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:554|555|556)/);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build554_owner_walkthrough_followup\.test\.mjs/);
});
