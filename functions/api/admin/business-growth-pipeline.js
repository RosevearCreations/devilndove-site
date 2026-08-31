// Release 464 Update 3 — cross-module business pipeline spine.
// References existing Product, Creators/CAIP, Storefront and Financials authorities. It does not publish, post accounting, execute providers or mutate Inventory.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { CURRENT_RELEASE } from '../_lib/releaseAuthority.js';

const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const id=(v)=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};
const clean=(v,n=1600)=>normalizeText(v).slice(0,n);
const STATUS=new Set(['draft','in_progress','review_ready','storefront_ready','complete','archived']);
const SOCIAL=new Set(['not_ready','review_ready','approved','held']);
const REQUIRED=['creative_business_pipelines','creative_business_pipeline_events'];
const json=(d,s=200)=>jsonResponse({release:CURRENT_RELEASE,provider_execution_active:false,publication_active:false,inventory_mutation_active:false,accounting_posting_active:false,...d},s,{'Cache-Control':'no-store'});

async function access(request,env){
  const user=await getAdminUserFromRequest(request,env);if(!user)return{response:json({ok:false,error:'Admin access required.'},401)};
  const db=getDb(env);if(!db)return{response:json({ok:false,error:'Database binding is not configured.'},500)};return{user,db};
}
async function schema(db){
  const marks=REQUIRED.map(()=>'?').join(',');
  const found=rows(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${marks})`).bind(...REQUIRED).all().catch(()=>({results:[]})));
  const set=new Set(found.map((r)=>String(r.name||'')));const missing=REQUIRED.filter((n)=>!set.has(n));return{ready:!missing.length,missing};
}
async function maybeOne(db,sql,bind=[]){try{return await db.prepare(sql).bind(...bind).first();}catch{return null}}
async function maybeRows(db,sql,bind=[]){try{return rows(await db.prepare(sql).bind(...bind).all());}catch{return[]}}
function makeKey(productId,creativeId){return `u3-${productId||'p0'}-${creativeId||'c0'}-${crypto.randomUUID().slice(0,10)}`;}
async function logEvent(db,pipelineId,eventType,userId,details={}){
  await db.prepare(`INSERT INTO creative_business_pipeline_events(creative_business_pipeline_id,event_type,details_json,actor_user_id,created_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP)`).bind(pipelineId,clean(eventType,100),JSON.stringify(details||{}),id(userId)||null).run();
}
async function autoRefs(db,productId,creativeId,contentId){
  let product=productId?await maybeOne(db,`SELECT product_id,name,slug,status,review_status,merchandise_origin,inventory_tracking,inventory_quantity FROM products WHERE product_id=? LIMIT 1`,[productId]):null;
  if(!product&&creativeId){const cp=await maybeOne(db,`SELECT product_id FROM creative_projects WHERE creative_project_id=? LIMIT 1`,[creativeId]);productId=id(cp?.product_id);if(productId)product=await maybeOne(db,`SELECT product_id,name,slug,status,review_status,merchandise_origin,inventory_tracking,inventory_quantity FROM products WHERE product_id=? LIMIT 1`,[productId]);}
  if(productId&&!contentId){const cp=await maybeOne(db,`SELECT content_project_id FROM content_projects WHERE product_id=? ORDER BY updated_at DESC,content_project_id DESC LIMIT 1`,[productId]);contentId=id(cp?.content_project_id);}
  if(productId&&!creativeId){const cp=await maybeOne(db,`SELECT creative_project_id FROM creative_projects WHERE product_id=? ORDER BY updated_at DESC,creative_project_id DESC LIMIT 1`,[productId]);creativeId=id(cp?.creative_project_id);}
  if(contentId&&!creativeId){const cp=await maybeOne(db,`SELECT creative_project_id FROM creative_projects WHERE content_project_id=? ORDER BY updated_at DESC,creative_project_id DESC LIMIT 1`,[contentId]);creativeId=id(cp?.creative_project_id);}
  return{productId,creativeId,contentId,product};
}
async function genealogySummary(db,productId){
  if(!productId)return{ready:false,purchase_lots:0,production_runs:0,material_allocations:0,finished_lots:0,order_lines:0};
  const result=await maybeOne(db,`SELECT
    (SELECT COUNT(DISTINCT ml.inventory_purchase_lot_id) FROM product_production_run_material_lots ml JOIN product_production_runs r ON r.product_production_run_id=ml.product_production_run_id WHERE r.product_id=?) AS purchase_lots,
    (SELECT COUNT(*) FROM product_production_runs WHERE product_id=?) AS production_runs,
    (SELECT COUNT(*) FROM product_production_run_material_lots ml JOIN product_production_runs r ON r.product_production_run_id=ml.product_production_run_id WHERE r.product_id=?) AS material_allocations,
    (SELECT COUNT(*) FROM product_finished_inventory_lots WHERE product_id=?) AS finished_lots,
    (SELECT COUNT(*) FROM order_items WHERE product_id=?) AS order_lines`,[productId,productId,productId,productId,productId]);
  const out={purchase_lots:Number(result?.purchase_lots||0),production_runs:Number(result?.production_runs||0),material_allocations:Number(result?.material_allocations||0),finished_lots:Number(result?.finished_lots||0),order_lines:Number(result?.order_lines||0)};
  out.ready=Boolean(out.material_allocations&&out.finished_lots);return out;
}
async function detail(db,row){
  if(!row)return null;
  const productId=id(row.product_id),creativeId=id(row.creative_project_id),contentId=id(row.content_project_id);
  const [product,creative,content,events,collections,close,genealogy]=await Promise.all([
    productId?maybeOne(db,`SELECT product_id,name,slug,status,review_status,merchandise_origin,inventory_tracking,inventory_quantity FROM products WHERE product_id=? LIMIT 1`,[productId]):null,
    creativeId?maybeOne(db,`SELECT creative_project_id,creative_project_key,project_title,project_status,governance_status,content_project_id,product_id,updated_at FROM creative_projects WHERE creative_project_id=? LIMIT 1`,[creativeId]):null,
    contentId?maybeOne(db,`SELECT * FROM content_projects WHERE content_project_id=? LIMIT 1`,[contentId]):null,
    maybeRows(db,`SELECT * FROM creative_business_pipeline_events WHERE creative_business_pipeline_id=? ORDER BY created_at DESC,creative_business_pipeline_event_id DESC LIMIT 80`,[row.creative_business_pipeline_id]),
    productId?maybeRows(db,`SELECT sc.storefront_collection_id,sc.name,sc.slug,sc.status,scp.membership_status FROM storefront_collection_products scp JOIN storefront_collections sc ON sc.storefront_collection_id=scp.storefront_collection_id WHERE scp.product_id=? ORDER BY sc.sort_order,sc.name`,[productId]):[],
    row.accounting_period_month?maybeOne(db,`SELECT * FROM accounting_period_closures WHERE period_month=? LIMIT 1`,[row.accounting_period_month]):null,
    genealogySummary(db,productId)
  ]);
  const next=[];
  if(!productId)next.push('Link a Product.');
  if(productId&&!creativeId)next.push('Create or link the reviewed CAIP Creative Project.');
  if(productId&&!contentId)next.push('Create or refresh the Content Studio package.');
  if(productId&&!genealogy.ready&&String(product?.merchandise_origin||'').toLowerCase()==='made_in_house')next.push('Post a reviewed lot-aware production run so material genealogy is provable.');
  if(productId&&!collections.some((c)=>String(c.status)==='published'&&String(c.membership_status)==='included'))next.push('Place the Product in a reviewed Storefront collection or let an active rule include it.');
  if(!row.accounting_period_month)next.push('Assign the accounting period used for profitability/month-end review.');
  if(String(row.social_handoff_status||'not_ready')==='not_ready')next.push('Move reviewed content to social handoff when CAIP evidence is ready.');
  return{pipeline:row,product,creative_project:creative,content_project:content,storefront_collections:collections,accounting_period:close,genealogy,events,next_actions:next};
}

export async function onRequestGet({request,env}){
  const a=await access(request,env);if(a.response)return a.response;const s=await schema(a.db);if(!s.ready)return json({ok:false,code:'update3_schema_not_ready',missing_tables:s.missing,error:`Release 464 Update 3 pipeline schema is not ready: ${s.missing.join(', ')}`},503);
  const url=new URL(request.url),pipelineId=id(url.searchParams.get('pipeline_id')),productId=id(url.searchParams.get('product_id'));
  try{
    if(pipelineId||productId){
      const row=await a.db.prepare(`SELECT * FROM creative_business_pipelines WHERE ${pipelineId?'creative_business_pipeline_id=?':'product_id=?'} LIMIT 1`).bind(pipelineId||productId).first();
      if(!row)return json({ok:false,error:'Business pipeline not found.'},404);return json({ok:true,detail:await detail(a.db,row)});
    }
    const list=rows(await a.db.prepare(`SELECT p.*,pr.name AS product_name,pr.slug AS product_slug,cp.project_title,cp.project_status FROM creative_business_pipelines p LEFT JOIN products pr ON pr.product_id=p.product_id LEFT JOIN creative_projects cp ON cp.creative_project_id=p.creative_project_id ORDER BY CASE p.pipeline_status WHEN 'archived' THEN 1 ELSE 0 END,p.updated_at DESC,p.creative_business_pipeline_id DESC LIMIT 250`).all());
    const counts=await a.db.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN pipeline_status='complete' THEN 1 ELSE 0 END) complete_count,SUM(CASE WHEN pipeline_status<>'complete' AND pipeline_status<>'archived' THEN 1 ELSE 0 END) open_count,SUM(CASE WHEN social_handoff_status='review_ready' THEN 1 ELSE 0 END) social_review_ready FROM creative_business_pipelines`).first();
    return json({ok:true,pipelines:list,summary:{total:Number(counts?.total||0),complete_count:Number(counts?.complete_count||0),open_count:Number(counts?.open_count||0),social_review_ready:Number(counts?.social_review_ready||0)}});
  }catch(e){return json({ok:false,error:e?.message||'Business pipeline could not load.'},500);}
}

