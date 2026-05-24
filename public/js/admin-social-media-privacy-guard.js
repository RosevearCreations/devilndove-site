// File: /public/js/admin-social-media-privacy-guard.js
// Brief description: Operations panel for social media privacy/consent review before publishing job/process posts.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('socialMediaPrivacyGuardAdminMount');
  if (!mount || !window.DDAuth) return;
  function esc(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function num(value) { return Number(value || 0).toLocaleString(); }
  async function readJson(response) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || `Request failed (${response.status})`);
    return data;
  }
  function setMsg(text, isError = false) {
    const el = document.getElementById('socialPrivacyGuardMessage');
    if (!el) return;
    el.textContent = text || '';
    el.style.display = text ? 'block' : 'none';
    el.style.color = isError ? '#b00020' : '#0a7a2f';
  }
  function statusPill(status) {
    const clean = String(status || 'needs_review');
    const cls = ['approved', 'no_private_media'].includes(clean) ? 'ok' : ['blocked', 'do_not_post', 'consent_needed'].includes(clean) ? 'danger' : 'warn';
    return `<span class="admin-status-pill ${cls}">${esc(clean.replace(/_/g, ' '))}</span>`;
  }
  function render(data) {
    const summary = data.summary || {};
    const rules = Array.isArray(data.rules) ? data.rules : [];
    const queue = Array.isArray(data.queue) ? data.queue : [];
    const result = document.getElementById('socialPrivacyGuardResults');
    if (!result) return;
    result.innerHTML = `
      <div class="competitive-summary-grid">
        <div class="metric-card"><strong>${num(summary.open_total)}</strong><span>Open social posts</span></div>
        <div class="metric-card"><strong>${num(summary.needs_review_count)}</strong><span>Privacy review</span></div>
        <div class="metric-card"><strong>${num(summary.approved_count)}</strong><span>Approved/safe</span></div>
        <div class="metric-card"><strong>${num(summary.blocked_count)}</strong><span>Blocked</span></div>
      </div>
      <details open style="margin-top:12px"><summary><strong>Privacy rules</strong></summary>
        <div class="admin-table-wrap"><table><thead><tr><th>Rule</th><th>Status</th><th>Checklist</th></tr></thead><tbody>
          ${rules.map((rule) => `<tr><td><strong>${esc(rule.display_name)}</strong><div class="small">${esc(rule.applies_to || '')}</div></td><td>${statusPill(rule.consent_status)}</td><td>${esc(rule.checklist || rule.notes || '')}</td></tr>`).join('') || '<tr><td colspan="3">No privacy rules loaded.</td></tr>'}
        </tbody></table></div>
      </details>
      <div class="admin-table-wrap" style="margin-top:12px"><table>
        <thead><tr><th>Post</th><th>Images</th><th>Privacy</th><th>Note</th><th>Action</th></tr></thead><tbody>
          ${queue.map((row) => {
            const inferred = row.inferred_privacy || {};
            const current = row.privacy_status || inferred.privacy_status || 'needs_review';
            return `<tr data-social-privacy-row="${esc(row.social_post_queue_id)}">
              <td><strong>${esc(row.title || '')}</strong><div class="small">${esc(row.source_type || '')} · ${esc(row.post_status || '')} · ${esc(row.approval_status || '')}</div><div class="small">${esc(row.summary || '')}</div></td>
              <td>${num((row.image_urls || []).length)}<div class="small">${(row.image_urls || []).slice(0, 2).map((url) => `<code>${esc(url)}</code>`).join('<br>')}</div></td>
              <td><select data-social-privacy-status>
                ${['needs_review','approved','no_private_media','consent_needed','blocked','do_not_post'].map((status) => `<option value="${status}" ${current === status ? 'selected' : ''}>${status.replace(/_/g, ' ')}</option>`).join('')}
              </select><div style="margin-top:6px">${statusPill(current)}</div>
              <label class="small" style="display:block;margin-top:6px"><input type="checkbox" data-social-privacy-customer ${Number(row.customer_media_present || inferred.customer_media_present || 0) ? 'checked' : ''}> customer/private media visible</label>
              <label class="small" style="display:block"><input type="checkbox" data-social-privacy-consent ${Number(row.media_consent_required ?? inferred.media_consent_required ?? 1) ? 'checked' : ''}> consent/review required</label></td>
              <td><textarea rows="3" data-social-privacy-note placeholder="What did we check?">${esc(row.privacy_notes || '')}</textarea></td>
              <td><button class="btn" type="button" data-social-privacy-save>Save review</button></td>
            </tr>`;
          }).join('') || '<tr><td colspan="5">No queued social posts need review.</td></tr>'}
        </tbody></table></div>`;
  }
  async function load() {
    try {
      setMsg('Loading social media privacy guard...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-media-privacy-guard'));
      render(data);
      setMsg('Social media privacy guard loaded.');
    } catch (error) { setMsg(error.message || 'Unable to load privacy guard.', true); }
  }
  async function seedRules() {
    try {
      setMsg('Seeding social privacy rules...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-media-privacy-guard', { method: 'POST', body: JSON.stringify({ action: 'seed_rules' }) }));
      render(data);
      setMsg('Social privacy rules refreshed.');
    } catch (error) { setMsg(error.message || 'Unable to seed privacy rules.', true); }
  }
  async function saveRow(row) {
    const id = Number(row.getAttribute('data-social-privacy-row') || 0);
    const privacyStatus = row.querySelector('[data-social-privacy-status]')?.value || 'needs_review';
    const privacyNotes = row.querySelector('[data-social-privacy-note]')?.value || '';
    const customerMedia = row.querySelector('[data-social-privacy-customer]')?.checked || false;
    const consentRequired = row.querySelector('[data-social-privacy-consent]')?.checked || false;
    try {
      setMsg('Saving privacy review...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-media-privacy-guard', {
        method: 'POST',
        body: JSON.stringify({ action: 'update_queue_privacy', social_post_queue_id: id, privacy_status: privacyStatus, privacy_notes: privacyNotes, customer_media_present: customerMedia, media_consent_required: consentRequired })
      }));
      render(data);
      setMsg('Privacy review saved.');
    } catch (error) { setMsg(error.message || 'Unable to save privacy review.', true); }
  }
  mount.innerHTML = `
    <div class="card" id="social-media-privacy-guard-card" style="margin-top:18px">
      <h2 style="margin-top:0">Social Media Privacy Guard</h2>
      <p class="small">Review crafting/job/process photos before public posting. Use this to block private backgrounds, customer details, faces, addresses, order information, or anything that should not go to Facebook, Instagram, TikTok, X, Pinterest, or YouTube.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn primary" type="button" id="loadSocialPrivacyGuardButton">Load privacy guard</button>
        <button class="btn" type="button" id="seedSocialPrivacyRulesButton">Refresh default rules</button>
        <a class="btn" href="#socialPostQueueAdminMount">Open Social Queue</a>
      </div>
      <div id="socialPrivacyGuardMessage" class="small" style="display:none;margin-top:10px"></div>
      <div id="socialPrivacyGuardResults" style="margin-top:12px"></div>
    </div>`;
  mount.querySelector('#loadSocialPrivacyGuardButton')?.addEventListener('click', load);
  mount.querySelector('#seedSocialPrivacyRulesButton')?.addEventListener('click', seedRules);
  mount.addEventListener('click', (event) => {
    const button = event.target.closest('[data-social-privacy-save]');
    if (!button) return;
    const row = button.closest('[data-social-privacy-row]');
    if (row) saveRow(row);
  });
  load();
});
