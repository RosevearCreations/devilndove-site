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

const PRODUCTS_ASSET_REVISION = '467-products-b98-readiness-triage';
const LAYOUT_ASSET_REVISION = '467-b153-layout-observer';

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
  const normalizedPath = normalizedPagePath(pathname);
  const isProductsPage = normalizedPath === '/admin/products/';
  const productRequest = publicProductRequestInfo(request, pathname);
  try {
    let rewriter = new HTMLRewriter()
      .on('head', {
        element(element) {
          element.append('<link rel="stylesheet" href="/css/current-responsive.css?v=current">', { html: true });
          element.append(`<link rel="stylesheet" href="/css/adaptive-shell.css?v=${CURRENT_RELEASE}b143">`, { html: true });
          // Products must establish its essential fallbacks before the large body of
          // admin scripts registers DOMContentLoaded work. Use a dedicated asset
          // revision so a repaired bootstrap can never be hidden behind an older
          // release-number cache entry.
          if (isProductsPage) {
            element.append(`<link rel="stylesheet" href="/css/admin-products-table-layout.css?v=${PRODUCTS_ASSET_REVISION}">`, { html: true });
            element.append(`<script data-dd-products-cold-start="1" src="/public/js/admin-products-cold-start-recovery.js?v=${PRODUCTS_ASSET_REVISION}"></script>`, { html: true });
            element.append(`<script defer src="/public/js/layout-overflow-guard.js?v=${LAYOUT_ASSET_REVISION}"></script>`, { html: true });
          } else {
            element.append('<script defer src="/public/js/layout-overflow-guard.js?v=current"></script>', { html: true });
          }
          element.append('<script defer src="/public/js/packaging-safe-area-guard.js?v=current"></script>', { html: true });
          element.append('<script defer src="/public/js/product-media-fallback.js?v=62"></script>', { html: true });
          element.append(`<script defer src="/public/js/pwa-platform.js?v=${CURRENT_RELEASE}"></script>`, { html: true });
          element.append(`<script defer src="/public/js/adaptive-shell.js?v=${CURRENT_RELEASE}b143"></script>`, { html: true });
          if (isPublicRuntimeIntelligencePath(pathname)) {
            element.append('<script defer src="/public/js/public-heading-guard.js?v=current"></script>', { html: true });
            element.append(`<script defer src="/public/js/runtime-intelligence.js?v=${CURRENT_RELEASE}"></script>`, { html: true });
          }
          if (isStorefrontDiscoveryPath(pathname)) {
            element.append(`<link rel="stylesheet" href="/css/storefront-discovery.css?v=${CURRENT_RELEASE}"><script defer src="/public/js/storefront-discovery-runtime.js?v=${CURRENT_RELEASE}"></script>`, { html: true });
          }
        },
      })
      .on('script[src]', {
        element(element) {
          if (!isProductsPage) return;
          const src = String(element.getAttribute('src') || '');
          if (!src.startsWith('/public/js/') && !src.startsWith('/js/')) return;
          const clean = src.split('?')[0];
          element.setAttribute('src', `${clean}?v=${PRODUCTS_ASSET_REVISION}`);
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
async function handleApiGuard(request, env, pathname, moduleKey, sharedContract) {
  if (!moduleKey && !sharedContract) return null;
  const userOrResponse = await resolveGuardUser(request, env, pathname);
  if (userOrResponse instanceof Response) return userOrResponse;
  if (moduleKey) {
    const access = await moduleAccessForRequest(env, moduleKey, userOrResponse);
    if (!access.available) return moduleUnavailableResponse(moduleKey, access);
    if (!isReadMethod(request.method) && access.access_level === 'read') return readOnlyDeniedResponse(access);
    return { user: userOrResponse, moduleKey, access };
  }
  const shared = await sharedServiceAccessForRequest(env, sharedContract, userOrResponse);
  if (!shared.available) return sharedServiceUnavailableResponse(sharedContract, shared);
  return { user: userOrResponse, sharedContract, shared };
}
export async function onRequest(context) {
  const { request, env, next } = context;
  const pathname = new URL(request.url).pathname;
  if (shouldBypass(pathname)) return next();
  const moduleKey = moduleKeyForPath(pathname);
  const sharedContract = sharedServiceContractForPath(pathname);
  if (isApiPath(pathname)) {
    const apiGuard = await handleApiGuard(request, env, pathname, moduleKey, sharedContract);
    if (apiGuard instanceof Response) return withGuardHeaders(apiGuard, { moduleKey: moduleKey || '', contractPath: sharedContract || '' });
    const response = await next();
    return withGuardHeaders(response, { moduleKey: moduleKey || '', contractPath: sharedContract || '' });
  }
  const response = await next();
  return finish(response, request, { moduleKey: moduleKey || '', contractPath: sharedContract || '' });
}
