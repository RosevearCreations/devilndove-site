import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {runInNewContext} from 'node:vm';
import {onRequestGet} from '../functions/api/admin/product-browser.js';

const root=new URL('../',import.meta.url);
const html=readFileSync(new URL('admin/products/index.html',root),'utf8');
const source=readFileSync(new URL('public/js/admin-products-browser-v162.js',root),'utf8');

function fixture(){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(`CREATE TABLE products(product_id INTEGER PRIMARY KEY,product_number INTEGER,sku TEXT,name TEXT,
    slug TEXT,product_category TEXT,product_type TEXT,status TEXT,review_status TEXT,price_cents INTEGER,
    currency TEXT,inventory_tracking INTEGER,inventory_quantity INTEGER,featured_image_url TEXT,updated_at TEXT)`);
  const rows=[
    [1,'Amber','Jewel','A01',1200,'photo-a','2026-08-01'],
    [2,'Pearl','Rings','R02',1500,'','2026-10-01'],
    [3,'Amber','Rings','R03',1200,'photo-c','2026-10-08'],
    [4,'Beryl','Earrings','E04',900,'','2026-11-02'],
    [5,'Amber','Jewelry','J05',1200,'','2026-11-04'],
    [6,'Copper','Other','O06',1700,'photo-f','2026-11-04'],
    [7,'Dovlin','Jewelry','J07',0,'photo-g','2026-09-08']
  ];
  const insert=sqlite.prepare('INSERT INTO products(product_id,product_number,name,product_category,sku,price_cents,featured_image_url,updated_at) VALUES(?,?,?,?,?,?,?,?)');
  for(const [id,name,category,sku,price,photo,date] of rows)insert.run(id,id,name,category,sku,price,photo,date);
  const statements=[];
  const db={prepare(sql){statements.push(sql);const stmt=sqlite.prepare(sql);return {bind(...args){return {all:async()=>({results:stmt.all(...args),meta:{rows_read:stmt.all(...args).length}})};}};}};
  async function request(params={},role='admin'){
    const url=new URL('https://devilndove.com/api/admin/product-browser');
    for(const [key,value] of Object.entries(params))url.searchParams.set(key,String(value));
    const response=await onRequestGet({request:new Request(url),env:{DB:db},data:{ddModuleAccess:{user:{role}}}});
    return {status:response.status,data:await response.json()};
  }
  return {request,statements,sqlite};
}

test('Build 635 retains one bounded, admin-only Product read without implicit media queries',async()=>{
  const h=fixture();const denied=await h.request({},'customer');assert.equal(denied.status,401);assert.equal(h.statements.length,0);
  const result=await h.request({limit:3});assert.equal(result.status,200);assert.equal(result.data.products.length,3);
  assert.deepEqual(result.data.products.map(p=>p.product_id),[7,6,5]);
  assert.equal(h.statements.length,1);assert.match(h.statements[0],/FROM products/);
  assert.doesNotMatch(h.statements[0],/\bJOIN\b|product_images|media_assets|PRAGMA/i);
  h.sqlite.close();
});

test('Build 635 globally sorts name/price/updated with stable keyset cursor across pages',async()=>{
  const h=fixture();
  for(const [sort,expected] of [
    ['name',[5,3,1,4,6,7,2]],
    ['price',[7,4,5,3,1,2,6]],
    ['updated',[6,5,4,3,2,7,1]]
  ]){
    let cursor=null,observed=[];
    for(let i=0;i<4;i++){
      const page=await h.request({sort,limit:2,...(cursor?{cursor}:{})});
      assert.equal(page.status,200,page.data.error);observed.push(...page.data.products.map(p=>p.product_id));
      cursor=page.data.next_cursor;if(!cursor)break;
      assert.equal(JSON.parse(cursor).sort,sort);
    }
    assert.deepEqual(observed,expected,`${sort} pages do not skip or repeat ties`);
  }
  h.sqlite.close();
});

