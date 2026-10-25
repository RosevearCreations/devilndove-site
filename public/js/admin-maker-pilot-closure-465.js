/* Build 465 — explicit, minimal Admin source reads and local HOLD report. No write API. */
import {CLOSURE_CHECKS_465,NEXT_MAKER_BUILDS_466_475,deriveMakerClosure465} from './maker-pilot-closure-policy-465.mjs?v=465';
const el=id=>document.getElementById(id),make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const api=(...args)=>(window.DDAuth?.apiFetch||fetch)(...args);let owner=null,fulfillment=null,current=null,sourceInfo=null;
const checkedIds=['pcScenario','pcProject','pcOrder'];
function resetSources(){owner=null;fulfillment=null;sourceInfo=null;current=null;el('pcDownload').disabled=true;el('pcSources').textContent='Source choice changed. Read the original source again; earlier session assertions must be reviewed again.';el('pcSourceDetails').replaceChildren();el('pcDecision').textContent='HOLD — sources or attestations changed.';}
for(const check of CLOSURE_CHECKS_465){const section=make('section');section.className='pc-card';const h=make('h3',check.label+' ⓘ');section.append(h);
 const link=make('a','Open original source module');link.href=check.source;section.append(link,make('p',check.help));
 const refLabel=make('label','Actual non-sensitive original source reference (8–200 characters)');const ref=make('input');ref.id='pcRef_'+check.key;ref.maxLength=200;ref.placeholder='Original module, record ID and relevant evidence date';refLabel.append(ref);
 const noteLabel=make('label','Factual observation / HOLD reason (24–600 characters)');const note=make('textarea');note.id='pcNote_'+check.key;note.maxLength=600;note.minLength=24;note.placeholder='What did we inspect in the actual source? What remains unverified?';noteLabel.append(note);
 const observedLabel=make('label');observedLabel.className='pc-check';const observed=make('input');observed.type='checkbox';observed.id='pcObserved_'+check.key;observedLabel.append(observed,make('span','I personally inspected the original evidence for this exact case, without assuming delivery, legal compliance, customer consent or provider approval.'));
 const state=make('p','HOLD — independent original-source review not yet recorded.');state.id='pcState_'+check.key;state.className='pc-meta';section.append(refLabel,noteLabel,observedLabel,state);el('pcChecks').append(section);
 for(const x of [ref,note,observed])x.addEventListener('input',invalidate);
}
for(const b of NEXT_MAKER_BUILDS_466_475){const li=make('li');li.append(make('strong',`${b.priority} · Build ${b.number} — ${b.title}`),make('p',b.gate));el('pcRoadmap').append(li);}
function invalidate(){current=null;el('pcDownload').disabled=true;el('pcDecision').textContent='HOLD — session review changed. Reconcile locally again.';}
function clearAttestations(){for(const c of CLOSURE_CHECKS_465){el('pcRef_'+c.key).value='';el('pcNote_'+c.key).value='';el('pcObserved_'+c.key).checked=false;el('pcState_'+c.key).textContent='HOLD — source/case changed; personal review must be repeated.';}}
for(const id of checkedIds)el(id).addEventListener('change',()=>{resetSources();clearAttestations();});
const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
async function getJson(url){const r=await api(url,{method:'GET',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});const body=await r.json().catch(()=>({ok:false,error:'Invalid Admin response'}));if(!r.ok||body.ok!==true)throw Error(body.error||`HTTP ${r.status}`);return body;}
el('pcRead').addEventListener('click',async()=>{resetSources();const scenario=el('pcScenario').value,projectId=positive(el('pcProject').value),orderId=positive(el('pcOrder').value),work=[];
 if(scenario&&projectId){const query=new URLSearchParams({scenario,[scenario==='custom_commission'?'custom_request_id':'project_id']:String(projectId)});work.push({key:'owner',promise:getJson('/api/admin/maker-owner-trials?'+query)});}
 if(orderId)work.push({key:'fulfillment',promise:getJson('/api/admin/maker-fulfillment-evidence?order_id='+orderId)});
 if(!work.length){el('pcSources').textContent='HOLD — choose an actual owner trial scenario/project and/or an actual Order ID. No request sent.';return;}
 const button=el('pcRead');button.disabled=true;el('pcSources').textContent='Reading exactly the selected original sources…';
 try{const outcome=await Promise.allSettled(work.map(x=>x.promise)),detail=el('pcSourceDetails');detail.replaceChildren();const observations=[];
  for(let i=0;i<work.length;i++){const x=outcome[i],key=work[i].key;if(x.status==='fulfilled'){
    if(key==='owner'&&x.value.selected){owner=x.value;const s=owner.summary;observations.push(`Owner trial: ${s.accepted}/${s.required} source-linked checkpoints marked accepted in original receipts. Provider/physical acceptance still HOLD.`);}
    else if(key==='fulfillment'&&x.value.order){fulfillment=x.value;observations.push(`Fulfillment: original Order #${fulfillment.order.order_id}; ${fulfillment.evidence.length} bounded receipts, actual delivery/consent not independently verified.`);}
    else observations.push(`${key}: HOLD — source response lacked the selected real record.`);
   }else observations.push(`${key}: HOLD — ${String(x.reason?.message||'original source unavailable').slice(0,150)}`);
  }
  for(const result of observations)detail.append(make('li',result));sourceInfo={scenario,project_id:projectId,order_id:orderId,read_at:new Date().toISOString()};
  el('pcSources').textContent=`Read ${outcome.filter(x=>x.status==='fulfilled').length}/${work.length} original APIs; only real source facts shown. Acceptance and external approvals remain separate.`;
 }finally{button.disabled=false;}
});
el('pcReset').addEventListener('click',()=>{for(const id of checkedIds)el(id).value='';resetSources();clearAttestations();el('pcSources').textContent='Cleared. No source loaded, no owner closure.';});
function manual(){const out={};for(const c of CLOSURE_CHECKS_465)out[c.key]={reference:el('pcRef_'+c.key).value.trim(),note:el('pcNote_'+c.key).value.trim(),observed:el('pcObserved_'+c.key).checked};return out;}
el('pcEvaluate').addEventListener('click',()=>{const result=deriveMakerClosure465({ownerTrial:owner,ownerScenario:el('pcScenario').value,fulfillment,manual:manual()});current={result,sourceInfo,manual:manual()};el('pcDownload').disabled=false;
 el('pcDecision').textContent=`${result.state}: ${result.ownerReviewCount}/${result.required} owner checkpoints attested in this session; zero automatically closed. This is NOT independent real-world acceptance or a certified Product/financial/provider decision.`;
 const gaps=el('pcGaps');gaps.replaceChildren();for(const c of result.results){el('pcState_'+c.key).textContent=`${c.status}; ${c.sourceStatus}${c.sourceReceiptIds.length?`; ${c.sourceReceiptIds.length} canonical receipt ID(s) referenced`:''}`;
  if(!c.ownerAttested)gaps.append(make('li',`${c.label}: ${c.gaps[0]}`));}
});
el('pcDownload').addEventListener('click',()=>{if(!current)return;const safe={document_type:'DEVIL_N_DOVE_BUILD_465_UNVERIFIED_CLOSURE_HOLD',created_at:new Date().toISOString(),
 source_selection:current.sourceInfo,manual_owner_assertions:current.manual,closure_report:current.result,
 no_independent_verification:true,no_automatic_external_action:true,needs_owner_signature_on_original_sources:true,
 next_prioritized_roadmap:NEXT_MAKER_BUILDS_466_475};
 const blob=new Blob([JSON.stringify(safe,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=make('a');a.href=url;a.download='devilndove-build465-owner-pilot-closure-HOLD.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 el('pcDecision').textContent='Downloaded locally: UNVERIFIED HOLD packet. No D1, customer, provider, order, inventory or external system was changed.';
});
