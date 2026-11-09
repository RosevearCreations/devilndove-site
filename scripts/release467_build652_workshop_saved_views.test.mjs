import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const id=n=>`11111111-1111-4111-8111-${String(n).padStart(12,'0')}`;
const now=()=>Date.now();
const day=n=>new Date(now()+n*86400000).toISOString().slice(0,10);
const checked=(n,values={})=>({id:id(n),title:`Copper project ${n}`,status:'follow_up',
  due:day(8),reviewCount:1,timeline:3,latest:'follow_up_scheduled',
  at:new Date(now()-86400000).toISOString(),checkedAt:now(),...values});
const makeState=(rows=[checked(1)],selected=id(1),owner=7)=>({owner,version:2,
  total:3,selected,scanning:false,checked:rows});
function fixture({initial=makeState(),savedStore}={}) {
  const element=()=>({value:'',disabled:false,textContent:'',innerHTML:'',events:{},
    children:[],addEventListener(type,fn){this.events[type]=fn;},
    dispatchEvent(e){this.events[e.type]?.();},appendChild(child){this.children.push(child);}});
  const names=['Views','Name','Save','Saved','Apply','Delete','Status','Priorities','Detail','Continue'];
  const els=Object.fromEntries([...names.map(x=>`dd652${x}`),'dd651Filter'].map(x=>[x,element()]));
  els.dd651Filter.value='all';
  let source=initial,notify;const selected=[],storage=savedStore||new Map(),requests=[];
  const win={sessionStorage:{getItem:k=>storage.get(k)||null,
    setItem:(k,v)=>{storage.set(k,v);}},DDAuth:{apiFetch:(...args)=>requests.push(args)},
    DD651Queue:{subscribe:fn=>{notify=fn;fn(source);},
      select:key=>{selected.push(key);source={...source,selected:key};notify(source);return true;}}};
  function Event(type){this.type=type;}
  runInNewContext(read('public/js/admin-workshop-saved-views-652.js'),{
    window:win,document:{getElementById:key=>els[key],createElement:()=>element()},
    Date,Math,JSON,Number,String,Object,Array,Set,RegExp,Event
  });
  const change=next=>{source=next;notify(next);};
  const save=(name,filter)=>{els.dd652Name.value=name;els.dd651Filter.value=filter;
    els.dd652Save.events.click();};
  const selectView=name=>{els.dd652Saved.value=name;els.dd652Saved.events.change();};
  return {els,storage,requests,selected,save,selectView,change,source:()=>source};
}

test('652 explains actionable priorities from checked dated evidence only',()=>{
  const rows=[checked(1,{status:'blocked',due:day(-3),latest:'needs_physical_count'}),
    checked(2,{due:day(9),at:new Date(now()-86400000*10).toISOString()}),
    checked(3,{reviewCount:0,at:null,latest:null})];
  const f=fixture({initial:makeState(rows)});
  const list=f.els.dd652Priorities.innerHTML;
  assert.match(list,/Saved plan is blocked/);
  assert.match(list,/3 day\(s\) overdue/);
  assert.match(list,/separate physical stock check/);
  assert.match(list,/10 day\(s\) old/);
  assert.match(list,/No dated owner decision was recorded/);
  assert.match(f.els.dd652Status.textContent,/Only 3 of 3|All currently loaded owner plans/);
  assert.equal(f.requests.length,0);
});

test('652 session-saved filter stores only allowed name/filter and applies on explicit click',()=>{
  const f=fixture();f.save('Due queue','due');
  const payload=f.storage.get('dnd652.owner-filter-views.v1.7');
  assert.ok(payload);
  assert.deepEqual(JSON.parse(payload),{version:1,views:[{name:'Due queue',filter:'due'}]});
  assert.doesNotMatch(payload,/Copper|11111111|follow_up|note|timeline/);
  f.selectView('Due queue');f.els.dd651Filter.value='all';f.els.dd652Apply.events.click();
  assert.equal(f.els.dd651Filter.value,'due');
  assert.match(f.els.dd652Status.textContent,/Applied session-saved filter/);
  assert.equal(f.requests.length,0);
});

