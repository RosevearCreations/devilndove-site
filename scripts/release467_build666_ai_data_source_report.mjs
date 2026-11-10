// Build 666: deterministic, read-only source report for a future owner-approved
// AI Data Platform intake. Local git checksums are NOT source-owner signatures.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readSourceRegister,validateReadiness} from './release467_build655_master_shell_source_readiness.mjs';
import {loadChannelReadiness,validateChannelReadiness} from './release467_build665_channel_readiness.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path));
const json=path=>JSON.parse(read(path).toString('utf8'));
const sha256=value=>createHash('sha256').update(value).digest('hex');
const sha40=/^[a-f0-9]{40}$/;
const sha64=/^[a-f0-9]{64}$/;
export const contractPath='docs/operations/RELEASE_467_BUILD_666_AI_DATA_SOURCE_REPORT_CONTRACT.json';
const manifestPath='.well-known/rosevear-integration-manifest.json';
const originalRegistryPath='docs/operations/RELEASE_467_BUILD_655_SOURCE_READINESS_REGISTER.json';
const channelPath='docs/operations/RELEASE_467_BUILD_665_CHANNEL_READINESS.json';
const evidenceFingerprint=revision=>sha256([read(originalRegistryPath),read(manifestPath),read(channelPath),
  Buffer.from(revision)].map(x=>sha256(x)).join(':'));

export function localRevision(){
  return execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
}

export function buildSourceReport({revision=localRevision(),now=Date.now(),
  registry=readSourceRegister(),manifest=json(manifestPath),
  channels=loadChannelReadiness(),contract=json(contractPath)}={}){
  if(!sha40.test(revision))throw Error('INVALID_SOURCE_REVISION');
  if(!Number.isFinite(now)||now<0)throw Error('INVALID_OBSERVED_TIME');
  if(contract?.schema!=='devilndove.ai-data.source-report-contract.v1' ||
      contract.source_id!=='devilndove' || contract.intended_consumer!=='ai-data-platform' ||
      contract.transport!=='OFFLINE_OWNER_REVIEW_NO_EVENT_PUBLISHER')throw Error('INVALID_REPORT_CONTRACT');
  const registryCheck=validateReadiness(registry,{manifest,at:now,checkPaths:true});
  const channelCheck=validateChannelReadiness(channels);
  if(registryCheck.errors.length || !channelCheck.ok)throw Error('SOURCE_EVIDENCE_CONTRACT_FAILED');
  const revisionMatches=manifest.source_revision===revision;
  const evidence=registryCheck.evidence.map(x=>({id:x.id,freshness:x.freshness,
    originalIndependentVerification:x.freshness==='CURRENT'}));
  const output={
    schema:'devilndove.ai-data.source-report.v1',sourceId:'devilndove',
    repository:'RosevearCreations/devilndove-site',sourceRole:'owned_business_shell',
    intendedConsumer:'ai-data-platform',environment:'SOURCE_LOCAL_READ_ONLY',sourceRevision:revision,
    observedAt:new Date(now).toISOString(),
    localEvidenceFingerprint:evidenceFingerprint(revision),
    manifest:{path:manifestPath,declaredRevision:manifest.source_revision,
      freshness:revisionMatches?'MATCHES_LOCAL_REVISION_UNATTESTED':'STALE_REVISION',
      independentlySigned:false,sourceOriginVerified:false},
    readiness:{registryFields:registryCheck.registryFields.total,
      heldRegistryFields:registryCheck.registryFields.held,
      evidenceAxes:evidence.length,independentlyCurrentEvidence:registryCheck.independentCurrentEvidence,
      proposedModuleDenominator:'UNRATIFIED',certifiedModuleCompletionPercentage:null,
      channelConnection:channels.provider_connection,masterConnection:'DISCONNECTED / HOLD'},
    evidence,
    events:{proposedFamilies:registryCheck.eventFamilies.proposed,enabledFamilies:0,
      messagePublishingEnabled:false},
    receipt:{state:'HOLD_NO_ORIGINAL_SIGNED_RECEIPT',originalOwnerVerified:false,
      originalIssuerWitnessVerified:false,sourceSignerEnrolled:false,
      approvedAudienceVerified:false,oneUseNonceClaimVerified:false,
      independentTransportAttestation:false},
    privacy:{customerDataIncluded:false,staffDataIncluded:false,providerSecretsIncluded:false,
      workerDeviceCommandsEnabled:false,otherBusinessTenantDataIncluded:false},
    transport:'OFFLINE_OWNER_REVIEW_NO_EVENT_PUBLISHER',
    status:'HOLD_INDEPENDENT_SOURCE_AND_MASTER_APPROVAL'
  };
  const checked=validateSourceReport(output,contract);
  if(!checked.ok)throw Error('INVALID_PRODUCED_REPORT:'+checked.errors.join(','));
  return output;
}

