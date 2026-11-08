import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {onRequestGet,onRequestPost} from '../functions/api/admin/owner-restock-review-notes.js';

const PLAN='11111111-1111-4111-8111-111111111111';
const ROOT='site.admin.owner_restock_plans.v641.';
const privateKey=`${ROOT}7.review.${PLAN}`;

function fixture(){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(`CREATE TABLE app_settings(setting_key TEXT UNIQUE,setting_value TEXT,is_public INTEGER NOT NULL DEFAULT 0,updated_by_user_id INTEGER,updated_at TEXT);
    CREATE TABLE products(product_id INTEGER PRIMARY KEY,inventory_quantity INTEGER);
    INSERT INTO products VALUES(12,8);
    CREATE TABLE admin_action_audit(actor_user_id INTEGER,action_type TEXT,target_type TEXT,target_key TEXT,request_method TEXT,request_path TEXT,details_json TEXT,created_at TEXT);`);
  sqlite.prepare('INSERT INTO app_settings(setting_key,setting_value,is_public,updated_by_user_id) VALUES(?,?,0,7)').run(`${ROOT}7`,JSON.stringify({schema:641,version:2,plans:[{
    plan_id:PLAN,title:'Copper ring order',status:'follow_up',follow_up_on:'2026-11-14'}]}));
  const queries=[];
  const db={prepare(sql){queries.push(sql);const statement=sqlite.prepare(sql);return {bind(...args){return {
    first:async()=>statement.get(...args),all:async()=>({results:statement.all(...args)}),
    run:async()=>({meta:{changes:statement.run(...args).changes}})};}};}};
  function ctx(owner=7,method='GET',body=null,url=`https://devilndove.example/api/admin/owner-restock-review-notes?plan_id=${PLAN}`){
    return {env:{DB:db},data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:owner}}},
      request:new Request(url,{method,...(body?{headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{})})};
  }
  const note={plan_id:PLAN,expected_plan_version:2,expected_timeline_version:0,
    outcome:'needs_physical_count',note:'Count each finished copper ring on the workbench.'};
  const get=async(owner=7,url)=>{const r=await onRequestGet(ctx(owner,'GET',null,url));return {status:r.status,data:await r.json(),headers:r.headers};};
  const post=async(body=note,owner=7)=>{const r=await onRequestPost(ctx(owner,'POST',body));return {status:r.status,data:await r.json()};};
  return {sqlite,queries,ctx,note,get,post,close:()=>sqlite.close()};
}

test('643 GET is private, manual, read-only and does not invent a history',async()=>{
  const f=fixture();const before=f.sqlite.prepare('SELECT COUNT(*) AS n FROM app_settings').get().n;
  const result=await f.get();assert.equal(result.status,200);assert.deepEqual(result.data.events,[]);
  assert.equal(result.data.timeline_version,0);assert.equal(result.data.private,true);
  assert.equal(result.headers.get('Cache-Control'),'no-store');
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM app_settings').get().n,before);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM admin_action_audit').get().n,0);f.close();
});

test('643 appends owner-scoped notes and audits metadata without leaking private text',async()=>{
  const f=fixture();const saved=await f.post();assert.equal(saved.status,200,JSON.stringify(saved.data));
  assert.equal(saved.data.timeline_version,1);assert.equal(saved.data.event.note,f.note.note);
  assert.equal(saved.data.event.outcome,f.note.outcome);
  assert.equal(saved.data.event.status_at_review,'follow_up');
  const row=f.sqlite.prepare('SELECT * FROM app_settings WHERE setting_key=?').get(privateKey);
  assert.equal(row.is_public,0);assert.equal(row.updated_by_user_id,7);
  const audit=f.sqlite.prepare('SELECT * FROM admin_action_audit').get();
  assert.equal(audit.action_type,'owner_restock_review_note_recorded');
  assert.equal(audit.details_json.includes(f.note.note),false);
  const loaded=await f.get();assert.equal(loaded.data.events[0].note,f.note.note);
  assert.equal(loaded.data.timeline_version,1);
  assert.equal(f.sqlite.prepare('SELECT inventory_quantity FROM products WHERE product_id=12').get().inventory_quantity,8);
  assert.equal(f.queries.every(sql=>!/(UPDATE|INSERT INTO|DELETE FROM)\s+products\b/i.test(sql)),true);
  f.close();
});

