/* Build 583: source-pinned independent provider exception evidence intake.
 * Browser-local submitted references are NOT provider-authenticated, an owner decision or permission to write. */
import {handoff582,KEY_582} from './admin-channel-handoff-582.mjs?v=583';
import {KEY_581} from './admin-channel-trial-gate-581.mjs?v=583';
import {KEY_580} from './admin-channel-owner-review-580.mjs?v=583';
import {trialPacket578,KEY_578} from './admin-channel-trials-578.mjs?v=583';

export const FORMAT_583='devilndove-provider-exception-evidence-intake-583-v1';
export const KEY_583='dd:provider-exception-evidence-intake:583:v1';
export const EVIDENCE_TYPES_583=['PROVIDER_ACCOUNT_IDENTITY','OAUTH_PERMISSION_SCOPE','PROVIDER_OPERATION_RECEIPT',
  'EXACT_LISTING_OR_IMAGE_READBACK','INDEPENDENT_REVIEW_WITNESS','OWNER_TRIAL_DECISION_REQUEST'];
const safe=(value,max)=>typeof value==='string'&&value.length<=max&&
  !/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(value);
export function evidence583(row){
  if(!row||typeof row.claim_pin!=='string'||row.claim_pin.length<15||row.claim_pin.length>16000||
    !EVIDENCE_TYPES_583.includes(row.evidence_type)||!safe(row.source_locator,350)||
    row.source_locator.trim().length<8||!safe(row.provider_correlation,150)||
    !safe(row.reviewer_reference,200)||!safe(row.account_reference,150)||
    !safe(row.permission_scope,250)||!safe(row.explanation,800)||row.explanation.trim().length<15||
    !safe(row.owner_scope_request,250)||typeof row.recorded_at!=='string'||
    !Number.isFinite(Date.parse(row.recorded_at)))throw Error('Invalid or unsafe documentary evidence intake.');
  return {claim_pin:row.claim_pin,evidence_type:row.evidence_type,source_locator:row.source_locator.trim(),
    provider_correlation:row.provider_correlation.trim(),reviewer_reference:row.reviewer_reference.trim(),
    account_reference:row.account_reference.trim(),permission_scope:row.permission_scope.trim(),
    owner_scope_request:row.owner_scope_request.trim(),explanation:row.explanation.trim(),recorded_at:row.recorded_at,
    verification:'SUBMITTED_UNVERIFIED'};
}
export function intake583(trialGate,ownerReview,notes,ownerFollowups,claims,resolutionRequests,submissions=[]){
  if(!Array.isArray(submissions)||submissions.length>100)throw Error('Invalid evidence intake list.');
  const handoff=handoff582(trialGate,ownerReview,notes,ownerFollowups,claims,resolutionRequests);
  const entries=submissions.map(evidence583),pins=new Set(handoff.exceptions.map(x=>x.claim_pin));
  const current=entries.filter(x=>pins.has(x.claim_pin));
  const stale=entries.filter(x=>!pins.has(x.claim_pin));
  const cases=handoff.exceptions.map(item=>{
    const matching=current.filter(x=>x.claim_pin===item.claim_pin);
    const conflicts=matching.filter(x=>x.account_reference&&item.account_id&&x.account_reference!==item.account_id);
    const duplicateLocators=matching.filter((x,i)=>matching.findIndex(y=>y.evidence_type===x.evidence_type&&
      y.source_locator===x.source_locator)!==i);
    return {claim_pin:item.claim_pin,channel:item.channel,action:item.action,product_ref:item.product_ref,
      expected_account:item.account_id,evidence_gaps:item.evidence_gaps,
      submitted_evidence:matching,conflicting_account_references:conflicts.length,
      duplicated_evidence_references:duplicateLocators.length,
      evidence_status:conflicts.length?'CONFLICT_REQUIRES_EXTERNAL_REVIEW':
        matching.length?'DOCUMENTARY_INTAKE_PENDING_INDEPENDENT_AUTHENTICATION':'NO_EXTERNAL_EVIDENCE_SUBMITTED',
      authenticated_provider_receipt:false,verified_permission:false,owner_trial_authorized:false,
      exception_closed:false};
  });
  return {format:FORMAT_583,build:583,source_build:582,source_pin:handoff.source_pin,
    source_exception_count:handoff.open_provider_exceptions,cases,stale_submissions:stale,
    documentary_submissions:current.length,account_conflicts:cases.reduce((s,x)=>s+x.conflicting_account_references,0),
    duplicate_references:cases.reduce((s,x)=>s+x.duplicated_evidence_references,0),
    authenticated_provider_receipts:0,independently_verified_accounts:0,verified_permissions:0,
    verified_owner_trial_authorizations:0,closed_exceptions:0,owner_trial_decision_ready:false,
    owner_trial_decision:'NOT_RECORDED',owner_trial_signoff:'PENDING',provider_writes:0,d1_operations:0,
    disposition:'HOLD_PENDING_INDEPENDENT_PROVIDER_EVIDENCE_AND_EXPLICIT_OWNER_DECISION'};
}
function init583(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd583Review'))return;
  const get=id=>doc.getElementById(id),status=get('dd583State'),output=get('dd583Output');
  const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
  const context=()=>{
    const ownerRaw=get('dd580Output').value,gateRaw=get('dd581Output').value;
    if(!ownerRaw||!gateRaw||ownerRaw.length>150000||gateRaw.length>150000)
      throw Error('Rebuild the owner and trial gate sources.');
    const notes=read(KEY_578,trialPacket578([]));
    return [JSON.parse(gateRaw),JSON.parse(ownerRaw),notes,read(KEY_580,[]),
      read(KEY_581,[]),read(KEY_582,[])];
  };
  const submissions=()=>read(KEY_583,[]);
  const refresh=()=>{
    const result=intake583(...context(),submissions());output.value=JSON.stringify(result,null,2);
    const select=get('dd583Case'),previous=select.value;select.replaceChildren();
    result.cases.forEach((row,i)=>{const option=doc.createElement('option');option.value=String(i);
      option.textContent=`${row.channel} · ${row.action} · ${row.product_ref} · ${row.evidence_status}`;select.append(option);});
    if([...select.options].some(x=>x.value===previous))select.value=previous;
    status.textContent=`${result.source_exception_count} open case(s) · ${result.documentary_submissions} unverified submission(s) · ${result.stale_submissions.length} stale · ${result.account_conflicts} account conflict(s) · owner trial HOLD.`;
    return result;
  };
  get('dd583Review').addEventListener('click',()=>{try{refresh();}catch{status.textContent='Rebuild exact sections 5–7 before evidence review. No provider trial authorized.';}});
  get('dd583Save').addEventListener('click',()=>{
    if(!get('dd583Ack').checked){status.textContent='Acknowledge documentary-only evidence and continuing provider HOLD.';return;}
    try{const result=refresh(),item=result.cases[Number(get('dd583Case').value)];
      if(!item)throw Error('No source-matched exception.');
      const draft=evidence583({claim_pin:item.claim_pin,evidence_type:get('dd583Type').value,
        source_locator:get('dd583Locator').value,provider_correlation:get('dd583Correlation').value,
        reviewer_reference:get('dd583Reviewer').value,account_reference:get('dd583Account').value,
        permission_scope:get('dd583Scope').value,owner_scope_request:get('dd583OwnerScope').value,
        explanation:get('dd583Reason').value,recorded_at:new Date().toISOString()});
      const next=[...submissions(),draft];intake583(...context(),next);
      win.localStorage.setItem(KEY_583,JSON.stringify(next));get('dd583Ack').checked=false;refresh();
    }catch{status.textContent='Invalid/unsafe submission or stale source. Nothing accepted as verified; trial HOLD.';}
  });
  get('dd583Copy').addEventListener('click',async()=>{try{refresh();
    try{await win.navigator.clipboard.writeText(output.value);status.textContent='Unverified owner decision packet copied; trial HOLD.';}
    catch{output.focus();output.select();status.textContent='Select and copy the review packet manually.';}}
  catch{status.textContent='Rebuild exact evidence intake packet before copying.';}});
}
if(typeof document!=='undefined')init583();
