import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceVerification595} from '../public/js/admin-channel-source-verification-595.mjs';
import {FORMAT_596,workboardPin596,workboardCandidate596,evidenceWorkboard596,
  filterWorkboard596,unsignedOwnerPacket596} from
  '../public/js/admin-channel-review-workboard-596.mjs';
import {fixture595} from './release467_build595_source_verification.test.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {exact594,upstream594,providerRow,ownerRow,asOf}=fixture595;
const sourceArgs=[exact594,upstream594,[providerRow,ownerRow]];
const exact595=sourceVerification595(...sourceArgs,asOf);
const provider=exact595.cases.find(c=>!c.owner_trial_decision_pending);
const owner=exact595.cases.find(c=>c.owner_trial_decision_pending);
const followup=c=>({case_pin:workboardPin596(c),
  next_action:c.owner_trial_decision_pending?'REQUEST_SIGNED_EXACT_OWNER_SCOPE':
    'RECONCILE_CUSTODY_HANDOFF_RECEIPT',
  disposition:c.owner_trial_decision_pending?'OWNER_DECISION_PENDING':
    'AWAITING_INDEPENDENT_EVIDENCE',
  independent_reviewer_ref:c.latest_verification?.independent_reviewer_ref||'',
  independent_witness_ref:c.latest_verification?.independent_witness_ref||'',
  reason:'External original issuer and signed owner permission still require independent review.',
  recorded_at:'2026-11-03T17:00:00Z',next_review_at:'2026-11-04T17:30:00Z'});
const providerFollowup=followup(provider),ownerFollowup=followup(owner);

