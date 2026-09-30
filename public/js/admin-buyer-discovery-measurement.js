// Release 467 Build 311 — buyer discovery evidence freshness and Search Console intake readiness.
document.addEventListener('DOMContentLoaded',()=>{
  const mount=document.getElementById('buyerDiscoveryMeasurementMount');if(!mount||!window.DDAuth)return;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
  async function load(){
    mount.innerHTML='<section class="card"><p class="small">Loading buyer discovery freshness evidence…</p></section>';
    try{
      const r=await window.DDAuth.apiFetch('/api/admin/buyer-discovery-measurement',{cache:'no-store'}),d=await r.json();
      if(!r.ok||!d.ok)throw new Error(d.error||'Buyer discovery freshness measurement failed.');
      const s=d.story||{},t=d.telemetry||{},g=d.search_console||{},si=d.search_intake||{},schema=si.schema_readiness||{},m=d.merchant?.summary||{},sm=d.sitemap||{},i=d.internal_discovery||{},idx=d.indexnow||{};
      const gscState=Number(g.row_count||0)>0?'real Search Console evidence is staged':'no Search Console rows are staged in the current 30-day window';
      const storyState=Number(s.page_views||0)>0?`${s.page_views} recorded story view(s)`:'no recorded Under the Sea story views yet';
      const intakeState=schema.ready?'Search Console intake schema ready':`Search Console intake blocked: ${(schema.missing_tables||[]).join(', ')||'required canonical table missing'}`;
      mount.innerHTML=`<section class="card"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><p class="eyebrow">Build 311 • evidence freshness</p><h2 style="margin-top:0">Buyer discovery & Search Console intake</h2><p class="small">Read-only 30-day measurement of reviewed public stories, Products, Search Console staging, attribution and sitemap coverage. Zero discovery stays zero; it is never synthesized.</p></div><button class="btn" id="buyerDiscoveryReload" type="button">Reload</button></div>
      <div class="grid cols-3" style="gap:12px"><div><strong>${esc(s.page_views||0)}</strong><div class="small">Under the Sea views / 30d</div></div><div><strong>${esc(g.impressions||0)}</strong><div class="small">Search impressions / 30d</div></div><div><strong>${esc(m.eligible||0)}</strong><div class="small">Merchant-eligible Products now</div></div></div>
      <p class="small"><strong>Story:</strong> ${s.published?'published':'not published'} • sitemap ${s.sitemap_visible?'visible':'not visible'} • ${esc(storyState)}.</p>
      <p class="small"><strong>Search Console:</strong> ${esc(gscState)} • freshness ${esc(g.freshness||'no evidence')} • rows ${esc(g.row_count||0)} • clicks ${esc(g.clicks||0)} • impressions ${esc(g.impressions||0)} • latest report ${esc(g.latest_report_date||'none')}.</p>
      <p class="small"><strong>Search intake:</strong> ${esc(intakeState)} • batches ${esc(si.batch_count||0)} • staged rows ${esc(si.live_staged_rows||0)} • latest import ${esc(si.latest_import_at||'none')} • automatic import OFF. Request-time schema repair is OFF.</p>
      <p class="small"><strong>Attribution:</strong> reviewed-story rows ${esc(g.story_rows||0)} • reviewed-Product rows ${esc(g.product_rows||0)} • other public rows ${esc(g.other_public_rows||0)}.</p>
      <p class="small"><strong>Public telemetry:</strong> ${esc(t.total_page_views||0)} total page views / ${esc(t.unique_visitors||0)} visitors in 30 days; freshness ${esc(t.freshness||'no evidence')}; latest recorded page view ${esc(t.latest_page_view_at||'none')}.</p>
      <p class="small"><strong>Sitemap:</strong> ${esc(sm.product_count||0)} Product URLs + ${esc(sm.story_count||0)} story URLs. <strong>Internal factual links:</strong> ${esc((i.factual_related_links||[]).length)}; Project 7 operations ${esc(i.project_operations||0)}. No relationship is invented when the source facts do not support it.</p>
      <p class="small"><strong>IndexNow:</strong> ${idx.ready?'configured':'not fully configured'}; automatic submission OFF. Submission remains only in the reviewed Merchant/Search control and still requires <code>SUBMIT INDEXNOW</code>.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn secondary" href="/admin/operations/#searchConsoleImportAdminMount">Open Search Console import</a><a class="btn secondary" href="/api/merchant-feed?format=json" target="_blank" rel="noopener">Preview Merchant facts</a></div></section>`;
      document.getElementById('buyerDiscoveryReload')?.addEventListener('click',load);
    }catch(e){mount.innerHTML=`<section class="card"><p class="small">${esc(e.message||'Buyer discovery measurement failed.')}</p></section>`;}
  }
  void load();
});
