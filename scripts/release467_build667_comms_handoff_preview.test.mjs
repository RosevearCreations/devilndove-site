import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readCommsContract,assertCommsBoundary,previewCommsHandoff} from './release467_build667_comms_handoff_preview.mjs';
import {buildSourceReport} from './release467_build666_ai_data_source_report.mjs';

const now=Date.parse('2026-11-10T12:00:00.000Z');
const revision='f'.repeat(40);
const sourceReport=buildSourceReport({revision,now});
const input=(kind='workshop_status',status='making')=>({kind,status,sourceRevision:revision,
  occurredAt:new Date(now).toISOString()});
const preview=value=>previewCommsHandoff(value,{now,sourceReport});

test('read-only source contract matches QL365D exact source-owned handler and original manifest',()=>{
  const c=readCommsContract();
  assert.deepEqual(assertCommsBoundary(c),{ok:true,errors:[]});
  assert.equal(c.source_id,'devilndove');
  assert.match(c.reference_handoff,/QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF/);
});

test('workshop planning and production source statuses remain internal metadata-only HOLD',()=>{
  const result=preview(input());
  assert.equal(result.payload.eventFamily,'workflow.status.changed');
  assert.equal(result.payload.statusCode,'making');
  assert.equal(result.review.state,'HOLD_CONSENT_SIGNED_RECEIPT_AND_AUDIENCE');
  assert.equal(result.review.delivered,false);
  assert.equal(result.review.recipient,null);
  assert.equal(result.transport,'NONE_OFFLINE_PREVIEW_ONLY');
});

test('private learning and QA do not become public or customer notifications',()=>{
  for(const kind of ['workshop_status','workshop_qa']){
    const status=kind==='workshop_qa'?'rework_required':'finished_private';
    const r=preview(input(kind,status));
    assert.equal(r.review.notificationDispatchEnabled,false);
    assert.equal(r.review.originalCustomerMediaConsentVerified,false);
    assert.equal(r.payload.privacyClass,'SOURCE_STRUCTURAL_METADATA_ONLY');
  }
});

test('incidents only carry reviewed state/severity, without case notes or recipients',()=>{
  for(const kind of ['incident_opened','incident_updated']){
    const r=preview({...input(kind,'open'),severity:'warning'});
    assert.equal(r.payload.eventFamily,kind==='incident_opened'?'incident.opened':'incident.updated');
    assert.equal(r.payload.severityCode,'warning');
    assert.equal(r.review.incidentRoutingEnabled,false);
    assert.equal(r.review.privateReceiverConnected,false);
  }
});

test('notification intent is not a change-of-consent event or a real outbox send',()=>{
  const r=preview(input('notification_intent','review_requested'));
  assert.equal(r.payload.eventFamily,null);
  assert.equal(r.review.providerMessageId,null);
  assert.equal(r.review.notificationDispatchEnabled,false);
});

test('no customer, worker, note, media, URL, tenant or destination field is accepted',()=>{
  for(const key of ['customerEmail','recipient','message','projectNote','mediaURL','tenantId','payload','signedReceipt'])
    assert.throws(()=>preview({...input(),[key]:'sensitive'}),/UNSAFE_HANDOFF_FIELDS/);
});

test('unknown statuses and severity do not enter a Comms envelope',()=>{
  assert.throws(()=>preview(input('workshop_status','paid')),/UNKNOWN_SOURCE_STATUS/);
  assert.throws(()=>preview({...input(),kind:'customer_message'}),/UNKNOWN_HANDOFF_KIND/);
  assert.throws(()=>preview({...input('incident_opened','open'),severity:'none'}),/INVALID_INCIDENT_SEVERITY/);
  assert.throws(()=>preview({...input(),severity:'warning'}),/UNEXPECTED_SEVERITY/);
});

test('stale and future observations stay HOLD, and source revision drift is flagged',()=>{
  const old=preview({...input(),occurredAt:new Date(now-25*3_600_000).toISOString()});
  assert.equal(old.review.state,'HOLD_STALE_OR_FUTURE_OBSERVATION');
  const future=preview({...input(),occurredAt:new Date(now+6_000).toISOString()});
  assert.equal(future.review.observationCurrent,false);
  const drift=preview({...input(),sourceRevision:'a'.repeat(40)});
  assert.equal(drift.review.state,'HOLD_SOURCE_REVISION_DRIFT');
  assert.equal(drift.review.sourceRevisionMatches,false);
});

test('missing source provenance and original owner authorization fail closed',()=>{
  assert.throws(()=>preview({...input(),sourceRevision:'main'}),/INVALID_SOURCE_REVISION/);
  assert.throws(()=>preview({...input(),occurredAt:'yesterday'}),/INVALID_SOURCE_TIME/);
  assert.throws(()=>previewCommsHandoff(input(),{now,sourceReport:{...sourceReport,status:'CONNECTED'}}),
    /ORIGINAL_SOURCE_REPORT_NOT_ACCEPTED/);
});

test('contract cannot switch on notifications, incident routing, connection or signer',()=>{
  for(const field of ['outbound_notifications_enabled','incident_routing_enabled',
    'comms_receiver_connected','original_owner_consent_verified','independent_source_signer_enrolled']){
    const changed=structuredClone(readCommsContract());changed[field]=true;
    assert.ok(assertCommsBoundary(changed).errors.includes('authority_'+field));
  }
});

test('original authenticated local outbox and QL364 signed source GET remain distinct authorities',()=>{
  const files=[
    'functions/api/admin/notification-outbox.js',
    'functions/api/_lib/ql364-source-health.mjs',
    'functions/api/admin/workshop-production-657.js'
  ];
  const sources=files.map(p=>readFileSync(new URL('../'+p,import.meta.url),'utf8'));
  assert.match(sources[0],/requireAdminStepUp/);
  assert.match(sources[1],/HOLD_ORIGINAL_OWNERS_SIGNER_AND_DURABLE_NONCE_UNAVAILABLE/);
  assert.match(sources[2],/private workshop lifecycle REVIEW ledger/);
  assert.ok(!sources.some(s=>/release467_build667_comms_handoff_preview/.test(s)));
});

test('contract only proposes known event families, and no executable transport is enabled',()=>{
  const c=readCommsContract();
  assert.deepEqual(c.event_kinds.map(x=>x.family),[
    'workflow.status.changed','workflow.status.changed','incident.opened','incident.updated',null]);
  assert.equal(c.transport,'LOCAL_OFFLINE_PREVIEW_NOT_CONNECTED');
  assert.equal(c.automatic_workshop_events_enabled,false);
});
