// Release 467 Build 203 — Cost Evidence & Margin Readiness.
// Read-only orchestration over existing Product-resource and Inventory cost authorities.
// Missing cost is unknown, never zero. No accounting, Inventory, Product, purchasing or payment mutation.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { buildReadBudgetHeaders } from '../_lib/d1ReadBudget.js';

const BUILD=203, MAX_ROWS=40;
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const n=(v)=>Number(v||0);
const text=(v)=>normalizeText(v);
const json=(data,status=200,routeKey='admin_cost_margin_readiness_v203',limit=MAX_ROWS)=>jsonResponse(
  {release:467,build:BUILD,read_only:true,unknown_cost_policy:'unknown_never_zero',...data},
  status,
  {'Cache-Control':'no-store',...buildReadBudgetHeaders(routeKey,{limit})}
);

const CTE=`
WITH inventory_ranked AS (
  SELECT site_item_inventory_id,
    LOWER(TRIM(COALESCE(source_type,''))) item_kind_norm,
    LOWER(TRIM(COALESCE(external_key,''))) source_key_norm,
    COALESCE(is_active,1) is_active,
    COALESCE(item_name,'') item_name,
    COALESCE(unit_cost_cents,0) unit_cost_cents,
    COALESCE(stock_unit_label,'unit') stock_unit_label,
    COALESCE(usage_unit_label,'unit') usage_unit_label,
    COALESCE(NULLIF(usage_units_per_stock_unit,0),1) usage_units_per_stock_unit,
    updated_at inventory_updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(COALESCE(source_type,''))),LOWER(TRIM(COALESCE(external_key,'')))
      ORDER BY COALESCE(is_active,1) DESC,site_item_inventory_id DESC
    ) rn
  FROM site_item_inventory
  WHERE LOWER(TRIM(COALESCE(source_type,''))) IN ('tool','supply')
),
link_facts AS (
  SELECT prl.product_resource_link_id,prl.product_id,p.name product_name,p.sku,p.price_cents,p.currency,
    LOWER(TRIM(COALESCE(prl.resource_kind,''))) resource_kind,
    TRIM(COALESCE(prl.source_key,'')) source_key,
    COALESCE(NULLIF(TRIM(ir.item_name),''),TRIM(COALESCE(prl.source_key,''))) resource_name,
    COALESCE(prl.quantity_used,0) quantity_used,
    COALESCE(prl.consumption_mode,'per_unit') consumption_mode,
    COALESCE(NULLIF(prl.lot_size_units,0),1) lot_size_units,
    ir.site_item_inventory_id,COALESCE(ir.is_active,0) inventory_active,
    COALESCE(ir.unit_cost_cents,0) unit_cost_cents,
    COALESCE(ir.stock_unit_label,'unit') stock_unit_label,
    COALESCE(ir.usage_unit_label,'unit') usage_unit_label,
    COALESCE(ir.usage_units_per_stock_unit,1) usage_units_per_stock_unit,
    ir.inventory_updated_at,
    COALESCE(siup.usage_tracking_mode,CASE WHEN LOWER(TRIM(COALESCE(prl.resource_kind,'')))='tool' THEN 'reusable' ELSE 'exact' END) usage_tracking_mode,
    CASE WHEN COALESCE(prl.consumption_mode,'per_unit')='story_only'
          OR (LOWER(TRIM(COALESCE(prl.resource_kind,'')))='tool' AND LOWER(TRIM(COALESCE(siup.usage_tracking_mode,'reusable'))) IN ('reusable','log_only'))
         THEN 0 ELSE 1 END cost_required
  FROM product_resource_links prl
  JOIN products p ON p.product_id=prl.product_id
  LEFT JOIN inventory_ranked ir
    ON ir.rn=1
   AND ir.item_kind_norm=LOWER(TRIM(COALESCE(prl.resource_kind,'')))
   AND ir.source_key_norm=LOWER(TRIM(COALESCE(prl.source_key,'')))
  LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=ir.site_item_inventory_id
),
costed AS (
  SELECT lf.*,
    CASE
      WHEN cost_required=0 THEN 'not_applicable'
      WHEN site_item_inventory_id IS NULL THEN 'unknown_inventory_match'
      WHEN unit_cost_cents<=0 THEN 'unknown_missing_cost'
      ELSE 'known'
    END cost_evidence_state,
    CASE
      WHEN cost_required=0 OR site_item_inventory_id IS NULL OR unit_cost_cents<=0 THEN NULL
      WHEN consumption_mode='end_of_lot' THEN CAST(ROUND(1.0*unit_cost_cents/lot_size_units) AS INTEGER)
      ELSE CAST(ROUND(1.0*quantity_used*unit_cost_cents/usage_units_per_stock_unit) AS INTEGER)
    END evidenced_cost_per_product_cents
  FROM link_facts lf
)
`;

