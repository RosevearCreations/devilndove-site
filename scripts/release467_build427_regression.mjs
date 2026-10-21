import assert from 'node:assert/strict';
import {independentClosureReadiness427} from '../functions/api/_lib/providerIndependentClosureReadiness427.mjs';
const source={ok:true,build:426,read_only:true,local_only:true,provider_called:false,
 automatic_closure:false,us_shipping_suspended:true,review:{build:426,read_only:true,local_only:true,
 continuity:{scan_complete:true,acceptance_record_current:true,latest_acceptance_receipt:17,current_source_signature:'abcdef12'},
 provenance:{independent_provider_evidence_verified:false,local_owner_receipts_only:true},
 manual_closure_gate:{authorized:false,separate_human_decision_required:true,external_provider_verification_required:true},
 holds:['INDEPENDENT_PROVIDER_EVIDENCE_NOT_VERIFIED','EXPLICIT_SEPARATE_HUMAN_CLOSURE_DECISION_REQUIRED']}};
const good=independentClosureReadiness427(source);
assert.equal(good.build,427);assert.equal(good.reviewed_acceptance_receipt,17);
assert.equal(good.human_closure_authorized,false);assert.equal(good.independent_provider_verified,false);
assert.equal(good.provider_called,false);assert.equal(good.automatic_closure,false);
assert.equal(good.us_shipping_suspended,true);
assert(good.holds.includes('PROVIDER_EVIDENCE_MUST_BE_INDEPENDENTLY_VERIFIED'));
assert(independentClosureReadiness427(null).holds.includes('BUILD_426_SOURCE_UNTRUSTED'));
const falsified=independentClosureReadiness427({...source,review:{...source.review,manual_closure_gate:{authorized:true}}});
assert(falsified.holds.includes('CLOSURE_GUARD_UNTRUSTED'));
console.log('Build 427 independent manual closure hold proof PASS');
