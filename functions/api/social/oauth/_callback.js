// Release 460 — secure OAuth callback lifecycle.
// Remote exchange remains fail-closed unless Development authorization is explicitly opened.
import { getDb } from '../../_lib/adminAudit.js';
import { decryptOAuthSecret, encryptOAuthSecret, oauthRemoteAuthorizationOpen, safeDiagnosticCode, sha256Base64Url } from '../../_lib/oauthSecurity.js';
import { exchangeAuthorizationCode, getOAuthContract, providerConfiguration, verifyOAuthIdentity } from '../../_lib/oauthProviders.js';

function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function htmlResponse(title,body,status=200){
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)} | Devil n Dove</title><style>body{margin:0;background:#0b0f16;color:#eef2f7;font:16px/1.55 system-ui,sans-serif}.shell{max-width:760px;margin:0 auto;padding:32px 18px}.card{background:#111925;border:1px solid #334155;border-radius:18px;padding:24px}a{color:#f2c66d}.code{font-family:ui-monospace,monospace;overflow-wrap:anywhere;background:#080c12;padding:10px;border-radius:9px}</style></head><body><main class="shell"><section class="card"><h1>${escapeHtml(title)}</h1>${body}<p><a href="/admin/it-integrations/">Return to I.T. Integrations</a></p></section></main></body></html>`;
  return new Response(html,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-DND-Release':'460'}});
}
function expiresAt(seconds){ const n=Number(seconds||0); return n>0?new Date(Date.now()+Math.min(n,315360000)*1000).toISOString():null; }
function normalizeScopes(value,fallback=[]){
  if(Array.isArray(value)) return value.map(String).filter(Boolean);
  const text=String(value||'').trim();
  return text?text.split(/[\s,]+/).filter(Boolean):fallback;
}
async function securityEvent(db,provider,eventType,outcome,diagnosticCode,transactionId,actorUserId){
  try{await db.prepare(`INSERT INTO oauth_security_events(provider_key,event_type,outcome,diagnostic_code,transaction_id,actor_user_id,created_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(provider,eventType,outcome,diagnosticCode||null,transactionId||null,actorUserId||null).run();}catch{}
}

export function createOAuthCallback(providerKey){
  return async function onRequestGet({request,env}){
    const contract=getOAuthContract(providerKey);
    if(!contract)return htmlResponse('Unsupported OAuth provider','<p>The requested provider is not configured.</p>',404);
    const url=new URL(request.url);
    const providerError=safeDiagnosticCode(url.searchParams.get('error'),'provider_authorization_denied');
    const code=url.searchParams.get('code')||'';
    const state=url.searchParams.get('state')||'';
    const cfg=providerConfiguration(contract,env);

    // Plain callback browsing remains a safe readiness surface even while live authorization is closed.
    if(!code&&!state&&!url.searchParams.get('error')){
      return htmlResponse(`${contract.label} OAuth callback is available`,`<p>This exact HTTPS callback route is deployed for Release 460.</p><p class="code">${escapeHtml(url.origin+url.pathname)}</p><p>Provider configuration: ${cfg.configured?'configured':'not configured yet'}.</p><p>Live provider authorization remains closed until explicitly opened in Development.</p>`);
    }
    if(!oauthRemoteAuthorizationOpen(env,request.url)){
      return htmlResponse(`${contract.label} authorization is closed`,'<p>Release 460 rejected this live authorization response because provider authorization is deliberately closed.</p><p>No authorization code was exchanged, no token was stored, and nothing was published.</p>',423);
    }
    if(!state)return htmlResponse(`${contract.label} connection was rejected safely`,'<p>The required one-time state value was missing.</p><p>No token was stored and nothing was published.</p>',400);
    const db=getDb(env);
    if(!db)return htmlResponse('OAuth authority unavailable','<p>The Development OAuth persistence authority is unavailable.</p>',503);

    const stateHash=await sha256Base64Url(state);
    const tx=await db.prepare(`SELECT transaction_id,provider_key,pkce_verifier_ciphertext,redirect_uri,scopes_json,return_to,created_by_user_id,expires_at,consumed_at,terminal_status FROM oauth_authorization_transactions WHERE state_hash=? LIMIT 1`).bind(stateHash).first();
    if(!tx||String(tx.provider_key)!==contract.key){
      await securityEvent(db,contract.key,'callback_state_validation','rejected','state_unknown_or_provider_mismatch',null,null);
      return htmlResponse(`${contract.label} connection was rejected safely`,'<p>The authorization state was unknown or did not belong to this provider.</p>',400);
    }

    const claim=await db.prepare(`UPDATE oauth_authorization_transactions SET consumed_at=CURRENT_TIMESTAMP,terminal_status=?,diagnostic_code=?,updated_at=CURRENT_TIMESTAMP WHERE transaction_id=? AND state_hash=? AND consumed_at IS NULL AND terminal_status='pending' AND expires_at>CURRENT_TIMESTAMP`).bind(providerError&&url.searchParams.get('error')?'denied':'consuming',url.searchParams.get('error')?providerError:null,tx.transaction_id,stateHash).run();
    if(Number(claim?.meta?.changes||0)!==1){
      await securityEvent(db,contract.key,'callback_state_validation','rejected','state_replayed_expired_or_consumed',tx.transaction_id,tx.created_by_user_id);
      return htmlResponse(`${contract.label} connection was rejected safely`,'<p>This authorization state was expired, already used, or otherwise unavailable. Start a new connection request.</p>',409);
    }

    if(url.searchParams.get('error')){
      await securityEvent(db,contract.key,'authorization','denied',providerError,tx.transaction_id,tx.created_by_user_id);
      return htmlResponse(`${contract.label} connection was not completed`,`<p>The provider declined or could not complete authorization.</p><p class="code">${escapeHtml(providerError)}</p><p>No token was stored and nothing was published.</p>`,400);
    }
    if(!code){
      await db.prepare(`UPDATE oauth_authorization_transactions SET terminal_status='failed',diagnostic_code='authorization_code_missing',updated_at=CURRENT_TIMESTAMP WHERE transaction_id=?`).bind(tx.transaction_id).run();
      return htmlResponse(`${contract.label} connection was rejected safely`,'<p>The provider response did not include an authorization code.</p>',400);
    }

    try{
      const verifier=tx.pkce_verifier_ciphertext?await decryptOAuthSecret(env,tx.pkce_verifier_ciphertext,`oauth-pkce|${contract.key}|${tx.transaction_id}`):null;
      const token=await exchangeAuthorizationCode(contract,env,{code,verifier});

      // Release 460 fail-closed intended-account gate: provider identity must be retrieved and match
      // the explicitly configured Development account before any new provider token material is persisted.
      const identity=await verifyOAuthIdentity(contract,env,token.access_token);

      const accessCipher=await encryptOAuthSecret(env,token.access_token,`oauth-token|${contract.key}|access`);
      const refreshCipher=token.refresh_token?await encryptOAuthSecret(env,token.refresh_token,`oauth-token|${contract.key}|refresh`):null;
      const idCipher=token.id_token?await encryptOAuthSecret(env,token.id_token,`oauth-token|${contract.key}|id`):null;
      const scopes=normalizeScopes(token.scope,JSON.parse(tx.scopes_json||'[]'));
      const accessExpiry=expiresAt(token.expires_in);
      const refreshExpiry=expiresAt(token.refresh_expires_in);
      const remoteSubject=String(identity.remoteSubject||'').slice(0,180)||null;

      await db.prepare(`
        INSERT INTO oauth_provider_connections(provider_key,remote_subject_id,access_token_ciphertext,refresh_token_ciphertext,id_token_ciphertext,token_type,scopes_json,access_expires_at,refresh_expires_at,connection_status,diagnostic_code,connected_by_user_id,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,'connected',NULL,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT(provider_key) DO UPDATE SET remote_subject_id=excluded.remote_subject_id,access_token_ciphertext=excluded.access_token_ciphertext,refresh_token_ciphertext=excluded.refresh_token_ciphertext,id_token_ciphertext=excluded.id_token_ciphertext,token_type=excluded.token_type,scopes_json=excluded.scopes_json,access_expires_at=excluded.access_expires_at,refresh_expires_at=excluded.refresh_expires_at,connection_status='connected',diagnostic_code=NULL,connected_by_user_id=excluded.connected_by_user_id,disconnected_at=NULL,remote_revoke_state=NULL,updated_at=CURRENT_TIMESTAMP
      `).bind(contract.key,remoteSubject,accessCipher,refreshCipher,idCipher,String(token.token_type||'Bearer').slice(0,30),JSON.stringify(scopes),accessExpiry,refreshExpiry,tx.created_by_user_id||null).run();
      await db.prepare(`UPDATE oauth_authorization_transactions SET terminal_status='complete',completed_at=CURRENT_TIMESTAMP,pkce_verifier_ciphertext=NULL,diagnostic_code=NULL,updated_at=CURRENT_TIMESTAMP WHERE transaction_id=?`).bind(tx.transaction_id).run();
      await securityEvent(db,contract.key,'authorization','complete','intended_account_verified',tx.transaction_id,tx.created_by_user_id);
      return htmlResponse(`${contract.label} Development connection stored securely`,'<p>The authorization code was consumed once, exchanged server-side, and the intended provider account was verified before encrypted token persistence.</p><p>Provider publication remains disabled.</p>');
    }catch(error){
      const diagnostic=safeDiagnosticCode(error?.oauthProviderCode||error?.message,'authorization_finalize_failed');
      await db.prepare(`UPDATE oauth_authorization_transactions SET terminal_status='failed',pkce_verifier_ciphertext=NULL,diagnostic_code=?,updated_at=CURRENT_TIMESTAMP WHERE transaction_id=?`).bind(diagnostic,tx.transaction_id).run();
      await securityEvent(db,contract.key,'authorization_finalize','failed',diagnostic,tx.transaction_id,tx.created_by_user_id);
      return htmlResponse(`${contract.label} connection failed safely`,`<p>The provider token exchange or intended-account verification did not complete.</p><p class="code">${escapeHtml(diagnostic)}</p><p>No new token material was persisted. The one-time state has been consumed and cannot be replayed.</p>`,502);
    }
  };
}
