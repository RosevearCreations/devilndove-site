import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {onRequestGet,onRequestPost} from '../functions/api/admin/product-stock-visibility.js';

function fixture(){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(`CREATE TABLE products(product_id INTEGER PRIMARY KEY,name TEXT,sku TEXT,product_type TEXT,status TEXT,
    inventory_tracking INTEGER,inventory_quantity INTEGER,updated_at TEXT);
    INSERT INTO products VALUES(1,'Silver & Gold Ring','R1','physical','active',1,8,'2026-11-01');
    INSERT INTO products VALUES(2,'Draft Soap','S2','physical','draft',1,3,'2026-11-01');
    INSERT INTO products VALUES(3,'Digital File','D3','digital','active',0,9,'2026-11-01');
    INSERT INTO products VALUES(4,'Broken Stock','B4','physical','active',1,-1,'2026-11-01');
    CREATE TABLE product_inventory_active_commitments(product_id INTEGER PRIMARY KEY,committed_quantity INTEGER);
    INSERT INTO product_inventory_active_commitments VALUES(1,5);
    CREATE TABLE maker_finished_piece_sellability(product_id INTEGER PRIMARY KEY,serialised_quantity INTEGER,
      unavailable_quantity INTEGER,available_quantity INTEGER);
    INSERT INTO maker_finished_piece_sellability VALUES(1,4,2,1);
    CREATE TABLE product_finished_inventory_lots(product_finished_inventory_lot_id INTEGER PRIMARY KEY,
      product_id INTEGER,lot_key TEXT,source_kind TEXT,lot_status TEXT,quantity_created INTEGER,created_at TEXT);
    INSERT INTO product_finished_inventory_lots VALUES(1,1,'LOT-FIRST','production','available',5,'2026-10-01');
    INSERT INTO product_finished_inventory_lots VALUES(2,1,'LOT-SECOND','production','available',3,'2026-10-03');`);
  const statements=[];
  const db={prepare(sql){statements.push(sql);const s=sqlite.prepare(sql);return {bind(...args){return {
    first:async()=>s.get(...args),all:async()=>({results:s.all(...args)})
  };}};}};
  const allowed={allowed:true,user:{role:'admin',is_active:1,user_id:7}};
  const get=async(id='1',auth=allowed)=>{
    const res=await onRequestGet({request:new Request(`https://devilndove.example/api/admin/product-stock-visibility?product_id=${encodeURIComponent(id)}`),
      env:{DB:db},data:{ddModuleAccess:auth}});return {status:res.status,data:await res.json(),headers:res.headers};
  };
  const post=async()=>{const res=await onRequestPost();return {status:res.status,data:await res.json()};};
  return {sqlite,statements,get,post,close:()=>sqlite.close()};
}

test('Build 639 read-only one-Product stock and qualifying orders are separated correctly',async()=>{
  const f=fixture(),res=await f.get();assert.equal(res.status,200,JSON.stringify(res.data));
  assert.equal(res.data.read_only,true);assert.equal(res.data.automatic,false);
  assert.equal(res.data.stock.on_hand_quantity,8);assert.equal(res.data.stock.order_committed_quantity,5);
  assert.equal(res.data.stock.remaining_after_recorded_orders,3);assert.equal(res.data.stock.oversubscribed,false);
  assert.equal(res.data.stock.sale_eligible_product,true);
  assert.match(res.data.commitments.scope,/post-cutover/);assert.match(res.data.commitments.scope,/refunded/);
  assert.match(res.data.availability_warning,/upper bound/);assert.equal(res.headers.get('Cache-Control'),'no-store');
  assert.equal(f.statements.length,4);assert.ok(f.statements.every(sql=>/^SELECT\b/i.test(sql.trim())));
  assert.equal(f.statements[3].includes('LIMIT 7'),true);assert.equal(res.data.external_provider_actions,false);f.close();
});

test('Build 639 optional serialized restrictions and finished lots are separate, not summed with stock',async()=>{
  const f=fixture(),res=await f.get();assert.equal(res.data.serialized_pieces.state,'verified');
  assert.equal(res.data.serialized_pieces.registered_quantity,4);assert.equal(res.data.serialized_pieces.unavailable_quantity,2);
  assert.equal(res.data.serialized_pieces.view_available_quantity,1);assert.match(res.data.serialized_pieces.description,/overlap/);
  assert.equal(res.data.lots.state,'verified');assert.deepEqual(res.data.lots.records.map(x=>x.lot_key),['LOT-SECOND','LOT-FIRST']);
  assert.equal(res.data.stock.remaining_after_recorded_orders,3);
  assert.match(res.data.lots.description,/NOT a current saleable/);f.close();
});

test('Build 639 zero qualifying committed rows is expressly scoped and not total historical zero',async()=>{
  const f=fixture(),res=await f.get('2');assert.equal(res.status,200);
  assert.equal(res.data.stock.remaining_after_recorded_orders,3);assert.equal(res.data.stock.order_committed_quantity,0);
  assert.match(res.data.commitments.zero_note,/other holds or historical orders/);
  assert.equal(res.data.product.status,'draft');assert.equal(res.data.stock.sale_eligible_product,false);
  assert.equal(res.data.serialized_pieces.state,'no_serialized_record');f.close();
});

test('Build 639 overcommitted Product warns without mutating or masking its deficit',async()=>{
  const f=fixture();f.sqlite.exec('UPDATE product_inventory_active_commitments SET committed_quantity=12 WHERE product_id=1');
  const res=await f.get();assert.equal(res.status,200);assert.equal(res.data.stock.status,'below_commitments');
  assert.equal(res.data.stock.oversubscribed,true);assert.equal(res.data.stock.remaining_after_recorded_orders,0);
  assert.equal(res.data.stock.on_hand_quantity,8);f.close();
});

