// Release 465 Build 3 — read-only Financial, Month-End and I.T. intelligence.
// Existing domain tables remain authoritative; this helper derives scores only.
import { readAccountingCloseWorkflow } from './accountingCloseWorkflowReadService.js';

export const RELEASE465_BUILD3 = 3;
export const RELEASE465_EXPECTED_MIGRATIONS = 4;
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const n=(v)=>Number.isFinite(Number(v))?Number(v):0;
const i=(v)=>Math.trunc(n(v));
const t=(v)=>String(v??'').trim();
const month=(v)=>/^\d{4}-\d{2}$/.test(t(v))?t(v):new Date().toISOString().slice(0,7);
async function exists(db,name){try{return !!(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(name).first());}catch{return false;}}
async function all(db,sql,bind=[]){try{return rows(await db.prepare(sql).bind(...bind).all());}catch{return [];}}
async function first(db,sql,bind=[],fallback=null){try{return (await db.prepare(sql).bind(...bind).first())||fallback;}catch{return fallback;}}

function marginState(row){
 if(row.revenue_cents<=0)return{status:'needs_revenue',severity:'review',reason:'Revenue is not recorded yet.'};
 if(row.total_cost_cents<=0)return{status:'needs_costs',severity:'review',reason:'No project cost has been captured yet.'};
 if(row.project_profit_cents<0)return{status:'loss',severity:'high',reason:'Captured cost exceeds recorded revenue.'};
 if(row.margin_percent<15)return{status:'critical_margin',severity:'high',reason:'Recorded gross margin is below 15%.'};
 if(row.margin_percent<30)return{status:'thin_margin',severity:'warning',reason:'Recorded gross margin is below 30%.'};
 return{status:'healthy_margin',severity:'ok',reason:'Recorded revenue covers captured costs with at least 30% gross margin.'};
}

