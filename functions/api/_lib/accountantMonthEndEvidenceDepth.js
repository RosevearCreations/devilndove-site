// Release 467 Build 113 — pure Accountant & Month-End Evidence Depth derivation.
// Existing Accounting authorities remain owners of posting, close, attachment and export actions.

export const MONTH_END_EVIDENCE_CHECK_IDS = Object.freeze([
  'bank-reconciliation',
  'sales-tax-review',
  'tax-remittance-evidence',
  'receipts-bills-evidence',
  'gifi-review',
  'schedule-141-notes',
  'accountant-followup',
  'outstanding-payments',
  'attachment-integrity',
  'accountant-export-package',
  'close-readiness',
]);

const text=(value)=>String(value??'').trim();
const n=(value)=>{const parsed=Number(value);return Number.isFinite(parsed)?parsed:0;};
const list=(value)=>Array.isArray(value)?value:[];
const yes=(value)=>value===true||value===1||value==='1'||text(value).toLowerCase()==='true';
const month=(value)=>/^\d{4}-(0[1-9]|1[0-2])$/.test(text(value))?text(value):'';
const check=(id,label,state,detail,ownerUrl,ownerLabel,evidence={})=>({id,label,state,detail,owner_url:ownerUrl,owner_label:ownerLabel,evidence});

function attachmentIssues(rows){
  const issues=[];
  for(const row of list(rows)){
    const label=text(row.title)||text(row.original_filename)||`Evidence ${row.accounting_evidence_attachment_id||''}`.trim()||'Evidence attachment';
    const refs=[text(row.evidence_url),text(row.object_key)].filter(Boolean);
    if(!text(row.evidence_kind)) issues.push({code:'attachment_kind_missing',label,detail:'Evidence kind is missing.'});
    if(!text(row.title)&&!text(row.original_filename)) issues.push({code:'attachment_label_missing',label,detail:'Evidence title/filename is missing.'});
    if(!refs.length) issues.push({code:'attachment_reference_missing',label,detail:'No URL or R2 object key is recorded.'});
    const status=text(row.attachment_status).toLowerCase();
    if(status&&status!=='active') issues.push({code:'attachment_not_active',label,detail:`Attachment status is ${status}.`});
    const size=n(row.file_size_bytes),mime=text(row.mime_type).toLowerCase();
    if(row.object_key&&size<=0) issues.push({code:'attachment_size_missing',label,detail:'R2-backed evidence has no positive file size.'});
    if(row.object_key&&mime&&mime!=='application/pdf'&&!mime.startsWith('image/')) issues.push({code:'attachment_binary_type_review',label,detail:`Binary evidence type ${mime} is not PDF/image bundle-safe.`});
  }
  return issues;
}

