// File: /public/js/admin-social-post-queue.js
// Brief description: Operations admin panel for review-first social posting queue plus API publishing when platform credentials exist.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('socialPostQueueAdminMount');
  if (!mount || !window.DDAuth) return;

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function parseJson(value, fallback) { try { return JSON.parse(value || ''); } catch { return fallback; } }
  async function readJson(response) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || `Request failed (${response.status})`);
    return data;
  }
  function setMsg(message, isError = false) {
    const el = document.getElementById('socialPostQueueMessage');
    if (!el) return;
    el.textContent = message || '';
    el.style.display = message ? 'block' : 'none';
    el.style.color = isError ? '#b00020' : '#0a7a2f';
  }
  function platformBadges(platforms) {
    const list = Array.isArray(platforms) ? platforms : parseJson(platforms, []);
    return list.map((platform) => `<span class="admin-status-pill muted">${esc(platform)}</span>`).join(' ');
  }
  function missingEnvList(row) {
    const list = Array.isArray(row.missing_env) ? row.missing_env : parseJson(row.missing_env_json, []);
    return list.length ? `<div class="small"><strong>Missing:</strong> ${list.map(esc).join(', ')}</div>` : '';
  }
  function publishHint(platforms) {
    const list = Array.isArray(platforms) ? platforms : [];
    if (!list.length) return 'No target platforms selected.';
    return `This will try API publishing for configured platforms (${list.join(', ')}). Platforms without credentials stay manual-ready and get an attempt note.`;
  }
  function copyText(value) {
    const text = String(value || '');
    if (!text) return;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => setMsg('Copied caption to clipboard.')).catch(() => window.prompt('Copy this caption:', text));
    else window.prompt('Copy this caption:', text);
  }
  function render(data) {
    const result = document.getElementById('socialPostQueueResults');
    if (!result) return;
    const summary = data.summary || {};
    const platforms = Array.isArray(data.platforms) ? data.platforms : [];
    const queue = Array.isArray(data.queue) ? data.queue : [];
    const attempts = Array.isArray(data.attempts) ? data.attempts : [];

    result.innerHTML = `
      <div class="release-sanity-summary" style="margin-top:12px">
        <div><strong>${esc(summary.total || 0)}</strong> queued social post(s)</div>
        <div class="small">Open ${esc(summary.open_count || 0)} • Needs review ${esc(summary.needs_review_count || 0)} • Posted ${esc(summary.posted_count || 0)}</div>
      </div>
      <details style="margin-top:12px" open><summary>Platform readiness</summary>
        <div class="admin-table-wrap"><table><thead><tr><th>Platform</th><th>Status</th><th>API ready</th><th>Scopes / notes</th></tr></thead><tbody>
          ${platforms.map((row) => `<tr><td><strong>${esc(row.display_name || row.platform_key)}</strong><br><span class="small">${esc(row.platform_key)}</span></td><td>${esc(row.publish_mode || row.connection_status || '')}</td><td>${Number(row.api_ready || 0) ? '<span class="admin-status-pill good">API ready</span>' : '<span class="admin-status-pill muted">Manual/copy-ready</span>'}</td><td><div class="small">${esc(row.required_scopes || '')}</div><div>${esc(row.notes || '')}</div>${missingEnvList(row)}</td></tr>`).join('') || '<tr><td colspan="4">No platforms seeded yet.</td></tr>'}
        </tbody></table></div>
      </details>
      <details style="margin-top:12px" open><summary>Queued posts</summary>
        <div class="admin-table-wrap"><table><thead><tr><th>Status</th><th>Post</th><th>Platforms</th><th>Media</th><th>Actions</th></tr></thead><tbody>
          ${queue.map((row) => {
            const images = Array.isArray(row.image_urls) ? row.image_urls : parseJson(row.image_urls_json, []);
            const platforms = Array.isArray(row.target_platforms) ? row.target_platforms : parseJson(row.target_platforms_json, []);
            return `<tr>
              <td><strong>${esc(row.post_status)}</strong><br><span class="small">${esc(row.approval_status)}</span></td>
              <td><strong>${esc(row.title)}</strong><div class="small">${esc(row.summary || '')}</div><details><summary>Caption</summary><pre class="small" style="white-space:pre-wrap">${esc(row.caption || '')}</pre></details></td>
              <td>${platformBadges(platforms)}</td>
              <td>${images.slice(0, 3).map((url) => `<a href="${esc(url)}" target="_blank" rel="noopener">image</a>`).join(' ') || '<span class="small">No images</span>'}${images.length > 3 ? `<div class="small">+${images.length - 3} more</div>` : ''}</td>
              <td><div style="display:flex;gap:6px;flex-wrap:wrap">
                <button class="btn small" data-social-copy="${esc(row.social_post_queue_id)}">Copy caption</button>
                <button class="btn small" data-social-ready="${esc(row.social_post_queue_id)}">Approve/ready</button>
                <button class="btn small primary" data-social-publish="${esc(row.social_post_queue_id)}">Publish APIs</button>
                <button class="btn small" data-social-posted="${esc(row.social_post_queue_id)}">Mark posted</button>
                <button class="btn small danger" data-social-archive="${esc(row.social_post_queue_id)}">Archive</button>
              </div></td>
            </tr>`;
          }).join('') || '<tr><td colspan="5">No social posts queued yet.</td></tr>'}
        </tbody></table></div>
      </details>
      <details style="margin-top:12px"><summary>Recent post attempts</summary><div class="admin-table-wrap"><table><thead><tr><th>Platform</th><th>Status</th><th>URL</th><th>When</th></tr></thead><tbody>
        ${attempts.map((row) => `<tr><td>${esc(row.platform_key)}</td><td>${esc(row.attempt_status)}</td><td>${row.external_post_url ? `<a href="${esc(row.external_post_url)}" target="_blank" rel="noopener">open</a>` : '<span class="small">manual-ready</span>'}</td><td>${esc(row.attempted_at || '')}</td></tr>`).join('') || '<tr><td colspan="4">No attempts recorded yet.</td></tr>'}
      </tbody></table></div></details>`;

    result._queueRows = queue;
  }
  async function load() {
    try {
      setMsg('Loading social queue...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-post-queue'));
      render(data);
      setMsg('Social queue loaded.');
    } catch (error) { setMsg(error.message || 'Unable to load social queue.', true); }
  }
  function selectedPlatforms() {
    return Array.from(document.querySelectorAll('[data-social-platform]:checked')).map((el) => el.value);
  }
  async function createPost() {
    try {
      const payload = {
        action: 'create',
        source_type: document.getElementById('socialSourceType')?.value || 'job_update',
        source_id: document.getElementById('socialSourceId')?.value || '',
        title: document.getElementById('socialPostTitle')?.value || '',
        summary: document.getElementById('socialPostSummary')?.value || '',
        image_urls: document.getElementById('socialPostImages')?.value || '',
        link_url: document.getElementById('socialPostLink')?.value || '',
        hashtags: document.getElementById('socialPostHashtags')?.value || '',
        target_platforms: selectedPlatforms(),
        post_status: document.getElementById('socialReadyNow')?.checked ? 'ready' : 'draft',
        notes: document.getElementById('socialPostNotes')?.value || ''
      };
      if (!payload.title.trim()) throw new Error('Add a title for the social post first.');
      setMsg('Creating social post queue item...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-post-queue', { method: 'POST', body: JSON.stringify(payload) }));
      render(data);
      setMsg('Social post queued. Review/copy before posting.');
    } catch (error) { setMsg(error.message || 'Unable to create social post.', true); }
  }
  async function quickRecentMedia() {
    try {
      setMsg('Generating a social post from recent uploaded media...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-post-queue', { method: 'POST', body: JSON.stringify({ action: 'generate_from_recent_media' }) }));
      render(data);
      setMsg('Recent-media post queued. Review it before posting.');
    } catch (error) { setMsg(error.message || 'Unable to generate from recent media.', true); }
  }
  async function updateStatus(id, postStatus, approvalStatus) {
    try {
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-post-queue', { method: 'POST', body: JSON.stringify({ action: 'update_status', social_post_queue_id: Number(id), post_status: postStatus, approval_status: approvalStatus }) }));
      render(data);
      setMsg('Social post status updated.');
    } catch (error) { setMsg(error.message || 'Unable to update status.', true); }
  }
  async function publishApis(id) {
    const results = document.getElementById('socialPostQueueResults');
    const row = (results?._queueRows || []).find((item) => Number(item.social_post_queue_id) === Number(id));
    const platforms = Array.isArray(row?.target_platforms) ? row.target_platforms : parseJson(row?.target_platforms_json, []);
    const message = `${publishHint(platforms)}\n\nApprove the post first. Continue?`;
    if (!window.confirm(message)) return;
    try {
      setMsg('Attempting configured social API publishing...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-post-queue', {
        method: 'POST',
        body: JSON.stringify({ action: 'publish_platforms', social_post_queue_id: Number(id), platform_keys: platforms })
      }));
      render(data);
      const summary = (data.result?.results || []).map((item) => `${item.platform}: ${item.status}`).join(' • ');
      setMsg(summary ? `Publish attempts recorded: ${summary}` : 'Publish attempts recorded.');
    } catch (error) { setMsg(error.message || 'Unable to publish via APIs.', true); }
  }
  async function markPosted(id) {
    const platform = window.prompt('Which platform was posted? facebook, instagram, tiktok, x, youtube, or pinterest:', 'facebook');
    if (!platform) return;
    const url = window.prompt('Paste the public post URL if available, or leave blank:', '');
    try {
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-post-queue', { method: 'POST', body: JSON.stringify({ action: 'record_manual_post', social_post_queue_id: Number(id), platform_key: platform, external_post_url: url }) }));
      render(data);
      setMsg('Manual post recorded.');
    } catch (error) { setMsg(error.message || 'Unable to record manual post.', true); }
  }

  mount.innerHTML = `
    <div class="card social-post-queue-admin-panel" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h2 style="margin-top:0">Social Posting Queue</h2><p class="small" style="margin:8px 0 0 0">Queue crafting/job photos and summaries for Facebook, Instagram, TikTok, X, YouTube, Pinterest, or manual copy-paste. Approved items can be pushed through configured APIs; unconfigured platforms stay manual/copy-ready.</p></div>
        <button class="btn" type="button" id="socialQueueLoadButton">Refresh queue</button>
      </div>
      <div class="social-queue-grid" style="margin-top:12px">
        <label>Source type<select id="socialSourceType"><option value="crafting_process">Crafting process update</option><option value="job_update">Job/process update</option><option value="product_story">Product story</option><option value="workshop_update">Workshop update</option><option value="before_after">Before/after progress</option><option value="event">Event</option><option value="customer_delivery">Customer delivery</option></select></label>
        <label>Optional source/job ID<input id="socialSourceId" placeholder="Example: order/job/product id"></label>
        <label>Post title<input id="socialPostTitle" placeholder="Fresh from the Devil n Dove workshop"></label>
        <label>Related link<input id="socialPostLink" placeholder="https://devilndove.com/... or product URL"></label>
      </div>
      <label style="display:block;margin-top:10px">Summary / behind-the-scenes caption starter<textarea id="socialPostSummary" rows="4" placeholder="What we made, what went right, what went sideways, and why it was fun..."></textarea></label>
      <label style="display:block;margin-top:10px">Image URLs, one per line<textarea id="socialPostImages" rows="3" placeholder="https://assets.devilndove.com/products/..."></textarea></label>
      <div class="social-queue-platforms" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px">
        ${['facebook','instagram','tiktok','x','youtube','pinterest'].map((platform) => `<label class="small"><input type="checkbox" data-social-platform value="${platform}" ${['facebook','instagram','tiktok','x'].includes(platform) ? 'checked' : ''}> ${platform}</label>`).join('')}
      </div>
      <div class="social-queue-grid" style="margin-top:12px">
        <label>Hashtags<input id="socialPostHashtags" value="DevilnDove,HandmadeOntario,WorkshopMade,SmallBusinessCanada"></label>
        <label>Notes<input id="socialPostNotes" placeholder="Internal note, reminder, or platform caution"></label>
      </div>
      <label class="small" style="display:block;margin-top:10px"><input type="checkbox" id="socialReadyNow"> Mark as approved/ready immediately</label>
      <div class="dd-product-draft-media-actions" style="margin-top:10px">
        <button class="btn primary" type="button" id="socialQueueCreateButton">Queue social post</button>
        <button class="btn" type="button" id="socialQueueRecentMediaButton">Draft from recent media</button><span class="small">API publishing uses Cloudflare environment variables only; secrets are never stored in public files.</span>
      </div>
      <div id="socialPostQueueMessage" class="small" style="display:none;margin-top:10px"></div>
      <div id="socialPostQueueResults"></div>
    </div>`;

  document.getElementById('socialQueueLoadButton')?.addEventListener('click', load);
  document.getElementById('socialQueueCreateButton')?.addEventListener('click', createPost);
  document.getElementById('socialQueueRecentMediaButton')?.addEventListener('click', quickRecentMedia);
  mount.addEventListener('click', (event) => {
    const results = document.getElementById('socialPostQueueResults');
    const copyButton = event.target.closest('[data-social-copy]');
    if (copyButton) {
      const id = Number(copyButton.getAttribute('data-social-copy'));
      const row = (results?._queueRows || []).find((item) => Number(item.social_post_queue_id) === id);
      copyText(row?.caption || '');
    }
    const readyButton = event.target.closest('[data-social-ready]');
    if (readyButton) updateStatus(readyButton.getAttribute('data-social-ready'), 'ready', 'approved');
    const publishButton = event.target.closest('[data-social-publish]');
    if (publishButton) publishApis(publishButton.getAttribute('data-social-publish'));
    const postedButton = event.target.closest('[data-social-posted]');
    if (postedButton) markPosted(postedButton.getAttribute('data-social-posted'));
    const archiveButton = event.target.closest('[data-social-archive]');
    if (archiveButton && window.confirm('Archive this queued social post?')) updateStatus(archiveButton.getAttribute('data-social-archive'), 'archived', 'rejected');
  });
  load();
});
