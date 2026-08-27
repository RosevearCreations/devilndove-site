// Devil n Dove Build 440 — audited, lot-aware finished-product production reversal.
// New production runs carry exact raw purchase-lot provenance and one finished inventory lot.
// Reversal restores those exact raw lots and is blocked when downstream post-cutover order
// commitments have reached the finished lot. Older pre-cutover runs retain the conservative
// aggregate-stock guard; historical provenance is never fabricated.

import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from '../_lib/adminAudit.js';
import { EPSILON, loadFinishedLotGuard, productLotSchemaReadiness } from '../_lib/productLotProvenance.js';

const BUILD = 440;
function json(data,status=200){return jsonResponse(data,status,{'Cache-Control':'no-store'});}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function positiveId(value){const n=Number(value||0);return Number.isInteger(n)&&n>0?n:0;}
function number(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}
function boundedText(value,max=1000){return normalizeText(value).slice(0,max);}
function fail(message,{status=400,code='product_production_reversal_invalid',details=null}={}){const e=new Error(message);e.status=status;e.code=code;e.details=details;return e;}

async function loadRun(db,runId){
  return db.prepare(`SELECT r.*,p.name product_name,p.sku product_sku,COALESCE(p.inventory_quantity,0) product_inventory_quantity,COALESCE(p.inventory_tracking,0) product_inventory_tracking
    FROM product_production_runs r INNER JOIN products p ON p.product_id=r.product_id WHERE r.product_production_run_id=? LIMIT 1`).bind(runId).first();
}
async function loadRunMaterials(db,runId){
  const result=await db.prepare(`SELECT product_production_run_material_id,product_production_run_id,product_resource_link_id,site_item_inventory_id,resource_kind,source_key,item_name,consumption_mode,tracking_mode,usage_quantity,usage_unit_label,stock_quantity_consumed,stock_unit_label,unit_cost_cents,is_label_ingredient,ingredient_name_en,ingredient_name_fr,inci_name,created_at
    FROM product_production_run_materials WHERE product_production_run_id=? ORDER BY product_production_run_material_id`).bind(runId).all();
  return rows(result);
}
async function loadInventoryRows(db,ids){
  const clean=[...new Set(ids.map(positiveId).filter(Boolean))];if(!clean.length)return new Map();
  const placeholders=clean.map(()=>'?').join(',');
  const result=await db.prepare(`SELECT site_item_inventory_id,source_type,external_key,item_name,COALESCE(on_hand_quantity,0) on_hand_quantity,COALESCE(reserved_quantity,0) reserved_quantity,COALESCE(incoming_quantity,0) incoming_quantity,COALESCE(stock_unit_label,'unit') stock_unit_label,COALESCE(usage_unit_label,'unit') usage_unit_label,COALESCE(is_active,1) is_active FROM site_item_inventory WHERE site_item_inventory_id IN (${placeholders})`).bind(...clean).all();
  return new Map(rows(result).map((row)=>[positiveId(row.site_item_inventory_id),row]));
}
async function loadMaterialLotReturns(db,runId){
  const result=await db.prepare(`
    SELECT pml.product_production_run_material_lot_id,pml.product_production_run_material_id,pml.product_production_run_id,
           pml.inventory_purchase_lot_id,pml.site_item_inventory_id,pml.allocation_sequence,pml.allocation_method,
           pml.lot_code_snapshot,pml.quantity_consumed,pml.stock_unit_label,pml.extended_cost_cents,
           ipl.lot_code current_lot_code,COALESCE(ipl.quantity_remaining,0) current_quantity_remaining,
           COALESCE(ipl.lot_status,'') current_lot_status
    FROM product_production_run_material_lots pml
    LEFT JOIN inventory_purchase_lots ipl ON ipl.inventory_purchase_lot_id=pml.inventory_purchase_lot_id
    WHERE pml.product_production_run_id=?
    ORDER BY pml.product_production_run_material_id,pml.allocation_sequence,pml.product_production_run_material_lot_id
  `).bind(runId).all();
  return rows(result);
}

