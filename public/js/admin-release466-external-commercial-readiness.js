(()=>{
  const $=(id)=>document.getElementById(id);
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const badge=(value)=>`<span class="badge">${esc(value)}</span>`;
  const table=(headers,body)=>`<div style="overflow:auto"><table><thead><tr>${headers.map((h)=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body||`<tr><td colspan="${headers.length}" class="small">No evidence rows.</td></tr>`}</tbody></table></div>`;
  const yesNo=(v)=>v?'YES':'NO';
  const stateLabel=(value)=>String(value||'pending').replaceAll('_',' ');

  function paymentRows(item){
    return (item?.checks||[]).map((row)=>`<tr><td>${esc(row.check_label||row.check_key)}</td><td>${badge(stateLabel(row.check_state))}</td><td>${yesNo(row.evidence_reference_present)}</td><td>${esc(row.last_checked_at||'—')}</td><td>${esc(row.last_safe_error||row.correction_mechanics||'—')}</td></tr>`).join('');
  }

  function renderPayment(id,item){
    const execution=item?.execution_boundary||{};
    $(id).innerHTML=`<p><strong>${item?.passed_count||0}/${item?.required_count||0}</strong> required checks passed • ${badge(stateLabel(item?.acceptance_state))}</p>
      <p class="small">Configured: ${yesNo(execution.configured)} • test/sandbox mode: ${yesNo(execution.test_mode)} • live credential detected: ${yesNo(execution.live_credential_detected)} • operator switch set now: ${yesNo(execution.operator_switch_set)} • execution authorized now: ${yesNo(execution.execution_authorized_now)}</p>
      ${table(['Check','State','Evidence ref','Last checked','Safe error / correction'],paymentRows(item))}`;
  }

  function render(data){
    const items=data.items||{},caip=items.caip_private_media||{},stripe=items.stripe_development||{},paypal=items.paypal_sandbox||{},oauth=items.social_oauth||{},launch=items.production_launch_readiness||{};
    const accepted=[caip,stripe,paypal,oauth].filter((item)=>item.accepted).length;
    $('build4Headline').innerHTML=`<strong>Launch state: ${esc(String(launch.state||'hold').toUpperCase())}</strong><br><span class="small">External acceptance ${accepted}/4 • blockers ${Number(launch.blocker_count||0)} • Production remains Release ${Number(data.production_release||465)}.</span>`;
    $('build4Scorecard').innerHTML=[
      ['16','CAIP private media',caip.acceptance_state],['17','Stripe Development',stripe.acceptance_state],['18','PayPal sandbox',paypal.acceptance_state],['19','Social / OAuth',oauth.acceptance_state],['20','Production launch',launch.state]
    ].map(([id,label,state])=>`<div class="card department-card"><strong>${id}. ${esc(label)}</strong><p>${badge(stateLabel(state))}</p></div>`).join('');
    renderPayment('build4Stripe',stripe);
    renderPayment('build4Paypal',paypal);
    $('build4Caip').innerHTML=`<p>${badge(stateLabel(caip.acceptance_state))} • review-proxy served events ${Number(caip.review_proxy_served_events||0)}</p><p class="small">${esc(caip.policy||'')}</p>${caip.range_evidence?`<p class="small"><strong>Range evidence:</strong> audit ${Number(caip.range_evidence.audit_id||0)} • ${esc(caip.range_evidence.created_at||'')} • ranged streaming YES • no-copy YES • no-cache YES.</p>`:'<p class="small">No qualifying authenticated range-streaming audit has been recorded yet.</p>'}`;
    const oauthRows=(oauth.providers||[]).map((row)=>`<tr><td>${esc(row.display_name||row.provider_key)}</td><td>${esc(row.connection_status)}</td><td>${row.passed_checks||0}/${row.required_checks||0}</td><td>${yesNo(row.intended_account_evidence_present)}</td><td>${yesNo(row.controlled_lifecycle_evidence_present)}</td><td>${badge(row.accepted?'accepted':'pending')}</td></tr>`).join('');
    $('build4Oauth').innerHTML=`<p>${badge(stateLabel(oauth.acceptance_state))} • selected Development providers ${Number(oauth.selected_provider_count||0)} • accepted ${Number(oauth.accepted_provider_count||0)}</p><p class="small">${esc(oauth.policy||'')}</p>${table(['Provider','Connection','Checks','Intended account','Lifecycle evidence','State'],oauthRows)}`;
    const blockerRows=(launch.blockers||[]).map((row)=>`<tr><td>${esc(row.code)}</td><td>${Number(row.item||20)}</td><td>${esc(row.owner||'')}</td><td>${esc(row.path||'—')}</td></tr>`).join('');
    $('build4Blockers').innerHTML=`<p>${badge(launch.promotion_ready?'ready for review':'hold')} • ${Number(launch.blocker_count||0)} blocker(s)</p>${table(['Blocker','Item','Owner','Path'],blockerRows)}<p class="small">Promotion remains a separate deliberate action even after this list reaches zero.</p>`;
  }

  async function load(){
    const headline=$('build4Headline');
    try{
      const fetcher=window.DDAuth?.apiFetch||fetch;
      const response=await fetcher('/api/admin/release-external-commercial-readiness',{headers:{'Cache-Control':'no-store'}});
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data?.ok)throw new Error(data?.error||`Request failed (${response.status})`);
      render(data);
    }catch(error){
      headline.innerHTML=`<span role="alert">${esc(error?.message||'Could not load Build 4 readiness.')}</span>`;
    }
  }
  load();
})();
