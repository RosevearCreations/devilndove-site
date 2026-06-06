// File: /public/js/admin-local-seo-review.js
// Brief description: Admin UI for local SEO landing-page review queue with scoring badges and quick title/meta fixes.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('localSeoReviewAdminMount');
  if (!mount || !window.DDAuth) return;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  async function read(res) { const data = await res.json().catch(() => null); if (!res.ok || !data?.ok) throw new Error(data?.error || 'SEO review request failed.'); return data; }
  function scoreClass(score){ const n=Number(score||0); return n>=80?'ok':n>=55?'warning':'danger'; }
  function rowHtml(row) {
    const score = Number(row.local_seo_score ?? row.score ?? 0);
    return `<tr><td><a href="${esc(row.page_path)}" target="_blank" rel="noopener">${esc(row.page_label || row.page_path)}</a><div class="small">${esc(row.page_path)}</div><span class="seo-score-badge ${scoreClass(score)}">${esc(score)}%</span>${(row.competitor_phrases||[]).slice(0,3).map((p)=>`<span class="seo-score-badge ${scoreClass(p.last_page_score)}">${esc(p.phrase)}: ${esc(p.scoring_label||p.last_page_score||'new')}</span>`).join('')}</td><td><input data-seo-field="target_keyword" data-id="${esc(row.page_path)}" value="${esc(row.target_keyword || '')}"><input data-seo-field="target_locality" data-id="${esc(row.page_path)}" value="${esc(row.target_locality || '')}" placeholder="Locality"></td><td><select data-seo-field="review_status" data-id="${esc(row.page_path)}"><option value="needs_review" ${row.review_status==='needs_review'?'selected':''}>needs review</option><option value="in_progress" ${row.review_status==='in_progress'?'selected':''}>in progress</option><option value="complete" ${row.review_status==='complete'?'selected':''}>complete</option></select></td><td class="small">H1: ${esc(row.h1_status || 'unchecked')}<br>Title/meta: ${esc(row.title_meta_status || 'unchecked')}<br>Links: ${esc(row.internal_link_status || 'unchecked')}<br>${esc(row.scoring_notes || row.notes || '')}</td><td><textarea data-seo-field="notes" data-id="${esc(row.page_path)}" rows="2">${esc(row.notes || '')}</textarea><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button class="btn small" data-save-seo-review="${esc(row.page_path)}" type="button">Save</button><button class="btn small" data-fix-title-meta="${esc(row.page_path)}" type="button">Fix title/meta</button><button class="btn small" data-mark-seo-complete="${esc(row.page_path)}" type="button">Mark complete</button><button class="btn small" data-queue-seo-bake="${esc(row.page_path)}" type="button">Queue bake</button><button class="btn small" data-add-phrase="${esc(row.page_path)}" type="button">Add phrase</button></div></td></tr>`;
  }
  async function load() {
    mount.innerHTML = '<section class="card"><p class="small">Loading local SEO queue…</p></section>';
    try {
      const [queue, scoring, phrases] = await Promise.all([read(await window.DDAuth.apiFetch('/api/admin/local-seo-review')), read(await window.DDAuth.apiFetch('/api/admin/local-seo-review-scoring')).catch(() => ({ reviews: [] })), read(await window.DDAuth.apiFetch('/api/admin/local-seo-competitor-phrases')).catch(() => ({ phrases: [] }))]);
      const scoreMap = new Map((scoring.reviews || []).map((row) => [row.page_path, row]));
      const phraseMap = new Map(); (phrases.phrases || []).forEach((p) => { if (!phraseMap.has(p.page_path)) phraseMap.set(p.page_path, []); phraseMap.get(p.page_path).push(p); });
      const rows = (queue.reviews || []).map((row) => ({ ...row, ...(scoreMap.get(row.page_path) || {}), competitor_phrases: phraseMap.get(row.page_path) || [] }));
      const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + Number(row.local_seo_score ?? row.score ?? 0), 0) / rows.length) : 0;
      mount.innerHTML = `<section class="card"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><h2 style="margin-top:0">Landing-page review queue</h2><p class="small">${esc(queue.summary?.needs_review || 0)} page(s) still need review • Average score ${esc(average)}%.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="localSeoScoreButton" type="button">Run scoring</button><button class="btn" id="localSeoReloadButton" type="button">Reload</button><a class="btn" href="/api/admin/local-seo-bake-actions?format=json" target="_blank" rel="noopener">Export bake JSON</a></div></div><div class="admin-table-wrap"><table><thead><tr><th>Page/score</th><th>Keyword/locality</th><th>Status</th><th>Checks</th><th>Notes/actions</th></tr></thead><tbody>${rows.map(rowHtml).join('')}</tbody></table></div></section>`;
      document.getElementById('localSeoReloadButton')?.addEventListener('click', load);
      document.getElementById('localSeoScoreButton')?.addEventListener('click', async () => { await read(await window.DDAuth.apiFetch('/api/admin/local-seo-review-scoring', { method: 'POST', body: '{}' })); await load(); });
      mount.querySelectorAll('[data-save-seo-review]').forEach((button) => button.addEventListener('click', () => saveRow(button.getAttribute('data-save-seo-review'))));
      mount.querySelectorAll('[data-fix-title-meta]').forEach((button) => button.addEventListener('click', async () => { const path = button.getAttribute('data-fix-title-meta'); await saveRow(path, { title_meta_status: 'ok', h1_status: 'ok', internal_link_status: 'reviewed', review_status: 'in_progress', notes_suffix: 'Title/meta quick fix reviewed.' }); }));
      mount.querySelectorAll('[data-mark-seo-complete]').forEach((button) => button.addEventListener('click', async () => { const path = button.getAttribute('data-mark-seo-complete'); await saveRow(path, { title_meta_status: 'ok', h1_status: 'ok', internal_link_status: 'ok', review_status: 'complete', notes_suffix: 'Marked complete after review.' }); }));
      mount.querySelectorAll('[data-queue-seo-bake]').forEach((button) => button.addEventListener('click', async () => { const path = button.getAttribute('data-queue-seo-bake'); await read(await window.DDAuth.apiFetch('/api/admin/local-seo-bake-actions', { method: 'POST', body: JSON.stringify({ page_path: path, proposed_title: `Review title for ${path}`, proposed_meta_description: 'Queued from Local SEO Review.', internal_link_notes: 'Bake approved title/meta during deploy.' }) })); await load(); }));
      mount.querySelectorAll('[data-add-phrase]').forEach((button) => button.addEventListener('click', async () => { const path = button.getAttribute('data-add-phrase'); const phrase = prompt('Competitor/local phrase to track for this landing page?'); if (!phrase) return; await read(await window.DDAuth.apiFetch('/api/admin/local-seo-competitor-phrases', { method: 'POST', body: JSON.stringify({ page_path: path, phrase, phrase_kind: 'competitor_phrase' }) })); await load(); }));
    } catch (error) { mount.innerHTML = `<section class="card"><p class="small">${esc(error.message || 'Local SEO queue failed.')}</p></section>`; }
  }
  async function saveRow(page_path, overrides = {}) {
    const payload = { page_path };
    mount.querySelectorAll(`[data-id="${CSS.escape(page_path)}"]`).forEach((field) => { payload[field.getAttribute('data-seo-field')] = field.value; });
    payload.h1_status = overrides.h1_status || 'reviewed'; payload.title_meta_status = overrides.title_meta_status || 'reviewed'; payload.internal_link_status = overrides.internal_link_status || 'reviewed'; payload.review_status = overrides.review_status || payload.review_status || 'in_progress';
    if (overrides.notes_suffix) payload.notes = `${payload.notes || ''}\n${overrides.notes_suffix}`.trim();
    await read(await window.DDAuth.apiFetch('/api/admin/local-seo-review', { method: 'POST', body: JSON.stringify(payload) }));
    await read(await window.DDAuth.apiFetch('/api/admin/local-seo-review-scoring', { method: 'POST', body: '{}' })).catch(() => null);
    await load();
  }
  load();
});
