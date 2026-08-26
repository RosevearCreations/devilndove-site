// Devil n Dove Build 439 — CAIP evidence title UX guard.
// Auto-drafts a neutral editable title from source filename + category + captured time.
// No network calls, no polling, no provider execution, no source-media mutation.
(() => {
  'use strict';

  const ROOT_ID = 'caipEvidenceReviewMount';

  const text = (value) => String(value ?? '').trim();

  function root() {
    return document.getElementById(ROOT_ID);
  }

  function selectedFilename() {
    const select = root()?.querySelector('#caip439Asset');
    const option = select?.selectedOptions?.[0];
    const raw = text(option?.textContent);
    if (!raw || raw.toLowerCase().startsWith('choose video/audio')) return 'CAIP media';
    return text(raw.split(' · ')[0]) || 'CAIP media';
  }

  function categoryLabel() {
    const value = text(root()?.querySelector('#caip439NewCategory')?.value || 'process_proof');
    return value.replace(/_/g, ' ') || 'process proof';
  }

  function capturedTimeLabel() {
    const start = text(root()?.querySelector('#caip439StartDisplay')?.textContent);
    const end = text(root()?.querySelector('#caip439EndDisplay')?.textContent);
    if (start && start !== '—' && end && end !== '—') return `${start}–${end}`;
    if (start && start !== '—') return start;
    const playhead = text(root()?.querySelector('#caip439Playhead')?.textContent);
    return playhead && playhead !== '—' ? playhead : '0:00';
  }

  function draftTitle() {
    return `${selectedFilename()} · ${categoryLabel()} · ${capturedTimeLabel()}`.slice(0, 240);
  }

  function ensureTitle({ focus = false } = {}) {
    const input = root()?.querySelector('#caip439NewTitle');
    if (!input) return '';
    if (!text(input.value)) {
      input.value = draftTitle();
      input.dataset.caip439AutoDrafted = '1';
      input.setAttribute('aria-invalid', 'false');
      input.title = 'Auto-drafted from the selected source, category and captured time. Edit it if a more specific human-reviewed title is useful.';
    }
    if (focus) input.focus();
    return text(input.value);
  }

  function refreshAutoDraft() {
    const input = root()?.querySelector('#caip439NewTitle');
    if (!input || input.dataset.caip439AutoDrafted !== '1') return;
    input.value = draftTitle();
  }

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.id === 'caip439NewTitle' && text(target.value)) {
      delete target.dataset.caip439AutoDrafted;
      target.setAttribute('aria-invalid', 'false');
    }
  }, true);

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (target.id === 'caip439NewCategory' || target.id === 'caip439Asset') {
      queueMicrotask(refreshAutoDraft);
    }
  }, true);

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('button') : null;
    if (!target || !root()?.contains(target)) return;

    if (['caip439CaptureStart', 'caip439CaptureEnd', 'caip439ClearEnd'].includes(target.id)) {
      queueMicrotask(() => {
        const input = root()?.querySelector('#caip439NewTitle');
        if (input && (!text(input.value) || input.dataset.caip439AutoDrafted === '1')) {
          input.value = draftTitle();
          input.dataset.caip439AutoDrafted = '1';
          input.setAttribute('aria-invalid', 'false');
        }
      });
      return;
    }

    if (target.id === 'caip439SaveNewMarker') {
      ensureTitle();
    }
  }, true);

  const observerTarget = root();
  if (observerTarget && typeof MutationObserver === 'function') {
    const observer = new MutationObserver(() => {
      const title = observerTarget.querySelector('#caip439NewTitle');
      if (title && !text(title.value) && title.dataset.caip439AssistInitialized !== '1') {
        title.dataset.caip439AssistInitialized = '1';
        title.title = 'Required. CAIP will draft a neutral title when you capture a point/range or click Save.';
      }
    });
    observer.observe(observerTarget, { childList: true, subtree: true });
  }
})();
