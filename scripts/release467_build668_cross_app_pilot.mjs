// Build 668: owner-readable, offline six-source discovery and single-source
// negative-access pilot. No network, real restore, signer or master writes.
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildSourceReport,validateSourceReport} from './release467_build666_ai_data_source_report.mjs';
import {assertCommsBoundary} from './release467_build667_comms_handoff_preview.mjs';
import {evaluateShellRequest} from '../functions/api/_lib/ql336-owned-shell.mjs';
import {handleQl364SourceHealth,QL364_PATH} from '../functions/api/_lib/ql364-source-health.mjs';
import {recoveryDescriptor} from '../functions/api/admin/_operationalRecovery.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const contractPath='docs/operations/RELEASE_467_BUILD_668_MASTER_SHELL_PILOT_CONTRACT.json';
const roles=Object.freeze({yw:'platform_shell',icamp:'platform_shell',
  rosiedazzlers:'owned_business_shell',devilndove:'owned_business_shell',
  'ai-data-platform':'suite_intelligence_master',
  'rosevear-ai-hub':'original_windows_support_source'});
const expectedRepos=Object.freeze({yw:'RosevearCreations/yw',icamp:'RosevearCreations/iCamp',
  rosiedazzlers:'RosevearCreations/rosiedazzlers',
  devilndove:'RosevearCreations/devilndove-site',
  'ai-data-platform':'RosevearCreations/ai-data-platform',
  'rosevear-ai-hub':'RosevearCreations/rosevear-ai-hub'});
const expectedHandlers=Object.freeze({yw:'server/ql364-source-health.mjs',
  icamp:'lib/integration-v1/ql364-source-health.mjs',
  rosiedazzlers:'functions/api/_lib/ql364-source-health.mjs',
  devilndove:'functions/api/_lib/ql364-source-health.mjs',
  'ai-data-platform':'apps/web/lib/ql364-source-health.mjs',
  'rosevear-ai-hub':'server/src/rosevear_ai_hub/api/ql364_source_health.py'});
const heldChecks=Object.freeze(['owner_signer_receipt','approved_comms_audience',
  'approved_ai_data_audience','backup_snapshot','witnessed_isolated_restore',
  'rollback_authority']);
const negativeCheckNames=Object.freeze(['source_handler_method','child_tenant_denial',
  'unsigned_get_denial','private_data_exclusion']);
const holdFields=Object.freeze(['owner_issuer_verified','independent_witness_verified',
  'source_signer_enrolled','ql365d_signed_test_receipt_verified',
  'durable_one_use_nonce_verified','ai_data_audience_granted',
  'comms_audience_granted','master_connected','external_peer_probes_authorized',
  'cross_tenant_access_enabled','backup_snapshot_independently_verified',
  'isolated_restore_witnessed','rollback_approved_and_rehearsed',
  'persistent_publishers_enabled','customer_information_included']);

export function readPilotContract(){
  return JSON.parse(readFileSync(resolve(root,contractPath),'utf8'));
}

export function validatePilotContract(c=readPilotContract()){
  const errors=[];const check=(ok,code)=>{if(!ok)errors.push(code)};
  check(c?.schema==='devilndove.master-shell.cross-app-pilot.v1'&&c?.build===668&&
    c?.source_id==='devilndove'&&c?.source_role==='owned_business_shell'&&
    c?.repository==='RosevearCreations/devilndove-site'&&
    c?.scope==='ONE_SOURCE_OFFLINE_NEGATIVE_AND_READ_ONLY_PILOT','source_scope');
  check(c?.source_manifest==='.well-known/rosevear-integration-manifest.json'&&
    c?.original_source_handler==='functions/api/_lib/ql364-source-health.mjs',
    'original_manifest_handler');
  const planes=c?.master_planes;
  check(Array.isArray(planes)&&planes.length===2 &&
    planes.some(x=>x.id==='ai-data-platform'&&x.responsibility==='suite_intelligence_and_evidence')&&
    planes.some(x=>x.id==='rosevear-comms-hub'&&x.responsibility==='communications_and_incident_operations'),
    'master_planes');
  const sources=c?.sources;
  check(Array.isArray(sources)&&sources.length===6 &&
    new Set(sources.map(x=>x.id)).size===6 &&
    Object.keys(roles).every(id=>sources.some(x=>x.id===id&&x.role===roles[id]&&
      x.repository===expectedRepos[id]&&x.handler===expectedHandlers[id])),
    'six_source_identities');
  const names=c?.checks;
  const expected=[...negativeCheckNames,...heldChecks,'source_identity','manifest_revision',
    'external_peers_not_impersonated'];
  check(Array.isArray(names)&&names.length===13&&new Set(names).size===13&&
    expected.every(x=>names.includes(x)),'check_registry');
  for(const field of holdFields)check(c?.[field]===false,'unverified_'+field);
  return {ok:errors.length===0,errors};
}

