// Release 467 Build 114 — pure Business Health Action Queue derivation.
// Converts existing read-only Business Health evidence into prioritized owner routing only.
export const BUSINESS_HEALTH_ACTION_QUEUE_BUILD=114;
export const BUSINESS_HEALTH_ACTION_QUEUE_TITLE='Business Health Action Queue & Owner Routing';
export const BUSINESS_HEALTH_OWNER_ROUTES=Object.freeze({finance:'/admin/finance/',month_end:'/admin/month-end/',creator_finance:'/admin/project-profitability-reconciliation/',it:'/admin/it/'});
const RANK=Object.freeze({blocking:0,attention:1,review:2});
const text=(value)=>String(value??'').trim();
const num=(value)=>Number.isFinite(Number(value))?Number(value):0;
const lower=(value)=>text(value).toLowerCase();
const stateFromSeverity=(severity)=>severity==='high'||severity==='critical'||severity==='error'?'blocking':severity==='warning'||severity==='warn'?'attention':'review';
const makeAction=(key,state,owner_module,owner_label,label,detail,href,evidence={})=>({key,state,priority:RANK[state]??2,owner_module,owner_label,label,detail,href,evidence,action_mode:'review-only'});
export function buildBusinessHealthActionQueue(health={}){
  const actions=[];const seen=new Set();
  const add=(row)=>{if(!row?.key||seen.has(row.key))return;seen.add(row.key);actions.push(row);};
  const anomalies=Array.isArray(health?.financial_anomalies?.findings)?health.financial_anomalies.findings:[];
  for(const finding of anomalies){const severity=lower(finding?.severity)||'review',kind=text(finding?.kind)||text(finding?.label)||'unknown';add(makeAction(`financial-anomaly:${kind}`,stateFromSeverity(severity),'finance','Finance & Accounting',text(finding?.label)||'Financial anomaly requires review',`Financial anomaly severity: ${severity}.`,BUSINESS_HEALTH_OWNER_ROUTES.finance,finding?.details||{}));}
  const month=health?.month_end_readiness||{};const monthChecks=Array.isArray(month?.checks)?month.checks:[];
  for(const check of monthChecks){if(check?.pass)continue;const key=text(check?.key)||text(check?.label)||'incomplete';const blocking=key==='no_outstanding_balance'||lower(month?.status)==='blocked';add(makeAction(`month-end:${key}`,blocking?'blocking':'attention','finance','Finance & Accounting',text(check?.label)||'Month-end check incomplete',`Month-end readiness check is incomplete (${num(check?.weight)} points).`,BUSINESS_HEALTH_OWNER_ROUTES.month_end,{weight:num(check?.weight),month_end_status:text(month?.status)}));}
  const projects=Array.isArray(health?.profitability?.rows)?health.profitability.rows:[];
  for(const project of projects){const severity=lower(project?.severity);if(!['high','warning','review'].includes(severity))continue;const projectId=Math.trunc(num(project?.creative_work_project_id));const status=lower(project?.status);const actionState=severity==='high'&&(status==='loss'||status==='critical_margin')?'blocking':severity==='high'||severity==='warning'?'attention':'review';add(makeAction(`profitability:${projectId||text(project?.project_title)}`,actionState,'creator_finance','Creators + Finance',text(project?.project_title)||`Creative Project ${projectId||''}`,text(project?.reason)||`Profitability state: ${status||severity}.`,BUSINESS_HEALTH_OWNER_ROUTES.creator_finance,{creative_work_project_id:projectId,margin_percent:num(project?.margin_percent),project_profit_cents:Math.trunc(num(project?.project_profit_cents)),profitability_status:status}));}
  const it=health?.it_health||{};const itChecks=Array.isArray(it?.checks)?it.checks:[];
  for(const check of itChecks){if(check?.pass)continue;const key=text(check?.key)||text(check?.label)||'health';const actionState=lower(it?.status)==='red'?'blocking':'attention';add(makeAction(`it:${key}`,actionState,'it','I.T.',text(check?.label)||'I.T. health check requires review',`I.T. health score is ${num(it?.score)}/100 and this check is not passing.`,BUSINESS_HEALTH_OWNER_ROUTES.it,{it_status:text(it?.status),it_score:num(it?.score),weight:num(check?.weight)}));}
  actions.sort((a,b)=>(a.priority-b.priority)||a.owner_label.localeCompare(b.owner_label)||a.label.localeCompare(b.label));
  const blocking_count=actions.filter(row=>row.state==='blocking').length,attention_count=actions.filter(row=>row.state==='attention').length,review_count=actions.filter(row=>row.state==='review').length;
  const state=blocking_count?'blocked':attention_count||review_count?'review':'ready';
  return{release:467,build:BUSINESS_HEALTH_ACTION_QUEUE_BUILD,title:BUSINESS_HEALTH_ACTION_QUEUE_TITLE,state,period_month:text(health?.period_month),summary:{action_count:actions.length,blocking_count,attention_count,review_count,owner_count:new Set(actions.map(row=>row.owner_module)).size},actions,boundaries:{read_only:true,mutation_capability:'none',automatic_business_action:false,accounting_posting:false,inventory_mutation:false,creative_mutation:false,provider_execution:false,provider_publication:false,request_time_schema_mutation:false,r2_mutation:false,production_mutation:false}};
}