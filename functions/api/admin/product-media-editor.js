// Release 467 Build 165 — bounded Product media workspace with existing-reference recovery.
// Reads one Product and only its gallery/media references. No R2 listing, catalog scan,
// schema introspection, automatic scoring, or background refresh is performed.
import { getDb, jsonResponse } from '../_lib/adminAudit.js';

function json(data,status=200,headers={}){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-D1-Read-Contract':'product-media-workspace-v165',...headers});}
function adminFromContext(context){const user=context?.data?.ddModuleAccess?.user||null;return user&&String(user.role||'').toLowerCase()==='admin'?user:null;}
function rowsRead(result){const n=Number(result?.meta?.rows_read??result?.meta?.rowsRead);return Number.isFinite(n)&&n>=0?n:0;}
function clean(value){return String(value||'').trim();}
function key(value){return clean(value).toLowerCase().replace(/[?#].*$/,'');}
function addImage(list,seen,row,source){const url=clean(row?.image_url||row?.public_url);if(!url)return;const k=key(url);if(!k||seen.has(k))return;seen.add(k);list.push({...row,image_url:url,source,canonical_gallery:Number(row?.product_image_id||0)>0});}

export async function onRequestGet(context){
  const admin=adminFromContext(context);if(!admin)return json({ok:false,error:'Administrator authorization was not established by the route guard.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const productId=Number(new URL(context.request.url).searchParams.get('product_id'));
  if(!Number.isInteger(productId)||productId<=0)return json({ok:false,error:'A valid product_id is required.'},400);
  try{
    let measured=0;const warnings=[];
    const productResult=await db.prepare(`SELECT product_id,product_number,name,slug,sku,status,review_status,featured_image_url FROM products WHERE product_id=? LIMIT 1`).bind(productId).all();measured+=rowsRead(productResult);
    const product=(productResult?.results||[])[0]||null;if(!product)return json({ok:false,error:'Product was not found.'},404);
    const images=[];const seen=new Set();

    if(clean(product.featured_image_url))addImage(images,seen,{product_id:productId,product_image_id:0,image_url:product.featured_image_url,alt_text:product.name,sort_order:-1},'featured');

    try{
      const imageResult=await db.prepare(`
        SELECT pi.product_image_id,pi.product_id,pi.image_url,pi.alt_text,pi.sort_order,pi.created_at,
               qr.width_px,qr.height_px,qr.load_status,qr.quality_score,qr.acceptance_status,qr.reviewed_at
        FROM product_images pi
        LEFT JOIN product_image_quality_reviews qr ON qr.product_id=pi.product_id AND qr.product_image_id=pi.product_image_id
        WHERE pi.product_id=? AND TRIM(COALESCE(pi.image_url,''))<>''
        ORDER BY COALESCE(pi.sort_order,0) ASC,pi.product_image_id ASC
        LIMIT 20
      `).bind(productId).all();measured+=rowsRead(imageResult);
      for(const row of imageResult?.results||[])addImage(images,seen,row,'gallery');
    }catch(error){warnings.push(`product_images:${clean(error?.message).slice(0,140)}`);}

    try{
      const roles=await db.prepare(`SELECT product_media_role_assignment_id,product_id,product_image_id,image_url,role_key FROM product_media_role_assignments WHERE product_id=? AND COALESCE(assignment_status,'assigned')='assigned' AND TRIM(COALESCE(image_url,''))<>'' ORDER BY CASE WHEN role_key='hero_front' THEN 0 ELSE 1 END,product_media_role_assignment_id ASC LIMIT 20`).bind(productId).all();measured+=rowsRead(roles);
      for(const row of roles?.results||[])addImage(images,seen,{...row,alt_text:product.name,sort_order:images.length},'media role');
    }catch(error){warnings.push(`media_roles:${clean(error?.message).slice(0,140)}`);}

    try{
      const assets=await db.prepare(`SELECT media_asset_id,product_id,public_url,variant_role,sort_order FROM media_assets WHERE product_id=? AND TRIM(COALESCE(public_url,''))<>'' ORDER BY COALESCE(sort_order,0) ASC,media_asset_id ASC LIMIT 20`).bind(productId).all();measured+=rowsRead(assets);
      for(const row of assets?.results||[])addImage(images,seen,{...row,image_url:row.public_url,alt_text:product.name},'media asset');
    }catch(error){warnings.push(`media_assets:${clean(error?.message).slice(0,140)}`);}

    const bounded=images.slice(0,20);
    return json({ok:true,product,images:bounded,delivery:'product-media-workspace-v165',limits:{gallery_rows:20},lazy:{image_detail:true,scoring:true,annotations:true,roles:true},recovery:{multi_source:true,source_order:['featured','gallery','media role','media asset'],recovered_reference_count:bounded.filter((row)=>!row.canonical_gallery).length},warnings,r2_listing:false,d1_rows_read:measured},200,{'X-DD-D1-Rows-Read':String(measured)});
  }catch(error){
    const message=String(error?.message||'Product media workspace failed.');const quota=/rows read|daily|limit|quota|7500/i.test(message);
    return json({ok:false,error:quota?'D1 read capacity is temporarily unavailable. Product Media will not retry automatically.':message,code:quota?'d1_read_capacity_unavailable':'product_media_workspace_failed',retry_automatically:false},quota?503:500);
  }
}