test('Build 635 category/search/missing-featured filters operate on the server result set',async()=>{
  const h=fixture();
  const byCategory=await h.request({category:'Rings',sort:'name'});
  assert.deepEqual(byCategory.data.products.map(p=>p.product_id),[3,2]);
  const byText=await h.request({q:'Ear'});assert.deepEqual(byText.data.products.map(p=>p.product_id),[4]);
  const missing=await h.request({photos:'featured-missing',sort:'price'});
  assert.deepEqual(missing.data.products.map(p=>p.product_id),[4,5,2]);
  const combined=await h.request({category:'Rings',photos:'featured-missing'});
  assert.deepEqual(combined.data.products.map(p=>p.product_id),[2]);
  h.sqlite.close();
});

test('Build 635 fails closed on unrecognized sort, image filters or mismatched/tampered cursors',async()=>{
  const h=fixture();
  const tests=[{sort:'DROP TABLE products'},{photos:'all;DROP'},
    {sort:'price',cursor:'{bad'},{sort:'name',cursor:JSON.stringify({sort:'price',key:20,id:4})},
    {sort:'price',cursor:JSON.stringify({sort:'price',key:-2,id:4})},
    {cursor:'-3'}];
  for(const params of tests){const before=h.statements.length;const result=await h.request(params);
    assert.equal(result.status,400);assert.equal(h.statements.length,before,'invalid filters cannot reach SQL');}
  h.sqlite.close();
});

test('Build 635 catalog UI exposes accessible deliberate filters, truthful readiness, and mobile cards',()=>{
  for(const id of ['productBrowserSort','productBrowserCategory','productBrowserPhotos','productBrowserClear'])
    assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/Image descriptions, ownership rights and gallery completeness are <strong>not verified/);
  assert.match(html,/@media\(max-width:680px\)/);
  assert.match(html,/dd635-table tbody tr\{display:grid/);
  assert.match(html,/admin-products-browser-v162\.js\?v=170&b635=1/);
  assert.match(source,/Alt text \/ image rights: not checked in this list/);
  assert.doesNotMatch(source,/setInterval\(|setTimeout\(|MutationObserver/);
});

test('Build 635 browser carries sort/filter keys through explicit requests without extra background calls',async()=>{
  const element=(value='')=>({value,disabled:false,hidden:false,dataset:{},events:{},textContent:'',innerHTML:'',
    addEventListener(type,callback){this.events[type]=callback;},focus(){},querySelectorAll(){return [];}});
  const controls={productBrowserSearchForm:element(),productBrowserQuery:element(''),productBrowserPageSize:element('8'),
    productBrowserCategory:element(''),productBrowserSort:element('newest'),productBrowserPhotos:element('all'),
    productBrowserClear:element(),productBrowserBody:element(),productBrowserStatus:element(),
    productBrowserNext:element(),productBrowserPrev:element(),productBrowserRefresh:element(),productBrowserPageLabel:element()};
  const requests=[];
  const window={DDAuth:{apiFetch:async url=>{requests.push(url);return {ok:true,json:async()=>({ok:true,products:[],next_cursor:null,d1_rows_read:1})};}}};
  const document={getElementById:id=>controls[id]||null};
  runInNewContext(source,{document,window,URL,URLSearchParams,Intl,location:{origin:'https://devilndove.com'},
    sessionStorage:{setItem(){}},setTimeout:undefined});
  await new Promise(resolve=>setImmediate(resolve));assert.equal(requests.length,1);
  controls.productBrowserSort.value='price';controls.productBrowserSort.events.change();
  await new Promise(resolve=>setImmediate(resolve));assert.equal(requests.length,2);
  assert.match(requests[1],/sort=price/);
  controls.productBrowserCategory.value='Rings';controls.productBrowserPhotos.value='featured-missing';
  controls.productBrowserSearchForm.events.submit({preventDefault(){}});
  await new Promise(resolve=>setImmediate(resolve));assert.equal(requests.length,3);
  assert.match(requests[2],/category=Rings/);assert.match(requests[2],/photos=featured-missing/);
  controls.productBrowserClear.events.click();
  await new Promise(resolve=>setImmediate(resolve));assert.equal(requests.length,3,'cleared defaults reuse the previously loaded session page');
  assert.equal(controls.productBrowserSort.value,'newest');assert.equal(controls.productBrowserCategory.value,'');
  assert.equal(controls.productBrowserPhotos.value,'all');
});
