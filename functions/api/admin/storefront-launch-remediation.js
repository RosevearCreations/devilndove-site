// Release 467 Build 206 — Launch-Set Remediation Campaign.
// Reuses Build 204 launch-set classification; stores only explicit admin campaign review.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText, auditAdminAction } from '../_lib/adminAudit.js';
import { buildReadBudgetHeaders } from '../_lib/d1ReadBudget.js';
import { loadProjection, summary as summarizeLaunchSet } from './storefront-launch-set.js';

const BUILD=206;
const MAX_SOURCE_ROWS=240;
const MAX_REMEDIATION_ROWS=400;
const AREAS=new Set(['buyer','media','inventory','cost','publication','commerce','other']);
const STATUSES=new Set(['open','in_progress','blocked','resolved']);
const RECHECK=new Set(['not_checked','open','cleared','stale']);
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const text=(v,max=1000)=>normalizeText(v).slice(0,max);
const n=(v)=>Number(v||0);
const key=(productId,code)=>`${productId}::${code}`;

function json(data,status=200,limit=0){
  return jsonResponse(data,status,{'Cache-Control':'no-store',...buildReadBudgetHeaders('admin_storefront_launch_remediation_v206',{limit})});
}
function suggestedOwner(reason){
  const area=text(reason?.area,40).toLowerCase();
  if(area==='media')return 'Product Media';
  if(area==='inventory'||area==='cost')return 'Inventory Operations';
  return 'Product Editor';
}
function blockerBuckets(products){
  const out={buyer:0,media:0,stock:0,linked_cost:0,publication:0,inventory_link:0,commerce:0,other:0,total:0};
  for(const product of products){
    for(const reason of (product.all_reasons||[])){
      out.total+=1;
      if(reason.code==='tracked_finished_stock_zero')out.stock+=1;
      else if(reason.code==='linked_cost_unknown')out.linked_cost+=1;
      else if(reason.code==='linked_inventory_missing'||reason.code==='linked_inventory_inactive')out.inventory_link+=1;
      else if(reason.area==='buyer')out.buyer+=1;
      else if(reason.area==='media')out.media+=1;
      else if(reason.area==='publication')out.publication+=1;
      else if(reason.area==='commerce')out.commerce+=1;
      else out.other+=1;
    }
  }
  return out;
}
async function loadCampaignRows(db){
  return rows(await db.prepare(`
    SELECT storefront_launch_remediation_item_id,product_id,blocker_code,blocker_area,blocker_label,
           owner,remediation_status,due_note,notes,baseline_evidence_token,last_recheck_evidence_token,
           last_recheck_result,completion_evidence,last_rechecked_at,resolved_at,created_at,updated_at
    FROM storefront_launch_remediation_items
    ORDER BY datetime(updated_at) DESC, storefront_launch_remediation_item_id DESC
    LIMIT ${MAX_REMEDIATION_ROWS}
  `).all());
}
function overlay(products,campaignRows){
  const byKey=new Map(campaignRows.map((row)=>[key(n(row.product_id),text(row.blocker_code,120)),row]));
  return products.map((product)=>({
    product_id:product.product_id,name:product.name,sku:product.sku,slug:product.slug,status:product.status,
    evidence_token:product.evidence_token,
    publication:product.publication,media:product.media,inventory:product.inventory,cost:product.cost,
    blockers:(product.all_reasons||[]).map((reason)=>{
      const saved=byKey.get(key(product.product_id,text(reason.code,120)))||null;
      return {
        code:reason.code,area:reason.area,label:reason.label,repair_href:reason.repair_href,automatic_fix:false,
        recheck_href:`/api/admin/storefront-launch-set?mode=product&product_id=${encodeURIComponent(product.product_id)}&expected_token=${encodeURIComponent(product.evidence_token||'')}`,
        suggested_owner:suggestedOwner(reason),
        reviewed:Boolean(saved),
        remediation:saved?{
          id:saved.storefront_launch_remediation_item_id,owner:saved.owner,status:saved.remediation_status,
          due_note:saved.due_note||'',notes:saved.notes||'',baseline_evidence_token:saved.baseline_evidence_token||'',
          last_recheck_evidence_token:saved.last_recheck_evidence_token||'',last_recheck_result:saved.last_recheck_result||'not_checked',
          completion_evidence:saved.completion_evidence||'',last_rechecked_at:saved.last_rechecked_at||null,
          resolved_at:saved.resolved_at||null,updated_at:saved.updated_at||null
        }:{
          owner:'',status:'open',due_note:'',notes:'',baseline_evidence_token:product.evidence_token||'',
          last_recheck_evidence_token:'',last_recheck_result:'not_checked',completion_evidence:''
        }
      };
    })
  }));
}

