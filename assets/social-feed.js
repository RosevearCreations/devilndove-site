async function loadSocialFeeds() {
  const res = await fetch('/api/social_feed_public', { cache: 'no-store' });
  const out = await res.json().catch(() => null);
  if (!res.ok || !out?.social_feeds) throw new Error(out?.error || 'Could not load social feeds.');
  return out.social_feeds;
}

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function renderSocialFeedMounts() {
  const mounts = [...document.querySelectorAll('[data-social-feed-mount]')];
  if (!mounts.length) return;
  try {
    const payload = await loadSocialFeeds();
    const platforms = Array.isArray(payload?.platforms) ? payload.platforms : [];
    mounts.forEach((mount) => {
      mount.innerHTML = platforms.map((platform) => {
        const items = Array.isArray(platform?.items) ? platform.items.slice(0, 5) : [];
        const cards = items.length
          ? items.map((item) => `
              <a class="social-feed-card" href="${esc(item.url)}" target="_blank" rel="noopener">
                <span class="social-feed-type">${esc(platform.label)}</span>
                <strong>${esc(item.title)}</strong>
                <p>${esc(item.caption || 'Open this update on ' + platform.label + '.')}</p>
                <span class="social-feed-meta">${esc(item.published_at || 'Latest update')}</span>
              </a>
            `).join('')
          : `<div class="social-feed-empty">${esc(platform.intro || 'Add the latest five posts for this platform in App Management.')}</div>`;
        const profileBtn = platform.profile_url ? `<a class="btn ghost small" href="${esc(platform.profile_url)}" target="_blank" rel="noopener">Open ${esc(platform.label)}</a>` : '';
        return `
          <section class="social-feed-platform">
            <div class="social-feed-head">
              <div>
                <h3>${esc(platform.label)}</h3>
                <p>${esc(platform.intro || 'Latest posts')}</p>
              </div>
              ${profileBtn}
            </div>
            <div class="social-feed-grid">${cards}</div>
          </section>
        `;
      }).join('');
    });
  } catch (err) {
    mounts.forEach((mount) => {
      mount.innerHTML = `<div class="notice">${esc(err?.message || 'Could not load social feeds.')}</div>`;
    });
  }
}