export function buildAccountantMonthEndEvidenceDepth(periodValue,close={}){
  const period=month(periodValue);
  if(!period) throw new RangeError('Month-end evidence period must use YYYY-MM.');
  const closure=close?.closure||{};
  const checklist=closure?.close_checklist||{};
  const hst=close?.hst_review||{};
  const payment=close?.payment||{};
  const attachments=list(close?.evidence_attachments);
  const packages=list(close?.export_packages);
  const closeReadiness=close?.close_readiness||{};
  const checks=[];

  if(close?.schema_ready===false){
    const missing=[...list(close?.missing_tables),...list(close?.missing_columns)];
    return {release:467,build:113,authority:'accountant-month-end-evidence-depth',period_month:period,state:'blocked',summary:{ready_count:0,review_count:0,blocked_count:1,check_count:1,attachment_count:attachments.length,export_package_count:packages.length},checks:[check('schema-readiness','Accounting evidence schema','blocked','Required Accounting evidence schema is incomplete.','/admin/deployment-preflight/','Open Deployment Preflight',{missing})],attachment_issues:[],boundaries:{read_only_projection:true,readiness_is_not_posting_authorization:true,accounting_posting:false,period_close:false,evidence_mutation:false,automatic_export:false,payment_execution:false,refund_execution:false,request_time_schema_mutation:false,r2_mutation:false,provider_execution:false}};
  }

  checks.push(check('bank-reconciliation','Bank reconciliation',yes(checklist.bank_reconciled)?'ready':'blocked',yes(checklist.bank_reconciled)?'Bank reconciliation is confirmed for the selected month.':'Bank reconciliation is not confirmed.','/admin/accounting/#accountingReconciliationCard','Open reconciliation',{bank_reconciled:yes(checklist.bank_reconciled)}));

  const hstStatus=text(hst.review_status).toLowerCase();
  const taxReviewed=yes(checklist.sales_tax_reviewed)||['reviewed','finalized','filed'].includes(hstStatus);
  checks.push(check('sales-tax-review','HST/GST review',taxReviewed?'ready':'blocked',taxReviewed?'Sales-tax review evidence is present.':'HST/GST review is not marked reviewed/finalized/filed.','/admin/month-end/','Open Month-End',{review_status:hstStatus||'draft',net_tax_payable_cents:n(hst.net_tax_payable_cents)}));

  const remittanceStatus=text(hst.remittance_status).toLowerCase();
  const taxEvidence=Boolean(text(hst.remittance_evidence_url));
  const taxDue=n(hst.net_tax_payable_cents)!==0;
  const taxRemittanceReady=!taxDue||(['paid','filed','remitted','complete','completed'].includes(remittanceStatus)&&taxEvidence);
  checks.push(check('tax-remittance-evidence','Tax remittance evidence',taxRemittanceReady?'ready':'review',taxRemittanceReady?(taxDue?'Remittance status and evidence reference are present.':'No net tax payable is recorded for the selected month.'):'Tax is payable but remittance status/evidence is incomplete.','/admin/month-end/','Review tax evidence',{net_tax_payable_cents:n(hst.net_tax_payable_cents),remittance_status:remittanceStatus||'not_ready',remittance_evidence_present:taxEvidence}));

  const receiptsChecked=yes(checklist.receipts_attached);
  checks.push(check('receipts-bills-evidence','Receipts & bills evidence',receiptsChecked&&attachments.length?'ready':'review',receiptsChecked&&attachments.length?`${attachments.length} evidence attachment(s) are indexed and the close checklist confirms support.`:'Receipt/bill support is not fully evidenced by both checklist confirmation and indexed attachments.','/admin/accounting/#expense-entry','Review evidence',{checklist_confirmed:receiptsChecked,attachment_count:attachments.length}));

  checks.push(check('gifi-review','GIFI review',yes(checklist.gifi_reviewed)?'ready':'review',yes(checklist.gifi_reviewed)?'GIFI review is marked complete.':'GIFI review is not marked complete.','/admin/month-end/','Open Month-End',{gifi_reviewed:yes(checklist.gifi_reviewed)}));
  checks.push(check('schedule-141-notes','Schedule 141 notes',yes(checklist.schedule_141_notes_started)?'ready':'review',yes(checklist.schedule_141_notes_started)?'Schedule 141 notes are marked started.':'Schedule 141 notes are not marked started.','/admin/month-end/','Open Month-End',{schedule_141_notes_started:yes(checklist.schedule_141_notes_started)}));

  const followup=yes(checklist.accountant_followup_flagged);
  checks.push(check('accountant-followup','Accountant follow-up',followup?'review':'ready',followup?'The close checklist flags accountant follow-up; keep this visible in the review package.':'No accountant follow-up flag is recorded.','/admin/month-end/','Review follow-up',{accountant_followup_flagged:followup}));

  const outstanding=n(payment?.summary?.outstanding_cents);
  checks.push(check('outstanding-payments','Outstanding payments',outstanding>0?'blocked':'ready',outstanding>0?'One or more selected-month orders still have an outstanding balance.':'No selected-month outstanding order balance is visible.','/admin/accounting/#accountingCloseWorkflowMount','Review receivables',{outstanding_cents:outstanding,order_count:n(payment?.summary?.order_count)}));

  const issues=attachmentIssues(attachments);
  checks.push(check('attachment-integrity','Evidence attachment integrity',issues.length?'review':'ready',issues.length?`${issues.length} evidence metadata issue(s) require review.`:'Indexed evidence metadata has no detected integrity issue.','/admin/accounting/#accountingCloseWorkflowMount','Review evidence',{attachment_count:attachments.length,issue_count:issues.length}));

  checks.push(check('accountant-export-package','Accountant export package',packages.length?'ready':'review',packages.length?'At least one existing accountant export package record is available. Export remains a deliberate operator action.':'No accountant export package record is present for the selected month/tax year.','/admin/month-end/','Open Month-End',{package_count:packages.length,package_statuses:packages.map(row=>text(row.package_status)).filter(Boolean)}));

  const blockers=list(closeReadiness.blockers);
  checks.push(check('close-readiness','Existing close authority',closeReadiness.ready===true?'ready':'blocked',closeReadiness.ready===true?'Existing Accounting close authority reports ready. This is evidence, not authorization to close.':`${blockers.length||1} close blocker(s) remain in the existing Accounting authority.`,'/admin/month-end/','Open Month-End',{ready:closeReadiness.ready===true,blockers}));

  const counts=checks.reduce((acc,row)=>{acc[row.state]=(acc[row.state]||0)+1;return acc;},{ready:0,review:0,blocked:0});
  const state=counts.blocked?'blocked':counts.review?'review':'ready';
  return {release:467,build:113,authority:'accountant-month-end-evidence-depth',period_month:period,state,summary:{ready_count:counts.ready,review_count:counts.review,blocked_count:counts.blocked,check_count:checks.length,attachment_count:attachments.length,attachment_issue_count:issues.length,export_package_count:packages.length,close_blocker_count:blockers.length},checks,attachment_issues:issues,boundaries:{read_only_projection:true,readiness_is_not_posting_authorization:true,accounting_posting:false,period_close:false,evidence_mutation:false,automatic_export:false,payment_execution:false,refund_execution:false,request_time_schema_mutation:false,r2_mutation:false,provider_execution:false}};
}
