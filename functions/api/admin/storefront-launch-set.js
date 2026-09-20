// Release 467 Build 204 — Storefront Launch Set & Autonomous Closure.
// Read-only launch-set convergence over existing buyer, Product media, Inventory/resource and cost evidence.
// No Product publication, Inventory/cost write, R2 mutation, provider/payment execution or accounting posting.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { buildReadBudgetHeaders } from '../_lib/d1ReadBudget.js';
import { analyze as analyzeBuyerReadiness } from './product-buyer-readiness.js';
import { policyPublicSnapshot } from '../../../public/js/commerce-policy-core.js';

const BUILD=204, MAX_SOURCE_ROWS=240, MAX_ROWS=40;
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const text=(v)=>normalizeText(v);
const n=(v)=>Number(v||0);
const json=(data,status=200,routeKey='admin_storefront_launch_set_v204',limit=MAX_ROWS)=>jsonResponse(
  {release:467,build:BUILD,read_only:true,automatic_publish:false,provider_execution:false,...data},
  status,
  {'Cache-Control':'no-store',...buildReadBudgetHeaders(routeKey,{limit})}
);

const PROJECTION=`
WITH product_base AS (
  SELECT *
  FROM products
  WHERE LOWER(TRIM(COALESCE(status,'draft'))) NOT IN ('archived','deleted')
    AND (?=0 OR product_id=?)
  ORDER BY updated_at DESC,product_id DESC
  LIMIT ?
),
role_by_image AS (
  SELECT pia.product_image_id,MAX(CASE WHEN TRIM(COALESCE(pia.image_role,''))<>'' THEN 1 ELSE 0 END) has_role
  FROM product_image_annotations pia
  JOIN product_images pi0 ON pi0.product_image_id=pia.product_image_id
  JOIN product_base pb0 ON pb0.product_id=pi0.product_id
  GROUP BY pia.product_image_id
),
image_stats AS (
  SELECT pi.product_id,
    COUNT(*) image_count,
    SUM(CASE WHEN LENGTH(TRIM(COALESCE(pi.alt_text,'')))<12 THEN 1 ELSE 0 END) alt_attention,
    SUM(CASE WHEN COALESCE(rbi.has_role,0)=0 THEN 1 ELSE 0 END) role_attention,
    SUM(CASE WHEN TRIM(COALESCE(pi.image_url,''))<>'' AND LOWER(TRIM(pi.image_url)) NOT LIKE 'https://assets.devilndove.com/%' THEN 1 ELSE 0 END) image_source_attention
  FROM product_images pi
  JOIN product_base pb ON pb.product_id=pi.product_id
  LEFT JOIN role_by_image rbi ON rbi.product_image_id=pi.product_image_id
  GROUP BY pi.product_id
),
featured_match AS (
  SELECT pb.product_id,
    CASE WHEN TRIM(COALESCE(pb.featured_image_url,''))<>'' AND
      SUM(CASE WHEN TRIM(COALESCE(pi.image_url,''))=TRIM(COALESCE(pb.featured_image_url,'')) THEN 1 ELSE 0 END)=0
    THEN 1 ELSE 0 END featured_not_in_gallery
  FROM product_base pb
  LEFT JOIN product_images pi ON pi.product_id=pb.product_id
  GROUP BY pb.product_id,pb.featured_image_url
),
inventory_ranked AS (
  SELECT site_item_inventory_id,
    LOWER(TRIM(COALESCE(source_type,''))) item_kind_norm,
    LOWER(TRIM(COALESCE(external_key,''))) source_key_norm,
    COALESCE(is_active,1) is_active,
    COALESCE(unit_cost_cents,0) unit_cost_cents,
    updated_at inventory_updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(COALESCE(source_type,''))),LOWER(TRIM(COALESCE(external_key,'')))
      ORDER BY COALESCE(is_active,1) DESC,site_item_inventory_id DESC
    ) rn
  FROM site_item_inventory
  WHERE LOWER(TRIM(COALESCE(source_type,''))) IN ('tool','supply')
),
resource_facts AS (
  SELECT prl.product_id,prl.product_resource_link_id,
    ir.site_item_inventory_id,COALESCE(ir.is_active,0) inventory_active,COALESCE(ir.unit_cost_cents,0) unit_cost_cents,
    COALESCE(siup.usage_tracking_mode,CASE WHEN LOWER(TRIM(COALESCE(prl.resource_kind,'')))='tool' THEN 'reusable' ELSE 'exact' END) usage_tracking_mode,
    CASE WHEN COALESCE(prl.consumption_mode,'per_unit')='story_only'
      OR (LOWER(TRIM(COALESCE(prl.resource_kind,'')))='tool'
          AND LOWER(TRIM(COALESCE(siup.usage_tracking_mode,'reusable'))) IN ('reusable','log_only'))
      THEN 0 ELSE 1 END cost_required
  FROM product_resource_links prl
  JOIN product_base pb ON pb.product_id=prl.product_id
  LEFT JOIN inventory_ranked ir
    ON ir.rn=1
   AND ir.item_kind_norm=LOWER(TRIM(COALESCE(prl.resource_kind,'')))
   AND ir.source_key_norm=LOWER(TRIM(COALESCE(prl.source_key,'')))
  LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=ir.site_item_inventory_id
),
resource_stats AS (
  SELECT product_id,
    COUNT(*) linked_resource_count,
    SUM(CASE WHEN site_item_inventory_id IS NULL THEN 1 ELSE 0 END) missing_inventory_matches,
    SUM(CASE WHEN site_item_inventory_id IS NOT NULL AND inventory_active<>1 THEN 1 ELSE 0 END) inactive_inventory_links,
    SUM(CASE WHEN cost_required=1 AND (site_item_inventory_id IS NULL OR unit_cost_cents<=0) THEN 1 ELSE 0 END) unknown_cost_links,
    SUM(CASE WHEN cost_required=1 AND site_item_inventory_id IS NOT NULL AND unit_cost_cents>0 THEN 1 ELSE 0 END) known_cost_links,
    SUM(CASE WHEN cost_required=0 THEN 1 ELSE 0 END) nondepleting_links
  FROM resource_facts GROUP BY product_id
)
SELECT p.product_id,p.product_number,p.name,p.slug,p.sku,p.product_category,p.product_type,p.status,p.review_status,
  p.short_description,p.description,p.price_cents,p.compare_at_price_cents,p.currency,
  p.requires_shipping,p.shipping_code,p.weight_grams,p.inventory_tracking,p.inventory_quantity,
  p.digital_file_url,p.merchandise_origin,p.sale_channel,p.external_listing_url,p.external_listing_label,
  p.condition_summary,p.era_label,p.featured_image_url,p.updated_at,
  COALESCE(img.image_count,0) image_count,COALESCE(img.alt_attention,0) alt_attention,
  COALESCE(img.role_attention,0) role_attention,COALESCE(img.image_source_attention,0) image_source_attention,
  COALESCE(fm.featured_not_in_gallery,0) featured_not_in_gallery,
  COALESCE(rs.linked_resource_count,0) linked_resource_count,
  COALESCE(rs.missing_inventory_matches,0) missing_inventory_matches,
  COALESCE(rs.inactive_inventory_links,0) inactive_inventory_links,
  COALESCE(rs.unknown_cost_links,0) unknown_cost_links,
  COALESCE(rs.known_cost_links,0) known_cost_links,
  COALESCE(rs.nondepleting_links,0) nondepleting_links
FROM product_base p
LEFT JOIN image_stats img ON img.product_id=p.product_id
LEFT JOIN featured_match fm ON fm.product_id=p.product_id
LEFT JOIN resource_stats rs ON rs.product_id=p.product_id
ORDER BY p.updated_at DESC,p.product_id DESC
`

