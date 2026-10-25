/* Build 472 — owner-editable, no-write real-media remediation notes.
 * Never fetch media, infer rights, record acceptance or contact a provider. */
import {planActualMakerMedia472,MEDIA_TARGET_RATIOS} from './maker-media-remediation-policy-472.mjs?v=472';

const $=id=>document.getElementById(id),mount=$('ma472Frames'),devices=$('ma472Devices');
const status=$('ma472Status'),exportButton=$('ma472Export');
let source=null;
function make(tag,content,className){const n=document.createElement(tag);if(content!==undefined)n.textContent=content;
 if(className)n.className=className;return n;}
function labelled(parent,label,control){const row=make('label');row.append(make('span',label),control);parent.append(row);return control;}
function field(parent,label,type='text',placeholder=''){
 const input=make(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;
 input.placeholder=placeholder;if(type==='number'){input.min='1';input.max='100000';input.step='1';input.inputMode='numeric';}
 return labelled(parent,label,input);
}
function selectField(parent,label,choices){const box=make('select');for(const [value,title] of choices){
 const option=make('option',title);option.value=value;box.append(option);
 }return labelled(parent,label,box);}
const frameKey=frame=>`${frame.kind}:${frame.sourceId}:${frame.id}`;
const deviceTitles=Object.freeze({
 desktop_keyboard_focus:'Desktop: keyboard-only navigation, logical focus order and visible focus',
 phone_touch_reflow:'Phone: real touch targets and content reflow without sideways scrolling',
 zoom_200_percent:'Desktop browser: text/content at 200% zoom without loss',
 contrast_and_reduced_motion:'Actual colours: sufficient readable contrast and reduced-motion behavior',
 screen_reader_text:'Screen reader: useful accessible names, descriptions and image context'
});
function render(){mount.replaceChildren();devices.replaceChildren();
 exportButton.disabled=!source?.project||!source?.story||!source?.frames?.length;
 if(exportButton.disabled){status.textContent='HOLD: choose an actual source-linked Story with frames. No original photos, video, or rights have been verified.';return;}
 source.frames.forEach((frame,index)=>{
  const card=make('fieldset',undefined,'ma-remediate');card.dataset.frameKey=frameKey(frame);
  const title=make('legend',`Frame ${index+1} — ${frame.label||frame.kind} • #${frame.id}`);
  card.append(title,make('p',`${frame.kind.replaceAll('_',' ')} source #${frame.sourceId} • ${frame.principal?'principal media':'other media'} • ${frame.publicFrame?'public candidate':'private'}`,'ma-muted'));
  const grid=make('div',undefined,'ma-fields');
  field(grid,'Actual original width (px)','number','Measured from source').dataset.field='width';
  field(grid,'Actual original height (px)','number','Measured from source').dataset.field='height';
  selectField(grid,'Target display ratio',[[ '', 'Choose after checking actual layout'],...Object.keys(MEDIA_TARGET_RATIOS).map(k=>[k,k])]).dataset.field='target_ratio';
  selectField(grid,'Crop strategy',[[ '', 'Choose crop strategy'],['contain','Contain / preserve entire image'],['cover','Cover / trim edges (inspect focal point)']]).dataset.field='crop_mode';
  field(grid,'Owner-written accurate alternative text','textarea','Describe meaningful visible content; do not invent materials or details.').dataset.field='alt_text';
  field(grid,'Owner-reviewed factual caption','textarea','Identify what really happened or appears in this original.').dataset.field='caption';
  field(grid,'Exact private rights/consent source reference','text','Receipt ID or owning module reference; no credentials or raw private URLs.').dataset.field='rights_reference';
  if(frame.kind==='product_video'){
   const row=make('label',undefined,'ma-check'),input=make('input');input.type='checkbox';input.dataset.field='timed_captions_reviewed';
   row.append(input,make('span','I personally checked time-synchronized video captions/subtitles on the actual source. A summary/transcript alone is insufficient.'));grid.append(row);
  }
  const note=make('p','No source edits have been performed. Use the original workspace link above to correct media and create a new story revision.','ma-crop-note');
  card.append(grid,note);mount.append(card);
 });
 for(const [key,label] of Object.entries(deviceTitles)){
  const row=make('label',undefined,'ma-check'),input=make('input');input.type='checkbox';input.dataset.deviceCheck=key;
  row.append(input,make('span',label));devices.append(row);
 }
 updateStatus();
}
function capture(){const answers={};
 for(const card of mount.querySelectorAll('[data-frame-key]')){
  const input={};for(const n of card.querySelectorAll('[data-field]'))input[n.dataset.field]=n.type==='checkbox'?n.checked:n.value;
  answers[card.dataset.frameKey]=input;
 }
 const observed={};for(const input of devices.querySelectorAll('[data-device-check]'))observed[input.dataset.deviceCheck]=input.checked;
 return planActualMakerMedia472(source,answers,observed);
}
function updateStatus(){if(!source?.project||!source?.story)return;
 const plan=capture();const frameIssues=plan.frames.reduce((n,f)=>n+f.review_findings.length,0);
 status.textContent=`HOLD: ${plan.frames.length} real source frame(s) • ${frameIssues} source or preparation findings • ${plan.device_review_gaps.length} device checks not marked. `+
  'Our notes are local and unsaved. Exact original rights, crops and physical accessibility require review in their owning workspaces.';
}
document.addEventListener('dd:maker-media-audited',event=>{source=event.detail?.audit||null;render();});
mount.addEventListener('input',updateStatus);mount.addEventListener('change',updateStatus);devices.addEventListener('change',updateStatus);
exportButton.addEventListener('click',()=>{
 if(exportButton.disabled||!source)return;const plan=capture();
 const payload={...plan,prepared_at:new Date().toISOString(),private_local_draft:true,
  instruction:'Keep this file private; change actual originals, media rights and accessibility in owning source modules. This is not a publication or acceptance receipt.'};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),href=URL.createObjectURL(blob);
 const a=make('a');a.href=href;a.download=`devilndove-maker-media-review-472-project-${plan.source_project_id}-revision-${plan.source_revision_id}.json`;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),3000);
 status.textContent='Private local remediation plan downloaded. No source media or acceptance was changed; publication remains on HOLD.';
});
render();
