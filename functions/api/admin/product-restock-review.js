// Release 467 Build 637 — owner-reviewed finished-Product restock.
// Only physical units actually counted by an administrator may be added.
// Preview is read-only; Apply is a single optimistic, conditional Product UPDATE.
import {auditAdminAction,getDb,jsonResponse} from '../_lib/adminAudit.js';

const MAX_ADD=1000,MAX_STOCK=1000000,PREVIEW_AGE_MS=5*60*1000;
const ACKNOWLEDGEMENT='I VERIFIED PHYSICAL STOCK';
function json(data,status=200){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-Restock-Contract':'build637-owner-confirmed'});}
function adminFromContext(context){const user=context?.data?.ddModuleAccess?.user||null;return user&&String(user.role||'').toLowerCase()==='admin'?user:null;}
function same(a,b){return (a==null?null:String(a))===(b==null?null:String(b));}
function snapshotOf(row){return {product_id:Number(row.product_id),name:row.name,product_type:row.product_type,
  status:row.status,inventory_tracking:Number(row.inventory_tracking),inventory_quantity:Number(row.inventory_quantity),
  updated_at:row.updated_at};}
function snapshotMatches(row,snapshot){return snapshot&&typeof snapshot==='object'&&!Array.isArray(snapshot)&&
  Object.keys(snapshot).length===7&&['product_id','name','product_type','status','inventory_tracking','inventory_quantity','updated_at']
    .every(key=>same(snapshotOf(row)[key],snapshot[key]));}
function parseInput(body){
  if(!body||typeof body!=='object'||Array.isArray(body)||
    Object.keys(body).some(key=>!['action','product_id','add_units','note','previewed_at','snapshot','owner_confirmed','acknowledgement'].includes(key)))return null;
  const id=body.product_id,units=body.add_units,note=body.note;
  if(!Number.isSafeInteger(id)||id<=0||!Number.isSafeInteger(units)||units<1||units>MAX_ADD||
    typeof note!=='string'||note.trim().length<8||note.trim().length>240||!['preview','apply'].includes(body.action))return null;
  return {id,units,note:note.trim()};
}

export async function onRequestPost(context){
  const admin=adminFromContext(context);
  if(!admin)return json({ok:false,error:'Administrator authorization is required.'},401);
  const origin=context.request.headers.get('Origin');
  if(origin&&origin!==new URL(context.request.url).origin)
    return json({ok:false,error:'Cross-origin inventory changes are not permitted.',code:'cross_origin_rejected'},403);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is unavailable.'},500);
  let body;try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON request.'},400);}
  const input=parseInput(body);
  if(!input)return json({ok:false,error:'Select one Product and enter 1–1000 whole units with a factual receipt/count note.',code:'invalid_restock_request'},400);
  if(body.action==='apply'&&(body.owner_confirmed!==true||body.acknowledgement!==ACKNOWLEDGEMENT))
    return json({ok:false,error:'The owner must confirm the actual counted stock before saving.',code:'owner_confirmation_required'},403);
  if(body.action==='apply'&&(!Number.isSafeInteger(body.previewed_at)||body.previewed_at>Date.now()||
    Date.now()-body.previewed_at>PREVIEW_AGE_MS))
    return json({ok:false,error:'Restock preview expired. Load the actual Product stock again.',code:'restock_preview_expired',retry_automatically:false},409);
  try{
    const row=await db.prepare(`SELECT product_id,name,sku,product_type,status,inventory_tracking,inventory_quantity,updated_at
      FROM products WHERE product_id=? LIMIT 1`).bind(input.id).first();
    if(!row)return json({ok:false,error:'Product was not found. Refresh before retrying.',code:'product_missing'},404);
    const current=Number(row.inventory_quantity);
    if(row.inventory_quantity==null||Number(row.inventory_tracking)!==1||String(row.product_type||'').toLowerCase()!=='physical'||
      !['draft','active'].includes(String(row.status||'').toLowerCase())||
      !Number.isSafeInteger(current)||current<0||current+input.units>MAX_STOCK)
      return json({ok:false,error:'This Product cannot be restocked here. Tracking and physical stock must be valid, and the Product must be draft or active.',code:'restock_ineligible'},409);
    const original=snapshotOf(row),after=current+input.units;
    if(body.action==='preview')return json({ok:true,action:'preview',saved:false,product_id:input.id,name:row.name,sku:row.sku,
      status:row.status,before_quantity:current,add_units:input.units,after_quantity:after,note:input.note,
      snapshot:original,previewed_at:Date.now(),requires_owner_confirmation:true,
      storefront_availability_may_change:row.status==='active',external_provider_actions:false});
    if(!snapshotMatches(row,body.snapshot))
      return json({ok:false,error:'Saved Product stock or identity has changed since Preview. Nothing was written.',code:'stale_restock_preview',retry_automatically:false},409);

    // The original quantity and identity are part of the UPDATE predicate. A
    // second submit or another operator's edit cannot add these units twice.
    const written=await db.prepare(`UPDATE products SET inventory_quantity=?,updated_at=CURRENT_TIMESTAMP
      WHERE product_id=? AND inventory_tracking=1 AND product_type='physical'
        AND status IS ? AND name IS ? AND inventory_quantity=? AND updated_at IS ?`)
      .bind(after,input.id,row.status,row.name,current,row.updated_at??null).run();
    if(Number(written?.meta?.changes)!==1)
      return json({ok:false,error:'Restock update was not confirmed. Refresh the original stock before any retry.',code:'restock_write_unconfirmed',retry_automatically:false},409);
    const saved=await db.prepare('SELECT inventory_quantity,inventory_tracking,product_type,status FROM products WHERE product_id=? LIMIT 1').bind(input.id).first();
    if(Number(saved?.inventory_quantity)!==after||Number(saved?.inventory_tracking)!==1||saved?.product_type!=='physical'||saved?.status!==row.status)
      return json({ok:false,error:'Restock readback was not confirmed. Check original stock before another attempt.',code:'restock_readback_unconfirmed',retry_automatically:false},409);
    if(typeof context.waitUntil==='function')context.waitUntil(auditAdminAction(context.env,context.request,admin,
      {action_type:'owner_reviewed_finished_product_restock',target_type:'product',target_id:input.id,
        details:{build:637,before_quantity:current,units_received:input.units,after_quantity:after,receipt_note:input.note,
          owner_confirmed:true,external_provider_actions:false}}).catch(()=>null));
    return json({ok:true,action:'apply',confirmed:true,product_id:input.id,before_quantity:current,add_units:input.units,
      after_quantity:after,external_provider_actions:false,automatic:false});
  }catch(error){
    const message=String(error?.message||'Restock outcome unconfirmed.');
    const quota=/rows read|daily|limit|quota|7500/i.test(message);
    return json({ok:false,error:quota?'D1 read capacity is unavailable. No automatic retry will run.':
      'Restock outcome cannot be confirmed. Refresh the original Product before another attempt.',
      code:quota?'d1_read_capacity_unavailable':'restock_unconfirmed',retry_automatically:false},quota?503:409);
  }
}
