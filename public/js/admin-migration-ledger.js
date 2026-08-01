// File: /public/js/admin-migration-ledger.js
// Brief description: Admin helper for recording D1 SQL files already applied, so schema work is reviewable and not double-run by accident.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('migrationLedgerAdminMount');
  if (!mount || !window.DDAuth) return;

  mount.innerHTML = `
    <div class="card" id="migration-ledger-card" style="margin-top:18px">
      <h2 style="margin-top:0">D1 Migration Ledger</h2>
      <p class="small">Record SQL files after you run them in Cloudflare D1. This does not run SQL by itself; it prevents mystery schema drift and warns when a migration is already marked applied.</p>
      <div id="migrationLedgerMessage" class="small" style="display:none;margin:10px 0"></div>
      <form id="migrationLedgerForm" class="grid cols-2" style="gap:10px;align-items:end">
        <div><label class="small" for="migrationFileName">SQL file name</label><input id="migrationFileName" name="file_name" type="text" placeholder="database_upgrade_current_pass.sql" required /></div>
        <div><label class="small" for="migrationStatus">Status</label><select id="migrationStatus" name="status"><option value="applied">Applied</option><option value="pending_review">Pending review</option><option value="skipped">Skipped</option><option value="failed">Failed</option></select></div>
        <div><label class="small" for="migrationChecksum">Checksum / note ID</label><input id="migrationChecksum" name="checksum" type="text" placeholder="Optional checksum or copy ID" /></div>
        <div><label class="small"><input id="migrationDestructive" name="destructive" type="checkbox" value="1" /> Destructive or data-changing</label></div>
        <div style="grid-column:1/-1"><label class="small" for="migrationNotes">Notes</label><textarea id="migrationNotes" name="notes" rows="2" placeholder="Where it was run, why, result, D1 console note"></textarea></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;grid-column:1/-1"><button class="btn primary" type="submit">Record migration</button><button class="btn" id="refreshMigrationLedgerButton" type="button">Refresh ledger</button></div>
      </form>
      <div id="migrationLedgerExpected" class="small" style="margin-top:14px"></div>
      <div id="migrationLedgerList" class="small" style="margin-top:12px"></div>
    </div>`;

  const message = mount.querySelector('#migrationLedgerMessage');
  const form = mount.querySelector('#migrationLedgerForm');

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function setMessage(text, isError = false) {
    message.textContent = text || '';
    message.style.display = text ? 'block' : 'none';
    message.style.color = isError ? '#b00020' : '#0a7a2f';
  }

  async function readJson(response, fallbackMessage) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || fallbackMessage);
    return data;
  }

  function statusPill(status) {
    const clean = String(status || 'not_recorded');
    const cls = clean === 'applied' ? 'ok' : (clean === 'failed' ? 'danger' : (clean === 'pending_review' ? 'warn' : 'muted'));
    return `<span class="admin-status-pill ${cls}">${escapeHtml(clean.replace(/_/g, ' '))}</span>`;
  }

  function render(data) {
    const expected = Array.isArray(data.expected_migrations) ? data.expected_migrations : [];
    const ledger = Array.isArray(data.ledger) ? data.ledger : [];
    const summary = data.summary || {};

    mount.querySelector('#migrationLedgerExpected').innerHTML = `
      <div><strong>Status:</strong> ${statusPill(summary.status || 'unknown')} • expected ${escapeHtml(String(Number(summary.expected_migration_count || expected.length || 0)))} • unrecorded ${escapeHtml(String(Number(summary.unrecorded_expected_count || 0)))} • failed ${escapeHtml(String(Number(summary.failed_count || 0)))}</div>
      <div class="admin-table-wrap" style="margin-top:8px"><table><thead><tr><th>Expected SQL</th><th>Purpose</th><th>Status</th></tr></thead><tbody>${expected.map((row) => `
        <tr><td>${escapeHtml(row.file_name || '')}</td><td>${escapeHtml(row.purpose || '')}</td><td>${statusPill(row.status || 'not_recorded')}</td></tr>
      `).join('') || '<tr><td colspan="3">No expected migrations listed.</td></tr>'}</tbody></table></div>`;

    mount.querySelector('#migrationLedgerList').innerHTML = `
      <h3 style="margin:12px 0 6px">Recorded migrations</h3>
      <div class="admin-table-wrap"><table><thead><tr><th>File</th><th>Status</th><th>Applied</th><th>Notes</th></tr></thead><tbody>${ledger.map((row) => `
        <tr><td><strong>${escapeHtml(row.file_name || '')}</strong><div class="small">${escapeHtml(row.migration_key || '')}${row.checksum ? ` • ${escapeHtml(row.checksum)}` : ''}</div></td><td>${statusPill(row.status)}</td><td>${escapeHtml(row.applied_at || '—')}</td><td>${escapeHtml(row.notes || '')}</td></tr>
      `).join('') || '<tr><td colspan="4">No migrations recorded yet.</td></tr>'}</tbody></table></div>`;
  }

  async function loadLedger() {
    try {
      setMessage('Loading migration ledger...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/migration-ledger'), 'Migration ledger endpoint is unavailable.');
      render(data);
      setMessage('Migration ledger loaded.');
    } catch (error) {
      setMessage(error.message || 'Failed to load migration ledger.', true);
    }
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.destructive = form.elements.destructive?.checked ? 1 : 0;
    try {
      setMessage('Recording migration...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/migration-ledger', {
        method: 'POST',
        body: JSON.stringify(payload),
      }), 'Failed to record migration.');
      render({ ...data, expected_migrations: data.summary?.expected || data.expected_migrations || [], ledger: data.ledger || [] });
      setMessage('Migration recorded.');
      form.reset();
      await loadLedger();
    } catch (error) {
      setMessage(error.message || 'Failed to record migration.', true);
    }
  });

  mount.querySelector('#refreshMigrationLedgerButton')?.addEventListener('click', loadLedger);
  loadLedger();
});