export async function onRequestGet({request,env}){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return json({ok:false,error:'Admin access required.'},401);
  const db=getDb(env);
  if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  try{
    const [products,campaignRows]=await Promise.all([loadProjection(db,0,MAX_SOURCE_ROWS),loadCampaignRows(db)]);
    const launchSummary=summarizeLaunchSet(products);
    const currentCodes=new Set();
    for(const product of products)for(const reason of (product.all_reasons||[]))currentCodes.add(key(product.product_id,reason.code));
    const currentRows=campaignRows.filter((row)=>currentCodes.has(key(n(row.product_id),text(row.blocker_code,120))));
    const statusCounts={open:0,in_progress:0,blocked:0,resolved:0,unreviewed:0};
    for(const product of products)for(const reason of (product.all_reasons||[])){
      const saved=currentRows.find((row)=>n(row.product_id)===n(product.product_id)&&text(row.blocker_code,120)===text(reason.code,120));
      if(!saved)statusCounts.unreviewed+=1; else statusCounts[saved.remediation_status]=(statusCounts[saved.remediation_status]||0)+1;
    }
    const baseline={products_reviewed:43,ready:1,review_required:42};
    return json({
      ok:true,release:467,build:BUILD,authority:'build204_launch_set_plus_build206_remediation_metadata',
      mutation_capability:'explicit_campaign_metadata_only',request_time_schema_mutation:false,
      baseline,current:launchSummary,movement:{
        ready_delta:n(launchSummary.ready)-baseline.ready,
        review_required_delta:n(launchSummary.review_required)-baseline.review_required
      },
      blocker_buckets:blockerBuckets(products),campaign_status:statusCounts,
      reviewed_current_blockers:currentRows.length,
      resolved_history_count:campaignRows.filter((row)=>row.remediation_status==='resolved'&&!currentCodes.has(key(n(row.product_id),text(row.blocker_code,120)))).length,
      products:overlay(products,campaignRows),
      safety:{
        duplicate_readiness_rules:false,automatic_product_copy:false,automatic_publication:false,automatic_unpublication:false,
        product_fact_write:false,inventory_write:false,r2_mutation:false,provider_execution:false,payment_refund:false,accounting_posting:false
      }
    },200,MAX_SOURCE_ROWS);
  }catch(error){
    return json({ok:false,build:BUILD,error:'Launch-set remediation campaign could not be loaded.',detail:text(error?.message||error,500)},503);
  }
}

