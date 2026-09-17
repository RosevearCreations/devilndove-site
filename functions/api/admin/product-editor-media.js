// Release 467 Build 174 — Product Editor canonical-gallery-only media projection.
// Called only after one-Product editor authority is established. Reads the selected Product's
// canonical gallery rows only. It never re-reads products, recovery authorities, quality,
// annotations, R2, or any catalog-wide source.
import { getDb, jsonResponse } from '../_lib/adminAudit.js';

const MAX_GALLERY_ROWS=12;
function json(data,status=200,headers={}){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-D1-Read-Contract':'product-editor-media-v174',...headers});}
function adminFromContext(context){const user=context?.data?.ddModuleAccess?.user||null;return user&&String(user.role||'').toLowerCase()==='admin'?user:null;}
function measuredRows(result){const n=Number(result?.meta?.rows_read??result?.meta?.rowsRead);return Number.isFinite(n)&&n>=0?n:null;}

export async function onRequestGet(context){
  const {request,env}=context;
  const admin=adminFromContext(context);if(!admin)return json({ok:false,error:'Administrator authorization was not established by the route guard.'},401);
  const db=getDb(env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const productId=Number(new URL(request.url).searchParams.get('product_id'));
  if(!Number.isInteger(productId)||productId<=0)return json({ok:false,error:'A valid product_id is required.'},400);
  try{
    const result=await db.prepare(`
      SELECT product_image_id,product_id,image_url,alt_text,sort_order,created_at
      FROM product_images
      WHERE product_id=? AND TRIM(COALESCE(image_url,''))<>''
      ORDER BY COALESCE(sort_order,0) ASC,product_image_id ASC
      LIMIT ${MAX_GALLERY_ROWS}
    `).bind(productId).all();
    const images=Array.isArray(result?.results)?result.results:[];
    const rowsRead=measuredRows(result);
    const payload={ok:true,product_id:productId,images,delivery:'product-editor-media-v174',authority_prerequisite:'product-editor-detail-v162',limits:{gallery_rows:MAX_GALLERY_ROWS},product_table_read:false,secondary_recovery_read:false,quality_read:false,annotation_read:false,r2_listing:false,background_retry:false,d1_rows_read:rowsRead};
    return json(payload,200,rowsRead==null?{}:{'X-DD-D1-Rows-Read':String(rowsRead)});
  }catch(error){
    const message=String(error?.message||'Product Editor media read failed.');
    const quota=/rows read|daily|limit|quota|7500/i.test(message);
    return json({ok:false,error:quota?'D1 read capacity is temporarily unavailable. Product Editor Media will not retry automatically.':message,code:quota?'d1_read_capacity_unavailable':'product_editor_media_failed',retry_automatically:false},quota?503:500);
  }
}
