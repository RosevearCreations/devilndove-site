import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const id = n => `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12,'0')}`;
const day = offset => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()+offset)
    .toLocaleDateString('en-CA', {year:'numeric',month:'2-digit',day:'2-digit'})
    .replaceAll('/','-');
};

function fixture() {
  const element = () => ({disabled:false, hidden:false, value:'', textContent:'', innerHTML:'',
    dataset:{}, events:{}, classList:{toggle(){}}, setAttribute(){},
    addEventListener(type,fn){this.events[type]=fn;}});
  const ids=['dd647FollowUp','dd647Status','dd647Counts','dd647Rows','dd647Detail',
    'dd647Guidance','dd647Receipt','dd647Inspect','dd647Reopen','dd647Clear',
    'dd646Preview','dd646Copy','dd646Status'];
  const els=Object.fromEntries(ids.map(name=>[name,element()]));
  const filters=['open','due','blocked','completed','all'].map(name=>
    Object.assign(element(),{dataset:{dd647Filter:name},textContent:name}));
  els.dd647FollowUp.querySelectorAll=()=>filters;
  els.dd646Copy.disabled=true;
  const plans=[
    {plan_id:id(1),title:'Copper wire',status:'follow_up',follow_up_on:day(-2),owner_note:'Bench',items:[{}],updated_at:'2026-11-08T12:00:00Z'},
    {plan_id:id(2),title:'Supplier fabric',status:'blocked',follow_up_on:day(5),owner_note:'Vendor',items:[{}],updated_at:'2026-11-08T12:00:00Z'},
    {plan_id:id(3),title:'Old beads',status:'completed',follow_up_on:'',owner_note:'Reviewed',items:[],updated_at:'2026-11-08T12:00:00Z'},
    {plan_id:id(4),title:'New resin',status:'draft',follow_up_on:'',owner_note:'Pending',items:[],updated_at:'2026-11-08T12:00:00Z'}
  ];
  let latest={loaded:true,owner_user_id:7,version:3,plans};
  let callback;
  const reopened=[];
  const win={DD641OwnerPlans:{
    subscribe:fn=>{callback=fn;fn(latest);},
    snapshot:()=>latest,
    reopen:key=>{reopened.push(key);return true;}
  }};
  const observed=[];
  function MutationObserver(fn){observed.push(fn);this.observe=()=>{};}
  runInNewContext(read('public/js/admin-workshop-followup-647.js'), {
    document:{getElementById:key=>els[key]},window:win,
    Date,Number,String,RegExp,Object,Array,Set,JSON,MutationObserver
  });
  const select=n=>els.dd647Rows.events.click({target:{closest:()=>({dataset:{dd647Plan:id(n)}})}});
  const refresh=value=>{latest=value;callback(value);};
  const acknowledge=(n=1)=>{
    els.dd646Copy.disabled=false;
    els.dd646Preview.value=[
      'DEVIL N DOVE — PRIVATE WORKSHOP HANDOFF ACKNOWLEDGEMENT',
      'LOCAL / UNSIGNED / NOT A SERVER AUDIT RECEIPT',
      'Authenticated owner session user ID: 7',
      `Saved plan ID: ${id(n)}`,
      'Source plan version: 3 | Review timeline version: 4',
      'Next owner follow-up: Count copper wire before ordering',
      `Target follow-up date: ${day(2)}`
    ].join('\n');
  };
  return {els,filters,plans,reopened,select,refresh,acknowledge,observed};
}

test('647 verified private owner plans show bounded follow-up counts and due filtering',()=>{
  const f=fixture();
  assert.match(f.els.dd647Counts.textContent,/4 verified owner plan\(s\) · 3 open · 1 due\/overdue · 1 blocked · 1 review-completed/);
  assert.match(f.els.dd647Rows.innerHTML,/Copper wire/);
  assert.doesNotMatch(f.els.dd647Rows.innerHTML,/Old beads/);
  f.filters[1].events.click();
  assert.match(f.els.dd647Rows.innerHTML,/Overdue follow-up/);
  assert.doesNotMatch(f.els.dd647Rows.innerHTML,/Supplier fabric/);
  f.filters[3].events.click();
  assert.match(f.els.dd647Rows.innerHTML,/Review marked complete \(planning only\)/);
  assert.doesNotMatch(f.els.dd647Rows.innerHTML,/Copper wire/);
});

test('647 review guidance remains read-only and reopens original owner editor only by click',()=>{
  const f=fixture();f.select(1);
  assert.equal(f.els.dd647Detail.hidden,false);
  assert.match(f.els.dd647Guidance.textContent,/Reopening does not save a change/);
  assert.equal(f.reopened.length,0);
  f.els.dd647Reopen.events.click();
  assert.deepEqual(f.reopened,[id(1)]);
  assert.match(f.els.dd647Status.textContent,/separate Save action/);
  f.els.dd647Clear.events.click();
  assert.equal(f.els.dd647Detail.hidden,true);
});

test('647 validates local unsigned acknowledgement and rejects stale or wrong-plan receipt',()=>{
  const f=fixture();f.select(1);
  f.acknowledge(2);f.els.dd647Inspect.events.click();
  assert.match(f.els.dd647Status.textContent,/different or stale owner plan/);
  f.acknowledge(1);f.els.dd647Inspect.events.click();
  assert.match(f.els.dd647Receipt.textContent,/Count copper wire before ordering/);
  f.els.dd646Preview.value='';f.els.dd646Copy.disabled=true;
  f.observed[0]();
  assert.match(f.els.dd647Receipt.textContent,/not inspected or no longer current/);
});

test('647 refuses malformed or stale owner evidence and clears old selection',()=>{
  const f=fixture();f.select(1);
  const bad={loaded:true,owner_user_id:7,version:4,
    plans:[{...f.plans[0],title:'<img src=x onerror=alert(1)>'}]};
  f.refresh(bad);
  assert.equal(f.els.dd647Detail.hidden,true);
  assert.match(f.els.dd647Rows.innerHTML,/&lt;img/);
  assert.doesNotMatch(f.els.dd647Rows.innerHTML,/<img/);
  f.refresh({...bad,plans:[{...f.plans[0],follow_up_on:'2026-02-30'}]});
  assert.equal(f.els.dd647Rows.textContent,'Load private saved plans above; no background request is made.');
  assert.equal(f.els.dd647Reopen.disabled,true);
  assert.match(f.els.dd647Status.textContent,/HOLD/);
});

test('647 UI, protected CI and source retain no API writes, timers or persistence',()=>{
  const html=read('admin/products/index.html');
  const js=read('public/js/admin-workshop-followup-647.js');
  const workflow=read('.github/workflows/current-application-quality.yml');
  for(const id of ['dd647FollowUp','dd647Heading','dd647Status','dd647Counts','dd647Rows',
    'dd647Detail','dd647DetailHeading','dd647Guidance','dd647Receipt','dd647Inspect',
    'dd647Reopen','dd647Clear'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/admin-workshop-followup-647\.js\?v=647/);
  assert.match(workflow,/release467_build647_workshop_followup_guidance\.test\.mjs/);
  assert.match(js,/DD641OwnerPlans\.reopen/);
  assert.match(js,/MutationObserver/);
  assert.doesNotMatch(js,/(?:apiFetch|fetch\(|localStorage|sessionStorage|setInterval|setTimeout|XMLHttpRequest)/);
});