export function validateSourceReport(value,contract=json(contractPath)){
  const errors=[];
  const expect=(v,why)=>{if(!v)errors.push(why)};
  expect(contract?.source_id==='devilndove' && contract?.source_role==='owned_business_shell' &&
    contract?.intended_consumer==='ai-data-platform','contract_source_identity');
  expect(contract?.original_owner_signer_enrolled===false && contract?.approved_persistent_audience===false &&
    contract?.verified_signed_receipt===false && contract?.event_publishing_enabled===false &&
    contract?.completion_percentage_certified===false,'contract_authority');
  const allowed=contract?.allowed_report_fields||[];
  expect(Array.isArray(allowed) && allowed.length===17 &&
    Object.keys(value||{}).length===allowed.length &&
    Object.keys(value||{}).every(k=>allowed.includes(k)),'report_field_allowlist');
  expect(value?.schema==='devilndove.ai-data.source-report.v1' &&
    value?.sourceId==='devilndove' && value?.repository==='RosevearCreations/devilndove-site' &&
    value?.sourceRole==='owned_business_shell','source_identity');
  expect(value?.intendedConsumer==='ai-data-platform' && value?.environment==='SOURCE_LOCAL_READ_ONLY',
    'audience_boundary');
  expect(sha40.test(value?.sourceRevision??'') && sha64.test(value?.localEvidenceFingerprint??'') &&
    Number.isFinite(Date.parse(value?.observedAt??'')),'local_provenance');
  if(sha40.test(value?.sourceRevision??''))
    expect(value.localEvidenceFingerprint===evidenceFingerprint(value.sourceRevision),
      'local_checksum_mismatch');
  expect(value?.manifest?.path===manifestPath && sha40.test(value?.manifest?.declaredRevision??'') &&
    (value?.manifest?.freshness==='STALE_REVISION'||value?.manifest?.freshness==='MATCHES_LOCAL_REVISION_UNATTESTED') &&
    value?.manifest?.independentlySigned===false && value?.manifest?.sourceOriginVerified===false,
    'unsigned_manifest');
  expect(value?.manifest?.freshness===(value?.manifest?.declaredRevision===value?.sourceRevision?
    'MATCHES_LOCAL_REVISION_UNATTESTED':'STALE_REVISION'),'manifest_revision_comparison');
  expect(value?.readiness?.masterConnection==='DISCONNECTED / HOLD' &&
    value?.readiness?.channelConnection==='HOLD' &&
    value?.readiness?.registryFields===18 &&
    Number.isInteger(value?.readiness?.heldRegistryFields) && value.readiness.heldRegistryFields>0 &&
    value?.readiness?.independentlyCurrentEvidence===0 &&
    value?.readiness?.proposedModuleDenominator==='UNRATIFIED' &&
    value?.readiness?.certifiedModuleCompletionPercentage===null,'unverified_readiness');
  expect(Array.isArray(value?.evidence) && value.evidence.length>=6 &&
    new Set(value.evidence.map(x=>x.id)).size===value.evidence.length &&
    value.evidence.every(x=>x.originalIndependentVerification===false &&
      x.freshness!=='CURRENT'),'evidence_freshness_hold');
  expect(value?.readiness?.evidenceAxes===value?.evidence?.length,'evidence_axis_count');
  expect(value?.events?.proposedFamilies===8 && value?.events?.enabledFamilies===0 &&
    value?.events?.messagePublishingEnabled===false,'event_transport_hold');
  const rec=value?.receipt;
  expect(rec?.state==='HOLD_NO_ORIGINAL_SIGNED_RECEIPT' &&
    rec.originalOwnerVerified===false && rec.originalIssuerWitnessVerified===false &&
    rec.sourceSignerEnrolled===false && rec.approvedAudienceVerified===false &&
    rec.oneUseNonceClaimVerified===false && rec.independentTransportAttestation===false,'signed_receipt_hold');
  expect(Object.keys(value?.privacy||{}).length===5 &&
    Object.values(value?.privacy||{}).every(x=>x===false),'privacy_boundary');
  expect(value?.transport==='OFFLINE_OWNER_REVIEW_NO_EVENT_PUBLISHER' &&
    value?.status==='HOLD_INDEPENDENT_SOURCE_AND_MASTER_APPROVAL','transport_hold');
  const blocked=contract?.blocked_payload_fields||[];
  expect(Array.isArray(blocked) && blocked.length>=8 &&
    blocked.every(k=>!Object.hasOwn(value||{},k)),'private_fields_absent');
  return {ok:errors.length===0,errors};
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const model=buildSourceReport();
    if(process.argv.includes('--json'))process.stdout.write(JSON.stringify(model,null,2)+'\n');
    else process.stdout.write(JSON.stringify({sourceId:model.sourceId,sourceRevision:model.sourceRevision,
      manifestFreshness:model.manifest.freshness,independentEvidence:model.readiness.independentlyCurrentEvidence,
      originalSignedReceipt:model.receipt.state,masterConnection:model.readiness.masterConnection,
      eventPublisherEnabled:model.events.messagePublishingEnabled,status:model.status},null,2)+'\n');
  }catch(err){process.stderr.write('BUILD_666_REPORT_HOLD: '+err.message+'\n');process.exitCode=1;}
}
