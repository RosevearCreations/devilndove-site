import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {onRequestGet} from '../functions/api/admin/product-browser.js';
import {onRequestPost} from '../functions/api/admin/product-restock-review.js';

function fixture(){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(`CREATE TABLE products(product_id INTEGER PRIMARY KEY,product_number INTEGER,name TEXT,sku TEXT,slug TEXT,
    product_category TEXT,product_type TEXT,status TEXT,review_status TEXT,price_cents INTEGER,currency TEXT,
    inventory_tracking INTEGER,inventory_quantity INTEGER,featured_image_url TEXT,updated_at TEXT);
    INSERT INTO products VALUES(1,1,'Copper Pendant','CP1','copper','Jewelry','physical','draft','pending_review',1500,'CAD',1,0,'','2026-11-01');
    INSERT INTO products VALUES(2,2,'Silver Ring','SR2','ring','Rings','physical','active','approved',4000,'CAD',1,2,'','2026-11-02');
    INSERT INTO products VALUES(3,3,'Untracked Soap','US3','soap','Other','physical','active','approved',900,'CAD',0,0,'','2026-11-03');
    INSERT INTO products VALUES(4,4,'Brass Brooch','BB4','brooch','Jewelry','physical','active','approved',2400,'CAD',1,8,'','2026-11-04');
    INSERT INTO products VALUES(5,5,'Digital Pattern','DP5','pattern','Other','digital','draft','pending_review',500,'CAD',1,1,'','2026-11-05');
    INSERT INTO products VALUES(6,6,'Archived Ring','AR6','archived','Rings','physical','archived','approved',6000,'CAD',1,0,'','2026-11-06');`);
  const statements=[];let beforeWrite=null;
  const db={prepare(sql){statements.push(sql);const stmt=sqlite.prepare(sql);return {bind(...args){return {
    first:async()=>stmt.get(...args),
    all:async()=>({results:stmt.all(...args),meta:{rows_read:stmt.all(...args).length}}),
    run:async()=>{if(beforeWrite&&sql.startsWith('UPDATE products'))beforeWrite();const result=stmt.run(...args);return {meta:{changes:result.changes}};}
  };}};}};
  async function list(params={},role='admin'){
    const url=new URL('https://devilndove.com/api/admin/product-browser');
    for(const [key,value] of Object.entries(params))url.searchParams.set(key,String(value));
    const response=await onRequestGet({request:new Request(url),env:{DB:db},data:{ddModuleAccess:{user:{role}}}});
    return {status:response.status,data:await response.json()};
  }
  async function post(body,role='admin',origin=null){
    const response=await onRequestPost({request:new Request('https://devilndove.com/api/admin/product-restock-review',
      {method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify(body)}),
      env:{DB:db},data:{ddModuleAccess:{user:{role}}}});
    return {status:response.status,data:await response.json()};
  }
  return {sqlite,statements,list,post,one:id=>sqlite.prepare('SELECT * FROM products WHERE product_id=?').get(id),
    beforeWrite(fn){beforeWrite=fn;},close:()=>sqlite.close()};
}
const note='Counted three finished rings on workbench';
const preview={action:'preview',product_id:2,add_units:3,note};
const apply=p=>({...preview,action:'apply',snapshot:p.data.snapshot,previewed_at:p.data.previewed_at,
  owner_confirmed:true,acknowledgement:'I VERIFIED PHYSICAL STOCK'});

test('Build 637 low/out/attention filters are global, bounded and do not join or mutate',async()=>{
  const f=fixture();const before=f.statements.length;
  assert.equal((await f.list({stock:'attention'},'customer')).status,401);
  assert.equal(f.statements.length,before);
  for(const [stock,expected] of [
    ['attention',[6,5,2,1]],['low',[5,2]],['out',[6,1]],['tracked',[6,5,4,2,1]],['untracked',[3]]
  ]){
    const data=await f.list({stock,limit:2});let ids=data.data.products.map(p=>p.product_id);
    if(data.data.next_cursor){const second=await f.list({stock,limit:2,cursor:data.data.next_cursor});ids.push(...second.data.products.map(p=>p.product_id));
      if(second.data.next_cursor){const third=await f.list({stock,limit:2,cursor:second.data.next_cursor});ids.push(...third.data.products.map(p=>p.product_id));}}
    assert.deepEqual(ids,expected,stock);
  }
  for(const sql of f.statements){assert.match(sql,/FROM products/);assert.doesNotMatch(sql,/\bJOIN\b|\bPRAGMA\b|product_images|\bUPDATE\b/i);}
  assert.equal(f.one(2).inventory_quantity,2);f.close();
});

test('Build 637 rejects unrecognized stock filters before SQL and combines with category/photo/sort',async()=>{
  const f=fixture();const prior=f.statements.length;
  assert.equal((await f.list({stock:'low;DROP TABLE products'})).status,400);
  assert.equal(f.statements.length,prior);
  const both=await f.list({stock:'attention',category:'Rings',sort:'name',photos:'featured-missing'});
  assert.deepEqual(both.data.products.map(p=>p.product_id),[6,2]);f.close();
});

