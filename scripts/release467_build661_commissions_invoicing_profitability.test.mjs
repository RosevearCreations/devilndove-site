import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),read=p=>readFileSync(resolve(root,p),'utf8');
let state={};
const fixture={
 getDb:env=>env?.DB,
 jsonResponse:(data,status=200)=>new Response(JSON.stringify(data),{status}),
 verifiedAdminFromModule:ctx=>ctx.data?.ddModuleAccess?.allowed&&ctx.data.ddModuleAccess.user?.role==='admin'?{user_id:7}:null,
 decodeOwnerRecord:()=>({version:3,receipts:state.owner||[]}),
 projectCostProjection:({review,actual,time,production})=>({currency:'CAD',
  missing_categories:state.costMissing||['Work Order labour','Packaging'],complete:!(state.costMissing||[1]).length,
  total_cost_cents:state.costTotal??null,known_subtotal_cents:Number(actual?.actual_cents||0),
  project_profit_estimate_cents:null,components:[],warnings:[],review_input_id:review.maker_project_cost_review_id,
  posted_inventory_count:actual?.post_count,time_rows:time?.time_rows,production_rows:production?.evidence_rows})
};
globalThis.__dd661_fixture=fixture;
const source=read('functions/api/admin/commission-finance-661.js');
const transformed=source.replace(/^import .*;$/gm,'').replace(/^const IDS=/m,
 'const {getDb,jsonResponse,verifiedAdminFromModule,decodeOwnerRecord,projectCostProjection}=globalThis.__dd661_fixture;\nconst IDS=');
const {onRequestGet}=await import('data:text/javascript;base64,'+Buffer.from(transformed).toString('base64'));
const calls=[];
function mockDb(){return {prepare(sql){assert.doesNotMatch(sql,/\b(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP)\b/i,'No source mutation');
 calls.push(sql);return {bind(...args){return {async first(){return query(sql,args,false)},async all(){return {results:query(sql,args,true)}}};}};}};}
function query(sql,args,multiple){
 if(/FROM app_settings/.test(sql))return {setting_value:'{}',is_public:0};
 if(/FROM custom_requests/.test(sql))return multiple?state.requests??[]:state.request??null;
 if(/FROM custom_request_quote_drafts/.test(sql))return state.quote??null;
 if(/FROM custom_request_payment_request_drafts/.test(sql))return state.draft??null;
 if(/FROM creative_project_manufacturing_lifecycles/.test(sql))return state.lifecycle??null;
 if(/FROM custom_request_order_status_links/.test(sql))return state.links??[];
 if(/FROM orders/.test(sql))return state.order??null;
 if(/FROM customer_documents/.test(sql))return state.docs??[];
 if(/FROM payments/.test(sql))return state.payments??[];
 if(/FROM payment_refunds/.test(sql))return state.refunds??[];
 if(/FROM maker_project_cost_reviews/.test(sql))return state.review??null;
 if(/FROM maker_project_bom_lines/.test(sql))return {line_count:1,valued_lines:1,estimated_cents:500};
 if(/FROM creative_project_inventory_posts/.test(sql))return {post_count:1,valued_posts:1,actual_cents:400};
 if(/FROM creative_work_order_events/.test(sql))return {time_rows:1,actual_minutes:45};
 if(/FROM creative_project_production_cost_evidence/.test(sql))return {evidence_rows:1,machine_minutes:3};
 if(/FROM maker_quality_attempts/.test(sql))return {attempts:0,failed_attempts:0};
 if(/FROM creative_project_profitability/.test(sql))return state.finance??null;
 throw Error('Unknown source query '+sql.slice(0,90));
}
const ctx=(path,allowed=true)=>({request:new Request('https://devilndove.com'+path),
 env:{DB:mockDb()},data:{ddModuleAccess:{allowed,user:{role:'admin',is_active:1,user_id:7}}}});
const result=async c=>{const r=await onRequestGet(c);return {status:r.status,data:await r.json()};};
const reset=()=>{state={};calls.length=0;};

