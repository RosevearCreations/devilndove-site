import { getAdminUserFromRequest, getDb, jsonResponse } from '../../_lib/adminAudit.js';
import { readAccountingReconciliationExceptions } from '../../_lib/accountingReconciliationExceptionsReadService.js';

export async function onRequestGet(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser) return jsonResponse({ok:false,error:'Admin access required.'},401);
  const db=getDb(context.env); if(!db) return jsonResponse({ok:false,error:'Database binding is not configured.'},500);
  const url=new URL(context.request.url);
  try{return jsonResponse(await readAccountingReconciliationExceptions(db,{reconciliationType:url.searchParams.get('reconciliation_type')||'',periodMonth:url.searchParams.get('period_month')||'',status:url.searchParams.get('status')||'',limit:Number(url.searchParams.get('limit')||200)}));}
  catch(error){return jsonResponse({ok:false,build:335,contract:'accounting-reconciliation-exceptions-read',owner:'accounting',error:error?.message||'Failed to read reconciliation exceptions.'},500);}
}
