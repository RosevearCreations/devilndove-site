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

const CAPTION_TEMPLATES = [
  {
    template_key: 'making_story',
    display_name: 'Making story / in progress',
    content_pillar: 'behind_the_scenes',
    default_platforms_json: JSON.stringify(['facebook', 'instagram', 'tiktok', 'x']),
    default_hashtags: '#DevilnDove #HandmadeOntario #WorkshopMade #SmallBusinessCanada',
    body_template: '{title}\n\n{summary}\n\n{cta}\n\n{link}\n\n{hashtags}',
    call_to_action: 'Follow along as we turn shop experiments into one-of-a-kind pieces.',
    notes: 'Use while a crafting job or workshop experiment is in progress.'
  },
  {
    template_key: 'finished_product',
    display_name: 'Finished product / shop-ready',
    content_pillar: 'finished_goods',
    default_platforms_json: JSON.stringify(['facebook', 'instagram', 'pinterest', 'x']),
    default_hashtags: '#DevilnDove #HandmadeGifts #OntarioMaker #ShopSmallCanada',
    body_template: '{title}\n\n{summary}\n\n{cta}\n\n{link}\n\n{hashtags}',
    call_to_action: 'See the finished piece, details, and availability here:',
    notes: 'Use for product launches, gallery items, vintage finds, and ready-to-sell pieces.'
  },
  {
    template_key: 'shop_oops',
    display_name: 'Funny shop moment / oops',
    content_pillar: 'human_story',
    default_platforms_json: JSON.stringify(['facebook', 'instagram', 'tiktok', 'x']),
    default_hashtags: '#DevilnDove #MakerLife #WorkshopOops #CreativeProcess',
    body_template: '{title}\n\n{summary}\n\n{cta}\n\n{hashtags}',
    call_to_action: 'We are calling this one “learning with character.”',
    notes: 'Use for light, human, therapy-workshop moments that should not sound too polished.'
  },
  {
    template_key: 'local_market',
    display_name: 'Local Ontario update / event',
    content_pillar: 'local_presence',
    default_platforms_json: JSON.stringify(['facebook', 'instagram', 'x']),
    default_hashtags: '#DevilnDove #SouthernOntario #TillsonburgOntario #OntarioSmallBusiness',
    body_template: '{title}\n\n{summary}\n\n{cta}\n\n{link}\n\n{hashtags}',
    call_to_action: 'Local friends can message us with questions or pickup ideas.',
    notes: 'Use when relevance to Southern Ontario/Tillsonburg/local shoppers matters.'
  },
  {
    template_key: 'laser_engraving',
    display_name: 'Laser engraving / personalized gift',
    content_pillar: 'custom_work',
    default_platforms_json: JSON.stringify(['facebook', 'instagram', 'pinterest', 'x']),
    default_hashtags: '#DevilnDove #LaserEngravingOntario #CustomGiftsOntario #WorkshopMade',
    body_template: '{title}\n\n{summary}\n\n{cta}\n\n{link}\n\n{hashtags}',
    call_to_action: 'Ask us about making something similar with your own wording or idea.',
    notes: 'Use for engraving jobs, custom gift ideas, and personalized workshop updates.'
  },
  {
    template_key: 'vintage_find',
    display_name: 'Vintage find / collected item',
    content_pillar: 'vintage_collectibles',
    default_platforms_json: JSON.stringify(['facebook', 'instagram', 'pinterest', 'x']),
    default_hashtags: '#DevilnDove #VintageFindsOntario #CollectiblesCanada #ShopSmallCanada',
    body_template: '{title}\n\n{summary}\n\n{cta}\n\n{link}\n\n{hashtags}',
    call_to_action: 'Condition, story, and availability details are listed here:',
    notes: 'Use for sourced vintage/collectible/antiquity items.'
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
async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(tableName).first();
    return !!row?.name;
  } catch { return false; }
}
async function ensureUtmAnalyticsColumns(db) {
  for (const tableName of ['site_visitor_sessions', 'site_page_views', 'custom_requests']) {
    if (!(await tableExists(db, tableName))) continue;
    await ensureColumn(db, tableName, 'utm_source', 'utm_source TEXT');
    await ensureColumn(db, tableName, 'utm_medium', 'utm_medium TEXT');
    await ensureColumn(db, tableName, 'utm_campaign', 'utm_campaign TEXT');
    await ensureColumn(db, tableName, 'utm_content', 'utm_content TEXT');
    await ensureColumn(db, tableName, 'utm_term', 'utm_term TEXT');
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
  const utmUrl = safeUrl(row?.utm_url || '');
  if (utmUrl) return utmUrl;
  const url = safeUrl(row?.link_url || '');
  if (url) return url;
  const key = normalizeText(row?.social_post_key || '');
  return key ? `https://devilndove.com/?social=${encodeURIComponent(key)}&platform=${encodeURIComponent(platform)}` : '';
}
function platformCaption(row, platform) {
  const overrides = safeJson(row?.platform_caption_overrides_json, {});
  const override = normalizeText(overrides?.[platform] || overrides?.[String(platform || '').toLowerCase()] || '');
  const caption = override || normalizeText(row?.caption || buildCaption({
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
function stableHash(value) {
  const raw = normalizeText(value);
  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

async function templateByKey(db, key) {
  const clean = slugKey(key || '');
  if (!clean) return null;
  const stored = await db.prepare(`SELECT * FROM social_caption_templates WHERE template_key = ? AND COALESCE(is_active,1)=1 LIMIT 1`).bind(clean).first().catch(() => null);
  return stored || CAPTION_TEMPLATES.find((template) => template.template_key === clean) || null;
}
function fillCaptionTemplate(template, values = {}) {
  if (!template) return '';
  const map = {
    title: normalizeText(values.title || ''),
    summary: normalizeText(values.summary || ''),
    cta: normalizeText(values.call_to_action || template.call_to_action || ''),
    link: safeUrl(values.link_url || values.utm_url || ''),
    hashtags: normalizeText(values.hashtags || template.default_hashtags || '')
  };
  return trimTo(String(template.body_template || '')
    .replace(/\{title\}/g, map.title)
    .replace(/\{summary\}/g, map.summary)
    .replace(/\{cta\}/g, map.cta)
    .replace(/\{link\}/g, map.link)
    .replace(/\{hashtags\}/g, map.hashtags)
    .replace(/\n{3,}/g, '\n\n')
    .trim(), 2200);
}
function buildUtmUrl(linkUrl, payload = {}, platforms = []) {
  const clean = safeUrl(linkUrl || '');
  if (!clean) return '';
  try {
    const url = new URL(clean, 'https://devilndove.com');
    const source = normalizeText(payload.utm_source || 'devilndove_social');
    const medium = normalizeText(payload.utm_medium || 'social');
    const campaign = slugKey(payload.utm_campaign || payload.caption_template_key || payload.source_type || 'workshop_update');
    const content = normalizePlatforms(platforms || payload.target_platforms || payload.platforms || []).join('-') || 'social';
    if (source && !url.searchParams.has('utm_source')) url.searchParams.set('utm_source', source);
    if (medium && !url.searchParams.has('utm_medium')) url.searchParams.set('utm_medium', medium);
    if (campaign && !url.searchParams.has('utm_campaign')) url.searchParams.set('utm_campaign', campaign);
    if (content && !url.searchParams.has('utm_content')) url.searchParams.set('utm_content', content);
    return url.toString();
  } catch {
    return clean;
  }
}

function normalizeCaptionOverrides(payload = {}, platforms = []) {
  const source = typeof payload.platform_captions === 'object' && payload.platform_captions ? payload.platform_captions : {};
  const aliases = { facebook: 'facebook_caption', instagram: 'instagram_caption', tiktok: 'tiktok_caption', x: 'x_caption', youtube: 'youtube_caption', pinterest: 'pinterest_caption' };
  const result = {};
  for (const platform of platforms) {
    const value = normalizeText(source[platform] || payload[aliases[platform]] || '');
    if (!value) continue;
    const limit = platform === 'x' ? 280 : platform === 'pinterest' ? 500 : 2200;
    result[platform] = trimTo(value, limit);
  }
  return result;
}
function buildDuplicateSignature({ title, caption, imageUrls, platforms, linkUrl }) {
  return stableHash(JSON.stringify({
    title: normalizeText(title).toLowerCase(),
    caption: normalizeText(caption).toLowerCase(),
    image_urls: [...new Set((imageUrls || []).map(safeUrl).filter(Boolean))].sort(),
    platforms: [...new Set((platforms || []).map(slugKey).filter(Boolean))].sort(),
    link_url: safeUrl(linkUrl || '')
  }));
}
function parseScheduledAt(value) {
  const clean = normalizeText(value);
  if (!clean) return '';
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) return clean;
  return parsed.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
function isScheduledInFuture(value) {
  const clean = normalizeText(value);
  if (!clean) return false;
  const parsed = new Date(clean);
  return Number.isFinite(parsed.getTime()) && parsed.getTime() > Date.now() + 60_000;
}
function buildMediaWarnings({ platforms = [], imageUrls = [], videoUrl = '', caption = '' }) {
  const warnings = [];
  const imageCount = imageUrls.length;
  const needsImage = platforms.some((platform) => ['instagram', 'pinterest', 'tiktok'].includes(platform));
  if (needsImage && !imageCount) warnings.push('Instagram, Pinterest, and TikTok-style posts should have at least one public image URL before publishing.');
  if (imageCount > 10) warnings.push('More than 10 images were supplied; only the first 10 are retained for the queue.');
  for (const url of imageUrls) {
    if (!/^https:\/\//i.test(url)) warnings.push(`Image URL is not HTTPS/public: ${url}`);
    if (/localhost|127\.0\.0\.1|file:/i.test(url)) warnings.push(`Image URL looks private/local and will not work for social platforms: ${url}`);
  }
  if (platforms.includes('x') && normalizeText(caption).length > 280) warnings.push('The X caption will be trimmed to 280 characters during payload generation.');
  if (videoUrl && !/^https:\/\//i.test(videoUrl)) warnings.push('Video URL is not HTTPS/public; video-first platforms may reject it.');
  return [...new Set(warnings)];
}
function platformPayload(row, platform, env = {}) {
  const images = safeJson(row.image_urls_json, []).map(safeUrl).filter(Boolean);
  const caption = platformCaption(row, platform);
  const link = absolutePostUrl(row, platform);
  const readiness = getPlatformReadiness(env)[platform] || { api_ready: 0, missing_env: [] };
  const base = { platform, api_ready: !!readiness.api_ready, missing_env: readiness.missing_env || [], caption, link_url: link || '', image_count: images.length, first_image_url: images[0] || '' };
  if (platform === 'facebook') return { ...base, method: 'POST', endpoint_template: 'https://graph.facebook.com/v25.0/{FACEBOOK_PAGE_ID}/feed or /photos', body_preview: { message: caption, link: link || undefined, url: images[0] || undefined } };
  if (platform === 'instagram') return { ...base, method: 'POST', endpoint_template: 'https://graph.facebook.com/v25.0/{INSTAGRAM_USER_ID}/media then /media_publish', body_preview: { image_url: images[0] || '', caption } };
  if (platform === 'x') return { ...base, method: 'POST', endpoint_template: 'https://api.x.com/2/tweets', body_preview: { text: caption } };
  if (platform === 'pinterest') return { ...base, method: 'POST', endpoint_template: 'https://api.pinterest.com/v5/pins', body_preview: { board_id: '{PINTEREST_BOARD_ID}', title: trimTo(row.title || 'Devil n Dove workshop update', 100), description: caption, link: link || undefined, media_source: images[0] ? { source_type: 'image_url', url: images[0] } : undefined } };
  return { ...base, method: 'manual', endpoint_template: 'manual/copy-paste for now', body_preview: { caption, media: images, video_url: row.video_url || '' } };
}
function buildDryRunPayload(row, selectedPlatforms, env = {}) {
  const platforms = normalizePlatforms(selectedPlatforms || safeJson(row.target_platforms_json, []));
  const images = safeJson(row.image_urls_json, []).map(safeUrl).filter(Boolean);
  const warnings = buildMediaWarnings({ platforms, imageUrls: images, videoUrl: row.video_url || '', caption: row.caption || '' });
  return {
    social_post_queue_id: Number(row.social_post_queue_id || 0),
    scheduled_at: row.scheduled_at || null,
    blocked_until_schedule: isScheduledInFuture(row.scheduled_at),
    do_not_repost: Number(row.do_not_repost || 0) === 1,
    media_quality_warnings: warnings,
    platform_payloads: platforms.map((platform) => platformPayload(row, platform, env))
  };
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
  await db.prepare(`CREATE TABLE IF NOT EXISTS social_caption_templates (
    social_caption_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    content_pillar TEXT,
    default_platforms_json TEXT NOT NULL DEFAULT '[]',
    default_hashtags TEXT,
    body_template TEXT NOT NULL,
    call_to_action TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_social_caption_templates_active ON social_caption_templates(is_active, content_pillar)`).run().catch(() => null);
  for (const template of CAPTION_TEMPLATES) {
    await db.prepare(`INSERT INTO social_caption_templates (
      template_key, display_name, content_pillar, default_platforms_json, default_hashtags,
      body_template, call_to_action, is_active, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(template_key) DO NOTHING`).bind(
      template.template_key,
      template.display_name,
      template.content_pillar,
      template.default_platforms_json,
      template.default_hashtags,
      template.body_template,
      template.call_to_action,
      template.notes
    ).run().catch(() => null);
  }
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_social_post_queue_status ON social_post_queue(post_status, approval_status, scheduled_at)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_social_post_queue_source ON social_post_queue(source_type, source_id)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_social_post_attempts_queue ON social_post_attempts(social_post_queue_id, platform_key)`).run().catch(() => null);
  await ensureColumn(db, 'social_post_queue', 'last_publish_attempt_at', 'last_publish_attempt_at TEXT');
  await ensureColumn(db, 'social_post_queue', 'api_publish_mode', "api_publish_mode TEXT DEFAULT 'review_first'");
  await ensureColumn(db, 'social_post_attempts', 'request_mode', 'request_mode TEXT');
  await ensureColumn(db, 'social_post_attempts', 'http_status', 'http_status INTEGER');
  await ensureColumn(db, 'social_post_attempts', 'platform_response_id', 'platform_response_id TEXT');
  await ensureColumn(db, 'social_post_attempts', 'published_url', 'published_url TEXT');
  await ensureColumn(db, 'social_post_queue', 'platform_caption_overrides_json', "platform_caption_overrides_json TEXT DEFAULT '{}'");
  await ensureColumn(db, 'social_post_queue', 'media_quality_warnings_json', "media_quality_warnings_json TEXT DEFAULT '[]'");
  await ensureColumn(db, 'social_post_queue', 'duplicate_signature', 'duplicate_signature TEXT');
  await ensureColumn(db, 'social_post_queue', 'do_not_repost', 'do_not_repost INTEGER DEFAULT 0');
  await ensureColumn(db, 'social_post_queue', 'schedule_timezone', 'schedule_timezone TEXT');
  await ensureColumn(db, 'social_post_queue', 'dry_run_payload_json', "dry_run_payload_json TEXT DEFAULT '{}'");
  await ensureColumn(db, 'social_post_queue', 'last_dry_run_at', 'last_dry_run_at TEXT');
  await ensureColumn(db, 'social_post_queue', 'caption_template_key', 'caption_template_key TEXT');
  await ensureColumn(db, 'social_post_queue', 'content_pillar', 'content_pillar TEXT');
  await ensureColumn(db, 'social_post_queue', 'call_to_action', 'call_to_action TEXT');
  await ensureColumn(db, 'social_post_queue', 'utm_source', 'utm_source TEXT');
  await ensureColumn(db, 'social_post_queue', 'utm_medium', 'utm_medium TEXT');
  await ensureColumn(db, 'social_post_queue', 'utm_campaign', 'utm_campaign TEXT');
  await ensureColumn(db, 'social_post_queue', 'utm_url', 'utm_url TEXT');
  await ensureColumn(db, 'social_post_queue', 'privacy_status', "privacy_status TEXT DEFAULT 'needs_review'");
  await ensureColumn(db, 'social_post_queue', 'privacy_notes', 'privacy_notes TEXT');
  await ensureColumn(db, 'social_post_queue', 'media_consent_required', 'media_consent_required INTEGER DEFAULT 1');
  await ensureColumn(db, 'social_post_queue', 'customer_media_present', 'customer_media_present INTEGER DEFAULT 0');
  await ensureColumn(db, 'social_post_queue', 'approved_for_public_post', 'approved_for_public_post INTEGER DEFAULT 0');
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_social_post_queue_duplicate ON social_post_queue(duplicate_signature, do_not_repost)`).run().catch(() => null);

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
  // Build 197: dashboard reads do not run a large DDL/seed pass. The deployment migration owns schema changes.
  const summary = await db.prepare(`SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN post_status IN ('draft','ready') THEN 1 ELSE 0 END) AS open_count,
    SUM(CASE WHEN approval_status='needs_review' THEN 1 ELSE 0 END) AS needs_review_count,
    SUM(CASE WHEN post_status='posted' THEN 1 ELSE 0 END) AS posted_count,
    SUM(CASE WHEN COALESCE(scheduled_at,'') <> '' AND datetime(scheduled_at) > datetime('now') AND post_status IN ('draft','ready') THEN 1 ELSE 0 END) AS scheduled_count,
    SUM(CASE WHEN COALESCE(scheduled_at,'') <> '' AND datetime(scheduled_at) <= datetime('now') AND post_status='ready' AND approval_status='approved' THEN 1 ELSE 0 END) AS due_count,
    SUM(CASE WHEN COALESCE(do_not_repost,0)=1 AND post_status IN ('draft','ready') THEN 1 ELSE 0 END) AS duplicate_warning_count
    FROM social_post_queue`).first().catch(() => ({ total: 0, open_count: 0, needs_review_count: 0, posted_count: 0, scheduled_count: 0, due_count: 0, duplicate_warning_count: 0 }));
  const queue = rows(await db.prepare(`SELECT * FROM social_post_queue ORDER BY datetime(updated_at) DESC, social_post_queue_id DESC LIMIT 50`).all().catch(() => ({ results: [] })));
  const platforms = rows(await db.prepare(`SELECT * FROM social_platform_connections ORDER BY platform_key`).all().catch(() => ({ results: [] })));
  const attempts = rows(await db.prepare(`SELECT a.*, q.social_post_key FROM social_post_attempts a INNER JOIN social_post_queue q ON q.social_post_queue_id = a.social_post_queue_id ORDER BY datetime(a.attempted_at) DESC LIMIT 30`).all().catch(() => ({ results: [] })));
  const templates = rows(await db.prepare(`SELECT * FROM social_caption_templates WHERE COALESCE(is_active,1)=1 ORDER BY content_pillar, display_name`).all().catch(() => ({ results: [] })));
  const calendar = rows(await db.prepare(`SELECT
      substr(COALESCE(scheduled_at, created_at), 1, 10) AS calendar_date,
      COUNT(*) AS total,
      SUM(CASE WHEN post_status='ready' AND approval_status='approved' THEN 1 ELSE 0 END) AS ready_count,
      SUM(CASE WHEN post_status='posted' THEN 1 ELSE 0 END) AS posted_count,
      SUM(CASE WHEN COALESCE(do_not_repost,0)=1 THEN 1 ELSE 0 END) AS duplicate_warning_count
    FROM social_post_queue
    WHERE datetime(COALESCE(scheduled_at, created_at, datetime('now'))) >= datetime('now','-7 days')
      AND datetime(COALESCE(scheduled_at, created_at, datetime('now'))) <= datetime('now','+45 days')
      AND COALESCE(post_status,'draft') <> 'archived'
    GROUP BY calendar_date
    ORDER BY calendar_date ASC
    LIMIT 60`).all().catch(() => ({ results: [] })));
  await ensureUtmAnalyticsColumns(db);
  const hasPageViews = await tableExists(db, 'site_page_views');
  const hasSessions = await tableExists(db, 'site_visitor_sessions');
  const hasCustomRequests = await tableExists(db, 'custom_requests');
  const utm_rollups = rows(await db.prepare(`${hasPageViews || hasSessions || hasCustomRequests ? `WITH
    q AS (
      SELECT COALESCE(NULLIF(utm_source,''),'unknown') AS utm_source,
             COALESCE(NULLIF(utm_medium,''),'social') AS utm_medium,
             COALESCE(NULLIF(utm_campaign,''),'uncategorized') AS utm_campaign,
             COUNT(*) AS total_posts,
             SUM(CASE WHEN post_status='posted' THEN 1 ELSE 0 END) AS posted_count,
             SUM(CASE WHEN post_status IN ('draft','ready') THEN 1 ELSE 0 END) AS open_count,
             SUM(CASE WHEN approval_status='approved' THEN 1 ELSE 0 END) AS approved_count
      FROM social_post_queue
      WHERE COALESCE(post_status,'draft') <> 'archived'
      GROUP BY utm_source, utm_medium, utm_campaign
    ),
    v AS (${hasPageViews ? `SELECT COALESCE(NULLIF(utm_source,''),'unknown') AS utm_source, COALESCE(NULLIF(utm_medium,''),'social') AS utm_medium, COALESCE(NULLIF(utm_campaign,''),'uncategorized') AS utm_campaign, COUNT(*) AS page_views, COUNT(DISTINCT site_visitor_session_id) AS visitor_sessions, SUM(CASE WHEN path LIKE '/checkout%' THEN 1 ELSE 0 END) AS checkout_views FROM site_page_views WHERE COALESCE(utm_campaign,'') <> '' GROUP BY utm_source, utm_medium, utm_campaign` : `SELECT 'none' AS utm_source, 'none' AS utm_medium, 'none' AS utm_campaign, 0 AS page_views, 0 AS visitor_sessions, 0 AS checkout_views WHERE 0`}),
    s AS (${hasSessions ? `SELECT COALESCE(NULLIF(utm_source,''),'unknown') AS utm_source, COALESCE(NULLIF(utm_medium,''),'social') AS utm_medium, COALESCE(NULLIF(utm_campaign,''),'uncategorized') AS utm_campaign, COUNT(*) AS session_count, SUM(CASE WHEN is_checkout_started=1 THEN 1 ELSE 0 END) AS checkout_starts, SUM(CASE WHEN is_abandoned_cart=1 THEN 1 ELSE 0 END) AS abandoned_carts FROM site_visitor_sessions WHERE COALESCE(utm_campaign,'') <> '' GROUP BY utm_source, utm_medium, utm_campaign` : `SELECT 'none' AS utm_source, 'none' AS utm_medium, 'none' AS utm_campaign, 0 AS session_count, 0 AS checkout_starts, 0 AS abandoned_carts WHERE 0`}),
    cr AS (${hasCustomRequests ? `SELECT COALESCE(NULLIF(utm_source,''),'unknown') AS utm_source, COALESCE(NULLIF(utm_medium,''),'social') AS utm_medium, COALESCE(NULLIF(utm_campaign,''),'uncategorized') AS utm_campaign, COUNT(*) AS custom_request_count FROM custom_requests WHERE COALESCE(utm_campaign,'') <> '' GROUP BY utm_source, utm_medium, utm_campaign` : `SELECT 'none' AS utm_source, 'none' AS utm_medium, 'none' AS utm_campaign, 0 AS custom_request_count WHERE 0`})
    SELECT q.*, COALESCE(v.page_views,0) AS page_views, COALESCE(v.visitor_sessions,0) AS visitor_sessions, COALESCE(v.checkout_views,0) AS checkout_views, COALESCE(s.session_count,0) AS session_count, COALESCE(s.checkout_starts,0) AS checkout_starts, COALESCE(s.abandoned_carts,0) AS abandoned_carts, COALESCE(cr.custom_request_count,0) AS custom_request_count
    FROM q
    LEFT JOIN v ON v.utm_source=q.utm_source AND v.utm_medium=q.utm_medium AND v.utm_campaign=q.utm_campaign
    LEFT JOIN s ON s.utm_source=q.utm_source AND s.utm_medium=q.utm_medium AND s.utm_campaign=q.utm_campaign
    LEFT JOIN cr ON cr.utm_source=q.utm_source AND cr.utm_medium=q.utm_medium AND cr.utm_campaign=q.utm_campaign` : `SELECT
      COALESCE(NULLIF(utm_source,''),'unknown') AS utm_source,
      COALESCE(NULLIF(utm_medium,''),'social') AS utm_medium,
      COALESCE(NULLIF(utm_campaign,''),'uncategorized') AS utm_campaign,
      COUNT(*) AS total_posts,
      SUM(CASE WHEN post_status='posted' THEN 1 ELSE 0 END) AS posted_count,
      SUM(CASE WHEN post_status IN ('draft','ready') THEN 1 ELSE 0 END) AS open_count,
      SUM(CASE WHEN approval_status='approved' THEN 1 ELSE 0 END) AS approved_count,
      0 AS page_views, 0 AS visitor_sessions, 0 AS checkout_views, 0 AS session_count, 0 AS checkout_starts, 0 AS abandoned_carts, 0 AS custom_request_count
    FROM social_post_queue
    WHERE COALESCE(post_status,'draft') <> 'archived'
    GROUP BY utm_source, utm_medium, utm_campaign`}
    ORDER BY total_posts DESC, posted_count DESC, page_views DESC, custom_request_count DESC, utm_campaign ASC
    LIMIT 40`).all().catch(() => ({ results: [] })));
  const platform_readiness = getPlatformReadiness(env);
  const platformRows = platforms.map((platform) => ({
    ...platform,
    ...(platform_readiness[platform.platform_key] || {}),
    stored_api_ready: platform.api_ready
  }));
  return { summary, queue, platforms: platformRows, attempts, templates, calendar, utm_rollups, platform_readiness };
}
function normalizeQueueRow(row = {}) {
  return {
    ...row,
    target_platforms: safeJson(row.target_platforms_json, []),
    image_urls: safeJson(row.image_urls_json, []),
    platform_caption_overrides: safeJson(row.platform_caption_overrides_json, {}),
    media_quality_warnings: safeJson(row.media_quality_warnings_json, []),
    dry_run_payload: safeJson(row.dry_run_payload_json, {})
  };
}
async function createQueuedPost(db, adminUser, payload = {}) {
  const title = trimTo(payload.title || payload.job_title || payload.process_title || 'Workshop update', 140);
  const summary = trimTo(payload.summary || payload.description || '', 1200);
  const templateKey = slugKey(payload.caption_template_key || payload.template_key || '');
  const template = await templateByKey(db, templateKey);
  const templatePlatforms = template ? safeJson(template.default_platforms_json, []) : [];
  const hashtags = normalizeHashtags(payload.hashtags || template?.default_hashtags || 'DevilnDove,HandmadeOntario,WorkshopMade,SmallBusinessCanada');
  const imageUrls = splitList(payload.image_urls || payload.image_url || payload.images).map(safeUrl).filter(Boolean).slice(0, 10);
  const videoUrl = safeUrl(payload.video_url || '');
  const linkUrl = safeUrl(payload.link_url || payload.product_url || '');
  const platforms = normalizePlatforms(payload.target_platforms || payload.platforms || templatePlatforms);
  const sourceType = slugKey(payload.source_type || 'job_update') || 'job_update';
  const sourceId = normalizeText(payload.source_id || payload.job_id || '');
  const contentPillar = slugKey(payload.content_pillar || template?.content_pillar || sourceType || 'workshop_update');
  const callToAction = normalizeText(payload.call_to_action || template?.call_to_action || 'Follow along with the Devil n Dove workshop.');
  const utmSource = normalizeText(payload.utm_source || 'devilndove_social');
  const utmMedium = normalizeText(payload.utm_medium || 'social');
  const utmCampaign = slugKey(payload.utm_campaign || templateKey || contentPillar || sourceType || 'workshop_update');
  const utmUrl = buildUtmUrl(linkUrl, { ...payload, utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign, caption_template_key: templateKey, source_type: sourceType }, platforms);
  const templatedCaption = template ? fillCaptionTemplate(template, { title, summary, call_to_action: callToAction, link_url: utmUrl || linkUrl, hashtags }) : '';
  const caption = trimTo(payload.caption || templatedCaption || buildCaption({ title, summary, hashtags, linkUrl: utmUrl || linkUrl }), 2200);
  const platformCaptionOverrides = normalizeCaptionOverrides(payload, platforms);
  const notes = normalizeText(payload.notes || '');
  const scheduledAt = parseScheduledAt(payload.scheduled_at || '');
  const scheduleTimezone = normalizeText(payload.schedule_timezone || payload.timezone || 'America/Toronto');
  const status = ['draft', 'ready'].includes(slugKey(payload.post_status)) ? slugKey(payload.post_status) : 'draft';
  const approval = status === 'ready' ? 'approved' : 'needs_review';
  const mediaWarnings = buildMediaWarnings({ platforms, imageUrls, videoUrl, caption });
  const duplicateSignature = buildDuplicateSignature({ title, caption, imageUrls, platforms, linkUrl });
  const existingDuplicate = await db.prepare(`SELECT social_post_queue_id, title, post_status FROM social_post_queue WHERE duplicate_signature = ? AND COALESCE(post_status,'draft') <> 'archived' ORDER BY datetime(created_at) DESC LIMIT 1`).bind(duplicateSignature).first().catch(() => null);
  const doNotRepost = existingDuplicate ? 1 : 0;
  const socialPostKey = buildQueueKey(`${sourceType}|${sourceId}|${title}|${summary}`);
  const mergedNotes = [notes, existingDuplicate ? `Possible duplicate of social queue #${existingDuplicate.social_post_queue_id}; review before reposting.` : ''].filter(Boolean).join(' | ');

  const insert = await db.prepare(`INSERT INTO social_post_queue (
    social_post_key, source_type, source_id, title, summary, caption, hashtags,
    target_platforms_json, image_urls_json, video_url, link_url, approval_status,
    post_status, scheduled_at, created_by_user_id, updated_by_user_id, notes,
    platform_caption_overrides_json, media_quality_warnings_json, duplicate_signature, do_not_repost, schedule_timezone,
    caption_template_key, content_pillar, call_to_action, utm_source, utm_medium, utm_campaign, utm_url,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
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
    mergedNotes || null,
    JSON.stringify(platformCaptionOverrides),
    JSON.stringify(mediaWarnings),
    duplicateSignature,
    doNotRepost,
    scheduleTimezone || null,
    templateKey || null,
    contentPillar || null,
    callToAction || null,
    utmSource || null,
    utmMedium || null,
    utmCampaign || null,
    utmUrl || null
  ).run();
  const socialPostQueueId = Number(insert?.meta?.last_row_id || 0);

  for (const platform of platforms) {
    await db.prepare(`INSERT INTO social_post_attempts (
      social_post_queue_id, platform_key, attempt_status, attempted_by_user_id, notes, attempted_at
    ) VALUES (?, ?, 'manual_ready', ?, ?, CURRENT_TIMESTAMP)`).bind(
      socialPostQueueId,
      platform,
      adminUser.user_id,
      doNotRepost ? 'Prepared but flagged as possible duplicate; review before publishing.' : 'Prepared for manual publishing/copy-paste.'
    ).run().catch(() => null);
  }

  return { social_post_queue_id: socialPostQueueId, social_post_key: socialPostKey, duplicate_warning: !!existingDuplicate, media_warnings: mediaWarnings };
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
  if (payload.scheduled_at !== undefined) { fields.push('scheduled_at = ?'); bindings.push(parseScheduledAt(payload.scheduled_at) || null); }
  if (payload.schedule_timezone !== undefined) { fields.push('schedule_timezone = ?'); bindings.push(normalizeText(payload.schedule_timezone) || null); }
  if (payload.do_not_repost !== undefined) { fields.push('do_not_repost = ?'); bindings.push(Number(payload.do_not_repost) ? 1 : 0); }
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
  const version = envText(env, 'META_GRAPH_API_VERSION') || 'v25.0';
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
  const version = envText(env, 'META_GRAPH_API_VERSION') || 'v25.0';
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


async function saveCaptionTemplate(db, payload = {}) {
  const templateKey = slugKey(payload.template_key || payload.caption_template_key || payload.display_name || '');
  const displayName = trimTo(payload.display_name || templateKey.replace(/_/g, ' '), 120);
  const bodyTemplate = trimTo(payload.body_template || '', 2200);
  if (!templateKey) throw new Error('Template key is required.');
  if (!displayName) throw new Error('Template display name is required.');
  if (!bodyTemplate) throw new Error('Template body is required.');
  const platforms = normalizePlatforms(payload.default_platforms || payload.platforms || payload.default_platforms_json || ['facebook', 'instagram']);
  const hashtags = normalizeHashtags(payload.default_hashtags || payload.hashtags || 'DevilnDove,HandmadeOntario,WorkshopMade');
  const contentPillar = slugKey(payload.content_pillar || 'workshop_update');
  const callToAction = trimTo(payload.call_to_action || '', 280);
  const notes = trimTo(payload.notes || '', 1200);
  const isActive = payload.is_active === false || String(payload.is_active || '').toLowerCase() === '0' ? 0 : 1;

  await db.prepare(`INSERT INTO social_caption_templates (
    template_key, display_name, content_pillar, default_platforms_json, default_hashtags,
    body_template, call_to_action, is_active, notes, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT(template_key) DO UPDATE SET
    display_name = excluded.display_name,
    content_pillar = excluded.content_pillar,
    default_platforms_json = excluded.default_platforms_json,
    default_hashtags = excluded.default_hashtags,
    body_template = excluded.body_template,
    call_to_action = excluded.call_to_action,
    is_active = excluded.is_active,
    notes = excluded.notes,
    updated_at = CURRENT_TIMESTAMP`).bind(
      templateKey, displayName, contentPillar, JSON.stringify(platforms), hashtags,
      bodyTemplate, callToAction || null, isActive, notes || null
    ).run();

  return { template_key: templateKey, display_name: displayName, is_active: isActive };
}

async function archiveCaptionTemplate(db, payload = {}) {
  const templateKey = slugKey(payload.template_key || payload.caption_template_key || '');
  if (!templateKey) throw new Error('Template key is required.');
  await db.prepare(`UPDATE social_caption_templates SET is_active=0, updated_at=CURRENT_TIMESTAMP WHERE template_key = ?`).bind(templateKey).run();
  return { template_key: templateKey, archived: true };
}

async function previewCaptionTemplate(db, payload = {}) {
  const template = await templateByKey(db, payload.caption_template_key || payload.template_key || '');
  if (!template) throw new Error('Choose a valid caption template.');
  const platforms = normalizePlatforms(payload.target_platforms || payload.platforms || safeJson(template.default_platforms_json, []));
  const hashtags = normalizeHashtags(payload.hashtags || template.default_hashtags || 'DevilnDove,HandmadeOntario,WorkshopMade,SmallBusinessCanada');
  const linkUrl = safeUrl(payload.link_url || payload.product_url || '');
  const utmUrl = buildUtmUrl(linkUrl, { ...payload, caption_template_key: template.template_key }, platforms);
  const caption = fillCaptionTemplate(template, {
    title: payload.title || 'Fresh from the Devil n Dove workshop',
    summary: payload.summary || 'A quick behind-the-scenes update from our making table.',
    call_to_action: payload.call_to_action || template.call_to_action,
    link_url: utmUrl || linkUrl,
    hashtags
  });
  return { template_key: template.template_key, display_name: template.display_name, platforms, hashtags, utm_url: utmUrl, caption };
}

async function dryRunQueuedPost(context, db, adminUser, payload = {}) {
  const id = Number(payload.social_post_queue_id || 0);
  if (!id) throw new Error('A social_post_queue_id is required.');
  const row = await db.prepare(`SELECT * FROM social_post_queue WHERE social_post_queue_id = ? LIMIT 1`).bind(id).first();
  if (!row) throw new Error('Queued social post not found.');
  const selected = normalizePlatforms(payload.platform_keys || payload.platforms || safeJson(row.target_platforms_json, []));
  const dryRun = buildDryRunPayload(row, selected, context.env);
  await db.prepare(`UPDATE social_post_queue SET dry_run_payload_json=?, last_dry_run_at=CURRENT_TIMESTAMP, updated_by_user_id=?, updated_at=CURRENT_TIMESTAMP WHERE social_post_queue_id=?`).bind(
    JSON.stringify(dryRun),
    adminUser.user_id,
    id
  ).run().catch(() => null);
  for (const item of dryRun.platform_payloads || []) {
    await recordApiAttempt(db, adminUser, id, item.platform, 'dry_run_preview', { platform: item.platform, response: item, notes: 'Dry-run payload preview only; nothing was posted.' });
  }
  return dryRun;
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

  const privacyStatus = slugKey(row.privacy_status || 'needs_review');
  const privacyApproved = Number(row.approved_for_public_post || 0) === 1 || ['approved', 'no_private_media'].includes(privacyStatus);
  if (!privacyApproved && payload.force !== true) {
    for (const platform of selected) {
      const blocked = { platform, status: 'blocked_privacy_review', privacy_status: privacyStatus, notes: 'Review Social Media Privacy Guard before API publishing this post.' };
      await recordApiAttempt(db, adminUser, id, platform, 'blocked_privacy_review', blocked);
      results.push(blocked);
    }
    return { social_post_queue_id: id, attempted_platforms: selected, results };
  }

  if (Number(row.do_not_repost || 0) === 1 && payload.force !== true) {
    for (const platform of selected) {
      const blocked = { platform, status: 'blocked_duplicate_suspected', notes: 'Possible duplicate/repost detected. Clear the duplicate warning or force publish only after review.' };
      await recordApiAttempt(db, adminUser, id, platform, 'blocked_duplicate_suspected', blocked);
      results.push(blocked);
    }
    return { social_post_queue_id: id, attempted_platforms: selected, results };
  }

  if (isScheduledInFuture(row.scheduled_at) && payload.force !== true) {
    for (const platform of selected) {
      const blocked = { platform, status: 'blocked_scheduled', scheduled_at: row.scheduled_at, notes: 'This post is scheduled for the future. Use dry run/preview now or wait until it is due.' };
      await recordApiAttempt(db, adminUser, id, platform, 'blocked_scheduled', blocked);
      results.push(blocked);
    }
    return { social_post_queue_id: id, attempted_platforms: selected, results };
  }

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
    return jsonResponse({ ok: true, degraded: true, backend_warning: error?.message || 'Social queue is temporarily unavailable. Refresh after the database migration completes.', summary: { total: 0, open_count: 0, needs_review_count: 0, posted_count: 0, scheduled_count: 0, due_count: 0, duplicate_warning_count: 0 }, queue: [], platforms: [], attempts: [], templates: [], calendar: [], utm_rollups: [], mode: 'review_first_api_when_configured' }, 200, { 'Cache-Control': 'no-store' });
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
    else if (action === 'preview_caption_template') result = await previewCaptionTemplate(db, payload);
    else if (action === 'save_caption_template') result = await saveCaptionTemplate(db, payload);
    else if (action === 'archive_caption_template') result = await archiveCaptionTemplate(db, payload);
    else if (action === 'dry_run_platforms') result = await dryRunQueuedPost(context, db, adminUser, payload);
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