async function buildPreview(db,runId){
  const run=await loadRun(db,runId);
  if(!run)throw fail('Finished-production run was not found.',{status:404,code:'product_production_reversal_run_not_found'});
  const materials=await loadRunMaterials(db,runId);
  const schema=await productLotSchemaReadiness(db);
  const returnByInventory=new Map();const blockers=[];
  for(const material of materials){
    const consumed=Math.max(0,number(material.stock_quantity_consumed,0));if(!(consumed>EPSILON))continue;
    const inventoryId=positiveId(material.site_item_inventory_id);
    if(!inventoryId){blockers.push(`${material.item_name||material.source_key||'A consumed material'} no longer has an Inventory identity. Review this run manually before reversal.`);continue;}
    const current=returnByInventory.get(inventoryId)||{site_item_inventory_id:inventoryId,return_stock_quantity:0,source_material_rows:0,snapshot_item_names:[],snapshot_stock_unit_label:material.stock_unit_label||'unit'};
    current.return_stock_quantity=Number((current.return_stock_quantity+consumed).toFixed(6));current.source_material_rows+=1;
    if(material.item_name&&!current.snapshot_item_names.includes(material.item_name))current.snapshot_item_names.push(material.item_name);
    returnByInventory.set(inventoryId,current);
  }
  const inventoryRows=await loadInventoryRows(db,[...returnByInventory.keys()]);const returnPlan=[];
  for(const plan of returnByInventory.values()){
    const item=inventoryRows.get(plan.site_item_inventory_id);
    if(!item){blockers.push(`Inventory item #${plan.site_item_inventory_id} from the production snapshot no longer exists. Review this run manually before reversal.`);continue;}
    const previous=Math.max(0,number(item.on_hand_quantity,0));const next=Number((previous+plan.return_stock_quantity).toFixed(6));
    returnPlan.push({...plan,item_name:item.item_name||plan.snapshot_item_names[0]||`Inventory #${plan.site_item_inventory_id}`,source_type:item.source_type||'',external_key:item.external_key||'',stock_unit_label:item.stock_unit_label||plan.snapshot_stock_unit_label||'unit',inventory_is_active:Number(item.is_active||0)===1?1:0,previous_on_hand_quantity:previous,new_on_hand_quantity:next,previous_reserved_quantity:Math.max(0,number(item.reserved_quantity,0)),previous_incoming_quantity:Math.max(0,number(item.incoming_quantity,0))});
  }

  const lotRows=schema.ok?await loadMaterialLotReturns(db,runId):[];const lotReturnPlan=[];
  for(const lot of lotRows){
    const lotId=positiveId(lot.inventory_purchase_lot_id);
    if(!lotId||!lot.current_lot_code){blockers.push(`Purchase lot ${lot.lot_code_snapshot||lotId||'unknown'} from the production snapshot no longer exists. Reversal is blocked.`);continue;}
    const previous=Math.max(0,number(lot.current_quantity_remaining,0));const quantity=Math.max(0,number(lot.quantity_consumed,0));
    lotReturnPlan.push({product_production_run_material_lot_id:positiveId(lot.product_production_run_material_lot_id),inventory_purchase_lot_id:lotId,site_item_inventory_id:positiveId(lot.site_item_inventory_id),lot_code:lot.current_lot_code||lot.lot_code_snapshot||'',allocation_method:lot.allocation_method||'',return_quantity:quantity,previous_quantity_remaining:previous,new_quantity_remaining:Number((previous+quantity).toFixed(6)),previous_lot_status:lot.current_lot_status||'available',stock_unit_label:lot.stock_unit_label||'unit'});
  }

  const status=String(run.run_status||'').toLowerCase();
  if(status==='reversed')blockers.push('This production run is already reversed. A production run can only be reversed once.');
  else if(status!=='posted')blockers.push(`Only posted production runs can be reversed; this run is ${status||'unknown'}.`);
  const outputQuantity=Math.max(0,Math.floor(number(run.output_quantity,0)));const productInventoryBefore=Math.max(0,number(run.product_inventory_quantity,0));
  if(!(outputQuantity>0))blockers.push('The production run has no positive finished quantity to reverse.');

  let finishedGuard=null;if(schema.ok)finishedGuard=await loadFinishedLotGuard(db,runId);
  if(finishedGuard){
    if(String(finishedGuard.lot_status||'').toLowerCase()!=='available')blockers.push(`The finished inventory lot is ${finishedGuard.lot_status||'not available'} and cannot be reversed.`);
    if(Math.abs(number(finishedGuard.quantity_created,0)-outputQuantity)>EPSILON)blockers.push('Finished-lot quantity no longer matches the immutable production output quantity. Reversal is blocked for review.');
    if(number(finishedGuard.attributed_committed_quantity,0)>EPSILON)blockers.push(`${finishedGuard.attributed_committed_quantity} unit(s) from this production lot are attributed to downstream pending/paid/fulfilled orders. Reverse or release those downstream commitments first.`);
  }else if(productInventoryBefore+EPSILON<outputQuantity){blockers.push(`Only ${productInventoryBefore} finished unit(s) are currently on hand, but this legacy run produced ${outputQuantity}. Reversal is blocked because pre-cutover lot provenance is unavailable.`);}
  if(productInventoryBefore+EPSILON<outputQuantity)blockers.push(`Current finished inventory (${productInventoryBefore}) is below this run output (${outputQuantity}).`);

  return {build:BUILD,run,materials,return_plan:returnPlan,lot_return_plan:lotReturnPlan,blockers,eligible:blockers.length?0:1,product_inventory_before:productInventoryBefore,product_inventory_after:Math.max(0,productInventoryBefore-outputQuantity),output_quantity:outputQuantity,
    downstream_guard:finishedGuard?{mode:'finished_lot_fifo_commitment_attribution',lot_sale_provenance_available:true,finished_lot:finishedGuard,explanation:'Post-cutover pending/paid/fulfilled orders are attributed FIFO across the legacy opening balance and finished-production lots. This run can reverse only while its own lot has zero attributed downstream commitment.'}:{mode:'legacy_finished_stock_quantity_fail_closed',lot_sale_provenance_available:false,explanation:'This run predates the Build 440 finished-lot cutover. Historical provenance is not fabricated; reversal retains the conservative aggregate-stock guard.'},
    raw_lot_provenance:{schema_ready:schema.ok?1:0,allocation_rows:lotReturnPlan.length,legacy_run_without_allocations:materials.some((row)=>number(row.stock_quantity_consumed,0)>EPSILON)&&lotReturnPlan.length===0?1:0}};
}

