// Devil n Dove Release 448 — read-only Inventory / Supplies / Tools operations intelligence.
// Existing site_item_inventory and movement/resource authorities remain canonical; this endpoint creates no ledger or schema.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const RELEASE = 448;
const json = (data,status=200) => jsonResponse({ release:RELEASE, ...data },status,{ 'Cache-Control':'no-store' });
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const num = (value,fallback=0) => { const n=Number(value); return Number.isFinite(n)?n:fallback; };

async function tableExists(db,name){
  const row=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first().catch(()=>null);
  return Boolean(row?.name);
}

function issue(kind,severity,label,detail,action){ return { kind,severity,label,detail,action }; }
function severityRank(value){ return ({critical:0,high:1,medium:2,low:3,ready:4})[value] ?? 9; }

function classify(row){
  const issues=[];
  const kind=normalizeText(row.source_type).toLowerCase() || 'supply';
  const onHand=Math.max(0,num(row.on_hand_quantity));
  const linked=num(row.linked_product_count);
  if(num(row.do_not_reuse)===1) issues.push(issue(kind==='tool'?'tool_retirement':'blocked_reuse','critical',kind==='tool'?'Tool blocked from reuse':'Supply blocked from reuse','This item is marked do-not-reuse.','Review retirement/replacement or disposal reason before future use.'));
  if(kind!=='tool' && onHand<=0 && linked>0) issues.push(issue('stockout','critical','Linked supply is out of stock',`${linked} Product link(s) depend on this Supply and current on-hand quantity is zero.`,'Replenish, substitute through a reviewed Product resource change, or pause affected production.'));
  else if(kind!=='tool' && onHand<=1 && linked>0) issues.push(issue('low_stock','high','Linked supply is low',`${linked} Product link(s) depend on this Supply; on-hand quantity is ${onHand}.`,'Review reorder/source and expected Product demand.'));
  if(num(row.is_on_reorder_list)===1) issues.push(issue('reorder','high','Reorder requested','Inventory already flags this item for reorder.','Resolve source, quantity and purchase decision.'));
  if(!normalizeText(row.external_key)) issues.push(issue('identity','high','Missing stable Inventory key','The Inventory item has no external/source key for durable resource matching.','Assign a stable source key before adding more Product lineage.'));
  if(!normalizeText(row.supplier_name)) issues.push(issue('sourcing','medium','Supplier not recorded','No supplier/store is recorded on the operational Inventory item.','Record the actual source/store; keep supplier separate from manufacturer.'));
  if(num(row.manufacturer_link_count)===0) issues.push(issue('manufacturer','medium','Manufacturer provenance pending','No reviewed manufacturer link is attached to this Inventory item.','Review manufacturer/brand/OEM provenance in Vendor Reviews.'));
  if(kind!=='tool' && num(row.has_usage_profile)===0 && linked>0) issues.push(issue('usage_profile','medium','Consumption profile pending','This linked Supply has no explicit usage profile.','Confirm stock unit, usage unit, units per stock unit and minimum increment.'));
  if(kind==='tool' && linked===0) issues.push(issue('tool_linkage','low','Tool not linked to Products','This active Tool currently contributes to no Product resource links.','Link it where it truthfully contributes, or leave unlinked if it is general-purpose.'));
  if(kind!=='tool' && linked===0 && onHand>0) issues.push(issue('unused_supply','low','Supply has stock but no Product link','On-hand stock exists but no Product currently references this Supply.','Review whether it belongs to a Product, kit/project-only workflow, or should remain standalone.'));
  return issues.sort((a,b)=>severityRank(a.severity)-severityRank(b.severity));
}

