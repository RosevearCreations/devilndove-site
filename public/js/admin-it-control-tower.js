/* BUILD331_CURRENT_CLIENT: Release 467 Build 331 — Evidence Gap Execution Workbench & Input Completion Continuity; verified Build 330 dev 9d0340a3038f05a0a80d25288ffedc316499438f; tree 585bb8a35b46f20278b64e97aa314ee11a9f4ccc; Production 88b5113016acef9a0e7cc7cb7ef087b46ae01924. */
/* BUILD330_CURRENT_CLIENT: Release 467 Build 331 — Evidence Gap Execution Workbench & Input Completion Continuity; verified Build 329 dev 9d0340a3038f05a0a80d25288ffedc316499438f; tree 585bb8a35b46f20278b64e97aa314ee11a9f4ccc; Production 88b5113016acef9a0e7cc7cb7ef087b46ae01924. */
/* BUILD329_CURRENT_CLIENT: Release 467 Build 331 — Evidence Gap Execution Workbench & Input Completion Continuity; verified Build 328 dev 9d0340a3038f05a0a80d25288ffedc316499438f; tree 585bb8a35b46f20278b64e97aa314ee11a9f4ccc; Production 88b5113016acef9a0e7cc7cb7ef087b46ae01924. */
/* BUILD328_CURRENT_PROVENANCE: Content Adoption & Discovery Outcomes Renewal V; verified Build 327 dev 9d0340a3038f05a0a80d25288ffedc316499438f; tree 585bb8a35b46f20278b64e97aa314ee11a9f4ccc; Production 88b5113016acef9a0e7cc7cb7ef087b46ae01924; Pages 36837991058; Live 36838082462. */
// BUILD327_CURRENT_CLIENT_AUTHORITY: Release 467 Build 331 Evidence Gap Execution Workbench & Input Completion Continuity.
<!-- CURRENT_BUILD_326_TRUTH: Content Adoption & Discovery Outcomes Renewal V; Build 325 is the exact verified Development/Production predecessor. -->
// Release 467 Build 331 — Evidence Gap Execution Workbench & Input Completion Continuity.
// Release 467 Build 238 — current I.T. authority renderer over exact Build 233 GREEN restart boundary.
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
    a.href=url;a.download=`devilndove-release467-build320-${format==='markdown'?'closure-evidence.md':format+'.json'}`;
    document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  async function load(){
    mount.innerHTML='<section class="card" style="margin-top:18px"><p class="small">Running Release 467 Build 331 diagnostics; immutable verified evidence is shown once above…</p></section>';
    try{
      const r=await apiFetch('/api/admin/it-operations-control-tower',{cache:'no-store'}),d=await r.json();
      if(!r.ok||!d.ok)throw new Error(d.error||`I.T. control tower failed (${r.status}).`);
      const v=d.release_authority?.verified_development||{},p=d.release_authority?.production||{},pack=d.closure_evidence_pack||{};
      mount.innerHTML=`<section class="card" style="margin-top:18px"><p class="eyebrow">Release 467 Build 331</p><h2>Content Adoption & Discovery Outcomes Renewal V</h2><p class="small">Current action only. Build 325 is the exact Development/Production GREEN predecessor. Build 326 keeps Search Console evidence operator-controlled and requires real-export confirmation before import.</p><p class="small"><strong>Build 326 scope:</strong> read-only readiness over existing CAIP evidence, sync and story-planning authorities; no automatic evidence approval, Maker Story profile creation, media-rights inference or publication.</p><p class="small"><strong>Production GREEN authority:</strong> immutable verified evidence is shown once in the shared summary above.</p><p class="small"><strong>Evidence pack ID:</strong> <code>${esc(pack.evidence_id)}</code></p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="itRefresh">Refresh diagnostics</button><button class="btn secondary" id="itVerify">Verify immutable closure artifacts</button><button class="btn secondary" id="itExportMd">Export Markdown</button><button class="btn secondary" id="itExportJson">Export JSON</button><a class="btn secondary" href="/admin/reliability/">Reliability</a><a class="btn secondary" href="/admin/deployment-preflight/">Deployment Preflight</a></div><div id="itVerifyResult" class="small" aria-live="polite" style="margin-top:10px">Cross-artifact verification has not been run in this browser session.</div></section><section class="card" style="margin-top:16px"><h2>External acceptance policy</h2><p class="small">CAIP private-media acceptance is 3/3 ACCEPTED; external provider lanes remain separately governed.</p></section><section class="card" style="margin-top:16px"><h2>Safety boundary</h2><p class="small">Build 326 CI is read-only. Evidence approval and story review remain explicit operator actions in their existing workspaces; Build 325 creates no Maker Story profile, exposes no raw private URLs, infers no media rights, and keeps provider execution plus Production D1 contact closed.</p></section>`;
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
