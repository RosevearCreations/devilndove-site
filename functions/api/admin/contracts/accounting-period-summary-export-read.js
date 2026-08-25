import { getAdminUserFromRequest, getDb, jsonResponse } from '../../_lib/adminAudit.js';
import { readAccountingPeriodSummaryExport } from '../../_lib/accountingPeriodSummaryExportReadService.js';

export async function onRequestGet(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env); if(!adminUser)return jsonResponse({ok:false,error:'Admin access required.'},401);
  const db=getDb(context.env); if(!db)return jsonResponse({ok:false,error:'Database binding is not configured.'},500);
  const url=new URL(context.request.url);
  try{ return jsonResponse(await readAccountingPeriodSummaryExport(db,{scope:url.searchParams.get('scope'),period:url.searchParams.get('period')}),200,{'Cache-Control':'no-store'}); }
  catch(error){ if(error instanceof RangeError)return jsonResponse({ok:false,error:error.message},400); throw error; }
}
