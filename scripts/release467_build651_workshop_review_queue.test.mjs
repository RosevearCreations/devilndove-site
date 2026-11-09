import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const uuid=i=>`11111111-1111-4111-8111-${String(i).padStart(12,'0')}`;
const eventId=i=>`22222222-2222-4222-8222-${String(i).padStart(12,'0')}`;
const keys=['needs_physical_count','needs_supplier_review','needs_workshop_review',
  'follow_up_scheduled','no_change_recommended','separate_action_recommended'];
const dateIn=days=>new Date(Date.now()+days*86400000).toISOString().slice(0,10);
const note=(i,{days=1,category='needs_workshop_review'}={})=>({
  event_id:eventId(i),recorded_at:new Date(Date.now()-days*86400000).toISOString(),
  outcome:category,note:`Factual private bench review ${i}`,
  plan_version:2,status_at_review:'follow_up',follow_up_on_at_review:dateIn(5)});
const plan=(i,props={})=>({plan_id:uuid(i),title:`Copper bench ${i}`,
  status:'follow_up',follow_up_on:dateIn(5),...props});
function reply(p,events=[note(1)],options={}){
  const counts=Object.fromEntries(keys.map(k=>[k,0]));
  for(const e of events)counts[e.outcome]++;
  return {build:643,ok:true,owner_user_id:7,plan_id:p.plan_id,plan_version:2,
    timeline_version:events.length?3:0,events,next_cursor:null,
    matched_total:events.length,search:{q:'',outcome:''},private:true,
    read_only:true,automatic:false,inventory_mutation:false,summary:{
      review_count:events.length,outcome_counts:counts,
      latest_outcome:events[0]?.outcome||null,latest_review_at:events[0]?.recorded_at||null,
      plan_status:p.status,plan_follow_up_on:p.follow_up_on,
      advisory_only:true,inventory_mutation:false,order_mutation:false},...options};
}
const settle=async()=>{for(let i=0;i<4;i++)await new Promise(setImmediate);};
function fixture({plans=[plan(1)],buildReply=p=>reply(p),request}={}){
  const elem=()=>({value:'',disabled:false,textContent:'',innerHTML:'',open:false,
    options:[],events:{},addEventListener(k,fn){this.events[k]=fn;},
    dispatchEvent(e){this.events[e.type]?.();}});
  const ids=['Queue','Scan','Restart','Clear','Filter','Status','Coverage','Rows',
    'Selection','History','Reopen','Prepare','Preview','Copy'].map(id=>`dd651${id}`);
  const els=Object.fromEntries([...ids,'dd649Plan','dd649History'].map(id=>[id,elem()]));
  els.dd651Filter.value='all';els.dd649Plan.options=plans.map(p=>({value:p.plan_id}));
  let snapshot={loaded:true,owner_user_id:7,version:2,plans},subscription;
  const calls=[],reopened=[],copied=[];
  const win={navigator:{clipboard:{writeText:async text=>copied.push(text)}},
    DDAuth:{apiFetch:async(url,init)=>{
      calls.push({url,init});const match=plans.find(p=>url.includes(p.plan_id));
      const body=await (request?request(match,url):buildReply(match));
      if(body instanceof Error)throw body;
      return {ok:!body?.error,json:async()=>body};
    }},DD641OwnerPlans:{subscribe:fn=>{subscription=fn;fn(snapshot);},
      snapshot:()=>snapshot,reopen:id=>{reopened.push(id);return true;}}};
  function Event(type){this.type=type;}
  runInNewContext(read('public/js/admin-workshop-review-queue-651.js'),{
    window:win,document:{getElementById:id=>els[id]},Event,Date,Math,JSON,
    Number,String,Object,Array,Set,RegExp
  });
  const scan=async(restart=false)=>{els[restart?'dd651Restart':'dd651Scan'].events.click();await settle();};
  const filter=value=>{els.dd651Filter.value=value;els.dd651Filter.events.change();};
  const choose=id=>{els.dd651Rows.events.click({target:{closest:()=>({dataset:{dd651Plan:id}})}});};
  const change=next=>{snapshot=next;subscription(next);};
  return {els,calls,reopened,copied,scan,filter,choose,change,plans,snapshot,win};
}

test('651 reads no private plans on mount; explicitly scans up to five, sequentially',async()=>{
  const p=Array.from({length:8},(_,i)=>plan(i+1));const f=fixture({plans:p});
  assert.equal(f.calls.length,0);
  await f.scan();assert.equal(f.calls.length,5);
  assert.match(f.els.dd651Coverage.textContent,/5 of 8 saved owner plans checked/);
  assert.match(f.els.dd651Coverage.textContent,/Unscanned plans may also match/);
  await f.scan();assert.equal(f.calls.length,8);
  assert.match(f.els.dd651Coverage.textContent,/8 of 8 saved owner plans checked/);
  assert.equal(f.els.dd651Scan.disabled,true);
  assert.ok(f.calls.every(c=>c.init.method==='GET'&&c.init.cache==='no-store'));
});

test('651 filters only checked records by aging, missing reviews, overdue and recorded attention',async()=>{
  const p=[plan(1,{status:'blocked',follow_up_on:dateIn(-2)}),
    plan(2,{follow_up_on:dateIn(2)}),plan(3,{follow_up_on:''})];
  const f=fixture({plans:p,buildReply:rec=>rec.plan_id===uuid(1)?
    reply(rec,[note(1,{days:10,category:'needs_physical_count'})]):
    rec.plan_id===uuid(2)?reply(rec,[note(2,{days:1,category:'follow_up_scheduled'})]):
    reply(rec,[])});
  await f.scan();
  f.filter('aging');assert.match(f.els.dd651Rows.innerHTML,/Copper bench 1/);
  assert.doesNotMatch(f.els.dd651Rows.innerHTML,/Copper bench 2/);
  f.filter('unreviewed');assert.match(f.els.dd651Rows.innerHTML,/Copper bench 3/);
  f.filter('due');assert.match(f.els.dd651Rows.innerHTML,/2 day\(s\) overdue/);
  f.filter('attention');assert.match(f.els.dd651Rows.innerHTML,/Physical count needed/);
  f.filter('recent');assert.match(f.els.dd651Rows.innerHTML,/Follow-up scheduled/);
});

