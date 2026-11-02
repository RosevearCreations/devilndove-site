/* Release 467 Build 569 — owner-supplied Admin device observations.
 * This local worksheet is not owner authentication, provider acceptance,
 * remote storage, or a publishing permission. */
export const FORMAT_569='devilndove-admin-device-feedback-569-v1';
export const STORAGE_KEY_569='dd:admin-device-feedback:569:v1';
export const DEVICES_569=[
  {id:'desktop',label:'Desktop / keyboard'},
  {id:'phone',label:'Phone / touch'},
  {id:'tablet',label:'Tablet / touch'},
];
export const CHECKS_569=[
  {id:'entry',name:'Product entry & saved identity',href:'/admin/product-editor/',hint:'Open the existing Product, check identity, details, Save readback and no duplicate Product.'},
  {id:'tabs',name:'Four editor areas & keyboard/touch',href:'/admin/product-editor/',hint:'Move through Details, Recipe, Photos and Destinations; check focus, labels and scrolling.'},
  {id:'photos',name:'Original photos & permissions',href:'/admin/product-editor/',hint:'Inspect actual photo originals, alt text and public-use permission. A thumbnail alone is not proof.'},
  {id:'etsy',name:'Existing Etsy draft & manual channels',href:'/admin/product-editor/',hint:'Compare the exact existing Etsy listing ID and real draft separately; no retry or posting from this worksheet.'},
  {id:'art',name:'Brand V3 image-banner fit',href:'/admin/analytics/',hint:'Check full artwork and text on Admin pages; no forced sideways scrolling on a narrow screen.'},
  {id:'dock',name:'Admin dock, Search & Resume',href:'/admin/product-editor/',hint:'Check touch access and focus: Search and Resume clear the bottom seller dock.'},
  {id:'commerce',name:'Commerce Admin workspaces',href:'/admin/orders/',hint:'Check cards, filters, action labels and actual signed-in navigation.'},
  {id:'workshop',name:'Workshop operations',href:'/admin/project-work-orders/',hint:'Check work-order navigation, readable maker actions and responsive work areas.'},
  {id:'management',name:'Management & System Operations',href:'/admin/system-operations/',hint:'Check monitoring navigation, source labels and exception controls.'},
];
export const STATUSES_569=[
  {id:'not-reviewed',label:'Not yet reviewed'},
  {id:'observed-ok',label:'Personally observed — looks right'},
  {id:'needs-correction',label:'Needs a targeted correction'},
];
const devices=new Set(DEVICES_569.map(x=>x.id));
const checks=new Set(CHECKS_569.map(x=>x.id));
const statuses=new Set(STATUSES_569.map(x=>x.id));

export function validatePacket569(packet){
  if(!packet||typeof packet!=='object'||Array.isArray(packet)||packet.format!==FORMAT_569||packet.build!==569||packet.owner_signoff!=='PENDING')throw Error('Unsupported review packet or owner sign-off claim.');
  if(!Array.isArray(packet.records)||packet.records.length>DEVICES_569.length*CHECKS_569.length)throw Error('Invalid number of review rows.');
  const seen=new Set();
  const records=packet.records.map(row=>{
    if(!row||typeof row!=='object'||!devices.has(row.device)||!checks.has(row.check)||!statuses.has(row.status))throw Error('Review row contains an unknown device, check or status.');
    const key=`${row.device}:${row.check}`;
    if(seen.has(key))throw Error('Duplicate review row; no automatic overwrite.');
    seen.add(key);
    if(typeof row.note!=='string'||row.note.length>600||typeof row.observed_at!=='string'||row.observed_at.length>40||
      (row.observed_at!==''&&!Number.isFinite(Date.parse(row.observed_at))))throw Error('Invalid note or observation time.');
    return {device:row.device,check:row.check,status:row.status,note:row.note,observed_at:row.observed_at};
  });
  return records;
}

export function makePacket569(records,createdAt=new Date().toISOString()){
  const packet={format:FORMAT_569,build:569,owner_signoff:'PENDING',created_at:createdAt,records};
  packet.records=validatePacket569(packet);
  return packet;
}

export function mergeRecords569(current,incoming){
  const currentRows=validatePacket569(makePacket569(current));
  const incomingRows=validatePacket569(makePacket569(incoming));
  const merged=new Map(currentRows.map(row=>[`${row.device}:${row.check}`,row]));
  for(const row of incomingRows){
    const key=`${row.device}:${row.check}`;
    const existing=merged.get(key);
    if(existing && (existing.status!==row.status||existing.note!==row.note||existing.observed_at!==row.observed_at))
      throw Error('Conflicting observations require manual comparison.');
    merged.set(key,row);
  }
  return [...merged.values()];
}

export function readback569(records){
  const rows=validatePacket569(makePacket569(records));
  const observed=rows.filter(x=>x.status==='observed-ok').length;
  const needsCorrection=rows.filter(x=>x.status==='needs-correction').length;
  return {observed,needsCorrection,notReviewed:DEVICES_569.length*CHECKS_569.length-observed-needsCorrection,
    ownerSignoff:'PENDING',remoteVerification:'NOT_PERFORMED',publicationPerformed:false};
}

