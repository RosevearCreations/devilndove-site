// Release 467 Build 173 — selected Product image metadata, scoring, safe featured replacement, remove and reorder authority.
// Every request is bounded to one selected Product image or at most 20 explicitly supplied gallery ids.
// Annotation compatibility uses read-only schema discovery; request-time DDL is forbidden.
import { auditAdminAction, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { readAnnotation, rowsRead, upsertAnnotation } from './_productImageAnnotationsV172.js';

const PRIMARY_MIN_WIDTH=1200;
const PRIMARY_MIN_HEIGHT=1200;
const PRIMARY_MIN_ALT=12;
const PRIMARY_MIN_SCORE=70;
function json(data,status=200,headers={}){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-D1-Contract':'selected-product-image-v172',...headers});}
function adminFromContext(context){const user=context?.data?.ddModuleAccess?.user||null;return user&&String(user.role||'').toLowerCase()==='admin'?user:null;}
function text(value,max=0){const v=String(value??'').trim();return max>0?v.slice(0,max):v;}
function optionalNumber(value,min=0,max=1){if(value==null||value==='')return null;const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):null;}
function integer(value){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.trunc(n)):0;}
function score({primary=false,width=0,height=0,altLength=0,loaded=false}){let total=0;if(loaded)total+=15;if(width>=PRIMARY_MIN_WIDTH&&height>=PRIMARY_MIN_HEIGHT)total+=45;if(altLength>=PRIMARY_MIN_ALT)total+=20;if(primary)total+=20;return Math.max(0,Math.min(100,total));}
async function selectedImage(db,imageId){
  const result=await db.prepare(`
    SELECT pi.product_image_id,pi.product_id,pi.image_url,pi.alt_text,pi.sort_order,
           p.name AS product_name,p.status AS product_status,p.featured_image_url,
           qr.width_px,qr.height_px,qr.load_status,qr.quality_score,qr.acceptance_status,qr.reviewed_at
    FROM product_images pi
    INNER JOIN products p ON p.product_id=pi.product_id
    LEFT JOIN product_image_quality_reviews qr ON qr.product_id=pi.product_id AND qr.product_image_id=pi.product_image_id
    WHERE pi.product_image_id=? LIMIT 1
  `).bind(imageId).all();
  const row=(result?.results||[])[0]||null;if(!row)return {row:null,rows_read:rowsRead(result),annotation_warning:''};
  const annotation=await readAnnotation(db,imageId);
  return {row:{...row,...(annotation.row||{})},rows_read:rowsRead(result)+annotation.rows_read,annotation_warning:annotation.available?'':'Optional image annotations are unavailable in this schema.'};
}
export async function onRequestGet(context){
  const admin=adminFromContext(context);if(!admin)return json({ok:false,error:'Administrator authorization was not established by the route guard.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const imageId=Number(new URL(context.request.url).searchParams.get('product_image_id'));if(!Number.isInteger(imageId)||imageId<=0)return json({ok:false,error:'A valid product_image_id is required.'},400);
  try{const selected=await selectedImage(db,imageId);if(!selected.row)return json({ok:false,error:'Product image was not found.',code:'canonical_product_image_missing'},404);return json({ok:true,image:selected.row,primary:String(selected.row.featured_image_url||'').trim()===String(selected.row.image_url||'').trim(),thresholds:{min_width_px:PRIMARY_MIN_WIDTH,min_height_px:PRIMARY_MIN_HEIGHT,min_alt_characters:PRIMARY_MIN_ALT,min_quality_score:PRIMARY_MIN_SCORE},delivery:'selected-product-image-v172',annotation_warning:selected.annotation_warning||'',d1_rows_read:selected.rows_read},200,{'X-DD-D1-Rows-Read':String(selected.rows_read)});}
  catch(error){const message=String(error?.message||'Product image read failed.');const quota=/rows read|daily|limit|quota|7500/i.test(message);return json({ok:false,error:quota?'D1 read capacity is temporarily unavailable. Image Editor will not retry automatically.':message,code:quota?'d1_read_capacity_unavailable':'product_image_read_failed',retry_automatically:false},quota?503:500);}
}

export async function onRequestPost(context){
  const admin=adminFromContext(context);if(!admin)return json({ok:false,error:'Administrator authorization was not established by the route guard.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const imageId=Number(body.product_image_id);if(!Number.isInteger(imageId)||imageId<=0)return json({ok:false,error:'A valid product_image_id is required.'},400);
  const action=text(body.action||'save_metadata',40).toLowerCase();
  try{
    const selected=await selectedImage(db,imageId);const image=selected.row;if(!image)return json({ok:false,error:'Product image was not found.',code:'canonical_product_image_missing'},404);let measured=selected.rows_read;

    if(action==='reorder'){
      const ordered=[...new Set((Array.isArray(body.ordered_ids)?body.ordered_ids:[]).map(Number).filter((id)=>Number.isInteger(id)&&id>0))].slice(0,20);if(!ordered.length||!ordered.includes(imageId))return json({ok:false,error:'A bounded ordered_ids list containing the selected image is required.'},400);
      for(let index=0;index<ordered.length;index+=1)await db.prepare('UPDATE product_images SET sort_order=? WHERE product_image_id=? AND product_id=?').bind(index,ordered[index],image.product_id).run();
      if(typeof context.waitUntil==='function')context.waitUntil(auditAdminAction(context.env,context.request,admin,{action_type:'reorder_product_images_v172',target_type:'product',target_id:image.product_id,target_key:String(image.product_id),details:{ordered_ids:ordered}}).catch(()=>null));
      return json({ok:true,action:'reorder',product_id:image.product_id,ordered_ids:ordered,message:'Gallery order saved.',d1_rows_read:measured},200,{'X-DD-D1-Rows-Read':String(measured)});
    }

    if(action==='remove'){
      let replacementUrl=null;const wasPrimary=String(image.featured_image_url||'').trim()===String(image.image_url||'').trim();
      if(wasPrimary){
        const replacement=await db.prepare('SELECT image_url FROM product_images WHERE product_id=? AND product_image_id<>? ORDER BY COALESCE(sort_order,0) ASC,product_image_id ASC LIMIT 1').bind(image.product_id,imageId).all();measured+=rowsRead(replacement);replacementUrl=(replacement?.results||[])[0]?.image_url||null;
        if(String(image.product_status||'').toLowerCase()==='active'&&!String(replacementUrl||'').trim())return json({ok:false,error:'This is the featured image for an active Product and there is no replacement gallery image. Add or choose another featured image before removing it.',code:'featured_image_requires_replacement'},409);
        // Fail closed: the Product featured pointer must move successfully before the gallery row is removed.
        await db.prepare('UPDATE products SET featured_image_url=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=?').bind(replacementUrl,image.product_id).run();
      }
      await db.prepare('DELETE FROM product_media_role_assignments WHERE product_id=? AND product_image_id=?').bind(image.product_id,imageId).run().catch(()=>null);
      await db.prepare('DELETE FROM product_image_quality_reviews WHERE product_id=? AND product_image_id=?').bind(image.product_id,imageId).run().catch(()=>null);
      await db.prepare('DELETE FROM product_image_annotations WHERE product_image_id=?').bind(imageId).run().catch(()=>null);
      await db.prepare('DELETE FROM product_images WHERE product_image_id=? AND product_id=?').bind(imageId,image.product_id).run();
      if(typeof context.waitUntil==='function')context.waitUntil(auditAdminAction(context.env,context.request,admin,{action_type:'remove_product_image_v173',target_type:'product_image',target_id:imageId,target_key:String(image.image_url||imageId),details:{product_id:image.product_id,r2_source_preserved:true,replacement_featured_url:replacementUrl,featured_pointer_updated_first:wasPrimary}}).catch(()=>null));
      return json({ok:true,action:'remove',product_image_id:imageId,product_id:image.product_id,r2_source_preserved:true,replacement_featured_url:replacementUrl,message:'Image removed from the Product gallery.',save_confirmed:true,d1_rows_read:measured},200,{'X-DD-D1-Rows-Read':String(measured)});
    }

    if(action==='score'){
      const width=integer(body.width_px),height=integer(body.height_px),loaded=text(body.load_status).toLowerCase()==='loaded';const primary=String(image.featured_image_url||'').trim()===String(image.image_url||'').trim();const altLength=text(image.alt_text).length;const qualityScore=score({primary,width,height,altLength,loaded});const accepted=primary&&loaded&&width>=PRIMARY_MIN_WIDTH&&height>=PRIMARY_MIN_HEIGHT&&altLength>=PRIMARY_MIN_ALT&&qualityScore>=PRIMARY_MIN_SCORE;const acceptance=primary?(accepted?'accepted':'needs_review'):'supporting';
      const result=await db.prepare(`INSERT INTO product_image_quality_reviews (product_id,product_image_id,image_url,image_role,width_px,height_px,alt_text_length,load_status,quality_score,acceptance_status,review_source,reviewed_by_user_id,reviewed_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?, 'browser_measurement_v172',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(product_id,product_image_id) DO UPDATE SET image_url=excluded.image_url,image_role=excluded.image_role,width_px=excluded.width_px,height_px=excluded.height_px,alt_text_length=excluded.alt_text_length,load_status=excluded.load_status,quality_score=excluded.quality_score,acceptance_status=excluded.acceptance_status,review_source=excluded.review_source,reviewed_by_user_id=excluded.reviewed_by_user_id,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`).bind(image.product_id,imageId,text(image.image_url,2048),primary?'primary':'supporting',width,height,altLength,loaded?'loaded':'error',qualityScore,acceptance,Number(admin.user_id||0)||null).run();measured+=rowsRead(result);
      if(typeof context.waitUntil==='function')context.waitUntil(auditAdminAction(context.env,context.request,admin,{action_type:'score_product_image_v172',target_type:'product_image',target_id:imageId,target_key:String(image.image_url||imageId),details:{product_id:image.product_id,quality_score:qualityScore,acceptance_status:acceptance}}).catch(()=>null));
      return json({ok:true,action:'score',product_image_id:imageId,product_id:image.product_id,quality_score:qualityScore,acceptance_status:acceptance,checks:{loaded,dimensions_ok:width>=PRIMARY_MIN_WIDTH&&height>=PRIMARY_MIN_HEIGHT,alt_ok:altLength>=PRIMARY_MIN_ALT,score_ok:qualityScore>=PRIMARY_MIN_SCORE},thresholds:{min_width_px:PRIMARY_MIN_WIDTH,min_height_px:PRIMARY_MIN_HEIGHT,min_alt_characters:PRIMARY_MIN_ALT,min_quality_score:PRIMARY_MIN_SCORE},message:'Selected image score saved.',d1_rows_read:measured},200,{'X-DD-D1-Rows-Read':String(measured)});
    }

    if(action!=='save_metadata')return json({ok:false,error:'Unsupported image action.'},400);
    const fields={alt_text:text(body.alt_text,1000),image_title:text(body.image_title,250)||null,caption:text(body.caption,2000)||null,focal_point_x:optionalNumber(body.focal_point_x,0,1),focal_point_y:optionalNumber(body.focal_point_y,0,1),annotation_notes:text(body.annotation_notes,3000)||null,image_role:text(body.image_role,80)||null,public_use_status:text(body.public_use_status||'internal_review',80)||'internal_review',role_review_notes:text(body.role_review_notes,1500)||null};
    const sortOrder=integer(body.sort_order);
    let result;
    // When changing the featured image, prove the Product pointer update first so a publication guard
    // cannot leave metadata half-saved while the main-image change failed.
    if(body.set_featured===true){result=await db.prepare('UPDATE products SET featured_image_url=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=?').bind(text(image.image_url,2048),image.product_id).run();measured+=rowsRead(result);}
    result=await db.prepare('UPDATE product_images SET alt_text=?,sort_order=? WHERE product_image_id=? AND product_id=?').bind(fields.alt_text||null,sortOrder,imageId,image.product_id).run();measured+=rowsRead(result);
    const annotation=await upsertAnnotation(db,{product_id:image.product_id,product_image_id:imageId,image_url:image.image_url,fields});measured+=annotation.rows_read;
    if(typeof context.waitUntil==='function')context.waitUntil(auditAdminAction(context.env,context.request,admin,{action_type:'update_product_image_v172',target_type:'product_image',target_id:imageId,target_key:String(image.image_url||imageId),details:{product_id:image.product_id,set_featured:body.set_featured===true,saved_annotation_fields:annotation.saved_fields,unsupported_annotation_fields:annotation.unsupported_fields}}).catch(()=>null));
    return json({ok:true,action:'save_metadata',product_image_id:imageId,product_id:image.product_id,message:'Image details saved.',save_confirmed:true,scoring_started:false,annotation_saved_fields:annotation.saved_fields,annotation_unsupported_fields:annotation.unsupported_fields,warning:annotation.warning||'',d1_rows_read:measured},200,{'X-DD-D1-Rows-Read':String(measured)});
  }catch(error){const message=String(error?.message||'Product image update failed.');const quota=/rows read|daily|limit|quota|7500/i.test(message);return json({ok:false,error:quota?'D1 read capacity is temporarily unavailable. Image Editor will not retry automatically.':message,code:quota?'d1_read_capacity_unavailable':'product_image_update_failed',retry_automatically:false},quota?503:500);}
}
