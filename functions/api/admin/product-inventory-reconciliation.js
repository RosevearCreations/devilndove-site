// Release 467 Build 638 — bounded stock audit history and owner-reviewed physical count.
// Existing audit events are evidence of recorded actions, not complete historical stock provenance.
// Updates are isolated to one tracked physical Product; no lot/provider/checkout changes.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';

const MAX_STOCK=1000000,MAX_AGE=5*60*1000;
const ACK='I VERIFIED PHYSICAL COUNT AND ORDER COMMITMENTS';
const AUDIT_ACTIONS=['owner_reviewed_finished_product_restock','owner_reviewed_finished_product_count_correction',
  'product_production_release_post','product_production_release_reverse','update_product_low_read'];
function json(data,status=200){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-Inventory-Count-Contract':'build638-owner-reviewed'});}
const same=(a,b)=>(a==null?null:String(a))===(b==null?null:String(b));
function snapshot(row){return {product_id:Number(row.product_id),name:row.name,status:row.status,product_type:row.product_type,
  inventory_tracking:Number(row.inventory_tracking),inventory_quantity:Number(row.inventory_quantity),updated_at:row.updated_at};}
function snapshotMatches(row,expected){return expected&&typeof expected==='object'&&!Array.isArray(expected)&&
  Object.keys(expected).length===7&&Object.keys(snapshot(row)).every(key=>same(snapshot(row)[key],expected[key]));}
function eligible(row){return row&&row.inventory_quantity!=null&&Number(row.inventory_tracking)===1&&
  row.product_type==='physical'&&['draft','active'].includes(row.status)&&
  Number.isSafeInteger(Number(row.inventory_quantity))&&Number(row.inventory_quantity)>=0&&Number(row.inventory_quantity)<=MAX_STOCK;}
function parsePost(body){
  if(!body||typeof body!=='object'||Array.isArray(body)||
    Object.keys(body).some(key=>!['action','product_id','counted_quantity','note','snapshot','previewed_at','owner_confirmed','acknowledgement'].includes(key)))return null;
  const id=body.product_id,count=body.counted_quantity,note=body.note;
  if(!['preview','apply'].includes(body.action)||!Number.isSafeInteger(id)||id<=0||
    !Number.isSafeInteger(count)||count<0||count>MAX_STOCK||
    typeof note!=='string'||note.trim().length<8||note.trim().length>240)return null;
  return {id,count,note:note.trim()};
}
function meaningfulEvent(row){
  let detail={};try{const value=JSON.parse(String(row.details_json||'{}'));if(value&&typeof value==='object'&&!Array.isArray(value))detail=value;}catch{}
  if(row.action_type==='update_product_low_read'&&!Array.isArray(detail.fields_changed))return null;
  if(row.action_type==='update_product_low_read'&&!detail.fields_changed.includes('inventory_quantity'))return null;
  const type=row.action_type;
  let label='',before=null,after=null,delta=null,note='';
  if(type==='owner_reviewed_finished_product_restock'){
    label='Finished Product restock';before=Number(detail.before_quantity);after=Number(detail.after_quantity);
    delta=Number(detail.units_received);note=String(detail.receipt_note||'');
  }else if(type==='owner_reviewed_finished_product_count_correction'){
    label='Owner physical-count correction';before=Number(detail.before_quantity);after=Number(detail.counted_quantity);
    delta=after-before;note=String(detail.count_note||'');
  }else if(type==='product_production_release_post'){
    label='Production run released';delta=Number(detail.output_quantity);note='Production event; exact stock before/after not recorded here.';
  }else if(type==='product_production_release_reverse'){
    label='Production run reversal';delta=-Number(detail.output_quantity);note='Production reversal; exact stock before/after not recorded here.';
  }else{
    label='Product Editor stock field changed';note='Earlier Product Editor audit lists a stock change, but does not contain a verified before/after count.';
  }
  const valid=value=>Number.isSafeInteger(value)&&Math.abs(value)<=MAX_STOCK;
  return {audit_id:Number(row.admin_action_audit_id),recorded_at:String(row.created_at||''),
    actor_user_id:Number.isSafeInteger(Number(row.actor_user_id))&&Number(row.actor_user_id)>0?Number(row.actor_user_id):null,
    action:label,before_quantity:valid(before)?before:null,after_quantity:valid(after)?after:null,
    delta:valid(delta)?delta:null,note:note.slice(0,240),source_action:type};
}
async function readProduct(db,id){return db.prepare(`SELECT product_id,name,sku,status,product_type,inventory_tracking,inventory_quantity,updated_at
  FROM products WHERE product_id=? LIMIT 1`).bind(id).first();}
async function committedQuantity(db,id){
  // If this view is not deployed, decreases remain HOLD. No guessed zero commitments.
  const row=await db.prepare('SELECT committed_quantity FROM product_inventory_active_commitments WHERE product_id=? LIMIT 1').bind(id).first();
  const count=Number(row?.committed_quantity??0);
  if(!Number.isSafeInteger(count)||count<0)return null;
  return count;
}

export async function onRequestGet(context){
  const admin=verifiedAdminFromModule(context);if(!admin)return json({ok:false,error:'Verified administrator required.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding unavailable.'},500);
  const id=Number(new URL(context.request.url).searchParams.get('product_id'));
  if(!Number.isSafeInteger(id)||id<=0)return json({ok:false,error:'Choose one valid Product ID.'},400);
  try{
    const product=await readProduct(db,id);if(!product)return json({ok:false,error:'Product not found.'},404);
    const history=await db.prepare(`SELECT admin_action_audit_id,actor_user_id,action_type,details_json,created_at
      FROM admin_action_audit WHERE target_type='product' AND target_id=?
        AND action_type IN (${AUDIT_ACTIONS.map(()=>'?').join(',')})
      ORDER BY admin_action_audit_id DESC LIMIT 40`).bind(id,...AUDIT_ACTIONS).all();
    const raw=Array.isArray(history?.results)?history.results:[];
    return json({ok:true,product:snapshot(product),sku:String(product.sku||''),
      events:raw.map(meaningfulEvent).filter(Boolean).slice(0,20),
      history_source:'existing_admin_action_audit',history_complete:false,
      history_warning:'This is a limited audit view, not a complete inventory ledger. Older Product edits, missing audit writes and external changes may be absent. Compare the current Product with a physical count.',
      history_truncated:raw.length===40,read_only:true,provider_actions:false});
  }catch{return json({ok:false,error:'Stock history could not be verified from the existing audit table; do not assume zero adjustments.',code:'history_unavailable',retry_automatically:false},503);}
}

export async function onRequestPost(context){
  const admin=verifiedAdminFromModule(context);if(!admin)return json({ok:false,error:'Verified administrator required.'},401);
  const origin=context.request.headers.get('Origin');
  if(origin&&origin!==new URL(context.request.url).origin)
    return json({ok:false,error:'Cross-origin inventory changes are denied.',code:'cross_origin_rejected'},403);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding unavailable.'},500);
  let body;try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON request.'},400);}
  const input=parsePost(body);if(!input)return json({ok:false,error:'Enter one Product, a whole physical count and a factual note.',code:'invalid_count_request'},400);
  if(body.action==='apply'&&(body.owner_confirmed!==true||body.acknowledgement!==ACK))
    return json({ok:false,error:'Explicit owner count confirmation is missing.',code:'owner_confirmation_required'},403);
  if(body.action==='apply'&&(!Number.isSafeInteger(body.previewed_at)||body.previewed_at>Date.now()||Date.now()-body.previewed_at>MAX_AGE))
    return json({ok:false,error:'The physical-count preview expired. Read the current Product again.',code:'count_preview_expired',retry_automatically:false},409);
  try{
    const product=await readProduct(db,input.id);
    if(!eligible(product))return json({ok:false,error:'Physical-count adjustment is available only for tracked, physical draft/active Products with valid stock.',code:'count_ineligible'},409);
    const before=Number(product.inventory_quantity),delta=input.count-before;
    if(body.action==='apply'&&!snapshotMatches(product,body.snapshot))
      return json({ok:false,error:'The saved Product changed since Preview. Nothing was written.',code:'stale_count_preview',retry_automatically:false},409);
    if(delta===0&&body.action==='apply')return json({ok:false,error:'Count already matches saved stock. No correction is needed.',code:'no_count_discrepancy'},409);
    if(delta===0)return json({ok:true,action:'preview',product_id:input.id,product_name:product.name,
      before_quantity:before,counted_quantity:input.count,difference:0,discrepancy:false,
      saved:false,requires_update:false,external_provider_actions:false});
    let committed=null;
    if(delta<0){try{committed=await committedQuantity(db,input.id);}catch{}
      if(committed==null)return json({ok:false,error:'Existing order commitments could not be verified. Decreases are on HOLD.',code:'commitments_unavailable',retry_automatically:false},409);
      if(input.count<committed)return json({ok:false,error:`Count ${input.count} is below ${committed} already-committed unit(s). No stock can be reduced.`,code:'below_order_commitments',retry_automatically:false},409);
    }
    const original=snapshot(product);
    if(body.action==='preview')return json({ok:true,action:'preview',product_id:input.id,product_name:product.name,status:product.status,
      before_quantity:before,counted_quantity:input.count,difference:delta,discrepancy:true,
      committed_quantity:committed,note:input.note,snapshot:original,previewed_at:Date.now(),saved:false,
      requires_owner_confirmation:true,storefront_availability_may_change:product.status==='active',external_provider_actions:false});
    // One conditional UPDATE. For decreases, the active commitment view is
    // rechecked in the same SQLite statement (in addition to Build 440 triggers).
    const decrementGuard=delta<0?' AND ? >= COALESCE((SELECT committed_quantity FROM product_inventory_active_commitments WHERE product_id=?),0)':'';
    const written=await db.prepare(`UPDATE products SET inventory_quantity=?,updated_at=CURRENT_TIMESTAMP
      WHERE product_id=? AND inventory_tracking=1 AND product_type='physical'
        AND status IS ? AND name IS ? AND inventory_quantity=? AND updated_at IS ?${decrementGuard}`)
      .bind(input.count,input.id,product.status,product.name,before,product.updated_at??null,
        ...(delta<0?[input.count,input.id]:[])).run();
    if(Number(written?.meta?.changes)!==1)
      return json({ok:false,error:'Count adjustment was not confirmed. Refresh and inspect original stock before retrying.',code:'count_update_unconfirmed',retry_automatically:false},409);
    const verified=await readProduct(db,input.id);
    if(!verified||Number(verified.inventory_quantity)!==input.count||verified.status!==product.status)
      return json({ok:false,error:'Stock readback is uncertain. Do not resubmit; verify the original record.',code:'count_readback_unconfirmed',retry_automatically:false},409);

    // Audit is intentionally awaited. If it fails AFTER a confirmed stock
    // change, report that separate fact; never return a generic retryable write error.
    let auditRecorded=false;
    try{
      const audit=await db.prepare(`INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_id,target_key,
        request_method,request_path,details_json,created_at) VALUES(?,'owner_reviewed_finished_product_count_correction',
        'product',?,?, 'POST','/api/admin/product-inventory-reconciliation',?,CURRENT_TIMESTAMP)`)
        .bind(admin.user_id,input.id,String(input.id),JSON.stringify({build:638,before_quantity:before,counted_quantity:input.count,
          delta,committed_quantity:committed,count_note:input.note,owner_confirmed:true,external_provider_actions:false})).run();
      auditRecorded=Number(audit?.meta?.changes)===1;
    }catch{}
    return json({ok:true,action:'apply',confirmed:true,product_id:input.id,before_quantity:before,
      counted_quantity:input.count,difference:delta,audit_recorded:auditRecorded,
      warning:auditRecorded?null:'Stock was saved but its audit event could not be confirmed. Do not retry the count change; contact an administrator to inspect the Product and audit.',
      external_provider_actions:false,automatic:false});
  }catch(error){
    const message=String(error?.message||'Count reconciliation failed.');
    const quota=/rows read|daily|limit|quota|7500/i.test(message);
    return json({ok:false,error:quota?'D1 read capacity is unavailable. No automatic retry will run.':
      'Stock reconciliation outcome is uncertain. Refresh the Product before any new attempt.',
      code:quota?'d1_read_capacity_unavailable':'count_unconfirmed',retry_automatically:false},quota?503:409);
  }
}
