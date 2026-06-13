// File: /public/js/admin-visual-polish.js
// Build 182 visual polish and mobile parity admin UI.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('visualPolishMount');
  if (!mount || !window.DDAuth?.apiFetch) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const arr = (data, key) => Array.isArray(data?.[key]) ? data[key] : [];
  const slug = (value) => String(value || 'unknown').toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  const pill = (value) => `<span class="status-pill ${esc(slug(value))}">${esc(value || 'unknown')}</span>`;
  const table = (headers, rows, empty) => rows.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : `<p class="small">${esc(empty || 'No rows yet.')}</p>`;
  async function post(action, extra = {}) {
    const res = await window.DDAuth.apiFetch('/api/admin/visual-polish', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ action, ...extra }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Action failed.');
    render(data);
  }
  function render(data) {
    const s = data.summary || {};
    mount.innerHTML = `
      <div class="status-note success">${esc(data.build_label || 'Build 182')} loaded • parity rows: ${Number(s.parity_rows || 0)} • visual candidates: ${Number(s.visual_candidates || 0)} • fallbacks: ${Number(s.fallback_rows || 0)} • schema queue: ${Number(s.schema_queue || 0)}</div>
      <div class="visual-polish-toolbar card">
        <button class="btn" data-action="seed_all" type="button">Refresh all Build 182 rows</button>
        <button class="btn secondary" data-action="seed_parity" type="button">Seed desktop/mobile parity</button>
        <button class="btn secondary" data-action="seed_visual_candidates" type="button">Seed visual candidates</button>
        <button class="btn secondary" data-action="seed_effect_safety" type="button">Seed visual effect safety</button>
        <button class="btn secondary" data-action="seed_fallbacks" type="button">Seed fallback rows</button>
        <button class="btn secondary" data-action="seed_schema_queue" type="button">Queue schema checks</button>
        <button class="btn secondary" data-action="seed_json_db_candidates" type="button">Seed JSON→D1 candidates</button>
      </div>
      <div class="visual-polish-grid">
        <section class="card"><h2 style="margin-top:0">Desktop/mobile parity</h2>${table(['Page','Viewport pair','Status','Issues','Mobile note'], arr(data,'parity').map((row) => `<tr><td><code>${esc(row.page_path)}</code></td><td>${esc(row.viewport_label)}</td><td>${pill(row.check_status)}</td><td>${Number(row.issue_count || 0)}</td><td>${esc(row.mobile_note)}</td></tr>`), 'No parity rows yet.')}${table(['Page','Selector','Min px','Status','Issues'], arr(data,'touch_targets').map((row) => `<tr><td><code>${esc(row.page_path)}</code></td><td><code>${esc(row.target_selector)}</code></td><td>${Number(row.min_target_px || 0)}</td><td>${pill(row.audit_status)}</td><td>${Number(row.issue_count || 0)}</td></tr>`), 'No touch-target audits yet.')}</section>
        <section class="card"><h2 style="margin-top:0">Visual enrichment candidates</h2>${table(['Page','Kind','Status','Asset hint','Alt text','Action'], arr(data,'candidates').map((row) => `<tr><td><code>${esc(row.page_path)}</code></td><td>${esc(row.visual_kind)}</td><td>${pill(row.candidate_status)}</td><td>${esc(row.asset_hint)}</td><td>${esc(row.alt_text_hint)}</td><td><button class="btn small" data-approve-candidate="${Number(row.visual_enrichment_candidate_id || 0)}" type="button">Approve</button></td></tr>`), 'No visual candidates yet.')}</section>
        <section class="card"><h2 style="margin-top:0">Effect safety and image budgets</h2>${table(['Effect','Selector','Status','Reduced motion','Notes'], arr(data,'effects').map((row) => `<tr><td>${esc(row.effect_key)}</td><td><code>${esc(row.affected_selector)}</code></td><td>${pill(row.effect_status)}</td><td>${Number(row.prefers_reduced_motion_supported || 0) ? 'yes' : 'no'}</td><td>${esc(row.notes)}</td></tr>`), 'No effect safety rows yet.')}${table(['Page','Budget','Images','Lazy','Notes'], arr(data,'budgets').map((row) => `<tr><td><code>${esc(row.page_path)}</code></td><td>${pill(row.budget_status)}</td><td>${Number(row.max_new_images || 0)}</td><td>${Number(row.lazy_loading_required || 0) ? 'yes' : 'no'}</td><td>${esc(row.notes)}</td></tr>`), 'No image budget rows yet.')}</section>
        <section class="card"><h2 style="margin-top:0">Fallbacks, schema, and JSON ownership</h2>${table(['Route','Fallback','Status','Message'], arr(data,'fallback_rows').map((row) => `<tr><td><code>${esc(row.route_path)}</code></td><td>${esc(row.fallback_kind)}</td><td>${pill(row.fallback_status)}</td><td>${esc(row.user_message)}</td></tr>`), 'No fallback rows yet.')}${table(['Page','Schema','Status','Source'], arr(data,'schema_queue').map((row) => `<tr><td><code>${esc(row.page_path)}</code></td><td>${esc(row.schema_type)}</td><td>${pill(row.validation_status)}</td><td>${esc(row.source_hint)}</td></tr>`), 'No schema queue rows yet.')}${table(['Source JSON','Target table','Risk','Decision'], arr(data,'json_candidates').map((row) => `<tr><td><code>${esc(row.source_path)}</code></td><td><code>${esc(row.target_table)}</code></td><td>${esc(row.duplication_risk)}</td><td>${pill(row.ownership_status)}</td></tr>`), 'No JSON/D1 ownership candidates yet.')}</section>
      </div>
      <section class="card"><h2 style="margin-top:0">Visual preferences</h2><form id="visualPreferenceForm" class="admin-inline-form"><label>Preference <input name="preference_key" value="visual_density"/></label><label>Value <select name="preference_value"><option value="balanced">Balanced</option><option value="subtle">Subtle</option><option value="richer">Richer</option></select></label><button class="btn" type="submit">Save preference</button></form>${table(['Preference','Value','Status','Notes'], arr(data,'preferences').map((row) => `<tr><td><code>${esc(row.preference_key)}</code></td><td>${esc(row.preference_value)}</td><td>${pill(row.preference_status)}</td><td>${esc(row.notes)}</td></tr>`), 'No preferences yet.')}${table(['Build','CSS path','Status','Notes'], arr(data,'css_runs').map((row) => `<tr><td>${esc(row.build_label)}</td><td><code>${esc(row.css_path)}</code></td><td>${pill(row.review_status)}</td><td>${esc(row.notes)}</td></tr>`), 'No CSS drift rows yet.')}</section>`;
    mount.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', async () => { try { await post(button.getAttribute('data-action')); } catch (error) { alert(error.message || 'Action failed.'); } }));
    mount.querySelectorAll('[data-approve-candidate]').forEach((button) => button.addEventListener('click', async () => { try { await post('approve_candidate', { visual_enrichment_candidate_id:Number(button.getAttribute('data-approve-candidate') || 0) }); } catch (error) { alert(error.message || 'Approval failed.'); } }));
    mount.querySelector('#visualPreferenceForm')?.addEventListener('submit', async (event) => { event.preventDefault(); const f = event.currentTarget; try { await post('save_preference', { preference_key:f.preference_key.value, preference_value:f.preference_value.value }); } catch (error) { alert(error.message || 'Save failed.'); } });
  }
  async function load() { const res = await window.DDAuth.apiFetch('/api/admin/visual-polish'); const data = await res.json().catch(() => ({})); if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Load failed.'); render(data); }
  load().catch((error) => { mount.textContent = error.message || 'Visual Polish failed to load.'; });
});