test('Build 637 previews one physically tracked Product without writes or provider activity',async()=>{
  const f=fixture();const result=await f.post(preview);
  assert.equal(result.status,200);assert.equal(result.data.saved,false);
  assert.equal(result.data.before_quantity,2);assert.equal(result.data.after_quantity,5);
  assert.equal(result.data.storefront_availability_may_change,true);
  assert.equal(result.data.external_provider_actions,false);
  assert.equal(f.one(2).inventory_quantity,2);assert.equal(f.statements.length,1);
  assert.doesNotMatch(f.statements[0],/\bJOIN\b|\bUPDATE\b|\bPRAGMA\b|\bR2\b|etsy/i);f.close();
});

test('Build 637 owner confirmation changes stock only once, with readback',async()=>{
  const f=fixture(),p=await f.post(preview),saved=await f.post(apply(p));
  assert.equal(saved.status,200,JSON.stringify(saved.data));assert.equal(saved.data.after_quantity,5);
  assert.equal(f.one(2).inventory_quantity,5);assert.equal(f.one(2).price_cents,4000);
  assert.equal(f.one(2).status,'active');assert.equal(f.one(1).inventory_quantity,0);
  const duplicate=await f.post(apply(p));assert.equal(duplicate.status,409);
  assert.equal(duplicate.data.code,'stale_restock_preview');assert.equal(f.one(2).inventory_quantity,5);
  assert.equal(f.statements.filter(s=>s.startsWith('UPDATE products')).length,1);f.close();
});

test('Build 637 rejects nonadmins, nonphysical/untracked/archived, unknown fields, invalid units and source notes',async()=>{
  const f=fixture();assert.equal((await f.post(preview,'customer')).status,401);
  assert.equal((await f.post(preview,'admin','https://untrusted.example')).status,403);
  for(const request of [
    {...preview,product_id:3},{...preview,product_id:5},{...preview,product_id:6},
    {...preview,add_units:0},{...preview,add_units:1001},{...preview,add_units:1.25},
    {...preview,note:'short'},{...preview,note:123},{...preview,price_cents:0},
    {...preview,product_id:99},{...preview,add_units:'3'}
  ]){const r=await f.post(request);assert.ok(r.status>=400,JSON.stringify(request));}
  assert.equal(f.statements.filter(s=>s.startsWith('UPDATE products')).length,0);f.close();
});

test('Build 637 requires explicit confirmation, a current preview and stable Product identity',async()=>{
  const f=fixture(),p=await f.post(preview),request=apply(p);
  assert.equal((await f.post({...request,owner_confirmed:false})).status,403);
  assert.equal((await f.post({...request,acknowledgement:'yes'})).status,403);
  assert.equal((await f.post({...request,previewed_at:Date.now()-6*60*1000})).status,409);
  f.sqlite.prepare("UPDATE products SET name='Ring changed elsewhere' WHERE product_id=2").run();
  const stale=await f.post(request);assert.equal(stale.status,409);assert.equal(stale.data.code,'stale_restock_preview');
  assert.equal(f.one(2).inventory_quantity,2);f.close();
});

test('Build 637 concurrent stock adjustment and rejected DB write fail closed without double addition',async()=>{
  const f=fixture(),p=await f.post(preview);
  f.beforeWrite(()=>f.sqlite.prepare('UPDATE products SET inventory_quantity=7 WHERE product_id=2').run());
  const contested=await f.post(apply(p));assert.equal(contested.status,409);
  assert.equal(contested.data.code,'restock_write_unconfirmed');assert.equal(f.one(2).inventory_quantity,7);
  f.beforeWrite(null);
  const fresh=await f.post(preview);
  f.sqlite.exec("CREATE TRIGGER block_restock BEFORE UPDATE ON products WHEN NEW.product_id=2 BEGIN SELECT RAISE(ABORT,'protected'); END;");
  const blocked=await f.post(apply(fresh));assert.equal(blocked.status,409);
  assert.equal(f.one(2).inventory_quantity,7);f.close();
});

