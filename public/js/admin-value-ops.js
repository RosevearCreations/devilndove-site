// File: /public/js/admin-value-ops.js
// Brief description: Build 190 integrated value-operations panels for Command Center saved views, environment health, filtered funnels, product margin/readiness, customer timelines, visual publication queue, cart recovery review, and seasonal campaign planning.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('valueOpsCommandCenterMount');
  if (!mount || !window.DDAuth) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const arr = (data, key) => Array.isArray(data?.[key]) ? data[key] : [];
  const money = (value) => new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(value || 0) / 100);
  const pill = (status) => `<span class="status-pill status-${esc(String(status || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g,'-'))}">${esc(String(status || 'unknown').replace(/_/g,' '))}</span>`;
  const table = (headers, body, empty='No rows yet.') => `<div class="table-wrap"><table class="admin-table"><thead><tr>${headers.map((h)=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body || `<tr><td colspan="${headers.length}" class="small">${esc(empty)}</td></tr>`}</tbody></table></div>`;
  let state = { days: 30, source: '' };
  let currentData = null;

  async function read(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.error || 'Value Operations request failed.');
    return data;
  }
  async function getData() {
    const params = new URLSearchParams({ days: String(state.days) });
    if (state.source) params.set('source', state.source);
    return read(await window.DDAuth.apiFetch(`/api/admin/value-ops?${params.toString()}`));
  }
  async function post(payload) {
    return read(await window.DDAuth.apiFetch('/api/admin/value-ops', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) }));
  }
  function environmentRows(data) {
    return arr(data,'environment_health').map((row) => `<tr><td>${esc(row.label)}</td><td><code>${esc(row.key)}</code></td><td>${pill(row.status)}</td><td>${esc(row.importance)}</td><td>${esc(row.notes)}</td></tr>`).join('');
  }
  function funnelRows(data) {
    return arr(data,'funnel').map((row) => `<tr><td>${esc(row.label)}</td><td>${Number(row.count || 0)}</td><td>${Number(row.previous_count || 0)}</td><td>${Number(row.conversion_rate_percent || 0).toFixed(1)}%</td><td>${Number(row.dropoff_count || 0)}</td></tr>`).join('');
  }
  function productRows(data) {
    return arr(data,'products').slice(0,80).map((row) => `<tr><td><a href="/admin/products/?focus_product=${Number(row.product_id || 0)}">${esc(row.product_name)}</a><div class="small">${esc(row.product_slug || '')}</div></td><td>${pill(row.readiness_status)}</td><td>${row.missing_real_photo ? pill('missing_real_photo') : pill('photo_present')}</td><td>${Number(row.missing_alt_text || 0)}</td><td>${row.low_stock ? pill(`low_stock_${row.inventory_quantity}`) : esc(row.inventory_quantity)}</td><td>${money(row.price_cents)}</td><td>${money(row.estimated_cost_cents)}</td><td>${money(row.estimated_margin_cents)}<div class="small">${Number(row.estimated_margin_percent || 0).toFixed(1)}%</div></td><td>${pill(row.margin_status)}</td><td>${pill(row.marketplace_export_status)}</td></tr>`).join('');
  }
  function customerCards(data) {
    return arr(data,'customers').slice(0,16).map((row) => `<article class="card value-customer-card"><div class="value-card-head"><div><h3>${esc(row.customer_label || row.customer_email)}</h3><div class="small">${esc(row.customer_email)}</div></div><span class="status-pill">${Number(row.events?.length || 0)} recent</span></div><div class="customer-counts small">Orders ${Number(row.order_count||0)} • Requests ${Number(row.custom_request_count||0)} • Gift cards ${Number(row.gift_card_count||0)} • Reviews ${Number(row.review_count||0)} • Cart reviews ${Number(row.cart_recovery_count||0)}</div><ol class="timeline-list">${(row.events||[]).slice(0,5).map((event)=>`<li><strong>${esc(event.event_label)}</strong><span>${esc(event.event_status || '')} ${event.event_amount_cents ? `• ${money(event.event_amount_cents)}` : ''}</span><time>${esc(event.event_at || '')}</time></li>`).join('')}</ol></article>`).join('');
  }
  function seoRows(data) {
    return arr(data,'seo_opportunities').map((row) => `<tr><td><code>${esc(row.page_path)}</code><div class="small">${esc(row.target_phrase)}</div></td><td>${Number(row.clicks||0)}</td><td>${Number(row.impressions||0)}</td><td>${Number(row.average_position||0).toFixed(1)}</td><td>${Number(row.score||0)}</td><td>${pill(row.opportunity_kind)}</td><td>${row.gbp_observation ? pill('gbp_recorded') : pill('gbp_needed')}</td><td><button class="btn small" data-create-seo-action="${esc(row.page_path)}" data-kind="${esc(row.opportunity_kind)}" data-clicks="${Number(row.clicks||0)}" data-impressions="${Number(row.impressions||0)}" data-position="${Number(row.average_position||0)}" type="button">Create action</button></td></tr>`).join('');
  }
  function visualRows(data) {
    return arr(data,'visual_queue').map((row) => `<tr><td><code>${esc(row.route_path)}</code></td><td><code>${esc(row.placeholder_asset || '')}</code></td><td>${pill(row.consent_status)}</td><td>${pill(row.public_use_status)}</td><td>${pill(row.compression_status)}</td><td>${pill(row.alt_text_status)}</td><td>${pill(row.performance_status)}</td><td>${pill(row.review_status)}</td></tr>`).join('');
  }
  function compressionRows(data) {
    return arr(data,'compression').map((row) => `<tr><td><code>${esc(row.asset_path)}</code></td><td>${Math.round(Number(row.original_bytes||0)/1024)} KB</td><td><code>${esc(row.optimized_asset_path||'')}</code></td><td>${Math.round(Number(row.optimized_bytes||0)/1024)} KB</td><td>${Number(row.savings_percent||0).toFixed(1)}%</td><td>${pill(row.compression_status)}</td></tr>`).join('');
  }
  function recoveryRows(data) {
    return arr(data,'cart_recovery').map((row) => `<tr><td>${esc(row.customer_name || row.customer_email || 'Unknown')}</td><td>${esc(row.customer_email || '')}</td><td>${money(row.cart_value_cents)}</td><td>${pill(row.recovery_status)}</td><td>${pill(row.contact_permission_status)}</td><td>${esc(row.suggested_action || '')}</td><td><button class="btn small" data-review-recovery="${Number(row.cart_recovery_review_row_id||0)}" type="button">Mark reviewed</button></td></tr>`).join('');
  }
  function campaignRows(data) {
    return arr(data,'campaigns').map((row) => `<tr><td>${esc(row.campaign_label)}</td><td>${esc(row.campaign_kind)}</td><td>${esc(row.target_start_date||'')} → ${esc(row.target_end_date||'')}</td><td>${esc(row.target_locality||'')}</td><td>${esc(row.product_focus||'')}</td><td>${pill(row.image_status)}</td><td>${pill(row.seo_status)}</td><td>${pill(row.campaign_status)}</td></tr>`).join('');
  }
  function storyRows(data) {
    return arr(data,'story_batches').map((row) => `<tr><td>${esc(row.story_title || 'Untitled story')}<div class="small">${esc(row.story_summary || '')}</div></td><td>${pill(row.source_kind)}</td><td>${pill(row.consent_status)}</td><td>${pill(row.approval_status)}</td><td>${esc(row.target_context || 'trust_block')}</td><td><button class="btn small" data-story-review="${Number(row.customer_story_approval_batch_id||0)}" type="button">Move to review</button> <button class="btn secondary small" data-story-approve="${Number(row.customer_story_approval_batch_id||0)}" type="button">Approve</button></td></tr>`).join('');
  }
  function savedViews(data) {
    return arr(data,'saved_views').map((row) => { let filters={}; try{filters=JSON.parse(row.filter_json||'{}');}catch{} return `<button class="btn secondary small" data-saved-view="${esc(row.view_key)}" data-days="${Number(filters.days||30)}" data-area="${esc(filters.area||'all')}">${esc(row.view_label)}</button>`; }).join('');
  }
  function render(data) {
    currentData = data;
    mount.innerHTML = `
      <section class="card value-ops-toolbar-card">
        <div class="value-card-head"><div><h2>Build 190 integrated value operations</h2><p class="small">Saved daily views, environment health, date/source funnel filters, product margin and photo warnings, customer timelines, SEO/GBP actions, media approval, cart recovery review, and seasonal planning.</p></div>${pill(data.build_label || 'Build 190')}</div>
        <div class="value-saved-views" aria-label="Saved Command Center views">${savedViews(data)}</div>
        <form id="valueOpsFilterForm" class="inline-form">
          <label>Funnel period<select id="valueOpsDays"><option value="7" ${state.days===7?'selected':''}>7 days</option><option value="30" ${state.days===30?'selected':''}>30 days</option><option value="90" ${state.days===90?'selected':''}>90 days</option><option value="365" ${state.days===365?'selected':''}>365 days</option></select></label>
          <label>Source / UTM<input id="valueOpsSource" value="${esc(state.source)}" placeholder="facebook, google, instagram"></label>
          <button class="btn" type="submit">Apply filters</button>
          <button class="btn secondary" id="valueOpsSyncTimeline" type="button">Sync customer timeline</button>
        </form>
      </section>
      <section class="card"><h2>Auth and environment health</h2>${table(['Check','Cloudflare key/binding','Status','Importance','What it supports'],environmentRows(data),'No environment checks available.')}</section>
      <section class="card"><h2>Conversion funnel — ${Number(data.filters?.days||state.days)} days</h2><p class="small">Source filter: ${esc(data.filters?.source || 'all traffic')}. Counts are reporting aids, not automatic customer-contact permission.</p>${table(['Step','Events','Previous','Conversion','Drop-off'],funnelRows(data),'No funnel data yet.')}</section>
      <section class="card"><h2>Product readiness, real-photo, stock, and margin warnings</h2><p class="small">Marketplace fees are estimates. Review actual channel fees before publishing/exporting.</p>${table(['Product','Readiness','Real photo','Missing alt','Stock','Price','Est. cost','Est. margin','Margin status','Export'],productRows(data),'No product rows yet.')}</section>
      <section class="card"><h2>Unified customer/member timelines</h2><div class="value-customer-grid">${customerCards(data) || '<p class="small">No customer activity found yet.</p>'}</div></section>
      <section class="card"><h2>Search Console opportunities and Google Business Profile observations</h2>
        <form id="gbpObservationForm" class="value-form-grid">
          <input name="page_path" placeholder="/handmade-jewelry-ontario/" required>
          <input name="observation_month" type="month" value="${new Date().toISOString().slice(0,7)}" required>
          <input name="search_phrase" placeholder="handmade jewelry Ontario">
          <input name="position_note" placeholder="Manual Maps/Search observation">
          <input name="website_clicks" type="number" min="0" placeholder="Website clicks">
          <input name="calls" type="number" min="0" placeholder="Calls">
          <input name="photo_views" type="number" min="0" placeholder="Photo views">
          <button class="btn" type="submit">Save GBP observation</button>
        </form>${table(['Page','Clicks','Impressions','Position','Score','Opportunity','GBP','Action'],seoRows(data),'No local SEO opportunities yet.')}
      </section>
      <section class="card"><h2>Real media waiting on public-use, consent, compression, alt text, and performance review</h2>${table(['Page','Placeholder','Consent','Public use','Compression','Alt text','Budget','Review'],visualRows(data),'No visual candidates yet.')}</section>
      <section class="card"><h2>Image compression report</h2>${table(['Original asset','Original','Optimized asset','Optimized','Savings','Status'],compressionRows(data),'Run the Build 190 performance report to seed compression rows.')}</section>
      <section class="card"><h2>Guarded cart recovery review</h2><p class="small">No customer email is sent from this panel. Each row requires human review and permission checks.</p>${table(['Customer','Email','Cart value','Status','Permission','Suggested action','Review'],recoveryRows(data),'No cart recovery rows yet.')}</section>
      <section class="card"><h2>Customer story and public-proof approval</h2><p class="small">Candidates stay private until consent and approval are explicit. Approving here records the decision; placement still follows the trust-block/public-proof workflow.</p>${table(['Story','Source','Consent','Approval','Target','Actions'],storyRows(data),'No customer-story candidates yet.')}</section>
      <section class="card"><h2>Seasonal campaign planner</h2>${table(['Campaign','Kind','Dates','Locality','Product focus','Images','SEO','Status'],campaignRows(data),'No campaign rows yet.')}</section>`;
    bind();
  }
  function bind() {
    document.getElementById('valueOpsFilterForm')?.addEventListener('submit', async (event) => { event.preventDefault(); state.days=Number(document.getElementById('valueOpsDays')?.value||30); state.source=String(document.getElementById('valueOpsSource')?.value||'').trim(); await load(); });
    document.getElementById('valueOpsSyncTimeline')?.addEventListener('click', async () => { await post({action:'sync_customer_timeline'}); await load(); });
    mount.querySelectorAll('[data-saved-view]').forEach((button)=>button.addEventListener('click',async()=>{state.days=Number(button.dataset.days||30);state.source='';await load();}));
    document.getElementById('gbpObservationForm')?.addEventListener('submit', async (event)=>{event.preventDefault();const form=new FormData(event.currentTarget);const payload={action:'add_gbp_observation'};for(const [key,value] of form.entries())payload[key]=value;await post(payload);event.currentTarget.reset();await load();});
    mount.querySelectorAll('[data-create-seo-action]').forEach((button)=>button.addEventListener('click',async()=>{await post({action:'create_seo_opportunity',page_path:button.dataset.createSeoAction,opportunity_kind:button.dataset.kind,clicks:Number(button.dataset.clicks||0),impressions:Number(button.dataset.impressions||0),average_position:Number(button.dataset.position||0),internal_link_note:'Review nearby relevant pages and add a useful descriptive internal link.',notes:'Created from the Build 190 Command Center opportunity table.'});await load();}));
    mount.querySelectorAll('[data-review-recovery]').forEach((button)=>button.addEventListener('click',async()=>{await post({action:'review_cart_recovery',id:Number(button.dataset.reviewRecovery||0),recovery_status:'reviewed_no_automatic_send',contact_permission_status:'manual_permission_check_required',suggested_action:'Reviewed. Contact only when permission and business reason are clear.',gift_card_opportunity_status:'reviewed'});await load();}));
    mount.querySelectorAll('[data-story-review]').forEach((button)=>button.addEventListener('click',async()=>{await post({action:'update_story',id:Number(button.dataset.storyReview||0),approval_status:'in_review',consent_status:'needs_review',target_context:'trust_block',notes:'Moved to human review from Build 190 Command Center.'});await load();}));
    mount.querySelectorAll('[data-story-approve]').forEach((button)=>button.addEventListener('click',async()=>{if(!window.confirm('Approve this story candidate only after consent and wording have been checked?'))return;await post({action:'update_story',id:Number(button.dataset.storyApprove||0),approval_status:'approved',consent_status:'approved',target_context:'trust_block',notes:'Approved through Build 190 Command Center after explicit human confirmation.'});await load();}));
  }
  async function load() {
    mount.innerHTML='<section class="card"><p class="small">Loading Build 190 integrated value operations…</p></section>';
    try { render(await getData()); } catch (error) { mount.innerHTML=`<section class="card"><p class="status-note danger">${esc(error.message||'Value Operations failed to load.')}</p><p class="small">The existing Command Center remains available above. Verify the Build 190 D1 migration and Cloudflare Functions deployment.</p></section>`; }
  }
  load();
});
