// Release 467 Build 387 — explicit guided raw inventory quick edit; no automatic product posting.
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {keyValid,canonical} from './_lib/writeReceipts.js';
import {costTaxEstimate,validQuickEdit} from './_lib/inventoryQuickEdit387.js';
const out=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const integer=x=>Number.isSafeInteger(Number(x))&&Number(x)>0?Number(x):0;
const itemSql=`SELECT site_item_inventory_id,source_type,external_key,item_name,category,is_active,
 on_hand_quantity,reserved_quantity,incoming_quantity,unit_cost_cents,stock_unit_label,
 usage_unit_label,usage_units_per_stock_unit,reorder_level,updated_at
 FROM site_item_inventory WHERE site_item_inventory_id=? LIMIT 1`;
function view(r){return r?{...r,available_quantity:Number(r.on_hand_quantity)-Number(r.reserved_quantity)}:null;}
async function access(request,env){
 const admin=await getAdminUserFromRequest(request,env),db=getDb(env);
 return !admin?{error:out({ok:false,error:'Admin access required'},401)}:!db?{error:out({ok:false,error:'Database unavailable'},503)}:{admin,db};
}
async function hash(body){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(canonical(body))));
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
}
export async function onRequestGet({request,env}){
 const a=await access(request,env);if(a.error)return a.error;
 const query=new URL(request.url).searchParams,checkKey=String(query.get('request_key')||'');
 if(checkKey){
  if(!keyValid(checkKey))return out({ok:false,error:'Invalid receipt key'},400);
  try{const row=await a.db.prepare('SELECT inventory_quick_edit_receipt_id,actor_user_id,committed_at FROM inventory_quick_edit_receipts WHERE request_key=? LIMIT 1').bind(checkKey).first();
   const own=row&&Number(row.actor_user_id)===Number(a.admin.user_id);
   return out({ok:true,found:Boolean(own),receipt_id:own?row.inventory_quick_edit_receipt_id:null,committed_at:own?row.committed_at:null});
  }catch{return out({ok:false,error:'Receipt unavailable'},503);}
 }
 const id=integer(query.get('inventory_id'));
 if(!id)return out({ok:false,error:'Choose a valid Inventory item'},400);
 try{
  const row=await a.db.prepare(itemSql).bind(id).first();
  if(!row||!['tool','supply'].includes(String(row.source_type)))return out({ok:false,error:'Active source-backed Tool or Supply not found'},404);
  return out({ok:true,item:view(row),tax_default_percent:13,tax_default_is_estimate:true,product_post_automatic:false});
 }catch{return out({ok:false,error:'Inventory read unavailable'},503);}
}
export async function onRequestPost({request,env}){
 const a=await access(request,env);if(a.error)return a.error;
 if(request.headers.get('Origin')!==new URL(request.url).origin)return out({ok:false,error:'Same-origin confirmation is required'},403);
 let body;try{body=await request.json()}catch{return out({ok:false,error:'Invalid JSON'},400);}
 const id=integer(body?.inventory_id),key=String(body?.request_key||'');
 if(!id||!keyValid(key))return out({ok:false,error:'Inventory identity and unique operation key are required'},400);
 let v,tax;try{
  v=validQuickEdit(body);
  if(typeof body.cost_dollars!=='string'&&typeof body.cost_dollars!=='number')throw Error('Enter a purchase cost.');
  const entered=Number(body.cost_dollars);
  if(!Number.isFinite(entered)||entered<0||Math.abs(Math.round(entered*100)-entered*100)>1e-7)throw Error('Cost must be nonnegative with no more than two decimals.');
  tax=costTaxEstimate(Math.round(entered*100),Number(body.tax_rate_percent),body.tax_included===true);
 }catch(e){return out({ok:false,error:String(e.message)},400);}
 const actor=integer(a.admin.user_id);
 if(!actor)return out({ok:false,error:'A verified operator identity is required'},403);
 const payload={inventory_id:id,...v,...tax};
 const digest=await hash({actor,...payload});
 const receipt=()=>a.db.prepare(`SELECT request_key,actor_user_id,site_item_inventory_id,payload_sha256,
 inventory_quick_edit_receipt_id,source_movement_id,committed_at,tax_estimate_cents,gross_unit_cost_cents
 FROM inventory_quick_edit_receipts WHERE request_key=? LIMIT 1`).bind(key).first();
 const verify=r=>r&&Number(r.actor_user_id)===actor&&Number(r.site_item_inventory_id)===id&&r.payload_sha256===digest;
 const replay=r=>verify(r)?out({ok:true,replayed:true,receipt_id:r.inventory_quick_edit_receipt_id,movement_id:r.source_movement_id,
  tax_estimate_cents:r.tax_estimate_cents,gross_unit_cost_cents:r.gross_unit_cost_cents,message:'OK — original correction was saved; no duplicate update.'})
  :out({ok:false,code:'KEY_REUSED_FOR_DIFFERENT_EDIT',error:'Original key belongs to a different user or correction; no new update was applied.'},409);
 try{
  const prior=await receipt();if(prior)return replay(prior);
  const old=await a.db.prepare(itemSql).bind(id).first();
  if(!old||!['tool','supply'].includes(old.source_type)||Number(old.is_active)!==1)return out({ok:false,error:'Active inventory source no longer available'},404);
  const expected=body.expected||{};
  if(Number(old.on_hand_quantity)!==Number(expected.on_hand_quantity)||
     Number(old.unit_cost_cents)!==Number(expected.unit_cost_cents)||
     String(old.stock_unit_label)!==String(expected.stock_unit_label)||
     String(old.usage_unit_label)!==String(expected.usage_unit_label)||
     Number(old.usage_units_per_stock_unit)!==Number(expected.usage_units_per_stock_unit))
    return out({ok:false,code:'STALE_INVENTORY',error:'Inventory changed in another tab or session. Reload the item and review the correction.'},409);
  if(v.on_hand_quantity<Number(old.reserved_quantity||0))return out({ok:false,code:'RESERVED_STOCK',error:'Corrected stock cannot be less than stock already reserved.'},409);
  // The receipt trigger aborts the WHOLE D1 batch if the guarded source update or base balance sync did not commit.
  const update=a.db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,unit_cost_cents=?,stock_unit_label=?,usage_unit_label=?,
   usage_units_per_stock_unit=?,last_quick_edit_key=?,last_counted_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
   WHERE site_item_inventory_id=? AND is_active=1
    AND on_hand_quantity=? AND unit_cost_cents=? AND stock_unit_label=? AND usage_unit_label=?
    AND usage_units_per_stock_unit=? AND reserved_quantity<=?`)
   .bind(v.on_hand_quantity,tax.net_unit_cost_cents,v.stock_unit_label,v.usage_unit_label,
    v.usage_units_per_stock_unit,key,id,Number(old.on_hand_quantity),Number(old.unit_cost_cents),
    old.stock_unit_label,old.usage_unit_label,Number(old.usage_units_per_stock_unit),v.on_hand_quantity);
  const base=a.db.prepare(`UPDATE site_inventory_base_balances SET purchase_unit_label=?,base_unit_label=?,base_units_per_purchase_unit=?,
   purchase_unit_cost_cents=?,base_on_hand_quantity=ROUND(? * ?,6),updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP
   WHERE site_item_inventory_id=? AND EXISTS
    (SELECT 1 FROM site_item_inventory i WHERE i.site_item_inventory_id=? AND i.last_quick_edit_key=?)`)
   .bind(v.stock_unit_label,v.usage_unit_label,v.usage_units_per_stock_unit,tax.net_unit_cost_cents,
    v.on_hand_quantity,v.usage_units_per_stock_unit,actor,id,id,key);
  const note=`Build387 ${key}: ${v.note}`;
  const movement=a.db.prepare(`INSERT INTO site_inventory_movements
   (site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,
   previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,
   previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at)
   SELECT i.site_item_inventory_id,i.source_type,i.external_key,i.item_name,'adjustment',?,
   ?,i.on_hand_quantity,i.reserved_quantity,i.reserved_quantity,i.incoming_quantity,i.incoming_quantity,?,?,CURRENT_TIMESTAMP
   FROM site_item_inventory i WHERE i.site_item_inventory_id=? AND i.last_quick_edit_key=?`)
   .bind(v.on_hand_quantity-Number(old.on_hand_quantity),Number(old.on_hand_quantity),note,actor,id,key);
  const entry=a.db.prepare(`INSERT INTO inventory_quick_edit_receipts
   (request_key,actor_user_id,site_item_inventory_id,payload_sha256,prior_on_hand_quantity,new_on_hand_quantity,
   prior_unit_cost_cents,net_unit_cost_cents,tax_rate_basis_points,tax_included,tax_estimate_cents,
   gross_unit_cost_cents,purchase_cost_entered_cents,stock_unit_label,usage_unit_label,
   usage_units_per_stock_unit,source_movement_id,note)
   SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,m.site_inventory_movement_id,?
   FROM site_inventory_movements m WHERE m.site_item_inventory_id=? AND m.actor_user_id=?
     AND m.note=? ORDER BY m.site_inventory_movement_id DESC LIMIT 1`)
   .bind(key,actor,id,digest,Number(old.on_hand_quantity),v.on_hand_quantity,Number(old.unit_cost_cents),
    tax.net_unit_cost_cents,tax.tax_rate_basis_points,tax.tax_included,tax.tax_estimate_cents,
    tax.gross_unit_cost_cents,tax.purchase_cost_entered_cents,v.stock_unit_label,v.usage_unit_label,
    v.usage_units_per_stock_unit,v.note,id,actor,note);
  const results=await a.db.batch([update,base,movement,entry]);
  if(results.some(x=>Number(x?.meta?.changes||0)!==1))return out({ok:false,code:'WRITE_UNCONFIRMED',error:'No confirmed receipt. Verify original Inventory source before retrying.'},503);
  const saved=await receipt();
  if(!verify(saved))return out({ok:false,code:'RECEIPT_UNCONFIRMED',error:'Commit uncertain; check original receipt before retrying.'},503);
  return out({ok:true,replayed:false,receipt_id:saved.inventory_quick_edit_receipt_id,movement_id:saved.source_movement_id,
   tax_estimate_cents:tax.tax_estimate_cents,net_unit_cost_cents:tax.net_unit_cost_cents,
   gross_unit_cost_cents:tax.gross_unit_cost_cents,
   product_preview_invalidated:true,product_inventory_deducted:false,
   message:'OK — inventory correction committed with a source-linked receipt. Re-preview the finished Product before posting.'});
 }catch(e){
  const known=await receipt().catch(()=>null);if(known)return replay(known);
  return out({ok:false,code:'UNKNOWN_OR_CONFLICT',error:'Change not confirmed. Verify the original item and receipt before starting another correction.',retry_automatically:false},503);
 }
}