test('Build 639 missing, null and negative commitment evidence blocks the entire stock review',async()=>{
  const f=fixture();f.sqlite.exec('DROP TABLE product_inventory_active_commitments');
  const missing=await f.get();assert.equal(missing.status,503);assert.equal(missing.data.code,'commitments_unavailable');
  f.sqlite.exec('CREATE TABLE product_inventory_active_commitments(product_id INTEGER,committed_quantity INTEGER);INSERT INTO product_inventory_active_commitments VALUES(1,NULL)');
  const invalid=await f.get();assert.equal(invalid.status,503);assert.equal(invalid.data.code,'commitments_invalid');
  f.sqlite.exec('UPDATE product_inventory_active_commitments SET committed_quantity=-5 WHERE product_id=1');
  assert.equal((await f.get()).data.code,'commitments_invalid');f.close();
});

test('Build 639 missing optional lot or serial source does not claim missing physical stock',async()=>{
  const f=fixture();f.sqlite.exec('DROP TABLE maker_finished_piece_sellability;DROP TABLE product_finished_inventory_lots');
  const res=await f.get();assert.equal(res.status,200);assert.equal(res.data.serialized_pieces.state,'unavailable');
  assert.equal(res.data.lots.state,'unavailable');assert.equal(res.data.stock.remaining_after_recorded_orders,3);f.close();
});

test('Build 639 invalid, untracked or non-physical stock does not invent sellable quantities',async()=>{
  const f=fixture();const invalid=await f.get('4');assert.equal(invalid.data.stock.status,'invalid_recorded_stock');
  assert.equal(invalid.data.stock.remaining_after_recorded_orders,null);
  const digital=await f.get('3');assert.equal(digital.data.stock.status,'untracked_or_nonphysical');
  assert.equal(digital.data.stock.remaining_after_recorded_orders,null);f.close();
});

test('Build 639 access boundaries deny non-admins and malformed/missing Product identity',async()=>{
  const f=fixture();for(const auth of [null,{allowed:false,user:{role:'admin',is_active:1,user_id:7}},
    {allowed:true,user:{role:'customer',is_active:1,user_id:1}},{allowed:true,user:{role:'admin',is_active:0,user_id:7}}])
    assert.equal((await f.get('1',auth)).status,401);
  for(const id of ['0','-1','abc','1.3','99999999999999999999'])assert.equal((await f.get(id)).status,400);
  assert.equal((await f.get('123')).status,404);f.close();
});

test('Build 639 explicitly refuses stock mutation by POST',async()=>{
  const f=fixture();const result=await f.post();assert.equal(result.status,405);
  assert.match(result.data.error,/read-only/);assert.equal(f.statements.length,0);f.close();
});

test('Build 639 UI has explicit actions in Product Browser and Editor, no polling, and clear scope',()=>{
  const browse=readFileSync(new URL('../admin/products/index.html',import.meta.url),'utf8');
  const editor=readFileSync(new URL('../admin/product-editor/index.html',import.meta.url),'utf8');
  const list=readFileSync(new URL('../public/js/admin-products-browser-v162.js',import.meta.url),'utf8');
  const client=readFileSync(new URL('../public/js/admin-product-stock-visibility-639.js',import.meta.url),'utf8');
  for(const html of [browse,editor])for(const id of ['dd639StockPanel','dd639StockStatus','dd639StockResults','dd639StockReload','dd639StockClose'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(editor,/dd639EditorReview/);assert.match(list,/data-dd639-stock-id/);
  assert.match(client,/on-demand|explicit admin click/);assert.match(client,/not guaranteed sellable/);
  assert.doesNotMatch(client,/setTimeout\(|setInterval\(|MutationObserver/);
});

test('Build 639 browser only queries after explicit operator click and never writes',async()=>{
  const source=readFileSync(new URL('../public/js/admin-product-stock-visibility-639.js',import.meta.url),'utf8');
  const element=()=>({hidden:false,disabled:false,textContent:'',innerHTML:'',dataset:{},events:{},
    addEventListener(kind,callback){this.events[kind]=callback;},scrollIntoView(){}});
  const ids=['dd639StockPanel','dd639StockStatus','dd639StockResults','dd639StockReload','dd639StockClose'];
  const els=Object.fromEntries(ids.map(x=>[x,element()])),calls=[];
  const window={DDAuth:{apiFetch:async(url,opts)=>{calls.push({url,opts});return {ok:true,json:async()=>({ok:true,read_only:true,
    product:{product_id:1,name:'Silver & Gold Ring',sku:'R1',status:'active'},
    stock:{on_hand_quantity:8,order_committed_quantity:5,remaining_after_recorded_orders:3,status:'verified',sale_eligible_product:true},
    commitments:{verified:true,scope:'Post-cutover only'},serialized_pieces:{state:'unavailable',description:'Not verified'},
    lots:{state:'unavailable',description:'Not current stock'},availability_warning:'Upper bound only',checked_at:'2026-11-08'})};}},location:{search:''}};
  runInNewContext(source,{window,document:{getElementById:id=>els[id]||null}});
  const tick=()=>new Promise(resolve=>setImmediate(resolve));await tick();assert.equal(calls.length,0);
  window.DD639StockVisibility.open({product_id:1});await tick();assert.equal(calls.length,1);
  assert.equal(calls[0].opts.method,'GET');assert.match(calls[0].url,/product_id=1/);
  assert.match(els.dd639StockResults.innerHTML,/Qualifying order commitments/);
  assert.match(els.dd639StockResults.innerHTML,/remaining after recorded orders/i);
  els.dd639StockReload.events.click();await tick();assert.equal(calls.length,2);
  assert.equal(calls.some(call=>call.opts.method!=='GET'),false);
});
