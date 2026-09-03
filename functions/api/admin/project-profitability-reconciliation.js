// Release 467 Build 23 — read-only Creator ↔ Finance profitability reconciliation.
// Existing Creator facts and Finance profitability intelligence remain the owning authorities.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { loadProfitabilityIntelligence } from '../_lib/release465BusinessHealth.js';

const rows=(result)=>Array.isArray(result?.results)?result.results:[];
const num=(value)=>Number.isFinite(Number(value))?Number(value):0;
const integer=(value)=>Math.round(num(value));
const text=(value,max=500)=>normalizeText(value||'').slice(0,max);
const json=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});

async function tableExists(db,name){
  const row=await db.prepare("SELECT 1 ok FROM sqlite_schema WHERE type='table' AND name=? LIMIT 1").bind(name).first().catch(()=>null);
  return Boolean(row?.ok);
}
async function groupedEvents(db){
  if(!(await tableExists(db,'creative_work_events')))return new Map();
  const result=rows(await db.prepare(`SELECT creative_work_project_id,COUNT(CASE WHEN TRIM(COALESCE(material_name,''))<>'' THEN 1 END) material_count,COALESCE(SUM(CASE WHEN COALESCE(entry_status,'active')='active' THEN material_cost_cents ELSE 0 END),0) tracked_material_cost_cents,COALESCE(SUM(CASE WHEN COALESCE(entry_status,'active')='active' THEN duration_minutes ELSE 0 END),0) tracked_minutes FROM creative_work_events GROUP BY creative_work_project_id`).all().catch(()=>({results:[]})));
  return new Map(result.map((row)=>[integer(row.creative_work_project_id),row]));
}
async function groupedOutputs(db){
  if(!(await tableExists(db,'creative_work_outputs')))return new Map();
  const result=rows(await db.prepare(`SELECT creative_work_project_id,COUNT(*) output_count,SUM(CASE WHEN output_status='complete' THEN 1 ELSE 0 END) completed_output_count FROM creative_work_outputs GROUP BY creative_work_project_id`).all().catch(()=>({results:[]})));
  return new Map(result.map((row)=>[integer(row.creative_work_project_id),row]));
}
function buildReconciliation(project,eventFacts,outputFacts,financeRow){
  const creatorRevenue=Math.max(0,integer(project.sales_revenue_cents));
  const creatorActualCost=Math.max(0,integer(project.actual_cost_cents));
  const creatorTrackedMaterialCost=Math.max(0,integer(eventFacts.tracked_material_cost_cents));
  const creatorCost=creatorActualCost>0?creatorActualCost:creatorTrackedMaterialCost;
  const creatorCostSource=creatorActualCost>0?'creative_work_projects.actual_cost_cents':creatorTrackedMaterialCost>0?'creative_work_events.material_cost_cents':null;
  const creatorResultAvailable=creatorRevenue>0||creatorCost>0;
  const creatorRoughResult=creatorResultAvailable?creatorRevenue-creatorCost:null;
  const financePresent=Boolean(financeRow);
  const financeRevenue=financePresent?integer(financeRow.revenue_cents):null;
  const financeCost=financePresent?integer(financeRow.total_cost_cents):null;
  const financeProfit=financePresent?integer(financeRow.project_profit_cents):null;
  const variance=creatorRoughResult!==null&&financeProfit!==null?creatorRoughResult-financeProfit:null;
  const attention=[];
  if(!financePresent)attention.push({lane:'finance_record',severity:'high',label:'Recorded profitability evidence is missing'});
  if(!creatorCostSource)attention.push({lane:'creator_cost',severity:'review',label:'Creator project has no positive actual or tracked material cost'});
  if(financePresent&&financeCost<=0)attention.push({lane:'finance_cost',severity:'review',label:'Finance profitability evidence has no captured project cost'});
  if(creatorRevenue<=0)attention.push({lane:'revenue',severity:'review',label:'Creator project has no recorded sales revenue'});
  if(variance!==null&&variance!==0)attention.push({lane:'variance',severity:'review',label:'Creator rough result differs from recorded profitability result',variance_cents:variance});
  if(!attention.length)attention.push({lane:'reconciled',severity:'ok',label:'Creator and recorded profitability evidence currently reconcile'});
  const priority=(!financePresent?40:0)+(!creatorCostSource?25:0)+(financePresent&&financeCost<=0?20:0)+(variance!==null&&variance!==0?15:0)+(creatorRevenue<=0?10:0);
  return {creative_work_project_id:integer(project.creative_work_project_id),project_key:text(project.project_key,160),project_title:text(project.project_title,240)||`Creative Project ${integer(project.creative_work_project_id)}`,project_type:text(project.project_type,120),project_status:text(project.project_status,80),updated_at:project.updated_at||null,creator_evidence:{revenue_cents:creatorRevenue,cost_cents:creatorCost,cost_source:creatorCostSource,actual_cost_cents:creatorActualCost,tracked_material_cost_cents:creatorTrackedMaterialCost,material_count:integer(eventFacts.material_count),tracked_minutes:num(eventFacts.tracked_minutes),output_count:integer(outputFacts.output_count),completed_output_count:integer(outputFacts.completed_output_count),rough_project_result_cents:creatorRoughResult,interpretation:'Creator result is a rough project result and is not accounting posting truth.'},finance_evidence:financePresent?{revenue_cents:financeRevenue,total_cost_cents:financeCost,project_profit_cents:financeProfit,margin_percent:num(financeRow.margin_percent),tracked_material_cost_cents:integer(financeRow.tracked_material_cost_cents),calculated_labour_cost_cents:integer(financeRow.calculated_labour_cost_cents),packaging_cost_cents:integer(financeRow.packaging_cost_cents),overhead_cost_cents:integer(financeRow.overhead_cost_cents),channel_fee_cents:integer(financeRow.channel_fee_cents),shipping_cost_cents:integer(financeRow.shipping_cost_cents),profitability_status:text(financeRow.status,80),profitability_reason:text(financeRow.reason,280),updated_at:financeRow.updated_at||null,source:'existing Finance profitability intelligence'}:null,variance_cents:variance,priority_score:priority,attention,owner_links:{creator:'/admin/creative-process/',creator_completeness:'/admin/creator-content-completeness/',finance:'/admin/finance/',accounting:'/admin/accounting/'}};
}
export async function onRequestGet(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser)return json({ok:false,error:'Admin access required.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  try{
    const projectReady=await tableExists(db,'creative_work_projects');
    const eventsReady=await tableExists(db,'creative_work_events');
    const outputsReady=await tableExists(db,'creative_work_outputs');
    const profitabilityReady=await tableExists(db,'creative_project_profitability');
    if(!projectReady)return json({ok:true,release:467,build:23,authority:'read_only_cross_module_reconciliation',schema_ready:false,table_readiness:{creative_work_projects:false,creative_work_events:eventsReady,creative_work_outputs:outputsReady,creative_project_profitability:profitabilityReady},summary:{projects:0,finance_record_missing:0,creator_cost_missing:0,finance_cost_missing:0,revenue_missing:0,variance_review:0,reconciled:0},projects:[],policy:{accounting_posting:false,automatic_project_mutation:false,automatic_finance_mutation:false,provider_execution:false,request_time_schema_mutation:false}});
    const projectRows=rows(await db.prepare('SELECT * FROM creative_work_projects ORDER BY datetime(updated_at) DESC,creative_work_project_id DESC LIMIT 160').all());
    const eventMap=await groupedEvents(db);const outputMap=await groupedOutputs(db);
    const profitability=profitabilityReady?await loadProfitabilityIntelligence(db,{limit:150}):{schema_ready:false,missing_tables:['creative_project_profitability'],rows:[]};
    const financeMap=new Map((profitability.rows||[]).map((row)=>[integer(row.creative_work_project_id),row]));
    const projects=projectRows.map((project)=>{const id=integer(project.creative_work_project_id);return buildReconciliation(project,eventMap.get(id)||{},outputMap.get(id)||{},financeMap.get(id)||null);}).sort((a,b)=>b.priority_score-a.priority_score||String(b.updated_at||'').localeCompare(String(a.updated_at||'')));
    const hasLane=(project,lane)=>project.attention.some((item)=>item.lane===lane);
    const summary={projects:projects.length,finance_record_missing:projects.filter((p)=>hasLane(p,'finance_record')).length,creator_cost_missing:projects.filter((p)=>hasLane(p,'creator_cost')).length,finance_cost_missing:projects.filter((p)=>hasLane(p,'finance_cost')).length,revenue_missing:projects.filter((p)=>hasLane(p,'revenue')).length,variance_review:projects.filter((p)=>hasLane(p,'variance')).length,reconciled:projects.filter((p)=>hasLane(p,'reconciled')).length};
    return json({ok:true,release:467,build:23,authority:'read_only_cross_module_reconciliation',schema_ready:projectReady&&eventsReady&&profitabilityReady,table_readiness:{creative_work_projects:projectReady,creative_work_events:eventsReady,creative_work_outputs:outputsReady,creative_project_profitability:profitabilityReady},summary,projects,finance_intelligence:{schema_ready:Boolean(profitability.schema_ready),missing_tables:profitability.missing_tables||[],policy:profitability.policy||null},policy:{creator_result_is_accounting_truth:false,reconciliation_is_posting:false,accounting_posting:false,automatic_project_mutation:false,automatic_finance_mutation:false,provider_execution:false,provider_publication:false,request_time_schema_mutation:false,production_mutation:false}});
  }catch(error){return json({ok:false,error:'Creator and Finance profitability reconciliation could not be loaded.',detail:String(error?.message||error),accounting_posting:false,automatic_project_mutation:false,automatic_finance_mutation:false,request_time_schema_mutation:false},500);}
}
