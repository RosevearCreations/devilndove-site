/* Build 578: local receipt reconciliation. Never interprets a typed locator as provider verification. */
export const FORMAT_578='devilndove-channel-trial-receipts-578-v1';
export const KEY_578='dd:channel-trials:578:v1';
export const CHANNELS_578=['etsy','facebook_page','instagram','facebook_marketplace'];
export const ACTIONS_578=['CONNECTION_READBACK','DRAFT_READBACK','IMAGE_READBACK','OWNER_FOLLOWUP'];
const clean=(s,max)=>typeof s==='string'&&s.length<=max?s.trim():null;
export function validateTrial578(row){
  if(!row||!CHANNELS_578.includes(row.channel)||!ACTIONS_578.includes(row.action)||
    clean(row.product_ref,100)===null||clean(row.provider_ref,120)===null||
    clean(row.receipt_locator,350)===null||clean(row.observation,1000)===null||
    !clean(row.observation,1000)||!['NOT_TESTED','OBSERVED_UNVERIFIED','FAILED','UNKNOWN'].includes(row.outcome)||
    typeof row.recorded_at!=='string'||!Number.isFinite(Date.parse(row.recorded_at)))
    throw Error('Invalid or unsupported channel trial receipt.');
  if(row.channel==='facebook_marketplace'&&row.action!=='OWNER_FOLLOWUP')
    throw Error('Marketplace is a manual handoff, not an API trial.');
  return Object.fromEntries(['channel','action','product_ref','provider_ref','receipt_locator','observation','outcome','recorded_at']
    .map(k=>[k,typeof row[k]==='string'?row[k].trim():row[k]]));
}
export function trialPacket578(entries=[]){
  if(!Array.isArray(entries)||entries.length>100)throw Error('Trial packet limit exceeded.');
  return {format:FORMAT_578,build:578,entries:entries.map(validateTrial578)};
}
export function readback578(packet){
  if(!packet||packet.format!==FORMAT_578||packet.build!==578)throw Error('Unknown trial packet.');
  const entries=trialPacket578(packet.entries).entries;
  // Every record is manually entered. There is no trusted provider identity or server-side receipt witness here.
  return {total:entries.length,unverified:entries.length,authenticated_provider_receipts:0,
    verified_etsy_drafts:0,verified_remote_images:0,authorized_provider_writes:0,
    channels:CHANNELS_578.map(channel=>({channel,count:entries.filter(x=>x.channel===channel).length,
      state:channel==='facebook_marketplace'?'MANUAL_ONLY':'HOLD_PENDING_AUTHENTICATED_READBACK'})),
    owner_decision:'PENDING',provider_trial:'NOT_EXECUTED_BY_THIS_WORKSHEET',entries};
}
function init578(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd578Form'))return;
  const get=id=>doc.getElementById(id),status=get('dd578Status'),output=get('dd578Output');
  let entries=[];
  const render=()=>{const read=readback578(trialPacket578(entries));
    output.value=JSON.stringify(read,null,2);
    status.textContent=`${read.total} local notes · ${read.authenticated_provider_receipts} authenticated provider receipts · ${read.verified_etsy_drafts} independently verified drafts · provider writes ${read.authorized_provider_writes} · owner decision PENDING.`;
  };
  try{const raw=win.localStorage.getItem(KEY_578);if(raw){const packet=JSON.parse(raw);
    if(packet.format!==FORMAT_578||packet.build!==578)throw Error('Wrong version');entries=trialPacket578(packet.entries).entries;}}
  catch{status.textContent='Previous local notes could not be validated; no remote evidence was accepted.';}
  render();
  get('dd578Form').addEventListener('submit',e=>{e.preventDefault();
    if(!get('dd578Ack').checked){status.textContent='Confirm that this is only a manually entered, unverified note.';return;}
    try{const row=validateTrial578({channel:get('dd578Channel').value,action:get('dd578Action').value,
      product_ref:get('dd578Product').value,provider_ref:get('dd578Provider').value,
      receipt_locator:get('dd578Locator').value,observation:get('dd578Observation').value,
      outcome:get('dd578Outcome').value,recorded_at:new Date().toISOString()});
      entries=trialPacket578([...entries,row]).entries;win.localStorage.setItem(KEY_578,JSON.stringify(trialPacket578(entries)));
      get('dd578Ack').checked=false;render();}
    catch(err){status.textContent=err.message;}
  });
  get('dd578Copy').addEventListener('click',async()=>{render();try{await win.navigator.clipboard.writeText(output.value);
    status.textContent='Unverified local trial notes copied. No provider success or owner acceptance implied.';}
    catch{output.focus();output.select();status.textContent='Select and copy the notes manually.';}});
}
if(typeof document!=='undefined')init578();
