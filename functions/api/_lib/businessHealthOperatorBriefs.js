// Release 467 Build 116 — pure Business Health Operator Briefs & Export derivation.
// Converts Build 115 human-review packs into deterministic review order and export-ready Markdown.
export const BUSINESS_HEALTH_OPERATOR_BRIEFS_BUILD=116;
export const BUSINESS_HEALTH_OPERATOR_BRIEFS_TITLE='Business Health Operator Briefs & Export';

const RANK=Object.freeze({blocking:0,attention:1,review:2,ready:3});
const text=(value)=>String(value??'').trim();
const stateRank=(value)=>RANK[text(value).toLowerCase()]??2;
const safeEvidenceValue=(value)=>{
  if(value===null||value===undefined)return'';
  if(typeof value==='object'){
    try{return JSON.stringify(value);}catch{return'[unavailable]';}
  }
  return text(value);
};
const evidenceFacts=(evidence={})=>Object.entries(evidence&&typeof evidence==='object'&&!Array.isArray(evidence)?evidence:{})
  .filter(([,value])=>value!==undefined&&typeof value!=='function')
  .sort(([a],[b])=>a.localeCompare(b))
  .map(([key,value])=>({key,label:key.replaceAll('_',' '),value:safeEvidenceValue(value)}));
const md=(value)=>text(value).replace(/([\\`*_{}\[\]<>#+.!|])/g,'\\$1');

function ownerBrief(pack={}){
  const actions=(Array.isArray(pack.actions)?pack.actions:[]).map((action)=>({
    key:text(action.key),state:text(action.state)||'review',priority:Number.isFinite(Number(action.priority))?Number(action.priority):2,
    label:text(action.label)||'Review Business Health evidence',detail:text(action.detail)||'Review existing evidence.',
    href:text(action.href)||text(pack.href)||'/admin/',evidence:evidenceFacts(action.evidence),human_review_required:true,action_mode:'review-only'
  })).sort((a,b)=>(a.priority-b.priority)||a.label.localeCompare(b.label));
  const review_steps=(Array.isArray(pack.review_steps)?pack.review_steps:[]).map(text).filter(Boolean);
  const state=text(pack.state)||actions[0]?.state||'review';
  const evidence_fact_count=actions.reduce((sum,row)=>sum+row.evidence.length,0);
  return{
    owner_key:text(pack.owner_key)||'review',owner_label:text(pack.owner_label)||'Review owner',href:text(pack.href)||'/admin/',
    state,priority:stateRank(state),action_count:actions.length,evidence_fact_count,top_action:actions[0]||null,
    actions,review_steps,handoff_mode:'human-review-only',export_mode:'read-only-download',server_persistence:false,
    acknowledgement_persistence:false,mutation_capability:'none'
  };
}

function briefMarkdown(brief){
  const lines=[`## ${md(brief.owner_label)} — ${md(brief.state.toUpperCase())}`,'',`Owner workspace: ${md(brief.href)}`,`Actions: ${brief.action_count}`,''];
  if(!brief.actions.length)lines.push('No queued actions.','');
  brief.actions.forEach((action,index)=>{
    lines.push(`${index+1}. **${md(action.state.toUpperCase())} — ${md(action.label)}**`);
    lines.push(`   - Detail: ${md(action.detail)}`);
    lines.push(`   - Workspace: ${md(action.href)}`);
    if(action.evidence.length){
      lines.push('   - Evidence:');
      for(const fact of action.evidence)lines.push(`     - ${md(fact.label)}: ${md(fact.value)}`);
    }else lines.push('   - Evidence: no structured evidence keys carried; review the linked source workspace.');
  });
  lines.push('','### Human review steps');
  (brief.review_steps.length?brief.review_steps:['Review the linked source workspace and use only the existing owning module for any deliberate correction.'])
    .forEach((step,index)=>lines.push(`${index+1}. ${md(step)}`));
  lines.push('','Boundary: review/export only; no acknowledgement is stored and no business mutation is authorized.','');
  return lines.join('\n');
}

export function buildBusinessHealthOperatorBriefs(health={},reviewPacks={}){
  const briefs=(Array.isArray(reviewPacks?.packs)?reviewPacks.packs:[]).map(ownerBrief)
    .sort((a,b)=>(a.priority-b.priority)||a.owner_label.localeCompare(b.owner_label));
  const review_plan=[];
  for(const brief of briefs){
    for(const action of brief.actions){
      review_plan.push({position:review_plan.length+1,owner_key:brief.owner_key,owner_label:brief.owner_label,state:action.state,
        label:action.label,detail:action.detail,href:action.href,evidence_present:action.evidence.length>0,evidence_fact_count:action.evidence.length,
        action_mode:'review-only',human_review_required:true});
    }
  }
  const period_month=text(health?.period_month)||text(reviewPacks?.period_month);
  const state=briefs.some(row=>row.state==='blocking')?'blocked':briefs.length?'review':'ready';
  const summary={brief_count:briefs.length,action_count:review_plan.length,blocking_brief_count:briefs.filter(row=>row.state==='blocking').length,
    evidence_fact_count:briefs.reduce((sum,row)=>sum+row.evidence_fact_count,0),owner_count:briefs.length};
  const header=['# Devil n Dove Business Health Operator Brief','',`Period: ${md(period_month||'current')}`,`State: ${md(state.toUpperCase())}`,
    `Source: Release 467 Build 116 read-only operator briefing over Build 115 review packs.`,'','## Review order'];
  if(review_plan.length){
    for(const row of review_plan)header.push(`${row.position}. **${md(row.state.toUpperCase())} — ${md(row.owner_label)}:** ${md(row.label)}`);
  }else header.push('No Business Health actions are currently queued. READY remains informational and authorizes no automatic action.');
  const combined_markdown=[...header,'',...briefs.flatMap((brief)=>briefMarkdown(brief).split('\n')),'','---','Generated from current read-only Business Health evidence. Existing module write authorities remain unchanged.',''].join('\n');
  return{release:467,build:BUSINESS_HEALTH_OPERATOR_BRIEFS_BUILD,title:BUSINESS_HEALTH_OPERATOR_BRIEFS_TITLE,state,period_month,summary,review_plan,
    briefs:briefs.map(brief=>({...brief,markdown:briefMarkdown(brief)})),combined_markdown,boundaries:{read_only:true,handoff_mode:'human-review-only',export_mode:'read-only-download',server_persistence:false,
      acknowledgement_persistence:false,resolution_persistence:false,mutation_capability:'none',automatic_business_action:false,accounting_posting:false,period_close:false,
      inventory_mutation:false,creative_mutation:false,price_mutation:false,provider_execution:false,provider_publication:false,request_time_schema_mutation:false,
      d1_business_data_mutation:false,r2_mutation:false,binding_mutation:false,production_mutation:false}};
}
