(()=>{
  const mount=document.getElementById('itExternalCommercialAcceptanceMount');
  if(!mount)return;

  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(char)=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
  const stateText=(value)=>String(value||'pending').replaceAll('_',' ');
  const badge=(value)=>`<span class="badge">${esc(stateText(value))}</span>`;
  const yesNo=(value)=>value?'YES':'NO';

  function laneCard(title,item,href,label){
    const checks=Array.isArray(item?.checks)?item.checks:[];
    const passed=Number(item?.passed_count||0);
    const required=Number(item?.required_count||checks.length||0);
    const summary=required?`${passed}/${required} checks passed`:(item?.accepted?'Accepted evidence present':'External evidence pending');
    const button=href?`<a class="button secondary" href="${esc(href)}">${esc(label)}</a>`:'';
    return `<div class="card department-card">
      <h3>${esc(title)}</h3>
      <p>${badge(item?.acceptance_state||(item?.accepted?'accepted':'pending_external_evidence'))}</p>
      <p class="small">${esc(summary)}</p>
      ${button}
    </div>`;
  }

  function paymentBoundary(item){
    const execution=item?.execution_boundary||{};
    return `<p class="small">Configured: ${yesNo(execution.configured)} • test/sandbox mode: ${yesNo(execution.test_mode)} • live credential detected: ${yesNo(execution.live_credential_detected)} • operator switch set now: ${yesNo(execution.operator_switch_set)} • execution authorized now: ${yesNo(execution.execution_authorized_now)}</p>`;
  }

  function render(data){
    const summary=data.acceptance_summary||{};
    const items=data.items||{};
    const mechanics=items.release_mechanics||{};
    const blockers=Array.isArray(mechanics.blockers)?mechanics.blockers:[];
    const source=data.source||{};
    const stripe=items.stripe_development||{};
    const paypal=items.paypal_sandbox||{};
    const caip=items.caip_private_media||{};
    const social=items.social_oauth||{};

    const blockerRows=blockers.length?blockers.map((row)=>{
      const action=row.correction_href
        ? `<a class="button secondary" href="${esc(row.correction_href)}">${esc(row.correction_label||'Open')}</a>`
        : `<span class="small">${esc(row.correction_label||'External setting')}</span>`;
      return `<tr><td>${esc(row.code)}</td><td>${esc(row.owner||'')}</td><td>${esc(row.correction_mechanic||'')}</td><td>${action}</td></tr>`;
    }).join(''):'<tr><td colspan="4" class="small">No commercial/provider blockers are currently reported by the inherited runtime evidence.</td></tr>';

    mount.innerHTML=`<section class="card" style="margin-top:18px">
      <p class="eyebrow">Release 467 · Build 7 · I.T. / Financials / Creators / Socials</p>
      <h2>External Commercial Acceptance Bridge</h2>
      <p>Current Release 467 view of Stripe Development, PayPal sandbox, CAIP private-media and Social/OAuth acceptance. This panel reuses the existing sanitized runtime evidence without treating historical Production/release fields as current authority.</p>
      <div class="notice"><strong>Commercial acceptance: ${Number(summary.accepted_lane_count||0)}/${Number(summary.required_lane_count||4)}</strong> • ${badge(data.state||'HOLD_EXTERNAL')}<br><span class="small">Runtime SHA: ${esc(source.runtime_source_sha||'not exposed')} • exact SHA visible: ${yesNo(source.exact_sha_visible)} • Build 7 performs no provider action.</span></div>
      <div class="department-grid" style="margin-top:14px">
        ${laneCard('Stripe Development',stripe,'/admin/release-control/external-commercial-readiness/#provider-acceptance-runner','Open acceptance runner')}
        ${laneCard('PayPal sandbox',paypal,'/admin/release-control/external-commercial-readiness/#provider-acceptance-runner','Open acceptance runner')}
        ${laneCard('CAIP private media',caip,'/admin/runtime-acceptance/','Open runtime acceptance')}
        ${laneCard('Social / OAuth',social,'/admin/it-integrations/','Open provider configuration')}
      </div>
      <div class="card" style="margin-top:14px">
        <h3>Payment execution boundary</h3>
        <p class="small"><strong>Stripe</strong></p>${paymentBoundary(stripe)}
        <p class="small"><strong>PayPal</strong></p>${paymentBoundary(paypal)}
        <p class="small">Configuration, test mode, or an enabled operator switch is never acceptance by itself. Real Development/test/sandbox evidence remains required.</p>
      </div>
      <div style="overflow:auto;margin-top:14px">
        <table>
          <thead><tr><th>Blocker</th><th>Owner</th><th>Correction mechanic</th><th>Workspace</th></tr></thead>
          <tbody>${blockerRows}</tbody>
        </table>
      </div>
      <div class="notice" style="margin-top:14px"><strong>Authority separation:</strong> Cloudflare Access service-token acceptance remains Build 6. Production Promotion Readiness remains Build 5. Provider or Access evidence never becomes application-admin authentication.</div>
    </section>`;
  }

  async function load(){
    try{
      const fetcher=window.DDAuth?.apiFetch||fetch;
      const response=await fetcher('/api/admin/release467-external-commercial-acceptance',{method:'GET',headers:{'Cache-Control':'no-store'}});
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data?.ok)throw new Error(data?.error||`Request failed (${response.status})`);
      render(data);
    }catch(error){
      mount.innerHTML=`<section class="card" style="margin-top:18px"><p class="eyebrow">Release 467 · Build 7</p><h2>External Commercial Acceptance Bridge</h2><div class="notice" role="alert">${esc(error?.message||'Could not load current external commercial acceptance evidence.')}</div></section>`;
    }
  }

  load();
})();
