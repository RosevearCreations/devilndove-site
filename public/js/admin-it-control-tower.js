// Release 467 Build 236 — current I.T. authority renderer over exact Build 233 GREEN restart boundary.
document.addEventListener('DOMContentLoaded',()=>{
  const mount=document.getElementById('itControlTowerMount'); if(!mount)return;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
  const apiFetch=(...a)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(...a):fetch(...a);
  function stableJson(value){if(Array.isArray(value))return`[${value.map(stableJson).join(',')}]`;if(value&&typeof value==='object'){const keys=Object.keys(value).sort();return`{${keys.map((k)=>`${JSON.stringify(k)}:${stableJson(value[k])}`).join(',')}}`;}return JSON.stringify(value);}
  async function sha256Hex(text){const bytes=new TextEncoder().encode(text),digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),(b)=>b.toString(16).padStart(2,'0')).join('');}
  async function verifyArtifacts(){
    const [c,m]=await Promise.all([
      apiFetch('/api/admin/it-operations-control-tower?format=closure-json',{cache:'no-store'}),
      apiFetch('/api/admin/it-operations-control-tower?format=verification-manifest',{cache:'no-store'})
    ]);
    const closure=await c.json(),manifest=await m.json(),pack=closure.closure_evidence_pack||{};
    const payload=((({evidence_id,integrity,...rest})=>rest))(pack),canonical=stableJson(manifest.canonical_payload),computed=await sha256Hex(canonical);
    return Boolean(pack.evidence_id&&pack.evidence_id===manifest.evidence_id&&stableJson(payload)===canonical&&computed===String(manifest.verification?.digest_sha256||'').toLowerCase());
  }
  async function exportPack(format){
    const r=await apiFetch(`/api/admin/it-operations-control-tower?format=${format}`,{cache:'no-store'});
    if(!r.ok)throw new Error(`Export failed (${r.status}).`);
    const content=await r.text(),blob=new Blob([content]),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`devilndove-release467-build236-${format==='markdown'?'closure-evidence.md':format+'.json'}`;
    document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  async function load(){
    mount.innerHTML='<section class="card" style="margin-top:18px"><p class="small">Running Release 467 Build 236 I.T. authority diagnostics over exact Build 233 GREEN…</p></section>';
    try{
      const r=await apiFetch('/api/admin/it-operations-control-tower',{cache:'no-store'}),d=await r.json();
      if(!r.ok||!d.ok)throw new Error(d.error||`I.T. control tower failed (${r.status}).`);
      const v=d.release_authority?.verified_development||{},p=d.release_authority?.production||{},pack=d.closure_evidence_pack||{};
      mount.innerHTML=`<section class="card" style="margin-top:18px"><p class="eyebrow">Release 467 Build 236</p><h2>Save Confidence, Unsaved-Work Protection & Safe Batch Review</h2><p class="small">Current read-only I.T. authority. Build 235 is the exact verified Development and Production baseline. Build 236 standardizes save status, warns on unsaved work, and adds review-only batch summaries without hidden mutation.</p><p class="small"><strong>Verified Development:</strong> <code>${esc(v.dev_sha)}</code> / <code>${esc(v.tree_sha)}</code></p><p class="small"><strong>Production GREEN authority:</strong> Build ${esc(p.build)} • Pages ${esc(p.production_pages_deploy_run)} • Live Resources ${esc(p.production_live_resource_integrity_run)} • Product Browser ${esc(p.products_browser_proof_run)} • Remote D1 ${esc(p.remote_d1_queries)}</p><p class="small"><strong>Active Build 236 acceptance:</strong> save/recovery remains review-first over existing authorities with no automatic retry or batch mutation. Production promotion remains closed until the exact final Build 236 dev head proves GREEN.</p><p class="small"><strong>Evidence ID:</strong> <code>${esc(pack.evidence_id)}</code></p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="itRefresh">Refresh diagnostics</button><button class="btn secondary" id="itVerify">Verify closure artifacts</button><button class="btn secondary" id="itExportMd">Export Markdown</button><button class="btn secondary" id="itExportJson">Export JSON</button><a class="btn secondary" href="/admin/reliability/">Reliability</a><a class="btn secondary" href="/admin/deployment-preflight/">Deployment Preflight</a></div><div id="itVerifyResult" class="small" aria-live="polite" style="margin-top:10px">Cross-artifact verification has not been run in this browser session.</div></section><section class="card" style="margin-top:16px"><h2>External acceptance policy</h2><p class="small">Stripe Development, PayPal sandbox and Social/OAuth remain HOLD_EXTERNAL; CAIP private media remains EVIDENCE_DEPENDENT. Cloudflare Access remains externally governed.</p></section><section class="card" style="margin-top:16px"><h2>Safety boundary</h2><p class="small">Canonical migrations advance through data-only 0023. Build 236 adds no schema change, automatic retry, batch mutation, Product publication, Inventory movement, Finance posting, R2 mutation, provider action or publication; those actions remain with their existing authorities.</p>${(d.truth_notes||[]).map((x)=>`<p class="small">• ${esc(x)}</p>`).join('')}</section>`;
      document.getElementById('itRefresh')?.addEventListener('click',load);
      document.getElementById('itVerify')?.addEventListener('click',async()=>{const out=document.getElementById('itVerifyResult');try{out.textContent=(await verifyArtifacts())?'VERIFIED — closure JSON and verification manifest agree.':'MISMATCH — treat closure evidence as invalid.';}catch(e){out.textContent=`UNAVAILABLE — ${e.message||e}`;}});
      document.getElementById('itExportMd')?.addEventListener('click',()=>exportPack('markdown'));
      document.getElementById('itExportJson')?.addEventListener('click',()=>exportPack('closure-json'));
    }catch(e){
      mount.innerHTML=`<section class="card" style="margin-top:18px"><h2>I.T. authority diagnostics unavailable</h2><p class="small">${esc(e.message||e)}</p><button class="btn" id="itRetry">Retry</button></section>`;
      document.getElementById('itRetry')?.addEventListener('click',load);
    }
  }
  void load();
});