export async function loadProfitabilityIntelligence(db,{limit=60}={}){
 const required=['creative_project_profitability','creative_work_projects','creative_work_events'];
 const missing=[];for(const name of required)if(!(await exists(db,name)))missing.push(name);
 if(missing.length)return{schema_ready:false,missing_tables:missing,rows:[],summary:{projects:0,healthy:0,warning:0,high:0}};
 const hasExt=await exists(db,'creative_project_profitability_extensions');
 const hasLinks=await exists(db,'creative_project_product_links');
 const extFields=hasExt?`COALESCE(x.channel_fee_percent,0) channel_fee_percent,COALESCE(x.fixed_channel_fee_cents,p.channel_fee_cents,0) fixed_channel_fee_cents`:`0 channel_fee_percent,COALESCE(p.channel_fee_cents,0) fixed_channel_fee_cents`;
 const extJoin=hasExt?`LEFT JOIN creative_project_profitability_extensions x ON x.creative_work_project_id=p.creative_work_project_id`:``;
 const linked=hasLinks?`(SELECT COUNT(*) FROM creative_project_product_links l WHERE l.creative_work_project_id=p.creative_work_project_id) linked_product_count`:`0 linked_product_count`;
 const source=await all(db,`SELECT p.creative_work_project_id,w.project_title,w.project_status,COALESCE(e.tracked_minutes,0) tracked_minutes,COALESCE(e.material_cents,0) tracked_material_cost_cents,COALESCE(p.labour_rate_cents,0) labour_rate_cents,COALESCE(p.packaging_cost_cents,0) packaging_cost_cents,COALESCE(p.overhead_cost_cents,0) overhead_cost_cents,COALESCE(p.channel_fee_cents,0) channel_fee_cents,COALESCE(p.shipping_cost_cents,0) shipping_cost_cents,COALESCE(p.revenue_cents,0) revenue_cents,COALESCE(p.estimated_content_value_cents,0) estimated_content_value_cents,${extFields},${linked},p.updated_at FROM creative_project_profitability p LEFT JOIN creative_work_projects w ON w.creative_work_project_id=p.creative_work_project_id LEFT JOIN (SELECT creative_work_project_id,COALESCE(SUM(CASE WHEN COALESCE(entry_status,'active')='active' THEN duration_minutes ELSE 0 END),0) tracked_minutes,COALESCE(SUM(CASE WHEN COALESCE(entry_status,'active')='active' THEN material_cost_cents ELSE 0 END),0) material_cents FROM creative_work_events GROUP BY creative_work_project_id)e ON e.creative_work_project_id=p.creative_work_project_id ${extJoin} ORDER BY datetime(COALESCE(p.updated_at,'1970-01-01')) DESC LIMIT ?`,[Math.max(1,Math.min(i(limit)||60,150))]);
 const mapped=source.map((r)=>{const minutes=Math.max(0,n(r.tracked_minutes)),material=Math.max(0,i(r.tracked_material_cost_cents)),labourRate=Math.max(0,n(r.labour_rate_cents)),labour=Math.round(minutes/60*labourRate),packaging=Math.max(0,i(r.packaging_cost_cents)),overhead=Math.max(0,i(r.overhead_cost_cents)),fees=Math.max(0,i(r.channel_fee_cents)),shipping=Math.max(0,i(r.shipping_cost_cents)),revenue=Math.max(0,i(r.revenue_cents)),contentValue=Math.max(0,i(r.estimated_content_value_cents)),cost=material+labour+packaging+overhead+fees+shipping,profit=revenue-cost,margin=revenue>0?Number((profit/revenue*100).toFixed(1)):0;const row={creative_work_project_id:i(r.creative_work_project_id),project_title:t(r.project_title)||`Creative Project ${i(r.creative_work_project_id)}`,project_status:t(r.project_status)||'unknown',linked_product_count:Math.max(0,i(r.linked_product_count)),tracked_minutes:minutes,tracked_material_cost_cents:material,labour_rate_cents:labourRate,calculated_labour_cost_cents:labour,packaging_cost_cents:packaging,overhead_cost_cents:overhead,channel_fee_cents:fees,channel_fee_percent:Math.max(0,n(r.channel_fee_percent)),fixed_channel_fee_cents:Math.max(0,i(r.fixed_channel_fee_cents)),shipping_cost_cents:shipping,revenue_cents:revenue,estimated_content_value_cents:contentValue,total_cost_cents:cost,project_profit_cents:profit,project_value_after_cost_cents:revenue+contentValue-cost,margin_percent:margin,updated_at:r.updated_at||null};return{...row,...marginState(row)};});
 return{schema_ready:true,missing_tables:[],rows:mapped,summary:{projects:mapped.length,healthy:mapped.filter(x=>x.severity==='ok').length,warning:mapped.filter(x=>['warning','review'].includes(x.severity)).length,high:mapped.filter(x=>x.severity==='high').length,revenue_cents:mapped.reduce((s,x)=>s+x.revenue_cents,0),captured_cost_cents:mapped.reduce((s,x)=>s+x.total_cost_cents,0),project_profit_cents:mapped.reduce((s,x)=>s+x.project_profit_cents,0)},policy:{labour_formula:'tracked_minutes / 60 * labour_rate_cents',estimated_content_value_in_revenue_margin:false,mutation_capability:'none'}};
}

