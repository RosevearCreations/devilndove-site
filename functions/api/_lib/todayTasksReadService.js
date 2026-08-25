// Devil n Dove Build 366 contract / Build 369 implementation — non-mutating Today Tasks read authority.
// Reads are best-effort but never silently erase schema/query failures: readiness metadata
// reports missing tables and query errors while still returning the task counts that can be read.
// Build 369 aligns inventory/accounting/runtime-incident reads to the current schema and normalizes
// D1 missing-table diagnostics without moving Done/Ignore/Snooze mutation authority.

export const BUILD = 366;
export const IMPLEMENTATION_BUILD = 369;
export const CONTRACT_ID = 'operations-today-tasks-read';
export const OWNER = 'operations';

function text(value) {
  return String(value ?? '').trim();
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function firstNumber(row) {
  const value = Object.values(row || {})[0];
  return Number(value || 0);
}

function missingTableFromError(error) {
  const message = text(error?.message || error);
  const match = message.match(/no such table:\s*([^\s:]+)/i);
  return match ? match[1].replace(/["'`]/g, '') : null;
}

function queryIssue(key, error) {
  const message = text(error?.message || error) || 'Unknown read failure.';
  return Object.freeze({
    key,
    message,
    missing_table: missingTableFromError(error),
  });
}

async function scalarRead(db, key, sql) {
  try {
    const row = await db.prepare(sql).first();
    return Object.freeze({ key, count: firstNumber(row), issue: null });
  } catch (error) {
    return Object.freeze({ key, count: 0, issue: queryIssue(key, error) });
  }
}

async function runtimeIncidentDetails(db) {
  try {
    const result = await db.prepare(`
      SELECT
        runtime_incident_id AS incident_id,
        incident_code,
        incident_scope,
        severity,
        message,
        endpoint_path AS request_path,
        created_at
      FROM runtime_incidents
      WHERE COALESCE(review_status,'open') NOT IN ('resolved','ignored')
        AND datetime(created_at) >= datetime('now','-7 days')
      ORDER BY datetime(created_at) DESC
      LIMIT 8
    `).all();
    return Object.freeze({ rows: Object.freeze(rows(result)), issue: null });
  } catch (error) {
    return Object.freeze({ rows: Object.freeze([]), issue: queryIssue('runtime_incident_details', error) });
  }
}

async function latestTaskActions(db) {
  try {
    const result = await db.prepare(`
      SELECT task_key, action_status, snooze_until, created_at
      FROM today_task_actions
      ORDER BY datetime(created_at) DESC
    `).all();

    const latest = new Map();
    for (const row of rows(result)) {
      const key = text(row?.task_key);
      if (key && !latest.has(key)) latest.set(key, row);
    }
    return Object.freeze({ latest, issue: null });
  } catch (error) {
    return Object.freeze({ latest: new Map(), issue: queryIssue('today_task_actions', error) });
  }
}

function suppressed(latest, taskKey) {
  const row = latest.get(taskKey);
  if (!row) return false;
  const action = text(row.action_status).toLowerCase();
  if (action === 'ignored' || action === 'completed') return true;
  if (action === 'snoozed' && row.snooze_until) {
    return new Date(row.snooze_until).getTime() > Date.now();
  }
  return false;
}

function uniqueIssues(issues) {
  const seen = new Set();
  const output = [];
  for (const issue of issues.filter(Boolean)) {
    const key = `${issue.key}|${issue.message}|${issue.missing_table || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(issue);
  }
  return Object.freeze(output);
}

export async function readTodayTasks(db, options = {}) {
  const categoryFilter = text(options.categoryFilter);
  const minCount = Math.max(0, Number(options.minCount || 1) || 1);

  const [
    readiness,
    customRequests,
    orders,
    inventory,
    accounting,
    failedApi,
    details,
    actions,
  ] = await Promise.all([
    scalarRead(db, 'readiness', `SELECT COUNT(*) FROM products WHERE COALESCE(status,'draft')!='archived' AND (COALESCE(featured_image_url,'')='' OR COALESCE(price_cents,0)<=0 OR COALESCE(short_description,'')='')`),
    scalarRead(db, 'custom_requests', `SELECT COUNT(*) FROM custom_requests WHERE COALESCE(status,'new') IN ('new','reviewing','quote_needed')`),
    scalarRead(db, 'orders', `SELECT COUNT(*) FROM orders WHERE COALESCE(order_status,'pending') IN ('pending','paid') OR COALESCE(payment_status,'pending')='pending'`),
    scalarRead(db, 'inventory', `SELECT COUNT(*) FROM site_item_inventory WHERE COALESCE(is_active,1)=1 AND COALESCE(do_not_reorder,0)=0 AND (COALESCE(is_on_reorder_list,0)=1 OR (COALESCE(reorder_level,0)>0 AND COALESCE(on_hand_quantity,0)<=COALESCE(reorder_level,0)))`),
    scalarRead(db, 'accounting', `SELECT COUNT(*) FROM accounting_hst_gst_reviews WHERE COALESCE(remittance_evidence_url,'')='' AND COALESCE(review_status,'draft')!='draft'`),
    scalarRead(db, 'failed_api', `SELECT COUNT(*) FROM runtime_incidents WHERE COALESCE(review_status,'open') NOT IN ('resolved','ignored') AND datetime(created_at) >= datetime('now','-7 days')`),
    runtimeIncidentDetails(db),
    latestTaskActions(db),
  ]);

  const rawTasks = [
    { key: 'readiness', category: 'catalog', label: 'Product readiness blockers', count: readiness.count, href: '/admin/readiness/?filter=basic_catalog_blockers' },
    { key: 'custom_requests', category: 'customers', label: 'Custom requests needing review', count: customRequests.count, href: '/admin/operations/#customRequestsAdminMount' },
    { key: 'orders', category: 'orders', label: 'Orders pending payment/fulfillment', count: orders.count, href: '/admin/orders/' },
    { key: 'inventory', category: 'inventory', label: 'Inventory needing reorder/review', count: inventory.count, href: '/admin/inventory-operations/' },
    { key: 'accounting', category: 'accounting', label: 'Accounting evidence gaps', count: accounting.count, href: '/admin/accounting/#accountingEvidenceCheckMount' },
    { key: 'failed_api', category: 'health', label: 'Recent failed API/runtime incidents', count: failedApi.count, href: '/admin/operations/#runtimeIncidentsAdminMount', details: details.rows },
  ];

  const categories = Object.freeze(Array.from(new Set(rawTasks.map((task) => task.category || 'general'))));
  const tasks = [];
  let suppressedCount = 0;
  for (const task of rawTasks) {
    if (categoryFilter && task.category !== categoryFilter) continue;
    if (Number(task.count || 0) < minCount) continue;
    if (Number(task.count || 0) > 0 && suppressed(actions.latest, task.key)) {
      suppressedCount += 1;
      continue;
    }
    tasks.push(Object.freeze({ ...task }));
  }

  const issues = uniqueIssues([
    readiness.issue,
    customRequests.issue,
    orders.issue,
    inventory.issue,
    accounting.issue,
    failedApi.issue,
    details.issue,
    actions.issue,
  ]);
  const missingTables = Object.freeze(Array.from(new Set(issues.map((issue) => issue.missing_table).filter(Boolean))));

  return Object.freeze({
    ok: true,
    build: BUILD,
    implementation_build: IMPLEMENTATION_BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    request_time_schema_mutation: false,
    mutation_ownership_moved: false,
    schema_ready: issues.length === 0,
    missing_tables: missingTables,
    query_errors: issues,
    tasks: Object.freeze(tasks),
    categories,
    suppressed_count: suppressedCount,
    summary: Object.freeze({
      total_count: tasks.reduce((sum, row) => sum + Number(row.count || 0), 0),
      generated_at: new Date().toISOString(),
    }),
  });
}
