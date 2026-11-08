import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const PLAN='11111111-1111-4111-8111-111111111111';
const second=id=>`22222222-2222-4222-8222-${String(id).padStart(12,'0')}`;
const outcomeKeys=['needs_physical_count','needs_supplier_review','needs_workshop_review',
  'follow_up_scheduled','no_change_recommended','separate_action_recommended'];
const settle=async()=>{await new Promise(setImmediate);await new Promise(setImmediate);};
const record=(id,overrides={})=>({event_id:second(id),recorded_at:'2026-11-08T20:00:00.000Z',
  outcome:'needs_workshop_review',note:`Verify actual workbench record ${id}`,
  plan_version:2,status_at_review:'follow_up',follow_up_on_at_review:'2026-11-19',...overrides});
function reply(events,options={}){
  const counts=Object.fromEntries(outcomeKeys.map(key=>[key,0]));
  for(const e of options.allEvents||events)counts[e.outcome]++;
  return {build:643,ok:true,private:true,read_only:true,automatic:false,inventory_mutation:false,
    owner_user_id:7,plan_id:PLAN,plan_version:2,timeline_version:3,
    events,next_cursor:options.cursor??null,matched_total:options.total??events.length,
    search:{q:'',outcome:''},summary:{review_count:options.total??events.length,
      outcome_counts:counts,latest_outcome:events[0]?.outcome||null,
      latest_review_at:events[0]?.recorded_at||null,plan_status:'follow_up',
      plan_follow_up_on:'2026-11-19',advisory_only:true,inventory_mutation:false,order_mutation:false}};
}
function fixture({responses=[]}={}){
  const element=()=>({value:'',disabled:false,checked:false,innerHTML:'',textContent:'',
    events:{},addEventListener(name,fn){this.events[name]=fn;}});
  const ids=['Plan','Filter','Load','More','Clear','Status','Summary','Rows','Link',
    'Reopen','Compare','Draft','Copy','Preview'].map(key=>`dd649${key}`);
  const els=Object.fromEntries([...ids,'dd649History','dd647Rows','dd648Status','dd648Preview',
    'dd648Copy','dd648Plan'].map(id=>[id,element()]));
  els.dd649Filter.value='all';els.dd648Copy.disabled=true;
  const plans=[{plan_id:PLAN,title:'Copper bench stock',status:'follow_up',follow_up_on:'2026-11-19'}];
  let snapshot={loaded:true,owner_user_id:7,version:2,plans};
  let subscribe;
  let observer;
  const calls=[],copied=[],reopened=[];
  let queue=[...responses];
  const win={navigator:{clipboard:{writeText:async text=>copied.push(text)}},
    DDAuth:{apiFetch:async (url,init)=>{
      calls.push({url,init});const next=queue.shift();
      if(next instanceof Error)throw next;
      return {ok:!next?.error,json:async()=>next?.error?{error:next.error}:next};
    }},
    DD641OwnerPlans:{subscribe:fn=>{subscribe=fn;fn(snapshot);},snapshot:()=>snapshot,
      reopen:id=>{reopened.push(id);return true;}}};
  function MutationObserver(fn){observer=fn;this.observe=()=>{};}
  runInNewContext(read('public/js/admin-workshop-history-649.js'),{
    document:{getElementById:id=>els[id]},window:win,Date,JSON,Number,String,Object,
    Set,Array,RegExp,MutationObserver
  });
  const select=()=>{els.dd649Plan.value=PLAN;els.dd649Plan.events.change();};
  const load=async()=>{els.dd649Load.events.click();await settle();};
  const more=async()=>{els.dd649More.events.click();await settle();};
  const push=(body)=>queue.push(body);
  const changeOwner=next=>{snapshot=next;subscribe(next);};
  const worksheet=()=>{
    els.dd648Plan.value=PLAN;els.dd648Copy.disabled=false;
    els.dd648Preview.value=[
      'DEVIL N DOVE — OWNER WORKSHOP CLOSURE REVIEW WORKSHEET',
      'PRIVATE / LOCAL / UNSIGNED / NO SERVER WRITE',
      'Authenticated owner session user ID: 7',
      `Saved plan: Copper bench stock | Plan ID: ${PLAN}`,
      'Saved plan source version: 2 | Review timeline version: 3',
      'Recommended outcome: Recommend manual closure review (not completion)',
      'Suggested next step: Count reserved copper with both owners before decision'
    ].join('\n');
  };
  return {els,plans,calls,copied,reopened,select,load,more,push,changeOwner,worksheet,
    observed:()=>observer()};
}

