import { getAdminUserFromRequest, getDb, jsonResponse } from '../../_lib/adminAudit.js';
import { readAccountingStatementImports } from '../../_lib/accountingStatementImportsReadService.js';

export async function onRequestGet(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser) return jsonResponse({ok:false,error:'Admin access required.'},401);
  const db=getDb(context.env); if(!db) return jsonResponse({ok:false,error:'Database binding is not configured.'},500);
  const url=new URL(context.request.url);
  try{return jsonResponse(await readAccountingStatementImports(db,{importId:Number(url.searchParams.get('accounting_statement_import_id')||0),providerScope:url.searchParams.get('provider_scope')||'',periodMonth:url.searchParams.get('period_month')||'',status:url.searchParams.get('status')||'',limit:Number(url.searchParams.get('limit')||50),exceptionLimit:Number(url.searchParams.get('exception_limit')||100)}));}
  catch(error){return jsonResponse({ok:false,build:334,contract:'accounting-statement-imports-read',owner:'accounting',error:error?.message||'Failed to read Accounting statement imports.'},500);}
}