function evidenceToken(row={}){
  return [
    row.product_resource_link_id,row.product_id,row.site_item_inventory_id,row.unit_cost_cents,
    row.quantity_used,row.usage_units_per_stock_unit,row.consumption_mode,row.lot_size_units,
    row.usage_tracking_mode,row.inventory_updated_at
  ].map(v=>text(v)).join('|');
}
function shape(row={}){
  const shaped={
    product_resource_link_id:n(row.product_resource_link_id),
    product_id:n(row.product_id),
    product_name:text(row.product_name),
    sku:text(row.sku),
    price_cents:n(row.price_cents),
    currency:text(row.currency)||'CAD',
    resource_kind:text(row.resource_kind).toLowerCase(),
    source_key:text(row.source_key),
    resource_name:text(row.resource_name)||text(row.source_key),
    quantity_used:Number(row.quantity_used||0),
    consumption_mode:text(row.consumption_mode)||'per_unit',
    lot_size_units:Number(row.lot_size_units||1),
    site_item_inventory_id:n(row.site_item_inventory_id),
    inventory_active:n(row.inventory_active),
    unit_cost_cents:n(row.unit_cost_cents),
    stock_unit_label:text(row.stock_unit_label)||'unit',
    usage_unit_label:text(row.usage_unit_label)||'unit',
    usage_units_per_stock_unit:Number(row.usage_units_per_stock_unit||1),
    usage_tracking_mode:text(row.usage_tracking_mode),
    cost_required:n(row.cost_required)===1,
    cost_evidence_state:text(row.cost_evidence_state)||'unknown',
    evidenced_cost_per_product_cents:row.evidenced_cost_per_product_cents==null?null:n(row.evidenced_cost_per_product_cents),
    inventory_updated_at:row.inventory_updated_at||null,
  };
  shaped.evidence_token=evidenceToken(shaped);
  shaped.inventory_repair_href=shaped.site_item_inventory_id
    ? '/admin/inventory-operations/?q='+encodeURIComponent(shaped.source_key||shaped.resource_name||String(shaped.site_item_inventory_id))+'&repair_from=build203#siteInventoryAdminMount'
    : '/admin/inventory-operations/?q='+encodeURIComponent(shaped.source_key||shaped.resource_name)+'&repair_from=build203#siteInventoryAdminMount';
  shaped.product_resource_href='/admin/inventory-operations/?product_id='+shaped.product_id+'&repair_from=build203#productResourcesAdminMount';
  return shaped;
}

async function summary(db){
  const row=await db.prepare(`${CTE},
    product_rollup AS (
      SELECT product_id,
        SUM(CASE WHEN cost_required=1 AND cost_evidence_state<>'known' THEN 1 ELSE 0 END) unknown_cost_links
      FROM costed GROUP BY product_id
    )
    SELECT
      COUNT(*) linked_resources,
      COUNT(DISTINCT product_id) products_with_links,
      SUM(CASE WHEN cost_required=1 AND site_item_inventory_id IS NULL THEN 1 ELSE 0 END) missing_inventory_matches,
      SUM(CASE WHEN cost_evidence_state='unknown_missing_cost' THEN 1 ELSE 0 END) missing_cost_links,
      SUM(CASE WHEN cost_evidence_state='known' THEN 1 ELSE 0 END) known_cost_links,
      SUM(CASE WHEN cost_evidence_state='not_applicable' THEN 1 ELSE 0 END) nondepleting_links,
      (SELECT COUNT(*) FROM product_rollup WHERE unknown_cost_links=0) margin_ready_products,
      (SELECT COUNT(*) FROM product_rollup WHERE unknown_cost_links>0) margin_review_products
    FROM costed`).first();
  return {
    linked_resources:n(row?.linked_resources),
    products_with_links:n(row?.products_with_links),
    missing_inventory_matches:n(row?.missing_inventory_matches),
    missing_cost_links:n(row?.missing_cost_links),
    known_cost_links:n(row?.known_cost_links),
    nondepleting_links:n(row?.nondepleting_links),
    margin_ready_products:n(row?.margin_ready_products),
    margin_review_products:n(row?.margin_review_products),
    margin_scope:'linked_resources_only_not_full_accounting_profit',
  };
}

