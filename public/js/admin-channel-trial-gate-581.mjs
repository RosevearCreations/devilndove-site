/* Build 581: source- and scope-matched independent authentication checklist.
 * A browser-local claim is never a server-authenticated provider receipt or owner authorization. */
import {review580,pin580,KEY_580} from './admin-channel-owner-review-580.mjs?v=581';
import {trialPacket578,KEY_578} from './admin-channel-trials-578.mjs?v=581';

export const FORMAT_581='devilndove-independent-provider-trial-gate-581-v1';
export const KEY_581='dd:provider-trial-gate-claims:581:v1';
export const ACTIONS_581=['READ_CONNECTION','READ_LISTING','READ_IMAGES','CREATE_DRAFT',
  'UPDATE_DRAFT','UPLOAD_IMAGE','PUBLISH_PAGE_POST','PUBLISH_INSTAGRAM_POST'];
const writes=new Set(['CREATE_DRAFT','UPDATE_DRAFT','UPLOAD_IMAGE','PUBLISH_PAGE_POST','PUBLISH_INSTAGRAM_POST']);
const allowed={etsy:new Set(ACTIONS_581.slice(0,6)),
  facebook_page:new Set(['READ_CONNECTION','PUBLISH_PAGE_POST']),
  instagram:new Set(['READ_CONNECTION','PUBLISH_INSTAGRAM_POST'])};
const field=(v,max)=>typeof v==='string'&&v.length<=max?v.trim():null;
export function claim581(row){
  if(!row||!['etsy','facebook_page','instagram'].includes(row.channel)||
    !ACTIONS_581.includes(row.action)||!allowed[row.channel].has(row.action)||
    !field(row.source_pin,12000)||!field(row.account_id,120)||!field(row.product_ref,100)||
    field(row.receipt_locator,350)===null||field(row.identity_locator,350)===null||
    field(row.scope_locator,350)===null||field(row.independent_reviewer,250)===null||
    field(row.owner_authorization_locator,350)===null||
    !field(row.review_reason,800)||!Number.isFinite(Date.parse(row.recorded_at)))
    throw Error('Invalid provider authentication review claim.');
  return Object.fromEntries(['channel','action','source_pin','account_id','product_ref',
    'receipt_locator','identity_locator','scope_locator','independent_reviewer',
    'owner_authorization_locator','review_reason','recorded_at'].map(k=>[k,row[k].trim()]));
}
export function gate581(ownerReview,notes,followups,claims=[]){
  if(!ownerReview||!Array.isArray(claims)||claims.length>50)throw Error('Invalid review packet.');
  const source=review580(ownerReview.exact_comparison,notes,followups);
  if(JSON.stringify(source)!==JSON.stringify(ownerReview))throw Error('Review source changed or was forged.');
  const pin=pin580(source.exact_comparison),items=claims.map(claim581).map(row=>{
    const matching=row.source_pin===pin&&row.channel===source.channel&&
      row.account_id===source.exact_comparison.expected.account_id&&
      row.product_ref===source.exact_comparison.expected.product_ref;
    const gaps=[];
    if(!matching)gaps.push('STALE_OR_MISMATCHED_SOURCE');
    if(!row.receipt_locator)gaps.push('PROVIDER_RECEIPT_MISSING');
    if(!row.identity_locator)gaps.push('AUTHENTICATED_ACCOUNT_IDENTITY_MISSING');
    if(!row.scope_locator)gaps.push('PERMISSION_SCOPE_EVIDENCE_MISSING');
    if(!row.independent_reviewer)gaps.push('INDEPENDENT_REVIEWER_PROOF_MISSING');
    if(writes.has(row.action)&&!row.owner_authorization_locator)gaps.push('EXACT_OWNER_WRITE_AUTHORIZATION_MISSING');
    // Even a complete set of typed URLs is not independent verification.
    return {...row,gaps,write_action:writes.has(row.action),
      state:gaps.length?'EVIDENCE_GAPS_OPEN':'DOCUMENTARY_REFERENCES_REQUIRE_EXTERNAL_AUTHENTICATION',
      independently_authenticated:false,owner_write_authorized:false};
  });
  return {format:FORMAT_581,build:581,source_pin:pin,channel:source.channel,
    source_open_exceptions:source.open_exception_count,source_stale_followups:source.stale_followups.length,
    claims:items,authentication_claims_pending:items.length,
    independently_authenticated_receipts:0,verified_owner_authorizations:0,
    provider_writes:0,verified_exception_closures:0,owner_decision:'NOT_RECORDED',
    trial_gate:'HOLD_PENDING_EXTERNAL_PROVIDER_AUTHENTICATION_AND_SCOPED_OWNER_AUTHORIZATION',
    provider_execution:'DISABLED_IN_THIS_WORKSHEET'};
}
function init581(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd581Review'))return;
  const get=id=>doc.getElementById(id),status=get('dd581State'),output=get('dd581Output');
  const notes=()=>{const raw=win.localStorage.getItem(KEY_578),p=raw?JSON.parse(raw):trialPacket578([]);
    if(p.format!=='devilndove-channel-trial-receipts-578-v1'||p.build!==578)throw Error('Source notes invalid.');return p;};
  const followups=()=>{const raw=win.localStorage.getItem(KEY_580);return raw?JSON.parse(raw):[];};
  const claims=()=>{const raw=win.localStorage.getItem(KEY_581);return raw?JSON.parse(raw):[];};
  const current=()=>{const raw=get('dd580Output').value;if(!raw||raw.length>60000)throw Error('Review section 5 first.');
    return JSON.parse(raw);};
  const refresh=()=>{const result=gate581(current(),notes(),followups(),claims());
    output.value=JSON.stringify(result,null,2);
    status.textContent=`${result.authentication_claims_pending} local authentication-review claim(s) · ${result.source_open_exceptions} source exceptions · provider receipts authenticated 0 · owner authorizations verified 0 · trial gate HOLD.`;
    return result;};
  get('dd581Review').addEventListener('click',()=>{try{refresh();}catch{status.textContent='Stale or missing owner review. Reconcile sections 4 and 5 again.';}});
  get('dd581Save').addEventListener('click',()=>{
    if(!get('dd581Ack').checked){status.textContent='Confirm no provider authentication or owner permission is being claimed.';return;}
    try{const r=refresh(),entry=claim581({source_pin:r.source_pin,channel:r.channel,
      account_id:current().exact_comparison.expected.account_id,
      product_ref:current().exact_comparison.expected.product_ref,action:get('dd581Action').value,
      receipt_locator:get('dd581Receipt').value,identity_locator:get('dd581Identity').value,
      scope_locator:get('dd581Scope').value,independent_reviewer:get('dd581Reviewer').value,
      owner_authorization_locator:get('dd581Owner').value,review_reason:get('dd581Reason').value,
      recorded_at:new Date().toISOString()});
      const next=[...claims(),entry];gate581(current(),notes(),followups(),next);
      win.localStorage.setItem(KEY_581,JSON.stringify(next));get('dd581Ack').checked=false;refresh();}
    catch{status.textContent='Invalid, stale or unsupported claim. No trial authorization recorded.';}
  });
  get('dd581Copy').addEventListener('click',async()=>{try{refresh();
    try{await win.navigator.clipboard.writeText(output.value);status.textContent='Pending trial authentication checklist copied; no provider receipt verified.';}
    catch{output.focus();output.select();status.textContent='Select and copy checklist manually.';}}
    catch{status.textContent='Recompute an exact owner review first.';}});
}
if(typeof document!=='undefined')init581();
