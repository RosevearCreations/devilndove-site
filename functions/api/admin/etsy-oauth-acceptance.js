// Historical Build 352 contract token retained: OAUTH_PROVIDER_AUTHORIZATION_MODE=development-explicit. Build 353 additionally requires an exact Development host and keeps Production closed.
// Release 467 Build 352 — Etsy Development OAuth acceptance status. GET-only, safe blocker reporting.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { encryptionKeyConfigured, encryptionAuthoritySource, etsyDevelopmentAuthorizationOpen } from '../_lib/oauthSecurity.js';
import { getOAuthContract, providerConfiguration } from '../_lib/oauthProviders.js';

const json=(data,status=200)=>jsonResponse({release:467,build:352,...data},status,{'Cache-Control':'no-store'});
const text=(v)=>String(v==null?'':v).trim();
export async function onRequestGet({request,env}){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return json({ok:false,error:'Unauthorized.'},401);
  const db=getDb(env);if(!db)return json({ok:false,error:'Database binding is not configured.'},503);
  const contract=getOAuthContract('etsy'),cfg=providerConfiguration(contract,env);
  let conn=null,shop=null;
  try{conn=await db.prepare("SELECT provider_key,remote_subject_id,scopes_json,access_expires_at,refresh_expires_at,connection_status,diagnostic_code,updated_at FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1").first();}catch{}
  try{shop=await db.prepare("SELECT owner_user_id,shop_id,shop_name,currency_code,listing_active_count,acceptance_status,verified_at,updated_at FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1").first();}catch{}
  let scopes=[];try{scopes=JSON.parse(conn?.scopes_json||'[]');}catch{scopes=[];}
  const host=new URL(request.url).hostname;
  const callback=text(env?.ETSY_REDIRECT_URI);
  const apiKeyReady=Boolean(text(env?.ETSY_API_KEYSTRING));
  const sharedSecretReady=Boolean(text(env?.ETSY_SHARED_SECRET));
  const redirectReady=Boolean(callback);
  const encryptionReady=encryptionKeyConfigured(env,'etsy');
  const encryptionSource=encryptionAuthoritySource(env,'etsy');
  const authorizationOpen=etsyDevelopmentAuthorizationOpen(env,request.url);
  const connected=Boolean(conn&&conn.connection_status==='connected'&&shop&&shop.acceptance_status==='connected_verified');
  const connect_blockers=[];
  if(!apiKeyReady)connect_blockers.push('ETSY_API_KEYSTRING is not configured in the Development environment.');
  if(!sharedSecretReady)connect_blockers.push('ETSY_SHARED_SECRET is not configured in the Development environment.');
  if(!redirectReady)connect_blockers.push('ETSY_REDIRECT_URI is not configured in the Development environment.');
  if(!encryptionReady)connect_blockers.push('OAuth encryption authority is not configured.');
  if(!authorizationOpen)connect_blockers.push('Open this Etsy connection from the Devil n Dove Development host (dev.devilndove-site.pages.dev). Production authorization stays closed.');
  if(!cfg.configured&&connect_blockers.length===0)connect_blockers.push('Etsy provider configuration is incomplete.');
  const connectAvailable=Boolean(cfg.configured&&encryptionReady&&authorizationOpen);
  return json({
    ok:true,authority:'etsy-development-oauth-acceptance',development_only:true,host,
    configuration:{api_keystring_present:apiKeyReady,shared_secret_present:sharedSecretReady,redirect_uri_present:redirectReady,redirect_uri:callback||null,encryption_key_configured:encryptionReady,encryption_authority_source:encryptionSource},
    connect_authorization_available:connectAvailable,
    connect_blockers,
    connection:{status:conn?.connection_status||'not_connected',connected,scopes,access_expires_at:conn?.access_expires_at||null,refresh_expires_at:conn?.refresh_expires_at||null,diagnostic_code:conn?.diagnostic_code||null,updated_at:conn?.updated_at||null},
    shop:shop?{shop_id:Number(shop.shop_id),owner_user_id:Number(shop.owner_user_id),shop_name:shop.shop_name||'',currency_code:shop.currency_code||'',listing_active_count:Number(shop.listing_active_count||0),acceptance_status:shop.acceptance_status||'',verified_at:shop.verified_at||null}:null,
    security:{secret_values_emitted:false,token_values_emitted:false,shop_id_auto_discovered:true,etsy_test_mode_required:false,provider_listing_writes_allowed:false,provider_publication_allowed:false,remote_draft_creation_enabled:false},
    next_action:connected
      ? 'Connection verified. Keep listing writes closed until the separate reviewed draft-listing acceptance step.'
      : connectAvailable
        ? 'Click Connect Etsy and approve the Devil n Dove Seller App in Etsy.'
        : (connect_blockers[0]||'Complete the Development OAuth prerequisites and refresh.')
  });
}