export async function onRequestPost({request,env}){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return json({ok:false,error:'Admin access required.'},401);
  const db=getDb(env);
  if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  let body={}; try{body=await request.json();}catch{return json({ok:false,error:'JSON body required.'},400);}
  const productId=n(body.product_id), blockerCode=text(body.blocker_code,120), area=text(body.blocker_area,40).toLowerCase();
  const blockerLabel=text(body.blocker_label,300), owner=text(body.owner,120), status=text(body.status,30).toLowerCase();
  const dueNote=text(body.due_note,300), notes=text(body.notes,1500);
  const baselineToken=text(body.baseline_evidence_token,300), recheckToken=text(body.last_recheck_evidence_token,300);
  const recheckResult=text(body.last_recheck_result||'not_checked',30).toLowerCase();
  const completionEvidence=text(body.completion_evidence,1500);
  if(!Number.isInteger(productId)||productId<=0)return json({ok:false,error:'A positive product_id is required.'},400);
  if(!/^[a-z0-9_:-]{2,120}$/i.test(blockerCode))return json({ok:false,error:'A valid blocker_code is required.'},400);
  if(!AREAS.has(area))return json({ok:false,error:'Unsupported blocker area.'},400);
  if(!owner)return json({ok:false,error:'A reviewed owner is required before saving.'},400);
  if(!STATUSES.has(status))return json({ok:false,error:'Unsupported remediation status.'},400);
  if(!RECHECK.has(recheckResult))return json({ok:false,error:'Unsupported recheck result.'},400);
  if(status==='resolved'&&(recheckResult!=='cleared'||!recheckToken||!completionEvidence)){
    return json({ok:false,error:'Resolved requires an official cleared recheck token and completion evidence.'},409);
  }
  try{
    const exists=await db.prepare('SELECT product_id FROM products WHERE product_id=? LIMIT 1').bind(productId).first();
    if(!exists)return json({ok:false,error:'Product was not found.'},404);
    await db.prepare(`
      INSERT INTO storefront_launch_remediation_items (
        product_id,blocker_code,blocker_area,blocker_label,owner,remediation_status,due_note,notes,
        baseline_evidence_token,last_recheck_evidence_token,last_recheck_result,completion_evidence,
        last_rechecked_at,resolved_at,created_by_user_id,updated_by_user_id,created_at,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CASE WHEN ?='not_checked' THEN NULL ELSE CURRENT_TIMESTAMP END,
                CASE WHEN ?='resolved' THEN CURRENT_TIMESTAMP ELSE NULL END,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(product_id,blocker_code) DO UPDATE SET
        blocker_area=excluded.blocker_area,blocker_label=excluded.blocker_label,owner=excluded.owner,
        remediation_status=excluded.remediation_status,due_note=excluded.due_note,notes=excluded.notes,
        baseline_evidence_token=COALESCE(NULLIF(storefront_launch_remediation_items.baseline_evidence_token,''),excluded.baseline_evidence_token),
        last_recheck_evidence_token=excluded.last_recheck_evidence_token,last_recheck_result=excluded.last_recheck_result,
        completion_evidence=excluded.completion_evidence,
        last_rechecked_at=CASE WHEN excluded.last_recheck_result='not_checked' THEN storefront_launch_remediation_items.last_rechecked_at ELSE CURRENT_TIMESTAMP END,
        resolved_at=CASE WHEN excluded.remediation_status='resolved' THEN COALESCE(storefront_launch_remediation_items.resolved_at,CURRENT_TIMESTAMP) ELSE NULL END,
        updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP
    `).bind(productId,blockerCode,area,blockerLabel||null,owner,status,dueNote||null,notes||null,
      baselineToken||null,recheckToken||null,recheckResult,completionEvidence||null,recheckResult,status,
      admin.user_id,admin.user_id).run();
    await auditAdminAction(env,request,admin,{action_type:'storefront_launch_remediation_review',target_type:'product',target_id:productId,target_key:blockerCode,details:{blocker_area:area,status,recheck_result:recheckResult}});
    const saved=await db.prepare(`
      SELECT storefront_launch_remediation_item_id,product_id,blocker_code,blocker_area,blocker_label,owner,
             remediation_status,due_note,notes,baseline_evidence_token,last_recheck_evidence_token,last_recheck_result,
             completion_evidence,last_rechecked_at,resolved_at,created_at,updated_at
      FROM storefront_launch_remediation_items WHERE product_id=? AND blocker_code=? LIMIT 1
    `).bind(productId,blockerCode).first();
    return json({ok:true,build:BUILD,saved,mutation_capability:'campaign_metadata_only'},200,1);
  }catch(error){
    return json({ok:false,error:'Remediation review could not be saved.',detail:text(error?.message||error,500)},503);
  }
}
