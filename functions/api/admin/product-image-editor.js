// Release 467 Build 163 — selected Product image editor + explicit scoring.
// Every request targets one product_image_id. Scoring occurs only after the operator clicks
// Measure & Score. No catalog scan, R2 listing, timer, readiness scan, or request-time DDL.
import { auditAdminAction, getDb, jsonResponse } from '../_lib/adminAudit.js';

const PRIMARY_MIN_WIDTH=1200;
const PRIMARY_MIN_HEIGHT=1200;
const PRIMARY_MIN_ALT=12;
const PRIMARY_MIN_SCORE=70;
function json(data,status=200,headers={}){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-D1-Contract':'selected-product-image-v163',...headers});}
function adminFromContext(context){const user=context?.data?.ddModuleAccess?.user||null;return user&&String(user.role||'').toLowerCase()==='admin'?user:null;}
function text(value,max=0){const v=String(value??'').trim();return max>0?v.slice(0,max):v;}
function optionalNumber(value,min=0,max=100){if(value==null||value==='')return null;const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):null;}
function integer(value){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.trunc(n)):0;}
function rowsRead(result){const n=Number(result?.meta?.rows_read??result?.meta?.rowsRead);return Number.isFinite(n)&&n>=0?n:0;}
function score({primary=false,width=0,height=0,altLength=0,loaded=false}){let total=0;if(loaded)total+=15;if(width>=PRIMARY_MIN_WIDTH&&height>=PRIMARY_MIN_HEIGHT)total+=45;if(altLength>=PRIMARY_MIN_ALT)total+=20;if(primary)total+=20;return Math.max(0,Math.min(100,total));}
async function selectedImage(db,imageId){
  const result=await db.prepare(`
    SELECT pi.product_image_id,pi.product_id,pi.image_url,pi.alt_text,pi.sort_order,
           p.name AS product_name,p.featured_image_url,
           pia.image_title,pia.caption,pia.focal_point_x,pia.focal_point_y,pia.annotation_notes,
           pia.image_role,pia.public_use_status,pia.role_review_notes,
           qr.width_px,qr.height_px,qr.load_status,qr.quality_score,qr.acceptance_status,qr.reviewed_at
    FROM product_images pi
    INNER JOIN products p ON p.product_id=pi.product_id
    LEFT JOIN product_image_annotations pia ON pia.product_image_id=pi.product_image_id
    LEFT JOIN product_image_quality_reviews qr ON qr.product_id=pi.product_id AND qr.product_image_id=pi.product_image_id
    WHERE pi.product_image_id=? LIMIT 1
  `).bind(imageId).all();
  return {row:(result?.results||[])[0]||null,rows_read:rowsRead(result)};
}
export async function onRequestGet(context){
  const admin=adminFromContext(context);if(!admin)return json({ok:false,error:'Administrator authorization was not established by the route guard.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const imageId=Number(new URL(context.request.url).searchParams.get('product_image_id'));if(!Number.isInteger(imageId)||imageId<=0)return json({ok:false,error:'A valid product_image_id is required.'},400);
  try{
    const selected=await selectedImage(db,imageId);if(!selected.row)return json({ok:false,error:'Product image was not found.'},404);
    return json({ok:true,image:selected.row,primary:String(selected.row.featured_image_url||'').trim()===String(selected.row.image_url||'').trim(),thresholds:{min_width_px:PRIMARY_MIN_WIDTH,min_height_px:PRIMARY_MIN_HEIGHT,min_alt_characters:PRIMARY_MIN_ALT,min_quality_score:PRIMARY_MIN_SCORE},delivery:'selected-product-image-v163',d1_rows_read:selected.rows_read},200,{'X-DD-D1-Rows-Read':String(selected.rows_read)});
  }catch(error){const message=String(error?.message||'Product image read failed.');const quota=/rows read|daily|limit|quota|7500/i.test(message);return json({ok:false,error:quota?'D1 read capacity is temporarily unavailable. Image Editor will not retry automatically.':message,code:quota?'d1_read_capacity_unavailable':'product_image_read_failed',retry_automatically:false},quota?503:500);}
}

export async function onRequestPost(context){
  const admin=adminFromContext(context);if(!admin)return json({ok:false,error:'Administrator authorization was not established by the route guard.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const imageId=Number(body.product_image_id);if(!Number.isInteger(imageId)||imageId<=0)return json({ok:false,error:'A valid product_image_id is required.'},400);
  const action=text(body.action||'save_metadata',40).toLowerCase();
  try{
    const selected=await selectedImage(db,imageId);const image=selected.row;if(!image)return json({ok:false,error:'Product image was not found.'},404);
    let measured=selected.rows_read;
    if(action==='score'){
      const width=integer(body.width_px),height=integer(body.height_px),loaded=text(body.load_status).toLowerCase()==='loaded';
      const primary=String(image.featured_image_url||'').trim()===String(image.image_url||'').trim();
      const altLength=text(image.alt_text).length;const qualityScore=score({primary,width,height,altLength,loaded});
      const accepted=primary&&loaded&&width>=PRIMARY_MIN_WIDTH&&height>=PRIMARY_MIN_HEIGHT&&altLength>=PRIMARY_MIN_ALT&&qualityScore>=PRIMARY_MIN_SCORE;
      const acceptance=primary?(accepted?'accepted':'needs_review'):'supporting';
      const result=await db.prepare(`
        INSERT INTO product_image_quality_reviews (product_id,product_image_id,image_url,image_role,width_px,height_px,alt_text_length,load_status,quality_score,acceptance_status,review_source,reviewed_by_user_id,reviewed_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?, 'browser_measurement_v163',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT(product_id,product_image_id) DO UPDATE SET image_url=excluded.image_url,image_role=excluded.image_role,width_px=excluded.width_px,height_px=excluded.height_px,alt_text_length=excluded.alt_text_length,load_status=excluded.load_status,quality_score=excluded.quality_score,acceptance_status=excluded.acceptance_status,review_source=excluded.review_source,reviewed_by_user_id=excluded.reviewed_by_user_id,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
      `).bind(image.product_id,imageId,text(image.image_url,2048),primary?'primary':'supporting',width,height,altLength,loaded?'loaded':'error',qualityScore,acceptance,Number(admin.user_id||0)||null).run();measured+=rowsRead(result);
      if(typeof context.waitUntil==='function')context.waitUntil(auditAdminAction(context.env,context.request,admin,{action_type:'score_product_image_v163',target_type:'product_image',target_id:imageId,target_key:String(image.image_url||imageId),details:{product_id:image.product_id,quality_score:qualityScore,acceptance_status:acceptance}}).catch(()=>null));
      return json({ok:true,action:'score',product_image_id:imageId,product_id:image.product_id,quality_score:qualityScore,acceptance_status:acceptance,checks:{loaded,dimensions_ok:width>=PRIMARY_MIN_WIDTH&&height>=PRIMARY_MIN_HEIGHT,alt_ok:altLength>=PRIMARY_MIN_ALT,score_ok:qualityScore>=PRIMARY_MIN_SCORE},thresholds:{min_width_px:PRIMARY_MIN_WIDTH,min_height_px:PRIMARY_MIN_HEIGHT,min_alt_characters:PRIMARY_MIN_ALT,min_quality_score:PRIMARY_MIN_SCORE},d1_rows_read:measured},200,{'X-DD-D1-Rows-Read':String(measured)});
    }
    if(action!=='save_metadata')return json({ok:false,error:'Unsupported image action.'},400);
    const alt=text(body.alt_text,1000);const sortOrder=integer(body.sort_order);const imageTitle=text(body.image_title,250)||null;const caption=text(body.caption,2000)||null;
    const focalX=optionalNumber(body.focal_point_x,0,100),focalY=optionalNumber(body.focal_point_y,0,100);const notes=text(body.annotation_notes,3000)||null;
    const imageRole=text(body.image_role,80)||null;const publicUse=text(body.public_use_status||'internal_review',80)||'internal_review';const roleNotes=text(body.role_review_notes,1500)||null;
    let result=await db.prepare('UPDATE product_images SET alt_text=?,sort_order=? WHERE product_image_id=? AND product_id=?').bind(alt||null,sortOrder,imageId,image.product_id).run();measured+=rowsRead(result);
    result=await db.prepare(`UPDATE product_image_annotations SET alt_text=?,image_title=?,caption=?,focal_point_x=?,focal_point_y=?,annotation_notes=?,image_role=?,public_use_status=?,role_review_notes=?,updated_at=CURRENT_TIMESTAMP WHERE product_image_id=?`).bind(alt||null,imageTitle,caption,focalX,focalY,notes,imageRole,publicUse,roleNotes,imageId).run();measured+=rowsRead(result);
    if(Number(result?.meta?.changes||0)<1){result=await db.prepare(`INSERT INTO product_image_annotations (product_id,product_image_id,image_url,alt_text,image_title,caption,focal_point_x,focal_point_y,annotation_notes,image_role,public_use_status,role_review_notes,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(image.product_id,imageId,text(image.image_url,2048),alt||null,imageTitle,caption,focalX,focalY,notes,imageRole,publicUse,roleNotes).run();measured+=rowsRead(result);}
    if(body.set_featured===true){result=await db.prepare('UPDATE products SET featured_image_url=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=?').bind(text(image.image_url,2048),image.product_id).run();measured+=rowsRead(result);}
    if(typeof context.waitUntil==='function')context.waitUntil(auditAdminAction(context.env,context.request,admin,{action_type:'update_product_image_v163',target_type:'product_image',target_id:imageId,target_key:String(image.image_url||imageId),details:{product_id:image.product_id,set_featured:body.set_featured===true}}).catch(()=>null));
    return json({ok:true,action:'save_metadata',product_image_id:imageId,product_id:image.product_id,message:'Image details saved. Scoring was not run automatically.',scoring_started:false,d1_rows_read:measured},200,{'X-DD-D1-Rows-Read':String(measured)});
  }catch(error){const message=String(error?.message||'Product image update failed.');const quota=/rows read|daily|limit|quota|7500/i.test(message);return json({ok:false,error:quota?'D1 read capacity is temporarily unavailable. Image Editor will not retry automatically.':message,code:quota?'d1_read_capacity_unavailable':'product_image_update_failed',retry_automatically:false},quota?503:500);}
}