test('prioritized workboard keeps overdue owner and source cases open with zero external actions',()=>{
  const p=evidenceWorkboard596(exact595,sourceArgs,[providerFollowup,ownerFollowup],
    '2026-11-13T17:00:00Z');
  assert.equal(p.format,FORMAT_596);
  assert.equal(p.open_review_cases,2);
  assert.equal(p.provider_review_cases,1);
  assert.equal(p.owner_signoff_packets_required,1);
  assert.equal(p.severely_overdue_owner_cases,1);
  assert.ok(p.cases.every(c=>c.followups.length===1&&c.owner_trial_authorized===false));
  assert.ok(p.cases.every(c=>c.open_evidence_exceptions.length>0));
  assert.ok(p.cases.every((c,i,a)=>i===0||a[i-1].priority_rank<=c.priority_rank));
  assert.equal(p.authenticated_provider_sources,0);assert.equal(p.verified_owner_signatures,0);
  assert.equal(p.approved_trials,0);assert.equal(p.closed_exceptions,0);
  assert.equal(p.provider_reads,0);assert.equal(p.provider_writes,0);assert.equal(p.d1_operations,0);
});
test('cross-case digest reuse stays prominent even when typed references otherwise match',()=>{
  const repeatedOwner={...ownerRow,original_file_sha256:providerRow.original_file_sha256};
  const source=[exact594,upstream594,[providerRow,repeatedOwner]];
  const exact=sourceVerification595(...source,asOf);
  const p=evidenceWorkboard596(exact,source,[],asOf);
  assert.equal(p.duplicate_digest_cases,2);
  assert.ok(p.cases.every(c=>c.duplicate_document_digest));
  assert.ok(p.cases.every(c=>c.open_evidence_exceptions.includes(
    'CROSS_CASE_PROVIDER_DOCUMENT_DIGEST_UNRESOLVED')));
  assert.ok(p.cases.every(c=>c.priority==='DOCUMENT_DIGEST_REUSE_CONFLICT'));
  assert.equal(filterWorkboard596(p,'DUPLICATE_DIGEST').length,2);
});
test('separate reviewer and witness assignment conflicts cannot resolve source exceptions',()=>{
  const conflicting={...providerFollowup,independent_reviewer_ref:'same-party',
    independent_witness_ref:'same-party'};
  const p=evidenceWorkboard596(exact595,sourceArgs,[conflicting],asOf);
  const c=p.cases.find(x=>!x.owner_trial_decision_pending);
  assert.ok(c.latest_followup.assignment_conflicts.includes('REVIEWER_AND_WITNESS_NOT_INDEPENDENT'));
  assert.equal(c.latest_followup.independently_authenticated,false);
  assert.equal(c.latest_followup.exception_closed,false);
  assert.equal(c.priority,'SOURCE_OR_CUSTODY_CONFLICT');
});
test('unsigned owner packet is exact-scope, immutable-source and never an approval',()=>{
  const p=evidenceWorkboard596(exact595,sourceArgs,[ownerFollowup],asOf);
  const c=p.cases.find(x=>x.owner_trial_decision_pending);
  const packet=unsignedOwnerPacket596(p,c.case_pin);
  assert.equal(packet.exact_account,c.account_id);
  assert.equal(packet.exact_product,c.product_ref);
  assert.equal(packet.exact_action,c.action);
  assert.equal(packet.source_pin,c.case_pin);
  assert.equal(packet.signed_owner_decision_received,false);
  assert.equal(packet.owner_signature_authenticated,false);
  assert.equal(packet.trial_approved,false);
  assert.equal(packet.provider_read_or_write_authorized,false);
  assert.ok(packet.unresolved_exceptions.length>0);
  assert.throws(()=>unsignedOwnerPacket596(p,p.cases.find(x=>!x.owner_trial_decision_pending).case_pin));
  assert.throws(()=>unsignedOwnerPacket596(p,'stale-source'));
});
test('stale/forged source, wrong-scope tasks, secret or approval claims and bad filters fail closed',()=>{
  const stale=evidenceWorkboard596(exact595,sourceArgs,[{...providerFollowup,
    case_pin:providerFollowup.case_pin+'changed'}],asOf);
  assert.equal(stale.stale_workboard_candidates.length,1);
  assert.throws(()=>evidenceWorkboard596({...exact595,source_pin:'forged'},sourceArgs,[],asOf));
  assert.throws(()=>evidenceWorkboard596(exact595,sourceArgs,[{...providerFollowup,
    next_action:'REQUEST_SIGNED_EXACT_OWNER_SCOPE'}],asOf));
  assert.throws(()=>workboardCandidate596({...providerFollowup,owner_trial_authorized:true}));
  assert.throws(()=>workboardCandidate596({...providerFollowup,reason:'Bearer hidden'}));
  assert.throws(()=>workboardCandidate596({...providerFollowup,next_action:'POST_TO_META'}));
  assert.throws(()=>evidenceWorkboard596(exact595,sourceArgs,Array(101).fill(providerFollowup),asOf));
  const p=evidenceWorkboard596(exact595,sourceArgs,[],asOf);
  assert.equal(filterWorkboard596(p,'OWNER').length,1);
  assert.equal(filterWorkboard596(p,'PROVIDER').length,1);
  assert.equal(filterWorkboard596(p,'OWNER',owner.product_ref).length,1);
  assert.throws(()=>filterWorkboard596(p,'APPROVED'));
  assert.throws(()=>filterWorkboard596(p,'ALL','x'.repeat(121)));
});
test('Build 596 Admin workboard, owner packet, CI and immutable source marker stay review-only',()=>{
  const html=read('admin/channel-trials/index.html');
  for(const id of ['dd596Refresh','dd596Filter','dd596Search','dd596Rows','dd596Case',
    'dd596Action','dd596Disposition','dd596Reviewer','dd596Witness','dd596Due',
    'dd596Reason','dd596Ack','dd596Save','dd596Copy','dd596State','dd596Output',
    'dd596Prepare','dd596CopyPacket','dd596Packet'])assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/Devil n Dove • Build 596/);
  assert.match(html,/admin-channel-review-workboard-596\.mjs\?v=596/);
  const js=read('public/js/admin-channel-review-workboard-596.mjs');
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(js,/admin-channel-source-verification-595\.mjs\?v=595/);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build596_review_workboard\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":596/);
});