test('649 starts without network or preloaded private history, then reads one owner-scoped page on click',async()=>{
  const events=[record(1),record(2)];const f=fixture({responses:[reply(events)]});
  assert.equal(f.calls.length,0);
  assert.equal(f.els.dd649Load.disabled,true);
  f.select();await f.load();
  assert.equal(f.calls.length,1);
  assert.equal(f.calls[0].url,`/api/admin/owner-restock-review-notes?plan_id=${PLAN}`);
  assert.equal(f.calls[0].init.method,'GET');
  assert.equal(f.calls[0].init.cache,'no-store');
  assert.match(f.els.dd649Summary.textContent,/2 saved dated review/);
  assert.match(f.els.dd649Rows.innerHTML,/Verify actual workbench record 1/);
  assert.equal(f.els.dd649More.disabled,true);
});

test('649 bounded explicit pagination and outcome filtering never invent a full timeline',async()=>{
  const all=Array.from({length:11},(_,i)=>record(i+1,{outcome:i===10?'follow_up_scheduled':'needs_workshop_review'}));
  const first=reply(all.slice(0,10),{total:11,allEvents:all,cursor:all[9].event_id});
  const last=reply(all.slice(10),{total:11,allEvents:all});
  const f=fixture({responses:[first,last]});f.select();await f.load();
  assert.equal(f.els.dd649More.disabled,false);
  f.els.dd649Filter.value='follow_up_scheduled';f.els.dd649Filter.events.change();
  assert.match(f.els.dd649Rows.innerHTML,/No loaded saved notes match/);
  await f.more();
  assert.equal(f.calls.length,2);
  assert.match(f.calls[1].url,/&before=22222222-2222-4222-8222-000000000010/);
  assert.match(f.els.dd649Rows.innerHTML,/Verify actual workbench record 11/);
  assert.match(f.els.dd649Summary.textContent,/11 of|11 saved dated review/);
  assert.equal(f.els.dd649More.disabled,true);
});

test('649 compares an explicit current unsaved worksheet and drafts a manual 643 note; never saves',async()=>{
  const f=fixture({responses:[reply([record(1)])]});f.select();await f.load();
  assert.equal(f.els.dd649Link.disabled,true);
  f.worksheet();f.els.dd649Link.events.click();
  assert.match(f.els.dd649Compare.textContent,/not a saved decision|No record has been written/);
  assert.equal(f.els.dd649Draft.disabled,false);
  f.els.dd649Draft.events.click();
  assert.match(f.els.dd649Preview.value,/owner recommendation only/);
  assert.match(f.els.dd649Preview.value,/NOT physical completion/);
  assert.ok(f.els.dd649Preview.value.length<=300);
  await f.els.dd649Copy.events.click();
  assert.deepEqual(f.copied,[f.els.dd649Preview.value]);
  f.els.dd649Reopen.events.click();
  assert.deepEqual(f.reopened,[PLAN]);
  assert.equal(f.calls.length,1);
  assert.ok(f.calls.every(call=>call.init.method==='GET'));
  assert.match(f.els.dd649Status.textContent,/separate explicit Save/);
});

