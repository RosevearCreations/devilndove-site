// Release 467 Build 388: manual, read-only inventory count/unit/cost and purchase-tax receipt review.
// All values are operator-entered estimates. A receipt is NOT an invoice or a tax credit.
import {getDb,getAdminUserFromRequest,jsonResponse} from '../_lib/adminAudit.js';
const json=(v,status=200)=>jsonResponse(v,status,{'Cache-Control':'no-store'});
const integer=v=>{const n=Number(v);return Number.isSafeInteger(n)&&n>0?n:0;};
export async function onRequestGet({request,env}){
 const admin=await getAdminUserFromRequest(request,env);if(!admin)return json({ok:false,error:'Admin access required'},401);
 const db=getDb(env);if(!db)return json({ok:false,error:'Inventory database is unavailable'},503);
 const q=new URL(request.url).searchParams;
 const id=integer(q.get('inventory_id'));const limit=Math.min(40,Math.max(1,integer(q.get('limit'))||25));
 try{
  const query=`SELECT r.inventory_quick_edit_receipt_id AS receipt_id,r.site_item_inventory_id AS inventory_id,
 r.committed_at,r.actor_user_id,r.prior_on_hand_quantity,r.new_on_hand_quantity,r.prior_unit_cost_cents,
 r.net_unit_cost_cents,r.tax_rate_basis_points,r.tax_included,r.tax_estimate_cents,r.gross_unit_cost_cents,
 r.purchase_cost_entered_cents,r.stock_unit_label,r.usage_unit_label,r.usage_units_per_stock_unit,
 r.source_movement_id,r.note,i.item_name,i.source_type,i.on_hand_quantity AS current_on_hand_quantity,
 i.unit_cost_cents AS current_unit_cost_cents,i.stock_unit_label AS current_stock_unit_label,
 i.usage_unit_label AS current_usage_unit_label,i.usage_units_per_stock_unit AS current_units_per_stock,
 m.site_inventory_movement_id AS linked_source_movement_id
 FROM inventory_quick_edit_receipts r
 JOIN site_item_inventory i ON i.site_item_inventory_id=r.site_item_inventory_id
 LEFT JOIN site_inventory_movements m ON m.site_inventory_movement_id=r.source_movement_id
 WHERE (?=0 OR r.site_item_inventory_id=?)
 ORDER BY r.inventory_quick_edit_receipt_id DESC LIMIT ?`;
  const result=await db.prepare(query).bind(id,id,limit+1).all();
  const a=Array.isArray(result?.results)?result.results:[];
  const items=a.slice(0,limit).map(row=>({
   ...row,
   source_confirmed:Number(row.linked_source_movement_id||0)===Number(row.source_movement_id||-1),
   count_changed_since_receipt:Number(row.current_on_hand_quantity)!==Number(row.new_on_hand_quantity),
   cost_changed_since_receipt:Number(row.current_unit_cost_cents)!==Number(row.net_unit_cost_cents),
   unit_changed_since_receipt:String(row.current_stock_unit_label)!==String(row.stock_unit_label)||
    String(row.current_usage_unit_label)!==String(row.usage_unit_label)||
    Number(row.current_units_per_stock)!==Number(row.usage_units_per_stock_unit),
   invoice_verified:false,tax_credit_confirmed:false
  }));
  return json({ok:true,release:467,build:388,items,has_more:a.length>limit,
   displayed_count:items.length,read_only:true,
   evidence_kind:'source-linked operator entry; purchase tax estimate; supplier invoice not verified',
   no_automatic_reconciliation:true,no_automatic_input_tax_credit:true,
   max_rows:limit});
 }catch{return json({ok:false,error:'Source-linked tax receipt review is unavailable. No Inventory records were changed.',retry_automatically:false},503);}
}
