// Build 727 — deterministic private-data prevention and consent/retention negative regression.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {inspectOutboundText727,inspectOutboundEnvelope727,clampConsentFlags727,
  consentIsLive727,evaluateMediaPublication727,assessRetention727,
  consentWithdrawalHandoff727,encryptEvidence727,BUILD727_DATA_PROTECTION}
  from '../functions/api/_lib/dataProtection727.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const now=Date.UTC(2026,10,16,16,0,0);
assert.equal(BUILD727_DATA_PROTECTION.external_consent_withdrawal_delivery_enabled,false);
assert.equal(BUILD727_DATA_PROTECTION.automatic_deletion_enabled,false);
assert.deepEqual(inspectOutboundText727('Workshop product story'),{clear:true,findings:[],raw_value_exposed:false});
for(const [input,code] of [
 ['Contact customer at jane@example.com','EMAIL'],
 ['Pay with 4111 1111 1111 1111','PAYMENT_CARD'],
 ['Phone (416) 555-1212','PHONE'],
 ['Header sk_live_dont_transmit','PAYMENT_SECRET_OR_BEARER']
]){
 const got=inspectOutboundText727(input);
 assert.equal(got.clear,false,input);
 assert.ok(got.findings.includes(code),input);
 assert.ok(!JSON.stringify(got).includes(input),'Never leak blocked values');
}
assert.equal(inspectOutboundEnvelope727({type:'DND_HEALTH_EVIDENCE',count:1}).allowed,true);
assert.equal(inspectOutboundEnvelope727({customer:{email:'jane@example.com'}}).allowed,false);
assert.equal(inspectOutboundEnvelope727({metadata:{card_number:'4111111111111111'}}).allowed,false);
assert.equal(inspectOutboundEnvelope727({secret:'xyz'}).allowed,false);
assert.equal(clampConsentFlags727('revoked','all_public',true,true,null,now).social_use_allowed,0);
assert.equal(clampConsentFlags727('requested','all_public',true,true,null,now).public_use_allowed,0);
assert.equal(clampConsentFlags727('granted','internal_only',true,true,null,now).public_use_allowed,0);
assert.equal(clampConsentFlags727('approved','all_public',true,true,new Date(now-1).toISOString(),now).social_use_allowed,0);
assert.equal(clampConsentFlags727('approved','all_public',true,true,new Date(now+100000).toISOString(),now).social_use_allowed,1);
const row={source_type:'caip_project',source_id:'82',customer_media_present:1,
 media_consent_required:1,privacy_status:'approved',approved_for_public_post:1};
const url='https://devilndove.com/assets/public/approved-product.webp';
const original={source_type:'caip_project',source_id:'82',media_url:url,
 consent_status:'approved',consent_scope:'all_public',social_use_allowed:1,
 public_use_allowed:1,expires_at:new Date(now+3600000).toISOString()};
assert.equal(consentIsLive727(original,'social',now),true);
assert.equal(evaluateMediaPublication727(row,[original],[url],now).allowed,true);
for(const mutation of [
 {consent_status:'revoked'},{consent_status:'blocked'},
 {consent_status:'requested'},{consent_scope:'internal_only'},
 {expires_at:new Date(now-1).toISOString()},{expires_at:'nonsense'},
 {social_use_allowed:0},{source_id:'other-source'},{source_type:'customer'}
]){
 const checked=evaluateMediaPublication727(row,[{...original,...mutation}],[url],now);
 assert.equal(checked.allowed,false,JSON.stringify(mutation));
}
assert.equal(evaluateMediaPublication727(row,[original],[url,'https://devilndove.com/other.webp'],now).allowed,false);
assert.equal(evaluateMediaPublication727(row,[original,{...original,consent_status:'revoked'}],[url],now).allowed,false);
assert.equal(evaluateMediaPublication727({...row,source_id:'another-tenant'},[original],[url],now).allowed,false);
assert.equal(evaluateMediaPublication727({...row,source_id:''},[original],[url],now).allowed,false);
assert.equal(evaluateMediaPublication727(row,[],[],now).allowed,false);
assert.equal(evaluateMediaPublication727({source_type:'finished_product',media_consent_required:0,customer_media_present:0},[],[],now).allowed,true);
const retention={created_at:new Date(now-50*86400000).toISOString(),
 retention_days:30,archive_hash_verified:true,archive_sha256:'f'.repeat(64),owner_approved:true};
