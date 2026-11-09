/** Build 655: offline, source-owned Master Shell readiness assessment.
 * This does not implement the shared registry, sign a receipt, publish an event,
 * create a user grant, or turn a software build into an authenticated connection.
 */
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const registerPath='docs/operations/RELEASE_467_BUILD_655_SOURCE_READINESS_REGISTER.json';
const requiredRegistryFields=Object.freeze([
  'sourceId','repository','environment','shellBoundary','productOwner','manifestURI',
  'immutableRevision','capabilityVersion','contractVersion','approvedOrigin',
  'signerKeyId','signerFingerprint','status','statusObservedAt','statusExpiresAt',
  'lastVerifiedEvidenceURI','rolesAllowed','tenancyModel']);
const allowedFamilies=Object.freeze([
  'source.health.reported','release.promoted','module.readiness.changed',
  'incident.opened','incident.updated','consent.changed',
  'workflow.status.changed','audit.evidence.recorded']);
const allowedAudiences=Object.freeze([
  'yw','icamp','rosiedazzlers','devilndove','ai-data-platform',
  'rosevear-ai-hub','rosevear-comms-hub','rosevear-suite-owner','rosevear-it']);
const blockedPayloadFields=/customer(name|id|email|address|phone)?|private|secret|token|password|note(body|text)?|payment|card|personal|devicecommand|stockmutation/i;
const STATE=new Set(['SOURCE_OBSERVED','SOURCE_REPORTED','REFERENCE_ONLY','HOLD']);
const EVIDENCE_STATE=new Set(['HISTORICAL_REFERENCE','SOURCE_OBSERVED','PROVISIONAL','HOLD','INDEPENDENTLY_VERIFIED']);
const SHA40=/^[a-f0-9]{40}$/;

export function freshnessOf(record,now=Date.now()){
  const verified=record?.independentlyVerifiedAt;
  if(!verified || record.verificationState!=='INDEPENDENTLY_VERIFIED')
    return 'NO_CURRENT_INDEPENDENT_EVIDENCE';
  const at=Date.parse(verified);
  if(!Number.isFinite(at)||at>now+5_000||!Number.isFinite(record.maxAgeHours)||record.maxAgeHours<=0)
    return 'INVALID_OR_FUTURE_EVIDENCE';
  return now-at>record.maxAgeHours*3_600_000?'STALE':'CURRENT';
}

