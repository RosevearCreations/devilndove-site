// Release 467 Build 242 — Release, Diagnostics & Evidence Streamlining.
// One immutable verified-evidence summary + one current-action summary for operator-facing Admin surfaces.
(() => {
  'use strict';
  const EVIDENCE=Object.freeze({
    verified:{release:467,build:246,title:'Abuse Resistance, Session Control & Security Operations',
      dev_sha:'cfd9af8777699b8d7902eef0585693b2152e60c8',tree_sha:'d4a599779d835a4900560fd4970d475a089c983a',
      system_gate_run:35934272420,current_application_quality_run:35934272137,it_admin_runtime_proof_run:35934272393,
      branch_hygiene_run:35934271806,dedicated_gate_run:35934272301},
    production:{main_sha:'e21f7b9bf60ab8b35ecd3724cee988f2beeebb32',tree_sha:'d4a599779d835a4900560fd4970d475a089c983a',
      production_pages_deploy_run:35934550990,production_live_resource_integrity_run:35934626619,
      products_browser_proof_run:35934626644,products_route_proof_run:35934626617,build_specific_proof_run:35934551031,
      state:'PRODUCTION_GREEN'},
    current:{release:467,build:247,title:'Non-Product Visual Coverage & Media Placement Closure',
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