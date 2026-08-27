// Devil n Dove Build 440 — purchased-kit opening and component-use authority.
// Reuses Build 249 kit tables + Build 244 usage ledgers + Build 440 purchase-lot provenance.
// Stock-changing actions are one D1 batch. No request-time DDL, polling, retry, R2 or provider work.
import { normalizeText } from './adminAudit.js';
import { EPSILON, loadMaterialLotPlan } from './productLotProvenance.js';

const MODES = new Set(['exact','estimated','log_only','reusable']);
const CLASSES = new Set(['raw_material','consumable','packaging','reusable_equipment','kit','component','finished_good','sample','waste','other']);

function rows(result){ return Array.isArray(result?.results) ? result.results : []; }
function num(value,fallback=0){ const n=Number(value); return Number.isFinite(n)?n:fallback; }
function id(value){ const n=Number(value||0); return Number.isInteger(n)&&n>0?n:0; }
function text(value,max=500){ return normalizeText(value).slice(0,max); }
function round6(value){ return Number(num(value).toFixed(6)); }
function slug(value){ return text(value,120).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||'component'; }
function codedError(code,message,status=400,details={}){ const error=new Error(message); error.code=code; error.status=status; error.details=details; return error; }
function guard(db,sql,bindings=[]){ return db.prepare(`SELECT CASE WHEN (${sql}) THEN 1 ELSE abs(-9223372036854775808) END AS build440_guard`).bind(...bindings); }

export function planKitComponentUsage(row={},requestedUsage=0){
  const quantity=Math.max(0,num(requestedUsage));
  if(quantity<=EPSILON) throw codedError('inventory_kit_component_quantity_required','Enter a usage quantity greater than zero.');
  const sourceType=text(row.source_type,30).toLowerCase();
  if(sourceType==='product') throw codedError('inventory_kit_component_wrong_owner','Product stock cannot be depleted from the Kit workspace. Use Product/Creative production authority.',409);
  const modeRaw=text(row.usage_tracking_mode || row.template_usage_tracking_mode,30).toLowerCase();
  const mode=sourceType==='tool'?'reusable':(MODES.has(modeRaw)?modeRaw:'exact');
  if(sourceType==='tool' && Number(row.do_not_reuse||0)===1) throw codedError('inventory_kit_component_do_not_reuse','This Tool is marked do not reuse. Reactivate it through Tool lifecycle controls before recording another use.',409);
  const minimum=Math.max(0.0001,num(row.minimum_usage_increment,0.001)||0.001);
  if(quantity+EPSILON<minimum) throw codedError('inventory_kit_component_below_minimum_increment',`Usage must be at least ${minimum} ${text(row.usage_unit_label,40)||'unit'}.`);
  const perStock=Math.max(0.001,num(row.usage_units_per_stock_unit,1)||1);
  const previous=Math.max(0,num(row.on_hand_quantity));
  const reserved=Math.max(0,num(row.reserved_quantity));
  const available=Math.max(0,previous-reserved);
  const stockQuantity=['exact','estimated'].includes(mode)?round6(quantity/perStock):0;
  if(stockQuantity>available+EPSILON) throw codedError('inventory_kit_component_insufficient_available',`Only ${available.toFixed(6)} ${text(row.stock_unit_label,40)||'unit'} is available after reservations; ${stockQuantity.toFixed(6)} is required.`,409,{available_quantity:available,required_stock_quantity:stockQuantity});
  return {
    quantity,
    source_type:sourceType,
    tracking_mode:mode,
    is_estimated:mode==='estimated'?1:0,
    usage_unit_label:text(row.usage_unit_label,40).toLowerCase()||'unit',
    stock_unit_label:text(row.stock_unit_label,40).toLowerCase()||'unit',
    usage_units_per_stock_unit:perStock,
    minimum_usage_increment:minimum,
    stock_quantity:stockQuantity,
    previous_on_hand_quantity:previous,
    new_on_hand_quantity:round6(previous-stockQuantity),
    reserved_quantity:reserved,
    available_quantity:available,
  };
}

