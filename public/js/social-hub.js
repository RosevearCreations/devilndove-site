document.addEventListener('DOMContentLoaded', async () => {
  const profileGrid = document.getElementById('socialProfileGrid');
  const youtubeGrid = document.getElementById('socialYoutubeGrid');
  const messageEl = document.getElementById('socialHubMessage');
  const notesEl = document.getElementById('socialFeedNotes');
  const SNAPSHOT_KEY = 'dd_social_hub_snapshot_v2';

  function esc(v){ return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function setMessage(message, tone = 'success'){
    if(!messageEl) return;
    messageEl.textContent = message || '';
    messageEl.style.display = message ? 'block' : 'none';
    messageEl.className = 'status-note' + (message ? ` ${tone}` : '');
  }
  function saveSnapshot(payload){ try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(payload)); } catch {} }
  function loadSnapshot(){ try { return JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || 'null'); } catch { return null; } }

  function renderFeed(data) {
    const profiles = data?.profiles || {};
    const profileKeys = ['youtube','instagram','tiktok','facebook','x','patreon'];
    if (profileGrid) {
      profileGrid.innerHTML = profileKeys.map((key) => {
        const row = profiles[key] || {};
        return `<a class="card" href="${esc(row.url || '#')}" target="_blank" rel="noopener"><strong>${esc(row.label || key)}</strong><div class="small" style="margin-top:8px">${esc(row.handle || row.url || '')}</div></a>`;
      }).join('');
    }

    const videos = Array.isArray(data?.youtube_videos) ? data.youtube_videos : [];
    if (youtubeGrid) {
      youtubeGrid.innerHTML = videos.map((row) => `<article class="card"><div style="position:relative;padding-top:56.25%;overflow:hidden;border-radius:12px;background:#111827"><iframe src="https://www.youtube.com/embed/${esc(row.video_id || '')}" title="${esc(row.title || 'Devil n Dove video')}" loading="lazy" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe></div><h3 style="margin:12px 0 6px 0;font-size:1.05rem">${esc(row.title || '')}</h3><div class="small">${esc(row.kind || 'Video')}</div><div style="margin-top:10px"><a class="btn" href="${esc(row.url || '#')}" target="_blank" rel="noopener">Open on YouTube</a></div></article>`).join('') || '<div class="small">No YouTube videos are listed yet.</div>';
    }

    if (notesEl) {
      const notes = data?.feed_notes || {};
      notesEl.textContent = [notes.youtube, notes.instagram, notes.tiktok, notes.x].filter(Boolean).join(' ') || 'Feed notes are not available right now.';
    }
  }

  try {
    const response = await fetch('/api/social-feed', { cache: 'no-store' });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Could not load the social hub feed.');
    renderFeed(data);
    saveSnapshot({ data, cached_at: new Date().toISOString() });

    if (data?.warning) {
      setMessage(data.warning, 'warning');
    } else {
      setMessage(`Social hub updated from ${data?.updated_at || 'the latest saved feed file'}.`, 'success');
    }
  } catch (error) {
    const cached = loadSnapshot();
    if (cached?.data) {
      renderFeed(cached.data);
      setMessage(`Live social feed is unavailable. Showing the last saved snapshot from ${cached.cached_at || 'an earlier visit'}.`, 'warning');
      return;
    }
    setMessage(error.message || 'Could not load the social hub feed.', 'error');
    if (profileGrid) profileGrid.innerHTML = '<div class="small">Social profiles are unavailable right now.</div>';
    if (youtubeGrid) youtubeGrid.innerHTML = '<div class="small">YouTube videos are unavailable right now.</div>';
    if (notesEl) notesEl.textContent = 'Feed notes are unavailable right now.';
  }
});
