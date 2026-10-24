/* Release 467 Builds 456–458 — immutable owner review, explicit local draft and idempotent retry. */
import {MakerDraftStore,makerDraftScope,makerFingerprint} from './maker-draft-recovery-458.mjs';
(()=>{'use strict';
 const el=id=>document.getElementById(id),scenario=el('trialScenario'),project=el('trialProject'),request=el('trialRequest'),
  checkpoint=el('trialCheckpoint'),source=el('trialSource'),decision=el('trialDecision'),observed=el('trialObserved'),note=el('trialNote'),
  status=el('trialStatus'),save=el('trialSave');
 let state=null,store=null,draftRevision=null,pending=null,dirty=false,conflicted=false,activeScope='',lastChoice=null;
 function say(message,error=false){status.textContent=message;status.className=error?'trial-error':'trial-ok'}
 function draftSay(message,error=false){const p=el('trialDraftStatus');p.textContent=message;p.className=error?'trial-error':'trial-muted'}
 function fields(){return {checkpoint:checkpoint.value,source:source.value,decision:decision.value,observed:observed.checked,note:note.value};}
 function draftKey(){const values=scope(),commission=scenario.value==='custom_commission',sourceId=commission?values.custom_request_id:values.project_id;
  return sourceId?makerDraftScope('owner',sourceId,scenario.value):'';}
 function refreshDraft(){
  const key=state?.selected?draftKey():'';
  if(key!==activeScope){activeScope=key;draftRevision=null;pending=null;dirty=false;conflicted=false;
   try{store=key?new MakerDraftStore(localStorage,key):null}catch{store=null;}}
  const saved=store?.read();
  if(!store)draftSay('Choose a real case first. Browser storage may be disabled.');
  else if(conflicted)draftSay('OTHER TAB CHANGED THIS DRAFT. Restore the latest version or explicitly discard it before submitting.',true);
  else if(pending)draftSay('Submission outcome uncertain. Check its receipt or retry UNCHANGED; do not generate a new decision yet.',true);
  else if(saved)draftSay('A saved draft exists on this browser. Choose Restore; no private form content is loaded automatically.');
  else draftSay(dirty?'Unsaved changes — save locally before refreshing or leaving.':'No draft saved for this original case. Saving is optional and manual.');
  el('trialDraftSave').disabled=!store||conflicted;
  el('trialDraftRestore').disabled=!saved;
  el('trialDraftDiscard').disabled=!saved||Boolean(pending||saved?.pending);
  el('trialReceiptCheck').disabled=!pending;
  if(conflicted)save.disabled=true;
 }
 function changed(){dirty=true;refreshDraft()}
 function restoreDraft(){const saved=store?.read();if(!saved){draftSay('No unexpired local draft for this case.',true);return;}
  checkpoint.value=saved.fields.checkpoint||'';updateSource();
  source.value=saved.fields.source||'';decision.value=saved.fields.decision==='accepted'?'accepted':'hold';
  observed.checked=saved.fields.observed===true;note.value=saved.fields.note||'';
  draftRevision=saved.revision;pending=saved.pending||null;dirty=false;conflicted=false;save.disabled=!state?.selected;
  refreshDraft();if(saved.fields.source&&source.value!==saved.fields.source)draftSay('Original source no longer listed: evidence is not restored. Choose a fresh valid source or keep HOLD.',true);
 }
 function saveDraft(){if(!store){draftSay('Select an actual source case to save this draft.',true);return;}
  if(pending&&dirty){draftSay('This pending receipt has an original payload. Do not replace its saved fields; verify or retry the unchanged request first.',true);return;}
  try{const saved=store.save(fields(),pending,draftRevision);draftRevision=saved.revision;dirty=false;conflicted=false;refreshDraft();draftSay('Draft saved only on this browser for up to 24 hours. No server receipt created.');}
  catch(error){conflicted=/DRAFT_CONFLICT/.test(error.message);refreshDraft();draftSay(error.message,true)}
 }
 function discardDraft(){if(!store)return;if(pending||store.read()?.pending){draftSay('First restore, then check or retry the uncertain server receipt.',true);return;}
  if(!confirm('Discard this browser-local draft? The server’s original evidence and history will not be changed.'))return;
  try{const saved=store.read();store.discard(saved?.revision||null);draftRevision=null;dirty=false;conflicted=false;refreshDraft();draftSay('Local draft discarded. Original records were not modified.');}
  catch(error){draftSay(error.message,true)}
 }
 async function checkReceipt(){if(!pending)return;
  try{const result=await api('/api/admin/maker-owner-trials?lookup_key='+encodeURIComponent(pending.key));
   if(result.found){if(store&&draftRevision){store.discard(draftRevision);draftRevision=null;}pending=null;dirty=false;await load();refreshDraft();draftSay('Server receipt #'+result.receipt.maker_owner_trial_review_id+' exists for this exact owner request. Do not submit it again.');}
   else draftSay('No matching receipt found for this owner yet. Retry the UNCHANGED submission when online; its original request key will be reused.');
  }catch(error){draftSay('Receipt check unavailable: '+error.message+'. Keep the same draft and request key.',true)}
 }
 function option(value,label){const o=document.createElement('option');o.value=String(value);o.textContent=String(label);return o}
 function fill(select,items,placeholder,previous){select.replaceChildren(option('',placeholder),...items.map(item=>option(item.value,item.label)));if(previous&&items.some(i=>String(i.value)===String(previous)))select.value=String(previous)}
 async function api(url,init){const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...init});const data=await response.json().catch(()=>({error:'Invalid server response.'}));if(!response.ok||!data.ok)throw Error(data.error||'Unable to load owner evidence.');return data}
 function scope(){return scenario.value==='custom_commission'?{custom_request_id:Number(request.value)||0}:{project_id:Number(project.value)||0}}
 function checkOptions(){if(!state)return;const s=state.scenarios[scenario.value];const old=checkpoint.value;fill(checkpoint,(s?.checks||[]).map(k=>({value:k,label:state.checkpoints[k].label})),'Choose a checkpoint',old);updateSource()}
 function updateSource(){if(!state)return;const permitted=state.checkpoints[checkpoint.value]?.sources||[];const original=source.value;
  fill(source,(state.sources||[]).filter(s=>permitted.includes(s.kind)).map(s=>({value:`${s.kind}:${s.id}`,label:s.label})),'No source yet — HOLD',original)}
 function draw(){if(!state)return;
  const commission=scenario.value==='custom_commission';
  el('trialProjectLabel').hidden=commission;el('trialRequestLabel').hidden=!commission;
  const summary=state.summary||{},selected=state.selected;
  el('trialSummary').textContent=selected?`${summary.accepted||0} of ${summary.required||0} checkpoints accepted from owner review receipts. ${summary.held?.length?'Remaining HOLD: '+summary.held.map(k=>state.checkpoints[k].label).join('; '):'All checklist receipts recorded; external customer/provider/physical safety approvals remain separate HOLDs.'}`:
   'Select a real existing Project or Custom Request; no source, review or approval has been inferred.';
  const box=el('trialChecklist');box.replaceChildren();const latest={};for(const row of state.history||[])if(!latest[row.checkpoint_key])latest[row.checkpoint_key]=row;
  for(const key of state.scenarios[scenario.value]?.checks||[]){const tag=document.createElement('span');const accepted=latest[key]?.decision==='accepted';tag.className='trial-tag '+(accepted?'trial-accepted':'trial-hold');tag.textContent=(accepted?'✓ Reviewed: ':'HOLD: ')+state.checkpoints[key].label;box.append(tag)}
  const history=el('trialHistory');history.replaceChildren();if(!state.history?.length){const li=document.createElement('li');li.textContent='No genuine owner review saved for this selected case.';history.append(li)}
  for(const r of state.history||[]){const li=document.createElement('li');const title=document.createElement('strong');title.className=r.decision==='accepted'?'trial-accepted':'trial-hold';title.textContent=`${r.decision.toUpperCase()} · ${state.checkpoints[r.checkpoint_key]?.label||r.checkpoint_key} · ${r.created_at} · Receipt #${r.maker_owner_trial_review_id}`;
   const detail=document.createElement('p');detail.textContent=`Source: ${r.source_kind==='none'?'No source':r.source_kind+' #'+r.source_id}. ${r.review_note}`;li.append(title,detail);history.append(li)}
  el('trialTruncated').hidden=!state.history_truncated;
  checkOptions();save.disabled=!selected;
 }
 async function load(initialScope=null){const values=initialScope||scope(),chosen=scenario.value||'jewellery_metal';say('Refreshing private original records…');
  const q=new URLSearchParams({scenario:chosen,...Object.fromEntries(Object.entries(values).map(([k,v])=>[k,String(v)]))});
  try{const data=await api('/api/admin/maker-owner-trials?'+q);state=data;
   fill(scenario,Object.entries(data.scenarios).map(([value,v])=>({value,label:v.label})),'Choose a scenario',chosen);
   fill(project,data.projects.map(p=>({value:p.creative_work_project_id,label:`#${p.creative_work_project_id} · ${p.project_title} (${p.project_status})`})),'Choose real Creative Project',values.project_id);
   fill(request,data.requests.map(r=>({value:r.custom_request_id,label:`#${r.custom_request_id} · ${r.request_type} (${r.status})`})),'Choose real Custom Request',values.custom_request_id);
   draw();refreshDraft();lastChoice={scenario:scenario.value,project:project.value,request:request.value};
   say(data.selected?'Original records loaded. Choose a checkpoint and document what actually happened.':'Select a real source record to begin; all checkpoints remain HOLD.');
  }catch(error){state=null;save.disabled=true;say('HOLD: '+error.message,true)}
 }
 function uniqueKey(){const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);return 'trial456_'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}
 async function submit(event){event.preventDefault();if(!state?.selected){say('HOLD: select a real original Project or Request first.',true);return}
  if(conflicted){draftSay('Resolve the other-tab draft before sending a server write.',true);return}
  if(!navigator.onLine){draftSay('Offline: nothing sent. Save the draft locally and submit manually when connected.',true);return}
  const [kind,id]=source.value?source.value.split(':'):['none',''];const body={scenario_key:scenario.value,checkpoint_key:checkpoint.value,
   ...scope(),source_kind:kind,source_id:id?Number(id):null,decision:decision.value,
   personally_observed:observed.checked,review_note:note.value};
  if(body.decision==='accepted'&&(!observed.checked||kind==='none')){say('HOLD: accepted needs your personal attestation and a real linked original record.',true);return}
  const fingerprint=makerFingerprint(body);
  if(pending&&pending.fingerprint!==fingerprint){draftSay('Uncertain earlier submission differs. Check its original receipt before creating a new review.',true);return}
  if(!pending)pending={key:uniqueKey(),fingerprint};body.request_key=pending.key;
  // Only persist the form to localStorage if the operator already chose an explicit local save.
  if(store&&draftRevision)try{const local=store.save(fields(),pending,draftRevision);draftRevision=local.revision;}catch(error){conflicted=true;refreshDraft();draftSay('Another tab changed the saved draft; no server request was sent. '+error.message,true);return}
  save.disabled=true;try{const response=await api('/api/admin/maker-owner-trials',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   if(store&&draftRevision){store.discard(draftRevision);draftRevision=null;}pending=null;dirty=false;
   note.value='';observed.checked=false;decision.value='hold';await load();refreshDraft();say(`Immutable ${body.decision.toUpperCase()} review #${response.receipt_id} ${response.replayed?'reconfirmed':'saved'}. Original business records were not modified.`)}
  catch(error){say('Review NOT CONFIRMED: '+error.message+'. Retry unchanged or check the exact receipt before editing.',true);refreshDraft();}finally{save.disabled=!state?.selected||conflicted}
 }
 function changeCase(event){
  if((dirty||pending)&&!confirm('Current form has unsaved or uncertain changes. Save a local draft or check the receipt before switching. Continue anyway?')){
   if(lastChoice){scenario.value=lastChoice.scenario;project.value=lastChoice.project;request.value=lastChoice.request;}return;
  }
  if(event.target===scenario){project.value='';request.value='';}
  load();
 }
 scenario.addEventListener('change',changeCase);project.addEventListener('change',changeCase);request.addEventListener('change',changeCase);
 checkpoint.addEventListener('change',()=>{updateSource();changed()});source.addEventListener('change',changed);decision.addEventListener('change',changed);observed.addEventListener('change',changed);note.addEventListener('input',changed);
 el('trialRefresh').addEventListener('click',()=>load());el('trialForm').addEventListener('submit',submit);
 el('trialDraftSave').addEventListener('click',saveDraft);el('trialDraftRestore').addEventListener('click',restoreDraft);
 el('trialDraftDiscard').addEventListener('click',discardDraft);el('trialReceiptCheck').addEventListener('click',checkReceipt);
 window.addEventListener('storage',event=>{if(store&&event.key===store.key){conflicted=true;refreshDraft()}});
 window.addEventListener('beforeunload',event=>{if(dirty||pending){event.preventDefault();event.returnValue='';}});
 window.addEventListener('offline',()=>draftSay('Offline: existing originals remain on the server. Save a local draft; reconnect and retry manually.',true));
 window.addEventListener('online',()=>{if(store)draftSay('Connection restored. No automatic submission happened; verify any pending receipt before retrying.')});
 const query=new URLSearchParams(location.search),allowed=['jewellery_metal','resin_clay','digital_fabrication','failed_salvage','private_therapeutic','custom_commission'];
 const initialScenario=allowed.includes(query.get('scenario'))?query.get('scenario'):'jewellery_metal';
 const positive=raw=>/^[1-9]\d{0,9}$/.test(String(raw||''))?Number(raw):0;
 const initialScope=initialScenario==='custom_commission'?{custom_request_id:positive(query.get('custom_request_id'))}:{project_id:positive(query.get('project_id'))};
 scenario.replaceChildren(option(initialScenario,initialScenario.replaceAll('_',' ')));scenario.value=initialScenario;load(initialScope);
})();
