import test from 'node:test';
import assert from 'node:assert/strict';
import {loadChannelReadiness,validateChannelReadiness,channelIds} from './release467_build665_channel_readiness.mjs';

const fixture=()=>structuredClone(loadChannelReadiness());
const invalid=mutate=>{
  const data=fixture();mutate(data);
  return validateChannelReadiness(data,{checkSources:false});
};

test('source audit reconciles all existing code evidence without provider access',()=>{
  const result=validateChannelReadiness(fixture());
  assert.equal(result.ok,true,JSON.stringify(result.errors));
  assert.equal(result.provider_contacted,false);
  assert.equal(result.publishing_enabled,false);
  assert.equal(result.advertising_spend_enabled,false);
  assert.equal(result.master_shell_connection,'DISCONNECTED_HOLD');
});

test('all seven channels are distinct and remain owner/provider HOLD',()=>{
  const data=fixture();
  assert.deepEqual(data.channels.map(c=>c.id),channelIds);
  assert.equal(data.channels.find(c=>c.id==='etsy').state,'PAUSED_BY_OWNER');
  assert.equal(data.channels.filter(c=>c.state==='HOLD').length,6);
});

test('paused Etsy cannot be silently unpaused or authorized by source code',()=>{
  assert.ok(invalid(d=>d.channels[0].state='READY').errors.includes('state_etsy'));
  assert.ok(invalid(d=>d.channels[0].publication_authorized=true).errors.includes('authorization_etsy'));
});

test('credential presence never upgrades Meta or another provider to live approval',()=>{
  assert.ok(invalid(d=>d.channels[1].external_identity_verified=true).errors.includes('authorization_facebook_page'));
  assert.ok(invalid(d=>d.channels[2].original_owner_consent_verified=true).errors.includes('authorization_instagram_business'));
  assert.ok(invalid(d=>d.channels[3].original_provider_receipt='unverified').errors.includes('receipt_pinterest'));
});

test('paid campaign execution fails closed without ad account, budget, and owner evidence',()=>{
  assert.ok(invalid(d=>d.advertising.spend_enabled=true).errors.includes('advertising_spend_boundary'));
  assert.ok(invalid(d=>d.advertising.budget_approved=true).errors.includes('advertising_spend_boundary'));
  assert.ok(invalid(d=>d.advertising.state='READY').errors.includes('advertising_state'));
});

test('tracking consent is not a media/publication consent or license',()=>{
  assert.ok(invalid(d=>d.privacy.tracking_consent_proves_publication_authority=true).errors.includes('privacy_consent_boundary'));
  assert.ok(invalid(d=>d.privacy.customer_media_publication_allowed_by_this_record=true).errors.includes('privacy_consent_boundary'));
});

test('fake signed receipts and premature Master Shell CONNECTED are rejected',()=>{
  assert.ok(invalid(d=>d.external_provider_receipt='claimed').errors.includes('invented_provider_receipt'));
  assert.ok(invalid(d=>d.master_shell_connection='CONNECTED').errors.includes('connection_boundary'));
  assert.ok(invalid(d=>d.source_code_green_implies_provider_connected=true).errors.includes('production_truth'));
});

test('evidence references must not escape the source tree or duplicate sources',()=>{
  assert.ok(invalid(d=>d.evidence_paths[0]='../../.env').errors.includes('unsafe_source_path'));
  assert.ok(invalid(d=>d.evidence_paths[1]=d.evidence_paths[0]).errors.includes('evidence_paths'));
});
