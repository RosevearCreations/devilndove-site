/* Build 466 — on-demand original Admin reads, private human debrief, local unverified packet. */
import {TRIAL_PATHS_466,reconcileMakerTrial466,summarizeDebriefCases466} from './maker-trial-debrief-policy-466.mjs?v=466';
const el=id=>document.getElementById(id),make=(tag,content)=>{const e=document.createElement(tag);if(content!==undefined)e.textContent=content;return e;};
const api=(...args)=>(window.DDAuth?.apiFetch||fetch)(...args);
let trial=null,fulfillment=null,readScope=null,current=null,generation=0,busy=false;
const reports=new Map();
const positive=value=>/^[1-9]\d{0,9}$/.test(String(value??''))?Number(value):0;
const selection=()=>({scenario:el('mdScenario').value,sourceId:positive(el('mdCaseId').value),orderId:positive(el('mdOrderId').value)});
const same=(a,b)=>a&&b&&a.scenario===b.scenario&&a.sourceId===b.sourceId&&a.orderId===b.orderId;
const ownerDebrief=()=>({outcome:el('mdOutcome').value,observation:el('mdObservation').value,
 nextAction:el('mdNextAction').value,personallyObserved:el('mdObserved').checked});
function sourceStatus(value){el('mdSourceStatus').textContent=value;}
function decisionStatus(value){el('mdDecision').textContent=value;}
function blankChecks(){el('mdChecks').replaceChildren(make('tr'));
 const cell=make('td','HOLD — read original sources for this exact case.');cell.colSpan=4;el('mdChecks').firstChild.append(cell);
 el('mdOrderSummary').textContent='Order/aftercare remains unverified until selected original sources are read.';}
function invalidate(clearEvidence=true){current=null;el('mdAddCase').disabled=true;
 if(clearEvidence){++generation;busy=false;el('mdRead').disabled=false;trial=null;fulfillment=null;readScope=null;el('mdOrderRelated').checked=false;blankChecks();sourceStatus('HOLD — source selection changed. Read the exact original case again.');}
 decisionStatus('HOLD — case or owner observations changed; reconcile again.');}
for(const id of ['mdScenario','mdCaseId','mdOrderId'])el(id).addEventListener('change',()=>{
 invalidate();el('mdObservation').value='';el('mdNextAction').value='';el('mdObserved').checked=false;el('mdOutcome').value='not_yet_observed';});
