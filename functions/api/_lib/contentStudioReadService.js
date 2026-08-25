// Devil n Dove Build 355 — Content Studio non-mutating read authority.
// GET/read paths report schema readiness and never create/alter application schema.

export const BUILD = 355;
export const LEGACY_BUILD = 273;
export const CONTRACT_ID = 'content-studio-read';
export const OWNER = 'content';

const REQUIRED_COLUMNS = Object.freeze({
  content_projects: Object.freeze([
    'content_project_id','source_type','source_id','product_id','project_title','review_status','public_release_status','updated_at'
  ]),
  content_project_media: Object.freeze([
    'content_project_media_id','content_project_id','is_selected','is_featured','safety_status','selection_score','sort_order'
  ]),
  content_project_deliverables: Object.freeze([
    'content_project_deliverable_id','content_project_id','channel_key','deliverable_status','approval_status'
  ]),
  content_project_events: Object.freeze([
    'content_project_event_id','content_project_id'
  ]),
  products: Object.freeze([
    'product_id','name','slug','review_status','updated_at'
  ]),
});

const OPTIONAL_TABLES = Object.freeze([
  'creative_work_projects',
  'creative_projects',
  'creative_assets',
  'creative_project_evidence_selections',
]);

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function positiveInt(value) {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

async function tableNames(db) {
  const result = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
  return new Set(rows(result).map((row) => String(row.name || '').trim()).filter(Boolean));
}

async function columnsFor(db, tableName) {
  const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
  return new Set(rows(result).map((row) => String(row.name || '').trim()).filter(Boolean));
}

export async function inspectContentStudioReadSchema(db) {
  const availableTables = await tableNames(db);
  const missingTables = Object.keys(REQUIRED_COLUMNS).filter((table) => !availableTables.has(table));
  const missingColumns = [];

  for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
    if (!availableTables.has(table)) continue;
    const availableColumns = await columnsFor(db, table);
    for (const column of columns) {
      if (!availableColumns.has(column)) missingColumns.push(`${table}.${column}`);
    }
  }

  return Object.freeze({
    schema_ready: missingTables.length === 0 && missingColumns.length === 0,
    missing_tables: Object.freeze(missingTables),
    missing_columns: Object.freeze(missingColumns),
    optional_tables: Object.freeze(
      Object.fromEntries(OPTIONAL_TABLES.map((table) => [table, availableTables.has(table)]))
    ),
  });
}

async function listProjects(db) {
  return rows(await db.prepare(`
    SELECT cp.*, p.name AS product_name, p.slug AS product_slug, p.review_status AS product_review_status,
      COUNT(DISTINCT cpm.content_project_media_id) AS media_count,
      SUM(CASE WHEN cpm.is_selected = 1 THEN 1 ELSE 0 END) AS selected_media_count,
      SUM(CASE WHEN cpm.safety_status = 'public_allowed' THEN 1 ELSE 0 END) AS public_media_count,
      SUM(CASE WHEN cpm.safety_status = 'blocked' THEN 1 ELSE 0 END) AS blocked_media_count,
      COUNT(DISTINCT cpd.content_project_deliverable_id) AS deliverable_count,
      SUM(CASE WHEN cpd.approval_status = 'approved' THEN 1 ELSE 0 END) AS approved_deliverable_count,
      SUM(CASE WHEN cpd.deliverable_status = 'published' THEN 1 ELSE 0 END) AS published_deliverable_count
    FROM content_projects cp
    LEFT JOIN products p ON p.product_id = cp.product_id
    LEFT JOIN content_project_media cpm ON cpm.content_project_id = cp.content_project_id
    LEFT JOIN content_project_deliverables cpd ON cpd.content_project_id = cp.content_project_id
    GROUP BY cp.content_project_id
    ORDER BY cp.updated_at DESC, cp.content_project_id DESC
    LIMIT 80
  `).all());
}

async function listApprovedProducts(db) {
  return rows(await db.prepare(`
    SELECT product_id, name, slug, product_category, featured_image_url, review_status, status, updated_at
    FROM products
    WHERE lower(COALESCE(review_status,'')) IN ('approved','published')
    ORDER BY updated_at DESC, product_id DESC
    LIMIT 160
  `).all().catch(() => ({ results: [] })));
}

async function listCreativeProjects(db, optionalTables) {
  if (!optionalTables.creative_work_projects) return [];
  return rows(await db.prepare(`
    SELECT cwp.creative_work_project_id,cwp.project_key,cwp.project_title,cwp.project_type,cwp.project_status,cwp.updated_at,
      cp.content_project_id,cp.review_status AS content_review_status,cp.public_release_status,
      caip.creative_project_id AS caip_creative_project_id,
      ${optionalTables.creative_assets ? `(SELECT COUNT(*) FROM creative_assets a WHERE a.creative_project_id=caip.creative_project_id AND a.asset_status<>'archived')` : '0'} AS caip_asset_count,
      ${optionalTables.creative_project_evidence_selections ? `(SELECT COUNT(*) FROM creative_project_evidence_selections es WHERE es.creative_work_project_id=cwp.creative_work_project_id AND es.selected=1)` : '0'} AS selected_evidence_count
    FROM creative_work_projects cwp
    LEFT JOIN content_projects cp ON cp.source_type='creative_project' AND cp.source_id=CAST(cwp.creative_work_project_id AS TEXT)
    ${optionalTables.creative_projects ? `LEFT JOIN creative_projects caip ON caip.source_type='creative_work_project' AND caip.source_id=CAST(cwp.creative_work_project_id AS TEXT)` : `LEFT JOIN (SELECT NULL AS creative_project_id, NULL AS source_type, NULL AS source_id) caip ON 1=0`}
    WHERE cwp.project_status<>'archived'
    ORDER BY cwp.updated_at DESC,cwp.creative_work_project_id DESC
    LIMIT 120
  `).all().catch(() => ({ results: [] })));
}

