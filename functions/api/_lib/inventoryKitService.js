// Devil n Dove Build 440 — authoritative purchased-kit opening + component usage service.
// Uses existing Inventory, purchase-lot, usage and Build 249 kit authorities. No request-time DDL.
import { normalizeText } from './adminAudit.js';
import { EPSILON, loadMaterialLotPlan } from './productLotProvenance.js';

const MODES = new Set(['exact','estimated','log_only','reusable']);
const CLASSES = new Set(['raw_material','consumable','packaging','reusable_equipment','kit','component','finished_good','sample','waste','other']);

function rows(result){ return Array.isArray(result?.results) ? result.results : []; }
function number(value,fallback=0){ const n=Number(value); return Number.isFinite(n)?n:fallback; }
function positiveId(value){ const n=Number(value||0); return Number.isInteger(n)&&n>0?n:0; }
function clean(value,max=500){ return normalizeText(value).slice(0,max); }
function round6(value){ return Number(number(value).toFixed(6)); }
function slug(value){ return clean(value,120).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||'component'; }
function statusError(code,message,status=400,details={}){ const error=new Error(message); error.code=code; error.status=status; error.details=details; return error; }

export function planKitComponentUsage(row={}, requestedUsage=0){
  const quantity=Math.max(0,number(requestedUsage));
  if(quantity<=EPSILON) throw statusError('inventory_kit_component_quantity_required','Enter a usage quantity greater than zero.',400);
  const sourceType=clean(row.source_type,30).toLowerCase();
  if(sourceType==='product') throw statusError('inventory_kit_component_wrong_owner','Product stock cannot be depleted from the Kit workspace. Use Product/Creative production authority.',409);
  const modeRaw=clean(row.usage_tracking_mode || row.template_usage_tracking_mode,30).toLowerCase();
  const mode=MODES.has(modeRaw)?modeRaw:(sourceType==='tool'?'reusable':'exact');
  if(sourceType==='tool' && Number(row.do_not_reuse||0)===1) throw statusError('inventory_kit_component_do_not_reuse','This Tool is marked do not reuse. Reactivate it through Tool lifecycle controls before recording another use.',409);
  const minimumIncrement=Math.max(0.0001,number(row.minimum_usage_increment,0.001)||0.001);
  if(quantity+EPSILON<minimumIncrement) throw statusError('inventory_kit_component_below_minimum_increment',`Usage must be at least ${minimumIncrement} ${clean(row.usage_unit_label,40)||'unit'}.`,400,{minimum_usage_increment:minimumIncrement});
  const usagePerStock=Math.max(0.001,number(row.usage_units_per_stock_unit,1)||1);
  const previousOnHand=Math.max(0,number(row.on_hand_quantity));
  const reserved=Math.max(0,number(row.reserved_quantity));
  const available=Math.max(0,previousOnHand-reserved);
  const stockQuantity=['exact','estimated'].includes(mode)?round6(quantity/usagePerStock):0;
  if(stockQuantity>available+EPSILON){
    throw statusError('inventory_kit_component_insufficient_available',`Only ${available.toFixed(6)} ${clean(row.stock_unit_label,40)||'unit'} is available after reservations; ${stockQuantity.toFixed(6)} is required.`,409,{available_quantity:available,required_stock_quantity:stockQuantity});
  }
  return {
    quantity,
    source_type:sourceType,
    tracking_mode:mode,
    is_estimated:mode==='estimated'?1:0,
    usage_unit_label:clean(row.usage_unit_label,40).toLowerCase()||'unit',
    stock_unit_label:clean(row.stock_unit_label,40).toLowerCase()||'unit',
    usage_units_per_stock_unit:usagePerStock,
    minimum_usage_increment:minimumIncrement,
    stock_quantity:stockQuantity,
    previous_on_hand_quantity:previousOnHand,
    new_on_hand_quantity:round6(previousOnHand-stockQuantity),
    reserved_quantity:reserved,
    available_quantity:available,
  };
}

