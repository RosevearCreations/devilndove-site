// Release 467 Build 119 — pure Business Health Escalation Decision Brief & Owner Priority Matrix.
// Synthesizes existing read-only action/trend authorities; it does not create a second action queue.
import { BUSINESS_HEALTH_OWNER_ROUTES } from './businessHealthActionQueue.js';
export const BUSINESS_HEALTH_DECISION_BRIEF_BUILD=119;
export const BUSINESS_HEALTH_DECISION_BRIEF_TITLE='Business Health Escalation Decision Brief & Owner Priority Matrix';
const t=v=>String(v??'').trim();
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const OWNER_LABELS=Object.freeze({finance:'Finance & Accounting',creator_finance:'Creators + Finance',it:'I.T.'});
const OWNER_ROUTES=Object.freeze({finance:BUSINESS_HEALTH_OWNER_ROUTES.finance,creator_finance:BUSINESS_HEALTH_OWNER_ROUTES.creator_finance,it:BUSINESS_HEALTH_OWNER_ROUTES.it});
const STATE_RANK=Object.freeze({priority_review:0,blocking_review:1,review:2,observe_recovery:3,ready:4});
const financeTrendState=s=>['persistent_worsening','reversal_worsening','newly_worsening','recovering','stabilized_after_worsening','sustained_improving','stable_or_mixed'].includes(t(s))?t(s):'stable_or_mixed';
const md=v=>t(v).replace(/([\\`*_{}\[\]<>#+.!|])/g,'\\$1');

export function buildBusinessHealthDecisionBrief(health={},actionQueue={},reviewPacks={},operatorBriefs={},rollingTrend={}){
  const actions=Array.isArray(actionQueue?.actions)?actionQueue.actions:[];
  const packs=Array.isArray(reviewPacks?.packs)?reviewPacks.packs:[];
  const briefs=Array.isArray(operatorBriefs?.briefs)?operatorBriefs.briefs:[];
  const signals=Array.isArray(rollingTrend?.signals)?rollingTrend.signals:[];
  const ownerKeys=new Set(actions.map(x=>t(x.owner_module)).filter(Boolean));
  packs.forEach(x=>ownerKeys.add(t(x.owner_module)||t(x.owner_key)));
  briefs.forEach(x=>ownerKeys.add(t(x.owner_module)||t(x.owner_key)));
  if(signals.length)ownerKeys.add('finance');
  const packMap=new Map(packs.map(x=>[t(x.owner_module)||t(x.owner_key),x]));
  const briefMap=new Map(briefs.map(x=>[t(x.owner_module)||t(x.owner_key),x]));
  const matrix=[...ownerKeys].filter(Boolean).map(owner_module=>{
    const ownerActions=actions.filter(x=>t(x.owner_module)===owner_module);
    const pack=packMap.get(owner_module)||{};
    const brief=briefMap.get(owner_module)||{};
    const ownerSignals=owner_module==='finance'?signals.map(x=>({...x,state:financeTrendState(x.state)})):[];
    const persistent=ownerSignals.filter(x=>x.state==='persistent_worsening').length;
    const newly=ownerSignals.filter(x=>['reversal_worsening','newly_worsening'].includes(x.state)).length;
    const recovering=ownerSignals.filter(x=>['recovering','stabilized_after_worsening','sustained_improving'].includes(x.state)).length;
    const blocking=ownerActions.filter(x=>x.state==='blocking').length;
    const attention=ownerActions.filter(x=>x.state==='attention').length;
    const review=ownerActions.filter(x=>x.state==='review').length;
    const decision_state=persistent?'priority_review':blocking?'blocking_review':newly||attention||review?'review':recovering?'observe_recovery':'ready';
    const priority_score=persistent*100+newly*60+blocking*40+attention*15+review*5+recovering;
    const owner_label=t(ownerActions[0]?.owner_label)||t(pack.owner_label)||t(brief.owner_label)||OWNER_LABELS[owner_module]||owner_module;
    const href=t(ownerActions[0]?.href)||t(pack.href)||t(brief.href)||OWNER_ROUTES[owner_module]||'/admin/';
    return{
      owner_module,owner_label,href,decision_state,priority_score,
      human_decision_required:['priority_review','blocking_review','review'].includes(decision_state),
      trend_scope:owner_module==='finance'?'period_specific_operational_quality':'current_snapshot_only',
      historical_claim:owner_module==='finance'?'period-specific operational-quality only':'none',
      summary:{action_count:ownerActions.length,blocking_count:blocking,attention_count:attention,review_count:review,persistent_worsening_count:persistent,newly_worsening_count:newly,recovery_signal_count:recovering},
      action_keys:ownerActions.map(x=>t(x.key)).filter(Boolean),
      trend_signal_keys:ownerSignals.map(x=>t(x.key)).filter(Boolean),
      top_action:ownerActions[0]||brief.top_action||null
    };
  }).sort((a,b)=>(STATE_RANK[a.decision_state]??9)-(STATE_RANK[b.decision_state]??9)||b.priority_score-a.priority_score||a.owner_label.localeCompare(b.owner_label));
  const priorityOwners=matrix.filter(x=>x.human_decision_required);
  const persistent=signals.filter(x=>x.state==='persistent_worsening').length;
  const newly=signals.filter(x=>['reversal_worsening','newly_worsening'].includes(x.state)).length;
  const blocking=actions.filter(x=>x.state==='blocking').length;
  const decision_state=persistent?'priority_review':blocking?'blocking_review':newly||priorityOwners.length?'review':matrix.some(x=>x.decision_state==='observe_recovery')?'observe_recovery':'ready';
  const top_actions=actions.slice(0,5);
  const lines=['# Devil n Dove Business Health Escalation Decision Brief','',`Period: ${md(health?.period_month||rollingTrend?.periods?.current||'current')}`,`Decision state: ${md(decision_state.toUpperCase())}`,'','## Owner priority matrix'];
  if(matrix.length)matrix.forEach((row,index)=>lines.push(`${index+1}. **${md(row.decision_state.toUpperCase().replaceAll('_',' '))} — ${md(row.owner_label)}** — ${row.summary.action_count} current action(s), ${row.summary.persistent_worsening_count} persistent worsening signal(s).`));else lines.push('No owner review is currently required.');
  lines.push('','## Existing top actions');
  if(top_actions.length)top_actions.forEach((row,index)=>lines.push(`${index+1}. ${md(row.owner_label||row.owner_module)} — ${md(row.label)} (${md(row.state)})`));else lines.push('No current Business Health actions are queued.');
  lines.push('','## Decision boundary','This brief prioritizes human review only. It does not acknowledge, approve, resolve, post, close, mutate or execute anything.','Finance trend context is period-specific operational quality only. Profitability and I.T. remain current snapshots and are not represented as historical trends.','');
  return{
    release:467,build:BUSINESS_HEALTH_DECISION_BRIEF_BUILD,title:BUSINESS_HEALTH_DECISION_BRIEF_TITLE,state:decision_state,period_month:t(health?.period_month)||t(rollingTrend?.periods?.current),
    summary:{owner_count:matrix.length,owner_decision_count:priorityOwners.length,action_count:actions.length,blocking_action_count:blocking,persistent_worsening_count:persistent,newly_worsening_count:newly,top_action_count:top_actions.length},
    owner_priority_matrix:matrix,priority_owners:priorityOwners,top_actions,rolling_state:t(rollingTrend?.state)||'stable',markdown:lines.join('\n'),
    boundaries:{read_only:true,existing_action_queue_authoritative:true,second_action_queue_created:false,human_decision_only:true,decision_persistence:false,approval_persistence:false,acknowledgement_persistence:false,resolution_persistence:false,trend_history_persistence:false,profitability_historical_claim:false,it_historical_claim:false,mutation_capability:'none',automatic_business_action:false,accounting_posting:false,period_close:false,inventory_mutation:false,creative_mutation:false,price_mutation:false,provider_execution:false,provider_publication:false,request_time_schema_mutation:false,d1_business_data_mutation:false,r2_mutation:false,binding_mutation:false,production_mutation:false}
  };
}
