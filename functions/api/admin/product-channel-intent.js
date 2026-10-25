// Build 405: one Product, two local channel intent switches. No marketplace provider execution.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {channelPrefsValid,normalizeChannelPrefs} from '../_lib/etsyPublicationPacket405.mjs';
import {verifyProductChannelConsent471} from '../_lib/productChannelConsent471.mjs';
const reply=(v,status=200)=>jsonResponse({ok:status<400,build:405,provider_called:false,publication_performed:false,external_listing_created:false,...v},status,{'Cache-Control':'no-store'});
const validId=x=>/^[1-9]\d{0,14}$/.test(String(x||''))&&Number.isSafeInteger(Number(x));
const latest="SELECT admin_action_audit_id,details_json,created_at FROM admin_action_audit WHERE target_type='product' AND action_type='product_channel_intent_405' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1";
function gate(c){const user=verifiedAdminFromModule(c),db=getDb(c.env);return !user?{error:reply({error:'Verified admin required.'},401)}:!db?{error:reply({error:'Database unavailable.'},503)}:{user,db};}
export async function onRequestGet(c){
 const g=gate(c);if(g.error)return g.error;
 const id=new URL(c.request.url).searchParams.get('product_id');
 if(!validId(id))return reply({error:'Valid saved Product ID required.'},400);
 try{
  const product=await g.db.prepare('SELECT product_id,name FROM products WHERE product_id=? LIMIT 1').bind(id).first();
  if(!product)return reply({error:'Product not found.'},404);
  const prior=await g.db.prepare(latest).bind(id).first();
  return reply({product_id:Number(id),product_name:product.name,preferences:normalizeChannelPrefs(prior),
   message:'Channel intent only; one canonical product and image gallery remain the source. No publication.'});
 }catch{return reply({error:'Local Product destination preferences unavailable.'},503);}
}
export async function onRequestPost(c){
 const g=gate(c);if(g.error)return g.error;
 let b;try{b=await c.request.json();}catch{return reply({error:'JSON required.'},400);}
 if(!validId(b?.product_id)||!channelPrefsValid(b))return reply({error:'Valid Product, explicit boolean destination switches and no-publication confirmation required.'},400);
 const consent471=verifyProductChannelConsent471(b);
 if(!consent471.ok)return reply({error:consent471.error},400);
 const id=String(b.product_id);
 try{
  const p=await g.db.prepare('SELECT product_id FROM products WHERE product_id=? LIMIT 1').bind(id).first();
  if(!p)return reply({error:'Save the canonical Product before recording channel switches.'},409);
  const detail={build:405,product_id:Number(id),etsy:b.etsy,facebook:b.facebook,request_key:b.request_key,
   confirmed_no_provider_publication:true,canonical_product_source:true,canonical_media_source:true,
   provider_called:false,publication_performed:false,
   ...(consent471.legacy?{}:{intent_source_build:471,owner_confirmed_preparation:true,
     canada_only:true,us_shipping_disabled:true,remote_draft_consent:false,provider_media_transfer_consent:false})};
  const prior=await g.db.prepare(latest).bind(id).first();
  // Refuse overwriting a newer explicit preference from another browser session.
  if(b.expected_receipt!=null&&Number(b.expected_receipt)!==Number(prior?.admin_action_audit_id||0))
   return reply({error:'Another editor changed destination preferences. Reload them before saving.'},409);
  const old=prior?.details_json?JSON.parse(prior.details_json):null;
  if(old?.request_key===detail.request_key){
   if(old.etsy!==detail.etsy||old.facebook!==detail.facebook)return reply({error:'Request-key conflict.'},409);
   return reply({product_id:Number(id),preferences:normalizeChannelPrefs(prior),idempotent:true});
  }
  const sql="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) "+
  "SELECT ?,'product_channel_intent_405','product',?,'POST',?,?,CURRENT_TIMESTAMP "+
  "WHERE EXISTS (SELECT 1 FROM products WHERE product_id=?) "+
  "AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='product_channel_intent_405' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.request_key')=?)";
  await g.db.prepare(sql).bind(g.user.user_id,id,new URL(c.request.url).pathname,JSON.stringify(detail),id,id,detail.request_key).run();
  const recorded=await g.db.prepare("SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='product_channel_intent_405' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1").bind(id,detail.request_key).first();
  if(!recorded||JSON.parse(recorded.details_json)?.etsy!==detail.etsy||JSON.parse(recorded.details_json)?.facebook!==detail.facebook)
   return reply({error:'Channel intent write outcome unconfirmed; do not assume switches were saved.'},409);
  return reply({product_id:Number(id),preferences:normalizeChannelPrefs(recorded),message:'Local channel preferences saved; no Etsy or Marketplace listing was posted.'});
 }catch{return reply({error:'Local destination intent could not be confirmed; inspect before retry.'},503);}
}
