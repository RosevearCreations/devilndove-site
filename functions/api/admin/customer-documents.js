// Devil n Dove Build 414 mutation implementation / Build 397 read authority.
// Customer Documents schema is migration-owned; GET and POST perform no request-time DDL.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { readCustomerDocuments, readCustomerDocumentsSchemaReadiness } from '../_lib/customerDocumentsReadService.js';

const BUILD = 414;
const READ_BUILD = 397;
const CONTRACT_ID = 'operations-customer-documents-write';
const TYPES = new Set(['invoice','receipt','packing_slip','credit_note','refund_confirmation']);
const PREFIX = { invoice:'INV', receipt:'RCT', packing_slip:'PKG', credit_note:'CRN', refund_confirmation:'RFD' };
const text = (value,max=2000) => normalizeText(value).slice(0,max);
const id = (value) => { const n=Number(value); return Number.isInteger(n)&&n>0?n:0; };
const cents = (value) => Math.max(0,Math.round(Number(value)||0));
const rows = (result) => Array.isArray(result?.results)?result.results:[];
const json = (data,status=200) => jsonResponse(data,status,{'Cache-Control':'no-store'});

async function access(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser)return{error:json({ok:false,build:BUILD,error:'Admin access required.'},401)};
  const db=getDb(context.env);if(!db)return{error:json({ok:false,build:BUILD,error:'Database binding is not configured.'},500)};
  return{adminUser,db};
}

async function requireWriteSchema(db){
  const readiness=await readCustomerDocumentsSchemaReadiness(db);
  return readiness.schema_ready
    ? {ok:true,readiness}
    : {ok:false,readiness,error:'Customer Documents schema is not ready. Apply database_customer_documents_runtime_parity.sql before retrying.'};
}

function businessProfile(env={}){
  const first=(...names)=>{for(const name of names){const value=text(env?.[name],500);if(value)return value;}return'';};
  return{
    legal_name:first('BUSINESS_LEGAL_NAME','BUSINESS_NAME')||'Rosevear Creations - Devil n Dove',
    registration_number:first('BUSINESS_GST_HST_NUMBER','GST_HST_NUMBER','BUSINESS_REGISTRATION_NUMBER'),
    address_line1:first('BUSINESS_ADDRESS_LINE1','BUSINESS_ADDRESS'), address_line2:first('BUSINESS_ADDRESS_LINE2'),
    city:first('BUSINESS_CITY'), province:first('BUSINESS_PROVINCE')||'Ontario', postal_code:first('BUSINESS_POSTAL_CODE'), country:first('BUSINESS_COUNTRY')||'Canada',
    email:first('BUSINESS_EMAIL','SUPPORT_EMAIL'), phone:first('BUSINESS_PHONE'), website:first('BUSINESS_WEBSITE')||'https://devilndove.com'
  };
}

async function loadOrder(db,orderId){
  const order=await db.prepare(`SELECT * FROM orders WHERE order_id=? LIMIT 1`).bind(orderId).first();if(!order)return null;
  const items=rows(await db.prepare(`SELECT order_item_id,product_id,sku,product_name,product_type,unit_price_cents,quantity,line_subtotal_cents,taxable,tax_class_code,requires_shipping FROM order_items WHERE order_id=? ORDER BY order_item_id`).bind(orderId).all().catch(()=>({results:[]})));
  const payments=rows(await db.prepare(`SELECT payment_id,provider,provider_payment_id,payment_status,amount_cents,currency,payment_method_label,transaction_reference,paid_at,created_at FROM payments WHERE order_id=? ORDER BY created_at,payment_id`).bind(orderId).all().catch(()=>({results:[]})));
  const refunds=rows(await db.prepare(`SELECT refund_id,payment_id,provider,provider_refund_id,amount_cents,currency,refund_status,reason,note,created_at,updated_at FROM payment_refunds WHERE order_id=? ORDER BY created_at,refund_id`).bind(orderId).all().catch(()=>({results:[]})));
  return{order,items,payments,refunds};
}

async function nextNumber(db,type){
  const year=new Date().getUTCFullYear();
  await db.prepare(`INSERT OR IGNORE INTO customer_document_sequences (document_type,sequence_year,next_number,updated_at) VALUES (?,?,1,CURRENT_TIMESTAMP)`).bind(type,year).run();
  const row=await db.prepare(`UPDATE customer_document_sequences SET next_number=next_number+1,updated_at=CURRENT_TIMESTAMP WHERE document_type=? AND sequence_year=? RETURNING next_number-1 AS issued_number`).bind(type,year).first();
  return`${PREFIX[type]}-${year}-${String(Number(row?.issued_number||1)).padStart(6,'0')}`;
}

async function responseSnapshot(db,orderId=0,documentId=0,extra={}){
  const data=await readCustomerDocuments(db,{orderId,documentId});
  return{...data,build:BUILD,read_build:READ_BUILD,contract:CONTRACT_ID,owner:'operations',request_time_schema_mutation:false,mutation_ownership_moved:true,...extra};
}

export async function onRequestGet(context){
  const a=await access(context);if(a.error)return a.error;
  try{
    const url=new URL(context.request.url);
    return json(await readCustomerDocuments(a.db,{orderId:id(url.searchParams.get('order_id')),documentId:id(url.searchParams.get('document_id'))}));
  }
  catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'customer_documents',incident_code:'customer_documents_get_failed',severity:'error',message:error?.message||'Customer documents failed to load.',related_user_id:a.adminUser.user_id,details:{error:String(error?.stack||error)}}).catch(()=>null);
    return json({ok:false,build:READ_BUILD,request_time_schema_mutation:false,error:'Client documents could not load.'},500);
  }
}