const finding=(kind,severity,label,details={})=>({kind,severity,label,details});
export async function loadFinancialAnomalies(db,closeWorkflow,{periodMonth=''}={}){
 const period=month(periodMonth||closeWorkflow?.period_month),findings=[];
 if(await exists(db,'accounting_payment_applications')){
  for(const r of await all(db,`SELECT LOWER(COALESCE(provider,'')) provider,transaction_reference,COUNT(*) duplicate_count,SUM(COALESCE(applied_amount_cents,0)) applied_amount_cents FROM accounting_payment_applications WHERE period_month=? AND TRIM(COALESCE(transaction_reference,''))<>'' GROUP BY LOWER(COALESCE(provider,'')),transaction_reference HAVING COUNT(*)>1 ORDER BY duplicate_count DESC LIMIT 30`,[period]))findings.push(finding('duplicate_payment_reference','high',`Duplicate payment reference ${t(r.transaction_reference)}`,r));
  if(await exists(db,'orders'))for(const r of await all(db,`SELECT a.order_id,COALESCE(o.order_number,'') order_number,MAX(COALESCE(o.total_cents,0)) order_total_cents,SUM(COALESCE(a.applied_amount_cents,0)) applied_amount_cents FROM accounting_payment_applications a JOIN orders o ON o.order_id=a.order_id WHERE a.period_month=? GROUP BY a.order_id,o.order_number HAVING SUM(COALESCE(a.applied_amount_cents,0))>MAX(COALESCE(o.total_cents,0))+1 LIMIT 30`,[period]))findings.push(finding('over_applied_order','high',`Applied payments exceed order ${t(r.order_number)||r.order_id}`,r));
 }
 if(await exists(db,'accounting_evidence_attachments'))for(const r of await all(db,`SELECT accounting_evidence_attachment_id,title,evidence_kind FROM accounting_evidence_attachments WHERE period_month=? AND TRIM(COALESCE(evidence_url,''))='' AND TRIM(COALESCE(object_key,''))='' LIMIT 50`,[period]))findings.push(finding('evidence_without_reference','warning',`Evidence lacks URL/object reference: ${t(r.title)||r.accounting_evidence_attachment_id}`,r));
 const payment=closeWorkflow?.payment?.summary||{},hst=closeWorkflow?.hst_review||{},closure=closeWorkflow?.closure||{},readiness=closeWorkflow?.close_readiness||{};
 const taxVariance=Math.abs(i(hst.sales_tax_collected_cents)-i(payment.tax_cents));if(taxVariance>100)findings.push(finding('tax_variance','warning','HST/GST review differs from order tax by more than $1',{tax_variance_cents:taxVariance,order_tax_cents:i(payment.tax_cents),review_tax_cents:i(hst.sales_tax_collected_cents)}));
 if(i(payment.outstanding_cents)>0)findings.push(finding('outstanding_balance','warning','Orders still have outstanding payment balance',{outstanding_cents:i(payment.outstanding_cents)}));
 if(['locked','closed'].includes(t(closure.lock_state).toLowerCase())&&Array.isArray(readiness.blockers)&&readiness.blockers.length)findings.push(finding('locked_with_blockers','high','Accounting period is locked/closed while close blockers remain',{blockers:readiness.blockers}));
 if(i(payment.order_count)>0&&i(closeWorkflow?.evidence_bundle_summary?.total_attachments)===0)findings.push(finding('orders_without_evidence','review','Period has orders but no accounting evidence attachments',{order_count:i(payment.order_count)}));
 const summary={total:findings.length,high:findings.filter(x=>x.severity==='high').length,warning:findings.filter(x=>x.severity==='warning').length,review:findings.filter(x=>x.severity==='review').length};
 return{period_month:period,findings,summary,mutation_capability:'none'};
}

export function buildMonthEndReadinessScore(closeWorkflow,anomalies){
 const closure=closeWorkflow?.closure||{},checklist=closure.close_checklist||{},hst=closeWorkflow?.hst_review||{},payment=closeWorkflow?.payment?.summary||{},evidence=closeWorkflow?.evidence_bundle_summary||{},exports=Array.isArray(closeWorkflow?.export_packages)?closeWorkflow.export_packages:[],high=i(anomalies?.summary?.high);
 const checks=[
  {key:'bank_reconciled',weight:20,pass:!!checklist.bank_reconciled,label:'Bank/reconciliation reviewed'},
  {key:'sales_tax_reviewed',weight:15,pass:!!checklist.sales_tax_reviewed||['reviewed','finalized','filed'].includes(t(hst.review_status).toLowerCase()),label:'HST/GST reviewed'},
  {key:'receipts_attached',weight:15,pass:!!checklist.receipts_attached,label:'Receipt/bill support reviewed'},
  {key:'no_outstanding_balance',weight:20,pass:i(payment.outstanding_cents)===0,label:'No outstanding order balance'},
  {key:'hst_remittance_state',weight:10,pass:['ready','reviewed','filed','paid','not_required'].includes(t(hst.remittance_status).toLowerCase())||i(hst.net_tax_payable_cents)===0,label:'HST/GST remittance state reviewed'},
  {key:'evidence_present',weight:5,pass:i(payment.order_count)===0||i(evidence.total_attachments)>0,label:'Evidence attached when transactions exist'},
  {key:'accountant_export',weight:5,pass:i(payment.order_count)===0||exports.length>0,label:'Accountant export package exists'},
  {key:'no_high_anomalies',weight:10,pass:high===0,label:'No high-severity financial anomalies'}];
 const score=checks.reduce((s,x)=>s+(x.pass?x.weight:0),0),status=score>=90&&closeWorkflow?.close_readiness?.ready===true?'ready':score>=70?'review':'blocked';
 return{score,status,checks,blockers:[...new Set([...(closeWorkflow?.close_readiness?.blockers||[]),...checks.filter(x=>!x.pass).map(x=>x.label)])],accounting_mutation_capability:'none'};
}