for(const id of ['mdOrderRelated','mdOutcome','mdObservation','mdNextAction','mdObserved'])el(id).addEventListener('input',()=>invalidate(false));
async function fetchJson(url){const response=await api(url,{method:'GET',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
 const body=await response.json().catch(()=>({ok:false,error:'Invalid JSON from Admin source.'}));
 if(!response.ok||body?.ok!==true)throw Error(body.error||`HTTP ${response.status}`);return body;}
el('mdRead').addEventListener('click',async()=>{
 const chosen=selection();invalidate();if(!TRIAL_PATHS_466[chosen.scenario]||!chosen.sourceId){sourceStatus('HOLD — enter an existing valid Project/Custom Request ID before reading.');return;}
 if(el('mdOrderId').value.trim()&&!chosen.orderId){sourceStatus('HOLD — use a positive numeric Order ID, or leave it empty.');return;}
 const token=++generation,query=new URLSearchParams({scenario:chosen.scenario,
  [chosen.scenario==='custom_commission'?'custom_request_id':'project_id']:String(chosen.sourceId)});
 const pending=[fetchJson('/api/admin/maker-owner-trials?'+query)];
 if(chosen.orderId)pending.push(fetchJson('/api/admin/maker-fulfillment-evidence?order_id='+chosen.orderId));
 busy=true;el('mdRead').disabled=true;sourceStatus('Reading only the selected original Admin record(s)…');
 try{const fetched=await Promise.allSettled(pending);if(token!==generation)return;
  trial=fetched[0].status==='fulfilled'?fetched[0].value:null;
  fulfillment=chosen.orderId&&fetched[1]?.status==='fulfilled'?fetched[1].value:null;
  readScope=chosen;
  const errors=fetched.map((x,i)=>x.status==='rejected'?`${i?'Order':'Owner trial'}: ${String(x.reason?.message||'source unavailable').slice(0,140)}`:null).filter(Boolean);
  sourceStatus(`${fetched.filter(x=>x.status==='fulfilled').length}/${pending.length} original sources returned. ${errors.length?'HOLD: '+errors.join('; '):'Ready to compare latest receipts.'} No automatic acceptance.`);
  render(reconcileMakerTrial466({...chosen,trial,fulfillment}));
 }finally{if(token===generation){busy=false;el('mdRead').disabled=false;}}
});
function render(result){const rows=el('mdChecks');rows.replaceChildren();
 if(!result.checks.length){blankChecks();return;}
 for(const x of result.checks){const tr=make('tr');for(const value of [x.checkpoint.replaceAll('_',' '),
  x.receiptId?`#${x.receiptId}`:'None',x.sourceId?`${x.sourceKind} #${x.sourceId}`:'Not linked',x.status.replaceAll('_',' ')])tr.append(make('td',value));
  tr.lastChild.className=x.status==='SOURCE_LINKED_OWNER_RECEIPT'?'md-ok':'md-hold';rows.append(tr);}
 el('mdOrderSummary').textContent=`Order: ${result.orderStatus.replaceAll('_',' ')}. ${result.orderReceipts.length} actual ledger ID(s): ${result.orderReceipts.map(r=>`#${r.receiptId} (${r.kind})`).join(', ')||'none'}. Neither carrier delivery nor customer authorization is independently proven.`;
}
el('mdReconcile').addEventListener('click',()=>{
 const chosen=selection();if(busy||!same(chosen,readScope)){invalidate(false);decisionStatus('HOLD — read this exact original case and order before reconciling.');return;}
 current=reconcileMakerTrial466({...chosen,trial,fulfillment,orderLinkReviewed:el('mdOrderRelated').checked,debrief:ownerDebrief()});
 render(current);el('mdAddCase').disabled=current.scopeStatus!=='REAL_CASE_SELECTED';
 decisionStatus(`HOLD independent acceptance. ${current.acceptedSourceCount}/${current.required} canonical owner checkpoints source-linked; ${current.debriefStatus.replaceAll('_',' ')}. ${current.caseReceiptsReconciled?'Original trial receipts reconciled; real-world authorities still HOLD.':'Unresolved original receipts remain HOLD.'}`);
});
function rollup(){const sum=summarizeDebriefCases466([...reports.values()]),box=el('mdCases');box.replaceChildren();
 for(const r of sum.cases){const li=make('li',`${r.scenario.replaceAll('_',' ')} · ${r.scenario==='custom_commission'?'Custom Request':'Project'} #${r.sourceId}: ${r.acceptedSourceCount}/${r.required} source-linked checkpoints, ${r.debriefStatus.replaceAll('_',' ')}, ${r.orderStatus.replaceAll('_',' ')} — INDEPENDENT HOLD`);box.append(li);}
 if(!sum.totalCases)box.append(make('li','No owner cases added to this session.'));
 el('mdCoverage').textContent=`${sum.totalCases} genuine case selection(s) reviewed in this tab; ${sum.unreviewedJourneys.length}/6 journeys have no case in this session. Missing: ${sum.unreviewedJourneys.join(', ')||'none'}. Owner notes and source-check results are not independent safety/customer acceptance.`;
 el('mdExport').disabled=!sum.totalCases;return sum;}
el('mdAddCase').addEventListener('click',()=>{
 if(!current||!same(selection(),readScope)||current.scopeStatus!=='REAL_CASE_SELECTED')return;
 const key=`${current.scenario}:${current.sourceId}`;
 if(!reports.has(key)&&reports.size>=12){decisionStatus('HOLD — 12 session cases reached. Download a packet, then reopen the screen for the next group.');return;}
 reports.set(key,current);rollup();decisionStatus('Added one unverified source/owner debrief snapshot to this tab. Independent acceptance remains HOLD.');
});
el('mdClear').addEventListener('click',()=>{
 for(const id of ['mdCaseId','mdOrderId','mdObservation','mdNextAction'])el(id).value='';
 el('mdScenario').value='jewellery_metal';el('mdOutcome').value='not_yet_observed';el('mdObserved').checked=false;
 invalidate();sourceStatus('Cleared this case. Session rollup is unchanged; refresh to clear all tab-only snapshots.');
});
el('mdExport').addEventListener('click',()=>{
 const summary=rollup();if(!summary.totalCases)return;
 const output={document_type:'DEVIL_N_DOVE_BUILD_466_UNVERIFIED_REAL_OWNER_DEBRIEF_HOLD',created_at:new Date().toISOString(),
  ...summary,contains_owner_assertions_only:true,no_source_notes_or_customer_records_copied:true,
  no_automatic_external_action:true,no_independent_safety_or_delivery_acceptance:true};
 const url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],{type:'application/json'})),link=make('a');
 link.href=url;link.download='devilndove-build466-unverified-owner-debrief-HOLD.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 decisionStatus('Downloaded an UNVERIFIED local HOLD packet. No original records, stock, payment, product or provider actions changed.');
});
rollup();
