// Build 426 no-write and fail-closed provenance regression.
import assert from 'node:assert/strict';
import {boundedReview426} from '../functions/api/_lib/providerAcceptanceContinuity426.mjs';
const source = {
  ok:true,build:425,read_only:true,local_only:true,provider_called:false,
  automatic_closure:false,publication_performed:false,us_shipping_suspended:true,
  review:{
    build:425,scan_complete:true,acceptance_record_current:true,
    source_signature:'abcdef12',holds:[],latest_acceptance_receipt:7,
    history:[{receipt:7,previous_receipt:0,valid:true}],
    manual_closure_audit:{
      closure_authorized:false,independent_provider_evidence_verified:false,
      separate_human_closure_decision_required:true
    }
  }
};
const good = boundedReview426(source);
assert.equal(good.build,426);
assert.equal(good.continuity.latest_acceptance_receipt,7);
assert.equal(good.manual_closure_gate.authorized,false);
assert.equal(good.provenance.independent_provider_evidence_verified,false);
assert(good.holds.includes('INDEPENDENT_PROVIDER_EVIDENCE_NOT_VERIFIED'));
assert(good.holds.includes('EXPLICIT_SEPARATE_HUMAN_CLOSURE_DECISION_REQUIRED'));
assert.equal(good.provider_called,false);
assert.equal(good.automatic_closure,false);
assert.equal(good.publication_performed,false);
assert.equal(good.us_shipping_suspended,true);
const invalid = boundedReview426({...source,review:{...source.review,history:[{receipt:7,previous_receipt:5,valid:true}]}});
assert(invalid.holds.includes('ACCEPTANCE_CONTINUITY_BROKEN'));
const tampered = boundedReview426({...source,review:{...source.review,manual_closure_audit:{...source.review.manual_closure_audit,closure_authorized:true}}});
assert(tampered.holds.includes('MANUAL_CLOSURE_BOUNDARY_UNTRUSTED'));
const missing = boundedReview426(null);
assert(missing.holds.includes('OWNER_ACCEPTANCE_SOURCE_UNTRUSTED'));
assert.equal(missing.manual_closure_gate.authorized,false);
console.log('Build 426 bounded provenance: PASS');
