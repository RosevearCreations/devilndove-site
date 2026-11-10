import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSourceReport} from './release467_build666_ai_data_source_report.mjs';
import {buildCrossAppPilot} from './release467_build668_cross_app_pilot.mjs';
import {readCasebookContract,validateCasebookContract,
  buildAcceptanceCasebook,validateAcceptanceCasebook}
  from './release467_build669_owner_acceptance_casebook.mjs';

const revision='f'.repeat(40);
const report=buildSourceReport({revision});
const make=()=>buildAcceptanceCasebook({sourceReport:report});

test('seven exact owner-owned cases are ordered and isolated to Devil n Dove',()=>{
  const c=readCasebookContract();
  assert.deepEqual(validateCasebookContract(c),{ok:true,errors:[]});
  assert.deepEqual(c.cases.map(x=>x.id),[
    'DN669-01','DN669-02','DN669-06','DN669-03','DN669-04','DN669-05','DN669-07']);
  assert.equal(c.source_id,'devilndove');
});

test('owner review queue is reproducible and does not claim original accepted proof',async()=>{
  const c=await make();
  assert.equal(c.casebook.length,7);
  assert.equal(c.followUpQueue.reviewableExistingEvidence,3);
  assert.equal(c.followUpQueue.blockedOnPrerequisites,4);
  assert.ok(c.casebook.every(x=>x.originalEvidenceReceipts.length===0));
  assert.equal(validateAcceptanceCasebook(c).ok,true);
});

test('original stale source manifest remains STALE and blocks acceptance',async()=>{
  const c=await make();
  assert.equal(c.sourceManifest,'STALE_REVISION');
  assert.equal(c.casebook[0].status,'STALE_LOCAL_MANIFEST');
  assert.equal(c.status,'HOLD_OWNER_ACCEPTANCE_AND_INDEPENDENT_RECOVERY');
});

test('a locally matching manifest cannot become independently accepted',async()=>{
  const base=buildSourceReport();
  const manifestRevision=base.manifest.declaredRevision;
  const same=buildSourceReport({revision:manifestRevision});
  const c=await buildAcceptanceCasebook({sourceReport:same});
  assert.equal(c.casebook[0].status,'HOLD_UNATTESTED_LOCAL_MATCH');
  assert.equal(c.followUpQueue.independentlyClosedCases,0);
  assert.equal(c.connection.originalQl365dReceiptAccepted,false);
});

test('source and master authority cannot be enabled by a template change',()=>{
  const c=structuredClone(readCasebookContract());
  for(const flag of ['allow_provider_or_master_publication','allow_signer_or_receiver_enrollment',
    'allow_signed_receipt_fabrication','allow_restore_or_rollback',
    'allow_external_peer_probes']){
    const changed=structuredClone(c);changed[flag]=true;
    assert.ok(validateCasebookContract(changed).errors.includes('unsafe_permission_'+flag),flag);
  }
});

test('casebook rejects duplicate case IDs and rank manipulation',()=>{
  const c=structuredClone(readCasebookContract());
  c.cases[1].id='DN669-01';
  assert.ok(validateCasebookContract(c).errors.includes('seven_unique_cases'));
  c.cases[1].id='DN669-02';c.cases[1].priority='P2';
  assert.ok(validateCasebookContract(c).errors.includes('case_contract_DN669-02'));
});

test('dependency and owner-role changes cannot bypass independent reviewers',()=>{
  const c=structuredClone(readCasebookContract());
  c.cases[3].depends_on=[];
  assert.ok(validateCasebookContract(c).errors.includes('case_contract_DN669-03'));
  c.cases[3].depends_on=['DN669-01','DN669-02'];
  c.cases[2].owner_role='devilndove_source_owner';
  assert.ok(validateCasebookContract(c).errors.includes('case_contract_DN669-06'));
});

test('AI Data monitoring and Comms notification consent remain distinct cases',async()=>{
  const c=await make();
  const ai=c.casebook.find(x=>x.caseId==='DN669-04');
  const comms=c.casebook.find(x=>x.caseId==='DN669-05');
  assert.notDeepEqual(ai.evidenceRequired,comms.evidenceRequired);
  assert.equal(ai.status,'BLOCKED_ON_ORIGINAL_EVIDENCE');
  assert.equal(comms.status,'BLOCKED_ON_ORIGINAL_EVIDENCE');
  assert.equal(c.masterPlanes.rosevearCommsHub,'HOLD_NO_APPROVED_SOURCE_AUDIENCE');
});

test('original D1/R2 backup and witnessed restore cannot be replaced with code PASS',async()=>{
  const c=await make();c.recovery.witnessedIsolatedRestore='PASS';
  assert.ok(validateAcceptanceCasebook(c).errors.includes('original_recovery_hold'));
  c.recovery.witnessedIsolatedRestore='HOLD';c.recovery.productionRestorePerformed=true;
  assert.ok(validateAcceptanceCasebook(c).errors.includes('original_recovery_hold'));
});

test('forged signed receipt and master connection cannot close any case',async()=>{
  const c=await make();c.connection.originalQl365dReceiptAccepted=true;
  assert.ok(validateAcceptanceCasebook(c).errors.includes('connection_hold'));
  c.connection.originalQl365dReceiptAccepted=false;
  c.casebook[0].originalOwnerDecision='ACCEPTED';
  assert.ok(validateAcceptanceCasebook(c).errors.includes('seven_unverified_case_decisions'));
});

test('private/customer/tenant data and network operations remain excluded',async()=>{
  const c=await make();
  assert.equal(c.transport.customerDataIncluded,false);
  assert.equal(c.transport.otherTenantDataIncluded,false);
  assert.equal(c.transport.credentialsIncluded,false);
  assert.equal(c.transport.externalReads,0);
  c.casebook[0].networkOperationAuthorized=true;
  assert.ok(validateAcceptanceCasebook(c).errors.includes('seven_unverified_case_decisions'));
});

test('casebook rejects false completion counts and duplicated follow-up evidence',async()=>{
  const c=await make();
  c.followUpQueue.independentlyClosedCases=1;
  assert.ok(validateAcceptanceCasebook(c).errors.includes('unverified_followup_queue'));
  c.followUpQueue.independentlyClosedCases=0;
  c.followUpQueue.deduplicatedEvidenceRequirements.push('original_d1_backup_receipt');
  assert.ok(validateAcceptanceCasebook(c).errors.includes('unverified_followup_queue'));
});

test('pilot source revision mismatch stops a proposed owner acceptance handoff',async()=>{
  const different=buildSourceReport({revision:'e'.repeat(40)});
  const oldPilot=await buildCrossAppPilot({sourceReport:different});
  await assert.rejects(()=>buildAcceptanceCasebook({sourceReport:report,pilot:oldPilot}),
    /SIX_SOURCE_PILOT_NOT_ORIGINAL_HOLD/);
});

test('malformed or command-style owner instructions cannot enter review queue',()=>{
  const c=structuredClone(readCasebookContract());
  c.cases[0].next_owner_step='Run `curl https://example.test` and approve connection now.';
  assert.ok(validateCasebookContract(c).errors.includes('case_contract_DN669-01'));
});