export function summary569(packet){
  const rows=validatePacket569(packet);
  const s=readback569(rows);
  const names=new Map(CHECKS_569.map(x=>[x.id,x.name]));
  const deviceNames=new Map(DEVICES_569.map(x=>[x.id,x.label]));
  return [
    'Devil n Dove — Build 569 Admin device feedback (browser-local owner observations)',
    `Owner sign-off: ${s.ownerSignoff} • Remote/provider verification: ${s.remoteVerification}`,
    `Personally observed: ${s.observed} • Needs correction: ${s.needsCorrection} • Not reviewed: ${s.notReviewed}`,
    'No Product, Etsy, Inventory, Finance, provider or Production write performed.',
    ...rows.filter(x=>x.status!=='not-reviewed'||x.note).map(row=>
      `${deviceNames.get(row.device)} | ${names.get(row.check)} | ${row.status} | ${row.note||'No note'} | ${row.observed_at||'Time not recorded'}`),
    'Please paste this readback into the next owner review; no final acceptance is inferred.',
  ].join('\n');
}

function startWorksheet569(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd569Review'))return;
  const byId=id=>doc.getElementById(id);
  const list=byId('dd569Checks');
  const picker=byId('dd569Device');
  const state=byId('dd569State');
  const notice=byId('dd569Notice');
  const exportBox=byId('dd569Export');
  let rows=[];
  let dirty=false;
  const recordKey=(device,check)=>`${device}:${check}`;
  const announce=message=>{notice.textContent=message;};
  try{
    const saved=win.localStorage.getItem(STORAGE_KEY_569);
    if(saved)rows=validatePacket569(JSON.parse(saved));
  }catch{rows=[];announce('Browser-local saved review was unavailable. Start a fresh review; no remote record was changed.');}
  const renderState=()=>{
    const s=readback569(rows);
    state.textContent=`Owner sign-off PENDING · ${s.observed} personally observed · ${s.needsCorrection} needing correction · ${s.notReviewed} not reviewed${dirty?' · Unsaved browser changes':''}.`;
  };
  const update=(check,field,value)=>{
    const key=recordKey(picker.value,check);
    const index=rows.findIndex(x=>recordKey(x.device,x.check)===key);
    const row=index<0?{device:picker.value,check,status:'not-reviewed',note:'',observed_at:''}:{...rows[index]};
    row[field]=value;
    row.observed_at=new Date().toISOString();
    if(index<0)rows.push(row);else rows[index]=row;
    dirty=true;renderState();
  };
  const renderCards=()=>{
    list.replaceChildren();
    for(const check of CHECKS_569){
      const row=rows.find(x=>x.device===picker.value&&x.check===check.id);
      const card=doc.createElement('article');card.className='dd569-check';
      const heading=doc.createElement('h3');heading.textContent=check.name;card.append(heading);
      const help=doc.createElement('p');help.textContent=check.hint;card.append(help);
      const link=doc.createElement('a');link.href=check.href;link.textContent='Open this Admin workspace';card.append(link);
      const statusLabel=doc.createElement('label');statusLabel.textContent='My device observation';
      const select=doc.createElement('select');select.id=`dd569-${picker.value}-${check.id}`;
      for(const option of STATUSES_569){const opt=doc.createElement('option');opt.value=option.id;opt.textContent=option.label;select.append(opt);}
      select.value=row?.status||'not-reviewed';select.addEventListener('change',()=>update(check.id,'status',select.value));
      statusLabel.htmlFor=select.id;card.append(statusLabel,select);
      const noteLabel=doc.createElement('label');noteLabel.textContent='What did you see? (no passwords or customer details)';
      const note=doc.createElement('textarea');note.id=`dd569-note-${picker.value}-${check.id}`;note.rows=2;note.maxLength=600;note.value=row?.note||'';
      note.addEventListener('input',()=>update(check.id,'note',note.value));
      noteLabel.htmlFor=note.id;card.append(noteLabel,note);
      list.append(card);
    }
    renderState();
  };
  picker.addEventListener('change',renderCards);
  byId('dd569Save').addEventListener('click',()=>{
    try{win.localStorage.setItem(STORAGE_KEY_569,JSON.stringify(makePacket569(rows)));dirty=false;renderState();announce('Saved on this browser only. Other devices and the server do not receive this worksheet.');}
    catch{announce('Could not save in this browser. Copy the readback before leaving; no remote record was changed.');}
  });
  const copy=async contents=>{
    exportBox.value=contents;
    try{await win.navigator.clipboard.writeText(contents);announce('Copied. Review the text before sharing it with the owner or support.');}
    catch{exportBox.focus();exportBox.select();announce('Clipboard unavailable. The readback is selected below for manual copy.');}
  };
  byId('dd569CopySummary').addEventListener('click',()=>copy(summary569(makePacket569(rows))));
  byId('dd569CopyJson').addEventListener('click',()=>copy(JSON.stringify(makePacket569(rows),null,2)));
  byId('dd569Import').addEventListener('click',()=>{
    if(!byId('dd569ImportConfirm').checked){announce('Check the import confirmation before merging.');return;}
    try{
      const imported=validatePacket569(JSON.parse(byId('dd569ImportText').value));
      const merged=mergeRecords569(rows,imported);
      win.localStorage.setItem(STORAGE_KEY_569,JSON.stringify(makePacket569(merged)));
      rows=merged;dirty=false;byId('dd569ImportConfirm').checked=false;renderCards();announce('Merged into this browser only. All imported rows are owner observations, not a signed approval.');
    }catch{announce('Import refused: invalid or conflicting review rows. Existing observations remain unchanged; compare conflicting notes manually before retrying.');}
  });
  byId('dd569Clear').addEventListener('click',()=>{
    if(!byId('dd569ClearConfirm').checked){announce('Check the clear-review confirmation first.');return;}
    try{win.localStorage.removeItem(STORAGE_KEY_569);}catch{announce('Local storage could not be cleared.');return;}
    rows=[];dirty=false;byId('dd569ClearConfirm').checked=false;renderCards();announce('This browser-only worksheet was cleared; no Product or external source data changed.');
  });
  renderCards();
}

if(typeof document!=='undefined')startWorksheet569();
