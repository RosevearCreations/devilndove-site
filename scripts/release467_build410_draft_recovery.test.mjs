import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {outcomeState,evidenceToken,caseDecisionValid,verifiedDraftEvidence,CASE_ACTIONS} from '../functions/api/_lib/providerDraftRecovery410.mjs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const f=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const draft={id:'11111111-1111-4111-8111-111111111111',status:'needs_review',updated_at:'2026-10-16 16:00:00',external_reference:'12345'};
const claim={admin_action_audit_id:33};
const verified={admin_action_audit_id:51,details_json:JSON.stringify({claim_receipt:33,listing_id:'12345',listing_state:'draft',provider_get_only:true,local_link_only:true,publication_performed:false})};
const safe={action:'close',operator_note:'Checked the existing Etsy draft verification receipt manually.',confirmed_no_retry:true,confirmed_no_publication:true,us_shipping_disabled:true,confirmed_build400_verified_unpublished_draft:true};
test('claimed remote outcomes with no verification remain held without retry',()=>{
 const out=outcomeState({claim,draft});
 assert.equal(out.state,'REMOTE_ATTEMPT_OUTCOME_UNKNOWN_HOLD');assert.equal(out.no_retry_allowed,true);
 assert.equal(out.can_close_with_proof,false);assert.equal(out.can_open_hold,true);
 assert.equal(caseDecisionValid({action:'close',status:out,body:safe}),false);
 assert.equal(caseDecisionValid({action:'hold',status:out,body:{...safe,action:'hold'}}),true);
});
test('no claim is NOT_ATTEMPTED, never a false verified Etsy remote listing',()=>{
 const s=outcomeState({draft,verified});assert.equal(s.state,'NOT_ATTEMPTED');
 assert.equal(s.can_close_with_proof,false);assert.equal(s.provider_verification_snapshot,false);
});
test('strong verified Build 400 receipt allows only operator local case close',()=>{
 assert.equal(verifiedDraftEvidence({claim,verified,draft}),true);
 const o=outcomeState({claim,verified,draft});
 assert.equal(o.state,'VERIFIED_DRAFT_PENDING_CASE_CLOSE');
 assert.equal(o.can_close_with_proof,true);assert.equal(o.provider_live_state_verified_now,false);
 assert.equal(caseDecisionValid({action:'close',status:o,body:safe}),true);
 const closed={admin_action_audit_id:78,details_json:JSON.stringify({outcome:CASE_ACTIONS.close,claim_receipt:33,verified_receipt:51,listing_id:'12345'})};
 const done=outcomeState({claim,verified,draft,latestCase:closed});
 assert.equal(done.state,'VERIFIED_CASE_CLOSED');assert.equal(done.can_close_with_proof,false);
 assert.equal(done.no_retry_allowed,true);assert.equal(done.publication_allowed,false);
});
test('mismatched, unpublished unknown, or forged provider receipts remain held',()=>{
 for(const fault of [{claim_receipt:1},{listing_id:'888'},{listing_state:'active'},{provider_get_only:false},{local_link_only:false},{publication_performed:true}]){
 const v={...JSON.parse(verified.details_json),...fault};
 const o=outcomeState({claim,verified:{...verified,details_json:JSON.stringify(v)},draft});
 assert.equal(o.state,'EVIDENCE_CONFLICT_HOLD');assert.equal(o.can_close_with_proof,false);
 }
 const staleClose={admin_action_audit_id:79,details_json:JSON.stringify({outcome:CASE_ACTIONS.close,claim_receipt:33,verified_receipt:50,listing_id:'12345'})};
 assert.equal(outcomeState({claim,verified,draft,latestCase:staleClose}).state,'VERIFIED_DRAFT_PENDING_CASE_CLOSE');
});
test('snapshot token updates when claims, linked listing or prior case changes',()=>{
 const base={productId:54,draft,claim,verified,latestCase:null,trial:null,sourceFingerprint:'abcd1234'};
 for(const d of [{draft:{...draft,external_reference:'45678'}},{claim:{admin_action_audit_id:40}},
 {verified:{admin_action_audit_id:90}},{latestCase:{admin_action_audit_id:90}},{sourceFingerprint:'different'}]){
 assert.notEqual(evidenceToken(base),evidenceToken({...base,...d}));
 }
});
test('endpoint is Storefront Admin and never contacts any remote provider or clears claims',()=>{
 const api=f('functions/api/admin/provider-draft-recovery-410.js');
 assert.equal(moduleKeyForPath('/api/admin/provider-draft-recovery-410'),MODULE_KEYS.STOREFRONT);
 assert.match(api,/verifiedAdminFromModule/);assert.match(api,/admin_action_audit/);
 assert.match(api,/caseDecisionValid/);assert.match(api,/Build 400/);
 assert.doesNotMatch(api,/\bfetch\s*\(|api\.etsy\.com|graph\.facebook\.com|DELETE FROM marketplace_syndication_drafts|DELETE FROM admin_action_audit|UPDATE marketplace_syndication_drafts/);
 const js=f('public/js/admin-provider-draft-recovery-v410.js');
 const html=f('admin/it-integrations/index.html');
 assert.match(js,/addEventListener\('click'/);assert.doesNotMatch(js,/setInterval|setTimeout/);
 assert.match(html,/id="etsy410"/);assert.match(html,/admin-provider-draft-recovery-v410\.js/);
});