test('Build 637 Product Browser presents mobile-ready filters and deliberate restock controls',()=>{
  const html=readFileSync(new URL('../admin/products/index.html',import.meta.url),'utf8');
  const source=readFileSync(new URL('../public/js/admin-products-browser-v162.js',import.meta.url),'utf8');
  for(const id of ['productBrowserStock','dd637RestockPanel','dd637RestockUnits','dd637RestockNote','dd637RestockPreview',
    'dd637RestockOwnerConfirmed','dd637RestockApply','dd637RestockStatus','dd637RestockComparison'])
    assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/@media\(max-width:680px\)/);assert.match(source,/data-dd637-restock-id/);
  assert.match(source,/action:'preview'/);assert.match(source,/action:'apply'/);
  assert.doesNotMatch(source,/setInterval\(|setTimeout\(|MutationObserver/);
});

test('Build 637 browser performs one stock-filtered load then preview and one explicitly confirmed restock',async()=>{
  const source=readFileSync(new URL('../public/js/admin-products-browser-v162.js',import.meta.url),'utf8');
  const el=(value='')=>({value,disabled:false,hidden:false,checked:false,dataset:{},events:{},textContent:'',innerHTML:'',
    addEventListener(type,callback){this.events[type]=callback;},focus(){},querySelectorAll(){return [];}});
  const ids=['productBrowserSearchForm','productBrowserQuery','productBrowserPageSize','productBrowserCategory','productBrowserSort','productBrowserPhotos','productBrowserStock',
    'productBrowserClear','productBrowserStatus','productBrowserNext','productBrowserPrev','productBrowserRefresh','productBrowserPageLabel',
    'dd636BulkCategory','dd636BulkReviewState','dd636SelectedCount','dd636BulkStatus','dd636PreviewRows','dd636Preview','dd636Apply',
    'dd636OwnerConfirmed','dd636Clear','dd637RestockPanel','dd637RestockProduct','dd637RestockUnits','dd637RestockNote',
    'dd637RestockStatus','dd637RestockComparison','dd637RestockPreview','dd637RestockApply','dd637RestockOwnerConfirmed','dd637RestockCancel'];
  const controls=Object.fromEntries(ids.map(id=>[id,el()]));
  Object.assign(controls,{productBrowserPageSize:el('8'),productBrowserSort:el('newest'),productBrowserPhotos:el('all'),productBrowserStock:el('all')});
  let markup='',nodes=new Map();const tbody=el();Object.defineProperty(tbody,'innerHTML',{get:()=>markup,set:v=>{markup=v;nodes=new Map();}});
  tbody.querySelectorAll=selector=>{
    if(nodes.has(selector))return nodes.get(selector);const list=[];
    if(selector==='[data-dd637-restock-id]')for(const match of markup.matchAll(/data-dd637-restock-id="(\d+)"/g)){
      const button=el();button.dataset.dd637RestockId=match[1];list.push(button);
    }
    nodes.set(selector,list);return list;
  };controls.productBrowserBody=tbody;
  const product={product_id:2,name:'Silver Ring',sku:'SR2',product_type:'physical',status:'active',price_cents:4000,inventory_tracking:1,inventory_quantity:2};
  const calls=[];
  const window={DDAuth:{apiFetch:async(url,options={})=>{
    const body=options.body?JSON.parse(options.body):null;calls.push({url,body});
    const data=!body?{ok:true,products:[product],next_cursor:null,d1_rows_read:1}:
      body.action==='preview'?{ok:true,action:'preview',saved:false,product_id:2,name:product.name,note:body.note,
        before_quantity:2,after_quantity:5,add_units:3,storefront_availability_may_change:true,
        snapshot:{product_id:2,name:product.name,product_type:'physical',status:'active',inventory_tracking:1,inventory_quantity:2,updated_at:'2026-11-02'},previewed_at:Date.now()}:
        {ok:true,action:'apply',confirmed:true,product_id:2,before_quantity:2,after_quantity:5};
    return {ok:true,json:async()=>data};
  }}};
  runInNewContext(source,{window,document:{getElementById:id=>controls[id]||null},URL,URLSearchParams,Intl,
    location:{origin:'https://devilndove.com'},sessionStorage:{setItem(){}}});
  const tick=()=>new Promise(resolve=>setImmediate(resolve));await tick();assert.equal(calls.length,1);
  controls.productBrowserStock.value='attention';controls.productBrowserStock.events.change();await tick();
  assert.equal(calls.length,2);assert.match(calls[1].url,/stock=attention/);
  tbody.querySelectorAll('[data-dd637-restock-id]')[0].events.click();
  controls.dd637RestockUnits.value='3';controls.dd637RestockUnits.events.input();
  controls.dd637RestockNote.value=note;controls.dd637RestockNote.events.input();
  assert.equal(controls.dd637RestockApply.disabled,true);
  controls.dd637RestockPreview.events.click();await tick();assert.equal(calls.length,3);
  assert.equal(calls[2].body.action,'preview');assert.equal(controls.dd637RestockApply.disabled,true);
  controls.dd637RestockOwnerConfirmed.checked=true;controls.dd637RestockOwnerConfirmed.events.change();
  assert.equal(controls.dd637RestockApply.disabled,false);
  controls.dd637RestockApply.events.click();await tick();assert.equal(calls.length,4);
  assert.equal(calls[3].body.action,'apply');assert.equal(calls[3].body.acknowledgement,'I VERIFIED PHYSICAL STOCK');
  assert.equal(controls.dd637RestockApply.disabled,true);assert.match(controls.dd637RestockStatus.textContent,/Saved/);
});
