/** Build 661. Source-linked, GET-only commission/invoice/cost/payment review.
 * No accounting entry, customer document, order, charge or provider action. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {decodeOwnerRecord} from '../_lib/moduleAcceptance656.mjs';
import {projectCostProjection} from './_lib/projectCosting.mjs';

const IDS=['customer-requests.commission','invoicing.invoice','job-finances.margin'];
const positive=v=>/^[1-9]\d{0,9}$/.test(String(v??''))?Number(v):0;
const rows=v=>Array.isArray(v?.results)?v.results:[];
const pick=(v,keys)=>Object.fromEntries(keys.split(' ').map(k=>[k,v?.[k]??null]));
const response=(data,status=200)=>jsonResponse({release:467,build:661,read_only:true,...data},status,
 {'Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'});
const many=(db,sql,...args)=>db.prepare(sql).bind(...args).all().then(rows);
const one=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
async function sha(facts){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(facts)));
 return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');}

async function acceptance(db,userId){const record=await one(db,`SELECT setting_value,is_public FROM app_settings
 WHERE setting_key=? LIMIT 1`,'site.admin.module_acceptance.v656.'+userId);
 const owner=decodeOwnerRecord(record),latest=new Map();
 for(const receipt of owner.receipts){if(IDS.includes(receipt.requirement_id)&&!latest.has(receipt.requirement_id))latest.set(receipt.requirement_id,receipt);}
 return {owner_version:owner.version,independently_verified:false,approved_completion_percent:null,
  checkpoints:IDS.map(id=>{const r=latest.get(id);return {id,decision:r?.decision||'unreviewed',
   observed_at:r?.observed_at||null,recorded_at:r?.recorded_at||null,
   evidence_reference:r?.evidence_reference||null};})};}

const paidStatus=new Set(['paid','completed','captured','partially_refunded','refunded']);
const refundDone=new Set(['completed','succeeded','refunded','processed']);
async function order(db,orderId){const raw=await one(db,`SELECT order_id,order_number,order_status,payment_status,
 currency,total_cents,tax_cents,created_at,updated_at FROM orders WHERE order_id=? LIMIT 1`,orderId);
 if(!raw)return null;
 const source=pick(raw,'order_id order_number order_status payment_status currency total_cents tax_cents created_at updated_at');
 const invoices=await many(db,`SELECT customer_document_id,document_number,document_type,document_status,currency,
 document_amount_cents,issued_at,voided_at FROM customer_documents WHERE order_id=?
 AND document_type IN ('invoice','credit_note') ORDER BY customer_document_id DESC LIMIT 21`,orderId);
 const payments=await many(db,`SELECT payment_id,payment_status,amount_cents,currency,paid_at
 FROM payments WHERE order_id=? ORDER BY payment_id DESC LIMIT 21`,orderId);
 const refunds=await many(db,`SELECT refund_id,refund_status,provider_sync_status,amount_cents,currency
 FROM payment_refunds WHERE order_id=? ORDER BY refund_id DESC LIMIT 21`,orderId);
 const truncated=[invoices,payments,refunds].some(a=>a.length>20);
 const docs=invoices.slice(0,20).map(d=>pick(d,'customer_document_id document_number document_type document_status currency document_amount_cents issued_at voided_at')),
  savedPayments=payments.slice(0,20).map(p=>pick(p,'payment_id payment_status amount_cents currency paid_at')),
  savedRefunds=refunds.slice(0,20).map(r=>pick(r,'refund_id refund_status provider_sync_status amount_cents currency'));
 const issued=docs.filter(d=>d.document_type==='invoice'&&d.document_status==='issued'&&!d.voided_at);
 const paid=savedPayments.filter(p=>paidStatus.has(String(p.payment_status||'').toLowerCase()));
 const completedRefunds=savedRefunds.filter(r=>refundDone.has(String(r.refund_status||'').toLowerCase()));
 const pendingRefunds=savedRefunds.filter(r=>!refundDone.has(String(r.refund_status||'').toLowerCase())&&
  !['cancelled','failed'].includes(String(r.refund_status||'').toLowerCase()));
 const mixed=[...docs,...savedPayments,...savedRefunds].some(d=>d.currency&&String(d.currency).toUpperCase()!=='CAD')||source.currency!=='CAD';
 const holds=[...(truncated?['ORDER_LEDGER_ROWS_TRUNCATED']:[]),...(mixed?['ORDER_OR_DOCUMENT_CURRENCY_NOT_CAD']:[]),
  ...(!issued.length?['NO_ISSUED_INVOICE']:[]),...(issued.length>1?['MULTIPLE_ISSUED_INVOICES_NEED_REVIEW']:[]),
  ...(!paid.length?['NO_SAVED_PAID_PAYMENT']:[]),...(pendingRefunds.length?['REFUND_STATUS_UNRESOLVED']:[])];
 return {order:source,invoices:docs,
  payments:savedPayments,refunds:savedRefunds,holds,truncated,
  saved_paid_cents:mixed||truncated?null:paid.reduce((s,p)=>s+Number(p.amount_cents||0),0),
  saved_completed_refund_cents:mixed||truncated?null:completedRefunds.reduce((s,r)=>s+Number(r.amount_cents||0),0),
  real_provider_settlement_verified:false,invoice_not_automatically_revenue:true};}

async function costing(db,id){const review=await one(db,`SELECT maker_project_cost_review_id,scenario_kind,
 pricing_quantity,proposed_price_cents,labour_rate_cents_per_hour,machine_rate_cents_per_hour,
 machine_minutes,packaging_cents,consumables_cents,rework_cents,finishing_cents,outside_service_cents,
 overhead_cents,no_material_use_confirmed,no_labour_confirmed,created_at FROM maker_project_cost_reviews
 WHERE creative_work_project_id=? ORDER BY maker_project_cost_review_id DESC LIMIT 1`,id);
 const planned=await one(db,`SELECT COUNT(*) line_count,
 SUM(CASE WHEN i.unit_cost_cents>0 THEN 1 ELSE 0 END) valued_lines,
 SUM(CASE WHEN i.unit_cost_cents>0 THEN ROUND(l.planned_usage_quantity/
 iif(l.usage_units_per_stock_unit_snapshot>0,l.usage_units_per_stock_unit_snapshot,1)*i.unit_cost_cents) ELSE 0 END) estimated_cents
 FROM maker_project_bom_lines l JOIN site_item_inventory i ON i.site_item_inventory_id=l.site_item_inventory_id
 WHERE l.creative_work_project_id=? AND l.line_status='planned'`,id);
 const actual=await one(db,`SELECT COUNT(*) post_count,SUM(CASE WHEN i.unit_cost_cents>0 THEN 1 ELSE 0 END) valued_posts,
 SUM(CASE WHEN i.unit_cost_cents>0 THEN ROUND(p.stock_quantity_consumed*i.unit_cost_cents) ELSE 0 END) actual_cents
 FROM creative_project_inventory_posts p JOIN site_item_inventory i ON i.site_item_inventory_id=p.site_item_inventory_id
 WHERE p.creative_work_project_id=? AND COALESCE(p.posting_status,'posted')<>'reversed'
 AND NOT EXISTS(SELECT 1 FROM creative_project_inventory_reversals r WHERE r.creative_project_inventory_post_id=p.creative_project_inventory_post_id)`,id);
 const time=await one(db,`SELECT COUNT(*) time_rows,SUM(minutes_worked) actual_minutes FROM creative_work_order_events
 WHERE creative_work_project_id=? AND event_kind='time'`,id);
 const production=await one(db,`SELECT COUNT(*) evidence_rows,SUM(machine_minutes) machine_minutes,
 SUM(packaging_cost_cents) packaging_cents,SUM(consumables_cost_cents) consumables_cents,
 SUM(rework_cost_cents) rework_cents,SUM(finishing_cost_cents) finishing_cents,
 SUM(outside_service_cents) outside_service_cents,SUM(prototype_waste_cost_cents) prototype_waste_cents
 FROM creative_project_production_cost_evidence WHERE creative_work_project_id=? AND evidence_status='active'`,id);
 const quality=await one(db,`SELECT COUNT(*) attempts,
 SUM(CASE WHEN outcome IN ('reject','scrap','salvage','abandoned') THEN 1 ELSE 0 END) failed_attempts
 FROM maker_quality_attempts WHERE creative_work_project_id=?`,id);
 const finance=await one(db,`SELECT revenue_cents,labour_rate_cents,packaging_cost_cents,overhead_cost_cents,updated_at
 FROM creative_project_profitability WHERE creative_work_project_id=? LIMIT 1`,id);
 const cost=projectCostProjection({review:review||{},planned,actual,time,production,quality});
 return {latest_cost_review_id:review?.maker_project_cost_review_id||null,
  reviewed_price_scenario:review?pick(review,'scenario_kind pricing_quantity proposed_price_cents created_at'):null,
  projection:cost,finance_reference:finance?pick(finance,'revenue_cents updated_at'):null,
  ledger_profit_cents:null,ledger_profit_certified:false,estimated_margin_is_not_booked_profit:true,
  cost_source_gaps:cost.missing_categories};}

async function detail(db,id,actor){const raw=await one(db,`SELECT custom_request_id,request_key,request_type,status,quantity,
 budget_cents,created_at,updated_at FROM custom_requests WHERE custom_request_id=? LIMIT 1`,id);
 if(!raw)return null;
 const request=pick(raw,'custom_request_id request_key request_type status quantity budget_cents created_at updated_at');
 const quote=await one(db,`SELECT custom_request_quote_draft_id,quote_key,quote_status,quote_total_cents,updated_at
 FROM custom_request_quote_drafts WHERE custom_request_id=? LIMIT 1`,id);
 const paymentDraft=await one(db,`SELECT custom_request_payment_request_draft_id,payment_request_status,
 request_type,amount_cents,currency,due_date,created_at FROM custom_request_payment_request_drafts
 WHERE custom_request_id=? ORDER BY custom_request_payment_request_draft_id DESC LIMIT 1`,id);
 const lifecycle=await one(db,`SELECT creative_work_project_id,current_stage
 FROM creative_project_manufacturing_lifecycles WHERE custom_request_id=? LIMIT 1`,id);
 const projectId=positive(lifecycle?.creative_work_project_id),links=await many(db,`SELECT order_id,link_status
 FROM custom_request_order_status_links WHERE custom_request_id=? AND order_id IS NOT NULL
 AND COALESCE(link_status,'active') NOT IN ('void','expired') AND voided_at IS NULL AND expired_at IS NULL
 ORDER BY custom_request_order_status_link_id DESC LIMIT 6`,id);
 const records=[];for(const link of links.slice(0,5)){const value=await order(db,positive(link.order_id));if(value)records.push(value);}
 const costs=projectId?await costing(db,projectId):null,owner=await acceptance(db,actor);
 const holds=[...(!quote?['NO_SOURCE_QUOTE']:[]),...(!paymentDraft?['NO_SOURCE_PAYMENT_REQUEST_DRAFT']:[]),
  ...(!projectId?['NO_LINKED_CREATIVE_PROJECT']:[]),...(!links.length?['NO_ACTIVE_SOURCE_ORDER_LINK']:[]),
  ...(links.length>5?['ORDER_LINKS_TRUNCATED']:[]),...records.flatMap(x=>x.holds),
  ...(!costs?.latest_cost_review_id?['NO_REVIEWED_PROJECT_COST_SCENARIO']:[]),
  ...(costs?.cost_source_gaps.length?['INCOMPLETE_SOURCE_COST_COMPONENTS']:[]),
  ...(!owner.checkpoints.every(x=>x.decision==='accepted')?['OWNER_FIELD_ACCEPTANCE_NOT_COMPLETE']:[]),
  'INDEPENDENT_FINANCE_AND_PROVIDER_PROOF_NOT_AVAILABLE'];
 const facts={request,quote:quote?pick(quote,'custom_request_quote_draft_id quote_key quote_status quote_total_cents updated_at'):null,
  payment_request_draft:paymentDraft?pick(paymentDraft,'custom_request_payment_request_draft_id payment_request_status request_type amount_cents currency due_date created_at'):null,
  manufacturing:projectId?{creative_work_project_id:projectId,current_stage:lifecycle.current_stage}:null,
  original_orders:records,costs,owner};
 return {facts,source_revision:await sha(facts),holds:[...new Set(holds)],linked_orders_truncated:links.length>5,
  original_source_routes:['/admin/custom-request/','/admin/commission-workbench/','/admin/customer-documents/',
   '/admin/project-costs/','/admin/cross-project-accounting/','/admin/module-acceptance/'],
  customer_contact_excluded:true,private_media_excluded:true,quote_is_not_revenue:true,
  payment_draft_is_not_settlement:true,invoice_is_not_cash_receipt:true,production_cost_is_estimate:true,
  no_invoice_issued:true,no_payment_or_refund_executed:true,no_finance_or_inventory_posting:true,
  master_completion_percent:null,independent_finance_certification:false};}

export async function onRequestGet(ctx){const admin=verifiedAdminFromModule(ctx),db=getDb(ctx.env);
 if(!admin)return response({ok:false,error:'Active Financials Admin grant required.'},401);
 if(!db)return response({ok:false,error:'Canonical commerce and maker database unavailable.'},503);
 const q=new URL(ctx.request.url).searchParams,raw=q.get('request_id');
 if(raw!==null&&!positive(raw))return response({ok:false,error:'Use a positive original Custom Request ID.'},400);
 try{if(raw===null){const requests=await many(db,`SELECT custom_request_id,request_type,status,updated_at
   FROM custom_requests ORDER BY custom_request_id DESC LIMIT 51`);
   return response({ok:true,requests:requests.slice(0,50).map(r=>pick(r,'custom_request_id request_type status updated_at')),
    independent_finance_certification:false,no_source_writes:true});}
  const review=await detail(db,positive(raw),admin.user_id);
  return review?response({ok:true,...review}):response({ok:false,error:'Original Custom Request not found.'},404);
 }catch{return response({ok:false,error:'A linked original source or private owner receipt is unavailable. Acceptance HOLD.'},503);}}