export async function onRequestPost(context){
  const a=await access(context);if(a.error)return a.error;
  const schema=await requireWriteSchema(a.db);
  if(!schema.ok)return json({ok:false,build:BUILD,contract:CONTRACT_ID,owner:'operations',error_code:'customer_documents_schema_not_ready',error:schema.error,...schema.readiness},503);

  let body={};try{body=await context.request.json()}catch{return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'Expected a JSON request body.'},400)}
  const action=text(body.action,60).toLowerCase();
  try{
    if(action==='void_document'){
      const documentId=id(body.customer_document_id);const reason=text(body.void_reason,1000);
      if(!documentId||reason.length<5)throw new Error('Choose a document and provide a clear void reason.');
      const current=await a.db.prepare(`SELECT * FROM customer_documents WHERE customer_document_id=?`).bind(documentId).first();
      if(!current)throw new Error('Client document was not found.');
      if(current.document_status==='void')throw new Error('This client document is already void.');
      await a.db.prepare(`UPDATE customer_documents SET document_status='void',voided_by_user_id=?,voided_at=CURRENT_TIMESTAMP,void_reason=?,updated_at=CURRENT_TIMESTAMP WHERE customer_document_id=?`).bind(a.adminUser.user_id,reason,documentId).run();
      await auditAdminAction(context.env,context.request,a.adminUser,{action_type:'customer_document_voided',target_type:'customer_document',target_id:documentId,target_key:current.document_number,details:{reason}}).catch(()=>null);
      return json(await responseSnapshot(a.db,id(current.order_id),0,{message:'Client document voided. The immutable source snapshot remains in history.'}));
    }

    if(action!=='issue_document')return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'Unsupported client-document action.'},400);
    const type=text(body.document_type,40).toLowerCase();const orderId=id(body.order_id);
    if(!TYPES.has(type)||!orderId)throw new Error('A supported document type and order are required.');
    const detail=await loadOrder(a.db,orderId);if(!detail)throw new Error('Order was not found.');
    const selectedRefund=id(body.refund_id)?detail.refunds.find((row)=>id(row.refund_id)===id(body.refund_id)):null;
    if((type==='credit_note'||type==='refund_confirmation')&&!selectedRefund)throw new Error('Choose the recorded refund that this credit/refund document represents.');
    const reason=text(body.issue_reason||selectedRefund?.reason,1000);
    if((type==='credit_note'||type==='refund_confirmation')&&reason.length<3)throw new Error('Add the refund or credit reason.');

    const profile=businessProfile(context.env);const registrationMissing=!profile.registration_number;
    const amount=(type==='credit_note'||type==='refund_confirmation')?cents(selectedRefund?.amount_cents):cents(detail.order.total_cents);
    const proportionalTax=detail.order.total_cents?Math.round(cents(detail.order.tax_cents)*amount/cents(detail.order.total_cents)):0;
    const taxAdjustment=(type==='credit_note'||type==='refund_confirmation')?cents(body.tax_adjustment_cents??proportionalTax):cents(detail.order.tax_cents);
    const documentNumber=await nextNumber(a.db,type);
    const snapshot={schema_version:1,document_number:documentNumber,document_type:type,issued_at:new Date().toISOString(),business:profile,order:detail.order,items:detail.items,payments:detail.payments,refund:selectedRefund||null,document_amount_cents:amount,tax_adjustment_cents:taxAdjustment,issue_reason:reason||null,original_invoice_date:detail.order.created_at,operator_note:text(body.operator_note,1500)||null};
    const result=await a.db.prepare(`INSERT INTO customer_documents (document_number,document_type,order_id,refund_id,document_status,currency,document_amount_cents,tax_adjustment_cents,issue_reason,customer_email,business_name,business_registration_number,source_snapshot_json,issued_by_user_id,issued_at,created_at,updated_at) VALUES (?,?,?,?,'issued',?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(documentNumber,type,orderId,selectedRefund?selectedRefund.refund_id:null,text(detail.order.currency,10)||'CAD',amount,taxAdjustment,reason||null,text(detail.order.customer_email,320)||null,profile.legal_name,profile.registration_number||null,JSON.stringify(snapshot),a.adminUser.user_id).run();
    await auditAdminAction(context.env,context.request,a.adminUser,{action_type:'customer_document_issued',target_type:'customer_document',target_id:result.meta?.last_row_id,target_key:documentNumber,details:{document_type:type,order_id:orderId,refund_id:selectedRefund?.refund_id||null,document_amount_cents:amount,tax_adjustment_cents:taxAdjustment,registration_number_present:!registrationMissing}}).catch(()=>null);
    const warnings=[];
    if(!profile.address_line1||!profile.city||!profile.postal_code)warnings.push('Business address fields are incomplete. Configure and owner-review the business identity before sending this document to a customer.');
    if((type==='credit_note'||type==='refund_confirmation')&&taxAdjustment>0&&registrationMissing)warnings.push('This document adjusts tax but the GST/HST or registration number is not configured. Add the owner/accountant-verified BUSINESS_GST_HST_NUMBER before treating it as complete.');
    return json(await responseSnapshot(a.db,orderId,0,{message:`${documentNumber} issued as an immutable print-ready snapshot.`,issued_document:{customer_document_id:id(result.meta?.last_row_id),document_number:documentNumber,snapshot},warnings}));
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'customer_documents',incident_code:'customer_documents_post_failed',severity:'warning',message:error?.message||'Customer document action failed.',related_user_id:a.adminUser.user_id,details:{action,error:String(error?.stack||error)}}).catch(()=>null);
    return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:error?.message||'Customer document action failed.',request_time_schema_mutation:false},400);
  }
}
