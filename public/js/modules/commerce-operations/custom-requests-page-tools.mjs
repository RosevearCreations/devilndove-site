// Devil n Dove Builds 375–380 — dedicated Custom Requests page-owned read/export tools.
// Adds read diagnostics, safe marketplace exports, and rewrites the legacy CSV GET links on this page only.

export const BUILD = 380;
export const READ_CONTRACT_BUILD = 370;
export const EXPORT_CONTRACT_BUILD = 373;
export const EXPORT_READINESS_BUILD = 374;
export const READ_ROUTE = '/api/admin/contracts/operations-custom-requests-read';
export const EXPORT_READINESS_ROUTE = '/api/admin/contracts/operations-custom-requests-marketplace-export-read';
export const SAFE_EXPORT_ROUTE = '/api/admin/contracts/operations-custom-requests-marketplace-export';

const CHANNELS = Object.freeze([
  ['all', 'All channels'],
  ['etsy', 'Etsy'],
  ['facebook', 'Facebook'],
  ['pinterest', 'Pinterest'],
  ['manual', 'Manual listing'],
]);

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeExportUrl(channel = 'all') {
  const clean = CHANNELS.some(([key]) => key === channel) ? channel : 'all';
  return `${SAFE_EXPORT_ROUTE}?channel=${encodeURIComponent(clean)}`;
}

function channelFromLegacyHref(href) {
  try {
    const url = new URL(href, window.location.origin);
    const channel = String(url.searchParams.get('channel') || 'all').trim().toLowerCase();
    return CHANNELS.some(([key]) => key === channel) ? channel : 'all';
  } catch {
    return 'all';
  }
}

function rewriteLegacyExportLinks(root = document) {
  const anchors = root.querySelectorAll?.('a[href*="/api/admin/custom-requests?"][href*="format=marketplace_csv"]') || [];
  let rewritten = 0;
  for (const anchor of anchors) {
    const original = anchor.getAttribute('href') || '';
    const channel = channelFromLegacyHref(original);
    anchor.dataset.ddLegacyMarketplaceCsvHref = original;
    anchor.dataset.ddSafeMarketplaceExport = 'true';
    anchor.setAttribute('href', safeExportUrl(channel));
    anchor.setAttribute('rel', 'noopener');
    anchor.title = 'Read-only marketplace CSV export. No schema creation or preset seeding occurs during download.';
    rewritten += 1;
  }
  document.documentElement.dataset.ddCustomRequestsLegacyExportLinksRewritten = String(rewritten);
  return rewritten;
}

async function readJson(path) {
  const apiFetch = globalThis.DDAuth?.apiFetch;
  if (typeof apiFetch !== 'function') throw new Error('Authenticated API client is unavailable.');
  const response = await apiFetch(path);
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(data?.error || `Read failed (${response.status}).`);
  return data;
}

