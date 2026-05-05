(() => {
  'use strict';
  const mount = document.getElementById('eventsLiveMount');
  if (!mount) return;

  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  function formatWhen(row) {
    const start = row?.starts_at ? esc(row.starts_at) : 'Date to be announced';
    const end = row?.ends_at ? esc(row.ends_at) : '';
    return end ? `${start} → ${end}` : start;
  }

  function render(events, warning = '') {
    const items = Array.isArray(events) ? events : [];
    mount.innerHTML = `
      <section class="card" style="margin-top:18px">
        <h2 style="margin-top:0">Upcoming markets and local event notes</h2>
        <p class="small">This section now reads from the live community-content API so market dates, pickup windows, and in-person selling notes can be updated from admin instead of hiding in page-only text.${warning ? ` <strong>${esc(warning)}</strong>` : ''}</p>
        <div class="grid cols-3" style="gap:16px;margin-top:12px">
          ${items.length ? items.map((row) => `
            <article class="card">
              <h3 style="margin-top:0">${esc(row.title || 'Community event')}</h3>
              <div class="small">${esc(row.event_type || 'market')} • ${esc(row.event_status || 'planned')}</div>
              <div class="small" style="margin-top:6px">${formatWhen(row)}</div>
              <div class="small">${esc([row.venue_name, row.city, row.region_label].filter(Boolean).join(' • ') || 'Southern Ontario')}</div>
              ${row.public_note ? `<p class="small" style="margin-top:8px">${esc(row.public_note)}</p>` : ''}
              ${row.sale_channel_note ? `<p class="small">${esc(row.sale_channel_note)}</p>` : ''}
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
                ${row.event_url ? `<a class="btn" href="${esc(row.event_url)}" rel="noopener" target="_blank">Event link</a>` : ''}
                ${Number(row.pickup_supported || 0) ? `<a class="btn" href="/pickup/">Pickup details</a>` : ''}
                <a class="btn" href="/contact/">Ask about availability</a>
              </div>
            </article>
          `).join('') : `
            <article class="card" style="grid-column:1/-1">
              <h3 style="margin-top:0">No live market dates are posted yet</h3>
              <p class="small">The page is ready for Tillsonburg, Oxford County, Norfolk County, and other Southern Ontario market dates, but until rows are published you can still use Contact to ask whether a piece is available for pickup, viewing, or a local handoff.</p>
              <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="/contact/">Ask about events</a><a class="btn" href="/pickup/">Pickup guide</a><a class="btn" href="/marketplaces/">Marketplace guide</a></div>
            </article>
          `}
        </div>
      </section>`;
  }

  fetch('/api/community-content', { headers: { Accept: 'application/json' } })
    .then((response) => response.json().catch(() => null).then((data) => ({ response, data })))
    .then(({ response, data }) => {
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Community event data could not be loaded.');
      render(data.events || [], data.warning || '');
    })
    .catch(() => render([], 'Fallback event messaging is showing right now.'));
})();
