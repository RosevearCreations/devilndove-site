// File: /functions/api/admin/today-tasks.js
// Devil n Dove Build 366 contract / Build 369 implementation — non-mutating Today Tasks GET.
// Read failures are surfaced as readiness metadata instead of being silently converted to zero.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { BUILD, IMPLEMENTATION_BUILD, readTodayTasks } from '../_lib/todayTasksReadService.js';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);

  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  const url = new URL(context.request.url);
  const categoryFilter = String(url.searchParams.get('category') || '').trim();
  const minCount = Number(url.searchParams.get('min_count') || 1) || 1;

  try {
    return json(await readTodayTasks(db, { categoryFilter, minCount }));
  } catch (error) {
    return json({
      ok: false,
      build: BUILD,
      implementation_build: IMPLEMENTATION_BUILD,
      contract: 'operations-today-tasks-read',
      owner: 'operations',
      request_time_schema_mutation: false,
      mutation_ownership_moved: false,
      error_code: 'today_tasks_read_failed',
      error: String(error?.message || error || 'Today Tasks read failed.'),
    }, 500);
  }
}
