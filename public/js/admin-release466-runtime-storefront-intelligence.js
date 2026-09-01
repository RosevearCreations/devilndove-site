document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('runtimeStorefrontIntelligenceMount');
  const days = document.getElementById('intelligenceDays');
  const refresh = document.getElementById('refreshIntelligence');
  if (!mount || !window.DDAuth?.apiFetch) return;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const number = (value, digits = 0) => Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }) : '—';
  const pill = (value) => `<span class="status-pill ${esc(String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}">${esc(value || 'unknown')}</span>`;
  const table = (headers, bodyRows, empty = 'No rows observed.') => bodyRows.length
    ? `<div class="table-wrap"><table class="admin-table"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${bodyRows.join('')}</tbody></table></div>`
    : `<p class="small">${esc(empty)}</p>`;

  function metricCard(label, value, unit, state) {
    return `<div class="admin-stat"><div class="admin-stat-label">${esc(label)}</div><div class="admin-stat-value">${value == null ? '—' : `${number(value, label === 'CLS' ? 3 : 0)}${esc(unit)}`}</div><div class="small">${pill(state)}</div></div>`;
  }

  function render(data) {
    const runtime = data.runtime || {};
    const errors = runtime.client_errors || {};
    const rum = runtime.rum || {};
    const p75 = rum.p75 || {};
    const states = rum.states || {};
    const search = data.search_console || {};
    const totals = search.totals || {};
    const sourceBudget = data.release465_source_budget || {};

    mount.innerHTML = `
      <div class="status-note"><strong>Release ${esc(data.release)} Build ${esc(data.build)}</strong> — ${pill(rum.overall || 'not_enough_data')} real-user performance. This cockpit is read-only.</div>
      <h2>Production JavaScript/runtime capture</h2>
      <div class="grid four-col">
        <div class="admin-stat"><div class="admin-stat-label">Runtime errors</div><div class="admin-stat-value">${number(errors.total_count)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">JS errors</div><div class="admin-stat-value">${number(errors.js_errors)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Promise rejections</div><div class="admin-stat-value">${number(errors.unhandled_rejections)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Affected pages</div><div class="admin-stat-value">${number(errors.affected_pages)}</div></div>
      </div>
      ${table(['When','Severity','Code','Page','Message'], (errors.recent || []).map((row) => `<tr><td>${esc(row.created_at)}</td><td>${pill(row.severity)}</td><td><code>${esc(row.incident_code)}</code></td><td><code>${esc(row.page_path)}</code></td><td>${esc(row.message)}</td></tr>`), 'No public runtime errors recorded in this window.')}

      <h2>Real-user performance — p75</h2>
      <p class="small">${number(rum.sample_count)} sampled page views. Good targets: LCP ≤ 2,500 ms, INP ≤ 200 ms, CLS ≤ 0.1.</p>
      <div class="grid four-col">
        ${metricCard('LCP', p75.LCP_ms, ' ms', states.LCP_ms)}
        ${metricCard('INP', p75.INP_ms, ' ms', states.INP_ms)}
        ${metricCard('CLS', p75.CLS, '', states.CLS)}
        <div class="admin-stat"><div class="admin-stat-label">Samples</div><div class="admin-stat-value">${number(rum.sample_count)}</div><div class="small">75th percentile</div></div>
      </div>
      <div class="grid four-col">
        <div class="admin-stat"><div class="admin-stat-label">FCP p75</div><div class="admin-stat-value">${p75.FCP_ms == null ? '—' : `${number(p75.FCP_ms)} ms`}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">TTFB p75</div><div class="admin-stat-value">${p75.TTFB_ms == null ? '—' : `${number(p75.TTFB_ms)} ms`}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Source files ceiling</div><div class="admin-stat-value">${number(sourceBudget.max_runtime_source_files)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Source bytes ceiling</div><div class="admin-stat-value">${number(sourceBudget.max_runtime_source_bytes)}</div></div>
      </div>
      <p class="small">Field Web Vitals and the inherited Release 465 source-size budget are shown together for release review but are not combined into a misleading single score.</p>

      <h2>Search Console / indexing intelligence</h2>
      ${search.schema_ready === false ? `<div class="status-note">${pill('schema_not_ready')} Missing: ${esc((search.missing_tables || []).join(', '))}</div>` : `
        <div class="grid four-col">
          <div class="admin-stat"><div class="admin-stat-label">Search clicks</div><div class="admin-stat-value">${number(totals.clicks)}</div></div>
          <div class="admin-stat"><div class="admin-stat-label">Impressions</div><div class="admin-stat-value">${number(totals.impressions)}</div></div>
          <div class="admin-stat"><div class="admin-stat-label">CTR</div><div class="admin-stat-value">${Number.isFinite(Number(totals.ctr)) ? `${number(Number(totals.ctr) * 100, 2)}%` : '—'}</div></div>
          <div class="admin-stat"><div class="admin-stat-label">Weighted position</div><div class="admin-stat-value">${number(totals.weighted_position, 1)}</div></div>
        </div>
        <p class="small">Latest Search Console report date: ${esc(totals.latest_report_date || 'not imported')}</p>
        <h3>Striking-distance queries</h3>
        ${table(['Query','Page','Clicks','Impressions','CTR','Position'], (search.striking_distance_queries || []).map((row) => `<tr><td>${esc(row.query_text)}</td><td><code>${esc(row.page_url)}</code></td><td>${number(row.clicks)}</td><td>${number(row.impressions)}</td><td>${number(Number(row.ctr || 0) * 100, 2)}%</td><td>${number(row.average_position, 1)}</td></tr>`), 'No position 4–20 opportunities with at least 10 impressions in this window.')}
        <h3>Low-CTR pages</h3>
        ${table(['Page','Clicks','Impressions','CTR','Position'], (search.low_ctr_pages || []).map((row) => `<tr><td><code>${esc(row.page_url)}</code></td><td>${number(row.clicks)}</td><td>${number(row.impressions)}</td><td>${number(Number(row.ctr || 0) * 100, 2)}%</td><td>${number(row.average_position, 1)}</td></tr>`), 'No high-impression low-CTR pages observed in this window.')}
      `}

      <h2>Read-only monitoring authorities</h2>
      <div class="grid two-col">
        <div class="status-note"><strong>Synthetic storefront</strong><br><code>${esc(data.synthetic_monitor?.authority || '')}</code><br><span class="small">Production mutation: ${esc(String(data.synthetic_monitor?.production_mutation))}</span></div>
        <div class="status-note"><strong>Full Production SEO crawler</strong><br><code>${esc(data.production_seo_crawler?.authority || '')}</code><br><span class="small">Production mutation: ${esc(String(data.production_seo_crawler?.production_mutation))}</span></div>
      </div>
      <p class="small">Direct Search Console API authorization is ${data.direct_search_console_api?.configured_by_build ? 'configured' : 'not required by this build'}; staged Search Console import remains the current data-ingestion authority.</p>
    `;
  }

  async function load() {
    mount.innerHTML = '<p class="small">Loading Release 466 Build 2 intelligence…</p>';
    const windowDays = Math.max(1, Math.min(90, Number(days?.value || 28)));
    try {
      const response = await window.DDAuth.apiFetch(`/api/admin/release-runtime-storefront-intelligence?days=${encodeURIComponent(windowDays)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.ok === false) throw new Error(data?.error || `Request failed with status ${response.status}.`);
      render(data);
    } catch (error) {
      mount.innerHTML = `<div class="status-note"><strong>Runtime/storefront intelligence unavailable.</strong><br>${esc(error?.message || error)}</div>`;
    }
  }

  refresh?.addEventListener('click', load);
  days?.addEventListener('change', load);
  load();
});
