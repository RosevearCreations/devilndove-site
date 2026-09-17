// Release 467 Build 163 — bounded Product media workspace projection.
// Reads one Product and at most 20 of its gallery rows. No R2 listing, catalog scan,
// annotations, role tables, quality-history scan, or automatic scoring is performed.
import { getDb, jsonResponse } from '../_lib/adminAudit.js';

function json(data,status=200,headers={}){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-D1-Read-Contract':'product-media-workspace-v163',...headers});}
function adminFromContext(context){const user=context?.data?.ddModuleAccess?.user||null;return user&&String(user.role||'').toLowerCase()==='admin'?user:null;}
function rowsRead(result){const n=Number(result?.meta?.rows_read??result?.meta?.rowsRead);return Number.isFinite(n)&&n>=0?n:0;}

export async function onRequestGet(context){
  const admin=adminFromContext(context);if(!admin)return json({ok:false,error:'Administrator authorization was not established by the route guard.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const productId=Number(new URL(context.request.url).searchParams.get('product_id'));
  if(!Number.isInteger(productId)||productId<=0)return json({ok:false,error:'A valid product_id is required.'},400);
  try{
    const productResult=await db.prepare(`SELECT product_id,product_number,name,slug,sku,status,review_status,featured_image_url FROM products WHERE product_id=? LIMIT 1`).bind(productId).all();
    const product=(productResult?.results||[])[0]||null;if(!product)return json({ok:false,error:'Product was not found.'},404);
    const imageResult=await db.prepare(`
      SELECT pi.product_image_id,pi.product_id,pi.image_url,pi.alt_text,pi.sort_order,pi.created_at,
             qr.width_px,qr.height_px,qr.load_status,qr.quality_score,qr.acceptance_status,qr.reviewed_at
      FROM product_images pi
      LEFT JOIN product_image_quality_reviews qr ON qr.product_id=pi.product_id AND qr.product_image_id=pi.product_image_id
      WHERE pi.product_id=?
      ORDER BY COALESCE(pi.sort_order,0) ASC,pi.product_image_id ASC
      LIMIT 20
    `).bind(productId).all();
    const images=Array.isArray(imageResult?.results)?imageResult.results:[];
    const measured=rowsRead(productResult)+rowsRead(imageResult);
    return json({ok:true,product,images,delivery:'product-media-workspace-v163',limits:{gallery_rows:20},lazy:{image_detail:true,scoring:true,annotations:true,roles:true},r2_listing:false,d1_rows_read:measured},200,{'X-DD-D1-Rows-Read':String(measured)});
  }catch(error){
    const message=String(error?.message||'Product media workspace failed.');const quota=/rows read|daily|limit|quota|7500/i.test(message);
    return json({ok:false,error:quota?'D1 read capacity is temporarily unavailable. Product Media will not retry automatically.':message,code:quota?'d1_read_capacity_unavailable':'product_media_workspace_failed',retry_automatically:false},quota?503:500);
  }
}
