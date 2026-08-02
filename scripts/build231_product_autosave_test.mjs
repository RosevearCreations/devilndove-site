import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import url from 'node:url';

const root=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'..');
const read=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

const auth=read('public/js/auth.js');
const createClient=read('public/js/admin-create-product.js');
const editClient=read('public/js/admin-edit-product.js');
const createApi=read('functions/api/admin/create-product.js');
const updateApi=read('functions/api/admin/update-product.js');
const socialHelper=read('functions/api/_lib/productSocialAutomation.js');
const productDetail=read('functions/api/admin/product-detail.js');

assert(auth.includes('cloudflare_worker_resource_limit'),'Shared API parser must identify a Cloudflare 1102 response.');
assert(auth.includes('readApiJson'),'Shared API parser export is missing.');
assert(createClient.includes('save_intent: autosave ? "autosave" : "manual"'),'Autosave intent is not sent to the server.');
assert(createClient.includes('dd_admin_product_autosave_recovery_v1'),'Browser recovery storage is missing.');
assert(createClient.includes('autosaveQueuedAfterFlight'),'Edits made during an in-flight autosave are not queued.');
assert(createClient.includes('Recover browser copy'),'The visible recovery action is missing.');
assert(editClient.includes('return readApiJson(response, "Failed to load product.")'),'Product reload does not use the safe API parser.');
assert(editClient.includes('form.dataset.autosavePaused = "1"'),'Programmatic product loading must pause autosave input handlers.');
assert(createApi.includes("code: 'AUTOSAVE_SKIPPED'") && updateApi.includes("code: 'AUTOSAVE_SKIPPED'"),'Autosave must skip optional social automation.');
assert(createApi.includes('if (isAutosave) review_status = "pending_review";'),'A new autosaved draft must not create an approval transition.');
assert(updateApi.includes('if (isAutosave) review_status = String(existingProduct.review_status'),'An existing autosave must preserve the stored review approval.');
assert(updateApi.includes('if (!isAutosave) await db.prepare(`\n      INSERT INTO product_media_change_audit'),'Autosave must skip repetitive media audit rows.');
assert(updateApi.includes('if (assignments.length)'),'Unchanged image rows must not be rewritten.');
assert(socialHelper.indexOf("if (!['approved', 'published'].includes(reviewStatus))") < socialHelper.indexOf('const settings = await getProductSocialAutomationSettings(db);'),'Unapproved drafts must exit before social schema inspection.');
assert(!/PRAGMA\s+table_info|sqlite_master/i.test(productDetail),'Product detail hot path must not run repeated schema-discovery queries.');
assert(productDetail.includes('response_profile: "editor_compact_v1"'),'Product detail compact response profile is missing.');
assert(productDetail.includes('.slice(0, 7)'),'Product detail must cap the editor image response at seven.');

const context={
  window:{},
  document:{cookie:'',dispatchEvent(){}},
  localStorage:{getItem(){return null;},setItem(){},removeItem(){}},
  CustomEvent:class{}, Headers, fetch, Request, Response, URL, console
};
vm.createContext(context);
vm.runInContext(auth,context);
const cloudflareHtml='<html><body>Worker exceeded resource limits <style>body{margin:0}</style></body></html>';
try {
  await context.window.DDAuth.readApiJson(new Response(cloudflareHtml,{status:503,headers:{'content-type':'text/html','cf-error-type':'1102'}}),{fallbackMessage:'Failed to load product.'});
  throw new Error('Cloudflare HTML response should have failed.');
} catch (error) {
  assert(error.isCloudflareResourceLimit===true,'Cloudflare resource-limit response was not classified.');
  assert(!error.message.includes('<html>') && !error.message.includes('body{'),'Raw Cloudflare HTML leaked into the operator message.');
}
const parsed=await context.window.DDAuth.readApiJson(new Response(JSON.stringify({ok:true,value:231}),{status:200,headers:{'content-type':'application/json'}}));
assert(parsed.value===231,'Valid JSON response did not pass through the shared parser.');

const detailCalls=[];
const detailDb={
  prepare(sql){
    const normalized=String(sql).replace(/\s+/g,' ').trim();
    const statement={
      args:[],
      bind(...args){this.args=args;return this;},
      async first(){
        detailCalls.push({kind:'first',sql:normalized,args:this.args});
        if(normalized.includes('FROM sessions s')) return {session_id:1,user_id:1,resolved_user_id:1,email:'admin@example.test',display_name:'Admin',role:'admin',is_active:1};
        if(normalized.includes('FROM products p')) return {product_id:45,name:'Product 45',slug:'product-45',status:'draft',tax_rate_raw:0.13,rate_percent_raw:13,color_name:'Rose',color_names_json:'["Rose"]',featured_image_url:''};
        if(normalized.includes('FROM product_seo')) return {meta_title:'Product 45 | Devil n Dove',meta_description:'Draft product detail test.'};
        return null;
      },
      async all(){
        detailCalls.push({kind:'all',sql:normalized,args:this.args});
        if(normalized.includes('FROM product_images')) return {results:[{product_image_id:1,product_id:45,image_url:'/images/product-45.webp',alt_text:'Product 45',sort_order:0}]};
        if(normalized.includes('FROM media_assets')) return {results:[]};
        return {results:[]};
      }
    };
    return statement;
  }
};
const {onRequestGet}=await import(url.pathToFileURL(path.join(root,'functions/api/admin/product-detail.js')).href+`?test=${Date.now()}`);
const detailResponse=await onRequestGet({request:new Request('https://devilndove.com/api/admin/product-detail?product_id=45',{headers:{Authorization:'Bearer test-admin-token'}}),env:{DB:detailDb}});
const detailPayload=await detailResponse.json();
assert(detailResponse.status===200 && detailPayload.ok===true,'Product 45 detail request must return valid JSON.');
assert(detailPayload.response_profile==='editor_compact_v1','Product 45 detail request did not return the compact profile.');
assert(detailPayload.product?.product_id===45 && detailPayload.images?.length===1,'Product 45 detail response shape is incomplete.');
assert(detailCalls.length===5,`Product detail should use exactly five bounded database calls; received ${detailCalls.length}.`);
assert(!detailCalls.some((call)=>/PRAGMA\s+table_info|sqlite_master/i.test(call.sql)),'Mock product-detail execution used database introspection.');
assert(!detailCalls.some((call)=>/tc\.rate_percent/i.test(call.sql)),'Product detail must remain compatible with the older tax_classes shape that has tax_rate but no rate_percent.');

const migration=read('database_build230_visual_image_manifest.sql');
assert(read('database_upgrade_current_pass.sql')===migration,'Build 231 is code-only; current-pass SQL must remain the byte-identical Build 230 migration.');
assert(!/^\s*(BEGIN(?:\s+TRANSACTION)?|COMMIT|SAVEPOINT|RELEASE(?:\s+SAVEPOINT)?|ROLLBACK)\b/im.test(migration),'Current D1 migration contains an unsupported explicit transaction statement.');

for(const page of ['admin/catalog/index.html','admin/products/index.html']){
  const html=read(page);
  assert((html.match(/<h1\b/gi)||[]).length===1,`${page} must keep exactly one H1.`);
  assert(/<meta\b[^>]*name=["']viewport["']/i.test(html),`${page} is missing its viewport meta tag.`);
}

console.log('Build 231 product autosave, reload parser, recovery, code-only schema and one-H1 checks: PASS');
