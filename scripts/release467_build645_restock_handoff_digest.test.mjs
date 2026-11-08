import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const uuid=i=>`aaaaaaaa-aaaa-4aaa-8aaa-${String(i).padStart(12,'0')}`;
const PLAN='11111111-1111-4111-8111-111111111111';
const outcomes=['needs_physical_count','needs_supplier_review','needs_workshop_review',
  'follow_up_scheduled','no_change_recommended','separate_action_recommended'];
function setup(){
  const ids=['dd645Handoff','dd645Choices','dd645Status','dd645IncludeNotes','dd645Prepare',
    'dd645Copy','dd645Download','dd645Clear','dd645Preview','dd643Plan'];
  const element=()=>({disabled:false,checked:false,value:'',textContent:'',innerHTML:'',events:{},
    addEventListener(type,fn){this.events[type]=fn;}});
  const els=Object.fromEntries(ids.map(id=>[id,element()]));els.dd643Plan.value=PLAN;
  const calls=[];const win={DD641OwnerPlans:{subscribe:fn=>{calls.push(fn);fn({loaded:true,owner_user_id:7,
    version:2,plans:[{plan_id:PLAN,title:'Copper <wire> restock'}]});}},
    navigator:{clipboard:{writeText:async text=>{win.copied=text;}}}};
  runInNewContext(source('public/js/admin-owner-restock-digest-645.js'),{
    window:win,document:{getElementById:id=>els[id]},Date,Set,Object,Number,String,JSON,RegExp,Blob,
  });
  const event=(i,note)=>({event_id:uuid(i),recorded_at:'2026-11-08T12:00:00Z',
    outcome:outcomes[i%6],note,plan_version:2,status_at_review:'follow_up',
    follow_up_on_at_review:'2026-11-15'});
  const snapshot=(events=[event(1,'Review supplier invoice and physical count')],extra={})=>({
    ready:true,private:true,read_only:true,owner_user_id:7,plan_id:PLAN,
    plan_version:2,timeline_version:3,matched_total:events.length,events,complete:true,
    verified_at:'2026-11-08T12:30:00Z',search:{q:'',outcome:''},summary:{advisory_only:true,
      inventory_mutation:false,review_count:5,outcome_counts:Object.fromEntries(outcomes.map(o=>[o,1])),
      plan_status:'follow_up',plan_follow_up_on:'2026-11-15'},...extra});
  const change=(id,checked)=>els.dd645Choices.events.change({target:{checked,
    getAttribute:name=>name==='data-dd645-event-id'?id:null}});
  return {els,win,snapshot,event,change,plans:calls[0]};
}

test('645 handoff remains blank until a verified owner search and deliberate selection',()=>{
  const h=setup();assert.equal(h.els.dd645Prepare.disabled,true);
  assert.equal(h.els.dd645Copy.disabled,true);assert.equal(h.els.dd645Download.disabled,true);
  h.win.DD645RestockDigest.receive(h.snapshot());
  assert.equal(h.els.dd645Prepare.disabled,true);
  assert.match(h.els.dd645Choices.innerHTML,/Supplier review needed/);
  h.change(uuid(1),true);assert.equal(h.els.dd645Prepare.disabled,false);
  assert.equal(h.els.dd645Copy.disabled,true);
  h.els.dd645Prepare.events.click();assert.equal(h.els.dd645Copy.disabled,false);
  assert.match(h.els.dd645Preview.value,/PRIVATE OWNER RESTOCK REVIEW HANDOFF/);
  assert.match(h.els.dd645Preview.value,/Private note withheld/);
  assert.doesNotMatch(h.els.dd645Preview.value,/Review supplier invoice/);
  assert.match(h.els.dd645Preview.value,/No physical count, stock receipt, supplier order/);
});

test('645 owner must opt into private note bodies, then explicitly prepare again',async()=>{
  const h=setup();h.win.DD645RestockDigest.receive(h.snapshot());h.change(uuid(1),true);
  h.els.dd645IncludeNotes.checked=true;h.els.dd645IncludeNotes.events.change();
  assert.equal(h.els.dd645Copy.disabled,true);
  h.els.dd645Prepare.events.click();
  assert.match(h.els.dd645Preview.value,/Private review note: Review supplier invoice and physical count/);
  await h.els.dd645Copy.events.click();
  assert.equal(h.win.copied,h.els.dd645Preview.value);
  h.els.dd645Clear.events.click();assert.equal(h.els.dd645Preview.value,'');
  assert.equal(h.els.dd645IncludeNotes.checked,false);assert.equal(h.els.dd645Prepare.disabled,true);
});

test('645 invalidates old decisions on search change, plan refresh or mismatch',()=>{
  const h=setup();h.win.DD645RestockDigest.receive(h.snapshot());h.change(uuid(1),true);
  const newSearch=h.snapshot([h.event(2,'Count remains unverified')],{search:{q:'count',outcome:''}});
  h.win.DD645RestockDigest.receive(newSearch);
  assert.equal(h.els.dd645Prepare.disabled,true);
  h.change(uuid(2),true);h.els.dd645Prepare.events.click();
  assert.ok(h.els.dd645Preview.value);
  h.win.DD645RestockDigest.receive(h.snapshot([],{owner_user_id:99,matched_total:0}));
  assert.equal(h.els.dd645Preview.value,'');assert.equal(h.els.dd645Copy.disabled,true);
  h.win.DD645RestockDigest.receive(h.snapshot());
  h.plans({loaded:true,owner_user_id:7,version:3,plans:[{plan_id:PLAN,title:'Copper'}]});
  assert.equal(h.els.dd645Prepare.disabled,true);
  assert.match(h.els.dd645Status.textContent,/changed/);
});

test('645 escaped chooser, bounded unique events and safe paged selection',()=>{
  const h=setup();const bad=h.event(4,'<img src=x onerror=alert(1)>');
  h.win.DD645RestockDigest.receive(h.snapshot([bad]));
  assert.match(h.els.dd645Choices.innerHTML,/&lt;img/);
  assert.doesNotMatch(h.els.dd645Choices.innerHTML,/<img/);
  h.change(uuid(4),true);
  h.win.DD645RestockDigest.receive(h.snapshot([bad,h.event(5,'Count pending')],{
    matched_total:3,complete:false}));
  assert.equal(h.els.dd645Prepare.disabled,false);
  assert.match(h.els.dd645Status.textContent,/Load next matching 10/);
  h.win.DD645RestockDigest.receive(h.snapshot([bad,bad]));
  assert.equal(h.els.dd645Prepare.disabled,true);
});

test('645 UI and CI expose no automatic database, external messaging or provider writes',()=>{
  const html=source('admin/products/index.html');
  const js=source('public/js/admin-owner-restock-digest-645.js');
  const search=source('public/js/admin-owner-restock-search-644.js');
  const workflow=source('.github/workflows/current-application-quality.yml');
  for(const id of ['dd645Handoff','dd645Heading','dd645Choices','dd645Status','dd645IncludeNotes',
    'dd645Prepare','dd645Copy','dd645Download','dd645Clear','dd645Preview'])
    assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/admin-owner-restock-digest-645\.js\?v=645/);
  assert.match(workflow,/release467_build645_restock_handoff_digest\.test\.mjs/);
  assert.match(search,/DD645RestockDigest\?\.receive/);
  assert.match(search,/DD645RestockDigest\?\.invalidate/);
  assert.doesNotMatch(js,/apiFetch|fetch\(|localStorage|sessionStorage|setInterval|setTimeout|XMLHttpRequest|method:'POST'/);
  assert.match(html,/readonly placeholder="Choose dated reviews/);
});
