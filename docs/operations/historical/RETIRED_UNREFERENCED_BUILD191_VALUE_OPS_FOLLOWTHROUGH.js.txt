// File: /public/js/admin-value-ops-followthrough.js
// Build 191 integrated follow-through panels for the existing Admin Command Center.

document.addEventListener('DOMContentLoaded', () => {
  const host = document.getElementById('valueOpsFollowthroughMount');
  if (!host || !window.DDAuth) return;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const money = (value) => new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(value || 0) / 100);
  const statusClass = (value) => String(value || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g,'-');
  const pill = (value) => `<span class="status-pill status-${esc(statusClass(value))}">${esc(String(value || 'unknown').replace(/_/g,' '))}</span>`;
  const array = (data, key) => Array.isArray(data?.[key]) ? data[key] : [];
  const table = (headers, rows, empty='No rows yet.') => `<div class="table-wrap"><table class="admin-table"><thead><tr>${headers.map((h)=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}" class="small">${esc(empty)}</td></tr>`}</tbody></table></div>`;

  let state = { q:'' };

  async function read(response) {
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch {}
    if (!response.ok || data?.ok === false) throw new Error(data?.error || 'Build 191 request failed.');
    return data;
  }
  async function loadData() {
    const params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    return read(await window.DDAuth.apiFetch(`/api/admin/value-ops-followthrough?${params}`));
  }
  async function post(payload) {
    return read(await window.DDAuth.apiFetch('/api/admin/value-ops-followthrough', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    }));
  }
  function notify(message, isError=false) {
    const node = document.getElementById('build191Message');
    if (!node) return;
    node.textContent = message;
    node.className = `status-note ${isError ? 'danger' : 'success'}`;
    node.hidden = false;
  }
  function summaryCards(data) {
    const summary = data.current_owner_summary || {};
    const cards = [
      ['Active products',summary.products_active],
      ['Draft products',summary.products_draft],
      ['Open orders',summary.orders_open],
      ['Margin warnings',summary.margin_warnings],
      ['Media waiting',summary.media_waiting],
      ['GBP tasks open',summary.gbp_tasks_open],
      ['Review requests pending',summary.review_requests_pending],
      ['Campaign checks open',summary.campaign_checks_open],
      ['Device QA open',summary.device_qa_open]
    ];
    return cards.map(([label,value])=>`<article class="value-metric-card"><span>${esc(label)}</span><strong>${Number(value||0)}</strong></article>`).join('');
  }
  function envRows(data) {
    const env = data.environment_status || {};
    return [
      ['D1 database',env.d1],['R2 media',env.r2],['Stripe',env.stripe],
      ['Stripe webhook',env.stripe_webhook],['Email provider',env.email_provider],
      ['Cloudflare API',env.cloudflare_api],['Public URL',env.public_site_url],['Session secret',env.session_secret]
    ].map(([label,value])=>`<tr><td>${esc(label)}</td><td>${pill(value === 'manual' ? 'manual' : value ? 'configured' : 'missing')}</td></tr>`).join('');
  }
  function feeRows(data) {
    return array(data,'fee_settings').map((row)=>`<tr>
      <td>${esc(row.channel_label)}<div class="small"><code>${esc(row.channel_key)}</code></div></td>
      <td>${Number(row.percent_rate||0).toFixed(3)}%</td><td>${money(row.fixed_fee_cents)}</td>
      <td>${Number(row.payment_percent_rate||0).toFixed(3)}% + ${money(row.payment_fixed_fee_cents)}</td>
      <td>${Number(row.advertising_percent_rate||0).toFixed(3)}%</td>
      <td>${pill(row.calculation_status)}</td><td>${esc(row.source_note||'')}</td>
      <td><button class="btn small" data-edit-fee="${esc(row.channel_key)}" type="button">Edit</button></td>
    </tr>`).join('');
  }
  function costRows(data) {
    return array(data,'cost_defaults').map((row)=>`<tr>
      <td>${esc(row.family_label)}<div class="small"><code>${esc(row.family_key)}</code></div></td>
      <td>${money(row.material_cost_cents)}</td><td>${Number(row.labour_minutes||0)} min</td>
      <td>${money(row.labour_rate_cents_per_hour)}/hr</td><td>${money(row.packaging_cost_cents)}</td>
      <td>${Number(row.overhead_percent||0).toFixed(1)}%</td><td>${Number(row.waste_percent||0).toFixed(1)}%</td>
      <td>${pill(row.calculation_status)}</td><td><button class="btn small" data-edit-cost="${esc(row.family_key)}" type="button">Edit</button></td>
    </tr>`).join('');
  }
  function overrideRows(data) {
    return array(data,'margin_overrides').map((row)=>`<tr>
      <td>${Number(row.product_id||0)}</td><td>${esc(row.channel_key)}</td><td>${pill(row.margin_status)}</td>
      <td>${esc(row.requested_reason||'')}</td><td>${pill(row.approval_status)}</td><td>${esc(row.expires_at||'')}</td>
      <td>${row.approval_status==='pending' ? `<button class="btn small" data-approve-override="${Number(row.marketplace_margin_override_history_id||0)}" type="button">Approve</button>` : ''}</td>
    </tr>`).join('');
  }
  function customerNoteRows(data) {
    return array(data,'customer_notes').map((row)=>`<tr>
      <td>${esc(row.customer_email||row.customer_key)}</td><td>${esc(row.note_text)}</td>
      <td>${esc(row.visibility_scope)}</td><td>${esc(row.created_at||'')}</td>
    </tr>`).join('');
  }
  function storyRows(data) {
    return array(data,'story_outputs').map((row)=>`<tr>
      <td>${esc(row.product_story_title||'Untitled')}</td><td>${pill(row.output_status)}</td>
      <td>${row.consent_evidence_url ? `<a href="${esc(row.consent_evidence_url)}" target="_blank" rel="noopener">Evidence</a>` : pill('missing_evidence')}</td>
      <td><details><summary>Draft outputs</summary><p><strong>Product story</strong><br>${esc(row.product_story_body||'')}</p><p><strong>Trust block</strong><br>${esc(row.trust_block_body||'')}</p><p><strong>Gallery</strong><br>${esc(row.gallery_caption||'')}</p><p><strong>Social</strong><br>${esc(row.social_snippet||'')}</p></details></td>
    </tr>`).join('');
  }
  function mappingRows(data) {
    return array(data,'search_console_mapping_previews').map((row)=>`<tr>
      <td>${esc(row.source_file||'')}</td><td>${pill(row.validation_status)}</td>
      <td><code>${esc(JSON.stringify(row.mapping||{}))}</code></td><td>${esc(row.validation_notes||'')}</td>
      <td><details><summary>Samples</summary><pre>${esc(JSON.stringify(row.sample_rows||[],null,2))}</pre></details></td>
    </tr>`).join('');
  }
  function gbpRows(data) {
    return array(data,'gbp_tasks').map((row)=>`<tr>
      <td>${esc(row.task_month)}</td><td>${esc(row.task_label)}</td><td><code>${esc(row.page_path||'')}</code></td>
      <td>${pill(row.task_status)}</td><td>${esc(row.evidence_url||'')}</td>
      <td>${row.task_status!=='completed' ? `<button class="btn small" data-complete-gbp="${Number(row.gbp_monthly_task_reminder_id||0)}" type="button">Complete</button>` : ''}</td>
    </tr>`).join('');
  }
  function reviewRows(data) {
    return array(data,'review_eligibility').map((row)=>`<tr>
      <td>${Number(row.order_id||0)}</td><td>${esc(row.customer_email||'')}</td><td>${pill(row.order_status)}</td>
      <td>${pill(row.payment_status)}</td><td>${pill(row.eligibility_status)}</td><td>${pill(row.permission_status)}</td>
      <td>${esc(row.exclusion_reason||'')}</td><td>${esc(row.eligible_after||'')}</td>
    </tr>`).join('');
  }
  function galleryRows(data) {
    return array(data,'gallery_items').map((row)=>`<tr>
      <td>${esc(row.gallery_label)}</td><td>${pill(row.proof_kind)}</td><td><code>${esc(row.route_context)}</code></td>
      <td>${pill(row.consent_status)}</td><td>${pill(row.public_use_status)}</td><td>${pill(row.approval_status)}</td>
      <td>${row.before_image_url ? `<a href="${esc(row.before_image_url)}" target="_blank" rel="noopener">Before</a>` : '—'} / ${row.after_image_url ? `<a href="${esc(row.after_image_url)}" target="_blank" rel="noopener">After</a>` : '—'}</td>
      <td>${row.approval_status!=='approved' ? `<button class="btn small" data-approve-gallery="${Number(row.approved_before_after_gallery_item_id||0)}" type="button">Approve</button>` : ''}</td>
    </tr>`).join('');
  }
  function roleRows(data) {
    return array(data,'image_roles').map((row)=>`<tr><td>${esc(row.family_key)}</td><td>${esc(row.role_label)}</td>
      <td>${Number(row.minimum_count||0)}</td><td>${row.is_publish_blocker ? pill('publish_blocker') : pill('recommended')}</td>
      <td>${esc(row.phone_prompt||'')}</td><td>${esc(row.desktop_prompt||'')}</td></tr>`).join('');
  }
  function mobileRows(data) {
    return array(data,'mobile_server_drafts').map((row)=>`<tr><td><code>${esc(row.draft_key)}</code></td>
      <td>${esc(row.device_key||'')}</td><td>${Number(row.field_count||0)}</td><td>${Number(row.image_count||0)}</td>
      <td>${pill(row.sync_status)}</td><td>${esc(row.client_saved_at||row.updated_at||'')}</td></tr>`).join('');
  }
  function perfRows(data) {
    return array(data,'performance_measurements').map((row)=>`<tr><td><code>${esc(row.route_path)}</code></td>
      <td>${esc(row.device_profile)}</td><td>${row.performance_score ?? '—'}</td><td>${row.accessibility_score ?? '—'}</td>
      <td>${row.seo_score ?? '—'}</td><td>${row.largest_contentful_paint_ms ? `${Number(row.largest_contentful_paint_ms)} ms` : '—'}</td>
      <td>${row.cumulative_layout_shift ?? '—'}</td><td>${row.total_transfer_bytes ? `${Math.round(Number(row.total_transfer_bytes)/1024)} KB` : '—'}</td></tr>`).join('');
  }
  function responsiveRows(data) {
    return array(data,'responsive_image_jobs').map((row)=>`<tr><td><code>${esc(row.source_image_url)}</code></td>
      <td>${esc(row.route_context||'')}</td><td>${esc(row.target_widths_json)}</td><td>${pill(row.job_status)}</td>
      <td>${esc(row.srcset_value||'')}</td></tr>`).join('');
  }
  function campaignRows(data) {
    return array(data,'campaign_checks').map((row)=>`<tr><td>${esc(row.campaign_key)}</td><td>${esc(row.check_label)}</td>
      <td>${pill(row.check_status)}</td><td>${esc(row.evidence_url||'')}</td>
      <td><button class="btn small" data-pass-campaign="${Number(row.campaign_readiness_check_row_id||0)}" data-campaign="${esc(row.campaign_key)}" data-check="${esc(row.check_key)}" data-label="${esc(row.check_label)}" type="button">Mark passed</button></td></tr>`).join('');
  }
  function freshnessRows(data) {
    return array(data,'local_freshness').map((row)=>`<tr><td><code>${esc(row.page_path)}</code></td>
      <td>${esc(row.last_product_proof_at||'—')}</td><td>${esc(row.last_customer_proof_at||'—')}</td>
      <td>${esc(row.last_gbp_observation_month||'—')}</td><td>${pill(row.freshness_status)}</td><td>${esc(row.next_review_at||'')}</td></tr>`).join('');
  }
  function qaRows(data) {
    return array(data,'device_qa').map((row)=>`<tr><td><code>${esc(row.route_path)}</code></td><td>${esc(row.device_label)}</td>
      <td>${Number(row.viewport_width||0)}×${Number(row.viewport_height||0)}</td><td>${esc(row.browser_label||'')}</td>
      <td>${pill(row.theme_mode)}</td><td>${pill(row.qa_status)}</td><td>${row.screenshot_url ? `<a href="${esc(row.screenshot_url)}" target="_blank" rel="noopener">Screenshot</a>` : '—'}</td><td>${esc(row.issue_summary||'')}</td></tr>`).join('');
  }
  function render(data) {
    host.innerHTML = `
      <section class="card build191-header">
        <div class="value-card-head"><div><h2>Build 191 value-operations follow-through</h2><p class="small">Turns Build 190 review rows into configurable fees, costs, approval gates, real-data imports, server-backed mobile recovery, public-proof review, owner exports, device QA, and environment verification.</p></div>${pill(data.build_label)}</div>
        <div id="build191Message" hidden></div>
        <div class="value-metric-grid">${summaryCards(data)}</div>
        <div class="inline-form build191-actions">
          <button class="btn" id="build191OwnerSummary" type="button">Generate Owner Daily summary</button>
          <button class="btn secondary" id="build191ReviewEligibility" type="button">Refresh review eligibility</button>
          <button class="btn secondary" id="build191Freshness" type="button">Refresh local freshness</button>
          <button class="btn secondary" id="build191Environment" type="button">Verify environment settings</button>
        </div>
      </section>
      <section class="card"><h2>Live environment verification</h2>${table(['Service','Configuration status'],envRows(data),'No checks.')}</section>
      <section class="card"><h2>Channel-specific fee settings</h2><p class="small">Enter actual account-specific rates. Zero/default values remain blocked from automatic margin decisions.</p>
        ${table(['Channel','Base %','Fixed','Payment','Ads','Status','Source note','Action'],feeRows(data))}
        <form id="build191FeeForm" class="value-form-grid">
          <input name="channel_key" placeholder="etsy" required><input name="channel_label" placeholder="Etsy" required>
          <input name="percent_rate" type="number" step="0.001" min="0" placeholder="Base %">
          <input name="fixed_fee_cents" type="number" min="0" placeholder="Fixed fee cents">
          <input name="payment_percent_rate" type="number" step="0.001" min="0" placeholder="Payment %">
          <input name="payment_fixed_fee_cents" type="number" min="0" placeholder="Payment fixed cents">
          <input name="advertising_percent_rate" type="number" step="0.001" min="0" placeholder="Ads %">
          <select name="calculation_status"><option value="reviewed">Reviewed</option><option value="needs_configuration">Needs configuration</option></select>
          <input name="source_note" placeholder="Source/date/account plan"><button class="btn" type="submit">Save fee setting</button>
        </form>
      </section>
      <section class="card"><h2>Product-family cost defaults</h2>${table(['Family','Materials','Labour','Hourly','Packaging','Overhead','Waste','Status','Action'],costRows(data))}
        <form id="build191CostForm" class="value-form-grid">
          <input name="family_key" placeholder="jewelry" required><input name="family_label" placeholder="Jewelry" required>
          <input name="material_cost_cents" type="number" min="0" placeholder="Materials cents">
          <input name="labour_minutes" type="number" min="0" placeholder="Labour minutes">
          <input name="labour_rate_cents_per_hour" type="number" min="0" placeholder="Hourly cents">
          <input name="packaging_cost_cents" type="number" min="0" placeholder="Packaging cents">
          <input name="overhead_percent" type="number" step="0.1" min="0" placeholder="Overhead %">
          <input name="waste_percent" type="number" step="0.1" min="0" placeholder="Waste %">
          <select name="calculation_status"><option value="reviewed">Reviewed</option><option value="needs_configuration">Needs configuration</option></select>
          <button class="btn" type="submit">Save cost default</button>
        </form>
      </section>
      <section class="card"><h2>Marketplace margin override history</h2>${table(['Product','Channel','Margin','Reason','Approval','Expires','Action'],overrideRows(data))}
        <form id="build191OverrideForm" class="value-form-grid"><input name="product_id" type="number" min="1" placeholder="Product ID" required>
          <input name="channel_key" placeholder="etsy" required><input name="requested_reason" placeholder="Business reason" required>
          <input name="expires_at" type="date"><button class="btn" type="submit">Request override</button></form>
      </section>
      <section class="card"><h2>Customer timeline private notes</h2>
        <form id="build191CustomerSearch" class="inline-form"><input name="q" value="${esc(state.q)}" placeholder="Search email or note"><button class="btn secondary" type="submit">Search</button></form>
        ${table(['Customer','Private note','Visibility','Created'],customerNoteRows(data))}
        <form id="build191CustomerNoteForm" class="value-form-grid"><input name="customer_email" type="email" placeholder="customer@example.com" required><textarea name="note_text" placeholder="Private admin note" required></textarea><button class="btn" type="submit">Add private note</button></form>
      </section>
      <section class="card"><h2>Customer-story multi-output drafts</h2>${table(['Title','Status','Consent evidence','Outputs'],storyRows(data))}
        <form id="build191StoryForm" class="value-form-grid"><input name="story_title" placeholder="Story title"><textarea name="story_summary" placeholder="Approved source summary" required></textarea><input name="consent_evidence_url" placeholder="Consent evidence URL"><input name="product_id" type="number" min="1" placeholder="Product ID"><button class="btn" type="submit">Generate four review drafts</button></form>
      </section>
      <section class="card"><h2>Search Console CSV mapping preview</h2><p class="small">Google exports can include query, page, date, clicks, impressions, CTR, and position files. Preview headers and sample rows before import.</p>
        ${table(['File','Status','Suggested mapping','Notes','Samples'],mappingRows(data))}
        <form id="build191SearchConsoleForm"><div class="value-form-grid"><input name="source_file" placeholder="Queries.csv"><textarea name="csv_text" rows="7" placeholder="Paste CSV with header row" required></textarea><button class="btn" type="submit">Preview mapping</button></div></form>
      </section>
      <section class="card"><h2>Monthly Google Business Profile tasks</h2>${table(['Month','Task','Page','Status','Evidence','Action'],gbpRows(data))}</section>
      <section class="card"><h2>Review-request eligibility</h2><p class="small">Eligibility never means permission. Fulfilled/paid orders still require cooldown, exclusions, and human approval.</p>${table(['Order','Customer','Order','Payment','Eligibility','Permission','Exclusion','Eligible after'],reviewRows(data))}</section>
      <section class="card"><h2>Approved before/after and process gallery</h2>${table(['Item','Kind','Route','Consent','Public use','Approval','Images','Action'],galleryRows(data))}
        <form id="build191GalleryForm" class="value-form-grid"><input name="gallery_key" placeholder="engraved-sign-before-after" required><input name="gallery_label" placeholder="Engraved sign before and after" required><input name="before_image_url" placeholder="Before image URL"><input name="after_image_url" placeholder="After image URL"><input name="process_image_url" placeholder="Process image URL"><input name="alt_text" placeholder="Descriptive alt text"><textarea name="story_note" placeholder="Visible proof story"></textarea><select name="consent_status"><option value="needs_review">Consent needs review</option><option value="approved">Consent approved</option></select><select name="public_use_status"><option value="needs_review">Public use needs review</option><option value="approved">Public use approved</option></select><button class="btn" type="submit">Save gallery candidate</button></form>
      </section>
      <section class="card"><h2>Product image-role prompts</h2>${table(['Family','Role','Minimum','Gate','Phone prompt','Desktop prompt'],roleRows(data))}</section>
      <section class="card"><h2>Server-backed mobile draft recovery</h2>${table(['Draft key','Device','Fields','Images','Status','Saved'],mobileRows(data),'No server drafts yet. Use Mobile Product Add to create one.')}</section>
      <section class="card"><h2>Deployed performance evidence</h2>${table(['Route','Device','Performance','Accessibility','SEO','LCP','CLS','Transfer'],perfRows(data))}
        <form id="build191PerformanceForm" class="value-form-grid"><input name="route_path" placeholder="/shop/" required><input name="measured_url" placeholder="https://devilndove.com/shop/"><select name="device_profile"><option value="mobile">Mobile</option><option value="desktop">Desktop</option></select><input name="performance_score" type="number" min="0" max="100" placeholder="Performance"><input name="accessibility_score" type="number" min="0" max="100" placeholder="Accessibility"><input name="seo_score" type="number" min="0" max="100" placeholder="SEO"><input name="largest_contentful_paint_ms" type="number" min="0" placeholder="LCP ms"><input name="cumulative_layout_shift" type="number" step="0.001" min="0" placeholder="CLS"><input name="total_transfer_bytes" type="number" min="0" placeholder="Transfer bytes"><button class="btn" type="submit">Import measurement</button></form>
      </section>
      <section class="card"><h2>Responsive image derivative queue</h2>${table(['Source','Route','Widths','Status','srcset'],responsiveRows(data))}
        <form id="build191ResponsiveForm" class="value-form-grid"><input name="source_image_url" placeholder="https://assets.devilndove.com/..." required><input name="route_context" placeholder="/shop/product/example/"><input name="sizes_value" placeholder="(max-width: 768px) 100vw, 50vw"><button class="btn" type="submit">Queue derivative job</button></form>
      </section>
      <section class="card"><h2>Campaign readiness</h2>${table(['Campaign','Check','Status','Evidence','Action'],campaignRows(data))}</section>
      <section class="card"><h2>Local-page freshness</h2>${table(['Page','Product proof','Customer proof','GBP month','Status','Next review'],freshnessRows(data))}</section>
      <section class="card"><h2>Real-device QA evidence</h2>${table(['Route','Device','Viewport','Browser','Theme','Status','Evidence','Issue'],qaRows(data))}
        <form id="build191QaForm" class="value-form-grid"><input name="route_path" placeholder="/checkout/" required><input name="device_label" placeholder="iPhone / Pixel / iPad / laptop" required><input name="viewport_width" type="number" placeholder="Width"><input name="viewport_height" type="number" placeholder="Height"><input name="browser_label" placeholder="Safari / Chrome / Edge"><select name="theme_mode"><option value="light">Light</option><option value="dark">Dark</option></select><select name="qa_status"><option value="passed">Passed</option><option value="needs_review">Needs review</option><option value="failed">Failed</option></select><input name="screenshot_url" placeholder="Evidence URL"><textarea name="issue_summary" placeholder="Issues or notes"></textarea><button class="btn" type="submit">Save QA evidence</button></form>
      </section>`;
    bind(data);
  }
  function formPayload(form, action) {
    const payload = { action };
    new FormData(form).forEach((value,key)=>{ payload[key]=value; });
    return payload;
  }
  function bind(data) {
    document.getElementById('build191OwnerSummary')?.addEventListener('click', async()=>{
      const response = await post({action:'generate_owner_summary'});
      const summary = response?.result?.summary || response?.summary || {};
      const blob = new Blob([JSON.stringify(summary,null,2)+'\n'],{type:'application/json'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href=url; link.download=`devilndove-owner-daily-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
      notify('Owner Daily summary generated and downloaded.'); await load();
    });
    document.getElementById('build191ReviewEligibility')?.addEventListener('click', async()=>{ await post({action:'refresh_review_eligibility'}); notify('Review eligibility refreshed.'); await load(); });
    document.getElementById('build191Freshness')?.addEventListener('click', async()=>{ await post({action:'refresh_freshness'}); notify('Local-page freshness refreshed.'); await load(); });
    document.getElementById('build191Environment')?.addEventListener('click', async()=>{ await post({action:'run_environment_verification'}); notify('Environment configuration presence recorded.'); await load(); });
    document.getElementById('build191CustomerSearch')?.addEventListener('submit', async(event)=>{event.preventDefault();state.q=String(new FormData(event.currentTarget).get('q')||'').trim();await load();});
    const forms = [
      ['build191FeeForm','save_fee_setting'],['build191CostForm','save_cost_default'],
      ['build191OverrideForm','request_margin_override'],['build191CustomerNoteForm','add_customer_note'],
      ['build191StoryForm','generate_story_outputs'],['build191SearchConsoleForm','preview_search_console_csv'],
      ['build191GalleryForm','save_gallery_item'],['build191PerformanceForm','import_performance'],
      ['build191ResponsiveForm','queue_responsive_image'],['build191QaForm','add_device_qa']
    ];
    forms.forEach(([id,action])=>document.getElementById(id)?.addEventListener('submit',async(event)=>{
      event.preventDefault();
      try { await post(formPayload(event.currentTarget,action)); notify('Saved successfully.'); if(!['build191FeeForm','build191CostForm'].includes(id)) event.currentTarget.reset(); await load(); }
      catch(error){ notify(error.message||'Could not save.',true); }
    }));
    host.querySelectorAll('[data-complete-gbp]').forEach((button)=>button.addEventListener('click',async()=>{await post({action:'complete_gbp_task',id:Number(button.dataset.completeGbp),task_status:'completed'});await load();}));
    host.querySelectorAll('[data-approve-override]').forEach((button)=>button.addEventListener('click',async()=>{if(!confirm('Approve this temporary margin override?'))return;await post({action:'approve_margin_override',id:Number(button.dataset.approveOverride),approval_status:'approved'});await load();}));
    host.querySelectorAll('[data-approve-gallery]').forEach((button)=>button.addEventListener('click',async()=>{if(!confirm('Approve only if consent, public use, image accuracy, and alt text are all verified. Continue?'))return;await post({action:'approve_gallery_item',id:Number(button.dataset.approveGallery),consent_status:'approved',public_use_status:'approved'});await load();}));
    host.querySelectorAll('[data-pass-campaign]').forEach((button)=>button.addEventListener('click',async()=>{await post({action:'update_campaign_check',campaign_key:button.dataset.campaign,check_key:button.dataset.check,check_label:button.dataset.label,check_status:'passed'});await load();}));
    host.querySelectorAll('[data-edit-fee]').forEach((button)=>button.addEventListener('click',()=>{
      const row=array(data,'fee_settings').find((item)=>item.channel_key===button.dataset.editFee); const form=document.getElementById('build191FeeForm'); if(!row||!form)return;
      Object.entries(row).forEach(([key,value])=>{if(form.elements[key])form.elements[key].value=value??'';}); form.scrollIntoView({behavior:'smooth',block:'center'});
    }));
    host.querySelectorAll('[data-edit-cost]').forEach((button)=>button.addEventListener('click',()=>{
      const row=array(data,'cost_defaults').find((item)=>item.family_key===button.dataset.editCost); const form=document.getElementById('build191CostForm'); if(!row||!form)return;
      Object.entries(row).forEach(([key,value])=>{if(form.elements[key])form.elements[key].value=value??'';}); form.scrollIntoView({behavior:'smooth',block:'center'});
    }));
  }
  async function load() {
    host.innerHTML='<section class="card"><p class="small">Loading Build 191 value-operations follow-through…</p></section>';
    try { render(await loadData()); }
    catch(error) { host.innerHTML=`<section class="card"><p class="status-note danger">${esc(error.message||'Could not load Build 191 panels.')}</p><p class="small">The Build 190 Command Center above remains available. Confirm the Build 191 D1 migration and Pages Functions deployment.</p></section>`; }
  }
  load();
});
