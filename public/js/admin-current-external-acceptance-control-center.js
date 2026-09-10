// Release 467 Build 90 — structured cross-lane external acceptance renderer.
document.addEventListener('DOMContentLoaded',()=>{
  const mount=document.getElementById('externalAcceptanceControlCenterMount');if(!mount)return;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const apiFetch=(...args)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(...args):fetch(...args);
  const stateLabel=(v)=>String(v||'pending').replaceAll('_',' ').replaceAll('-',' ').toUpperCase();
  const stateClass=(v)=>String(v||'pending').toLowerCase().replaceAll('_','-');
  const shortSha=(v)=>/^[0-9a-f]{40}$/i.test(String(v||''))?String(v).slice(0,12):(v||'unavailable');
  const status=(v)=>`<span class="ext-v88-status ${esc(stateClass(v))}">${esc(stateLabel(v))}</span>`;
  const yesNo=(v)=>v?'YES':'NO';
  let latest=null;

  function checkTable(lane){
    const rows=Array.isArray(lane?.checks)?lane.checks:[];
    return `<div class="ext-v88-table"><table><thead><tr><th>Acceptance check</th><th>State</th><th>Evidence</th><th>Evidence / correction detail</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${esc(row.check_label||row.check_key)}${row.required===false?' <span class="small">(info)</span>':''}</td><td>${status(row.check_state)}</td><td>${esc(yesNo(row.evidence_present))}${row.last_checked_at?`<div class="small">${esc(row.last_checked_at)}</div>`:''}</td><td class="small">${esc(row.detail||row.last_safe_error||'')}</td></tr>`).join('')||'<tr><td colspan="4" class="small">No checks returned.</td></tr>'}</tbody></table></div>`;
  }

  function nextAction(lane){
    const next=lane?.next_action||{};
    const link=next.href?` <a href="${esc(next.href)}">Open required workspace →</a>`:'';
    if(next.state==='complete')return `<p class="small"><strong>Next action:</strong> ${esc(next.label||'No missing evidence in this lane.')}${link}</p>`;
    return `<p class="small"><strong>Next action:</strong> ${esc(next.label||'Complete the next missing external evidence step.')}${link}</p>`;
  }

  function evidenceAge(lane){
    const timestamp=lane?.evidence_timestamp?` • latest evidence: ${esc(lane.evidence_timestamp)}`:'';
    const state=lane?.evidence_freshness_state?` • freshness authority: ${esc(stateLabel(lane.evidence_freshness_state))}`:'';
    return timestamp||state?`<p class="small"><strong>Evidence timing:</strong>${timestamp}${state}</p>`:'';
  }

  function paymentLane(lane){
    const provider=lane?.key==='stripe_development'?'stripe':'paypal';
    const config=lane?.configuration||{},payment=lane?.acceptance_payment||{},refund=lane?.provider_refund||{};
    const name=provider==='stripe'?'Stripe Development':'PayPal sandbox';
    const prepareLabel=provider==='stripe'?'Prepare Stripe test checkout':'Prepare PayPal sandbox approval';
    const actionsAvailable=latest?.provider_action_lane?.available===true;
    const executionReady=actionsAvailable&&config.execution_authorized===true;
    const paymentSettled=['paid','partially_refunded','refunded'].includes(String(payment.payment_status||'').toLowerCase());
    const canRefund=Boolean(actionsAvailable&&payment.payment_id&&paymentSettled&&!lane.refund_accepted&&config.execution_authorized===true);
    return `<section class="card" style="margin-top:16px"><div class="ext-v88-lane"><header><div><h2 style="margin:0">${esc(name)}</h2><p class="small">${Number(lane.accepted_check_count||0)}/${Number(lane.required_check_count||6)} required evidence checks passed.</p></div>${status(lane.acceptance_state)}</header><p class="small">Configuration ready: ${yesNo(config.configuration_ready)} • Development host: ${yesNo(config.development_host)} • operator switch: ${yesNo(config.operator_switch_set)} • guarded action lane available: ${yesNo(actionsAvailable)} • live credential detected: ${yesNo(config.live_credential_detected)}</p>${nextAction(lane)}${evidenceAge(lane)}<div class="ext-v88-actions"><button class="btn" type="button" data-provider-prepare="${provider}" ${executionReady?'':'disabled'}>${esc(prepareLabel)}</button><button class="btn secondary" type="button" data-provider-refund="${provider}" ${canRefund?'':'disabled'}>Run provider-synchronized test refund</button><button class="btn secondary" type="button" data-refresh-evidence ${actionsAvailable?'':'disabled'}>Refresh Development evidence</button></div><div id="externalActionLink-${provider}" class="ext-v88-action-note small"></div>${checkTable(lane)}${lane.refund_accepted?`<p class="small"><strong>Refund evidence:</strong> synchronized provider refund is recorded${refund.provider_sync_status?` • ${esc(refund.provider_sync_status)}`:''}.</p>`:'<p class="small"><strong>Refund evidence:</strong> still required.</p>'}</div></section>`;
  }

  function evidenceLane(lane){
    return `<section class="card" style="margin-top:16px"><div class="ext-v88-lane"><header><div><h2 style="margin:0">${esc(lane?.label||lane?.key||'External lane')}</h2><p class="small">${Number(lane?.accepted_check_count||0)}/${Number(lane?.required_check_count||0)} required evidence checks passed.</p></div>${status(lane?.acceptance_state)}</header><p class="small">${esc(lane?.policy||lane?.correction_mechanic||'Current external evidence is required before this lane can be accepted.')}</p>${nextAction(lane)}${evidenceAge(lane)}${checkTable(lane)}</div></section>`;
  }

  function render(data){
    latest=data;
    const lanes=data.lanes||{},summary=data.summary||{},verified=data.verified_development||{},production=data.production||{},runtime=data.runtime||{},runner=data.provider_runner||{};
    const actionReason=data.provider_action_lane?.availability_reason||'unavailable';
    mount.innerHTML=`<section class="card" style="margin-top:18px"><div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap"><div><p class="eyebrow">Release 467 Build 90</p><h2 style="margin:0">External Acceptance Evidence Depth &amp; Cross-Lane Guidance</h2><p class="small">All five external lanes now use structured evidence checks and one explicit next action. Build 89 environment isolation remains intact: Production is read-only; guarded payment actions remain Development-only.</p></div>${status(data.state)}</div><div class="ext-v88-summary" style="margin-top:14px"><div><span class="small">Accepted lanes</span><strong>${Number(summary.accepted_lane_count||0)}/${Number(summary.required_lane_count||5)}</strong></div><div><span class="small">Evidence checks</span><strong>${Number(summary.accepted_check_count||0)}/${Number(summary.required_check_count||0)}</strong><span class="small">Across all five lanes</span></div><div><span class="small">Verified Development</span><strong>Build ${verified.build||89}</strong><span class="small">${esc(shortSha(verified.dev_sha))}</span></div><div><span class="small">Production GREEN</span><strong>Build ${production.build||89}</strong><span class="small">${esc(shortSha(production.main_sha))}</span></div><div><span class="small">Runtime / action lane</span><strong>${esc(String(runtime.environment||'unknown').toUpperCase())}</strong><span class="small">${data.provider_action_lane?.available===true?'Development actions available':esc(actionReason)}</span></div></div><p class="small" style="margin-bottom:0">Provider runner invoked: ${yesNo(runner.invoked)} • available: ${yesNo(runner.available)}${runner.error?` • ${esc(runner.error)}`:''}</p></section>${paymentLane(lanes.stripe_development||{})}${paymentLane(lanes.paypal_sandbox||{})}<section class="card" style="margin-top:16px"><h2 style="margin-top:0">Social, private-media &amp; Access evidence</h2><p class="small">These lanes now expose their underlying checks instead of a single shallow HOLD card. Evidence age is shown where available; the application never self-attests an external workflow or silently treats elapsed time as acceptance.</p></section>${evidenceLane(lanes.social_oauth||{})}${evidenceLane(lanes.caip_private_media||{})}${evidenceLane(lanes.cloudflare_access_service_token||{})}<section class="card" style="margin-top:16px"><h2 style="margin-top:0">Current acceptance truth</h2>${(data.truth_notes||[]).map(note=>`<p class="small">• ${esc(note)}</p>`).join('')}<p id="externalAcceptanceActionNotice" class="small" aria-live="polite"></p></section>`;
    mount.querySelectorAll('[data-refresh-evidence]').forEach(button=>button.addEventListener('click',refreshEvidence));
    mount.querySelectorAll('[data-provider-prepare]').forEach(button=>button.addEventListener('click',()=>prepareProvider(button.dataset.providerPrepare)));
    mount.querySelectorAll('[data-provider-refund]').forEach(button=>button.addEventListener('click',()=>refundProvider(button.dataset.providerRefund)));
  }

  async function load(){
    mount.innerHTML='<section class="card" style="margin-top:18px"><p class="small">Loading Release 467 Build 90 structured external acceptance evidence…</p></section>';
    try{
      const response=await apiFetch('/api/admin/current-external-acceptance-control-center',{method:'GET',cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||data?.ok!==true)throw new Error(data?.error||`External acceptance control center failed (${response.status}).`);
      render(data);
    }catch(error){mount.innerHTML=`<section class="card" style="margin-top:18px"><h2>External acceptance evidence unavailable</h2><p class="small">${esc(error?.message||'Unable to load current external acceptance evidence.')}</p><button class="btn" id="retryExternalAcceptance" type="button">Retry</button></section>`;document.getElementById('retryExternalAcceptance')?.addEventListener('click',load);}
  }

  async function runnerPost(payload){
    if(latest?.provider_action_lane?.available!==true)throw new Error('Provider acceptance actions are available only on the canonical Development environment. This view is read-only here.');
    const endpoint=latest?.provider_action_lane?.endpoint||'/api/admin/provider-acceptance-runner';
    const response=await apiFetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(payload)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data?.ok!==true)throw new Error(data?.error||`Provider action failed (${response.status}).`);
    return data;
  }

  function actionNotice(message){const target=document.getElementById('externalAcceptanceActionNotice');if(target)target.textContent=message||'';}
  async function refreshEvidence(){actionNotice('Refreshing sanitized Development evidence…');try{await runnerPost({action:'refresh_evidence'});actionNotice('Evidence refreshed. No provider network call was made by the refresh action.');await load();}catch(error){actionNotice(error?.message||'Evidence refresh failed.');}}
  async function prepareProvider(provider){const label=provider==='stripe'?'Stripe test checkout':'PayPal sandbox approval';if(!window.confirm(`Prepare a new $1.00 CAD ${label} in Development? This can call the provider test/sandbox API, never Production, and does not mark acceptance complete.`))return;actionNotice(`Preparing ${label}…`);try{const data=await runnerPost({action:'prepare_checkout',provider,confirm_provider_test:true});await load();const link=document.getElementById(`externalActionLink-${provider}`);if(link&&data.redirect_url)link.innerHTML=`<strong>Human completion required:</strong> <a href="${esc(data.redirect_url)}" target="_blank" rel="noopener noreferrer">Open ${esc(label)}</a>, complete the test flow, then return and refresh evidence.`;actionNotice(data.message||`${label} prepared.`);}catch(error){actionNotice(error?.message||`${label} preparation failed.`);}}
  async function refundProvider(provider){const label=provider==='stripe'?'Stripe test':'PayPal sandbox';if(!window.confirm(`Run the provider-synchronized ${label} refund proof for the latest settled Development acceptance payment? Production execution remains forbidden.`))return;actionNotice(`Running ${label} refund proof…`);try{const data=await runnerPost({action:'refund_latest',provider,confirm_provider_test:true});actionNotice(data.message||`${label} refund proof completed.`);await load();}catch(error){actionNotice(error?.message||`${label} refund proof failed.`);}}
  void load();
});
