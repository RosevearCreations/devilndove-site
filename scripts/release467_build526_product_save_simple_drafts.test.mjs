import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {changedFields526,onRequestPost} from '../functions/api/admin/product-editor-save.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const product={product_id:91,name:'Lavender Soap',slug:'lavender-soap',sku:'SOAP-91',product_category:'other',
 color_name:null,color_names_json:'[]',shipping_code:null,review_status:'pending_review',short_description:null,
 description:'Our original lavender soap.',product_type:'physical',status:'draft',price_cents:1200,
 compare_at_price_cents:null,currency:'CAD',taxable:1,tax_class_id:null,requires_shipping:0,
 weight_grams:null,inventory_tracking:0,inventory_quantity:3,digital_file_url:null,
 featured_image_url:null,sort_order:0,merchandise_origin:'handmade',sale_channel:'onsite',
 external_listing_url:null,external_listing_label:null,condition_summary:null,era_label:null,sourcing_notes:null};
const payload={...product,description:'Updated lavender and oat soap.',compare_at_price_cents:null};
function mockContext({failBatch=false}={}){
 const row={...product},seo={product_id:91};
 const executed=[];
 const db={
  prepare(sql){return {sql,args:[],bind(...args){this.args=args;return this;},
   async first(){
    if(this.sql.includes('LEFT JOIN product_seo'))return {...row,seo_product_id:91,
      ...Object.fromEntries(['meta_title','meta_description','keywords','h1_override','canonical_url','og_title','og_description','og_image_url'].map(k=>['seo_'+k,null]))};
    throw Error('Unexpected first(): '+this.sql);
   },
   async all(){if(this.sql.includes('SELECT name,short_description,description'))return {results:[row],meta:{rows_read:1}};
    throw Error('Unexpected all(): '+this.sql);}};},
  async batch(stmts){if(failBatch)throw Error('quality_release_review_required');
   for(const stmt of stmts){executed.push(stmt.sql);
    if(stmt.sql.startsWith('UPDATE products SET')){
     const keys=stmt.sql.match(/SET (.*),updated_at=CURRENT_TIMESTAMP WHERE/)[1].split(',').map(s=>s.split('=')[0]);
     keys.forEach((k,i)=>{row[k]=stmt.args[i];});
    }else if(stmt.sql.startsWith('INSERT INTO product_seo'))Object.assign(seo,{product_id:91});
   }
   return stmts.map(()=>({success:true,meta:{rows_read:0,changes:1}}));
  }
 };
 return {context:{env:{DB:db},data:{ddModuleAccess:{user:{role:'admin',user_id:1}}},
  request:new Request('https://example.invalid/api/admin/product-editor-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})},executed,row};
}

test('Build 526 changes only actual Product fields, avoiding unrelated status and stock triggers',async()=>{
 assert.deepEqual(changedFields526(['name','inventory_quantity','description'],payload,product),['description']);
 const {context,executed,row}=mockContext();
 const response=await onRequestPost(context),result=await response.json();
 assert.equal(response.status,200,JSON.stringify(result));
 assert.equal(result.ok,true);assert.deepEqual(result.changed_fields,['description']);
 assert.equal(executed.length,1);assert.match(executed[0],/^UPDATE products SET description=\?/);
 assert.doesNotMatch(executed[0],/inventory_quantity=|status=|review_status=/);
 assert.equal(row.description,payload.description);
});

test('Protection rule gives actionable 409 and no false success or Etsy side effect',async()=>{
 const {context,executed}=mockContext({failBatch:true});
 const response=await onRequestPost(context),result=await response.json();
 assert.equal(response.status,409);assert.equal(result.code,'product_protection_rule_blocked');
 assert.equal(result.retry_automatically,false);assert.deepEqual(executed,[]);
});

test('Simple draft UI keeps one of each checkbox and a safe Create-or-Update-by-stored-ID path',()=>{
 const page=read('admin/product-editor/index.html'),flow=read('public/js/admin-product-destination-flow-523.mjs');
 const recovery=read('public/js/admin-product-editor-v163.js'),headers=read('_headers');
 for(const id of ['productEditorSave','productChannel405Etsy','productChannel405Facebook'])
  assert.equal((page.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
 assert.match(flow,/state\.lastListingId\?`Update Etsy draft/);
 assert.match(flow,/window\.confirm\(`/);assert.match(flow,/readReceipt524/);
 assert.match(flow,/partialVerified=receipt\.verified===true/);
 assert.match(flow,/prepareMarketplaceHandoff524/);
 assert.match(recovery,/lastSubmitted521/);assert.match(recovery,/dd521ReviewServer/);
 assert.match(headers,/Content-Security-Policy-Report-Only:[^\n]*report-uri \/api\/csp-report/);
 assert.match(read('functions/_middleware.js'),/"report-uri \/api\/csp-report"/);
 assert.match(page,/css\/admin-product-editor-526\.css\?v=526/);
});
