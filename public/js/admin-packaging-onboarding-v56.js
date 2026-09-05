// Build 56 — first-time-user walkthrough and resumable Packaging Studio guidance.
(function () {
  'use strict';

  const STORAGE_PREFIX = 'dd_packaging_walkthrough_v56:';
  const MODE_KEY = 'dd_packaging_walkthrough_mode_v56';
  const steps = [
    { id: 'project', title: '1. Choose or create the packaging project', level: 'Required', keywords: ['Packaging projects', 'Create labeling / packaging project', 'Linked product'], help: 'Start with the finished Product record whenever one exists. One packaging project should represent one label/package job authority.' },
    { id: 'format', title: '2. Confirm package type and physical size', level: 'Required', keywords: ['Package type', 'Dimensions', 'Width', 'Height', 'Diameter'], help: 'Choose the real physical format and enter measured dimensions. Do not infer production size from a reference image.' },
    { id: 'template', title: '3. Select the correct reusable template/layout', level: 'Required', keywords: ['Template', 'Layouts', 'renderer'], help: 'Pick the matching template family before editing content so the correct renderer, safe area and physical geometry govern the job.' },
    { id: 'materials', title: '4. Attach purchased materials/source evidence', level: 'Conditional', keywords: ['Material Library', 'source material', 'Supplier ingredient'], help: 'For soap, candles, bath/body and other formula-based products, attach the actual purchased base, fragrance, colourant and additive sources.' },
    { id: 'ingredients', title: '5. Review ingredients / INCI / bilingual declarations', level: 'Conditional', keywords: ['INGREDIENTS', 'INGRÉDIENTS', 'INCI', 'ingredients'], help: 'Use supplier-verified ingredient/INCI facts. French wording and regulated declarations remain review-required; never invent missing facts.' },
    { id: 'artwork', title: '6. Choose artwork and brand presentation', level: 'Recommended', keywords: ['Artwork', 'Media Studio', 'rose', 'colour'], help: 'Choose managed artwork and the correct brand/accent direction. Artwork never supplies legal, ingredient, weight or formula facts.' },
    { id: 'claims', title: '7. Review product name, claims and customer-facing text', level: 'Required', keywords: ['Claims', 'Product name', 'Care', 'Benefits', 'bilingual'], help: 'Confirm customer-visible wording, claims and required bilingual text against source evidence. Marketing copy remains review-first.' },
    { id: 'preview', title: '8. Inspect the editable preview and text fit', level: 'Required', keywords: ['Preview', 'SVG', 'overflow', 'safe area'], help: 'Inspect the real SVG/layout preview. Resolve clipping, overflow, unsafe margins and wrong artwork before creating print evidence.' },
    { id: 'bom', title: '9. Record packaging components, inventory links and cost', level: 'Required', keywords: ['components', 'bill of materials', 'BOM', 'cost', 'Inventory'], help: 'Record the physical packaging pieces, quantities, waste, inventory links and unit cost so the label job remains tied to operations.' },
    { id: 'compliance', title: '10. Complete review/readiness checks', level: 'Required', keywords: ['Review', 'prepress', 'readiness', 'compliance', 'blocker'], help: 'Resolve deterministic blockers and perform the required human/regulatory review. The Studio assists review; it does not provide legal approval.' },
    { id: 'proof', title: '11. Record physical print / wrap / laser proof', level: 'Required', keywords: ['Print test', 'physical', 'proof', 'measurement'], help: 'Print at true size or test the actual physical blank/material. Record measured evidence; a browser preview alone is not physical acceptance.' },
    { id: 'approval', title: '12. Save version, approve and export', level: 'Required', keywords: ['Versions', 'Approve', 'Export', 'checksum'], help: 'Save the reviewed version, retain approval/evidence and export only after the required proof gates are satisfied.' },
  ];

  const text = (value) => String(value == null ? '' : value).trim();
  const esc = (value) => text(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  function projectKey() {
    const urlId = Number(new URLSearchParams(location.search).get('project_id') || 0);
    if (urlId) return String(urlId);
    const candidates = [
      document.querySelector('[data-packaging-project-id]')?.dataset?.packagingProjectId,
      document.querySelector('[data-project-id]')?.dataset?.projectId,
      document.querySelector('[name="packaging_project_id"]')?.value,
      document.querySelector('[name="project_id"]')?.value,
    ].map(text).filter(Boolean);
    return candidates[0] || 'general';
  }

  function storageKey() { return `${STORAGE_PREFIX}${projectKey()}`; }
  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey()) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch { return {}; }
  }
  function saveState(value) { try { localStorage.setItem(storageKey(), JSON.stringify(value || {})); } catch {} }
  function mode() { try { return localStorage.getItem(MODE_KEY) || 'guided'; } catch { return 'guided'; } }
  function setMode(value) { try { localStorage.setItem(MODE_KEY, value); } catch {} }

  function isProjectOpen() {
    const main = document.getElementById('packagingStudioMain');
    if (!main) return false;
    if (main.querySelector('form,[data-packaging-project-id],[data-project-id]')) return true;
    return !main.querySelector('.packaging-studio-welcome') && text(main.textContent).length > 120;
  }

  function findTarget(keywords) {
    const selectors = 'h2,h3,h4,summary,legend,label,button,a,strong,[data-section],[data-tab]';
    const nodes = Array.from(document.querySelectorAll(selectors));
    const lowered = keywords.map((item) => item.toLowerCase());
    return nodes.find((node) => lowered.some((word) => text(node.textContent).toLowerCase().includes(word))) || null;
  }

  function progressState() {
    const saved = loadState();
    const done = saved.done && typeof saved.done === 'object' ? saved.done : {};
    if (isProjectOpen()) done.project = true;
    return { ...saved, done };
  }

  function currentStepIndex(state) {
    const index = steps.findIndex((step) => !state.done?.[step.id]);
    return index < 0 ? steps.length - 1 : index;
  }

  function mount() {
    let section = document.getElementById('packagingWalkthroughV56');
    if (section) return section;
    const hero = document.querySelector('.packaging-studio-hero') || document.querySelector('.hero');
    if (!hero?.parentNode) return null;
    section = document.createElement('section');
    section.id = 'packagingWalkthroughV56';
    section.className = 'card';
    section.style.marginTop = '18px';
    hero.insertAdjacentElement('afterend', section);
    section.addEventListener('click', onClick);
    return section;
  }

  function levelBadge(level) {
    const description = level === 'Required' ? 'required before production approval' : level === 'Conditional' ? 'required when this product/package type uses it' : 'recommended quality step';
    return `<span class="small" title="${esc(description)}" style="border:1px solid var(--border);border-radius:999px;padding:2px 7px">${esc(level)}</span>`;
  }

  function render() {
    const section = mount();
    if (!section) return;
    const currentMode = mode();
    const state = progressState();
    saveState(state);
    const doneCount = steps.filter((step) => state.done?.[step.id]).length;
    const activeIndex = currentStepIndex(state);

    if (currentMode === 'advanced') {
      section.innerHTML = `<div class="section-heading-row"><div><p class="eyebrow">Build 56 • Packaging guidance</p><h2 style="margin:0">Advanced mode</h2><p class="small" style="margin:6px 0 0">Guided walkthrough is hidden. Existing Packaging Studio controls and approval gates are unchanged.</p></div><button class="btn" type="button" data-v56-packaging-action="guided">Turn on guided mode</button></div>`;
      return;
    }

    section.innerHTML = `
      <div class="section-heading-row">
        <div>
          <p class="eyebrow">Build 56 • First-time-user walkthrough</p>
          <h2 style="margin:0">Label & packaging guided mode</h2>
          <p class="small" style="margin:6px 0 0">Progress is saved in this browser and resumes when you return. This guide explains the order of work; it does not bypass existing validation, print-proof or approval gates.</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-v56-packaging-action="advanced">Advanced mode</button><button class="btn" type="button" data-v56-packaging-action="reset">Reset walkthrough</button></div>
      </div>
      <div style="margin-top:12px"><strong>${doneCount}/${steps.length} steps marked complete</strong><div style="height:8px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:6px"><span style="display:block;height:100%;width:${Math.round(doneCount / steps.length * 100)}%;background:currentColor;opacity:.45"></span></div></div>
      <div style="display:grid;gap:8px;margin-top:12px">
        ${steps.map((step, index) => {
          const done = Boolean(state.done?.[step.id]);
          const active = index === activeIndex && !done;
          return `<article style="border:1px solid var(--border);border-radius:12px;padding:10px;${active ? 'outline:2px solid rgba(229,179,65,.28);' : ''}">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap"><div><strong>${done ? '✓ ' : ''}${esc(step.title)}</strong> ${levelBadge(step.level)}</div><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" type="button" data-v56-packaging-action="show" data-step="${esc(step.id)}">Show me</button><button class="btn" type="button" data-v56-packaging-action="toggle" data-step="${esc(step.id)}">${done ? 'Mark not done' : 'Mark done'}</button></div></div>
            <details ${active ? 'open' : ''} style="margin-top:6px"><summary class="small"><strong>What to do / why it may be blocked</strong></summary><p class="small">${esc(step.help)}</p></details>
          </article>`;
        }).join('')}
      </div>
      <details style="margin-top:12px"><summary><strong>Common blocker explanations</strong></summary><ul class="small">
        <li><strong>Missing bilingual/INCI content:</strong> supplier or reviewed language evidence is incomplete; do not invent it.</li>
        <li><strong>Text overflow:</strong> the complete declaration does not fit the tested safe region; shorten only optional copy or choose an approved extended-label method.</li>
        <li><strong>Wrong/missing dimensions:</strong> measure the real package, lid, card or blank before production approval.</li>
        <li><strong>Missing physical proof:</strong> SVG/browser preview is not a true-size print, wrap or laser acceptance test.</li>
        <li><strong>Unverified claim or net quantity:</strong> customer-facing facts require source/review evidence before final approval.</li>
        <li><strong>Missing packaging component/BOM:</strong> record the physical packaging pieces, quantity, inventory linkage and cost before calling the job operationally complete.</li>
      </ul></details>`;
  }

  function showStep(stepId) {
    const step = steps.find((item) => item.id === stepId);
    if (!step) return;
    if (step.id === 'project' && !isProjectOpen()) {
      const button = document.getElementById('newPackagingProject');
      if (button) { button.scrollIntoView({ behavior: 'smooth', block: 'center' }); button.focus({ preventScroll: true }); return; }
    }
    const target = findTarget(step.keywords);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const box = target.closest('section,.card,fieldset,details') || target;
      box.style.outline = '2px solid rgba(229,179,65,.45)';
      window.setTimeout(() => { box.style.outline = ''; }, 4500);
      if (target.tagName === 'DETAILS') target.open = true;
      target.focus?.({ preventScroll: true });
    } else {
      const section = document.getElementById('packagingWalkthroughV56');
      const note = document.createElement('p');
      note.className = 'small';
      note.textContent = 'That control is not visible yet. Finish the earlier required steps or open a packaging project, then use “Show me” again.';
      section?.appendChild(note);
      window.setTimeout(() => note.remove(), 5000);
    }
  }

  function onClick(event) {
    const button = event.target.closest('[data-v56-packaging-action]');
    if (!button) return;
    const action = button.dataset.v56PackagingAction;
    if (action === 'advanced') { setMode('advanced'); render(); return; }
    if (action === 'guided') { setMode('guided'); render(); return; }
    if (action === 'reset') { try { localStorage.removeItem(storageKey()); } catch {} render(); return; }
    const stepId = button.dataset.step;
    if (action === 'show') { showStep(stepId); return; }
    if (action === 'toggle') {
      const state = progressState();
      state.done = state.done || {};
      state.done[stepId] = !state.done[stepId];
      saveState(state);
      render();
    }
  }

  function init() {
    mount(); render();
    const main = document.getElementById('packagingStudioMain');
    if (main) {
      const observer = new MutationObserver(() => {
        const before = storageKey();
        const state = progressState();
        saveState(state);
        render();
        void before;
      });
      observer.observe(main, { childList: true, subtree: true });
    }
    window.addEventListener('popstate', render);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
