import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceVerifiedOwnerReview721} from '../functions/api/admin/_lib/projectFinanceEvidence.js';
import {lifecycleEvidence721} from '../functions/api/admin/production-variable-audit-406.js';
const m={queue_id:12,master_fresh:true,history_complete:true,open_cases:[],
 source_revision:'orig-master-rev-12',fingerprint_sha256:'a'.repeat(64)};
const row={original_711_renewal_receipt_id:51,
 original_716_signed_ninth_receipt_id:61,
 original_717_signed_outside_receipt_id:71,
 ninth_signature_age_hours:1,external_signed_source_age_hours:1,
 external_followup_independently_signed:true,
 independent_external_sla_followup_attested:true,actual_financial_close:false};
const original={campaign_queue_id:12,history_complete:true,invalid_count:0,
 outstanding_original_ninth_signed_source_count:0,
 outstanding_outside_signed_source_count:0,
 outside_sla_signed_unresolved_exception_count:0,
 distinct_external_verifier_configured:true,items:[row]};
const ok=sourceVerifiedOwnerReview721(original,m);
assert.equal(ok.ready,true);
assert.equal(ok.eligible_items[0].outside_signed_receipt_id,71);
assert.equal(ok.financial_books_closed,false);
assert.equal(ok.owner_approval_recorded_by_this_read,false);
for(const update of [
 {history_complete:false},{invalid_count:1},
 {outstanding_original_ninth_signed_source_count:1},
 {outstanding_outside_signed_source_count:1},
 {outside_sla_signed_unresolved_exception_count:1},
 {distinct_external_verifier_configured:false},
 {items:[{...row,external_followup_independently_signed:false}]},
 {items:[{...row,independent_external_sla_followup_attested:false}]},
 {items:[{...row,ninth_signature_age_hours:72}]},
 {items:[{...row,external_signed_source_age_hours:72}]},
 {items:[{...row,external_signed_source_age_hours:null}]},
 {items:[{...row,original_717_signed_outside_receipt_id:61}]},
 {items:[row,row]},
 {items:[]}
])assert.equal(sourceVerifiedOwnerReview721({...original,...update},m).ready,false,JSON.stringify(update));
assert.equal(sourceVerifiedOwnerReview721(original,{...m,master_fresh:false}).ready,false);
assert.equal(sourceVerifiedOwnerReview721(original,{...m,open_cases:['HOLD']}).ready,false);
assert.equal(sourceVerifiedOwnerReview721(original,{...m,source_revision:''}).ready,false);
assert.equal(sourceVerifiedOwnerReview721(original,{...m,fingerprint_sha256:'invalid'}).ready,false);
const secret='never-print-this-secret-721';
const cred=lifecycleEvidence721({SESSION_SECRET:secret,ETSY_API_KEYSTRING:secret,
 ETSY_SHARED_SECRET:secret,ETSY_REDIRECT_URI:'https://devilndove.com/api/social/oauth/etsy/callback'});
assert.equal(cred.build,721);
assert.equal(cred.credential_values_exposed,0);
assert.equal(cred.issuer_account_access_performed,false);
assert.equal(cred.automatic_rotation,false);
assert.equal(cred.cross_app_connected,false);
assert.equal(cred.provider_states.find(x=>x.provider==='etsy').issuer_rotation_receipt,'NOT_VERIFIED');
assert.equal(cred.provider_states.find(x=>x.provider==='etsy').credential_age_status,'UNKNOWN_NO_ISSUER_RECORD');
assert.ok(!JSON.stringify(cred).includes(secret));
for(const [path,needle] of [
 ['functions/api/admin/social-post-queue.js','export async function finance718'],
 ['functions/api/admin/social-post-queue.js','export async function financial685'],
 ['functions/api/admin/production-variable-audit-406.js','owner_original_source_review_721'],
 ['functions/api/admin/production-variable-audit-406.js','WHERE NOT EXISTS'],
 ['functions/api/admin/production-variable-audit-406.js','owner_review_checked===true'],
 ['functions/api/admin/production-variable-audit-406.js','financial_books_closed:false'],
 ['public/js/admin-production-variable-audit-v406.js','dd721Record'],
 ['admin/it-integrations/index.html','dd721-credential-custody'],
 ['docs/operations/BUILD_721_CREDENTIAL_CUSTODY_OWNER_LEDGER.md','CROSS_APP_CONNECTIVITY=NOT_VERIFIED']]){
 const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 assert.ok(source.includes(needle),'Missing protected original source contract: '+path+' '+needle);
}
console.log('Build 721 issuer lifecycle, independent custody 72h renewal and Admin ledger HOLD regression: PASS');
