import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {verifyHandoffChain,governanceProof,followupProof,completionProof,exceptionReasons,routeStatus,canRecord} from '../functions/api/_lib/providerCompletion414.mjs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const f=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const assignment={receipt:77,assignee_user_id:7},people=[{user_id:5},{user_id:7}],escalationReceipt=64;
const safe={owner_note:'Owner manually verified the saved local follow-up plan.',no_provider_retry:true,no_publication:true,us_shipping_suspended:true,
confirm_local_followup_completed:true,confirm_no_provider_completion_claim:true,confirm_manual_exception_review:true,confirm_verified_handoff_chain:true};
const req={admin_action_audit_id:95,details_json:'{"action":"request_handoff","from_user_id":5,"target_user_id":7,"escalation_receipt":64,"provider_called":false,"publication_performed":false}'};
const ack={admin_action_audit_id:99,details_json:'{"action":"ack_handoff","from_user_id":5,"target_user_id":7,"escalation_receipt":64,"request_receipt":95,"base_assignment_receipt":77,"provider_called":false,"publication_performed":false}'};
const followupRow={admin_action_audit_id:108,details_json:'{"action":"record_followup","escalation_receipt":64,"assignment_receipt":77,"plan":"GATHER_LOCAL_EVIDENCE","confirmed_manual_owner_followup":true,"provider_called":false,"publication_performed":false}'};
const govRow={admin_action_audit_id:110,details_json:'{"action":"verify_handoff","escalation_receipt":64,"assignment_receipt":77,"handoff_ack_receipt":99,"handoff_request_receipt":95,"reviewer_user_id":7,"provider_called":false}'};
test('handoff chain fails closed if missing original request, mismatched target or reassignment',()=>{
 const h={status:'ACKNOWLEDGED',request_receipt:95,receipt:99};
 const good=verifyHandoffChain({handoff:h,ackRow:ack,requestRow:req,assignment,escalationReceipt});
 assert.equal(good.status,'VERIFIED_HANDOFF_CHAIN');assert.equal(good.verified,true);
 assert.equal(verifyHandoffChain({handoff:h,ackRow:ack,requestRow:null,assignment,escalationReceipt}).verified,false);
 assert.equal(verifyHandoffChain({handoff:h,ackRow:ack,requestRow:req,assignment:{receipt:78,assignee_user_id:7},escalationReceipt}).verified,false);
 assert.equal(verifyHandoffChain({handoff:{status:'PENDING_REASSIGNMENT'},ackRow:ack,requestRow:req,assignment,escalationReceipt}).verified,false);
 assert.equal(verifyHandoffChain({handoff:{status:'NONE'},assignment,escalationReceipt}).status,'NOT_REQUIRED');
});
test('governance receipt must refer to exact verified handoff ack and current assignment',()=>{
 const chain=verifyHandoffChain({handoff:{status:'ACKNOWLEDGED'},ackRow:ack,requestRow:req,assignment,escalationReceipt});
 const p=governanceProof({row:govRow,handoffChain:chain,assignment,escalationReceipt});
 assert.equal(p.verified,true);
 assert.equal(governanceProof({row:govRow,handoffChain:chain,assignment:{receipt:88,assignee_user_id:7},escalationReceipt}).verified,false);
 assert.equal(governanceProof({row:govRow,handoffChain:{...chain,verified:false},assignment,escalationReceipt}).verified,false);
});
test('completion is a local evidence receipt, cannot bypass 413 plan or acknowledged handoff governance',()=>{
 const followup=followupProof({row:followupRow,assignment,escalationReceipt});
 assert.equal(followup.verified,true);
 const handoff={status:'VERIFIED_HANDOFF_CHAIN',verified:true,request_receipt:95,ack_receipt:99};
 const governance={verified:true,receipt:110};
 const row={admin_action_audit_id:120,details_json:JSON.stringify({action:'complete_followup',escalation_receipt:64,assignment_receipt:77,followup_receipt:108,governance_receipt:110,source_signature:'abcdef12',confirm_local_followup_completed:true,provider_called:false,publication_performed:false})};
 assert.equal(completionProof({row,followup,assignment,escalationReceipt,sourceSignature:'abcdef12',handoff,governance}).current,true);
 assert.equal(completionProof({row,followup:{...followup,verified:false},assignment,escalationReceipt,sourceSignature:'abcdef12',handoff,governance}).current,false);
 assert.equal(completionProof({row,followup,assignment,escalationReceipt,sourceSignature:'different',handoff,governance}).current,false);
 assert.equal(completionProof({row,followup,assignment,escalationReceipt,sourceSignature:'abcdef12',handoff,governance:{...governance,verified:false}}).current,false);
});
test('manual SLA exception route exposes reasons but never issues alerts or changes provider state',()=>{
 const issues=exceptionReasons({sla:{status:'FOLLOWUP_DUE',initial_overdue:true,followup_overdue:true},
 escalationOpen:true,assignedActive:false,assignment:{receipt:0,assignee_user_id:null},sourceCurrent:false,
 handoff:{status:'HANDOFF_NOT_ACKNOWLEDGED',verified:false},governance:{verified:false},
 followup:{verified:false},completion:{current:false}});
 assert.deepEqual(issues,['INITIAL_REVIEW_SLA_DUE','OWNER_FOLLOWUP_SLA_DUE','NO_ACTIVE_ASSIGNED_ADMIN','SOURCE_EVIDENCE_STALE','HANDOFF_GOVERNANCE_INCOMPLETE','FOLLOWUP_PLAN_MISSING_OR_STALE']);
 const routed=routeStatus({row:{admin_action_audit_id:50,details_json:'{"action":"route_exception","escalation_receipt":64,"assignment_receipt":0,"followup_receipt":0,"source_signature":"abc12345","provider_called":false,"route_choice":"OWNER_MANUAL_REVIEW","route_to_user_id":5}'},
 escalationReceipt,assignment:{receipt:0},followup:{receipt:0},sourceSignature:'abc12345'});
 assert.equal(routed.status,'ROUTED_FOR_MANUAL_REVIEW');assert.equal(routed.routed_to_user_id,5);
 assert.equal(canRecord({action:'route_exception',escalationOpen:true,issues,admins:people,assignment:{receipt:0},
 body:{...safe,route_choice:'OWNER_MANUAL_REVIEW',route_to_user_id:5}}),true);
 assert.equal(canRecord({action:'route_exception',escalationOpen:true,issues:[],admins:people,assignment:{receipt:0},
 body:{...safe,route_choice:'OWNER_MANUAL_REVIEW',route_to_user_id:5}}),false);
});
test('only assigned active Admin can complete after strict handoff or no-handoff path',()=>{
 const base={viewer:7,admins:people,assignment,escalationOpen:true,sourceCurrent:true,
 handoff:{status:'VERIFIED_HANDOFF_CHAIN',verified:true},
 governance:{verified:true},followup:{verified:true},completion:{current:false},issues:[],body:safe};
 assert.equal(canRecord({...base,action:'complete_followup'}),true);
 assert.equal(canRecord({...base,action:'complete_followup',viewer:5}),false);
 assert.equal(canRecord({...base,action:'complete_followup',handoff:{status:'HANDOFF_NOT_ACKNOWLEDGED',verified:false}}),false);
 assert.equal(canRecord({...base,action:'complete_followup',governance:{verified:false}}),false);
 assert.equal(canRecord({...base,action:'verify_handoff'}),true);
 assert.equal(canRecord({...base,action:'complete_followup',handoff:{status:'NOT_REQUIRED',verified:true}}),true);
 assert.equal(canRecord({...base,action:'complete_followup',body:{...safe,confirm_no_provider_completion_claim:false}}),false);
});
test('bounded Admin-only endpoint uses D1 audit CAS and never calls provider or sends alerts',()=>{
 const api=f('functions/api/admin/provider-completion-414.js'),js=f('public/js/admin-provider-completion-v414.js'),html=f('admin/it-integrations/index.html');
 assert.equal(moduleKeyForPath('/api/admin/provider-completion-414'),MODULE_KEYS.STOREFRONT);
 assert.match(api,/verifiedAdminFromModule/);assert.match(api,/LIMIT 100/);assert.match(api,/items.length>=20/);
 assert.match(api,/NOT EXISTS/);assert.match(api,/expected_receipts/);assert.match(api,/admin_action_audit/);
 assert.doesNotMatch(api,/\bfetch\s*\(|api\.etsy\.com|graph\.facebook\.com|DELETE FROM admin_action_audit|UPDATE marketplace_syndication_drafts/);
 assert.match(js,/addEventListener\('click'/);assert.doesNotMatch(js,/setInterval|setTimeout/);
 assert.match(html,/id="provider414"/);assert.match(html,/admin-provider-completion-v414\.js/);
});
