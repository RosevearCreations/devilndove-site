// Build 279 — CPU-hardened bounded CAIP multipart part path; schema readiness is established by the control plane before binary transfer.
import { captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { privateBucketAvailable, recordPartFailure, recordUploadedPart } from '../_lib/caipMediaIntake.js';

const MAX_FALLBACK_PART_BYTES=256*1024*1024;
function json(data,status=200){return jsonResponse(data,status,{'Cache-Control':'no-store'});}
function integer(value){const n=Number(value||0);return Number.isInteger(n)&&n>0?n:0;}
function sameOrigin(request){const origin=request.headers.get('Origin');if(!origin)return true;try{return new URL(origin).host===new URL(request.url).host;}catch{return false;}}

export async function onRequestPut(context){
  const {request,env}=context;
  const adminUser=await getAdminUserFromRequest(request,env);if(!adminUser)return json({ok:false,error:'Admin access required.'},401);
  if(!sameOrigin(request))return json({ok:false,error:'Cross-origin multipart uploads are not allowed on the Worker-streamed fallback route.'},403);
  const db=getDb(env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const params=new URL(request.url).searchParams;const fileId=integer(params.get('file_id')||params.get('caip_media_upload_file_id'));const partNumber=integer(params.get('part_number'));
  if(!fileId||!partNumber||!request.body)return json({ok:false,error:'File ID, part number, and request body are required.'},400);
  try{
    if(!privateBucketAvailable(env))throw new Error('CAIP_PRIVATE_MEDIA_BUCKET is not configured.');
    const row=await db.prepare(`SELECT f.*,p.caip_media_upload_part_id,p.byte_start,p.byte_end,p.part_size_bytes,p.part_status FROM caip_media_upload_files f JOIN caip_media_upload_parts p ON p.caip_media_upload_file_id=f.caip_media_upload_file_id WHERE f.caip_media_upload_file_id=? AND p.part_number=? LIMIT 1`).bind(fileId,partNumber).first();
    if(!row)throw new Error('Multipart file/part record was not found.');
    if(row.upload_status==='uploaded')return json({ok:true,already_complete:true});
    if(row.upload_status==='aborted')throw new Error('Multipart upload has been aborted.');
    if(!row.r2_upload_id)throw new Error('Multipart upload has not been initiated.');
    if(row.part_status==='uploaded'&&row.etag)return json({ok:true,already_uploaded:true,part_number:partNumber,etag:row.etag});
    const expected=Number(row.part_size_bytes||0);const contentLength=Number(request.headers.get('Content-Length')||0);
    if(!contentLength)throw new Error('Content-Length is required for bounded multipart part uploads.');
    if(contentLength!==expected)throw new Error(`Part ${partNumber} must contain exactly ${expected} bytes; received ${contentLength}.`);
    if(contentLength>MAX_FALLBACK_PART_BYTES)throw new Error('This Worker-streamed fallback limits each part to 256 MiB. Use a smaller configured part size or the future direct-S3 adapter.');
    await db.prepare(`UPDATE caip_media_upload_parts SET part_status='uploading',updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_part_id=?`).bind(row.caip_media_upload_part_id).run();
    const upload=env.CAIP_PRIVATE_MEDIA_BUCKET.resumeMultipartUpload(row.object_key,row.r2_upload_id);
    const uploadedPart=await upload.uploadPart(partNumber,request.body);
    const state=await recordUploadedPart(db,fileId,partNumber,uploadedPart,adminUser.user_id);
    return json({ok:true,part_number:partNumber,etag:uploadedPart.etag,uploaded_bytes:state.file.uploaded_bytes,uploaded_parts:state.file.uploaded_parts,expected_parts:state.file.expected_parts});
  }catch(error){await recordPartFailure(db,fileId,partNumber,error?.message||'Part upload failed.').catch(()=>null);await captureRuntimeIncident(env,request,{incident_scope:'caip_media_part_upload',incident_code:'caip_media_part_failed',severity:'warning',message:error?.message||'CAIP multipart part failed.',related_user_id:adminUser.user_id,details:{upload_file_id:fileId,part_number:partNumber,error:String(error?.message||error),binary_not_logged:true}});return json({ok:false,error:error?.message||'Multipart part upload failed.'},400);}
}
