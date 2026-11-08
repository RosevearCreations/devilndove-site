import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {onRequestGet,onRequestPost} from '../functions/api/admin/product-inventory-reconciliation.js';

function fixture(){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(`CREATE TABLE products(product_id INTEGER PRIMARY KEY,name TEXT,sku TEXT,product_type TEXT,status TEXT,
    inventory_tracking INTEGER,inventory_quantity INTEGER,updated_at TEXT,price_cents INTEGER);
    INSERT INTO products VALUES(1,'Silver Ring','SR1','physical','active',1,8,'2026-11-01',4000);
    INSERT INTO products VALUES(2,'Draft Pendant','DP2','physical','draft',1,3,'2026-11-02',1200);
    INSERT INTO products VALUES(3,'Download','DO3','digital','active',1,2,'2026-11-03',500);
    INSERT INTO products VALUES(4,'Untracked','UN4','physical','active',0,2,'2026-11-04',700);
    INSERT INTO products VALUES(5,'Archived','AR5','physical','archived',1,2,'2026-11-05',900);
    CREATE TABLE product_inventory_active_commitments(product_id INTEGER PRIMARY KEY,committed_quantity INTEGER);
    INSERT INTO product_inventory_active_commitments VALUES(1,5);
    CREATE TABLE admin_action_audit(admin_action_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,actor_user_id INTEGER,
      action_type TEXT,target_type TEXT,target_id INTEGER,target_key TEXT,request_method TEXT,request_path TEXT,details_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_id,details_json)
      VALUES(7,'owner_reviewed_finished_product_restock','product',1,
        '{"before_quantity":6,"units_received":2,"after_quantity":8,"receipt_note":"Received two finished rings"}');
    INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_id,details_json)
      VALUES(7,'update_product_low_read','product',1,'{"fields_changed":["name"]}');
    INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_id,details_json)
      VALUES(7,'update_product_low_read','product',1,'{"fields_changed":["inventory_quantity"]}');
    INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_id,details_json)
      VALUES(7,'owner_reviewed_finished_product_restock','product',2,'{"before_quantity":1,"after_quantity":3}');`);
  const statements=[];let beforeUpdate=null;
  const db={prepare(sql){statements.push(sql);const stmt=sqlite.prepare(sql);return {bind(...args){return {
    first:async()=>stmt.get(...args),all:async()=>({results:stmt.all(...args)}),
    run:async()=>{if(beforeUpdate&&sql.startsWith('UPDATE products'))beforeUpdate();const result=stmt.run(...args);return {meta:{changes:result.changes}};}
  };}};}};
  const access={allowed:true,user:{role:'admin',is_active:1,user_id:7}};
  async function get(id=1,override=access){const response=await onRequestGet({request:new Request(`https://devilndove.com/api/admin/product-inventory-reconciliation?product_id=${id}`),
    env:{DB:db},data:{ddModuleAccess:override}});return {status:response.status,data:await response.json()};}
  async function post(body,override=access,origin=null){const response=await onRequestPost({request:new Request('https://devilndove.com/api/admin/product-inventory-reconciliation',
    {method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify(body)}),
    env:{DB:db},data:{ddModuleAccess:override}});return {status:response.status,data:await response.json()};}
  return {sqlite,statements,get,post,setBeforeUpdate(fn){beforeUpdate=fn;},
    row:id=>sqlite.prepare('SELECT * FROM products WHERE product_id=?').get(id),close:()=>sqlite.close()};
}
const note='Counted five rings in our physical tray';
const preview={action:'preview',product_id:1,counted_quantity:5,note};
const apply=p=>({...preview,action:'apply',snapshot:p.data.snapshot,previewed_at:p.data.previewed_at,
  owner_confirmed:true,acknowledgement:'I VERIFIED PHYSICAL COUNT AND ORDER COMMITMENTS'});

