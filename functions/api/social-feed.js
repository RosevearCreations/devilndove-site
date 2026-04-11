import { captureRuntimeIncident } from "./_lib/adminAudit.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=120",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    }
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

async function loadJsonFeed(request) {
  try {
    const response = await fetch(new URL('/data/site/social-feed.json', request.url).toString(), { cf: { cacheTtl: 0, cacheEverything: false } });
    if (!response.ok) return { ok: false, error: `Social feed responded ${response.status}.`, data: null };
    const data = await response.json().catch(() => null);
    if (!data || typeof data !== 'object') return { ok: false, error: 'Social feed returned invalid JSON.', data: null };
    return { ok: true, error: '', data };
  } catch (error) {
    return { ok: false, error: error?.message || 'Social feed could not be loaded.', data: null };
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const warnings = [];
  const feed = await loadJsonFeed(request);

  if (!feed.ok || !feed.data) {
    warnings.push('social_feed_json_unavailable');
    await captureRuntimeIncident(env, request, {
      incident_scope: 'public_social',
      incident_code: 'social_feed_load_failed',
      severity: 'warning',
      message: 'Social hub feed could not be loaded. Returning a safe empty payload.',
      details: { error: feed.error }
    });

    return json({
      ok: true,
      profiles: {},
      youtube_videos: [],
      feed_notes: {},
      updated_at: '',
      warning: 'Social feed is unavailable right now. A safe empty payload was returned.',
      diagnostics: { warnings },
      summary: { authority: 'empty_fallback', profile_count: 0, youtube_video_count: 0 }
    });
  }

  const profiles = feed.data?.profiles && typeof feed.data.profiles === 'object' ? feed.data.profiles : {};
  const youtubeVideos = Array.isArray(feed.data?.youtube_videos) ? feed.data.youtube_videos : [];
  const notes = feed.data?.feed_notes && typeof feed.data.feed_notes === 'object' ? feed.data.feed_notes : {};

  return json({
    ok: true,
    profiles,
    youtube_videos: youtubeVideos,
    feed_notes: notes,
    updated_at: normalizeText(feed.data?.updated_at),
    diagnostics: { warnings },
    summary: {
      authority: 'site_json_api',
      profile_count: Object.keys(profiles).length,
      youtube_video_count: youtubeVideos.length
    }
  });
}
