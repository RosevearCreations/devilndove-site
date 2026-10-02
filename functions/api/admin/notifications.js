// File: /functions/api/admin/notifications.js
// Brief description: Lists notification jobs and supports queued/retry updates using the shared admin session authority.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function json(data, status = 200) { return jsonResponse(data, status); }
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(env);
  const rows = normalizeResults(await db.prepare(`
    SELECT notification_job_id, channel, job_type, target, status, attempt_count, max_attempts,
           next_attempt_at, last_attempt_at, last_error, created_at, updated_at
    FROM notification_jobs
    ORDER BY created_at DESC
    LIMIT 100
  `).all());
  return json({ ok: true, jobs: rows.map((row) => ({
    notification_job_id: Number(row.notification_job_id || 0), channel: row.channel || '',
    job_type: row.job_type || '', target: row.target || '', status: row.status || '',
    attempt_count: Number(row.attempt_count || 0), max_attempts: Number(row.max_attempts || 0),
    next_attempt_at: row.next_attempt_at || null, last_attempt_at: row.last_attempt_at || null,
    last_error: row.last_error || '', created_at: row.created_at || null, updated_at: row.updated_at || null
  })) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(env);
  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const action = normalizeText(body.action).toLowerCase();

  if (action === 'queue') {
    const channel = normalizeText(body.channel) || 'email';
    const jobType = normalizeText(body.job_type) || 'generic';
    const target = normalizeText(body.target);
    const result = await db.prepare(`
      INSERT INTO notification_jobs (channel, job_type, target, payload_json, status, next_attempt_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'queued', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(channel, jobType, target || null, body.payload_json ? JSON.stringify(body.payload_json) : null).run();
    await auditAdminAction(env, request, adminUser, {
      action_type: 'notification_queue',
      target_type: 'notification_job',
      target_id: Number(result?.meta?.last_row_id || 0) || null,
      details: { channel, job_type: jobType }
    });
    return json({ ok: true, message: 'Notification job queued.' }, 201);
  }

  const notificationJobId = Number(body.notification_job_id);
  if (!Number.isInteger(notificationJobId) || notificationJobId <= 0) return json({ ok: false, error: 'notification_job_id is required.' }, 400);

  if (action === 'retry') {
    await db.prepare(`
      UPDATE notification_jobs
      SET status = 'queued', next_attempt_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE notification_job_id = ?
    `).bind(notificationJobId).run();
    await auditAdminAction(env, request, adminUser, { action_type: 'notification_retry', target_type: 'notification_job', target_id: notificationJobId });
    return json({ ok: true, message: 'Notification job queued for retry.' });
  }

  if (action === 'mark_sent') {
    await db.prepare(`
      UPDATE notification_jobs
      SET status = 'sent', last_attempt_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE notification_job_id = ?
    `).bind(notificationJobId).run();
    await auditAdminAction(env, request, adminUser, { action_type: 'notification_mark_sent', target_type: 'notification_job', target_id: notificationJobId });
    return json({ ok: true, message: 'Notification job marked sent.' });
  }

  return json({ ok: false, error: 'Unsupported action.' }, 400);
}
