// Build 241 — authenticated CAIP private large-media intake control plane.
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import {
  CAIP_MEDIA_INTAKE_BUILD, abortUploadFile, assertCaipMediaIntakeSchema, completeUploadFile,
  createUploadSession, initiateUploadFile, listCaipMediaIntake, requestPublicPromotion, retryUploadedFileRegistration,
  safeUploadFileForClient, updateUploadFileGovernance, privateBucketAvailable
} from '../_lib/caipMediaIntake.js';

function json(data,status=200){return jsonResponse(data,status,{'Cache-Control':'no-store'});}
function integer(value){const n=Number(value||0);return Number.isInteger(n)&&n>0?n:0;}
async function access(context){const adminUser=await getAdminUserFromRequest(context.request,context.env);if(!adminUser)return{error:json({ok:false,error:'Admin access required.'},401)};const db=getDb(context.env);if(!db)return{error:json({ok:false,error:'Database binding is not configured.'},500)};return{adminUser,db};}
function scrub(data){if(!data)return data;const clone=JSON.parse(JSON.stringify(data));for(const file of clone.files||[])delete file.r2_upload_id;return clone;}
function intakeErrorCode(error,action=''){
  const message=String(error?.message||error||'').toLowerCase();
  if(message.includes('schema is not installed')) return 'CAIP_MEDIA_SCHEMA_MISSING';
  if(message.includes('valid caip creative project')||message.includes('creative project first')) return 'CAIP_PROJECT_INVALID';
  if(message.includes('private caip r2 binding')||message.includes('caip_private_media_bucket')) return 'CAIP_PRIVATE_BUCKET_UNAVAILABLE';
  if(message.includes('multipart initialization failed')) return 'CAIP_R2_MULTIPART_INIT_FAILED';
  if(message.includes('accepted image, video, or audio')) return 'CAIP_MEDIA_TYPE_REJECTED';
  if(message.includes('foreign key')) return 'CAIP_D1_FOREIGN_KEY_ERROR';
  if(message.includes('no such column')||message.includes('no such table')) return 'CAIP_D1_SCHEMA_DRIFT';
  return action?`CAIP_${String(action).toUpperCase()}_FAILED`:'CAIP_MEDIA_INTAKE_FAILED';
}

export async function onRequestGet(context){
  const state=await access(context);if(state.error)return state.error;
  const projectId=integer(new URL(context.request.url).searchParams.get('creative_project_id'));
  try{return json({ok:true,build:CAIP_MEDIA_INTAKE_BUILD,...scrub(await listCaipMediaIntake(state.db,projectId,context.env))});}
  catch(error){await captureRuntimeIncident(context.env,context.request,{incident_scope:'caip_media_intake',incident_code:'caip_media_intake_get_failed',severity:'warning',message:error?.message||'CAIP media intake could not load.',related_user_id:state.adminUser.user_id,details:{error:String(error?.message||error)}});return json({ok:false,error:error?.message||'CAIP media intake could not load.',mode:'degraded_no_false_success'},500);}
}

export async function onRequestPost(context){
  const state=await access(context);if(state.error)return state.error;
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'A JSON request body is required.'},400);}
  const action=normalizeText(body.action).toLowerCase();
  const projectId=integer(body.creative_project_id)||integer(new URL(context.request.url).searchParams.get('creative_project_id'));
  const fileId=integer(body.caip_media_upload_file_id||body.file_id);
  try{
    await assertCaipMediaIntakeSchema(state.db);
    let result={};
    if(action==='create_session'){ if(!privateBucketAvailable(context.env)) throw new Error('Private CAIP R2 binding is unavailable. Bind the private R2 bucket as CAIP_PRIVATE_MEDIA_BUCKET in the Production Pages environment and redeploy before uploading.'); result=await createUploadSession(state.db,context.env,projectId,body.files,state.adminUser.user_id,{upload_device:body.upload_device,source_note:body.source_note,media_role:body.media_role,privacy_state:body.privacy_state,consent_state:body.consent_state,rights_status:body.rights_status}); }
    else if(action==='initiate_file') result=await initiateUploadFile(state.db,context.env,fileId,state.adminUser.user_id);
    else if(action==='complete_file') result=await completeUploadFile(state.db,context.env,fileId,state.adminUser.user_id);
    else if(action==='abort_file') result=await abortUploadFile(state.db,context.env,fileId,state.adminUser.user_id);
    else if(action==='retry_registration') result=await retryUploadedFileRegistration(state.db,context.env,fileId,state.adminUser.user_id);
    else if(action==='update_governance') result=await updateUploadFileGovernance(state.db,fileId,body,state.adminUser.user_id);
    else if(action==='request_public_promotion') result=await requestPublicPromotion(state.db,fileId,body.destination_role,state.adminUser.user_id);
    else throw new Error('Unsupported CAIP media-intake action.');
    const resolvedProject=projectId||integer(result?.file?.creative_project_id)||integer(result?.session?.creative_project_id)||integer(result?.creative_asset?.creative_project_id)||integer(result?.creative_project_id);
    await auditAdminAction(context.env,context.request,state.adminUser,{action_type:`caip_media_${action}`,target_type:'creative_project',target_id:resolvedProject||null,target_key:result?.session?.session_key||result?.request_key||null,details:{action,creative_project_id:resolvedProject||null,upload_file_id:fileId||null,private_raw:true,public_copy_created:false}}).catch(()=>null);
    const data=await listCaipMediaIntake(state.db,resolvedProject,context.env);
    return json({ok:true,build:CAIP_MEDIA_INTAKE_BUILD,message:action==='request_public_promotion'?'Public promotion review requested. No public copy was created.':'CAIP private-media state saved.',result:scrub({files:[safeUploadFileForClient(result?.file)],...result}),...scrub(data)});
  }catch(error){const errorCode=intakeErrorCode(error,action);await captureRuntimeIncident(context.env,context.request,{incident_scope:'caip_media_intake',incident_code:'caip_media_intake_post_failed',severity:'warning',message:error?.message||'CAIP media intake action failed.',related_user_id:state.adminUser.user_id,details:{action,error_code:errorCode,creative_project_id:projectId||null,upload_file_id:fileId||null,error:String(error?.message||error)}}).catch(()=>null);return json({ok:false,error:error?.message||'CAIP media intake action failed.',error_code:errorCode,stage:action||'unknown',creative_project_id:projectId||null,upload_file_id:fileId||null,binding:{private_bucket_binding:'CAIP_PRIVATE_MEDIA_BUCKET',private_bucket_available:privateBucketAvailable(context.env)}},400);}
}
