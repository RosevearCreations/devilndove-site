/* Build 465 — independent Maker Pilot closure assessment, no synthetic acceptance. */
export const CLOSURE_CHECKS_465=Object.freeze([
 {key:'owner_trials',label:'Real Maker trial and original process evidence',source:'/admin/maker-owner-trials/',help:'Inspect the actual Build 456 project/commission receipts. A completed one-case checklist does not close other maker scenarios.'},
 {key:'maker_media',label:'Original images/videos, rights and accessible display',source:'/admin/maker-media-acceptance/',help:'Inspect real originals, consent scope, alt text/captions, dimensions, keyboard, phone and zoom.'},
 {key:'etsy',label:'Authenticated Etsy draft and marketplace boundary',source:'/admin/etsy-owner-acceptance/',help:'Review actual shop/draft ID and Canada-only shipping; Meta manual/export HOLD if no supported API permission.'},
 {key:'product_safety',label:'Canadian physical product and label review',source:'/admin/maker-product-safety/',help:'Category-specific real material, label and safety evidence must be separately reviewed; no automated legal certification.'},
 {key:'budget',label:'Provider billing and runtime budget evidence',source:'/admin/maker-resource-budget/',help:'Real Cloudflare D1, Workers, R2 and GitHub account readings are required. The Build 462 Actions timestamp sample is not account billing.'},
 {key:'fulfillment',label:'Actual Canadian order, delivery, return and aftercare',source:'/admin/maker-fulfillment-pilot/',help:'Inspect real Orders/Build 454 ledger. Return, refund, exchange and customer consent retain independent authorities.'},
 {key:'privacy',label:'Private therapeutic work and customer consent scope',source:'/admin/creative-process/',help:'Confirm privacy against the original Project, Custom Request and media consent record.'},
 {key:'ux',label:'Hands-on Admin and mobile accessibility owner trial',source:'/admin/maker-workbench/',help:'Verify the actual browser, keyboard, touch, focus, readable cards, Help and navigation.'}
]);
export const NEXT_MAKER_BUILDS_466_475=Object.freeze([
 {number:466,priority:'P0',title:'Real-Owner Trial Debrief & Cross-Workflow Receipt Reconciliation',gate:'Actual owner observations; unresolved Build 456/464 source receipts remain HOLD'},
 {number:467,priority:'P0',title:'Admin Shell, Standard/Purple Theme & Contextual ⓘ Help Audit',gate:'Real small-screen, keyboard and owner acceptance; no replacement data stores'},
 {number:468,priority:'P0',title:'Product Editor Autosave, Login & 503/1102 Recovery Acceptance',gate:'Reproduce only observed failures and preserve safe draft replay'},
 {number:469,priority:'P0',title:'D1/Workers/R2 Budget Source Capture & Evidence-Driven Hotspots',gate:'Require actual Cloudflare provider readings before tuning; no new fees'},
 {number:470,priority:'P1',title:'Tools, Consumables, Workstations & Usage Unit Consistency',gate:'Reconcile real Inventory, shared tools, actual costs and location without silent stock writes'},
 {number:471,priority:'P1',title:'Single Product Creation & Human-Gated Channel Publishing',gate:'Prove actual canonical media mapping and reviewed Etsy/marketplace channel decisions'},
 {number:472,priority:'P1',title:'Actual Maker Photography, Video & Accessibility Remediation',gate:'Owner-supplied real images, captions, crop, alt text and rights receipts'},
 {number:473,priority:'P1 safety',title:'Canadian Product Label/Safety Sample Acceptance by Category',gate:'Physical material, label and risk evidence; independent specialist requirements stay HOLD'},
 {number:474,priority:'P1',title:'Real Order Fulfillment, Damage/Returns & Customer Consent Trial II',gate:'Human-confirmed shipment/pickup/returns; no automatic refund, exchange or contact'},
 {number:475,priority:'P1',title:'Independent Production, Owner & Provider Acceptance Closure II',gate:'Only genuine independent source evidence can close HOLDs'}
]);
const positiveId=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const clean=v=>String(v??'').trim();
export function deriveMakerClosure465({ownerTrial=null,ownerScenario='',fulfillment=null,manual={}}={}){
 const results=[];
 for(const check of CLOSURE_CHECKS_465){const observation=manual[check.key]||{},ref=clean(observation.reference),note=clean(observation.note),observed=observation.observed===true;
  let sourceStatus='HOLD_SOURCE_UNAVAILABLE',sourceReceiptIds=[];
  if(check.key==='owner_trials'&&ownerTrial?.ok===true&&ownerTrial.selected&&ownerTrial.summary){
   const latest=new Map();for(const r of ownerTrial.history||[])if(!latest.has(r.checkpoint_key))latest.set(r.checkpoint_key,r);
   sourceReceiptIds=Array.from(latest.values()).filter(r=>positiveId(r.maker_owner_trial_review_id)).map(r=>positiveId(r.maker_owner_trial_review_id));
   const accepted=ownerTrial.summary.checklist_recorded===true&&ownerTrial.history_truncated!==true&&ownerTrial.summary.required>0&&ownerTrial.summary.accepted===ownerTrial.summary.required
    &&Array.from(latest.values()).filter(r=>r.decision==='accepted'&&Number(r.personally_observed)===1&&positiveId(r.source_id)).length>=ownerTrial.summary.required;
   sourceStatus=accepted?'REAL_ONE_CASE_OWNER_RECEIPTS_RECORDED':'HOLD_OWNER_SOURCE_CHECKPOINTS';
  }
  if(check.key==='fulfillment'&&fulfillment?.ok===true&&positiveId(fulfillment?.order?.order_id)&&Array.isArray(fulfillment.evidence)){
   sourceReceiptIds=fulfillment.evidence.map(r=>positiveId(r.evidence_id)).filter(Boolean).slice(0,50);
   sourceStatus=sourceReceiptIds.length?'REAL_ORDER_RECEIPTS_RECORDED_DELIVERY_UNVERIFIED':'HOLD_NO_FULFILLMENT_EVIDENCE';
   if(fulfillment.history_truncated)sourceStatus='HOLD_FULFILLMENT_LEDGER_TRUNCATED';
  }
  if(!['owner_trials','fulfillment'].includes(check.key))sourceStatus='REQUIRES_INDEPENDENT_ORIGINAL_SOURCE_REVIEW';
  const attested=observed&&ref.length>=8&&ref.length<=200&&note.length>=24&&note.length<=600;
  results.push(Object.freeze({key:check.key,label:check.label,source:check.source,sourceStatus,sourceReceiptIds,ownerAttested:attested,
   status:attested?'OWNER_REVIEW_RECORDED_IN_SESSION_NOT_CLOSED':'HOLD_OWNER_REVIEW_INCOMPLETE',
   gaps:attested?['Independent original-source and applicable external approvals remain separate.']:['Actual original-source reference (8–200 chars), factual note (24–600 chars), and owner observation are required.']}));
 }
 return Object.freeze({release:467,build:465,ownerScenario:clean(ownerScenario),state:'HOLD_INDEPENDENT_REAL_WORLD_ACCEPTANCE',closed:false,
  automaticallyCertified:false,operatorEvidenceIndependentOfSource:false,approvedEtsyPublication:false,verifiedProductSafety:false,
  deliveredOrRefunded:false,providerBillingVerified:false,customerConsentVerified:false,automaticExternalAction:false,
  results,ownerReviewCount:results.filter(x=>x.ownerAttested).length,required:results.length,
  nextBuilds:NEXT_MAKER_BUILDS_466_475});
}
