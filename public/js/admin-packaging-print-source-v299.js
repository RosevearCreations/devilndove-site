// Devil n Dove Build 299 Packaging print-source consistency controller.
// Project Save keeps the live Project draft authoritative. Historical review versions
// remain immutable and, when explicitly selected, print from their stored SVG artifact.
(() => {
  const BUILD = 299;
  const VERSION_ARTIFACT_PATH = '/api/admin/packaging-version-artifact';
  const LETTER_MM = Object.freeze({ width: 215.9, height: 279.4 });

  let savedVersionPrintCount = 0;
  let lastVersionId = 0;
  let lastVersionStatus = 0;
  let lastVersionError = '';
  let lastPrintSource = 'project-draft';

  const byId = (name) => document.getElementById(name);
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  function message(text = '', kind = '') {
    const node = byId('packagingStudioMessage');
    if (!node) return;
    node.hidden = !text;
    node.textContent = text;
    node.className = `card small ${kind === 'error' ? 'is-error' : kind === 'success' ? 'is-success' : ''}`;
  }

  function selectedVersionId() {
    return Number(byId('printTestVersion')?.value || 0) || 0;
  }

  function currentProjectId() {
    return Number(byId('packagingProjectId')?.value || 0) || 0;
  }

  function updateSourceNote(select) {
    if (!select) return;
    const label = select.closest('label');
    const heading = label?.querySelector('.small');
    if (heading) heading.textContent = 'Print source / evidence version';

    let note = label?.querySelector('[data-packaging-print-source-note]');
    if (!note && label) {
      note = document.createElement('span');
      note.className = 'small';
      note.dataset.packagingPrintSourceNote = '299';
      select.insertAdjacentElement('afterend', note);
    }

    const versionId = Number(select.value || 0) || 0;
    const option = select.selectedOptions?.[0];
    if (!versionId) {
      lastPrintSource = 'project-draft';
      if (note) note.textContent = 'Project draft prints the current live/saved project details. Save Project first when you want those edits persisted.';
    } else {
      lastPrintSource = 'saved-review-version';
      if (note) note.textContent = `${option?.textContent || 'Saved review version'} prints from its immutable stored SVG artifact.`;
    }
  }

  function bindPrintSourceSelect() {
    const select = byId('printTestVersion');
    if (!select || select.dataset.build299PrintSourceBound === 'true') return;

    // Build 298 defaulted to the newest historical version. That made a normal Project
    // Save appear stale. Build 299 deliberately defaults every newly rendered Print tab
    // to the Project draft; a historical version must be selected explicitly.
    select.value = '';
    select.dataset.build299PrintSourceBound = 'true';
    select.addEventListener('change', () => updateSourceNote(select));
    updateSourceNote(select);
  }

  function watchRenders() {
    const main = byId('packagingStudioMain');
    if (!main || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => bindPrintSourceSelect());
    observer.observe(main, { childList: true, subtree: true });
    bindPrintSourceSelect();
  }

  function printerProfile() {
    return {
      name: String(byId('printTestPrinterName')?.value || '').trim(),
      margin_mm: Math.max(0, number(byId('printProfileMargin')?.value, 0)),
      gap_mm: Math.max(0, number(byId('printProfileGap')?.value, 0)),
      scale_percent: Math.max(1, number(byId('printTestScale')?.value, 100)),
      auto_rotate: byId('printProfileAutoRotate')?.checked !== false,
    };
  }

  function sheetPlan(widthMm, heightMm, profile = {}) {
    const scale = Math.max(.5, Math.min(1.5, number(profile.scale_percent, 100) / 100));
    const labelWidth = Math.max(1, number(widthMm, 50.8)) * scale;
    const labelHeight = Math.max(1, number(heightMm, 25.4)) * scale;
    const margin = Math.max(0, number(profile.margin_mm, 0));
    const gap = Math.max(0, number(profile.gap_mm, 0));
    const candidates = [];

    for (const orientation of ['portrait', 'landscape']) {
      const pageW = orientation === 'portrait' ? LETTER_MM.width : LETTER_MM.height;
      const pageH = orientation === 'portrait' ? LETTER_MM.height : LETTER_MM.width;
      for (const rotated of [false, true]) {
        if (rotated && profile.auto_rotate === false) continue;
        const packedW = rotated ? labelHeight : labelWidth;
        const packedH = rotated ? labelWidth : labelHeight;
        const usableW = Math.max(0, pageW - margin * 2);
        const usableH = Math.max(0, pageH - margin * 2);
        const cols = packedW > 0 ? Math.floor((usableW + gap) / (packedW + gap)) : 0;
        const rows = packedH > 0 ? Math.floor((usableH + gap) / (packedH + gap)) : 0;
        candidates.push({
          orientation,
          rotated,
          pageW,
          pageH,
          labelWidth,
          labelHeight,
          packedW,
          packedH,
          cols,
          rows,
          count: Math.max(0, cols * rows),
          margin,
          gap,
          scale,
        });
      }
    }

    candidates.sort((a, b) => b.count - a.count || Number(a.rotated) - Number(b.rotated) || (a.orientation === 'landscape' ? -1 : 1));
    return candidates[0] || null;
  }

  function svgDimensions(svgMarkup) {
    try {
      const doc = new DOMParser().parseFromString(String(svgMarkup || ''), 'image/svg+xml');
      const root = doc.documentElement;
      const readMm = (attribute, fallback) => {
        const raw = String(root?.getAttribute(attribute) || '').trim();
        const match = raw.match(/^([0-9]+(?:\.[0-9]+)?)mm$/i);
        return match ? Number(match[1]) : fallback;
      };
      return {
        widthMm: readMm('width', Math.max(1, number(byId('packagingTemplateWidth')?.value, 50.8))),
        heightMm: readMm('height', Math.max(1, number(byId('packagingTemplateHeight')?.value, 25.4))),
      };
    } catch {
      return {
        widthMm: Math.max(1, number(byId('packagingTemplateWidth')?.value, 50.8)),
        heightMm: Math.max(1, number(byId('packagingTemplateHeight')?.value, 25.4)),
      };
    }
  }

  async function inlineSvgAssets(markup) {
    const sources = [...new Set([...String(markup).matchAll(/<image\b[^>]*\bhref="(\/assets\/[^"]+)"/g)].map((match) => match[1]))];
    let output = String(markup || '');
    for (const source of sources) {
      const response = await fetch(source, { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`Artwork asset ${source} could not be loaded (HTTP ${response.status}).`);
      const blob = await response.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('Asset conversion failed.'));
        reader.readAsDataURL(blob);
      });
      output = output.split(`href="${source}"`).join(`href="${dataUrl}"`);
    }
    return output;
  }

  async function readSavedVersionArtifact(projectId, versionId) {
    const auth = globalThis.DDAuth;
    if (!auth || typeof auth.apiFetch !== 'function') throw new Error('Packaging authentication transport is unavailable.');
    const url = `${VERSION_ARTIFACT_PATH}?packaging_project_id=${encodeURIComponent(projectId)}&packaging_project_version_id=${encodeURIComponent(versionId)}`;
    const response = await auth.apiFetch(url);
    lastVersionStatus = Number(response?.status || 0);
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok || !payload?.artifact?.svg_markup) {
      throw new Error(payload?.error || `Saved Packaging version could not be loaded (HTTP ${lastVersionStatus || 0}).`);
    }
    return payload.artifact;
  }

  function writePrintWindow(win, artifact, svg, plan, profile) {
    const title = `Packaging Version ${artifact.version_number || ''}${artifact.version_label ? ` — ${artifact.version_label}` : ''}`;
    const labelHtml = Array.from({ length: plan.count }, () => `<div class="label-cell ${plan.rotated ? 'rotated' : ''}"><div class="label-art">${svg}</div></div>`).join('');
    win.document.open();
    win.document.write(`<!doctype html><html><head><title>${esc(title)} — ${plan.count} up Letter sheet</title><style>@page{size:letter ${plan.orientation};margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}.sheet{width:${plan.pageW}mm;height:${plan.pageH}mm;padding:${plan.margin}mm;display:grid;grid-template-columns:repeat(${plan.cols},${plan.packedW}mm);grid-auto-rows:${plan.packedH}mm;gap:${plan.gap}mm;align-content:start;justify-content:start;overflow:hidden}.label-cell{position:relative;width:${plan.packedW}mm;height:${plan.packedH}mm;overflow:hidden}.label-art{position:absolute;left:0;top:0;width:${plan.labelWidth}mm;height:${plan.labelHeight}mm}.label-art>svg{display:block;width:${plan.labelWidth}mm!important;height:${plan.labelHeight}mm!important}.rotated .label-art{transform:rotate(90deg) translateY(-100%);transform-origin:top left}@media screen{body{background:#ddd}.sheet{margin:8px auto;background:#fff;box-shadow:0 1px 10px #777}}</style></head><body><main class="sheet">${labelHtml}</main><script>onload=()=>setTimeout(()=>print(),350)<\/script></body></html>`);
    win.document.close();
    message(`Prepared saved Version ${artifact.version_number || ''} from its immutable SVG: ${plan.count} label${plan.count === 1 ? '' : 's'} on one Letter sheet. Choose “${profile.name || 'the intended printer'}” and Actual Size / 100% in the system dialog.`, 'success');
  }

  async function printSavedVersion(versionId) {
    const projectId = currentProjectId();
    if (!projectId) {
      message('Open a Packaging project before printing a saved review version.', 'error');
      return;
    }

    const win = open('', '_blank', 'noopener,noreferrer');
    if (!win) {
      message('Pop-up blocked. Allow pop-ups for the optimized label sheet.', 'error');
      return;
    }
    win.document.write('<!doctype html><html><body style="font-family:system-ui;padding:2rem">Loading saved Packaging review version…</body></html>');
    win.document.close();

    lastVersionId = versionId;
    lastVersionError = '';
    try {
      const artifact = await readSavedVersionArtifact(projectId, versionId);
      const dimensions = svgDimensions(artifact.svg_markup);
      const profile = printerProfile();
      const plan = sheetPlan(dimensions.widthMm, dimensions.heightMm, profile);
      if (!plan?.count) throw new Error('No saved-version label fits on Letter paper at the selected exact-size printer settings.');
      const svg = await inlineSvgAssets(artifact.svg_markup);
      savedVersionPrintCount += 1;
      lastPrintSource = 'saved-review-version';
      writePrintWindow(win, artifact, svg, plan, profile);
    } catch (error) {
      lastVersionError = String(error?.message || error || 'Saved Packaging review version could not be printed.');
      try {
        win.document.open();
        win.document.write(`<!doctype html><html><body style="font-family:system-ui;padding:2rem"><h1>Packaging print could not be prepared</h1><p>${esc(lastVersionError)}</p></body></html>`);
        win.document.close();
      } catch {}
      message(lastVersionError, 'error');
    }
  }

  // Capture phase is intentional. For Project draft we allow the proven Build 277/298
  // print handler to run unchanged. For an explicitly selected saved version we stop the
  // old handler before target phase and print the stored version artifact instead.
  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('#printOptimizedSheet');
    if (!button) return;
    const versionId = selectedVersionId();
    if (!versionId) {
      lastPrintSource = 'project-draft';
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    void printSavedVersion(versionId);
  }, true);

  document.addEventListener('DOMContentLoaded', watchRenders);

  globalThis.DDPackagingPrintSource = Object.freeze({
    build: BUILD,
    getStatus: () => Object.freeze({
      build: BUILD,
      state: 'active',
      defaultSource: 'project-draft',
      lastPrintSource,
      savedVersionPrintCount,
      lastVersionId,
      lastVersionStatus,
      lastVersionError,
      artifactPath: VERSION_ARTIFACT_PATH,
      savedVersionsImmutable: true,
      historicalVersionMustBeExplicitlySelected: true,
    }),
  });
})();
