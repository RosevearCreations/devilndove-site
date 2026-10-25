/* Build 463 — operator-supplied real provider evidence and static GitHub job sample. */
import {BUDGET_METRICS_463,ACTIONS_SAMPLE_463,calculateBudget463} from './maker-resource-budget-policy-463.mjs?v=463';
const el=id=>document.getElementById(id),container=el('rbMetrics'),status=el('rbStatus'),holds=el('rbHolds'),exportButton=el('rbExport');
const make=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const textInput=(id,placeholder)=>{const input=document.createElement('input');input.type='number';input.id=id;input.min='0';input.step='any';input.placeholder=placeholder;return input;};
let lastAudit=null;
for(const m of BUDGET_METRICS_463){const row=make('div',undefined,'rb-row'),title=make('strong',m.label+' ('+m.unit+')');
 const usageLabel=make('label','Provider reading'),usage=textInput('rbUse_'+m.key,'Unknown — leave blank');usageLabel.append(usage);
 const limitLabel=make('label','Current plan/budget limit'),cap=textInput('rbLimit_'+m.key,'Unknown — leave blank');limitLabel.append(cap);
 const result=make('output','HOLD · no source','rb-metric-state');result.id='rbResult_'+m.key;
 row.append(title,usageLabel,limitLabel,result);container.append(row);
}
function collect(){const values={},limits={},sources={d1:el('rbD1Source').value,workers:el('rbWorkersSource').value,r2:el('rbR2Source').value,actions:el('rbActionsSource').value};
 for(const m of BUDGET_METRICS_463){values[m.key]=el('rbUse_'+m.key).value;limits[m.key]=el('rbLimit_'+m.key).value;}
 return {values,limits,sources,windowStart:el('rbStart').value.trim(),windowEnd:el('rbEnd').value.trim()};
}
function audit(){const input=collect(),r=calculateBudget463(input);lastAudit={input,result:r};exportButton.disabled=false;
 for(const m of r.metrics){el('rbResult_'+m.key).textContent=m.status==='HOLD_MISSING_PROVENANCE_OR_LIMIT'?'HOLD · provenance or limit missing':
  `${m.status==='OVER_RECORDED_LIMIT'?'OVER':m.status==='NEAR_RECORDED_LIMIT'?'NEAR':'Under'} · ${(m.ratio*100).toFixed(1)}% of entered limit`;}
 holds.replaceChildren();for(const h of r.holds)holds.append(make('p','HOLD: '+h,'rb-hold'));
 status.textContent=`${r.state}. ${r.metrics.filter(m=>m.status!=='HOLD_MISSING_PROVENANCE_OR_LIMIT').length}/${r.metrics.length} metrics have values, source links and limits. ${r.nearOrOver.length} near/over entered limit. All provider figures remain subject to manual source validation; no data changed.`;
}
el('rbReview').addEventListener('click',audit);
const inputIds=['rbStart','rbEnd','rbD1Source','rbWorkersSource','rbR2Source','rbActionsSource'];
for(const m of BUDGET_METRICS_463)inputIds.push('rbUse_'+m.key,'rbLimit_'+m.key);
for(const id of inputIds)el(id).addEventListener('input',()=>{lastAudit=null;exportButton.disabled=true;status.textContent='Unsaved edits: press Evaluate evidence locally to recalculate. Previous comparison has been invalidated.';});
exportButton.addEventListener('click',()=>{if(!lastAudit)return;
 const packet={document_type:'DEVIL_N_DOVE_BUILD463_UNVERIFIED_RESOURCE_BUDGET_AUDIT',created_at:new Date().toISOString(),
  report: lastAudit,source_authority:'Operator-entered Cloudflare/GitHub figures; manual independent dashboard validation required',
  github_build462_historical_sample:ACTIONS_SAMPLE_463,auto_adjusted:false,provider_billing_verified:false};
 const blob=new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='devilndove-build463-resource-budget-HOLD.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 status.textContent='Downloaded a locally prepared unverified HOLD audit. No provider records, billing settings, files or D1/R2 objects changed.';
});
el('rbContracts').addEventListener('click',async()=>{const button=el('rbContracts');button.disabled=true;el('rbContractsOutput').textContent='Reading existing app-side policy by explicit request…';
 try{const response=await fetch('/api/admin/d1-read-budget',{method:'GET',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
  const data=await response.json().catch(()=>({error:'Invalid Admin response.'}));if(!response.ok||!data.ok)throw Error(data.error||`HTTP ${response.status}`);
  el('rbContractsOutput').textContent=JSON.stringify({read_only:data.read_only,provider_usage_metering_available_here:data.provider_usage_metering_available_here,policy:data.policy},null,2).slice(0,7000);
 }catch(error){el('rbContractsOutput').textContent='HOLD: original D1 application guardrail source unavailable: '+String(error.message||'unknown').slice(0,150);}
 finally{button.disabled=false;}
});
const table=make('table'),head=make('thead'),headers=make('tr');for(const label of ['Build 462 lane','Runs','Jobs','Job execution minutes','Per-job rounded reference','First-job wait p95 (s)'])headers.append(make('th',label));head.append(headers);table.append(head);
const body=make('tbody');for(const l of ACTIONS_SAMPLE_463.lanes){const tr=make('tr');for(const s of [l.name,l.runs,l.jobs,l.execution_min,l.rounded_reference,l.p95_wait_sec])tr.append(make('td',String(s)));body.append(tr);}table.append(body);el('rbSample').append(table);
el('rbSampleSummary').textContent=`Observed ${ACTIONS_SAMPLE_463.observed_window_utc}: ${ACTIONS_SAMPLE_463.runs} completed workflow runs, ${ACTIONS_SAMPLE_463.jobs} jobs, ${ACTIONS_SAMPLE_463.job_execution_minutes} elapsed job-execution minutes, ${ACTIONS_SAMPLE_463.rounded_job_minute_reference} minute per-job rounded reference (NOT actual account-billed minutes), and ${ACTIONS_SAMPLE_463.first_job_wait_p95_seconds} seconds p95 first-job wait. Source links below.`;
