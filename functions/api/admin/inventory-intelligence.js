// Devil n Dove Release 456 — Inventory / Supplies / Tools operational intelligence.
// site_item_inventory remains canonical for Inventory identity/quantity/reuse. Release 448 Tool lifecycle tables remain canonical for durable Tool condition/service history.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const RELEASE = 456;
const json = (data,status=200) => jsonResponse({ release:RELEASE, ...data },status,{ 'Cache-Control':'no-store' });
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const num = (value,fallback=0) => { const n=Number(value); return Number.isFinite(n)?n:fallback; };
const clean = value => normalizeText(value);
const lower = value => clean(value).toLowerCase();

async function tableExists(db,name){
  const row=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first().catch(()=>null);
  return Boolean(row?.name);
}

function issue(kind,severity,label,detail,action){ return { kind,severity,label,detail,action }; }
function severityRank(value){ return ({critical:0,high:1,medium:2,low:3,ready:4})[value] ?? 9; }
function daysUntil(value){
  const raw=clean(value);
  if(!raw)return null;
  const stamp=Date.parse(raw.length<=10 ? `${raw}T12:00:00Z` : raw);
  if(!Number.isFinite(stamp))return null;
  return Math.ceil((stamp-Date.now())/86400000);
}
function toolServiceState(row){
  const lifecycle=lower(row.lifecycle_status);
  const condition=lower(row.condition_status);
  if(['retired','replaced'].includes(lifecycle))return 'closed';
  if(num(row.do_not_reuse)===1 || condition==='unsafe')return 'blocked';
  const days=daysUntil(row.next_service_at);
  if(days==null)return clean(row.lifecycle_profile_count) ? 'unscheduled' : 'profile_missing';
  if(days<0)return 'overdue';
  if(days===0)return 'due_today';
  if(days<=30)return 'due_soon';
  return 'scheduled';
}
function toolOperationalState(row){
  const lifecycle=lower(row.lifecycle_status);
  const condition=lower(row.condition_status);
  if(num(row.do_not_reuse)===1 || condition==='unsafe')return 'blocked';
  if(lifecycle==='retired' || lifecycle==='replaced')return 'closed';
  if(lifecycle==='out_of_service' || condition==='damaged')return 'out_of_service';
  const service=toolServiceState(row);
  if(['overdue','due_today'].includes(service))return 'service_due';
  if(lower(row.replacement_priority)==='urgent')return 'replacement_urgent';
  if(service==='due_soon' || ['plan','watch'].includes(lower(row.replacement_priority)))return 'attention';
  return 'ready';
}
function classify(row){
  const issues=[];
  const kind=lower(row.source_type) || 'supply';
  const onHand=Math.max(0,num(row.on_hand_quantity));
  const linked=num(row.linked_product_count);
  if(num(row.do_not_reuse)===1) issues.push(issue(kind==='tool'?'tool_retirement':'blocked_reuse','critical',kind==='tool'?'Tool blocked from reuse':'Supply blocked from reuse','This item is marked do-not-reuse.','Review retirement/replacement or disposal reason before future use.'));
  if(kind!=='tool' && onHand<=0 && linked>0) issues.push(issue('stockout','critical','Linked supply is out of stock',`${linked} Product link(s) depend on this Supply and current on-hand quantity is zero.`,'Replenish, substitute through a reviewed Product resource change, or pause affected production.'));
  else if(kind!=='tool' && onHand<=1 && linked>0) issues.push(issue('low_stock','high','Linked supply is low',`${linked} Product link(s) depend on this Supply; on-hand quantity is ${onHand}.`,'Review reorder/source and expected Product demand.'));
  if(num(row.is_on_reorder_list)===1) issues.push(issue('reorder','high','Reorder requested','Inventory already flags this item for reorder.','Resolve source, quantity and purchase decision.'));
  if(!clean(row.external_key)) issues.push(issue('identity','high','Missing stable Inventory key','The Inventory item has no external/source key for durable resource matching.','Assign a stable source key before adding more Product lineage.'));
  if(!clean(row.supplier_name)) issues.push(issue('sourcing','medium','Supplier not recorded','No supplier/store is recorded on the operational Inventory item.','Record the actual source/store; keep supplier separate from manufacturer.'));
  if(num(row.manufacturer_link_count)===0) issues.push(issue('manufacturer','medium','Manufacturer provenance pending','No reviewed manufacturer link is attached to this Inventory item.','Review manufacturer/brand/OEM provenance in Vendor Reviews.'));
  if(kind!=='tool' && num(row.has_usage_profile)===0 && linked>0) issues.push(issue('usage_profile','medium','Consumption profile pending','This linked Supply has no explicit usage profile.','Confirm stock unit, usage unit, units per stock unit and minimum increment.'));
  if(kind==='tool'){
    const lifecycle=lower(row.lifecycle_status);
    const condition=lower(row.condition_status);
    const service=toolServiceState(row);
    const replacement=lower(row.replacement_priority);
    if(num(row.lifecycle_profile_count)===0) issues.push(issue('tool_lifecycle_profile','medium','Lifecycle profile not reviewed','This Tool has no durable lifecycle profile yet.','Open Tool Lifecycle and record condition, service cadence and replacement priority.'));
    if(condition==='unsafe') issues.push(issue('tool_unsafe','critical','Tool condition is unsafe','Lifecycle review marks this Tool unsafe.','Keep it out of service and resolve repair, retirement or replacement before reuse.'));
    else if(condition==='damaged') issues.push(issue('tool_damage','high','Tool is damaged','Lifecycle review records damage that requires attention.','Review repair evidence and return-to-service decision before normal use.'));
    if(lifecycle==='out_of_service') issues.push(issue('tool_out_of_service','high','Tool is out of service','Lifecycle status prevents normal operational use.','Resolve maintenance/repair or document retirement/replacement.'));
    if(['retired','replaced'].includes(lifecycle) && num(row.do_not_reuse)!==1) issues.push(issue('tool_reuse_alignment','high','Closed lifecycle still appears reusable','Lifecycle is closed but Inventory is not marked do-not-reuse.','Review the Inventory do-not-reuse flag so operational reuse state matches the lifecycle decision.'));
    if(service==='overdue') issues.push(issue('tool_service_overdue','high','Tool service is overdue',`Next service date ${clean(row.next_service_at)} has passed.`,'Record maintenance/calibration or revise the reviewed service schedule.'));
    else if(service==='due_today') issues.push(issue('tool_service_due','high','Tool service is due today',`Next service date is ${clean(row.next_service_at)}.`,'Complete and record service before continued use where required.'));
    else if(service==='due_soon') issues.push(issue('tool_service_due_soon','medium','Tool service is due soon',`Next service is ${clean(row.next_service_at)}.`,'Plan service so the Tool does not become overdue.'));
    if(replacement==='urgent') issues.push(issue('tool_replacement','high','Urgent replacement planning','Replacement priority is urgent.','Review replacement cost, candidate Tool and lifecycle closure plan.'));
    else if(replacement==='plan') issues.push(issue('tool_replacement','medium','Replacement should be planned','Replacement priority is plan.','Confirm budget and candidate before the Tool becomes operationally blocked.'));
    else if(replacement==='watch') issues.push(issue('tool_replacement','low','Replacement watch','This Tool is being watched for eventual replacement.','Keep condition/service evidence current.'));
    if(linked===0) issues.push(issue('tool_linkage','low','Tool not linked to Products','This active Tool currently contributes to no Product resource links.','Link it where it truthfully contributes, or leave unlinked if it is general-purpose.'));
  }
  if(kind!=='tool' && linked===0 && onHand>0) issues.push(issue('unused_supply','low','Supply has stock but no Product link','On-hand stock exists but no Product currently references this Supply.','Review whether it belongs to a Product, kit/project-only workflow, or should remain standalone.'));
  return issues.sort((a,b)=>severityRank(a.severity)-severityRank(b.severity));
}