test('Build 661 denies missing module authority and validates original numeric IDs',async()=>{
 reset();assert.equal((await result(ctx('/api/admin/commission-finance-661',false))).status,401);
 const r=await result(ctx('/api/admin/commission-finance-661?request_id=0'));assert.equal(r.status,400);
 assert.equal(calls.length,0);
});
test('Build 661 lists only bounded PII-free original request identities',async()=>{
 reset();state.requests=[{custom_request_id:8,request_type:'jewelry',status:'new',updated_at:'2026-11-09',name:'PRIVATE',email:'secret@example.com'}];
 const r=await result(ctx('/api/admin/commission-finance-661'));
 assert.equal(r.status,200);assert.equal(r.data.requests[0].custom_request_id,8);
 assert.doesNotMatch(JSON.stringify(r.data),/secret@example.com|PRIVATE/);
});
test('Build 661 does not turn quote or deposit drafts into paid revenue or an invoice',async()=>{
 reset();state.request={custom_request_id:17,status:'new',email:'private@example.com',name:'PRIVATE'};
 state.quote={custom_request_quote_draft_id:4,quote_total_cents:6800,quote_status:'draft'};
 state.draft={custom_request_payment_request_draft_id:2,payment_request_status:'draft',amount_cents:1200,currency:'CAD'};
 const r=await result(ctx('/api/admin/commission-finance-661?request_id=17'));
 assert.equal(r.status,200);assert.equal(r.data.facts.quote.quote_total_cents,6800);
 assert.equal(r.data.facts.payment_request_draft.amount_cents,1200);
 assert.equal(r.data.facts.original_orders.length,0);assert.equal(r.data.independent_finance_certification,false);
 assert.equal(r.data.master_completion_percent,null);assert.ok(r.data.holds.includes('NO_ACTIVE_SOURCE_ORDER_LINK'));
 assert.doesNotMatch(JSON.stringify(r.data),/private@example.com|PRIVATE/);
});
test('Build 661 independently shows issued invoices, saved payments and pending-refund HOLDs, never settlement',async()=>{
 reset();state.request={custom_request_id:2,status:'accepted'};state.links=[{order_id:99,link_status:'active'}];
 state.order={order_id:99,order_number:'DND-99',currency:'CAD',total_cents:9000,email:'secret@example.com'};
 state.docs=[{customer_document_id:4,document_number:'INV-99',document_type:'invoice',document_status:'issued',currency:'CAD',document_amount_cents:9000,customer_email:'private@example.com'}];
 state.payments=[{payment_id:3,payment_status:'paid',currency:'CAD',amount_cents:9000,provider_payment_id:'secret-processor-reference'}];
 state.refunds=[{refund_id:5,refund_status:'pending',currency:'CAD',amount_cents:500,provider_refund_id:'private-provider-refund'}];
 const r=await result(ctx('/api/admin/commission-finance-661?request_id=2'));
 assert.equal(r.status,200);assert.equal(r.data.facts.original_orders[0].saved_paid_cents,9000);
 assert.ok(r.data.holds.includes('REFUND_STATUS_UNRESOLVED'));
 assert.equal(r.data.facts.original_orders[0].real_provider_settlement_verified,false);
 assert.doesNotMatch(JSON.stringify(r.data),/secret-processor-reference|private@example.com|private-provider-refund|secret@example.com/);
});
test('Build 661 costing is original project-scoped with unknown true profit and no double-count assumption',async()=>{
 reset();state.request={custom_request_id:2};state.lifecycle={creative_work_project_id:18,current_stage:'making'};
 state.review={maker_project_cost_review_id:6,proposed_price_cents:3000,scenario_kind:'commission'};
 state.finance={revenue_cents:6000,updated_at:'2026-11-09'};
 const r=await result(ctx('/api/admin/commission-finance-661?request_id=2'));
 assert.equal(r.status,200);assert.equal(r.data.facts.costs.latest_cost_review_id,6);
 assert.equal(r.data.facts.costs.ledger_profit_cents,null);
 assert.equal(r.data.facts.costs.estimated_margin_is_not_booked_profit,true);
 assert.ok(r.data.holds.includes('INCOMPLETE_SOURCE_COST_COMPONENTS'));
 assert.ok(calls.some(sql=>sql.includes('creative_project_inventory_reversals')));
});
test('Build 661 currency, truncation and unavailable source all fail closed',async()=>{
 reset();state.request={custom_request_id:8};state.links=Array.from({length:6},(_,i)=>({order_id:i+1}));
 state.order={order_id:1,currency:'USD',total_cents:600};
 const r=await result(ctx('/api/admin/commission-finance-661?request_id=8'));
 assert.equal(r.data.linked_orders_truncated,true);assert.ok(r.data.holds.includes('ORDER_LINKS_TRUNCATED'));
 assert.ok(r.data.holds.includes('ORDER_OR_DOCUMENT_CURRENCY_NOT_CAD'));
 reset();state.request={custom_request_id:8};state.links=[{order_id:8}];
 state.order={order_id:8,currency:'CAD',total_cents:60};state.docs=Array.from({length:21},(_,i)=>({customer_document_id:i+1,document_type:'invoice',document_status:'issued',currency:'CAD'}));
 const t=await result(ctx('/api/admin/commission-finance-661?request_id=8'));
 assert.ok(t.data.holds.includes('ORDER_LEDGER_ROWS_TRUNCATED'));
 assert.equal(t.data.facts.original_orders[0].saved_paid_cents,null);
});
test('Build 661 UI, source ownership and manual-load contract',()=>{
 const html=read('admin/commission-finance/index.html'),js=read('public/js/admin-commission-finance-661.js');
 assert.match(html,/data-admin-module="financials"/);
 for(const link of ['/admin/customer-documents/','/admin/commission-workbench/','/admin/project-costs/','/admin/cross-project-accounting/'])assert.ok(html.includes(link));
 assert.match(html,/role="status" aria-live="polite"/);assert.match(js,/textContent/);
 assert.doesNotMatch(js,/innerHTML|localStorage|setInterval|\bPOST\b|fetch\([^)]*method:/);
 assert.match(source,/export async function onRequestGet/);assert.doesNotMatch(source,/export async function onRequestPost/);
});