export async function onRequestGet({request,env}){
  const admin=await getAdminUserFromRequest(request,env); if(!admin)return json({ok:false,error:'Unauthorized.'},401);
  const db=getDb(env); if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  try{
    const hasManufacturers=await tableExists(db,'inventory_manufacturer_links');
    const hasUsage=await tableExists(db,'site_inventory_usage_profiles');
    const manufacturerSelect=hasManufacturers?`(SELECT COUNT(*) FROM inventory_manufacturer_links iml WHERE iml.site_item_inventory_id=sii.site_item_inventory_id AND COALESCE(iml.is_current,1)=1)`:'0';
    const usageSelect=hasUsage?`CASE WHEN EXISTS(SELECT 1 FROM site_inventory_usage_profiles up WHERE up.site_item_inventory_id=sii.site_item_inventory_id) THEN 1 ELSE 0 END`:'0';
    const result=await db.prepare(`SELECT sii.site_item_inventory_id,sii.source_type,sii.external_key,sii.item_name,sii.category,sii.on_hand_quantity,sii.is_on_reorder_list,sii.do_not_reuse,sii.unit_cost_cents,sii.stock_unit_label,sii.usage_unit_label,sii.usage_units_per_stock_unit,sii.supplier_name,sii.supplier_sku,sii.amazon_url,sii.image_url,
      (SELECT COUNT(*) FROM product_resource_links prl WHERE lower(trim(COALESCE(prl.resource_kind,'')))=lower(trim(COALESCE(sii.source_type,''))) AND lower(trim(COALESCE(prl.source_key,'')))=lower(trim(COALESCE(sii.external_key,'')))) AS linked_product_count,
      (SELECT COUNT(DISTINCT prl.product_id) FROM product_resource_links prl WHERE lower(trim(COALESCE(prl.resource_kind,'')))=lower(trim(COALESCE(sii.source_type,''))) AND lower(trim(COALESCE(prl.source_key,'')))=lower(trim(COALESCE(sii.external_key,'')))) AS affected_product_count,
      ${manufacturerSelect} AS manufacturer_link_count,
      ${usageSelect} AS has_usage_profile
      FROM site_item_inventory sii
      WHERE COALESCE(sii.is_active,1)=1 AND lower(trim(COALESCE(sii.source_type,''))) IN ('supply','tool')
      ORDER BY lower(trim(COALESCE(sii.source_type,''))),lower(COALESCE(sii.item_name,'')),sii.site_item_inventory_id`).all();
    const items=rows(result).map(row=>{
      const issues=classify(row);
      return {...row,site_item_inventory_id:Number(row.site_item_inventory_id||0),on_hand_quantity:num(row.on_hand_quantity),linked_product_count:num(row.linked_product_count),affected_product_count:num(row.affected_product_count),manufacturer_link_count:num(row.manufacturer_link_count),has_usage_profile:num(row.has_usage_profile),issues,priority:issues[0]?.severity||'ready'};
    });
    const counts={total:items.length,supplies:items.filter(x=>normalizeText(x.source_type).toLowerCase()==='supply').length,tools:items.filter(x=>normalizeText(x.source_type).toLowerCase()==='tool').length,critical:items.filter(x=>x.priority==='critical').length,high:items.filter(x=>x.priority==='high').length,medium:items.filter(x=>x.priority==='medium').length,low:items.filter(x=>x.priority==='low').length,ready:items.filter(x=>x.priority==='ready').length,reorder:items.filter(x=>num(x.is_on_reorder_list)===1).length,out_of_stock_linked:items.filter(x=>normalizeText(x.source_type).toLowerCase()==='supply'&&num(x.on_hand_quantity)<=0&&num(x.linked_product_count)>0).length,manufacturer_pending:items.filter(x=>num(x.manufacturer_link_count)===0).length};
    items.sort((a,b)=>severityRank(a.priority)-severityRank(b.priority)||num(b.affected_product_count)-num(a.affected_product_count)||String(a.item_name||'').localeCompare(String(b.item_name||'')));
    return json({ok:true,authority:'site_item_inventory',write_authority_duplicated:false,schema:{manufacturer_provenance_ready:hasManufacturers,usage_profiles_ready:hasUsage},counts,items});
  }catch(error){return json({ok:false,error:error?.message||'Inventory intelligence could not load.'},500);}
}
