/* Build 487: read-only independent replay of an owner-reconciled Build 486 outcome. */
import {outcomes486} from './maker-aftercare-outcome-policy-486.mjs';
const validId=value=>Number.isSafeInteger(Number(value))&&Number(value)>0;
export function assessIndependentRetest487({caseRow={},outcomeNote='',independentReviewerConfirmed=false}={}){
  const holds=[];
  const chain=['evidence_id','priority_receipt_id','handoff_receipt_id','reassessment_receipt_id','decision_receipt_id','independent_decision_handoff_receipt_id','outcome_receipt_id'];
  if(chain.some(key=>!validId(caseRow[key])))holds.push('Complete Build 479–486 receipt chain is required.');
  if(!String(outcomeNote).startsWith('Build 486 independent handoff outcome;'))holds.push('Source Build 486 outcome note must be independently retrieved.');
  const match=String(outcomeNote).match(/; outcome=([a-z_]+);/);
  if(!match||!outcomes486.includes(match[1]))holds.push('Build 486 outcome classification cannot be verified.');
  for(const [key,label] of [['evidence_id','source follow-up'],['priority_receipt_id','priority receipt'],['handoff_receipt_id','handoff receipt'],['reassessment_receipt_id','reassessment receipt'],['decision_receipt_id','decision receipt'],['independent_decision_handoff_receipt_id','independent receipt']]){
    if(!String(outcomeNote).includes(`${label} #${caseRow[key]};`))holds.push(`Source ${label} does not match the sampled case.`);
  }
  if(!/; owner independently reconciled; case remains open; no external action\.$/.test(String(outcomeNote)))holds.push('Outcome must leave case open and contain no external action.');
  if(independentReviewerConfirmed!==true)holds.push('A separate reviewer must confirm source evidence; a browser checkbox alone cannot prove independence.');
  return Object.freeze({ready:!holds.length,holds,source_linked:!holds.length,case_closed:false,external_action:false,provider_contacted:false});
}
