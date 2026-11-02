/* Release 467 Build 570 — local-only triage of explicit Build 569 observations.
 * Suggested priorities are not independently verified defects or approvals. */
import {CHECKS_569,DEVICES_569,STORAGE_KEY_569,makePacket569,validatePacket569} from './admin-device-acceptance-569.mjs?v=570';

export const TRIAGE_FORMAT_570='devilndove-admin-device-followup-570-v1';
const deviceName=new Map(DEVICES_569.map(x=>[x.id,x.label]));
const checkName=new Map(CHECKS_569.map(x=>[x.id,x.name]));
const checkRoute=new Map(CHECKS_569.map(x=>[x.id,x.href]));
const nextStep={
  entry:'Reopen the same saved Product ID; compare identity and Save readback without creating a second record.',
  tabs:'Retest Details, Recipe, Photos and Destinations with keyboard or touch and record the exact screen width.',
  photos:'Compare original photo files, rights and alt text; do not claim an Etsy photo match from a thumbnail.',
  etsy:'Use a read-only exact listing-ID and draft comparison; do not retry a remote write until the outcome is known.',
  art:'Check full Brand V3 artwork and any text at the reported viewport width.',
  dock:'Retest seller dock, Search and Resume without overlapping taps or inaccessible focus.',
  commerce:'Recheck the specific order/commerce card or filter on the reported device; preserve source records.',
  workshop:'Recheck the affected work-order or maker navigation path without creating a job.',
  management:'Recheck source labels, exception state and navigation; do not mutate health or release evidence.',
};
const priority570=row=>(row.device==='phone'&&['entry','tabs','dock'].includes(row.check))||row.check==='etsy'?'P1':'P2';

export function triagePacket570(packet){
  const rows=validatePacket569(packet);
  const candidates=rows.filter(x=>x.status==='needs-correction').map(row=>({
    device:row.device,check:row.check,device_label:deviceName.get(row.device),check_label:checkName.get(row.check),
    route:checkRoute.get(row.check),priority:priority570(row),
    evidence:row.note.trim()?'OWNER_NOTE_RECORDED_NOT_VERIFIED':'DETAILS_REQUIRED',
    observation:row.note,observed_at:row.observed_at,
    next_step:nextStep[row.check],
    resolution:'AWAITING_SOURCE_CHECK_AND_OWNER_RETEST',
  })).sort((a,b)=>a.priority.localeCompare(b.priority)||a.device.localeCompare(b.device)||a.check.localeCompare(b.check));
  const observed=rows.filter(x=>x.status==='observed-ok').length;
  return {format:TRIAGE_FORMAT_570,build:570,owner_signoff:'PENDING',source_feedback_format:packet.format,
    total_checks:DEVICES_569.length*CHECKS_569.length,observed_without_signoff:observed,
    pending_device_observations:DEVICES_569.length*CHECKS_569.length-observed-candidates.length,
    verified_fixes_closed:0,external_writes:0,remote_provider_checks:0,candidates};
}

export function triageText570(result){
  if(!result||result.format!==TRIAGE_FORMAT_570||result.owner_signoff!=='PENDING'||!Array.isArray(result.candidates))throw Error('Unsupported follow-up result.');
  return [
    'Devil n Dove Build 570 — Owner device observation follow-up (browser-local)',
    `Owner sign-off: PENDING; independently verified fixes closed: 0`,
    `Owner-reported correction candidates: ${result.candidates.length}; personally observed (not signed): ${result.observed_without_signoff}; device observations pending: ${result.pending_device_observations}`,
    'Suggested priorities require actual source review and owner retest. No Product, provider, inventory, finance or D1 write occurs.',
    ...result.candidates.map(item=>
      `${item.priority} | ${item.device_label} | ${item.check_label} | ${item.evidence} | ${item.observation||'No description supplied'} | ${item.route} | ${item.next_step}`),
    'No issue is closed by generating this queue. Share the readback for a targeted source fix and actual owner-device retest.',
  ].join('\n');
}

function startFollowup570(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd570Followup'))return;
  const get=id=>doc.getElementById(id);
  const list=get('dd570List');
  const status=get('dd570State');
  const box=get('dd570Export');
  const copyButton=get('dd570Copy');
  let result=null;
  get('dd570Build').addEventListener('click',()=>{
    try{
      const stored=win.localStorage.getItem(STORAGE_KEY_569);
      const packet=stored?JSON.parse(stored):makePacket569([]);
      result=triagePacket570(packet);
      list.replaceChildren();
      for(const item of result.candidates){
        const card=doc.createElement('article');card.className='dd570-candidate';
        const head=doc.createElement('h3');head.textContent=`${item.priority} · ${item.device_label} · ${item.check_label}`;
        const note=doc.createElement('p');note.textContent=item.observation||'No owner description provided yet; request details before applying a fix.';
        const next=doc.createElement('p');next.textContent=`Suggested safe retest: ${item.next_step}`;
        const link=doc.createElement('a');link.href=item.route;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open source workspace in new tab';
        const boundary=doc.createElement('small');boundary.textContent='Candidate only · Source verification and owner retest still pending';
        card.append(head,note,next,link,boundary);list.append(card);
      }
      if(result.candidates.length===0){const empty=doc.createElement('p');empty.textContent='No saved owner-reported correction candidates. This does not mean all workspaces were accepted or tested.';list.append(empty);}
      status.textContent=`${result.candidates.length} owner-reported candidates · ${result.pending_device_observations} device observations still pending · 0 independently verified fixes closed · owner sign-off PENDING.`;
      copyButton.disabled=false;box.value=triageText570(result);
    }catch{
      result=null;copyButton.disabled=true;box.value='';list.replaceChildren();status.textContent='Unable to use saved browser observations. Review the source packet before generating a follow-up queue; no remote action was taken.';
    }
  });
  copyButton.addEventListener('click',async()=>{
    if(!result)return;
    const message=triageText570(result);box.value=message;
    try{await win.navigator.clipboard.writeText(message);status.textContent='Follow-up queue copied. No issue has been accepted or closed.';}
    catch{box.focus();box.select();status.textContent='Clipboard unavailable; follow-up text is selected for manual copy. No issue has been closed.';}
  });
}
if(typeof document!=='undefined')startFollowup570();
