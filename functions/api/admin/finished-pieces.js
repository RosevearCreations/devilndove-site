// Release 467 Build 450. Canonical QA + Product + order references ONLY.
// No stock posting, payment, external provider listing, shipment or publication.
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';

const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const clean=(v,max=1800)=>String(v??'').trim().slice(0,max);
const rows=r=>Array.isArray(r?.results)?r.results:[];
const respond=(data,status=200)=>jsonResponse({release:467,build:450,...data},status,{'Cache-Control':'no-store'});
const boundary=Object.freeze({canonical_product_stock:true,creates_inventory_movements:false,posts_payments:false,posts_etsy:false,confirms_offsite_sale_without_order:false,requires_human_review:true});
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),b=>b.toString(16).padStart(2,'0')).join('');

async function access(ctx){
 const admin=await getAdminUserFromRequest(ctx.request,ctx.env);
 if(!admin)return {error:respond({ok:false,error:'Admin sign-in required.'},401)};
 const db=getDb(ctx.env);
 if(!db)return {error:respond({ok:false,error:'D1 is unavailable.'},503)};
 const ready=await db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name IN ('maker_finished_pieces','maker_finished_piece_claims','maker_finished_kit_component_links')").first().catch(()=>null);
 if(Number(ready?.n)!==3)return {error:respond({ok:false,code:'MIGRATION_REQUIRED',error:'Build 450 canonical migration 0046 is required before finished-piece operations.'},503)};
 return {admin,db};
}

async function view(db,productId){
 const products=rows(await db.prepare(`SELECT p.product_id,p.name,p.sku,p.inventory_tracking,p.inventory_quantity,p.status,
  (SELECT COUNT(*) FROM maker_quality_product_links l WHERE l.product_id=p.product_id) quality_link_count
  FROM products p WHERE p.product_type='physical' AND (EXISTS(SELECT 1 FROM maker_quality_product_links l WHERE l.product_id=p.product_id)
    OR EXISTS(SELECT 1 FROM maker_finished_pieces u WHERE u.product_id=p.product_id)) ORDER BY p.product_id DESC LIMIT 150`).all());
 if(!productId)return {products,selected:null,boundary};
 const product=await db.prepare('SELECT product_id,name,sku,inventory_tracking,inventory_quantity,status,review_status FROM products WHERE product_id=?').bind(productId).first();
 if(!product)return {products,selected:null,boundary};
 const [pieces,attempts,orders,kits,commits]=await Promise.all([
  db.prepare(`SELECT u.*,a.outcome,a.safety_state,
   (SELECT r.decision FROM maker_quality_release_reviews r WHERE r.maker_quality_attempt_id=u.maker_quality_attempt_id ORDER BY r.maker_quality_release_review_id DESC LIMIT 1) current_quality_decision,
   (SELECT c.action FROM maker_finished_piece_claims c WHERE c.maker_finished_piece_id=u.maker_finished_piece_id ORDER BY c.maker_finished_piece_claim_id DESC LIMIT 1) latest_claim,
   (SELECT c.channel FROM maker_finished_piece_claims c WHERE c.maker_finished_piece_id=u.maker_finished_piece_id ORDER BY c.maker_finished_piece_claim_id DESC LIMIT 1) latest_channel,
   (SELECT c.order_item_id FROM maker_finished_piece_claims c WHERE c.maker_finished_piece_id=u.maker_finished_piece_id ORDER BY c.maker_finished_piece_claim_id DESC LIMIT 1) linked_order_item_id
   FROM maker_finished_pieces u JOIN maker_quality_attempts a ON a.maker_quality_attempt_id=u.maker_quality_attempt_id
   WHERE u.product_id=? ORDER BY u.maker_finished_piece_id DESC LIMIT 120`).bind(productId).all(),
  db.prepare(`SELECT a.maker_quality_attempt_id,a.attempt_key,a.outcome,a.attempted_quantity,
   (SELECT r.decision FROM maker_quality_release_reviews r WHERE r.maker_quality_attempt_id=a.maker_quality_attempt_id ORDER BY r.maker_quality_release_review_id DESC LIMIT 1) latest_decision
   FROM maker_quality_product_links l JOIN maker_quality_attempts a ON a.maker_quality_attempt_id=l.maker_quality_attempt_id
   WHERE l.product_id=? ORDER BY a.maker_quality_attempt_id DESC LIMIT 40`).bind(productId).all(),
  db.prepare(`SELECT oi.order_item_id,oi.order_id,oi.product_id,oi.quantity,o.order_status,o.payment_status
   FROM order_items oi JOIN orders o ON o.order_id=oi.order_id WHERE oi.product_id=? ORDER BY oi.order_item_id DESC LIMIT 50`).bind(productId).all(),
  db.prepare(`SELECT bc.component_product_id,p.name component_name,bc.quantity_per_bundle,
   (SELECT COUNT(*) FROM maker_finished_kit_component_links l JOIN order_items kit ON kit.order_item_id=l.kit_order_item_id WHERE kit.product_id=bc.bundle_product_id) referenced_kit_links
   FROM product_bundle_components bc JOIN products p ON p.product_id=bc.component_product_id WHERE bc.bundle_product_id=? ORDER BY bc.sort_order LIMIT 60`).bind(productId).all(),
  db.prepare('SELECT COALESCE(committed_quantity,0) AS committed_quantity FROM product_inventory_active_commitments WHERE product_id=?').bind(productId).first()
 ]);
 return {products,selected:{product,pieces:rows(pieces),approved_attempts:rows(attempts),recent_order_lines:rows(orders),kit_components:rows(kits),canonical_order_committed:Number(commits?.committed_quantity||0)},boundary};
}

