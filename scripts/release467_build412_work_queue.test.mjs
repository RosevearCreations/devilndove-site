import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {currentAssignment,currentReview,reviewEligibility,queueEntry,localSourceReview,assigneeId,noteValid} from '../functions/api/_lib/providerWorkQueue412.mjs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const draft={id:'11111111-1111-4111-8111-111111111111',product_id:54,channel_key:'etsy',external_reference:'12345',status:'needs_review',updated_at:'2026-10-16 12:00:00'};
const product={product_id:54,name:'Soap',price_cents:900,inventory_quantity:2},claim={admin_action_audit_id:33};
const proof={admin_action_audit_id:40,details_json:'{"claim_receipt":33,"listing_id":"12345","listing_state":"draft","provider_get_only":true,"local_link_only":true,"publication_performed":false}'};
const closed={admin_action_audit_id:50,details_json:'{"outcome":"CLOSED_WITH_VERIFIED_DRAFT_PROOF","claim_receipt":33,"verified_receipt":40,"listing_id":"12345"}'};
const pref={admin_action_audit_id:15,details_json:'{"etsy":true}'},policy={admin_action_audit_id:16,details_json:'{"us_shipping_disabled":true}'};
const escalation={admin_action_audit_id:65,details_json:'{"decision":"OPEN_OWNER_REVIEW","destination":"etsy","draft_id":"11111111-1111-4111-8111-111111111111","product_id":54,"outcome":"REMOTE_ATTEMPT_OUTCOME_UNKNOWN_HOLD"}'};
const assignment={admin_action_audit_id:70,details_json:'{"assignee_user_id":5,"escalation_receipt":65,"assigned_by_user_id":2}'};
const ack={owner_note:'Reviewed original verified unpublished draft; no marketplace change.',no_provider_retry:true,no_publication:true,us_shipping_suspended:true,confirm_matching_build400_receipt:true,confirm_matching_build410_closure:true,confirm_local_only_review:true};
test('Active Admin assignment identifiers must be positive and normalized',()=>{
 assert.equal(assigneeId(5),true);assert.equal(assigneeId('05'),false);
 for(const v of [0,-1,'x',1.5,' 5','',null])assert.equal(assigneeId(v),false,String(v));
 assert.equal(noteValid(ack.owner_note),true);assert.equal(noteValid('too short'),false);
});
test('queue keeps OPEN escalation and never confuses assignment with publication approval',()=>{
 const item=queueEntry(escalation,assignment,null);
 assert.equal(item.status,'OPEN_OWNER_REVIEW');assert.equal(item.assignee_user_id,5);
 assert.equal(item.publication_allowed,false);assert.equal(item.automatic_retry,false);
 const mismatch=queueEntry({...escalation,admin_action_audit_id:68},assignment,null);
 assert.equal(mismatch.assignee_user_id,null);
});
test('Only assigned active Admin can acknowledge a previously closed & verified local Etsy draft',()=>{
 const result=localSourceReview({destination:'etsy',product,draft,claim,verified:proof,caseReceipt:closed,policyReceipt:policy,channelIntent:pref,latestEscalation:escalation,
 latestSnapshot:{admin_action_audit_id:66,created_at:new Date().toISOString(),details_json:'{}'}});
 const {state}=result,asg=currentAssignment(assignment);
 assert.equal(state.outcome,'VERIFIED_CASE_CLOSED');
 const gov={source_matches_snapshot:true,review_due:false},esc={status:'OPEN_OWNER_REVIEW',receipt:65};
 const params={destination:'etsy',state,escalation:esc,governance:gov,assignment:asg,reviewerId:5,assigneeActive:true,decision:'review',body:ack};
 assert.equal(reviewEligibility(params),true);
 assert.equal(reviewEligibility({...params,assignment:{...asg,claimed_escalation_receipt:60}}),false);
 for(const change of [{reviewerId:9},{assigneeActive:false},{destination:'facebook'},{governance:{...gov,review_due:true}},
 {body:{...ack,confirm_matching_build400_receipt:false}},{body:{...ack,no_publication:false}}])
 assert.equal(reviewEligibility({...params,...change}),false,JSON.stringify(change));
});
test('Unknown Etsy or Facebook cases can only receive HOLD, never local evidence approval',()=>{
 const states=[
 localSourceReview({destination:'etsy',product,draft:{...draft,external_reference:null},claim,verified:null,caseReceipt:null,
 policyReceipt:policy,channelIntent:pref,latestEscalation:escalation}).state,
 localSourceReview({destination:'facebook',product,policyReceipt:policy,channelIntent:pref,latestEscalation:escalation}).state];
 for(const state of states){
 const params={destination:state.destination,state,escalation:{status:'OPEN_OWNER_REVIEW',receipt:65},
 governance:{source_matches_snapshot:true,review_due:false},assignment:currentAssignment(assignment),reviewerId:5,
 assigneeActive:true,body:ack};
 assert.equal(reviewEligibility({...params,decision:'review'}),false);
 assert.equal(reviewEligibility({...params,decision:'hold'}),true);
 }
});
test('412 route is Storefront Admin with bounded queue, durable request-key CAS and zero provider calls',()=>{
 const api=file('functions/api/admin/provider-work-queue-412.js'),ui=file('public/js/admin-provider-work-queue-v412.js'),html=file('admin/it-integrations/index.html');
 assert.equal(moduleKeyForPath('/api/admin/provider-work-queue-412'),MODULE_KEYS.STOREFRONT);
 assert.match(api,/verifiedAdminFromModule/);assert.match(api,/ACTIVE_ADMINS/);
 assert.match(api,/LIMIT 100/);assert.match(api,/candidates\.length>=20/);
 assert.match(api,/expected_assignment_receipt/);assert.match(api,/expected_review_receipt/);
 assert.match(api,/NOT EXISTS/);assert.doesNotMatch(api,/\bfetch\s*\(|api\.etsy\.com|graph\.facebook\.com|UPDATE marketplace_syndication_drafts|DELETE FROM admin_action_audit/);
 assert.match(ui,/addEventListener\('click'/);assert.doesNotMatch(ui,/setInterval|setTimeout/);
 assert.match(html,/id="provider412"/);assert.match(html,/admin-provider-work-queue-v412\.js/);
});
