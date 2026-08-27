// Devil n Dove Build 440 — purchased-kit template + lot-aware opening API.
// Build 249 tables remain canonical; stock opening delegates to inventoryKitService.
import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from '../_lib/adminAudit.js';
import { openInventoryKit } from '../_lib/inventoryKitService.js';

const BUILD=440;
const MAX_COMPONENTS=50;
const CLASSES=new Set(['raw_material','consumable','packaging','reusable_equipment','kit','component','finished_good','sample','waste','other']);
const MODES=new Set(['exact','estimated','log_only','reusable']);
const SOURCES=new Set(['tool','supply','other']);
const json=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const rows=(result)=>Array.isArray(result?.results)?result.results:[];
const num=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const id=(value)=>{const n=Number(value||0);return Number.isInteger(n)&&n>0?n:0;};
const text=(value,max=500)=>normalizeText(value).slice(0,max);

function codedError(code,message,status=400){const error=new Error(message);error.code=code;error.status=status;return error;}
function failure(error){const status=[400,401,403,404,409].includes(Number(error?.status))?Number(error.status):500;return json({ok:false,build:BUILD,code:error?.code||'inventory_kit_action_failed',error:String(error?.message||'Kit inventory action failed.')},status);}

async function access(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser)return {response:json({ok:false,build:BUILD,error:'Admin access required.'},401)};
  const db=getDb(context.env);
  if(!db)return {response:json({ok:false,build:BUILD,error:'Database binding is not configured.'},500)};
  return {db,adminUser};
}

async function load(db){
  const items=rows(await db.prepare(`
    SELECT sii.site_item_inventory_id,sii.source_type,sii.external_key,sii.item_name,sii.category,
      sii.on_hand_quantity,sii.reserved_quantity,sii.incoming_quantity,sii.unit_cost_cents,
      sii.stock_unit_label,sii.usage_unit_label,sii.usage_units_per_stock_unit,sii.supplier_name,sii.supplier_sku,
      COALESCE(p.inventory_class,CASE WHEN sii.source_type='tool' THEN 'reusable_equipment' ELSE 'consumable' END) inventory_class,
      COALESCE(p.lifecycle_mode,CASE WHEN sii.source_type='tool' THEN 'reusable' ELSE 'consumable' END) lifecycle_mode,
      COALESCE(u.usage_tracking_mode,CASE WHEN sii.source_type='tool' THEN 'reusable' ELSE 'exact' END) usage_tracking_mode
    FROM site_item_inventory sii
    LEFT JOIN inventory_item_profiles p ON p.site_item_inventory_id=sii.site_item_inventory_id
    LEFT JOIN site_inventory_usage_profiles u ON u.site_item_inventory_id=sii.site_item_inventory_id
    WHERE COALESCE(sii.is_active,1)=1 AND LOWER(TRIM(COALESCE(sii.source_type,'')))<>'product'
    ORDER BY LOWER(COALESCE(sii.item_name,'')),sii.site_item_inventory_id
    LIMIT 500
  `).all());
  const templates=rows(await db.prepare(`
    SELECT t.*,s.item_name kit_item_name,s.source_type kit_source_type,
      s.on_hand_quantity kit_on_hand_quantity,s.reserved_quantity kit_reserved_quantity,
      s.unit_cost_cents kit_unit_cost_cents,s.stock_unit_label kit_stock_unit_label
    FROM inventory_kit_templates t
    JOIN site_item_inventory s ON s.site_item_inventory_id=t.kit_inventory_item_id
    WHERE t.is_active=1
    ORDER BY LOWER(t.template_name),t.inventory_kit_template_id
    LIMIT 100
  `).all());
  const components=rows(await db.prepare(`
    SELECT c.*,s.item_name linked_item_name,s.source_type linked_source_type,s.on_hand_quantity linked_on_hand_quantity
    FROM inventory_kit_template_components c
    LEFT JOIN site_item_inventory s ON s.site_item_inventory_id=c.component_inventory_item_id
    WHERE c.inventory_kit_template_id IN (SELECT inventory_kit_template_id FROM inventory_kit_templates WHERE is_active=1)
    ORDER BY c.inventory_kit_template_id,c.sort_order,c.inventory_kit_template_component_id
    LIMIT 500
  `).all());
  const grouped=new Map();
  for(const component of components){const key=Number(component.inventory_kit_template_id);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(component);}
  const events=rows(await db.prepare(`
    SELECT e.*,t.template_name,s.item_name kit_item_name,
      (SELECT COUNT(*) FROM inventory_kit_open_components oc WHERE oc.inventory_kit_open_event_id=e.inventory_kit_open_event_id) component_count
    FROM inventory_kit_open_events e
    JOIN inventory_kit_templates t ON t.inventory_kit_template_id=e.inventory_kit_template_id
    JOIN site_item_inventory s ON s.site_item_inventory_id=e.kit_inventory_item_id
    ORDER BY e.opened_at DESC,e.inventory_kit_open_event_id DESC
    LIMIT 30
  `).all());
  return {items,templates:templates.map(template=>({...template,components:grouped.get(Number(template.inventory_kit_template_id))||[]})),events};
}