async function compensateFailedReversal(db,{run,preview,batchResult,indices,userId,reversedAt}){
  const statements=[];
  if(Number(batchResult?.[indices.product]?.meta?.changes||0)===1)statements.push(db.prepare(`UPDATE products SET inventory_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=? AND ABS(COALESCE(inventory_quantity,0)-?)<?`).bind(preview.product_inventory_before,run.product_id,preview.product_inventory_after,EPSILON));
  for(const item of indices.inventory){if(Number(batchResult?.[item.statement_index]?.meta?.changes||0)!==1)continue;statements.push(db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<?`).bind(item.previous,item.inventoryId,item.next,EPSILON));statements.push(db.prepare(`INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,note,actor_user_id,created_at) SELECT site_item_inventory_id,source_type,external_key,item_name,'correction',?,on_hand_quantity-?,on_hand_quantity,?,?,CURRENT_TIMESTAMP FROM site_item_inventory WHERE site_item_inventory_id=?`).bind(-item.returnQuantity,item.returnQuantity,`Automatic compensation for failed production reversal ${run.run_key}`,userId||null,item.inventoryId));}
  for(const lot of indices.lots){if(Number(batchResult?.[lot.statement_index]?.meta?.changes||0)!==1)continue;statements.push(db.prepare(`UPDATE inventory_purchase_lots SET quantity_remaining=?,lot_status=?,updated_at=CURRENT_TIMESTAMP WHERE inventory_purchase_lot_id=? AND ABS(COALESCE(quantity_remaining,0)-?)<?`).bind(lot.previous,lot.previousStatus,lot.lotId,lot.next,EPSILON));}
  if(indices.finishedLot>=0&&Number(batchResult?.[indices.finishedLot]?.meta?.changes||0)===1)statements.push(db.prepare(`UPDATE product_finished_inventory_lots SET lot_status='available',updated_at=CURRENT_TIMESTAMP WHERE product_production_run_id=? AND lot_status='reversed'`).bind(run.product_production_run_id));
  statements.push(db.prepare(`UPDATE product_production_runs SET run_status='posted',reversed_by_user_id=NULL,reversed_at=NULL,reversal_reason=NULL,updated_at=CURRENT_TIMESTAMP WHERE product_production_run_id=? AND run_status='reversed' AND reversed_at=? AND reversed_by_user_id=?`).bind(run.product_production_run_id,reversedAt,userId));
  if(statements.length)await db.batch(statements);
}

async function reverseRun(db,preview,reason,userId){
  const run=preview.run;const runId=positiveId(run.product_production_run_id);const reversedAt=new Date().toISOString();const statements=[];const indices={claim:0,product:0,inventory:[],lots:[],finishedLot:-1};
  indices.claim=statements.length;statements.push(db.prepare(`UPDATE product_production_runs SET run_status='reversed',reversed_by_user_id=?,reversed_at=?,reversal_reason=?,updated_at=CURRENT_TIMESTAMP WHERE product_production_run_id=? AND run_status='posted'`).bind(userId,reversedAt,reason,runId));
  indices.product=statements.length;statements.push(db.prepare(`UPDATE products SET inventory_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=? AND ABS(COALESCE(inventory_quantity,0)-?)<? AND COALESCE(inventory_quantity,0)>=? AND EXISTS(SELECT 1 FROM product_production_runs r WHERE r.product_production_run_id=? AND r.run_status='reversed' AND r.reversed_at=? AND r.reversed_by_user_id=?)`).bind(preview.product_inventory_after,run.product_id,preview.product_inventory_before,EPSILON,preview.output_quantity,runId,reversedAt,userId));
  for(const plan of preview.return_plan){const previous=number(plan.previous_on_hand_quantity,0),next=number(plan.new_on_hand_quantity,previous),returnQuantity=Math.max(0,number(plan.return_stock_quantity,0)),inventoryId=positiveId(plan.site_item_inventory_id);const statementIndex=statements.length;statements.push(db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,last_seen_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<? AND EXISTS(SELECT 1 FROM product_production_runs r WHERE r.product_production_run_id=? AND r.run_status='reversed' AND r.reversed_at=? AND r.reversed_by_user_id=?)`).bind(next,inventoryId,previous,EPSILON,runId,reversedAt,userId));indices.inventory.push({statement_index:statementIndex,inventoryId,previous,next,returnQuantity});statements.push(db.prepare(`INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at) SELECT site_item_inventory_id,source_type,external_key,item_name,'correction',?,?,?,COALESCE(reserved_quantity,0),COALESCE(reserved_quantity,0),COALESCE(incoming_quantity,0),COALESCE(incoming_quantity,0),?,?,CURRENT_TIMESTAMP FROM site_item_inventory WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<?`).bind(returnQuantity,previous,next,`Reversal of finished production run ${run.run_key}. Reason: ${reason}`.slice(0,500),userId||null,inventoryId,next,EPSILON));}
  for(const lot of preview.lot_return_plan||[]){const statementIndex=statements.length;statements.push(db.prepare(`UPDATE inventory_purchase_lots SET quantity_remaining=?,lot_status='available',updated_at=CURRENT_TIMESTAMP WHERE inventory_purchase_lot_id=? AND site_item_inventory_id=? AND ABS(COALESCE(quantity_remaining,0)-?)<?`).bind(lot.new_quantity_remaining,lot.inventory_purchase_lot_id,lot.site_item_inventory_id,lot.previous_quantity_remaining,EPSILON));indices.lots.push({statement_index:statementIndex,lotId:lot.inventory_purchase_lot_id,previous:lot.previous_quantity_remaining,next:lot.new_quantity_remaining,previousStatus:lot.previous_lot_status||'available'});}
  if(preview.downstream_guard?.lot_sale_provenance_available){indices.finishedLot=statements.length;statements.push(db.prepare(`UPDATE product_finished_inventory_lots SET lot_status='reversed',updated_at=CURRENT_TIMESTAMP WHERE product_production_run_id=? AND lot_status='available' AND NOT EXISTS(SELECT 1 FROM product_finished_lot_commitment_attribution a WHERE a.product_production_run_id=? AND a.attributed_committed_quantity>?)`).bind(runId,runId,EPSILON));}
  let batchResult;try{batchResult=await db.batch(statements);}catch(error){throw fail('The finished-production reversal transaction failed before it could be verified.',{status:500,code:'product_production_reversal_transaction_failed',details:String(error?.message||error)});}
  const claimChanged=Number(batchResult?.[indices.claim]?.meta?.changes||0)===1;const productChanged=Number(batchResult?.[indices.product]?.meta?.changes||0)===1;const failedInventory=indices.inventory.filter((item)=>Number(batchResult?.[item.statement_index]?.meta?.changes||0)!==1);const failedLots=indices.lots.filter((item)=>Number(batchResult?.[item.statement_index]?.meta?.changes||0)!==1);const finishedFailed=indices.finishedLot>=0&&Number(batchResult?.[indices.finishedLot]?.meta?.changes||0)!==1;
  if(!claimChanged||!productChanged||failedInventory.length||failedLots.length||finishedFailed){await compensateFailedReversal(db,{run,preview,batchResult,indices,userId,reversedAt}).catch(()=>null);throw fail(claimChanged?'Inventory, purchase-lot, or downstream commitment state changed while reversal was posting. Any partial reversal was compensated; refresh and review again.':'This production run is no longer available to reverse. Refresh the production history.',{status:409,code:claimChanged?'product_production_reversal_concurrent_lot_change':'product_production_reversal_already_claimed'});}
  return {run:await loadRun(db,runId),returned_materials:preview.return_plan,returned_purchase_lots:preview.lot_return_plan||[],finished_lot_reversed:indices.finishedLot>=0?1:0};
}

