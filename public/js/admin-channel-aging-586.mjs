/* Build 586: source-matched provider witness / exact owner authorization follow-up aging.
 * A local request never authenticates a provider, signs owner consent, closes an exception or performs a write. */
import {reconcile585,KEY_585} from './admin-channel-receipt-followup-585.mjs?v=586';
import {KEY_584} from './admin-channel-witness-584.mjs?v=586';
import {KEY_583} from './admin-channel-intake-583.mjs?v=586';
import {KEY_582} from './admin-channel-handoff-582.mjs?v=586';
import {KEY_581} from './admin-channel-trial-gate-581.mjs?v=586';
import {KEY_580} from './admin-channel-owner-review-580.mjs?v=586';
import {trialPacket578,KEY_578} from './admin-channel-trials-578.mjs?v=586';

export const FORMAT_586='devilndove-provider-witness-owner-followup-aging-586-v1';
export const KEY_586='dd:provider-witness-owner-followup-aging:586:v1';
export const TYPES_586=['INDEPENDENT_RECEIPT_WITNESS','OWNER_EXACT_ACTION_AUTHORIZATION','UNKNOWN_PROVIDER_OUTCOME'];
export const STEPS_586=['REQUEST_AUTHENTICATED_PROVIDER_READBACK','RECHECK_ACCOUNT_LISTING_IMAGES',
  'REQUEST_OWNER_SCOPED_CONSENT','ESCALATE_DUPLICATE_UNKNOWN'];
const safe=(v,max)=>typeof v==='string'&&v.length<=max&&
  !/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(v);
const timestamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const allowed=(kind,step)=>kind==='OWNER_EXACT_ACTION_AUTHORIZATION'?
  step==='REQUEST_OWNER_SCOPED_CONSENT':kind==='UNKNOWN_PROVIDER_OUTCOME'?
    step==='ESCALATE_DUPLICATE_UNKNOWN':
    ['REQUEST_AUTHENTICATED_PROVIDER_READBACK','RECHECK_ACCOUNT_LISTING_IMAGES'].includes(step);