async function projectDetail(db, projectId, optionalTables) {
  const project = await db.prepare(`SELECT * FROM content_projects WHERE content_project_id=? LIMIT 1`).bind(projectId).first();
  if (!project) return null;

  const media = rows(await db.prepare(`
    SELECT * FROM content_project_media
    WHERE content_project_id=?
    ORDER BY is_featured DESC, is_selected DESC, selection_score DESC, sort_order ASC, content_project_media_id ASC
  `).bind(projectId).all());

  const deliverables = rows(await db.prepare(`
    SELECT * FROM content_project_deliverables
    WHERE content_project_id=?
    ORDER BY CASE channel_key WHEN 'youtube' THEN 1 WHEN 'facebook' THEN 2 WHEN 'instagram' THEN 3 WHEN 'tiktok' THEN 4 WHEN 'website' THEN 5 WHEN 'google_business_profile' THEN 6 WHEN 'seo' THEN 7 WHEN 'blog' THEN 8 ELSE 9 END,
      content_project_deliverable_id
  `).bind(projectId).all());

  const events = rows(await db.prepare(`
    SELECT * FROM content_project_events
    WHERE content_project_id=?
    ORDER BY content_project_event_id DESC
    LIMIT 30
  `).bind(projectId).all());

  const counts = deliverables.reduce((acc, item) => {
    acc[item.channel_key] = (acc[item.channel_key] || 0) + 1;
    return acc;
  }, {});

  let creativeProcessProject = null;
  let caipProject = null;
  if (project.source_type === 'creative_project' && positiveInt(project.source_id)) {
    if (optionalTables.creative_work_projects) {
      creativeProcessProject = await db.prepare(`
        SELECT creative_work_project_id,project_key,project_title,project_type,project_status
        FROM creative_work_projects
        WHERE creative_work_project_id=? LIMIT 1
      `).bind(positiveInt(project.source_id)).first().catch(() => null);
    }
    if (optionalTables.creative_projects) {
      caipProject = await db.prepare(`
        SELECT creative_project_id,project_title,governance_status,lifecycle_stage
        FROM creative_projects
        WHERE source_type='creative_work_project' AND source_id=? LIMIT 1
      `).bind(String(project.source_id)).first().catch(() => null);
    }
  }

  return {
    project,
    media,
    deliverables,
    events,
    counts,
    creative_process_project: creativeProcessProject,
    caip_project: caipProject,
  };
}

export async function readContentStudio(db, options = {}) {
  const schema = await inspectContentStudioReadSchema(db);
  const projectIdInput = positiveInt(options.projectId);
  const creativeProjectId = positiveInt(options.creativeProjectId);

  if (!schema.schema_ready) {
    return Object.freeze({
      ok: true,
      build: BUILD,
      legacy_build: LEGACY_BUILD,
      contract: CONTRACT_ID,
      owner: OWNER,
      request_time_schema_mutation: false,
      mutation_ownership_moved: false,
      schema_ready: false,
      missing_tables: schema.missing_tables,
      missing_columns: schema.missing_columns,
      optional_tables: schema.optional_tables,
      projects: Object.freeze([]),
      approved_products: Object.freeze([]),
      creative_projects: Object.freeze([]),
      detail: null,
      requested_creative_project_id: creativeProjectId || null,
      resolved_project_id: projectIdInput || null,
      not_found: false,
      mode: 'review_first_no_auto_publish',
    });
  }

  let projectId = projectIdInput;
  if (!projectId && creativeProjectId) {
    const linked = await db.prepare(`
      SELECT content_project_id FROM content_projects
      WHERE source_type='creative_project' AND source_id=?
      LIMIT 1
    `).bind(String(creativeProjectId)).first();
    projectId = positiveInt(linked?.content_project_id);
  }

  const projects = await listProjects(db);
  const approvedProducts = await listApprovedProducts(db);
  const creativeProjects = await listCreativeProjects(db, schema.optional_tables);
  const detail = projectId ? await projectDetail(db, projectId, schema.optional_tables) : null;

  return Object.freeze({
    ok: true,
    build: BUILD,
    legacy_build: LEGACY_BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    request_time_schema_mutation: false,
    mutation_ownership_moved: false,
    schema_ready: true,
    missing_tables: Object.freeze([]),
    missing_columns: Object.freeze([]),
    optional_tables: schema.optional_tables,
    projects: Object.freeze(projects),
    approved_products: Object.freeze(approvedProducts),
    creative_projects: Object.freeze(creativeProjects),
    detail,
    requested_creative_project_id: creativeProjectId || null,
    resolved_project_id: projectId || null,
    not_found: Boolean(projectId && !detail),
    mode: 'review_first_no_auto_publish',
  });
}
