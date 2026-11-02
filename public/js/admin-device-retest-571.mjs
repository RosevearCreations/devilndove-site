/* Build 571 — device retest receipts, browser-local only.
 * Owner-entered observations cannot close verified Admin exceptions. */
import {STORAGE_KEY_569,makePacket569} from './admin-device-acceptance-569.mjs?v=575';
import {triagePacket570} from './admin-device-followup-570.mjs?v=575';

export const RETEST_FORMAT_571='devilndove-admin-device-retest-571-v1';
export const RETEST_STORAGE_571='dd:admin-device-retests:571:v1';
export const RETEST_STATES_571=[
  {id:'still-failing',label:'Still reproduces on my device'},
  {id:'appears-fixed',label:'Appears fixed on my device — independent proof pending'},
];
const states=new Set(RETEST_STATES_571.map(x=>x.id));
const keyOf=row=>`${row.device}:${row.check}`;

export function validateRetests571(packet){
  if(!packet||packet.format!==RETEST_FORMAT_571||packet.build!==571||packet.owner_signoff!=='PENDING'||!Array.isArray(packet.receipts)||packet.receipts.length>27)
    throw Error('Unrecognized retest packet or unsupported sign-off claim.');
  const seen=new Set();
  return packet.receipts.map(row=>{
    if(!row||!['desktop','phone','tablet'].includes(row.device)||typeof row.check!=='string'||!states.has(row.result)||
      typeof row.source_observed_at!=='string'||typeof row.source_note!=='string'||row.source_note.length>600||
      typeof row.detail!=='string'||row.detail.trim().length<12||row.detail.length>600||
      typeof row.retested_at!=='string'||!Number.isFinite(Date.parse(row.retested_at)))throw Error('Incomplete or unsupported retest receipt.');
    const key=keyOf(row);if(seen.has(key))throw Error('Duplicate device retest requires manual comparison.');seen.add(key);
    return {device:row.device,check:row.check,source_observed_at:row.source_observed_at,source_note:row.source_note,
      result:row.result,detail:row.detail,retested_at:row.retested_at};
  });
}

export function retestPacket571(receipts){
  const packet={format:RETEST_FORMAT_571,build:571,owner_signoff:'PENDING',receipts};
  packet.receipts=validateRetests571(packet);return packet;
}

export function reconcileRetests571(feedback,retains){
  const triage=triagePacket570(feedback);
  const receipts=validateRetests571(retains);
  const candidates=new Map(triage.candidates.map(row=>[keyOf(row),row]));
  const matched=[],stale=[];
  for(const receipt of receipts){
    const source=candidates.get(keyOf(receipt));
    if(source&&source.observed_at===receipt.source_observed_at&&source.observation===receipt.source_note)
      matched.push({candidate:source,receipt});
    else stale.push(receipt);
  }
  return {candidate_count:triage.candidates.length,matched_retest_count:matched.length,
    owner_reports_still_failing:matched.filter(x=>x.receipt.result==='still-failing').length,
    owner_reports_appears_fixed:matched.filter(x=>x.receipt.result==='appears-fixed').length,
    candidates_awaiting_retest:triage.candidates.length-matched.length,
    stale_receipt_count:stale.length,stale,matched,verified_closures:0,owner_signoff:'PENDING',
    external_writes:0,provider_checks:0};
}

export function retestSummary571(result){
  if(!result||result.owner_signoff!=='PENDING'||result.verified_closures!==0||!Array.isArray(result.matched))throw Error('Unsafe retest result.');
  return [
    'Devil n Dove Build 571 — browser-local owner device retest readback',
    `Candidates: ${result.candidate_count}; current-source retest receipts: ${result.matched_retest_count}; stale receipts: ${result.stale_receipt_count}; awaiting retest: ${result.candidates_awaiting_retest}`,
    `Owner reports still failing: ${result.owner_reports_still_failing}; owner reports apparently fixed: ${result.owner_reports_appears_fixed}`,
    'Independently verified closures: 0; owner sign-off: PENDING. No Product, provider, D1, Inventory or Finance action.',
    ...result.matched.map(({candidate,receipt})=>
      `${candidate.device_label} | ${candidate.check_label} | ${receipt.result} | ${receipt.detail} | ${receipt.retested_at} | ${candidate.route} | Independent check and explicit owner review still required.`),
    ...result.stale.map(receipt=>`STALE RETEST | ${receipt.device}:${receipt.check} | original observation changed or no longer needs correction; compare before relying on this receipt.`),
    'No candidate is automatically closed. Retest statements are user-entered, not verified identity or independent proof.',
  ].join('\n');
}

