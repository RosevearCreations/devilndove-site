import test from 'node:test';
import assert from 'node:assert/strict';
import {mayApprove,TYPE} from '../functions/api/_lib/providerClosureApproval417.mjs';
const r={escalation:101,assignment:102,handoff:0,followup:103,completion:104,route:0,governance:0};
const packet={local_closure_review_ready:true,scan_complete:true,evidence_receipts:r};
const body={action:'approve_local_closure',confirm_local_only:true,confirm_no_provider_closure:true,confirm_no_publication:true,confirm_us_shipping_suspended:true,owner_note:'I reviewed the local escalation audit evidence manually.',request_key:'build417_key_123456',expected_source_signature:'abcd1234',expected_receipts:r};
test('requires explicit affirmative owner intent and current assignee',()=>{
 assert.equal(mayApprove({packet,viewer:7,assignee:7,body}).approved,true);
 assert.equal(mayApprove({packet,viewer:8,assignee:7,body}).approved,false);
 assert.equal(mayApprove({packet,viewer:7,assignee:7,body:{...body,confirm_no_provider_closure:false}}).approved,false);
});
test('rejects stale receipts, missing key, missing human explanation and incomplete scan',()=>{
 for(const props of [{packet:{...packet,scan_complete:false}},{body:{...body,expected_receipts:{...r,completion:99}}},{body:{...body,owner_note:'short'}},{body:{...body,request_key:'x'}}])
 assert.equal(mayApprove({packet,viewer:7,assignee:7,body,...props}).approved,false);
 assert.equal(TYPE,'provider_escalation_417_owner_approval');
});
