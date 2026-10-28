/* Build 515: review QL-247 nonproduction test prerequisites and the QL-248
 * two-SHA clarification. Not a key/connection provisioning endpoint. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {onRequestGet as sourceGet514} from './integration-ql247-readiness-514.js';
import {ql248Prerequisites515} from '../_lib/ql248Prerequisites515.mjs';
const uuid=x=>/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(String(x||''));
const response=(data,status=200)=>jsonResponse({ok:status<400,build:515,
 connection_state:'DISCONNECTED',nonproduction_test_authorized:false,
 owner_pilot_authorized:false,credentials_provisioned:false,
 product_reference_enabled:false,marketplace_writes_enabled:false,
 provider_modified:false,publication_performed:false,...data},status,{'Cache-Control':'no-store'});
const gate=c=>{const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:response({error:'Verified Admin required.'},401)}:
 !db?{error:response({error:'Local D1 audit unavailable.'},503)}:{admin,db};};
async function read(c,g){
 const older=await sourceGet514({...c,request:new Request(new URL(
  '/api/admin/integration-ql247-readiness-514',c.request.url),{method:'GET',headers:c.request.headers})});
 if(!older.ok)throw Error('Existing QL-247 source evidence unavailable.');
 const [source,row]=await Promise.all([older.json(),g.db.prepare(
  "SELECT admin_action_audit_id,actor_user_id,details_json FROM admin_action_audit WHERE action_type='rosevear_ql248_test_prerequisite_note_515' AND target_type='integration_gateway' AND target_key='devilndove' ORDER BY admin_action_audit_id DESC LIMIT 1").first()]);
 return {...ql248Prerequisites515(source),last_local_prerequisite_note_id:row?.admin_action_audit_id||null,
  last_local_note_independent_owner_approval:false};
}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 try{return response({...await read(c,g),read_only:true});}
 catch{return response({error:'QL-248 source/prerequisite review unavailable; no test authorized.'},503);}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return response({error:'Same-origin verified Admin required.'},403);
 let b;try{b=await c.request.json();}catch{return response({error:'JSON required.'},400);}
 if(b?.action!=='record_local_test_prerequisite_review'||!uuid(b.request_key)||
  b.source_system!=='devilndove'||b.business_id!=='devilndove'||b.tenant_id!==null||
  b.confirm_no_nonproduction_test_authorization!==true||
  b.confirm_no_credential_or_secret_provision!==true||
  b.confirm_two_sha_proposed_only!==true||b.confirm_no_gateway_request!==true||
  typeof b.prerequisite_note!=='string'||b.prerequisite_note.trim().length<30||
  b.prerequisite_note.length>800||/-----BEGIN|bearer\s+|(?:private.key|password|hmac.secret|api.token)\s*[:=]/i.test(b.prerequisite_note))
  return response({error:'Factual public-only prerequisite note, identity, UUID and no-authorization/credentials confirmations required.'},400);
 try{const current=await read(c,g);
  const details={build:515,request_key:b.request_key,source_system:'devilndove',business_id:'devilndove',tenant_id:null,
   prerequisite_note:b.prerequisite_note.trim(),
   ql248_two_sha_source_guidance:'PROPOSED_CONSUMER_AGREEMENT_MISSING',
   source_commit_sha:null,proof_commit_sha:null,public_spki_pin:null,
   test_owner_approval:false,seven_actual_negative_tests_verified:false,
   real_gateway_health_get_verified:false,connection_state:'DISCONNECTED',
   provider_modified:false,publication_performed:false,
   previous_review_id:current.last_local_prerequisite_note_id};
  const result=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,'rosevear_ql248_test_prerequisite_note_515','integration_gateway','devilndove','POST',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='rosevear_ql248_test_prerequisite_note_515' AND target_type='integration_gateway' AND target_key='devilndove' AND json_extract(details_json,'$.request_key')=?)")
   .bind(g.admin.user_id,new URL(c.request.url).pathname,JSON.stringify(details),b.request_key).run();
  if(Number(result.meta?.changes)!==1)return response({error:'Prerequisite note already recorded; refresh.'},409);
  return response({local_prerequisite_receipt_id:Number(result.meta?.last_row_id)||null,
   status:'OPERATOR_PREREQUISITES_NOT_APPROVAL',
   message:'Local missing-prerequisite evidence recorded; no nonproduction GET, key issuance, pilot or production action occurred.'});
 }catch{return response({error:'Local source evidence unavailable; no test or connection authorized.'},503);}
}
