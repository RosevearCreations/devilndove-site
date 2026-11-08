import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {onRequestGet} from '../functions/api/admin/owner-restock-review-notes.js';

const PLAN='11111111-1111-4111-8111-111111111111';
const key='site.admin.owner_restock_plans.v641.7.review.'+PLAN;
const outcomes=['needs_physical_count','needs_supplier_review','needs_workshop_review',
  'follow_up_scheduled','no_change_recommended','separate_action_recommended'];
const uuid=i=>`aaaaaaaa-aaaa-4aaa-8aaa-${String(i).padStart(12,'0')}`;

function fixture(count=24){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(`CREATE TABLE app_settings(setting_key TEXT UNIQUE,setting_value TEXT,is_public INTEGER NOT NULL DEFAULT 0,updated_by_user_id INTEGER,updated_at TEXT);
    CREATE TABLE products(product_id INTEGER PRIMARY KEY,inventory_quantity INTEGER); INSERT INTO products VALUES(5,17);`);
  const events=Array.from({length:count},(_,i)=>({event_id:uuid(i),recorded_at:`2026-11-08T${String(i%24).padStart(2,'0')}:00:00Z`,
    outcome:outcomes[i%6],note:i%2===0?`Copper wire bench count ${i}`:`Silver supplier invoice check ${i}`,
    plan_version:2,status_at_review:'follow_up',follow_up_on_at_review:'2026-11-15'}));
  const insert=sqlite.prepare('INSERT INTO app_settings(setting_key,setting_value,is_public,updated_by_user_id) VALUES(?,?,0,7)');
  insert.run('site.admin.owner_restock_plans.v641.7',JSON.stringify({schema:641,version:2,plans:[{
    plan_id:PLAN,title:'Wire and silver restock',status:'follow_up',follow_up_on:'2026-11-15'}]}));
  if(count>0)insert.run(key,JSON.stringify({schema:643,version:count,events}));
  const sql=[];const db={prepare(query){sql.push(query);const statement=sqlite.prepare(query);return {bind(...args){return {
    first:async()=>statement.get(...args),all:async()=>({results:statement.all(...args)}),
    run:async()=>({meta:{changes:statement.run(...args).changes}})};}};}};
  const request=async(params={},owner=7,active=true)=>{
    const url=new URL('https://devilndove.example/api/admin/owner-restock-review-notes');
    url.searchParams.set('plan_id',PLAN);
    for(const [name,value] of Object.entries(params))url.searchParams.set(name,value);
    const response=await onRequestGet({env:{DB:db},data:{ddModuleAccess:{allowed:active,
      user:{role:'admin',is_active:1,user_id:owner}}},request:new Request(url)});
    return {status:response.status,data:await response.json(),headers:response.headers};
  };
  return {sqlite,events,sql,request,close:()=>sqlite.close()};
}

test('644 owner search scans all bounded history, not only loaded pages, with matching 10-row paging',async()=>{
  const f=fixture(50);
  const page=await f.request({q:'copper',outcome:'needs_physical_count'});
  assert.equal(page.status,200,JSON.stringify(page.data));
  assert.equal(page.data.matched_total,9);assert.equal(page.data.events.length,9);
  assert.equal(page.data.next_cursor,null);
  assert.equal(page.data.summary.review_count,50);
  assert.equal(page.data.summary.outcome_counts.needs_physical_count,9);
  assert.equal(Object.values(page.data.summary.outcome_counts).reduce((a,b)=>a+b,0),50);
  const all=await f.request({q:'copper'});assert.equal(all.data.matched_total,25);
  assert.equal(all.data.events.length,10);assert.ok(all.data.next_cursor);
  const earlier=await f.request({q:'copper',before:all.data.next_cursor});
  assert.equal(earlier.data.events.length,10);assert.equal(earlier.data.matched_total,25);
  assert.equal(new Set([...all.data.events,...earlier.data.events].map(x=>x.event_id)).size,20);
  assert.equal(f.sqlite.prepare('SELECT inventory_quantity FROM products WHERE product_id=5').get().inventory_quantity,17);
  assert.equal(f.sql.every(x=>/^\s*SELECT\b/i.test(x)),true);
  f.close();
});

test('644 summary represents all outcomes, preserved plan facts and no inferred stock authority',async()=>{
  const f=fixture(12);const filtered=await f.request({q:'unfindable string'});
  assert.equal(filtered.status,200);assert.equal(filtered.data.matched_total,0);
  assert.deepEqual(filtered.data.events,[]);assert.equal(filtered.data.summary.review_count,12);
  assert.equal(filtered.data.summary.plan_status,'follow_up');
  assert.equal(filtered.data.summary.plan_follow_up_on,'2026-11-15');
  assert.equal(filtered.data.summary.latest_outcome,outcomes[0]);
  assert.equal(filtered.data.summary.advisory_only,true);
  assert.equal(filtered.data.summary.inventory_mutation,false);
  assert.equal(filtered.data.summary.order_mutation,false);
  assert.equal(filtered.headers.get('Cache-Control'),'no-store');f.close();
});