export function validateReadiness(data,{manifest,at=Date.now(),checkPaths=false}={}){
  const errors=[];
  const fail=(condition,message)=>{if(!condition)errors.push(message);};
  fail(data?.format==='devilndove.master-shell.source-readiness.v1','exact local register format');
  fail(data?.build===655,'build number 655');
  fail(data?.classification==='LOCAL_SOURCE_ASSESSMENT_NOT_AN_ENROLLED_MASTER_REGISTRY_RECORD',
    'local report must not impersonate an enrolled registry record');
  const s=data?.source||{};
  fail(s.sourceId==='devilndove'&&s.shellId==='devilndove', 'exact Devil n Dove source/shell ID');
  fail(s.repository==='RosevearCreations/devilndove-site'&&s.tenancyModel==='owned-business-shell',
    'exact owned-business repository and tenancy');
  fail(SHA40.test(s.lastIndependentlyPromotedRelease?.mainCommit??'')&&
    SHA40.test(s.lastIndependentlyPromotedRelease?.tree??''),'historical release commit/tree proof');
  if(manifest){
    fail(manifest.source_id===s.sourceId&&manifest.source_app_id===s.shellId,
      'register source/shell identity matches current manifest');
    fail(manifest.repository===s.repository,'register repository matches source manifest');
    fail(manifest.connection_state==='DISCONNECTED / HOLD',
      'current manifest connection remains DISCONNECTED / HOLD');
    fail(manifest.signature?.key_id===null&&manifest.signature?.value===null,
      'source signer must not be silently marked enrolled');
  }
  const c=data?.referenceContract||{};
  fail(c.custodian==='ai-data-platform'&&c.contractVersion==='1.0.0'&&
    c.eventSchema==='rosevear.master-shell.event.v1'&&
    c.approvedForDevilNDovePublication===false,'reference V1 contract is not a live source grant');
  const gate=data?.connection||{};
  fail(gate.state==='DISCONNECTED / HOLD'&&gate.authenticated===false&&
    gate.originalSourceSignerEnrolled===false&&gate.originalIssuerAndWitnessAccepted===false&&
    gate.oneUsePrivateTestVerified===false&&gate.persistentAudienceGrantApproved===false&&
    gate.eventPublishingEnabled===false&&gate.commsCustomerMessagingEnabled===false&&
    gate.crossAppWritesEnabled===false,'all unproven original authority and transport must remain HOLD');
  const fields=data?.registryFieldReadiness||[];
  fail(Array.isArray(fields)&&fields.length===requiredRegistryFields.length,
    'exact count of AI Data V1 registry fields');
  const found=new Set();
  for(const field of Array.isArray(fields)?fields:[]){
    fail(requiredRegistryFields.includes(field.field)&&!found.has(field.field),
      'unknown or duplicated registry field '+field.field);
    found.add(field.field);
    fail(STATE.has(field.state)&&!!field.custodian,'invalid field state or missing custodian: '+field.field);
    if(field.state==='HOLD'){
      fail(field.value===null&&typeof field.reason==='string'&&field.reason.length>12,
        'held field must have null value and explicit reason: '+field.field);
    }else{
      fail(field.value!==null&&typeof field.evidence==='string'&&field.evidence.length>3,
        'observed field requires a value and source evidence: '+field.field);
    }
    if(checkPaths&&field.evidence&&!field.evidence.startsWith('https://'))
      fail(existsSync(resolve(root,field.evidence)),'missing field evidence path: '+field.evidence);
  }
  for(const field of requiredRegistryFields)fail(found.has(field),'missing required registry field '+field);
  const byField=Object.fromEntries(fields.filter(x=>typeof x.field==='string').map(x=>[x.field,x]));
  for(const field of ['approvedOrigin','signerKeyId','signerFingerprint','statusObservedAt',
    'statusExpiresAt','lastVerifiedEvidenceURI','rolesAllowed'])
    fail(byField[field]?.state==='HOLD'&&byField[field]?.value===null,
      'unverified approval/trust field must stay HOLD: '+field);
  fail(byField.sourceId?.value===s.sourceId&&byField.repository?.value===s.repository,
    'registry proposed source facts match exact source identity');
  fail(byField.tenancyModel?.value===s.tenancyModel,'registry tenancy matches shell');
  fail(byField.status?.value==='DISCONNECTED','registry cannot claim CONNECTED');
  const evidence=data?.evidenceOwnership||[];
  fail(Array.isArray(evidence)&&evidence.length>=6,'evidence ownership covers the defined areas');
  const evidenceIds=new Set();
  const evidenceSummary=[];
  for(const item of Array.isArray(evidence)?evidence:[]){
    fail(typeof item.id==='string'&&item.id.length>5&&!evidenceIds.has(item.id),
      'missing/duplicate evidence ID');evidenceIds.add(item.id);
    fail(!!item.custodian&&!!item.nextAction&&!!item.evidence&&
      Number.isFinite(item.maxAgeHours)&&item.maxAgeHours>0,
      'evidence needs source custodian, next action, source and positive freshness threshold: '+item.id);
    fail(EVIDENCE_STATE.has(item.verificationState),'invalid verification state: '+item.id);
    if(item.verificationState!=='INDEPENDENTLY_VERIFIED')
      fail(item.independentlyVerifiedAt===null,'unverified evidence cannot carry independent timestamp: '+item.id);
    if(checkPaths&&item.evidence&&!item.evidence.startsWith('https://'))
      fail(existsSync(resolve(root,item.evidence)),'missing evidence source path: '+item.evidence);
    evidenceSummary.push({id:item.id,custodian:item.custodian,freshness:freshnessOf(item,at)});
  }
  const proposals=data?.eventProposals||[];
  fail(Array.isArray(proposals)&&proposals.length===allowedFamilies.length,'all V1 family mappings must be considered');
  const types=new Set();
  for(const proposal of Array.isArray(proposals)?proposals:[]){
    fail(allowedFamilies.includes(proposal.eventType)&&!types.has(proposal.eventType),
      'unknown or duplicate proposed V1 event type: '+proposal.eventType);
    types.add(proposal.eventType);
    fail(proposal.state==='HOLD'&&typeof proposal.reason==='string'&&proposal.reason.length>12,
      'proposed event must remain held with a reason: '+proposal.eventType);
    fail(typeof proposal.custodian==='string'&&proposal.custodian.length>5,
      'event family needs a source custodian: '+proposal.eventType);
    fail(Array.isArray(proposal.audience)&&proposal.audience.length>0&&
      proposal.audience.every(x=>allowedAudiences.includes(x))&&
      new Set(proposal.audience).size===proposal.audience.length,
      'event audience must be valid and explicit: '+proposal.eventType);
    fail(Array.isArray(proposal.payloadAllowlist)&&proposal.payloadAllowlist.length>0&&
      new Set(proposal.payloadAllowlist).size===proposal.payloadAllowlist.length&&
      proposal.payloadAllowlist.every(k=>/^[A-Za-z][A-Za-z0-9]*$/.test(k)&&!blockedPayloadFields.test(k)),
      'event payload allowlist must be redacted and field-named: '+proposal.eventType);
  }
  for(const type of allowedFamilies)fail(types.has(type),'missing proposed V1 family '+type);
  const p=data?.privacy||{};
  fail(Object.values(p).length===5&&Object.values(p).every(x=>x===true),
    'private keys, customer information, background sends and tenant impersonation prohibited');
  const held=fields.filter(x=>x.state==='HOLD').map(x=>x.field);
  const result={sourceId:s.sourceId,shellId:s.shellId,registration:'NOT_ENROLLED',
    connection:'DISCONNECTED / HOLD',registeredV1Record:false,
    registryFields:{total:requiredRegistryFields.length,held:held.length,heldFields:held},
    evidence:evidenceSummary,eventFamilies:{proposed:proposals.length,enabled:0},
    independentCurrentEvidence:evidenceSummary.filter(x=>x.freshness==='CURRENT').length,
    errors};
  if(result.independentCurrentEvidence>0&&!data.connection?.authenticated)
    result.registration='NOT_ENROLLED'; // Evidence freshness never elevates trust.
  return result;
}

export function readSourceRegister(){
  return JSON.parse(readFileSync(resolve(root,registerPath),'utf8'));
}
const invoked=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
  const manifest=JSON.parse(readFileSync(resolve(root,'.well-known/rosevear-integration-manifest.json'),'utf8'));
  const report=validateReadiness(readSourceRegister(),{manifest,checkPaths:true});
  if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
  else{
    console.log('BUILD655_MASTER_SHELL_SOURCE_READINESS',report.errors.length?'FAIL':'PASS');
    console.log('SOURCE',report.sourceId,'REGISTRY',report.registration,'CONNECTION',report.connection);
    console.log('REQUIRED_REGISTRY_FIELDS',report.registryFields.total,
      'HELD',report.registryFields.held);
    console.log('CURRENT_INDEPENDENT_EVIDENCE',report.independentCurrentEvidence,
      'EVENT_FAMILIES_PREPARED',report.eventFamilies.proposed,'PUBLISHERS_ENABLED',0);
    for(const problem of report.errors)console.error('FAIL:',problem);
  }
  if(report.errors.length)process.exitCode=1;
}