function reason(code,area,label,href){
  return {code,area,label,repair_href:href||null,automatic_fix:false};
}
function productEditor(productId,tab='basics',focus=''){
  return '/admin/product-editor/?product_id='+productId+'&tab='+encodeURIComponent(tab)+(focus?'&focus='+encodeURIComponent(focus):'');
}
function evidenceToken(row={}){
  return [
    row.product_id,row.updated_at,row.status,row.review_status,row.price_cents,row.currency,row.inventory_quantity,
    row.featured_image_url,row.image_count,row.alt_attention,row.role_attention,row.image_source_attention,row.featured_not_in_gallery,
    row.linked_resource_count,row.missing_inventory_matches,row.inactive_inventory_links,row.unknown_cost_links,row.known_cost_links,row.nondepleting_links
  ].map(v=>text(v)).join('|');
}
function classify(row={}){
  const productId=n(row.product_id);
  const buyer=analyzeBuyerReadiness(row);
  const reviewReasons=[];
  const externalReasons=[];
  for(const issue of buyer.blocking_issues||[]){
    reviewReasons.push(reason('buyer_'+issue.code,'buyer',issue.label,issue.fix?.href_template?.replace('{product_id}',String(productId))||productEditor(productId)));
  }
  if(n(row.inventory_tracking)===1 && n(row.inventory_quantity)<=0){
    reviewReasons.push(reason('tracked_finished_stock_zero','inventory','Tracked finished stock is zero',productEditor(productId,'pricing','inventory_quantity')));
  }
  if(!buyer.public_visibility?.catalog_search_visible){
    reviewReasons.push(reason('not_publicly_visible','publication','Product is not currently public under status/review/slug rules',productEditor(productId,'basics','review_status')));
  }

  if(!text(row.featured_image_url)) reviewReasons.push(reason('featured_image_missing','media','Featured image is missing','/admin/catalog-media/?product_id='+productId));
  if(n(row.image_count)<3) reviewReasons.push(reason('gallery_depth','media','Fewer than three Product images are evidenced','/admin/catalog-media/?product_id='+productId));
  if(n(row.alt_attention)>0) reviewReasons.push(reason('alt_text_attention','media',n(row.alt_attention)+' Product image(s) need alt-text review','/admin/catalog-media/?product_id='+productId));
  if(n(row.role_attention)>0) reviewReasons.push(reason('image_role_attention','media',n(row.role_attention)+' Product image(s) need role review','/admin/catalog-media/?product_id='+productId));
  if(n(row.image_source_attention)>0) reviewReasons.push(reason('image_source_attention','media',n(row.image_source_attention)+' Product image(s) use non-canonical image references','/admin/catalog-media/?product_id='+productId));
  if(n(row.featured_not_in_gallery)>0) reviewReasons.push(reason('featured_not_in_gallery','media','Featured image is not present in the Product gallery','/admin/catalog-media/?product_id='+productId));

  if(n(row.linked_resource_count)>0 && n(row.missing_inventory_matches)>0){
    reviewReasons.push(reason('linked_inventory_match_missing','inventory',n(row.missing_inventory_matches)+' linked resource(s) do not resolve to Inventory','/admin/inventory-operations/?product_id='+productId+'#productResourcesAdminMount'));
  }
  if(n(row.linked_resource_count)>0 && n(row.inactive_inventory_links)>0){
    reviewReasons.push(reason('linked_inventory_inactive','inventory',n(row.inactive_inventory_links)+' linked Inventory resource(s) are inactive','/admin/inventory-operations/?product_id='+productId+'#productResourcesAdminMount'));
  }
  if(n(row.linked_resource_count)>0 && n(row.unknown_cost_links)>0){
    reviewReasons.push(reason('linked_cost_unknown','cost',n(row.unknown_cost_links)+' required linked-resource cost(s) remain unknown','/admin/inventory-operations/?product_id='+productId+'#costMarginReadinessMount'));
  }

  const currency=(text(row.currency)||'CAD').toUpperCase();
  if(currency!=='CAD') externalReasons.push(reason('commerce_currency_outside_current_storefront','commerce','Current storefront policy accepts CAD only',productEditor(productId,'pricing','currency')));
  if(text(row.sale_channel).toLowerCase()==='external_only') externalReasons.push(reason('external_only_sale_channel','commerce','Product sale channel is external-only',productEditor(productId,'description','sale_channel')));

  const status=externalReasons.length?'externally_blocked':reviewReasons.length?'review_required':'ready';
  return {
    product_id:productId,
    product_number:row.product_number||null,
    name:text(row.name),
    slug:text(row.slug),
    sku:text(row.sku),
    status,
    launch_ready:status==='ready',
    review_reasons:reviewReasons,
    external_reasons:externalReasons,
    all_reasons:[...externalReasons,...reviewReasons],
    buyer:{
      blocker_count:n(buyer.blocker_count),
      attention_count:n(buyer.attention_count),
      score:n(buyer.score),
      ready_for_buyer_review:Boolean(buyer.ready_for_buyer_review),
      public_visibility:buyer.public_visibility,
    },
    inventory:{
      tracking:n(row.inventory_tracking)===1,
      finished_quantity:n(row.inventory_quantity),
      linked_resource_count:n(row.linked_resource_count),
      missing_inventory_matches:n(row.missing_inventory_matches),
      inactive_inventory_links:n(row.inactive_inventory_links),
    },
    media:{
      featured_present:Boolean(text(row.featured_image_url)),
      image_count:n(row.image_count),
      alt_attention:n(row.alt_attention),
      role_attention:n(row.role_attention),
      image_source_attention:n(row.image_source_attention),
      featured_not_in_gallery:n(row.featured_not_in_gallery),
      ready:Boolean(text(row.featured_image_url))&&n(row.image_count)>=3&&n(row.alt_attention)===0&&n(row.role_attention)===0&&n(row.image_source_attention)===0&&n(row.featured_not_in_gallery)===0,
    },
    cost:{
      linked_resource_count:n(row.linked_resource_count),
      unknown_cost_links:n(row.unknown_cost_links),
      known_cost_links:n(row.known_cost_links),
      nondepleting_links:n(row.nondepleting_links),
      readiness:n(row.linked_resource_count)===0?'not_evaluated_no_links':n(row.unknown_cost_links)===0?'ready':'review',
      scope:'linked_resources_only_not_full_accounting_profit',
    },
    publication:{
      currently_public:Boolean(buyer.public_visibility?.catalog_search_visible),
      automatic_publish:false,
      manual_owner:'Product Editor',
    },
    commerce:{
      currency,
      sale_channel:text(row.sale_channel).toLowerCase()||'onsite',
      canada_only:true,
      united_states_sales_enabled:false,
      united_states_shipping_enabled:false,
    },
    updated_at:row.updated_at||null,
    evidence_token:evidenceToken(row),
    repair_hrefs:{
      product:productEditor(productId),
      media:'/admin/catalog-media/?product_id='+productId,
      inventory:'/admin/inventory-operations/?product_id='+productId,
      cost:'/admin/inventory-operations/?product_id='+productId+'#costMarginReadinessMount',
      public:buyer.public_visibility?.public_url||'',
    },
  };
}