test('644 rejects malformed search/filter/cursor and never discloses another owner history',async()=>{
  const f=fixture();for(const params of [{q:'x'},{q:'x'.repeat(81)},{outcome:'published'},
    {before:'not-a-cursor'},{before:uuid(999)},{q:'copper',before:uuid(1)}]){
    const result=await f.request(params);assert.equal(result.status,400,JSON.stringify(params));
  }
  assert.equal((await f.request({},8)).status,404);
  assert.equal((await f.request({},7,false)).status,401);
  assert.equal((await f.request({q:'CoPpEr'})).data.matched_total,12);
  assert.equal(f.sqlite.prepare('SELECT setting_value FROM app_settings WHERE setting_key=?').get(key).setting_value.includes('Copper wire'),true);
  f.close();
});

test('644 empty history and each outcome filter retain truthful decision counts',async()=>{
  const f=fixture(0);const empty=await f.request({outcome:'no_change_recommended'});
  assert.equal(empty.status,200);assert.equal(empty.data.summary.review_count,0);
  assert.equal(empty.data.summary.latest_outcome,null);
  assert.equal(empty.data.matched_total,0);
  f.close();
  const g=fixture(24);for(const outcome of outcomes){const filtered=await g.request({outcome});
    assert.equal(filtered.data.events.length,4);assert.equal(filtered.data.matched_total,4);
    assert.equal(filtered.data.events.every(e=>e.outcome===outcome),true);
  }g.close();
});

test('644 UI is read-only, operator initiated, and does not retain or automatically submit searches',async()=>{
  const html=readFileSync(new URL('../admin/products/index.html',import.meta.url),'utf8');
  const src=readFileSync(new URL('../public/js/admin-owner-restock-search-644.js',import.meta.url),'utf8');
  for(const id of ['dd644ReviewSearch','dd644Query','dd644Outcome','dd644Search','dd644Clear',
    'dd644More','dd644Status','dd644Summary','dd644Results'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/admin-owner-restock-search-644\.js\?v=644/);
  assert.doesNotMatch(src,/setInterval\(|setTimeout\(|localStorage|sessionStorage|MutationObserver|method:'POST'/);
  const element=()=>({disabled:false,value:'',textContent:'',innerHTML:'',dataset:{},events:{},
    addEventListener(type,fn){this.events[type]=fn;}});
  const ids=['dd644ReviewSearch','dd643Plan','dd644Query','dd644Outcome','dd644Search','dd644Clear',
    'dd644More','dd644Status','dd644Summary','dd644Results'];
  const els=Object.fromEntries(ids.map(id=>[id,element()]));const calls=[];
  const data={ok:true,private:true,read_only:true,owner_user_id:7,plan_id:PLAN,plan_version:2,
    timeline_version:3,matched_total:1,search:{q:'copper',outcome:''},next_cursor:null,
    events:[{event_id:uuid(4),recorded_at:'2026-11-08',outcome:'needs_physical_count',note:'<img src=x onerror=alert(1)>',plan_version:2}],
    summary:{review_count:3,outcome_counts:Object.fromEntries(outcomes.map(x=>[x,0])),
      latest_outcome:'needs_physical_count',latest_review_at:'2026-11-08',plan_status:'follow_up',
      plan_follow_up_on:'2026-11-15',advisory_only:true,inventory_mutation:false}};
  const win={DDAuth:{apiFetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>data};}},
    DD641OwnerPlans:{subscribe:fn=>{fn({loaded:true,owner_user_id:7,version:2,plans:[{plan_id:PLAN,title:'Copper'}]});}}};
  runInNewContext(src,{document:{getElementById:id=>els[id]},window:win});
  assert.equal(calls.length,0);assert.equal(els.dd644Search.disabled,true);
  els.dd643Plan.value=PLAN;els.dd643Plan.events.change();
  els.dd644Query.value='copper';els.dd644Query.events.input();els.dd644Search.events.click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls.length,1);assert.equal(calls[0].options.method,'GET');
  assert.match(calls[0].url,/q=copper/);
  assert.match(els.dd644Results.innerHTML,/&lt;img/);
  assert.doesNotMatch(els.dd644Results.innerHTML,/<img/);
  els.dd644Clear.events.click();assert.equal(calls.length,1);
  assert.equal(els.dd644Query.value,'');assert.match(els.dd644Results.textContent,/No matching review notes loaded/);
});
