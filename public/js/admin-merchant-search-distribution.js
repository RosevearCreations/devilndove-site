// Release 467 Build 298 — Merchant/Search distribution diagnostics in the existing SEO admin workspace.
document.addEventListener('DOMContentLoaded',()=>{
  const mount=document.getElementById('merchantSearchDistributionMount');if(!mount||!window.DDAuth)return;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function read(res){const d=await res.json().catch(()=>null);if(!res.ok||!d?.ok)throw new Error(d?.error||'Merchant/Search diagnostics failed.');return d;}
  function blockers(rows){return (rows||[]).slice(0,12).map((r)=>`<li><strong>${esc(r.title||('Product '+r.product_id))}</strong> — ${esc((r.blockers||[]).join(', '))}</li>`).join('')||'<li>No blocked reviewed Products in the current diagnostic sample.</li>';}
  async function load(){
    mount.innerHTML='<section class="card"><p class="small">Loading Merchant/Search distribution diagnostics…</p></section>';
    try{
      const d=await read(await window.DDAuth.apiFetch('/api/admin/merchant-search-distribution'));
      const m=d.merchant||{},s=m.summary||{},cfg=m.configuration||{},idx=d.indexnow||{},g=d.search_console||{};
      mount.innerHTML=`<section class="card"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><p class="eyebrow">Build 298 • reviewed distribution</p><h2 style="margin-top:0">Merchant & search distribution</h2><p class="small">Feeds and diagnostics are read-only. IndexNow is never called automatically; submission requires an authenticated administrator and the exact confirmation phrase.</p></div><button class="btn" id="merchantSearchReload" type="button">Reload</button></div>
      <div class="grid cols-3" style="gap:12px"><div><strong>${esc(s.eligible||0)}</strong><div class="small">Merchant-eligible reviewed Products</div></div><div><strong>${esc(s.blocked||0)}</strong><div class="small">Blocked from feed</div></div><div><strong>${esc(idx.eligible_url_count||0)}</strong><div class="small">IndexNow-eligible Product/story URLs</div></div></div>
      <p class="small"><strong>Canada shipping:</strong> ${cfg.shipping_confirmed?'confirmed':'needs Merchant Center/account review'} • <strong>Returns:</strong> ${cfg.returns_confirmed?'confirmed':'needs Merchant Center/account review'} • <strong>Search Console imported rows:</strong> ${esc(g.row_count||0)} • impressions ${esc(g.impressions||0)} • clicks ${esc(g.clicks||0)}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="/api/merchant-feed" target="_blank" rel="noopener">Open Merchant XML feed</a><a class="btn secondary" href="/api/merchant-feed?format=tsv" target="_blank" rel="noopener">Open TSV export</a><button class="btn" id="indexNowSubmit" type="button" ${idx.ready?'':'disabled'}>Submit eligible URLs to IndexNow</button></div>
      <p class="small">IndexNow key: ${idx.key_configured?'configured':'missing'} • key location: ${idx.key_location_configured?'configured':'missing'} • automatic submission: OFF.</p>
      <details><summary>Merchant blockers</summary><ul class="small">${blockers(m.blocked_preview)}</ul></details><div id="merchantSearchStatus" class="small" style="margin-top:10px"></div></section>`;
      document.getElementById('merchantSearchReload')?.addEventListener('click',load);
      document.getElementById('indexNowSubmit')?.addEventListener('click',async()=>{
        const phrase=prompt('This contacts the configured IndexNow provider. Type SUBMIT INDEXNOW to continue.');
        if(phrase!=='SUBMIT INDEXNOW')return;
        const status=document.getElementById('merchantSearchStatus');if(status)status.textContent='Submitting reviewed public URLs…';
        try{const result=await read(await window.DDAuth.apiFetch('/api/admin/merchant-search-distribution',{method:'POST',body:JSON.stringify({action:'submit_indexnow',confirm:phrase})}));if(status)status.textContent=`${result.message||'Submitted.'} URLs: ${result.url_count||0}; HTTP ${result.http_status||''}.`;}
        catch(error){if(status)status.textContent=error.message||'IndexNow submission failed.';}
      });
    }catch(error){mount.innerHTML=`<section class="card"><p class="small">${esc(error.message||'Merchant/Search diagnostics failed.')}</p></section>`;}
  }
  load();
});
