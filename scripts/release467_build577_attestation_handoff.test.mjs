import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makePacket569} from '../public/js/admin-device-acceptance-569.mjs?v=577';
import {retestPacket571} from '../public/js/admin-device-retest-571.mjs?v=577';
import {reviewNotesPacket572,acceptancePacket572} from '../public/js/admin-device-evidence-572.mjs?v=577';
import {dispositionPacket573,intakePacket573} from '../public/js/admin-device-intake-573.mjs?v=577';
import {readinessPacket574} from '../public/js/admin-device-readiness-574.mjs?v=577';
import {witnessDraftPacket575,witnessPacket575} from '../public/js/admin-device-witness-575.mjs?v=577';
import {followupPacket576,provenancePacket576,sourcePin576} from '../public/js/admin-device-provenance-576.mjs?v=577';
import {attestationPin577,exceptionPacket577,reviewAttestation577,ownerHandoffPacket577,
  validateOwnerHandoff577,ownerHandoffReadback577,ATTESTATION_FORMAT_577,
  HANDOFF_FORMAT_577} from '../public/js/admin-device-attestation-577.mjs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const original={device:'phone',check:'dock',status:'needs-correction',note:'Owner noticed Search overlapping the dock on the phone.',observed_at:'2026-11-02T04:00:00Z'};
const retest={device:'phone',check:'dock',source_observed_at:original.observed_at,source_note:original.note,
  result:'appears-fixed',detail:'The same phone was checked after the source change; Search clears the dock.',retested_at:'2026-11-02T05:00:00Z'};
const reference={device:'phone',check:'dock',source_observed_at:original.observed_at,source_note:original.note,
  retest_result:retest.result,retest_detail:retest.detail,retested_at:retest.retested_at,
  reference:'Revision abc123 noted by reporter',review_note:'Original source and retest were compared manually without external authentication.',compared_at:'2026-11-02T06:00:00Z'};
const disposition={device:'phone',check:'dock',source_observed_at:original.observed_at,source_note:original.note,
  retest_result:retest.result,retest_detail:retest.detail,retested_at:retest.retested_at,
  source_reference:reference.reference,disposition:'REQUEST_INDEPENDENT_PROOF',
  review_note:'Request independent review of source and exact phone retest.',reviewed_at:'2026-11-02T07:00:00Z'};
const witness={device:'phone',check:'dock',source_observed_at:original.observed_at,source_note:original.note,
  retest_result:retest.result,retest_detail:retest.detail,retested_at:retest.retested_at,
  source_reference:reference.reference,reviewer_reference:'External reviewer label, unauthenticated',
  witness_reference:'Independent reviewer document pending signature',outcome:'SOURCE_MATCH_CLAIMED',
  review_note:'Manual comparison only; no cryptographic or reviewer authentication performed.',reviewed_at:'2026-11-02T08:00:00Z'};
const source=(originals=[original],retests=[retest],notes=[reference],dispositions=[disposition],witnesses=[witness])=>{
  const evidence=acceptancePacket572(makePacket569(originals),retestPacket571(retests),reviewNotesPacket572(notes),'2026-11-02T09:00:00Z');
  const intake=intakePacket573(evidence,dispositionPacket573(dispositions),'2026-11-02T09:05:00Z');
  const witnessSource=witnessPacket575(readinessPacket574(intake,'2026-11-02T09:10:00Z'),witnessDraftPacket575(witnesses),'2026-11-02T09:20:00Z');
  const row=witnessSource.review.cases[0];
  const followup=row?followupPacket576([{device:'phone',check:'dock',source_pin:sourcePin576(row),
    next_action:'REQUEST_AUTHENTICATED_WITNESS',request_note:'Request external proof for one exact phone retest and source audit.',
    authentication_method:'SOURCE_CONTROL_AUDIT',proof_locator:'External source ticket 577',
    reviewer_independence_basis:'A different source reviewer will examine the change outside this application.',
    owner_device_receipt_locator:'Original phone test log 577',recorded_at:'2026-11-02T09:25:00Z'}]):followupPacket576([]);
  return provenancePacket576(witnessSource,followup,'2026-11-02T09:30:00Z');
};
const request=(packet=source())=>({device:'phone',check:'dock',source_pin:attestationPin577(packet.review.cases[0]),
  disposition:'REQUEST_SIGNATURE_CHAIN_CHECK',review_request:'Have an independent reviewer inspect the signed source-control attestation and exact same-phone receipt.',
  external_attestation_locator:'External audit signed report expected at ticket 577',
  reviewer_identity_locator:'Independent reviewer registry ticket 577',
  same_device_receipt_locator:'Real phone retest receipt 577',recorded_at:'2026-11-02T10:00:00Z'});

