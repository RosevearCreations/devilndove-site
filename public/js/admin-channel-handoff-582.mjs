/* Build 582: exact-source provider-identity and permission exception handoff.
 * Resolutions are external follow-up requests, never verified provider identity or trial authorization. */
import {gate581,KEY_581} from './admin-channel-trial-gate-581.mjs?v=582';
import {KEY_580} from './admin-channel-owner-review-580.mjs?v=582';
import {trialPacket578,KEY_578} from './admin-channel-trials-578.mjs?v=582';

export const FORMAT_582='devilndove-provider-identity-permission-handoff-582-v1';
export const KEY_582='dd:provider-identity-followups:582:v1';
export const DISPOSITIONS_582=[
  'REQUEST_INDEPENDENT_ACCOUNT_IDENTITY',
  'REQUEST_PROVIDER_SCOPE_CONFIRMATION',
  'REQUEST_SIGNED_RECEIPT_INSPECTION',
  'REQUEST_EXACT_OWNER_ACTION_PERMISSION',
  'ESCALATE_CONFLICT_OR_UNKNOWN_OUTCOME'
];
export function claimPin582(claim){
  if(!claim||!claim.source_pin||!claim.channel||!claim.action)throw Error('Missing source claim.');
  return JSON.stringify([claim.source_pin,claim.channel,claim.action,claim.account_id,
    claim.product_ref,claim.receipt_locator,claim.identity_locator,claim.scope_locator,
    claim.independent_reviewer,claim.owner_authorization_locator,claim.review_reason,claim.recorded_at]);
}
export function followup582(row){
  if(!row||typeof row.claim_pin!=='string'||row.claim_pin.length<15||row.claim_pin.length>16000||
    !DISPOSITIONS_582.includes(row.disposition)||typeof row.reason!=='string'||
    row.reason.trim().length<12||row.reason.length>800||
    typeof row.external_case_locator!=='string'||row.external_case_locator.length>350||
    typeof row.recorded_at!=='string'||!Number.isFinite(Date.parse(row.recorded_at)))
    throw Error('Invalid unresolved identity/permission follow-up.');
  return {claim_pin:row.claim_pin,disposition:row.disposition,
    reason:row.reason.trim(),external_case_locator:row.external_case_locator.trim(),recorded_at:row.recorded_at};
}
export function handoff582(trialGate,ownerReview,notes,ownerFollowups,claims,resolutionRequests=[]){
  if(!trialGate||!Array.isArray(resolutionRequests)||resolutionRequests.length>100)
    throw Error('Invalid provider exception review packet.');
  const checked=gate581(ownerReview,notes,ownerFollowups,claims);
  if(JSON.stringify(trialGate)!==JSON.stringify(checked))throw Error('Stale or altered exact trial gate.');
  const entries=resolutionRequests.map(followup582);
  const currentPins=new Set(checked.claims.map(claimPin582));
  const current=entries.filter(row=>currentPins.has(row.claim_pin));
  const stale=entries.filter(row=>!currentPins.has(row.claim_pin));
  const exceptions=checked.claims.map(claim=>{
    const pin=claimPin582(claim),matching=current.filter(x=>x.claim_pin===pin);
    return {claim_pin:pin,channel:claim.channel,action:claim.action,product_ref:claim.product_ref,
      account_id:claim.account_id,source_status:claim.state,
      evidence_gaps:claim.gaps.length?claim.gaps:['INDEPENDENT_AUTHENTICATION_NOT_PERFORMED'],
      followup_requests:matching,verified_identity:false,verified_permission:false,
      verified_receipt:false,owner_approved:false,exception_closed:false};
  });
  return {format:FORMAT_582,build:582,source_build:581,source_pin:checked.source_pin,
    open_provider_exceptions:exceptions.length,exceptions,stale_followups:stale,
    authenticated_provider_identities:0,authenticated_receipts:0,
    verified_permissions:0,verified_owner_authorizations:0,closed_exceptions:0,
    owner_decision:'NOT_RECORDED',owner_signoff:'PENDING',provider_writes:0,d1_operations:0,
    disposition:'HOLD_PENDING_EXTERNAL_PROVIDER_AND_OWNER_VERIFICATION'};
}
function init582(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd582Review'))return;
  const get=id=>doc.getElementById(id),status=get('dd582State'),output=get('dd582Output');
  const notes=()=>{const raw=win.localStorage.getItem(KEY_578),p=raw?JSON.parse(raw):trialPacket578([]);
    if(p.format!=='devilndove-channel-trial-receipts-578-v1'||p.build!==578)throw Error('Invalid notes.');return p;};
  const ownerFollowups=()=>{const raw=win.localStorage.getItem(KEY_580);return raw?JSON.parse(raw):[];};
  const claims=()=>{const raw=win.localStorage.getItem(KEY_581);return raw?JSON.parse(raw):[];};
  const requests=()=>{const raw=win.localStorage.getItem(KEY_582);return raw?JSON.parse(raw):[];};
  const gate=()=>{const source=get('dd581Output').value,owner=get('dd580Output').value;
    if(!source||!owner||source.length>150000||owner.length>150000)throw Error('Missing exact gate source.');
    return {source:JSON.parse(source),owner:JSON.parse(owner)};};
  const refresh=()=>{const x=gate(),result=handoff582(x.source,x.owner,notes(),ownerFollowups(),claims(),requests());
    output.value=JSON.stringify(result,null,2);
    const selector=get('dd582Case'),previous=selector.value;selector.replaceChildren();
    result.exceptions.forEach((row,i)=>{const option=doc.createElement('option');option.value=String(i);
      option.textContent=`${row.channel} · ${row.action} · ${row.product_ref} · ${row.evidence_gaps.length} gap(s)`;selector.append(option);});
    if([...selector.options].some(x=>x.value===previous))selector.value=previous;
    status.textContent=`${result.open_provider_exceptions} open provider exception(s) · ${result.stale_followups.length} stale follow-up(s) · authenticated identities 0 · verified permissions 0 · owner sign-off PENDING.`;
    return result;};
  get('dd582Review').addEventListener('click',()=>{try{refresh();}catch{status.textContent='Recompute the exact source through sections 4–6; no provider identity verified.';}});
  get('dd582Save').addEventListener('click',()=>{
    if(!get('dd582Ack').checked){status.textContent='Confirm this is an unresolved external request, not a closure.';return;}
    try{const result=refresh(),caseIndex=Number(get('dd582Case').value),item=result.exceptions[caseIndex];
      if(!item)throw Error('No source case selected.');
      const draft=followup582({claim_pin:item.claim_pin,disposition:get('dd582Disposition').value,
        reason:get('dd582Reason').value,external_case_locator:get('dd582Locator').value,
        recorded_at:new Date().toISOString()});
      const x=gate(),next=[...requests(),draft];handoff582(x.source,x.owner,notes(),ownerFollowups(),claims(),next);
      win.localStorage.setItem(KEY_582,JSON.stringify(next));get('dd582Ack').checked=false;refresh();}
    catch{status.textContent='Invalid or stale unresolved follow-up. No provider exception was closed.';}
  });
  get('dd582Copy').addEventListener('click',async()=>{try{refresh();
    try{await win.navigator.clipboard.writeText(output.value);status.textContent='Owner-safe unresolved exception handoff copied; no provider verification claimed.';}
    catch{output.focus();output.select();status.textContent='Select the handoff to copy manually.';}}
    catch{status.textContent='Rebuild an exact source-matched exception handoff before copying.';}});
}
if(typeof document!=='undefined')init582();
