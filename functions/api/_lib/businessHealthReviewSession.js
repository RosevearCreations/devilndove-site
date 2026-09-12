// Release 467 Build 120 — pure Business Health Owner Context Transfer & Review Session Packet.
// Converts the existing Build 119 human review order into URL-only owner handoff context.
export const BUSINESS_HEALTH_REVIEW_SESSION_BUILD=120;
export const BUSINESS_HEALTH_REVIEW_SESSION_TITLE='Business Health Owner Context Transfer & Review Session Packet';
const t=v=>String(v??'').trim();
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const md=v=>t(v).replace(/([\\`*_{}\[\]<>#+.!|])/g,'\\$1');
const safeAdminHref=v=>{const x=t(v);return x.startsWith('/admin/')?x:'/admin/';};
function contextHref(href,row,period){
  const url=new URL(safeAdminHref(href),'https://devilndove.local');
  url.searchParams.set('business_health_source','build120');
  url.searchParams.set('business_health_period',period||'current');
  url.searchParams.set('business_health_owner',t(row?.owner_module)||'review');
  url.searchParams.set('business_health_state',t(row?.decision_state)||'review');
  const action=t(row?.top_action?.key)||t(row?.action_keys?.[0]);if(action)url.searchParams.set('business_health_action',action.slice(0,160));
  url.searchParams.set('business_health_persistent',String(n(row?.summary?.persistent_worsening_count)));
  url.searchParams.set('business_health_newly_worsening',String(n(row?.summary?.newly_worsening_count)));
  return `${url.pathname}${url.search}${url.hash}`;
}
export function buildBusinessHealthReviewSession(decisionBrief={},actionQueue={},rollingTrend={}){
  const period=t(decisionBrief?.period_month)||t(rollingTrend?.periods?.current)||'current';
  const matrix=Array.isArray(decisionBrief?.owner_priority_matrix)?decisionBrief.owner_priority_matrix:[];
  const actions=Array.isArray(actionQueue?.actions)?actionQueue.actions:[];
  const steps=matrix.map((row,index)=>{
    const actionKeys=(Array.isArray(row?.action_keys)?row.action_keys:[]).map(t).filter(Boolean).slice(0,12);
    const signalKeys=(Array.isArray(row?.trend_signal_keys)?row.trend_signal_keys:[]).map(t).filter(Boolean).slice(0,12);
    const top=row?.top_action||actions.find(x=>actionKeys.includes(t(x?.key)))||null;
    const normalized={...row,top_action:top};
    return{review_order:index+1,owner_module:t(row?.owner_module)||'review',owner_label:t(row?.owner_label)||'Owner review',decision_state:t(row?.decision_state)||'review',period_month:period,context_href:contextHref(row?.href,normalized,period),human_decision_required:row?.human_decision_required===true,trend_scope:t(row?.trend_scope)||'current_snapshot_only',top_action_key:t(top?.key),top_action_label:t(top?.label)||'Review current evidence',action_keys:actionKeys,trend_signal_keys:signalKeys,evidence_summary:{action_count:n(row?.summary?.action_count),blocking_count:n(row?.summary?.blocking_count),attention_count:n(row?.summary?.attention_count),review_count:n(row?.summary?.review_count),persistent_worsening_count:n(row?.summary?.persistent_worsening_count),newly_worsening_count:n(row?.summary?.newly_worsening_count),recovery_signal_count:n(row?.summary?.recovery_signal_count)}};
  });
  const state=t(decisionBrief?.state)||'ready';
  const lines=['# Devil n Dove Business Health Review Session Packet','',`Period: ${md(period)}`,`Decision state: ${md(state.toUpperCase().replaceAll('_',' '))}`,'','## Owner handoff order'];
  if(steps.length)steps.forEach(step=>{lines.push(`${step.review_order}. **${md(step.owner_label)} — ${md(step.decision_state.toUpperCase().replaceAll('_',' '))}**`);lines.push(`   - Open with context: ${md(step.context_href)}`);lines.push(`   - Top existing action: ${md(step.top_action_label)}`);lines.push(`   - Evidence: ${step.evidence_summary.action_count} action(s), ${step.evidence_summary.persistent_worsening_count} persistent worsening, ${step.evidence_summary.newly_worsening_count} newly worsening.`);});else lines.push('No owner handoff is currently required.');
  lines.push('','## Context-transfer boundary','Context is carried only in the owner-workspace URL and this downloaded packet. No review session, decision, acknowledgement, approval or resolution is stored.','The Build 114 action queue and Build 119 decision matrix remain authoritative. Destination pages display context only; they do not execute the recommended action.','');
  return{release:467,build:BUSINESS_HEALTH_REVIEW_SESSION_BUILD,title:BUSINESS_HEALTH_REVIEW_SESSION_TITLE,state,period_month:period,summary:{review_step_count:steps.length,human_decision_count:steps.filter(x=>x.human_decision_required).length,context_link_count:steps.length,persistent_worsening_count:steps.reduce((s,x)=>s+x.evidence_summary.persistent_worsening_count,0)},review_steps:steps,markdown:lines.join('\n'),boundaries:{read_only:true,existing_action_queue_authoritative:true,build119_decision_matrix_authoritative:true,second_action_queue_created:false,url_context_only:true,review_session_persistence:false,context_persistence:false,decision_persistence:false,approval_persistence:false,acknowledgement_persistence:false,resolution_persistence:false,trend_history_persistence:false,automatic_business_action:false,mutation_capability:'none',accounting_posting:false,period_close:false,inventory_mutation:false,creative_mutation:false,price_mutation:false,provider_execution:false,provider_publication:false,request_time_schema_mutation:false,d1_business_data_mutation:false,r2_mutation:false,binding_mutation:false,production_mutation:false}};
}
