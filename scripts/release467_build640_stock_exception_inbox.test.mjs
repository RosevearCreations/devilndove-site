import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {onRequestGet,onRequestPost} from '../functions/api/admin/product-stock-exceptions.js';

function fixture(){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(`CREATE TABLE products(product_id INTEGER PRIMARY KEY,name TEXT,sku TEXT,product_type TEXT,status TEXT,
    inventory_tracking INTEGER,inventory_quantity INTEGER);
    INSERT INTO products VALUES(1,'Healthy Ring','R1','physical','active',1,15);
    INSERT INTO products VALUES(2,'Low Ring','R2','physical','active',1,5);
    INSERT INTO products VALUES(3,'Empty Pendant','P3','physical','active',1,0);
    INSERT INTO products VALUES(4,'Oversubscribed Pendant','P4','physical','active',1,2);
    INSERT INTO products VALUES(5,'Unverified Quantity','U5','physical','active',1,NULL);
    INSERT INTO products VALUES(6,'Untracked','U6','physical','active',0,0);
    INSERT INTO products VALUES(7,'Download','D7','digital','active',1,0);
    INSERT INTO products VALUES(8,'Old Archive','A8','physical','archived',1,0);
    INSERT INTO products VALUES(9,'Draft Earrings','E9','physical','draft',1,1);
    CREATE TABLE product_inventory_active_commitments(product_id INTEGER PRIMARY KEY,committed_quantity INTEGER);
    INSERT INTO product_inventory_active_commitments VALUES(1,2),(2,4),(4,5);`);
  const statements=[];const db={prepare(sql){statements.push(sql);const s=sqlite.prepare(sql);return {bind(...args){return {all:async()=>({results:s.all(...args)})};}};}};
  const access={allowed:true,user:{role:'admin',is_active:1,user_id:7}};
  const get=async(cursor=null,auth=access)=>{
    const suffix=cursor==null?'':`?cursor=${encodeURIComponent(cursor)}`;
    const res=await onRequestGet({request:new Request(`https://devilndove.example/api/admin/product-stock-exceptions${suffix}`),
      env:{DB:db},data:{ddModuleAccess:auth}});return {status:res.status,data:await res.json(),headers:res.headers};
  };
  const post=async()=>{const res=await onRequestPost();return {status:res.status,data:await res.json()};};
  return {sqlite,statements,get,post,close:()=>sqlite.close()};
}

test('Build 640 explicit bounded read returns only actionable tracked physical active/draft exceptions',async()=>{
  const f=fixture(),res=await f.get();assert.equal(res.status,200,JSON.stringify(res.data));
  assert.equal(res.data.read_only,true);assert.equal(res.data.automatic,false);assert.equal(res.data.page_size,20);
  assert.equal(res.data.scanned_count,6);assert.equal(res.data.exceptions.length,5);
  assert.deepEqual(res.data.exceptions.map(x=>x.product_id),[9,5,4,3,2]);
  assert.equal(res.data.exceptions.some(x=>x.product_id===1||x.product_id===6||x.product_id===7||x.product_id===8),false);
  assert.equal(res.data.has_more,false);assert.match(res.data.priority_scope,/within fetched records/);
  assert.equal(res.headers.get('Cache-Control'),'no-store');
  assert.equal(f.statements.length,1);assert.match(f.statements[0],/LIMIT \?/);
  assert.match(f.statements[0],/LEFT JOIN product_inventory_active_commitments/);
  assert.doesNotMatch(f.statements[0],/\bUPDATE\b|\bINSERT\b|\bDELETE\b|\bPRAGMA\b/i);f.close();
});

test('Build 640 explanations and unit suggestions are based on real Product and qualified order numbers',async()=>{
  const f=fixture(),result=(await f.get()).data,byId=id=>result.exceptions.find(p=>p.product_id===id);
  assert.equal(byId(2).kind,'low');assert.equal(byId(2).remaining_after_orders,1);assert.equal(byId(2).suggested_units_to_review,2);
  assert.equal(byId(3).kind,'unavailable');assert.equal(byId(3).suggested_units_to_review,3);
  assert.equal(byId(4).kind,'overcommitted');assert.equal(byId(4).remaining_after_orders,-3);assert.equal(byId(4).suggested_units_to_review,6);
  assert.equal(byId(5).kind,'source_hold');assert.equal(byId(5).suggested_units_to_review,null);
  assert.match(result.commitment_scope,/post-cutover/);assert.match(result.planning_note,/NOT approved/);
  f.close();
});

