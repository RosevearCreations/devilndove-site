// Release 467 Build 398.2 — user-initiated Etsy shop ID lookup and safe verified-metadata recovery.
// Etsy listing writes, publishing and remote refresh are never performed here.
import {getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {decryptOAuthSecret} from '../_lib/oauthSecurity.js';
import {getOAuthContract,discoverEtsyShop} from '../_lib/oauthProviders.js';

const json=(v,status=200)=>jsonResponse({release:467,build:398,secret_values_emitted:false,...v},status,{'Cache-Control':'no-store'});
const validId=v=>/^[1-9]\d*$/.test(String(v??'').trim());
const safeShop=row=>row&&validId(row.shop_id)?{
  shop_id:String(row.shop_id),shop_name:String(row.shop_name||'').slice(0,160),
  acceptance_status:String(row.acceptance_status||''),verified_at:row.verified_at||null}:null;
const sqlStored="SELECT owner_user_id,shop_id,shop_name,acceptance_status,verified_at FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1";
const sqlConnection="SELECT remote_subject_id,access_token_ciphertext,scopes_json,access_expires_at,connection_status FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1";
async function gate(context){
  const admin=verifiedAdminFromModule(context);
  if(!admin)return {error:json({ok:false,error:'Administrator access required.'},401)};
  const db=getDb(context.env);
  return db?{db,admin}:{error:json({ok:false,error:'Database binding unavailable.'},503)};
}
async function stored(db){return db.prepare(sqlStored).first();}
export async function onRequestGet(context){
  const a=await gate(context);if(a.error)return a.error;
  try{
    const row=await stored(a.db),shop=safeShop(row),verified=shop?.acceptance_status==='connected_verified';
    return json({ok:true,shop:verified?shop:null,source:verified?'stored_verified_shop':'not_verified_or_missing',
      manual_etsy_lookup_available:true,etsy_api_called:false,shop_id_variable_required:false,
      next_action:verified?'Copy your Shop ID.':'Click Find my Etsy Shop ID to check your authorized Etsy connection.'});
  }catch{
    return json({ok:false,code:'etsy_shop_identity_storage_unavailable',
      error:'Shop ID table unavailable. Check the canonical Etsy shop identity migration; no connection was changed.'},503);
  }
}
export async function onRequestPost(context){
  const a=await gate(context);if(a.error)return a.error;
  let body;try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON.'},400);}
  if(body?.action!=='discover_my_shop_id')return json({ok:false,error:'Explicit shop lookup action required.'},400);
  try{
    const existing=await stored(a.db);
    if(safeShop(existing)&&existing.acceptance_status==='connected_verified')
      return json({ok:true,shop:safeShop(existing),source:'stored_verified_shop',
        etsy_api_called:false,shop_id_variable_required:false,provider_listing_writes:false});
    const conn=await a.db.prepare(sqlConnection).first();
    if(!conn||conn.connection_status!=='connected'||!conn.access_token_ciphertext)
      return json({ok:false,code:'etsy_connection_required',
        error:'No connected Etsy authorization with a stored access token. Use Connect Etsy first.'},409);
    if(!validId(conn.remote_subject_id))
      return json({ok:false,code:'etsy_authorized_owner_unavailable',
        error:'Stored Etsy account identity is missing. Reconnect Etsy to verify the owner.'},409);
    let scopes=[];try{scopes=JSON.parse(conn.scopes_json||'[]');}catch{}
    if(!Array.isArray(scopes)||!scopes.includes('shops_r'))
      return json({ok:false,code:'etsy_shop_read_scope_missing',
        error:'The Etsy connection lacks shops_r permission. Reconnect and approve the requested permissions.'},409);
    const expiration=Date.parse(String(conn.access_expires_at||''));
    if(!Number.isFinite(expiration)||expiration<=Date.now()+10000)
      return json({ok:false,code:'etsy_access_expired',
        error:'Your Etsy access token has expired. A fresh, authorized connection or controlled token refresh is needed; no automatic refresh was attempted.'},409);
    const access=await decryptOAuthSecret(context.env,conn.access_token_ciphertext,'oauth-token|etsy|access');
    if(!access)throw new Error('etsy_encrypted_access_unavailable');
    // Exactly one operator-requested read-only provider lookup. The helper validates numeric shop ownership.
    const found=await discoverEtsyShop(getOAuthContract('etsy'),context.env,access,conn.remote_subject_id);
    if(!validId(found.shop_id)||String(found.user_id)!==String(conn.remote_subject_id))
      return json({ok:false,code:'etsy_shop_ownership_mismatch',
        error:'The Etsy shop owner did not match the connected account; no ID was stored.'},409);
    const previous=safeShop(existing);
    if(previous&&previous.shop_id!==String(found.shop_id))
      return json({ok:false,code:'etsy_different_shop_detected',
        error:'The connected Etsy shop differs from the previously recorded Shop ID. Manual account review is required.'},409);
    await a.db.prepare(
      "INSERT INTO etsy_oauth_shop_connections "+
      "(provider_key,owner_user_id,shop_id,shop_name,currency_code,listing_active_count,acceptance_status,discovered_at,verified_at,updated_at) "+
      "VALUES ('etsy',?,?,?,?,?,'connected_verified',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) "+
      "ON CONFLICT(provider_key) DO UPDATE SET owner_user_id=excluded.owner_user_id,shop_id=excluded.shop_id,"+
      "shop_name=excluded.shop_name,currency_code=excluded.currency_code,listing_active_count=excluded.listing_active_count,"+
      "acceptance_status='connected_verified',verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP"
    ).bind(Number(found.user_id),Number(found.shop_id),found.shop_name,found.currency_code,
      Math.max(0,Number(found.listing_active_count||0))).run();
    const confirmed=safeShop(await stored(a.db));
    if(!confirmed||confirmed.shop_id!==String(found.shop_id)||confirmed.acceptance_status!=='connected_verified')
      return json({ok:false,code:'etsy_shop_identity_readback_unconfirmed',
        error:'Etsy returned a shop ID, but its database receipt could not be confirmed. Review connection status before retrying.'},409);
    await auditAdminAction(context.env,context.request,a.admin,{
      action_type:'etsy_shop_id_discovered_by_operator',target_type:'etsy_shop',target_id:Number(confirmed.shop_id),
      target_key:'etsy',details:{shop_id:confirmed.shop_id,owner_verified:true,
        provider_read_only:true,listing_writes:false,oauth_tokens_logged:false}});
    return json({ok:true,shop:confirmed,source:'operator_requested_verified_etsy_read',
      etsy_api_called:true,shop_id_variable_required:false,provider_listing_writes:false});
  }catch(error){
    // Never return provider response bodies, bearer credentials or token-related exception messages.
    const code=String(error?.oauthProviderCode||error?.message||'');
    const condition=code==='oauth_etsy_shop_discovery_failed'?'etsy_provider_shop_lookup_failed':
      code==='oauth_intended_shop_mismatch'?'etsy_shop_env_mismatch':'etsy_shop_lookup_unavailable';
    return json({ok:false,code:condition,error:condition==='etsy_shop_env_mismatch'?
      'The optional ETSY_SHOP_ID check disagrees with Etsy. Review that configuration before retrying.':
      'Etsy shop lookup did not complete. Review the saved authorization and connection status; no listing was changed.'},502);
  }
}
