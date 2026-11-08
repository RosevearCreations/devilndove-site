// Release 467 Build 640 — explicit, bounded, read-only finished-stock exception scan.
// The canonical commitment view covers qualifying post-cutover orders, not every
// historic order or external reservation. This endpoint cannot adjust stock.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';

const PAGE_SIZE=20,LOW_AT=2,TARGET_REMAINING=3,MAX_UNITS=100000000;
const integer=value=>value!==null&&value!==undefined&&value!==''&&Number.isSafeInteger(Number(value))&&Number(value)>=0&&Number(value)<=MAX_UNITS?Number(value):null;
const response=(data,status=200)=>jsonResponse({build:640,...data},status,{
  'Cache-Control':'no-store','X-DD-Stock-Exception-Scan':'on-demand-read-only-build640'
});
function classify(row){
  const onHand=integer(row.inventory_quantity),committed=integer(row.commitment_product_id==null?0:row.committed_quantity);
  if(committed===null)throw Error('invalid_order_commitment');
  const sourceValid=onHand!==null,remaining=sourceValid?onHand-committed:null;
  const kind=!sourceValid?'source_hold':remaining<0?'overcommitted':remaining===0?'unavailable':remaining<=LOW_AT?'low':'healthy';
  const needed=sourceValid?Math.max(0,TARGET_REMAINING+committed-onHand):null;
  if(needed!==null&&(!Number.isSafeInteger(needed)||needed>MAX_UNITS))throw Error('invalid_restock_target');
  return {product_id:Number(row.product_id),name:String(row.name||''),sku:String(row.sku||''),
    status:String(row.status||''),saved_on_hand:onHand,qualifying_order_committed:committed,
    remaining_after_orders:remaining,kind,
    suggested_units_to_review:needed,
    recommendation:kind==='source_hold'?'Verify the canonical stock record before planning.':
      kind==='overcommitted'?'Review order commitments and stock mismatch before restocking.':
      kind==='unavailable'?'No units remain after these recorded orders; physically verify before replenishing.':
      kind==='low'?'Consider a physically verified replenishment plan.':'No exception on this scanned page.'};
}
export async function onRequestGet(context){
  if(!verifiedAdminFromModule(context))return response({ok:false,error:'Verified administrator required.'},401);
  const cursorText=new URL(context.request.url).searchParams.get('cursor');
  if(cursorText!==null&&(!/^[1-9]\d{0,12}$/.test(cursorText)||!Number.isSafeInteger(Number(cursorText))))
    return response({ok:false,error:'Use the server-issued Product cursor only.',code:'invalid_cursor'},400);
  const db=getDb(context.env);if(!db)return response({ok:false,error:'Database unavailable.',retry_automatically:false},503);
  const cursor=cursorText===null?0:Number(cursorText);
  try{
    // The CTE restricts the Products cohort before fetching canonical commitments.
    // Operator explicitly requests each page; no automatic full-catalog scan.
    const result=await db.prepare(`WITH cohort AS (
      SELECT product_id,name,sku,status,inventory_quantity FROM products
      WHERE product_type='physical' AND inventory_tracking=1 AND status IN ('active','draft')
        AND (?=0 OR product_id<?)
      ORDER BY product_id DESC LIMIT ?
    )
    SELECT c.*,v.product_id AS commitment_product_id,v.committed_quantity FROM cohort c
    LEFT JOIN product_inventory_active_commitments v ON v.product_id=c.product_id
    ORDER BY c.product_id DESC`).bind(cursor,cursor,PAGE_SIZE+1).all();
    if(!Array.isArray(result?.results))throw Error('missing_stock_scan_results');
    const page=result.results.slice(0,PAGE_SIZE),hasMore=result.results.length>PAGE_SIZE;
    const evaluated=page.map(classify),exceptions=evaluated.filter(item=>item.kind!=='healthy');
    return response({ok:true,read_only:true,automatic:false,external_provider_actions:false,
      page_size:PAGE_SIZE,scanned_count:page.length,exceptions,next_cursor:hasMore&&page.length?Number(page.at(-1).product_id):null,
      has_more:hasMore,scoped_to:'Tracked physical active/draft Products only; scanned by descending Product ID.',
      priority_scope:'Severity is ranked within fetched records only; other Products may have more urgent shortages until later pages are reviewed.',
      commitment_scope:'Qualifying post-cutover pending, paid, fulfilled and refunded orders; excludes cancelled orders, earlier orders and separate channel holds.',
      target_remaining_units:TARGET_REMAINING,low_at_or_below:LOW_AT,
      planning_note:'Suggested make/restock units are arithmetic planning prompts, NOT approved purchases, manufacturing instructions or stock updates. Physically verify every quantity and source before any separate adjustment.',
      checked_at:new Date().toISOString()});
  }catch{return response({ok:false,error:'Stock exceptions could not be verified from Product and order commitment authorities. No planning quantities can be trusted.',
    code:'source_scan_unavailable',retry_automatically:false},503);}
}
export async function onRequestPost(){return response({ok:false,error:'Exception scanning is read-only. Draft plans cannot change stock.'},405);}
