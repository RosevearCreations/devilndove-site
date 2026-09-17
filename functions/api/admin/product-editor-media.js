// Release 467 Build 162 — on-demand Product Editor media projection.
// This route is not called during editor startup. It reads only the selected Product's
// gallery rows and never lists R2 or performs media-quality/readiness scans.
import { getDb, jsonResponse } from '../_lib/adminAudit.js';

function json(data,status=200,headers={}){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-D1-Read-Contract':'product-editor-media-v162',...headers});}
function adminFromContext(context){const user=context?.data?.ddModuleAccess?.user||null;return user&&String(user.role||'').toLowerCase()==='admin'?user:null;}
function measuredRows(result){const n=Number(result?.meta?.rows_read??result?.meta?.rowsRead);return Number.isFinite(n)&&n>=0?n:null;}

export async function onRequestGet(context){
  const {request,env}=context;
  const admin=adminFromContext(context);if(!admin)return json({ok:false,error:'Administrator authorization was not established by the route guard.'},401);
  const db=getDb(env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const productId=Number(new URL(request.url).searchParams.get('product_id'));
  if(!Number.isInteger(productId)||productId<=0)return json({ok:false,error:'A valid product_id is required.'},400);
  try{
    const result=await db.prepare(`SELECT product_image_id, product_id, image_url, alt_text, sort_order, created_at, updated_at FROM product_images WHERE product_id=? ORDER BY sort_order ASC, product_image_id ASC LIMIT 12`).bind(productId).all();
    const images=Array.isArray(result?.results)?result.results:[];
    const rowsRead=measuredRows(result);
    return json({ok:true,product_id:productId,images,delivery:'product-editor-media-v162',r2_listing:false,d1_rows_read:rowsRead},200,rowsRead==null?{}:{'X-DD-D1-Rows-Read':String(rowsRead)});
  }catch(error){
    const message=String(error?.message||'Product media read failed.');
    const quota=/rows read|daily|limit|quota|7500/i.test(message);
    return json({ok:false,error:quota?'D1 read capacity is temporarily unavailable. Media will not retry automatically.':message,code:quota?'d1_read_capacity_unavailable':'product_editor_media_failed',retry_automatically:false},quota?503:500);
  }
}
