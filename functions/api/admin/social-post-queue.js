// File: /functions/api/admin/social-post-queue.js
// Brief description: Admin-only social posting queue for job/process photos and summaries.
// This is review-first. It prepares platform-ready captions and records manual/API posting status,
// but does not auto-post until official OAuth/API keys are configured and approved for each platform.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const PLATFORM_DEFINITIONS = [
  {
    platform_key: 'facebook',
    display_name: 'Facebook Page',
    connection_status: 'manual_ready',
    api_ready: 0,
    requires_oauth: 1,
    required_scopes: 'pages_manage_posts,pages_read_engagement,pages_show_list',
    notes: 'Manual-ready now. API posting later requires a Meta app, Page access token, permissions, and review where applicable.'
  },
  {
    platform_key: 'instagram',
    display_name: 'Instagram Business/Creator',
    connection_status: 'manual_ready',
    api_ready: 0,
    requires_oauth: 1,
    required_scopes: 'instagram_business_content_publish,pages_show_list',
    notes: 'Manual-ready now. API publishing later requires an Instagram professional account connected to Meta and the Content Publishing API flow.'
  },
  {
    platform_key: 'tiktok',
    display_name: 'TikTok',
    connection_status: 'manual_ready',
    api_ready: 0,
    requires_oauth: 1,
    required_scopes: 'video.upload,video.publish',
    notes: 'Manual-ready now. API posting later requires TikTok developer app approval, creator info query, and verified media URL/domain rules.'
  },
  {
    platform_key: 'x',
    display_name: 'X',
    connection_status: 'manual_ready',
    api_ready: 0,
    requires_oauth: 1,
    required_scopes: 'tweet.write,users.read,offline.access',
    notes: 'Manual-ready now. API posting later requires X API access and OAuth tokens; posting links may have platform costs/limits.'
  },
  {
    platform_key: 'youtube',
    display_name: 'YouTube Shorts/Community',
    connection_status: 'manual_ready',
    api_ready: 0,
    requires_oauth: 1,
    required_scopes: 'youtube.upload,youtube.force-ssl',
    notes: 'Manual-ready now. API upload/posting later requires Google OAuth/app configuration.'
  },
  {
    platform_key: 'pinterest',
    display_name: 'Pinterest',
    connection_status: 'manual_ready',
    api_ready: 0,
    requires_oauth: 1,
    required_scopes: 'pins:write,boards:read',
    notes: 'Manual-ready now. Useful for finished products and workshop inspiration boards once OAuth is configured.'
  }
];

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function safeJson(value, fallback) { try { return JSON.parse(value || ''); } catch { return fallback; } }
function slugKey(value) { return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); }
function trimTo(value, limit) {
  const clean = normalizeText(value);
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, Math.max(0, limit - 1)).trim()}…`;
}
function splitList(value) {
  if (Array.isArray(value)) return value.map((item) => normalizeText(item)).filter(Boolean);
  return String(value || '').split(/\r?\n|,|\|/).map((item) => normalizeText(item)).filter(Boolean);
}
function normalizePlatforms(value) {
  const allowed = new Set(PLATFORM_DEFINITIONS.map((row) => row.platform_key));
  const incoming = splitList(value).map((item) => slugKey(item)).map((item) => item === 'twitter' ? 'x' : item);
  const unique = [...new Set(incoming.filter((item) => allowed.has(item)))];
  return unique.length ? unique : ['facebook', 'instagram'];
}
function normalizeHashtags(value) {
  const tags = splitList(value)
    .map((tag) => tag.replace(/^#+/, '').replace(/[^a-zA-Z0-9_]/g, ''))
    .filter(Boolean)
    .slice(0, 20);
  return [...new Set(tags)].map((tag) => `#${tag}`).join(' ');
}
function buildQueueKey(seed) {
  const raw = normalizeText(seed) || `${Date.now()}-${crypto.randomUUID()}`;
  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(index);
    hash |= 0;
  }
  return `social_${Math.abs(hash)}_${Date.now().toString(36)}`;
}
function safeUrl(value) {
  const clean = normalizeText(value);
  if (!clean) return '';
  try { return new URL(clean).toString(); } catch { return clean; }
}
function buildCaption({ title, summary, hashtags, linkUrl }) {
  const parts = [];
  if (title) parts.push(title);
  if (summary) parts.push(summary);
  if (linkUrl) parts.push(`More: ${linkUrl}`);
  if (hashtags) parts.push(hashtags);
  return trimTo(parts.filter(Boolean).join('\n\n'), 2200);
}

