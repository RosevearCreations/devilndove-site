// Devil n Dove Build 438 current-user module bootstrap.
// Read-only and bounded. This endpoint never creates or repairs schema.

import { BUILD, availableModulesForRequest } from './_lib/appModules.js';
import { jsonResponse } from './_lib/adminAudit.js';

export async function onRequestGet({ request, env }) {
  const result = await availableModulesForRequest(request, env);
  return jsonResponse({
    ok: true,
    build: BUILD,
    schema_ready: Boolean(result.config?.schema_ready),
    source: result.config?.source || 'unknown',
    user: result.user ? {
      user_id: Number(result.user.user_id || 0),
      display_name: result.user.display_name || '',
      email: result.user.email || '',
      role: result.user.role || 'member',
    } : null,
    modules: result.modules.map((module) => ({
      module_key: module.module_key,
      display_name: module.display_name,
      description: module.description,
      is_enabled: module.is_enabled,
      requires_login: module.requires_login,
      default_route: module.default_route,
      load_priority: module.load_priority,
      background_activity_enabled: module.background_activity_enabled,
      available: module.available,
      availability_reason: module.availability_reason,
      access_level: module.access_level,
      background_allowed: module.background_allowed,
    })),
  }, 200, { 'Cache-Control': 'no-store' });
}
