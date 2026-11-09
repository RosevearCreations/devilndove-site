import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const id=n=>`11111111-1111-4111-8111-${String(n).padStart(12,'0')}`;
const row=(n,extra={})=>({id:id(n),title:`Owner work ${n}`,status:'follow_up',due:'2026-11-12',
  timeline:2,reviewCount:1,latest:'needs_workshop_review',at:'2026-11-08T09:00:00Z',
  checkedAt:Date.parse('2026-11-09T00:00:00Z'),...extra});
const state=(rows=[row(1)],selected=id(1),owner=7,version=3)=>({owner,version,total:4,
  checked:rows,selected,scanning:false});
function fixture({initial=state(),storage=new Map()}={}){
  const element=()=>({value:'',disabled:false,innerHTML:'',textContent:'',events:{},children:[],
    addEventListener(event,fn){this.events[event]=fn;},
    dispatchEvent(evt){this.events[evt.type]?.();},appendChild(el){this.children.push(el);}});
  const fields=['Bookmarks','Save','Saved','Remove','Clear','Trace','Continue','History',
    'Recover','Forget','Recovery','Status'];
  const els=Object.fromEntries([...fields.map(n=>`dd653${n}`),'dd651Filter','dd651History']
    .map(n=>[n,element()]));
  els.dd651Filter.value='all';
  const reads=[],selections=[],historyClicks=[];
  els.dd651History.click=()=>historyClicks.push('history');
  let snapshot=initial,notify;
  const win={sessionStorage:{getItem:k=>storage.get(k)||null,
    setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    DDAuth:{apiFetch:(...args)=>reads.push(args)},
    DD651Queue:{subscribe:fn=>{notify=fn;fn(snapshot);},select:key=>{
      if(!snapshot||snapshot.scanning||!snapshot.checked.some(x=>x.id===key))return false;
      selections.push(key);snapshot={...snapshot,selected:key};notify(snapshot);return true;}}};
  function Event(type){this.type=type;}
  runInNewContext(read('public/js/admin-workshop-bookmarks-653.js'),{
    window:win,document:{getElementById:key=>els[key],createElement:()=>element()},
    Date,JSON,Set,Map,Object,String,Event
  });
  const change=next=>{snapshot=next;notify(next);};
  const bookmark=(n)=>{els.dd653Save.events.click();els.dd653Saved.value=id(n);
    els.dd653Saved.events.change();};
  const choose=n=>{els.dd653Saved.value=id(n);els.dd653Saved.events.change();};
  const filter=value=>{els.dd651Filter.value=value;els.dd651Filter.events.change();};
  return {els,reads,selections,historyClicks,storage,change,bookmark,choose,filter};
}

test('653 bookmark is an explicitly selected, checked plan and remains volatile',()=>{
  const f=fixture();assert.equal(f.els.dd653Save.disabled,false);
  assert.equal(f.storage.size,0);f.bookmark(1);
  assert.match(f.els.dd653Trace.textContent,/Owner work 1/);
  assert.match(f.els.dd653Trace.textContent,/saved plan v3/);
  assert.match(f.els.dd653Trace.textContent,/timeline v2/);
  assert.equal(f.storage.size,0);assert.equal(f.reads.length,0);
});

test('653 continues a current bookmark only by existing Build 651 verification',()=>{
  const f=fixture();f.bookmark(1);f.els.dd653Continue.events.click();
  assert.deepEqual(f.selections,[id(1)]);
  assert.match(f.els.dd653Status.textContent,/No private history read/);
  f.els.dd653History.events.click();
  assert.deepEqual(f.selections,[id(1),id(1)]);
  assert.equal(f.historyClicks.length,1);
  assert.equal(f.reads.length,0);
});

test('653 plan or timeline drift disables bookmarks until explicit rebookmark',()=>{
  const f=fixture();f.bookmark(1);
  f.change(state([row(1,{timeline:3})]));
  assert.equal(f.els.dd653Continue.disabled,true);
  assert.match(f.els.dd653Trace.textContent,/HOLD — source not currently verified/);
  f.els.dd653History.events.click();assert.equal(f.historyClicks.length,0);
  f.els.dd653Save.events.click();f.choose(1);
  assert.equal(f.els.dd653Continue.disabled,false);
  f.change(state([row(1)],id(1),7,4));
  assert.equal(f.els.dd653Saved.disabled,true);
});

test('653 queue clearing hides stale private details and requires explicit rescan',()=>{
  const f=fixture();f.bookmark(1);
  f.change(state([],''));f.choose(1);
  assert.equal(f.els.dd653Continue.disabled,true);
  assert.doesNotMatch(f.els.dd653Trace.textContent,/Owner work 1/);
  assert.match(f.els.dd653Trace.textContent,/Manually rescan/);
  f.change(state([row(1)]));f.choose(1);
  assert.equal(f.els.dd653Continue.disabled,false);
});

test('653 owner changes erase all private bookmarks and isolate filter memory',()=>{
  const f=fixture();f.bookmark(1);f.filter('due');
  f.change(state([row(2)],id(2),8));
  assert.equal(f.els.dd653Saved.disabled,true);
  assert.doesNotMatch(f.els.dd653Trace.textContent,/Owner work 1/);
  assert.match(f.els.dd653Recovery.textContent,/No prior filter/);
  f.change(null);assert.equal(f.els.dd653Save.disabled,true);
  assert.equal(f.reads.length,0);
});

test('653 previous filter is stored without owner private data and recovered only by click',()=>{
  const storage=new Map(),first=fixture({storage});first.filter('aging');
  assert.deepEqual(JSON.parse(storage.get('dnd653.owner-filter-recovery.v1.7')),
    {version:1,filter:'aging'});
  const second=fixture({storage});
  assert.equal(second.els.dd651Filter.value,'all');
  assert.equal(second.els.dd653Recover.disabled,false);
  second.els.dd653Recover.events.click();
  assert.equal(second.els.dd651Filter.value,'aging');
  assert.equal(second.reads.length,0);
  second.els.dd653Forget.events.click();
  assert.equal(storage.size,0);
});

test('653 rejects altered filter recovery records and does not auto-apply them',()=>{
  const storage=new Map([['dnd653.owner-filter-recovery.v1.7',
    JSON.stringify({version:1,filter:'<script>',owner:7,plan:id(1)})]]);
  const f=fixture({storage});
  assert.equal(f.els.dd653Recover.disabled,true);
  assert.equal(f.els.dd651Filter.value,'all');
  assert.equal(f.reads.length,0);
});

test('653 supports at most five explicit owner bookmarks, remove and clear',()=>{
  const rows=[1,2,3,4,5,6].map(n=>row(n));
  const f=fixture({initial:state(rows)});
  for(let n=1;n<=5;n++){f.change(state(rows,id(n)));f.bookmark(n);}
  f.change(state(rows,id(6)));
  assert.equal(f.els.dd653Save.disabled,true);
  f.choose(3);f.els.dd653Remove.events.click();
  assert.equal(f.els.dd653Save.disabled,false);
  f.bookmark(6);f.els.dd653Clear.events.click();
  assert.equal(f.els.dd653Saved.disabled,true);
});

test('653 HTML, protected test, budget and unreferenced archive preserve safe boundaries',()=>{
  const html=read('admin/products/index.html'),js=read('public/js/admin-workshop-bookmarks-653.js');
  const workflow=read('.github/workflows/current-application-quality.yml');
  for(const n of ['Bookmarks','Heading','Save','Saved','Remove','Clear','Trace','Continue',
    'History','Recover','Forget','Recovery','Status'])
    assert.match(html,new RegExp(`id="dd653${n}"`));
  assert.match(html,/admin-workshop-bookmarks-653\.js\?v=653/);
  assert.match(workflow,/release467_build653_workshop_bookmarks\.test\.mjs/);
  assert.doesNotMatch(js,/(?:apiFetch|fetch\(|XMLHttpRequest|method:['"]POST|localStorage|setInterval|setTimeout)/);
  const archived=read('docs/operations/historical/RETIRED_UNREFERENCED_ADMIN_CATALOG_OPTIONS.js.txt');
  assert.match(archived,/Build 197/);
});
