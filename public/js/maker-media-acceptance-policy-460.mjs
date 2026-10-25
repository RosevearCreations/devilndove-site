/* Build 460 — advisory inspection of existing Build 452 source-linked story records.
 * This is never a permission, rights, accessibility, publication, or owner approval engine. */
const validId=value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):0;
const meaningful=value=>String(value??'').trim().length>=12;
const publicScopes=new Set(['product_page','website_gallery','all_public']);
const publicDecisions=new Set(['granted','not_required']);
const dateOnly=value=>/^\d{4}-\d\d-\d\d/.test(String(value||''))?String(value).slice(0,10):'';

export const OWNER_MEDIA_CHECKS=Object.freeze([
 {key:'original',label:'Open and inspect each real original in its owning private workspace',help:'The source link must resolve to the intended photo/video. Do not accept placeholders or private R2 keys as public images.'},
 {key:'dimensions',label:'Measure rendered dimensions, orientation, principal crop and responsive layout',help:'No verified image width/height or pixel inspection is returned by Maker Story source records. Check original dimensions and actual display on desktop and phone.'},
 {key:'descriptions',label:'Compare visible subject matter with captions and accessible descriptions',help:'Text length alone does not prove the caption or image description is accurate.'},
 {key:'keyboard',label:'Use only the keyboard: tab order, visible focus, labels and controls',help:'Check with a real browser and, where available, assistive technology.'},
 {key:'contrast',label:'Review text/control contrast, zoom to 200% and reduced-motion behavior',help:'Automated code checks do not prove real displayed images or foreground/background contrast.'},
 {key:'touch',label:'Test phone touch targets, wrapping and no horizontal scrolling',help:'Verify on an actual touch viewport; controls on this audit aim for at least 44px.'},
 {key:'rights',label:'Open exact consent, releases, owner rights and any customer/person permissions',help:'A consent label does not replace inspecting the original agreement and its current permitted scope.'},
 {key:'video',label:'For each video verify captions/subtitles or an accessible transcript',help:'A storyboard caption is not a time-synchronized caption track.'}
]);

function frameFindings(frame,consents,publicIntent,today){
 const issues=[];const sourceId=validId(frame.source_id),frameId=validId(frame.maker_media_story_frame_id);
 const kind=String(frame.source_kind||''),publicFrame=frame.publication_intent==='public_candidate';
 if(!sourceId||!frameId||!['creative_event','product_image','product_video','media_asset'].includes(kind))issues.push('Unverifiable original source identity.');
 if(!meaningful(frame.caption))issues.push('Missing or too-short factual caption.');
 if(!meaningful(frame.alt_description))issues.push('Missing or too-short image/video description.');
 if(kind==='media_asset'&&!frame.media_url)issues.push('Private R2 asset: inspect the original in Media Studio; a public link was not provided.');
 else if(!String(frame.media_url||'').trim())issues.push('Source media URL is absent in the current storyboard response.');
 if(publicIntent&& !publicFrame)issues.push('Frame is private inside a public-candidate story.');
 if(publicFrame){
  const consent=consents.find(c=>validId(c.consent_record_id)===validId(frame.consent_record_id));
  if(!consent)issues.push('Exact consent record was not returned; source URL matching remains unverified.');
  else {
   if(!publicDecisions.has(consent.consent_status)||Number(consent.public_use_allowed)!==1||!publicScopes.has(consent.consent_scope))issues.push('Consent is not current public-use permission for this destination.');
   const end=dateOnly(consent.expires_at);if(consent.expires_at&&(!end||end<today))issues.push('Consent has expired or its expiry date is invalid.');
   if(!frame.media_url||!consent.media_url||String(consent.media_url)!==String(frame.media_url))issues.push('Consent URL does not match the exact original media source.');
  }
 }
 if(kind==='product_video')issues.push('Time-synchronized captions/subtitles or a transcript require real owner verification.');
 issues.push('Original rendered media dimensions, crop and accuracy require hands-on inspection.');
 return {id:frameId,sourceId,kind,label:String(frame.frame_label||''),moment:String(frame.moment||''),
  principal:Number(frame.is_principal)===1,publicFrame,caption:String(frame.caption||''),alt:String(frame.alt_description||''),issues};
}

/** Review findings are advisory and never return APPROVED or automatic pass. */
export function auditMakerMedia(selected,{today=new Date().toISOString().slice(0,10)}={}){
 const project=selected?.project||null,story=selected?.current||null;
 if(!project)return {state:'HOLD_SELECT_REAL_PROJECT',project:null,story:null,frames:[],gaps:['Select an actual Creative Project.'],ownerRequired:OWNER_MEDIA_CHECKS};
 if(!story)return {state:'HOLD_NO_MEDIA_STORY',project,story:null,frames:[],gaps:['No Maker Story revision was returned for this project.'],ownerRequired:OWNER_MEDIA_CHECKS};
 const publicIntent=story.intended_visibility==='public_candidate',gaps=[],raw=Array.isArray(selected.frames)?selected.frames:[];
 if(!raw.length)gaps.push('No source-linked original media frames were returned.');
 const frames=raw.slice(0,90).map(frame=>frameFindings(frame,Array.isArray(selected.consents)?selected.consents:[],publicIntent,today));
 const principal=frames.filter(frame=>frame.principal);
 if(principal.length!==1)gaps.push(`Exactly one principal image should be selected for owner review; found ${principal.length}.`);
 if(publicIntent&&(project.privacy_status!=='public_candidate'||project.rights_status!=='public_allowed'))gaps.push('Creative Project privacy and public rights are not both currently authorized.');
 if(publicIntent&&!frames.some(x=>x.publicFrame))gaps.push('Public-candidate story contains no public-candidate media frame.');
 if(!publicIntent)gaps.push('This is a private/internal story. Do not publish or infer public permission.');
 if(raw.length>90)gaps.push('More than 90 frames were returned; the audit is incomplete.');
 return {state:'HOLD_OWNER_MEDIA_AND_ACCESSIBILITY_ACCEPTANCE',project,story,publicIntent,
  frames,gaps,ownerRequired:OWNER_MEDIA_CHECKS,automaticFindingCount:gaps.length+frames.reduce((n,f)=>n+f.issues.length,0)};
}
