// File: /public/js/admin-competitive-roadmap.js
// Brief description: Operations panel for tracking competitive roadmap opportunities from COMPETITIVE.md.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('competitiveRoadmapAdminMount');
  if (!mount || !window.DDAuth) return;

  function esc(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function pill(value) {
    const clean = String(value || 'open');
    const cls = clean === 'done' ? 'ok' : clean === 'blocked' ? 'danger' : clean === 'in_progress' ? 'warn' : 'muted';
    return `<span class="admin-status-pill ${cls}">${esc(clean.replace(/_/g, ' '))}</span>`;
  }
  async function readJson(response) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || `Request failed (${response.status})`);
    return data;
  }
  function setMsg(text, isError = false) {
    const el = document.getElementById('competitiveRoadmapMessage');
    if (!el) return;
    el.textContent = text || '';
    el.style.display = text ? 'block' : 'none';
    el.style.color = isError ? '#b00020' : '#0a7a2f';
  }
  function render(data) {
    const rows = Array.isArray(data.opportunities) ? data.opportunities : [];
    const summary = data.summary || {};
    const result = document.getElementById('competitiveRoadmapResults');
    if (!result) return;
    result.innerHTML = `
      <div class="competitive-summary-grid">
        <div class="metric-card"><strong>${esc(summary.total || 0)}</strong><span>Total</span></div>
        <div class="metric-card"><strong>${esc(summary.high_priority_open || 0)}</strong><span>High-priority open</span></div>
        <div class="metric-card"><strong>${esc(summary.in_progress || 0)}</strong><span>In progress</span></div>
        <div class="metric-card"><strong>${esc(summary.done || 0)}</strong><span>Done</span></div>
      </div>
      <div class="admin-table-wrap" style="margin-top:12px"><table>
        <thead><tr><th>Priority</th><th>Area</th><th>Opportunity</th><th>Status</th><th>Note</th><th>Action</th></tr></thead>
        <tbody>${rows.map((row) => `
          <tr data-competitive-id="${esc(row.competitive_opportunity_id || '')}">
            <td><strong>${esc(row.priority_score || 0)}</strong></td>
            <td>${esc(row.area || '')}</td>
            <td><strong>${esc(row.title || '')}</strong><div class="small">${esc(row.description || '')}</div><div class="small"><em>Next:</em> ${esc(row.suggested_next_step || '')}</div></td>
            <td><select data-competitive-status><option value="open" ${row.status === 'open' ? 'selected' : ''}>open</option><option value="in_progress" ${row.status === 'in_progress' ? 'selected' : ''}>in progress</option><option value="blocked" ${row.status === 'blocked' ? 'selected' : ''}>blocked</option><option value="done" ${row.status === 'done' ? 'selected' : ''}>done</option><option value="ignored" ${row.status === 'ignored' ? 'selected' : ''}>ignored</option></select><div style="margin-top:6px">${pill(row.status)}</div></td>
            <td><textarea data-competitive-note rows="3" placeholder="Admin note / next action">${esc(row.owner_note || '')}</textarea></td>
            <td><button class="btn" data-competitive-save type="button">Save</button></td>
          </tr>`).join('') || '<tr><td colspan="6">No competitive opportunities found.</td></tr>'}</tbody>
      </table></div>
      <details style="margin-top:10px"><summary>Area counts</summary><pre class="small" style="white-space:pre-wrap">${esc(JSON.stringify(summary.areas || {}, null, 2))}</pre></details>`;
  }
  async function load() {
    try {
      setMsg('Loading competitive roadmap...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/competitive-roadmap'));
      render(data);
      setMsg(data.seeded ? `Loaded roadmap and seeded ${data.seeded} missing item(s).` : 'Competitive roadmap loaded.');
    } catch (error) {
      setMsg(error.message || 'Failed to load competitive roadmap.', true);
    }
  }
  async function seedDefaults() {
    try {
      setMsg('Seeding competitive roadmap defaults...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/competitive-roadmap', {
        method: 'POST',
        body: JSON.stringify({ action: 'seed_defaults' })
      }));
      render(data);
      setMsg(`Seed complete. Added ${data.result?.seeded || 0} missing item(s).`);
    } catch (error) { setMsg(error.message || 'Failed to seed roadmap.', true); }
  }
  async function saveRow(row) {
    const id = Number(row.getAttribute('data-competitive-id') || 0);
    const status = row.querySelector('[data-competitive-status]')?.value || 'open';
    const ownerNote = row.querySelector('[data-competitive-note]')?.value || '';
    try {
      setMsg('Saving competitive roadmap item...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/competitive-roadmap', {
        method: 'POST',
        body: JSON.stringify({ action: 'update_status', competitive_opportunity_id: id, status, owner_note: ownerNote })
      }));
      render(data);
      setMsg('Competitive roadmap item saved.');
    } catch (error) { setMsg(error.message || 'Failed to save roadmap item.', true); }
  }

  mount.innerHTML = `
    <div class="card" id="competitive-roadmap-card" style="margin-top:18px">
      <h2 style="margin-top:0">Competitive Roadmap</h2>
      <p class="small">Tracks the biggest website, SEO, product-page, social, mobile, and trust improvements from <code>COMPETITIVE.md</code>. This is a private admin workflow so competitive direction turns into reviewable work instead of getting lost in notes.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn primary" id="loadCompetitiveRoadmapButton" type="button">Load roadmap</button>
        <button class="btn" id="seedCompetitiveRoadmapButton" type="button">Seed defaults</button>
        <a class="btn" href="/COMPETITIVE.md" target="_blank" rel="noopener">Open COMPETITIVE.md</a>
      </div>
      <div id="competitiveRoadmapMessage" class="small" style="display:none;margin-top:10px"></div>
      <div id="competitiveRoadmapResults" style="margin-top:12px"></div>
    </div>`;
  mount.querySelector('#loadCompetitiveRoadmapButton')?.addEventListener('click', load);
  mount.querySelector('#seedCompetitiveRoadmapButton')?.addEventListener('click', seedDefaults);
  mount.addEventListener('click', (event) => {
    const button = event.target.closest('[data-competitive-save]');
    if (!button) return;
    const row = button.closest('[data-competitive-id]');
    if (row) saveRow(row);
  });
  load();
});
