/* Build 472 — source-linked photo/video remediation plans. Owner entries are plans, not permissions. */
export const MEDIA_TARGET_RATIOS=Object.freeze({'1:1':1,'4:5':4/5,'3:2':3/2,'16:9':16/9,'9:16':9/16});
const validPixels=x=>Number.isSafeInteger(Number(x))&&Number(x)>=1&&Number(x)<=100000?Number(x):0;
const clean=(s,max)=>String(s??'').trim().replace(/\s+/g,' ').slice(0,max);
const safeRef=s=>clean(s,160).replace(/https?:\/\/\S+/gi,'[external source — open in owning workspace]');
const frameKey=f=>`${f.kind}:${f.sourceId}:${f.id}`;

/** Returns an owner-editable, non-authorizing, bounded assessment with no raw R2 URLs. */
export function planActualMakerMedia472(audit,answers={},devices={}){
 const frames=Array.isArray(audit?.frames)?audit.frames.slice(0,90):[];
 const hasSource=!!audit?.project&&!!audit?.story;
 const planned=frames.map(frame=>{
  const key=frameKey(frame),input=answers[key]||{},issues=[...(Array.isArray(frame.issues)?frame.issues:[])];
  const width=validPixels(input.width),height=validPixels(input.height);
  const target=Object.hasOwn(MEDIA_TARGET_RATIOS,input.target_ratio)?input.target_ratio:'';
  const mode=['contain','cover'].includes(input.crop_mode)?input.crop_mode:'';
  const description=clean(input.alt_text,300),caption=clean(input.caption,500);
  const rights=safeRef(input.rights_reference);
  const track=input.timed_captions_reviewed===true;
  const cropped=width&&height&&target&&mode==='cover';
  const cut=cropped?Math.max(0,1-Math.min((width/height)/MEDIA_TARGET_RATIOS[target],MEDIA_TARGET_RATIOS[target]/(width/height))):null;
  if(!width||!height)issues.push('Actual original pixel dimensions not measured.');
  if(!target||!mode)issues.push('Display aspect ratio and crop mode not reviewed.');
  if(cut!==null&&cut>0.2)issues.push(`Cover crop may remove ${Math.round(cut*100)}% of source area; inspect the real subject and focal point.`);
  if(description.length<12)issues.push('Owner-written accurate image/video alternative text is missing.');
  if(caption.length<12)issues.push('Factual source caption requires a human rewrite or verification.');
  if(!rights)issues.push('Exact owner rights/consent source reference not recorded.');
  if(frame.kind==='product_video'&&!track)issues.push('Time-synchronized captions/subtitles not personally verified for this video.');
  // Historical source findings cannot be auto-cleared by text typed into a browser.
  return {frame_key:key,source_kind:frame.kind,source_id:frame.sourceId,story_frame_id:frame.id,
    original_pixels:width&&height?{width,height}:null,target_ratio:target||null,crop_mode:mode||null,
    estimated_cover_crop_fraction:cut==null?null:Number(cut.toFixed(3)),
    proposed_alt_text:description||null,proposed_caption:caption||null,
    rights_reference: rights||null,timed_captions_claimed_reviewed:track,
    source_findings:frame.issues||[],review_findings:issues,owner_visual_check_pending:true};
 });
 const deviceLabels=['desktop_keyboard_focus','phone_touch_reflow','zoom_200_percent','contrast_and_reduced_motion','screen_reader_text'];
 const deviceReview=Object.fromEntries(deviceLabels.map(k=>[k,devices[k]===true]));
 const deviceGaps=deviceLabels.filter(k=>!deviceReview[k]);
 return {build:472,state:hasSource?'HOLD_REAL_OWNER_MEDIA_AND_ACCESSIBILITY_REVIEW':'HOLD_SELECT_REAL_MEDIA_SOURCE',
  source_project_id:Number(audit?.project?.creative_work_project_id)||null,
  source_revision_id:Number(audit?.story?.maker_media_story_revision_id)||null,
  generated_from:'authenticated_maker_story_source_audit_plus_unsaved_owner_notes',
  frames:planned,device_observation_claims:deviceReview,device_review_gaps:deviceGaps,
  source_gaps:Array.isArray(audit?.gaps)?audit.gaps:[],
  provider_called:false,r2_media_fetched:false,d1_write:false,media_modified:false,
  owner_approval_recorded:false,accessibility_certified:false,publication_authorized:false};
}
