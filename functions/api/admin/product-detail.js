// Returns the compact product, SEO and editor-image payload used by admin workspaces.
// Build 245: deterministic seven-image editor gallery with non-destructive recovery from linked media/history.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { normalizeTaxRateFraction, taxRatePercent } from './_tax-rate.js';

const json=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const text=(v)=>String(v||'').trim();
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
function parseColorNames(value,fallback=''){let input=[];if(typeof value==='string'&&value.trim()){try{input=JSON.parse(value)}catch{input=value.split(/[\r\n,|/]+/g)}}if(!Array.isArray(input))input=[];const out=[];[fallback,...input].forEach((entry)=>{const clean=text(entry);if(clean&&!out.some((item)=>item.toLowerCase()===clean.toLowerCase()))out.push(clean)});return out.slice(0,12)}
function imageKey(value){return text(value).toLowerCase().replace(/[?#].*$/,'').replace(/\/+$/,'')}

function mergeImages({galleryRows=[],mediaRows=[],roleRows=[],annotationRows=[]}={}){
  const output=[];const seen=new Set();
  function add(row,source,rank,index){
    const imageUrl=text(row?.image_url||row?.public_url);const key=imageKey(imageUrl);if(!key||seen.has(key))return;seen.add(key);
    output.push({product_image_id:Number(row?.product_image_id||0)||null,media_asset_id:Number(row?.media_asset_id||0)||null,product_media_role_assignment_id:Number(row?.product_media_role_assignment_id||0)||null,product_image_annotation_id:Number(row?.product_image_annotation_id||0)||null,product_id:Number(row?.product_id||0)||null,image_url:imageUrl,alt_text:text(row?.alt_text||row?.original_filename||row?.annotation_notes||row?.caption),sort_order:Number(row?.sort_order??index),created_at:row?.created_at||row?.updated_at||null,variant_role:row?.variant_role||row?.role_key||row?.image_role||null,image_source:source,_source_rank:rank});
  }
  galleryRows.forEach((r,i)=>add(r,'product_images',0,i));
  mediaRows.filter((r)=>!r?.deleted_at).forEach((r,i)=>add(r,'media_assets',1,i+20));
  roleRows.filter((r)=>text(r?.assignment_status||'assigned')!=='removed').forEach((r,i)=>add(r,'product_media_role_assignments',2,i+40));
  annotationRows.forEach((r,i)=>add(r,'product_image_annotations',3,i+60));
  return output.sort((a,b)=>a._source_rank-b._source_rank||a.sort_order-b.sort_order||String(a.created_at||'').localeCompare(String(b.created_at||''))).slice(0,7).map(({_source_rank,...row})=>row);
}
function sourceLabel(source){return source==='product_record'?'Product featured-image field':source==='product_images'?'Product image gallery':source==='media_assets'?'Media library asset':source==='product_media_role_assignments'?'Product media role assignment':source==='product_image_annotations'?'Product image annotation/history':'No image source'}
async function safeAll(stmt){try{return rows(await stmt.all())}catch{return []}}

export async function onRequestGet({request,env}){
  const db=getDb(env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const admin=await getAdminUserFromRequest(request,env);if(!admin)return json({ok:false,error:'Unauthorized.'},401);
  const productId=Number(new URL(request.url).searchParams.get('product_id'));if(!Number.isInteger(productId)||productId<=0)return json({ok:false,error:'A valid product_id is required.'},400);
  try{
    const product=await db.prepare(`SELECT p.*,tc.code AS tax_class_code,tc.name AS tax_class_name,tc.tax_rate AS tax_rate_raw FROM products p LEFT JOIN tax_classes tc ON tc.tax_class_id=p.tax_class_id WHERE p.product_id=? LIMIT 1`).bind(productId).first();
    if(!product)return json({ok:false,error:'Product not found.'},404);

    const [seo,galleryRows,mediaRows,roleRows,annotationRows]=await Promise.all([
      db.prepare('SELECT * FROM product_seo WHERE product_id=? LIMIT 1').bind(productId).first().catch(()=>null),
      safeAll(db.prepare('SELECT * FROM product_images WHERE product_id=? ORDER BY sort_order ASC, product_image_id ASC LIMIT 60').bind(productId)),
      safeAll(db.prepare('SELECT * FROM media_assets WHERE product_id=? AND deleted_at IS NULL ORDER BY sort_order ASC, media_asset_id ASC LIMIT 60').bind(productId)),
      safeAll(db.prepare("SELECT * FROM product_media_role_assignments WHERE product_id=? AND COALESCE(assignment_status,'assigned')<>'removed' ORDER BY updated_at DESC, product_media_role_assignment_id ASC LIMIT 60").bind(productId)),
      safeAll(db.prepare('SELECT * FROM product_image_annotations WHERE product_id=? AND TRIM(COALESCE(image_url,\'\'))<>\'\' ORDER BY updated_at DESC, product_image_annotation_id ASC LIMIT 60').bind(productId))
    ]);

    if(seo){for(const key of ['meta_title','meta_description','keywords','h1_override','canonical_url','schema_type','og_title','og_description','og_image_url'])product[key]=seo[key]??null;}
    product.tax_rate=normalizeTaxRateFraction(product.tax_rate_raw);product.rate_percent=taxRatePercent(product.tax_rate);product.color_names=parseColorNames(product.color_names_json,product.color_name);product.color_names_text=product.color_names.join(', ');

    const images=mergeImages({galleryRows,mediaRows,roleRows,annotationRows});
    const storedFeatured=text(product.featured_image_url);const firstGallery=images.find((r)=>r.image_source==='product_images')?.image_url||'';const firstAny=images[0]?.image_url||'';const resolvedFeatured=storedFeatured||firstGallery||firstAny;
    const resolvedRow=images.find((r)=>imageKey(r.image_url)===imageKey(resolvedFeatured));const featuredSource=storedFeatured?'product_record':(resolvedRow?.image_source||'');
    product.featured_image_stored_url=storedFeatured||null;product.featured_image_url=resolvedFeatured;product.featured_image_source=featuredSource||null;product.featured_image_source_label=sourceLabel(featuredSource);product.featured_image_needs_sync=!storedFeatured&&Boolean(resolvedFeatured)?1:0;
    product.media_asset_count=mediaRows.filter((r)=>text(r?.public_url)&&!r?.deleted_at).length;product.product_image_count=galleryRows.filter((r)=>text(r?.image_url)).length;

    const recoverableUrls=[];const recoverSeen=new Set();[...galleryRows,...mediaRows,...roleRows,...annotationRows].forEach((r)=>{const u=text(r?.image_url||r?.public_url);const k=imageKey(u);if(u&&k&&!recoverSeen.has(k)){recoverSeen.add(k);recoverableUrls.push(u)}});
    const featuredKey=imageKey(resolvedFeatured);const galleryKeys=new Set(images.map((r)=>imageKey(r.image_url)));
    const mediaIntegrity={
      product_image_count:galleryRows.filter((r)=>text(r?.image_url)).length,
      media_asset_count:mediaRows.filter((r)=>text(r?.public_url)&&!r?.deleted_at).length,
      role_assignment_image_count:roleRows.filter((r)=>text(r?.image_url)).length,
      annotation_image_count:annotationRows.filter((r)=>text(r?.image_url)).length,
      editor_unique_image_count:images.length,
      recoverable_linked_image_count:recoverableUrls.length,
      recoverable_image_urls:recoverableUrls.slice(0,30),
      featured_in_editor_gallery:Boolean(featuredKey&&galleryKeys.has(featuredKey)),
      seo_image_is_gallery_image:Boolean(imageKey(product.og_image_url)&&galleryKeys.has(imageKey(product.og_image_url))),
      recovered_editor_image_count:images.filter((r)=>r.image_source!=='product_images').length
    };

    return json({ok:true,product,images,media_assets:images.filter((r)=>r.image_source==='media_assets'),image_annotations:annotationRows,media_integrity:mediaIntegrity,response_profile:'editor_compact_v245'});
  }catch(error){return json({ok:false,error:error?.message||'Could not load this product safely.',code:'product_detail_failed'},500)}
}
