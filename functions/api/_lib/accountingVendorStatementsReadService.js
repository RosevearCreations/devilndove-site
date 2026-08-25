import { readAccountingAttachments } from './accountingAttachmentsReadService.js';

export const BUILD = 336;
export const CONTRACT_ID = 'accounting-vendor-statements-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'accounting_attachments';

function payload(extra={}){ return {ok:true,build:BUILD,contract:CONTRACT_ID,owner:OWNER,mode:'read-only-accounting-vendor-statements',authority_table:AUTHORITY_TABLE,request_time_schema_mutation:false,...extra}; }

export async function readAccountingVendorStatements(db,options={}){
  if(!db) throw new TypeError('A D1 database binding is required.');
  const attachmentRead=await readAccountingAttachments(db,{periodMonth:String(options.periodMonth||'').trim(),attachmentKind:'statement',limit:500});
  if(!attachmentRead.schema_ready) return payload({schema_ready:false,missing_tables:attachmentRead.missing_tables||[],missing_columns:attachmentRead.missing_columns||[],rows:[],count:0});
  const byVendor={};
  for(const row of attachmentRead.attachments||[]){
    const key=String(row.vendor_id||0)||'0';
    const bucket=byVendor[key]||{vendor_id:row.vendor_id||null,attachment_count:0,statement_count:0,gross_cents:0,fee_cents:0,net_cents:0,filenames:[]};
    bucket.attachment_count+=1;
    bucket.statement_count+=(row.attachment_kind||'')==='statement'?1:0;
    bucket.gross_cents+=Number(row.statement_gross_cents||0);
    bucket.fee_cents+=Number(row.statement_fee_cents||0);
    bucket.net_cents+=Number(row.statement_net_cents||0);
    if(bucket.filenames.length<6) bucket.filenames.push(row.original_filename||row.statement_reference||'statement');
    byVendor[key]=bucket;
  }
  const vendorRows=Object.values(byVendor);
  return payload({schema_ready:true,missing_tables:[],missing_columns:[],rows:vendorRows,count:vendorRows.length,attachment_count:Number(attachmentRead.count||0)});
}
