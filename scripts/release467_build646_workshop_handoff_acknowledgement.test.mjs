import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const PLAN = '11111111-1111-4111-8111-111111111111';
const tomorrow = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
function fixture() {
  const events = {};
  const elem = () => ({disabled:false, checked:false, value:'', textContent:'', dataset:{},
    addEventListener(type, callback) {this.events ??= {};this.events[type] = callback;},
    events:{}});
  const checkNames = ['source', 'stock', 'supplier', 'authority'];
  const checks = checkNames.map(key => ({...elem(), dataset:{dd646Check:key}}));
  const ids = ['Workshop', 'Load','Reset','Status','Checklist','Action','Due','Confirm',
    'Prepare','Copy','Download','Preview'];
  const els = Object.fromEntries(ids.map(name => [`dd646${name}`, elem()]));
  els.dd646Checklist.querySelectorAll = () => checks;
  els.dd645Preview = elem();
  els.dd645Copy = elem();
  els.dd645Copy.disabled = true;
  els.dd645Status = elem();
  els.dd643Plan = elem();
  els.dd643Plan.value = PLAN;
  const written = [];
  let ownerCallback;
  let observeCallback;
  const win = {
    DD641OwnerPlans:{subscribe:callback => {
      ownerCallback = callback;
      callback({loaded:true,owner_user_id:7,version:2,plans:[{plan_id:PLAN}]});
    }},
    navigator:{clipboard:{writeText:async s => written.push(s)}}
  };
  function MutationObserver(callback) {observeCallback=callback;this.observe=()=>{};}
  runInNewContext(read('public/js/admin-workshop-handoff-646.js'), {
    window:win, document:{getElementById:id=>els[id]},
    MutationObserver, Date, Number, String, RegExp, Array, Object, Set, Blob, URL
  });
  const digest = (extra='') => [
    'DEVIL N DOVE — PRIVATE OWNER RESTOCK REVIEW HANDOFF',
    'Prepared: 2026-11-08T18:00:00Z',
    `Saved plan: Copper wire | Plan ID: ${PLAN}`,
    'Verified review search: 2026-11-08T17:00:00Z | Plan version: 2 | Timeline version: 3',
    'Selected: 2 | Loaded matches: 3 / 5',
    `Private review note: NEVER EXPORT THIS BODY ${extra}`,
  ].join('\n\n');
  function load() {
    els.dd645Preview.value = digest();
    els.dd645Copy.disabled = false;
    observeCallback();
    assert.equal(els.dd646Load.disabled, false);
    els.dd646Load.events.click();
  }
  function complete() {
    checks.forEach(c => {c.checked=true;});
    els.dd646Action.value = 'Check copper wire bench inventory with Ree';
    els.dd646Due.value = tomorrow;
    els.dd646Confirm.checked = true;
    els.dd646Checklist.events.change();
  }
  return {els,win,checks,written,digest,load,complete,
    refresh:()=>observeCallback(),owner:next=>ownerCallback(next)};
}

test('646 requires deliberately prepared digest and explicit owner acknowledgement', () => {
  const f = fixture();
  assert.equal(f.els.dd646Load.disabled,true);
  assert.equal(f.els.dd646Checklist.disabled,true);
  f.load();
  assert.equal(f.els.dd646Checklist.disabled,false);
  assert.equal(f.els.dd646Prepare.disabled,true);
  f.complete();
  assert.equal(f.els.dd646Prepare.disabled,false);
  f.els.dd646Prepare.events.click();
  assert.equal(f.els.dd646Copy.disabled,false);
  assert.match(f.els.dd646Preview.value,/LOCAL \/ UNSIGNED \/ NOT A SERVER AUDIT RECEIPT/);
  assert.match(f.els.dd646Preview.value,/Selected dated reviews in source digest: 2/);
  assert.match(f.els.dd646Preview.value,/Check copper wire bench inventory/);
  assert.doesNotMatch(f.els.dd646Preview.value,/NEVER EXPORT THIS BODY/);
});

test('646 source invalidation clears receipt and checklist including asynchronous search changes', async () => {
  const f = fixture();f.load();f.complete();f.els.dd646Prepare.events.click();
  f.els.dd645Preview.value = '';
  f.els.dd645Copy.disabled = true;
  f.refresh();
  assert.equal(f.els.dd646Copy.disabled,true);
  assert.equal(f.els.dd646Checklist.disabled,true);
  assert.equal(f.els.dd646Preview.value,'');
  await f.els.dd646Copy.events.click();
  assert.equal(f.written.length,0);
});

test('646 owner change, plan change and source version mismatch fail closed', () => {
  const f=fixture();f.load();f.complete();f.els.dd646Prepare.events.click();
  f.owner({loaded:true,owner_user_id:8,version:2,plans:[{plan_id:PLAN}]});
  assert.equal(f.els.dd646Copy.disabled,true);
  assert.equal(f.els.dd646Load.disabled,true);
  f.owner({loaded:true,owner_user_id:7,version:3,plans:[{plan_id:PLAN}]});
  assert.equal(f.els.dd646Load.disabled,true);
  f.owner({loaded:true,owner_user_id:7,version:2,plans:[{plan_id:PLAN}]});
  f.els.dd643Plan.value = '22222222-2222-4222-8222-222222222222';
  f.refresh();
  assert.equal(f.els.dd646Load.disabled,true);
});

test('646 checklist edits, invalid dates and plan follow-up protect acknowledgement', () => {
  const f=fixture();f.load();f.complete();
  f.els.dd646Due.value='2026-02-30';f.els.dd646Checklist.events.change();
  assert.equal(f.els.dd646Prepare.disabled,true);
  f.els.dd646Due.value=tomorrow;f.els.dd646Checklist.events.change();
  assert.equal(f.els.dd646Prepare.disabled,false);
  f.els.dd646Prepare.events.click();
  f.checks[1].checked=false;f.els.dd646Checklist.events.change();
  assert.equal(f.els.dd646Preview.value,'');
  assert.equal(f.els.dd646Copy.disabled,true);
  f.checks[1].checked=true;f.els.dd646Checklist.events.change();
  f.els.dd646Prepare.events.click();
  f.els.dd646Reset.events.click();
  assert.equal(f.els.dd646Checklist.disabled,true);
  assert.equal(f.els.dd646Confirm.checked,false);
});

test('646 deliberate copy remains private and forbidden provider writes are absent', async () => {
  const f=fixture();f.load();f.complete();f.els.dd646Prepare.events.click();
  await f.els.dd646Copy.events.click();
  assert.equal(f.written.length,1);
  assert.equal(f.written[0],f.els.dd646Preview.value);
  const html=read('admin/products/index.html');
  const js=read('public/js/admin-workshop-handoff-646.js');
  const workflow=read('.github/workflows/current-application-quality.yml');
  for (const id of ['dd646Workshop','dd646Heading','dd646Load','dd646Reset','dd646Status',
    'dd646Checklist','dd646Action','dd646Due','dd646Confirm','dd646Prepare','dd646Copy',
    'dd646Download','dd646Preview']) assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/admin-workshop-handoff-646\.js\?v=646/);
  assert.match(workflow,/release467_build646_workshop_handoff_acknowledgement\.test\.mjs/);
  assert.doesNotMatch(js,/(?:apiFetch|fetch\(|localStorage|sessionStorage|setInterval|setTimeout|XMLHttpRequest)/);
  assert.match(js,/DD641OwnerPlans\.subscribe/);
  assert.match(js,/MutationObserver/);
});
