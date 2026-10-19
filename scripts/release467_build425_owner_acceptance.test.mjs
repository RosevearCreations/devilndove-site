import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ACCEPT_TYPE,ACCEPT_CHOICE,reviewOwnerAcceptance425,canRecordAcceptance425} from '../functions/api/_lib/providerOwnerAcceptance425.mjs';
const receipts={escalation:10,assignment:20,handoff:0,followup:30,completion:31,route:0,governance:0};
const source=()=>({ok:true,build:424,read_only:true,manual_review_only:true,
 product_id:12,destination:'facebook',current_owner_user_id:7,
 current_source_signature:'abc12345',current_receipts:{...receipts},
 review:{build:424,read_only:true,local_only:true,provider_called:false,
  automatic_closure:false,publication_performed:false,us_shipping_suspended:true,
  handoff_acceptance_review_ready:true,source_decision_receipt:40,
  source_owner_ack_receipt:50,source_handoff_receipt:0}});
const row=(id,prev=0,overrides={})=>({
 admin_action_audit_id:id,actor_user_id:7,action_type:ACCEPT_TYPE,created_at:'2026-10-19',
 details_json:JSON.stringify({action:'accept_owner_handoff_review',choice:ACCEPT_CHOICE,
  actor_user_id:7,owner_note:'I reviewed this handoff receipt thoroughly.',
  request_key:'abcde12345_abcde12345',source_signature:'abc12345',
  expected_receipts:receipts,expected_decision_receipt:40,
  expected_owner_ack_receipt:50,expected_handoff_receipt:0,
  previous_acceptance_receipt:prev,local_only:true,
  provider_called:false,publication_performed:false,notifications_sent:false,
  automatic_closure:false,automatic_reopen:false,owner_reassignment_performed:false,
  external_provider_verified:false,closure_permitted:false,us_shipping_suspended:true,...overrides})
});
const input=(r=reviewOwnerAcceptance425({source:source(),rows:[],scanComplete:true,viewer:7}))=>({
 action:'accept_owner_handoff_review',choice:ACCEPT_CHOICE,
 request_key:'some_acceptable_idempotency_key_34',owner_note:'I inspected the source receipts before acceptance.',
 expected_source_signature:'abc12345',expected_receipts:{...receipts},
 expected_decision_receipt:r.source_decision_receipt,
 expected_owner_ack_receipt:r.source_owner_ack_receipt,
 expected_handoff_receipt:r.source_handoff_receipt,
 expected_previous_acceptance_receipt:r.latest_acceptance_receipt,
 confirm_local_only:true,confirm_no_provider_action:true,confirm_no_publication:true,
 confirm_no_auto_closure:true,confirm_separate_manual_closure:true,
 confirm_us_shipping_suspended:true
});
test('eligible first owner receipt needs exact explicit confirmation',()=>{
 const r=reviewOwnerAcceptance425({source:source(),rows:[],scanComplete:true,viewer:7});
 assert.equal(r.status,'AWAITING_EXPLICIT_OWNER_ACCEPTANCE');
 assert.equal(r.accept_enabled,true);
 assert.equal(canRecordAcceptance425({source:source(),state:r,body:input(r),viewer:7}).allowed,true);
 assert.equal(r.manual_closure_audit.closure_authorized,false);
 assert.equal(r.manual_closure_audit.independent_provider_evidence_verified,false);
});
test('saved local acceptance remains a HOLD for actual provider closure',()=>{
 const r=reviewOwnerAcceptance425({source:source(),rows:[row(60)],scanComplete:true,viewer:7});
 assert.equal(r.status,'LOCAL_OWNER_ACCEPTANCE_RECORDED');
 assert.equal(r.acceptance_record_current,true);
 assert.equal(r.manual_closure_audit.closure_authorized,false);
 assert.equal(r.provider_called,false);
});
test('owner mismatch, source holds, receipt staleness and truncated scans block',()=>{
 const wrongOwner=reviewOwnerAcceptance425({source:source(),rows:[],scanComplete:true,viewer:8});
 assert.ok(wrongOwner.holds.includes('CURRENT_ASSIGNED_OWNER_REQUIRED'));
 const s=source();s.review.handoff_acceptance_review_ready=false;
 assert.ok(reviewOwnerAcceptance425({source:s,rows:[],scanComplete:true,viewer:7}).holds.includes('SOURCE_HANDOFF_ACCEPTANCE_HOLD'));
 const stale=reviewOwnerAcceptance425({source:source(),rows:[row(60,0,{source_signature:'deadbeef'})],scanComplete:true,viewer:7});
 assert.ok(stale.holds.includes('ACCEPTANCE_RECEIPT_STALE'));
 const capped=reviewOwnerAcceptance425({source:source(),rows:[row(60)],scanComplete:false,viewer:7});
 assert.ok(capped.holds.includes('ACCEPTANCE_SCAN_INCOMPLETE'));
});
test('tampered acceptance, broken chains, and unsafe external claims fail closed',()=>{
 const invalid=reviewOwnerAcceptance425({source:source(),rows:[row(60,0,{closure_permitted:true})],scanComplete:true,viewer:7});
 assert.ok(invalid.holds.includes('INVALID_LOCAL_ACCEPTANCE_RECEIPT'));
 const chain=reviewOwnerAcceptance425({source:source(),rows:[row(62,99),row(60,0)],scanComplete:true,viewer:7});
 assert.ok(chain.holds.includes('ACCEPTANCE_CHAIN_BROKEN'));
 const s=source();s.review.provider_called=true;
 assert.ok(reviewOwnerAcceptance425({source:s,rows:[],scanComplete:true,viewer:7}).holds.includes('SOURCE_424_UNTRUSTED'));
});
test('stale decision and missing separate closure attestation reject POST',()=>{
 const s=source(),state=reviewOwnerAcceptance425({source:s,rows:[],scanComplete:true,viewer:7});
 const bad=input(state);bad.expected_decision_receipt=41;bad.confirm_separate_manual_closure=false;
 const x=canRecordAcceptance425({source:s,state,body:bad,viewer:7});
 assert.equal(x.allowed,false);
 assert.ok(x.holds.includes('ACCEPTANCE_PROVENANCE_STALE'));
 assert.ok(x.holds.includes('EXPLICIT_OWNER_CONFIRMATIONS_REQUIRED'));
 assert.equal(canRecordAcceptance425({source:s,state,body:input(state),viewer:8}).allowed,false);
});
test('route and UI scoped, POST is conditional audit-only INSERT',async()=>{
 const api=readFileSync(new URL('../functions/api/admin/provider-owner-acceptance-425.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
 const {moduleKeyForPath,MODULE_KEYS}=await import('../functions/api/_lib/appModuleRoutes.js');
 assert.equal(moduleKeyForPath('/api/admin/provider-owner-acceptance-425'),MODULE_KEYS.STOREFRONT);
 assert.match(api,/verifiedAdminFromModule/);
 assert.match(api,/onRequestGet as read424/);
 assert.match(api,/LIMIT 101/);
 assert.match(api,/NOT EXISTS/);
 assert.match(api,/INSERT INTO admin_action_audit/);
 assert.doesNotMatch(api,/UPDATE admin_action_audit|DELETE FROM admin_action_audit|fetch\s*\(/);
 assert.match(html,/admin-provider-owner-acceptance-v425\.js/);
});
