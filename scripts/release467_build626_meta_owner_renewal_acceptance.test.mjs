import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOLD_626,ACCEPT_626,expiry626,deriveWalkthrough626}
  from '../functions/api/_lib/trustOwnerWalkthrough626.js';
import {onRequestGet,onRequestPost}
  from '../functions/api/admin/trust-owner-walkthrough-626.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-07T02:00:00.000Z');
const at=minutes=>new Date(now+minutes*60000).toISOString();
const NONCE='original-one-use-meta-nonce-626';
function source(){return {assistant:{source_proof_verified:true,
  actual_readonly_meta_test_witnessed:true,checks:[{id:'original_database',complete:true},
    {id:'original_authorities',complete:true},{id:'genuine_external_archive',complete:true},
    {id:'original_meta_window',complete:true},{id:'saved_meta_credential',complete:true},
    {id:'original_enrollment',complete:true},{id:'one_use_get',complete:true},
    {id:'independent_witness',complete:true}]},
  original_database_readback:{all_source_tables_present:true},
  original_credential_readback:{saved_encrypted_credential:true,
    read_only_page_candidate:true,expires_at:at(60)}};}
function fixture(){return {source:source(),now,
  window:{derived_readonly_page_identity_window:{verified:true,expires_at:at(8)}},
  provider:{latest_verified_original_get:'ORIGINAL_ONE_GENUINE_META_GET_WITNESSED_READ_ONLY_NO_CONNECTION'},
  grant:{test_nonce:NONCE,expires_at:at(6)},
  attempts:[{test_nonce:NONCE,status:'CLAIMED_ONE_ORIGINAL_META_PAGE_ID_GET_NO_RETRY'}],
  outcomes:[{test_nonce:NONCE,receipt_sha256:'f'.repeat(64)}],
  failures:[],witnesses:[{test_nonce:NONCE,witness_sha256:'a'.repeat(64)}]};}

test('626 accepts only independently reverified real one-use GET as a READ-ONLY TEST, never as an active channel',()=>{
  const result=deriveWalkthrough626(fixture());
  assert.equal(result.release_gate,ACCEPT_626);
  assert.equal(result.accepted_for_readonly_test_only,true);
  assert.equal(result.original_readonly_test_acceptance,'VERIFIED_SINGLE_GET_RECEIPT_READ_ONLY_TEST_ONLY');
  assert.equal(result.connected,false);
  assert.equal(result.provider_channel_activated,false);
  assert.equal(result.customer_publication_enabled,false);
  assert.equal(result.provider_write,false);
  assert.equal(result.read_request_performed_by_assistant,false);
  assert.equal(result.renewal.most_recent_nonce_spent,true);
  assert.equal(result.renewal.new_one_use_authorization_required,true);
  assert.equal(result.renewal.reusing_spent_nonce_forbidden,true);
  assert.equal(result.checklist.at(-1).complete,true);
});

test('626 stale, revoked, failed and mismatched original evidence are never accepted',()=>{
  const base=fixture();
  const variants=[
    {...base,source:{...base.source,assistant:{...base.source.assistant,source_proof_verified:false}}},
    {...base,source:{...base.source,original_database_readback:{all_source_tables_present:false}}},
    {...base,source:{...base.source,original_credential_readback:{...base.source.original_credential_readback,expires_at:at(-1)}}},
    {...base,window:{derived_readonly_page_identity_window:{verified:false,expires_at:at(8)}}},
    {...base,window:{derived_readonly_page_identity_window:{verified:true,expires_at:at(-1)}}},
    {...base,provider:{latest_verified_original_get:'NO_ORIGINAL_LIVE_GET_WITNESS_ON_HOLD'}},
    {...base,witnesses:[]},
    {...base,outcomes:[{test_nonce:'another-nonce',receipt_sha256:'f'.repeat(64)}]},
    {...base,attempts:[]},
    {...base,failures:[{test_nonce:NONCE,failure_code:'PROVIDER_UNVERIFIED'}]},
    {...base,source:{...base.source,original_credential_readback:{saved_encrypted_credential:false,
      read_only_page_candidate:true,expires_at:at(60)}}}
  ];
  for(const altered of variants){const result=deriveWalkthrough626(altered);
    assert.equal(result.release_gate,HOLD_626);
    assert.equal(result.accepted_for_readonly_test_only,false);
    assert.equal(result.connected,false);
  }
});

test('626 expiry guidance never renews original approval or reuses spent nonce',()=>{
  assert.equal(expiry626(null,now).state,'MISSING');
  assert.equal(expiry626(at(-2),now).state,'EXPIRED');
  assert.equal(expiry626(at(10),now).state,'EXPIRING_SOON');
  assert.equal(expiry626(at(45),now).state,'CURRENT');
  const fresh=fixture();fresh.witnesses=[];
  fresh.attempts=[];fresh.outcomes=[];
  let result=deriveWalkthrough626(fresh);
  assert.equal(result.renewal.new_one_use_authorization_required,false);
  assert.equal(result.checklist.find(c=>c.id==='one_use_authorization').complete,true);
  fresh.grant.expires_at=at(-1);
  result=deriveWalkthrough626(fresh);
  assert.equal(result.renewal.new_one_use_authorization_required,true);
  assert.equal(result.checklist.find(c=>c.id==='one_use_authorization').complete,false);
  assert.equal(result.renewal.automatic_renewal,false);
  assert.equal(result.renewal.reusing_spent_nonce_forbidden,true);
  fresh.grant=null;
  assert.equal(deriveWalkthrough626(fresh).renewal.new_one_use_authorization_required,true);
});

test('626 UI and GET-only server keep original source migration, provider and signer boundaries',async()=>{
  const request=new Request('https://devilndove.com/api/admin/trust-owner-walkthrough-626');
  assert.equal((await onRequestGet({request,env:{}})).status,401);
  assert.equal((await onRequestPost()).status,405);
  const api=read('functions/api/admin/trust-owner-walkthrough-626.js');
  assert.match(api,/readSchemaAndSource625/);
  assert.match(api,/readOriginalWindow623/);
  assert.match(api,/readOriginalWitness624/);
  assert.doesNotMatch(api,/fetch\(|decryptOAuthSecret|probeMetaPage620|INSERT INTO|UPDATE |DELETE FROM|CREATE TABLE|POST \/feed/);
  assert.match(read('public/js/admin-channel-trust-authority-614.mjs'),/47\. Original Meta owner walkthrough/);
  assert.match(read('public/js/admin-channel-issuer-response-598.mjs'),/trust-authority-614\.mjs\?v=627/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":627/);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build626_meta_owner_renewal_acceptance\.test\.mjs/);
  assert.match(read('migrations/proposed/0062_devilndove_build624_meta_original_enrollment_recheck_hold.sql'),/PROPOSED ONLY/);
});
