// File: /public/js/admin-live-readiness-playbook.js
// Build 193 Command Center panel: detailed, evidence-based live testing instructions.

document.addEventListener('DOMContentLoaded', () => {
  const host = document.getElementById('liveReadinessPlaybookMount');
  if (!host || !window.DDAuth) return;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const arr = (data,key) => Array.isArray(data?.[key]) ? data[key] : [];
  const pill = (value) => `<span class="status-pill status-${esc(String(value || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g,'-'))}">${esc(String(value || 'unknown').replace(/_/g,' '))}</span>`;
  const lines = (value) => esc(value || '').replace(/\n/g,'<br/>');
  let cached = null;

  async function read(response) {
    const raw = await response.text();
    let data={}; try { data = raw ? JSON.parse(raw) : {}; } catch {}
    if (!response.ok || data.ok === false) throw new Error(data.error || 'Live testing playbook request failed.');
    return data;
  }
  async function loadData() {
    return read(await window.DDAuth.apiFetch('/api/admin/live-readiness-playbook'));
  }
  async function post(payload) {
    return read(await window.DDAuth.apiFetch('/api/admin/live-readiness-playbook', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}));
  }
  function downloadText(text, filename) {
    const blob = new Blob([text], {type:'text/markdown;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href=url; link.download=filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function stat(label,value) { return `<article class="value-metric-card"><span>${esc(label)}</span><strong>${Number(value||0)}</strong></article>`; }
  function testCard(row) {
    const statusOptions = ['not_started','in_progress','passed','failed','blocked','needs_review','not_applicable']
      .map((value)=>`<option value="${value}" ${String(row.test_status||'')===value?'selected':''}>${value.replace(/_/g,' ')}</option>`).join('');
    return `<article class="live-test-card" data-test-key="${esc(row.test_key)}">
      <div class="live-test-card-head">
        <div><span class="small">Priority ${Number(row.priority_rank||0)} · ${esc(row.test_area)} · ${esc(row.risk_level)} risk${Number(row.requires_live_binding||0) ? ' · live binding required' : ''}</span><h3>${esc(row.test_label)}</h3></div>
        <div>${pill(row.test_status)}</div>
      </div>
      <p class="small">Route: ${row.target_route ? `<a href="${esc(row.target_route)}">${esc(row.target_route)}</a>` : 'manual check'}</p>
      <details><summary>Detailed test steps</summary><div class="live-test-steps">${lines(row.instructions_markdown)}</div><p><strong>Expected result:</strong> ${esc(row.expected_result)}</p></details>
      <form class="live-test-form">
        <label><span>Status</span><select class="input" name="run_status">${statusOptions}</select></label>
        <label><span>Result summary</span><input class="input" name="result_summary" maxlength="2000" placeholder="What actually happened?"/></label>
        <label><span>Evidence URL or relative path</span><input class="input" name="evidence_url" maxlength="1000" placeholder="/admin/... or https://..."/></label>
        <label><span>Private admin notes</span><textarea class="input" name="notes" rows="2" maxlength="5000" placeholder="Any useful factual follow-up"></textarea></label>
        <button class="btn primary" type="submit">Save test result</button>
      </form>
    </article>`;
  }
  function render(data) {
    cached=data;
    const tests = arr(data,'cases');
    const runs = arr(data,'recent_runs');
    const usage = arr(data,'usage');
    host.innerHTML = `<section class="card build193-header">
      <div class="value-card-head">
        <div><h2>Build 193 — Live readiness and testing playbook</h2><p>These are the remaining checks that must be performed in the deployed Cloudflare environment or on real devices. Each card gives step-by-step instructions, an expected result, and a place to save evidence. Never paste a secret, token, or raw customer data into the notes.</p></div>
        <div class="build191-actions"><button class="btn" id="liveReadinessSeed" type="button">Refresh test cases</button><button class="btn secondary" id="liveReadinessDownload" type="button">Download testing guide</button></div>
      </div>
      <p class="small">Tip: Start with priority 10–50. Items tagged “live binding required” cannot be completed from a local zip.</p>
    </section>
    <section class="value-metric-grid">${stat('Total test cases',data.stats?.total)}${stat('Passed',data.stats?.passed)}${stat('Open',data.stats?.open)}${stat('Failed',data.stats?.failed)}${stat('Live binding tests',data.stats?.live_required)}</section>
    <section class="live-test-grid">${tests.map(testCard).join('') || '<div class="card"><p>No test cases seeded yet.</p></div>'}</section>
    <section class="card"><h2>Recent test evidence</h2><div class="table-wrap"><table class="admin-table"><thead><tr><th>Test</th><th>Status</th><th>Summary</th><th>Evidence</th><th>When</th></tr></thead><tbody>${runs.length ? runs.map((row)=>`<tr><td><code>${esc(row.test_key)}</code></td><td>${pill(row.run_status)}</td><td>${esc(row.result_summary || row.notes || '')}</td><td>${row.evidence_url ? `<a href="${esc(row.evidence_url)}" target="_blank" rel="noopener">Open evidence</a>` : '—'}</td><td>${esc(row.tested_at || '')}</td></tr>`).join('') : '<tr><td colspan="5" class="small">No live test evidence saved yet.</td></tr>'}</tbody></table></div></section>
    <section class="card"><h2>Command Center and legacy-route usage — 30 days</h2><div class="table-wrap"><table class="admin-table"><thead><tr><th>Route</th><th>Events</th><th>Last use</th></tr></thead><tbody>${usage.length ? usage.map((row)=>`<tr><td><code>${esc(row.route_path)}</code></td><td>${Number(row.event_count||0)}</td><td>${esc(row.last_used_at||'')}</td></tr>`).join('') : '<tr><td colspan="3" class="small">Usage events will appear after people use the Command Center and linked routes.</td></tr>'}</tbody></table></div></section>`;
    bind();
  }
  function bind() {
    document.getElementById('liveReadinessSeed')?.addEventListener('click', async()=> {
      try { render(await post({action:'seed_cases'})); } catch (error) { alert(error.message || 'Could not refresh test cases.'); }
    });
    document.getElementById('liveReadinessDownload')?.addEventListener('click', ()=>downloadText(cached?.markdown || '# Live Testing Playbook\n\nNo rows loaded.', 'DEVIL_N_DOVE_LIVE_TESTING_PLAYBOOK.md'));
    host.querySelectorAll('.live-test-form').forEach((form)=>form.addEventListener('submit', async(event)=>{
      event.preventDefault();
      const card=form.closest('[data-test-key]');
      const payload=Object.fromEntries(new FormData(form).entries());
      payload.action='record_run'; payload.test_key=card?.dataset.testKey || '';
      try { render(await post(payload)); } catch (error) { alert(error.message || 'Could not save test result.'); }
    }));
  }
  loadData().then(render).catch((error)=>{
    host.innerHTML=`<section class="card"><p class="status-note danger">${esc(error.message || 'Could not load live readiness playbook.')}</p><p class="small">Confirm the Build 193 D1 migration and Pages Functions deployment.</p></section>`;
  });
});