assert.equal(assessRetention727(retention,now).status,'CANDIDATE_SUPERVISED_PURGE');
assert.equal(assessRetention727({...retention,legal_hold:true},now).status,'HOLD_LEGAL_HOLD');
assert.equal(assessRetention727({...retention,archive_hash_verified:false},now).status,'HOLD_NO_VERIFIED_ARCHIVE');
assert.equal(assessRetention727({...retention,owner_approved:false},now).status,'HOLD_OWNER_APPROVAL');
assert.equal(assessRetention727({...retention,retention_days:100},now).status,'HOLD_WITHIN_RETENTION');
assert.equal(assessRetention727(retention,now).auto_delete,false);
assert.equal(consentWithdrawalHandoff727({consent_key:'source-consent'}).remote_peer_delivery,'NOT_SENT');
assert.equal(consentWithdrawalHandoff727({}).deletion_execution,'NOT_PERFORMED');
await assert.rejects(encryptEvidence727({note:'private'},'',{tenant_id:'t1',purpose:'audit'}),/HOLD_ENCRYPTION/);
const key=Buffer.alloc(32,7).toString('base64');
const encrypted=await encryptEvidence727({status:'consent_withdrawn'},key,{tenant_id:'t1',purpose:'audit'});
assert.equal(encrypted.algorithm,'AES-256-GCM');
assert.equal(encrypted.plaintext_returned,false);
assert.equal(encrypted.stored,false);
assert.ok(!JSON.stringify(encrypted).includes('consent_withdrawn'));
const encryptedAgain=await encryptEvidence727({status:'consent_withdrawn'},key,{tenant_id:'t1',purpose:'audit'});
assert.notEqual(encrypted.iv,encryptedAgain.iv);
const b64=(value)=>Buffer.from(value.replace(/-/g,'+').replace(/_/g,'/'),'base64');
const cryptoKey=await webcrypto.subtle.importKey('raw',Buffer.alloc(32,7),'AES-GCM',false,['decrypt']);
const aad=new TextEncoder().encode('dnd727:t1:audit');
const opened=await webcrypto.subtle.decrypt({name:'AES-GCM',iv:b64(encrypted.iv),additionalData:aad},cryptoKey,b64(encrypted.ciphertext));
assert.deepEqual(JSON.parse(new TextDecoder().decode(opened)),{status:'consent_withdrawn'});
await assert.rejects(webcrypto.subtle.decrypt({name:'AES-GCM',iv:b64(encrypted.iv),
 additionalData:new TextEncoder().encode('dnd727:other:audit')},cryptoKey,b64(encrypted.ciphertext)));
const consent=readFileSync(new URL('../functions/api/admin/media-consent-records.js',import.meta.url),'utf8');
const privacy=readFileSync(new URL('../functions/api/admin/social-media-privacy-guard.js',import.meta.url),'utf8');
const posting=readFileSync(new URL('../functions/api/admin/social-post-queue.js',import.meta.url),'utf8');
for(const text of ['clampConsentFlags727','holdQueuedUse727','media_consent_withdrawal_727',
 'consentWithdrawalHandoff727','private, no-store'])assert.ok(consent.includes(text));
assert.ok(privacy.includes('evaluateMediaPublication727'));
assert.ok(privacy.includes('consentIsLive727'));
assert.ok(posting.includes('inspectOutboundText727'));
assert.ok(posting.includes('evaluateMediaPublication727'));
assert.ok(posting.includes('blocked_privacy_review_727'));
assert.ok(!posting.includes("if (!privacyApproved && (row.source_type==='caip_project'|| payload.force !==true))"));
console.log('Build 727 local DLP, consent expiry/revocation, force bypass, AES-GCM and retention HOLD contracts: PASS');
