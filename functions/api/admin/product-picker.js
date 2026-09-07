// Release 467 Build 63 — lightweight Product picker read model.
// This route exists to keep degraded Product-editor recovery away from the much
// heavier Product resource/bootstrap rollups.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { buildReadBudgetHeaders, resolveProductPickerBudget } from '../_lib/d1ReadBudget.js';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function json(data, status = 200, headers = {}) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store', ...headers });
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const url = new URL(context.request.url);
  const budget = resolveProductPickerBudget(url);
  const headers = buildReadBudgetHeaders('admin_product_picker', budget);

  if (budget.searchBlocked) {
    return json({
      ok: true,
      products: [],
      pagination: {
        limit: budget.limit,
        cursor: budget.cursor,
        next_cursor: null,
        has_more: false
      },
      read_budget: {
        guarded: true,
        search_blocked: true,
        search_mode: budget.budget.search_mode,
        min_search_length: budget.budget.min_search_length,
        warnings: budget.warnings
      }
    }, 200, headers);
  }

  const clauses = ['1=1'];
  const bindings = [];

  if (budget.cursor) {
    clauses.push('product_id < ?');
    bindings.push(budget.cursor);
  }

  if (budget.searchProvided && budget.q) {
    // Prefix-only matching intentionally avoids a blank or contains-everything search
    // becoming a recovery-time full-table browse. This is a picker safety route, not
    // the full Product search workspace.
    const prefix = `${budget.q}%`;
    clauses.push(`(
      name LIKE ? COLLATE NOCASE
      OR slug LIKE ? COLLATE NOCASE
      OR sku LIKE ? COLLATE NOCASE
    )`);
    bindings.push(prefix, prefix, prefix);
  }

  const fetchLimit = budget.limit + 1;
  const sql = `
    SELECT product_id,name,slug,sku,status,updated_at
    FROM products
    WHERE ${clauses.join(' AND ')}
    ORDER BY product_id DESC
    LIMIT ?
  `;
  bindings.push(fetchLimit);

  try {
    const result = await db.prepare(sql).bind(...bindings).all();
    const raw = rows(result);
    const hasMore = raw.length > budget.limit;
    const products = raw.slice(0, budget.limit).map((row) => ({
      product_id: Number(row.product_id || 0),
      name: String(row.name || '').trim(),
      slug: String(row.slug || '').trim(),
      sku: String(row.sku || '').trim(),
      status: String(row.status || '').trim(),
      updated_at: row.updated_at || null
    }));
    const nextCursor = hasMore && products.length
      ? Number(products[products.length - 1].product_id || 0) || null
      : null;

    return json({
      ok: true,
      products,
      pagination: {
        limit: budget.limit,
        cursor: budget.cursor,
        next_cursor: nextCursor,
        has_more: hasMore
      },
      read_budget: {
        guarded: true,
        search_blocked: false,
        search_mode: budget.searchProvided ? budget.budget.search_mode : 'first_page_only',
        min_search_length: budget.budget.min_search_length,
        row_return_cap: budget.limit,
        query_row_fetch_cap: fetchLimit,
        exact_total_count_avoided: true,
        warnings: budget.warnings
      },
      requested_by: {
        user_id: adminUser.user_id,
        email: adminUser.email,
        display_name: adminUser.display_name
      }
    }, 200, headers);
  } catch (error) {
    return json({
      ok: false,
      error: 'Product picker could not be loaded.',
      read_budget: {
        guarded: true,
        row_return_cap: budget.limit,
        warnings: [...budget.warnings, String(error?.message || error || 'unknown_error')]
      }
    }, 503, headers);
  }
}
