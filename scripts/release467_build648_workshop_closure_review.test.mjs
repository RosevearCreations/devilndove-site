import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read = path => readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const PLAN='11111111-1111-4111-8111-111111111111';
const future=()=>{const d=new Date(Date.now()+86400000*3);return d.toISOString().slice(0,10);};
function fixture(){
  const elem=()=>({value:'',disabled:false,checked:false,innerHTML:'',textContent:'',
    dataset:{},events:{},addEventListener(type,fn){this.events[type]=fn;}});
  const ids=['Plan','Outcome','Link','Reset','Status','Checklist','Evidence','Next','Due',
    'Confirm','Prepare','Copy','Download','Reopen','Preview'].map(x=>`dd648${x}`);
  const els=Object.fromEntries([...ids,'dd648Closure','dd645Preview','dd645Copy',
    'dd645Status','dd643Plan','dd647Rows'].map(key=>[key,elem()]));
  const checks=['source','stock','supplier','authority'].map(key=>({...elem(),dataset:{dd648Check:key}}));
  els.dd648Checklist.querySelectorAll=()=>checks;
  els.dd645Copy.disabled=true;
  els.dd643Plan.value=PLAN;
  const plans=[{plan_id:PLAN,title:'Copper wire',status:'follow_up',follow_up_on:'2026-11-19'}];
  let state={loaded:true,owner_user_id:7,version:2,plans};
  let subscriber;
  const reopened=[],copied=[];
  const win={DD641OwnerPlans:{subscribe:fn=>{subscriber=fn;fn(state);},snapshot:()=>state,
    reopen:key=>{reopened.push(key);return true;}},navigator:{clipboard:{writeText:async s=>copied.push(s)}}};
  let digestObserver;
  function MutationObserver(fn){digestObserver=fn;this.observe=()=>{};}
  runInNewContext(read('public/js/admin-workshop-closure-648.js'),{
    document:{getElementById:id=>els[id]},window:win,Date,Number,String,Object,Array,RegExp,
    Set,JSON,MutationObserver,Blob,URL
  });
  const digest=()=>[
    'DEVIL N DOVE — PRIVATE OWNER RESTOCK REVIEW HANDOFF',
    'Prepared: 2026-11-08T20:00:00Z',
    `Saved plan: Copper wire | Plan ID: ${PLAN}`,
    'Verified review search: 2026-11-08T19:45:00Z | Plan version: 2 | Timeline version: 3',
    'Selected: 2 | Loaded matches: 3 / 5',
    'Private review note: NO PRIVATE NOTES IN CLOSURE'
  ].join('\n\n');
  const select=()=>{els.dd648Plan.value=PLAN;els.dd648Plan.events.change();};
  const link=()=>{select();els.dd645Preview.value=digest();els.dd645Copy.disabled=false;
    els.dd648Link.events.click();};
  const complete=()=>{checks.forEach(c=>{c.checked=true;});
    els.dd648Confirm.checked=true;els.dd648Evidence.value='Bench log and owner count record were separately reviewed';
    els.dd648Next.value='Reopen original owner plan and review status';
    els.dd648Due.value=future();els.dd648Checklist.events.change();};
  const refresh=next=>{state=next;subscriber(next);};
  return {els,checks,plans,copied,reopened,digest,link,complete,select,refresh,
    observed:()=>digestObserver()};
}

test('648 starts private and disabled until owner explicitly links a prepared dated digest',()=>{
  const f=fixture();
  assert.equal(f.els.dd648Link.disabled,true);
  assert.equal(f.els.dd648Checklist.disabled,true);
  f.select();assert.equal(f.els.dd648Link.disabled,true);
  f.els.dd645Preview.value=f.digest();f.els.dd645Copy.disabled=false;
  f.els.dd648Link.events.click();
  assert.equal(f.els.dd648Checklist.disabled,false);
  assert.equal(f.els.dd648Prepare.disabled,true);
  assert.match(f.els.dd648Status.textContent,/Nothing has been closed or saved/);
});