test('649 owner/source changes and altered private worksheet invalidate comparisons',async()=>{
  const f=fixture({responses:[reply([record(1)])]});f.select();await f.load();f.worksheet();
  f.els.dd649Link.events.click();f.els.dd649Draft.events.click();
  f.els.dd648Copy.disabled=true;f.observed();
  assert.equal(f.els.dd649Preview.value,'');
  assert.equal(f.els.dd649Copy.disabled,true);
  f.changeOwner({loaded:true,owner_user_id:8,version:2,plans:f.plans});
  assert.equal(f.els.dd649Rows.textContent,'No saved history loaded.');
  assert.equal(f.els.dd649Load.disabled,true);
  assert.equal(f.els.dd649Link.disabled,true);
});

test('649 rejects stale timeline, unverified owner, and malformed history without preserving partial facts',async()=>{
  const bad=reply([record(1)],{});bad.timeline_version=999;
  const f=fixture({responses:[bad]});f.select();await f.load();
  // One verified full page is a legitimate timeline regardless of its nonnegative version.
  assert.match(f.els.dd649Summary.textContent,/saved dated review/);
  const changed=reply([record(2)]);changed.owner_user_id=44;
  f.push(changed);await f.load();
  assert.match(f.els.dd649Status.textContent,/HOLD/);
  assert.equal(f.els.dd649Link.disabled,true);
  assert.equal(f.els.dd649Preview.value,'');
  const malformed=reply([record(3)]);malformed.summary.review_count=8;
  f.push(malformed);await f.load();
  assert.match(f.els.dd649Status.textContent,/HOLD/);
});

test('649 rejects a changed timeline on the next page and discards prior loaded records',async()=>{
  const all=Array.from({length:11},(_,i)=>record(i+1));
  const first=reply(all.slice(0,10),{total:11,allEvents:all,cursor:all[9].event_id});
  const stale=reply(all.slice(10),{total:11,allEvents:all});stale.timeline_version=4;
  const f=fixture({responses:[first,stale]});f.select();await f.load();
  assert.equal(f.els.dd649More.disabled,false);
  await f.more();
  assert.match(f.els.dd649Status.textContent,/HOLD/);
  assert.equal(f.els.dd649Summary.textContent,'No verified saved review timeline yet.');
  assert.equal(f.els.dd649Link.disabled,true);
});

test('649 discards a pending response if the authenticated owner changes mid-request',async()=>{
  let release;const pending=new Promise(resolve=>{release=resolve;});
  const f=fixture({responses:[pending]});f.select();f.els.dd649Load.events.click();
  f.changeOwner({loaded:true,owner_user_id:8,version:2,plans:f.plans});
  release(reply([record(1)]));await settle();
  assert.equal(f.els.dd649Summary.textContent,'No verified saved review timeline yet.');
  assert.equal(f.els.dd649Rows.textContent,'No saved history loaded.');
});

test('649 escapes private notes and keeps filtered review records in authenticated UI only',async()=>{
  const f=fixture({responses:[reply([record(1,{note:'Bench <img onerror=alert(1)> belongs to owner'})])]});
  f.select();await f.load();
  assert.match(f.els.dd649Rows.innerHTML,/&lt;img onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(f.els.dd649Rows.innerHTML,/<img onerror/);
});

test('649 DOM, protected CI, API usage and historical Build 232 retirement are wired safely',()=>{
  const html=read('admin/products/index.html');
  const js=read('public/js/admin-workshop-history-649.js');
  const workflow=read('.github/workflows/current-application-quality.yml');
  for(const id of ['dd649History','dd649Heading','dd649Plan','dd649Filter','dd649Load',
    'dd649More','dd649Clear','dd649Status','dd649Summary','dd649Rows','dd649Link',
    'dd649Reopen','dd649Compare','dd649Draft','dd649Copy','dd649Preview'])
    assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/admin-workshop-history-649\.js\?v=649/);
  assert.match(workflow,/release467_build649_workshop_closure_history\.test\.mjs/);
  assert.match(js,/owner-restock-review-notes/);
  assert.match(js,/DD641OwnerPlans\.reopen/);
  assert.doesNotMatch(js,/(?:method:['"]POST|localStorage|sessionStorage|setInterval|setTimeout|XMLHttpRequest)/);
  assert.doesNotMatch(html,/admin-product-correction\.js/);
});