function renderExportToolbar(data = {}) {
  const mount = document.getElementById('customRequestsSafeExportLinks');
  if (!mount) return;

  const ready = data.schema_ready === true;
  const packCount = data.export_pack_count == null ? '—' : Number(data.export_pack_count || 0);
  const presetReady = data.optional_schema_ready === true;
  const presetCount = data.marketplace_preset_count == null ? '—' : Number(data.marketplace_preset_count || 0);

  mount.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      ${CHANNELS.map(([channel, label]) => `<a class="btn small" data-dd-safe-marketplace-export="${esc(channel)}" href="${esc(safeExportUrl(channel))}">${esc(label)} CSV</a>`).join('')}
    </div>
    <p class="small" style="margin:8px 0 0">
      Export packs: <strong>${esc(packCount)}</strong> • preset table: <strong>${presetReady ? `ready (${esc(presetCount)})` : 'not ready'}</strong> • download schema: <strong>${ready ? 'ready' : 'not ready'}</strong>.
      These links use the non-mutating Build ${EXPORT_CONTRACT_BUILD} export authority.
    </p>`;
}

function renderReadStatus(readData = {}, exportData = {}) {
  const status = document.getElementById('customRequestsOwnedReadStatus');
  const diagnostics = document.getElementById('customRequestsReadDiagnostics');
  if (!status || !diagnostics) return;

  const readReady = readData.schema_ready === true;
  const exportReady = exportData.schema_ready === true;
  const missing = Array.isArray(readData.missing_tables) ? readData.missing_tables : [];
  const exportMissing = Array.isArray(exportData.missing_tables) ? exportData.missing_tables : [];
  const optionalMissing = Array.isArray(exportData.optional_missing_tables) ? exportData.optional_missing_tables : [];
  const checkedCount = Array.isArray(readData.checked_tables) ? readData.checked_tables.length : 0;
  const requestCount = Array.isArray(readData.requests) ? readData.requests.length : 0;

  status.classList.toggle('is-error', !readReady || !exportReady);
  status.classList.toggle('is-success', readReady && exportReady);
  status.textContent = readReady && exportReady
    ? `Owned Custom Requests reads are ready. ${requestCount} request(s) loaded; ${checkedCount} startup tables verified.`
    : 'Custom Requests is partially available. Review the read diagnostics before relying on empty panels or marketplace exports.';

  diagnostics.innerHTML = `
    <div class="small"><strong>Startup read:</strong> Build ${READ_CONTRACT_BUILD} • schema ${readReady ? 'ready' : 'not ready'} • checked tables ${esc(checkedCount)}</div>
    <div class="small"><strong>Marketplace export:</strong> Build ${EXPORT_CONTRACT_BUILD}/${EXPORT_READINESS_BUILD} • schema ${exportReady ? 'ready' : 'not ready'} • GET-time schema mutation false</div>
    ${missing.length ? `<div class="small"><strong>Missing startup tables:</strong> ${esc(missing.join(', '))}</div>` : ''}
    ${exportMissing.length ? `<div class="small"><strong>Missing export tables:</strong> ${esc(exportMissing.join(', '))}</div>` : ''}
    ${optionalMissing.length ? `<div class="small"><strong>Optional marketplace preset table missing:</strong> ${esc(optionalMissing.join(', '))}. Existing prepared packs can still export.</div>` : ''}`;

  document.documentElement.dataset.ddCustomRequestsOwnedReadReady = String(readReady);
  document.documentElement.dataset.ddCustomRequestsMarketplaceExportReady = String(exportReady);
  document.documentElement.dataset.ddCustomRequestsPageToolsBuild = String(BUILD);
}

async function refreshDiagnostics() {
  const status = document.getElementById('customRequestsOwnedReadStatus');
  if (status) status.textContent = 'Checking Custom Requests read/schema readiness…';

  try {
    const [readData, exportData] = await Promise.all([
      readJson(READ_ROUTE),
      readJson(EXPORT_READINESS_ROUTE),
    ]);
    renderReadStatus(readData, exportData);
    renderExportToolbar(exportData);
    rewriteLegacyExportLinks(document);
    return Object.freeze({ readData, exportData });
  } catch (error) {
    if (status) {
      status.classList.add('is-error');
      status.textContent = error?.message || 'Custom Requests read diagnostics could not be loaded.';
    }
    document.documentElement.dataset.ddCustomRequestsOwnedReadReady = 'error';
    throw error;
  }
}

function installLegacyExportGuard() {
  document.addEventListener('click', (event) => {
    const anchor = event.target?.closest?.('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href') || '';
    if (!href.includes('/api/admin/custom-requests?') || !href.includes('format=marketplace_csv')) return;
    event.preventDefault();
    window.location.assign(safeExportUrl(channelFromLegacyHref(href)));
  }, true);

  const workflowMount = document.getElementById('customRequestsAdminMount');
  if (workflowMount && typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => rewriteLegacyExportLinks(workflowMount));
    observer.observe(workflowMount, { childList: true, subtree: true });
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  }
}

function boot() {
  if (!document.getElementById('customRequestsAdminMount')) return;
  installLegacyExportGuard();
  rewriteLegacyExportLinks(document);
  document.getElementById('customRequestsReadRefresh')?.addEventListener('click', () => {
    refreshDiagnostics().catch(() => null);
  });
  refreshDiagnostics().catch(() => null);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
