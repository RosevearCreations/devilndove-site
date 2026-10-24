/* Release 467 Build 456 — genuine owner observation only; private immutable review ledger. */
(()=>{'use strict';
 const el=id=>document.getElementById(id),scenario=el('trialScenario'),project=el('trialProject'),request=el('trialRequest'),
  checkpoint=el('trialCheckpoint'),source=el('trialSource'),decision=el('trialDecision'),observed=el('trialObserved'),note=el('trialNote'),
  status=el('trialStatus'),save=el('trialSave');
 let state=null;
 function say(message,error=false){status.textContent=message;status.className=error?'trial-error':'trial-ok'}
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
 async function load(){const values=scope(),chosen=scenario.value||'jewellery_metal';say('Refreshing private original records…');
  const q=new URLSearchParams({scenario:chosen,...Object.fromEntries(Object.entries(values).map(([k,v])=>[k,String(v)]))});
  try{const data=await api('/api/admin/maker-owner-trials?'+q);state=data;
   fill(scenario,Object.entries(data.scenarios).map(([value,v])=>({value,label:v.label})),'Choose a scenario',chosen);
   fill(project,data.projects.map(p=>({value:p.creative_work_project_id,label:`#${p.creative_work_project_id} · ${p.project_title} (${p.project_status})`})),'Choose real Creative Project',values.project_id);
   fill(request,data.requests.map(r=>({value:r.custom_request_id,label:`#${r.custom_request_id} · ${r.request_type} (${r.status})`})),'Choose real Custom Request',values.custom_request_id);
   draw();say(data.selected?'Original records loaded. Choose a checkpoint and document what actually happened.':'Select a real source record to begin; all checkpoints remain HOLD.');
  }catch(error){state=null;save.disabled=true;say('HOLD: '+error.message,true)}
 }
 function uniqueKey(){const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);return 'trial456_'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}
 async function submit(event){event.preventDefault();if(!state?.selected){say('HOLD: select a real original Project or Request first.',true);return}
  const [kind,id]=source.value?source.value.split(':'):['none',''];const body={scenario_key:scenario.value,checkpoint_key:checkpoint.value,
   ...scope(),source_kind:kind,source_id:id?Number(id):null,decision:decision.value,
   personally_observed:observed.checked,review_note:note.value,request_key:uniqueKey()};
  if(body.decision==='accepted'&&(!observed.checked||kind==='none')){say('HOLD: accepted needs your personal attestation and a real linked original record.',true);return}
  save.disabled=true;try{const response=await api('/api/admin/maker-owner-trials',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   note.value='';observed.checked=false;decision.value='hold';await load();say(`Immutable ${body.decision.toUpperCase()} review #${response.receipt_id} saved. Original business records were not modified.`)}
  catch(error){say('Review NOT saved: '+error.message,true)}finally{save.disabled=!state?.selected}
 }
 scenario.addEventListener('change',()=>{project.value='';request.value='';load()});project.addEventListener('change',load);request.addEventListener('change',load);
 checkpoint.addEventListener('change',updateSource);el('trialRefresh').addEventListener('click',load);el('trialForm').addEventListener('submit',submit);
 scenario.replaceChildren(option('jewellery_metal','Jewellery & metalwork'));scenario.value='jewellery_metal';load();
})();
