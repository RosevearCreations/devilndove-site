// File: /functions/api/_lib/productSocialAutomation.js
// Build 210 — safe product-to-social queue automation.
// This module never publishes directly. It can create one review-first queue item
// when an eligible product becomes approved/published. Human privacy + release review
// remains required before any platform API call is attempted.

const PLATFORM_KEYS = new Set(['facebook', 'instagram', 'tiktok', 'x', 'youtube', 'pinterest']);

function clean(value, max = 0) {
  const text = String(value ?? '').trim();
  return max && text.length > max ? text.slice(0, max) : text;
}

function normalizePlatformList(value, fallback = ['facebook', 'instagram', 'pinterest']) {
  let input = value;
  if (typeof input === 'string') {
    try { input = JSON.parse(input); } catch { input = input.split(/[\s,|]+/g); }
  }
  const list = Array.isArray(input) ? input : fallback;
  const normalized = list
    .map((item) => clean(item).toLowerCase())
    .filter((item) => PLATFORM_KEYS.has(item));
  return [...new Set(normalized)].length ? [...new Set(normalized)] : fallback;
}

function slugKey(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);
}

function stripHtml(value) {
  return clean(String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '), 1000);
}

function normalizeUrl(value) {
  const raw = clean(value, 2048);
  if (!raw || !/^https?:\/\//i.test(raw)) return '';
  return raw;
}

function baseSiteUrl(env = {}) {
  const custom = normalizeUrl(env.PUBLIC_SITE_URL || env.SITE_URL || env.CANONICAL_SITE_URL || '');
  return custom ? custom.replace(/\/+$/, '') : 'https://devilndove.com';
}

function socialQueueKey(productId) {
  return `product-${Number(productId)}-approved-listing`;
}

function captionForProduct(product, linkUrl, hashtags) {
  const title = clean(product?.name || 'A new Devil n Dove piece', 140);
  const summary = stripHtml(product?.short_description || product?.description || '');
  const firstSentence = summary ? summary.slice(0, 420) : 'Fresh from our workshop — one more small adventure in making, testing, and learning.';
  const tagText = clean(hashtags || 'DevilnDove,HandmadeOntario,WorkshopMade,SmallBusinessCanada')
    .split(/[,\s]+/)
    .filter(Boolean)
    .map((tag) => `#${tag.replace(/^#+/, '')}`)
    .join(' ');
  return [title, firstSentence, 'Available now — see the full details here:', linkUrl, tagText].filter(Boolean).join('\n\n').slice(0, 2100);
}

async function tableExists(db, tableName) {
  const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(tableName).first().catch(() => null);
  return Boolean(row?.name);
}

async function getColumns(db, tableName) {
  const result = await db.prepare(`PRAGMA table_info(${tableName})`).all().catch(() => ({ results: [] }));
  return new Set((result?.results || []).map((row) => clean(row?.name).toLowerCase()).filter(Boolean));
}

export async function ensureProductSocialAutomationSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_social_automation_settings (
    settings_id INTEGER PRIMARY KEY CHECK (settings_id = 1),
    auto_queue_enabled INTEGER NOT NULL DEFAULT 0,
    auto_queue_on_review_status TEXT NOT NULL DEFAULT 'approved',
    require_active_product INTEGER NOT NULL DEFAULT 1,
    require_featured_image INTEGER NOT NULL DEFAULT 1,
    default_platforms_json TEXT NOT NULL DEFAULT '["facebook","instagram","pinterest"]',
    caption_template_key TEXT NOT NULL DEFAULT 'new_product',
    default_hashtags TEXT NOT NULL DEFAULT 'DevilnDove,HandmadeOntario,WorkshopMade,SmallBusinessCanada',
    default_utm_campaign TEXT NOT NULL DEFAULT 'new_product',
    notes TEXT,
    updated_by_user_id INTEGER,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`INSERT OR IGNORE INTO product_social_automation_settings (
    settings_id, auto_queue_enabled, auto_queue_on_review_status, require_active_product,
    require_featured_image, default_platforms_json, caption_template_key, default_hashtags,
    default_utm_campaign, notes, updated_at
  ) VALUES (
    1, 0, 'approved', 1, 1, '["facebook","instagram","pinterest"]', 'new_product',
    'DevilnDove,HandmadeOntario,WorkshopMade,SmallBusinessCanada', 'new_product',
    'Disabled by default. When enabled, an approved product creates one review-first social queue item; it never auto-publishes.', CURRENT_TIMESTAMP
  )`).run();

  // Keep product approval independent from whether the Social Queue page has already
  // been opened. This compatible baseline table is also used by the queue endpoint.
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

  // Existing queue tables are owned by the social-post-queue migration. These columns
  // make this module safe when a user enables product automation before the settings UI.
  if (await tableExists(db, 'social_post_queue')) {
    const columns = await getColumns(db, 'social_post_queue');
    const additions = [
      ['source_type', 'source_type TEXT NOT NULL DEFAULT "job_update"'],
      ['source_id', 'source_id TEXT'],
      ['content_pillar', 'content_pillar TEXT'],
      ['caption_template_key', 'caption_template_key TEXT'],
      ['utm_source', 'utm_source TEXT'],
      ['utm_medium', 'utm_medium TEXT'],
      ['utm_campaign', 'utm_campaign TEXT'],
      ['utm_url', 'utm_url TEXT'],
      ['platform_caption_overrides_json', "platform_caption_overrides_json TEXT DEFAULT '{}'"],
      ['media_quality_warnings_json', "media_quality_warnings_json TEXT DEFAULT '[]'"],
      ['duplicate_signature', 'duplicate_signature TEXT'],
      ['do_not_repost', 'do_not_repost INTEGER DEFAULT 0'],
      ['schedule_timezone', 'schedule_timezone TEXT'],
      ['privacy_status', 'privacy_status TEXT DEFAULT "needs_review"'],
      ['approved_for_public_post', 'approved_for_public_post INTEGER DEFAULT 0'],
      ['api_publish_mode', 'api_publish_mode TEXT DEFAULT "review_first"']
    ];
    for (const [column, definition] of additions) {
      if (!columns.has(column)) await db.prepare(`ALTER TABLE social_post_queue ADD COLUMN ${definition}`).run().catch(() => null);
    }
  }
}

export async function getProductSocialAutomationSettings(db) {
  await ensureProductSocialAutomationSchema(db);
  const row = await db.prepare(`SELECT * FROM product_social_automation_settings WHERE settings_id=1 LIMIT 1`).first().catch(() => null);
  const defaults = {
    settings_id: 1,
    auto_queue_enabled: 0,
    auto_queue_on_review_status: 'approved',
    require_active_product: 1,
    require_featured_image: 1,
    default_platforms: ['facebook', 'instagram', 'pinterest'],
    caption_template_key: 'new_product',
    default_hashtags: 'DevilnDove,HandmadeOntario,WorkshopMade,SmallBusinessCanada',
    default_utm_campaign: 'new_product',
    notes: 'Disabled by default.'
  };
  return {
    ...defaults,
    ...(row || {}),
    auto_queue_enabled: Number(row?.auto_queue_enabled || 0) === 1 ? 1 : 0,
    require_active_product: Number(row?.require_active_product ?? 1) === 1 ? 1 : 0,
    require_featured_image: Number(row?.require_featured_image ?? 1) === 1 ? 1 : 0,
    auto_queue_on_review_status: ['approved', 'published'].includes(clean(row?.auto_queue_on_review_status).toLowerCase())
      ? clean(row?.auto_queue_on_review_status).toLowerCase()
      : 'approved',
    default_platforms: normalizePlatformList(row?.default_platforms_json),
    caption_template_key: slugKey(row?.caption_template_key || 'new_product') || 'new_product',
    default_hashtags: clean(row?.default_hashtags || defaults.default_hashtags, 500),
    default_utm_campaign: slugKey(row?.default_utm_campaign || 'new_product') || 'new_product'
  };
}

async function findProductMedia(db, productId, featuredImageUrl) {
  const images = [];
  const add = (value) => {
    const url = normalizeUrl(value);
    if (url && !images.includes(url)) images.push(url);
  };
  add(featuredImageUrl);
  const hasProductImages = await tableExists(db, 'product_images');
  if (hasProductImages) {
    const rows = (await db.prepare(`
      SELECT image_url
      FROM product_images
      WHERE product_id=? AND TRIM(COALESCE(image_url,'')) <> ''
      ORDER BY product_image_id ASC
      LIMIT 6
    `).bind(productId).all().catch(() => ({ results: [] })))?.results || [];
    rows.forEach((row) => add(row?.image_url));
  }
  const hasMediaAssets = await tableExists(db, 'media_assets');
  if (hasMediaAssets) {
    const rows = (await db.prepare(`
      SELECT public_url
      FROM media_assets
      WHERE product_id=? AND TRIM(COALESCE(public_url,'')) <> '' AND COALESCE(deleted_at,'')=''
      ORDER BY COALESCE(sort_order, 0) ASC, media_asset_id ASC
      LIMIT 6
    `).bind(productId).all().catch(() => ({ results: [] })))?.results || [];
    rows.forEach((row) => add(row?.public_url));
  }
  return images.slice(0, 10);
}

export async function maybeQueueApprovedProductSocialPost(db, product, actorUserId, env = {}, options = {}) {
  // This function is intentionally idempotent. It will return a reason rather than
  // creating duplicate content each time the Product Editor saves a listing.
  const productId = Number(product?.product_id || 0);
  if (!productId) return { queued: false, code: 'PRODUCT_ID_MISSING' };

  // Draft typing must not create/inspect/alter the social schema on every autosave.
  // A product that has not reached review approval cannot be eligible under any setting.
  const reviewStatus = clean(product?.review_status).toLowerCase();
  if (!['approved', 'published'].includes(reviewStatus)) {
    return { queued: false, code: 'PRODUCT_NOT_APPROVED' };
  }

  const settings = await getProductSocialAutomationSettings(db);
  if (!settings.auto_queue_enabled) return { queued: false, code: 'AUTOMATION_DISABLED', settings };

  const status = clean(product?.status).toLowerCase();
  const acceptedStatus = settings.auto_queue_on_review_status === 'published'
    ? reviewStatus === 'published'
    : ['approved', 'published'].includes(reviewStatus);
  if (!acceptedStatus) return { queued: false, code: 'PRODUCT_NOT_APPROVED', settings };
  if (settings.require_active_product && !['active', 'published'].includes(status)) {
    return { queued: false, code: 'PRODUCT_NOT_ACTIVE', settings };
  }

  const mediaUrls = await findProductMedia(db, productId, product?.featured_image_url);
  if (settings.require_featured_image && !mediaUrls.length) {
    return { queued: false, code: 'PRODUCT_MEDIA_REQUIRED', settings };
  }

  const existing = await db.prepare(`
    SELECT social_post_queue_id, post_status, approval_status
    FROM social_post_queue
    WHERE source_type='product' AND source_id=? AND COALESCE(post_status,'draft') <> 'archived'
    ORDER BY social_post_queue_id DESC
    LIMIT 1
  `).bind(String(productId)).first().catch(() => null);
  if (existing) {
    return { queued: false, code: 'QUEUE_ITEM_EXISTS', social_post_queue_id: Number(existing.social_post_queue_id || 0), settings };
  }

  const slug = clean(product?.slug) || `product-${productId}`;
  const pageUrl = `${baseSiteUrl(env)}/product/?slug=${encodeURIComponent(slug)}`;
  const platforms = normalizePlatformList(settings.default_platforms);
  const utm = new URL(pageUrl);
  utm.searchParams.set('utm_source', 'devilndove_social');
  utm.searchParams.set('utm_medium', 'social');
  utm.searchParams.set('utm_campaign', settings.default_utm_campaign);
  utm.searchParams.set('utm_content', platforms.join('-'));
  const title = clean(product?.name || `Product ${productId}`, 140);
  const caption = captionForProduct(product, utm.toString(), settings.default_hashtags);
  const summary = stripHtml(product?.short_description || product?.description || '');
  const baseQueueKey = socialQueueKey(productId);
  const archivedKey = await db.prepare(`SELECT social_post_queue_id FROM social_post_queue WHERE social_post_key=? LIMIT 1`)
    .bind(baseQueueKey).first().catch(() => null);
  const queueKey = archivedKey ? `${baseQueueKey}-${Date.now()}` : baseQueueKey;

  const insert = await db.prepare(`INSERT INTO social_post_queue (
    social_post_key, source_type, source_id, title, summary, caption, hashtags,
    target_platforms_json, image_urls_json, link_url, approval_status, post_status,
    created_by_user_id, updated_by_user_id, notes, platform_caption_overrides_json,
    media_quality_warnings_json, duplicate_signature, do_not_repost, schedule_timezone,
    caption_template_key, content_pillar, call_to_action, utm_source, utm_medium,
    utm_campaign, utm_url, privacy_status, approved_for_public_post, api_publish_mode,
    created_at, updated_at
  ) VALUES (?, 'product', ?, ?, ?, ?, ?, ?, ?, ?, 'needs_review', 'draft',
    ?, ?, ?, '{}', '[]', ?, 0, 'America/Toronto', ?, 'finished_product',
    'See the full piece in our shop.', 'devilndove_social', 'social', ?, ?,
    'needs_review', 0, 'review_first', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
      queueKey, String(productId), title, summary || null, caption, settings.default_hashtags,
      JSON.stringify(platforms), JSON.stringify(mediaUrls), pageUrl,
      Number(actorUserId || 0) || null, Number(actorUserId || 0) || null,
      `Automatically drafted from approved product #${productId}. Review caption, media, privacy, and platform selection before publishing.`,
      `${queueKey}:${slug}`,
      settings.caption_template_key, settings.default_utm_campaign, utm.toString()
    ).run();

  return {
    queued: true,
    code: 'PRODUCT_SOCIAL_DRAFT_CREATED',
    social_post_queue_id: Number(insert?.meta?.last_row_id || 0),
    product_id: productId,
    platforms,
    mode: 'review_first',
    settings
  };
}

export async function updateProductSocialAutomationSettings(db, payload = {}, actorUserId = null) {
  await ensureProductSocialAutomationSchema(db);
  const enabled = Number(payload.auto_queue_enabled) === 1 || payload.auto_queue_enabled === true ? 1 : 0;
  const review = ['approved', 'published'].includes(clean(payload.auto_queue_on_review_status).toLowerCase())
    ? clean(payload.auto_queue_on_review_status).toLowerCase()
    : 'approved';
  const active = Number(payload.require_active_product) === 0 || payload.require_active_product === false ? 0 : 1;
  const featured = Number(payload.require_featured_image) === 0 || payload.require_featured_image === false ? 0 : 1;
  const platforms = normalizePlatformList(payload.default_platforms || payload.default_platforms_json);
  const template = slugKey(payload.caption_template_key || 'new_product') || 'new_product';
  const hashtags = clean(payload.default_hashtags || 'DevilnDove,HandmadeOntario,WorkshopMade,SmallBusinessCanada', 500);
  const campaign = slugKey(payload.default_utm_campaign || 'new_product') || 'new_product';
  const notes = clean(payload.notes || '', 1500);

  await db.prepare(`UPDATE product_social_automation_settings SET
    auto_queue_enabled=?, auto_queue_on_review_status=?, require_active_product=?,
    require_featured_image=?, default_platforms_json=?, caption_template_key=?,
    default_hashtags=?, default_utm_campaign=?, notes=?, updated_by_user_id=?,
    updated_at=CURRENT_TIMESTAMP
    WHERE settings_id=1`).bind(
      enabled, review, active, featured, JSON.stringify(platforms), template,
      hashtags, campaign, notes || null, Number(actorUserId || 0) || null
    ).run();

  return getProductSocialAutomationSettings(db);
}
