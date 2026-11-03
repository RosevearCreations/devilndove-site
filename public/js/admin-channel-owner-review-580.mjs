/* Build 580: owner decision follow-up requests. No signed provider proof or closure happens in a browser. */
import {reconcile579} from './admin-channel-reconciliation-579.mjs?v=580';
import {trialPacket578,KEY_578} from './admin-channel-trials-578.mjs?v=580';

export const FORMAT_580='devilndove-channel-owner-recovery-followup-580-v1';
export const KEY_580='dd:channel-owner-followup:580:v1';
export const ACTIONS_580=['REQUEST_AUTHENTICATED_PROVIDER_RECEIPT','RECHECK_EXACT_LISTING_AND_IMAGE_IDS',
  'ESCALATE_DUPLICATE_OR_UNKNOWN_OUTCOME','REQUEST_SCOPED_OWNER_TEST_DECISION'];
const text=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
export function pin580(review){
  if(!review||review.format!=='devilndove-provider-evidence-review-579-v1')throw Error('Invalid source review.');
  return JSON.stringify([review.channel,review.expected,review.observed,review.checks,
    review.exceptions,review.source_note_count,review.evidence_state]);
}
export function review580(review,notes,followups=[]){
  if(!review||!notes||!Array.isArray(followups)||followups.length>80)
    throw Error('Invalid owner evidence review source.');
  const validated=trialPacket578(notes.entries),recomputed=reconcile579(
    {...review.expected,channel:review.channel},{...review.observed,channel:review.channel},validated);
  if(JSON.stringify(review)!==JSON.stringify(recomputed))throw Error('Source comparison is stale or inconsistent.');
  const pin=pin580(recomputed),current=[],stale=[];
  for(const entry of followups){
    if(!entry||typeof entry.source_pin!=='string'||entry.source_pin.length>6000||
      !ACTIONS_580.includes(entry.action)||!text(entry.reason,800)||
      typeof entry.proof_locator!=='string'||entry.proof_locator.length>350||
      typeof entry.recorded_at!=='string'||!Number.isFinite(Date.parse(entry.recorded_at)))
      throw Error('Invalid follow-up request; never infer approval.');
    const normalized={source_pin:entry.source_pin,action:entry.action,reason:entry.reason.trim(),
      proof_locator:entry.proof_locator.trim(),recorded_at:entry.recorded_at};
    (entry.source_pin===pin?current:stale).push(normalized);
  }
  const unresolved=recomputed.exceptions.length;
  return {format:FORMAT_580,build:580,source_pin:pin,channel:recomputed.channel,
    exact_comparison:recomputed,open_exception_count:unresolved,matching_followups:current,
    stale_followups:stale,authenticated_provider_receipts:0,verified_exception_closures:0,
    owner_decision:'NOT_RECORDED',owner_signoff:'PENDING',authorized_provider_writes:0,
    recovery_state:unresolved?'SOURCE_EXCEPTIONS_OPEN':'MATCH_NEEDS_INDEPENDENT_AUTHENTICATION',
    acceptance_gate:'HOLD_PENDING_AUTHENTICATED_PROVIDER_READBACK_AND_EXPLICIT_OWNER_DECISION'};
}
function init580(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd580Review'))return;
  const get=id=>doc.getElementById(id),status=get('dd580State'),output=get('dd580Output');
  const notes=()=>{const raw=win.localStorage.getItem(KEY_578);const p=raw?JSON.parse(raw):trialPacket578([]);
    if(p.format!=='devilndove-channel-trial-receipts-578-v1'||p.build!==578)throw Error('Invalid source notes.');return p;};
  const followups=()=>{const raw=win.localStorage.getItem(KEY_580);return raw?JSON.parse(raw):[];};
  const refresh=()=>{const raw=get('dd579Output').value;
    if(!raw||raw.length>30000)throw Error('Run the exact Build 579 comparison first.');
    const result=review580(JSON.parse(raw),notes(),followups());output.value=JSON.stringify(result,null,2);
    status.textContent=`${result.open_exception_count} open exception flags · ${result.matching_followups.length} matching follow-up requests · ${result.stale_followups.length} stale requests · authenticated receipts 0 · owner sign-off PENDING.`;
    return result;};
  get('dd580Review').addEventListener('click',()=>{try{refresh();}catch{status.textContent='No valid source-matched review. Recompute Build 579 using current trial notes.';}});
  get('dd580Save').addEventListener('click',()=>{
    if(!get('dd580Ack').checked){status.textContent='Confirm the request is not an authenticated provider receipt or approval.';return;}
    try{const r=refresh(),action=get('dd580Action').value,reason=get('dd580Reason').value,
      proof_locator=get('dd580Locator').value;
      const draft={source_pin:r.source_pin,action,reason,proof_locator,recorded_at:new Date().toISOString()};
      review580(r.exact_comparison,notes(),[...followups(),draft]);
      win.localStorage.setItem(KEY_580,JSON.stringify([...followups(),draft]));
      get('dd580Ack').checked=false;refresh();}
    catch{status.textContent='Invalid, stale or incomplete follow-up. No owner decision changed.';}
  });
  get('dd580Copy').addEventListener('click',async()=>{try{refresh();
    try{await win.navigator.clipboard.writeText(output.value);status.textContent='Owner-safe follow-up packet copied. No provider receipt authenticated.';}
    catch{output.focus();output.select();status.textContent='Select and copy the review manually.';}}
    catch{status.textContent='Refresh a valid comparison before copying.';}});
}
if(typeof document!=='undefined')init580();
