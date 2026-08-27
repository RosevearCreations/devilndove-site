// Devil n Dove Build 440 — reviewed, lot-aware finished-product production release.
// Product/resource links define expected materials. Purchase lots define raw-material provenance/cost.
// Posting snapshots exact lot allocations, deducts only reviewed consumables, and creates one finished
// inventory lot for every new production run. No request-time schema repair or automatic write retry.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { EPSILON, loadMaterialLotPlan, productLotSchemaReadiness } from '../_lib/productLotProvenance.js';

function json(data,status=200){return jsonResponse(data,status,{'Cache-Control':'no-store'});}
function num(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}
function integer(value){const n=Number(value);return Number.isInteger(n)&&n>0?n:0;}
function text(value,max=1000){return normalizeText(value).slice(0,max);}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function fail(message,status=400,code='product_production_release_invalid'){const e=new Error(message);e.status=status;e.code=code;return e;}

async function loadPreview(db,productId,outputQuantity=1){
  const product=await db.prepare(`SELECT product_id,name,sku,status,inventory_tracking,inventory_quantity,product_category FROM products WHERE product_id=? LIMIT 1`).bind(productId).first();
  if(!product) throw fail('Product not found.',404,'product_not_found');
  const qty=Math.max(1,Math.floor(num(outputQuantity,1)));
  const schema=await productLotSchemaReadiness(db);
  const result=await db.prepare(`
    SELECT prl.product_resource_link_id,prl.resource_kind,prl.source_key,prl.quantity_used,
           COALESCE(prl.consumption_mode,'per_unit') consumption_mode,
           COALESCE(prl.lot_size_units,1) lot_size_units,COALESCE(prl.usage_notes,'') usage_notes,
           sii.site_item_inventory_id,sii.item_name,COALESCE(sii.on_hand_quantity,0) on_hand_quantity,
           COALESCE(sii.stock_unit_label,'unit') stock_unit_label,
           COALESCE(sii.usage_unit_label,'unit') usage_unit_label,
           COALESCE(sii.usage_units_per_stock_unit,1) usage_units_per_stock_unit,
           COALESCE(sii.unit_cost_cents,0) unit_cost_cents,
           COALESCE(siup.usage_tracking_mode,CASE WHEN prl.resource_kind='tool' THEN 'reusable' ELSE 'exact' END) tracking_mode,
           COALESCE(prip.is_label_ingredient,0) is_label_ingredient,
           COALESCE(prip.ingredient_name_en,'') ingredient_name_en,
           COALESCE(prip.ingredient_name_fr,'') ingredient_name_fr,
           COALESCE(prip.inci_name,'') inci_name
    FROM product_resource_links prl
    LEFT JOIN site_item_inventory sii
      ON LOWER(TRIM(COALESCE(sii.source_type,'')))=LOWER(TRIM(prl.resource_kind))
     AND sii.external_key=prl.source_key
     AND COALESCE(sii.is_active,1)=1
    LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id
    LEFT JOIN product_resource_ingredient_profiles prip ON prip.product_resource_link_id=prl.product_resource_link_id
    WHERE prl.product_id=?
    ORDER BY prl.sort_order,prl.product_resource_link_id
  `).bind(productId).all();

  const materials=[];
  const blockers=[];
  if(!schema.ok){
    blockers.push(`Build 440 lot-provenance schema is not ready (${schema.missing_tables.join(', ')}). Apply the migration before posting production.`);
  }

  for(const row of rows(result)){
    const kind=String(row.resource_kind||'').toLowerCase();
    const mode=String(row.consumption_mode||'per_unit').toLowerCase();
    const tracking=String(row.tracking_mode|| (kind==='tool'?'reusable':'exact')).toLowerCase();
    const perStock=Math.max(EPSILON,num(row.usage_units_per_stock_unit,1));
    const baseUsage=Math.max(0,num(row.quantity_used,0));
    const lotSize=Math.max(1,num(row.lot_size_units,1));
    const usageQuantity=mode==='end_of_lot' ? baseUsage*(qty/lotSize) : baseUsage*qty;
    const consumes=kind==='supply' && mode!=='story_only' && ['exact','estimated'].includes(tracking);
    const stockQuantity=consumes ? usageQuantity/perStock : 0;
    const available=Math.max(0,num(row.on_hand_quantity,0));
    const missingInventory=kind==='supply' && mode!=='story_only' && !integer(row.site_item_inventory_id);
    const insufficient=consumes && stockQuantity>available+EPSILON;
    let lotPlan={ready:1,method:'none',candidates:[],allocations:[],estimated_cost_cents:0,blockers:[]};
    if(consumes && integer(row.site_item_inventory_id) && schema.ok){
      lotPlan=await loadMaterialLotPlan(db,row.site_item_inventory_id,stockQuantity);
    }
    const estimatedCost=consumes && schema.ok
      ? Number(lotPlan.estimated_cost_cents||0)
      : Math.max(0,Math.round(num(row.unit_cost_cents,0)*stockQuantity));
    const material={
      ...row,
      resource_kind:kind,consumption_mode:mode,tracking_mode:tracking,
      output_quantity:qty,usage_quantity:Number(usageQuantity.toFixed(6)),
      stock_quantity_consumed:Number(stockQuantity.toFixed(6)),
      available_stock_quantity:available,
      estimated_material_cost_cents:estimatedCost,
      missing_inventory:missingInventory?1:0,insufficient_stock:insufficient?1:0,
      ingredient_name_en:row.ingredient_name_en||row.item_name||row.source_key||'',
      ingredient_name_fr:row.ingredient_name_fr||'',inci_name:row.inci_name||'',
      lot_policy:lotPlan.method||'none',lot_candidates:lotPlan.candidates||[],lot_allocations:lotPlan.allocations||[],
      lot_reconcile_status:lotPlan.reconcile_status||'',lot_ready:Number(lotPlan.ready||0),
    };
    materials.push(material);
    if(material.missing_inventory) blockers.push(`${material.item_name||material.source_key}: no active inventory record is linked.`);
    if(material.insufficient_stock) blockers.push(`${material.item_name||material.source_key}: requires ${material.stock_quantity_consumed} ${material.stock_unit_label}, but only ${material.available_stock_quantity} is on hand.`);
    if(consumes && schema.ok && !material.lot_ready){
      for(const message of lotPlan.blockers||[]) blockers.push(`${material.item_name||material.source_key}: ${message}`);
    }
    if(Number(material.is_label_ingredient||0)===1 && !String(material.inci_name||'').trim()) blockers.push(`${material.item_name||material.source_key}: marked as a cosmetic label ingredient but INCI is blank.`);
  }

  const ingredients=materials.filter((row)=>Number(row.is_label_ingredient||0)===1).map((row)=>({
    product_resource_link_id:row.product_resource_link_id,
    inci_name:row.inci_name||'',ingredient_name_en:row.ingredient_name_en||row.item_name||'',ingredient_name_fr:row.ingredient_name_fr||'',
    usage_quantity:row.usage_quantity,usage_unit_label:row.usage_unit_label
  }));
  return {
    product,output_quantity:qty,materials,ingredients,blockers,ready:blockers.length?0:1,
    lot_provenance:{schema_ready:schema.ok?1:0,missing_tables:schema.missing_tables,mode:'purchase_lot_policy_fifo_fefo_forward_provenance'},
    estimated_material_cost_cents:materials.reduce((sum,row)=>sum+Number(row.estimated_material_cost_cents||0),0)
  };
}

