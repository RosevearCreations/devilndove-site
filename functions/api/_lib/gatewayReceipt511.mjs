/* Build 511: independently recompute whether local source nonce evidence can
 * be matched to owner + separate reviewer receipts. Not an Ed25519 gateway verifier:
 * the gateway signing key, pins, durable audit and independent witness remain external. */
import {nonproductionSettings510} from './integrationContract510.mjs';
const parse=x=>{try{return JSON.parse(x||'{}')}catch{return {}}};
const utc=x=>{if(!x)return NaN;const s=String(x);return Date.parse(/Z$|[+-]\d\d:\d\d$/.test(s)?s:s.replace(' ','T')+'Z');};
export function gatewayReceiptReadiness511(env,nonceRows=[],owner=null,separation=null,now=Date.now()){
 const conf=nonproductionSettings510(env),valid=[];
 for(const row of nonceRows){const x=parse(row.details_json);
  if(x.source!=='ai-data-platform'||x.destination!=='devilndove'||x.business!=='devilndove'||
    x.tenant!==null||x.environment!=='nonproduction'||x.key_id!==conf.keyId||
    x.decision!=='read_only_accepted'||x.scope!=='health_capabilities_get_only'||
    x.contract_version!=='rosevear.integration.v1'||x.provider_modified!==false||
    x.publication_performed!==false)continue;
  const age=now-utc(row.created_at);
  if(!Number.isFinite(age)||age<0||age>86400000)continue;
  valid.push(row);
 }
 const health=valid.find(x=>x.request_path==='/api/integration/v1/health');
 const capabilities=valid.find(x=>x.request_path==='/api/integration/v1/capabilities');
 const handoff=parse(owner?.details_json),separate=parse(separation?.details_json);
 const ownerGood=owner?.actor_user_id>0&&handoff.environment==='nonproduction'&&
  handoff.source_side_receipts_only===true&&handoff.nonproduction_key_id===conf.keyId&&
  handoff.scope==='read_only_health_and_capabilities_handoff'&&handoff.credentials_provisioned===false&&
  handoff.approved_for_live_data===false;
 const reviewerGood=ownerGood&&Number(separation?.actor_user_id)>0&&
  Number(separation.actor_user_id)!==Number(owner.actor_user_id)&&
  separate.owner_handoff_receipt_id===Number(owner.admin_action_audit_id)&&
  separate.source_health_receipt_id===Number(health?.admin_action_audit_id)&&
  separate.source_capabilities_receipt_id===Number(capabilities?.admin_action_audit_id)&&
  separate.review_scope==='nonproduction_signed_gets_only'&&
  separate.gateway_signed_receipts_verified===false&&separate.owner_pilot_authorized===false;
 const blockers=[];
 if(!conf.configured)blockers.push('Separate nonproduction QL-243 256-bit source signing key not currently configured or revoked.');
 if(!health||!capabilities)blockers.push('Two fresh, exact identity-matched source-side signed GET nonce receipts are missing.');
 if(!ownerGood)blockers.push('Matching nonproduction owner security handoff not proven.');
 if(!reviewerGood)blockers.push('Independent nonproduction source receipt reviewer/handoff chain not proven.');
 blockers.push('Gateway Ed25519-signed receipts, separate trusted public SPKI pin and independently persisted gateway audit are not verified by this source endpoint.');
 blockers.push('An independent owner identity witness and separately authorized read-only owner pilot remain unverified; all 12 communications gates HELD.');
 return {build:511,application_id:'devilndove',source_system:'devilndove',gateway:'ai-data-platform',
  business_id:'devilndove',tenant_id:null,environment:'nonproduction',
  contract_version:'rosevear.integration.v1',nonproduction_profile_configured:conf.configured,
  key_id_configured:Boolean(conf.keyId),key_revoked:conf.revoked,
  health_source_nonce_receipt_id:health?.admin_action_audit_id||null,
  capabilities_source_nonce_receipt_id:capabilities?.admin_action_audit_id||null,
  source_receipts_verified:conf.configured&&Boolean(health&&capabilities),
  source_receipts_within_24h:Boolean(health&&capabilities),
  owner_security_handoff_receipt_id:ownerGood?Number(owner.admin_action_audit_id):null,
  independent_separation_receipt_id:reviewerGood?Number(separation.admin_action_audit_id):null,
  owner_separation_verified:Boolean(reviewerGood),
  gateway_signed_receipts_verified:false,gateway_ed25519_key_pin_verified:false,
  gateway_audit_id:null,gateway_audit_datastore_restart_verified:false,
  owner_identity_witness_verified:false,owner_read_only_pilot_authorized:false,
  product_reference_enabled:false,listing_reference_enabled:false,
  events_enabled:false,commands_enabled:false,live_communications_enabled:false,
  connection_state:'HOLD',blockers};
}
