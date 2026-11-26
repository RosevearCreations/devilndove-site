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
      <p class="small"><strong>Website Canada shipping:</strong> ${cfg.shipping_confirmed?'$15 CAD checkout-matched':'HOLD — rate mismatch'} • <strong>Website returns:</strong> ${cfg.returns_confirmed?'published policy, NOT Google-certified':'HOLD'} • <strong>Google account policy:</strong> unverified until independent provider readback • <strong>Search Console imported rows:</strong> ${esc(g.row_count||0)} • impressions ${esc(g.impressions||0)} • clicks ${esc(g.clicks||0)}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="/api/merchant-feed" target="_blank" rel="noopener">Open Merchant XML feed</a><a class="btn secondary" href="/api/merchant-feed?format=tsv" target="_blank" rel="noopener">Open TSV export</a><button class="btn" id="indexNowSubmit" type="button" ${idx.ready?'':'disabled'}>Submit eligible URLs to IndexNow</button></div>
      <p class="small">IndexNow key: ${idx.key_configured?'configured':'missing'} • key location: ${idx.key_location_configured?'configured':'missing'} • automatic submission: OFF.</p>
      <details><summary>Merchant blockers</summary><ul class="small">${blockers(m.blocked_preview)}</ul></details>
      <section class="card" aria-labelledby="merchant761Title" style="margin-top:14px">
       <h3 id="merchant761Title">Build 762 — Original provider enrollment, guest payment witness &amp; Google scorecard</h3>
       <p class="small">Explicit Admin-only live read. Reads Google Merchant API v1 only if original OAuth and account are configured. Probes a bounded sample of actual public product-image bytes, and checks production provider execution authority. No login, payment, refund, data write or fabricated Google score.</p>
       <button class="btn" id="merchant761Run" type="button">Verify original Merchant, images &amp; checkout now</button>
       <pre id="merchant761Status" role="status" aria-live="polite" style="white-space:pre-wrap;overflow-wrap:anywhere;margin-top:12px">HOLD — no original live verification run yet.</pre>
       <p class="small">References: <a href="/shipping/">shipping</a> · <a href="/returns/">returns</a> · <a href="/api/merchant-feed?format=json" target="_blank" rel="noopener">original feed source</a>. Google account quality score and genuine PayPal guest payment require independent source evidence.</p>
      </section>
      <div id="merchantSearchStatus" class="small" style="margin-top:10px"></div></section>`;
      document.getElementById('merchant761Run')?.addEventListener('click',async()=>{
        const button=document.getElementById('merchant761Run'),out=document.getElementById('merchant761Status');
        if(!button||!out||button.disabled)return;
        button.disabled=true;out.textContent='HOLD — verifying original Merchant account, image bytes and real payment authority...';
        try{
          const d=await read(await window.DDAuth.apiFetch('/api/admin/merchant-original-evidence-761',{method:'GET',cache:'no-store'}));
          const account=d.account||{},m=d.media||{},payment=d.payment||{};
          const lines=[
            'Google Merchant account: '+String(account.status||'HOLD'),
            'Provider original policy read performed: '+(account.api_read_performed?'YES':'NO'),
            'Shipping: '+String(account.shipping?.status||'HOLD')+' — '+String(account.shipping?.reason||''),
            'Returns: '+String(account.returns?.status||'HOLD')+' — '+String(account.returns?.reason||''),
            'Image byte sampling: '+String(m.status||'HOLD')+' — '+Number(m.checked_product_count||0)+' products sampled (NOT whole catalog)',
            ...((m.products||[]).slice(0,4).map(p=>
              'Product '+Number(p.product_id||0)+' '+String(p.title||'')+': '+
              (p.images||[]).map(im=>String(im.position||'')+' '+String(im.status||'HOLD')+
                (im.width?' '+Number(im.width)+'x'+Number(im.height):'')).join('; '))),
            'PayPal wallet: '+String(payment.status||'HOLD')+' — '+String(payment.reason||''),
            'Devil n Dove live Stripe enrollment: '+String(d.provider_enrollment_762?.stripe?.status||'HOLD')+
              ' — '+String(d.provider_enrollment_762?.stripe?.reason||''),
            'Original guest signed-webhook + settled-order witness: '+String(d.provider_enrollment_762?.guest_witness?.status||'HOLD')+
              ' — '+String(d.provider_enrollment_762?.guest_witness?.reason||''),
            'Production live-payment activation: OFF until account owner and genuine provider evidence',
            'Google Store Quality / guest eWallet scorecard: NOT independently accepted',
            'Wallet labels are NOT real payment proof; Google scorecard verification: NO',
            'Source review only. No Merchant account or payment write was performed.'
          ];
          out.textContent=lines.join('\n');
        }catch(e){out.textContent='HOLD — authenticated source verification failed: '+String(e?.message||e).slice(0,180);}
        finally{button.disabled=false;}
      });
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
