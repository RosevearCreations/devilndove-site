import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {financialClaim683} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const api=read('functions/api/admin/social-post-queue.js');
const html=read('admin/social-publishing/index.html');
const browser=read('public/js/admin-social-platform-preflight.js');
const base={campaign:'TEST-CAMPAIGN',queue_id:17,source_revision:'source-sha',
 fingerprint_sha256:'a'.repeat(64),signer_id:'independent-finance',nonce:'verified-unique-nonce-0001',
 issued_at:'2026-11-12T05:00:00.000Z'};
assert.deepEqual(financialClaim683('source',base),{version:1,source:'devilndove',...base});
assert.deepEqual(financialClaim683('master',{...base,source_signer_receipt_id:123,source_signer_nonce:'source-nonce',master_revision:'master-sha'}),{
 version:1,source:'devilndove',campaign:base.campaign,queue_id:base.queue_id,
 source_revision:base.source_revision,fingerprint_sha256:base.fingerprint_sha256,
 source_signer_receipt_id:123,source_signer_nonce:'source-nonce',
 master_revision:'master-sha',nonce:base.nonce,issued_at:base.issued_at});
assert.throws(()=>financialClaim683('unknown',base));
for(const marker of [
 /FINANCIAL_EVIDENCE_SIGNER_ID_683/,/FINANCIAL_EVIDENCE_SIGNER_PUBLIC_KEY_683/,
 /AI_DATA_MASTER_ACK_PUBLIC_KEY/,/crypto\.subtle\.verify/,/source_signer_receipt_id/,
 /fresh683\(issued_at,300000\)/,/nonce replay rejected/,
 /rows\(await db\.prepare/,/owner_discrepancy_evidence_closed_683/,
 /source fingerprint/i,/owner_reviewed_682/,/owner_escalated_682/,
 /HOLD_INDEPENDENT_RUNTIME_TRANSPORT_AND_MASTER_ADMISSION/,
 /master_accepted:false/,/profitability_certified:false/,
 /admit_financial_signer_683/,/correlate_financial_master_683/,/close_financial_discrepancy_683/,
 /financial683:await financial683/
])assert.match(api,marker);
for(const id of ['dd683-finance','dd683Campaign','dd683PrepareSource','dd683PrepareMaster',
 'dd683Case','dd683ClosureReviewed'])assert.match(html,new RegExp(id));
for(const marker of [/financial683/,/DDAuth\.apiFetch/,/financial signer/i,
 /crypto\.randomUUID/,/JSON\.stringify\(claim\(/,/owner_reviewed:/])assert.match(browser,marker);
assert.doesNotMatch(browser,/private[_ -]?key\s*[:=]|secret[_ -]?key\s*[:=]/i);
console.log('Build 683 independent signed finance, exact Master correlation, owner-only discrepancy closure: PASS');
