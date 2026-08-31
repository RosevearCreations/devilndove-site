// Release 464 Update 3 — read-only Product material genealogy.
// Existing Inventory/production/order tables are the authority. This route never mutates stock, lots, products or orders.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { CURRENT_RELEASE } from '../_lib/releaseAuthority.js';

const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const id=(v)=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};
const REQUIRED=['products','inventory_purchase_lots','product_production_runs','product_production_run_material_lots','product_finished_inventory_lots','orders','order_items'];
const json=(d,s=200)=>jsonResponse({release:CURRENT_RELEASE,mutation_capability:'none',...d},s,{'Cache-Control':'no-store'});

async function readiness(db){
  const marks=REQUIRED.map(()=>'?').join(',');
  const found=rows(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${marks})`).bind(...REQUIRED).all().catch(()=>({results:[]})));
  const set=new Set(found.map((r)=>String(r.name||'')));const missing=REQUIRED.filter((n)=>!set.has(n));
  return {schema_ready:missing.length===0,missing_tables:missing};
}

export async function onRequestGet({request,env}){
  const user=await getAdminUserFromRequest(request,env);if(!user)return json({ok:false,error:'Admin access required.'},401);
  const db=getDb(env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const productId=id(new URL(request.url).searchParams.get('product_id'));if(!productId)return json({ok:false,error:'product_id is required.'},400);
  const ready=await readiness(db);if(!ready.schema_ready)return json({ok:false,code:'genealogy_schema_not_ready',...ready,error:`Material genealogy authority is missing: ${ready.missing_tables.join(', ')}`},503);
  try{
    const product=await db.prepare(`SELECT product_id,name,slug,sku,status,merchandise_origin,inventory_tracking,inventory_quantity FROM products WHERE product_id=? LIMIT 1`).bind(productId).first();
    if(!product)return json({ok:false,error:'Product not found.'},404);
    const [runsR,materialLotsR,finishedR,salesR]=await Promise.all([
      db.prepare(`SELECT product_production_run_id,run_key,product_id,output_quantity,output_unit_label,run_status,posted_at,created_at FROM product_production_runs WHERE product_id=? ORDER BY COALESCE(posted_at,created_at) DESC,product_production_run_id DESC LIMIT 100`).bind(productId).all(),
      db.prepare(`SELECT ml.product_production_run_material_lot_id,ml.product_production_run_id,ml.inventory_purchase_lot_id,ml.site_item_inventory_id,ml.allocation_sequence,ml.allocation_method,ml.lot_code_snapshot,ml.quantity_consumed,ml.stock_unit_label,ml.unit_cost_cents,ml.landed_unit_cost_cents,ml.extended_cost_cents,ml.supplier_name_snapshot,ml.supplier_sku_snapshot,ml.source_url_snapshot,ml.purchase_date_snapshot,ml.received_date_snapshot,ml.expiry_date_snapshot,ipl.quantity_received,ipl.quantity_remaining,ipl.lot_status FROM product_production_run_material_lots ml JOIN product_production_runs r ON r.product_production_run_id=ml.product_production_run_id LEFT JOIN inventory_purchase_lots ipl ON ipl.inventory_purchase_lot_id=ml.inventory_purchase_lot_id WHERE r.product_id=? ORDER BY r.product_production_run_id DESC,ml.allocation_sequence,ml.product_production_run_material_lot_id`).bind(productId).all(),
      db.prepare(`SELECT product_finished_inventory_lot_id,lot_key,product_id,product_production_run_id,source_kind,quantity_created,unit_material_cost_cents,lot_status,created_at,updated_at FROM product_finished_inventory_lots WHERE product_id=? ORDER BY created_at DESC,product_finished_inventory_lot_id DESC`).bind(productId).all(),
      db.prepare(`SELECT oi.order_item_id,oi.order_id,oi.quantity,o.order_status,o.created_at FROM order_items oi JOIN orders o ON o.order_id=oi.order_id WHERE oi.product_id=? ORDER BY o.created_at DESC,oi.order_item_id DESC LIMIT 200`).bind(productId).all()
    ]);
    const runs=rows(runsR),materials=rows(materialLotsR),finished=rows(finishedR),sales=rows(salesR);
    const purchaseIds=[...new Set(materials.map((r)=>Number(r.inventory_purchase_lot_id||0)).filter(Boolean))];
    let purchaseLots=[];
    if(purchaseIds.length){
      const marks=purchaseIds.map(()=>'?').join(',');
      purchaseLots=rows(await db.prepare(`SELECT inventory_purchase_lot_id,site_item_inventory_id,lot_code,purchase_date,received_date,supplier_name,supplier_order_number,supplier_sku,quantity_received,quantity_remaining,unit_cost_cents,shipping_cost_cents,tax_cost_cents,expiry_date,lot_status FROM inventory_purchase_lots WHERE inventory_purchase_lot_id IN (${marks}) ORDER BY COALESCE(received_date,purchase_date,created_at),inventory_purchase_lot_id`).bind(...purchaseIds).all());
    }
    const committed=sales.filter((r)=>['pending','paid','fulfilled'].includes(String(r.order_status||'').toLowerCase())).reduce((n,r)=>n+Number(r.quantity||0),0);
    const completed=sales.filter((r)=>['paid','fulfilled'].includes(String(r.order_status||'').toLowerCase())).reduce((n,r)=>n+Number(r.quantity||0),0);
    const forwardProvenance=String(product.merchandise_origin||'').toLowerCase()==='made_in_house';
    return json({
      ok:true,...ready,product,purchase_lots:purchaseLots,production_runs:runs,material_lot_allocations:materials,finished_inventory_lots:finished,order_lines:sales,
      summary:{
        purchase_lot_count:purchaseLots.length,production_run_count:runs.length,material_lot_allocation_count:materials.length,
        finished_lot_count:finished.length,order_line_count:sales.length,committed_quantity:committed,paid_or_fulfilled_quantity:completed,
        forward_genealogy_complete:forwardProvenance ? Boolean(materials.length&&finished.length) : Boolean(finished.length||sales.length),
        historical_reconstruction_claimed:false
      },
      authority:'purchase lot → posted production-run allocation → finished inventory lot → order commitment/sale',
      historical_boundary:'Pre-cutover stock remains explicit legacy opening balance; historical production/sales are not fabricated.'
    });
  }catch(e){return json({ok:false,error:e?.message||'Product genealogy trace could not load.'},500);}
}