const actionMeta={
 register_piece:['maker_finished_pieces','maker_finished_piece_id'],
 reserve_piece:['maker_finished_piece_claims','maker_finished_piece_claim_id'],
 release_piece:['maker_finished_piece_claims','maker_finished_piece_claim_id'],
 record_paid_sale:['maker_finished_piece_claims','maker_finished_piece_claim_id'],
 link_kit_component:['maker_finished_kit_component_links','maker_finished_kit_component_link_id']
};
async function save(db,action,body,actor,key,hash){
 if(action==='register_piece'){
  const product=id(body.product_id),attempt=id(body.attempt_id),serial=clean(body.serial_code,90),variant=clean(body.variant_label,90)||'Original',edition=clean(body.edition_label,90)||null,note=clean(body.note),lot=id(body.product_finished_inventory_lot_id)||null;
  if(!product||!attempt||serial.length<4||note.length<12)return respond({ok:false,error:'Choose a Product, approved QA attempt, unique serial of 4+ characters and factual 12-character note.'},400);
  const r=await db.prepare('INSERT INTO maker_finished_pieces(serial_code,maker_quality_attempt_id,product_id,product_finished_inventory_lot_id,variant_label,edition_label,piece_note,recorded_by_user_id,request_key,payload_sha256) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(serial,attempt,product,lot,variant,edition,note,actor,key,hash).run();
  return {receipt:id(r.meta?.last_row_id),product};
 }
 if(action==='link_kit_component'){
  const kit=id(body.kit_order_item_id),component=id(body.component_order_item_id),note=clean(body.note);
  if(!kit||!component||note.length<12)return respond({ok:false,error:'Choose genuine kit and component order line IDs and explain the actual component fulfillment.'},400);
  const r=await db.prepare('INSERT INTO maker_finished_kit_component_links(kit_order_item_id,component_order_item_id,linked_by_user_id,link_note,request_key,payload_sha256) VALUES(?,?,?,?,?,?)').bind(kit,component,actor,note,key,hash).run();
  return {receipt:id(r.meta?.last_row_id),product:id(body.product_id)};
 }
 const piece=id(body.piece_id),channel=clean(body.channel,40),note=clean(body.note),orderItem=id(body.order_item_id)||null;
 const state={reserve_piece:'reserved',release_piece:'released',record_paid_sale:'sold'}[action];
 if(!piece||!['storefront','etsy','local','other'].includes(channel)||note.length<12||(state==='sold'&&!orderItem))return respond({ok:false,error:'Choose a registered piece, channel and a factual note (12+ characters); sold requires a real paid order item ID.'},400);
 const source=await db.prepare('SELECT product_id FROM maker_finished_pieces WHERE maker_finished_piece_id=?').bind(piece).first();
 if(!source)return respond({ok:false,error:'Finished piece was not found.'},404);
 const r=await db.prepare('INSERT INTO maker_finished_piece_claims(maker_finished_piece_id,action,channel,order_item_id,channel_reference,claim_note,recorded_by_user_id,request_key,payload_sha256) VALUES(?,?,?,?,?,?,?,?,?)').bind(piece,state,channel,state==='sold'?orderItem:null,clean(body.channel_reference,120)||null,note,actor,key,hash).run();
 return {receipt:id(r.meta?.last_row_id),product:id(source.product_id)};
}

export async function onRequestGet(ctx){
 const a=await access(ctx);if(a.error)return a.error;
 try{return respond({ok:true,...await view(a.db,id(new URL(ctx.request.url).searchParams.get('product_id')))})}
 catch(err){console.error('BUILD450_READ_FAILED',err?.name);return respond({ok:false,error:'Finished-piece records could not be loaded.'},503)}
}

export async function onRequestPost(ctx){
 const a=await access(ctx);if(a.error)return a.error;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)return respond({ok:false,error:'Same-origin admin action required.'},403);
 let body;try{body=await ctx.request.json()}catch{return respond({ok:false,error:'Valid JSON required.'},400)}
 if(!body||typeof body!=='object'||Array.isArray(body))return respond({ok:false,error:'Action object required.'},400);
 const action=clean(body.action,40),key=clean(body.request_key,80),actor=id(a.admin.user_id);
 if(!actionMeta[action]||!/^[A-Za-z0-9_-]{16,80}$/.test(key)||!actor)return respond({ok:false,error:'Supported admin action and unique request key required.'},400);
 const hash=await digest({action,actor,fields:Object.fromEntries(Object.entries(body).filter(([field])=>field!=='request_key').sort(([x],[y])=>x.localeCompare(y)))});
 const [table,pk]=actionMeta[action];
 const prior=await a.db.prepare(`SELECT ${pk} receipt_id,recorded_by_user_id actor_id,payload_sha256 FROM ${table} WHERE request_key=?`.replace('recorded_by_user_id actor_id',table==='maker_finished_kit_component_links'?'linked_by_user_id actor_id':'recorded_by_user_id actor_id')).bind(key).first().catch(()=>null);
 if(prior)return Number(prior.actor_id)===actor&&prior.payload_sha256===hash?respond({ok:true,replayed:true,receipt_id:prior.receipt_id,boundary}):respond({ok:false,code:'REQUEST_KEY_REUSED',error:'This request key already belongs to a different action.'},409);
 try{
  const result=await save(a.db,action,body,actor,key,hash);
  if(result?.status)return result;
  await auditAdminAction(ctx.env,ctx.request,a.admin,{action_type:'build450_'+action,target_type:'maker_finished_piece',target_id:result.receipt,details:{product_id:result.product,boundary}});
  return respond({ok:true,receipt_id:result.receipt,selected:(await view(a.db,result.product)).selected,boundary});
 }catch(err){
  console.error('BUILD450_WRITE_FAILED',err?.name);
  const replay=await a.db.prepare(`SELECT ${pk} receipt_id,payload_sha256 FROM ${table} WHERE request_key=?`).bind(key).first().catch(()=>null);
  if(replay&&replay.payload_sha256===hash)return respond({ok:true,replayed:true,receipt_id:replay.receipt_id,boundary});
  const explanation={piece_requires_linked_approved_quality:'The source QA is held, rejected, or not approved for sale.',piece_quantity_exceeds_accepted_output:'All accepted units in this QA attempt already have serial numbers.',piece_quantity_exceeds_canonical_stock:'Canonical Product stock cannot support another registered serial.',piece_already_reserved_or_sold:'This one-of-one is already reserved or sold; release the hold before reserving again.',piece_reserved_elsewhere_or_unserialized:'Another channel holds this item or not all available pieces are serialised.',piece_allocation_exceeds_stock:'This reservation conflicts with an existing storefront order or another channel hold.',piece_sale_requires_matching_paid_order_item:'A real matching paid/fulfilled canonical order line is required to confirm a sale.',kit_requires_real_component_order_line:'Link existing matching component order lines from the same order; a kit alone does not consume imaginary components.'};
  const code=Object.keys(explanation).find(k=>String(err?.message||'').includes(k))||'SOURCE_CONFLICT';
  return respond({ok:false,code,error:explanation[code]||'This allocation was not confirmed. Verify QA, serial, stock and canonical order evidence, then refresh.'},409);
 }
}