test('Build 638 history is bounded, admin-only, filtered and explicitly incomplete',async()=>{
  const f=fixture();
  assert.equal((await f.get(1,{allowed:true,user:{role:'customer',is_active:1,user_id:8}})).status,401);
  assert.equal((await f.get(1,{allowed:false,user:{role:'admin',is_active:1,user_id:7}})).status,401);
  const data=await f.get();assert.equal(data.status,200);
  assert.equal(data.data.history_complete,false);assert.equal(data.data.events.length,2);
  assert.equal(data.data.events[0].action,'Product Editor stock field changed');
  assert.equal(data.data.events[0].before_quantity,null);
  assert.equal(data.data.events[1].action,'Finished Product restock');
  assert.equal(data.data.events[1].before_quantity,6);assert.equal(data.data.events[1].after_quantity,8);
  assert.equal(data.data.events.every(e=>e.actor_user_id===7),true);
  assert.equal(data.data.events.some(e=>e.note.includes('two finished')),true);
  assert.equal(f.statements.length,2);assert.match(f.statements[1],/LIMIT 40/);
  assert.doesNotMatch(f.statements[1],/\bJOIN\b|\bUPDATE\b|\bPRAGMA\b/i);
  f.close();
});

test('Build 638 unavailable audit authority never means no historical stock changes',async()=>{
  const f=fixture();f.sqlite.exec('DROP TABLE admin_action_audit');
  const result=await f.get();assert.equal(result.status,503);assert.equal(result.data.code,'history_unavailable');f.close();
});

test('Build 638 preview compares actual stock and checks committed quantity without writing',async()=>{
  const f=fixture();const result=await f.post(preview);
  assert.equal(result.status,200,JSON.stringify(result.data));assert.equal(result.data.difference,-3);
  assert.equal(result.data.committed_quantity,5);assert.equal(result.data.saved,false);
  assert.equal(result.data.storefront_availability_may_change,true);
  assert.equal(f.row(1).inventory_quantity,8);
  assert.equal(f.statements.filter(s=>s.startsWith('UPDATE products')).length,0);f.close();
});

test('Build 638 identical physical count is no-op and cannot be approved as a write',async()=>{
  const f=fixture(),same={...preview,counted_quantity:8};
  const p=await f.post(same);assert.equal(p.status,200);assert.equal(p.data.discrepancy,false);
  const applied=await f.post({...same,action:'apply',owner_confirmed:true,acknowledgement:'I VERIFIED PHYSICAL COUNT AND ORDER COMMITMENTS',previewed_at:Date.now(),snapshot:{}});
  assert.equal(applied.status,409);assert.equal(applied.data.code,'stale_count_preview');f.close();
});

test('Build 638 owner-reviewed decrease is confirmed and writes the exact audit record',async()=>{
  const f=fixture(),p=await f.post(preview),saved=await f.post(apply(p));
  assert.equal(saved.status,200,JSON.stringify(saved.data));assert.equal(saved.data.confirmed,true);
  assert.equal(saved.data.audit_recorded,true);assert.equal(saved.data.counted_quantity,5);
  assert.equal(f.row(1).inventory_quantity,5);assert.equal(f.row(1).price_cents,4000);
  const history=await f.get();assert.equal(history.data.events[0].source_action,'owner_reviewed_finished_product_count_correction');
  assert.equal(history.data.events[0].delta,-3);
  const duplicate=await f.post(apply(p));assert.equal(duplicate.status,409);
  assert.equal(duplicate.data.code,'stale_count_preview');assert.equal(f.row(1).inventory_quantity,5);f.close();
});

test('Build 638 missing commitment view and below-commitment counts fail closed',async()=>{
  const f=fixture();const low=await f.post({...preview,counted_quantity:4});
  assert.equal(low.status,409);assert.equal(low.data.code,'below_order_commitments');
  f.sqlite.exec('DROP TABLE product_inventory_active_commitments');
  const unknown=await f.post(preview);assert.equal(unknown.status,409);assert.equal(unknown.data.code,'commitments_unavailable');
  assert.equal(f.row(1).inventory_quantity,8);
  const increase=await f.post({...preview,counted_quantity:9});assert.equal(increase.status,200);
  f.close();
});

