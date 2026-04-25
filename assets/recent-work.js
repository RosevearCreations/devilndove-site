function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function loadGallery() {
  const res = await fetch('/api/before_after_gallery_public', { cache: 'no-store' });
  const out = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(out?.items)) throw new Error(out?.error || 'Could not load recent work right now.');
  return out.items;
}

function renderMedia(item) {
  const afterKind = String(item?.after_kind || 'image').toLowerCase() === 'video' ? 'video' : 'image';
  const afterUrl = String(item?.after_url || '').trim();
  if (!afterUrl) return '<div class="recent-work-media"></div>';
  if (afterKind === 'video') {
    return `<video class="recent-work-media" src="${esc(afterUrl)}" muted playsinline controls preload="metadata"></video>`;
  }
  return `<img class="recent-work-media" src="${esc(afterUrl)}" alt="${esc(item?.title || 'Recent detailing result')}">`;
}

export async function renderRecentWorkMounts(limit = 3) {
  const mounts = [...document.querySelectorAll('[data-recent-work-mount]')];
  if (!mounts.length) return;
  try {
    const items = (await loadGallery()).slice(0, Math.max(1, Number(limit || 3)));
    const html = items.length ? `<div class="recent-work-grid">${items.map((item) => `
      <article class="recent-work-card">
        ${renderMedia(item)}
        <h3>${esc(item?.title || 'Detail result')}</h3>
        <p class="section-kicker">${esc(item?.location || 'Oxford / Norfolk Counties')}</p>
        <p class="muted">${esc(item?.note || 'View more before/after work in the public gallery.')}</p>
        <div class="cta-row" style="margin-top:10px">
          <a class="btn ghost small" href="/gallery">Open gallery</a>
          <a class="btn ghost small" href="/book">Book now</a>
        </div>
      </article>
    `).join('')}</div>` : '<div class="notice soft">Add more approved before/after comparisons in App Management to strengthen public proof.</div>';
    mounts.forEach((mount) => { mount.innerHTML = html; });
  } catch (err) {
    mounts.forEach((mount) => { mount.innerHTML = `<div class="notice">${esc(err?.message || 'Could not load recent work.')}</div>`; });
  }
}
