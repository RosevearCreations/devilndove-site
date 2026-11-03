/* Build 579: documentary comparison only. Provider-signed evidence is NOT obtained here. */
import {trialPacket578,KEY_578} from './admin-channel-trials-578.mjs?v=579';
export const FORMAT_579='devilndove-provider-evidence-review-579-v1';
const id=(v,max=120)=>typeof v==='string'&&v.length<=max?v.trim():null;
const ids=v=>{if(!Array.isArray(v)||v.length>20)return null;
  const clean=v.map(x=>id(x,120));return clean.some(x=>!x)?null:clean;};
export function reconcile579(expected,observed,localNotes){
  const source=trialPacket578(localNotes?.entries||[]);
  if(!expected||!observed||!['etsy','facebook_page','instagram'].includes(expected.channel)||
    expected.channel!==observed.channel||!id(expected.account_id)||!id(observed.account_id)||
    !id(expected.product_ref,100)||!id(observed.product_ref,100)||
    !id(expected.listing_id)||!id(observed.listing_id)||
    ids(expected.image_ids)===null||ids(observed.image_ids)===null)
    throw Error('Missing or invalid exact account, Product, listing or image references.');
  const checks={account:expected.account_id===observed.account_id,
    product:expected.product_ref===observed.product_ref,
    listing:expected.listing_id===observed.listing_id,
    images:expected.image_ids.length>0&&expected.image_ids.length===observed.image_ids.length&&
      new Set(expected.image_ids).size===expected.image_ids.length&&
      new Set(observed.image_ids).size===observed.image_ids.length&&
      expected.image_ids.every(x=>observed.image_ids.includes(x))};
  const mismatches=Object.keys(checks).filter(k=>!checks[k]);
  const relevant=source.entries.filter(x=>x.channel===expected.channel&&
    x.product_ref===expected.product_ref);
  const unknowns=relevant.filter(x=>['UNKNOWN','FAILED'].includes(x.outcome));
  const exceptions=[...mismatches.map(x=>`MISMATCH_${x.toUpperCase()}`),
    ...unknowns.map(x=>`UNRESOLVED_${x.outcome}_${x.action}`)];
  if(!relevant.length)exceptions.push('NO_SOURCE_TRIAL_NOTE');
  // Equal typed values only permit external verification to be requested; never close an exception.
  return {format:FORMAT_579,build:579,channel:expected.channel,
    expected:{account_id:expected.account_id,product_ref:expected.product_ref,
      listing_id:expected.listing_id,image_ids:[...expected.image_ids]},
    observed:{account_id:observed.account_id,product_ref:observed.product_ref,
      listing_id:observed.listing_id,image_ids:[...observed.image_ids]},
    checks,exceptions,source_note_count:relevant.length,
    evidence_state:exceptions.length?'EXCEPTIONS_OPEN':'STRUCTURAL_MATCH_EXTERNAL_VERIFICATION_REQUIRED',
    authenticated_provider_receipts:0,verified_remote_images:0,verified_exception_closures:0,
    owner_decision:'PENDING',provider_writes:0,
    closure_ready:false,reason:'Browser-entered evidence cannot authenticate provider account, receipts or owner approval.'};
}
function init579(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd579Compare'))return;
  const get=x=>doc.getElementById(x),status=get('dd579State'),output=get('dd579Output');
  const parseIds=text=>text.split(/[\s,]+/).map(x=>x.trim()).filter(Boolean);
  get('dd579Compare').addEventListener('click',()=>{
    try{const p=win.localStorage.getItem(KEY_578),notes=p?JSON.parse(p):trialPacket578([]),
      channel=get('dd579Channel').value,product_ref=get('dd579Product').value;
      const expected={channel,product_ref,account_id:get('dd579ExpectedAccount').value,
        listing_id:get('dd579ExpectedListing').value,image_ids:parseIds(get('dd579ExpectedImages').value)};
      const observed={channel,product_ref,account_id:get('dd579ObservedAccount').value,
        listing_id:get('dd579ObservedListing').value,image_ids:parseIds(get('dd579ObservedImages').value)};
      const result=reconcile579(expected,observed,notes);
      output.value=JSON.stringify(result,null,2);
      status.textContent=`${result.evidence_state} · ${result.exceptions.length} open exception flags · independently verified closures 0 · owner decision PENDING.`;
    }catch{status.textContent='Invalid or incomplete comparison. No prior results or provider records changed.';}
  });
  get('dd579Copy').addEventListener('click',async()=>{
    if(!output.value){status.textContent='Run a valid comparison first.';return;}
    try{await win.navigator.clipboard.writeText(output.value);status.textContent='Unverified comparison copied for independent owner review; no closure.';}
    catch{output.focus();output.select();status.textContent='Select the comparison manually to copy.';}
  });
}
if(typeof document!=='undefined')init579();