test('Build 638 denies unverified admins, cross-origin, malformed count requests and ineligible Products',async()=>{
  const f=fixture();const restricted={allowed:true,user:{role:'admin',is_active:0,user_id:7}};
  assert.equal((await f.post(preview,restricted)).status,401);
  assert.equal((await f.post(preview,undefined,'https://untrusted.example')).status,403);
  for(const body of [
    {...preview,product_id:3},{...preview,product_id:4},{...preview,product_id:5},
    {...preview,counted_quantity:-1},{...preview,counted_quantity:1000001},{...preview,counted_quantity:2.5},
    {...preview,counted_quantity:'5'},{...preview,note:'short'},{...preview,note:23},
    {...preview,price_cents:0},{...preview,action:'publish'}
  ])assert.ok((await f.post(body)).status>=400);
  assert.equal(f.statements.filter(s=>s.startsWith('UPDATE products')).length,0);f.close();
});

test('Build 638 stale, expired and unconfirmed owner approvals cannot change Product stock',async()=>{
  const f=fixture(),p=await f.post(preview),request=apply(p);
  assert.equal((await f.post({...request,owner_confirmed:false})).status,403);
  assert.equal((await f.post({...request,acknowledgement:'yes'})).status,403);
  assert.equal((await f.post({...request,previewed_at:Date.now()-6*60*1000})).status,409);
  f.sqlite.prepare("UPDATE products SET name='Renamed elsewhere' WHERE product_id=1").run();
  const stale=await f.post(request);assert.equal(stale.status,409);assert.equal(stale.data.code,'stale_count_preview');
  assert.equal(f.row(1).inventory_quantity,8);f.close();
});

test('Build 638 commitment race and database trigger cannot over-reduce finished inventory',async()=>{
  const f=fixture(),p=await f.post(preview);
  f.setBeforeUpdate(()=>f.sqlite.prepare('UPDATE product_inventory_active_commitments SET committed_quantity=7 WHERE product_id=1').run());
  const contested=await f.post(apply(p));assert.equal(contested.status,409);
  assert.equal(contested.data.code,'count_update_unconfirmed');assert.equal(f.row(1).inventory_quantity,8);
  f.setBeforeUpdate(null);f.sqlite.prepare('UPDATE product_inventory_active_commitments SET committed_quantity=5 WHERE product_id=1').run();
  f.sqlite.exec("CREATE TRIGGER block_count BEFORE UPDATE ON products WHEN NEW.product_id=1 BEGIN SELECT RAISE(ABORT,'protected stock'); END;");
  const blocked=await f.post(apply(p));assert.equal(blocked.status,409);assert.equal(f.row(1).inventory_quantity,8);f.close();
});

test('Build 638 confirmed stock with missing audit remains honestly confirmed but not audited',async()=>{
  const f=fixture(),p=await f.post(preview);
  f.sqlite.exec("CREATE TRIGGER stop_audit BEFORE INSERT ON admin_action_audit BEGIN SELECT RAISE(ABORT,'audit unavailable'); END;");
  const saved=await f.post(apply(p));assert.equal(saved.status,200);
  assert.equal(saved.data.confirmed,true);assert.equal(saved.data.audit_recorded,false);
  assert.match(saved.data.warning,/Do not retry/);assert.equal(f.row(1).inventory_quantity,5);f.close();
});

