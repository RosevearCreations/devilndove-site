// Build 667: safe offline Comms Hub envelope preview, never a sender or an
// alternate permission path to the independent QL-364/QL-365D handshake.
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {STAGES,QA,POLICY} from '../functions/api/_lib/workshopLifecycle657.mjs';
import {buildSourceReport,validateSourceReport} from './release467_build666_ai_data_source_report.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const contractPath='docs/operations/RELEASE_467_BUILD_667_COMMS_HANDOFF_PREVIEW_CONTRACT.json';
const json=path=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
const sha40=/^[a-f0-9]{40}$/;
const keys=Object.freeze(['kind','status','sourceRevision','occurredAt','severity']);
const incidentStates=Object.freeze(['open','triage','acknowledged','resolved']);
const notificationStates=Object.freeze(['review_requested','owner_hold','cancelled']);
const incidentSeverity=Object.freeze(['warning','error','critical']);
const eventFamilies=Object.freeze({workshop_status:'workflow.status.changed',
  workshop_qa:'workflow.status.changed',incident_opened:'incident.opened',
  incident_updated:'incident.updated',notification_intent:null});

export function readCommsContract(){return json(contractPath)}
export function assertCommsBoundary(contract=readCommsContract()){
  const errors=[];
  const demand=(test,code)=>{if(!test)errors.push(code)};
  demand(contract?.schema==='devilndove.comms.source-handoff-preview.v1' && contract?.build===667,
    'schema');
  demand(contract?.source_id==='devilndove' && contract?.source_role==='owned_business_shell' &&
    contract?.repository==='RosevearCreations/devilndove-site' &&
    contract?.intended_consumer==='rosevear-comms-hub','source_identity');
  demand(contract?.original_handler==='functions/api/_lib/ql364-source-health.mjs' &&
    contract?.original_manifest==='.well-known/rosevear-integration-manifest.json',
    'original_boundary');
  demand(contract?.transport==='LOCAL_OFFLINE_PREVIEW_NOT_CONNECTED' &&
    contract?.data_boundary==='STRUCTURAL_SOURCE_METADATA_ONLY_NO_CUSTOMERS_WORKERS_MEDIA_OR_NOTES',
    'privacy_transport');
  const observed=contract?.event_kinds;
  demand(Array.isArray(observed) && observed.length===Object.keys(eventFamilies).length &&
    Object.keys(eventFamilies).every(kind=>observed.some(row=>row.kind===kind &&
      row.family===eventFamilies[kind])) && new Set(observed.map(x=>x.kind)).size===observed.length,
    'event_family_map');
  for(const field of ['original_owner_consent_verified','independent_source_signer_enrolled',
    'original_ql365d_test_receipt_verified','persistent_audience_approved',
    'comms_receiver_connected','outbound_notifications_enabled','incident_routing_enabled',
    'automatic_workshop_events_enabled','original_customer_media_release_verified'])
    demand(contract?.[field]===false,'authority_'+field);
  demand(POLICY.projectStatusMutation===false && POLICY.providerCall===false &&
    POLICY.privateOwnerReview===true,'source_workshop_review_boundary');
  return {ok:errors.length===0,errors};
}

export function previewCommsHandoff(input,{now=Date.now(),sourceReport=buildSourceReport(),
  contract=readCommsContract()}={}){
  const policy=assertCommsBoundary(contract);
  if(!policy.ok)throw Error('COMMS_BOUNDARY_HOLD:'+policy.errors.join(','));
  if(!validateSourceReport(sourceReport).ok || sourceReport.status!==
      'HOLD_INDEPENDENT_SOURCE_AND_MASTER_APPROVAL' ||
      sourceReport.receipt.state!=='HOLD_NO_ORIGINAL_SIGNED_RECEIPT')
    throw Error('ORIGINAL_SOURCE_REPORT_NOT_ACCEPTED');
  if(!input || typeof input!=='object' || Array.isArray(input) ||
    Object.keys(input).some(k=>!keys.includes(k)))throw Error('UNSAFE_HANDOFF_FIELDS');
  const kind=input.kind,status=input.status,severity=input.severity;
  if(!Object.hasOwn(eventFamilies,kind))throw Error('UNKNOWN_HANDOFF_KIND');
  const allowed=kind==='workshop_status'?STAGES:kind==='workshop_qa'?QA:
    kind==='notification_intent'?notificationStates:incidentStates;
  if(typeof status!=='string' || !allowed.includes(status))throw Error('UNKNOWN_SOURCE_STATUS');
  if(kind.startsWith('incident_')){
    if(!incidentSeverity.includes(severity))throw Error('INVALID_INCIDENT_SEVERITY');
  }else if(severity!==undefined)throw Error('UNEXPECTED_SEVERITY');
  if(!sha40.test(input.sourceRevision??''))throw Error('INVALID_SOURCE_REVISION');
  const occurred=Date.parse(input.occurredAt??'');
  if(!Number.isFinite(now) || !Number.isFinite(occurred) ||
    input.occurredAt!==new Date(occurred).toISOString())throw Error('INVALID_SOURCE_TIME');
  const age=now-occurred;
  const revisionDrift=input.sourceRevision!==sourceReport.sourceRevision;
  const stale=age>24*60*60_000 || age < -5_000;
  const hold=revisionDrift?'HOLD_SOURCE_REVISION_DRIFT':
    stale?'HOLD_STALE_OR_FUTURE_OBSERVATION':'HOLD_CONSENT_SIGNED_RECEIPT_AND_AUDIENCE';
  const payload={schema:'devilndove.comms.source-handoff-preview.v1',
    sourceId:'devilndove',sourceRole:'owned_business_shell',kind,
    eventFamily:eventFamilies[kind],statusCode:status,
    sourceRevision:input.sourceRevision,observedAt:input.occurredAt,
    privacyClass:'SOURCE_STRUCTURAL_METADATA_ONLY'};
  if(kind.startsWith('incident_'))payload.severityCode=severity;
  return {payload,review:{state:hold,sourceRevisionMatches:!revisionDrift,
    observationCurrent:!stale,originalOwnerConsentVerified:false,
    ql365dSignedTestReceiptVerified:false,commsAudienceGrantVerified:false,
    privateReceiverConnected:false,notificationDispatchEnabled:false,
    incidentRoutingEnabled:false,originalCustomerMediaConsentVerified:false,
    oneUseOperationClaimed:false,delivered:false,recipient:null,
    signedReceipt:null,providerMessageId:null},transport:'NONE_OFFLINE_PREVIEW_ONLY'};
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const sourceReport=buildSourceReport(),contract=readCommsContract();
    const checks=assertCommsBoundary(contract);
    if(!checks.ok)throw Error(checks.errors.join(','));
    const event=previewCommsHandoff({kind:'workshop_status',status:'planning',
      sourceRevision:sourceReport.sourceRevision,
      occurredAt:new Date().toISOString()},{sourceReport});
    process.stdout.write(JSON.stringify({source:'devilndove',comms:'DISCONNECTED / HOLD',
      sourceRevision:sourceReport.sourceRevision,preview:event,networkContacted:false},null,2)+'\n');
  }catch(error){process.stderr.write('BUILD_667_COMMS_HOLD: '+error.message+'\n');process.exitCode=1;}
}
