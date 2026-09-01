(()=>{
  const $=(id)=>document.getElementById(id),esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=(cents,currency='CAD')=>{try{return new Intl.NumberFormat('en-CA',{style:'currency',currency:currency||'CAD'}).format(Number(cents||0)/100);}catch{return `$${(Number(cents||0)/100).toFixed(2)}`;}};
  const badge=(text)=>`<span class="badge">${esc(text)}</span>`;
  const card=(title,body)=>`<section style="margin-top:18px"><h2>${esc(title)}</h2>${body}</section>`;
  const table=(headers,rows)=>`<div style="overflow:auto"><table><thead><tr>${headers.map((h)=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')||`<tr><td colspan="${headers.length}" class="small">No captured observations.</td></tr>`}</tbody></table></div>`;
  function render(data){
    const funnel=data.conversion_funnel||{},search=data.search_intelligence||{},products=data.product_opportunity||{},reorder=data.reorder_economics||{},creative=data.creative_priority||{};
    const funnelRows=(funnel.steps||[]).map((r)=>`<tr><td>${esc(r.label)}</td><td>${Number(r.count||0)}</td><td>${Number(r.conversion_rate_percent||0).toFixed(1)}%</td><td>${Number(r.dropoff_count||0)}</td></tr>`);
    const searchRows=(search.terms||[]).slice(0,20).map((r)=>`<tr><td>${esc(r.search_term)}</td><td>${Number(r.searches||0)}</td><td>${Number(r.zero_result_searches||0)}</td><td>${Number(r.zero_result_rate_percent||0).toFixed(1)}%</td><td>${Number(r.average_results||0)}</td></tr>`);
    const productRows=(products.rows||[]).slice(0,25).map((r)=>`<tr><td>${esc(r.product_label)}</td><td><strong>${Number(r.opportunity_score||0)}</strong></td><td>${badge(r.recommendation)}</td><td>${esc((r.reasons||[]).join(' • '))}</td></tr>`);
    const reorderRows=(reorder.rows||[]).slice(0,30).map((r)=>`<tr><td>${esc(r.item_name)}</td><td>${badge(r.urgency)}</td><td>${Number(r.available_quantity||0).toFixed(2)}</td><td>${Number(r.recommendation?.suggested_units||0).toFixed(2)}</td><td>${Number(r.recommendation?.suggested_packs||0)}</td><td>${money(r.recommendation?.estimated_order_cost_cents,r.preferred_source?.currency)}</td><td>${esc(r.preferred_source?.name||'No reviewed preferred source')}</td></tr>`);
    const creativeRows=(creative.rows||[]).slice(0,30).map((r)=>`<tr><td>${esc(r.project_title)}</td><td>${esc(r.project_status)}</td><td><strong>${Number(r.priority_score||0)}</strong></td><td>${badge(r.recommendation)}</td><td>${esc((r.reasons||[]).join(' • '))}</td></tr>`);
    const zero=search.summary||{},reorderSummary=reorder.summary||{};
    $('revenueBusinessIntelligenceMount').innerHTML=`
      <div class="grid cols-3"><div class="card"><strong>Searches</strong><div style="font-size:1.8rem">${Number(zero.searches||0)}</div><div class="small">Zero-result ${Number(zero.zero_result_rate_percent||0).toFixed(1)}% • abandoned ${Number(zero.abandoned_rate_percent||0).toFixed(1)}%</div></div><div class="card"><strong>Reorder review</strong><div style="font-size:1.8rem">${Number(reorderSummary.critical||0)+Number(reorderSummary.reorder_or_lead_time||0)}</div><div class="small">Estimated reviewed replenishment ${money(reorderSummary.estimated_review_value_cents||0)}</div></div><div class="card"><strong>Policy</strong><div style="margin-top:8px">${badge('recommendation only')}</div><div class="small">No automatic business action</div></div></div>
      ${card('11. Storefront conversion funnel',table(['Step','Count','Step conversion','Drop-off'],funnelRows)+`<p class="small">${esc(funnel.interpretation||'')}</p>`)}
      ${card('12. Search demand and abandonment',table(['Search','Searches','Zero result','Zero-result rate','Avg. results'],searchRows)+`<p class="small">${esc(search.abandonment_definition||'')} ${esc(search.interpretation||'')}</p>`)}
      ${card('13. Explainable Product opportunity',table(['Product','Score','Recommendation','Why'],productRows)+`<p class="small">Formula: ${esc(products.formula||'')} ${esc(products.policy||'')}</p>`)}
      ${card('14. Inventory reorder economics',table(['Supply','Urgency','Available','Suggested units','Packs','Estimated cost','Preferred source'],reorderRows)+`<p class="small">${esc(reorder.policy||'')}</p>`)}
      ${card('15. Creative project priority',table(['Project','Status','Score','Recommendation','Why'],creativeRows)+`<p class="small">Formula: ${esc(creative.formula||'')} ${esc(creative.policy||'')}</p>`)}
    `;
  }
  async function load(){const mount=$('revenueBusinessIntelligenceMount');mount.innerHTML='<p class="small">Loading…</p>';try{const days=$('businessDays')?.value||'30';const fetcher=window.DDAuth?.apiFetch||fetch;const response=await fetcher(`/api/admin/release-revenue-business-intelligence?days=${encodeURIComponent(days)}`);const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw new Error(data?.error||`Request failed (${response.status})`);render(data);}catch(error){mount.innerHTML=`<p role="alert">${esc(error?.message||'Could not load intelligence.')}</p>`;}}
  $('refreshBusinessIntelligence')?.addEventListener('click',load);$('businessDays')?.addEventListener('change',load);load();
})();
