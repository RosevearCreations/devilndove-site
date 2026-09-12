import assert from 'node:assert/strict';
import { buildAccountantMonthEndEvidenceDepth, MONTH_END_EVIDENCE_CHECK_IDS } from '../functions/api/_lib/accountantMonthEndEvidenceDepth.js';

const base=()=>({schema_ready:true,payment:{summary:{order_count:2,outstanding_cents:0}},hst_review:{review_status:'reviewed',net_tax_payable_cents:0,remittance_status:'not_ready',remittance_evidence_url:''},closure:{close_checklist:{bank_reconciled:1,sales_tax_reviewed:1,receipts_attached:1,gifi_reviewed:1,schedule_141_notes_started:1,accountant_followup_flagged:0}},evidence_attachments:[{accounting_evidence_attachment_id:1,evidence_kind:'receipt',title:'Supplier receipt',evidence_url:'https://example.invalid/receipt',attachment_status:'active'}],export_packages:[{package_key:'2026-09',package_status:'draft'}],close_readiness:{ready:true,blockers:[]}});

assert.equal(MONTH_END_EVIDENCE_CHECK_IDS.length,11);
const ready=buildAccountantMonthEndEvidenceDepth('2026-09',base());
assert.equal(ready.state,'ready');
assert.equal(ready.summary.blocked_count,0);
assert.equal(ready.boundaries.accounting_posting,false);
assert.equal(ready.boundaries.period_close,false);
assert.equal(ready.boundaries.automatic_export,false);

const receivable=base();receivable.payment.summary.outstanding_cents=2500;receivable.close_readiness={ready:false,blockers:['Outstanding balance']};
const blocked=buildAccountantMonthEndEvidenceDepth('2026-09',receivable);
assert.equal(blocked.state,'blocked');
assert.ok(blocked.checks.some(row=>row.id==='outstanding-payments'&&row.state==='blocked'));

const tax=base();tax.hst_review={review_status:'reviewed',net_tax_payable_cents:12000,remittance_status:'not_ready',remittance_evidence_url:''};
const taxResult=buildAccountantMonthEndEvidenceDepth('2026-09',tax);
assert.ok(taxResult.checks.some(row=>row.id==='tax-remittance-evidence'&&row.state==='review'));

const badAttachment=base();badAttachment.evidence_attachments=[{accounting_evidence_attachment_id:2,evidence_kind:'',title:'',evidence_url:'',object_key:'',attachment_status:'active'}];
const evidenceResult=buildAccountantMonthEndEvidenceDepth('2026-09',badAttachment);
assert.ok(evidenceResult.summary.attachment_issue_count>=3);
assert.ok(evidenceResult.checks.some(row=>row.id==='attachment-integrity'&&row.state==='review'));

const notes=base();notes.closure.close_checklist.gifi_reviewed=0;notes.closure.close_checklist.schedule_141_notes_started=0;
const notesResult=buildAccountantMonthEndEvidenceDepth('2026-09',notes);
assert.ok(notesResult.checks.some(row=>row.id==='gifi-review'&&row.state==='review'));
assert.ok(notesResult.checks.some(row=>row.id==='schedule-141-notes'&&row.state==='review'));

const noPackage=base();noPackage.export_packages=[];
const packageResult=buildAccountantMonthEndEvidenceDepth('2026-09',noPackage);
assert.ok(packageResult.checks.some(row=>row.id==='accountant-export-package'&&row.state==='review'));

const schema=base();schema.schema_ready=false;schema.missing_tables=['accounting_evidence_attachments'];
assert.equal(buildAccountantMonthEndEvidenceDepth('2026-09',schema).state,'blocked');
assert.throws(()=>buildAccountantMonthEndEvidenceDepth('September 2026',base()),RangeError);
console.log('Release 467 Build 113 Accountant & Month-End Evidence Depth runtime proof: PASS');
