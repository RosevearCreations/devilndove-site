// Release 467 Build 115 — pure Business Health Review Packs & Owner Handoff derivation.
// Groups existing Build 114 review-only actions into deterministic human handoff packs.
export const BUSINESS_HEALTH_REVIEW_PACKS_BUILD=115;
export const BUSINESS_HEALTH_REVIEW_PACKS_TITLE='Business Health Review Packs & Owner Handoff';

const RANK=Object.freeze({blocking:0,attention:1,review:2});
const text=(value)=>String(value??'').trim();
const num=(value)=>Number.isFinite(Number(value))?Number(value):0;
const cloneEvidence=(value)=>{
  if(!value||typeof value!=='object'||Array.isArray(value))return{};
  const out={};
  for(const [key,item] of Object.entries(value)){
    if(item===undefined||typeof item==='function')continue;
    out[key]=item;
  }
  return out;
};
const handoffKey=(action={})=>{
  const key=text(action.key);
  if(key.startsWith('month-end:'))return'month_end';
  return text(action.owner_module)||'review';
};
const ownerMeta=(key,action={})=>{
  const fallback={label:text(action.owner_label)||'Review owner',href:text(action.href)||'/admin/'};
  if(key==='finance')return{label:'Finance & Accounting',href:'/admin/finance/'};
  if(key==='month_end')return{label:'Month End',href:'/admin/month-end/'};
  if(key==='creator_finance')return{label:'Creators + Finance',href:'/admin/project-profitability-reconciliation/'};
  if(key==='it')return{label:'I.T.',href:'/admin/it/'};
  return fallback;
};
const reviewSteps=(key)=>{
  if(key==='finance')return[
    'Review the anomaly and supporting transaction/evidence in the existing Finance workspace.',
    'Resolve or document the issue using the existing Finance/Accounting write owner only.',
    'Rerun Business Health after the deliberate operator action; this review pack never posts automatically.'
  ];
  if(key==='month_end')return[
    'Open Month End and review the failed readiness check plus its supporting evidence.',
    'Complete any deliberate close/evidence work through the existing Month End or Accounting owner.',
    'Rerun Business Health; this pack does not close a period or mark evidence complete.'
  ];
  if(key==='creator_finance')return[
    'Review captured project costs, revenue and margin evidence in the existing profitability workspace.',
    'Correct source evidence only through the existing Creator/Finance owners if a deliberate change is required.',
    'Rerun Business Health; this pack does not change Inventory, Creative records, pricing or revenue.'
  ];
  if(key==='it')return[
    'Open I.T. and review the failing health dimension and corrective guidance.',
    'Use the existing I.T./release workflow for any deliberate infrastructure or release correction.',
    'Rerun Business Health; this pack does not repair D1/R2, bindings, deployments or provider state automatically.'
  ];
  return[
    'Review the linked owner workspace and underlying evidence.',
    'Use the existing owning module for any deliberate correction.',
    'Rerun Business Health after review; no mutation is authorized by this pack.'
  ];
};

export function buildBusinessHealthReviewPacks(health={},queue={}){
  const actions=Array.isArray(queue?.actions)?queue.actions:[];
  const grouped=new Map();
  for(const action of actions){
    const owner_key=handoffKey(action);
    const meta=ownerMeta(owner_key,action);
    if(!grouped.has(owner_key)){
      grouped.set(owner_key,{owner_key,owner_label:meta.label,href:meta.href,actions:[]});
    }
    const evidence=cloneEvidence(action?.evidence);
    grouped.get(owner_key).actions.push({
      key:text(action?.key),
      state:text(action?.state)||'review',
      priority:Number.isFinite(Number(action?.priority))?Number(action.priority):2,
      label:text(action?.label)||'Review Business Health evidence',
      detail:text(action?.detail)||'Review existing evidence.',
      href:text(action?.href)||meta.href,
      evidence,
      evidence_key_count:Object.keys(evidence).length,
      evidence_present:Object.keys(evidence).length>0,
      action_mode:'review-only',
      human_review_required:true
    });
  }
  const packs=[...grouped.values()].map((pack)=>{
    pack.actions.sort((a,b)=>(a.priority-b.priority)||a.label.localeCompare(b.label));
    const blocking_count=pack.actions.filter((row)=>row.state==='blocking').length;
    const attention_count=pack.actions.filter((row)=>row.state==='attention').length;
    const review_count=pack.actions.filter((row)=>row.state==='review').length;
    const highest_state=blocking_count?'blocking':attention_count?'attention':'review';
    return{
      ...pack,
      state:highest_state,
      priority:RANK[highest_state]??2,
      action_count:pack.actions.length,
      blocking_count,
      attention_count,
      review_count,
      review_steps:reviewSteps(pack.owner_key),
      handoff_mode:'human-review-only',
      acknowledgement_persistence:false,
      mutation_capability:'none'
    };
  });
  packs.sort((a,b)=>(a.priority-b.priority)||a.owner_label.localeCompare(b.owner_label));
  const evidence_action_count=packs.reduce((sum,pack)=>sum+pack.actions.filter((row)=>row.evidence_present).length,0);
  return{
    release:467,
    build:BUSINESS_HEALTH_REVIEW_PACKS_BUILD,
    title:BUSINESS_HEALTH_REVIEW_PACKS_TITLE,
    state:packs.some((pack)=>pack.state==='blocking')?'blocked':packs.length?'review':'ready',
    period_month:text(health?.period_month)||text(queue?.period_month),
    summary:{
      pack_count:packs.length,
      action_count:actions.length,
      blocking_pack_count:packs.filter((pack)=>pack.state==='blocking').length,
      evidence_action_count,
      owner_count:packs.length
    },
    packs,
    boundaries:{
      read_only:true,
      handoff_mode:'human-review-only',
      acknowledgement_persistence:false,
      mutation_capability:'none',
      automatic_business_action:false,
      accounting_posting:false,
      period_close:false,
      inventory_mutation:false,
      creative_mutation:false,
      price_mutation:false,
      provider_execution:false,
      provider_publication:false,
      request_time_schema_mutation:false,
      r2_mutation:false,
      binding_mutation:false,
      production_mutation:false
    }
  };
}
