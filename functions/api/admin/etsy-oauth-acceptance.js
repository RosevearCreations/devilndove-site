// Release 467 Build 350 — Etsy Development OAuth acceptance status. GET-only.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { encryptionKeyConfigured, etsyDevelopmentAuthorizationOpen } from '../_lib/oauthSecurity.js';
import { getOAuthContract, providerConfiguration } from '../_lib/oauthProviders.js';

const json=(data,status=200)=>jsonResponse({release:467,build:350,...data},status,{'Cache-Control':'no-store'});
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
  const connected=Boolean(conn&&conn.connection_status==='connected'&&shop&&shop.acceptance_status==='connected_verified');
  return json({
    ok:true,authority:'etsy-development-oauth-acceptance',development_only:true,host,
    configuration:{api_keystring_present:Boolean(text(env?.ETSY_API_KEYSTRING)),shared_secret_present:Boolean(text(env?.ETSY_SHARED_SECRET)),redirect_uri_present:Boolean(callback),redirect_uri:callback||null,encryption_key_configured:encryptionKeyConfigured(env)},
    connect_authorization_available:Boolean(cfg.configured&&encryptionKeyConfigured(env)&&etsyDevelopmentAuthorizationOpen(env,request.url)),
    connection:{status:conn?.connection_status||'not_connected',connected,scopes,access_expires_at:conn?.access_expires_at||null,refresh_expires_at:conn?.refresh_expires_at||null,diagnostic_code:conn?.diagnostic_code||null,updated_at:conn?.updated_at||null},
    shop:shop?{shop_id:Number(shop.shop_id),owner_user_id:Number(shop.owner_user_id),shop_name:shop.shop_name||'',currency_code:shop.currency_code||'',listing_active_count:Number(shop.listing_active_count||0),acceptance_status:shop.acceptance_status||'',verified_at:shop.verified_at||null}:null,
    security:{secret_values_emitted:false,token_values_emitted:false,shop_id_auto_discovered:true,etsy_test_mode_required:false,provider_listing_writes_allowed:false,provider_publication_allowed:false,remote_draft_creation_enabled:false},
    next_action:connected?'Connection verified. Keep listing writes closed until the separate reviewed draft-listing acceptance step.':'Click Connect Etsy and approve the Devil n Dove Seller App in Etsy.'
  });
}
