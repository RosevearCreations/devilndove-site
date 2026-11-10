// Build 669: deterministic original-evidence follow-up, not a connection,
// signer enrollment, owner decision, backup probe or production restore.
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildSourceReport,validateSourceReport} from './release467_build666_ai_data_source_report.mjs';
import {buildCrossAppPilot,validatePilotResult} from './release467_build668_cross_app_pilot.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const contractPath='docs/operations/RELEASE_467_BUILD_669_OWNER_ACCEPTANCE_CASEBOOK_CONTRACT.json';
const sequence=['DN669-01','DN669-02','DN669-06','DN669-03','DN669-04','DN669-05','DN669-07'];
const roles={
  'DN669-01':'devilndove_source_owner',
  'DN669-02':'independent_evidence_reviewer',
  'DN669-06':'independent_recovery_reviewer',
  'DN669-03':'source_and_master_owner',
  'DN669-04':'source_and_ai_data_owner',
  'DN669-05':'source_and_comms_owner',
  'DN669-07':'independent_evidence_reviewer'
};
const prerequisites={
  'DN669-01':[],
  'DN669-02':[],
  'DN669-06':[],
  'DN669-03':['DN669-01','DN669-02'],
  'DN669-04':['DN669-03'],
  'DN669-05':['DN669-03'],
  'DN669-07':['DN669-03','DN669-04','DN669-05','DN669-06']
};
const originalProofs={
  'DN669-01':['protected_main_commit','deployed_origin_and_manifest_digest','original_handler_digest'],
  'DN669-02':['existing_source_owner_issuer_receipt','independent_witness_receipt','original_public_key_fingerprints'],
  'DN669-06':['original_d1_backup_receipt','original_r2_backup_receipt','witnessed_isolated_restore_record','owner_approved_rollback_plan'],
  'DN669-03':['original_one_source_signed_test_receipt','approved_exact_source_audience','durable_one_use_nonce_result'],
  'DN669-04':['independently_approved_ai_data_audience','redacted_source_health_contract','owner_review_of_data_scope'],
  'DN669-05':['independently_approved_comms_audience','source_consent_for_event_family','reviewed_incident_route_receipt'],
  'DN669-07':['signed_source_and_master_acceptance','real_tenant_and_device_negative_results','fresh_original_recovery_evidence']
};
const forbiddenModeFields=['allow_external_peer_probes','allow_provider_or_master_publication',
  'allow_signer_or_receiver_enrollment','allow_signed_receipt_fabrication',
  'allow_customer_or_tenant_records','allow_restore_or_rollback',
  'allow_mutation_of_original_source'];
const sourceRefs=[
  'docs/operations/RELEASE_467_BUILD_655_SOURCE_READINESS_REGISTER.json',
  'docs/operations/RELEASE_467_BUILD_666_AI_DATA_SOURCE_REPORT_CONTRACT.json',
  'docs/operations/RELEASE_467_BUILD_667_COMMS_HANDOFF_PREVIEW_CONTRACT.json',
  'docs/operations/RELEASE_467_BUILD_668_MASTER_SHELL_PILOT_CONTRACT.json'
];
const sameList=(value,expected)=>Array.isArray(value)&&value.length===expected.length&&
  expected.every((x,i)=>value[i]===x);
const caseState=(id,freshness)=>{
  if(id==='DN669-01')return freshness==='STALE_REVISION'?
    'STALE_LOCAL_MANIFEST':'HOLD_UNATTESTED_LOCAL_MATCH';
  return prerequisites[id].length===0?'HOLD_ORIGINAL_EVIDENCE':
    'BLOCKED_ON_ORIGINAL_EVIDENCE';
};

export function readCasebookContract(){
  return JSON.parse(readFileSync(resolve(root,contractPath),'utf8'));
}

