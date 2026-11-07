/* Build 625: read-only original-owner activation assistant, source schema
 * visibility and independently verified real Meta GET witness reconciliation. */
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {metaReadOnlyPreflight619} from '../_lib/trustReconcile619.js';
import {HOLD_625,schemaReadback625,deriveAssistance625}
  from '../_lib/trustActivationAssistant625.js';
import {onRequestGet as readOriginalWindow623} from './trust-activation-623.js';
import {onRequestGet as readActualWitness624} from './trust-meta-live-624.js';

const reply=(value,status=200)=>jsonResponse(value,status,{'Cache-Control':'no-store'});
const safe={build:625,release_gate:HOLD_625,connected:false,
  posting_enabled:false,provider_get_performed:false,credential_exposed:false,
  migration_performed:false,original_authority_enrolled:false};

async function credentialReadback625(db){
  try{
    const row=await db.prepare(`SELECT provider_key,remote_subject_id,
      connection_status,scopes_json,access_expires_at,
      CASE WHEN access_token_ciphertext IS NOT NULL AND
        LENGTH(access_token_ciphertext)>0 THEN 1 ELSE 0 END AS saved_token
      FROM oauth_provider_connections WHERE provider_key='meta' LIMIT 1`).first();
    if(!row)return {saved_encrypted_credential:false,
      credential_unexpired:false,read_only_page_candidate:false};
    return {saved_encrypted_credential:row.saved_token===1,
      credential_unexpired:Number.isFinite(Date.parse(row.access_expires_at))&&
        Date.parse(row.access_expires_at)>Date.now()+120000,
      read_only_page_candidate:metaReadOnlyPreflight619(row).facebook_page_read_candidate===true,
      expires_at:row.access_expires_at||null,
      // No provider ID, plaintext, ciphertext or scope contents returned.
      status:'ORIGINAL_ENCRYPTED_CREDENTIAL_READBACK_ONLY'};
  }catch{return {saved_encrypted_credential:false,credential_unexpired:false,
    read_only_page_candidate:false,status:'CREDENTIAL_READBACK_UNAVAILABLE_HOLD'};}
}

export async function onRequestGet(c){
  if(!await getAdminUserFromRequest(c.request,c.env))
    return reply({ok:false,error:'Admin session required.'},401);
  const db=getDb(c.env);
  if(!db)return reply({ok:false,...safe,error:'Original D1 database unavailable.'},503);
  let schema;
  try{schema=await schemaReadback625(db);}catch{
    return reply({ok:false,...safe,error:'Original D1 schema readback unavailable.'},503);}
  const credential=await credentialReadback625(db);
  let originalWindow=false,liveWitness=false;
  if(schema.all_source_tables_present){
    // Invoke the existing independently validating readbacks. Never infer
    // signed trust from counts, saved status strings or a production deploy.
    try{const response=await readOriginalWindow623(c);
      if(response.ok){const report=await response.json();
        originalWindow=report.derived_readonly_page_identity_window?.verified===true;
      }}catch{originalWindow=false;}
    try{const response=await readActualWitness624(c);
      if(response.ok){const report=await response.json();
        liveWitness=report.latest_verified_original_get===
          'ORIGINAL_ONE_GENUINE_META_GET_WITNESSED_READ_ONLY_NO_CONNECTION';
      }}catch{liveWitness=false;}
  }
  const assistant=deriveAssistance625({schema,originalWindow,liveWitness,
    credentialPresent:credential.saved_encrypted_credential,
    credentialUnexpired:credential.credential_unexpired,
    providerCandidate:credential.read_only_page_candidate});
  return reply({ok:true,...safe,original_database_readback:schema,
    original_credential_readback:credential,assistant,
    operator_sections:[35,36,37,38,39,40,41,42,43,44,45],
    genuine_provider_test_executed_by_this_request:false});
}

export function onRequestPost(){
  return reply({ok:false,...safe,error:'Read-only assistant: use signed, step-up-protected original-owner sections 44/45 for evidence actions.'},405);
}
