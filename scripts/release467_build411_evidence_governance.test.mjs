import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceState,snapshotSignature,snapshotGovernance,escalationStatus,decisionAllowed} from '../functions/api/_lib/providerEvidence411.mjs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const f=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const product={product_id:54,name:'Handmade soap',price_cents:900,inventory_quantity:2};
const draft={id:'11111111-1111-4111-8111-111111111111',product_id:54,channel_key:'etsy',status:'needs_review',external_reference:'12345',updated_at:'2026-10-16 12:00:00'};
const intent={admin_action_audit_id:4,details_json:'{"etsy":true,"facebook":false}'};
const policy={admin_action_audit_id:5,details_json:'{"us_shipping_disabled":true}'};
const claim={admin_action_audit_id:10};
const proof={admin_action_audit_id:12,details_json:'{"claim_receipt":10,"listing_id":"12345","listing_state":"draft","provider_get_only":true,"local_link_only":true,"publication_performed":false}'};
const closed={admin_action_audit_id:13,details_json:'{"outcome":"CLOSED_WITH_VERIFIED_DRAFT_PROOF","claim_receipt":10,"verified_receipt":12,"listing_id":"12345"}'};
const stateArgs={destination:'etsy',product,draft,claim,verified:proof,caseReceipt:closed,channelIntent:intent,policyReceipt:policy};
const body={owner_note:'The matching unpublished Etsy draft was rechecked by owner.',no_provider_retry:true,no_publication:true,us_shipping_suspended:true,confirm_verified_draft_closure:true};
test('historical VERIFIED_CASE_CLOSED does not imply live Etsy approval or publication',()=>{
 const s=sourceState(stateArgs);assert.equal(s.outcome,'VERIFIED_CASE_CLOSED');assert.equal(s.closure_eligible,true);
 assert.equal(s.provider_live_checked_now,false);assert.equal(s.publication_allowed,false);assert.equal(s.shipping_suspended,true);
});
test('unknown claimed Etsy attempt is escalatable but never closable, retries remain blocked',()=>{
 const s=sourceState({...stateArgs,verified:null,caseReceipt:null,draft:{...draft,external_reference:null}});
 assert.equal(s.outcome,'REMOTE_ATTEMPT_OUTCOME_UNKNOWN_HOLD');assert.equal(s.escalatable,true);
 assert.equal(s.closure_eligible,false);assert.equal(s.no_remote_retry,true);
});
test('Facebook remains an operator-only HOLD with no remote authorization',()=>{
 const s=sourceState({...stateArgs,destination:'facebook',draft:null,claim:null,verified:null,caseReceipt:null});
 assert.equal(s.outcome,'PROVIDER_LISTING_PERMISSION_UNVERIFIED_HOLD');assert.equal(s.escalatable,true);
 assert.equal(s.closure_eligible,false);assert.equal(s.publication_allowed,false);
});
test('snapshot fingerprint detects source changes; timestamps label old snapshots review-due',()=>{
 const s=sourceState(stateArgs),sig=snapshotSignature({state:s,product,draft});
 assert.notEqual(sig,snapshotSignature({state:s,product:{...product,price_cents:1000},draft}));
 assert.notEqual(sig,snapshotSignature({state:s,product,draft:{...draft,updated_at:'later'}}));
 const fresh={admin_action_audit_id:50,created_at:'2026-10-16 12:00:00',details_json:JSON.stringify({build:411,source_signature:sig,provider_called:false})};
 const g=snapshotGovernance({signature:sig,latestSnapshot:fresh,now:Date.parse('2026-10-16T13:00:00Z')});
 assert.equal(g.source_matches_snapshot,true);assert.equal(g.review_due,false);assert.equal(g.live_provider_state_verified,false);
 const old=snapshotGovernance({signature:sig,latestSnapshot:fresh,now:Date.parse('2026-10-18T14:00:00Z')});
 assert.equal(old.review_due,true);assert.equal(old.governance_status,'HISTORICAL_SNAPSHOT_REVIEW_DUE');
 const drift=snapshotGovernance({signature:'different',latestSnapshot:fresh});
 assert.equal(drift.source_matches_snapshot,false);assert.equal(drift.governance_status,'SOURCE_CHANGED_RECAPTURE');
});
test('manual escalations cannot resolve unknown provider state, or bypass prior 410 closure',()=>{
 const unknown=sourceState({...stateArgs,verified:null,caseReceipt:null,draft:{...draft,external_reference:null}});
 const esc=escalationStatus({latestEscalation:{admin_action_audit_id:61,details_json:'{"decision":"OPEN_OWNER_REVIEW"}'},state:unknown});
 const gov={source_matches_snapshot:true};
 assert.equal(decisionAllowed({action:'resolve',state:unknown,governance:gov,escalation:esc,body}),false);
 assert.equal(decisionAllowed({action:'escalate',state:unknown,governance:gov,escalation:{status:'NONE'},body}),true);
 assert.equal(decisionAllowed({action:'escalate',state:unknown,governance:gov,escalation:esc,body}),false);
 assert.equal(decisionAllowed({action:'resolve',state:sourceState(stateArgs),governance:gov,escalation:esc,body}),true);
 assert.equal(decisionAllowed({action:'resolve',state:sourceState(stateArgs),governance:{source_matches_snapshot:false},escalation:esc,body}),false);
 assert.equal(decisionAllowed({action:'resolve',state:sourceState(stateArgs),governance:gov,escalation:esc,body:{...body,no_publication:false}}),false);
});
test('new endpoint requires restricted Storefront Admin and contains no provider calls, mutations or polling',()=>{
 const api=f('functions/api/admin/provider-evidence-411.js'),js=f('public/js/admin-provider-evidence-v411.js');
 const html=f('admin/it-integrations/index.html');
 assert.equal(moduleKeyForPath('/api/admin/provider-evidence-411'),MODULE_KEYS.STOREFRONT);
 assert.match(api,/verifiedAdminFromModule/);assert.match(api,/admin_action_audit/);
 assert.match(api,/expected_snapshot_receipt/);assert.match(api,/expected_escalation_receipt/);
 assert.match(api,/decisionAllowed/);assert.match(api,/SELECT/);
 assert.doesNotMatch(api,/\bfetch\s*\(|api\.etsy\.com|graph\.facebook\.com|UPDATE marketplace_syndication_drafts|DELETE FROM admin_action_audit|DELETE FROM marketplace_syndication_drafts/);
 assert.match(js,/addEventListener\('click'/);assert.doesNotMatch(js,/setInterval|setTimeout/);
 assert.match(html,/id="provider411"/);assert.match(html,/admin-provider-evidence-v411\.js/);
});
