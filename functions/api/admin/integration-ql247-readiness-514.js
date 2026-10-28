/* Build 514: owner-safe QL-247 Phase A source return. Read only; no HMAC
 * provisioning, network probe, gateway key rotation or live pilot. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {onRequestGet as ql246Get} from './integration-ql246-source-comparison-513.js';
import {ql247SourceReadiness514} from '../_lib/ql247Readiness514.mjs';
const response=(data,status=200)=>jsonResponse({ok:status<400,build:514,
  connection_state:'DISCONNECTED',owner_pilot_authorized:false,real_connection_verified:false,
  provider_modified:false,publication_performed:false,private_key_disclosed:false,...data},status,{'Cache-Control':'no-store'});
export async function onRequestGet(c){
 if(!verifiedAdminFromModule(c))return response({error:'Verified Admin required.'},401);
 if(!getDb(c.env))return response({error:'D1 local evidence unavailable.'},503);
 try{const prior=await ql246Get({...c,request:new Request(new URL('/api/admin/integration-ql246-source-comparison-513',c.request.url),{
  method:'GET',headers:c.request.headers})});
  if(!prior.ok)return response({error:'QL-246 source receipt comparison cannot be read.'},503);
  const evidence=await prior.json();
  return response({...ql247SourceReadiness514(evidence),read_only:true,
   prior_source_health_receipt_id:evidence.source_health_nonce_receipt_id||null,
   prior_source_capabilities_receipt_id:evidence.source_capabilities_nonce_receipt_id||null,
   previous_local_ql246_signature_receipt_id:evidence.prior_ql246_signature_receipt_id||null,
   last_ql246_receipt_accepted_as_gateway_proof:false});
 }catch{return response({error:'QL-247 local source readiness unavailable; HOLD.'},503);}
}
export const onRequestPost=()=>response({error:'QL-247 readiness is read only. No test keys or live connections here.'},405);
export const onRequestPut=onRequestPost;
export const onRequestPatch=onRequestPost;
export const onRequestDelete=onRequestPost;
