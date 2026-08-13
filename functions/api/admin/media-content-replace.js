import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";
import { requireAdminStepUp } from "../_lib/adminStepUp.js";

function json(data,status=200){return jsonResponse(data,status,{"Cache-Control":"no-store"});}
function mimeExtension(filename,mime){const byName=String(filename||'').match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();if(byName)return byName;return ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/svg+xml':'svg','image/avif':'avif'})[String(mime||'').toLowerCase()]||'';}

export async function onRequestPost(context){
  const {request,env}=context;const db=getDb(env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const adminUser=await getAdminUserFromRequest(request,env);if(!adminUser)return json({ok:false,error:'Admin access required.'},401);
  let form;try{form=await request.formData();}catch{return json({ok:false,error:'Expected multipart/form-data.'},400);}
  const mediaAssetId=Number(form.get('media_asset_id')||0);const file=form.get('file');if(!Number.isInteger(mediaAssetId)||mediaAssetId<=0)return json({ok:false,error:'A valid media item is required.'},400);if(!file||typeof file.arrayBuffer!=='function')return json({ok:false,error:'Choose a replacement image file.'},400);
  const mime=normalizeText(file.type).toLowerCase();if(!mime.startsWith('image/'))return json({ok:false,error:'Replacement must be an image.'},400);if(Number(file.size||0)<=0||Number(file.size||0)>10*1024*1024)return json({ok:false,error:'Replacement image must be between 1 byte and 10 MB.'},400);
  const asset=await db.prepare(`SELECT media_asset_id,object_key,public_url,mime_type,original_filename FROM media_assets WHERE media_asset_id=? AND deleted_at IS NULL LIMIT 1`).bind(mediaAssetId).first();if(!asset)return json({ok:false,error:'Media item not found.'},404);
  const oldExt=mimeExtension(asset.object_key,asset.mime_type),newExt=mimeExtension(file.name,mime);if(oldExt&&newExt&&oldExt!==newExt)return json({ok:false,error:`To keep the same public placement/key, replace this ${oldExt.toUpperCase()} file with another ${oldExt.toUpperCase()} file. Use a new library upload if the file format must change.`},409);
  const step=await requireAdminStepUp(request,env,adminUser,{confirm_password:normalizeText(form.get('confirm_password'))},'public media replacement');if(!step.ok)return step.response;
  const bucket=env.PRODUCT_MEDIA_BUCKET||env.MEDIA_BUCKET||env.R2_PRODUCT_MEDIA;if(!bucket?.put)return json({ok:false,error:'Public R2 media binding is missing.'},500);
  const buffer=await file.arrayBuffer();await bucket.put(asset.object_key,buffer,{httpMetadata:{contentType:mime,cacheControl:'public, max-age=31536000, immutable'},customMetadata:{original_name:normalizeText(file.name)||asset.original_filename||'',replaced_by_user_id:String(adminUser.user_id||''),replaced_at:new Date().toISOString()}});
  await db.prepare(`UPDATE media_assets SET original_filename=?,mime_type=?,file_size_bytes=?,updated_at=CURRENT_TIMESTAMP WHERE media_asset_id=?`).bind(normalizeText(file.name)||asset.original_filename||null,mime,Number(file.size||0),mediaAssetId).run();
  try{await db.prepare(`INSERT INTO media_content_change_audit(action_type,media_asset_id,page_path,actor_user_id,old_value_json,new_value_json,reason,created_at) VALUES('replace_media_file',?,NULL,?,?,?,?,CURRENT_TIMESTAMP)`).bind(mediaAssetId,adminUser.user_id,JSON.stringify({filename:asset.original_filename,mime_type:asset.mime_type}),JSON.stringify({filename:normalizeText(file.name),mime_type:mime,file_size_bytes:Number(file.size||0)}),'Replaced file while preserving media identity and assignments').run();}catch{}
  await auditAdminAction(env,request,adminUser,{action_type:'media_file_replace',target_type:'media_asset',target_id:mediaAssetId,target_key:asset.object_key,details:{old_filename:asset.original_filename,new_filename:normalizeText(file.name),file_size_bytes:Number(file.size||0)}});
  return json({ok:true,message:'Image file replaced. The same Media Studio placements and metadata were preserved; cache-busted page manifests will request the new file.',media_asset_id:mediaAssetId,object_key:asset.object_key});
}
