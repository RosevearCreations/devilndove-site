import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { BUILD, OWNER, readAccountingPeriodSummaryExport } from '../_lib/accountingPeriodSummaryExportReadService.js';

function csvCell(value){ if(value==null)return''; const str=String(value); return /[,"\n\r]/.test(str)?`"${str.replace(/"/g,'""')}"`:str; }
function toCsv(rows){ if(!Array.isArray(rows)||!rows.length)return''; const headers=Object.keys(rows[0]); return [headers.map(csvCell).join(','),...rows.map((row)=>headers.map((key)=>csvCell(row[key])).join(','))].join('\n'); }
function emptyRow(range){ return {row_type:'empty',entry_date:range.start,reference_code:'',party:'',status:'',amount:0,tax_amount:0,ledger_code:'',ledger_name:'',notes:''}; }

export async function onRequestGet(context){
  const db=getDb(context.env); if(!db)return jsonResponse({ok:false,error:'Database binding is not configured.'},500);
  const adminUser=await getAdminUserFromRequest(context.request,context.env); if(!adminUser)return jsonResponse({ok:false,error:'Admin access required.'},401);
  const url=new URL(context.request.url);
  let data; try{ data=await readAccountingPeriodSummaryExport(db,{scope:url.searchParams.get('scope'),period:url.searchParams.get('period')}); }catch(error){ if(error instanceof RangeError)return jsonResponse({ok:false,error:error.message},400); throw error; }
  const csv=toCsv(data.rows.length?data.rows:[emptyRow(data.range)]);
  return new Response(csv,{status:200,headers:{'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename="accounting-${data.scope}-${data.period}.csv"`,'cache-control':'no-store','x-dd-build':String(BUILD),'x-dd-owner':OWNER,'x-dd-schema-ready':String(data.schema_ready===true),'x-dd-request-time-schema-mutation':'false'}});
}
