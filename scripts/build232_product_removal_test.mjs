import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'..');
const read=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

const api=read('functions/api/admin/delete-product.js');
const auth=read('public/js/auth.js');
const correction=read('public/js/admin-product-correction.js');
const deleteClient=read('public/js/admin-delete-product.js');
const cleanupClient=read('public/js/admin-product-cleanup.js');

function setValues(name){
  const match=api.match(new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\);`));
  assert(match,`${name} registry is missing.`);
  return new Set([...match[1].matchAll(/'([^']+)'/g)].map((entry)=>entry[1]));
}

const owned=setValues('PRODUCT_OWNED_CLEANUP_RELATIONS');
const detached=setValues('PRODUCT_DETACH_RELATIONS');
const protectedRefs=setValues('PROTECTED_PRODUCT_REFERENCES');
const classified=new Set([...owned,...detached,...protectedRefs]);

assert(owned.has('product_media_change_audit.product_id'),'Editor media audit rows must not make an unused archived product undeletable.');
assert(!protectedRefs.has('product_media_change_audit.product_id'),'Editor media audit rows remain incorrectly classified as protected history.');
assert(owned.has('product_review_actions.product_id'),'Product-owned review actions are missing from cleanup.');
assert(detached.has('soap_products.product_id'),'Soap packaging records must be preserved and detached.');
assert(!/PRAGMA\s+foreign_key_list/i.test(api),'Removal preflight must not inspect every foreign key at request time.');
assert(!api.includes("name NOT LIKE 'sqlite_%'"),'Removal preflight must not enumerate every D1 table.');
assert(api.includes("cleanup_profile: 'bounded_registry_v1'"),'Bounded removal response profile is missing.');
assert(api.includes('await Promise.all(['),'Reference and material preflight reads should run together.');
assert(api.includes('await db.batch(statements)'),'Reviewed inventory actions and product cleanup must use one D1 batch.');
assert(api.includes('runCleanup(db, productId, materialPlan.statements)'),'Inventory actions are not included in the final cleanup batch.');

for(const source of [correction,deleteClient,cleanupClient]){
  assert(source.includes('window.DDAuth?.readApiJson'),'A product-removal browser path still parses responses unsafely.');
}
assert(auth.includes('error.payload = data'),'Shared API errors must retain structured response details.');

for(const schemaName of ['database_schema.sql','database_full_schema.sql','database_store_schema.sql']){
  const schema=read(schemaName);
  const pattern=/FOREIGN KEY\s*\(\s*["`\[]?([A-Za-z_][A-Za-z0-9_]*)["`\]]?\s*\)\s*REFERENCES\s+["`\[]?products["`\]]?/gi;
  for(const match of schema.matchAll(pattern)){
    const before=schema.slice(0,match.index);
    const creates=[...before.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+["`\[]?([A-Za-z_][A-Za-z0-9_]*)["`\]]?/gi)];
    const table=creates.at(-1)?.[1]||'';
    const key=`${table}.${match[1]}`;
    assert(classified.has(key),`${schemaName} has unclassified product reference ${key}.`);
  }
}

const calls=[];
const db={
  prepare(sql){
    const normalized=String(sql).replace(/\s+/g,' ').trim();
    return {
      args:[],bind(...args){this.args=args;return this;},
      async first(){
        calls.push({kind:'first',sql:normalized,args:this.args});
        if(normalized.includes('FROM sessions s')) return {session_id:1,user_id:1,resolved_user_id:1,email:'admin@example.test',display_name:'Admin',role:'admin',is_active:1};
        if(normalized.includes('FROM products WHERE product_id')) return {product_id:45,product_number:'1045',sku:'DND-1045',name:'Archived test product',slug:'archived-test-product',status:'archived'};
        if(normalized.includes('COUNT(*) AS count')) return {count:0};
        return null;
      },
      async all(){
        calls.push({kind:'all',sql:normalized,args:this.args});
        if(normalized.includes('FROM product_resource_links prl')) return {results:[]};
        return {results:[]};
      },
      async run(){calls.push({kind:'run',sql:normalized,args:this.args});return {meta:{changes:0}};}
    };
  }
};

const {onRequestGet}=await import(url.pathToFileURL(path.join(root,'functions/api/admin/delete-product.js')).href+`?test=${Date.now()}`);
const response=await onRequestGet({request:new Request('https://devilndove.com/api/admin/delete-product?product_id=45',{headers:{Authorization:'Bearer test-admin-token'}}),env:{DB:db}});
const payload=await response.json();
assert(response.status===200&&payload.ok===true,'Archived product removal preflight must return valid JSON.');
assert(payload.product?.status==='archived'&&payload.deletion_allowed===1,'Archive status alone must not block unused-product deletion.');
assert(payload.cleanup_profile==='bounded_registry_v1','Removal preflight did not return the bounded profile.');
assert(!calls.some((call)=>/PRAGMA\s+foreign_key_list|name NOT LIKE 'sqlite_%'/i.test(call.sql)),'Mock removal preflight performed unbounded schema discovery.');
assert(calls.length<=2+protectedRefs.size+1,`Removal preflight exceeded its bounded query budget: ${calls.length} calls.`);

const password='test-password';
const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password));
const passwordHash=`sha256$${[...new Uint8Array(digest)].map((byte)=>byte.toString(16).padStart(2,'0')).join('')}`;
const deleteCalls=[];
let deleteBatch=[];
const deleteDb={
  prepare(sql){
    const normalized=String(sql).replace(/\s+/g,' ').trim();
    return {
      sql:normalized,args:[],bind(...args){this.args=args;return this;},
      async first(){
        deleteCalls.push({kind:'first',sql:normalized,args:this.args});
        if(normalized.includes('FROM sessions s')) return {session_id:1,user_id:1,resolved_user_id:1,email:'admin@example.test',display_name:'Admin',role:'admin',is_active:1};
        if(normalized.includes('FROM users u INNER JOIN sessions s')) return {user_id:1,password_hash:passwordHash,expires_at:'2099-01-01'};
        if(normalized.includes('SELECT * FROM products')) return {product_id:45,product_number:'1045',sku:'DND-1045',name:'Archived test product',slug:'archived-test-product',status:'archived'};
        if(normalized.includes('COUNT(*) AS count')) return {count:0};
        if(normalized.includes('FROM sqlite_master')) return null;
        return null;
      },
      async all(){
        deleteCalls.push({kind:'all',sql:normalized,args:this.args});
        if(normalized.includes('FROM product_resource_links prl')) return {results:[{product_resource_link_id:5,product_id:45,resource_kind:'supply',source_key:'supply-5',quantity_used:1,consumption_mode:'per_unit',site_item_inventory_id:9,item_name:'Test supply',on_hand_quantity:3,reserved_quantity:1,incoming_quantity:0,unit_cost_cents:100,usage_units_per_stock_unit:1,stock_unit_label:'unit',usage_unit_label:'unit'}]};
        if(normalized.includes('SELECT name, sql FROM sqlite_master')){
          if(this.args.includes('site_inventory_movements')) return {results:[
            {name:'site_inventory_movements',sql:'CREATE TABLE site_inventory_movements (site_inventory_movement_id INTEGER, note TEXT)'},
            {name:'product_material_return_audit',sql:'CREATE TABLE product_material_return_audit (product_material_return_audit_id INTEGER, product_id_deleted INTEGER)'}
          ]};
          return {results:[
            {name:'product_media_change_audit',sql:'CREATE TABLE product_media_change_audit (product_media_change_audit_id INTEGER, product_id INTEGER)'},
            {name:'soap_products',sql:'CREATE TABLE soap_products (soap_product_id INTEGER, product_id INTEGER)'}
          ]};
        }
        return {results:[]};
      },
      async run(){deleteCalls.push({kind:'run',sql:normalized,args:this.args});return {meta:{changes:1}};}
    };
  },
  async batch(statements){
    deleteBatch=statements.map((statement)=>({sql:statement.sql,args:statement.args}));
    return statements.map(()=>({meta:{changes:1}}));
  }
};

const {onRequestPost}=await import(url.pathToFileURL(path.join(root,'functions/api/admin/delete-product.js')).href+`?post=${Date.now()}`);
const deleteResponse=await onRequestPost({
  request:new Request('https://devilndove.com/api/admin/delete-product',{method:'POST',headers:{Authorization:'Bearer test-admin-token','Content-Type':'application/json'},body:JSON.stringify({product_id:45,confirmation_phrase:'DELETE PRODUCT',confirm_password:password,deletion_reason:'Unused archived duplicate.',material_review_confirmed:1,material_actions:[{product_resource_link_id:5,site_item_inventory_id:9,release_quantity:1,return_on_hand_quantity:0}]})}),
  env:{DB:deleteDb}
});
const deletePayload=await deleteResponse.json();
assert(deleteResponse.status===200&&deletePayload.ok===true,'Reviewed archived-product removal should succeed in the mocked D1 path.');
assert(deleteBatch.some((row)=>row.sql.includes('UPDATE site_item_inventory')),'Reviewed inventory release is missing from the atomic batch.');
assert(deleteBatch.some((row)=>row.sql.includes('DELETE FROM "product_media_change_audit"')),'Editor media audit cleanup is missing from the atomic batch.');
assert(deleteBatch.some((row)=>row.sql.includes('UPDATE "soap_products" SET "product_id" = NULL')),'Preserved soap packaging was not detached in the atomic batch.');
assert(deleteBatch.at(-1)?.sql.includes('DELETE FROM products'),'Product deletion must be the final statement in the atomic batch.');
assert(deletePayload.material_summary?.release_quantity===1,'Reviewed reservation release summary is incorrect.');

const migration=read('database_build230_visual_image_manifest.sql');
assert(read('database_upgrade_current_pass.sql')===migration,'Build 232 is code-only; the current-pass SQL must remain the byte-identical Build 230 migration.');

console.log(`Build 232 archived-product removal, bounded preflight, registry coverage, safe parser and code-only schema checks: PASS (${calls.length} mock DB calls)`);