export function validateCasebookContract(contract=readCasebookContract()){
  const errors=[];const check=(ok,reason)=>{if(!ok)errors.push(reason)};
  check(contract?.schema==='devilndove.master-shell.owner-acceptance-casebook.v1'&&
    contract?.build===669&&contract?.source_id==='devilndove'&&
    contract?.source_role==='owned_business_shell'&&
    contract?.repository==='RosevearCreations/devilndove-site'&&
    contract?.mode==='SOURCE_LOCAL_EVIDENCE_TRIAGE_ONLY','source_scope');
  check(sameList(contract?.source_of_truth,sourceRefs)&&
    sameList(contract?.master_planes,['ai-data-platform','rosevear-comms-hub']),
    'original_evidence_and_master_planes');
  for(const flag of forbiddenModeFields)
    check(contract?.[flag]===false,'unsafe_permission_'+flag);
  const cases=contract?.cases;
  check(Array.isArray(cases)&&sameList(cases.map(x=>x.id),sequence),'seven_unique_cases');
  if(Array.isArray(cases)){
    for(const item of cases){
      const id=item?.id;const rank=sequence.indexOf(id);
      check(rank>=0&&item?.owner_role===roles[id]&&
        item?.priority===(rank<3?'P0':rank<6?'P1':'P2')&&
        sameList(item?.depends_on,prerequisites[id]??[])&&
        sameList(item?.evidence_needed,originalProofs[id]??[])&&
        typeof item?.title==='string'&&item.title.length>=8&&item.title.length<=100&&
        typeof item?.next_owner_step==='string'&&
        item.next_owner_step.length>=30&&item.next_owner_step.length<=300&&
        !/[\r\n`]|https?:\/\//i.test(item.next_owner_step),
        'case_contract_'+String(id));
    }
  }
  return {ok:errors.length===0,errors};
}

export async function buildAcceptanceCasebook({contract=readCasebookContract(),
  sourceReport=buildSourceReport(),pilot=null}={}){
  const valid=validateCasebookContract(contract);
  if(!valid.ok)throw Error('OWNER_CASEBOOK_CONTRACT_DENIED:'+valid.errors.join(','));
  if(!validateSourceReport(sourceReport).ok||
    sourceReport.status!=='HOLD_INDEPENDENT_SOURCE_AND_MASTER_APPROVAL')
    throw Error('SOURCE_REPORT_NOT_ORIGINAL_HOLD');
  const sourcePilot=pilot??await buildCrossAppPilot({sourceReport});
  if(!validatePilotResult(sourcePilot).ok||
    sourcePilot.sourceRevision!==sourceReport.sourceRevision||
    sourcePilot.originalManifestFreshness!==sourceReport.manifest.freshness||
    sourcePilot.status!=='HOLD_NO_ORIGINAL_CROSS_APP_ACCEPTANCE_OR_RECOVERY')
    throw Error('SIX_SOURCE_PILOT_NOT_ORIGINAL_HOLD');
  const cases=contract.cases.map(item=>({
    caseId:item.id,title:item.title,priority:item.priority,ownerRole:item.owner_role,
    prerequisites:[...item.depends_on],evidenceRequired:[...item.evidence_needed],
    originalEvidenceReceipts:[],originalOwnerDecision:'HOLD_UNVERIFIED',
    status:caseState(item.id,sourceReport.manifest.freshness),
    nextOwnerStep:item.next_owner_step,
    onlyExistingEvidenceReview:true,networkOperationAuthorized:false
  }));
  const orderedEvidence=[...new Set(cases.flatMap(x=>x.evidenceRequired))];
  const result={
    schema:'devilndove.master-shell.owner-acceptance-casebook-result.v1',
    sourceId:'devilndove',sourceRole:'owned_business_shell',
    sourceRevision:sourceReport.sourceRevision,
    localEvidenceFingerprint:sourceReport.localEvidenceFingerprint,
    sourceManifest:sourceReport.manifest.freshness,
    masterPlanes:{aiDataPlatform:'HOLD_NO_INDEPENDENT_SOURCE_RECEIPT',
      rosevearCommsHub:'HOLD_NO_APPROVED_SOURCE_AUDIENCE'},
    casebook:cases,
    followUpQueue:{orderedCaseIds:[...sequence],openCases:7,reviewableExistingEvidence:3,
      blockedOnPrerequisites:4,independentlyClosedCases:0,
      deduplicatedEvidenceRequirements:orderedEvidence},
    recovery:{d1OriginalReceipt:'HOLD',r2OriginalReceipt:'HOLD',
      witnessedIsolatedRestore:'HOLD',ownerRollbackApproval:'HOLD',
      productionRestorePerformed:false},
    connection:{originalQl365dReceiptAccepted:false,masterConnected:false,
      externalPeersConnected:0,persistentEventsEnabled:false},
    transport:{externalReads:0,externalWrites:0,customerDataIncluded:false,
      otherTenantDataIncluded:false,credentialsIncluded:false},
    status:'HOLD_OWNER_ACCEPTANCE_AND_INDEPENDENT_RECOVERY'
  };
  const checked=validateAcceptanceCasebook(result,contract);
  if(!checked.ok)throw Error('CASEBOOK_RESULT_INVALID:'+checked.errors.join(','));
  return result;
}

export function validateAcceptanceCasebook(result,contract=readCasebookContract()){
  const errors=[];const check=(ok,reason)=>{if(!ok)errors.push(reason)};
  check(validateCasebookContract(contract).ok,'contract');
  check(result?.schema==='devilndove.master-shell.owner-acceptance-casebook-result.v1'&&
    result?.sourceId==='devilndove'&&result?.sourceRole==='owned_business_shell'&&
    /^[a-f0-9]{40}$/.test(result?.sourceRevision??'')&&
    /^[a-f0-9]{64}$/.test(result?.localEvidenceFingerprint??'')&&
    ['STALE_REVISION','MATCHES_LOCAL_REVISION_UNATTESTED'].includes(result?.sourceManifest),
    'unattested_local_provenance');
  check(result?.masterPlanes?.aiDataPlatform==='HOLD_NO_INDEPENDENT_SOURCE_RECEIPT'&&
    result?.masterPlanes?.rosevearCommsHub==='HOLD_NO_APPROVED_SOURCE_AUDIENCE',
    'master_authority_hold');
  check(Array.isArray(result?.casebook)&&result.casebook.length===sequence.length&&
    result.casebook.every((item,i)=>item?.caseId===sequence[i]&&
      item?.title===contract.cases[i].title&&item?.priority===contract.cases[i].priority&&
      item?.ownerRole===roles[item.caseId]&&
      sameList(item?.prerequisites,prerequisites[item.caseId])&&
      sameList(item?.evidenceRequired,originalProofs[item.caseId])&&
      Array.isArray(item?.originalEvidenceReceipts)&&item.originalEvidenceReceipts.length===0&&
      item?.originalOwnerDecision==='HOLD_UNVERIFIED'&&
      item?.status===caseState(item.caseId,result.sourceManifest)&&
      item?.nextOwnerStep===contract.cases[i].next_owner_step&&
      item?.onlyExistingEvidenceReview===true&&item?.networkOperationAuthorized===false),
    'seven_unverified_case_decisions');
  const q=result?.followUpQueue;
  const requirements=[...new Set(sequence.flatMap(id=>originalProofs[id]))];
  check(sameList(q?.orderedCaseIds,sequence)&&q?.openCases===7&&
    q?.reviewableExistingEvidence===3&&q?.blockedOnPrerequisites===4&&
    q?.independentlyClosedCases===0&&
    sameList(q?.deduplicatedEvidenceRequirements,requirements),'unverified_followup_queue');
  const rec=result?.recovery;
  check(rec?.d1OriginalReceipt==='HOLD'&&rec?.r2OriginalReceipt==='HOLD'&&
    rec?.witnessedIsolatedRestore==='HOLD'&&rec?.ownerRollbackApproval==='HOLD'&&
    rec?.productionRestorePerformed===false,'original_recovery_hold');
  const c=result?.connection;
  check(c?.originalQl365dReceiptAccepted===false&&c?.masterConnected===false&&
    c?.externalPeersConnected===0&&c?.persistentEventsEnabled===false,'connection_hold');
  const t=result?.transport;
  check(t?.externalReads===0&&t?.externalWrites===0&&
    t?.customerDataIncluded===false&&t?.otherTenantDataIncluded===false&&
    t?.credentialsIncluded===false,'offline_private_boundary');
  check(result?.status==='HOLD_OWNER_ACCEPTANCE_AND_INDEPENDENT_RECOVERY','overall_hold');
  return {ok:errors.length===0,errors};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const book=await buildAcceptanceCasebook();
    if(process.argv.includes('--json'))process.stdout.write(JSON.stringify(book,null,2)+'\n');
    else process.stdout.write(JSON.stringify({source:book.sourceId,
      revision:book.sourceRevision,manifest:book.sourceManifest,
      open:book.followUpQueue.openCases,
      evidenceReviewCases:book.followUpQueue.reviewableExistingEvidence,
      blocked:book.followUpQueue.blockedOnPrerequisites,
      independentlyClosed:book.followUpQueue.independentlyClosedCases,
      masterConnected:book.connection.masterConnected,
      productionRestorePerformed:book.recovery.productionRestorePerformed,
      status:book.status},null,2)+'\n');
  }catch(error){process.stderr.write('BUILD_669_CASEBOOK_HOLD: '+error.message+'\n');process.exitCode=1;}
}
