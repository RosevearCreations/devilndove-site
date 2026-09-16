// Release 467 Build 158 — Product Quality deferred-evidence presentation.
// A bounded readiness timeout is an expected fail-soft state, not a Product workspace failure.
// This helper performs no network calls and never marks unknown evidence complete.
(() => {
  'use strict';
  const pathname = String(window.location.pathname || '').replace(/\/+$/, '') || '/';
  if (pathname !== '/admin/products') return;

  const VERSION = 'R467B158_QUALITY_PENDING_V1';
  const health = {
    version: VERSION,
    scans: 0,
    deferred_presentations: 0,
    real_warning_preserved: 0,
    last_text: '',
  };
  window.DDProductQualityPendingV158Health = health;

  function clean(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }

  function classify() {
    health.scans += 1;
    const mount = document.getElementById('productQualityCommandCenterMount');
    if (!mount) return false;

    const eyebrow = mount.querySelector('.eyebrow');
    if (eyebrow && /Release\s+467\s+Build\s+157/i.test(clean(eyebrow.textContent))) {
      eyebrow.textContent = 'Release 467 Build 158';
    }

    let changed = false;
    mount.querySelectorAll('.status-note.warning').forEach((note) => {
      const raw = clean(note.textContent);
      health.last_text = raw;
      const boundedReadiness = /Product readiness is degraded\s*\(readiness_timeout\)/i.test(raw);
      const otherFailure = /Buyer facts:|HTTP\s*\d+|worker exceeded|resource limit|database unavailable|authentication helper|failed|exception/i.test(raw);
      if (!boundedReadiness || otherFailure) {
        if (otherFailure) health.real_warning_preserved += 1;
        return;
      }

      note.classList.remove('warning');
      note.classList.add('info');
      note.innerHTML = '<strong>Readiness evidence is deferred</strong><br>The bounded readiness read did not finish inside the startup budget. Unknown readiness remains pending and is not marked complete. Essential Product work remains available.';
      note.setAttribute('data-dd-build158-readiness-deferred', '1');
      health.deferred_presentations += 1;
      changed = true;
    });
    return changed;
  }

  function scheduleChecks() {
    [0, 150, 600, 1500, 3200, 5200, 7600].forEach((delay) => window.setTimeout(classify, delay));
  }

  function start() {
    scheduleChecks();
    document.addEventListener('dd:products-core-recovered', scheduleChecks);
    document.addEventListener('click', (event) => {
      if (event.target?.closest?.('[data-quality-refresh]')) scheduleChecks();
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