function startRetests571(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd571Retests'))return;
  const get=id=>doc.getElementById(id),list=get('dd571List'),status=get('dd571State'),exportBox=get('dd571Export');
  let last=null;
  const savedFeedback=()=>{const raw=win.localStorage.getItem(STORAGE_KEY_569);return raw?JSON.parse(raw):makePacket569([]);};
  const savedRetests=()=>{const raw=win.localStorage.getItem(RETEST_STORAGE_571);return raw?JSON.parse(raw):retestPacket571([]);};
  const refresh=()=>{
    const result=reconcileRetests571(savedFeedback(),savedRetests());last=result;
    status.textContent=`${result.candidate_count} owner-reported candidates · ${result.matched_retest_count} matching retests · ${result.stale_receipt_count} stale receipts · ${result.candidates_awaiting_retest} awaiting retest · 0 independently verified closures · owner sign-off PENDING.`;
    exportBox.value=retestSummary571(result);
    return result;
  };
  get('dd571Load').addEventListener('click',()=>{
    try{
      const triage=triagePacket570(savedFeedback());
      const result=refresh();list.replaceChildren();
      for(const candidate of triage.candidates){
        const existing=result.matched.find(x=>x.candidate.device===candidate.device&&x.candidate.check===candidate.check)?.receipt;
        const card=doc.createElement('article');card.className='dd570-candidate dd571-retest';
        const h=doc.createElement('h3');h.textContent=`${candidate.priority} · ${candidate.device_label} · ${candidate.check_label}`;
        const source=doc.createElement('p');source.textContent=`Original report: ${candidate.observation||'Description missing'}`;
        const link=doc.createElement('a');link.href=candidate.route;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open workspace for a real device retest';
        const label=doc.createElement('label');label.textContent='My fresh device retest result';
        const select=doc.createElement('select');select.id=`dd571-state-${candidate.device}-${candidate.check}`;
        const choose=doc.createElement('option');choose.value='';choose.textContent='Choose retest outcome…';select.append(choose);
        for(const item of RETEST_STATES_571){const option=doc.createElement('option');option.value=item.id;option.textContent=item.label;select.append(option);}
        if(existing)select.value=existing.result;label.htmlFor=select.id;
        const noteLabel=doc.createElement('label');noteLabel.textContent='What changed or still fails? Include the device and steps, never credentials.';
        const note=doc.createElement('textarea');note.rows=3;note.maxLength=600;note.id=`dd571-detail-${candidate.device}-${candidate.check}`;note.value=existing?.detail||'';noteLabel.htmlFor=note.id;
        const confirmLabel=doc.createElement('label');confirmLabel.className='dd569-checkbox';
        const confirm=doc.createElement('input');confirm.type='checkbox';confirmLabel.append(confirm,doc.createTextNode(' I personally retested this item on the selected device.'));
        const button=doc.createElement('button');button.type='button';button.className='dd569-button';button.textContent='Record browser-local retest';
        const message=doc.createElement('p');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
        button.addEventListener('click',()=>{
          if(!confirm.checked||!states.has(select.value)||note.value.trim().length<12){message.textContent='Choose a retest result, complete the actual-device checkbox and enter at least 12 characters of evidence details.';return;}
          try{
            const current=triagePacket570(savedFeedback()).candidates.find(x=>x.device===candidate.device&&x.check===candidate.check);
            if(!current||current.observed_at!==candidate.observed_at||current.observation!==candidate.observation)throw Error('Source changed');
            const receipt={device:candidate.device,check:candidate.check,source_observed_at:candidate.observed_at,
              source_note:candidate.observation,result:select.value,detail:note.value.trim(),retested_at:new Date().toISOString()};
            const rows=validateRetests571(savedRetests()).filter(x=>keyOf(x)!==keyOf(receipt));rows.push(receipt);
            win.localStorage.setItem(RETEST_STORAGE_571,JSON.stringify(retestPacket571(rows)));
            refresh();confirm.checked=false;
            message.textContent='Saved on this browser only. This is an owner-entered retest, not an independently verified closure.';
          }catch{message.textContent='Retest not saved: source observation changed or browser storage is unavailable. Compare the original report first.';}
        });
        card.append(h,source,link,label,select,noteLabel,note,confirmLabel,button,message);list.append(card);
      }
      if(!triage.candidates.length){const p=doc.createElement('p');p.textContent='No saved correction candidates to retest. All unreviewed devices remain pending; no verified closure is inferred.';list.append(p);}
    }catch{last=null;list.replaceChildren();status.textContent='Invalid or unavailable local feedback/retest source. No receipt was recorded.';}
  });
  get('dd571Copy').addEventListener('click',async()=>{
    try{const result=refresh();const value=retestSummary571(result);exportBox.value=value;
      try{await win.navigator.clipboard.writeText(value);status.textContent='Owner-entered retest readback copied. Verified closures remain 0; sign-off PENDING.';}
      catch{exportBox.focus();exportBox.select();status.textContent='Clipboard unavailable. Readback selected for manual copy; sign-off PENDING.';}
    }catch{status.textContent='Cannot copy until local feedback and retests are valid.';}
  });
}
if(typeof document!=='undefined')startRetests571();