async function validateTemplate(db,body){
  const kitId=id(body.kit_inventory_item_id);
  if(!kitId)throw codedError('inventory_kit_parent_required','Choose the Inventory item that represents the purchased kit.');
  const kit=await db.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id=? AND COALESCE(is_active,1)=1 LIMIT 1`).bind(kitId).first();
  if(!kit)throw codedError('inventory_kit_parent_missing','The purchased-kit Inventory item was not found.',404);
  if(text(kit.source_type,20).toLowerCase()==='product')throw codedError('inventory_kit_wrong_owner','Product stock cannot be configured as a purchased Inventory kit.',409);
  const incoming=Array.isArray(body.components)?body.components:[];
  if(!incoming.length)throw codedError('inventory_kit_components_required','Add at least one kit component.');
  if(incoming.length>MAX_COMPONENTS)throw codedError('inventory_kit_component_limit',`A kit template is limited to ${MAX_COMPONENTS} components.`);
  const shares=incoming.map(component=>Math.max(0,num(component.cost_share_percent))).filter(value=>value>0);
  const shareTotal=shares.reduce((sum,value)=>sum+value,0);
  const allocationMethod=shares.length?'percentage':'equal';
  if(allocationMethod==='percentage'&&Math.abs(shareTotal-100)>0.05)throw codedError('inventory_kit_cost_share_invalid',`Component cost shares must total 100%. Current total: ${shareTotal.toFixed(2)}%.`);
  const components=[];
  for(let index=0;index<incoming.length;index+=1){
    const candidate=incoming[index]||{};
    const linkedId=id(candidate.component_inventory_item_id);
    let linked=null;
    if(linkedId){
      linked=await db.prepare(`SELECT site_item_inventory_id,source_type,item_name FROM site_item_inventory WHERE site_item_inventory_id=? AND COALESCE(is_active,1)=1 LIMIT 1`).bind(linkedId).first();
      if(!linked)throw codedError('inventory_kit_component_link_missing',`Component ${index+1} links to an Inventory item that no longer exists.`,409);
      if(text(linked.source_type,20).toLowerCase()==='product')throw codedError('inventory_kit_component_wrong_owner',`Component ${index+1} links to Product stock. Purchased-kit components must use Supply/Tool Inventory.`,409);
    }
    const requestedSource=text(candidate.component_source_type,20).toLowerCase();
    if(requestedSource==='product')throw codedError('inventory_kit_component_wrong_owner',`Component ${index+1} cannot use Product stock.`,409);
    const source=linked?text(linked.source_type,20).toLowerCase():(SOURCES.has(requestedSource)?requestedSource:'supply');
    const name=text(candidate.component_name,180)||text(linked?.item_name,180);
    if(!name)throw codedError('inventory_kit_component_name_required',`Component ${index+1} needs a name or linked Inventory item.`);
    const modeRaw=text(candidate.usage_tracking_mode,30).toLowerCase();
    const mode=MODES.has(modeRaw)?modeRaw:(source==='tool'?'reusable':'exact');
    const classRaw=text(candidate.inventory_class,40);
    const inventoryClass=CLASSES.has(classRaw)?classRaw:(source==='tool'?'reusable_equipment':'component');
    components.push({
      linkedId,
      name,
      source,
      mode,
      inventoryClass,
      category:text(candidate.component_category,120).toLowerCase()||null,
      quantity:Math.max(0.0001,num(candidate.quantity_per_kit,1)),
      stockUnit:text(candidate.stock_unit_label,40).toLowerCase()||'unit',
      usageUnit:text(candidate.usage_unit_label,40).toLowerCase()||'unit',
      perStock:Math.max(0.001,num(candidate.usage_units_per_stock_unit,1)),
      share:Math.max(0,num(candidate.cost_share_percent)),
      supplierSku:text(candidate.supplier_sku,180)||null,
      notes:text(candidate.notes,500)||null,
      sortOrder:index+1,
    });
  }
  return {kitId,kit,name:text(body.template_name,180)||`${kit.item_name} breakdown`,notes:text(body.notes,1000)||null,allocationMethod,components};
}

async function saveTemplate(context,granted,body){
  const planned=await validateTemplate(granted.db,body);
  const templateId=id(body.inventory_kit_template_id);
  const statements=[];
  if(templateId){
    statements.push(granted.db.prepare(`UPDATE inventory_kit_templates SET kit_inventory_item_id=?,template_name=?,allocation_method=?,notes=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE inventory_kit_template_id=? AND is_active=1`).bind(planned.kitId,planned.name,planned.allocationMethod,planned.notes,granted.adminUser.user_id,templateId));
  }else{
    statements.push(granted.db.prepare(`INSERT INTO inventory_kit_templates(kit_inventory_item_id,template_name,allocation_method,notes,is_active,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,?,1,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(kit_inventory_item_id) DO UPDATE SET template_name=excluded.template_name,allocation_method=excluded.allocation_method,notes=excluded.notes,is_active=1,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(planned.kitId,planned.name,planned.allocationMethod,planned.notes,granted.adminUser.user_id,granted.adminUser.user_id));
  }
  const templateSelector=templateId?'?':'(SELECT inventory_kit_template_id FROM inventory_kit_templates WHERE kit_inventory_item_id=?)';
  statements.push(granted.db.prepare(`DELETE FROM inventory_kit_template_components WHERE inventory_kit_template_id=${templateSelector}`).bind(templateId||planned.kitId));
  for(const component of planned.components){
    statements.push(granted.db.prepare(`INSERT INTO inventory_kit_template_components(inventory_kit_template_id,component_inventory_item_id,component_name,component_source_type,component_category,quantity_per_kit,stock_unit_label,usage_unit_label,usage_units_per_stock_unit,usage_tracking_mode,inventory_class,cost_share_percent,supplier_sku,notes,sort_order,created_at,updated_at) SELECT inventory_kit_template_id,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM inventory_kit_templates WHERE ${templateId?'inventory_kit_template_id=?':'kit_inventory_item_id=?'}`).bind(component.linkedId||null,component.name,component.source,component.category,component.quantity,component.stockUnit,component.usageUnit,component.perStock,component.mode,component.inventoryClass,component.share,component.supplierSku,component.notes,component.sortOrder,templateId||planned.kitId));
  }
  statements.push(granted.db.prepare(`INSERT INTO inventory_item_profiles(site_item_inventory_id,inventory_class,lifecycle_mode,lot_tracking_recommended,notes,updated_by_user_id,created_at,updated_at) VALUES (?,'kit','kit',1,'Purchased kit/bundle; open it to release child Inventory.',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(site_item_inventory_id) DO UPDATE SET inventory_class='kit',lifecycle_mode='kit',lot_tracking_recommended=1,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(planned.kitId,granted.adminUser.user_id));
  try{await granted.db.batch(statements);}catch(error){throw codedError('inventory_kit_template_atomic_save_failed',`Kit template was not saved because its transaction failed. ${String(error?.message||'').slice(0,220)}`,409);}
  const saved=await granted.db.prepare(`SELECT inventory_kit_template_id FROM inventory_kit_templates WHERE ${templateId?'inventory_kit_template_id=?':'kit_inventory_item_id=?'} LIMIT 1`).bind(templateId||planned.kitId).first();
  const savedId=id(saved?.inventory_kit_template_id);
  await auditAdminAction(context.env,context.request,granted.adminUser,{action_type:'inventory_kit_template_save',target_type:'inventory_kit_template',target_id:savedId||null,target_key:planned.name,details:{kit_inventory_item_id:planned.kitId,component_count:planned.components.length,allocation_method:planned.allocationMethod}});
  return json({ok:true,build:BUILD,message:'Kit breakdown template saved.',...await load(granted.db)});
}

export async function onRequestGet(context){
  const granted=await access(context);if(granted.response)return granted.response;
  try{return json({ok:true,build:BUILD,owner:'inventory',request_time_schema_repair:false,background_polling:false,...await load(granted.db)});}
  catch(error){await captureRuntimeIncident(context.env,context.request,error,{area:'inventory_kits',operation:'get'}).catch(()=>{});return failure(error);}
}

export async function onRequestPost(context){
  const granted=await access(context);if(granted.response)return granted.response;
  let body={};try{body=await context.request.json();}catch{return json({ok:false,build:BUILD,code:'invalid_json',error:'Invalid JSON body.'},400);}
  const action=text(body.action,60).toLowerCase();
  try{
    if(action==='save_template')return await saveTemplate(context,granted,body);
    if(action==='open_kit'){
      const result=await openInventoryKit(granted.db,granted.adminUser,body);
      await auditAdminAction(context.env,context.request,granted.adminUser,{action_type:'inventory_kit_open',target_type:'inventory_kit_template',target_id:id(body.inventory_kit_template_id)||null,target_key:result.open_key,details:{kit_quantity_opened:result.kit_quantity_opened,component_count:result.component_count,kit_total_cost_cents:result.kit_total_cost_cents,parent_lot_allocation_count:Array.isArray(result.parent_lot_allocations)?result.parent_lot_allocations.length:0}});
      return json({ok:true,build:BUILD,...result,...await load(granted.db)});
    }
    return json({ok:false,build:BUILD,code:'unsupported_action',error:'Unsupported kit inventory action.'},400);
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,error,{area:'inventory_kits',operation:action||'post'}).catch(()=>{});
    return failure(error);
  }
}
