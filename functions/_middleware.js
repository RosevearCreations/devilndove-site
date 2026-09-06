// Devil n Dove current-release application-module route guard and shared platform client bootstrap.
import {
  moduleAccessForRequest,
  moduleUnavailableResponse,
  sharedServiceAccessForRequest,
  sharedServiceUnavailableResponse,
} from './api/_lib/appModules.js';
import { CURRENT_RELEASE, RELEASE_HEADER } from './api/_lib/releaseAuthority.js';
import {
  appModuleSessionUnavailableResponse,
  isAppModuleSessionVerificationUnavailable,
  resolveAppModuleRequestUser,
} from './api/_lib/appModuleSessionGuard.js';
import { moduleKeyForPath, sharedServiceContractForPath } from './api/_lib/appModuleRoutes.js';

function isApiPath(pathname) { return String(pathname || '').startsWith('/api/'); }
function isReadMethod(method) { return ['GET', 'HEAD', 'OPTIONS'].includes(String(method || 'GET').toUpperCase()); }
function normalizedPagePath(pathname) {
  let path = String(pathname || '/');
  if (!path.endsWith('/')) path += '/';
  return path;
}
function isStorefrontDiscoveryPath(pathname) {
  return ['/shop/', '/shop/product/', '/collections/', '/collages/'].includes(normalizedPagePath(pathname));
}
function isPublicRuntimeIntelligencePath(pathname) {
  const path = normalizedPagePath(pathname);
  return path !== '/admin/' && !path.startsWith('/admin/');
}
function publicProductRequestInfo(request, pathname) {
  if (normalizedPagePath(pathname) !== '/shop/product/') return null;
  const url = new URL(request.url);
  const slug = String(url.searchParams.get('slug') || '').trim();
  if (!slug) return { slug: '', canonical: 'https://devilndove.com/shop/product/' };
  const canonical = `https://devilndove.com/shop/product/?slug=${encodeURIComponent(slug)}`;
  return { slug, canonical };
}
function withGuardHeaders(response, { moduleKey = '', contractPath = '' } = {}) {
  const headers = new Headers(response.headers);
  headers.set(RELEASE_HEADER, String(CURRENT_RELEASE));
  headers.set('X-DND-Module-Guard', String(CURRENT_RELEASE));
  if (moduleKey) headers.set('X-DND-Module-Key', moduleKey);
  if (contractPath) headers.set('X-DND-Shared-Contract', contractPath);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
function withPlatformClient(response, request) {
  if (String(request?.method || 'GET').toUpperCase() !== 'GET') return response;
  const contentType = String(response?.headers?.get('Content-Type') || '').toLowerCase();
  if (!contentType.includes('text/html')) return response;
  const pathname = new URL(request.url).pathname;
  const productRequest = publicProductRequestInfo(request, pathname);
  try {
    let rewriter = new HTMLRewriter()
      .on('head', {
        element(element) {
          element.append('<link rel="stylesheet" href="/css/current-responsive.css?v=current">', { html: true });
          element.append('<script defer src="/public/js/layout-overflow-guard.js?v=current"></script>', { html: true });
          element.append('<script defer src="/public/js/packaging-safe-area-guard.js?v=current"></script>', { html: true });
          element.append('<script defer src="/public/js/product-media-fallback.js?v=62"></script>', { html: true });
          element.append(`<script defer src="/public/js/pwa-platform.js?v=${CURRENT_RELEASE}"></script>`, { html: true });
          if (isPublicRuntimeIntelligencePath(pathname)) {
            element.append('<script defer src="/public/js/public-heading-guard.js?v=current"></script>', { html: true });
            element.append(`<script defer src="/public/js/runtime-intelligence.js?v=${CURRENT_RELEASE}"></script>`, { html: true });
          }
          if (isStorefrontDiscoveryPath(pathname)) {
            element.append(`<link rel="stylesheet" href="/css/storefront-discovery.css?v=${CURRENT_RELEASE}"><script defer src="/public/js/storefront-discovery-runtime.js?v=${CURRENT_RELEASE}"></script>`, { html: true });
          }
        },
      });
    if (productRequest) {
      rewriter = rewriter
        .on('meta[name="robots"]', { element(element) { element.setAttribute('content', productRequest.slug ? 'index,follow' : 'noindex,follow'); } })
        .on('link[rel="canonical"]', { element(element) { element.setAttribute('href', productRequest.canonical); } })
        .on('meta[property="og:url"]', { element(element) { element.setAttribute('content', productRequest.canonical); } });
    }
    return rewriter.transform(response);
  } catch {
    return response;
  }
}
function finish(response, request, guard = null) {
  const guarded = guard ? withGuardHeaders(response, guard) : response;
  return withPlatformClient(guarded, request);
}
function readOnlyDeniedResponse(access) {
  return new Response(JSON.stringify({
    ok: false,
    error: 'This module access level is read-only.',
    code: 'module_access_level_read_only',
    module_key: access?.module?.module_key || null,
    module_name: access?.module?.display_name || null,
    access_level: access?.access_level || 'read',
    release: CURRENT_RELEASE,
  }), {
    status: 403,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
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
  if (shouldBypass(pathname)) return finish(await context.next(), request);
  const sharedContract = sharedServiceContractForPath(pathname);
  if (sharedContract) {
    const resolvedUser = await resolveGuardUser(request, env, pathname);
    if (resolvedUser instanceof Response) return finish(resolvedUser, request, { contractPath: sharedContract.path });
    const sharedAccess = await sharedServiceAccessForRequest(request, env, sharedContract, { user: resolvedUser });
    context.data.ddSharedServiceAccess = sharedAccess;
    context.data.ddModuleRelease = CURRENT_RELEASE;
    if (!sharedAccess.allowed) return finish(sharedServiceUnavailableResponse(sharedAccess), request, { contractPath: sharedContract.path });
    return finish(await context.next(), request, { contractPath: sharedContract.path });
  }
  const moduleKey = moduleKeyForPath(pathname);
  if (!moduleKey) return finish(await context.next(), request);
  const resolvedUser = await resolveGuardUser(request, env, pathname);
  if (resolvedUser instanceof Response) return finish(resolvedUser, request, { moduleKey });
  const access = await moduleAccessForRequest(request, env, moduleKey, { user: resolvedUser });
  context.data.ddModuleAccess = access;
  context.data.ddModuleRelease = CURRENT_RELEASE;
  if (!access.allowed) return finish(moduleUnavailableResponse(access, { api: isApiPath(pathname) }), request, { moduleKey });
  if (isApiPath(pathname) && access.access_level === 'read' && !isReadMethod(request.method)) {
    return finish(readOnlyDeniedResponse(access), request, { moduleKey });
  }
  return finish(await context.next(), request, { moduleKey });
}