export async function buildCrossAppPilot({contract=readPilotContract(),
  sourceReport=buildSourceReport()}={}){
  const policy=validatePilotContract(contract);
  if(!policy.ok)throw Error('PILOT_POLICY_DENIED:'+policy.errors.join(','));
  if(!validateSourceReport(sourceReport).ok ||
    sourceReport.status!=='HOLD_INDEPENDENT_SOURCE_AND_MASTER_APPROVAL'||
    !assertCommsBoundary().ok)throw Error('ORIGINAL_SOURCE_BOUNDARY_NOT_VERIFIED');
  const sourceUrl='https://devilndove.com'+QL364_PATH;
  const badMethod=evaluateShellRequest(new Request(sourceUrl,{method:'POST'}));
  const child=evaluateShellRequest(new Request(sourceUrl,{headers:{'x-child-id':'other-business'}}));
  const unsigned=await handleQl364SourceHealth({request:new Request(sourceUrl),
    sourceId:'devilndove',repository:'devilndove-site'});
  const unsignedBody=await unsigned.json();
  const badRecovery=recoveryDescriptor({details_json:JSON.stringify({
    public_url:'https://owner:password@devilndove.com/private?token=1'})});
  const probes={methodDenied:badMethod.status===405,childImpersonationDenied:child.status===403,
    unsignedGetHeld:unsigned.status===503&&unsignedBody.connected===false&&
      unsignedBody.customerDataAllowed===false&&unsignedBody.deviceActions===false,
    unsafeRecoveryUrlDenied:badRecovery.available===false,
    originalSourceNoOutboundTransport:sourceReport.events.messagePublishingEnabled===false};
  if(Object.values(probes).some(x=>x!==true))throw Error('NEGATIVE_ACCESS_GATE_FAILED');
  const discovered=contract.sources.map(item=>({sourceId:item.id,repository:item.repository,
    boundary:item.role,referenceHandler:item.handler,
    sourceCodeObservedHere:item.id==='devilndove',
    independentlyVerifiedLiveConnection:false,
    originalSignedReceiptVerified:false,
    externalPeerNetworkProbePerformed:false,
    status:'HOLD_NO_INDEPENDENT_FIELD_ACCEPTANCE'}));
  const acceptance=contract.checks.map(id=>({checkId:id,
    result:negativeCheckNames.includes(id)?'PASS_LOCAL_NEGATIVE_ONLY':
      id==='source_identity'?'PASS_LOCAL_REFERENCE_ONLY':
      id==='manifest_revision'?sourceReport.manifest.freshness==='STALE_REVISION'?
        'STALE_ORIGINAL_MANIFEST':'MATCHES_LOCAL_UNATTESTED':
      id==='external_peers_not_impersonated'?'PASS_NO_PEER_PROBES':
      'HOLD_ORIGINAL_OWNER_FIELD_PROOF'}));
  const result={schema:'devilndove.master-shell.cross-app-pilot-result.v1',
    sourceId:'devilndove',sourceRevision:sourceReport.sourceRevision,
    sourceRole:'owned_business_shell',scope:contract.scope,
    originalManifestFreshness:sourceReport.manifest.freshness,
    sources:discovered,checks:acceptance,negativeProbes:probes,
    recovery:{d1BackupReceipt:'UNKNOWN_NO_ORIGINAL_BACKUP_RECEIPT',
      r2BackupReceipt:'UNKNOWN_NO_ORIGINAL_BACKUP_RECEIPT',
      isolatedRestore:'HOLD_NO_INDEPENDENT_WITNESSED_RESTORE',
      rollback:'HOLD_NO_OWNER_APPROVED_REHEARSAL',
      recoveryProbeIsRestore:false,productionRestoreExecuted:false},
    authority:{ownerIssuerVerified:false,independentWitnessVerified:false,
      originalSourceSignerEnrolled:false,signedQl365dTestVerified:false,
      durableNonceVerified:false,aiDataAudienceGranted:false,
      commsAudienceGranted:false,masterConnected:false,
      crossTenantAccessEnabled:false,persistentPublishersEnabled:false},
    transport:{httpProviderCalls:0,peerNetworkCalls:0,externalWrites:0,
      customerDataIncluded:false,deviceCommandsEnabled:false},
    status:'HOLD_NO_ORIGINAL_CROSS_APP_ACCEPTANCE_OR_RECOVERY'};
  const verified=validatePilotResult(result,contract);
  if(!verified.ok)throw Error('PILOT_RESULT_INVALID:'+verified.errors.join(','));
  return result;
}

