// File: /functions/api/admin/value-ops.js
// Brief description: Build 190 integrated value operations API for saved Command Center views, filtered funnel metrics, product margin/readiness warnings, customer timelines, SEO/GBP actions, visual publication review, cart recovery review, and seasonal campaigns.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 190';
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
async function safeAll(db, sql, bindings = []) { try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }
async function safeFirst(db, sql, bindings = [], fallback = {}) { try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; } }
async function safeRun(db, sql, bindings = []) { try { return await db.prepare(sql).bind(...bindings).run(); } catch { return null; } }
async function tableExists(db, tableName) { const row = await safeFirst(db, `SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`, [tableName], null); return !!row?.name; }
function clean(value, max = 500) { const text = normalizeText(value); return text.length > max ? text.slice(0, max).trim() : text; }
function int(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? Math.round(n) : fallback; }
function lower(value) { return String(value || '').trim().toLowerCase(); }
function safeJson(value, fallback = {}) { try { return JSON.parse(value || ''); } catch { return fallback; } }
function percent(numerator, denominator) { return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(1)) : 0; }

async function ensureTables(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS admin_command_center_saved_views (
      admin_command_center_saved_view_id INTEGER PRIMARY KEY AUTOINCREMENT,
      view_key TEXT NOT NULL UNIQUE,
      view_label TEXT NOT NULL,
      view_area TEXT NOT NULL DEFAULT 'owner',
      filter_json TEXT NOT NULL DEFAULT '{}',
      is_default INTEGER NOT NULL DEFAULT 0,
      view_status TEXT NOT NULL DEFAULT 'active',
      created_by_user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS search_console_opportunity_actions (
      search_console_opportunity_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_path TEXT NOT NULL,
      query_text TEXT,
      opportunity_kind TEXT NOT NULL DEFAULT 'title_meta_internal_link',
      clicks INTEGER NOT NULL DEFAULT 0,
      impressions INTEGER NOT NULL DEFAULT 0,
      average_position REAL NOT NULL DEFAULT 0,
      action_status TEXT NOT NULL DEFAULT 'queued',
      proposed_title TEXT,
      proposed_meta_description TEXT,
      internal_link_note TEXT,
      created_by_user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS google_business_profile_observations (
      google_business_profile_observation_id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_path TEXT NOT NULL,
      observation_month TEXT NOT NULL,
      profile_action TEXT,
      search_phrase TEXT,
      position_note TEXT,
      calls INTEGER NOT NULL DEFAULT 0,
      website_clicks INTEGER NOT NULL DEFAULT 0,
      direction_requests INTEGER NOT NULL DEFAULT 0,
      photo_views INTEGER NOT NULL DEFAULT 0,
      review_count INTEGER NOT NULL DEFAULT 0,
      observation_status TEXT NOT NULL DEFAULT 'manual_review',
      created_by_user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      UNIQUE(page_path, observation_month, search_phrase)
    )`,
    `CREATE TABLE IF NOT EXISTS media_publication_review_queue (
      media_publication_review_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_path TEXT NOT NULL,
      source_kind TEXT NOT NULL DEFAULT 'placeholder_replacement',
      source_record_id INTEGER,
      media_url TEXT,
      placeholder_asset TEXT,
      desired_role TEXT,
      consent_status TEXT NOT NULL DEFAULT 'needs_review',
      public_use_status TEXT NOT NULL DEFAULT 'needs_approved_media',
      compression_status TEXT NOT NULL DEFAULT 'needs_measurement',
      alt_text_status TEXT NOT NULL DEFAULT 'needs_review',
      performance_status TEXT NOT NULL DEFAULT 'needs_measurement',
      review_status TEXT NOT NULL DEFAULT 'queued',
      created_by_user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      UNIQUE(route_path, placeholder_asset, desired_role)
    )`,
    `CREATE TABLE IF NOT EXISTS customer_timeline_events (
      customer_timeline_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_key TEXT NOT NULL,
      customer_email TEXT,
      customer_label TEXT,
      event_kind TEXT NOT NULL,
      source_table TEXT,
      source_record_id INTEGER,
      event_label TEXT,
      event_status TEXT,
      event_amount_cents INTEGER NOT NULL DEFAULT 0,
      event_at TEXT,
      event_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(customer_key, event_kind, source_table, source_record_id)
    )`,
    `CREATE TABLE IF NOT EXISTS customer_story_approval_batches (
      customer_story_approval_batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_kind TEXT NOT NULL,
      source_record_id INTEGER,
      customer_key TEXT,
      product_id INTEGER,
      order_id INTEGER,
      story_title TEXT,
      story_summary TEXT,
      consent_status TEXT NOT NULL DEFAULT 'needs_review',
      approval_status TEXT NOT NULL DEFAULT 'candidate',
      target_context TEXT,
      approved_by_user_id INTEGER,
      approved_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      UNIQUE(source_kind, source_record_id, target_context)
    )`,
    `CREATE TABLE IF NOT EXISTS product_margin_warning_rows (
      product_margin_warning_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL UNIQUE,
      product_label TEXT,
      current_price_cents INTEGER NOT NULL DEFAULT 0,
      estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
      estimated_marketplace_fee_cents INTEGER NOT NULL DEFAULT 0,
      estimated_margin_cents INTEGER NOT NULL DEFAULT 0,
      estimated_margin_percent REAL NOT NULL DEFAULT 0,
      warning_status TEXT NOT NULL DEFAULT 'needs_costs',
      marketplace_export_status TEXT NOT NULL DEFAULT 'review_required',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS cart_recovery_review_rows (
      cart_recovery_review_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
      checkout_recovery_lead_id INTEGER,
      customer_email TEXT,
      cart_value_cents INTEGER NOT NULL DEFAULT 0,
      recovery_status TEXT NOT NULL DEFAULT 'needs_review',
      contact_permission_status TEXT NOT NULL DEFAULT 'needs_review',
      suggested_action TEXT,
      gift_card_opportunity_status TEXT NOT NULL DEFAULT 'not_reviewed',
      reviewed_by_user_id INTEGER,
      reviewed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      UNIQUE(checkout_recovery_lead_id)
    )`,
    `CREATE TABLE IF NOT EXISTS seasonal_campaign_plans (
      seasonal_campaign_plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_key TEXT NOT NULL UNIQUE,
      campaign_label TEXT NOT NULL,
      campaign_kind TEXT NOT NULL DEFAULT 'gift_moment',
      target_start_date TEXT,
      target_end_date TEXT,
      target_locality TEXT DEFAULT 'Southern Ontario',
      product_focus TEXT,
      image_status TEXT NOT NULL DEFAULT 'needs_approved_media',
      seo_status TEXT NOT NULL DEFAULT 'needs_review',
      campaign_status TEXT NOT NULL DEFAULT 'planning',
      created_by_user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS image_compression_report_rows (
      image_compression_report_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_path TEXT NOT NULL UNIQUE,
      original_bytes INTEGER NOT NULL DEFAULT 0,
      optimized_asset_path TEXT,
      optimized_bytes INTEGER NOT NULL DEFAULT 0,
      savings_percent REAL NOT NULL DEFAULT 0,
      public_usage_count INTEGER NOT NULL DEFAULT 0,
      compression_status TEXT NOT NULL DEFAULT 'needs_review',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS markdown_retirement_registry (
      markdown_retirement_registry_id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL UNIQUE,
      canonical_replacement TEXT,
      retirement_status TEXT NOT NULL DEFAULT 'supporting_reference',
      archived_path TEXT,
      retained_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    )`
  ];
  for (const statement of statements) await safeRun(db, statement);
}

async function seedDefaults(db, userId) {
  const views = [
    ['owner_daily','Owner Daily','owner',{days:30,area:'all'},1,'Products, orders, SEO, visuals, customers, and deploy risks.'],
    ['products','Product','products',{days:30,area:'products'},0,'Readiness, low stock, missing media, and margin warnings.'],
    ['seo','SEO','seo',{days:90,area:'seo'},0,'Search Console opportunities, GBP observations, and visual proof.'],
    ['customers','Customers','customers',{days:90,area:'customers'},0,'Timeline, cart recovery, stories, gift cards, and custom requests.'],
    ['visuals','Visuals','visuals',{days:30,area:'visuals'},0,'Approved real media, compression, alt text, and performance budgets.'],
    ['accounting','Accounting','accounting',{days:90,area:'accounting'},0,'Product cost/margin and evidence review.'],
    ['deploy','Deploy','deploy',{days:30,area:'deploy'},0,'Preflight, environment health, smoke tests, and blockers.']
  ];
  for (const row of views) await safeRun(db, `INSERT INTO admin_command_center_saved_views (view_key,view_label,view_area,filter_json,is_default,view_status,created_by_user_id,notes) VALUES (?,?,?,?,?,'active',?,?) ON CONFLICT(view_key) DO UPDATE SET view_label=excluded.view_label,view_area=excluded.view_area,filter_json=excluded.filter_json,is_default=excluded.is_default,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`, [row[0],row[1],row[2],JSON.stringify(row[3]),row[4],userId,row[5]]);
  const campaigns = [
    ['holiday_gifts','Holiday handmade gifts','holiday','2026-10-01','2026-12-20','Southern Ontario','Gift sets, jewelry, engraving, candles, soap, vintage finds'],
    ['mothers_day','Mother’s Day gift ideas','gift_moment','2027-03-15','2027-05-09','Ontario','Jewelry, custom gifts, candles, engraved keepsakes'],
    ['local_market','Local market and pickup season','local_market','2026-06-01','2026-09-30','Southern Ontario','Pickup-ready gifts, small-batch pieces, workshop stories']
  ];
  for (const row of campaigns) await safeRun(db, `INSERT INTO seasonal_campaign_plans (campaign_key,campaign_label,campaign_kind,target_start_date,target_end_date,target_locality,product_focus,created_by_user_id,notes) VALUES (?,?,?,?,?,?,?,?,'Build 190 campaign seed; review dates and approved media before activation.') ON CONFLICT(campaign_key) DO UPDATE SET campaign_label=excluded.campaign_label,target_start_date=excluded.target_start_date,target_end_date=excluded.target_end_date,product_focus=excluded.product_focus,updated_at=CURRENT_TIMESTAMP`, [...row,userId]);
}

function environmentHealth(env) {
  const checks = [
    ['D1 database','DB',!!(env.DB || env.DD_DB),'required','Login, products, orders, admin, and all live dashboards.'],
    ['Product media bucket','PRODUCT_MEDIA_BUCKET',!!(env.PRODUCT_MEDIA_BUCKET || env.MEDIA_BUCKET || env.R2_PRODUCT_MEDIA),'recommended','Product uploads, visual proof, and evidence files.'],
    ['Public site URL','PUBLIC_SITE_URL',!!env.PUBLIC_SITE_URL,'recommended','Canonical site and server-generated links.'],
    ['Site origin','SITE_ORIGIN',!!env.SITE_ORIGIN,'recommended','Same-origin checks and generated URLs.'],
    ['Session secret','SESSION_SECRET',!!env.SESSION_SECRET,'recommended','Session/signing safety fallback.'],
    ['Private evidence secret','PRIVATE_EVIDENCE_DOWNLOAD_SECRET',!!env.PRIVATE_EVIDENCE_DOWNLOAD_SECRET,'recommended','Signed private evidence downloads.'],
    ['Stripe secret','STRIPE_SECRET_KEY',!!env.STRIPE_SECRET_KEY,'optional','Stripe payment operations.'],
    ['Stripe publishable key','STRIPE_PUBLISHABLE_KEY',!!env.STRIPE_PUBLISHABLE_KEY,'optional','Stripe checkout client configuration.'],
    ['Email provider','EMAIL_PROVIDER',!!env.EMAIL_PROVIDER,'optional','Use manual until a provider is verified.'],
    ['Cloudflare release token','CLOUDFLARE_API_TOKEN',!!env.CLOUDFLARE_API_TOKEN,'optional','Live deployment import and release-control checks.']
  ];
  return checks.map(([label,key,configured,importance,notes]) => ({ label,key,configured,importance,status:configured?'configured':importance==='required'?'missing_required':'not_configured',notes }));
}

function sourceFilterSql(columns, source) {
  const value = lower(source);
  if (!value) return { sql:'', bindings:[] };
  const like = `%${value.replace(/[%_]/g, '')}%`;
  return { sql:` AND (${columns.map((column) => `lower(COALESCE(${column},'')) LIKE ?`).join(' OR ')})`, bindings:columns.map(() => like) };
}

async function funnelMetrics(db, days, source) {
  const modifier = `-${Math.max(1, Math.min(365, days))} days`;
  const pageFilter = sourceFilterSql(['referrer','query_string','meta_json'], source);
  const cartFilter = sourceFilterSql(['path','meta_json'], source);
  const hasViews = await tableExists(db,'site_page_views');
  const hasCart = await tableExists(db,'cart_activity');
  const hasOrders = await tableExists(db,'orders');
  const landing = hasViews ? int((await safeFirst(db, `SELECT COUNT(*) AS total FROM site_page_views WHERE created_at >= datetime('now', ?) AND event_type='page_view' AND (path='/' OR path LIKE '%ontario/%' OR path LIKE '%southern-ontario/%')${pageFilter.sql}`, [modifier,...pageFilter.bindings], {total:0})).total) : 0;
  const product = hasViews ? int((await safeFirst(db, `SELECT COUNT(*) AS total FROM site_page_views WHERE created_at >= datetime('now', ?) AND (event_type IN ('product_view','product_detail_view') OR path LIKE '/shop/product/%')${pageFilter.sql}`, [modifier,...pageFilter.bindings], {total:0})).total) : 0;
  const cart = hasCart ? int((await safeFirst(db, `SELECT COUNT(*) AS total FROM cart_activity WHERE created_at >= datetime('now', ?) AND event_type IN ('add_to_cart','cart_updated')${cartFilter.sql}`, [modifier,...cartFilter.bindings], {total:0})).total) : 0;
  const checkout = hasCart ? int((await safeFirst(db, `SELECT COUNT(*) AS total FROM cart_activity WHERE created_at >= datetime('now', ?) AND event_type IN ('checkout_started','checkout_start')${cartFilter.sql}`, [modifier,...cartFilter.bindings], {total:0})).total) : 0;
  const order = hasOrders ? int((await safeFirst(db, `SELECT COUNT(*) AS total FROM orders WHERE created_at >= datetime('now', ?)`, [modifier], {total:0})).total) : 0;
  const values = [
    ['landing_page_view','Landing page view',landing],
    ['product_view','Product view',product],
    ['add_to_cart','Add to cart',cart],
    ['checkout_start','Checkout start',checkout],
    ['order_created','Order created',order]
  ];
  let previous = 0;
  return values.map(([step,label,count], index) => {
    const rate = index === 0 ? 100 : percent(count, previous);
    const dropoff = index === 0 ? 0 : Math.max(0, previous - count);
    previous = count;
    return { step,label,count,previous_count:index===0?0:values[index-1][2],conversion_rate_percent:rate,dropoff_count:dropoff,days,source:source||'all' };
  });
}

async function productReadinessAndMargins(db) {
  if (!(await tableExists(db,'products'))) return [];
  const products = await safeAll(db, `SELECT product_id,product_number,sku,name,slug,status,price_cents,featured_image_url,short_description,description,inventory_tracking,inventory_quantity FROM products WHERE lower(COALESCE(status,'draft')) <> 'archived' ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 250`);
  const imageMap = new Map();
  if (await tableExists(db,'product_images')) {
    for (const row of await safeAll(db, `SELECT product_id,COUNT(*) AS image_count,SUM(CASE WHEN COALESCE(alt_text,'')='' THEN 1 ELSE 0 END) AS missing_alt FROM product_images GROUP BY product_id`)) imageMap.set(int(row.product_id), {count:int(row.image_count),missingAlt:int(row.missing_alt)});
  }
  const costMap = new Map();
  if (await tableExists(db,'product_costs')) {
    for (const row of await safeAll(db, `SELECT product_number,cost_per_unit,effective_date FROM product_costs ORDER BY COALESCE(effective_date,created_at) DESC`)) {
      const key = String(row.product_number || ''); if (key && !costMap.has(key)) costMap.set(key, Math.max(0, Math.round(Number(row.cost_per_unit || 0) * 100)));
    }
  }
  const reviewMap = new Map();
  if (await tableExists(db,'product_cost_margin_review_rows')) {
    for (const row of await safeAll(db, `SELECT * FROM product_cost_margin_review_rows ORDER BY updated_at DESC`)) if (row.product_id && !reviewMap.has(int(row.product_id))) reviewMap.set(int(row.product_id), row);
  }
  const result = [];
  for (const product of products) {
    const id = int(product.product_id);
    const image = imageMap.get(id) || {count:product.featured_image_url?1:0,missingAlt:0};
    const estimatedCost = costMap.get(String(product.product_number || '')) || int(reviewMap.get(id)?.material_cost_cents) + int(reviewMap.get(id)?.labour_cost_cents) + int(reviewMap.get(id)?.marketplace_fee_cents);
    const price = int(product.price_cents);
    const estimatedFee = Math.round(price * 0.12);
    const margin = price - estimatedCost - estimatedFee;
    const marginPercent = percent(margin, price);
    const missingPhoto = image.count < 1 ? 1 : 0;
    const missingAlt = image.missingAlt;
    const missingStory = String(product.short_description || product.description || '').trim().length < 40 ? 1 : 0;
    const lowStock = int(product.inventory_tracking) === 1 && int(product.inventory_quantity) <= 1 ? 1 : 0;
    const warningStatus = !estimatedCost ? 'needs_costs' : margin <= 0 ? 'negative_margin' : marginPercent < 30 ? 'low_margin' : 'healthy_margin';
    await safeRun(db, `INSERT INTO product_margin_warning_rows (product_id,product_label,current_price_cents,estimated_cost_cents,estimated_marketplace_fee_cents,estimated_margin_cents,estimated_margin_percent,warning_status,marketplace_export_status,notes) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(product_id) DO UPDATE SET product_label=excluded.product_label,current_price_cents=excluded.current_price_cents,estimated_cost_cents=excluded.estimated_cost_cents,estimated_marketplace_fee_cents=excluded.estimated_marketplace_fee_cents,estimated_margin_cents=excluded.estimated_margin_cents,estimated_margin_percent=excluded.estimated_margin_percent,warning_status=excluded.warning_status,marketplace_export_status=excluded.marketplace_export_status,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`, [id,product.name,price,estimatedCost,estimatedFee,margin,marginPercent,warningStatus,warningStatus==='healthy_margin'?'allowed':'review_required','Build 190 calculated warning; fees are an estimate and must be reviewed per channel.']);
    result.push({
      product_id:id,product_name:product.name,product_slug:product.slug,price_cents:price,image_count:image.count,missing_real_photo:missingPhoto,missing_alt_text:missingAlt,missing_story:missingStory,low_stock:lowStock,inventory_quantity:int(product.inventory_quantity),estimated_cost_cents:estimatedCost,estimated_marketplace_fee_cents:estimatedFee,estimated_margin_cents:margin,estimated_margin_percent:marginPercent,margin_status:warningStatus,marketplace_export_status:warningStatus==='healthy_margin'?'allowed':'review_required',readiness_status:(missingPhoto||missingAlt||missingStory||lowStock||warningStatus!=='healthy_margin')?'needs_review':'ready'
    });
  }
  return result;
}

async function customerTimeline(db, limit = 40) {
  const map = new Map();
  const ensure = (email,label='') => {
    const key = lower(email); if (!key) return null;
    if (!map.has(key)) map.set(key,{customer_key:key,customer_email:key,customer_label:label||key,order_count:0,custom_request_count:0,gift_card_count:0,review_count:0,cart_recovery_count:0,latest_activity_at:'',events:[]});
    const customer = map.get(key); if (label && (!customer.customer_label || customer.customer_label===key)) customer.customer_label=label; return customer;
  };
  const add = (email,label,event) => { const customer=ensure(email,label); if (!customer) return; customer.events.push(event); if (!customer.latest_activity_at || String(event.event_at||'')>customer.latest_activity_at) customer.latest_activity_at=String(event.event_at||''); };
  if (await tableExists(db,'orders')) for (const row of await safeAll(db, `SELECT order_id,order_number,customer_email,customer_name,order_status,payment_status,total_cents,created_at FROM orders ORDER BY created_at DESC LIMIT 400`)) { const c=ensure(row.customer_email,row.customer_name); if(c)c.order_count++; add(row.customer_email,row.customer_name,{event_kind:'order',source_record_id:row.order_id,event_label:`Order ${row.order_number||row.order_id}`,event_status:row.order_status||row.payment_status,event_amount_cents:int(row.total_cents),event_at:row.created_at}); }
  if (await tableExists(db,'custom_requests')) for (const row of await safeAll(db, `SELECT custom_request_id,name,email,request_type,status,created_at FROM custom_requests ORDER BY created_at DESC LIMIT 300`)) { const c=ensure(row.email,row.name); if(c)c.custom_request_count++; add(row.email,row.name,{event_kind:'custom_request',source_record_id:row.custom_request_id,event_label:row.request_type||'Custom request',event_status:row.status,event_amount_cents:0,event_at:row.created_at}); }
  if (await tableExists(db,'gift_cards')) for (const row of await safeAll(db, `SELECT gift_card_id,COALESCE(recipient_email,issued_to_email,purchaser_email) AS email,COALESCE(recipient_name,issued_to_name,purchaser_name) AS name,status,initial_amount_cents,created_at FROM gift_cards ORDER BY created_at DESC LIMIT 300`)) { const c=ensure(row.email,row.name); if(c)c.gift_card_count++; add(row.email,row.name,{event_kind:'gift_card',source_record_id:row.gift_card_id,event_label:'Gift card',event_status:row.status,event_amount_cents:int(row.initial_amount_cents),event_at:row.created_at}); }
  if (await tableExists(db,'product_reviews')) for (const row of await safeAll(db, `SELECT product_review_id,reviewer_email,reviewer_name,status,rating,created_at FROM product_reviews ORDER BY created_at DESC LIMIT 300`)) { const c=ensure(row.reviewer_email,row.reviewer_name); if(c)c.review_count++; add(row.reviewer_email,row.reviewer_name,{event_kind:'review',source_record_id:row.product_review_id,event_label:`Review ${row.rating||''}/5`,event_status:row.status,event_amount_cents:0,event_at:row.created_at}); }
  if (await tableExists(db,'checkout_recovery_leads')) for (const row of await safeAll(db, `SELECT checkout_recovery_lead_id,customer_email,customer_name,status,cart_value_cents,updated_at,created_at FROM checkout_recovery_leads ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 300`)) { const c=ensure(row.customer_email,row.customer_name); if(c)c.cart_recovery_count++; add(row.customer_email,row.customer_name,{event_kind:'cart_recovery',source_record_id:row.checkout_recovery_lead_id,event_label:'Cart recovery review',event_status:row.status,event_amount_cents:int(row.cart_value_cents),event_at:row.updated_at||row.created_at}); }
  return [...map.values()].map((customer)=>({...customer,events:customer.events.sort((a,b)=>String(b.event_at||'').localeCompare(String(a.event_at||''))).slice(0,8)})).sort((a,b)=>String(b.latest_activity_at||'').localeCompare(String(a.latest_activity_at||''))).slice(0,Math.max(1,Math.min(200,limit)));
}

async function syncTimeline(db, customers) {
  for (const customer of customers) for (const event of customer.events || []) await safeRun(db, `INSERT INTO customer_timeline_events (customer_key,customer_email,customer_label,event_kind,source_table,source_record_id,event_label,event_status,event_amount_cents,event_at,event_json) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(customer_key,event_kind,source_table,source_record_id) DO UPDATE SET customer_label=excluded.customer_label,event_label=excluded.event_label,event_status=excluded.event_status,event_amount_cents=excluded.event_amount_cents,event_at=excluded.event_at,event_json=excluded.event_json`, [customer.customer_key,customer.customer_email,customer.customer_label,event.event_kind,event.event_kind,event.source_record_id,event.event_label,event.event_status,event.event_amount_cents,event.event_at,JSON.stringify(event)]);
}

async function seoOpportunities(db) {
  const scoreRows = await safeAll(db, `SELECT page_path,target_phrase,score,search_console_status,google_business_profile_status,image_proof_status,next_best_action FROM local_seo_value_scorecard_rows ORDER BY score ASC,page_path LIMIT 100`);
  const result=[];
  for (const row of scoreRows) {
    const trend = await safeFirst(db, `SELECT COALESCE(SUM(clicks),0) AS clicks,COALESCE(SUM(impressions),0) AS impressions,COALESCE(AVG(average_position),0) AS average_position FROM local_seo_search_console_trends WHERE page_path=?`, [row.page_path], {clicks:0,impressions:0,average_position:0});
    const gbp = await safeFirst(db, `SELECT * FROM google_business_profile_observations WHERE page_path=? ORDER BY observation_month DESC,created_at DESC LIMIT 1`, [row.page_path], null);
    const impressions=int(trend.impressions), clicks=int(trend.clicks), position=Number(trend.average_position||0);
    let kind='content_proof';
    if (impressions>0 && clicks===0) kind='title_meta'; else if(position>10 && position<=30) kind='internal_link'; else if(String(row.image_proof_status||'').startsWith('needs_')) kind='image_proof';
    result.push({...row,clicks,impressions,average_position:Number(position.toFixed(1)),gbp_observation:gbp,opportunity_kind:kind});
  }
  return result;
}

async function payload(db, env, url) {
  const days=Math.max(1,Math.min(365,int(url.searchParams.get('days'),30)));
  const source=clean(url.searchParams.get('source'),100);
  const products=await productReadinessAndMargins(db);
  const customers=await customerTimeline(db,int(url.searchParams.get('customer_limit'),40));
  const funnel=await funnelMetrics(db,days,source);
  const visualQueue=await safeAll(db, `SELECT q.*,c.approval_status,c.consent_status AS candidate_consent_status,c.alt_text_suggestion,c.performance_note FROM media_publication_review_queue q LEFT JOIN approved_visual_replacement_candidates c ON c.route_path=q.route_path AND c.placeholder_asset=q.placeholder_asset ORDER BY CASE q.review_status WHEN 'queued' THEN 0 WHEN 'in_review' THEN 1 ELSE 2 END,q.route_path LIMIT 100`);
  const existingCandidates=await safeAll(db, `SELECT * FROM approved_visual_replacement_candidates ORDER BY route_path LIMIT 100`);
  for (const candidate of existingCandidates) await safeRun(db, `INSERT INTO media_publication_review_queue (route_path,source_kind,source_record_id,placeholder_asset,desired_role,consent_status,public_use_status,compression_status,alt_text_status,performance_status,review_status,notes) VALUES (?,'placeholder_replacement',?,?,'public_page_visual',?,?, 'needs_measurement',?, 'needs_measurement','queued',?) ON CONFLICT(route_path,placeholder_asset,desired_role) DO UPDATE SET consent_status=excluded.consent_status,public_use_status=excluded.public_use_status,alt_text_status=excluded.alt_text_status,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`, [candidate.route_path,candidate.approved_visual_replacement_candidate_id,candidate.placeholder_asset,candidate.consent_status||'needs_review',candidate.approval_status||'needs_approved_media',candidate.alt_text_suggestion?'suggested':'needs_review',candidate.performance_note||'Review compression and public asset budget.']);
  if (await tableExists(db,'customer_story_builder_rows')) {
    const stories=await safeAll(db,`SELECT customer_story_builder_row_id,story_title,story_summary,consent_status,approval_status,target_context FROM customer_story_builder_rows ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 100`);
    for (const story of stories) await safeRun(db,`INSERT INTO customer_story_approval_batches (source_kind,source_record_id,story_title,story_summary,consent_status,approval_status,target_context,notes) VALUES ('customer_story_builder',?,?,?,?,?,?,?) ON CONFLICT(source_kind,source_record_id) DO UPDATE SET story_title=excluded.story_title,story_summary=excluded.story_summary,consent_status=excluded.consent_status,target_context=excluded.target_context,updated_at=CURRENT_TIMESTAMP`,[story.customer_story_builder_row_id,story.story_title||'Customer story candidate',story.story_summary||'',story.consent_status||'needs_review',story.approval_status||'candidate',story.target_context||'trust_block','Synced into Build 190 approval batch; publication still requires explicit approval.']);
  }
  if (await tableExists(db,'public_proof_candidates')) {
    const proofs=await safeAll(db,`SELECT public_proof_candidate_id,proof_title,proof_body,consent_status,moderation_status,placement_context FROM public_proof_candidates ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 100`);
    for (const proof of proofs) await safeRun(db,`INSERT INTO customer_story_approval_batches (source_kind,source_record_id,story_title,story_summary,consent_status,approval_status,target_context,notes) VALUES ('public_proof_candidate',?,?,?,?,?,?,?) ON CONFLICT(source_kind,source_record_id) DO UPDATE SET story_title=excluded.story_title,story_summary=excluded.story_summary,consent_status=excluded.consent_status,target_context=excluded.target_context,updated_at=CURRENT_TIMESTAMP`,[proof.public_proof_candidate_id,proof.proof_title||'Public proof candidate',proof.proof_body||'',proof.consent_status||'needs_review',proof.moderation_status==='approved'?'in_review':proof.moderation_status||'candidate',proof.placement_context||'trust_block','Synced from public proof moderation; final publication remains gated.']);
  }
  return {
    ok:true,build_label:BUILD_LABEL,filters:{days,source},environment_health:environmentHealth(env),saved_views:await safeAll(db,`SELECT * FROM admin_command_center_saved_views WHERE view_status='active' ORDER BY is_default DESC,view_label`),funnel,products,customers,seo_opportunities:await seoOpportunities(db),gbp_observations:await safeAll(db,`SELECT * FROM google_business_profile_observations ORDER BY observation_month DESC,created_at DESC LIMIT 100`),seo_actions:await safeAll(db,`SELECT * FROM search_console_opportunity_actions ORDER BY created_at DESC LIMIT 100`),visual_queue:await safeAll(db,`SELECT * FROM media_publication_review_queue ORDER BY CASE review_status WHEN 'queued' THEN 0 WHEN 'in_review' THEN 1 ELSE 2 END,route_path LIMIT 100`),compression:await safeAll(db,`SELECT * FROM image_compression_report_rows ORDER BY original_bytes DESC LIMIT 100`),cart_recovery:await safeAll(db,`SELECT r.*,l.customer_name,l.cart_count,l.checkout_path,l.created_at AS lead_created_at FROM cart_recovery_review_rows r LEFT JOIN checkout_recovery_leads l ON l.checkout_recovery_lead_id=r.checkout_recovery_lead_id ORDER BY COALESCE(r.updated_at,r.created_at) DESC LIMIT 100`),campaigns:await safeAll(db,`SELECT * FROM seasonal_campaign_plans ORDER BY COALESCE(target_start_date,'9999-12-31'),campaign_label LIMIT 50`),story_batches:await safeAll(db,`SELECT * FROM customer_story_approval_batches ORDER BY CASE approval_status WHEN 'candidate' THEN 0 WHEN 'in_review' THEN 1 ELSE 2 END,updated_at DESC LIMIT 100`),markdown_registry:await safeAll(db,`SELECT * FROM markdown_retirement_registry ORDER BY retirement_status,file_path LIMIT 100`)
  };
}

async function seedCartRecovery(db) {
  if (!(await tableExists(db,'checkout_recovery_leads'))) return;
  const leads=await safeAll(db,`SELECT checkout_recovery_lead_id,customer_email,cart_value_cents,status FROM checkout_recovery_leads ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 200`);
  for (const lead of leads) await safeRun(db,`INSERT INTO cart_recovery_review_rows (checkout_recovery_lead_id,customer_email,cart_value_cents,recovery_status,contact_permission_status,suggested_action,gift_card_opportunity_status,notes) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(checkout_recovery_lead_id) DO UPDATE SET customer_email=excluded.customer_email,cart_value_cents=excluded.cart_value_cents,updated_at=CURRENT_TIMESTAMP`,[lead.checkout_recovery_lead_id,lead.customer_email,int(lead.cart_value_cents),lead.status==='open'?'needs_review':lead.status,'needs_review',int(lead.cart_value_cents)>7500?'Review a helpful personal follow-up; do not send automatically.':'Review only; avoid unnecessary email.','not_reviewed','Build 190 guarded review row; no automatic sending.']);
}

export async function onRequestGet({request,env}) {
  const adminUser=await getAdminUserFromRequest(request,env); if(!adminUser)return json({ok:false,error:'Admin access required.'},401);
  const db=getDb(env); if(!db)return json({ok:false,error:'D1 database binding is missing.'},500);
  await ensureTables(db); await seedDefaults(db,int(adminUser.user_id)); await seedCartRecovery(db);
  return json(await payload(db,env,new URL(request.url)));
}

export async function onRequestPost({request,env}) {
  const adminUser=await getAdminUserFromRequest(request,env); if(!adminUser)return json({ok:false,error:'Admin access required.'},401);
  const db=getDb(env); if(!db)return json({ok:false,error:'D1 database binding is missing.'},500);
  await ensureTables(db); await seedDefaults(db,int(adminUser.user_id)); await seedCartRecovery(db);
  let body={}; try{body=await request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const action=clean(body.action,80);
  if(action==='save_view') {
    const key=clean(body.view_key,80)||`view_${Date.now()}`; const label=clean(body.view_label,120)||'Saved view'; const area=clean(body.view_area,80)||'owner'; const filters=body.filter_json&&typeof body.filter_json==='object'?body.filter_json:{};
    await safeRun(db,`INSERT INTO admin_command_center_saved_views (view_key,view_label,view_area,filter_json,is_default,view_status,created_by_user_id,notes) VALUES (?,?,?,?,?,'active',?,'Saved from Build 190 Command Center.') ON CONFLICT(view_key) DO UPDATE SET view_label=excluded.view_label,view_area=excluded.view_area,filter_json=excluded.filter_json,is_default=excluded.is_default,updated_at=CURRENT_TIMESTAMP`,[key,label,area,JSON.stringify(filters),body.is_default?1:0,int(adminUser.user_id)]);
  } else if(action==='add_gbp_observation') {
    const path=clean(body.page_path,220); if(!path.startsWith('/'))return json({ok:false,error:'page_path must start with /.'},400);
    const month=clean(body.observation_month,7)||new Date().toISOString().slice(0,7); const phrase=clean(body.search_phrase,180);
    await safeRun(db,`INSERT INTO google_business_profile_observations (page_path,observation_month,profile_action,search_phrase,position_note,calls,website_clicks,direction_requests,photo_views,review_count,observation_status,created_by_user_id,notes) VALUES (?,?,?,?,?,?,?,?,?,?, 'recorded',?,?) ON CONFLICT(page_path,observation_month,search_phrase) DO UPDATE SET profile_action=excluded.profile_action,position_note=excluded.position_note,calls=excluded.calls,website_clicks=excluded.website_clicks,direction_requests=excluded.direction_requests,photo_views=excluded.photo_views,review_count=excluded.review_count,observation_status='recorded',updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`,[path,month,clean(body.profile_action,180),phrase,clean(body.position_note,500),int(body.calls),int(body.website_clicks),int(body.direction_requests),int(body.photo_views),int(body.review_count),int(adminUser.user_id),clean(body.notes,1500)]);
  } else if(action==='create_seo_opportunity') {
    const path=clean(body.page_path,220); if(!path.startsWith('/'))return json({ok:false,error:'page_path must start with /.'},400);
    await safeRun(db,`INSERT INTO search_console_opportunity_actions (page_path,query_text,opportunity_kind,clicks,impressions,average_position,action_status,proposed_title,proposed_meta_description,internal_link_note,created_by_user_id,notes) VALUES (?,?,?,?,?,?,'queued',?,?,?,?,?)`,[path,clean(body.query_text,240),clean(body.opportunity_kind,80)||'title_meta_internal_link',int(body.clicks),int(body.impressions),Number(body.average_position||0),clean(body.proposed_title,180),clean(body.proposed_meta_description,320),clean(body.internal_link_note,600),int(adminUser.user_id),clean(body.notes,1500)||'Created from Build 190 Local SEO opportunity review.']);
  } else if(action==='update_visual_candidate') {
    await safeRun(db,`UPDATE media_publication_review_queue SET media_url=?,consent_status=?,public_use_status=?,compression_status=?,alt_text_status=?,performance_status=?,review_status=?,updated_at=CURRENT_TIMESTAMP,notes=? WHERE media_publication_review_queue_id=?`,[clean(body.media_url,1000)||null,clean(body.consent_status,80)||'needs_review',clean(body.public_use_status,80)||'needs_approved_media',clean(body.compression_status,80)||'needs_measurement',clean(body.alt_text_status,80)||'needs_review',clean(body.performance_status,80)||'needs_measurement',clean(body.review_status,80)||'in_review',clean(body.notes,1500),int(body.id)]);
  } else if(action==='review_cart_recovery') {
    await safeRun(db,`UPDATE cart_recovery_review_rows SET recovery_status=?,contact_permission_status=?,suggested_action=?,gift_card_opportunity_status=?,reviewed_by_user_id=?,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP,notes=? WHERE cart_recovery_review_row_id=?`,[clean(body.recovery_status,80)||'reviewed',clean(body.contact_permission_status,80)||'reviewed',clean(body.suggested_action,500),clean(body.gift_card_opportunity_status,80)||'reviewed',int(adminUser.user_id),clean(body.notes,1500),int(body.id)]);
  } else if(action==='save_campaign') {
    const key=clean(body.campaign_key,100)||`campaign_${Date.now()}`;
    await safeRun(db,`INSERT INTO seasonal_campaign_plans (campaign_key,campaign_label,campaign_kind,target_start_date,target_end_date,target_locality,product_focus,image_status,seo_status,campaign_status,created_by_user_id,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(campaign_key) DO UPDATE SET campaign_label=excluded.campaign_label,campaign_kind=excluded.campaign_kind,target_start_date=excluded.target_start_date,target_end_date=excluded.target_end_date,target_locality=excluded.target_locality,product_focus=excluded.product_focus,image_status=excluded.image_status,seo_status=excluded.seo_status,campaign_status=excluded.campaign_status,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`,[key,clean(body.campaign_label,180)||'Seasonal campaign',clean(body.campaign_kind,80)||'gift_moment',clean(body.target_start_date,10)||null,clean(body.target_end_date,10)||null,clean(body.target_locality,140)||'Southern Ontario',clean(body.product_focus,1000),clean(body.image_status,80)||'needs_approved_media',clean(body.seo_status,80)||'needs_review',clean(body.campaign_status,80)||'planning',int(adminUser.user_id),clean(body.notes,1500)]);
  } else if(action==='update_story') {
    await safeRun(db,`UPDATE customer_story_approval_batches SET consent_status=?,approval_status=?,target_context=?,story_title=?,story_summary=?,approved_by_user_id=CASE WHEN ?='approved' THEN ? ELSE approved_by_user_id END,approved_at=CASE WHEN ?='approved' THEN CURRENT_TIMESTAMP ELSE approved_at END,updated_at=CURRENT_TIMESTAMP,notes=? WHERE customer_story_approval_batch_id=?`,[clean(body.consent_status,80)||'needs_review',clean(body.approval_status,80)||'in_review',clean(body.target_context,160),clean(body.story_title,220),clean(body.story_summary,1600),clean(body.approval_status,80),int(adminUser.user_id),clean(body.approval_status,80),clean(body.notes,1500),int(body.id)]);
  } else if(action==='sync_customer_timeline') {
    await syncTimeline(db,await customerTimeline(db,200));
  } else if(action!=='refresh') return json({ok:false,error:'Unsupported action.'},400);
  await auditAdminAction(env,request,adminUser,{action_type:`value_ops_${action}`,target_type:'value_ops',details:{build:BUILD_LABEL}});
  return json(await payload(db,env,new URL(request.url)));
}