test('643 refuses other owners, stale versions, malformed notes and unauthenticated access',async()=>{
  const f=fixture();assert.equal((await f.get(8)).status,404);
  assert.equal((await f.post(f.note,8)).status,404);
  assert.equal((await f.post({...f.note,expected_plan_version:1})).status,409);
  for(const invalid of [
    {note:'short'},{note:'x'.repeat(301)},{outcome:'restock_order_placed'},
    {expected_timeline_version:-1},{expected_plan_version:0},{plan_id:'../another-owner'},
  ])assert.equal((await f.post({...f.note,...invalid})).status,400);
  const saved=await f.post();assert.equal(saved.status,200);
  const stale=await f.post();assert.equal(stale.status,409);assert.equal(stale.data.code,'stale_review_timeline');
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM admin_action_audit').get().n,1);
  const unauthorized=f.ctx();unauthorized.data.ddModuleAccess.allowed=false;
  assert.equal((await onRequestGet(unauthorized)).status,401);
  assert.equal((await onRequestGet({...f.ctx(),env:{}})).status,503);
  f.close();
});

test('643 gives deterministic 10-record paging and protects the 50-event capacity',async()=>{
  const f=fixture();let version=0;
  for(let i=0;i<50;i++){
    const r=await f.post({...f.note,expected_timeline_version:version,note:`Count ${i+1} of 50 and confirm stock in workshop.`});
    assert.equal(r.status,200,JSON.stringify(r.data));version=r.data.timeline_version;
  }
  const page=await f.get();assert.equal(page.data.events.length,10);assert.ok(page.data.next_cursor);
  const next=await f.get(7,`https://devilndove.example/api/admin/owner-restock-review-notes?plan_id=${PLAN}&before=${page.data.next_cursor}`);
  assert.equal(next.status,200);assert.equal(next.data.events.length,10);
  assert.notEqual(page.data.events[0].event_id,next.data.events[0].event_id);
  assert.equal((await f.post({...f.note,expected_timeline_version:version})).data.code,'review_history_capacity');
  const archived=f.sqlite.prepare('SELECT setting_value FROM app_settings WHERE setting_key=?').get(privateKey);
  assert.equal(JSON.parse(archived.setting_value).events.length,50);
  f.close();
});

test('643 confirmed saves remain visible and never invite duplicates when metadata audit fails',async()=>{
  const f=fixture();f.sqlite.exec('DROP TABLE admin_action_audit');
  const result=await f.post();assert.equal(result.status,200);
  assert.equal(result.data.saved,true);assert.equal(result.data.audit_recorded,false);
  assert.match(result.data.warning,/do not repeat/i);
  assert.equal((await f.get()).data.events.length,1);
  assert.equal((await f.post()).status,409);
  f.close();
});

