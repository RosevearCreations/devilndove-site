// Release 467 Build 242 — Release, Diagnostics & Evidence Streamlining.
// One immutable verified-evidence summary + one current-action summary for operator-facing Admin surfaces.
(() => {
  'use strict';
  const EVIDENCE=Object.freeze({
    verified:{release:467,build:242,title:'Release, Diagnostics & Evidence Streamlining',
      dev_sha:'5977a1aa9674eb378d5aede0b31648a73ac770c6',tree_sha:'3ea103b093c4dcbf1670346dcce0ec6acf214470',
      system_gate_run:35883357799,current_application_quality_run:35883358653,it_admin_runtime_proof_run:35883357777,
      branch_hygiene_run:35883357974,dedicated_gate_run:35883357988},
    production:{main_sha:'ae9ca2b48700f4b48e6eb7e6bb465f0472d5e41f',tree_sha:'3ea103b093c4dcbf1670346dcce0ec6acf214470',
      production_pages_deploy_run:35883719199,production_live_resource_integrity_run:35883846712,
      products_browser_proof_run:35883846744,products_route_proof_run:35883846755,build_specific_proof_run:35883719159,
      state:'PRODUCTION_GREEN'},
    current:{release:467,build:243,title:'Session Architecture Hardening',
      state:'DEVELOPMENT_CANDIDATE',next_action:'Prove the exact final Development head GREEN before any Production promotion.'}
  });
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(el){
    if(el.dataset.ddReleaseEvidenceRendered==='242') return;
    const v=EVIDENCE.verified,p=EVIDENCE.production,c=EVIDENCE.current;
    el.dataset.ddReleaseEvidenceRendered='242';
    el.innerHTML=`
      <div class="card" style="margin-top:18px">
        <p class="eyebrow">Verified evidence — immutable</p>
        <p class="small"><strong>Build ${esc(v.build)} ${esc(v.title)}</strong> • Development <code>${esc(v.dev_sha)}</code> • tree <code>${esc(v.tree_sha)}</code></p>
        <p class="small">System <code>${esc(v.system_gate_run)}</code> • Quality <code>${esc(v.current_application_quality_run)}</code> • I.T. <code>${esc(v.it_admin_runtime_proof_run)}</code> • Hygiene <code>${esc(v.branch_hygiene_run)}</code> • dedicated <code>${esc(v.dedicated_gate_run)}</code></p>
        <p class="small">Production <code>${esc(p.main_sha)}</code> • Pages <code>${esc(p.production_pages_deploy_run)}</code> • Live Resources <code>${esc(p.production_live_resource_integrity_run)}</code> • Product Browser <code>${esc(p.products_browser_proof_run)}</code> • Product Route <code>${esc(p.products_route_proof_run)}</code></p>
      </div>
      <div class="card" style="margin-top:12px">
        <p class="eyebrow">Current action</p>
        <p class="small"><strong>Build ${esc(c.build)} — ${esc(c.title)}</strong> • ${esc(c.state)}</p>
        <p class="small">${esc(c.next_action)} Historical proof above is not rewritten by current action.</p>
      </div>`;
  }
  function run(){document.querySelectorAll('[data-dd-release-evidence-v242]').forEach(render);}
  window.DDReleaseEvidenceV242=EVIDENCE;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();
  document.addEventListener('dd:admin-module-hub-ready',run,{once:true});
})();