test('No real owner observations means 27 unreviewed checks and no authenticated attestation',()=>{
  const result=reviewAttestation577(source([],[],[],[],[]),exceptionPacket577([]));
  assert.equal(result.counts.unreviewed_device_checks,27);
  assert.equal(result.counts.open_source_exceptions,0);
  assert.equal(result.counts.authenticated_attestations,0);
  assert.equal(result.counts.independently_verified_closures,0);
  assert.equal(result.owner_signoff,'PENDING');
  assert.equal(result.owner_decision_ready,false);
});
test('A matching unverified witness with authentication plan still has a missing attestation review request',()=>{
  const result=reviewAttestation577(source(),exceptionPacket577([]));
  assert.equal(result.cases[0].attestation_status,'ATTESTATION_REVIEW_REQUEST_MISSING');
  assert.equal(result.counts.external_attestation_requests_prepared,0);
  assert.equal(result.cases[0].exception_closed,false);
});
test('Full external review references are only pending verification and never acceptance',()=>{
  const packet=source(),result=reviewAttestation577(packet,exceptionPacket577([request(packet)]));
  assert.equal(result.cases[0].attestation_status,'EXTERNAL_ATTESTATION_CHECK_REQUESTED_NOT_VERIFIED');
  assert.equal(result.counts.external_attestation_requests_prepared,1);
  assert.equal(result.counts.authenticated_attestations,0);
  assert.equal(result.owner_decision_ready,false);
  assert.match(ownerHandoffReadback577(result),/Owner decision: NOT RECORDED; sign-off: PENDING/);
});
test('An incomplete independent review reference never becomes authenticated evidence',()=>{
  const packet=source(),partial={...request(packet),reviewer_identity_locator:''};
  const result=reviewAttestation577(packet,exceptionPacket577([partial]));
  assert.equal(result.cases[0].attestation_status,'ATTESTATION_SOURCE_LOCATORS_INCOMPLETE');
  assert.equal(result.counts.external_attestation_requests_prepared,0);
});
test('Changing the original witness or authentication plan makes old attestation request STALE',()=>{
  const first=source(),old=request(first),changed=source([original],[retest],[reference],[disposition],
    [{...witness,review_note:'A different manually entered comparison; no independent evidence.'}]);
  const result=reviewAttestation577(changed,exceptionPacket577([old]));
  assert.equal(result.counts.stale_exception_requests,1);
  assert.equal(result.cases[0].request,null);
  assert.equal(result.cases[0].attestation_status,'ATTESTATION_REVIEW_REQUEST_MISSING');
  assert.match(ownerHandoffReadback577(result),/STALE ATTESTATION REQUEST/);
});
test('Contradictory witness or a missing actual-device receipt cannot be closed by a request',()=>{
  const conflict=source([original],[retest],[reference],[disposition],[{...witness,outcome:'SOURCE_CONFLICT'}]);
  const missing=source([original],[],[],[],[]);
  for(const [packet,state] of [[conflict,'SOURCE_CONFLICT_OPEN'],[missing,'DEVICE_OR_SOURCE_RECEIPT_MISSING']]){
    const result=reviewAttestation577(packet,exceptionPacket577([]));
    assert.equal(result.cases[0].attestation_status,state);
    assert.equal(result.cases[0].authenticated_attestation,false);
    assert.equal(result.cases[0].exception_closed,false);
  }
});
test('Validation rejects fabricated approvals, duplicate cases, bad actions and missing request notes',()=>{
  const r=request();
  for(const bad of [{...r,disposition:'APPROVE'}, {...r,review_request:'small'},
    {...r,source_pin:'unlinked'}, {...r,device:'server'}])assert.throws(()=>exceptionPacket577([bad]));
  assert.throws(()=>exceptionPacket577([r,r]));
  assert.throws(()=>reviewAttestation577(source(),{format:ATTESTATION_FORMAT_577,build:577,owner_signoff:'APPROVED',entries:[]}));
});
test('Portable owner handoff round-trips but any forged verification or changed review counts are rejected',()=>{
  const packet=source(),handoff=ownerHandoffPacket577(packet,exceptionPacket577([request(packet)]),'2026-11-02T10:30:00Z');
  assert.equal(handoff.format,HANDOFF_FORMAT_577);
  assert.deepEqual(validateOwnerHandoff577(JSON.parse(JSON.stringify(handoff))),handoff);
  for(const changed of [{...handoff,owner_signoff:'APPROVED'},
    {...handoff,owner_decision_ready:true},{...handoff,authenticated_attestations:1},
    {...handoff,verified_exception_closures:1},
    {...handoff,review:{...handoff.review,counts:{...handoff.review.counts,authenticated_attestations:1}}},
    {...handoff,source_provenance:{...handoff.source_provenance,owner_decision:'ACCEPTED'}}])
    assert.throws(()=>validateOwnerHandoff577(changed));
});
test('Live Admin section has accessible manual controls and cannot POST or approve',()=>{
  const html=read('admin/device-acceptance/index.html');
  const js=read('public/js/admin-device-attestation-577.mjs');
  for(const id of ['dd577Attestation','dd577Title','dd577ImportText','dd577Confirm','dd577Import',
    'dd577Local','dd577Review','dd577List','dd577State','dd577CopySummary','dd577CopyPacket',
    'dd577Summary','dd577Packet'])assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build 577/);
  assert.match(js,/if\(!get\('dd577Confirm'\)\.checked\)/);
  assert.match(js,/if\(!ack\.checked\)/);
  assert.match(js,/validateProvenancePacket576\(JSON\.parse\(raw\)\)/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/);
});
test('Etsy new unpublished drafts, current processing-profile fields and all approved images remain implemented and gated',()=>{
  const draft=read('functions/api/_lib/etsyProductDraft438.mjs');
  const controller=read('public/js/admin-product-etsy-package-v500.mjs');
  const photos=read('functions/api/admin/product-etsy-images.js');
  const editor=read('admin/product-editor/index.html');
  assert.match(draft,/readiness_state_id/);
  assert.match(draft,/shipping_profile_id/);
  assert.match(controller,/action:'create_draft'/);
  assert.match(controller,/await sendImages\(listingId\)/);
  assert.match(controller,/await sendTags\(listingId\)/);
  assert.match(controller,/await acceptance\(listingId\)/);
  assert.match(photos,/transfer_one/);
  assert.match(photos,/verified_remote_readback:true/);
  assert.match(editor,/Create Etsy draft/);
  assert.match(editor,/Update Etsy draft/);
  assert.match(editor,/Marketplace remains a <strong>manual listing<\/strong>/);
});
test('Immutable workflow marker, CI regression and all cache-busted source modules reflect Build 577',()=>{
  const html=read('admin/device-acceptance/index.html');
  for(const name of ['admin-device-acceptance-569','admin-device-followup-570','admin-device-retest-571',
    'admin-device-evidence-572','admin-device-intake-573','admin-device-readiness-574',
    'admin-device-witness-575','admin-device-provenance-576','admin-device-attestation-577'])
    assert.ok(html.includes(`${name}.mjs?v=577`),name);
  assert.match(read('public/js/admin-device-attestation-577.mjs'),/admin-device-provenance-576\.mjs\?v=577/);
  assert.match(read('css/admin-device-acceptance-569.css'),/\.dd577-attestation/);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build577_attestation_handoff\.test\.mjs/);
  // The deployment marker advances with the current build; historical Build 577 behavior stays pinned.
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:579|580|581|582|583|584|585|586|587|588)/);
});