export async function onRequestPost(context){
  const a=await access(context.request,context.env);if(a.response)return a.response;const s=await schema(a.db);if(!s.ready)return json({ok:false,code:'update3_schema_not_ready',missing_tables:s.missing,error:`Release 464 Update 3 pipeline schema is not ready: ${s.missing.join(', ')}`},503);
  let b={};try{b=await context.request.json();}catch{return json({ok:false,error:'Valid JSON is required.'},400)}
  const action=clean(b.action,60).toLowerCase();
  try{
    if(action==='sync_from_product'||action==='save_pipeline'){
      let pipelineId=id(b.creative_business_pipeline_id),productId=id(b.product_id),creativeId=id(b.creative_project_id),contentId=id(b.content_project_id);
      const refs=await autoRefs(a.db,productId,creativeId,contentId);productId=refs.productId;creativeId=refs.creativeId;contentId=refs.contentId;
      if(!productId&&!creativeId&&!contentId)return json({ok:false,error:'Link at least a Product, Creative Project, or Content Project.'},400);
      const status=STATUS.has(clean(b.pipeline_status,40))?clean(b.pipeline_status,40):'in_progress';
      const social=SOCIAL.has(clean(b.social_handoff_status,40))?clean(b.social_handoff_status,40):'not_ready';
      const collectionId=id(b.storefront_collection_id)||null,month=clean(b.accounting_period_month,7)||null;
      if(month&&!/^\d{4}-\d{2}$/.test(month))return json({ok:false,error:'Accounting period must be YYYY-MM.'},400);
      if(!pipelineId&&productId){const existing=await maybeOne(a.db,`SELECT creative_business_pipeline_id FROM creative_business_pipelines WHERE product_id=? LIMIT 1`,[productId]);pipelineId=id(existing?.creative_business_pipeline_id);}
      if(!pipelineId&&creativeId){const existing=await maybeOne(a.db,`SELECT creative_business_pipeline_id FROM creative_business_pipelines WHERE creative_project_id=? LIMIT 1`,[creativeId]);pipelineId=id(existing?.creative_business_pipeline_id);}
      if(pipelineId){
        await a.db.prepare(`UPDATE creative_business_pipelines SET creative_project_id=?,content_project_id=?,product_id=?,storefront_collection_id=?,accounting_period_month=?,pipeline_status=?,social_handoff_status=?,finished_inventory_reference=?,notes=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE creative_business_pipeline_id=?`)
          .bind(creativeId||null,contentId||null,productId||null,collectionId,month,status,social,clean(b.finished_inventory_reference,400)||null,clean(b.notes,2500)||null,a.user.user_id||null,pipelineId).run();
      }else{
        const r=await a.db.prepare(`INSERT INTO creative_business_pipelines(pipeline_key,creative_project_id,content_project_id,product_id,storefront_collection_id,accounting_period_month,pipeline_status,social_handoff_status,finished_inventory_reference,notes,created_by_user_id,updated_by_user_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`)
          .bind(clean(b.pipeline_key,160)||makeKey(productId,creativeId),creativeId||null,contentId||null,productId||null,collectionId,month,status,social,clean(b.finished_inventory_reference,400)||null,clean(b.notes,2500)||null,a.user.user_id||null,a.user.user_id||null).run();
        pipelineId=Number(r?.meta?.last_row_id||0);
      }
      await logEvent(a.db,pipelineId,action,a.user.user_id,{product_id:productId||null,creative_project_id:creativeId||null,content_project_id:contentId||null,pipeline_status:status,social_handoff_status:social});
      await auditAdminAction(context.env,context.request,a.user,{action_type:'business_growth_pipeline_saved',target_type:'creative_business_pipeline',target_id:pipelineId,details:{action,product_id:productId||null,creative_project_id:creativeId||null,content_project_id:contentId||null,status,social}}).catch(()=>null);
      const row=await a.db.prepare(`SELECT * FROM creative_business_pipelines WHERE creative_business_pipeline_id=?`).bind(pipelineId).first();
      return json({ok:true,message:'Business pipeline references saved. No Inventory, accounting or provider execution was performed.',detail:await detail(a.db,row)});
    }
    if(action==='set_social_handoff'){
      const pipelineId=id(b.creative_business_pipeline_id),social=clean(b.social_handoff_status,40);if(!pipelineId||!SOCIAL.has(social))return json({ok:false,error:'Pipeline and supported social handoff status are required.'},400);
      await a.db.prepare(`UPDATE creative_business_pipelines SET social_handoff_status=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE creative_business_pipeline_id=?`).bind(social,a.user.user_id||null,pipelineId).run();
      await logEvent(a.db,pipelineId,'social_handoff_status',a.user.user_id,{social_handoff_status:social});
      const row=await a.db.prepare(`SELECT * FROM creative_business_pipelines WHERE creative_business_pipeline_id=?`).bind(pipelineId).first();return json({ok:true,detail:await detail(a.db,row)});
    }
    return json({ok:false,error:'Unsupported business pipeline action.'},400);
  }catch(e){return json({ok:false,error:e?.message||'Business pipeline operation failed.'},400);}
}