test('648 owner closure candidate requires dated source, stronger evidence, four checks and explicit preparation',()=>{
  const f=fixture();f.link();f.complete();
  f.els.dd648Outcome.value='closure_candidate';f.els.dd648Outcome.events.change();
  assert.equal(f.els.dd648Prepare.disabled,false);
  f.els.dd648Prepare.events.click();
  const preview=f.els.dd648Preview.value;
  assert.match(preview,/Recommend manual closure review \(not completion\)/);
  assert.match(preview,/Dated owner reviews selected: 2/);
  assert.match(preview,/OWNER REPORTED ONLY/);
  assert.match(preview,/owner plan editor can explicitly save/);
  assert.doesNotMatch(preview,/NO PRIVATE NOTES IN CLOSURE/);
  assert.equal(f.els.dd648Copy.disabled,false);
});

test('648 stale digest, owner change and altered inputs erase prior local closure recommendation',()=>{
  const f=fixture();f.link();f.complete();f.els.dd648Prepare.events.click();
  f.els.dd648Evidence.value='Changed evidence note';f.els.dd648Evidence.events.input();
  assert.equal(f.els.dd648Preview.value,'');
  assert.equal(f.els.dd648Copy.disabled,true);
  f.els.dd648Prepare.events.click();
  f.els.dd645Preview.value='';f.els.dd645Copy.disabled=true;f.observed();
  assert.equal(f.els.dd648Checklist.disabled,true);
  assert.equal(f.els.dd648Copy.disabled,true);
  f.els.dd645Preview.value=f.digest();f.els.dd645Copy.disabled=false;f.link();
  f.refresh({loaded:true,owner_user_id:8,version:2,plans:f.plans});
  assert.equal(f.els.dd648Link.disabled,true);
  assert.equal(f.els.dd648Preview.value,'');
});

test('648 review outcome never auto-saves and manually reopens the source owner editor',async()=>{
  const f=fixture();f.link();f.complete();
  assert.equal(f.reopened.length,0);
  f.els.dd648Reopen.events.click();
  assert.deepEqual(f.reopened,[PLAN]);
  assert.match(f.els.dd648Status.textContent,/separate explicit Save/);
  f.els.dd648Prepare.events.click();
  await f.els.dd648Copy.events.click();
  assert.equal(f.copied.length,1);
  assert.equal(f.copied[0],f.els.dd648Preview.value);
  f.els.dd648Reset.events.click();
  assert.equal(f.els.dd648Copy.disabled,true);
});

test('648 malformed owner date and source mismatches fail closed without writes',()=>{
  const f=fixture();f.link();f.complete();
  f.els.dd648Due.value='2026-02-30';f.els.dd648Checklist.events.change();
  assert.equal(f.els.dd648Prepare.disabled,true);
  f.els.dd648Due.value=future();f.els.dd648Checklist.events.change();
  assert.equal(f.els.dd648Prepare.disabled,false);
  f.refresh({loaded:true,owner_user_id:7,version:3,plans:f.plans});
  assert.equal(f.els.dd648Checklist.disabled,true);
  assert.equal(f.els.dd648Link.disabled,true);
});

test('648 accessible UI, CI and browser client forbid automatic external or database actions',()=>{
  const html=read('admin/products/index.html');
  const js=read('public/js/admin-workshop-closure-648.js');
  const workflow=read('.github/workflows/current-application-quality.yml');
  for(const id of ['dd648Closure','dd648Heading','dd648Plan','dd648Outcome','dd648Link',
    'dd648Reset','dd648Status','dd648Checklist','dd648Evidence','dd648Next','dd648Due',
    'dd648Confirm','dd648Prepare','dd648Copy','dd648Download','dd648Reopen','dd648Preview'])
    assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/admin-workshop-closure-648\.js\?v=648/);
  assert.match(workflow,/release467_build648_workshop_closure_review\.test\.mjs/);
  assert.match(js,/DD641OwnerPlans\.reopen/);
  assert.match(js,/MutationObserver/);
  assert.doesNotMatch(js,/(?:apiFetch|fetch\(|localStorage|sessionStorage|setInterval|setTimeout|XMLHttpRequest)/);
});
