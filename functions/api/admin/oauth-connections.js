// Release 460 — redacted OAuth connection diagnostics plus guarded refresh/disconnect lifecycle.
import { getAdminUserFromRequest, getDb, jsonResponse, auditAdminAction } from '../_lib/adminAudit.js';
import { decryptOAuthSecret, encryptOAuthSecret, encryptionKeyConfigured, oauthRemoteAuthorizationOpen, safeDiagnosticCode } from '../_lib/oauthSecurity.js';
import { getOAuthContract, listOAuthContracts, refreshOAuthToken, revokeOAuthToken } from '../_lib/oauthProviders.js';
import { CURRENT_RELEASE } from '../_lib/releaseAuthority.js';

const json=(data,status=200)=>jsonResponse({release:CURRENT_RELEASE,...data},status,{'Cache-Control':'no-store'});
const expiry=(seconds)=>Number(seconds||0)>0?new Date(Date.now()+Math.min(Number(seconds),315360000)*1000).toISOString():null;
const scopes=(value,fallback=[])=>Array.isArray(value)?value:String(value||'').trim()?String(value).split(/[\s,]+/).filter(Boolean):fallback;
async function event(db,provider,type,outcome,code,actor){try{await db.prepare(`INSERT INTO oauth_security_events(provider_key,event_type,outcome,diagnostic_code,actor_user_id,created_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(provider,type,outcome,code||null,actor||null).run();}catch{}}

export async function onRequestGet({request,env}){
  const admin=await getAdminUserFromRequest(request,env); if(!admin)return json({ok:false,error:'Unauthorized.'},401);
  const db=getDb(env); if(!db)return json({ok:false,code:'oauth_database_unavailable'},503);
  let rows=[]; let pending=0; let replayRejects=0;
  try{
    rows=(await db.prepare(`SELECT provider_key,remote_subject_id,token_type,scopes_json,access_expires_at,refresh_expires_at,connection_status,last_refresh_at,disconnected_at,remote_revoke_state,diagnostic_code,created_at,updated_at FROM oauth_provider_connections ORDER BY provider_key`).all()).results||[];
    pending=Number((await db.prepare(`SELECT COUNT(*) AS n FROM oauth_authorization_transactions WHERE terminal_status='pending' AND expires_at>CURRENT_TIMESTAMP`).first())?.n||0);
    replayRejects=Number((await db.prepare(`SELECT COUNT(*) AS n FROM oauth_security_events WHERE event_type='callback_state_validation' AND outcome='rejected'`).first())?.n||0);
  }catch(error){return json({ok:false,code:'release460_schema_not_ready',error:'Release 460 OAuth schema is not ready.'},503);}
  return json({
    ok:true,authority:'secure-oauth-lifecycle',environment:'development',development_host_only:true,
    remote_authorization_open:oauthRemoteAuthorizationOpen(env,request.url),provider_publication_allowed:false,
    encryption_key_configured:encryptionKeyConfigured(env),secret_values_emitted:false,
    pending_authorization_transactions:pending,replay_or_invalid_state_rejections:replayRejects,
    contracts:listOAuthContracts(),
    connections:rows.map((r)=>({...r,scopes:JSON.parse(r.scopes_json||'[]'),scopes_json:undefined,token_material_present:'redacted'}))
  });
}

export async function onRequestPost({request,env}){
  const admin=await getAdminUserFromRequest(request,env); if(!admin)return json({ok:false,error:'Unauthorized.'},401);
  const db=getDb(env); if(!db)return json({ok:false,code:'oauth_database_unavailable'},503);
  let body={}; try{body=await request.json();}catch{return json({ok:false,error:'Invalid JSON.'},400);}
  const action=String(body?.action||'').trim().toLowerCase();
  const contract=getOAuthContract(body?.provider); if(!contract)return json({ok:false,code:'oauth_provider_unsupported'},400);
  const row=await db.prepare(`SELECT * FROM oauth_provider_connections WHERE provider_key=? LIMIT 1`).bind(contract.key).first();

  if(action==='refresh'){
    if(!oauthRemoteAuthorizationOpen(env,request.url))return json({ok:false,code:'oauth_remote_execution_closed',error:'Remote OAuth execution remains closed for Release 460.'},423);
    if(!row||row.connection_status==='disconnected'||!row.refresh_token_ciphertext)return json({ok:false,code:'oauth_refresh_token_unavailable'},409);
    try{
      const refresh=await decryptOAuthSecret(env,row.refresh_token_ciphertext,`oauth-token|${contract.key}|refresh`);
      const token=await refreshOAuthToken(contract,env,refresh);
      const accessCipher=await encryptOAuthSecret(env,token.access_token,`oauth-token|${contract.key}|access`);
      const nextRefresh=token.refresh_token?await encryptOAuthSecret(env,token.refresh_token,`oauth-token|${contract.key}|refresh`):row.refresh_token_ciphertext;
      const nextScopes=scopes(token.scope,JSON.parse(row.scopes_json||'[]'));
      await db.prepare(`UPDATE oauth_provider_connections SET access_token_ciphertext=?,refresh_token_ciphertext=?,token_type=?,scopes_json=?,access_expires_at=?,refresh_expires_at=COALESCE(?,refresh_expires_at),connection_status='connected',last_refresh_at=CURRENT_TIMESTAMP,diagnostic_code=NULL,updated_at=CURRENT_TIMESTAMP WHERE provider_key=?`).bind(accessCipher,nextRefresh,String(token.token_type||row.token_type||'Bearer').slice(0,30),JSON.stringify(nextScopes),expiry(token.expires_in),expiry(token.refresh_expires_in),contract.key).run();
      await event(db,contract.key,'refresh','complete',null,admin.user_id);
      await auditAdminAction(env,request,admin,{action_type:'oauth_token_refreshed',target_type:'provider',target_key:contract.key,details:{release:460,token_values_logged:false}});
      return json({ok:true,provider:contract.key,refreshed:true,token_values_emitted:false});
    }catch(error){
      const code=safeDiagnosticCode(error?.oauthProviderCode||error?.message,'oauth_refresh_failed');
      await db.prepare(`UPDATE oauth_provider_connections SET connection_status='refresh_required',diagnostic_code=?,updated_at=CURRENT_TIMESTAMP WHERE provider_key=?`).bind(code,contract.key).run();
      await event(db,contract.key,'refresh','failed',code,admin.user_id);
      return json({ok:false,provider:contract.key,code,error:'OAuth refresh failed safely.'},502);
    }
  }

  if(action==='disconnect'){
    if(!row||row.connection_status==='disconnected')return json({ok:true,provider:contract.key,already_disconnected:true,remote_revoke_state:row?.remote_revoke_state||'not_attempted'});
    let remoteState='closed_by_release_boundary';
    if(oauthRemoteAuthorizationOpen(env,request.url)&&row.access_token_ciphertext){
      try{
        const access=await decryptOAuthSecret(env,row.access_token_ciphertext,`oauth-token|${contract.key}|access`);
        const result=await revokeOAuthToken(contract,env,access);
        remoteState=!result.supported?'not_supported_by_contract':result.ok?'revoked':'revocation_failed';
      }catch{ remoteState='revocation_failed'; }
    }
    await db.prepare(`UPDATE oauth_provider_connections SET access_token_ciphertext=NULL,refresh_token_ciphertext=NULL,id_token_ciphertext=NULL,connection_status='disconnected',disconnected_at=CURRENT_TIMESTAMP,remote_revoke_state=?,diagnostic_code=NULL,updated_at=CURRENT_TIMESTAMP WHERE provider_key=?`).bind(remoteState,contract.key).run();
    await event(db,contract.key,'disconnect','complete',remoteState,admin.user_id);
    await auditAdminAction(env,request,admin,{action_type:'oauth_provider_disconnected',target_type:'provider',target_key:contract.key,details:{release:460,remote_revoke_state:remoteState,local_token_material_destroyed:true}});
    return json({ok:true,provider:contract.key,disconnected:true,local_token_material_destroyed:true,remote_revoke_state:remoteState,token_values_emitted:false});
  }

  return json({ok:false,error:'Unsupported OAuth lifecycle action.'},400);
}
