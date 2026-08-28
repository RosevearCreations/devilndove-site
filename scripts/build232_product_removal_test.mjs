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
const managedProjectRefs=new Set(['content_projects.product_id','creative_projects.product_id']);
const classified=new Set([...owned,...detached,...protectedRefs,...managedProjectRefs]);

assert(owned.has('product_media_change_audit.product_id'),'Editor media audit rows must not make an unused archived product undeletable.');
assert(!protectedRefs.has('product_media_change_audit.product_id'),'Editor media audit rows remain incorrectly classified as protected history.');
assert(owned.has('product_review_actions.product_id'),'Product-owned review actions are missing from cleanup.');
assert(detached.has('soap_products.product_id'),'Soap packaging records must be preserved and detached.');
assert(!/PRAGMA\s+foreign_key_list/i.test(api),'Removal preflight must not inspect every foreign key at request time.');
assert(!api.includes("name NOT LIKE 'sqlite_%'"),'Removal preflight must not enumerate every D1 table.');
assert(api.includes("cleanup_profile: 'bounded_registry_v2_generated_shell_cleanup'"),'Bounded v2 removal response profile is missing.');
assert(api.includes('await Promise.all(['),'Reference, material and managed-shell preflight reads should run together.');
assert(api.includes('history_allows_removal')&&api.includes('material_review_required'),'Preflight must distinguish protected history from reviewable material reservations.');
assert(/if \(Number\(preflight\.history_allows_removal \|\| 0\) !== 1\)/.test(api),'POST must require Archive only for protected history.');
assert(/async function runCleanup\([\s\S]*?const statements = \[\.\.\.materialStatements\];[\s\S]*?statements\.push\(db\.prepare\(`DELETE FROM products WHERE product_id = \?`\)[\s\S]*?return db\.batch\(statements\);/.test(api),'Reviewed inventory actions and product cleanup must be submitted through one D1 batch with Product deletion in that same statement list.');
assert(api.includes('runCleanup(db, productId, materialPlan.statements, preflight.managed_shells)'),'Inventory actions and reviewed generated-shell cleanup are not included in the final cleanup batch.');
assert(api.includes('FROM content_projects cp')&&api.includes("table_name: 'content_projects'")&&api.includes('contentProjectIds.push'),'Content Studio product references are not conditionally classified as generated shell vs protected history.');
assert(api.includes('FROM creative_projects cp')&&api.includes("table_name: 'creative_projects'")&&api.includes('creativeProjectIds.push'),'CAIP product references are not conditionally classified as generated shell vs protected history.');
assert(api.includes('for (const creativeProjectId of (managedShells?.creative_project_ids || []))')&&api.includes('DELETE FROM creative_projects WHERE creative_project_id = ?'),'Reviewed safe CAIP shells are not included in atomic product cleanup.');
assert(api.includes('for (const contentProjectId of (managedShells?.content_project_ids || []))')&&api.includes('DELETE FROM content_projects WHERE content_project_id = ?'),'Reviewed safe Content Studio shells are not included in atomic product cleanup.');
assert(deleteClient.includes('history_allows_removal')&&deleteClient.includes('material_review_required'),'Delete UI must distinguish history blockers from material review.');

for(const source of [correction,deleteClient,cleanupClient]){
  assert(source.includes('window.DDAuth?.readApiJson'),'A product-removal browser path still parses responses unsafely.');
}
assert(auth.includes('error.payload = data'),'Shared API errors must retain structured response details.');

const unclassified=[];
for(const schemaName of ['database_schema.sql','database_full_schema.sql','database_store_schema.sql']){
  const schema=read(schemaName);
  const pattern=/FOREIGN KEY\s*\(\s*["`\[]?([A-Za-z_][A-Za-z0-9_]*)["`\]]?\s*\)\s*REFERENCES\s+["`\[]?products["`\]]?/gi;
  for(const match of schema.matchAll(pattern)){
    const before=schema.slice(0,match.index);
    const creates=[...before.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+["`\[]?([A-Za-z_][A-Za-z0-9_]*)["`\]]?/gi)];
    const table=creates.at(-1)?.[1]||'';
    const key=`${table}.${match[1]}`;
    if(!classified.has(key)) unclassified.push(`${schemaName}: ${key}`);
  }
}
assert(!unclassified.length,`Aggregate schemas have unclassified product references:\n - ${[...new Set(unclassified)].join('\n - ')}`);

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

const moduleUrl=url.pathToFileURL(path.join(root,'functions/api/admin/delete-product.js')).href;
const {onRequestGet}=await import(moduleUrl+`?test=${Date.now()}`);
const response=await onRequestGet({request:new Request('https://devilndove.com/api/admin/delete-product?product_id=45',{headers:{Authorization:'Bearer test-admin-token'}}),env:{DB:db}});
const payload=await response.json();
assert(response.status===200&&payload.ok===true,'Archived product removal preflight must return valid JSON.');
assert(payload.product?.status==='archived'&&payload.deletion_allowed===1,'Archive status alone must not block unused-product deletion.');
assert(payload.history_allows_removal===1&&payload.material_review_required===0&&payload.requires_archive===0,'Clean unused Product must report history clear with no material review requirement.');
assert(payload.cleanup_profile==='bounded_registry_v2_generated_shell_cleanup','Removal preflight did not return the bounded v2 profile.');
assert(!calls.some((call)=>/PRAGMA\s+foreign_key_list|name NOT LIKE 'sqlite_%'/i.test(call.sql)),'Mock removal preflight performed unbounded schema discovery.');
const boundedGetBudget=owned.size+detached.size+protectedRefs.size+5;
assert(calls.length<=boundedGetBudget,`Removal preflight exceeded its bounded v2 query budget: ${calls.length} calls > ${boundedGetBudget}.`);

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
        return null;
      },
      async all(){
        deleteCalls.push({kind:'all',sql:normalized,args:this.args});
        if(normalized.includes('FROM product_resource_links prl')) return {results:[{product_resource_link_id:5,product_id:45,resource_kind:'supply',source_key:'supply-5',quantity_used:1,consumption_mode:'per_unit',site_item_inventory_id:9,item_name:'Test supply',on_hand_quantity:3,reserved_quantity:1,incoming_quantity:0,unit_cost_cents:100,usage_units_per_stock_unit:1,stock_unit_label:'unit',usage_unit_label:'unit'}]};
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

const materialPreviewResponse=await onRequestGet({request:new Request('https://devilndove.com/api/admin/delete-product?product_id=45',{headers:{Authorization:'Bearer test-admin-token'}}),env:{DB:deleteDb}});
const materialPreview=await materialPreviewResponse.json();
assert(materialPreviewResponse.status===200&&materialPreview.ok===true,'Material-review preflight must still return valid JSON.');
assert(materialPreview.history_allows_removal===1,'Reserved material alone must not be mislabeled as protected history.');
assert(materialPreview.material_review_required===1&&materialPreview.deletion_allowed===0,'Reserved material must block immediate deletion pending explicit review.');
assert(materialPreview.requires_archive===0,'Reserved material alone must not force Product archive.');

const {onRequestPost}=await import(moduleUrl+`?post=${Date.now()}`);
const unreviewedResponse=await onRequestPost({
  request:new Request('https://devilndove.com/api/admin/delete-product',{method:'POST',headers:{Authorization:'Bearer test-admin-token','Content-Type':'application/json'},body:JSON.stringify({product_id:45,confirmation_phrase:'DELETE PRODUCT',confirm_password:password,deletion_reason:'Unused archived duplicate.'})}),
  env:{DB:deleteDb}
});
const unreviewedPayload=await unreviewedResponse.json();
assert(unreviewedResponse.status===409&&unreviewedPayload.code==='material_review_required','POST must fail closed when reserved materials were not explicitly reviewed.');
assert(unreviewedPayload.requires_archive===false,'Material-review failure must not masquerade as protected-history archive requirement.');

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
assert(migration.includes('build230_visual_image_manifest'),'Retained Build 230 migration ledger marker is missing.');

console.log(`Build 232 archived-product removal, bounded v2 preflight, history/material separation, atomic reviewed release and registry coverage: PASS (${calls.length}/${boundedGetBudget} mock GET DB calls)`);
