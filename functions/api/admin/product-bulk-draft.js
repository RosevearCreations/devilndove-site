// Release 467 Build 636 — explicit, fail-closed bulk DRAFT review and apply.
// One bounded authority read per action; a single conditional UPDATE on Apply.
// No price, inventory, publication, SEO, R2, provider or schema operations.
import {auditAdminAction,getDb,jsonResponse} from '../_lib/adminAudit.js';

const MAX_PRODUCTS=8;
const CATEGORIES=new Set(['Jewelry','Earrings','Rings','Necklaces','Other']);
const REVIEW_STATES=new Set(['pending_review','needs_changes']);
function json(data,status=200){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-Bulk-Draft-Contract':'build636-review-first'});}
function adminFromContext(context){const user=context?.data?.ddModuleAccess?.user||null;return user&&String(user.role||'').toLowerCase()==='admin'?user:null;}
function same(a,b){return (a==null?null:String(a))===(b==null?null:String(b));}
function normalizeIds(value){
  if(!Array.isArray(value)||!value.length||value.length>MAX_PRODUCTS)return null;
  return value.every(id=>Number.isSafeInteger(id)&&id>0)&&new Set(value).size===value.length?value:null;
}
function normalizeChanges(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||
    Object.keys(value).some(key=>!['product_category','review_status'].includes(key))||
    ['product_category','review_status'].some(key=>value[key]!=null&&typeof value[key]!=='string'))return null;
  const category=String(value?.product_category||'').trim();
  const requestedReview=String(value?.review_status||'').trim();
  if(!category&&!requestedReview)return null;
  if(category&&!CATEGORIES.has(category))return null;
  if(requestedReview&&!REVIEW_STATES.has(requestedReview))return null;
  // A category change invalidates any existing approved review. This can never
  // approve or publish; it forces the draft back to Needs changes.
  return {product_category:category||null,review_status:category?'needs_changes':requestedReview};
}
function matchesSnapshot(row,snapshot){return snapshot&&Number(snapshot.product_id)===Number(row.product_id)&&
  ['name','status','product_category','review_status','updated_at'].every(key=>same(row[key],snapshot[key]));}
function plannedRow(row,changes){return {product_id:Number(row.product_id),name:String(row.name||''),sku:String(row.sku||''),
  before:{status:row.status,product_category:row.product_category,review_status:row.review_status,updated_at:row.updated_at},
  after:{status:'draft',product_category:changes.product_category||row.product_category,review_status:changes.review_status||row.review_status},
  snapshot:{product_id:Number(row.product_id),name:row.name,status:row.status,product_category:row.product_category,
    review_status:row.review_status,updated_at:row.updated_at}};}
function isChanging(row,changes){return Boolean(changes.product_category&&!same(changes.product_category,row.product_category)||
  changes.review_status&&!same(changes.review_status,row.review_status));}