test('Build 638 count/history screen exposes accessible controls and no automatic read or writes',()=>{
  const html=readFileSync(new URL('../admin/products/index.html',import.meta.url),'utf8');
  const browser=readFileSync(new URL('../public/js/admin-products-browser-v162.js',import.meta.url),'utf8');
  const client=readFileSync(new URL('../public/js/admin-product-count-history-638.js',import.meta.url),'utf8');
  for(const id of ['dd638CountPanel','dd638CountProduct','dd638HistoryStatus','dd638HistoryRows','dd638CountedQuantity',
    'dd638CountNote','dd638CountPreview','dd638CountOwnerConfirmed','dd638CountApply','dd638HistoryRefresh'])
    assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/History is partial/);assert.match(browser,/data-dd638-count-id/);
  assert.match(client,/action:'preview'/);assert.match(client,/action:'apply'/);
  assert.doesNotMatch(client,/setTimeout\(|setInterval\(|MutationObserver/);
});

test('Build 638 browser requires an owner count, preview and confirmation before one Apply',async()=>{
  const source=readFileSync(new URL('../public/js/admin-product-count-history-638.js',import.meta.url),'utf8');
  const el=(value='')=>({value,disabled:false,hidden:false,checked:false,dataset:{},textContent:'',innerHTML:'',events:{},
    addEventListener(type,callback){this.events[type]=callback;},focus(){}});
  const ids=['dd638CountPanel','dd638CountProduct','dd638HistoryStatus','dd638HistoryRows','dd638CountedQuantity',
    'dd638CountNote','dd638CountStatus','dd638CountComparison','dd638CountPreview','dd638CountApply',
    'dd638CountOwnerConfirmed','dd638HistoryRefresh','dd638CountClose'];
  const controls=Object.fromEntries(ids.map(id=>[id,el()])),calls=[];
  let invalidations=0;
  const window={DDAuth:{apiFetch:async(url,options={})=>{
    const payload=options.body?JSON.parse(options.body):null;calls.push({url,payload});
    const data=!payload?{ok:true,product:{product_id:1,inventory_quantity:8},events:[],history_complete:false,history_warning:'Partial history only.'}:
      payload.action==='preview'?{ok:true,action:'preview',product_id:1,product_name:'Silver Ring',status:'active',saved:false,
        counted_quantity:5,before_quantity:8,difference:-3,committed_quantity:5,note:payload.note,
        snapshot:{product_id:1,name:'Silver Ring',status:'active',product_type:'physical',inventory_tracking:1,inventory_quantity:8,updated_at:'2026-11-01'},
        previewed_at:Date.now(),storefront_availability_may_change:true}:
        {ok:true,action:'apply',confirmed:true,product_id:1,before_quantity:8,counted_quantity:5,audit_recorded:true};
    return {ok:true,json:async()=>data};
  }},DD638InvalidateProductBrowser:()=>{invalidations++;}};
  runInNewContext(source,{window,document:{getElementById:id=>controls[id]||null}});
  const tick=()=>new Promise(resolve=>setImmediate(resolve));await tick();assert.equal(calls.length,0,'no automatic history read');
  window.DD638CountHistory.open({product_id:1,name:'Silver Ring'});await tick();assert.equal(calls.length,1);
  assert.equal(controls.dd638CountApply.disabled,true);
  controls.dd638CountedQuantity.value='5';controls.dd638CountedQuantity.events.input();
  controls.dd638CountNote.value=note;controls.dd638CountNote.events.input();
  controls.dd638CountPreview.events.click();await tick();assert.equal(calls.length,2);
  assert.equal(calls[1].payload.action,'preview');assert.equal(controls.dd638CountApply.disabled,true);
  controls.dd638CountOwnerConfirmed.checked=true;controls.dd638CountOwnerConfirmed.events.change();
  assert.equal(controls.dd638CountApply.disabled,false);
  controls.dd638CountApply.events.click();await tick();assert.equal(calls.length,3);
  assert.equal(calls[2].payload.action,'apply');assert.equal(invalidations,1);
  assert.equal(controls.dd638CountApply.disabled,true);assert.match(controls.dd638CountStatus.textContent,/Saved/);
});
