// Devil n Dove Release 453 — I.T.-owned provider readiness/checklist authority. No provider execution or secret values.
import { getAdminUserFromRequest, getDb, jsonResponse, auditAdminAction, captureRuntimeIncident } from '../_lib/adminAudit.js';
const RELEASE=453;
const STATES=new Set(['blocked','pending','ready','passed','failed','deferred','not_applicable']);
const text=(v)=>String(v==null?'':v).trim();
const json=(data,status=200)=>jsonResponse({release:RELEASE,...data},status,{'Cache-Control':'no-store'});
function suspicious(value){const v=text(value);return /(?:^|[?&\s])(secret|token|password|private[_-]?key|api[_-]?key)\s*[:=]/i.test(v)||/^(?:sk_|pk_live_|whsec_|ghp_|github_pat_)/i.test(v)}
async function ready(db){try{const r=await db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table' AND name IN ('it_provider_readiness_checks','it_provider_readiness_events')").first();return Number(r?.c||0)===2}catch{return false}}
export async function onRequestGet({request,env}){
 const db=getDb(env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
 if(!await getAdminUserFromRequest(request,env))return json({ok:false,error:'Unauthorized.'},401);
 if(!await ready(db))return json({ok:true,schema_ready:false,providers:[],checks:[]});
 try{
  const url=new URL(request.url),provider=text(url.searchParams.get('provider')).toLowerCase();
  const providers=await db.prepare(`SELECT p.provider_key,p.display_name,p.provider_type,p.setup_status,p.enabled,
    COUNT(c.it_provider_readiness_check_id) AS check_count,
    SUM(CASE WHEN c.required_for_activation=1 THEN 1 ELSE 0 END) AS required_count,
    SUM(CASE WHEN c.required_for_activation=1 AND c.check_state='passed' THEN 1 ELSE 0 END) AS passed_required_count,
    SUM(CASE WHEN c.check_state IN ('blocked','failed') THEN 1 ELSE 0 END) AS blocker_count
    FROM provider_setup_authorities p LEFT JOIN it_provider_readiness_checks c ON c.provider_key=p.provider_key AND c.environment='development'
    GROUP BY p.provider_key,p.display_name,p.provider_type,p.setup_status,p.enabled ORDER BY p.provider_type,p.display_name`).all();
  const q=`SELECT c.*,p.display_name,p.provider_type FROM it_provider_readiness_checks c JOIN provider_setup_authorities p ON p.provider_key=c.provider_key WHERE c.environment='development'${provider?' AND c.provider_key=?':''} ORDER BY p.provider_type,p.display_name,c.required_for_activation DESC,c.check_category,c.check_label`;
  const checks=provider?await db.prepare(q).bind(provider).all():await db.prepare(q).all();
  return json({ok:true,schema_ready:true,provider_publication_allowed:false,provider_execution_allowed:false,providers:providers?.results||[],checks:checks?.results||[]});
 }catch(error){await captureRuntimeIncident(env,request,{incident_scope:'it_provider_readiness',incident_code:'read_failed',message:error?.message||'I.T. readiness read failed.'});return json({ok:false,error:error?.message||'Could not load provider readiness.'},500)}
}
export async function onRequestPost({request,env}){
 const db=getDb(env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
 const admin=await getAdminUserFromRequest(request,env);if(!admin)return json({ok:false,error:'Unauthorized.'},401);
 if(!await ready(db))return json({ok:false,error:'Release 453 I.T. provider readiness schema is not applied yet.',code:'schema_not_ready'},409);
 let body;try{body=await request.json()}catch{return json({ok:false,error:'Valid JSON is required.'},400)}
 const provider=text(body?.provider_key).toLowerCase(),checkKey=text(body?.check_key),state=text(body?.check_state).toLowerCase();
 if(!provider||!checkKey||!STATES.has(state))return json({ok:false,error:'provider_key, check_key and a valid check_state are required.'},400);
 const config=text(body?.config_reference).slice(0,200),correction=text(body?.correction_mechanics).slice(0,4000),evidence=text(body?.evidence_reference).slice(0,1500),safeError=text(body?.last_safe_error).slice(0,1500),note=text(body?.event_note).slice(0,2000);
 if([config,correction,evidence,safeError,note].some(suspicious))return json({ok:false,error:'Secret-like values are forbidden. Store only safe references, state and correction/evidence notes.',code:'secret_value_refused'},400);
 try{
  const current=await db.prepare("SELECT * FROM it_provider_readiness_checks WHERE provider_key=? AND environment='development' AND check_key=? LIMIT 1").bind(provider,checkKey).first();
  if(!current)return json({ok:false,error:'Readiness check was not found.'},404);
  const update=db.prepare(`UPDATE it_provider_readiness_checks SET check_state=?,config_reference=?,correction_mechanics=?,evidence_reference=?,last_safe_error=?,last_checked_at=CURRENT_TIMESTAMP,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE it_provider_readiness_check_id=?`).bind(state,config||null,correction||current.correction_mechanics||'',evidence||null,safeError||null,admin.user_id||null,current.it_provider_readiness_check_id);
  const event=db.prepare(`INSERT INTO it_provider_readiness_events(it_provider_readiness_check_id,provider_key,environment,state_before,state_after,event_note,evidence_reference,created_by_user_id,created_at) VALUES(?,?,'development',?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(current.it_provider_readiness_check_id,provider,current.check_state,state,note||null,evidence||null,admin.user_id||null);
  await db.batch([update,event]);
  await auditAdminAction(env,request,admin,{action_type:'it_provider_readiness_update',target_type:'provider_readiness_check',target_id:current.it_provider_readiness_check_id,target_key:`${provider}:${checkKey}`,details:{state_before:current.check_state,state_after:state,evidence_recorded:Boolean(evidence),provider_execution:false}});
  return json({ok:true,provider_key:provider,check_key:checkKey,state_before:current.check_state,state_after:state,provider_execution:false,publication_allowed:false});
 }catch(error){await captureRuntimeIncident(env,request,{incident_scope:'it_provider_readiness',incident_code:'write_failed',message:error?.message||'I.T. readiness update failed.',related_user_id:admin.user_id});return json({ok:false,error:error?.message||'Could not update provider readiness.'},500)}
}