async function compensatePost(db,{runKey,productId,outputQuantity,siteUpdates,lotUpdates,batchResult,productStatementIndex}){
  const statements=[];
  for(const item of siteUpdates){
    if(Number(batchResult?.[item.statement_index]?.meta?.changes||0)!==1) continue;
    statements.push(db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<?`).bind(item.previous,item.inventory_id,item.next,EPSILON));
    statements.push(db.prepare(`INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,note,actor_user_id,created_at)
      SELECT site_item_inventory_id,source_type,external_key,item_name,'correction',?,on_hand_quantity-?,on_hand_quantity,?,NULL,CURRENT_TIMESTAMP FROM site_item_inventory WHERE site_item_inventory_id=?`).bind(item.consume,item.consume,`Automatic compensation for conflicted production run ${runKey}`,item.inventory_id));
  }
  for(const lot of lotUpdates){
    if(Number(batchResult?.[lot.statement_index]?.meta?.changes||0)!==1) continue;
    statements.push(db.prepare(`UPDATE inventory_purchase_lots SET quantity_remaining=?,lot_status='available',updated_at=CURRENT_TIMESTAMP WHERE inventory_purchase_lot_id=? AND ABS(COALESCE(quantity_remaining,0)-?)<?`).bind(lot.previous,lot.lot_id,lot.next,EPSILON));
  }
  if(Number(batchResult?.[productStatementIndex]?.meta?.changes||0)===1){
    statements.push(db.prepare(`UPDATE products SET inventory_quantity=MAX(0,COALESCE(inventory_quantity,0)-?),updated_at=CURRENT_TIMESTAMP WHERE product_id=?`).bind(outputQuantity,productId));
  }
  statements.push(db.prepare(`DELETE FROM product_production_runs WHERE run_key=?`).bind(runKey));
  if(statements.length) await db.batch(statements);
}

async function postRun(db,preview,body,userId){
  const productId=Number(preview.product.product_id);
  const idempotency=text(body.idempotency_key,120)||crypto.randomUUID();
  const runKey=`product-${productId}-${idempotency}`;
  const existing=await db.prepare(`SELECT * FROM product_production_runs WHERE run_key=? LIMIT 1`).bind(runKey).first();
  if(existing) return {run:existing,idempotent_replay:true};
  const schema=await productLotSchemaReadiness(db);
  if(!schema.ok) throw fail(`Build 440 lot-provenance schema is not ready (${schema.missing_tables.join(', ')}).`,503,'product_lot_schema_not_ready');

  const materialSnapshot=preview.materials.map((row)=>({
    product_resource_link_id:row.product_resource_link_id,site_item_inventory_id:row.site_item_inventory_id||null,
    resource_kind:row.resource_kind,source_key:row.source_key,item_name:row.item_name||row.source_key,
    consumption_mode:row.consumption_mode,tracking_mode:row.tracking_mode,usage_quantity:row.usage_quantity,
    usage_unit_label:row.usage_unit_label,stock_quantity_consumed:row.stock_quantity_consumed,stock_unit_label:row.stock_unit_label,
    unit_cost_cents:row.unit_cost_cents,estimated_material_cost_cents:row.estimated_material_cost_cents,
    lot_policy:row.lot_policy,lot_allocations:row.lot_allocations||[],is_label_ingredient:Number(row.is_label_ingredient||0),
    ingredient_name_en:row.ingredient_name_en||'',ingredient_name_fr:row.ingredient_name_fr||'',inci_name:row.inci_name||''
  }));

  const statements=[];const siteUpdates=[];const lotUpdates=[];
  statements.push(db.prepare(`INSERT INTO product_production_runs(run_key,product_id,output_quantity,output_unit_label,run_status,material_snapshot_json,ingredient_snapshot_json,notes,posted_by_user_id,posted_at,created_at,updated_at)
    VALUES(?,?,?,'unit','posted',?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(runKey,productId,preview.output_quantity,JSON.stringify(materialSnapshot),JSON.stringify(preview.ingredients),text(body.notes,2000)||null,userId||null));

  for(const row of preview.materials){
    const consume=Math.max(0,num(row.stock_quantity_consumed,0));
    const inventoryId=integer(row.site_item_inventory_id);
    if(consume>EPSILON && inventoryId){
      const previous=num(row.on_hand_quantity,0);const next=Number((previous-consume).toFixed(6));
      const statementIndex=statements.length;
      statements.push(db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,last_seen_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<? AND COALESCE(on_hand_quantity,0)>=?`).bind(next,inventoryId,previous,EPSILON,consume));
      siteUpdates.push({statement_index:statementIndex,inventory_id:inventoryId,previous,next,consume});
      statements.push(db.prepare(`INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at)
        SELECT site_item_inventory_id,source_type,external_key,item_name,'consume',?,?,?,COALESCE(reserved_quantity,0),COALESCE(reserved_quantity,0),COALESCE(incoming_quantity,0),COALESCE(incoming_quantity,0),?,?,CURRENT_TIMESTAMP FROM site_item_inventory WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<?`).bind(-consume,previous,next,`Finished product production run ${runKey}`,userId||null,inventoryId,next,EPSILON));
      for(const allocation of row.lot_allocations||[]){
        const lotId=integer(allocation.inventory_purchase_lot_id);const lotPrevious=Math.max(0,num(allocation.quantity_remaining,0));const lotConsume=Math.max(0,num(allocation.quantity_consumed,0));const lotNext=Number((lotPrevious-lotConsume).toFixed(6));
        const lotStatementIndex=statements.length;
        statements.push(db.prepare(`UPDATE inventory_purchase_lots SET quantity_remaining=?,lot_status=CASE WHEN ?<=? THEN 'consumed' ELSE 'available' END,updated_at=CURRENT_TIMESTAMP WHERE inventory_purchase_lot_id=? AND site_item_inventory_id=? AND lot_status='available' AND ABS(COALESCE(quantity_remaining,0)-?)<? AND COALESCE(quantity_remaining,0)>=?`).bind(lotNext,lotNext,EPSILON,lotId,inventoryId,lotPrevious,EPSILON,lotConsume));
        lotUpdates.push({statement_index:lotStatementIndex,lot_id:lotId,previous:lotPrevious,next:lotNext,consume:lotConsume});
      }
    }

    statements.push(db.prepare(`INSERT INTO product_production_run_materials(product_production_run_id,product_resource_link_id,site_item_inventory_id,resource_kind,source_key,item_name,consumption_mode,tracking_mode,usage_quantity,usage_unit_label,stock_quantity_consumed,stock_unit_label,unit_cost_cents,is_label_ingredient,ingredient_name_en,ingredient_name_fr,inci_name,created_at)
      SELECT product_production_run_id,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP FROM product_production_runs WHERE run_key=?`).bind(Number(row.product_resource_link_id||0)||null,inventoryId||null,row.resource_kind,row.source_key||null,row.item_name||row.source_key||'Resource',row.consumption_mode,row.tracking_mode,row.usage_quantity,row.usage_unit_label||'unit',row.stock_quantity_consumed,row.stock_unit_label||'unit',Math.max(0,Math.round(num(row.unit_cost_cents,0))),Number(row.is_label_ingredient||0)===1?1:0,row.ingredient_name_en||null,row.ingredient_name_fr||null,row.inci_name||null,runKey));

    for(const allocation of row.lot_allocations||[]){
      statements.push(db.prepare(`INSERT INTO product_production_run_material_lots(product_production_run_material_id,product_production_run_id,inventory_purchase_lot_id,site_item_inventory_id,allocation_sequence,allocation_method,lot_code_snapshot,quantity_consumed,stock_unit_label,unit_cost_cents,landed_unit_cost_cents,extended_cost_cents,supplier_name_snapshot,supplier_sku_snapshot,source_url_snapshot,purchase_date_snapshot,received_date_snapshot,expiry_date_snapshot,created_at)
        SELECT prm.product_production_run_material_id,prm.product_production_run_id,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP
        FROM product_production_run_materials prm INNER JOIN product_production_runs r ON r.product_production_run_id=prm.product_production_run_id
        WHERE r.run_key=? AND prm.product_resource_link_id=? LIMIT 1`).bind(
          integer(allocation.inventory_purchase_lot_id),inventoryId,Number(allocation.allocation_sequence||0),allocation.allocation_method||row.lot_policy||'fifo',allocation.lot_code||'',Math.max(0,num(allocation.quantity_consumed,0)),row.stock_unit_label||'unit',Math.max(0,Math.round(num(allocation.unit_cost_cents,0))),Math.max(0,num(allocation.landed_unit_cost_cents,0)),Math.max(0,Math.round(num(allocation.extended_cost_cents,0))),allocation.supplier_name||null,allocation.supplier_sku||null,allocation.source_url||null,allocation.purchase_date||null,allocation.received_date||null,allocation.expiry_date||null,runKey,Number(row.product_resource_link_id||0)||null
        ));
    }
  }

  const finishedLotIndex=statements.length;
  statements.push(db.prepare(`INSERT INTO product_finished_inventory_lots(lot_key,product_id,product_production_run_id,source_kind,quantity_created,unit_material_cost_cents,lot_status,notes,created_at,updated_at)
    SELECT 'PRODUCTION-'||run_key,product_id,product_production_run_id,'production_run',output_quantity,?,'available',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM product_production_runs WHERE run_key=?`).bind(Math.max(0,Math.round(num(preview.estimated_material_cost_cents,0)/Math.max(1,preview.output_quantity))),`Finished inventory lot created from ${runKey}`,runKey));
  const productStatementIndex=statements.length;
  statements.push(db.prepare(`UPDATE products SET inventory_quantity=COALESCE(inventory_quantity,0)+?,updated_at=CURRENT_TIMESTAMP WHERE product_id=?`).bind(preview.output_quantity,productId));

  const results=await db.batch(statements);
  const failedSite=siteUpdates.filter((item)=>Number(results?.[item.statement_index]?.meta?.changes||0)!==1);
  const failedLots=lotUpdates.filter((item)=>Number(results?.[item.statement_index]?.meta?.changes||0)!==1);
  const finishedCreated=Number(results?.[finishedLotIndex]?.meta?.changes||0)===1;
  const productChanged=Number(results?.[productStatementIndex]?.meta?.changes||0)===1;
  if(failedSite.length||failedLots.length||!finishedCreated||!productChanged){
    await compensatePost(db,{runKey,productId,outputQuantity:preview.output_quantity,siteUpdates,lotUpdates,batchResult:results,productStatementIndex}).catch(()=>null);
    throw fail('Inventory or purchase-lot state changed while production was posting. Any partial deductions were compensated; reload the preview and post again.',409,'product_production_concurrent_lot_change');
  }
  return {run:await db.prepare(`SELECT * FROM product_production_runs WHERE run_key=?`).bind(runKey).first(),idempotent_replay:false};
}

export async function onRequestGet(context){
  const db=getDb(context.env);const user=await getAdminUserFromRequest(context.request,context.env);
  if(!user)return json({ok:false,error:'Unauthorized.'},401);
  try{
    const url=new URL(context.request.url);const productId=integer(url.searchParams.get('product_id'));
    if(!productId)return json({ok:false,error:'product_id is required.'},400);
    const qty=Math.max(1,Math.floor(num(url.searchParams.get('output_quantity'),1)));
    const preview=await loadPreview(db,productId,qty);
    const history=rows(await db.prepare(`SELECT product_production_run_id,run_key,output_quantity,run_status,posted_at,reversed_at,notes FROM product_production_runs WHERE product_id=? ORDER BY product_production_run_id DESC LIMIT 20`).bind(productId).all().catch(()=>({results:[]})));
    return json({ok:true,build:440,preview,history});
  }catch(error){return json({ok:false,error:error?.message||'Production preview failed.',code:error?.code||''},Number(error?.status||500));}
}

export async function onRequestPost(context){
  const db=getDb(context.env);const user=await getAdminUserFromRequest(context.request,context.env);
  if(!user)return json({ok:false,error:'Unauthorized.'},401);
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  try{
    const productId=integer(body.product_id);if(!productId)return json({ok:false,error:'product_id is required.'},400);
    const action=text(body.action,40)||'post';if(action!=='post')return json({ok:false,error:'Unsupported production action.'},400);
    const preview=await loadPreview(db,productId,body.output_quantity);
    if(!preview.ready)return json({ok:false,error:'Production release is blocked until the material/ingredient/lot review is corrected.',preview},409);
    const result=await postRun(db,preview,body,Number(user.user_id||0)||null);
    await auditAdminAction(context.env,context.request,user,{action_type:'product_production_release_post',target_type:'product',target_id:productId,target_key:preview.product.sku||String(productId),details:{run_key:result.run?.run_key,output_quantity:preview.output_quantity,material_count:preview.materials.length,ingredient_count:preview.ingredients.length,lot_allocation_count:preview.materials.reduce((sum,row)=>sum+(row.lot_allocations||[]).length,0),estimated_material_cost_cents:preview.estimated_material_cost_cents,idempotent_replay:result.idempotent_replay}});
    return json({ok:true,build:440,message:result.idempotent_replay?'This production release was already posted; no inventory was deducted twice.':`Finished production posted. ${preview.output_quantity} finished unit(s) were added with purchase-lot provenance and a finished inventory lot.`,run:result.run,preview});
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'product_production_release',incident_code:error?.code||'product_production_post_failed',severity:'error',message:error?.message||'Production release failed.',related_user_id:Number(user.user_id||0)||null,details:{error:String(error?.stack||error)}}).catch(()=>null);
    return json({ok:false,error:error?.message||'Production release failed safely.',code:error?.code||''},Number(error?.status||500));
  }
}
