import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isAuthorized409,keyValid,uuidDraft} from '../functions/api/_lib/etsyTrialGate409.mjs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const f=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source={product:{product_id:54},draft:{id:'11111111-1111-4111-8111-111111111111'},
fingerprint:'prod-fingerprint',draftFingerprint:'draft-fingerprint',reviewReceipt:120,shopId:'123456',blockers:[],
trial:{admin_action_audit_id:99}};
const details={build:409,product_id:54,draft_id:source.draft.id,shop_id:'123456',destination:'etsy',
 source_fingerprint:source.fingerprint,draft_fingerprint:source.draftFingerprint,
 review_receipt:120,shipping_profile_id:45,confirmed_no_publish:true,confirmed_one_attempt:true,
 confirmed_us_shipping_disabled:true,owner_verified_shipping_profile_us_excluded:true,
 provider_write_permitted:'unpublished_draft_only'};
const fresh={admin_action_audit_id:99,details_json:JSON.stringify(details),
 created_at:new Date().toISOString()};
const check=(receipt=fresh,s=source,profile=45)=>isAuthorized409({receipt,source:s,draftId:source.draft.id,shippingProfileId:profile});
test('409 acceptance explicitly allows only fresh, bounded one-attempt draft state',()=>{
 assert.equal(check(),true);
 assert.equal(check({...fresh,created_at:new Date(Date.now()-16*60*1000).toISOString()}),false);
 assert.equal(check({...fresh,admin_action_audit_id:98}),false);
 assert.equal(check(fresh,{...source,blockers:['blocked']}),false);
 assert.equal(check(fresh,{...source,fingerprint:'changed'}),false);
 assert.equal(check(fresh,{...source,draftFingerprint:'changed'}),false);
 assert.equal(check(fresh,{...source,reviewReceipt:121}),false);
 assert.equal(check(fresh,{...source,shopId:'999'}),false);
 assert.equal(check(fresh,source,46),false);
 for(const [key,value] of Object.entries({confirmed_no_publish:false,confirmed_one_attempt:false,
  confirmed_us_shipping_disabled:false,owner_verified_shipping_profile_us_excluded:false,
  provider_write_permitted:'publish'})){
  const d={...details,[key]:value};assert.equal(check({...fresh,details_json:JSON.stringify(d)}),false,key);
 }
});
test('rejects invalid product IDs and request keys and UUID shapes',()=>{
 assert.equal(uuidDraft('11111111-1111-4111-8111-111111111111'),true);
 assert.equal(uuidDraft('../secret'),false);
 assert.equal(keyValid('11111111-1111-4111-8111-111111111111'),true);
 assert.equal(keyValid('abc'),false);
});
test('409 trial cannot bypass Storefront auth, canonical source or prior claim gates',()=>{
 const api=f('functions/api/admin/etsy-trial-409.js');
 assert.equal(moduleKeyForPath('/api/admin/etsy-trial-409'),MODULE_KEYS.STOREFRONT);
 assert.match(api,/verifiedAdminFromModule/);
 assert.match(api,/loadTrial409/);
 assert.match(api,/previous_remote_attempt_claimed|s\.claim/);
 assert.match(api,/verified unpublished Etsy draft/);
 assert.match(api,/request_key/);
 assert.doesNotMatch(api,/\bfetch\s*\(|api\.etsy\.com|graph\.facebook\.com/);
 const lib=f('functions/api/_lib/etsyTrialGate409.mjs');
 for(const c of ['product_distribution_policy_406','product_destination_408_owner_acceptance',
  'product_destination_408_local_draft_preparation','etsy_remote_draft_trial_claimed',
  'etsy_remote_draft_reconciled'])assert.ok(lib.includes(c),c);
 assert.match(lib,/US_SHIPPING_DISABLED/);
});
test('existing 399 real remote write requires bounded Build 409 owner approval before claim',()=>{
 const api=f('functions/api/admin/etsy-remote-draft-trial.js');
 const pos=api.indexOf('isAuthorized409({receipt:');
 const claim=api.indexOf('const claimSql=');
 assert.ok(pos>0&&claim>pos,'409 gate must run before one-claim and Etsy POST');
 assert.match(api,/trial_409_receipt/);
 assert.match(api,/method:'POST'/);
 assert.match(api,/listing_state_requested:'draft'/);
 const client=f('public/js/admin-etsy-remote-draft-v399.js');
 assert.match(client,/trial_409_receipt/);
 assert.match(client,/etsy409TrialReceipt/);
});
test('Build 409 UI is manual-only and reconciliation references preexisting verified 400 proof',()=>{
 const html=f('admin/it-integrations/index.html');
 const js=f('public/js/admin-etsy-trial-v409.js');
 assert.match(html,/id="etsy409"/);
 assert.match(html,/admin-etsy-trial-v409\.js/);
 assert.match(html,/EXCLUDES United States/);
 assert.match(js,/addEventListener\('click'/);
 assert.doesNotMatch(js,/setInterval|setTimeout|onload\s*=/);
 const api=f('functions/api/admin/etsy-trial-409.js');
 assert.match(api,/record_verified_draft_reconciliation/);
 assert.match(api,/s\.verified/);
 assert.match(api,/publication_performed:false/);
});
