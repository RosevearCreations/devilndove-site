import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {connectionBlockers} from '../functions/api/_lib/etsyDraftTrial399.mjs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ownerQuery=/SELECT remote_subject_id,connection_status,scopes_json,access_expires_at,access_token_ciphertext FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1/;

test('existing Etsy listing link and photo transfer select the account ID required by owner verification',()=>{
  // Both paths previously omitted remote_subject_id. That made EVERY correctly
  // authorized owner fail the shared guard with a false shop_owner_mismatch.
  for(const path of [
    'functions/api/admin/product-etsy-existing-draft.js',
    'functions/api/admin/product-etsy-images.js'
  ]){
    const module=source(path);
    assert.match(module,ownerQuery,`Missing OAuth owner in ${path}`);
    assert.doesNotMatch(module,/SELECT connection_status,scopes_json,access_expires_at,access_token_ciphertext FROM oauth_provider_connections/);
    assert.match(module,/connectionBlockers\(/);
  }
});

test('actual Etsy shop-owner mismatch still blocks, while a verified matching owner passes',()=>{
  const now=Date.UTC(2026,9,27);
  const conn={remote_subject_id:'12345',connection_status:'connected',access_token_ciphertext:'encrypted',
    scopes_json:JSON.stringify(['shops_r','listings_r','listings_w']),
    access_expires_at:new Date(now+3600000).toISOString()};
  const shop={owner_user_id:12345,shop_id:67890,acceptance_status:'connected_verified',currency_code:'CAD'};
  const env={ETSY_API_KEYSTRING:'test-key',ETSY_SHARED_SECRET:'test-secret'};
  assert.deepEqual(connectionBlockers(conn,shop,env,now),[]);
  assert.ok(connectionBlockers({...conn,remote_subject_id:'999'},shop,env,now).includes('shop_owner_mismatch'));
  assert.ok(connectionBlockers({...conn,remote_subject_id:undefined},shop,env,now).includes('shop_owner_mismatch'));
});
