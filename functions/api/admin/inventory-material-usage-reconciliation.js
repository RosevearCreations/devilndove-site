// Release 467 Build 112 — read-only Inventory & Material-Usage reconciliation.
// Existing Inventory/Product/Creative/Kit write authorities remain untouched.
import { captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { buildInventoryMaterialUsageReconciliation } from '../_lib/inventoryMaterialUsageReconciliation.js';

const RELEASE=467;
const BUILD=112;
const TITLE='Inventory & Material-Usage Reconciliation';
const json=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const rows=(result)=>Array.isArray(result?.results)?result.results:[];
const bounded=(value,fallback=500,min=1,max=1000)=>Math.max(min,Math.min(max,Math.trunc(Number(value)||fallback)));

async function tableSet(db) {
  const result=await db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
  return new Set(rows(result).map(row=>String(row.name||'')));
}

export async function onRequestGet(context) {
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser) return json({ok:false,release:RELEASE,build:BUILD,error:'Admin access required.'},401);
  const db=getDb(context.env);
  if(!db) return json({ok:false,release:RELEASE,build:BUILD,error:'Database binding is not configured.'},503);

  const url=new URL(context.request.url);
  const limit=bounded(url.searchParams.get('limit'),500,25,1000);
  const required=[
    'site_item_inventory','site_inventory_usage_profiles','inventory_item_profiles','site_inventory_movements',
    'product_resource_links','products','product_production_runs','product_production_run_materials',
    'creative_project_material_reviews','creative_project_inventory_posts','creative_project_inventory_usage_details',
    'inventory_kit_templates','inventory_kit_template_components','inventory_kit_open_events','inventory_kit_open_components'
  ];

  try {
    const tables=await tableSet(db);
    const missing=required.filter(name=>!tables.has(name));
    if(missing.length) return json({
      ok:false,release:RELEASE,build:BUILD,title:TITLE,state:'blocked',
      error:'Inventory reconciliation evidence schema is incomplete.',
      error_code:'inventory_material_reconciliation_schema_missing',
      missing_tables:missing,
      safety:{read_only:true,request_time_schema_mutation:false,automatic_repair:false}
    },503);

    const [inventoryResult,productLinkResult,reservationResult,creativeResult,productUsageResult,kitTemplateResult,kitComponentResult]=await Promise.all([
      db.prepare(`
        SELECT sii.site_item_inventory_id,sii.source_type,sii.external_key,sii.item_name,sii.category,
               COALESCE(sii.on_hand_quantity,0) on_hand_quantity,
               COALESCE(sii.reserved_quantity,0) reserved_quantity,
               COALESCE(sii.incoming_quantity,0) incoming_quantity,
               COALESCE(sii.unit_cost_cents,0) unit_cost_cents,
               COALESCE(NULLIF(sii.stock_unit_label,''),'unit') stock_unit_label,
               COALESCE(NULLIF(sii.usage_unit_label,''),'unit') usage_unit_label,
               COALESCE(NULLIF(sii.usage_units_per_stock_unit,0),1) usage_units_per_stock_unit,
               COALESCE(siup.usage_tracking_mode,CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) usage_tracking_mode,
               COALESCE(iip.inventory_class,CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable_equipment' ELSE 'consumable' END) inventory_class,
               sii.updated_at
        FROM site_item_inventory sii
        LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id
        LEFT JOIN inventory_item_profiles iip ON iip.site_item_inventory_id=sii.site_item_inventory_id
        WHERE COALESCE(sii.is_active,1)=1 AND LOWER(TRIM(COALESCE(sii.source_type,'')))<>'product'
        ORDER BY LOWER(COALESCE(sii.item_name,'')),sii.site_item_inventory_id
        LIMIT ?
      `).bind(limit).all(),
      db.prepare(`
        SELECT prl.product_resource_link_id,prl.product_id,p.name product_name,p.status product_status,
               prl.resource_kind,prl.source_key,COALESCE(prl.quantity_used,0) quantity_used,
               COALESCE(prl.consumption_mode,'per_unit') consumption_mode,
               COALESCE(prl.lot_size_units,1) lot_size_units,
               sii.site_item_inventory_id,COALESCE(sii.unit_cost_cents,0) unit_cost_cents,
               COALESCE(NULLIF(sii.usage_units_per_stock_unit,0),1) usage_units_per_stock_unit,
               COALESCE(siup.usage_tracking_mode,CASE WHEN LOWER(TRIM(COALESCE(prl.resource_kind,'')))='tool' THEN 'reusable' ELSE 'exact' END) usage_tracking_mode
        FROM product_resource_links prl
        LEFT JOIN products p ON p.product_id=prl.product_id
        LEFT JOIN site_item_inventory sii
          ON LOWER(TRIM(COALESCE(sii.source_type,'')))=LOWER(TRIM(COALESCE(prl.resource_kind,'')))
         AND sii.external_key=prl.source_key AND COALESCE(sii.is_active,1)=1
        LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id
        ORDER BY prl.product_id,prl.sort_order,prl.product_resource_link_id
        LIMIT ?
      `).bind(limit*2).all(),
      db.prepare(`
        SELECT site_item_inventory_id,
               COALESCE(SUM(CASE WHEN movement_type IN ('reserve','release')
                 THEN COALESCE(new_reserved_quantity,0)-COALESCE(previous_reserved_quantity,0) ELSE 0 END),0) movement_reserved_delta,
               COALESCE(SUM(CASE WHEN movement_type IN ('reserve','release') AND note LIKE 'Product %'
                 THEN COALESCE(new_reserved_quantity,0)-COALESCE(previous_reserved_quantity,0) ELSE 0 END),0) product_reserved_delta,
               SUM(CASE WHEN movement_type IN ('reserve','release') THEN 1 ELSE 0 END) reserve_release_events,
               SUM(CASE WHEN movement_type IN ('reserve','release') AND note LIKE 'Product %' THEN 1 ELSE 0 END) product_reservation_events,
               MAX(CASE WHEN movement_type IN ('reserve','release') THEN created_at END) last_reservation_event_at
        FROM site_inventory_movements
        GROUP BY site_item_inventory_id
      `).all(),
      db.prepare(`
        SELECT r.creative_project_material_review_id,r.creative_work_project_id,r.creative_work_event_id,
               r.review_status,COALESCE(r.inventory_consumed,0) inventory_consumed,
               ip.creative_project_inventory_post_id,ip.site_item_inventory_id,ip.posted_at,
               iud.creative_project_inventory_usage_detail_id,
               COALESCE(iud.usage_quantity_consumed,ip.stock_quantity_consumed,0) usage_quantity_consumed,
               COALESCE(iud.stock_quantity_consumed,ip.stock_quantity_consumed,0) stock_quantity_consumed,
               COALESCE(iud.tracking_mode,'') posted_tracking_mode
        FROM creative_project_material_reviews r
        LEFT JOIN creative_project_inventory_posts ip ON ip.creative_project_material_review_id=r.creative_project_material_review_id
        LEFT JOIN creative_project_inventory_usage_details iud ON iud.creative_project_inventory_post_id=ip.creative_project_inventory_post_id
        ORDER BY r.creative_project_material_review_id DESC
        LIMIT ?
      `).bind(limit*2).all(),
      db.prepare(`
        SELECT prm.product_production_run_material_id,prm.product_production_run_id,r.product_id,p.name product_name,
               r.run_status,r.output_quantity,r.posted_at,prm.site_item_inventory_id,prm.resource_kind,prm.source_key,
               prm.consumption_mode,prm.tracking_mode,prm.usage_quantity,prm.stock_quantity_consumed,prm.unit_cost_cents
        FROM product_production_run_materials prm
        JOIN product_production_runs r ON r.product_production_run_id=prm.product_production_run_id
        LEFT JOIN products p ON p.product_id=r.product_id
        ORDER BY prm.product_production_run_material_id DESC
        LIMIT ?
      `).bind(limit*2).all(),
      db.prepare(`
        SELECT t.inventory_kit_template_id,t.template_name,t.kit_inventory_item_id,
               parent.item_name kit_item_name,parent.on_hand_quantity kit_on_hand_quantity,parent.reserved_quantity kit_reserved_quantity,
               (SELECT COUNT(*) FROM inventory_kit_template_components c WHERE c.inventory_kit_template_id=t.inventory_kit_template_id) template_component_count,
               (SELECT COUNT(*) FROM inventory_kit_open_events e WHERE e.inventory_kit_template_id=t.inventory_kit_template_id) open_event_count,
               (SELECT COUNT(*) FROM inventory_kit_open_components oc JOIN inventory_kit_open_events e
                   ON e.inventory_kit_open_event_id=oc.inventory_kit_open_event_id
                 WHERE e.inventory_kit_template_id=t.inventory_kit_template_id) open_component_evidence_count,
               (SELECT MAX(e.opened_at) FROM inventory_kit_open_events e WHERE e.inventory_kit_template_id=t.inventory_kit_template_id) last_opened_at
        FROM inventory_kit_templates t
        JOIN site_item_inventory parent ON parent.site_item_inventory_id=t.kit_inventory_item_id
        WHERE COALESCE(t.is_active,1)=1
        ORDER BY LOWER(t.template_name),t.inventory_kit_template_id
        LIMIT ?
      `).bind(Math.min(250,limit)).all(),
      db.prepare(`
        SELECT c.inventory_kit_template_component_id,c.inventory_kit_template_id,t.template_name,
               c.component_inventory_item_id,c.component_name,c.quantity_per_kit,c.usage_tracking_mode,
               child.item_name child_item_name,COALESCE(child.on_hand_quantity,0) child_on_hand_quantity,
               COALESCE(child.reserved_quantity,0) child_reserved_quantity
        FROM inventory_kit_template_components c
        JOIN inventory_kit_templates t ON t.inventory_kit_template_id=c.inventory_kit_template_id AND COALESCE(t.is_active,1)=1
        LEFT JOIN site_item_inventory child ON child.site_item_inventory_id=c.component_inventory_item_id AND COALESCE(child.is_active,1)=1
        ORDER BY c.inventory_kit_template_id,c.sort_order,c.inventory_kit_template_component_id
        LIMIT ?
      `).bind(limit).all()
    ]);

    const reconciliation=buildInventoryMaterialUsageReconciliation({
      inventoryItems:rows(inventoryResult),
      productLinks:rows(productLinkResult),
      reservationEvidence:rows(reservationResult),
      creativeEvidence:rows(creativeResult),
      productUsageEvidence:rows(productUsageResult),
      kitTemplates:rows(kitTemplateResult),
      kitComponents:rows(kitComponentResult),
    });

    return json({
      ok:true,release:RELEASE,build:BUILD,title:TITLE,
      authority:'release467-build112-inventory-material-usage-reconciliation',
      role:'read_only_inventory_material_usage_reconciliation',
      requested_by:{user_id:Number(adminUser.user_id||0)||null,role:adminUser.role||null},
      generated_at:new Date().toISOString(),
      reconciliation,
      evidence_limits:{inventory:limit,product_links:limit*2,creative_usage:limit*2,product_usage:limit*2,kits:Math.min(250,limit),kit_components:limit},
      owner_routes:{
        inventory:'/admin/inventory-operations/',
        product:'/admin/catalog/',
        creator:'/admin/creator/',
        finance:'/admin/finance/'
      },
      truth_notes:[
        'Build 112 reconciles existing evidence; it does not create, reserve, release, consume, reverse, receive, open kits, post production, change costs, or repair stock.',
        'Current reserved_quantity is aggregate Inventory authority. Product-specific reservation ownership is never invented when provenance is ambiguous.',
        'Kit child balances are aggregate remnant evidence after kit opening, not guaranteed origin-specific remnants when child stock has mixed sources.',
        'Current cost authority remains site_item_inventory.unit_cost_cents; cost history remains optional evidence only.'
      ],
      safety:{
        endpoint_get_only:true,automatic_repair:false,synthetic_stock_movement:false,new_inventory_mutation:false,
        new_product_mutation:false,new_creative_mutation:false,finance_posting:false,request_time_schema_mutation:false,
        r2_mutation:false,provider_execution:false,provider_publication:false,production_mutation:false
      }
    });
  } catch(error) {
    await captureRuntimeIncident(context.env,context.request,error,{area:'inventory_material_usage_reconciliation',operation:'get'}).catch(()=>{});
    return json({ok:false,release:RELEASE,build:BUILD,title:TITLE,error:'Inventory & Material-Usage reconciliation failed safely.',detail:String(error?.message||error),safety:{read_only:true,automatic_repair:false}},503);
  }
}
