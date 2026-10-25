/* Build 460 — private read-only media/accessibility review, never automatic acceptance. */
import {auditMakerMedia,OWNER_MEDIA_CHECKS} from './maker-media-acceptance-policy-460.mjs?v=460';

const el=id=>document.getElementById(id),project=el('maProject'),revision=el('maRevision'),status=el('maStatus'),summary=el('maSummary');
const frames=el('maFrames'),checklist=el('maChecklist'),checkStatus=el('maChecklistStatus'),refresh=el('maRefresh');
const positive=value=>/^[1-9]\d{0,9}$/.test(String(value||''))?String(value):'';
const originalModules={creative_event:'/admin/creative-process/',product_image:'/admin/product-editor/',product_video:'/admin/maker-media-stories/',media_asset:'/admin/media-content-studio/'};
let inFlight=0,busy=false;

function message(text,error=false){status.textContent=text;status.className='ma-status'+(error?' ma-error':'');}
function node(tag,text,className){const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(className)x.className=className;return x;}
function link(label,href){const a=node('a',label);a.href=href;return a;}
function options(select,rows,key,label,placeholder,selected){select.replaceChildren(new Option(placeholder,''));for(const row of rows){const value=positive(row[key]);if(!value)continue;select.append(new Option(label(row),value));}select.value=selected&&Array.from(select.options).some(x=>x.value===selected)?selected:'';}
function ownerLinks(projectId,revisionId,privacy){
 const qs=projectId?'?project_id='+projectId:'';
 el('maStoryLink').href='/admin/maker-media-stories/'+qs+(revisionId?(qs?'&':'?')+'revision_id='+revisionId:'');
 el('maOwnerLink').href='/admin/maker-owner-trials/?scenario='+(privacy==='private'?'private_therapeutic':'jewellery_metal')+(projectId?'&project_id='+projectId:'');
}
function paintChecks(enabled=false){checklist.replaceChildren();for(const item of OWNER_MEDIA_CHECKS){
  const holder=node('div'),row=node('label',undefined,'ma-check'),input=document.createElement('input'),title=node('span',item.label);
  input.type='checkbox';input.value=item.key;input.disabled=!enabled;input.setAttribute('aria-label',item.label);row.append(input,title);holder.append(row);
  const help=document.createElement('details'),head=document.createElement('summary');head.textContent='ⓘ How to verify: '+item.key;
  help.className='ma-help';help.append(head,node('p',item.help));holder.append(help);checklist.append(holder);
 }
 updateCheckCount();
}
function updateCheckCount(){const marked=checklist.querySelectorAll('input:checked').length,enabled=Boolean(checklist.querySelector('input:not(:disabled)'));
 checkStatus.textContent=enabled?`${marked} of ${OWNER_MEDIA_CHECKS.length} hands-on items checked on this screen only. Nothing was stored or approved; owner acceptance remains HOLD.`:
  'Choose a real Maker Story with source-linked frames before starting hands-on checks. Owner acceptance remains HOLD.';
}
function paint(data){
 const selected=data.selected,audit=auditMakerMedia(selected);
 frames.replaceChildren();ownerLinks(positive(selected?.project?.creative_work_project_id),positive(selected?.current?.maker_media_story_revision_id),selected?.project?.privacy_status);
 if(!selected?.project){summary.textContent='Choose a real Creative Project. No media acceptance can be inferred.';return audit;}
 if(!selected.current){summary.textContent=`HOLD: ${selected.project.project_title} has no source-linked Maker Story revision. Create one with actual media in the original Maker Studio.`;return audit;}
 const gaps=audit.gaps.length?audit.gaps.join(' '):'No overview gaps in this bounded source response.';
 summary.textContent=`HOLD: ${selected.project.project_title} · story revision #${selected.current.maker_media_story_revision_id} · ${audit.frames.length} frames · ${audit.automaticFindingCount} review findings. ${gaps} Source fields alone never certify media or accessibility.`;
 for(const frame of audit.frames){const article=node('article',undefined,'ma-item');article.setAttribute('role','listitem');
  article.append(node('p',`${frame.kind.replaceAll('_',' ')} #${frame.sourceId} · Story frame #${frame.id}`,'ma-muted'),node('h3',frame.label||'Unlabelled original'));
  article.append(node('p',`Moment: ${frame.moment||'unknown'} · ${frame.principal?'Selected principal':'Not principal'} · ${frame.publicFrame?'Public candidate':'Internal only'}`));
  article.append(node('p','Caption: '+(frame.caption||'Missing')),node('p','Accessible description: '+(frame.alt||'Missing')));
  for(const issue of frame.issues)article.append(node('p','HOLD / REVIEW: '+issue,'ma-issue'));
  const href=originalModules[frame.kind]||'/admin/maker-media-stories/';
  const actions=node('div',undefined,'ma-actions');actions.append(link('Open owning source workspace',href+(frame.kind==='creative_event'?'?project_id='+selected.project.creative_work_project_id:'')));
  article.append(actions);frames.append(article);
 }
 if(!audit.frames.length)frames.append(node('p','No original source frames to inspect. Keep this case on HOLD.'));
 return audit;
}
async function load(projectId=positive(project.value),revisionId=positive(revision.value)){
 if(busy)return;busy=true;refresh.disabled=true;project.disabled=true;revision.disabled=true;const id=++inFlight;
 message('Reading private source-linked Maker Story evidence…');
 const params=new URLSearchParams();if(projectId)params.set('project_id',projectId);if(projectId&&revisionId)params.set('revision_id',revisionId);
 try{const res=await fetch('/api/admin/maker-media-stories'+(params.size?'?'+params:''),{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
  const data=await res.json().catch(()=>({error:'Invalid Maker Story response.'}));
  if(!res.ok||!data.ok)throw Error(data.error||'Original Maker Story evidence unavailable.');if(id!==inFlight)return;
  const list=Array.isArray(data.projects)?data.projects:[];
  options(project,list,'creative_work_project_id',x=>`#${x.creative_work_project_id} ${x.project_title}`,'Choose a real Creative Project',projectId);
  const selected=data.selected;
  options(revision,selected?.revisions||[],'maker_media_story_revision_id',x=>`#${x.maker_media_story_revision_id} ${x.story_title}`,'Most recent original revision',revisionId);
  const audit=paint(data);paintChecks(Boolean(selected?.current&&(selected?.frames||[]).length));
  document.dispatchEvent(new CustomEvent('dd:maker-media-audited',{detail:{audit}}));
  message(projectId?`Private sources loaded. Review genuine owner evidence and leave missing steps on HOLD.`:`Choose one of ${list.length} bounded source projects. No records changed.`);
 }catch(error){frames.replaceChildren();paintChecks(false);document.dispatchEvent(new CustomEvent('dd:maker-media-audited',{detail:{audit:null}}));summary.textContent='HOLD: original evidence could not be verified.';message('HOLD: '+error.message+' Check Admin sign-in and source migration 0047. No media or reviews were changed.',true)}
 finally{busy=false;refresh.disabled=false;project.disabled=false;revision.disabled=false;}
}
project.addEventListener('change',()=>load(positive(project.value),''));revision.addEventListener('change',()=>load(positive(project.value),positive(revision.value)));
refresh.addEventListener('click',()=>load());checklist.addEventListener('change',updateCheckCount);paintChecks();const p=positive(new URLSearchParams(location.search).get('project_id'));load(p,'');
