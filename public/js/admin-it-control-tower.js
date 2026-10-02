/* BUILD340_CURRENT_CLIENT: Release 467 Build 340 — Search Console Real Export & Fresh Discovery Intake V; verified Build 339 dev 71230f3cc4b6518f4f0e61068db2edd0fdf4db50; Production 8c7ff02b4748ebca9a0f5773ffe34589d5890305. */
/* BUILD339_CURRENT_CLIENT: Release 467 Build 339 — Grey Hair Source Review & Story-Plan Completion Continuity III; verified Build 338 dev eb674de5006a63404d2a8076bef2024ba47272b3; Production cfdc10632bd5fe605b7cf60eef7e664e35cd11fb. */
/* BUILD338_CURRENT_CLIENT: Release 467 Build 338 — 35th Promo Factual Evidence Completion Continuity III; verified Build 337 dev 8f5d038fa7c7d5b3213f6d64f51d659c3ce74994; Production cf588329be80a4cf463d0632845521f4e3685991. */
/* BUILD337_CURRENT_CLIENT: Release 467 Build 337 — Evidence Gap Execution Workbench & Input Completion Continuity II; verified Build 336 dev 537cc518573159ea2c511c32f01469bbd97ccf63; Production 1419a505747871a5703ad087134b3b7bebafd337. */
/* BUILD336_CURRENT_CLIENT: Release 467 Build 336 — Content Adoption & Discovery Outcomes Renewal VI; verified Build 335 dev bec1c4bf76cf69e6b42dc3768b1de22400e0b052; Production 8bda25fe29647f23a4a3b4bcb3f0ded515ae2d87. */
/* BUILD335_CURRENT_CLIENT: Release 467 Build 335 — Maker Story Advancement & Publication Readiness Continuity III; verified Build 334 dev e18b37a22fb5e4f0e58e8d5e240d922c499fabec; Production 2840cdc2ee09a2a585ec003e5f57bdc0c08cbc6c. */
/* BUILD334_CURRENT_CLIENT: Release 467 Build 334 — Search Console Real Export & Fresh Discovery Intake IV; verified Build 333 dev ed3a8674ec5fd0e4363043034d694fdbb0a6822a; Production 7b934186dcef69d76c9ad3dd6a25c4aed8ba4de4. */
/* BUILD333_CURRENT_CLIENT: Release 467 Build 333 — Grey Hair Source Review & Story-Plan Completion Continuity II; verified Build 332 dev d4fcede4adf76a511d754012042ba91a98693812; tree 4ff23c38bbe0acb7ce6ff6f9ad5ef964b329d229; Production 69fd16b6322e7cbd52c5341ef2b7e871529a65ee. */
/* BUILD332_CURRENT_CLIENT: Release 467 Build 333 — Grey Hair Source Review & Story-Plan Completion Continuity II; verified Build 331 dev d4fcede4adf76a511d754012042ba91a98693812; tree 4ff23c38bbe0acb7ce6ff6f9ad5ef964b329d229; Production 69fd16b6322e7cbd52c5341ef2b7e871529a65ee. */
/* BUILD331_CURRENT_CLIENT: Release 467 Build 333 — Grey Hair Source Review & Story-Plan Completion Continuity II; verified Build 330 dev d4fcede4adf76a511d754012042ba91a98693812; tree 4ff23c38bbe0acb7ce6ff6f9ad5ef964b329d229; Production 69fd16b6322e7cbd52c5341ef2b7e871529a65ee. */
/* BUILD330_CURRENT_CLIENT: Release 467 Build 333 — Grey Hair Source Review & Story-Plan Completion Continuity II; verified Build 329 dev d4fcede4adf76a511d754012042ba91a98693812; tree 4ff23c38bbe0acb7ce6ff6f9ad5ef964b329d229; Production 69fd16b6322e7cbd52c5341ef2b7e871529a65ee. */
/* BUILD329_CURRENT_CLIENT: Release 467 Build 333 — Grey Hair Source Review & Story-Plan Completion Continuity II; verified Build 328 dev d4fcede4adf76a511d754012042ba91a98693812; tree 4ff23c38bbe0acb7ce6ff6f9ad5ef964b329d229; Production 69fd16b6322e7cbd52c5341ef2b7e871529a65ee. */
/* BUILD328_CURRENT_PROVENANCE: 35th Promo Factual Evidence Completion Continuity II; verified Build 327 dev d4fcede4adf76a511d754012042ba91a98693812; tree 4ff23c38bbe0acb7ce6ff6f9ad5ef964b329d229; Production 69fd16b6322e7cbd52c5341ef2b7e871529a65ee; Pages 36858576609; Live 36858655776. */
// BUILD327_CURRENT_CLIENT_AUTHORITY: Release 467 Build 333 Grey Hair Source Review & Story-Plan Completion Continuity II.
<!-- CURRENT_BUILD_326_TRUTH: 35th Promo Factual Evidence Completion Continuity II; Build 325 is the exact verified Development/Production predecessor. -->
// Release 467 Build 333 — Grey Hair Source Review & Story-Plan Completion Continuity II.
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
    mount.innerHTML='<section class="card" style="margin-top:18px"><p class="small">Running Release 467 Build 340 diagnostics; immutable verified evidence is shown once above…</p></section>';
    try{
      const r=await apiFetch('/api/admin/it-operations-control-tower',{cache:'no-store'}),d=await r.json();
      if(!r.ok||!d.ok)throw new Error(d.error||`I.T. control tower failed (${r.status}).`);
      const v=d.release_authority?.verified_development||{},p=d.release_authority?.production||{},pack=d.closure_evidence_pack||{};
      mount.innerHTML=`<section class="card" style="margin-top:18px"><p class="eyebrow">Release 467 Build 340</p><h2>Search Console Real Export & Fresh Discovery Intake V</h2><p class="small">Current action only. Build 339 is the exact Development/Production GREEN predecessor. Build 340 keeps Search Console evidence operator-controlled and requires real-export confirmation before import.</p><p class="small"><strong>Build 340 scope:</strong> read-only real-export freshness and discovery intake; no synthetic search evidence, automatic import, automatic SEO apply or provider execution.</p><p class="small"><strong>Production GREEN authority:</strong> immutable verified evidence is shown once in the shared summary above.</p><p class="small"><strong>Evidence pack ID:</strong> <code>${esc(pack.evidence_id)}</code></p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="itRefresh">Refresh diagnostics</button><button class="btn secondary" id="itVerify">Verify immutable closure artifacts</button><button class="btn secondary" id="itExportMd">Export Markdown</button><button class="btn secondary" id="itExportJson">Export JSON</button><a class="btn secondary" href="/admin/reliability/">Reliability</a><a class="btn secondary" href="/admin/deployment-preflight/">Deployment Preflight</a></div><div id="itVerifyResult" class="small" aria-live="polite" style="margin-top:10px">Cross-artifact verification has not been run in this browser session.</div></section><section class="card" style="margin-top:16px"><h2>External acceptance policy</h2><p class="small">CAIP private-media acceptance is 3/3 ACCEPTED; external provider lanes remain separately governed.</p></section><section class="card" style="margin-top:16px"><h2>Safety boundary</h2><p class="small">Build 326 CI is read-only. Evidence approval and story review remain explicit operator actions in their existing workspaces; Build 325 creates no Maker Story profile, exposes no raw private URLs, infers no media rights, and keeps provider execution plus Production D1 contact closed.</p></section>`;
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