test('643 review endpoint never exposes notes through generic settings or implicit order actions',()=>{
  const generic=readFileSync(new URL('../functions/api/admin/app-settings.js',import.meta.url),'utf8');
  const api=readFileSync(new URL('../functions/api/admin/owner-restock-review-notes.js',import.meta.url),'utf8');
  assert.match(generic,/WHERE setting_key NOT LIKE 'site\.admin\.owner_restock_plans\.v641\.\%'/);
  assert.match(generic,/settingKey\.startsWith\('site\.admin\.owner_restock_plans\.v641\.'/);
  assert.match(api,/private_note:true/);assert.doesNotMatch(api,/target_key:body\.note|details:\s*\{\s*note:/);
  assert.doesNotMatch(api,/(INSERT INTO|UPDATE|DELETE FROM)\s+(products|orders|purchase_orders)/i);
});

test('643 review UI is explicit, accessible and does not fetch or submit on page initialization',async()=>{
  const html=readFileSync(new URL('../admin/products/index.html',import.meta.url),'utf8');
  const src=readFileSync(new URL('../public/js/admin-owner-restock-reviews-643.js',import.meta.url),'utf8');
  for(const id of ['dd643ReviewPanel','dd643Plan','dd643Outcome','dd643Note','dd643Load',
    'dd643Save','dd643More','dd643Status','dd643Entries'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/admin-owner-restock-reviews-643\.js\?v=643/);
  assert.doesNotMatch(src,/setInterval\(|setTimeout\(|localStorage|sessionStorage|MutationObserver/);
  const element=()=>({disabled:false,value:'',textContent:'',innerHTML:'',dataset:{},events:{},
    addEventListener(type,fn){this.events[type]=fn;}});
  const ids=['dd643ReviewPanel','dd643Plan','dd643Outcome','dd643Note','dd643Load','dd643Save','dd643More','dd643Status','dd643Entries'];
  const els=Object.fromEntries(ids.map(id=>[id,element()]));const calls=[];let subscription;
  const win={DD641OwnerPlans:{snapshot:()=>({loaded:true,owner_user_id:7,version:2,plans:[{plan_id:PLAN,title:'Copper rings'}]}),
    subscribe:fn=>{subscription=fn;fn(win.DD641OwnerPlans.snapshot());}},DDAuth:{apiFetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({ok:true,private:true,owner_user_id:7,plan_id:PLAN,timeline_version:0,plan_version:2,events:[],next_cursor:null})};}}};
  runInNewContext(src,{document:{getElementById:id=>els[id]},window:win});
  assert.equal(calls.length,0);assert.equal(typeof subscription,'function');
  els.dd643Plan.value=PLAN;els.dd643Plan.events.change();els.dd643Load.events.click();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls.length,1);assert.match(calls[0].url,/owner-restock-review-notes/);
  els.dd643Note.value='Count the rings before requesting more wire';els.dd643Outcome.value='needs_physical_count';
  els.dd643Save.events.click();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls.length,2);assert.equal(calls[1].options.method,'POST');
  assert.equal(JSON.parse(calls[1].options.body).expected_timeline_version,0);
  assert.equal(calls.every(c=>/owner-restock-review-notes/.test(c.url)),true);
});

test('643 I.T. screens archive superseded technical milestones without weakening live evidence gates',()=>{
  const prelaunch=readFileSync(new URL('../admin/prelaunch/index.html',import.meta.url),'utf8');
  const projection=readFileSync(new URL('../public/js/admin-prelaunch-hub.js',import.meta.url),'utf8');
  const preflight=readFileSync(new URL('../admin/deployment-preflight/index.html',import.meta.url),'utf8');
  assert.match(prelaunch,/former Build 91 exact-SHA technical checkpoint is archived evidence/);
  assert.match(prelaunch,/current.*canonical migration list is authoritative/);
  assert.match(preflight,/Build 390\/391 are historic implementation references, not prerequisites/);
  assert.match(projection,/Archived Build \$\{VERIFIED_BUILD\} technical evidence \(historical only\)/);
  assert.doesNotMatch(projection,/const technicalGreen=true|Technical release proof<\/span><strong>GREEN/);
  assert.match(projection,/external\.unresolved\.length===0/);
  assert.match(projection,/!startup\.degraded&&startup\.open_count===0&&externalComplete/);
  assert.match(projection,/No launch readiness is inferred when an authority cannot be read/);
  const policy=readFileSync(new URL('./migration_policy_gate.py',import.meta.url),'utf8');
  assert.match(policy,/manifest\.json/);
});
