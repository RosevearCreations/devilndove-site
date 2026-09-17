// Release 467 Build 172 — explicit one-file Product image add/replace authority.
// One R2 PUT plus bounded selected-Product D1 work. No R2 listing, request-time DDL, or catalog scan.
import { auditAdminAction, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { rowsRead, upsertAnnotation } from './_productImageAnnotationsV172.js';

function json(data,status=200,headers={}){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-D1-Contract':'product-image-file-v172',...headers});}
function adminFromContext(context){const user=context?.data?.ddModuleAccess?.user||null;return user&&String(user.role||'').toLowerCase()==='admin'?user:null;}
function clean(value,max=0){const text=String(value??'').trim();return max>0?text.slice(0,max):text;}
function integer(value,min=0,max=Number.MAX_SAFE_INTEGER){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.trunc(n))):min;}
function bucketFromEnv(env){return env.PRODUCT_MEDIA_BUCKET||env.MEDIA_BUCKET||env.R2_PRODUCT_MEDIA||null;}
function publicBase(env){return clean(env.PRODUCT_MEDIA_PUBLIC_BASE_URL||env.R2_PUBLIC_BASE_URL||env.PUBLIC_R2_BASE_URL||env.ASSET_ORIGIN||'https://assets.devilndove.com',500).replace(/\/$/,'');}
function sanitizeName(value){return clean(value||'product-image',180).replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').replace(/^[-.]+|[-.]+$/g,'')||'product-image';}
function extension(file){const name=String(file?.name||'');const fromName=name.match(/\.([a-zA-Z0-9]{2,5})$/)?.[1]?.toLowerCase();if(fromName)return fromName;return ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/avif':'avif'})[String(file?.type||'').toLowerCase()]||'bin';}
function orientation(value,width,height){const explicit=clean(value,20).toLowerCase();if(['square','landscape','portrait'].includes(explicit))return explicit;if(!width||!height)return null;if(Math.abs(width-height)<=Math.max(24,width*.03))return 'square';return width>height?'landscape':'portrait';}
async function cleanupR2(bucket,key){if(bucket&&key&&typeof bucket.delete==='function')try{await bucket.delete(key);}catch{} }

export async function onRequestPost(context){
  const admin=adminFromContext(context);if(!admin)return json({ok:false,error:'Administrator authorization was not established by the route guard.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const bucket=bucketFromEnv(context.env);if(!bucket||typeof bucket.put!=='function')return json({ok:false,error:'R2 media bucket binding is missing.'},500);
  let form;try{form=await context.request.formData();}catch{return json({ok:false,error:'Expected multipart/form-data.'},400);}
  const action=clean(form.get('action')||'add',20).toLowerCase();if(!['add','replace'].includes(action))return json({ok:false,error:'Unsupported image file action.'},400);
  const productId=integer(form.get('product_id'));if(productId<=0)return json({ok:false,error:'A valid product_id is required.'},400);
  const imageId=integer(form.get('product_image_id'));if(action==='replace'&&imageId<=0)return json({ok:false,error:'A selected product_image_id is required for replacement.'},400);
  const file=form.get('file');if(!file||typeof file.arrayBuffer!=='function')return json({ok:false,error:'An image file is required.'},400);
  const mime=clean(file.type||'application/octet-stream',120).toLowerCase();if(!mime.startsWith('image/'))return json({ok:false,error:'Only image uploads are supported.'},400);
  const size=Number(file.size||0);if(size<=0)return json({ok:false,error:'Uploaded image is empty.'},400);if(size>10*1024*1024)return json({ok:false,error:'Image uploads must be 10 MB or smaller.'},400);

  let measured=0;let existing=null;let objectKey='';let publicUrl='';
  try{
    if(action==='add'){
      const productResult=await db.prepare('SELECT product_id,name FROM products WHERE product_id=? LIMIT 1').bind(productId).all();measured+=rowsRead(productResult);const product=(productResult?.results||[])[0]||null;if(!product)return json({ok:false,error:'Product was not found.'},404);
    }else{
      const selected=await db.prepare('SELECT product_image_id,product_id,image_url,alt_text,sort_order FROM product_images WHERE product_image_id=? AND product_id=? LIMIT 1').bind(imageId,productId).all();measured+=rowsRead(selected);existing=(selected?.results||[])[0]||null;if(!existing)return json({ok:false,error:'Selected Product image was not found.',code:'canonical_product_image_missing'},404);
    }

    const ext=extension(file),safe=sanitizeName(file.name||`product-${productId}.${ext}`);objectKey=`products/${productId}/editor/${Date.now()}-${crypto.randomUUID()}-${safe.replace(/\.[^.]+$/,'')}.${ext}`;const buffer=await file.arrayBuffer();
    await bucket.put(objectKey,buffer,{httpMetadata:{contentType:mime,cacheControl:'public, max-age=31536000, immutable'},customMetadata:{product_id:String(productId),product_image_id:action==='replace'?String(imageId):'',uploaded_by_user_id:String(admin.user_id||''),source:'product-image-file-v172'}});
    publicUrl=`${publicBase(context.env)}/${objectKey}`;const sortOrder=integer(form.get('sort_order'),0,999);const alt=clean(form.get('alt_text')||file.name||'',1000);const width=integer(form.get('width_px'),0,100000);const height=integer(form.get('height_px'),0,100000);const orient=orientation(form.get('image_orientation'),width,height);
    let targetImageId=imageId;
    if(action==='add'){
      let insert;
      try{insert=await db.prepare('INSERT INTO product_images (product_id,image_url,alt_text,sort_order,created_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP)').bind(productId,publicUrl,alt||null,sortOrder).run();}
      catch(error){await cleanupR2(bucket,objectKey);throw error;}
      targetImageId=Number(insert?.meta?.last_row_id||0);if(!targetImageId){await cleanupR2(bucket,objectKey);return json({ok:false,error:'Image upload was rolled back because the Product image row could not be created.'},500);}
      const annotation=await upsertAnnotation(db,{product_id:productId,product_image_id:targetImageId,image_url:publicUrl,fields:{alt_text:alt||null,width_px:width||null,height_px:height||null,image_orientation:orient}});measured+=annotation.rows_read;
      if(typeof context.waitUntil==='function')context.waitUntil(auditAdminAction(context.env,context.request,admin,{action_type:'add_product_image_v172',target_type:'product_image',target_id:targetImageId,target_key:objectKey,details:{product_id:productId,public_url:publicUrl,file_size_bytes:size,width_px:width,height_px:height,image_orientation:orient,annotation_warning:annotation.warning||''}}).catch(()=>null));
      return json({ok:true,action,product_id:productId,product_image_id:targetImageId,image_url:publicUrl,object_key:objectKey,width_px:width,height_px:height,image_orientation:orient,persistence:'product_images_committed',save_confirmed:true,message:'Image added and saved to the Product gallery.',warning:annotation.warning||'',annotation_saved_fields:annotation.saved_fields,d1_rows_read:measured,r2_listing:false,automatic_scoring:false},200,{'X-DD-D1-Rows-Read':String(measured)});
    }

    await db.prepare('UPDATE product_images SET image_url=?,alt_text=?,sort_order=? WHERE product_image_id=? AND product_id=?').bind(publicUrl,alt||existing.alt_text||null,sortOrder,targetImageId,productId).run();
    const annotation=await upsertAnnotation(db,{product_id:productId,product_image_id:targetImageId,image_url:publicUrl,fields:{alt_text:alt||existing.alt_text||null,width_px:width||null,height_px:height||null,image_orientation:orient}});measured+=annotation.rows_read;
    const warnings=[];if(annotation.warning)warnings.push(annotation.warning);
    try{await db.prepare('DELETE FROM product_image_quality_reviews WHERE product_id=? AND product_image_id=?').bind(productId,targetImageId).run();}catch(error){warnings.push(`Quality review reset skipped: ${clean(error?.message,180)}`);}
    try{await db.prepare('UPDATE products SET featured_image_url=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=? AND featured_image_url=?').bind(publicUrl,productId,existing.image_url||'').run();}catch(error){warnings.push(`Featured image reference update skipped: ${clean(error?.message,180)}`);}
    try{await db.prepare('UPDATE product_media_role_assignments SET image_url=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=? AND product_image_id=?').bind(publicUrl,productId,targetImageId).run();}catch(error){warnings.push(`Media role URL update skipped: ${clean(error?.message,180)}`);}
    if(typeof context.waitUntil==='function')context.waitUntil(auditAdminAction(context.env,context.request,admin,{action_type:'replace_product_image_v172',target_type:'product_image',target_id:targetImageId,target_key:objectKey,details:{product_id:productId,public_url:publicUrl,file_size_bytes:size,width_px:width,height_px:height,image_orientation:orient,r2_source_preserved:true,warnings}}).catch(()=>null));
    return json({ok:true,action,product_id:productId,product_image_id:targetImageId,image_url:publicUrl,object_key:objectKey,width_px:width,height_px:height,image_orientation:orient,persistence:'product_images_committed',save_confirmed:true,message:'Replacement image saved.',warning:warnings.join(' '),annotation_saved_fields:annotation.saved_fields,d1_rows_read:measured,r2_listing:false,automatic_scoring:false},200,{'X-DD-D1-Rows-Read':String(measured)});
  }catch(error){const message=String(error?.message||'Product image file update failed.');const quota=/rows read|daily|limit|quota|7500/i.test(message);return json({ok:false,error:quota?'D1 read capacity is temporarily unavailable. Image file update will not retry automatically.':message,code:quota?'d1_read_capacity_unavailable':'product_image_file_failed',retry_automatically:false},quota?503:500);}
}