test('652 saved filter restores for the same owner but never restores private queue data',()=>{
  const saved=new Map();const first=fixture({savedStore:saved});first.save('Aging plans','aging');
  const second=fixture({savedStore:saved,initial:makeState([],'')});
  second.selectView('Aging plans');
  assert.equal(second.els.dd652Apply.disabled,false);
  assert.match(second.els.dd652Priorities.innerHTML,/No plans deliberately checked yet/);
  assert.equal(second.requests.length,0);
});

test('652 rejects malformed view names, invalid filters, and more than five saved views',()=>{
  const f=fixture();f.save('<script>','due');
  assert.equal(f.storage.size,0);
  assert.match(f.els.dd652Status.textContent,/Use a 2–30 character/);
  for(let n=1;n<=5;n++)f.save(`View ${n}`,'all');
  f.save('Sixth','due');
  assert.match(f.els.dd652Status.textContent,/Five session-saved filters/);
  f.selectView('View 2');f.els.dd652Delete.events.click();
  const payload=JSON.parse(f.storage.get('dnd652.owner-filter-views.v1.7'));
  assert.equal(payload.views.length,4);
  assert.equal(payload.views.some(v=>v.name==='View 2'),false);
});

test('652 owner switching isolates saved views and clears old private explanations',()=>{
  const f=fixture();f.save('Owner seven','aging');
  f.change(makeState([checked(8)],id(8),8));
  assert.equal(f.els.dd652Saved.disabled,true);
  assert.doesNotMatch(f.els.dd652Priorities.innerHTML,/Copper project 1/);
  assert.match(f.els.dd652Priorities.innerHTML,/Copper project 8/);
  f.change(null);
  assert.equal(f.els.dd652Continue.disabled,true);
  assert.match(f.els.dd652Priorities.textContent,/No verified owner queue/);
  assert.equal(f.requests.length,0);
});

test('652 deliberate continue stays in verified Build 651 selection without saving anything',()=>{
  const f=fixture({initial:makeState([checked(1),checked(2)],id(1))});
  f.els.dd652Priorities.events.click({target:{closest:()=>({dataset:{dd652Plan:id(2)}})}});
  assert.deepEqual(f.selected,[id(2)]);
  assert.match(f.els.dd652Detail.textContent,/Copper project 2/);
  f.els.dd652Continue.events.click();
  assert.deepEqual(f.selected,[id(2),id(2)]);
  assert.equal(f.requests.length,0);
});

test('652 incomplete coverage is clearly stated and never ranks unseen owner plans',()=>{
  const f=fixture({initial:makeState([checked(1)],id(1))});
  assert.match(f.els.dd652Status.textContent,/Only 1 of 3 owner plans/);
  assert.match(f.els.dd652Status.textContent,/do not cover unscanned plans/);
  assert.equal((f.els.dd652Priorities.innerHTML.match(/data-dd652-plan=/g)||[]).length,1);
});

test('652 HTML, bridge and protected CI are wired with no automatic external writes',()=>{
  const htmlPage=read('admin/products/index.html');
  const js=read('public/js/admin-workshop-saved-views-652.js');
  const bridge=read('public/js/admin-workshop-review-queue-651.js');
  const workflow=read('.github/workflows/current-application-quality.yml');
  for(const name of ['Views','Heading','Name','Save','Saved','Apply','Delete',
    'Status','Priorities','Detail','Continue'])assert.match(htmlPage,new RegExp(`id="dd652${name}"`));
  assert.match(htmlPage,/admin-workshop-saved-views-652\.js\?v=652/);
  assert.match(workflow,/release467_build652_workshop_saved_views\.test\.mjs/);
  assert.match(bridge,/DD651Queue=\{snapshot,subscribe/);
  assert.match(js,/sessionStorage/);
  assert.doesNotMatch(js,/(?:apiFetch|fetch\(|XMLHttpRequest|method:['"]POST|localStorage|setInterval|setTimeout)/);
});