export async function onRequestPost(context){
  const admin=adminFromContext(context);
  if(!admin)return json({ok:false,error:'Administrator authorization is required.'},401);
  const db=getDb(context.env);
  if(!db)return json({ok:false,error:'Database binding is unavailable.'},500);
  let body;try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON request.'},400);}
  const action=body?.action;
  const ids=normalizeIds(body?.product_ids),changes=normalizeChanges(body?.changes);
  if(!['preview','apply'].includes(action)||!ids||!changes)
    return json({ok:false,error:'Select 1–8 unique Products and a permitted draft change.',code:'invalid_bulk_request'},400);
  if(action==='apply'&&(body.owner_confirmed!==true||body.acknowledgement!=='I REVIEWED ALL DRAFT CHANGES'))
    return json({ok:false,error:'Owner review confirmation is missing; no Product was updated.',code:'owner_review_required'},403);
  if(action==='apply'&&(!Number.isSafeInteger(body.previewed_at)||body.previewed_at>Date.now()||
    Date.now()-body.previewed_at>5*60*1000))
    return json({ok:false,error:'The draft review has expired. Preview the current saved Products again.',code:'bulk_preview_expired',retry_automatically:false},409);
  const marks=ids.map(()=>'?').join(',');
  try{
    const result=await db.prepare(`SELECT product_id,name,sku,status,product_category,review_status,updated_at FROM products WHERE product_id IN (${marks}) LIMIT ${MAX_PRODUCTS}`).bind(...ids).all();
    const rows=Array.isArray(result?.results)?result.results:[];
    const byId=new Map(rows.map(row=>[Number(row.product_id),row]));
    if(rows.length!==ids.length||ids.some(id=>!byId.has(id)))
      return json({ok:false,error:'A selected Product no longer exists. Refresh the list and review again.',code:'selected_product_missing',retry_automatically:false},409);
    const selected=ids.map(id=>byId.get(id));
    if(selected.some(row=>String(row.status||'').toLowerCase()!=='draft'))
      return json({ok:false,error:'Every selected Product must still be a draft. No changes were made.',code:'non_draft_selected',retry_automatically:false},409);
    if(!selected.some(row=>isChanging(row,changes)))
      return json({ok:false,error:'The requested values already match every selected draft. Nothing needs updating.',code:'bulk_no_changes'},400);
    const proposed=selected.map(row=>plannedRow(row,changes));
    if(action==='preview')return json({ok:true,action:'preview',count:ids.length,changes,products:proposed,previewed_at:Date.now(),
      saved:false,requires_owner_confirmation:true,automatic:false,provider_actions:false,read_policy:'selected_products_only'});

    const snapshots=body.snapshots;
    if(!Array.isArray(snapshots)||snapshots.length!==ids.length||
      ids.some((id,index)=>!matchesSnapshot(selected[index],snapshots[index])))
      return json({ok:false,error:'A Product has changed since the preview, or the preview is incomplete. Review again; no write began.',code:'stale_bulk_preview',retry_automatically:false},409);

    // All-or-none: the scalar count must match every original snapshot before
    // ANY row is eligible to update. SQLite executes this as one statement.
    const values=ids.map(()=>'(?,?,?,?,?,?)').join(',');
    const expected=[];
    for(const row of snapshots)expected.push(row.product_id,row.updated_at??null,row.product_category??null,row.review_status??null,row.name??null,row.status??null);
    const sets=[],setBinds=[];
    if(changes.product_category){sets.push('product_category=?');setBinds.push(changes.product_category);}
    if(changes.review_status){sets.push('review_status=?');setBinds.push(changes.review_status);}
    sets.push('updated_at=CURRENT_TIMESTAMP');
    const update=`WITH expected(product_id,updated_at,product_category,review_status,name,status) AS (VALUES ${values})
      UPDATE products SET ${sets.join(',')} WHERE product_id IN (SELECT product_id FROM expected)
      AND (SELECT COUNT(*) FROM products p JOIN expected e ON p.product_id=e.product_id
        WHERE p.status='draft' AND e.status='draft' AND p.name IS e.name
          AND p.updated_at IS e.updated_at AND p.product_category IS e.product_category
          AND p.review_status IS e.review_status) = ?`;
    const written=await db.prepare(update).bind(...expected,...setBinds,ids.length).run();
    const updated=Number(written?.meta?.changes);
    if(updated!==ids.length)
      return json({ok:false,error:'The bulk update was not fully confirmed. Reload original records before any new attempt.',code:'bulk_write_unconfirmed',retry_automatically:false},409);
    const verify=await db.prepare(`SELECT product_id,status,product_category,review_status FROM products WHERE product_id IN (${marks}) LIMIT ${MAX_PRODUCTS}`).bind(...ids).all();
    const saved=Array.isArray(verify?.results)?verify.results:[];
    if(saved.length!==ids.length||saved.some(row=>row.status!=='draft'||
      changes.product_category&&!same(row.product_category,changes.product_category)||
      changes.review_status&&!same(row.review_status,changes.review_status)))
      return json({ok:false,error:'Bulk write readback is unconfirmed. Review saved Products before any retry.',code:'bulk_readback_unconfirmed',retry_automatically:false},409);
    if(typeof context.waitUntil==='function')context.waitUntil(auditAdminAction(context.env,context.request,admin,
      {action_type:'bulk_draft_reviewed_update',target_type:'product',target_id:ids[0],target_key:ids.join(','),
        details:{build:636,product_ids:ids,changes,owner_confirmed:true}}).catch(()=>null));
    return json({ok:true,action:'apply',updated_count:ids.length,product_ids:ids,confirmed:true,
      message:'Draft fields saved and checked. External destinations remain unchanged.',provider_actions:false,automatic:false});
  }catch(error){
    const message=String(error?.message||'Bulk draft operation failed.');
    const quota=/rows read|daily|limit|quota|7500/i.test(message);
    return json({ok:false,error:quota?'D1 read capacity is unavailable. No automatic retry will run.':
      'Bulk draft outcome cannot be confirmed. Reload the original Products before another attempt.',
      code:quota?'d1_read_capacity_unavailable':'bulk_draft_unconfirmed',retry_automatically:false},quota?503:409);
  }
}
