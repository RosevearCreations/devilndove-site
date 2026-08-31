import { auditAdminAction } from '../_lib/adminAudit.js';
function text(value) { return String(value || '').trim(); }
function safeJson(value) { try { const x=JSON.parse(String(value||'')); return x && typeof x==='object' ? x : {}; } catch { return {}; } }
function approvedRecoveryUrl(value) {
  const clean=text(value); if (!clean) return '';
  try {
    const url=new URL(clean); const host=url.hostname.toLowerCase();
    const allowed=url.protocol==='https:' && (host==='devilndove.com'||host==='www.devilndove.com'||host==='assets.devilndove.com'||host.endsWith('.devilndove-site.pages.dev'));
    return allowed ? url.toString() : '';
  } catch { return ''; }
}
export function recoveryDescriptor(row) {
  const details=safeJson(row?.details_json);
  const publicUrl=approvedRecoveryUrl(details.public_url||details.url||details.asset_url);
  const objectKey=text(details.object_key||details.r2_object_key||details.storage_key);
  const bucketHint=`${text(details.bucket_alias||details.bucket_name||details.binding)} ${text(details.storage_provider)}`;
  if (publicUrl) return {available:true,kind:'https_head',target:publicUrl};
  if (objectKey) return {available:true,kind:'r2_head',target:objectKey,bucket:/caip|private/i.test(bucketHint)?'CAIP_PRIVATE_MEDIA_BUCKET':'PRODUCT_MEDIA_BUCKET'};
  return {available:false,kind:'manual',target:''};
}
async function safeRecoveryProbe(env, descriptor) {
  if (!descriptor.available) return {ok:false,status:'unsupported',detail:'No allowlisted read-only recovery probe is available.'};
  if (descriptor.kind==='https_head') {
    try {
      const response=await fetch(descriptor.target,{method:'HEAD',redirect:'manual',cf:{cacheTtl:0,cacheEverything:false}});
      return {ok:response.ok,status:response.ok?'verified':'failed',http_status:response.status,target:descriptor.target};
    } catch (error) { return {ok:false,status:'failed',error:text(error?.message||error),target:descriptor.target}; }
  }
  const bucket=descriptor.bucket==='CAIP_PRIVATE_MEDIA_BUCKET'?env.CAIP_PRIVATE_MEDIA_BUCKET:env.PRODUCT_MEDIA_BUCKET;
  if (!bucket || typeof bucket.head!=='function') return {ok:false,status:'failed',error:`${descriptor.bucket} is unavailable.`,target:descriptor.target};
  try {
    const head=await bucket.head(descriptor.target);
    return {ok:Boolean(head),status:head?'verified':'failed',object_exists:Boolean(head),target:descriptor.target,bucket:descriptor.bucket};
  } catch (error) { return {ok:false,status:'failed',error:text(error?.message||error),target:descriptor.target,bucket:descriptor.bucket}; }
}
export async function safeRecheckIncident(context, adminUser, db, incidentId) {
  const incident=await db.prepare(`SELECT * FROM runtime_incidents WHERE runtime_incident_id=? LIMIT 1`).bind(incidentId).first();
  if (!incident) return {status:404,data:{ok:false,error:'Runtime incident not found.'}};
  const descriptor=recoveryDescriptor(incident);
  const result=await safeRecoveryProbe(context.env,descriptor);
  await db.prepare(`INSERT INTO operational_recovery_events(runtime_incident_id,recovery_kind,recovery_status,probe_target,result_json,actor_user_id,created_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(incidentId,descriptor.kind,result.status,descriptor.target||null,JSON.stringify(result),Number(adminUser.user_id||0)).run();
  if (result.ok) {
    const note='Release 464 Update 2 safe recheck verified healthy.';
    await db.prepare(`UPDATE runtime_incidents SET review_status='resolved',admin_note=CASE WHEN COALESCE(admin_note,'')='' THEN ? ELSE admin_note || ' | ' || ? END,reviewed_by_user_id=?,reviewed_at=CURRENT_TIMESTAMP WHERE runtime_incident_id=?`).bind(note,note,Number(adminUser.user_id||0),incidentId).run();
  } else if (result.status!=='unsupported') {
    await db.prepare(`UPDATE runtime_incidents SET review_status='reviewing',reviewed_by_user_id=?,reviewed_at=CURRENT_TIMESTAMP WHERE runtime_incident_id=?`).bind(Number(adminUser.user_id||0),incidentId).run();
  }
  await auditAdminAction(context.env,context.request,adminUser,{action_type:'runtime_incident_safe_recheck',target_type:'runtime_incident',target_id:incidentId,details:{descriptor,result,provider_execution:false,r2_delete:false}});
  return {status:result.status==='unsupported'?409:(result.ok?200:424),data:{ok:result.ok,recovery_available:descriptor.available,recovery:descriptor,result,review_status:result.ok?'resolved':(result.status==='unsupported'?incident.review_status:'reviewing')}};
}
