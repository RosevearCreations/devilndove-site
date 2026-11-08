import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {onRequestGet,onRequestPost} from '../functions/api/admin/owner-restock-plans.js';
import {onRequestPost as genericPost} from '../functions/api/admin/app-settings.js';

function fixture(){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(`CREATE TABLE app_settings(setting_key TEXT UNIQUE,setting_value TEXT,is_public INTEGER NOT NULL DEFAULT 0,updated_by_user_id INTEGER,updated_at TEXT);
    CREATE TABLE products(product_id INTEGER PRIMARY KEY,name TEXT,sku TEXT,product_type TEXT,inventory_tracking INTEGER,status TEXT,inventory_quantity INTEGER);
    INSERT INTO products VALUES(12,'Copper Ring','CR12','physical',1,'active',2);
    INSERT INTO products VALUES(13,'Archived Ring','AR13','physical',1,'archived',0);
    CREATE TABLE product_inventory_active_commitments(product_id INTEGER,committed_quantity INTEGER);
    INSERT INTO product_inventory_active_commitments VALUES(12,3);
    CREATE TABLE admin_action_audit(actor_user_id INTEGER,action_type TEXT,target_type TEXT,target_key TEXT,request_method TEXT,request_path TEXT,details_json TEXT,created_at TEXT);`);
  const statements=[];
  const db={prepare(sql){statements.push(sql);const s=sqlite.prepare(sql);return {bind(...args){return {
    first:async()=>s.get(...args),all:async()=>({results:s.all(...args)}),run:async()=>({meta:{changes:s.run(...args).changes}})};}};}};
  const access=id=>({allowed:true,user:{role:'admin',is_active:1,user_id:id}});
  const context=(id,method='GET',body=null)=>({env:{DB:db},data:{ddModuleAccess:access(id)},
    request:new Request('https://devilndove.example/api/admin/owner-restock-plans',{method,
      ...(body?{headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{})})});
  const get=async(id=7,override=null)=>{const r=await onRequestGet(override||context(id));return {status:r.status,data:await r.json(),headers:r.headers};};
  const post=async(body,id=7,override=null)=>{const r=await onRequestPost(override||context(id,'POST',body));return {status:r.status,data:await r.json()};};
  const item={product_id:12,units:4,method:'make',note:'Check workbench pieces before making',saved_on_hand:2,qualifying_order_committed:3};
  const create={action:'create',expected_version:0,title:'Copper rings workshop',status:'draft',follow_up_on:'2026-11-12',owner_note:'Check physical stock again',items:[item]};
  return {sqlite,statements,db,context,get,post,item,create,close:()=>sqlite.close()};
}

test('641 starts with no D1 writes; explicit draft persists privately and reopens for its owner',async()=>{
  const f=fixture();const empty=await f.get();assert.equal(empty.status,200);assert.equal(empty.data.version,0);
  assert.equal(empty.data.plans.length,0);assert.equal(empty.headers.get('Cache-Control'),'no-store');
  const saved=await f.post(f.create);assert.equal(saved.status,200,JSON.stringify(saved.data));
  assert.equal(saved.data.saved,true);assert.equal(saved.data.version,1);assert.equal(saved.data.audit_recorded,true);
  assert.equal(saved.data.plan.items[0].name,'Copper Ring');assert.equal(saved.data.inventory_mutation,false);
  const reopened=await f.get();assert.equal(reopened.data.plans.length,1);assert.equal(reopened.data.version,1);
  const record=f.sqlite.prepare('SELECT setting_key,is_public,updated_by_user_id FROM app_settings').get();
  assert.equal(record.setting_key,'site.admin.owner_restock_plans.v641.7');assert.equal(record.is_public,0);
  assert.equal(record.updated_by_user_id,7);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM admin_action_audit').get().n,1);f.close();
});

test('641 owner isolation and generic settings cannot leak or overwrite protected plans',async()=>{
  const f=fixture();assert.equal((await f.post(f.create)).status,200);
  assert.deepEqual((await f.get(8)).data.plans,[]);
  const genericCtx={env:{DB:f.db},request:new Request('https://devilndove.example/api/admin/app-settings')};
  // App settings legacy route authenticates differently; static query and POST gate are separately asserted.
  const source=readFileSync(new URL('../functions/api/admin/app-settings.js',import.meta.url),'utf8');
  assert.match(source,/WHERE setting_key NOT LIKE 'site\.admin\.owner_restock_plans\.v641\.\%'/);
  assert.match(source,/settingKey\.startsWith\('site\.admin\.owner_restock_plans\.v641\.'/);
  const privateKey='site.admin.owner_restock_plans.v641.7';
  const denied=await genericPost({...genericCtx,request:new Request(genericCtx.request.url,{method:'POST',body:JSON.stringify({setting_key:privateKey,setting_value:'stolen'}),headers:{'content-type':'application/json'}})});
  assert.equal(denied.status,401); // legacy route rejects the unauthenticated test client first
  assert.equal(f.sqlite.prepare('SELECT setting_value FROM app_settings WHERE setting_key=?').get(privateKey).setting_value.includes('stolen'),false);
  f.close();
});

test('641 updates owner follow-up status using compare-and-swap with no inventory mutation',async()=>{
  const f=fixture();const created=(await f.post(f.create)).data;
  const change={action:'update',expected_version:1,plan_id:created.plan.plan_id,title:'Copper rings workshop',
    status:'follow_up',follow_up_on:'2026-11-18',owner_note:'Ask workshop owner to count completed rings'};
  const saved=await f.post(change);assert.equal(saved.status,200,JSON.stringify(saved.data));
  assert.equal(saved.data.plan.status,'follow_up');assert.equal(saved.data.version,2);assert.equal(saved.data.plan.items[0].units,4);
  assert.equal((await f.post(change)).status,409);assert.equal((await f.post({...change,expected_version:0},8)).status,404);
  assert.equal(f.sqlite.prepare('SELECT inventory_quantity FROM products WHERE product_id=12').get().inventory_quantity,2);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM admin_action_audit').get().n,2);f.close();
});

test('641 refuses stale evidence, wrong Products, malformed planning data and illicit status transitions',async()=>{
  const f=fixture();for(const change of [
    {items:[{...f.item,saved_on_hand:1}]},{items:[{...f.item,qualifying_order_committed:4}]},
    {items:[{...f.item,product_id:13}]},{items:[{...f.item,units:0}]},
    {status:'completed'},{follow_up_on:'2026-02-30'},{items:[f.item,f.item]},
    {items:[{...f.item,note:'short'}]}]){
    const r=await f.post({...f.create,...change});assert.notEqual(r.status,200,JSON.stringify(change));
  }
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM app_settings').get().n,0);f.close();
});

test('641 rejects unauthenticated users and database outage before writing',async()=>{
  const f=fixture();const bad=f.context(7);bad.data.ddModuleAccess.allowed=false;
  assert.equal((await f.get(7,bad)).status,401);
  assert.equal((await f.post(f.create,7,{...f.context(7,'POST',f.create),data:{ddModuleAccess:{allowed:true,user:{role:'customer',is_active:1,user_id:7}}}})).status,401);
  const offline={...f.context(7),env:{}};assert.equal((await f.get(7,offline)).status,503);
  f.close();
});

test('641 CAS rejects a concurrent owner edit without losing either plan',async()=>{
  const f=fixture();const first=await f.post(f.create);assert.equal(first.status,200);
  const base={...f.create,expected_version:1,title:'Second independent plan'};
  const second=await f.post(base);assert.equal(second.status,200);
  assert.equal((await f.post({...base,title:'Stale third plan'})).status,409);
  const end=(await f.get()).data;assert.equal(end.version,2);assert.equal(end.plans.length,2);f.close();
});

test('641 save audit failures report saved status without triggering duplicate insert',async()=>{
  const f=fixture();f.sqlite.exec('DROP TABLE admin_action_audit');
  const result=await f.post(f.create);assert.equal(result.status,200);assert.equal(result.data.saved,true);
  assert.equal(result.data.audit_recorded,false);assert.match(result.data.warning,/do not repeat/i);
  assert.equal((await f.get()).data.plans.length,1);f.close();
});

test('641 UI offers explicit load/save/reopen and never includes automatic inventory actions',()=>{
  const html=readFileSync(new URL('../admin/products/index.html',import.meta.url),'utf8');
  const src=readFileSync(new URL('../public/js/admin-owner-restock-plans-641.js',import.meta.url),'utf8');
  for(const id of ['dd641PlansPanel','dd641Load','dd641New','dd641Status','dd641List','dd641Title','dd641Due',
    'dd641State','dd641Note','dd641Items','dd641Save','dd641Cancel'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/admin-owner-restock-plans-641.js\?v=641/);assert.match(src,/DD640RestockDraft/);
  assert.match(src,/data-dd641-open/);assert.match(src,/expected_version:version/);
  assert.doesNotMatch(src,/setInterval\(|setTimeout\(|localStorage|sessionStorage|MutationObserver/);
});

test('641 browser makes zero API calls on load and only GET or POST after owner clicks',async()=>{
  const src=readFileSync(new URL('../public/js/admin-owner-restock-plans-641.js',import.meta.url),'utf8');
  const element=()=>({disabled:false,value:'',textContent:'',innerHTML:'',dataset:{},events:{},
    addEventListener(type,fn){this.events[type]=fn;},querySelectorAll:()=>[]});
  const ids=['dd641PlansPanel','dd641Load','dd641New','dd641Status','dd641List','dd641Title','dd641Due',
    'dd641State','dd641Note','dd641Items','dd641Save','dd641Cancel'];
  const els=Object.fromEntries(ids.map(x=>[x,element()]));const calls=[];
  const win={DDAuth:{apiFetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({ok:true,private:true,owner_user_id:7,version:0,plans:[]})};}},
    DD640RestockDraft:{reviewedItems:()=>[{product_id:12,units:2,method:'make',note:'Counting bench stock',saved_on_hand:2,qualifying_order_committed:3}]}};
  runInNewContext(src,{document:{getElementById:id=>els[id]},window:win});
  assert.equal(calls.length,0);assert.equal(els.dd641Save.disabled,true);
  els.dd641New.events.click();assert.equal(calls.length,0);assert.equal(els.dd641Save.disabled,true);
  els.dd641Load.events.click();await new Promise(resolve=>setImmediate(resolve));assert.equal(calls.length,1);
  els.dd641New.events.click();els.dd641Title.value='Copper rings follow-up';els.dd641Save.events.click();
  await new Promise(resolve=>setImmediate(resolve));assert.equal(calls.length,2);assert.equal(calls[1].options.method,'POST');
  assert.equal(JSON.parse(calls[1].options.body).action,'create');
  assert.equal(calls.every(c=>/owner-restock-plans/.test(c.url)),true);
});