async function loadHistory(db,productId){if(!positiveId(productId))return[];const result=await db.prepare(`SELECT product_production_run_id,run_key,product_id,output_quantity,output_unit_label,run_status,notes,posted_by_user_id,posted_at,reversed_by_user_id,reversed_at,reversal_reason FROM product_production_runs WHERE product_id=? ORDER BY product_production_run_id DESC LIMIT 30`).bind(productId).all();return rows(result);}

export async function onRequestGet(context){const db=getDb(context.env);if(!db)return json({ok:false,build:BUILD,error:'Database binding is not configured.'},500);const user=await getAdminUserFromRequest(context.request,context.env);if(!user)return json({ok:false,build:BUILD,error:'Unauthorized.'},401);try{const url=new URL(context.request.url);const runId=positiveId(url.searchParams.get('product_production_run_id'));const productId=positiveId(url.searchParams.get('product_id'));if(runId){const preview=await buildPreview(db,runId);return json({ok:true,build:BUILD,preview,history:await loadHistory(db,preview.run.product_id)});}if(productId)return json({ok:true,build:BUILD,history:await loadHistory(db,productId)});return json({ok:false,build:BUILD,error:'product_id or product_production_run_id is required.'},400);}catch(error){return json({ok:false,build:BUILD,error:error?.message||'Production reversal preview failed.',code:error?.code||''},Number(error?.status||500));}}

