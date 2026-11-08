import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const PLAN='11111111-1111-4111-8111-111111111111';
const eventId=i=>`22222222-2222-4222-8222-${String(i).padStart(12,'0')}`;
const categories=['needs_physical_count','needs_supplier_review','needs_workshop_review',
  'follow_up_scheduled','no_change_recommended','separate_action_recommended'];
const today=()=>new Date().toISOString();
const record=(i,category='needs_workshop_review')=>({event_id:eventId(i),
  recorded_at:new Date(Date.now()-i*3600000).toISOString(),outcome:category,
  note:`Workshop factual note ${i}`,plan_version:2,status_at_review:'follow_up',
  follow_up_on_at_review:'2026-11-19'});
function response(events,{all=events,cursor=null}={}) {
  const counts=Object.fromEntries(categories.map(x=>[x,0]));
  for(const e of all)counts[e.outcome]++;
  return {build:643,ok:true,owner_user_id:7,plan_id:PLAN,plan_version:2,
    timeline_version:all.length?3:0,events,next_cursor:cursor,
    matched_total:all.length,search:{q:'',outcome:''},private:true,
    read_only:true,automatic:false,inventory_mutation:false,summary:{
      review_count:all.length,outcome_counts:counts,latest_outcome:all[0]?.outcome||null,
      latest_review_at:all[0]?.recorded_at||null,plan_status:'follow_up',
      plan_follow_up_on:'2026-11-19',advisory_only:true,
      inventory_mutation:false,order_mutation:false}};
}
const settle=async()=>{await new Promise(setImmediate);await new Promise(setImmediate);};
function fixture(replies=[]) {
  const element=()=>({value:'',disabled:false,textContent:'',innerHTML:'',children:[],
    events:{},addEventListener(k,fn){this.events[k]=fn;},appendChild(el){this.children.push(el);}});
  const ids=['Review','Plan','Refresh','Clear','Status','Summary','Freshness','Guidance','Reopen']
    .map(x=>`dd650${x}`);
  const els=Object.fromEntries(ids.map(id=>[id,element()]));
  let snapshot={loaded:true,owner_user_id:7,version:2,plans:[
    {plan_id:PLAN,title:'Copper bench follow-up',status:'follow_up',follow_up_on:'2026-11-19'}]};
  let notify; const calls=[],reopened=[];const queue=[...replies];
  const win={DDAuth:{apiFetch:async(url,init)=>{
    calls.push({url,init});const item=await queue.shift();
    if(item instanceof Error)throw item;
    return {ok:!item?.error,json:async()=>item};
  }},DD641OwnerPlans:{subscribe:fn=>{notify=fn;fn(snapshot);},snapshot:()=>snapshot,
    reopen:id=>{reopened.push(id);return true;}}};
  runInNewContext(read('public/js/admin-workshop-decision-summary-650.js'),{
    document:{getElementById:id=>els[id],createElement:()=>element()},window:win,
    Date,Math,JSON,Number,String,Object,Set,Array,RegExp
  });
  const select=()=>{els.dd650Plan.value=PLAN;els.dd650Plan.events.change();};
  const review=async()=>{els.dd650Refresh.events.click();await settle();};
  const change=next=>{snapshot=next;notify(next);};
  return {els,calls,reopened,select,review,change,push:item=>queue.push(item),snapshot};
}

test('650 does no background reading; explicit owner review summarizes real bounded dated counts',async()=>{
  const events=[record(1,'needs_physical_count'),record(2)];
  const f=fixture([response(events)]);
  assert.equal(f.calls.length,0);
  assert.equal(f.els.dd650Refresh.disabled,true);
  f.select();await f.review();
  assert.equal(f.calls.length,1);
  assert.equal(f.calls[0].url,`/api/admin/owner-restock-review-notes?plan_id=${PLAN}`);
  assert.deepEqual(Object.values(f.calls[0].init),['GET','no-store']);
  assert.match(f.els.dd650Summary.textContent,/2 recorded review/);
  assert.match(f.els.dd650Summary.textContent,/Physical count needed: 1/);
  assert.match(f.els.dd650Summary.textContent,/latest: Physical count needed/);
  assert.match(f.els.dd650Freshness.textContent,/Checked at .*one manual read/);
  assert.match(f.els.dd650Guidance.textContent,/most recent recorded outcomes differ/);
  assert.equal(f.els.dd650Reopen.disabled,false);
  assert.ok(f.calls.every(({init})=>init.method==='GET'));
});

