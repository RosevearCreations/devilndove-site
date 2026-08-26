// Devil n Dove Build 438 application-module route guard.
// Runs only meaningful module-owned page/API requests through D1-backed availability.
// Static JS/CSS/assets and shared-core/auth/control routes pass through untouched.

import {
  BUILD,
  moduleAccessForRequest,
  moduleUnavailableResponse,
  sharedServiceAccessForRequest,
  sharedServiceUnavailableResponse,
} from './api/_lib/appModules.js';
import {
  appModuleSessionUnavailableResponse,
  isAppModuleSessionVerificationUnavailable,
  resolveAppModuleRequestUser,
} from './api/_lib/appModuleSessionGuard.js';
import {
  moduleKeyForPath,
  sharedServiceContractForPath,
} from './api/_lib/appModuleRoutes.js';

function isApiPath(pathname) {
  return String(pathname || '').startsWith('/api/');
}

function isReadMethod(method) {
  return ['GET', 'HEAD', 'OPTIONS'].includes(String(method || 'GET').toUpperCase());
}

function withGuardHeaders(response, { moduleKey = '', contractPath = '' } = {}) {
  const headers = new Headers(response.headers);
  headers.set('X-DND-Module-Guard', String(BUILD));
  if (moduleKey) headers.set('X-DND-Module-Key', moduleKey);
  if (contractPath) headers.set('X-DND-Shared-Contract', contractPath);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function readOnlyDeniedResponse(access) {
  return new Response(JSON.stringify({
    ok: false,
    error: 'This module access level is read-only.',
    code: 'module_access_level_read_only',
    module_key: access?.module?.module_key || null,
    module_name: access?.module?.display_name || null,
    access_level: access?.access_level || 'read',
    build: BUILD,
  }), {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function shouldBypass(pathname) {
  const path = String(pathname || '');
  if (!path) return true;
  if (path.startsWith('/assets/') || path.startsWith('/css/') || path.startsWith('/js/') || path.startsWith('/public/')) return true;
  if (path.startsWith('/api/auth/') || path === '/api/modules' || path.startsWith('/api/modules/')) return true;
  if (path === '/api/admin/app-modules' || path.startsWith('/api/admin/app-modules/')) return true;
  if (path === '/admin/application-modules' || path.startsWith('/admin/application-modules/')) return true;
  return false;
}

async function resolveGuardUser(request, env, pathname) {
  try {
    return await resolveAppModuleRequestUser(request, env);
  } catch (error) {
    if (!isAppModuleSessionVerificationUnavailable(error)) throw error;
    return appModuleSessionUnavailableResponse({ api: isApiPath(pathname) });
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const pathname = new URL(request.url).pathname;
  if (shouldBypass(pathname)) return await context.next();

  // Explicit cross-module service contracts are Application Core boundaries. They
  // remain callable only when at least one reviewed consumer module is enabled for
  // the current user. Mutation contracts additionally require a manage-level consumer.
  const sharedContract = sharedServiceContractForPath(pathname);
  if (sharedContract) {
    const resolvedUser = await resolveGuardUser(request, env, pathname);
    if (resolvedUser instanceof Response) {
      return withGuardHeaders(resolvedUser, { contractPath: sharedContract.path });
    }

    const sharedAccess = await sharedServiceAccessForRequest(request, env, sharedContract, { user: resolvedUser });
    context.data.ddSharedServiceAccess = sharedAccess;
    context.data.ddModuleBuild = BUILD;
    if (!sharedAccess.allowed) {
      return withGuardHeaders(sharedServiceUnavailableResponse(sharedAccess), { contractPath: sharedContract.path });
    }
    return withGuardHeaders(await context.next(), { contractPath: sharedContract.path });
  }

  const moduleKey = moduleKeyForPath(pathname);
  if (!moduleKey) return await context.next();

  const resolvedUser = await resolveGuardUser(request, env, pathname);
  if (resolvedUser instanceof Response) {
    return withGuardHeaders(resolvedUser, { moduleKey });
  }

  const access = await moduleAccessForRequest(request, env, moduleKey, { user: resolvedUser });
  context.data.ddModuleAccess = access;
  context.data.ddModuleBuild = BUILD;

  if (!access.allowed) {
    return withGuardHeaders(moduleUnavailableResponse(access, { api: isApiPath(pathname) }), { moduleKey });
  }

  if (isApiPath(pathname) && access.access_level === 'read' && !isReadMethod(request.method)) {
    return withGuardHeaders(readOnlyDeniedResponse(access), { moduleKey });
  }

  return withGuardHeaders(await context.next(), { moduleKey });
}