function envText(env, ...names) {
  for (const name of names) {
    const value = normalizeText(env?.[name]);
    if (value) return value;
  }
  return '';
}
function getPlatformReadiness(env = {}) {
  const facebookReady = !!(envText(env, 'FACEBOOK_PAGE_ID', 'META_PAGE_ID') && envText(env, 'FACEBOOK_PAGE_ACCESS_TOKEN', 'META_PAGE_ACCESS_TOKEN'));
  const instagramReady = !!(envText(env, 'INSTAGRAM_USER_ID', 'IG_USER_ID', 'INSTAGRAM_BUSINESS_ACCOUNT_ID') && envText(env, 'INSTAGRAM_ACCESS_TOKEN', 'META_PAGE_ACCESS_TOKEN', 'FACEBOOK_PAGE_ACCESS_TOKEN'));
  const xReady = !!envText(env, 'X_USER_ACCESS_TOKEN', 'TWITTER_USER_ACCESS_TOKEN');
  const pinterestReady = !!(envText(env, 'PINTEREST_ACCESS_TOKEN') && envText(env, 'PINTEREST_BOARD_ID'));
  const tiktokReady = !!envText(env, 'TIKTOK_ACCESS_TOKEN');
  const youtubeReady = !!envText(env, 'YOUTUBE_ACCESS_TOKEN');
  return {
    facebook: {
      platform_key: 'facebook', api_ready: facebookReady ? 1 : 0, publish_mode: facebookReady ? 'api_ready' : 'manual_ready',
      missing_env: facebookReady ? [] : ['FACEBOOK_PAGE_ID', 'FACEBOOK_PAGE_ACCESS_TOKEN'],
      notes: facebookReady ? 'API publishing can be attempted through the Facebook Page feed/photos endpoints.' : 'Manual/copy-paste ready. Add Page ID and Page access token as Cloudflare environment variables to attempt API publishing.'
    },
    instagram: {
      platform_key: 'instagram', api_ready: instagramReady ? 1 : 0, publish_mode: instagramReady ? 'api_ready' : 'manual_ready',
      missing_env: instagramReady ? [] : ['INSTAGRAM_USER_ID', 'INSTAGRAM_ACCESS_TOKEN or FACEBOOK_PAGE_ACCESS_TOKEN'],
      notes: instagramReady ? 'API image publishing can be attempted through the Instagram Content Publishing media/container flow.' : 'Manual/copy-paste ready. Instagram API publishing also requires a professional Instagram account connected through Meta.'
    },
    x: {
      platform_key: 'x', api_ready: xReady ? 1 : 0, publish_mode: xReady ? 'api_ready' : 'manual_ready',
      missing_env: xReady ? [] : ['X_USER_ACCESS_TOKEN'],
      notes: xReady ? 'API text/link publishing can be attempted through POST /2/tweets.' : 'Manual/copy-paste ready. Add an OAuth user access token with write permission to attempt API publishing.'
    },
    pinterest: {
      platform_key: 'pinterest', api_ready: pinterestReady ? 1 : 0, publish_mode: pinterestReady ? 'api_ready' : 'manual_ready',
      missing_env: pinterestReady ? [] : ['PINTEREST_ACCESS_TOKEN', 'PINTEREST_BOARD_ID'],
      notes: pinterestReady ? 'API image pin publishing can be attempted for public image URLs.' : 'Manual/copy-paste ready. Add access token and board ID for API pin publishing.'
    },
    tiktok: {
      platform_key: 'tiktok', api_ready: 0, publish_mode: tiktokReady ? 'credentials_detected_manual_review' : 'manual_ready',
      missing_env: tiktokReady ? [] : ['TIKTOK_ACCESS_TOKEN'],
      notes: 'Kept manual/review-first in this build. TikTok direct publishing needs the platform upload/publish flow and app approval before we should automate it.'
    },
    youtube: {
      platform_key: 'youtube', api_ready: 0, publish_mode: youtubeReady ? 'credentials_detected_manual_review' : 'manual_ready',
      missing_env: youtubeReady ? [] : ['YOUTUBE_ACCESS_TOKEN'],
      notes: 'Kept manual/review-first in this build. YouTube upload/community posting needs Google OAuth upload handling before we should automate it.'
    }
  };
}
async function tableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows(result).map((row) => String(row.name || '').toLowerCase()).filter(Boolean));
  } catch {
    return new Set();
  }
}
async function ensureColumn(db, tableName, columnName, sql) {
  const columns = await tableColumnSet(db, tableName);
  if (!columns.has(String(columnName || '').toLowerCase())) {
    await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${sql}`).run().catch(() => null);
  }
}
function safeResponseJson(text) {
  try { return JSON.parse(text || '{}'); } catch { return { raw: text || '' }; }
}
async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text().catch(() => '');
  return { response, body: safeResponseJson(text), text };
}
function absolutePostUrl(row, platform) {
  const url = safeUrl(row?.link_url || '');
  if (url) return url;
  const key = normalizeText(row?.social_post_key || '');
  return key ? `https://devilndove.com/?social=${encodeURIComponent(key)}&platform=${encodeURIComponent(platform)}` : '';
}
function platformCaption(row, platform) {
  const caption = normalizeText(row?.caption || buildCaption({
    title: row?.title || '',
    summary: row?.summary || '',
    hashtags: row?.hashtags || '',
    linkUrl: absolutePostUrl(row, platform)
  }));
  const link = absolutePostUrl(row, platform);
  if (platform === 'x') return trimTo([caption, link && !caption.includes(link) ? link : ''].filter(Boolean).join('\n'), 280);
  if (platform === 'pinterest') return trimTo(caption, 500);
  return trimTo(caption, 2200);
}
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS social_platform_connections (
    social_platform_connection_id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    profile_url TEXT,
    connection_status TEXT NOT NULL DEFAULT 'manual_ready',
    api_ready INTEGER NOT NULL DEFAULT 0,
    requires_oauth INTEGER NOT NULL DEFAULT 1,
    required_scopes TEXT,
    notes TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS social_post_queue (
    social_post_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
    social_post_key TEXT NOT NULL UNIQUE,
    source_type TEXT NOT NULL DEFAULT 'job_update',
    source_id TEXT,
    title TEXT NOT NULL,
    summary TEXT,
    caption TEXT,
    hashtags TEXT,
    target_platforms_json TEXT NOT NULL DEFAULT '[]',
    image_urls_json TEXT NOT NULL DEFAULT '[]',
    video_url TEXT,
    link_url TEXT,
    approval_status TEXT NOT NULL DEFAULT 'needs_review',
    post_status TEXT NOT NULL DEFAULT 'draft',
    scheduled_at TEXT,
    published_at TEXT,
    created_by_user_id INTEGER,
    updated_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS social_post_attempts (
    social_post_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
    social_post_queue_id INTEGER NOT NULL,
    platform_key TEXT NOT NULL,
    attempt_status TEXT NOT NULL DEFAULT 'manual_ready',
    external_post_url TEXT,
    external_post_id TEXT,
    response_json TEXT,
    attempted_by_user_id INTEGER,
    attempted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (social_post_queue_id) REFERENCES social_post_queue(social_post_queue_id)
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_social_post_queue_status ON social_post_queue(post_status, approval_status, scheduled_at)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_social_post_queue_source ON social_post_queue(source_type, source_id)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_social_post_attempts_queue ON social_post_attempts(social_post_queue_id, platform_key)`).run().catch(() => null);
  await ensureColumn(db, 'social_post_queue', 'last_publish_attempt_at', 'last_publish_attempt_at TEXT');
  await ensureColumn(db, 'social_post_queue', 'api_publish_mode', "api_publish_mode TEXT DEFAULT 'review_first'");
  await ensureColumn(db, 'social_post_attempts', 'request_mode', 'request_mode TEXT');
  await ensureColumn(db, 'social_post_attempts', 'http_status', 'http_status INTEGER');
  await ensureColumn(db, 'social_post_attempts', 'platform_response_id', 'platform_response_id TEXT');
  await ensureColumn(db, 'social_post_attempts', 'published_url', 'published_url TEXT');

  for (const platform of PLATFORM_DEFINITIONS) {
    await db.prepare(`INSERT INTO social_platform_connections (
      platform_key, display_name, connection_status, api_ready, requires_oauth, required_scopes, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(platform_key) DO UPDATE SET
      display_name = excluded.display_name,
      required_scopes = excluded.required_scopes,
      notes = COALESCE(social_platform_connections.notes, excluded.notes),
      updated_at = CURRENT_TIMESTAMP`).bind(
        platform.platform_key,
        platform.display_name,
        platform.connection_status,
        platform.api_ready,
        platform.requires_oauth,
        platform.required_scopes,
        platform.notes
      ).run().catch(() => null);
  }
}
async function summarize(db, env = {}) {
  await ensureSchema(db);
  const summary = await db.prepare(`SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN post_status IN ('draft','ready') THEN 1 ELSE 0 END) AS open_count,
    SUM(CASE WHEN approval_status='needs_review' THEN 1 ELSE 0 END) AS needs_review_count,
    SUM(CASE WHEN post_status='posted' THEN 1 ELSE 0 END) AS posted_count
    FROM social_post_queue`).first().catch(() => ({ total: 0, open_count: 0, needs_review_count: 0, posted_count: 0 }));
  const queue = rows(await db.prepare(`SELECT * FROM social_post_queue ORDER BY datetime(updated_at) DESC, social_post_queue_id DESC LIMIT 50`).all().catch(() => ({ results: [] })));
  const platforms = rows(await db.prepare(`SELECT * FROM social_platform_connections ORDER BY platform_key`).all().catch(() => ({ results: [] })));
  const attempts = rows(await db.prepare(`SELECT a.*, q.social_post_key FROM social_post_attempts a INNER JOIN social_post_queue q ON q.social_post_queue_id = a.social_post_queue_id ORDER BY datetime(a.attempted_at) DESC LIMIT 30`).all().catch(() => ({ results: [] })));
  const platform_readiness = getPlatformReadiness(env);
  const platformRows = platforms.map((platform) => ({
    ...platform,
    ...(platform_readiness[platform.platform_key] || {}),
    stored_api_ready: platform.api_ready
  }));
  return { summary, queue, platforms: platformRows, attempts, platform_readiness };
}
function normalizeQueueRow(row = {}) {
  return {
    ...row,
    target_platforms: safeJson(row.target_platforms_json, []),
    image_urls: safeJson(row.image_urls_json, [])
  };
}
async function createQueuedPost(db, adminUser, payload = {}) {
  const title = trimTo(payload.title || payload.job_title || payload.process_title || 'Workshop update', 140);
  const summary = trimTo(payload.summary || payload.description || '', 1200);
  const hashtags = normalizeHashtags(payload.hashtags || 'DevilnDove,HandmadeOntario,WorkshopMade,SmallBusinessCanada');
  const imageUrls = splitList(payload.image_urls || payload.image_url || payload.images).map(safeUrl).filter(Boolean).slice(0, 10);
  const videoUrl = safeUrl(payload.video_url || '');
  const linkUrl = safeUrl(payload.link_url || payload.product_url || '');
  const platforms = normalizePlatforms(payload.target_platforms || payload.platforms);
  const sourceType = slugKey(payload.source_type || 'job_update') || 'job_update';
  const sourceId = normalizeText(payload.source_id || payload.job_id || '');
  const caption = trimTo(payload.caption || buildCaption({ title, summary, hashtags, linkUrl }), 2200);
  const notes = normalizeText(payload.notes || '');
  const scheduledAt = normalizeText(payload.scheduled_at || '');
  const status = ['draft', 'ready'].includes(slugKey(payload.post_status)) ? slugKey(payload.post_status) : 'draft';
  const approval = status === 'ready' ? 'approved' : 'needs_review';
  const socialPostKey = buildQueueKey(`${sourceType}|${sourceId}|${title}|${summary}`);

  const insert = await db.prepare(`INSERT INTO social_post_queue (
    social_post_key, source_type, source_id, title, summary, caption, hashtags,
    target_platforms_json, image_urls_json, video_url, link_url, approval_status,
    post_status, scheduled_at, created_by_user_id, updated_by_user_id, notes, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    socialPostKey,
    sourceType,
    sourceId || null,
    title,
    summary || null,
    caption || null,
    hashtags || null,
    JSON.stringify(platforms),
    JSON.stringify(imageUrls),
    videoUrl || null,
    linkUrl || null,
    approval,
    status,
    scheduledAt || null,
    adminUser.user_id,
    adminUser.user_id,
    notes || null
  ).run();
  const socialPostQueueId = Number(insert?.meta?.last_row_id || 0);

  for (const platform of platforms) {
    await db.prepare(`INSERT INTO social_post_attempts (
      social_post_queue_id, platform_key, attempt_status, attempted_by_user_id, notes, attempted_at
    ) VALUES (?, ?, 'manual_ready', ?, 'Prepared for manual publishing/copy-paste.', CURRENT_TIMESTAMP)`).bind(
      socialPostQueueId,
      platform,
      adminUser.user_id
    ).run().catch(() => null);
  }

  return { social_post_queue_id: socialPostQueueId, social_post_key: socialPostKey };
}
async function updateStatus(db, adminUser, payload = {}) {
  const id = Number(payload.social_post_queue_id || 0);
  if (!id) throw new Error('A social_post_queue_id is required.');
  const postStatus = slugKey(payload.post_status || '');
  const approvalStatus = slugKey(payload.approval_status || '');
  const allowedPost = new Set(['draft', 'ready', 'posted', 'failed', 'archived']);
  const allowedApproval = new Set(['needs_review', 'approved', 'rejected']);
  const fields = [];
  const bindings = [];
  if (allowedPost.has(postStatus)) { fields.push('post_status = ?'); bindings.push(postStatus); }
  if (allowedApproval.has(approvalStatus)) { fields.push('approval_status = ?'); bindings.push(approvalStatus); }
  if (payload.notes !== undefined) { fields.push('notes = ?'); bindings.push(normalizeText(payload.notes) || null); }
  if (postStatus === 'posted') { fields.push('published_at = COALESCE(published_at, CURRENT_TIMESTAMP)'); }
  if (!fields.length) throw new Error('No valid status change was provided.');
  fields.push('updated_by_user_id = ?'); bindings.push(adminUser.user_id);
  fields.push('updated_at = CURRENT_TIMESTAMP');
  bindings.push(id);
  await db.prepare(`UPDATE social_post_queue SET ${fields.join(', ')} WHERE social_post_queue_id = ?`).bind(...bindings).run();
}
async function recordManualPost(db, adminUser, payload = {}) {
  const id = Number(payload.social_post_queue_id || 0);
  const platform = slugKey(payload.platform_key || payload.platform || '');
  if (!id || !platform) throw new Error('social_post_queue_id and platform_key are required.');
  const externalUrl = safeUrl(payload.external_post_url || '');
  const externalId = normalizeText(payload.external_post_id || '');
  await db.prepare(`INSERT INTO social_post_attempts (
    social_post_queue_id, platform_key, attempt_status, external_post_url, external_post_id,
    response_json, attempted_by_user_id, attempted_at, notes
  ) VALUES (?, ?, 'posted_manual', ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(
    id,
    platform,
    externalUrl || null,
    externalId || null,
    JSON.stringify({ mode: 'manual_record', recorded_at: new Date().toISOString() }),
    adminUser.user_id,
    normalizeText(payload.notes || 'Manual post recorded.')
  ).run();
  await db.prepare(`UPDATE social_post_queue SET post_status='posted', approval_status='approved', published_at=COALESCE(published_at,CURRENT_TIMESTAMP), updated_by_user_id=?, updated_at=CURRENT_TIMESTAMP WHERE social_post_queue_id=?`).bind(adminUser.user_id, id).run();
}
async function generateFromRecentMedia(db, adminUser) {
  const mediaRows = rows(await db.prepare(`SELECT public_url, original_filename, variant_role, annotation_notes, created_at FROM media_assets WHERE COALESCE(public_url,'') <> '' ORDER BY datetime(created_at) DESC LIMIT 6`).all().catch(() => ({ results: [] })));
  if (!mediaRows.length) throw new Error('No recent media assets with public URLs were found. Upload job/process images first.');
  const imageUrls = mediaRows.map((row) => row.public_url).filter(Boolean);
  return createQueuedPost(db, adminUser, {
    source_type: 'recent_media',
    title: 'Fresh from the Devil n Dove workshop',
    summary: 'A quick behind-the-scenes look at what we are making, testing, repairing, or learning in the shop today.',
    image_urls: imageUrls,
    hashtags: 'DevilnDove,WorkshopMade,HandmadeOntario,SmallBusinessCanada,BehindTheScenes',
    target_platforms: ['facebook', 'instagram', 'tiktok', 'x'],
    notes: `Generated from ${imageUrls.length} recent media asset(s). Review and edit before posting.`
  });
}

async function publishToFacebook(env, row, images) {
  const pageId = envText(env, 'FACEBOOK_PAGE_ID', 'META_PAGE_ID');
  const token = envText(env, 'FACEBOOK_PAGE_ACCESS_TOKEN', 'META_PAGE_ACCESS_TOKEN');
  if (!pageId || !token) throw new Error('Facebook API credentials are missing. Add FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN.');
  const caption = platformCaption(row, 'facebook');
  const version = envText(env, 'META_GRAPH_API_VERSION') || 'v20.0';
  const url = images[0]
    ? `https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}/photos`
    : `https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}/feed`;
  const body = new URLSearchParams();
  body.set('access_token', token);
  if (images[0]) {
    body.set('url', images[0]);
    body.set('caption', caption);
  } else {
    body.set('message', caption);
  }
  const { response, body: responseBody, text } = await fetchJson(url, { method: 'POST', body });
  if (!response.ok) throw new Error(`Facebook publish failed (${response.status}): ${responseBody?.error?.message || text || 'unknown error'}`);
  return { id: responseBody.post_id || responseBody.id || '', url: responseBody.post_id ? `https://www.facebook.com/${responseBody.post_id}` : '', response: responseBody, http_status: response.status };
}
async function publishToInstagram(env, row, images) {
  const igUserId = envText(env, 'INSTAGRAM_USER_ID', 'IG_USER_ID', 'INSTAGRAM_BUSINESS_ACCOUNT_ID');
  const token = envText(env, 'INSTAGRAM_ACCESS_TOKEN', 'META_PAGE_ACCESS_TOKEN', 'FACEBOOK_PAGE_ACCESS_TOKEN');
  if (!igUserId || !token) throw new Error('Instagram API credentials are missing. Add INSTAGRAM_USER_ID and INSTAGRAM_ACCESS_TOKEN or FACEBOOK_PAGE_ACCESS_TOKEN.');
  if (!images[0]) throw new Error('Instagram publishing needs at least one public image URL.');
  const version = envText(env, 'META_GRAPH_API_VERSION') || 'v20.0';
  const createBody = new URLSearchParams();
  createBody.set('access_token', token);
  createBody.set('image_url', images[0]);
  createBody.set('caption', platformCaption(row, 'instagram'));
  const createResult = await fetchJson(`https://graph.facebook.com/${version}/${encodeURIComponent(igUserId)}/media`, { method: 'POST', body: createBody });
  if (!createResult.response.ok || !createResult.body?.id) throw new Error(`Instagram media container failed (${createResult.response.status}): ${createResult.body?.error?.message || createResult.text || 'unknown error'}`);
  const publishBody = new URLSearchParams();
  publishBody.set('access_token', token);
  publishBody.set('creation_id', createResult.body.id);
  const publishResult = await fetchJson(`https://graph.facebook.com/${version}/${encodeURIComponent(igUserId)}/media_publish`, { method: 'POST', body: publishBody });
  if (!publishResult.response.ok) throw new Error(`Instagram publish failed (${publishResult.response.status}): ${publishResult.body?.error?.message || publishResult.text || 'unknown error'}`);
  return { id: publishResult.body?.id || createResult.body.id || '', url: '', response: { create: createResult.body, publish: publishResult.body }, http_status: publishResult.response.status };
}
async function publishToX(env, row) {
  const token = envText(env, 'X_USER_ACCESS_TOKEN', 'TWITTER_USER_ACCESS_TOKEN');
  if (!token) throw new Error('X API token is missing. Add X_USER_ACCESS_TOKEN with post/write permission.');
  const text = platformCaption(row, 'x');
  if (!text) throw new Error('X post text is empty. Add a caption before publishing.');
  const { response, body, text: raw } = await fetchJson('https://api.x.com/2/tweets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!response.ok) throw new Error(`X publish failed (${response.status}): ${body?.detail || body?.title || body?.errors?.[0]?.message || raw || 'unknown error'}`);
  const id = body?.data?.id || '';
  return { id, url: id ? `https://x.com/i/web/status/${id}` : '', response: body, http_status: response.status };
}
async function publishToPinterest(env, row, images) {
  const token = envText(env, 'PINTEREST_ACCESS_TOKEN');
  const boardId = envText(env, 'PINTEREST_BOARD_ID');
  if (!token || !boardId) throw new Error('Pinterest API credentials are missing. Add PINTEREST_ACCESS_TOKEN and PINTEREST_BOARD_ID.');
  if (!images[0]) throw new Error('Pinterest publishing needs at least one public image URL.');
  const payload = {
    board_id: boardId,
    title: trimTo(row.title || 'Devil n Dove workshop update', 100),
    description: platformCaption(row, 'pinterest'),
    link: absolutePostUrl(row, 'pinterest') || undefined,
    media_source: { source_type: 'image_url', url: images[0] }
  };
  const { response, body, text } = await fetchJson('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Pinterest publish failed (${response.status}): ${body?.message || text || 'unknown error'}`);
  return { id: body?.id || '', url: body?.link || '', response: body, http_status: response.status };
}
async function recordApiAttempt(db, adminUser, id, platform, status, details = {}) {
  await db.prepare(`INSERT INTO social_post_attempts (
    social_post_queue_id, platform_key, attempt_status, external_post_url, external_post_id,
    platform_response_id, published_url, request_mode, http_status, response_json,
    attempted_by_user_id, attempted_at, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, 'api', ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(
    id,
    platform,
    status,
    details.external_post_url || details.url || null,
    details.external_post_id || details.id || null,
    details.platform_response_id || details.id || null,
    details.published_url || details.url || null,
    details.http_status || null,
    JSON.stringify(details.response || details.error || details || {}),
    adminUser.user_id,
    details.notes || null
  ).run().catch(async () => {
    await db.prepare(`INSERT INTO social_post_attempts (
      social_post_queue_id, platform_key, attempt_status, external_post_url, external_post_id,
      response_json, attempted_by_user_id, attempted_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(
      id,
      platform,
      status,
      details.external_post_url || details.url || null,
      details.external_post_id || details.id || null,
      JSON.stringify(details.response || details.error || details || {}),
      adminUser.user_id,
      details.notes || null
    ).run().catch(() => null);
  });
}
async function publishQueuedPost(context, db, adminUser, payload = {}) {
  const id = Number(payload.social_post_queue_id || 0);
  if (!id) throw new Error('A social_post_queue_id is required.');
  const row = await db.prepare(`SELECT * FROM social_post_queue WHERE social_post_queue_id = ? LIMIT 1`).bind(id).first();
  if (!row) throw new Error('Queued social post not found.');
  const queuedPlatforms = safeJson(row.target_platforms_json, []);
  const selected = normalizePlatforms(payload.platform_keys || payload.platforms || queuedPlatforms);
  const images = safeJson(row.image_urls_json, []).map(safeUrl).filter(Boolean);
  const readiness = getPlatformReadiness(context.env);
  const results = [];

  await db.prepare(`UPDATE social_post_queue SET last_publish_attempt_at=CURRENT_TIMESTAMP, updated_by_user_id=?, updated_at=CURRENT_TIMESTAMP WHERE social_post_queue_id=?`).bind(adminUser.user_id, id).run().catch(() => null);

  for (const platform of selected) {
    if (row.approval_status !== 'approved' && payload.force !== true) {
      const blocked = { platform, status: 'blocked_needs_approval', notes: 'Approve/ready the queue item before API publishing.' };
      await recordApiAttempt(db, adminUser, id, platform, 'blocked_needs_approval', blocked);
      results.push(blocked);
      continue;
    }
    if (['tiktok', 'youtube'].includes(platform)) {
      const manual = { platform, status: 'manual_pending', notes: readiness[platform]?.notes || 'This platform remains manual/review-first in this build.' };
      await recordApiAttempt(db, adminUser, id, platform, 'manual_pending', manual);
      results.push(manual);
      continue;
    }
    if (!readiness[platform]?.api_ready) {
      const missing = { platform, status: 'credentials_missing', notes: readiness[platform]?.notes || 'Missing platform credentials.', missing_env: readiness[platform]?.missing_env || [] };
      await recordApiAttempt(db, adminUser, id, platform, 'credentials_missing', missing);
      results.push(missing);
      continue;
    }
    try {
      let published;
      if (platform === 'facebook') published = await publishToFacebook(context.env, row, images);
      else if (platform === 'instagram') published = await publishToInstagram(context.env, row, images);
      else if (platform === 'x') published = await publishToX(context.env, row, images);
      else if (platform === 'pinterest') published = await publishToPinterest(context.env, row, images);
      else throw new Error(`API publishing is not implemented for ${platform}.`);
      await recordApiAttempt(db, adminUser, id, platform, 'api_posted', {
        platform,
        id: published.id,
        url: published.url,
        external_post_id: published.id,
        external_post_url: published.url,
        published_url: published.url,
        http_status: published.http_status,
        response: published.response,
        notes: 'Published through configured platform API.'
      });
      results.push({ platform, status: 'api_posted', external_post_id: published.id, external_post_url: published.url, http_status: published.http_status });
    } catch (error) {
      const failure = { platform, status: 'api_failed', error: error?.message || String(error || 'Publish failed.') };
      await recordApiAttempt(db, adminUser, id, platform, 'api_failed', failure);
      results.push(failure);
    }
  }
  const postedCount = results.filter((row) => row.status === 'api_posted').length;
  const failedCount = results.filter((row) => row.status === 'api_failed').length;
  const terminal = postedCount && !failedCount && results.every((row) => ['api_posted', 'manual_pending'].includes(row.status)) ? 'posted' : postedCount ? 'ready' : failedCount ? 'failed' : 'ready';
  await db.prepare(`UPDATE social_post_queue
    SET post_status = ?, published_at = CASE WHEN ?='posted' THEN COALESCE(published_at,CURRENT_TIMESTAMP) ELSE published_at END,
        updated_by_user_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE social_post_queue_id = ?`).bind(terminal, terminal, adminUser.user_id, id).run().catch(() => null);
  return { social_post_queue_id: id, attempted_platforms: selected, results };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  try {
    const data = await summarize(db, context.env);
    return jsonResponse({ ok: true, ...data, queue: data.queue.map(normalizeQueueRow), mode: 'review_first_api_when_configured' }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'admin_social',
      incident_code: 'social_queue_get_failed',
      severity: 'error',
      message: error?.message || 'Social queue failed to load.',
      details: { error: String(error?.stack || error?.message || error) },
      related_user_id: adminUser.user_id
    });
    return jsonResponse({ ok: false, error: error?.message || 'Social queue failed to load.' }, 500);
  }
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  let payload = {};
  try { payload = await context.request.json(); } catch { payload = {}; }
  const action = slugKey(payload.action || 'create');

  try {
    await ensureSchema(db);
    let result = {};
    if (action === 'create') result = await createQueuedPost(db, adminUser, payload);
    else if (action === 'update_status') await updateStatus(db, adminUser, payload);
    else if (action === 'record_manual_post') await recordManualPost(db, adminUser, payload);
    else if (action === 'generate_from_recent_media') result = await generateFromRecentMedia(db, adminUser);
    else if (action === 'publish_platforms') result = await publishQueuedPost(context, db, adminUser, payload);
    else throw new Error(`Unsupported social queue action: ${action}`);

    await auditAdminAction(context.env, context.request, adminUser, {
      action_type: `social_queue_${action}`,
      target_type: 'social_post_queue',
      target_id: result.social_post_queue_id || payload.social_post_queue_id || null,
      target_key: result.social_post_key || null,
      details: { action, platforms: payload.target_platforms || payload.platforms || null }
    });

    const data = await summarize(db, context.env);
    return jsonResponse({ ok: true, message: 'Social queue updated.', result, ...data, queue: data.queue.map(normalizeQueueRow), mode: 'review_first_api_when_configured' }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'admin_social',
      incident_code: 'social_queue_post_failed',
      severity: 'error',
      message: error?.message || 'Social queue update failed.',
      details: { action, error: String(error?.stack || error?.message || error) },
      related_user_id: adminUser.user_id
    });
    return jsonResponse({ ok: false, error: error?.message || 'Social queue update failed.' }, 500);
  }
}