export function validatePilotResult(result,contract=readPilotContract()){
  const errors=[];const check=(ok,code)=>{if(!ok)errors.push(code)};
  check(validatePilotContract(contract).ok,'contract');
  check(result?.schema==='devilndove.master-shell.cross-app-pilot-result.v1'&&
    result?.sourceId==='devilndove'&&result?.sourceRole==='owned_business_shell'&&
    result?.scope==='ONE_SOURCE_OFFLINE_NEGATIVE_AND_READ_ONLY_PILOT'&&
    /^[a-f0-9]{40}$/.test(result?.sourceRevision??''),'source_identity');
  check(['STALE_REVISION','MATCHES_LOCAL_REVISION_UNATTESTED'].includes(
    result?.originalManifestFreshness),'manifest_truth');
  check(Array.isArray(result?.sources)&&result.sources.length===6&&
    contract.sources.every(s=>result.sources.some(x=>x.sourceId===s.id&&
      x.repository===s.repository&&x.boundary===s.role&&x.referenceHandler===s.handler&&
      x.sourceCodeObservedHere===(s.id==='devilndove')&&
      x.independentlyVerifiedLiveConnection===false&&
      x.originalSignedReceiptVerified===false&&x.externalPeerNetworkProbePerformed===false&&
      x.status==='HOLD_NO_INDEPENDENT_FIELD_ACCEPTANCE')),
    'unverified_six_sources');
  check(Array.isArray(result?.checks)&&result.checks.length===13&&
    contract.checks.every(id=>result.checks.some(x=>x.checkId===id&&
      (negativeCheckNames.includes(id)?x.result==='PASS_LOCAL_NEGATIVE_ONLY':
        id==='source_identity'?x.result==='PASS_LOCAL_REFERENCE_ONLY':
        id==='manifest_revision'?x.result===(result.originalManifestFreshness==='STALE_REVISION'?
          'STALE_ORIGINAL_MANIFEST':'MATCHES_LOCAL_UNATTESTED'):
        id==='external_peers_not_impersonated'?x.result==='PASS_NO_PEER_PROBES':
        x.result==='HOLD_ORIGINAL_OWNER_FIELD_PROOF'))),'acceptance_matrix');
  const expectedProbes=['methodDenied','childImpersonationDenied','unsignedGetHeld',
    'unsafeRecoveryUrlDenied','originalSourceNoOutboundTransport'];
  check(Object.keys(result?.negativeProbes||{}).length===expectedProbes.length&&
    expectedProbes.every(name=>result?.negativeProbes?.[name]===true),'negative_probes');
  const recovery=result?.recovery;
  check(recovery?.d1BackupReceipt==='UNKNOWN_NO_ORIGINAL_BACKUP_RECEIPT'&&
    recovery?.r2BackupReceipt==='UNKNOWN_NO_ORIGINAL_BACKUP_RECEIPT'&&
    recovery?.isolatedRestore==='HOLD_NO_INDEPENDENT_WITNESSED_RESTORE'&&
    recovery?.rollback==='HOLD_NO_OWNER_APPROVED_REHEARSAL'&&
    recovery?.recoveryProbeIsRestore===false&&recovery?.productionRestoreExecuted===false,
    'recovery_holds');
  check(Object.keys(result?.authority||{}).length===10&&
    Object.values(result?.authority||{}).every(x=>x===false),'owner_authority');
  check(result?.transport?.httpProviderCalls===0&&result?.transport?.peerNetworkCalls===0&&
    result?.transport?.externalWrites===0&&result?.transport?.customerDataIncluded===false&&
    result?.transport?.deviceCommandsEnabled===false,'no_external_transport');
  check(result?.status==='HOLD_NO_ORIGINAL_CROSS_APP_ACCEPTANCE_OR_RECOVERY','final_hold');
  return {ok:errors.length===0,errors};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const report=await buildCrossAppPilot();
    if(process.argv.includes('--json'))process.stdout.write(JSON.stringify(report,null,2)+'\n');
    else process.stdout.write(JSON.stringify({source:report.sourceId,
      codeRevision:report.sourceRevision,manifest:report.originalManifestFreshness,
      listedSources:report.sources.length,negativeChecks:report.negativeProbes,
      externalPeersProbed:0,signedReceipt:'HOLD',restored:false,status:report.status},null,2)+'\n');
  }catch(error){process.stderr.write('BUILD_668_PILOT_HOLD: '+error.message+'\n');process.exitCode=1;}
}
