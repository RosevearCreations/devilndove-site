// Release 467 Build 52 — read-only Content Studio render-readiness UI.
// Adds no render-job, provider, publication, R2, schema, or Production mutation capability.
(() => {
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
  const apiFetch = (...args) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(...args) : fetch(...args);

  function activeProjectId() {
    const active = document.querySelector('#contentAutomationStudioMount [data-open-project].is-active');
    return Number(active?.dataset?.openProject || 0);
  }

  function resultNode(card) {
    let node = card.querySelector('[data-render-readiness-result]');
    if (!node) {
      node = document.createElement('div');
      node.dataset.renderReadinessResult = '1';
      node.className = 'small';
      node.style.marginTop = '10px';
      const body = card.querySelector('.content-deliverable-body') || card;
      body.appendChild(node);
    }
    return node;
  }

  function renderReadiness(node, readiness) {
    const blockers = Array.isArray(readiness?.blockers) ? readiness.blockers : [];
    const warnings = Array.isArray(readiness?.warnings) ? readiness.warnings : [];
    if (readiness?.ready) {
      node.innerHTML = '<strong>Render readiness: PASS.</strong> This deliverable may be marked ready for render, but Build 52 still creates no render job and invokes no provider.';
      return;
    }
    node.innerHTML = `<strong>Render readiness: BLOCKED.</strong>${blockers.length ? `<ul>${blockers.map((item) => `<li>${esc(item.message || item.code)}</li>`).join('')}</ul>` : ''}${warnings.length ? `<div>${warnings.map((item) => esc(item.message || item.code)).join(' ')}</div>` : ''}`;
  }

  async function check(button) {
    const card = button.closest('[data-deliverable-card]');
    const deliverableId = Number(card?.dataset?.deliverableCard || 0);
    const projectId = activeProjectId();
    const node = resultNode(card || document.body);
    if (!projectId || !deliverableId) {
      node.textContent = 'Render readiness could not resolve the active Content Studio project and deliverable.';
      return;
    }
    button.disabled = true;
    node.textContent = 'Checking render readiness…';
    try {
      const response = await apiFetch(`/api/admin/content-render-readiness?content_project_id=${encodeURIComponent(projectId)}&content_project_deliverable_id=${encodeURIComponent(deliverableId)}`, { cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || `Render readiness failed (${response.status}).`);
      renderReadiness(node, data.readiness || {});
    } catch (error) {
      node.textContent = error?.message || 'Render readiness could not be checked.';
    } finally {
      button.disabled = false;
    }
  }

  function enhance() {
    document.querySelectorAll('#contentAutomationStudioMount [data-deliverable-card]').forEach((card) => {
      const actions = card.querySelector('.content-deliverable-actions');
      if (!actions || actions.querySelector('[data-check-render-readiness]')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn secondary';
      button.dataset.checkRenderReadiness = '1';
      button.textContent = 'Check render readiness';
      actions.appendChild(button);
    });
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-check-render-readiness]');
    if (!button) return;
    void check(button);
  });

  document.addEventListener('DOMContentLoaded', () => {
    const mount = document.getElementById('contentAutomationStudioMount');
    if (!mount) return;
    enhance();
    new MutationObserver(enhance).observe(mount, { childList: true, subtree: true });
  }, { once: true });
})();