export async function onRequestPost(context){const db=getDb(context.env);if(!db)return json({ok:false,build:BUILD,error:'Database binding is not configured.'},500);const user=await getAdminUserFromRequest(context.request,context.env);if(!user)return json({ok:false,build:BUILD,error:'Unauthorized.'},401);let body={};try{body=await context.request.json();}catch{return json({ok:false,build:BUILD,error:'Invalid JSON body.'},400);}try{const runId=positiveId(body.product_production_run_id);if(!runId)return json({ok:false,build:BUILD,error:'product_production_run_id is required.'},400);const reason=boundedText(body.reason,1000);if(reason.length<8)return json({ok:false,build:BUILD,error:'Enter a clear reversal reason of at least 8 characters.'},400);const preview=await buildPreview(db,runId);if(!preview.eligible)return json({ok:false,build:BUILD,error:'This production run is not eligible for reversal.',preview},409);const result=await reverseRun(db,preview,reason,Number(user.user_id||0)||null);await auditAdminAction(context.env,context.request,user,{action_type:'product_production_release_reverse',target_type:'product',target_id:Number(preview.run.product_id||0),target_key:preview.run.product_sku||preview.run.run_key||String(runId),details:{product_production_run_id:runId,run_key:preview.run.run_key,output_quantity:preview.output_quantity,returned_inventory_rows:preview.return_plan.length,returned_purchase_lots:(preview.lot_return_plan||[]).length,finished_lot_provenance:Number(preview.downstream_guard?.lot_sale_provenance_available||0),reason}});return json({ok:true,build:BUILD,message:`Finished-production run reversed. ${preview.output_quantity} finished unit(s) were removed and the exact recorded raw-material${preview.lot_return_plan?.length?' purchase-lot':''} quantities were returned.`,...result,preview:await buildPreview(db,runId).catch(()=>null)});}catch(error){await captureRuntimeIncident(context.env,context.request,{incident_scope:'product_production_reversal',incident_code:error?.code||'product_production_reversal_failed',severity:Number(error?.status||500)>=500?'error':'warning',message:error?.message||'Production reversal failed.',related_user_id:Number(user.user_id||0)||null,details:{error:String(error?.stack||error)}}).catch(()=>null);return json({ok:false,build:BUILD,error:error?.message||'Production reversal failed safely.',code:error?.code||''},Number(error?.status||500));}}
