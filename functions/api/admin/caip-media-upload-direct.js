// Build 279 — CPU-hardened idempotent direct CAIP upload; verified R2 binary success is never downgraded by later metadata repair.
import { captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { completeDirectUploadFile, DIRECT_UPLOAD_MAX_BYTES, privateBucketAvailable } from '../_lib/caipMediaIntake.js';
function json(data,status=200){return jsonResponse(data,status,{'Cache-Control':'no-store'});}
function integer(value){const n=Number(value||0);return Number.isInteger(n)&&n>0?n:0;}
function sameOrigin(request){const origin=request.headers.get('Origin');if(!origin)return true;try{return new URL(origin).host===new URL(request.url).host;}catch{return false;}}
async function markBinaryStored(db,row,head,userId,warning=''){try{await db.prepare(`UPDATE caip_media_upload_files SET upload_status='uploaded',uploaded_parts=expected_parts,uploaded_bytes=file_size_bytes,etag=COALESCE(?,etag),uploaded_at=COALESCE(uploaded_at,CURRENT_TIMESTAMP),last_error=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_file_id=?`).bind(head?.etag||null,warning?`Binary stored; CAIP registration pending: ${String(warning).slice(0,900)}`:null,Number(userId||0)||null,row.caip_media_upload_file_id).run();}catch{}}
export async function onRequestPut(context){
  const {request,env}=context; const adminUser=await getAdminUserFromRequest(request,env); if(!adminUser)return json({ok:false,error:'Admin access required.'},401);
  if(!sameOrigin(request))return json({ok:false,error:'Cross-origin CAIP uploads are not allowed.'},403);
  const db=getDb(env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const fileId=integer(new URL(request.url).searchParams.get('file_id')); if(!fileId||!request.body)return json({ok:false,error:'File ID and request body are required.'},400);
  try{
    if(!privateBucketAvailable(env))throw new Error('CAIP_PRIVATE_MEDIA_BUCKET is not configured.');
    const row=await db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=? LIMIT 1`).bind(fileId).first();
    if(!row)throw new Error('CAIP upload file was not found.'); if(row.upload_status==='uploaded' && Number(row.creative_asset_id||0)>0)return json({ok:true,already_complete:true,file:row}); if(row.upload_status==='aborted')throw new Error('Upload has been aborted.');
    const expected=Number(row.file_size_bytes||0); if(expected<=0||expected>DIRECT_UPLOAD_MAX_BYTES)throw new Error('This file must use the multipart upload path.');
    const bucket=env.CAIP_PRIVATE_MEDIA_BUCKET;
    const existing=await bucket.head(row.object_key).catch(()=>null);
    if(existing && Number(existing.size||0)===expected){
      try {
        const completed=await completeDirectUploadFile(db,env,fileId,adminUser.user_id,existing);
        return json({ok:true,direct_upload:true,already_present:true,binary_stored:true,uploaded_bytes:Number(existing.size||expected),etag:existing.etag||null,...completed});
      } catch (registrationError) {
        await markBinaryStored(db,row,existing,adminUser.user_id,registrationError?.message||registrationError);
        return json({ok:true,direct_upload:true,already_present:true,binary_stored:true,registration_pending:true,registration_warning:String(registrationError?.message||registrationError||'CAIP registration is pending.'),uploaded_bytes:Number(existing.size||expected),etag:existing.etag||null,file_id:fileId});
      }
    }
    const object=await bucket.put(row.object_key,request.body,{httpMetadata:{contentType:row.mime_type||request.headers.get('Content-Type')||'application/octet-stream'},customMetadata:{caip_project_id:String(row.creative_project_id),caip_file_id:String(row.caip_media_upload_file_id),media_role:String(row.media_role||'miscellaneous'),privacy_state:String(row.privacy_state||'private')}});
    const head=await bucket.head(row.object_key); if(!head)throw new Error('Private R2 object could not be verified after upload.');
    try {
      const completed=await completeDirectUploadFile(db,env,fileId,adminUser.user_id,head);
      return json({ok:true,direct_upload:true,binary_stored:true,uploaded_bytes:Number(head.size||expected),etag:object?.etag||head.etag||null,...completed});
    } catch (registrationError) {
      await markBinaryStored(db,row,head,adminUser.user_id,registrationError?.message||registrationError);
      return json({ok:true,direct_upload:true,binary_stored:true,registration_pending:true,registration_warning:String(registrationError?.message||registrationError||'CAIP registration is pending.'),uploaded_bytes:Number(head.size||expected),etag:object?.etag||head.etag||null,file_id:fileId});
    }
  }catch(error){
    let verified=null;
    try { const row=await db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=? LIMIT 1`).bind(fileId).first(); const bucket=env.CAIP_PRIVATE_MEDIA_BUCKET; if(row&&bucket&&typeof bucket.head==='function'){const head=await bucket.head(row.object_key);if(head&&Number(head.size||0)===Number(row.file_size_bytes||0)){verified={row,head};await markBinaryStored(db,row,head,adminUser.user_id,error?.message||error);}} } catch {}
    if(verified)return json({ok:true,direct_upload:true,binary_stored:true,registration_pending:true,registration_warning:String(error?.message||error||'CAIP registration is pending.'),uploaded_bytes:Number(verified.head.size||verified.row.file_size_bytes||0),etag:verified.head.etag||null,file_id:fileId});
    await captureRuntimeIncident(env,request,{incident_scope:'caip_media_direct_upload',incident_code:'caip_media_direct_upload_failed',severity:'warning',message:error?.message||'CAIP direct upload failed.',related_user_id:adminUser.user_id,details:{upload_file_id:fileId,error:String(error?.message||error),binary_verified:false}}).catch(()=>null);return json({ok:false,error:error?.message||'CAIP direct upload failed.',error_code:'CAIP_DIRECT_UPLOAD_FAILED',stage:'direct_upload',upload_file_id:fileId},400);}
}