test('Build 640 missing or invalid commitment authority holds the entire inbox',async()=>{
  const f=fixture();f.sqlite.exec('DROP TABLE product_inventory_active_commitments');
  const missing=await f.get();assert.equal(missing.status,503);assert.equal(missing.data.code,'source_scan_unavailable');
  f.sqlite.exec('CREATE TABLE product_inventory_active_commitments(product_id INTEGER,committed_quantity INTEGER);INSERT INTO product_inventory_active_commitments VALUES(2,NULL)');
  const invalid=await f.get();assert.equal(invalid.status,503);assert.equal(invalid.data.code,'source_scan_unavailable');
  f.close();
});

test('Build 640 pages advance strictly by Product ID and never auto-scan or claim global ranking',async()=>{
  const f=fixture();for(let i=10;i<=35;i++)f.sqlite.prepare(`INSERT INTO products VALUES(?,?,?,?,?,?,?)`).run(i,`Ring ${i}`,`S${i}`,'physical','active',1,0);
  const first=await f.get();assert.equal(first.status,200);assert.equal(first.data.scanned_count,20);
  assert.equal(first.data.has_more,true);const cursor=first.data.next_cursor;assert.equal(cursor,16);
  const second=await f.get(cursor);assert.equal(second.status,200);assert.equal(second.data.has_more,false);
  assert.equal(second.data.scanned_count,12);
  assert.ok(second.data.exceptions.every(x=>x.product_id<cursor));
  assert.equal(f.statements.length,2);f.close();
});

test('Build 640 rejects malformed cursor, denied admin and unintended write operations',async()=>{
  const f=fixture();assert.equal((await f.get(null,{allowed:false,user:{role:'admin',is_active:1,user_id:7}})).status,401);
  assert.equal((await f.get(null,{allowed:true,user:{role:'customer',is_active:1,user_id:7}})).status,401);
  for(const cursor of ['0','-1','abc','1.2','999999999999999999'])assert.equal((await f.get(cursor)).status,400);
  const post=await f.post();assert.equal(post.status,405);assert.match(post.data.error,/read-only/);
  assert.equal(f.statements.length,0);f.close();
});

