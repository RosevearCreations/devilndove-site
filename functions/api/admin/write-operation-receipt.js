// Build 385 — authenticated operator receipt read-only lookup; never reveals cross-user receipts.
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {SCOPES,keyValid,fetchReceipt} from './_lib/writeReceipts.js';
const out=(d,s=200)=>jsonResponse({release:467,build:385,...d},s,{'Cache-Control':'no-store'});
export async function onRequestGet({request,env}){
 const actor=await getAdminUserFromRequest(request,env);
 if(!actor)return out({ok:false,error:'Admin authentication required.'},401);
 const db=getDb(env);if(!db)return out({ok:false,error:'Database unavailable.'},503);
 const q=new URL(request.url).searchParams;
 const scope=q.get('scope')||'',key=q.get('request_key')||'';
 if(!SCOPES.includes(scope)||!keyValid(key))return out({ok:false,error:'Supported scope and valid request key required.'},400);
 try{
  const receipt=await fetchReceipt(db,scope,key);
  if(!receipt || Number(receipt.actor_user_id)!==Number(actor.user_id))
   return out({ok:true,found:false,status:'not_found',note:'No committed receipt found for this administrator. Do not infer operation failure or blindly retry.'});
  return out({ok:true,found:true,status:'committed',receipt_id:Number(receipt.admin_write_receipt_id),
    action_scope:scope,source_record_id:Number(receipt.source_record_id),target_type:receipt.target_type,
    target_id:Number(receipt.target_id),committed_at:receipt.created_at,
    message:'OK — this specific operation was already committed. A retry with the same key and unchanged payload is safe.'});
 }catch(e){console.error('BUILD385_RECEIPT_READ_UNAVAILABLE',e?.name||'Error');
  return out({ok:false,error:'Receipt lookup unavailable. Result remains unknown.',code:'LOOKUP_UNAVAILABLE'},503);}
}
