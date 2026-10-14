import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyEtsyConnection } from '../functions/api/_lib/etsyConnectionObservability.mjs';
const now = Date.parse('2026-10-13T19:00:00Z');
const at = (n) => new Date(now+n*86400000).toISOString();
const connected = {connection_status:'connected',access_expires_at:at(2),refresh_expires_at:at(60),updated_at:at(-1)};
const shop = {acceptance_status:'connected_verified',verified_at:at(-1)};
test('verified shop is reported from stored evidence, not as live polling', () => {
  const result = classifyEtsyConnection(connected,shop,now);
  assert.equal(result.status,'connected_verified');
  assert.equal(result.verification_age_days,1);
  assert.equal(result.provider_calls_performed,false);
  assert.equal(result.database_mutations_performed,false);
  assert.equal(result.listing_changes_performed,false);
});
test('missing and disconnected records never claim verification', () => {
  assert.equal(classifyEtsyConnection(null,null,now).status,'not_connected');
  assert.equal(classifyEtsyConnection({connection_status:'disconnected'},shop,now).status,'disconnected');
});
test('unverified shop and future verification timestamps require review', () => {
  assert.equal(classifyEtsyConnection(connected,{acceptance_status:'unverified'},now).status,'verification_unknown');
  assert.equal(classifyEtsyConnection(connected,{...shop,verified_at:at(3)},now).status,'verification_unknown');
});
test('old verification is flagged without falsely disconnecting the account', () => {
  assert.equal(classifyEtsyConnection(connected,{...shop,verified_at:at(-30)},now).status,'verification_review_due');
});
test('expired refresh takes priority over stored shop verification', () => {
  assert.equal(classifyEtsyConnection({...connected,refresh_expires_at:at(-1)},shop,now).status,'reauthorization_required');
});
test('expired access when refresh may still work is due, not revoked', () => {
  assert.equal(classifyEtsyConnection({...connected,access_expires_at:at(-1)},shop,now).status,'refresh_due');
});
test('SQLite naive timestamps are UTC', () => {
  const result=classifyEtsyConnection(connected,{...shop,verified_at:'2026-10-12 19:00:00'},now);
  assert.equal(result.verification_age_days,1);
});
test('pure summary returns no tokens even if connection row had a secret', () => {
  const result=classifyEtsyConnection({...connected,access_token_ciphertext:'supersecret'},shop,now);
  assert.equal(JSON.stringify(result).includes('supersecret'),false);
});