export async function loadItHealth(db,env={}){
 const migrations=await first(db,`SELECT (SELECT COUNT(*) FROM d1_migrations WHERE name IN ('0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql')) native_rows,(SELECT COUNT(*) FROM app_schema_migration_proofs WHERE migration_name IN ('0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql')) proof_rows,(SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name LIKE 'release465_%') release465_triggers,(SELECT COUNT(*) FROM app_modules) app_modules`,[],{native_rows:0,proof_rows:0,release465_triggers:0,app_modules:0});
 const incidents=await first(db,`SELECT SUM(CASE WHEN LOWER(COALESCE(review_status,'open'))='open' THEN 1 ELSE 0 END) open_count,SUM(CASE WHEN LOWER(COALESCE(review_status,'open'))='open' AND LOWER(COALESCE(severity,''))='critical' THEN 1 ELSE 0 END) open_critical,SUM(CASE WHEN LOWER(COALESCE(review_status,'open'))='open' AND LOWER(COALESCE(severity,''))='error' THEN 1 ELSE 0 END) open_error FROM runtime_incidents`,[],{open_count:0,open_critical:0,open_error:0});
 const retention=await first(db,`SELECT COUNT(*) pending_approval FROM operational_retention_reviews WHERE review_status='archived_pending_approval'`,[],{pending_approval:0});
 let fk=-1;try{fk=rows(await db.prepare('PRAGMA foreign_key_check').all()).length;}catch{}
 const resources={d1:!!(env.DB||env.DD_DB),product_r2:!!(env.PRODUCT_MEDIA_BUCKET||env.MEDIA_BUCKET||env.R2_PRODUCT_MEDIA),caip_r2:!!(env.CAIP_PRIVATE_MEDIA_BUCKET||env.CAIP_MEDIA_BUCKET)};
 const checks=[
  {key:'migrations',weight:25,pass:i(migrations.native_rows)===RELEASE465_EXPECTED_MIGRATIONS&&i(migrations.proof_rows)>=RELEASE465_EXPECTED_MIGRATIONS,label:'Canonical migration ledger/proof'},
  {key:'release465_triggers',weight:10,pass:i(migrations.release465_triggers)>=4,label:'Release 465 publication triggers'},
  {key:'five_modules',weight:10,pass:i(migrations.app_modules)===5,label:'Five-module platform authority'},
  {key:'foreign_keys',weight:20,pass:fk===0,label:'Foreign-key integrity'},
  {key:'d1_binding',weight:15,pass:resources.d1,label:'D1 binding'},
  {key:'product_r2',weight:5,pass:resources.product_r2,label:'Product R2 binding'},
  {key:'caip_r2',weight:5,pass:resources.caip_r2,label:'CAIP R2 binding'},
  {key:'no_critical_incidents',weight:5,pass:i(incidents.open_critical)===0,label:'No open critical runtime incidents'},
  {key:'no_error_incidents',weight:5,pass:i(incidents.open_error)===0,label:'No open error runtime incidents'}];
 let score=checks.reduce((s,x)=>s+(x.pass?x.weight:0),0);score=Math.max(0,score-Math.min(10,i(retention.pending_approval)*2));
 return{score,status:score>=90?'green':score>=70?'amber':'red',checks,migrations:{expected:RELEASE465_EXPECTED_MIGRATIONS,native_rows:i(migrations.native_rows),proof_rows:i(migrations.proof_rows),release465_triggers:i(migrations.release465_triggers),app_modules:i(migrations.app_modules)},foreign_key_violations:fk,runtime_incidents:{open_count:i(incidents.open_count),open_critical:i(incidents.open_critical),open_error:i(incidents.open_error)},retention_pending_approval:i(retention.pending_approval),resources,provider_execution_invoked:false,production_mutation_invoked:false,raw_r2_delete_invoked:false};
}

export async function loadRelease465BusinessHealth(db,env={}, {periodMonth=''}={}){
 const period=month(periodMonth),[closeWorkflow,profitability,itHealth]=await Promise.all([readAccountingCloseWorkflow(db,{periodMonth:period}),loadProfitabilityIntelligence(db),loadItHealth(db,env)]),financialAnomalies=await loadFinancialAnomalies(db,closeWorkflow,{periodMonth:period}),monthEndReadiness=buildMonthEndReadinessScore(closeWorkflow,financialAnomalies);
 return{period_month:period,profitability,financial_anomalies:financialAnomalies,month_end_readiness:monthEndReadiness,close_workflow:closeWorkflow,it_health:itHealth,policy:{read_only:true,accounting_posting:false,inventory_mutation:false,provider_execution:false,provider_publication:false,production_mutation:false,raw_r2_delete:false,request_time_schema_ddl:false}};
}
