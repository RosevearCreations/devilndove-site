// Release 467 Build 389: single-product protected videos; explicit approval and attach only.
// No implicit publication, delete, R2 list, media scoring, schema inspection or automatic retries.
import {auditAdminAction,getDb,jsonResponse} from '../_lib/adminAudit.js';
const json=(body,status=200)=>jsonResponse(body,status,{'Cache-Control':'no-store'});
const admin=context=>{const u=context?.data?.ddModuleAccess?.user;return u&&String(u.role||'').toLowerCase()==='admin'?u:null;};
const clean=(v,n=250)=>String(v??'').trim().slice(0,n);
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const bucket=env=>env.PRODUCT_MEDIA_BUCKET||env.MEDIA_BUCKET||env.R2_PRODUCT_MEDIA||null;
const publicBase=env=>clean(env.PRODUCT_MEDIA_PUBLIC_BASE_URL||env.R2_PUBLIC_BASE_URL||env.PUBLIC_R2_BASE_URL||env.ASSET_ORIGIN||'https://assets.devilndove.com',500).replace(/\/$/,'');
const safeName=v=>clean(v,120).replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-');
const q=`SELECT product_video_id,product_id,video_url,original_filename,mime_type,file_size_bytes,video_title,caption,alt_description,publication_status,created_at FROM product_video_attachments WHERE product_id=? ORDER BY product_video_id DESC LIMIT 12`;
export async function onRequestGet(context){
 if(!admin(context))return json({ok:false,error:'Admin permission required'},401);
 const product=id(new URL(context.request.url).searchParams.get('product_id'));if(!product)return json({ok:false,error:'Valid Product ID required'},400);
 try{const d=getDb(context.env);const r=await d.prepare(q).bind(product).all();
 return json({ok:true,videos:r?.results||[],read_only:true,approval_required:true});}
 catch{return json({ok:false,error:'Video attachments are unavailable until the canonical migration completes'},503);}
}
export async function onRequestPost(context){
 const actor=admin(context);if(!actor)return json({ok:false,error:'Admin permission required'},401);
 if(context.request.headers.get('Origin')!==new URL(context.request.url).origin)return json({ok:false,error:'Same-origin operator action required'},403);
 const db=getDb(context.env),media=bucket(context.env);if(!db)return json({ok:false,error:'Database unavailable'},503);
 const type=clean(context.request.headers.get('content-type'),100);
 try{
  if(type.includes('application/json')){
   const body=await context.request.json(),product=id(body.product_id),videoId=id(body.product_video_id);
   if(body.action!=='review'||!product||!videoId)return json({ok:false,error:'Valid Product, video and explicit review action required'},400);
   const status=clean(body.publication_status,32);
   if(!['internal_review','product_page_ok','blocked'].includes(status))return json({ok:false,error:'Unsupported video approval status'},400);
   const result=await db.prepare(`UPDATE product_video_attachments SET video_title=?,caption=?,alt_description=?,publication_status=?,updated_at=CURRENT_TIMESTAMP WHERE product_video_id=? AND product_id=?`)
    .bind(clean(body.video_title,160),clean(body.caption,1000),clean(body.alt_description,500),status,videoId,product).run();
   if(!Number(result?.meta?.changes))return json({ok:false,error:'Video not found for this Product'},404);
   return json({ok:true,product_video_id:videoId,publication_status:status,message:'OK — video review saved'});
  }
  if(!type.includes('multipart/form-data'))return json({ok:false,error:'Expected video upload or review JSON'},400);
  if(!media||typeof media.put!=='function')return json({ok:false,error:'R2 media binding unavailable'},503);
  const form=await context.request.formData(),product=id(form.get('product_id')),file=form.get('file');
  if(!product||!file||typeof file.arrayBuffer!=='function')return json({ok:false,error:'Select a saved Product and one video file'},400);
  const extension=(String(file.name||'').split('.').pop()||'').toLowerCase();
  const kinds={mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime'};
  const mime=kinds[extension];
  if(!mime||file.type&&file.type!==mime)return json({ok:false,error:'Only MP4, WebM or MOV videos are accepted'},415);
  const size=Number(file.size||0);
  if(size<=0||size>25*1024*1024)return json({ok:false,error:'Video must be 25 MB or smaller. Compress larger videos before upload.'},413);
  const exists=await db.prepare('SELECT product_id FROM products WHERE product_id=? LIMIT 1').bind(product).first();
  if(!exists)return json({ok:false,error:'Save Product before adding video'},404);
  const objectKey=`products/${product}/video/${crypto.randomUUID()}-${safeName(file.name||'clip.mp4')}`;
  await media.put(objectKey,await file.arrayBuffer(),{httpMetadata:{contentType:mime,cacheControl:'public,max-age=31536000,immutable'},customMetadata:{product_id:String(product),source:'build389-product-video',uploaded_by_user_id:String(actor.user_id||'')}});
  const url=`${publicBase(context.env)}/${objectKey}`;
  try{
   const r=await db.prepare(`INSERT INTO product_video_attachments
    (product_id,object_key,video_url,original_filename,mime_type,file_size_bytes,video_title,caption,alt_description,publication_status,uploaded_by_user_id)
    VALUES(?,?,?,?,?,?,?,?,?,'internal_review',?)`)
    .bind(product,objectKey,url,clean(file.name,120),mime,size,clean(form.get('video_title'),160),clean(form.get('caption'),1000),
     clean(form.get('alt_description'),500),id(actor.user_id)||null).run();
   const newId=Number(r?.meta?.last_row_id||0);
   if(!newId)throw Error('Video source row not confirmed');
   if(typeof context.waitUntil==='function')context.waitUntil(auditAdminAction(context.env,context.request,actor,{action_type:'add_product_video_build389',target_type:'product_video',target_id:newId,target_key:objectKey,details:{product_id:product,file_size_bytes:size,publication_status:'internal_review'}}).catch(()=>null));
   return json({ok:true,product_video_id:newId,publication_status:'internal_review',video_url:url,message:'OK — video attached privately for review. Product-page approval is a separate action.'});
  }catch(e){try{await media.delete(objectKey)}catch{};return json({ok:false,error:'Video storage completed but attachment was not confirmed; inspect Product Video attachments before retrying.',retry_automatically:false},503);}
 }catch{return json({ok:false,error:'Video write outcome could not be confirmed. Inspect Product attachments; do not retry automatically.',retry_automatically:false},503);}
}