test('Build 640 responsive exception inbox exposes scan, next, plan review and unsaved copy affordances',()=>{
  const html=readFileSync(new URL('../admin/products/index.html',import.meta.url),'utf8');
  const src=readFileSync(new URL('../public/js/admin-product-stock-exceptions-640.js',import.meta.url),'utf8');
  for(const id of ['dd640ExceptionPanel','dd640Scan','dd640Next','dd640Status','dd640Scope','dd640Rows',
    'dd640Draft','dd640Prepare','dd640Copy','dd640Reset','dd640Preview'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/qualifying post-cutover order commitments/);
  assert.match(src,/data-dd640-plan-id/);assert.match(src,/clipboard.writeText/);
  assert.doesNotMatch(src,/setInterval\(|setTimeout\(|MutationObserver|localStorage|sessionStorage/);
});

test('Build 640 browser does no extra reads until explicit clicks and never writes inventory',async()=>{
  const src=readFileSync(new URL('../public/js/admin-product-stock-exceptions-640.js',import.meta.url),'utf8');
  const element=()=>({disabled:false,value:'',textContent:'',innerHTML:'',dataset:{},events:{},
    addEventListener(type,handler){this.events[type]=handler;},querySelectorAll:()=>[],focus(){},select(){}});
  const ids=['dd640ExceptionPanel','dd640Scan','dd640Next','dd640Status','dd640Rows','dd640Scope','dd640Draft',
    'dd640DraftStatus','dd640Preview','dd640Prepare','dd640Copy','dd640Reset'];
  const els=Object.fromEntries(ids.map(x=>[x,element()])),calls=[];
  const first={ok:true,read_only:true,automatic:false,page_size:20,scanned_count:20,has_more:true,next_cursor:11,
    exceptions:[{product_id:15,name:'Ring 15',sku:'R15',status:'active',saved_on_hand:2,qualifying_order_committed:3,
      remaining_after_orders:-1,kind:'overcommitted',suggested_units_to_review:4}]};
  const second={ok:true,read_only:true,automatic:false,page_size:20,scanned_count:2,has_more:false,next_cursor:null,
    exceptions:[{product_id:4,name:'Ring 4',sku:'R4',status:'active',saved_on_hand:0,qualifying_order_committed:0,
      remaining_after_orders:0,kind:'unavailable',suggested_units_to_review:3}]};
  const window={DDAuth:{apiFetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>calls.length===1?first:second};}}};
  runInNewContext(src,{window,document:{getElementById:id=>els[id]||null}});
  const tick=()=>new Promise(resolve=>setImmediate(resolve));await tick();assert.equal(calls.length,0);
  assert.equal(els.dd640Next.disabled,true);
  els.dd640Scan.events.click();await tick();assert.equal(calls.length,1);assert.equal(els.dd640Next.disabled,false);
  assert.match(els.dd640Rows.innerHTML,/overcommitted/);
  els.dd640Next.events.click();await tick();assert.equal(calls.length,2);
  assert.match(calls[1].url,/cursor=11/);assert.equal(els.dd640Next.disabled,true);
  assert.equal(calls.every(c=>c.options.method==='GET'),true);
});

test('Build 640 a failed source read clears stale exception/planning state and never retries',async()=>{
  const src=readFileSync(new URL('../public/js/admin-product-stock-exceptions-640.js',import.meta.url),'utf8');
  const element=()=>({disabled:false,value:'',textContent:'',innerHTML:'',dataset:{},events:{},
    addEventListener(type,handler){this.events[type]=handler;},querySelectorAll:()=>[]});
  const ids=['dd640ExceptionPanel','dd640Scan','dd640Next','dd640Status','dd640Rows','dd640Scope','dd640Draft',
    'dd640DraftStatus','dd640Preview','dd640Prepare','dd640Copy','dd640Reset'];
  const els=Object.fromEntries(ids.map(x=>[x,element()]));let count=0;
  const window={DDAuth:{apiFetch:async()=>{count++;return {ok:false,status:503,json:async()=>({error:'Commitment authority unavailable'})};}}};
  runInNewContext(src,{window,document:{getElementById:id=>els[id]||null}});
  els.dd640Scan.events.click();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(count,1);assert.match(els.dd640Status.textContent,/HOLD/);assert.equal(els.dd640Next.disabled,true);
  assert.equal(els.dd640Prepare.disabled,true);
});

test('Build 640 draft plan requires a factual note, prepares review text and copies without DB writes',async()=>{
  const src=readFileSync(new URL('../public/js/admin-product-stock-exceptions-640.js',import.meta.url),'utf8');
  const control=(value='')=>({value,textContent:'',innerHTML:'',disabled:false,dataset:{},events:{},
    addEventListener(kind,fn){this.events[kind]=fn;}});
  const ids=['dd640ExceptionPanel','dd640Scan','dd640Next','dd640Status','dd640Rows','dd640Scope','dd640Draft',
    'dd640DraftStatus','dd640Preview','dd640Prepare','dd640Copy','dd640Reset'];
  const els=Object.fromEntries(ids.map(x=>[x,control()]));
  const plan=control();plan.dataset.dd640PlanId='1';
  const note=control();note.dataset.dd640Note='1';
  const units=control('4');units.dataset.dd640Units='1';
  const method=control('make');method.dataset.dd640Method='1';
  els.dd640Rows.querySelectorAll=s=>s==='[data-dd640-plan-id]'?[plan]:[];
  els.dd640Draft.querySelectorAll=s=>s==='[data-dd640-note]'?[note]:s==='[data-dd640-units]'?[units]:s==='[data-dd640-method]'?[method]:[];
  const calls=[],copies=[];
  const data={ok:true,read_only:true,automatic:false,page_size:20,scanned_count:1,has_more:false,next_cursor:null,
    exceptions:[{product_id:1,name:'Copper Ring',sku:'CR1',status:'active',saved_on_hand:1,qualifying_order_committed:2,
      remaining_after_orders:-1,kind:'overcommitted',suggested_units_to_review:4}]};
  const window={DDAuth:{apiFetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>data};}},
    navigator:{clipboard:{writeText:async text=>{copies.push(text);}}}};
  runInNewContext(src,{window,document:{getElementById:id=>els[id]||null}});
  const tick=()=>new Promise(resolve=>setImmediate(resolve));
  els.dd640Scan.events.click();await tick();assert.equal(calls.length,1);
  plan.events.click();assert.equal(els.dd640Prepare.disabled,false);
  els.dd640Prepare.events.click();assert.match(els.dd640DraftStatus.textContent,/Fix Copper Ring/);
  assert.equal(els.dd640Copy.disabled,true);
  note.value='Physically confirm the copper rings before making more';note.events.input();
  els.dd640Prepare.events.click();assert.match(els.dd640Preview.value,/UNSAVED OWNER RESTOCK PLAN/);
  assert.match(els.dd640Preview.value,/source=make/);assert.equal(els.dd640Copy.disabled,false);
  els.dd640Copy.events.click();await tick();assert.equal(copies.length,1);assert.equal(calls.length,1);
  els.dd640Reset.events.click();assert.equal(els.dd640Copy.disabled,true);
});
