// File: /functions/api/admin/app-settings.js
// Brief description: Gets and updates saved app settings using the shared admin session authority.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function json(data, status = 200) { return jsonResponse(data, status); }
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(env);
  const rows = normalizeResults(await db.prepare(`
    SELECT setting_key, setting_value, is_public, updated_at
    FROM app_settings
    ORDER BY setting_key ASC
  `).all());
  return json({ ok: true, settings: rows.map((row) => ({
    setting_key: row.setting_key || '',
    setting_value: row.setting_value || '',
    is_public: Number(row.is_public || 0),
    updated_at: row.updated_at || null
  })) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(env);
  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const settingKey = normalizeText(body.setting_key);
  const settingValue = typeof body.setting_value === 'string' ? body.setting_value : JSON.stringify(body.setting_value ?? '');
  const isPublic = Number(body.is_public) === 1 ? 1 : 0;
  if (!settingKey) return json({ ok: false, error: 'setting_key is required.' }, 400);

  await db.prepare(`
    INSERT INTO app_settings (setting_key, setting_value, is_public, updated_by_user_id, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(setting_key) DO UPDATE SET
      setting_value = excluded.setting_value,
      is_public = excluded.is_public,
      updated_by_user_id = excluded.updated_by_user_id,
      updated_at = CURRENT_TIMESTAMP
  `).bind(settingKey, settingValue, isPublic, adminUser.user_id).run();

  await auditAdminAction(env, request, adminUser, {
    action_type: 'app_setting_save',
    target_type: 'app_setting',
    target_key: settingKey,
    details: { is_public: isPublic }
  });
  return json({ ok: true, message: 'Setting saved.', setting_key: settingKey });
}