test('651 manual handoff does not expose private note bodies or save a status',async()=>{
  const p=[plan(1)];const f=fixture({plans:p,buildReply:rec=>reply(rec,[
    {...note(1),note:'Private workbench <img src=x onerror=alert(1)> note'}])});
  await f.scan();f.choose(uuid(1));
  assert.equal(f.els.dd651Prepare.disabled,false);
  f.els.dd651Prepare.events.click();
  assert.match(f.els.dd651Preview.value,/PRIVATE OWNER FOLLOW-UP HANDOFF \(UNSIGNED\)/);
  assert.match(f.els.dd651Preview.value,/OWNER PLANNING ONLY/);
  assert.doesNotMatch(f.els.dd651Preview.value,/Private workbench/);
  await f.els.dd651Copy.events.click();
  assert.deepEqual(f.copied,[f.els.dd651Preview.value]);
  f.els.dd651Reopen.events.click();assert.deepEqual(f.reopened,[uuid(1)]);
  assert.match(f.els.dd651Status.textContent,/separately Save/);
  assert.equal(f.calls.length,1);
});

test('651 opens matching Build 649 plan selection but never triggers a history GET',async()=>{
  const f=fixture();await f.scan();f.choose(uuid(1));
  f.els.dd651History.events.click();
  assert.equal(f.els.dd649Plan.value,uuid(1));
  assert.equal(f.els.dd649History.open,true);
  assert.equal(f.calls.length,1);
  assert.match(f.els.dd651Status.textContent,/no automatic history request/);
});

test('651 invalid reply discards complete batch and never retains partial private facts',async()=>{
  const p=[plan(1),plan(2)];const f=fixture({plans:p,buildReply:rec=>{
    const data=reply(rec);if(rec.plan_id===uuid(2))data.owner_user_id=999;
    return data;
  }});
  await f.scan();
  assert.equal(f.calls.length,2);
  assert.match(f.els.dd651Status.textContent,/HOLD/);
  assert.match(f.els.dd651Coverage.textContent,/0 of 2/);
  assert.equal(f.els.dd651Prepare.disabled,true);
});

test('651 owner switch during a pending scan discards responses and handoff',async()=>{
  let release;const pending=new Promise(done=>{release=done;});
  const f=fixture({request:()=>pending});f.els.dd651Scan.events.click();
  f.change({...f.snapshot,owner_user_id:8});
  release(reply(f.plans[0]));await settle();
  assert.match(f.els.dd651Coverage.textContent,/0 of 1/);
  assert.equal(f.els.dd651Prepare.disabled,true);
  assert.equal(f.els.dd651Preview.value,'');
});

test('651 restart invalidates previous drafts and scans from first plan again',async()=>{
  const f=fixture();await f.scan();f.choose(uuid(1));f.els.dd651Prepare.events.click();
  assert.notEqual(f.els.dd651Preview.value,'');
  await f.scan(true);
  assert.equal(f.calls.length,2);
  assert.equal(f.els.dd651Preview.value,'');
  assert.equal(f.els.dd651Copy.disabled,true);
});

test('651 publishes a safe scoped read-only checked-queue bridge for Build 652',async()=>{
  const f=fixture();
  assert.equal(f.win.DD651Queue.snapshot().checked.length,0);
  await f.scan();
  const evidence=f.win.DD651Queue.snapshot();
  assert.equal(evidence.owner,7);
  assert.equal(evidence.checked.length,1);
  assert.equal(evidence.checked[0].id,uuid(1));
  assert.equal(Object.hasOwn(evidence.checked[0],'note'),false);
  assert.equal(f.win.DD651Queue.select(uuid(1)),true);
  assert.equal(f.win.DD651Queue.snapshot().selected,uuid(1));
  f.change({...f.snapshot,owner_user_id:8});
  assert.equal(f.win.DD651Queue.snapshot()?.checked.length,0);
});

test('651 HTML/CI wire up only safe read paths and preserve two historical scripts',()=>{
  const html=read('admin/products/index.html');
  const js=read('public/js/admin-workshop-review-queue-651.js');
  const workflow=read('.github/workflows/current-application-quality.yml');
  for(const name of ['Queue','Heading','Scan','Restart','Clear','Filter','Status',
    'Coverage','Rows','Selection','History','Reopen','Prepare','Preview','Copy'])
    assert.match(html,new RegExp(`id="dd651${name}"`));
  assert.match(html,/admin-workshop-review-queue-651\.js\?v=651/);
  assert.match(workflow,/release467_build651_workshop_review_queue\.test\.mjs/);
  assert.match(js,/DD641OwnerPlans\.reopen/);
  assert.match(js,/owner-restock-review-notes/);
  assert.doesNotMatch(js,/(?:method:['"]POST|localStorage|sessionStorage|setInterval|setTimeout|XMLHttpRequest)/);
  for(const name of ['admin-product-story-notes','admin-product-bulk-tools'])
    assert.equal(existsSync(new URL(`../public/js/${name}.js`,import.meta.url)),false);
  for(const name of ['STORY_NOTES','BULK_TOOLS'])
    assert.equal(existsSync(new URL(`../docs/operations/historical/RETIRED_UNREFERENCED_PRODUCT_${name}.js.txt`,import.meta.url)),true);
});
