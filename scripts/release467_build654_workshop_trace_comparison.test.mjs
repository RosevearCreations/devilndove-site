import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const id=n=>`11111111-1111-4111-8111-${String(n).padStart(12,'0')}`;
const row=(n,fields={})=>({id:id(n),title:`Gold workshop ${n}`,status:'follow_up',due:'2026-11-18',
  reviewCount:2,timeline:4,latest:'needs_workshop_review',at:new Date(Date.now()-86400000).toISOString(),
  checkedAt:Date.now(),...fields});
const state=(rows=[row(1)],selected=id(1),owner=7,version=3)=>({owner,version,
  total:3,checked:rows,selected,scanning:false});
function fixture({initial=state()}={}){
  const element=()=>({value:'',disabled:false,innerHTML:'',textContent:'',children:[],events:{},
    addEventListener(type,fn){this.events[type]=fn;},
    dispatchEvent(evt){this.events[evt.type]?.();},appendChild(x){this.children.push(x);}});
  const ids=[...['Bookmarks','Save','Saved','Remove','Clear','Trace','Continue','History',
    'Recover','Forget','Recovery','Status'].map(x=>`dd653${x}`),
    ...['Review','Heading','Comparison','Freshness','Prepare','Copy','Preview','History'].map(x=>`dd654${x}`),
    'dd651Filter','dd651History'];
  const els=Object.fromEntries(ids.map(x=>[x,element()]));els.dd651Filter.value='all';
  const requests=[],selected=[],histories=[],copied=[];let source=initial,notify;
  els.dd651History.click=()=>histories.push('open-original-selector');
  els.dd653History.click=()=>els.dd653History.events.click();
  const win={sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
    navigator:{clipboard:{writeText:async x=>{copied.push(x);}}},
    DDAuth:{apiFetch:(...a)=>requests.push(a)},DD651Queue:{subscribe:fn=>{
      notify=fn;fn(source);},select:key=>{if(!source?.checked.some(r=>r.id===key))return false;
      selected.push(key);source={...source,selected:key};notify(source);return true;}}};
  function Event(type){this.type=type;}
  runInNewContext(read('public/js/admin-workshop-bookmarks-653.js'),{
    window:win,document:{getElementById:key=>els[key],createElement:()=>element()},
    Date,JSON,Set,Map,Object,String,Event
  });
  return {els,requests,selected,histories,copied,
    bookmark:()=>{els.dd653Save.events.click();els.dd653Saved.value=id(1);
      els.dd653Saved.events.change();},
    change:next=>{source=next;notify(next);}};
}

test('654 fresh bookmark compares saved and manually checked source side by side',()=>{
  const f=fixture();f.bookmark();
  assert.match(f.els.dd654Comparison.textContent,/Bookmark: plan v3/);
  assert.match(f.els.dd654Comparison.textContent,/Checked: plan v3/);
  assert.match(f.els.dd654Freshness.textContent,/MATCH/);
  assert.equal(f.els.dd654Prepare.disabled,false);
  assert.equal(f.els.dd654History.disabled,false);
  assert.equal(f.els.dd654Copy.disabled,true);
  assert.equal(f.requests.length,0);
});

test('654 changed decision timeline explains HOLD and blocks stale handoff',()=>{
  const f=fixture();f.bookmark();f.els.dd654Prepare.events.click();
  assert.match(f.els.dd654Preview.value,/UNSIGNED MANUAL OWNER REVIEW/);
  f.change(state([row(1,{timeline:5})]));
  assert.match(f.els.dd654Freshness.textContent,/Decision timeline changed/);
  assert.equal(f.els.dd654Prepare.disabled,true);
  assert.equal(f.els.dd654Copy.disabled,true);
  assert.equal(f.els.dd654Preview.value,'');
  f.els.dd654History.events.click();assert.equal(f.histories.length,0);
});