test('650 makes limited history coverage explicit and never exposes private note bodies',async()=>{
  const all=Array.from({length:11},(_,i)=>record(i+1));
  all[0].note='private <script>alert(1)</script>';
  const f=fixture([response(all.slice(0,10),{all,cursor:all[9].event_id})]);
  f.select();await f.review();
  assert.match(f.els.dd650Summary.textContent,/older private notes are not included/);
  for(const key of ['Summary','Freshness','Guidance'])
    assert.doesNotMatch(f.els[`dd650${key}`].textContent,/private <script>/);
  assert.equal(f.calls.length,1);
});

test('650 no-event plan remains advisory and has no implied completion',async()=>{
  const f=fixture([response([])]);f.select();await f.review();
  assert.match(f.els.dd650Summary.textContent,/No saved dated decision/);
  assert.match(f.els.dd650Guidance.textContent,/separate dated-review editor/);
  assert.match(f.els.dd650Freshness.textContent,/No saved review date exists/);
  assert.doesNotMatch(f.els.dd650Status.textContent,/HOLD/);
});

test('650 rejects malformed totals, mismatched owners and stale saved-plan source',async()=>{
  const good=response([record(1)]),wrong=response([record(1)]),bad=response([record(1)]);
  wrong.owner_user_id=8;bad.summary.outcome_counts.needs_workshop_review=2;
  const f=fixture([wrong,bad,good]);f.select();await f.review();
  assert.match(f.els.dd650Status.textContent,/HOLD/);
  assert.equal(f.els.dd650Reopen.disabled,true);
  await f.review();assert.match(f.els.dd650Status.textContent,/HOLD/);
  await f.review();assert.equal(f.els.dd650Reopen.disabled,false);
  f.change({...f.snapshot,version:3});
  assert.equal(f.els.dd650Summary.textContent,'No current, verified owner decision summary.');
  assert.equal(f.els.dd650Reopen.disabled,true);
});

test('650 never displays an owner-changed response after an in-flight request',async()=>{
  let done;const pending=new Promise(resolve=>{done=resolve;});
  const f=fixture([pending]);f.select();f.els.dd650Refresh.events.click();
  f.change({...f.snapshot,owner_user_id:8});
  done(response([record(1)]));await settle();
  assert.equal(f.els.dd650Reopen.disabled,true);
  assert.equal(f.els.dd650Summary.textContent,'No current, verified owner decision summary.');
});

test('650 manual reopening and explicit refresh never auto-save or mutate stock',async()=>{
  const events=[record(1)];const f=fixture([response(events),response(events)]);
  f.select();await f.review();f.els.dd650Reopen.events.click();
  assert.deepEqual(f.reopened,[PLAN]);
  assert.match(f.els.dd650Status.textContent,/separate deliberate Save/);
  await f.review();assert.equal(f.calls.length,2);
  f.els.dd650Clear.events.click();assert.equal(f.els.dd650Reopen.disabled,true);
  assert.equal(f.calls.every(c=>c.init.method==='GET'),true);
});

test('650 DOM, protected quality CI, source budgets and safe retirement are wired',()=>{
  const html=read('admin/products/index.html');
  const js=read('public/js/admin-workshop-decision-summary-650.js');
  const workflow=read('.github/workflows/current-application-quality.yml');
  for(const id of ['Review','Heading','Plan','Refresh','Clear','Status','Summary',
    'Freshness','Guidance','Reopen']) assert.match(html,new RegExp(`id="dd650${id}"`));
  assert.match(html,/admin-workshop-decision-summary-650\.js\?v=650/);
  assert.match(workflow,/release467_build650_workshop_decision_summary\.test\.mjs/);
  assert.match(js,/DD641OwnerPlans\.reopen/);
  assert.match(js,/owner-restock-review-notes/);
  assert.doesNotMatch(js,/(?:method:['"]POST|localStorage|sessionStorage|setInterval|setTimeout|XMLHttpRequest)/);
  assert.equal(existsSync(new URL('../public/js/admin-product-price-suggestions.js',import.meta.url)),false);
  assert.equal(existsSync(new URL('../docs/operations/historical/RETIRED_UNREFERENCED_PRODUCT_PRICE_SUGGESTIONS.js.txt',import.meta.url)),true);
  assert.doesNotMatch(html,/admin-product-price-suggestions\.js/);
});
