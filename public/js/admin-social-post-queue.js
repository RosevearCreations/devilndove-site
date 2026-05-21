// File: /public/js/admin-social-post-queue.js
// Brief description: Operations admin panel for review-first social posting queue, scheduling,
// dry-run payload previews, caption variants, duplicate warnings, and API publishing when credentials exist.

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
  function warningList(warnings) {
    const list = Array.isArray(warnings) ? warnings : parseJson(warnings, []);
    return list.length ? `<ul class="small social-warning-list">${list.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : '';
  }
  function missingEnvList(row) {
    const list = Array.isArray(row.missing_env) ? row.missing_env : parseJson(row.missing_env_json, []);
    return list.length ? `<div class="small"><strong>Missing:</strong> ${list.map(esc).join(', ')}</div>` : '';
  }
  function publishHint(platforms) {
    const list = Array.isArray(platforms) ? platforms : [];
    if (!list.length) return 'No target platforms selected.';
    return `This will try API publishing for configured platforms (${list.join(', ')}). Future-scheduled posts, duplicate-warning posts, and unapproved posts are blocked unless reviewed first.`;
  }
  function copyText(value) {
    const text = String(value || '');
    if (!text) return;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => setMsg('Copied caption to clipboard.')).catch(() => window.prompt('Copy this caption:', text));
    else window.prompt('Copy this caption:', text);
  }
  function dateTimeLocalValue(value) {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    const pad = (num) => String(num).padStart(2, '0');
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
  }

  function populateTemplateSelect(templates = []) {
    const select = document.getElementById('socialCaptionTemplate');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">Basic caption / no template</option>' + templates.map((row) => `<option value="${esc(row.template_key)}" data-pillar="${esc(row.content_pillar || '')}" data-cta="${esc(row.call_to_action || '')}" data-hashtags="${esc(row.default_hashtags || '')}">${esc(row.display_name || row.template_key)}</option>`).join('');
    if (current && Array.from(select.options).some((option) => option.value === current)) select.value = current;
  }
  function applySelectedTemplateDefaults() {
    const select = document.getElementById('socialCaptionTemplate');
    const option = select?.selectedOptions?.[0];
    if (!option || !option.value) return;
    const pillar = option.getAttribute('data-pillar') || '';
    const cta = option.getAttribute('data-cta') || '';
    const hashtags = option.getAttribute('data-hashtags') || '';
    if (pillar && !document.getElementById('socialContentPillar')?.value) document.getElementById('socialContentPillar').value = pillar;
    if (cta && !document.getElementById('socialCallToAction')?.value) document.getElementById('socialCallToAction').value = cta;
    if (hashtags && document.getElementById('socialPostHashtags')) document.getElementById('socialPostHashtags').value = hashtags.replace(/#/g, '').replace(/\s+/g, ',');
    if (option.value && !document.getElementById('socialUtmCampaign')?.value) document.getElementById('socialUtmCampaign').value = option.value;
  }
  function renderDryRunPreview(payload) {
    const dryRun = payload || {};
    const warnings = Array.isArray(dryRun.media_quality_warnings) ? dryRun.media_quality_warnings : [];
    const items = Array.isArray(dryRun.platform_payloads) ? dryRun.platform_payloads : [];
    if (!items.length && !warnings.length) return '<span class="small">No dry-run preview yet.</span>';
    return `<div class="social-dry-run-preview">
      ${warnings.length ? `<div class="notice warning"><strong>Warnings:</strong>${warningList(warnings)}</div>` : ''}
      ${items.map((item) => `<details><summary>${esc(item.platform)} payload preview ${item.api_ready ? '(API ready)' : '(manual/missing credentials)'}</summary><pre class="small" style="white-space:pre-wrap">${esc(JSON.stringify(item, null, 2))}</pre></details>`).join('')}
    </div>`;
  }
  function render(data) {
    const result = document.getElementById('socialPostQueueResults');
    if (!result) return;
    const summary = data.summary || {};
    const platforms = Array.isArray(data.platforms) ? data.platforms : [];
    const queue = Array.isArray(data.queue) ? data.queue : [];
    const attempts = Array.isArray(data.attempts) ? data.attempts : [];
    const templates = Array.isArray(data.templates) ? data.templates : [];
    const calendar = Array.isArray(data.calendar) ? data.calendar : [];
    populateTemplateSelect(templates);

    result.innerHTML = `
      <div class="release-sanity-summary" style="margin-top:12px">
        <div><strong>${esc(summary.total || 0)}</strong> queued social post(s)</div>
        <div class="small">Open ${esc(summary.open_count || 0)} • Needs review ${esc(summary.needs_review_count || 0)} • Scheduled ${esc(summary.scheduled_count || 0)} • Due ${esc(summary.due_count || 0)} • Duplicate warnings ${esc(summary.duplicate_warning_count || 0)} • Posted ${esc(summary.posted_count || 0)}</div>
      </div>
      <details style="margin-top:12px" open><summary>Platform readiness and credential checklist</summary>
        <div class="admin-table-wrap"><table><thead><tr><th>Platform</th><th>Status</th><th>API ready</th><th>Scopes / notes</th></tr></thead><tbody>
          ${platforms.map((row) => `<tr><td><strong>${esc(row.display_name || row.platform_key)}</strong><br><span class="small">${esc(row.platform_key)}</span></td><td>${esc(row.publish_mode || row.connection_status || '')}</td><td>${Number(row.api_ready || 0) ? '<span class="admin-status-pill good">API ready</span>' : '<span class="admin-status-pill muted">Manual/copy-ready</span>'}</td><td><div class="small">${esc(row.required_scopes || '')}</div><div>${esc(row.notes || '')}</div>${missingEnvList(row)}</td></tr>`).join('') || '<tr><td colspan="4">No platforms seeded yet.</td></tr>'}
        </tbody></table></div>
      </details>
      <details style="margin-top:12px" open><summary>Upcoming content calendar</summary>
        <div class="admin-table-wrap"><table><thead><tr><th>Date</th><th>Total</th><th>Ready</th><th>Posted</th><th>Duplicate warnings</th></tr></thead><tbody>
          ${calendar.map((row) => `<tr><td><strong>${esc(row.calendar_date || '')}</strong></td><td>${esc(row.total || 0)}</td><td>${esc(row.ready_count || 0)}</td><td>${esc(row.posted_count || 0)}</td><td>${Number(row.duplicate_warning_count || 0) ? `<span class="admin-status-pill warning">${esc(row.duplicate_warning_count)} review</span>` : '<span class="small">0</span>'}</td></tr>`).join('') || '<tr><td colspan="5">No upcoming social posts yet.</td></tr>'}
        </tbody></table></div>
      </details>
      <details style="margin-top:12px"><summary>Caption templates</summary>
        <div class="admin-table-wrap"><table><thead><tr><th>Template</th><th>Pillar</th><th>Default hashtags</th><th>Use</th></tr></thead><tbody>
          ${templates.map((row) => `<tr><td><strong>${esc(row.display_name || row.template_key)}</strong><div class="small">${esc(row.notes || '')}</div></td><td>${esc(row.content_pillar || '')}</td><td class="small">${esc(row.default_hashtags || '')}</td><td><button class="btn small" data-social-use-template="${esc(row.template_key)}">Use template</button></td></tr>`).join('') || '<tr><td colspan="4">No caption templates seeded yet.</td></tr>'}
        </tbody></table></div>
      </details>
      <details style="margin-top:12px" open><summary>Queued posts</summary>
        <div class="admin-table-wrap"><table><thead><tr><th>Status</th><th>Post</th><th>Platforms</th><th>Media</th><th>Schedule</th><th>Actions</th></tr></thead><tbody>
          ${queue.map((row) => {
            const images = Array.isArray(row.image_urls) ? row.image_urls : parseJson(row.image_urls_json, []);
            const targetPlatforms = Array.isArray(row.target_platforms) ? row.target_platforms : parseJson(row.target_platforms_json, []);
            const warnings = Array.isArray(row.media_quality_warnings) ? row.media_quality_warnings : parseJson(row.media_quality_warnings_json, []);
            const dryRun = row.dry_run_payload || parseJson(row.dry_run_payload_json, {});
            const duplicate = Number(row.do_not_repost || 0) === 1;
            return `<tr>
              <td><strong>${esc(row.post_status)}</strong><br><span class="small">${esc(row.approval_status)}</span>${duplicate ? '<div class="admin-status-pill danger">possible duplicate</div>' : ''}</td>
              <td><strong>${esc(row.title)}</strong><div class="small">${esc(row.summary || '')}</div>${warningList(warnings)}<details><summary>Caption</summary><pre class="small" style="white-space:pre-wrap">${esc(row.caption || '')}</pre></details><details><summary>Dry-run preview</summary>${renderDryRunPreview(dryRun)}</details></td>
              <td>${platformBadges(targetPlatforms)}</td>
              <td>${images.slice(0, 3).map((url) => `<a href="${esc(url)}" target="_blank" rel="noopener">image</a>`).join(' ') || '<span class="small">No images</span>'}${images.length > 3 ? `<div class="small">+${images.length - 3} more</div>` : ''}</td>
              <td><input type="datetime-local" data-social-schedule-input="${esc(row.social_post_queue_id)}" value="${esc(dateTimeLocalValue(row.scheduled_at))}"><div class="small">${row.scheduled_at ? `Scheduled: ${esc(row.scheduled_at)}` : 'Post now/manual when ready'}</div></td>
              <td><div style="display:flex;gap:6px;flex-wrap:wrap">
                <button class="btn small" data-social-copy="${esc(row.social_post_queue_id)}">Copy caption</button>
                <button class="btn small" data-social-dry-run="${esc(row.social_post_queue_id)}">Dry run</button>
                <button class="btn small" data-social-save-schedule="${esc(row.social_post_queue_id)}">Save schedule</button>
                <button class="btn small" data-social-ready="${esc(row.social_post_queue_id)}">Approve/ready</button>
                ${duplicate ? `<button class="btn small" data-social-clear-duplicate="${esc(row.social_post_queue_id)}">Clear duplicate warning</button>` : ''}
                <button class="btn small primary" data-social-publish="${esc(row.social_post_queue_id)}">Publish APIs</button>
                <button class="btn small" data-social-posted="${esc(row.social_post_queue_id)}">Mark posted</button>
                <button class="btn small danger" data-social-archive="${esc(row.social_post_queue_id)}">Archive</button>
              </div></td>
            </tr>`;
          }).join('') || '<tr><td colspan="6">No social posts queued yet.</td></tr>'}
        </tbody></table></div>
      </details>
      <details style="margin-top:12px"><summary>Recent post attempts</summary><div class="admin-table-wrap"><table><thead><tr><th>Platform</th><th>Status</th><th>URL</th><th>When</th></tr></thead><tbody>
        ${attempts.map((row) => `<tr><td>${esc(row.platform_key)}</td><td>${esc(row.attempt_status)}</td><td>${row.external_post_url ? `<a href="${esc(row.external_post_url)}" target="_blank" rel="noopener">open</a>` : '<span class="small">manual/dry-run</span>'}</td><td>${esc(row.attempted_at || '')}</td></tr>`).join('') || '<tr><td colspan="4">No attempts recorded yet.</td></tr>'}
      </tbody></table></div></details>`;

    result._queueRows = queue;
  }
  async function load() {
    try {
      setMsg('Loading social queue...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-post-queue'));
      render(data);
      setMsg('Social queue loaded. Use Dry run before publishing to see exact platform payloads.');
    } catch (error) { setMsg(error.message || 'Unable to load social queue.', true); }
  }
  function selectedPlatforms() {
    return Array.from(document.querySelectorAll('[data-social-platform]:checked')).map((el) => el.value);
  }
  function platformCaptions() {
    return {
      facebook: document.getElementById('socialFacebookCaption')?.value || '',
      instagram: document.getElementById('socialInstagramCaption')?.value || '',
      tiktok: document.getElementById('socialTikTokCaption')?.value || '',
      x: document.getElementById('socialXCaption')?.value || '',
      youtube: document.getElementById('socialYouTubeCaption')?.value || '',
      pinterest: document.getElementById('socialPinterestCaption')?.value || ''
    };
  }
  async function createPost() {
    try {
      const payload = {
        action: 'create',
        source_type: document.getElementById('socialSourceType')?.value || 'job_update',
        source_id: document.getElementById('socialSourceId')?.value || '',
        title: document.getElementById('socialPostTitle')?.value || '',
        summary: document.getElementById('socialPostSummary')?.value || '',
        caption_template_key: document.getElementById('socialCaptionTemplate')?.value || '',
        content_pillar: document.getElementById('socialContentPillar')?.value || '',
        call_to_action: document.getElementById('socialCallToAction')?.value || '',
        utm_campaign: document.getElementById('socialUtmCampaign')?.value || '',
        image_urls: document.getElementById('socialPostImages')?.value || '',
        video_url: document.getElementById('socialPostVideo')?.value || '',
        link_url: document.getElementById('socialPostLink')?.value || '',
        hashtags: document.getElementById('socialPostHashtags')?.value || '',
        scheduled_at: document.getElementById('socialPostScheduledAt')?.value || '',
        schedule_timezone: document.getElementById('socialPostTimezone')?.value || 'America/Toronto',
        platform_captions: platformCaptions(),
        target_platforms: selectedPlatforms(),
        post_status: document.getElementById('socialReadyNow')?.checked ? 'ready' : 'draft',
        notes: document.getElementById('socialPostNotes')?.value || ''
      };
      if (!payload.title.trim()) throw new Error('Add a title for the social post first.');
      setMsg('Creating social post queue item...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-post-queue', { method: 'POST', body: JSON.stringify(payload) }));
      render(data);
      const warning = data.result?.duplicate_warning ? ' Possible duplicate flagged for review.' : '';
      setMsg(`Social post queued. Review/dry run before posting.${warning}`);
    } catch (error) { setMsg(error.message || 'Unable to create social post.', true); }
  }
  async function previewTemplateCaption() {
    try {
      const payload = {
        action: 'preview_caption_template',
        caption_template_key: document.getElementById('socialCaptionTemplate')?.value || '',
        title: document.getElementById('socialPostTitle')?.value || '',
        summary: document.getElementById('socialPostSummary')?.value || '',
        link_url: document.getElementById('socialPostLink')?.value || '',
        hashtags: document.getElementById('socialPostHashtags')?.value || '',
        call_to_action: document.getElementById('socialCallToAction')?.value || '',
        utm_campaign: document.getElementById('socialUtmCampaign')?.value || '',
        target_platforms: selectedPlatforms()
      };
      if (!payload.caption_template_key) throw new Error('Choose a caption template first.');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-post-queue', { method: 'POST', body: JSON.stringify(payload) }));
      const preview = data.result?.caption || '';
      if (preview) window.prompt('Template caption preview:', preview);
      setMsg('Caption template preview built. Nothing was queued or posted.');
    } catch (error) { setMsg(error.message || 'Unable to preview caption template.', true); }
  }

  async function quickRecentMedia() {
    try {
      setMsg('Generating a social post from recent uploaded media...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-post-queue', { method: 'POST', body: JSON.stringify({ action: 'generate_from_recent_media' }) }));
      render(data);
      setMsg('Recent-media post queued. Review and dry run it before posting.');
    } catch (error) { setMsg(error.message || 'Unable to generate from recent media.', true); }
  }
  async function updateStatus(id, postStatus, approvalStatus, extras = {}) {
    try {
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-post-queue', { method: 'POST', body: JSON.stringify({ action: 'update_status', social_post_queue_id: Number(id), post_status: postStatus, approval_status: approvalStatus, ...extras }) }));
      render(data);
      setMsg('Social post status updated.');
    } catch (error) { setMsg(error.message || 'Unable to update status.', true); }
  }
  async function dryRunApis(id) {
    const results = document.getElementById('socialPostQueueResults');
    const row = (results?._queueRows || []).find((item) => Number(item.social_post_queue_id) === Number(id));
    const platforms = Array.isArray(row?.target_platforms) ? row.target_platforms : parseJson(row?.target_platforms_json, []);
    try {
      setMsg('Building dry-run payload preview...');
      const data = await readJson(await window.DDAuth.apiFetch('/api/admin/social-post-queue', {
        method: 'POST',
        body: JSON.stringify({ action: 'dry_run_platforms', social_post_queue_id: Number(id), platform_keys: platforms })
      }));
      render(data);
      const count = (data.result?.platform_payloads || []).length;
      setMsg(`Dry-run payload preview saved for ${count} platform(s). Nothing was posted.`);
    } catch (error) { setMsg(error.message || 'Unable to dry run social APIs.', true); }
  }
  async function publishApis(id) {
    const results = document.getElementById('socialPostQueueResults');
    const row = (results?._queueRows || []).find((item) => Number(item.social_post_queue_id) === Number(id));
    const platforms = Array.isArray(row?.target_platforms) ? row.target_platforms : parseJson(row?.target_platforms_json, []);
    const message = `${publishHint(platforms)}\n\nRun Dry run first if this is a new platform/token. Continue?`;
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
  async function saveSchedule(id) {
    const input = document.querySelector(`[data-social-schedule-input="${CSS.escape(String(id))}"]`);
    await updateStatus(id, '', '', { scheduled_at: input?.value || '', schedule_timezone: 'America/Toronto' });
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
        <div><h2 style="margin-top:0">Social Posting Queue</h2><p class="small" style="margin:8px 0 0 0">Queue crafting/job photos and summaries for Facebook, Instagram, TikTok, X, YouTube, Pinterest, or manual copy-paste. Approved items can be dry-run, scheduled, and pushed through configured APIs; unconfigured platforms stay manual/copy-ready.</p></div>
        <button class="btn" type="button" id="socialQueueLoadButton">Refresh queue</button>
      </div>
      <div class="social-queue-grid" style="margin-top:12px">
        <label>Source type<select id="socialSourceType"><option value="crafting_process">Crafting process update</option><option value="job_update">Job/process update</option><option value="product_story">Product story</option><option value="workshop_update">Workshop update</option><option value="before_after">Before/after progress</option><option value="event">Event</option><option value="customer_delivery">Customer delivery</option></select></label>
        <label>Optional source/job ID<input id="socialSourceId" placeholder="Example: order/job/product id"></label>
        <label>Post title<input id="socialPostTitle" placeholder="Fresh from the Devil n Dove workshop"></label>
        <label>Related link<input id="socialPostLink" placeholder="https://devilndove.com/... or product URL"></label>
      </div>
      <div class="social-queue-grid" style="margin-top:12px">
        <label>Caption template<select id="socialCaptionTemplate"><option value="">Basic caption / no template</option></select></label>
        <label>Content pillar<input id="socialContentPillar" placeholder="behind_the_scenes, finished_goods, local_presence..."></label>
        <label>Call to action<input id="socialCallToAction" placeholder="Follow along, shop the piece, ask about custom work..."></label>
        <label>UTM campaign<input id="socialUtmCampaign" placeholder="making_story, finished_product, local_market..."></label>
      </div>
      <label style="display:block;margin-top:10px">Summary / behind-the-scenes caption starter<textarea id="socialPostSummary" rows="4" placeholder="What we made, what went right, what went sideways, and why it was fun..."></textarea></label>
      <label style="display:block;margin-top:10px">Image URLs, one per line<textarea id="socialPostImages" rows="3" placeholder="https://assets.devilndove.com/products/..."></textarea></label>
      <div class="social-queue-grid" style="margin-top:12px">
        <label>Video URL, optional<input id="socialPostVideo" placeholder="https://assets.devilndove.com/social/...mp4"></label>
        <label>Schedule date/time<input id="socialPostScheduledAt" type="datetime-local"></label>
        <label>Schedule timezone<input id="socialPostTimezone" value="America/Toronto"></label>
      </div>
      <details style="margin-top:12px"><summary>Optional platform-specific captions</summary>
        <p class="small">Leave blank to use the main caption. X is trimmed shorter automatically.</p>
        <div class="social-queue-grid">
          <label>Facebook caption<textarea id="socialFacebookCaption" rows="3"></textarea></label>
          <label>Instagram caption<textarea id="socialInstagramCaption" rows="3"></textarea></label>
          <label>TikTok caption<textarea id="socialTikTokCaption" rows="3"></textarea></label>
          <label>X caption<textarea id="socialXCaption" rows="3" maxlength="280"></textarea></label>
          <label>YouTube caption<textarea id="socialYouTubeCaption" rows="3"></textarea></label>
          <label>Pinterest caption<textarea id="socialPinterestCaption" rows="3"></textarea></label>
        </div>
      </details>
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
        <button class="btn" type="button" id="socialQueuePreviewTemplateButton">Preview template caption</button>
        <button class="btn" type="button" id="socialQueueRecentMediaButton">Draft from recent media</button><span class="small">API publishing uses Cloudflare environment variables only; secrets are never stored in public files.</span>
      </div>
      <div id="socialPostQueueMessage" class="small" style="display:none;margin-top:10px"></div>
      <div id="socialPostQueueResults"></div>
    </div>`;

  document.getElementById('socialQueueLoadButton')?.addEventListener('click', load);
  document.getElementById('socialQueueCreateButton')?.addEventListener('click', createPost);
  document.getElementById('socialQueuePreviewTemplateButton')?.addEventListener('click', previewTemplateCaption);
  document.getElementById('socialQueueRecentMediaButton')?.addEventListener('click', quickRecentMedia);
  document.getElementById('socialCaptionTemplate')?.addEventListener('change', applySelectedTemplateDefaults);
  mount.addEventListener('click', (event) => {
    const results = document.getElementById('socialPostQueueResults');
    const useTemplateButton = event.target.closest('[data-social-use-template]');
    if (useTemplateButton) {
      const key = useTemplateButton.getAttribute('data-social-use-template') || '';
      const select = document.getElementById('socialCaptionTemplate');
      if (select) { select.value = key; applySelectedTemplateDefaults(); setMsg('Caption template selected. Add a title/summary, then preview or queue.'); }
    }
    const copyButton = event.target.closest('[data-social-copy]');
    if (copyButton) {
      const id = Number(copyButton.getAttribute('data-social-copy'));
      const row = (results?._queueRows || []).find((item) => Number(item.social_post_queue_id) === id);
      copyText(row?.caption || '');
    }
    const dryRunButton = event.target.closest('[data-social-dry-run]');
    if (dryRunButton) dryRunApis(dryRunButton.getAttribute('data-social-dry-run'));
    const scheduleButton = event.target.closest('[data-social-save-schedule]');
    if (scheduleButton) saveSchedule(scheduleButton.getAttribute('data-social-save-schedule'));
    const readyButton = event.target.closest('[data-social-ready]');
    if (readyButton) updateStatus(readyButton.getAttribute('data-social-ready'), 'ready', 'approved');
    const clearDuplicateButton = event.target.closest('[data-social-clear-duplicate]');
    if (clearDuplicateButton && window.confirm('Clear the duplicate warning after reviewing this post?')) updateStatus(clearDuplicateButton.getAttribute('data-social-clear-duplicate'), '', '', { do_not_repost: 0 });
    const publishButton = event.target.closest('[data-social-publish]');
    if (publishButton) publishApis(publishButton.getAttribute('data-social-publish'));
    const postedButton = event.target.closest('[data-social-posted]');
    if (postedButton) markPosted(postedButton.getAttribute('data-social-posted'));
    const archiveButton = event.target.closest('[data-social-archive]');
    if (archiveButton && window.confirm('Archive this queued social post?')) updateStatus(archiveButton.getAttribute('data-social-archive'), 'archived', 'rejected');
  });
  load();
});
