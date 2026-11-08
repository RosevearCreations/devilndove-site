import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {onRequestPost} from '../functions/api/admin/product-bulk-draft.js';

function fixture(){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(`CREATE TABLE products(product_id INTEGER PRIMARY KEY,name TEXT,sku TEXT,status TEXT,
    product_category TEXT,review_status TEXT,updated_at TEXT,price_cents INTEGER,inventory_quantity INTEGER);
    INSERT INTO products VALUES(1,'Copper Pendant','CP1','draft','Jewelry','approved','2026-10-01',1500,6);
    INSERT INTO products VALUES(2,'Silver Ring','SR2','draft','Rings','pending_review','2026-10-02',4000,2);
    INSERT INTO products VALUES(3,'Published Brooch','PB3','active','Jewelry','published','2026-10-03',9000,1);`);
  const sql=[];let beforeUpdate=null;
  const db={prepare(statement){sql.push(statement);const stmt=sqlite.prepare(statement);return {bind(...values){return {
    all:async()=>({results:stmt.all(...values),meta:{rows_read:2}}),
    run:async()=>{if(beforeUpdate&&/^WITH expected\(/.test(statement))beforeUpdate();const result=stmt.run(...values);return {success:true,meta:{changes:result.changes}};}
  };}};}};
  async function post(body,role='admin'){
    const response=await onRequestPost({request:new Request('https://devilndove.com/api/admin/product-bulk-draft',
      {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),
      env:{DB:db},data:{ddModuleAccess:{user:{role}}}});
    return {status:response.status,data:await response.json()};
  }
  return {sqlite,sql,post,setBeforeUpdate(fn){beforeUpdate=fn;},
    row:id=>sqlite.prepare('SELECT * FROM products WHERE product_id=?').get(id),close:()=>sqlite.close()};
}
const changes={product_category:'Other'};
const previewRequest={action:'preview',product_ids:[1,2],changes};
const applyRequest=preview=>({action:'apply',product_ids:[1,2],changes,
  snapshots:preview.data.products.map(p=>p.snapshot),previewed_at:preview.data.previewed_at,owner_confirmed:true,
  acknowledgement:'I REVIEWED ALL DRAFT CHANGES'});

test('Build 636 preview reads exact selected draft authority without a write',async()=>{
  const f=fixture(),preview=await f.post(previewRequest);
  assert.equal(preview.status,200);assert.equal(preview.data.saved,false);
  assert.equal(preview.data.products.length,2);assert.equal(preview.data.products[0].after.review_status,'needs_changes');
  assert.equal(f.row(1).review_status,'approved');assert.equal(f.row(2).product_category,'Rings');
  assert.equal(f.sql.length,1);assert.match(f.sql[0],/LIMIT 8/);
  assert.doesNotMatch(f.sql[0],/\bJOIN\b|product_images|media_assets/i);f.close();
});

test('Build 636 applies only owner-confirmed category and needs-changes review to all drafts',async()=>{
  const f=fixture(),preview=await f.post(previewRequest),result=await f.post(applyRequest(preview));
  assert.equal(result.status,200,JSON.stringify(result.data));assert.equal(result.data.updated_count,2);
  for(const id of [1,2]){const p=f.row(id);assert.equal(p.product_category,'Other');assert.equal(p.review_status,'needs_changes');assert.equal(p.status,'draft');}
  assert.equal(f.row(1).price_cents,1500);assert.equal(f.row(2).inventory_quantity,2);
  assert.equal(f.row(3).status,'active');assert.equal(f.row(3).review_status,'published');
  assert.equal(f.sql.filter(x=>/UPDATE products/i.test(x)).length,1);f.close();
});

test('Build 636 rejects nonadmin, duplicates, over-limit, invalid fields and non-drafts before writes',async()=>{
  const f=fixture();
  assert.equal((await f.post(previewRequest,'customer')).status,401);
  for(const body of [
    {...previewRequest,product_ids:[1,1]},
    {...previewRequest,product_ids:Array.from({length:9},(_,i)=>i+1)},
    {...previewRequest,changes:{product_category:'Unapproved Taxonomy'}},
    {...previewRequest,changes:{review_status:'approved'}},
    {...previewRequest,changes:{price_cents:0}},
    {...previewRequest,changes:{product_category:'Other',price_cents:0}},
    {...previewRequest,changes:{product_category:['Other']}},
    {...previewRequest,product_ids:[1,3]}
  ]){const result=await f.post(body);assert.ok(result.status>=400,JSON.stringify(body));}
  assert.equal(f.row(1).product_category,'Jewelry');assert.equal(f.row(3).status,'active');f.close();
});

test('Build 636 requires exact owner review acknowledgement and matching fresh snapshots',async()=>{
  const f=fixture(),preview=await f.post(previewRequest),request=applyRequest(preview);
  assert.equal((await f.post({...request,acknowledgement:'yes'})).status,403);
  assert.equal((await f.post({...request,owner_confirmed:false})).status,403);
  assert.equal((await f.post({...request,previewed_at:Date.now()-6*60*1000})).status,409);
  f.sqlite.prepare("UPDATE products SET name='Changed elsewhere' WHERE product_id=2").run();
  const stale=await f.post(request);assert.equal(stale.status,409);assert.equal(stale.data.code,'stale_bulk_preview');
  assert.equal(f.row(1).product_category,'Jewelry');f.close();
});

test('Build 636 conditional UPDATE stays atomic when a Product changes between preview and write',async()=>{
  const f=fixture(),preview=await f.post(previewRequest);
  f.setBeforeUpdate(()=>{f.sqlite.prepare("UPDATE products SET review_status='approved' WHERE product_id=2").run();});
  const result=await f.post(applyRequest(preview));assert.equal(result.status,409);
  assert.equal(result.data.code,'bulk_write_unconfirmed');
  assert.equal(f.row(1).product_category,'Jewelry','first Product cannot partially commit');
  f.close();
});

test('Build 636 database trigger failure cannot partially commit a selected batch',async()=>{
  const f=fixture(),preview=await f.post(previewRequest);
  f.sqlite.exec(`CREATE TRIGGER stop_bulk BEFORE UPDATE ON products WHEN NEW.product_id=2
    BEGIN SELECT RAISE(ABORT,'protected Product'); END;`);
  const result=await f.post(applyRequest(preview));assert.equal(result.status,409);
  assert.equal(f.row(1).product_category,'Jewelry');assert.equal(f.row(2).product_category,'Rings');
  f.close();
});

test('Build 636 browser form has accessible review, confirmation and no automatic bulk execution',()=>{
  const html=readFileSync(new URL('../admin/products/index.html',import.meta.url),'utf8');
  const browser=readFileSync(new URL('../public/js/admin-products-browser-v162.js',import.meta.url),'utf8');
  for(const id of ['dd636SelectedCount','dd636BulkCategory','dd636BulkReviewState','dd636Preview','dd636PreviewRows',
    'dd636OwnerConfirmed','dd636Apply','dd636BulkStatus'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(browser,/data-dd636-select-id/);
  assert.match(browser,/action:'preview'/);
  assert.match(browser,/action:'apply'/);
  assert.match(browser,/owner_confirmed:true/);
  assert.doesNotMatch(browser,/setInterval\(|setTimeout\(|MutationObserver/);
});

test('Build 636 operator flow requires selection, fresh preview and explicit checkbox before a single save',async()=>{
  const source=readFileSync(new URL('../public/js/admin-products-browser-v162.js',import.meta.url),'utf8');
  const element=(value='')=>({value,disabled:false,hidden:false,checked:false,dataset:{},events:{},textContent:'',innerHTML:'',
    addEventListener(type,callback){this.events[type]=callback;},focus(){},querySelectorAll(){return [];}});
  const ids=['productBrowserSearchForm','productBrowserQuery','productBrowserPageSize','productBrowserCategory','productBrowserSort',
    'productBrowserPhotos','productBrowserClear','productBrowserStatus','productBrowserNext','productBrowserPrev',
    'productBrowserRefresh','productBrowserPageLabel','dd636BulkCategory','dd636BulkReviewState','dd636SelectedCount',
    'dd636BulkStatus','dd636PreviewRows','dd636Preview','dd636Apply','dd636OwnerConfirmed','dd636Clear'];
  const controls=Object.fromEntries(ids.map(id=>[id,element()]));
  Object.assign(controls,{productBrowserPageSize:element('8'),productBrowserSort:element('newest'),productBrowserPhotos:element('all')});
  const body=element();let markup='',nodeCache=new Map();
  Object.defineProperty(body,'innerHTML',{get:()=>markup,set:value=>{markup=value;nodeCache=new Map();}});
  body.querySelectorAll=selector=>{
    if(nodeCache.has(selector))return nodeCache.get(selector);
    const nodes=[];
    if(selector==='[data-dd636-select-id]')for(const match of markup.matchAll(/<input type="checkbox" data-dd636-select-id="(\d+)" data-dd636-eligible="(true|false)"/g)){
      const el=element();el.dataset.dd636SelectId=match[1];el.dataset.dd636Eligible=match[2];nodes.push(el);
    }
    nodeCache.set(selector,nodes);return nodes;
  };
  controls.productBrowserBody=body;
  const calls=[];
  const draft={product_id:1,name:'Copper Pendant',sku:'CP1',product_category:'Jewelry',status:'draft',review_status:'approved',price_cents:1500};
  const active={product_id:3,name:'Live Brooch',sku:'LB3',product_category:'Jewelry',status:'active',review_status:'published',price_cents:9000};
  const window={DDAuth:{apiFetch:async(url,options={})=>{
    calls.push({url,body:options.body?JSON.parse(options.body):null});
    const payload=!options.body?{ok:true,products:[draft,active],next_cursor:null,d1_rows_read:2}:
      JSON.parse(options.body).action==='preview'?{ok:true,action:'preview',previewed_at:Date.now(),changes:{product_category:'Other',review_status:'needs_changes'},
        products:[{product_id:1,name:'Copper Pendant',sku:'CP1',before:{product_category:'Jewelry',review_status:'approved'},
          after:{product_category:'Other',review_status:'needs_changes'},snapshot:{...draft,updated_at:'2026-10-01'}}]}:
        {ok:true,action:'apply',confirmed:true,updated_count:1};
    return {ok:true,json:async()=>payload};
  }}};
  const document={getElementById:id=>controls[id]||null};
  runInNewContext(source,{document,window,URL,URLSearchParams,Intl,location:{origin:'https://devilndove.com'},sessionStorage:{setItem(){}}});
  const tick=()=>new Promise(resolve=>setImmediate(resolve));
  await tick();assert.equal(calls.length,1);assert.equal(controls.dd636Preview.disabled,true);
  const options=body.querySelectorAll('[data-dd636-select-id]');assert.equal(options.length,2);
  assert.equal(options[1].disabled,true,'live Product cannot be selected');
  options[0].checked=true;options[0].events.change();
  controls.dd636BulkCategory.value='Other';controls.dd636BulkCategory.events.change();
  assert.equal(controls.dd636Preview.disabled,false);
  controls.dd636Preview.events.click();await tick();
  assert.equal(calls.length,2);assert.equal(calls[1].body.action,'preview');
  assert.equal(controls.dd636Apply.disabled,true,'preview alone cannot save');
  controls.dd636OwnerConfirmed.checked=true;controls.dd636OwnerConfirmed.events.change();
  assert.equal(controls.dd636Apply.disabled,false);
  controls.dd636Apply.events.click();await tick();
  assert.equal(calls.length,3);assert.equal(calls[2].body.action,'apply');
  assert.equal(calls[2].body.acknowledgement,'I REVIEWED ALL DRAFT CHANGES');
  assert.match(controls.dd636BulkStatus.textContent,/Saved/);
  assert.equal(controls.dd636Apply.disabled,true);
});
