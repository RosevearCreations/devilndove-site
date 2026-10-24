// Build 456: explicit real-world owner acceptance. Synthetic tests are not owner evidence.
export const TRIALS=Object.freeze({
 jewellery_metal:{label:'Jewellery & metalwork',checks:['source_identity','actual_materials','process_quality','physical_safety','media_rights']},
 resin_clay:{label:'Resin, clay & mixed media',checks:['source_identity','actual_materials','process_quality','physical_safety','media_rights']},
 digital_fabrication:{label:'CNC, laser & 3D fabrication',checks:['source_identity','design_provenance','process_quality','physical_safety','media_rights']},
 failed_salvage:{label:'Failed attempt, rework & salvage',checks:['source_identity','actual_materials','process_quality','media_rights']},
 private_therapeutic:{label:'Private therapeutic or learning work',checks:['source_identity','privacy_control','process_quality','media_rights']},
 custom_commission:{label:'Real custom commission',checks:['source_identity','customer_approval','cost_handoff','process_quality','delivery_hold']}
});
export const CHECKS=Object.freeze({
 source_identity:{label:'Confirm the actual source record',sources:['project','custom_request']},
 actual_materials:{label:'Check factual materials / actual consumption',sources:['event','cost_review']},
 design_provenance:{label:'Verify the correct saved design revision',sources:['design_revision']},
 process_quality:{label:'Inspect the process / QA outcome',sources:['traveler_run','quality_attempt','commission_review']},
 physical_safety:{label:'Review physical process and safety evidence',sources:['traveler_run','quality_attempt']},
 media_rights:{label:'Inspect actual photos/stories and rights',sources:['event','media_story']},
 privacy_control:{label:'Confirm private use and publication boundaries',sources:['project','media_story']},
 customer_approval:{label:'Check the genuine customer proof',sources:['customer_proof']},
 cost_handoff:{label:'Review the signed maker cost / change handoff',sources:['commission_review']},
 delivery_hold:{label:'Confirm fulfillment still requires separate proof',sources:['commission_review']}
});
export const BOUNDARY=Object.freeze({private_admin_only:true,physical_observation_requires_owner:true,
  external_provider_approved:false,production_product_safety_certified:false,
  creates_customer_approval:false,updates_creative_project:false,posts_stock:false,
  sends_customer_message:false,publishes_product:false,creates_payment:false,confirms_delivery:false});

const positive=value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):0;
export function normalizeTrial(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('A single review object is required.');
 const scenario=String(input.scenario_key||''),checkpoint=String(input.checkpoint_key||''),decision=String(input.decision||'');
 if(!TRIALS[scenario]||!TRIALS[scenario].checks.includes(checkpoint))throw Error('Choose a supported scenario and its actual review checkpoint.');
 if(!['hold','accepted'].includes(decision))throw Error('A manual HOLD or accepted decision is required.');
 const project=positive(input.project_id),request=positive(input.custom_request_id);
 if(scenario==='custom_commission'?(!!project||!request):(!project||!!request))throw Error('Select exactly the actual Creative Project, or a Custom Request for a commission.');
 const sourceKind=String(input.source_kind||'none');
 const sourceId=positive(input.source_id);
 if(sourceKind==='none'&&sourceId)throw Error('A source ID cannot be used without its record type.');
 if(sourceKind!=='none'&&(!sourceId||!CHECKS[checkpoint].sources.includes(sourceKind)))throw Error('Choose a valid existing record type and positive source ID for this checkpoint.');
 if(checkpoint==='source_identity'&&sourceKind!=='none'&&sourceKind!==(scenario==='custom_commission'?'custom_request':'project'))throw Error('The identity checkpoint must use its canonical source.');
 if(checkpoint==='process_quality'&&sourceKind!=='none'&&(scenario==='custom_commission'?sourceKind!=='commission_review':sourceKind==='commission_review'))throw Error('Use the original project QA or commission handoff source for this case.');
 if(scenario==='custom_commission'&&sourceKind!=='none'&&!['custom_request','customer_proof','commission_review'].includes(sourceKind))throw Error('Commission checkpoints require original Custom Request evidence.');
 if(scenario!=='custom_commission'&&sourceKind==='custom_request')throw Error('This scenario requires original Creative Project evidence.');
 const observed=input.personally_observed===true;
 if(decision==='accepted'&&(!observed||sourceKind==='none'))throw Error('Accepted requires your personal observation and a real source record; otherwise record HOLD.');
 const note=String(input.review_note??'').trim();
 if(note.length<24||note.length>1200)throw Error('Describe your actual review, missing evidence or HOLD in 24–1200 characters.');
 const key=String(input.request_key||'');
 if(!/^[a-zA-Z0-9_-]{16,80}$/.test(key))throw Error('Use a unique 16–80 character request key.');
 return {scenario,checkpoint,project:project||null,request:request||null,sourceKind,sourceId:sourceId||null,
  decision,observed:observed?1:0,note,key};
}

export function summarizeTrial(scenario,history){
 const checks=TRIALS[scenario]?.checks||[];const latest={};
 for(const row of history||[]){if(checks.includes(row.checkpoint_key)&&!latest[row.checkpoint_key])latest[row.checkpoint_key]=row;}
 const accepted=checks.filter(k=>latest[k]?.decision==='accepted');
 return {required:checks.length,accepted:accepted.length,held:checks.filter(k=>latest[k]?.decision!=='accepted'),
   checklist_recorded:accepted.length===checks.length,external_acceptance:'HOLD_UNVERIFIED_OWNER_PROVIDER_FACTS'};
}
