// Release 460 — administrator-only OAuth start authority.
// Remote authorization is fail-closed unless the Development-only operator switch is explicitly set.
import { getAdminUserFromRequest, getDb, jsonResponse, auditAdminAction } from '../_lib/adminAudit.js';
import { createStateAndPkce, encryptOAuthSecret, encryptionKeyConfigured, oauthRemoteAuthorizationOpen, randomBase64Url, safeReturnPath } from '../_lib/oauthSecurity.js';
import { buildAuthorizationUrl, getOAuthContract, providerConfiguration } from '../_lib/oauthProviders.js';
import { CURRENT_RELEASE } from '../_lib/releaseAuthority.js';

const json=(data,status=200)=>jsonResponse({release:CURRENT_RELEASE,...data},status,{'Cache-Control':'no-store'});

export async function onRequestGet({request,env}) {
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return json({ok:false,error:'Unauthorized.'},401);
  const db = getDb(env);
  if (!db) return json({ok:false,code:'oauth_database_unavailable',error:'OAuth authority is unavailable.'},503);

  const url = new URL(request.url);
  const contract = getOAuthContract(url.searchParams.get('provider'));
  if (!contract) return json({ok:false,code:'oauth_provider_unsupported',error:'Unsupported OAuth provider.'},400);

  const remoteOpen = oauthRemoteAuthorizationOpen(env, request.url);
  const keyReady = encryptionKeyConfigured(env);
  const cfg = providerConfiguration(contract, env);
  if (!remoteOpen) {
    return json({
      ok:false, code:'oauth_live_authorization_closed', error:'Live provider authorization is deliberately closed for Release 460.',
      provider:contract.key, development_only:true, remote_authorization_open:false,
      encryption_authority_ready:keyReady, provider_configuration_ready:cfg.configured,
      required_operator_switch:'OAUTH_PROVIDER_AUTHORIZATION_MODE=development-explicit'
    },423);
  }
  if (!keyReady) return json({ok:false,code:'oauth_encryption_authority_missing',error:'OAuth encryption authority is not configured.'},503);
  if (!cfg.configured) return json({ok:false,code:'oauth_provider_configuration_incomplete',error:'Provider configuration is incomplete.'},409);

  const proof = await createStateAndPkce();
  const transactionId = `oauth_${randomBase64Url(24)}`;
  const usesPkce = contract.pkce === 'required' || contract.pkce === 'supported';
  const verifierCiphertext = usesPkce
    ? await encryptOAuthSecret(env, proof.verifier, `oauth-pkce|${contract.key}|${transactionId}`)
    : null;
  const scopes = contract.scopes || [];
  const returnTo = safeReturnPath(url.searchParams.get('return_to'));

  await db.prepare(`
    INSERT INTO oauth_authorization_transactions
      (transaction_id,provider_key,state_hash,pkce_verifier_ciphertext,redirect_uri,scopes_json,return_to,created_by_user_id,expires_at,terminal_status,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?, ?,datetime('now','+10 minutes'),'pending',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
  `).bind(transactionId, contract.key, proof.stateHash, verifierCiphertext, cfg.redirectUri, JSON.stringify(scopes), returnTo, Number(admin.user_id)).run();

  await auditAdminAction(env,request,admin,{
    action_type:'oauth_authorization_started', target_type:'provider', target_key:contract.key,
    details:{release:460,provider:contract.key,pkce:contract.pkce,state_persisted_as_hash_only:true,remote_authorization_open:true}
  });

  const location = buildAuthorizationUrl(contract, env, {state:proof.state,challenge:usesPkce?proof.challenge:null,scopes});
  return new Response(null,{status:302,headers:{Location:location,'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-DND-Release':String(CURRENT_RELEASE)}});
}
