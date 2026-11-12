import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assess685} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-12T06:30:00.000Z');
const v={queue_id:42,campaign:'signed-campaign',source_revision:'release-sha',
 fingerprint_sha256:'f'.repeat(64),source_signer_receipt_id:11,
 enrollment_receipt_id:13,master_signed_receipt_id:12,master_revision:'master-sha',
 source_owner_accepted:true,source_blockers:[],signer_enrolled:true,
 receiver_configured:true,master_accepted:true};
const evidence={signature:'signature-owned-by-independent-master',
 checked_at:'2026-11-12T06:25:00.000Z',
 claim:{queue_id:42,campaign:'signed-campaign',source_revision:'release-sha',
 fingerprint_sha256:'f'.repeat(64),source_signer_receipt_id:11,enrollment_receipt_id:13,
 master_signed_receipt_id:12,master_revision:'master-sha',
 issued_at:'2026-11-12T06:24:00.000Z'}};
let x=assess685(v,evidence,now);
assert.equal(x.status,'VERIFIED_CURRENT');
assert.equal(x.master_fresh,true);
assert.equal(x.age_seconds,300);
assert.equal(x.expires_at,'2026-11-12T06:44:00.000Z');
assert.equal(assess685(v,null,now).status,'HOLD_MISSING_MASTER_RECEIPT');
assert.equal(assess685({...v,source_owner_accepted:false},evidence,now).status,'HOLD_SOURCE_REVIEW');
assert.equal(assess685({...v,source_blockers:['PROFITABILITY_HOLD']},evidence,now).status,'HOLD_SOURCE_REVIEW');
assert.equal(assess685({...v,signer_enrolled:false},evidence,now).status,'HOLD_SIGNER_ENROLLMENT');
assert.equal(assess685({...v,receiver_configured:false},evidence,now).status,'HOLD_MASTER_RECEIVER');
assert.equal(assess685(v,{...evidence,claim:{...evidence.claim,fingerprint_sha256:'0'.repeat(64)}},now).status,'HOLD_SOURCE_RECEIPT_DRIFT');
assert.equal(assess685(v,{...evidence,claim:{...evidence.claim,master_revision:'different'}},now).status,'HOLD_SOURCE_RECEIPT_DRIFT');
assert.equal(assess685(v,{...evidence,checked_at:'invalid'},now).status,'HOLD_INVALID_RECEIPT_CLOCK');
assert.equal(assess685(v,evidence,now+1200001).status,'HOLD_EXPIRED_MASTER_RECEIPT');
assert.equal(assess685({...v,master_accepted:false},evidence,now).status,'HOLD_SIGNATURE_REVALIDATION');
assert.equal(assess685({queue_id:0},null,now).status,'HOLD_SELECT_CAMPAIGN');
const backend=read('functions/api/admin/social-post-queue.js'),
 page=read('admin/social-publishing/index.html'),
 client=read('public/js/admin-social-platform-preflight.js'),
 pipeline=read('.github/workflows/current-application-quality.yml');
for(const m of [/async function financial685/,/async function revalidate685/,
 /async function recovery685/,/await accept684\(db,env,user,p\)/,
 /finance_exception_685/,/finance_acceptance_684/,/owner_reviewed!==true/,
 /p.expected_fingerprint_sha256!==v.fingerprint_sha256/,
 /v.verified_master_receipt_id<=original.opened_acceptance_receipt_id/,
 /finance_recovery-685|finance-recovery-/,/financial685:await financial685/,
 /revalidate_finance_master_685/,/owner_finance_recovery_685/,
 /connection:'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY'/])assert.match(backend,m);
for(const id of ['dd685-finance','dd685Campaign','dd685Refresh','dd685Clock',
 'dd685Status','dd685RecheckReviewed','dd685Revalidate','dd685Recovery',
 'dd685Case','dd685Decision','dd685Reviewed','dd685Result','dd685History'])assert.ok(page.includes('id="'+id+'"'),id);
assert.match(page,/\/public\/js\/admin-social-platform-preflight\.js/);
assert.match(client,/DDAuth\.apiFetch/);
assert.match(client,/setInterval\(clock,15000\)/);
assert.match(client,/revalidate_finance_master_685/);
assert.match(client,/owner_finance_recovery_685/);
assert.doesNotMatch(client,/FINANCIAL_MASTER_ACCEPTANCE_TOKEN|PRIVATE_KEY|AI_DATA_MASTER_ACK_PUBLIC_KEY|fetch\s*\(/);
assert.match(pipeline,/build685_financial_receipt_freshness_recovery_contract\.mjs/);
console.log('BUILD 685: read-only signed receipt aging, source drift, owner revalidation and newer-receipt exception closure: PASS');
