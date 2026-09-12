// Release 467 Build 113 — authenticated GET-only Accountant & Month-End Evidence Depth.
import { captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { readAccountingCloseWorkflow } from '../_lib/accountingCloseWorkflowReadService.js';
import { buildAccountantMonthEndEvidenceDepth } from '../_lib/accountantMonthEndEvidenceDepth.js';

const RELEASE=467;
const BUILD=113;
const TITLE='Accountant & Month-End Evidence Depth';
const json=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});

export async function onRequestGet(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser)return json({ok:false,release:RELEASE,build:BUILD,error:'Admin access required.'},401);
  const db=getDb(context.env);
  if(!db)return json({ok:false,release:RELEASE,build:BUILD,error:'Database binding is not configured.'},503);
  const url=new URL(context.request.url);
  const raw=String(url.searchParams.get('period')||'').trim();
  const period=/^\d{4}-(0[1-9]|1[0-2])$/.test(raw)?raw:new Date().toISOString().slice(0,7);
  try{
    const close=await readAccountingCloseWorkflow(db,{periodMonth:period});
    const projection=buildAccountantMonthEndEvidenceDepth(period,close);
    return json({ok:true,release:RELEASE,build:BUILD,title:TITLE,role:'read_only_accountant_month_end_evidence_depth',...projection,source_authority:{owner:'accounting',contract:'accounting-close-workflow-read',mutation_owner_unchanged:true},safety:{read_only:true,accounting_posting:false,period_close:false,evidence_mutation:false,automatic_export:false,payment_execution:false,refund_execution:false,request_time_schema_mutation:false,r2_mutation:false,provider_execution:false}},200);
  }catch(error){
    await captureRuntimeIncident(context.env,{source:'accountant-month-end-evidence-depth',message:String(error?.message||error)}).catch(()=>{});
    return json({ok:false,release:RELEASE,build:BUILD,title:TITLE,state:'blocked',error:'Month-end evidence depth could not be read.',error_code:'accountant_month_end_evidence_read_failed',detail:String(error?.message||error).slice(0,500),safety:{read_only:true,automatic_repair:false}},503);
  }
}