async function ensureComponentItem(db,adminUser,kitTemplateId,component){
  let id=positiveId(component.component_inventory_item_id);
  if(id){ const found=await db.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id=? LIMIT 1`).bind(id).first(); if(found) return found; }
  const name=clean(component.component_name,180); if(!name) throw statusError('inventory_kit_component_name_required','Every kit component needs a name.');
  const sourceRaw=clean(component.component_source_type,20).toLowerCase();
  if(sourceRaw==='product') throw statusError('inventory_kit_component_wrong_owner','A purchased-kit component cannot create or mutate Product stock. Link it as a Supply/Tool component instead.',409);
  const sourceType=['tool','supply','other'].includes(sourceRaw)?sourceRaw:'supply';
  const key=`kit-${kitTemplateId}-${positiveId(component.inventory_kit_template_component_id)}-${slug(name)}`;
  await db.prepare(`INSERT OR IGNORE INTO site_item_inventory(source_type,external_key,item_name,category,on_hand_quantity,unit_cost_cents,stock_unit_label,usage_unit_label,usage_units_per_stock_unit,supplier_sku,is_active,created_at,updated_at) VALUES (?,?,?,?,0,0,?,?,?,?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(sourceType,key,name,clean(component.component_category,120).toLowerCase()||null,clean(component.stock_unit_label,40).toLowerCase()||'unit',clean(component.usage_unit_label,40).toLowerCase()||'unit',Math.max(.001,number(component.usage_units_per_stock_unit,1)),clean(component.supplier_sku,180)||null).run();
  const found=await db.prepare(`SELECT * FROM site_item_inventory WHERE source_type=? AND external_key=? LIMIT 1`).bind(sourceType,key).first();
  if(!found) throw statusError('inventory_kit_component_create_failed',`Could not create inventory component ${name}.`,500);
  id=positiveId(found.site_item_inventory_id);
  await db.prepare(`UPDATE inventory_kit_template_components SET component_inventory_item_id=?,updated_at=CURRENT_TIMESTAMP WHERE inventory_kit_template_component_id=?`).bind(id,positiveId(component.inventory_kit_template_component_id)).run();
  const inventoryClass=CLASSES.has(clean(component.inventory_class,40))?clean(component.inventory_class,40):(sourceType==='tool'?'reusable_equipment':'component');
  const modeRaw=clean(component.usage_tracking_mode,30).toLowerCase(); const mode=MODES.has(modeRaw)?modeRaw:(sourceType==='tool'?'reusable':'exact');
  const lifecycle=sourceType==='tool'||mode==='reusable'?'reusable':'consumable';
  await db.prepare(`INSERT INTO inventory_item_profiles(site_item_inventory_id,inventory_class,lifecycle_mode,lot_tracking_recommended,source_material_recommended,notes,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,'Created from opened purchased kit.',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(site_item_inventory_id) DO UPDATE SET inventory_class=excluded.inventory_class,lifecycle_mode=excluded.lifecycle_mode,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(id,inventoryClass,lifecycle,sourceType==='supply'?1:0,sourceType==='supply'?1:0,adminUser.user_id).run();
  await db.prepare(`INSERT INTO site_inventory_usage_profiles(site_item_inventory_id,usage_tracking_mode,minimum_usage_increment,notes,updated_by_user_id,created_at,updated_at) VALUES (?,?,0.001,'Created from kit component.',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(site_item_inventory_id) DO UPDATE SET usage_tracking_mode=excluded.usage_tracking_mode,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(id,mode,adminUser.user_id).run();
  return await db.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id=? LIMIT 1`).bind(id).first();
}

async function recalcLotPolicy(db,itemId,onHand){
  await db.prepare(`UPDATE inventory_lot_policies SET reconcile_status=CASE WHEN ABS(?-COALESCE((SELECT SUM(COALESCE(quantity_remaining,0)) FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_status<>'returned'),0))<? THEN 'reconciled' ELSE 'needs_review' END,last_reconciled_quantity=?,last_reconciled_at=CASE WHEN ABS(?-COALESCE((SELECT SUM(COALESCE(quantity_remaining,0)) FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_status<>'returned'),0))<? THEN CURRENT_TIMESTAMP ELSE last_reconciled_at END,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=?`).bind(onHand,itemId,EPSILON,onHand,onHand,itemId,EPSILON,itemId).run();
}

async function compensateKitOpen(db,state){
  const failures=[];
  for(const lot of [...state.createdLots].reverse()){
    const r=await db.prepare(`DELETE FROM inventory_purchase_lots WHERE inventory_purchase_lot_id=? AND ABS(quantity_remaining-?)<?`).bind(lot.id,lot.quantity,EPSILON).run().catch(()=>null);
    if(Number(r?.meta?.changes||0)!==1) failures.push(`lot:${lot.id}`);
  }
  for(const child of [...state.children].reverse()){
    const r=await db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,unit_cost_cents=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(on_hand_quantity-?)<?`).bind(child.oldQty,child.oldCost,child.id,child.newQty,EPSILON).run().catch(()=>null);
    if(Number(r?.meta?.changes||0)!==1) failures.push(`child:${child.id}`);
  }
  if(state.eventId){ await db.prepare(`DELETE FROM inventory_kit_open_events WHERE inventory_kit_open_event_id=?`).bind(state.eventId).run().catch(()=>null); }
  if(state.parent){
    const r=await db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(on_hand_quantity-?)<?`).bind(state.parent.oldQty,state.parent.id,state.parent.newQty,EPSILON).run().catch(()=>null);
    if(Number(r?.meta?.changes||0)!==1) failures.push(`parent:${state.parent.id}`);
  }
  for(const child of state.children.filter(row=>row.sourceType==='supply')) await recalcLotPolicy(db,child.id,child.oldQty).catch(()=>failures.push(`policy:${child.id}`));
  return failures;
}

export async function openInventoryKit(db,adminUser,{inventory_kit_template_id,kit_quantity_opened=1,source_lot_code='',note=''}={}){
  const templateId=positiveId(inventory_kit_template_id); const qty=Math.max(EPSILON,number(kit_quantity_opened,1));
  if(!templateId) throw statusError('inventory_kit_template_required','Choose a kit template.');
  const template=await db.prepare(`SELECT t.*,s.item_name,s.source_type,s.external_key,s.on_hand_quantity,s.reserved_quantity,s.incoming_quantity,s.unit_cost_cents,s.stock_unit_label,s.supplier_name,s.supplier_sku,s.source_url FROM inventory_kit_templates t JOIN site_item_inventory s ON s.site_item_inventory_id=t.kit_inventory_item_id WHERE t.inventory_kit_template_id=? AND t.is_active=1 LIMIT 1`).bind(templateId).first();
  if(!template) throw statusError('inventory_kit_template_not_found','Kit template was not found.',404);
  const parentOnHand=Math.max(0,number(template.on_hand_quantity)); const parentReserved=Math.max(0,number(template.reserved_quantity));
  if(qty>Math.max(0,parentOnHand-parentReserved)+EPSILON) throw statusError('inventory_kit_insufficient_available',`Only ${Math.max(0,parentOnHand-parentReserved)} unreserved kit(s) are available; ${qty} requested.`,409);
  const components=rows(await db.prepare(`SELECT * FROM inventory_kit_template_components WHERE inventory_kit_template_id=? ORDER BY sort_order,inventory_kit_template_component_id`).bind(templateId).all());
  if(!components.length) throw statusError('inventory_kit_components_required','This kit has no components.');
  if(components.length>50) throw statusError('inventory_kit_component_limit','Kit opening is limited to 50 components per template.',400);
  const resolved=[]; for(const component of components){ const item=await ensureComponentItem(db,adminUser,templateId,component); resolved.push({...component,item}); }
  const openKey=`kit-open-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
  const kitUnit=Math.max(0,Math.round(number(template.unit_cost_cents))); const kitTotal=Math.round(kitUnit*qty); const shareCount=resolved.length;
  const state={parent:null,eventId:0,children:[],createdLots:[]};
  try{
    const parentNew=round6(parentOnHand-qty);
    const parentUpdate=await db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(on_hand_quantity-?)<? AND COALESCE(reserved_quantity,0)<=?`).bind(parentNew,template.kit_inventory_item_id,parentOnHand,EPSILON,parentNew+EPSILON).run();
    if(Number(parentUpdate?.meta?.changes||0)!==1) throw statusError('inventory_kit_concurrent_change','The purchased-kit balance changed before the opening could post. Refresh and review the quantity.',409);
    state.parent={id:positiveId(template.kit_inventory_item_id),oldQty:parentOnHand,newQty:parentNew};
    const event=await db.prepare(`INSERT INTO inventory_kit_open_events(open_key,inventory_kit_template_id,kit_inventory_item_id,kit_quantity_opened,kit_unit_cost_cents,kit_total_cost_cents,source_lot_code,note,opened_by_user_id,opened_at) VALUES (?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(openKey,templateId,template.kit_inventory_item_id,qty,kitUnit,kitTotal,clean(source_lot_code,120)||null,clean(note,1000)||null,adminUser.user_id).run();
    state.eventId=positiveId(event?.meta?.last_row_id); if(!state.eventId) throw statusError('inventory_kit_event_create_failed','Kit opening evidence could not be created.',500);
    let allocatedSoFar=0;
    for(let index=0;index<resolved.length;index+=1){
      const component=resolved[index]; const item=component.item; const addQty=round6(Math.max(0,number(component.quantity_per_kit))*qty);
      const pct=template.allocation_method==='percentage'?Math.max(0,number(component.cost_share_percent))/100:1/shareCount;
      let allocated=index===resolved.length-1?kitTotal-allocatedSoFar:Math.round(kitTotal*pct); if(allocated<0) allocated=0; allocatedSoFar+=allocated;
      const oldQty=Math.max(0,number(item.on_hand_quantity)); const oldCost=Math.max(0,Math.round(number(item.unit_cost_cents))); const newQty=round6(oldQty+addQty);
      const newUnit=newQty>EPSILON?Math.round(((oldQty*oldCost)+allocated)/newQty):oldCost; const componentUnit=addQty>EPSILON?Math.round(allocated/addQty):0; const sourceType=clean(item.source_type,20).toLowerCase();
      const childUpdate=await db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,unit_cost_cents=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(on_hand_quantity-?)<?`).bind(newQty,newUnit,item.site_item_inventory_id,oldQty,EPSILON).run();
      if(Number(childUpdate?.meta?.changes||0)!==1) throw statusError('inventory_kit_component_concurrent_change',`${item.item_name} changed while the kit was being opened. The opening was cancelled and compensated.`,409);
      state.children.push({id:positiveId(item.site_item_inventory_id),oldQty,oldCost,newQty,sourceType});
      await db.prepare(`INSERT INTO inventory_kit_open_components(inventory_kit_open_event_id,inventory_kit_template_component_id,component_inventory_item_id,quantity_added,allocated_cost_cents,component_unit_cost_cents,previous_on_hand_quantity,new_on_hand_quantity,created_at) VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(state.eventId,component.inventory_kit_template_component_id,item.site_item_inventory_id,addQty,allocated,componentUnit,oldQty,newQty).run();
      await db.prepare(`INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at) VALUES (?,?,?,?, 'adjustment',?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(item.site_item_inventory_id,item.source_type,item.external_key,item.item_name,addQty,oldQty,newQty,number(item.reserved_quantity),number(item.reserved_quantity),number(item.incoming_quantity),number(item.incoming_quantity),`Released from purchased kit: ${template.item_name}. Allocated cost ${(allocated/100).toFixed(2)} CAD.`,adminUser.user_id).run();
      if(sourceType==='supply' && addQty>EPSILON){
        const lotCode=`KIT-B440-${state.eventId}-${positiveId(component.inventory_kit_template_component_id)}`;
        const lot=await db.prepare(`INSERT INTO inventory_purchase_lots(site_item_inventory_id,lot_code,purchase_date,received_date,supplier_name,supplier_order_number,supplier_sku,asin,source_url,quantity_received,quantity_remaining,unit_cost_cents,shipping_cost_cents,tax_cost_cents,expiry_date,storage_location,lot_status,notes,created_by_user_id,created_at,updated_at) VALUES (?,?,NULL,CURRENT_TIMESTAMP,?,?,?,?,?,?,?,?,0,0,NULL,NULL,'available',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(item.site_item_inventory_id,lotCode,clean(template.supplier_name,180)||'Purchased kit',clean(source_lot_code,120)||openKey,clean(component.supplier_sku,180)||clean(item.supplier_sku,180)||null,null,clean(template.source_url,1000)||null,addQty,addQty,componentUnit,`Build 440 kit release from ${template.item_name}; component ${component.component_name}.`,adminUser.user_id).run();
        const lotId=positiveId(lot?.meta?.last_row_id); if(!lotId) throw statusError('inventory_kit_component_lot_create_failed',`Purchase-lot evidence could not be created for ${item.item_name}.`,500);
        state.createdLots.push({id:lotId,quantity:addQty,itemId:positiveId(item.site_item_inventory_id)});
        await db.prepare(`INSERT INTO inventory_lot_policies(site_item_inventory_id,depletion_method,reconcile_status,last_reconciled_quantity,last_reconciled_at,updated_by_user_id,updated_at) SELECT ?,'fifo',CASE WHEN ABS(?-COALESCE((SELECT SUM(COALESCE(quantity_remaining,0)) FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_status<>'returned'),0))<? THEN 'reconciled' ELSE 'needs_review' END,?,CASE WHEN ABS(?-COALESCE((SELECT SUM(COALESCE(quantity_remaining,0)) FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_status<>'returned'),0))<? THEN CURRENT_TIMESTAMP ELSE NULL END,NULL,CURRENT_TIMESTAMP ON CONFLICT(site_item_inventory_id) DO UPDATE SET reconcile_status=excluded.reconcile_status,last_reconciled_quantity=excluded.last_reconciled_quantity,last_reconciled_at=CASE WHEN excluded.reconcile_status='reconciled' THEN CURRENT_TIMESTAMP ELSE inventory_lot_policies.last_reconciled_at END,updated_at=CURRENT_TIMESTAMP`).bind(item.site_item_inventory_id,newQty,item.site_item_inventory_id,EPSILON,newQty,newQty,item.site_item_inventory_id,EPSILON).run();
      }
    }
    await db.prepare(`INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at) VALUES (?,?,?,?, 'adjustment',?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(template.kit_inventory_item_id,template.source_type,template.external_key,template.item_name,-qty,parentOnHand,parentNew,parentReserved,parentReserved,number(template.incoming_quantity),number(template.incoming_quantity),`Opened purchased kit into ${resolved.length} component inventory item(s).`,adminUser.user_id).run();
    return {message:`Opened ${qty} kit(s). Components now remain as independent inventory balances with Supply purchase-lot provenance.`,open_key:openKey,inventory_kit_open_event_id:state.eventId,component_count:resolved.length,kit_quantity_opened:qty,kit_total_cost_cents:kitTotal};
  }catch(error){
    const failures=await compensateKitOpen(db,state);
    if(failures.length){ throw statusError('inventory_kit_compensation_failed',`Kit opening failed and compensation was incomplete (${failures.join(', ')}). Stop further kit activity and review Inventory incidents.`,500,{original_error:String(error?.message||error),compensation_failures:failures}); }
    throw error;
  }
}

async function compensateUsage(db,state){
  const failures=[];
  for(const lot of [...state.lots].reverse()){
    const r=await db.prepare(`UPDATE inventory_purchase_lots SET quantity_remaining=?,lot_status=?,updated_at=CURRENT_TIMESTAMP WHERE inventory_purchase_lot_id=? AND ABS(quantity_remaining-?)<?`).bind(lot.before,lot.beforeStatus,lot.id,lot.after,EPSILON).run().catch(()=>null);
    if(Number(r?.meta?.changes||0)!==1) failures.push(`lot:${lot.id}`);
  }
  if(state.item){ const r=await db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(on_hand_quantity-?)<?`).bind(state.item.before,state.item.id,state.item.after,EPSILON).run().catch(()=>null); if(Number(r?.meta?.changes||0)!==1) failures.push(`item:${state.item.id}`); }
  if(state.movementId) await db.prepare(`DELETE FROM site_inventory_movements WHERE site_inventory_movement_id=?`).bind(state.movementId).run().catch(()=>null);
  if(state.item?.sourceType==='supply') await recalcLotPolicy(db,state.item.id,state.item.before).catch(()=>failures.push(`policy:${state.item.id}`));
  return failures;
}

export async function consumeKitComponent(db,adminUser,{inventory_kit_template_component_id,usage_quantity,note=''}={}){
  const componentId=positiveId(inventory_kit_template_component_id); if(!componentId) throw statusError('inventory_kit_component_required','Choose a kit component.');
  const row=await db.prepare(`SELECT c.inventory_kit_template_component_id,c.inventory_kit_template_id,c.component_inventory_item_id,c.component_name,c.usage_tracking_mode template_usage_tracking_mode,t.template_name,s.site_item_inventory_id,s.source_type,s.external_key,s.item_name,s.on_hand_quantity,s.reserved_quantity,s.incoming_quantity,s.stock_unit_label,s.usage_unit_label,s.usage_units_per_stock_unit,s.do_not_reuse,COALESCE(u.usage_tracking_mode,c.usage_tracking_mode,CASE WHEN s.source_type='tool' THEN 'reusable' ELSE 'exact' END) usage_tracking_mode,COALESCE(u.minimum_usage_increment,0.001) minimum_usage_increment FROM inventory_kit_template_components c JOIN inventory_kit_templates t ON t.inventory_kit_template_id=c.inventory_kit_template_id LEFT JOIN site_item_inventory s ON s.site_item_inventory_id=c.component_inventory_item_id LEFT JOIN site_inventory_usage_profiles u ON u.site_item_inventory_id=s.site_item_inventory_id WHERE c.inventory_kit_template_component_id=? AND t.is_active=1 LIMIT 1`).bind(componentId).first();
  if(!row) throw statusError('inventory_kit_component_not_found','Kit component was not found.',404);
  if(!positiveId(row.site_item_inventory_id)) throw statusError('inventory_kit_component_unlinked','Open the kit at least once so this component has a real Inventory identity before recording use.',409);
  const reason=clean(note,800); if(reason.length<8) throw statusError('inventory_kit_component_note_required','Enter a short usage note (at least 8 characters) so the depletion remains auditable.',400);
  const plan=planKitComponentUsage(row,usage_quantity);
  const state={item:null,lots:[],movementId:0};
  if(['log_only','reusable'].includes(plan.tracking_mode)){
    await db.prepare(`INSERT INTO site_inventory_usage_movements(site_inventory_movement_id,site_item_inventory_id,usage_quantity_delta,usage_unit_label,stock_quantity_delta,stock_unit_label,tracking_mode,is_estimated,note,actor_user_id,created_at) VALUES (NULL,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(row.site_item_inventory_id,-plan.quantity,plan.usage_unit_label,0,plan.stock_unit_label,plan.tracking_mode,0,`Kit component use: ${reason}`,adminUser.user_id).run();
    return {message:`Recorded ${plan.quantity} ${plan.usage_unit_label} used from ${row.item_name || row.component_name}; stock quantity was not reduced because tracking is ${plan.tracking_mode}.`,component:row,plan};
  }
  let lotPlan={ready:1,allocations:[],blockers:[]};
  if(plan.source_type==='supply'){
    lotPlan=await loadMaterialLotPlan(db,row.site_item_inventory_id,plan.stock_quantity);
    if(!lotPlan.ready) throw statusError('inventory_kit_component_lot_not_ready',lotPlan.blockers.join(' '),409,{blockers:lotPlan.blockers});
  }
  try{
    const update=await db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(on_hand_quantity-?)<? AND COALESCE(reserved_quantity,0)<=?`).bind(plan.new_on_hand_quantity,row.site_item_inventory_id,plan.previous_on_hand_quantity,EPSILON,plan.new_on_hand_quantity+EPSILON).run();
    if(Number(update?.meta?.changes||0)!==1) throw statusError('inventory_kit_component_concurrent_change','The component balance changed before the depletion could post. Refresh and try again.',409);
    state.item={id:positiveId(row.site_item_inventory_id),before:plan.previous_on_hand_quantity,after:plan.new_on_hand_quantity,sourceType:plan.source_type};
    for(const allocation of lotPlan.allocations||[]){
      const before=round6(allocation.quantity_remaining); const after=round6(allocation.quantity_remaining_after); const beforeStatus=allocation.lot_status||'available';
      const lotUpdate=await db.prepare(`UPDATE inventory_purchase_lots SET quantity_remaining=?,lot_status=CASE WHEN ?<=? THEN 'consumed' ELSE lot_status END,updated_at=CURRENT_TIMESTAMP WHERE inventory_purchase_lot_id=? AND ABS(quantity_remaining-?)<? AND lot_status='available'`).bind(after,after,EPSILON,allocation.inventory_purchase_lot_id,before,EPSILON).run();
      if(Number(lotUpdate?.meta?.changes||0)!==1) throw statusError('inventory_kit_component_lot_concurrent_change',`Purchase lot ${allocation.lot_code} changed before depletion could post. The inventory change was compensated.`,409);
      state.lots.push({id:positiveId(allocation.inventory_purchase_lot_id),before,after,beforeStatus});
    }
    const movement=await db.prepare(`INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at) VALUES (?,?,?,?, 'adjustment',?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(row.site_item_inventory_id,row.source_type,row.external_key,row.item_name,-plan.stock_quantity,plan.previous_on_hand_quantity,plan.new_on_hand_quantity,plan.reserved_quantity,plan.reserved_quantity,number(row.incoming_quantity),number(row.incoming_quantity),`Kit component use: ${reason}`,adminUser.user_id).run();
    state.movementId=positiveId(movement?.meta?.last_row_id); if(!state.movementId) throw statusError('inventory_kit_component_movement_failed','Inventory movement evidence could not be recorded.',500);
    await db.prepare(`INSERT INTO site_inventory_usage_movements(site_inventory_movement_id,site_item_inventory_id,usage_quantity_delta,usage_unit_label,stock_quantity_delta,stock_unit_label,tracking_mode,is_estimated,note,actor_user_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(state.movementId,row.site_item_inventory_id,-plan.quantity,plan.usage_unit_label,-plan.stock_quantity,plan.stock_unit_label,plan.tracking_mode,plan.is_estimated,`Kit component use: ${reason}`,adminUser.user_id).run();
    if(plan.source_type==='supply') await recalcLotPolicy(db,row.site_item_inventory_id,plan.new_on_hand_quantity);
    return {message:`Recorded ${plan.quantity} ${plan.usage_unit_label} used from ${row.item_name || row.component_name}.`,component:row,plan,lot_allocations:lotPlan.allocations||[]};
  }catch(error){
    const failures=await compensateUsage(db,state);
    if(failures.length) throw statusError('inventory_kit_component_compensation_failed',`Component depletion failed and compensation was incomplete (${failures.join(', ')}). Stop further component use and review Inventory incidents.`,500,{original_error:String(error?.message||error),compensation_failures:failures});
    throw error;
  }
}

export async function loadKitComponentUsage(db){
  const components=rows(await db.prepare(`SELECT c.inventory_kit_template_component_id,c.inventory_kit_template_id,c.component_inventory_item_id,c.component_name,c.quantity_per_kit,c.stock_unit_label template_stock_unit_label,c.usage_unit_label template_usage_unit_label,c.usage_units_per_stock_unit template_usage_units_per_stock_unit,c.usage_tracking_mode template_usage_tracking_mode,c.sort_order,t.template_name,t.kit_inventory_item_id,kit.item_name kit_item_name,s.source_type,s.external_key,s.item_name linked_item_name,s.on_hand_quantity,s.reserved_quantity,s.incoming_quantity,s.stock_unit_label,s.usage_unit_label,s.usage_units_per_stock_unit,s.do_not_reuse,COALESCE(u.usage_tracking_mode,c.usage_tracking_mode,CASE WHEN s.source_type='tool' THEN 'reusable' ELSE 'exact' END) usage_tracking_mode,COALESCE(u.minimum_usage_increment,0.001) minimum_usage_increment FROM inventory_kit_template_components c JOIN inventory_kit_templates t ON t.inventory_kit_template_id=c.inventory_kit_template_id JOIN site_item_inventory kit ON kit.site_item_inventory_id=t.kit_inventory_item_id LEFT JOIN site_item_inventory s ON s.site_item_inventory_id=c.component_inventory_item_id LEFT JOIN site_inventory_usage_profiles u ON u.site_item_inventory_id=s.site_item_inventory_id WHERE t.is_active=1 ORDER BY LOWER(t.template_name),c.sort_order,c.inventory_kit_template_component_id LIMIT 160`).all());
  return components.map(row=>({...row,on_hand_quantity:number(row.on_hand_quantity),reserved_quantity:number(row.reserved_quantity),available_quantity:Math.max(0,number(row.on_hand_quantity)-number(row.reserved_quantity)),usage_units_per_stock_unit:Math.max(.001,number(row.usage_units_per_stock_unit || row.template_usage_units_per_stock_unit,1)),ready:positiveId(row.component_inventory_item_id)?1:0}));
}
