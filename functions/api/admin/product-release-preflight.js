// Build 208 — read-only Product Release Preflight.
// Combines catalog facts, product-media safety, Content Studio, CAIP evidence,
// and Content Release Board checks without changing source media, product fields,
// rights, publication status, or any provider configuration.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { publicationReadiness } from '../_lib/contentPublications.js';

function json(data, status = 200) {
  return jsonResponse(data, status, {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
}

function text(value, max = 0) {
  const clean = normalizeText(value).replace(/\s+/g, ' ');
  return max > 0 ? clean.slice(0, max).trim() : clean;
}

function number(value) {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function key(value) {
  return text(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function safeDateAfterNow(value) {
  const raw = text(value);
  if (!raw) return true;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed > Date.now() : true;
}

function check(checkKey, label, pass, detail, { required = true, href = '' } = {}) {
  return {
    key: checkKey,
    label,
    pass: Boolean(pass),
    required: Boolean(required),
    detail: text(detail, 320),
    href: text(href, 260)
  };
}

function stage(stageKey, label, checks, description = '', { informational = false } = {}) {
  const blockers = checks.filter((item) => item.required && !item.pass);
  const warnings = checks.filter((item) => !item.required && !item.pass);
  return {
    key: stageKey,
    label,
    description: text(description, 320),
    checks,
    informational: Boolean(informational),
    ready: blockers.length === 0,
    blocker_count: blockers.length,
    warning_count: warnings.length,
    blockers,
    warnings
  };
}

function summaryFromStages(stages) {
  const list = Object.values(stages || {});
  const blockers = list.flatMap((item) => item.blockers || []);
  const warnings = list.flatMap((item) => item.warnings || []);
  const possible = list.flatMap((item) => item.checks || []).filter((item) => item.required).length;
  const passed = list.flatMap((item) => item.checks || []).filter((item) => item.required && item.pass).length;
  return {
    ready: blockers.length === 0,
    score: possible ? Math.round((passed / possible) * 100) : 0,
    blocker_count: blockers.length,
    warning_count: warnings.length,
    blockers,
    warnings
  };
}

async function tableExists(db, tableName) {
  const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1")
    .bind(tableName).first().catch(() => null);
  return Boolean(row);
}

async function columnsFor(db, tableName) {
  const result = await db.prepare(`PRAGMA table_info(${tableName})`).all().catch(() => ({ results: [] }));
  return new Set(rows(result).map((item) => text(item?.name)).filter(Boolean));
}

function field(columns, column, alias = column, prefix = '') {
  return columns.has(column) ? `${prefix}${column} AS ${alias}` : `NULL AS ${alias}`;
}

async function loadProduct(db, productId, support) {
  const productColumns = support.columns.products;
  const seoColumns = support.columns.product_seo;
  const hasSeo = support.tables.product_seo && seoColumns.has('product_id');
  const select = [
    'p.product_id AS product_id',
    field(productColumns, 'name', 'name', 'p.'),
    field(productColumns, 'slug', 'slug', 'p.'),
    field(productColumns, 'product_number', 'product_number', 'p.'),
    field(productColumns, 'sku', 'sku', 'p.'),
    field(productColumns, 'product_category', 'product_category', 'p.'),
    field(productColumns, 'status', 'status', 'p.'),
    field(productColumns, 'review_status', 'review_status', 'p.'),
    field(productColumns, 'price_cents', 'price_cents', 'p.'),
    field(productColumns, 'inventory_tracking', 'inventory_tracking', 'p.'),
    field(productColumns, 'inventory_quantity', 'inventory_quantity', 'p.'),
    field(productColumns, 'short_description', 'short_description', 'p.'),
    field(productColumns, 'description', 'description', 'p.'),
    field(productColumns, 'featured_image_url', 'featured_image_url', 'p.'),
    field(productColumns, 'updated_at', 'updated_at', 'p.'),
    hasSeo ? field(seoColumns, 'meta_title', 'meta_title', 'ps.') : 'NULL AS meta_title',
    hasSeo ? field(seoColumns, 'meta_description', 'meta_description', 'ps.') : 'NULL AS meta_description',
    hasSeo ? field(seoColumns, 'canonical_url', 'canonical_url', 'ps.') : 'NULL AS canonical_url',
    hasSeo ? field(seoColumns, 'og_image_url', 'og_image_url', 'ps.') : 'NULL AS og_image_url'
  ];
  const query = `SELECT ${select.join(', ')} FROM products p ${hasSeo ? 'LEFT JOIN product_seo ps ON ps.product_id=p.product_id' : ''} WHERE p.product_id=? LIMIT 1`;
  const row = await db.prepare(query).bind(productId).first().catch(() => null);
  if (!row) return null;
  return {
    product_id: number(row.product_id),
    product_number: row.product_number == null ? null : Number(row.product_number || 0),
    name: text(row.name) || `Product ${productId}`,
    slug: text(row.slug),
    sku: text(row.sku),
    product_category: text(row.product_category),
    status: key(row.status) || 'draft',
    review_status: key(row.review_status) || 'pending_review',
    price_cents: Number(row.price_cents || 0),
    inventory_tracking: Number(row.inventory_tracking || 0) === 1,
    inventory_quantity: Number(row.inventory_quantity || 0),
    short_description: text(row.short_description),
    description: text(row.description),
    featured_image_url: text(row.featured_image_url),
    meta_title: text(row.meta_title),
    meta_description: text(row.meta_description),
    canonical_url: text(row.canonical_url),
    og_image_url: text(row.og_image_url),
    updated_at: row.updated_at || null
  };
}

function imageSafety(row) {
  const status = key(row.public_use_status);
  const hasLinkedConsent = number(row.consent_record_id) > 0;
  const consentAllowed = Number(row.public_use_allowed || 0) === 1 && safeDateAfterNow(row.consent_expires_at);
  const blocked = ['blocked', 'consent_needed'].includes(status) || (hasLinkedConsent && !consentAllowed);
  const explicitlyApproved = ['public_allowed', 'product_page_ok'].includes(status) && (!hasLinkedConsent || consentAllowed);
  const legacy = !status && !hasLinkedConsent;
  return {
    status: status || (legacy ? 'unannotated_legacy' : 'internal_review'),
    blocked,
    explicitly_approved: explicitlyApproved,
    legacy,
    public_candidate: explicitlyApproved || legacy,
    consent_linked: hasLinkedConsent,
    consent_allowed: consentAllowed
  };
}

async function loadProductMedia(db, product, support) {
  const images = [];
  const productId = number(product?.product_id);
  if (!productId) return images;

  if (support.tables.product_images) {
    const pi = support.columns.product_images;
    const pia = support.columns.product_image_annotations;
    const mcr = support.columns.media_consent_records;
    const hasAnnotations = support.tables.product_image_annotations && pia.has('product_id');
    const hasConsent = hasAnnotations && support.tables.media_consent_records && pia.has('consent_record_id') && mcr.has('consent_record_id');
    const idExpr = pi.has('product_image_id') ? 'pi.product_image_id' : 'pi.rowid';
    const orderExpr = pi.has('sort_order') ? 'pi.sort_order' : idExpr;
    const joinAnnotation = hasAnnotations ? `LEFT JOIN product_image_annotations pia ON pia.product_id=pi.product_id AND ${pia.has('product_image_id') ? `pia.product_image_id=${idExpr}` : "pia.image_url=pi.image_url"}` : '';
    const joinConsent = hasConsent ? 'LEFT JOIN media_consent_records mcr ON mcr.consent_record_id=pia.consent_record_id' : '';
    const sql = `SELECT ${idExpr} AS product_image_id, pi.image_url AS image_url,
      ${pi.has('alt_text') ? 'pi.alt_text' : "''"} AS alt_text,
      ${orderExpr} AS sort_order,
      ${hasAnnotations && pia.has('image_role') ? 'pia.image_role' : "''"} AS image_role,
      ${hasAnnotations && pia.has('public_use_status') ? 'pia.public_use_status' : "''"} AS public_use_status,
      ${hasAnnotations && pia.has('consent_record_id') ? 'pia.consent_record_id' : 'NULL'} AS consent_record_id,
      ${hasConsent && mcr.has('public_use_allowed') ? 'mcr.public_use_allowed' : 'NULL'} AS public_use_allowed,
      ${hasConsent && mcr.has('expires_at') ? 'mcr.expires_at' : 'NULL'} AS consent_expires_at,
      'product_images' AS source
      FROM product_images pi ${joinAnnotation} ${joinConsent}
      WHERE pi.product_id=? ORDER BY ${orderExpr} ASC, ${idExpr} ASC`;
    const productImageRows = rows(await db.prepare(sql).bind(productId).all().catch(() => ({ results: [] })));
    productImageRows.forEach((row) => images.push({
      source: 'product_images',
      source_id: number(row.product_image_id),
      url: text(row.image_url),
      alt_text: text(row.alt_text),
      sort_order: Number(row.sort_order || 0),
      image_role: key(row.image_role),
      ...imageSafety(row)
    }));
  }

  if (support.tables.media_assets) {
    const ma = support.columns.media_assets;
    if (ma.has('product_id') && ma.has('public_url')) {
      const idExpr = ma.has('media_asset_id') ? 'media_asset_id' : 'rowid';
      const orderExpr = ma.has('sort_order') ? 'sort_order' : idExpr;
      const deletedClause = ma.has('deleted_at') ? 'AND deleted_at IS NULL' : '';
      const rowsAssets = rows(await db.prepare(`SELECT ${idExpr} AS media_asset_id, public_url AS image_url,
        ${ma.has('variant_role') ? 'variant_role' : "''"} AS variant_role,
        ${ma.has('original_filename') ? 'original_filename' : "''"} AS original_filename,
        ${orderExpr} AS sort_order
        FROM media_assets WHERE product_id=? AND LENGTH(TRIM(COALESCE(public_url,'')))>0 ${deletedClause}
        ORDER BY CASE LOWER(COALESCE(${ma.has('variant_role') ? 'variant_role' : "''"},'')) WHEN 'featured' THEN 0 WHEN 'hero_front' THEN 1 ELSE 2 END,
          COALESCE(${orderExpr},999999) ASC, ${idExpr} ASC`).bind(productId).all().catch(() => ({ results: [] })));
      rowsAssets.forEach((row) => images.push({
        source: 'media_assets',
        source_id: number(row.media_asset_id),
        url: text(row.image_url),
        alt_text: text(row.original_filename),
        sort_order: Number(row.sort_order || 999999),
        image_role: key(row.variant_role),
        // Media-library assets may be legitimate historic product media. They remain a
        // compatibility candidate, but this preflight reports the missing explicit review.
        ...imageSafety({})
      }));
    }
  }

  const unique = new Map();
  for (const image of images) {
    if (!image.url || unique.has(image.url)) continue;
    unique.set(image.url, image);
  }
  return [...unique.values()];
}

async function loadContent(db, productId, support) {
  if (!support.tables.content_projects) return { schema_ready: false, project: null, media: {}, deliverables: {} };
  const project = await db.prepare(`SELECT * FROM content_projects
    WHERE product_id=? OR (source_type='product' AND source_id=?)
    ORDER BY datetime(COALESCE(updated_at,created_at,CURRENT_TIMESTAMP)) DESC, content_project_id DESC LIMIT 1`)
    .bind(productId, String(productId)).first().catch(() => null);
  if (!project) return { schema_ready: true, project: null, media: {}, deliverables: {} };
  const contentProjectId = number(project.content_project_id);
  const media = support.tables.content_project_media
    ? await db.prepare(`SELECT COUNT(*) AS total,
        SUM(CASE WHEN is_selected=1 THEN 1 ELSE 0 END) AS selected,
        SUM(CASE WHEN is_selected=1 AND lower(COALESCE(safety_status,''))='public_allowed' THEN 1 ELSE 0 END) AS selected_public_allowed,
        SUM(CASE WHEN lower(COALESCE(safety_status,''))='needs_review' THEN 1 ELSE 0 END) AS needs_review,
        SUM(CASE WHEN lower(COALESCE(safety_status,''))='blocked' THEN 1 ELSE 0 END) AS blocked
      FROM content_project_media WHERE content_project_id=?`).bind(contentProjectId).first().catch(() => ({}))
    : {};
  const deliverableRows = support.tables.content_project_deliverables
    ? rows(await db.prepare(`SELECT deliverable_key, channel_key, deliverable_type, deliverable_status, approval_status, title
      FROM content_project_deliverables WHERE content_project_id=? ORDER BY content_project_deliverable_id ASC`).bind(contentProjectId).all().catch(() => ({ results: [] })))
    : [];
  const byKey = Object.fromEntries(deliverableRows.map((row) => [key(row.deliverable_key), {
    deliverable_key: key(row.deliverable_key),
    title: text(row.title),
    approval_status: key(row.approval_status) || 'needs_review',
    deliverable_status: key(row.deliverable_status) || 'planned'
  }]));
  return {
    schema_ready: true,
    project: {
      content_project_id: contentProjectId,
      content_project_key: text(project.content_project_key),
      project_title: text(project.project_title),
      project_status: key(project.project_status) || 'draft',
      review_status: key(project.review_status) || 'needs_review',
      public_release_status: key(project.public_release_status) || 'private',
      updated_at: project.updated_at || null
    },
    media: {
      total: Number(media?.total || 0),
      selected: Number(media?.selected || 0),
      selected_public_allowed: Number(media?.selected_public_allowed || 0),
      needs_review: Number(media?.needs_review || 0),
      blocked: Number(media?.blocked || 0)
    },
    deliverables: {
      total: deliverableRows.length,
      by_key: byKey,
      approved_count: deliverableRows.filter((item) => key(item.approval_status) === 'approved').length,
      rows: deliverableRows.map((row) => ({
        deliverable_key: key(row.deliverable_key),
        title: text(row.title),
        approval_status: key(row.approval_status) || 'needs_review',
        deliverable_status: key(row.deliverable_status) || 'planned'
      }))
    }
  };
}

async function loadCaip(db, productId, contentProjectId, support) {
  if (!support.tables.creative_projects) return { schema_ready: false, project: null, assets: {}, evidence_count: 0, approved_segment_count: 0 };
  const project = await db.prepare(`SELECT * FROM creative_projects
    WHERE (content_project_id=? AND ? > 0) OR product_id=?
    ORDER BY datetime(COALESCE(updated_at,created_at,CURRENT_TIMESTAMP)) DESC, creative_project_id DESC LIMIT 1`)
    .bind(contentProjectId, contentProjectId, productId).first().catch(() => null);
  if (!project) return { schema_ready: true, project: null, assets: {}, evidence_count: 0, approved_segment_count: 0 };
  const creativeProjectId = number(project.creative_project_id);
  const assets = support.tables.creative_assets
    ? await db.prepare(`SELECT COUNT(*) AS total,
        SUM(CASE WHEN lower(COALESCE(rights_status,''))='public_allowed' THEN 1 ELSE 0 END) AS public_allowed,
        SUM(CASE WHEN lower(COALESCE(rights_status,''))='needs_review' THEN 1 ELSE 0 END) AS needs_review,
        SUM(CASE WHEN lower(COALESCE(rights_status,''))='blocked' THEN 1 ELSE 0 END) AS blocked
      FROM creative_assets WHERE creative_project_id=?`).bind(creativeProjectId).first().catch(() => ({}))
    : {};
  const evidence = support.tables.creative_story_evidence
    ? await db.prepare('SELECT COUNT(*) AS count FROM creative_story_evidence WHERE creative_project_id=?').bind(creativeProjectId).first().catch(() => ({ count: 0 }))
    : { count: 0 };
  const segments = support.tables.creative_story_segments
    ? await db.prepare("SELECT COUNT(*) AS count FROM creative_story_segments WHERE creative_project_id=? AND lower(COALESCE(segment_status,''))='approved'").bind(creativeProjectId).first().catch(() => ({ count: 0 }))
    : { count: 0 };
  return {
    schema_ready: true,
    project: {
      creative_project_id: creativeProjectId,
      creative_project_key: text(project.creative_project_key),
      project_status: key(project.project_status) || 'intake',
      governance_status: key(project.governance_status) || 'needs_review',
      lifecycle_stage: key(project.lifecycle_stage) || 'intake',
      updated_at: project.updated_at || null
    },
    assets: {
      total: Number(assets?.total || 0),
      public_allowed: Number(assets?.public_allowed || 0),
      needs_review: Number(assets?.needs_review || 0),
      blocked: Number(assets?.blocked || 0)
    },
    evidence_count: Number(evidence?.count || 0),
    approved_segment_count: Number(segments?.count || 0)
  };
}

async function loadPublications(db, contentProjectId, support) {
  if (!contentProjectId || !support.tables.content_publications || !support.tables.content_project_deliverables) {
    return { schema_ready: support.tables.content_publications && support.tables.content_project_deliverables, publications: [] };
  }
  const list = rows(await db.prepare(`SELECT cpb.*, d.approval_status AS source_approval_status, d.deliverable_status AS source_deliverable_status,
    d.deliverable_key AS source_deliverable_key
    FROM content_publications cpb
    LEFT JOIN content_project_deliverables d ON d.content_project_deliverable_id=cpb.content_project_deliverable_id
    WHERE cpb.content_project_id=?
    ORDER BY datetime(COALESCE(cpb.updated_at,cpb.created_at,CURRENT_TIMESTAMP)) DESC, cpb.content_publication_id DESC`).bind(contentProjectId).all().catch(() => ({ results: [] })));
  const latest = new Map();
  for (const row of list) {
    const destination = key(row.destination) || 'workshop_journal';
    if (!latest.has(destination)) latest.set(destination, row);
  }
  return {
    schema_ready: true,
    publications: [...latest.values()].map((row) => ({
      content_publication_id: number(row.content_publication_id),
      destination: key(row.destination) || 'workshop_journal',
      title: text(row.title),
      content_status: key(row.content_status) || 'draft',
      canonical_path: text(row.canonical_path),
      public_url: key(row.content_status) === 'published' ? text(row.canonical_path) : '',
      readiness: publicationReadiness(row)
    }))
  };
}

async function loadInventoryContext(db, product, support) {
  const trackingEnabled = Boolean(product?.inventory_tracking);
  const productQuantity = Number(product?.inventory_quantity || 0);
  const schemaReady = Boolean(support.tables.product_resource_links && support.tables.site_item_inventory);
  if (!schemaReady) {
    return {
      schema_ready: false,
      product_tracking_enabled: trackingEnabled,
      product_quantity: productQuantity,
      linked_resource_count: 0,
      matched_inventory_count: 0,
      missing_inventory_count: 0,
      reorder_pressure_count: 0,
      do_not_reuse_count: 0,
      rows: []
    };
  }

  const links = support.columns.product_resource_links;
  const inventory = support.columns.site_item_inventory;
  if (!links.has('product_id') || !links.has('resource_kind') || !links.has('source_key')
    || !inventory.has('source_type') || !inventory.has('external_key')) {
    return {
      schema_ready: false,
      product_tracking_enabled: trackingEnabled,
      product_quantity: productQuantity,
      linked_resource_count: 0,
      matched_inventory_count: 0,
      missing_inventory_count: 0,
      reorder_pressure_count: 0,
      do_not_reuse_count: 0,
      rows: []
    };
  }

  const safeField = (column, alias, fallback = 'NULL') => inventory.has(column) ? `si.${column} AS ${alias}` : `${fallback} AS ${alias}`;
  const linkOrder = links.has('sort_order') ? 'prl.sort_order' : (links.has('product_resource_link_id') ? 'prl.product_resource_link_id' : 'prl.rowid');
  const query = `SELECT
      prl.resource_kind AS resource_kind,
      prl.source_key AS source_key,
      ${links.has('quantity_used') ? 'prl.quantity_used' : '1'} AS quantity_used,
      ${links.has('consumption_mode') ? "prl.consumption_mode" : "'per_unit'"} AS consumption_mode,
      ${links.has('lot_size_units') ? 'prl.lot_size_units' : '1'} AS lot_size_units,
      ${safeField('site_item_inventory_id', 'site_item_inventory_id')},
      ${safeField('item_name', 'item_name', "''")},
      ${safeField('is_active', 'is_active', '1')},
      ${safeField('on_hand_quantity', 'on_hand_quantity', '0')},
      ${safeField('reserved_quantity', 'reserved_quantity', '0')},
      ${safeField('incoming_quantity', 'incoming_quantity', '0')},
      ${safeField('reorder_level', 'reorder_level', '0')},
      ${safeField('do_not_reorder', 'do_not_reorder', '0')},
      ${safeField('do_not_reuse', 'do_not_reuse', '0')},
      ${safeField('stock_unit_label', 'stock_unit_label', "'unit'")}
    FROM product_resource_links prl
    LEFT JOIN site_item_inventory si
      ON si.source_type=prl.resource_kind
     AND si.external_key=prl.source_key
    WHERE prl.product_id=?
    ORDER BY ${linkOrder} ASC`;
  const inventoryRows = rows(await db.prepare(query).bind(number(product?.product_id)).all().catch(() => ({ results: [] })));
  const normalized = inventoryRows.map((row) => {
    const hasRecord = number(row.site_item_inventory_id) > 0;
    const onHand = Number(row.on_hand_quantity || 0);
    const reserved = Number(row.reserved_quantity || 0);
    const incoming = Number(row.incoming_quantity || 0);
    const reorderLevel = Number(row.reorder_level || 0);
    const availableNow = Math.max(0, onHand - reserved);
    const isActive = Number(row.is_active ?? 1) !== 0;
    const doNotReorder = Number(row.do_not_reorder || 0) === 1;
    const doNotReuse = Number(row.do_not_reuse || 0) === 1;
    const hasPressure = hasRecord && isActive && !doNotReorder && availableNow <= reorderLevel;
    return {
      resource_kind: key(row.resource_kind) || 'supply',
      source_key: text(row.source_key),
      item_name: text(row.item_name) || text(row.source_key),
      quantity_used: Math.max(1, Number(row.quantity_used || 1)),
      consumption_mode: key(row.consumption_mode) || 'per_unit',
      lot_size_units: Math.max(1, Number(row.lot_size_units || 1)),
      has_inventory_record: hasRecord,
      on_hand_quantity: onHand,
      reserved_quantity: reserved,
      incoming_quantity: incoming,
      available_now: availableNow,
      reorder_level: reorderLevel,
      stock_unit_label: text(row.stock_unit_label) || 'unit',
      active: isActive,
      do_not_reorder: doNotReorder,
      do_not_reuse: doNotReuse,
      reorder_pressure: hasPressure
    };
  });
  return {
    schema_ready: true,
    product_tracking_enabled: trackingEnabled,
    product_quantity: productQuantity,
    linked_resource_count: normalized.length,
    matched_inventory_count: normalized.filter((row) => row.has_inventory_record).length,
    missing_inventory_count: normalized.filter((row) => !row.has_inventory_record).length,
    reorder_pressure_count: normalized.filter((row) => row.reorder_pressure).length,
    do_not_reuse_count: normalized.filter((row) => row.do_not_reuse).length,
    rows: normalized
  };
}

function buildInventoryContextStage(product, inventory) {
  const productLink = `/admin/inventory-operations/?product_id=${product.product_id}`;
  const schemaReady = Boolean(inventory?.schema_ready);
  const links = Number(inventory?.linked_resource_count || 0);
  const coverage = Number(inventory?.matched_inventory_count || 0);
  const missing = Number(inventory?.missing_inventory_count || 0);
  const pressure = Number(inventory?.reorder_pressure_count || 0);
  const doNotReuse = Number(inventory?.do_not_reuse_count || 0);
  const trackingEnabled = Boolean(inventory?.product_tracking_enabled);
  const productQuantity = Number(inventory?.product_quantity || 0);
  return stage('inventory_context', 'Inventory & maker-input context', [
    check('inventory_schema', 'Inventory records available', schemaReady, schemaReady ? 'Product-resource and site inventory records are available for internal context.' : 'Inventory context is not available in this database yet.', { required: false, href: productLink }),
    check('finished_stock', 'Finished-product stock context', !trackingEnabled || productQuantity > 0, trackingEnabled ? (productQuantity > 0 ? `${productQuantity} finished item${productQuantity === 1 ? '' : 's'} recorded on hand.` : 'Product inventory tracking is enabled but no finished quantity is on hand.') : 'Finished-product tracking is not enabled; this may be correct for a made-to-order or one-of-a-kind item.', { required: false, href: `/admin/catalog/?product_id=${product.product_id}` }),
    check('resource_links', 'Linked maker inputs', links > 0, links > 0 ? `${links} tool/supply link${links === 1 ? '' : 's'} is recorded for internal build context.` : 'No product-resource links are recorded yet.', { required: false, href: productLink }),
    check('resource_coverage', 'Inventory coverage for linked inputs', links === 0 || missing === 0, links === 0 ? 'No linked inputs are available to match yet.' : (missing === 0 ? `${coverage}/${links} linked maker inputs match an inventory record.` : `${coverage}/${links} linked maker inputs match inventory; ${missing} still need an inventory record.`), { required: false, href: productLink }),
    check('resource_pressure', 'Reorder pressure', pressure === 0, pressure === 0 ? 'No matched linked input is at or below its internal reorder level.' : `${pressure} linked input${pressure === 1 ? '' : 's'} is at or below its internal reorder level.`, { required: false, href: productLink }),
    check('reuse_note', 'Do-not-reuse signal', doNotReuse === 0, doNotReuse === 0 ? 'No linked input is marked do not reuse.' : `${doNotReuse} linked input${doNotReuse === 1 ? '' : 's'} is flagged do not reuse; verify the planned build before reserving materials.`, { required: false, href: productLink })
  ], 'Internal stock and maker-input context only. It never changes inventory, builds, reservations, costs, rights, public copy, or release readiness.', { informational: true });
}

async function loadOfferContext(db, productId, support) {
  const tierReady = Boolean(support.tables.product_quantity_price_tiers);
  const bundleReady = Boolean(support.tables.product_bundle_settings && support.tables.product_bundle_components);
  const tiers = tierReady ? rows(await db.prepare(`SELECT min_quantity,unit_price_cents,label,is_active FROM product_quantity_price_tiers WHERE product_id=? AND is_active=1 ORDER BY min_quantity`).bind(productId).all().catch(() => ({results:[]}))) : [];
  const settings = bundleReady ? await db.prepare(`SELECT * FROM product_bundle_settings WHERE bundle_product_id=? LIMIT 1`).bind(productId).first().catch(() => null) : null;
  const components = settings && bundleReady ? rows(await db.prepare(`SELECT bc.*,p.name component_name,COALESCE(p.inventory_quantity,0) component_inventory_quantity FROM product_bundle_components bc LEFT JOIN products p ON p.product_id=bc.component_product_id WHERE bc.bundle_product_id=? ORDER BY bc.sort_order,bc.product_bundle_component_id`).bind(productId).all().catch(() => ({results:[]}))) : [];
  return { schema_ready: tierReady && bundleReady, tiers, settings, components };
}

function buildOfferStage(product, offer) {
  const tiers = offer?.tiers || [];
  let prior = Number(product.price_cents || 0);
  const tierIntegrity = tiers.every((row) => {
    const current = Number(row.unit_price_cents || 0);
    const valid = Number(row.min_quantity || 0) >= 2 && current > 0 && current <= prior;
    prior = current;
    return valid;
  });
  const settings = offer?.settings || null;
  const components = offer?.components || [];
  const bundleConfigured = Boolean(settings);
  const reserved = Number(settings?.reserved_bundle_quantity || 0);
  const requested = Number(settings?.requested_bundle_quantity || 0);
  return stage('offers', 'Quantity specials & limited sets', [
    check('offer_schema', 'Offer controls available', Boolean(offer?.schema_ready), offer?.schema_ready ? 'Build 220 offer and set tables are available.' : 'Apply the Build 220 database migration before using quantity specials or limited sets.', { required: false, href: `/admin/catalog/?product_id=${product.product_id}` }),
    check('tier_integrity', 'Quantity-price progression', tierIntegrity, tiers.length ? (tierIntegrity ? `${tiers.length} quantity price break${tiers.length===1?'':'s'} decreases or holds the per-item price correctly.` : 'One or more quantity breaks increases the per-item price or has an invalid quantity.') : 'No quantity specials are configured.', { required: tiers.length > 0, href: `/admin/catalog/?product_id=${product.product_id}` }),
    check('bundle_components', 'Set component definition', !bundleConfigured || components.length > 0, !bundleConfigured ? 'This is not configured as a product set.' : (components.length ? `${components.length} finished-product component${components.length===1?'':'s'} are assigned.` : 'The set has no components.'), { required: bundleConfigured, href: `/admin/catalog/?product_id=${product.product_id}` }),
    check('bundle_reservation', 'Complete-set availability', !bundleConfigured || requested === 0 || reserved > 0, !bundleConfigured ? 'No set reservation applies.' : (reserved > 0 ? `${reserved} of ${requested} requested complete set${requested===1?'':'s'} are reserved.` : 'No complete set can currently be formed; storefront availability will be zero.'), { required: false, href: `/admin/catalog/?product_id=${product.product_id}` })
  ], 'Prices are re-resolved by checkout. Set availability is based on complete finished-product component reservations.', { informational: true });
}

function buildCatalogStage(product) {
  return stage('catalog', 'Catalog facts', [
    check('product_exists', 'Product record', Boolean(product), product ? 'The selected product exists.' : 'Choose a valid product record.', { href: '/admin/catalog/' }),
    check('catalog_review', 'Catalog approval', ['approved', 'published'].includes(product.review_status), ['approved', 'published'].includes(product.review_status) ? 'The catalog review state is approved or published.' : 'Approve the product review before passing it into release work.', { href: `/admin/catalog/?product_id=${product.product_id}` }),
    check('catalog_status', 'Store status', product.status === 'active', product.status === 'active' ? 'The product is active.' : 'Set an approved product to Active before release review.', { href: `/admin/catalog/?product_id=${product.product_id}` }),
    check('name', 'Buyer-facing product name', text(product.name).length >= 3, text(product.name).length >= 3 ? 'A buyer-facing name is present.' : 'Add a clear product name.', { href: `/admin/catalog/?product_id=${product.product_id}` }),
    check('slug', 'Stable product URL', /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug), /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug) ? 'A clean product slug is present.' : 'Add a lowercase slug using letters, numbers, and hyphens.', { href: `/admin/catalog/?product_id=${product.product_id}` }),
    check('price', 'Price', Number(product.price_cents || 0) > 0, Number(product.price_cents || 0) > 0 ? 'A price is set.' : 'Set a price greater than $0.', { href: `/admin/catalog/?product_id=${product.product_id}` }),
    check('category', 'Specific category', text(product.product_category).length > 0, text(product.product_category).length > 0 ? 'A product category is selected.' : 'Choose the most specific category available.', { href: `/admin/catalog/?product_id=${product.product_id}` }),
    check('description', 'Short description', text(product.short_description).length >= 40, text(product.short_description).length >= 40 ? 'The short description has enough buyer-facing detail.' : 'Write at least one factual, buyer-facing short description.', { href: `/admin/catalog/?product_id=${product.product_id}` }),
    check('seo', 'Visible/search snippet consistency', text(product.meta_title).length >= 10 && text(product.meta_description).length >= 50, text(product.meta_title).length >= 10 && text(product.meta_description).length >= 50 ? 'SEO title and description are prepared for review.' : 'Add a helpful SEO title and description that match the product.', { href: `/admin/catalog-media/?product_id=${product.product_id}#product-media-workflow` })
  ], 'Factual product fields must be ready before public-release planning.');
}

function buildMediaStage(product, media) {
  const featured = media.find((item) => item.url === product.featured_image_url) || null;
  const publicCandidates = media.filter((item) => item.public_candidate);
  const explicitCandidates = media.filter((item) => item.explicitly_approved);
  const blocked = media.filter((item) => item.blocked);
  const hero = media.find((item) => ['hero_front', 'featured'].includes(item.image_role));
  const featuredLegacy = product.featured_image_url && !featured;
  const featuredSafe = featured ? !featured.blocked : Boolean(featuredLegacy);
  const featuredAlt = featured ? text(featured.alt_text).length >= 5 : false;
  return stage('media', 'Product media and public permissions', [
    check('featured_media', 'Resolved featured image', Boolean(product.featured_image_url), product.featured_image_url ? 'A featured image URL resolves for this product.' : 'Choose or sync a featured image.', { href: `/admin/catalog-media/?product_id=${product.product_id}#product-media-workflow` }),
    check('media_count', 'Product media', media.length >= 1, media.length >= 1 ? `${media.length} source media record${media.length === 1 ? '' : 's'} found.` : 'Add at least one real product image.', { href: `/admin/catalog-media/?product_id=${product.product_id}#product-media-workflow` }),
    check('featured_public_safe', 'Featured-image safety', featuredSafe, featuredSafe ? (featured?.explicitly_approved ? 'The featured source is explicitly cleared for public use.' : 'No explicit block or consent-needed status is attached to the featured source.') : 'The resolved featured image is blocked, needs consent, or has a disallowed linked consent record.', { href: `/admin/catalog-media/?product_id=${product.product_id}#product-media-workflow` }),
    check('public_candidate', 'Public-use candidate', publicCandidates.length >= 1, publicCandidates.length >= 1 ? `${publicCandidates.length} media candidate${publicCandidates.length === 1 ? '' : 's'} can be reviewed for public use.` : 'Clear or replace a real product image before release.', { href: `/admin/catalog-media/?product_id=${product.product_id}#product-media-workflow` }),
    check('hero_role', 'Hero/front image role', Boolean(hero), hero ? 'A hero/front role is assigned.' : 'Assign Hero/front or Featured to the lead product image.', { required: false, href: `/admin/catalog-media/?product_id=${product.product_id}#product-media-workflow` }),
    check('featured_alt', 'Lead-image alt text', featuredAlt, featuredAlt ? 'The featured image has descriptive alt text.' : 'Add concise descriptive alt text to the featured gallery image.', { required: false, href: `/admin/catalog-media/?product_id=${product.product_id}#product-media-workflow` }),
    check('explicit_media_review', 'Explicit public-media review', explicitCandidates.length >= 1, explicitCandidates.length >= 1 ? `${explicitCandidates.length} media item${explicitCandidates.length === 1 ? '' : 's'} has an explicit public status.` : 'This product is using the compatibility rule for unannotated first-party media. Review the lead image explicitly before a public release.', { required: false, href: `/admin/catalog-media/?product_id=${product.product_id}#product-media-workflow` }),
    check('blocked_media', 'No blocked media chosen for release', blocked.length === 0 || featuredSafe, blocked.length === 0 ? 'No media rows are explicitly blocked.' : `${blocked.length} blocked/consent-needed media row${blocked.length === 1 ? '' : 's'} remains visible for internal review only.`, { required: false, href: `/admin/catalog-media/?product_id=${product.product_id}#product-media-workflow` })
  ], 'This stage never creates rights; it reports existing review and consent signals only.');
}

function buildContentStage(product, content, destination) {
  const project = content.project;
  const byKey = content.deliverables?.by_key || {};
  const article = byKey.blog_article;
  const gallery = byKey.website_gallery;
  const wantArticle = destination === 'both' || destination === 'workshop_journal';
  const wantGallery = destination === 'both' || destination === 'website_gallery';
  const checks = [
    check('content_schema', 'Content Studio schema', content.schema_ready, content.schema_ready ? 'Content Studio tables are available.' : 'Run the reviewed Content Studio migration before using this release preflight.', { href: '/admin/content-studio/' }),
    check('content_project', 'Source-linked package', Boolean(project), project ? 'A Content Studio package is linked to this product.' : 'Create the package from Product Media → Content Studio → CAIP.', { href: `/admin/catalog-media/?product_id=${product.product_id}#product-media-workflow` }),
    check('content_project_approved', 'Package review', key(project?.review_status) === 'approved', key(project?.review_status) === 'approved' ? 'The Content Studio package is approved.' : 'Review and approve the Content Studio package. This is not a publish action.', { href: '/admin/content-studio/' }),
    check('content_media_public', 'Selected public-cleared source', Number(content.media?.selected_public_allowed || 0) >= 1, Number(content.media?.selected_public_allowed || 0) >= 1 ? `${Number(content.media.selected_public_allowed)} selected source media item${Number(content.media.selected_public_allowed) === 1 ? '' : 's'} is public-allowed.` : 'Select at least one source media item and document it as public-allowed in Content Studio.', { href: '/admin/content-studio/' })
  ];
  if (wantArticle) checks.push(check('article_deliverable', 'Workshop Journal deliverable', key(article?.approval_status) === 'approved', key(article?.approval_status) === 'approved' ? 'The Workshop Journal source deliverable is approved.' : 'Approve the blog/article deliverable in Content Studio.', { href: '/admin/content-studio/' }));
  if (wantGallery) checks.push(check('gallery_deliverable', 'Website gallery deliverable', key(gallery?.approval_status) === 'approved', key(gallery?.approval_status) === 'approved' ? 'The website-gallery source deliverable is approved.' : 'Approve the website gallery deliverable in Content Studio.', { href: '/admin/content-studio/' }));
  checks.push(check('content_blocked_media', 'No selected blocked source', Number(content.media?.blocked || 0) === 0, Number(content.media?.blocked || 0) === 0 ? 'No Content Studio source rows are marked blocked.' : `${Number(content.media.blocked)} source media row${Number(content.media.blocked) === 1 ? '' : 's'} is blocked and remains non-public.`, { required: false, href: '/admin/content-studio/' }));
  const targetLabel = destination === 'both' ? 'both website destinations' : destination === 'website_gallery' ? 'the Website gallery' : 'the Workshop Journal';
  return stage('content_studio', 'Content Studio package', checks, `Content Studio holds the source-linked package and factual deliverables for ${targetLabel}. It does not publish externally.`);
}

function buildCaipStage(product, caip) {
  const project = caip.project;
  return stage('caip', 'CAIP evidence and governance', [
    check('caip_schema', 'CAIP schema', caip.schema_ready, caip.schema_ready ? 'CAIP tables are available.' : 'Run the reviewed CAIP migration before using evidence-based release controls.', { href: '/admin/creative-assets/' }),
    check('caip_project', 'CAIP project', Boolean(project), project ? 'A reference-only CAIP project is linked.' : 'Create or refresh CAIP from the Product Media handoff.', { href: `/admin/catalog-media/?product_id=${product.product_id}#product-media-workflow` }),
    check('caip_governance', 'CAIP governance review', key(project?.governance_status) === 'approved', key(project?.governance_status) === 'approved' ? 'CAIP governance review is approved.' : 'Review CAIP evidence and governance status. CAIP approval is not publication approval.', { href: `/admin/creative-assets/?product_id=${product.product_id}` }),
    check('caip_public_assets', 'CAIP public-use evidence', Number(caip.assets?.public_allowed || 0) >= 1, Number(caip.assets?.public_allowed || 0) >= 1 ? `${Number(caip.assets.public_allowed)} CAIP asset${Number(caip.assets.public_allowed) === 1 ? '' : 's'} inherits public-allowed rights.` : 'Confirm the selected source asset has valid upstream public-use rights.', { href: `/admin/creative-assets/?product_id=${product.product_id}` }),
    check('caip_evidence', 'Source evidence', Number(caip.evidence_count || 0) >= 1, Number(caip.evidence_count || 0) >= 1 ? `${Number(caip.evidence_count)} evidence record${Number(caip.evidence_count) === 1 ? '' : 's'} is available.` : 'Capture factual source evidence before preparing public prose.', { href: `/admin/creative-assets/?product_id=${product.product_id}` }),
    check('caip_story', 'Reviewed story segment', Number(caip.approved_segment_count || 0) >= 1, Number(caip.approved_segment_count || 0) >= 1 ? `${Number(caip.approved_segment_count)} story segment${Number(caip.approved_segment_count) === 1 ? '' : 's'} is approved.` : 'Review/approve a factual story segment or keep the release in draft.', { required: false, href: `/admin/creative-assets/?product_id=${product.product_id}` }),
    check('caip_blocked_assets', 'No CAIP asset is selected from a blocked source', Number(caip.assets?.blocked || 0) === 0, Number(caip.assets?.blocked || 0) === 0 ? 'No CAIP assets are blocked.' : `${Number(caip.assets.blocked)} CAIP asset${Number(caip.assets.blocked) === 1 ? '' : 's'} is blocked and cannot be elevated by this checklist.`, { required: false, href: `/admin/creative-assets/?product_id=${product.product_id}` })
  ], 'CAIP adds evidence and governance records; it never creates public rights or publishes content.');
}

function buildReleaseStage(product, publications, destination) {
  const wanted = destination === 'both' ? ['workshop_journal', 'website_gallery'] : [destination];
  const publicationByDestination = new Map((publications.publications || []).map((item) => [item.destination, item]));
  const checks = [
    check('release_schema', 'Release Board schema', publications.schema_ready, publications.schema_ready ? 'Release Board tables are available.' : 'Run the reviewed Content Release Board migration before publication.', { href: '/admin/content-publications/' })
  ];
  for (const target of wanted) {
    const item = publicationByDestination.get(target);
    const label = target === 'website_gallery' ? 'Website gallery' : 'Workshop Journal';
    checks.push(check(`release_${target}_draft`, `${label} public draft`, Boolean(item), item ? `${label} draft exists.` : `Prepare the ${label} draft from the approved content package.`, { href: '/admin/content-publications/' }));
    checks.push(check(`release_${target}_readiness`, `${label} release checklist`, Boolean(item?.readiness?.ready), item?.readiness?.ready ? 'Required public-copy, media, slug, and SEO checks pass.' : 'Complete the Release Board checklist before approval.', { href: '/admin/content-publications/' }));
    checks.push(check(`release_${target}_approval`, ['approved', 'published'].includes(key(item?.content_status)), ['approved', 'published'].includes(key(item?.content_status)) ? 'The public draft is approved or already published.' : 'Approve the public draft after factual review; approval alone does not force publication.', { href: '/admin/content-publications/' }));
  }
  return stage('release_board', 'Content Release Board', checks, 'This stage is checked only for publish readiness. Passing it never automatically publishes a page.');
}

async function supportState(db) {
  const required = [
    'products', 'product_seo', 'product_images', 'product_image_annotations', 'media_assets', 'media_consent_records',
    'content_projects', 'content_project_media', 'content_project_deliverables',
    'creative_projects', 'creative_assets', 'creative_story_evidence', 'creative_story_segments',
    'content_publications', 'product_resource_links', 'site_item_inventory',
    'product_quantity_price_tiers', 'product_bundle_settings', 'product_bundle_components'
  ];
  const entries = await Promise.all(required.map(async (name) => [name, await tableExists(db, name)]));
  const tables = Object.fromEntries(entries);
  const columns = {};
  await Promise.all(required.filter((name) => tables[name]).map(async (name) => { columns[name] = await columnsFor(db, name); }));
  required.filter((name) => !columns[name]).forEach((name) => { columns[name] = new Set(); });
  return { tables, columns };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  const url = new URL(request.url);
  const productId = number(url.searchParams.get('product_id'));
  const destinationRaw = key(url.searchParams.get('destination'));
  const destination = ['workshop_journal', 'website_gallery'].includes(destinationRaw) ? destinationRaw : 'both';
  if (!productId) return json({ ok: false, error: 'A valid product_id is required.' }, 400);

  try {
    const support = await supportState(db);
    if (!support.tables.products) return json({ ok: false, error: 'The products table is unavailable.' }, 503);
    const product = await loadProduct(db, productId, support);
    if (!product) return json({ ok: false, error: 'Product not found.' }, 404);

    const [media, content, inventory, offer] = await Promise.all([
      loadProductMedia(db, product, support),
      loadContent(db, productId, support),
      loadInventoryContext(db, product, support),
      loadOfferContext(db, productId, support)
    ]);
    const [caip, publications] = await Promise.all([
      loadCaip(db, productId, number(content.project?.content_project_id), support),
      loadPublications(db, number(content.project?.content_project_id), support)
    ]);

    const catalog = buildCatalogStage(product);
    const mediaStage = buildMediaStage(product, media);
    const inventoryStage = buildInventoryContextStage(product, inventory);
    const offerStage = buildOfferStage(product, offer);
    const contentStage = buildContentStage(product, content, destination);
    const caipStage = buildCaipStage(product, caip);
    const handoffStages = { catalog, media: mediaStage, offers: offerStage, content_studio: contentStage, caip: caipStage };
    const handoff = summaryFromStages(handoffStages);
    const releaseBoard = buildReleaseStage(product, publications, destination);
    const publish = summaryFromStages({ ...handoffStages, release_board: releaseBoard });
    const firstBlocker = (handoff.blockers[0] || publish.blockers[0] || null);

    return json({
      ok: true,
      build: 'Build 220',
      mode: { destination, read_only: true },
      product,
      media: {
        total: media.length,
        public_candidate_count: media.filter((item) => item.public_candidate).length,
        explicitly_approved_count: media.filter((item) => item.explicitly_approved).length,
        blocked_count: media.filter((item) => item.blocked).length,
        featured_source: media.find((item) => item.url === product.featured_image_url)?.source || (product.featured_image_url ? 'product_record' : 'none')
      },
      content,
      inventory,
      offer,
      caip,
      publications,
      handoff: {
        ...handoff,
        label: 'Ready to pass to Release Board',
        first_next_action: firstBlocker ? { label: firstBlocker.label, detail: firstBlocker.detail, href: firstBlocker.href } : null
      },
      publish: {
        ...publish,
        label: destination === 'both' ? 'Ready to publish both destinations' : `Ready to publish ${destination === 'website_gallery' ? 'Website gallery' : 'Workshop Journal'}`,
        first_next_action: publish.blockers[0] ? { label: publish.blockers[0].label, detail: publish.blockers[0].detail, href: publish.blockers[0].href } : null
      },
      stages: { catalog, media: mediaStage, inventory_context: inventoryStage, offers: offerStage, content_studio: contentStage, caip: caipStage, release_board: releaseBoard },
      generated_at: new Date().toISOString(),
      requested_by: { user_id: number(adminUser.user_id), email: text(adminUser.email, 180) }
    });
  } catch (error) {
    return json({ ok: false, error: 'Could not build the product release preflight.', detail: text(error?.message || error, 500) }, 500);
  }
}
