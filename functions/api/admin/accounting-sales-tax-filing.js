import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { BUILD, CONTRACT_ID, OWNER, readAccountingSalesTaxFiling } from '../_lib/accountingSalesTaxFilingReadService.js';
import { readAccountingSummary } from '../_lib/accountingSummaryReadService.js';
import { verifiedAdminFromModule } from '../_lib/verifiedAdmin398.mjs';

// Build 663 is an Admin-only inspection, not a GST/HST return or payroll authority.
const respond=(value,status=200)=>jsonResponse(value,status,{'Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'});
const periodValid=value=>/^20\d{2}-(0[1-9]|1[0-2])$/.test(String(value));
const int=x=>Number.isSafeInteger(Number(x))?Number(x):null;
export async function readAccountingReadiness663(db,month){
 const [book,tax]=await Promise.all([
   readAccountingSummary(db,{limit:1}),
   readAccountingSalesTaxFiling(db,{periodMonth:month})
 ]);
 const booksReady=book.schema_ready===true,taxReady=tax.schema_ready===true;
 const w=taxReady?tax.worksheet:null;
 const financial=booksReady?{
   records_count:int(book.summary?.records_count),
   total_booked_cents:int(book.summary?.total_booked_cents),
   total_paid_cents:int(book.summary?.total_paid_cents),
   total_outstanding_cents:int(book.summary?.total_outstanding_cents),
   recorded_tax_liability_cents:int(book.summary?.total_tax_cents)
 }:null;
 const worksheet=w?{
   period_month:month,review_status:String(w.review_status||'draft'),
   order_count:int(w.order_count),expense_count:int(w.expense_count),
   tax_collected_cents:int(w.tax_collected_cents),input_tax_cents:int(w.input_tax_cents),
   net_tax_payable_cents:int(w.net_tax_payable_cents),filing_difference_cents:int(w.filing_difference_cents)
 }:null;
 return {ok:true,build:663,mode:'original-accounting-tax-payroll-readiness',period_month:month,
   source_observed_at:new Date().toISOString(),source_observation_not_independent:true,
   financials:{schema_ready:booksReady,source:'accounting_order_records',period_scope:'ALL_TIME_NOT_FILTERED',currency_scope:'UNVERIFIED',
     missing_tables:book.missing_tables||[],missing_columns:book.missing_columns||[],summary:financial},
   sales_tax:{schema_ready:taxReady,source:'accounting_reconciliation_reviews.sales_tax',
     missing_tables:tax.missing_tables||[],missing_columns:tax.missing_columns||[],
     worksheet,registration_verified:false,filing_verified:false},
   payroll:{employment_classification_verified:false,employee_roster_verified:false,
     cra_payroll_account_verified:false,actual_payroll_records_verified:false,
     calculation_enabled:false,remittance_enabled:false,source_status:'HOLD_NO_VERIFIED_PAYROLL_AUTHORITY'},
   readiness:{accounting:'SOURCE_REVIEW_ONLY',gst_hst:'HOLD_ACCOUNTANT_AND_CRA_EVIDENCE',
     payroll:'HOLD_REAL_STAFFING_AND_CRA_ACCOUNT',independently_certified:false,
     master_completion_percent:null},
   controls:{read_only:true,no_pii:true,no_request_time_ddl:true,no_filing:true,
     no_tax_registration:true,no_payroll_run:true,no_employer_deduction:true,
     no_provider_charge:true,no_journal_post:true,no_master_event:true}};
}
export async function onRequestGet(context) {
  const adminUser = verifiedAdminFromModule(context) || await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env); if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  try { const url = new URL(context.request.url);
    if(url.searchParams.get('mode')==='readiness'){
      const month=url.searchParams.get('period_month')||new Date().toISOString().slice(0,7);
      if(!periodValid(month))return respond({ok:false,build:663,error:'Use a real YYYY-MM period.'},400);
      return respond(await readAccountingReadiness663(db,month));
    }
    return jsonResponse(await readAccountingSalesTaxFiling(db, { periodMonth: url.searchParams.get('period_month') || '' })); }
  catch (error) { if(new URL(context.request.url).searchParams.get('mode')==='readiness')return respond({ok:false,build:663,error:'Original accounting and tax worksheet review unavailable.'},503); return jsonResponse({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: error?.message || 'Failed to read sales-tax filing worksheet.' }, 500); }
}