test('654 due/status and outcome drift show precise reasons without any source write',()=>{
  const f=fixture();f.bookmark();
  f.change(state([row(1,{due:'2026-11-20',status:'blocked',latest:'needs_supplier_review'})]));
  assert.match(f.els.dd654Freshness.textContent,/Latest outcome changed/);
  assert.match(f.els.dd654Freshness.textContent,/Status\/date changed/);
  assert.equal(f.els.dd654Prepare.disabled,true);assert.equal(f.requests.length,0);
});

test('654 unscanned or aged source never becomes a verified handoff',()=>{
  const f=fixture();f.bookmark();
  f.change(state([],''));
  assert.match(f.els.dd654Freshness.textContent,/Plan not in current scan/);
  assert.doesNotMatch(f.els.dd654Comparison.textContent,/Gold workshop/);
  assert.equal(f.els.dd654History.disabled,true);
  f.change(state([row(1,{checkedAt:Date.now()-9*86400000})]));
  assert.match(f.els.dd654Freshness.textContent,/older than seven days/);
  assert.equal(f.els.dd654Prepare.disabled,true);
});

test('654 only an explicit fresh handoff chooses original history, with no GET',()=>{
  const f=fixture();f.bookmark();f.els.dd654History.events.click();
  assert.deepEqual(f.selected,[id(1)]);
  assert.deepEqual(f.histories,['open-original-selector']);
  assert.match(f.els.dd654Freshness.textContent,/Click Load in history/);
  assert.equal(f.requests.length,0);
});

test('654 unsigned handoff prepares locally and copies only after owner click',async()=>{
  const f=fixture();f.bookmark();assert.equal(f.copied.length,0);
  f.els.dd654Prepare.events.click();
  assert.match(f.els.dd654Preview.value,/Shell: devilndove/);
  assert.match(f.els.dd654Preview.value,/Unsigned planning only/);
  assert.doesNotMatch(f.els.dd654Preview.value,/private note body|provider token/);
  await f.els.dd654Copy.events.click();
  assert.equal(f.copied.length,1);
  assert.equal(f.requests.length,0);
});

test('654 owner/source changes clear private bookmark and prepared handoff',()=>{
  const f=fixture();f.bookmark();f.els.dd654Prepare.events.click();
  f.change(state([row(2)],id(2),8));
  assert.equal(f.els.dd654Preview.value,'');
  assert.equal(f.els.dd654Copy.disabled,true);
  assert.doesNotMatch(f.els.dd654Comparison.textContent,/Gold workshop 1/);
});

test('654 DOM, current CI, source budget and Master Shell integration HOLD are explicit',()=>{
  const html=read('admin/products/index.html'),js=read('public/js/admin-workshop-bookmarks-653.js');
  const workflow=read('.github/workflows/current-application-quality.yml');
  for(const name of ['Review','Heading','Comparison','Freshness','Prepare','Copy','Preview','History'])
    assert.match(html,new RegExp(`id="dd654${name}"`));
  assert.match(html,/admin-workshop-bookmarks-653\.js\?v=654/);
  assert.match(workflow,/release467_build654_workshop_trace_comparison\.test\.mjs/);
  assert.doesNotMatch(js,/(?:apiFetch|fetch\(|XMLHttpRequest|method:['"]POST|localStorage|setInterval|setTimeout)/);
  const handler=read('functions/api/_lib/ql336-owned-shell.mjs');
  const manifest=JSON.parse(read('.well-known/rosevear-integration-manifest.json'));
  assert.equal(manifest.source_id,'devilndove');
  assert.equal(manifest.connection_state,'DISCONNECTED / HOLD');
  assert.match(handler,/HOLD_ORIGINAL_SIGNER_CHILD_ISOLATION_AND_TEST_APPROVAL/);
  const sysGate=read('.github/workflows/system-gate.yml');
  assert.match(sysGate,/node --check public\/js\/admin-it-control-tower\.js/);
  assert.doesNotMatch(sysGate,/node --check public\/js\/admin-it-platform\.js/);
  assert.match(read('docs/operations/historical/RETIRED_UNREFERENCED_ADMIN_IT_PLATFORM.js.txt'),/Release 466 Build 4/);
});
