import { getAdminUserFromRequest, getDb, jsonResponse } from '../../_lib/adminAudit.js';
import { BUILD, CONTRACT_ID, OWNER, readAccountingEvidenceCheck } from '../../_lib/accountingEvidenceCheckReadService.js';
export async function onRequestGet(context) {
  const adminUser=await getAdminUserFromRequest(context.request,context.env); if(!adminUser) return jsonResponse({ok:false,error:'Admin access required.'},401);
  const db=getDb(context.env); if(!db) return jsonResponse({ok:false,error:'Database binding is not configured.'},500);
  try { const periodMonth=new URL(context.request.url).searchParams.get('period_month')||''; const result=await readAccountingEvidenceCheck(db,{periodMonth}); return jsonResponse({...result,requested_by:{user_id:Number(adminUser.user_id||0),email:adminUser.email||null}}); }
  catch(error){ return jsonResponse({ok:false,build:BUILD,contract:CONTRACT_ID,owner:OWNER,error:error?.message||'Failed to read Accounting evidence readiness.'},500); }
}