export async function onRequestGet({request,env}){
  const admin=await getAdminUserFromRequest(request,env); if(!admin)return json({ok:false,error:'Unauthorized.'},401);
  const db=getDb(env); if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  try{
    const hasManufacturers=await tableExists(db,'inventory_manufacturer_links');
    const hasUsage=await tableExists(db,'site_inventory_usage_profiles');
    const hasLifecycleProfiles=await tableExists(db,'inventory_tool_lifecycle_profiles');
    const hasLifecycleEvents=await tableExists(db,'inventory_tool_lifecycle_events');
    const hasLifecycle=hasLifecycleProfiles&&hasLifecycleEvents;
    const manufacturerSelect=hasManufacturers?`(SELECT COUNT(*) FROM inventory_manufacturer_links iml WHERE iml.site_item_inventory_id=sii.site_item_inventory_id AND COALESCE(iml.is_current,1)=1)`:'0';
    const usageSelect=hasUsage?`CASE WHEN EXISTS(SELECT 1 FROM site_inventory_usage_profiles up WHERE up.site_item_inventory_id=sii.site_item_inventory_id) THEN 1 ELSE 0 END`:'0';
    const lifecycleSelect=hasLifecycle?`
      (SELECT COUNT(*) FROM inventory_tool_lifecycle_profiles tlp WHERE tlp.site_item_inventory_id=sii.site_item_inventory_id) AS lifecycle_profile_count,
      (SELECT tlp.lifecycle_status FROM inventory_tool_lifecycle_profiles tlp WHERE tlp.site_item_inventory_id=sii.site_item_inventory_id LIMIT 1) AS lifecycle_status,
      (SELECT tlp.condition_status FROM inventory_tool_lifecycle_profiles tlp WHERE tlp.site_item_inventory_id=sii.site_item_inventory_id LIMIT 1) AS condition_status,
      (SELECT tlp.last_service_at FROM inventory_tool_lifecycle_profiles tlp WHERE tlp.site_item_inventory_id=sii.site_item_inventory_id LIMIT 1) AS last_service_at,
      (SELECT tlp.next_service_at FROM inventory_tool_lifecycle_profiles tlp WHERE tlp.site_item_inventory_id=sii.site_item_inventory_id LIMIT 1) AS next_service_at,
      (SELECT tlp.service_interval_days FROM inventory_tool_lifecycle_profiles tlp WHERE tlp.site_item_inventory_id=sii.site_item_inventory_id LIMIT 1) AS service_interval_days,
      (SELECT tlp.replacement_priority FROM inventory_tool_lifecycle_profiles tlp WHERE tlp.site_item_inventory_id=sii.site_item_inventory_id LIMIT 1) AS replacement_priority,
      (SELECT tlp.replacement_cost_cents FROM inventory_tool_lifecycle_profiles tlp WHERE tlp.site_item_inventory_id=sii.site_item_inventory_id LIMIT 1) AS replacement_cost_cents,
      (SELECT COUNT(*) FROM inventory_tool_lifecycle_events tle WHERE tle.site_item_inventory_id=sii.site_item_inventory_id) AS lifecycle_event_count,
      (SELECT tle.event_type FROM inventory_tool_lifecycle_events tle WHERE tle.site_item_inventory_id=sii.site_item_inventory_id ORDER BY tle.occurred_at DESC,tle.inventory_tool_lifecycle_event_id DESC LIMIT 1) AS last_lifecycle_event`:
      `0 AS lifecycle_profile_count,NULL AS lifecycle_status,NULL AS condition_status,NULL AS last_service_at,NULL AS next_service_at,NULL AS service_interval_days,NULL AS replacement_priority,NULL AS replacement_cost_cents,0 AS lifecycle_event_count,NULL AS last_lifecycle_event`;
    const result=await db.prepare(`SELECT sii.site_item_inventory_id,sii.source_type,sii.external_key,sii.item_name,sii.category,sii.on_hand_quantity,sii.is_on_reorder_list,sii.do_not_reuse,sii.unit_cost_cents,sii.stock_unit_label,sii.usage_unit_label,sii.usage_units_per_stock_unit,sii.supplier_name,sii.supplier_sku,sii.amazon_url,sii.image_url,
      (SELECT COUNT(*) FROM product_resource_links prl WHERE lower(trim(COALESCE(prl.resource_kind,'')))=lower(trim(COALESCE(sii.source_type,''))) AND lower(trim(COALESCE(prl.source_key,'')))=lower(trim(COALESCE(sii.external_key,'')))) AS linked_product_count,
      (SELECT COUNT(DISTINCT prl.product_id) FROM product_resource_links prl WHERE lower(trim(COALESCE(prl.resource_kind,'')))=lower(trim(COALESCE(sii.source_type,''))) AND lower(trim(COALESCE(prl.source_key,'')))=lower(trim(COALESCE(sii.external_key,'')))) AS affected_product_count,
      ${manufacturerSelect} AS manufacturer_link_count,
      ${usageSelect} AS has_usage_profile,
      ${lifecycleSelect}
      FROM site_item_inventory sii
      WHERE COALESCE(sii.is_active,1)=1 AND lower(trim(COALESCE(sii.source_type,''))) IN ('supply','tool')
      ORDER BY lower(trim(COALESCE(sii.source_type,''))),lower(COALESCE(sii.item_name,'')),sii.site_item_inventory_id`).all();
    const items=rows(result).map(row=>{
      const normalized={...row,site_item_inventory_id:Number(row.site_item_inventory_id||0),on_hand_quantity:num(row.on_hand_quantity),linked_product_count:num(row.linked_product_count),affected_product_count:num(row.affected_product_count),manufacturer_link_count:num(row.manufacturer_link_count),has_usage_profile:num(row.has_usage_profile),lifecycle_profile_count:num(row.lifecycle_profile_count),lifecycle_event_count:num(row.lifecycle_event_count)};
      if(lower(normalized.source_type)==='tool'){normalized.service_state=toolServiceState(normalized);normalized.operational_state=toolOperationalState(normalized);normalized.lifecycle_url=`/admin/tool-lifecycle/?site_item_inventory_id=${normalized.site_item_inventory_id}`;}
      normalized.issues=classify(normalized);normalized.priority=normalized.issues[0]?.severity||'ready';return normalized;
    });
    const toolItems=items.filter(x=>lower(x.source_type)==='tool');
    const counts={total:items.length,supplies:items.filter(x=>lower(x.source_type)==='supply').length,tools:toolItems.length,critical:items.filter(x=>x.priority==='critical').length,high:items.filter(x=>x.priority==='high').length,medium:items.filter(x=>x.priority==='medium').length,low:items.filter(x=>x.priority==='low').length,ready:items.filter(x=>x.priority==='ready').length,reorder:items.filter(x=>num(x.is_on_reorder_list)===1).length,out_of_stock_linked:items.filter(x=>lower(x.source_type)==='supply'&&num(x.on_hand_quantity)<=0&&num(x.linked_product_count)>0).length,manufacturer_pending:items.filter(x=>num(x.manufacturer_link_count)===0).length,tools_blocked:toolItems.filter(x=>x.operational_state==='blocked').length,tools_out_of_service:toolItems.filter(x=>x.operational_state==='out_of_service').length,tools_service_due:toolItems.filter(x=>['overdue','due_today'].includes(x.service_state)).length,tools_service_due_soon:toolItems.filter(x=>x.service_state==='due_soon').length,tools_replacement_planning:toolItems.filter(x=>['watch','plan','urgent'].includes(lower(x.replacement_priority))).length,tools_profile_pending:toolItems.filter(x=>num(x.lifecycle_profile_count)===0).length};
    items.sort((a,b)=>severityRank(a.priority)-severityRank(b.priority)||num(b.affected_product_count)-num(a.affected_product_count)||String(a.item_name||'').localeCompare(String(b.item_name||'')));
    return json({ok:true,authorities:{inventory:'site_item_inventory',tool_lifecycle:hasLifecycle?'inventory_tool_lifecycle_profiles + inventory_tool_lifecycle_events':'schema unavailable',product_usage:'product_resource_links'},write_authority_duplicated:false,schema:{manufacturer_provenance_ready:hasManufacturers,usage_profiles_ready:hasUsage,tool_lifecycle_ready:hasLifecycle},counts,items});
  }catch(error){return json({ok:false,error:error?.message||'Inventory intelligence could not load.'},500);}
}
