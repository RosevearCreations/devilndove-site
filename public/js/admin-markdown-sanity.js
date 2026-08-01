document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('markdownSanityMount');
  if (!mount) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arr = (data, key) => Array.isArray(data?.[key]) ? data[key] : [];
  const pill = (value) => `<span class="status-pill">${esc(String(value || 'review').replaceAll('_',' '))}</span>`;
  const table = (headers, rows, empty) => rows.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : `<p class="small">${esc(empty || 'No rows yet.')}</p>`;
  async function post(action) {
    const res = await window.DDAuth.apiFetch('/api/admin/markdown-sanity', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Action failed.');
    render(data);
  }
  function render(data) {
    const s = data.summary || {};
    mount.innerHTML = `
      <div class="status-note success">${esc(data.build_label || 'Build 186')} loaded • canonical files: ${Number(s.canonical_files || 0)} • Markdown rows: ${Number(s.markdown_files || 0)} • value rows: ${Number(s.enhancements || 0)} • visual placeholders: ${Number(s.placeholders || 0)} • CSS checks: ${Number(s.css_reviews || 0)}</div>
      <div class="markdown-sanity-actions card"><button class="btn" data-action="refresh" type="button">Refresh Markdown sanity</button><button class="btn secondary" data-action="save_snapshot" type="button">Save consolidation snapshot</button><a class="btn secondary" href="/admin/command-center/">Command Center</a><a class="btn secondary" href="/admin/visual-enrichment-studio/">Visuals</a></div>
      <section class="markdown-sanity-grid">
        <article class="card"><h2>Two primary handoff files</h2><p><strong>PROJECT_STATUS_AND_ROADMAP.md</strong> is the main human project file. <strong>AI_HANDOFF.md</strong> is the main new-chat / next-AI file. Existing Markdown stays available as supporting reference so no context is lost.</p></article>
        <article class="card"><h2>Current value direction</h2><p>Focus moves from adding more separate admin pages toward daily rollups, product readiness, conversion tracking, local SEO proof, approved visuals, customer stories, mobile capture, costing, customer history, and speed budgets.</p></article>
      </section>
      <section class="card"><h2 style="margin-top:0">Markdown file sanity</h2>${table(['File','Role','Keep','Canonical replacement','Status','Owner note'], arr(data,'markdown').map((row) => `<tr><td><code>${esc(row.file_path)}</code></td><td>${pill(row.file_role)}</td><td>${Number(row.keep_active || 0) ? 'Yes' : 'No'}</td><td>${row.canonical_replacement ? `<code>${esc(row.canonical_replacement)}</code>` : '—'}</td><td>${pill(row.review_status)}</td><td>${esc(row.owner_note)}</td></tr>`), 'No Markdown rows yet.')}</section>
      <section class="card"><h2 style="margin-top:0">Value-added enhancement execution</h2>${table(['Priority','Enhancement','Surface','Desktop','Mobile','SEO','Status','Next action'], arr(data,'enhancements').map((row) => `<tr><td>${Number(row.priority_rank || 0)}</td><td>${esc(row.enhancement_label)}<div class="small">${esc(row.business_value)}</div></td><td><code>${esc(row.app_surface)}</code></td><td>${pill(row.desktop_status)}</td><td>${pill(row.mobile_status)}</td><td>${pill(row.seo_status)}</td><td>${pill(row.implementation_status)}</td><td>${esc(row.next_best_action)}</td></tr>`), 'No enhancement rows yet.')}</section>
      <section class="card"><h2 style="margin-top:0">Visual graphic placeholders</h2><p class="small">Placeholders enrich public pages now and show exactly where approved media should replace them later. H1 changes are locked off.</p><div class="visual-placeholder-admin-grid">${arr(data,'placeholders').map((row) => `<article class="visual-placeholder-card"><img src="${esc(row.placeholder_asset_url)}" alt="${esc(row.alt_text)}" loading="lazy"/><div><strong>${esc(row.image_slot_label)}</strong><div class="small"><code>${esc(row.page_path)}</code></div><div>${pill(row.replacement_status)} ${Number(row.h1_change_allowed || 0) ? pill('h1 allowed') : pill('h1 locked')}</div><p class="small">${esc(row.notes)}</p></div></article>`).join('') || '<p class="small">No placeholder rows yet.</p>'}</div></section>
      <section class="card"><h2 style="margin-top:0">Desktop/mobile and CSS drift checks</h2>${table(['Surface','Route','Desktop','Mobile','Touch','Overflow','Fallback','Next action'], arr(data,'surfaces').map((row) => `<tr><td>${esc(row.surface_label)}</td><td><code>${esc(row.route_path)}</code></td><td>${pill(row.desktop_status)}</td><td>${pill(row.mobile_status)}</td><td>${pill(row.touch_target_status)}</td><td>${pill(row.overflow_status)}</td><td>${pill(row.fallback_status)}</td><td>${esc(row.next_best_action)}</td></tr>`), 'No surface rows yet.')}${table(['Area','Kind','Desktop','Mobile','Risk','Recommended fix'], arr(data,'css').map((row) => `<tr><td><code>${esc(row.selector_or_area)}</code></td><td>${esc(row.review_kind)}</td><td>${pill(row.desktop_status)}</td><td>${pill(row.mobile_status)}</td><td>${pill(row.risk_level)}</td><td>${esc(row.recommended_fix)}</td></tr>`), 'No CSS review rows yet.')}</section>
      <section class="card"><h2 style="margin-top:0">Next-step sanity rows</h2>${table(['Priority','Step','Group','Value','Surface','Status','Notes'], arr(data,'next_steps').map((row) => `<tr><td>${Number(row.priority_rank || 0)}</td><td>${esc(row.step_label)}</td><td>${esc(row.step_group)}</td><td>${esc(row.expected_value)}</td><td><code>${esc(row.target_surface)}</code></td><td>${pill(row.current_status)}</td><td>${esc(row.notes)}</td></tr>`), 'No next-step rows yet.')}</section>`;
    mount.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', async () => { try { await post(button.getAttribute('data-action')); } catch (error) { alert(error.message || 'Action failed.'); } }));
  }
  async function load() {
    const res = await window.DDAuth.apiFetch('/api/admin/markdown-sanity');
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Load failed.');
    render(data);
  }
  load().catch((error) => { mount.innerHTML = `<div class="status-note danger">${esc(error.message || 'Markdown Sanity failed to load.')}</div>`; });
});
