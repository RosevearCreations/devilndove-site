(()=>{
  const $=(id)=>document.getElementById(id);
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const badge=(v)=>`<span class="badge">${esc(String(v||'pending').replaceAll('_',' '))}</span>`;
  const yesNo=(v)=>v?'YES':'NO';
  let state=null;

  function apiFetch(url,options){
    const fetcher=window.DDAuth?.apiFetch||fetch;
    return fetcher(url,options);
  }

  function checkRows(provider){
    return (provider?.checks||[]).map((row)=>`<tr><td>${esc(row.check_label||row.check_key)}</td><td>${badge(row.check_state)}</td><td>${row.evidence_present?'YES':'NO'}</td><td class="small">${esc(row.detail||'')}</td></tr>`).join('');
  }

  function configurationText(provider){
    const c=provider?.configuration||{};
    if(provider?.provider==='stripe'){
      return `Test secret: ${yesNo(c.secret_key_present)} • test publishable: ${yesNo(c.publishable_key_present)} • webhook signing reference: ${yesNo(c.webhook_reference_present)} • live credential detected: ${yesNo(c.live_credential_detected)}`;
    }
    return `Client ID: ${yesNo(c.client_id_present)} • client secret: ${yesNo(c.client_secret_present)} • webhook ID: ${yesNo(c.webhook_reference_present)} • PAYPAL_ENV=sandbox: ${yesNo(c.sandbox_environment_explicit)} • live mode detected: ${yesNo(c.live_credential_detected)}`;
  }

  function providerCard(provider){
    const c=provider?.configuration||{},payment=provider?.acceptance_payment||{},refund=provider?.provider_refund||{},webhook=provider?.webhook||{};
    const name=provider?.provider==='stripe'?'Stripe Development':'PayPal sandbox';
    const prepareLabel=provider?.provider==='stripe'?'Prepare Stripe test Checkout':'Prepare PayPal sandbox approval';
    const prepareDisabled=!(c.configuration_ready&&c.execution_authorized);
    const canRefund=Boolean(payment.payment_id&&['paid','partially_refunded','refunded'].includes(String(payment.payment_status||'').toLowerCase())&&!provider.refund_accepted&&c.execution_authorized);
    const events=(webhook.required_events||[]).map((event)=>`<code>${esc(event)}</code>`).join(', ');
    const paymentLine=payment.payment_id
      ? `Local order ${esc(payment.order_number||payment.order_id)} • payment #${Number(payment.payment_id||0)} • ${badge(payment.payment_status||'pending')}`
      : 'No Release 466 acceptance payment exists yet.';
    const refundLine=provider.refund_accepted
      ? `Provider refund proof: ${badge(refund.provider_sync_status||'succeeded')} • local refund row ${Number(refund.refund_rowid||0)}`
      : 'Provider-synchronized refund proof is still pending.';

    return `<div class="card" style="margin-top:14px">
      <h3>${esc(name)}</h3>
      <p><strong>${Number(provider.accepted_check_count||0)}/${Number(provider.required_check_count||0)}</strong> evidence checks passed • configuration ${badge(c.configuration_ready?'ready':'incomplete')}</p>
      <p class="small">${esc(configurationText(provider))}</p>
      <p class="small">Execution switch set now: ${yesNo(c.operator_switch_set)} • execution authorized now: ${yesNo(c.execution_authorized)} • Development host: ${yesNo(c.development_host)}</p>
      <p>${paymentLine}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin:12px 0">
        <button type="button" data-provider-prepare="${esc(provider.provider)}" ${prepareDisabled?'disabled':''}>${esc(prepareLabel)}</button>
        <button type="button" data-provider-refund="${esc(provider.provider)}" ${canRefund?'':'disabled'}>Run provider-synchronized test refund</button>
      </div>
      <div id="providerLink-${esc(provider.provider)}"></div>
      <div style="overflow:auto"><table><thead><tr><th>Acceptance check</th><th>State</th><th>Evidence</th><th>Derived detail</th></tr></thead><tbody>${checkRows(provider)||'<tr><td colspan="4">No checks.</td></tr>'}</tbody></table></div>
      <p class="small"><strong>Preferred stable webhook:</strong> <code>${esc(webhook.preferred_stable_url||'')}</code></p>
      <p class="small"><strong>Current exact deployment webhook:</strong> <code>${esc(webhook.current_exact_url||'')}</code></p>
      <p class="small"><strong>Subscribe to:</strong> ${events||'—'}</p>
      <p class="small"><strong>Cloudflare Access:</strong> ${esc(webhook.access_policy_note||'Provider reachability still requires proof.')}</p>
      <p class="small">${refundLine}</p>
    </div>`;
  }

  function render(data){
    state=data;
    const mount=$('providerAcceptanceRunnerMount');
    const note=$('providerAcceptanceRunnerNotice');
    if(!mount)return;
    const stripe=data?.providers?.stripe||{},paypal=data?.providers?.paypal||{};
    note.innerHTML=`<strong>Build 6 runner:</strong> Development-only • provider execution defaults closed • secret values emitted: NO.<br><span class="small">Checkout preparation never counts as acceptance. Verified provider webhook, reconciliation, duplicate replay and provider-synchronized refund evidence are required.</span>`;
    mount.innerHTML=`${providerCard(stripe)}${providerCard(paypal)}`;
    mount.querySelectorAll('[data-provider-prepare]').forEach((button)=>button.addEventListener('click',()=>prepare(button.dataset.providerPrepare)));
    mount.querySelectorAll('[data-provider-refund]').forEach((button)=>button.addEventListener('click',()=>refund(button.dataset.providerRefund)));
  }

  async function load(){
    const note=$('providerAcceptanceRunnerNotice');
    try{
      const response=await apiFetch('/api/admin/provider-acceptance-runner',{headers:{'Cache-Control':'no-store'}});
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data?.ok)throw new Error(data?.error||`Runner request failed (${response.status})`);
      render(data);
    }catch(error){
      if(note)note.innerHTML=`<span role="alert">${esc(error?.message||'Could not load provider acceptance runner.')}</span>`;
    }
  }

  async function post(payload){
    const response=await apiFetch('/api/admin/provider-acceptance-runner',{
      method:'POST',
      headers:{'Content-Type':'application/json','Cache-Control':'no-store'},
      body:JSON.stringify(payload)
    });
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.ok)throw new Error(data?.error||`Provider action failed (${response.status})`);
    return data;
  }

  async function refresh(){
    const button=$('providerAcceptanceRefresh');
    const notice=$('providerAcceptanceActionNotice');
    if(button)button.disabled=true;
    if(notice)notice.textContent='Refreshing verified Development evidence…';
    try{
      const data=await post({action:'refresh_evidence'});
      render(data);
      if(notice)notice.textContent='Verified Development provider evidence refreshed. No provider network call was made.';
      window.dispatchEvent(new CustomEvent('release466-provider-evidence-refreshed'));
    }catch(error){
      if(notice)notice.textContent=error?.message||'Evidence refresh failed.';
    }finally{
      if(button)button.disabled=false;
    }
  }

  async function prepare(provider){
    const notice=$('providerAcceptanceActionNotice');
    const label=provider==='stripe'?'Stripe test Checkout':'PayPal sandbox approval';
    if(!confirm(`Prepare a new $1.00 CAD ${label} acceptance order in Development? This uses test/sandbox provider APIs only and does not mark acceptance passed.`))return;
    if(notice)notice.textContent=`Preparing ${label}…`;
    try{
      const data=await post({action:'prepare_checkout',provider,confirm_provider_test:true});
      if(notice)notice.textContent=data.message||`${label} prepared.`;
      await load();
      const linkMount=$(`providerLink-${provider}`);
      if(linkMount&&data.redirect_url){
        linkMount.innerHTML=`<p class="notice"><strong>Human completion required:</strong> <a href="${esc(data.redirect_url)}" target="_blank" rel="noopener noreferrer">Open ${esc(label)}</a>. After completing the test payment, return here and refresh evidence.</p>`;
      }
    }catch(error){
      if(notice)notice.textContent=error?.message||`${label} preparation failed.`;
    }
  }

  async function refund(provider){
    const notice=$('providerAcceptanceActionNotice');
    const label=provider==='stripe'?'Stripe test':'PayPal sandbox';
    if(!confirm(`Run the provider-synchronized ${label} refund proof for the latest settled Release 466 acceptance payment? This is Development test/sandbox only.`))return;
    if(notice)notice.textContent=`Running ${label} refund proof…`;
    try{
      const data=await post({action:'refund_latest',provider,confirm_provider_test:true});
      if(notice)notice.textContent=data.message||`${label} refund proof completed.`;
      await refresh();
    }catch(error){
      if(notice)notice.textContent=error?.message||`${label} refund proof failed.`;
    }
  }

  $('providerAcceptanceRefresh')?.addEventListener('click',refresh);
  window.addEventListener('release466-provider-evidence-refreshed',()=>{
    const existing=window.location.hash;
    if(existing==='#provider-acceptance-runner')return;
  });
  load();
})();