async function ensureComponentItem(db,adminUser,kitTemplateId,component){
  let itemId=id(component.component_inventory_item_id);
  if(itemId){
    const existing=await db.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id=? LIMIT 1`).bind(itemId).first();
    if(existing){
      if(text(existing.source_type,20).toLowerCase()==='product') throw codedError('inventory_kit_component_wrong_owner','A purchased-kit component cannot link to Product stock. Link it to Supply/Tool Inventory instead.',409);
      return existing;
    }
  }
  const name=text(component.component_name,180);
  if(!name) throw codedError('inventory_kit_component_name_required','Every kit component needs a name.');
  const requestedSource=text(component.component_source_type,20).toLowerCase();
  if(requestedSource==='product') throw codedError('inventory_kit_component_wrong_owner','A purchased-kit component cannot create Product stock. Use Supply/Tool Inventory instead.',409);
  const sourceType=['tool','supply','other'].includes(requestedSource)?requestedSource:'supply';
  const key=`kit-${kitTemplateId}-${id(component.inventory_kit_template_component_id)}-${slug(name)}`;
  await db.prepare(`INSERT OR IGNORE INTO site_item_inventory(source_type,external_key,item_name,category,on_hand_quantity,unit_cost_cents,stock_unit_label,usage_unit_label,usage_units_per_stock_unit,supplier_sku,is_active,created_at,updated_at) VALUES (?,?,?,?,0,0,?,?,?,?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(sourceType,key,name,text(component.component_category,120).toLowerCase()||null,text(component.stock_unit_label,40).toLowerCase()||'unit',text(component.usage_unit_label,40).toLowerCase()||'unit',Math.max(0.001,num(component.usage_units_per_stock_unit,1)),text(component.supplier_sku,180)||null).run();
  const created=await db.prepare(`SELECT * FROM site_item_inventory WHERE source_type=? AND external_key=? LIMIT 1`).bind(sourceType,key).first();
  if(!created) throw codedError('inventory_kit_component_create_failed',`Could not create Inventory component ${name}.`,500);
  itemId=id(created.site_item_inventory_id);
  const inventoryClass=sourceType==='tool'?'reusable_equipment':(CLASSES.has(text(component.inventory_class,40))?text(component.inventory_class,40):'component');
  const modeRaw=text(component.usage_tracking_mode,30).toLowerCase();
  const mode=sourceType==='tool'?'reusable':(MODES.has(modeRaw)?modeRaw:'exact');
  const lifecycle=sourceType==='tool'||mode==='reusable'?'reusable':'consumable';
  await db.batch([
    db.prepare(`UPDATE inventory_kit_template_components SET component_inventory_item_id=?,updated_at=CURRENT_TIMESTAMP WHERE inventory_kit_template_component_id=?`).bind(itemId,id(component.inventory_kit_template_component_id)),
    db.prepare(`INSERT INTO inventory_item_profiles(site_item_inventory_id,inventory_class,lifecycle_mode,lot_tracking_recommended,source_material_recommended,notes,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,'Created from purchased-kit component.',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(site_item_inventory_id) DO UPDATE SET inventory_class=excluded.inventory_class,lifecycle_mode=excluded.lifecycle_mode,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(itemId,inventoryClass,lifecycle,sourceType==='supply'?1:0,sourceType==='supply'?1:0,adminUser.user_id),
    db.prepare(`INSERT INTO site_inventory_usage_profiles(site_item_inventory_id,usage_tracking_mode,minimum_usage_increment,notes,updated_by_user_id,created_at,updated_at) VALUES (?,?,0.001,'Created from purchased-kit component.',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(site_item_inventory_id) DO UPDATE SET usage_tracking_mode=excluded.usage_tracking_mode,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(itemId,mode,adminUser.user_id),
  ]);
  return await db.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id=? LIMIT 1`).bind(itemId).first();
}

function lotPolicyStatement(db,itemId,onHand,{createIfMissing=false}={}){
  const updateSql=`reconcile_status=CASE WHEN ABS(?-COALESCE((SELECT SUM(COALESCE(quantity_remaining,0)) FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_status<>'returned'),0))<? THEN 'reconciled' ELSE 'needs_review' END,last_reconciled_quantity=?,last_reconciled_at=CASE WHEN ABS(?-COALESCE((SELECT SUM(COALESCE(quantity_remaining,0)) FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_status<>'returned'),0))<? THEN CURRENT_TIMESTAMP ELSE last_reconciled_at END,updated_at=CURRENT_TIMESTAMP`;
  if(createIfMissing){
    return db.prepare(`INSERT INTO inventory_lot_policies(site_item_inventory_id,depletion_method,reconcile_status,last_reconciled_quantity,last_reconciled_at,updated_by_user_id,updated_at) VALUES (?,'fifo',CASE WHEN ABS(?-COALESCE((SELECT SUM(COALESCE(quantity_remaining,0)) FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_status<>'returned'),0))<? THEN 'reconciled' ELSE 'needs_review' END,?,CASE WHEN ABS(?-COALESCE((SELECT SUM(COALESCE(quantity_remaining,0)) FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_status<>'returned'),0))<? THEN CURRENT_TIMESTAMP ELSE NULL END,NULL,CURRENT_TIMESTAMP) ON CONFLICT(site_item_inventory_id) DO UPDATE SET ${updateSql}`).bind(itemId,onHand,itemId,EPSILON,onHand,onHand,itemId,EPSILON,onHand,itemId,EPSILON,onHand,onHand,itemId,EPSILON);
  }
  return db.prepare(`UPDATE inventory_lot_policies SET ${updateSql} WHERE site_item_inventory_id=?`).bind(onHand,itemId,EPSILON,onHand,onHand,itemId,EPSILON,itemId);
}

function lotDepletionStatements(db,allocations=[]){
  const statements=[];
  for(const allocation of allocations){
    const before=round6(allocation.quantity_remaining);
    const after=round6(allocation.quantity_remaining_after);
    statements.push(db.prepare(`UPDATE inventory_purchase_lots SET quantity_remaining=?,lot_status=CASE WHEN ?<=? THEN 'consumed' ELSE lot_status END,updated_at=CURRENT_TIMESTAMP WHERE inventory_purchase_lot_id=? AND ABS(quantity_remaining-?)<? AND lot_status='available'`).bind(after,after,EPSILON,id(allocation.inventory_purchase_lot_id),before,EPSILON));
    statements.push(guard(db,`EXISTS(SELECT 1 FROM inventory_purchase_lots WHERE inventory_purchase_lot_id=? AND ABS(quantity_remaining-?)<? AND lot_status=?)`,[id(allocation.inventory_purchase_lot_id),after,EPSILON,after<=EPSILON?'consumed':'available']));
  }
  return statements;
}

export async function openInventoryKit(db,adminUser,{inventory_kit_template_id,kit_quantity_opened=1,source_lot_code='',note=''}={}){
  const templateId=id(inventory_kit_template_id);
  const quantity=Math.max(EPSILON,num(kit_quantity_opened,1));
  if(!templateId) throw codedError('inventory_kit_template_required','Choose a kit template.');
  const template=await db.prepare(`SELECT t.*,s.item_name,s.source_type,s.external_key,s.on_hand_quantity,s.reserved_quantity,s.incoming_quantity,s.unit_cost_cents,s.stock_unit_label,s.supplier_name,s.supplier_sku,s.source_url FROM inventory_kit_templates t JOIN site_item_inventory s ON s.site_item_inventory_id=t.kit_inventory_item_id WHERE t.inventory_kit_template_id=? AND t.is_active=1 LIMIT 1`).bind(templateId).first();
  if(!template) throw codedError('inventory_kit_template_not_found','Kit template was not found.',404);
  const parentSource=text(template.source_type,20).toLowerCase();
  if(!['supply','other'].includes(parentSource)) throw codedError('inventory_kit_wrong_owner','A purchased kit must be a Supply/other Inventory item, not Product or Tool stock.',409);
  const parentOnHand=Math.max(0,num(template.on_hand_quantity));
  const parentReserved=Math.max(0,num(template.reserved_quantity));
  if(quantity>Math.max(0,parentOnHand-parentReserved)+EPSILON) throw codedError('inventory_kit_insufficient_available',`Only ${Math.max(0,parentOnHand-parentReserved)} unreserved kit(s) are available; ${quantity} requested.`,409);

  const components=rows(await db.prepare(`SELECT * FROM inventory_kit_template_components WHERE inventory_kit_template_id=? ORDER BY sort_order,inventory_kit_template_component_id`).bind(templateId).all());
  if(!components.length) throw codedError('inventory_kit_components_required','This kit has no components.');
  if(components.length>50) throw codedError('inventory_kit_component_limit','Kit opening is limited to 50 components per template.');
  const resolved=[];
  for(const component of components) resolved.push({...component,item:await ensureComponentItem(db,adminUser,templateId,component)});

  let parentLotPlan={ready:1,allocations:[],blockers:[]};
  if(parentSource==='supply'){
    parentLotPlan=await loadMaterialLotPlan(db,id(template.kit_inventory_item_id),quantity);
    if(!parentLotPlan.ready) throw codedError('inventory_kit_parent_lot_not_ready',`Purchased-kit lot provenance is not ready. ${parentLotPlan.blockers.join(' ')}`,409,{blockers:parentLotPlan.blockers});
  }

  const openKey=`kit-open-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
  const kitUnit=Math.max(0,Math.round(num(template.unit_cost_cents)));
  const kitTotal=Math.round(kitUnit*quantity);
  const parentNew=round6(parentOnHand-quantity);
  const parentLotEvidence=(parentLotPlan.allocations||[]).map(a=>`${a.lot_code}:${Number(a.quantity_consumed).toFixed(6)}`).join('|');
  const eventNote=[text(note,800),text(source_lot_code,120)?`Operator source reference: ${text(source_lot_code,120)}.`:'',parentLotEvidence?`Parent kit lots: ${parentLotEvidence}.`:''].filter(Boolean).join(' ').slice(0,1000)||null;
  const statements=[
    db.prepare(`INSERT INTO inventory_kit_open_events(open_key,inventory_kit_template_id,kit_inventory_item_id,kit_quantity_opened,kit_unit_cost_cents,kit_total_cost_cents,source_lot_code,note,opened_by_user_id,opened_at) VALUES (?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(openKey,templateId,template.kit_inventory_item_id,quantity,kitUnit,kitTotal,parentLotEvidence||text(source_lot_code,120)||null,eventNote,adminUser.user_id),
    db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(on_hand_quantity-?)<? AND COALESCE(reserved_quantity,0)<=?`).bind(parentNew,template.kit_inventory_item_id,parentOnHand,EPSILON,parentNew+EPSILON),
    guard(db,`EXISTS(SELECT 1 FROM site_item_inventory WHERE site_item_inventory_id=? AND ABS(on_hand_quantity-?)<?)`,[template.kit_inventory_item_id,parentNew,EPSILON]),
    ...lotDepletionStatements(db,parentLotPlan.allocations||[]),
  ];
  if(parentSource==='supply') statements.push(lotPolicyStatement(db,id(template.kit_inventory_item_id),parentNew));

  let allocatedSoFar=0;
  resolved.forEach((component,index)=>{
    const item=component.item;
    const itemId=id(item.site_item_inventory_id);
    const sourceType=text(item.source_type,20).toLowerCase();
    if(sourceType==='product') throw codedError('inventory_kit_component_wrong_owner','A kit component resolved to Product stock; the opening was blocked.',409);
    const addQty=round6(Math.max(0,num(component.quantity_per_kit))*quantity);
    const fraction=template.allocation_method==='percentage'?Math.max(0,num(component.cost_share_percent))/100:1/resolved.length;
    let allocated=index===resolved.length-1?kitTotal-allocatedSoFar:Math.round(kitTotal*fraction);
    if(allocated<0) allocated=0;
    allocatedSoFar+=allocated;
    const oldQty=Math.max(0,num(item.on_hand_quantity));
    const oldCost=Math.max(0,Math.round(num(item.unit_cost_cents)));
    const newQty=round6(oldQty+addQty);
    const newUnit=newQty>EPSILON?Math.round(((oldQty*oldCost)+allocated)/newQty):oldCost;
    const componentUnit=addQty>EPSILON?Math.round(allocated/addQty):0;
    statements.push(
      db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,unit_cost_cents=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(on_hand_quantity-?)<?`).bind(newQty,newUnit,itemId,oldQty,EPSILON),
      guard(db,`EXISTS(SELECT 1 FROM site_item_inventory WHERE site_item_inventory_id=? AND ABS(on_hand_quantity-?)<? AND unit_cost_cents=?)`,[itemId,newQty,EPSILON,newUnit]),
      db.prepare(`INSERT INTO inventory_kit_open_components(inventory_kit_open_event_id,inventory_kit_template_component_id,component_inventory_item_id,quantity_added,allocated_cost_cents,component_unit_cost_cents,previous_on_hand_quantity,new_on_hand_quantity,created_at) SELECT inventory_kit_open_event_id,?,?,?,?,?,?,?,CURRENT_TIMESTAMP FROM inventory_kit_open_events WHERE open_key=?`).bind(component.inventory_kit_template_component_id,itemId,addQty,allocated,componentUnit,oldQty,newQty,openKey),
    );
    if(sourceType==='supply' && addQty>EPSILON){
      const lotCode=`KIT-B440-${openKey}-${id(component.inventory_kit_template_component_id)}`.slice(0,180);
      statements.push(
        db.prepare(`INSERT INTO inventory_purchase_lots(site_item_inventory_id,lot_code,purchase_date,received_date,supplier_name,supplier_order_number,supplier_sku,asin,source_url,quantity_received,quantity_remaining,unit_cost_cents,shipping_cost_cents,tax_cost_cents,expiry_date,storage_location,lot_status,notes,created_by_user_id,created_at,updated_at) VALUES (?,?,NULL,CURRENT_TIMESTAMP,?,?,?,?,?,?,?,?,0,0,NULL,NULL,'available',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(itemId,lotCode,text(template.supplier_name,180)||'Purchased kit',openKey,text(component.supplier_sku,180)||text(item.supplier_sku,180)||null,null,text(template.source_url,1000)||null,addQty,addQty,componentUnit,`Released from purchased kit ${template.item_name}; open ${openKey}; parent lots ${parentLotEvidence||'not applicable'}.`,adminUser.user_id),
        guard(db,`EXISTS(SELECT 1 FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_code=? AND ABS(quantity_remaining-?)<?)`,[itemId,lotCode,addQty,EPSILON]),
        lotPolicyStatement(db,itemId,newQty,{createIfMissing:true}),
      );
    }
    statements.push(db.prepare(`INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at) VALUES (?,?,?,?, 'adjustment',?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(itemId,item.source_type,item.external_key,item.item_name,addQty,oldQty,newQty,num(item.reserved_quantity),num(item.reserved_quantity),num(item.incoming_quantity),num(item.incoming_quantity),`Released from purchased kit ${template.item_name}; open ${openKey}; allocated cost ${(allocated/100).toFixed(2)} CAD.`,adminUser.user_id));
  });

  statements.push(db.prepare(`INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at) VALUES (?,?,?,?, 'adjustment',?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(template.kit_inventory_item_id,template.source_type,template.external_key,template.item_name,-quantity,parentOnHand,parentNew,parentReserved,parentReserved,num(template.incoming_quantity),num(template.incoming_quantity),`Opened purchased kit into ${resolved.length} component item(s); open ${openKey}; parent lots ${parentLotEvidence||'not applicable'}.`,adminUser.user_id));

  try{ await db.batch(statements); }
  catch(error){ throw codedError('inventory_kit_atomic_open_failed',`The kit opening failed safely; no stock change was committed. ${String(error?.message||'').slice(0,240)}`,409); }
  return {message:`Opened ${quantity} kit(s). Child balances and Supply purchase lots were posted atomically.`,open_key:openKey,component_count:resolved.length,kit_quantity_opened:quantity,kit_total_cost_cents:kitTotal,parent_lot_allocations:parentLotPlan.allocations||[]};
}

export async function consumeKitComponent(db,adminUser,{inventory_kit_template_component_id,usage_quantity,note=''}={}){
  const componentId=id(inventory_kit_template_component_id);
  if(!componentId) throw codedError('inventory_kit_component_required','Choose a kit component.');
  const row=await db.prepare(`SELECT c.inventory_kit_template_component_id,c.inventory_kit_template_id,c.component_inventory_item_id,c.component_name,c.usage_tracking_mode template_usage_tracking_mode,t.template_name,s.site_item_inventory_id,s.source_type,s.external_key,s.item_name,s.on_hand_quantity,s.reserved_quantity,s.incoming_quantity,s.stock_unit_label,s.usage_unit_label,s.usage_units_per_stock_unit,s.do_not_reuse,COALESCE(u.usage_tracking_mode,c.usage_tracking_mode,CASE WHEN s.source_type='tool' THEN 'reusable' ELSE 'exact' END) usage_tracking_mode,COALESCE(u.minimum_usage_increment,0.001) minimum_usage_increment FROM inventory_kit_template_components c JOIN inventory_kit_templates t ON t.inventory_kit_template_id=c.inventory_kit_template_id LEFT JOIN site_item_inventory s ON s.site_item_inventory_id=c.component_inventory_item_id LEFT JOIN site_inventory_usage_profiles u ON u.site_item_inventory_id=s.site_item_inventory_id WHERE c.inventory_kit_template_component_id=? AND t.is_active=1 LIMIT 1`).bind(componentId).first();
  if(!row) throw codedError('inventory_kit_component_not_found','Kit component was not found.',404);
  if(!id(row.site_item_inventory_id)) throw codedError('inventory_kit_component_unlinked','Open the kit once so this component has a real Inventory identity before recording use.',409);
  const reason=text(note,800);
  if(reason.length<8) throw codedError('inventory_kit_component_note_required','Enter a usage note of at least 8 characters so depletion remains auditable.');
  const plan=planKitComponentUsage(row,usage_quantity);

  if(['log_only','reusable'].includes(plan.tracking_mode)){
    await db.prepare(`INSERT INTO site_inventory_usage_movements(site_inventory_movement_id,site_item_inventory_id,usage_quantity_delta,usage_unit_label,stock_quantity_delta,stock_unit_label,tracking_mode,is_estimated,note,actor_user_id,created_at) VALUES (NULL,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(row.site_item_inventory_id,-plan.quantity,plan.usage_unit_label,0,plan.stock_unit_label,plan.tracking_mode,0,`Kit component use: ${reason}`,adminUser.user_id).run();
    return {message:`Recorded ${plan.quantity} ${plan.usage_unit_label} used from ${row.item_name||row.component_name}; on-hand stock was unchanged (${plan.tracking_mode}).`,component:row,plan,lot_allocations:[]};
  }

  let lotPlan={ready:1,allocations:[],blockers:[]};
  if(plan.source_type==='supply'){
    lotPlan=await loadMaterialLotPlan(db,id(row.site_item_inventory_id),plan.stock_quantity);
    if(!lotPlan.ready) throw codedError('inventory_kit_component_lot_not_ready',lotPlan.blockers.join(' '),409,{blockers:lotPlan.blockers});
  }

  const statements=[
    db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(on_hand_quantity-?)<? AND COALESCE(reserved_quantity,0)<=?`).bind(plan.new_on_hand_quantity,row.site_item_inventory_id,plan.previous_on_hand_quantity,EPSILON,plan.new_on_hand_quantity+EPSILON),
    guard(db,`EXISTS(SELECT 1 FROM site_item_inventory WHERE site_item_inventory_id=? AND ABS(on_hand_quantity-?)<?)`,[row.site_item_inventory_id,plan.new_on_hand_quantity,EPSILON]),
    ...lotDepletionStatements(db,lotPlan.allocations||[]),
  ];
  if(plan.source_type==='supply') statements.push(lotPolicyStatement(db,id(row.site_item_inventory_id),plan.new_on_hand_quantity));
  const movementNote=`Kit component use: ${reason}`;
  statements.push(
    db.prepare(`INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at) VALUES (?,?,?,?, 'adjustment',?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(row.site_item_inventory_id,row.source_type,row.external_key,row.item_name,-plan.stock_quantity,plan.previous_on_hand_quantity,plan.new_on_hand_quantity,plan.reserved_quantity,plan.reserved_quantity,num(row.incoming_quantity),num(row.incoming_quantity),movementNote,adminUser.user_id),
    db.prepare(`INSERT INTO site_inventory_usage_movements(site_inventory_movement_id,site_item_inventory_id,usage_quantity_delta,usage_unit_label,stock_quantity_delta,stock_unit_label,tracking_mode,is_estimated,note,actor_user_id,created_at) SELECT site_inventory_movement_id,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP FROM site_inventory_movements WHERE site_item_inventory_id=? AND actor_user_id=? AND note=? ORDER BY site_inventory_movement_id DESC LIMIT 1`).bind(row.site_item_inventory_id,-plan.quantity,plan.usage_unit_label,-plan.stock_quantity,plan.stock_unit_label,plan.tracking_mode,plan.is_estimated,movementNote,adminUser.user_id,row.site_item_inventory_id,adminUser.user_id,movementNote),
  );
  try{ await db.batch(statements); }
  catch(error){ throw codedError('inventory_kit_component_atomic_depletion_failed',`Component use failed safely; no stock change was committed. ${String(error?.message||'').slice(0,240)}`,409); }
  return {message:`Recorded ${plan.quantity} ${plan.usage_unit_label} used from ${row.item_name||row.component_name}.`,component:row,plan,lot_allocations:lotPlan.allocations||[]};
}

export async function loadKitComponentUsage(db){
  const result=await db.prepare(`SELECT c.inventory_kit_template_component_id,c.inventory_kit_template_id,c.component_inventory_item_id,c.component_name,c.quantity_per_kit,c.stock_unit_label template_stock_unit_label,c.usage_unit_label template_usage_unit_label,c.usage_units_per_stock_unit template_usage_units_per_stock_unit,c.usage_tracking_mode template_usage_tracking_mode,c.sort_order,t.template_name,t.kit_inventory_item_id,kit.item_name kit_item_name,s.source_type,s.external_key,s.item_name linked_item_name,s.on_hand_quantity,s.reserved_quantity,s.incoming_quantity,s.stock_unit_label,s.usage_unit_label,s.usage_units_per_stock_unit,s.do_not_reuse,COALESCE(u.usage_tracking_mode,c.usage_tracking_mode,CASE WHEN s.source_type='tool' THEN 'reusable' ELSE 'exact' END) usage_tracking_mode,COALESCE(u.minimum_usage_increment,0.001) minimum_usage_increment FROM inventory_kit_template_components c JOIN inventory_kit_templates t ON t.inventory_kit_template_id=c.inventory_kit_template_id JOIN site_item_inventory kit ON kit.site_item_inventory_id=t.kit_inventory_item_id LEFT JOIN site_item_inventory s ON s.site_item_inventory_id=c.component_inventory_item_id LEFT JOIN site_inventory_usage_profiles u ON u.site_item_inventory_id=s.site_item_inventory_id WHERE t.is_active=1 ORDER BY LOWER(t.template_name),c.sort_order,c.inventory_kit_template_component_id LIMIT 160`).all();
  return rows(result).map(row=>({...row,on_hand_quantity:num(row.on_hand_quantity),reserved_quantity:num(row.reserved_quantity),available_quantity:Math.max(0,num(row.on_hand_quantity)-num(row.reserved_quantity)),usage_units_per_stock_unit:Math.max(0.001,num(row.usage_units_per_stock_unit||row.template_usage_units_per_stock_unit,1)),ready:id(row.component_inventory_item_id)?1:0}));
}