async function issueRows(db,q,limit){
  const like='%'+String(q||'').toLowerCase()+'%';
  const result=await db.prepare(`${CTE}
    SELECT *
    FROM costed
    WHERE cost_required=1
      AND cost_evidence_state IN ('unknown_inventory_match','unknown_missing_cost')
      AND (
        ?='' OR LOWER(COALESCE(product_name,'')) LIKE ? OR LOWER(COALESCE(sku,'')) LIKE ?
        OR LOWER(COALESCE(resource_name,'')) LIKE ? OR LOWER(COALESCE(source_key,'')) LIKE ?
        OR CAST(product_id AS TEXT)=? OR CAST(product_resource_link_id AS TEXT)=?
      )
    ORDER BY CASE cost_evidence_state WHEN 'unknown_inventory_match' THEN 0 ELSE 1 END,
      LOWER(COALESCE(product_name,'')),product_id,product_resource_link_id
    LIMIT ?`).bind(q,like,like,like,like,q,q,limit).all();
  return rows(result).map(shape);
}

async function record(db,linkId,expectedToken=''){
  const row=await db.prepare(`${CTE}
    SELECT * FROM costed WHERE product_resource_link_id=? LIMIT 1`).bind(linkId).first();
  if(!row)return null;
  const shaped=shape(row);
  return {
    ...shaped,
    expected_token:text(expectedToken)||null,
    current_token:shaped.evidence_token,
    stale_target:Boolean(text(expectedToken)&&text(expectedToken)!==shaped.evidence_token),
    safe_to_rely:!text(expectedToken)||text(expectedToken)===shaped.evidence_token,
    mutation_authority:shaped.site_item_inventory_id?'Inventory Operations':'Product Resources / Inventory identity',
    accounting_profit_claimed:false,
    target_margin_defined:false,
    automatic_cost_write:false,
    accounting_posting:false,
  };
}

export async function onRequestGet({request,env}){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return json({ok:false,error:'Admin access required.'},401);
  const db=getDb(env);
  if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const url=new URL(request.url);
  const mode=text(url.searchParams.get('mode')||'summary').toLowerCase();
  const q=text(url.searchParams.get('q')).slice(0,120);
  const limit=Math.max(1,Math.min(MAX_ROWS,Number(url.searchParams.get('limit')||MAX_ROWS)));
  try{
    if(mode==='summary')return json({ok:true,mode,authority:'live_d1_product_resource_cost_evidence',mutation_capability:'none',summary:await summary(db)});
    if(mode==='issues')return json({ok:true,mode,q,limit,authority:'live_d1_product_resource_cost_evidence',mutation_capability:'none',items:await issueRows(db,q,limit)});
    if(mode==='record'){
      const linkId=Number(url.searchParams.get('link_id')||0);
      if(!Number.isInteger(linkId)||linkId<=0)return json({ok:false,error:'A positive link_id is required.'},400,'admin_cost_margin_recheck_v203',1);
      const evidence=await record(db,linkId,url.searchParams.get('expected_token'));
      if(!evidence)return json({ok:false,error:'Product-resource cost target was not found.'},404,'admin_cost_margin_recheck_v203',1);
      return json({ok:true,mode,authority:'one_product_resource_cost_evidence',mutation_capability:'none',evidence},200,'admin_cost_margin_recheck_v203',1);
    }
    return json({ok:false,error:'Unsupported cost-margin readiness mode.'},400);
  }catch(error){
    return json({ok:false,mode,mutation_capability:'none',error:'Cost and margin readiness evidence could not be loaded.',detail:text(error?.message||error)},503);
  }
}