async function loadProjection(db,productId=0,limit=MAX_SOURCE_ROWS){
  const result=await db.prepare(PROJECTION).bind(productId,productId,Math.max(1,Math.min(MAX_SOURCE_ROWS,limit))).all();
  return rows(result).map(classify);
}
function summary(items=[]){
  const count=(status)=>items.filter(x=>x.status===status).length;
  return {
    products_reviewed:items.length,
    ready:count('ready'),
    review_required:count('review_required'),
    externally_blocked:count('externally_blocked'),
    publicly_visible:items.filter(x=>x.publication.currently_public).length,
    held_from_public:items.filter(x=>!x.publication.currently_public).length,
    media_ready:items.filter(x=>x.media.ready).length,
    tracked_zero_stock:items.filter(x=>x.inventory.tracking&&x.inventory.finished_quantity<=0).length,
    products_with_linked_resources:items.filter(x=>x.cost.linked_resource_count>0).length,
    products_with_unknown_linked_cost:items.filter(x=>x.cost.unknown_cost_links>0).length,
    products_with_missing_linked_inventory:items.filter(x=>x.inventory.missing_inventory_matches>0).length,
  };
}

export async function onRequestGet({request,env}){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return json({ok:false,error:'Admin access required.'},401);
  const db=getDb(env);
  if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const url=new URL(request.url);
  const mode=text(url.searchParams.get('mode')||'queue').toLowerCase();
  const q=text(url.searchParams.get('q')).toLowerCase().slice(0,100);
  const statusFilter=text(url.searchParams.get('status')||'all').toLowerCase();
  if(!['all','ready','review_required','externally_blocked'].includes(statusFilter))return json({ok:false,error:'Unsupported launch-set status filter.'},400);
  const limit=Math.max(1,Math.min(MAX_ROWS,Number(url.searchParams.get('limit')||MAX_ROWS)));
  try{
    if(mode==='product'){
      const productId=Number(url.searchParams.get('product_id')||0);
      if(!Number.isInteger(productId)||productId<=0)return json({ok:false,error:'A positive product_id is required.'},400,'admin_storefront_launch_recheck_v204',1);
      const items=await loadProjection(db,productId,1);
      if(!items.length)return json({ok:false,error:'Storefront launch-set Product was not found.'},404,'admin_storefront_launch_recheck_v204',1);
      const product=items[0],expected=text(url.searchParams.get('expected_token'));
      return json({
        ok:true,mode,authority:'one_product_launch_evidence',mutation_capability:'none',
        expected_token:expected||null,current_token:product.evidence_token,
        stale_target:Boolean(expected&&expected!==product.evidence_token),
        safe_to_rely:!expected||expected===product.evidence_token,
        product,
      },200,'admin_storefront_launch_recheck_v204',1);
    }
    if(mode!=='queue')return json({ok:false,error:'Unsupported launch-set mode.'},400);
    const all=await loadProjection(db,0,MAX_SOURCE_ROWS);
    const searched=q?all.filter(x=>[x.name,x.slug,x.sku,x.product_number,x.product_id].some(v=>String(v??'').toLowerCase().includes(q))):all;
    const filtered=searched.filter(x=>statusFilter==='all'||x.status===statusFilter);
    const ordered=[...filtered].sort((a,b)=>{
      const rank={externally_blocked:0,review_required:1,ready:2};
      return (rank[a.status]-rank[b.status])||b.all_reasons.length-a.all_reasons.length||a.name.localeCompare(b.name);
    });
    return json({
      ok:true,mode,authority:'live_d1_launch_set_projection',mutation_capability:'none',
      source_limit:MAX_SOURCE_ROWS,source_truncated:all.length>=MAX_SOURCE_ROWS,
      query:q,status_filter:statusFilter,summary:summary(all),matching_products:filtered.length,
      products:ordered.slice(0,limit),
      commerce_policy:policyPublicSnapshot(),
      external_lanes:{
        stripe_development:'HOLD_EXTERNAL',
        paypal_sandbox:'HOLD_EXTERNAL',
        social_oauth:'HOLD_EXTERNAL',
        cloudflare_access:'HOLD_EXTERNAL',
      },
      closure:{
        automatic_publication:false,
        automatic_unpublication:false,
        product_price_write:false,
        inventory_write:false,
        r2_mutation:false,
        provider_execution:false,
        payment_refund:false,
        accounting_posting:false,
        production_data_copy:false,
      },
    });
  }catch(error){
    return json({ok:false,mode,mutation_capability:'none',error:'Storefront launch-set evidence could not be loaded.',detail:text(error?.message||error)},503);
  }
}
