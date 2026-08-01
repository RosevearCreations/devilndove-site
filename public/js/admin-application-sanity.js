document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('applicationSanityMount');
  if (!mount) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arr = (data, key) => Array.isArray(data?.[key]) ? data[key] : [];
  const pill = (value) => `<span class="status-pill">${esc(String(value || 'review').replaceAll('_',' '))}</span>`;
  const table = (headers, rows, empty) => rows.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : `<p class="small">${esc(empty || 'No rows yet.')}</p>`;
  async function post(action) {
    const res = await window.DDAuth.apiFetch('/api/admin/application-sanity', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Action failed.');
    render(data);
  }
  function render(data) {
    const s = data.summary || {};
    mount.innerHTML = `
      <div class="status-note success">${esc(data.build_label || 'Build 184')} loaded • modules: ${Number(s.modules || 0)} • value candidates: ${Number(s.candidates || 0)} • SEO rows: ${Number(s.seo_rows || 0)} • desktop/mobile rows: ${Number(s.parity_rows || 0)} • visual rows: ${Number(s.visual_rows || 0)}</div>
      <div class="sanity-toolbar card"><button class="btn" data-action="seed_all" type="button">Refresh sanity rows</button><button class="btn secondary" data-action="save_snapshot" type="button">Save sanity snapshot</button><a class="btn secondary" href="/admin/deployment-preflight/">Open Preflight</a><a class="btn secondary" href="/admin/visual-enrichment-studio/">Open Visual Enrichment</a></div>
      <section class="card"><h2 style="margin-top:0">Where the application is now</h2>${table(['Area','State','Value already created','Remaining risk','Next best action','Desktop','Mobile'], arr(data,'modules').map((row) => `<tr><td>${esc(row.module_label)}</td><td>${pill(row.module_status)}</td><td>${esc(row.value_summary)}</td><td>${esc(row.remaining_risk)}</td><td>${esc(row.next_best_action)}</td><td>${pill(row.desktop_status)}</td><td>${pill(row.mobile_status)}</td></tr>`), 'No module rows yet.')}</section>
      <section class="card"><h2 style="margin-top:0">Top value-added modification candidates</h2>${table(['Rank','Candidate','Area','Expected value','Effort','Risk','Status'], arr(data,'candidates').map((row) => `<tr><td>${Number(row.priority_rank || 0)}</td><td>${esc(row.candidate_title)}</td><td>${esc(row.value_area)}</td><td>${esc(row.expected_value)}</td><td>${pill(row.effort_level)}</td><td>${pill(row.risk_level)}</td><td>${pill(row.candidate_status)}</td></tr>`), 'No candidate rows yet.')}</section>
      <section class="card"><h2 style="margin-top:0">Local SEO search criteria review</h2>${table(['Page','Primary phrase','Supporting phrases','Title','H1','Body','Image alt','Local'], arr(data,'seo_rows').map((row) => `<tr><td><code>${esc(row.page_path)}</code></td><td>${esc(row.primary_phrase)}</td><td><code>${esc(row.supporting_phrases_json)}</code></td><td>${pill(row.title_status)}</td><td>${pill(row.h1_status)}</td><td>${pill(row.body_copy_status)}</td><td>${pill(row.image_alt_status)}</td><td>${pill(row.local_relevance_status)}</td></tr>`), 'No SEO review rows yet.')}</section>
      <section class="card"><h2 style="margin-top:0">Desktop/mobile and visual value checks</h2>${table(['Route','Check','Desktop','Mobile','Issues','Recommended fix'], arr(data,'parity_rows').map((row) => `<tr><td><code>${esc(row.route_path)}</code></td><td>${esc(row.check_kind)}</td><td>${pill(row.desktop_value_status)}</td><td>${pill(row.mobile_value_status)}</td><td>${Number(row.issue_count || 0)}</td><td>${esc(row.recommended_fix)}</td></tr>`), 'No desktop/mobile rows yet.')}${table(['Route','Visual idea','Status','Reduced motion','H1 locked','Professional value'], arr(data,'visual_rows').map((row) => `<tr><td><code>${esc(row.route_path)}</code></td><td>${esc(row.enrichment_kind)}</td><td>${pill(row.effect_status)}</td><td>${Number(row.reduced_motion_safe || 0) ? 'yes' : 'no'}</td><td>${Number(row.h1_change_allowed || 0) ? 'no' : 'yes'}</td><td>${esc(row.professional_value)}</td></tr>`), 'No visual rows yet.')}</section>
      <section class="card"><h2 style="margin-top:0">Build 184 next action plan</h2>${table(['Rank','Action','Category','Status','Depends on','Value note'], arr(data,'action_plan').map((row) => `<tr><td>${Number(row.action_rank || 0)}</td><td>${esc(row.action_title)}</td><td>${esc(row.value_category)}</td><td>${pill(row.action_status)}</td><td>${esc(row.depends_on)}</td><td>${esc(row.notes)}</td></tr>`), 'No action plan rows yet.')}</section>
      <section class="card"><h2 style="margin-top:0">Saved sanity snapshots</h2>${table(['Created','Status','Score','Public','Admin','Functions','Schema','Notes'], arr(data,'snapshots').map((row) => `<tr><td>${esc(row.created_at)}</td><td>${pill(row.snapshot_status)}</td><td>${Number(row.score || 0)}</td><td>${Number(row.public_page_count || 0)}</td><td>${Number(row.admin_page_count || 0)}</td><td>${Number(row.function_count || 0)}</td><td>${Number(row.schema_table_count || 0)}</td><td>${esc(row.notes)}</td></tr>`), 'No saved snapshots yet.')}</section>`;
    mount.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', async () => { try { await post(button.getAttribute('data-action')); } catch (error) { alert(error.message || 'Action failed.'); } }));
  }
  async function load() {
    const res = await window.DDAuth.apiFetch('/api/admin/application-sanity');
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Load failed.');
    render(data);
  }
  load().catch((error) => { mount.textContent = error.message || 'Application sanity check failed to load.'; });
});
