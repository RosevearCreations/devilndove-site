/* Build 509: security-review handoff ONLY after two accepted signed GET receipts.
 * Never provisions keys, returns secret values, or grants cross-business access. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {gatewayReadiness508} from './integration-gateway-readiness-508.js';
import {nonproductionSettings510} from '../_lib/integrationContract510.mjs';

const respond=(data,status=200)=>jsonResponse({ok:status<400,build:509,read_only_scope:true,
  credentials_returned:false,credentials_provisioned:false,connected:false,approved_for_live_data:false,
  product_reference_enabled:false,events_enabled:false,commands_enabled:false,...data},status,{'Cache-Control':'no-store'});
const uuid=x=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(String(x||''));
function gate(c){const actor=verifiedAdminFromModule(c),db=getDb(c.env);
 return !actor?{error:respond({error:'Verified Admin required for security handoff.'},401)}:
  !db?{error:respond({error:'Gateway audit database unavailable.'},503)}:{actor,db};}
async function proof(c,db){
 if(c.env?.ROSEVEAR_QL243_DEPLOYMENT_CLASS==='nonproduction'){
  const conf=nonproductionSettings510(c.env);
  const evidence=await db.prepare("SELECT request_path,details_json,created_at FROM admin_action_audit WHERE action_type='rosevear_integration_v1_nonce_510' AND target_type='integration_nonce' ORDER BY admin_action_audit_id DESC LIMIT 60").all();
  const accepted=(evidence?.results||[]).filter(row=>{let detail;try{detail=JSON.parse(row.details_json||'{}');}catch{return false;}
   return detail.source==='ai-data-platform'&&detail.destination==='devilndove'&&detail.business==='devilndove'&&
    detail.tenant===null&&detail.environment==='nonproduction'&&detail.key_id===conf.keyId&&
    detail.scope==='health_capabilities_get_only'&&detail.decision==='read_only_accepted';});
  const health=accepted.find(row=>row.request_path==='/api/integration/v1/health');
  const capabilities=accepted.find(row=>row.request_path==='/api/integration/v1/capabilities');
  return {state:conf.configured&&health&&capabilities?'TESTING':conf.configured?'CONFIGURED':'DISCONNECTED',
   contract_version:'rosevear.integration.v1',application_id:'devilndove',gateway:'ai-data-platform',
   environment:'nonproduction',key_id_configured:Boolean(conf.keyId),secret_configured:Boolean(conf.secret),
   revoked:conf.revoked,accepted_health_receipt:Boolean(health),accepted_capabilities_receipt:Boolean(capabilities),
   last_health_at:health?.created_at||null,last_capabilities_at:capabilities?.created_at||null,
   source_side_receipts_only:true,nonproduction_key_id:conf.keyId,
   missing_or_next_steps:['Source-side accepted signed GETs are not gateway Ed25519 receipts or independently witnessed owner approval.',
    'Gateway audit durability, public SPKI pins and nonproduction pilot permission remain unverified.']};
 }
 const rows=await db.prepare("SELECT request_path,details_json,created_at FROM admin_action_audit WHERE action_type='rosevear_integration_v1_nonce_506' AND target_type='integration_nonce' ORDER BY admin_action_audit_id DESC LIMIT 40").all();
 return gatewayReadiness508(c.env,rows?.results||[]);
}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 try{const snapshot=await proof(c,g.db);
  return respond({state:snapshot.state,contract_version:snapshot.contract_version,application_id:snapshot.application_id,
   gateway:snapshot.gateway,environment:snapshot.environment,key_id_configured:snapshot.key_id_configured,
   secret_configured:snapshot.secret_configured,revoked:snapshot.revoked,
   accepted_health_receipt:snapshot.accepted_health_receipt,accepted_capabilities_receipt:snapshot.accepted_capabilities_receipt,
   source_side_receipts_only:snapshot.source_side_receipts_only===true,nonproduction_key_id:snapshot.nonproduction_key_id||null,
   last_health_at:snapshot.last_health_at,last_capabilities_at:snapshot.last_capabilities_at,
   ready_to_prepare_security_handoff:snapshot.state==='TESTING'&&snapshot.accepted_health_receipt&&snapshot.accepted_capabilities_receipt,
   missing_or_next_steps:snapshot.missing_or_next_steps,
   next_action:'Owner reviews credential rotation, tenant isolation and no-dispatch scope. A handoff receipt is not activation.'});
 }catch{return respond({error:'Cannot independently review signed gateway health and capabilities receipts.'},503);}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return respond({error:'Same-origin security handoff required.'},403);
 let b;try{b=await c.request.json();}catch{return respond({error:'JSON required.'},400);}
 if(b?.action!=='record_read_only_security_handoff'||!uuid(b?.request_key)||
    b?.confirm_rotation_plan!==true||b?.confirm_tenant_isolation!==true||b?.confirm_secrets_server_only!==true||
    b?.confirm_no_dispatch_or_data_access!==true)
  return respond({error:'Security handoff requires a unique request key and all four separate explicit owner attestations.'},400);
 try{
  const snapshot=await proof(c,g.db);
  if(snapshot.state!=='TESTING'||!snapshot.accepted_health_receipt||!snapshot.accepted_capabilities_receipt||snapshot.revoked)
   return respond({error:'HOLD — server-only credentials and two independently accepted signed GET receipts are required; no handoff recorded.',state:snapshot.state},409);
  if(String(b.environment||'')!==String(snapshot.environment||''))return respond({error:'HOLD — gateway environment changed; review credential/nonce receipts again.'},409);
  const details={build:509,contract_version:snapshot.contract_version,application_id:'devilndove',
   gateway:'ai-data-platform',environment:snapshot.environment,request_key:b.request_key,
   accepted_health_receipt:true,accepted_capabilities_receipt:true,
   source_side_receipts_only:snapshot.source_side_receipts_only===true,nonproduction_key_id:snapshot.nonproduction_key_id||null,
   owner_reviewed_rotation_plan:true,owner_reviewed_tenant_isolation:true,
   server_only_secret:true,no_dispatch_or_product_access:true,
   scope:'read_only_health_and_capabilities_handoff',connected:false,credentials_provisioned:false,
   approved_for_live_data:false,commands_enabled:false,events_enabled:false};
  const stored=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,'rosevear_integration_509_security_handoff','integration_gateway','devilndove','POST',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='rosevear_integration_509_security_handoff' AND target_type='integration_gateway' AND target_key='devilndove' AND json_extract(details_json,'$.request_key')=?)")
   .bind(g.actor.user_id,new URL(c.request.url).pathname,JSON.stringify(details),b.request_key).run();
  if(Number(stored.meta?.changes||0)!==1)return respond({error:'This security handoff key was already recorded. Review the saved receipt before any further action.'},409);
  return respond({security_handoff_prepared:true,receipt_id:Number(stored.meta?.last_row_id)||null,
   state:'TESTING',message:'Owner-reviewed read-only gateway security handoff prepared. No credential creation, data access or connection activation occurred.'});
 }catch{return respond({error:'Gateway handoff remains on HOLD until the signed receipts and server-only security scope can be verified.'},409);}
}