export function followup586(row){
  if(!row||typeof row.claim_pin!=='string'||row.claim_pin.length<15||row.claim_pin.length>16000||
    !safe(row.channel,40)||!safe(row.account_id,150)||!safe(row.product_ref,100)||
    !safe(row.action,70)||!safe(row.provider_request_id,150)||
    !TYPES_586.includes(row.followup_type)||!STEPS_586.includes(row.next_step)||
    !allowed(row.followup_type,row.next_step)||!safe(row.reason,900)||row.reason.trim().length<15||
    !timestamp(row.due_at)||!timestamp(row.recorded_at))throw Error('Invalid unresolved owner/provider follow-up.');
  return {claim_pin:row.claim_pin,channel:row.channel,account_id:row.account_id,
    product_ref:row.product_ref,action:row.action,provider_request_id:row.provider_request_id.trim(),
    followup_type:row.followup_type,next_step:row.next_step,reason:row.reason.trim(),
    due_at:row.due_at,recorded_at:row.recorded_at,verification:'OPEN_UNVERIFIED',owner_signoff:'NOT_GRANTED'};
}
export function agingBucket586(dueAt,asOf){
  if(!timestamp(dueAt)||!timestamp(asOf))throw Error('Invalid review dates.');
  const day=t=>{const d=new Date(t);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());};
  const diff=Math.floor((day(asOf)-day(dueAt))/86400000);
  return {overdue_days:Math.max(0,diff),bucket:diff<0?'NOT_DUE':diff===0?'DUE_TODAY':
    diff<=7?'OVERDUE_1_TO_7_DAYS':'OVERDUE_8_PLUS_DAYS'};
}
export function aging586(exactReceipt,exactWitness,exactIntake,trialGate,ownerReview,notes,
  ownerFollowups,claims,resolutionRequests,submissions,witnessRequests,ownerRequests,
  receiptFollowups,followups=[],asOf=new Date().toISOString()){
  if(!Array.isArray(followups)||followups.length>100||!timestamp(asOf))throw Error('Invalid follow-up aging source.');
  const checked=reconcile585(exactWitness,exactIntake,trialGate,ownerReview,notes,
    ownerFollowups,claims,resolutionRequests,submissions,witnessRequests,ownerRequests,receiptFollowups);
  if(JSON.stringify(exactReceipt)!==JSON.stringify(checked))throw Error('Stale or altered provider receipt source.');
  const rows=followups.map(followup586),currentKeys=new Set(),priority=[];
  const cases=checked.cases.map(item=>{
    const validCorrelations=new Set(item.receipt_followups.map(x=>x.provider_request_id).filter(Boolean));
    const matching=rows.filter(x=>x.claim_pin===item.claim_pin&&x.channel===item.channel&&
      x.account_id===item.account_id&&x.product_ref===item.product_ref&&x.action===item.action&&
      (!x.provider_request_id||validCorrelations.has(x.provider_request_id)));
    const dated=matching.map(row=>{const age=agingBucket586(row.due_at,asOf);
      currentKeys.add(JSON.stringify([row.claim_pin,row.channel,row.account_id,row.product_ref,
        row.action,row.provider_request_id,row.followup_type,row.recorded_at]));
      return {...row,...age,closure:'OPEN_EXTERNAL_VERIFICATION_REQUIRED'};});
    priority.push(...dated.map(row=>({claim_pin:item.claim_pin,channel:item.channel,
      account_id:item.account_id,product_ref:item.product_ref,action:item.action,...row})));
    return {claim_pin:item.claim_pin,channel:item.channel,account_id:item.account_id,
      product_ref:item.product_ref,action:item.action,source_open_conflicts:item.open_conflicts,
      receipt_authentication:'NOT_VERIFIED',owner_authorization:'NOT_VERIFIED',
      overdue_count:dated.filter(x=>x.overdue_days>0).length,
      followups:dated,exception_closed:false,trial_authorized:false};
  });
  const stale=rows.filter(x=>!currentKeys.has(JSON.stringify([x.claim_pin,x.channel,x.account_id,
    x.product_ref,x.action,x.provider_request_id,x.followup_type,x.recorded_at])));
  const rank={OVERDUE_8_PLUS_DAYS:0,OVERDUE_1_TO_7_DAYS:1,DUE_TODAY:2,NOT_DUE:3};
  priority.sort((a,b)=>rank[a.bucket]-rank[b.bucket]||b.overdue_days-a.overdue_days||
    a.due_at.localeCompare(b.due_at));
  return {format:FORMAT_586,build:586,source_build:585,source_pin:checked.source_pin,
    as_of:asOf,open_provider_exceptions:cases.length,cases,priority_queue:priority,
    stale_followups:stale,overdue_count:priority.filter(x=>x.overdue_days>0).length,
    overdue_8_plus:priority.filter(x=>x.bucket==='OVERDUE_8_PLUS_DAYS').length,
    due_today:priority.filter(x=>x.bucket==='DUE_TODAY').length,
    verified_provider_receipts:0,verified_owner_action_authorizations:0,
    trial_eligible_cases:0,closed_exceptions:0,provider_writes:0,d1_operations:0,
    disposition:'HOLD_OPEN_PROVIDER_WITNESS_AND_EXACT_OWNER_AUTHORIZATION_FOLLOWUP'};
}
function init586(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd586Review'))return;
  const get=id=>doc.getElementById(id),status=get('dd586State'),output=get('dd586Output');
  const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
  const saved=()=>read(KEY_586,[]);
  const context=()=>{
    const receipt=get('dd585Output').value,witness=get('dd584Output').value,
      intake=get('dd583Output').value,trial=get('dd581Output').value,owner=get('dd580Output').value;
    if(!receipt||!witness||!intake||!trial||!owner||receipt.length>250000||
      witness.length>250000||intake.length>200000||trial.length>150000||owner.length>150000)
      throw Error('Recompute exact provider sources from sections 5–10.');
    const review=read(KEY_584,{witness:[],owner:[]});
    return [JSON.parse(receipt),JSON.parse(witness),JSON.parse(intake),JSON.parse(trial),
      JSON.parse(owner),read(KEY_578,trialPacket578([])),read(KEY_580,[]),read(KEY_581,[]),
      read(KEY_582,[]),read(KEY_583,[]),review.witness,review.owner,read(KEY_585,[])];
  };
  const refresh=()=>{
    const result=aging586(...context(),saved());output.value=JSON.stringify(result,null,2);
    const select=get('dd586Case'),previous=select.value;select.replaceChildren();
    result.cases.forEach((item,i)=>{const opt=doc.createElement('option');opt.value=String(i);
      opt.textContent=`${item.channel} · ${item.action} · ${item.product_ref} · ${item.overdue_count} overdue`;select.append(opt);});
    if([...select.options].some(x=>x.value===previous))select.value=previous;
    status.textContent=`${result.open_provider_exceptions} open case(s) · ${result.overdue_count} overdue follow-up(s) · ${result.stale_followups.length} stale · verified receipts 0 · owner approval HOLD.`;
    return result;
  };
  get('dd586Review').addEventListener('click',()=>{try{refresh();}catch{status.textContent='Recompute current sections 5–10; no provider or owner gate changed.';}});
  get('dd586Save').addEventListener('click',()=>{
    if(!get('dd586Ack').checked){status.textContent='Confirm this is an OPEN follow-up, not verification or authorization.';return;}
    try{const result=refresh(),item=result.cases[Number(get('dd586Case').value)];
      if(!item)throw Error('No exact source case.');
      const draft=followup586({claim_pin:item.claim_pin,channel:item.channel,
        account_id:item.account_id,product_ref:item.product_ref,action:item.action,
        provider_request_id:get('dd586Correlation').value,followup_type:get('dd586Type').value,
        next_step:get('dd586Step').value,reason:get('dd586Reason').value,
        due_at:new Date(get('dd586Due').value).toISOString(),recorded_at:new Date().toISOString()});
      const next=[...saved(),draft],checked=aging586(...context(),next);
      if(!checked.priority_queue.some(x=>x.recorded_at===draft.recorded_at&&x.claim_pin===draft.claim_pin&&
        x.next_step===draft.next_step))throw Error('Not source-matched.');
      win.localStorage.setItem(KEY_586,JSON.stringify(next));get('dd586Ack').checked=false;refresh();
    }catch{status.textContent='Invalid or stale follow-up scope, due date or provider correlation. Trial stays HOLD.';}
  });
  get('dd586Copy').addEventListener('click',async()=>{try{refresh();
    try{await win.navigator.clipboard.writeText(output.value);status.textContent='Open owner/witness aging queue copied. No approval issued.';}
    catch{output.focus();output.select();status.textContent='Select and copy the queue manually.';}}
  catch{status.textContent='Recompute the source-pinned aging queue before copying.';}});
}
if(typeof document!=='undefined')init586();
