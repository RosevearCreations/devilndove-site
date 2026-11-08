// Release 467 Build 639 — explicitly requested, read-only Product stock/commitment proof.
// The Build 440 commitment view covers qualifying post-cutover orders, NOT all
// historical orders or offsite channel reservations. Source lots are not stock.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';

const MAX_UNITS=100000000;
function respond(data,status=200){
  return jsonResponse({build:639,...data},status,{
    'Cache-Control':'no-store','X-DD-Stock-Visibility':'read-only-on-demand-build639'
  });
}
const integer=value=>value!==null&&value!==undefined&&value!==''&&Number.isSafeInteger(Number(value))&&Number(value)>=0&&Number(value)<=MAX_UNITS?Number(value):null;
function verifiedSerial(row){
  if(!row)return {state:'no_serialized_record',description:'No serialized-piece summary was returned; this does not prove an item was never serialized.'};
  const registered=integer(row.serialised_quantity),unavailable=integer(row.unavailable_quantity),available=integer(row.available_quantity);
  if(registered===null||unavailable===null||available===null||unavailable>registered||available>registered)
    return {state:'unverified',description:'Serialized-piece counts were inconsistent; review the finished-piece authority.'};
  return {state:'verified',registered_quantity:registered,unavailable_quantity:unavailable,view_available_quantity:available,
    description:'Unavailable includes serials reserved, sold or without approved quality. It may overlap canonical order commitments; do not subtract it from recorded stock again.'};
}
export async function onRequestGet(context){
  if(!verifiedAdminFromModule(context))return respond({ok:false,error:'Verified administrator required.'},401);
  const idText=new URL(context.request.url).searchParams.get('product_id');
  if(!/^[1-9]\d{0,12}$/.test(idText||'')||!Number.isSafeInteger(Number(idText)))
    return respond({ok:false,error:'Choose one valid saved Product ID.'},400);
  const db=getDb(context.env);if(!db)return respond({ok:false,error:'Database is unavailable.'},503);
  const id=Number(idText);
  try{
    const product=await db.prepare(`SELECT product_id,name,sku,product_type,status,inventory_tracking,inventory_quantity,updated_at
      FROM products WHERE product_id=? LIMIT 1`).bind(id).first();
    if(!product)return respond({ok:false,error:'Product not found.'},404);
    // Missing or broken commitment authority is a HOLD, never zero commitments.
    let commitments;
    try{commitments=await db.prepare(`SELECT committed_quantity FROM product_inventory_active_commitments
      WHERE product_id=? LIMIT 1`).bind(id).first();}
    catch{return respond({ok:false,error:'Canonical order commitments could not be verified. Stock figures are on HOLD.',code:'commitments_unavailable',retry_automatically:false},503);}
    const committed=integer(commitments==null?0:commitments.committed_quantity);
    if(committed===null)return respond({ok:false,error:'Canonical order commitment quantity is invalid. Do not assume zero.',code:'commitments_invalid',retry_automatically:false},503);
    const tracked=Number(product.inventory_tracking)===1&&product.product_type==='physical';
    const onHand=product.inventory_quantity==null?null:integer(product.inventory_quantity);
    const countVerified=tracked&&onHand!==null;
    const remaining=countVerified?Math.max(0,onHand-committed):null;
    const oversubscribed=countVerified?committed>onHand:null;
    let serialised={state:'unavailable',description:'Serialized-piece authority could not be verified; no available count is inferred.'};
    try{
      const row=await db.prepare(`SELECT serialised_quantity,unavailable_quantity,available_quantity
        FROM maker_finished_piece_sellability WHERE product_id=? LIMIT 1`).bind(id).first();
      serialised=verifiedSerial(row);
    }catch{}
    let lotRecords=[],lotState='unavailable',moreLots=false;
    try{
      const rows=await db.prepare(`SELECT product_finished_inventory_lot_id,lot_key,source_kind,lot_status,quantity_created,created_at
        FROM product_finished_inventory_lots WHERE product_id=?
        ORDER BY product_finished_inventory_lot_id DESC LIMIT 7`).bind(id).all();
      if(!Array.isArray(rows?.results))throw Error('No confirmed lot results');
      moreLots=rows.results.length>6;
      lotRecords=rows.results.slice(0,6).map(row=>({id:Number(row.product_finished_inventory_lot_id),
        lot_key:String(row.lot_key||'').slice(0,100),source_kind:String(row.source_kind||'').slice(0,60),
        lot_status:String(row.lot_status||'').slice(0,60),units_originally_created:integer(row.quantity_created),
        recorded_at:String(row.created_at||'')}));
      lotState='verified';
    }catch{}
    return respond({ok:true,read_only:true,automatic:false,external_provider_actions:false,
      product:{product_id:Number(product.product_id),name:String(product.name||''),sku:String(product.sku||''),
        product_type:product.product_type,status:product.status,tracking_enabled:tracked,updated_at:product.updated_at},
      stock:{on_hand_quantity:onHand,order_committed_quantity:committed,
        remaining_after_recorded_orders:remaining,oversubscribed,available_count_verified:countVerified,
        sale_eligible_product:tracked&&product.status==='active',
        status:!tracked?'untracked_or_nonphysical':onHand===null?'invalid_recorded_stock':oversubscribed?'below_commitments':'verified'},
      commitments:{source:'product_inventory_active_commitments',verified:true,
        scope:'Qualifying post-cutover orders in pending, paid, fulfilled or refunded status. Cancelled orders are excluded. Earlier orders and separate channel reservations are not included.',
        zero_note:committed===0?'No qualifying committed rows were found in this view; this does not prove there are no other holds or historical orders.':null},
      serialized_pieces:serialised,lots:{state:lotState,records:lotRecords,more_records:moreLots,
        description:'These are original finished-lot source records, NOT a current saleable inventory count; quantities must not be added to Product stock.'},
      availability_warning:'Remaining after recorded orders is only an upper bound, not a guarantee that units are ready for sale. Quality restrictions, serial holds, legacy orders and external channels need separate review.',
      checked_at:new Date().toISOString()});
  }catch{return respond({ok:false,error:'Current Product stock could not be verified. Do not rely on a cached count.',code:'stock_read_unavailable',retry_automatically:false},503);}
}
export async function onRequestPost(){return respond({ok:false,error:'This stock visibility endpoint is read-only.'},405);}
