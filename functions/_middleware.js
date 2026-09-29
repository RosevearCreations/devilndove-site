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
import { protectMutationOrigin } from './api/_lib/csrfOriginProtection.js';
import { loadPublishedProductSeo, loadPublishedStorySeo, loadDynamicSitemapEntries } from './api/_lib/publicSearchSeo.js';

// Build 159: Product Admin returning-browser cache coherence.
// Build 160 layers a read-only Product Production browser recovery client on top of the
// proven Build 159 cache generation without changing the retained Build 159 identities.
// Build 161 adds a shared Admin-only navigation/search QoL layer. It is browser-local for
// recents/favourites and read-only for live universal record search.
const PRODUCTS_ASSET_REVISION = '467-b159-products-returning-browser-cache-v1';
const DESIGN_SYSTEM_REVISION = '467b293-design-system-v1';
const LAYOUT_ASSET_REVISION = '467b292-observer-budget-v1';
const PRODUCTS_MEDIA_FALLBACK_REVISION = '467-b159-products-media-admin-cache-v1';
const PRODUCTS_REQUEST_BUDGET_REVISION = '467b159-request-budget-loader-v1';
const PRODUCTS_AUTH_READY_REVISION = '467b156-auth-ready-v3';
const PRODUCTS_COLD_START_REVISION = '467b156-core-product-recovery-v1';
const PRODUCTS_QUALITY_FALLBACK_REVISION = '467b156-quality-fallback-v1';
const ADMIN_QOL_REVISION = '467b161-universal-search-v1';
const ADMIN_RESUME_WORK_REVISION = '467b235-resume-work-v1';
const ADMIN_SAVE_CONFIDENCE_REVISION = '467b236-save-confidence-v1';
const ADMIN_ERGONOMICS_REVISION = '467b292-observer-budget-v1';
const ADMIN_ATTENTION_SIGNALS_REVISION = '467b238-attention-signals-v1';
const ADMIN_SURFACE_CONSOLIDATION_REVISION = '467b239-admin-surface-consolidation-v1';
const ADMIN_HANDOFF_REVISION = '467b241-cross-authority-handoff-v1';
const ADMIN_RELEASE_EVIDENCE_REVISION = '467b247-release-evidence-baseline-v6';
const STOREFRONT_DISCOVERY_REVISION = '467b292-observer-budget-v1';

function isApiPath(pathname) { return String(pathname || '').startsWith('/api/'); }
function isReadMethod(method) { return ['GET', 'HEAD', 'OPTIONS'].includes(String(method || 'GET').toUpperCase()); }
function normalizedPagePath(pathname) {
  let path = String(pathname || '/');
  if (!path.endsWith('/')) path += '/';
  return path;
}
function isAdminRuntimePath(pathname) {
  const path = normalizedPagePath(pathname);
  return path === '/admin/' || path.startsWith('/admin/');
}
function isStorefrontDiscoveryPath(pathname) {
  return ['/shop/', '/shop/product/', '/collections/', '/collages/'].includes(normalizedPagePath(pathname));
}
function isPublicRuntimeIntelligencePath(pathname) {
  const path = normalizedPagePath(pathname);
  return path !== '/admin/' && !path.startsWith('/admin/');
}
function isAdminClientAssetPath(pathname) {
  return /^\/public\/js\/admin-[^/]+\.js$/i.test(String(pathname || ''));
}
function withAdminClientNoStore(response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store, max-age=0');
  headers.set('Pragma', 'no-cache');
  headers.set('X-DND-Admin-Client-Cache', 'no-store-b159');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
function publicProductRequestInfo(request, pathname) {
  if (normalizedPagePath(pathname) !== '/shop/product/') return null;
  const url=new URL(request.url);
  const slug=String(url.searchParams.get('slug')||'').trim();
  if(!slug)return { slug:'', canonical:'https://devilndove.com/shop/product/' };
  const canonical=`https://devilndove.com/shop/product/?slug=${encodeURIComponent(slug)}`;
  return { slug, canonical };
}
function publicStoryRequestInfo(request, pathname) {
  if (normalizedPagePath(pathname) !== '/workshop-journal/story/') return null;
  const url=new URL(request.url);
  const slug=String(url.searchParams.get('story')||'').trim();
  if(!slug)return { slug:'', canonical:'https://devilndove.com/workshop-journal/story/' };
  const canonical=`https://devilndove.com/workshop-journal/story/?story=${encodeURIComponent(slug)}`;
  return { slug, canonical };
}
function publicShopRequestInfo(request, pathname) {
  if (normalizedPagePath(pathname) !== '/shop/') return null;
  const url=new URL(request.url);
  return { filtered:[...url.searchParams.keys()].length>0, canonical:'https://devilndove.com/shop/' };
}
function safeJsonForHtml(value){return JSON.stringify(value).replace(/</g,'\\u003c');}
function htmlEscape(value){return String(value??'').replace(/[&<>"']/g,(ch)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function discoveryLinksMarkup(links=[]){
  const safe=(Array.isArray(links)?links:[]).filter((x)=>x?.href&&x?.label).slice(0,6);
  if(!safe.length)return '';
  return `<nav class="card build298-related-discovery" data-build298-related-discovery aria-label="Related Devil n Dove content" style="margin-top:18px"><h2 style="margin-top:0">Related from the workshop</h2><p class="small">These links appear only when the published Product/story records have a factual relationship.</p><div class="dd-admin-responsive-actions">${safe.map((x)=>`<a class="btn secondary" href="${htmlEscape(x.href)}">${htmlEscape(x.label)}</a>`).join('')}</div></nav>`;
}
function xmlEscape(value){return String(value||'').replace(/[&<>"']/g,(ch)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));}
async function dynamicSitemapResponse(response, env) {
  const type=String(response?.headers?.get('Content-Type')||'').toLowerCase();
  if(!type.includes('xml')&&!type.includes('text'))return response;
  const fallback=response.clone();
  try{
    let xml=await response.text();
    const db=env?.DB||env?.DD_DB;
    const entries=await loadDynamicSitemapEntries(db);
    const seen=new Set(Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g),m=>m[1].replace(/&amp;/g,'&')));
    const dynamic=entries.filter((row)=>row?.loc&&!seen.has(row.loc));
    if(dynamic.length){
      const block=dynamic.map((row)=>`  <url><loc>${xmlEscape(row.loc)}</loc>${row.lastmod?`<lastmod>${xmlEscape(row.lastmod)}</lastmod>`:''}<changefreq>weekly</changefreq><priority>${row.kind==='product'?'0.8':'0.7'}</priority></url>`).join('\n')+'\n';
      xml=xml.replace('</urlset>',block+'</urlset>');
    }
    const headers=new Headers(response.headers);
    headers.set('Content-Type','application/xml; charset=utf-8');
    headers.set('Cache-Control','public, max-age=3600, stale-while-revalidate=86400');
    headers.set('X-DND-Sitemap','dynamic-published-v297');
    headers.set('X-DND-Sitemap-Dynamic-Count',String(dynamic.length));
    return new Response(xml,{status:response.status,statusText:response.statusText,headers});
  }catch{
    const headers=new Headers(fallback.headers);headers.set('X-DND-Sitemap','static-fallback-v297');
    return new Response(fallback.body,{status:fallback.status,statusText:fallback.statusText,headers});
  }
}
function withGuardHeaders(response, { moduleKey = '', contractPath = '' } = {}) {
  const headers = new Headers(response.headers);
  headers.set(RELEASE_HEADER, String(CURRENT_RELEASE));
  headers.set('X-DND-Module-Guard', String(CURRENT_RELEASE));
  if (moduleKey) headers.set('X-DND-Module-Key', moduleKey);
  if (contractPath) headers.set('X-DND-Shared-Contract', contractPath);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
function adminQolMarkup() {
  return [
    `<link data-dd-admin-qol-v161="1" rel="stylesheet" href="/css/admin-universal-search-v161.css?v=${ADMIN_QOL_REVISION}">`,
    `<script data-dd-admin-qol-v161="1" defer src="/public/js/admin-universal-search-v161.js?v=${ADMIN_QOL_REVISION}"></script>`,
    `<script data-dd-admin-resume-work-v235="1" defer src="/public/js/admin-resume-work-v235.js?v=${ADMIN_RESUME_WORK_REVISION}"></script>`,
    `<script data-dd-admin-save-confidence-v236="1" defer src="/public/js/admin-save-confidence-v236.js?v=${ADMIN_SAVE_CONFIDENCE_REVISION}"></script>`,
    `<link data-dd-admin-design-system-v293="1" rel="stylesheet" href="/css/admin-design-system-v293.css?v=${DESIGN_SYSTEM_REVISION}">`,
    `<link data-dd-admin-ergonomics-v237="1" rel="stylesheet" href="/css/admin-ergonomics-v237.css?v=${ADMIN_ERGONOMICS_REVISION}">`,
    `<script data-dd-admin-ergonomics-v237="1" defer src="/public/js/admin-ergonomics-v237.js?v=${ADMIN_ERGONOMICS_REVISION}"></script>`,
    `<link data-dd-admin-attention-signals-v238="1" rel="stylesheet" href="/css/admin-attention-signals-v238.css?v=${ADMIN_ATTENTION_SIGNALS_REVISION}">`,
    `<script data-dd-admin-attention-signals-v238="1" defer src="/public/js/admin-attention-signals-v238.js?v=${ADMIN_ATTENTION_SIGNALS_REVISION}"></script>`,
    `<script data-dd-admin-surface-consolidation-v239="1" defer src="/public/js/admin-surface-consolidation-v239.js?v=${ADMIN_SURFACE_CONSOLIDATION_REVISION}"></script>`,
    `<script data-dd-admin-handoff-v241="1" defer src="/public/js/admin-handoff-v241.js?v=${ADMIN_HANDOFF_REVISION}"></script>`,
    `<script data-dd-admin-release-evidence-v242="1" defer src="/public/js/admin-release-evidence-v242.js?v=${ADMIN_RELEASE_EVIDENCE_REVISION}"></script>`,
  ].join('');
}
function productsPlatformMarkup() {
  return [
    `<link data-dd-design-system-v293="1" rel="stylesheet" href="/css/design-system-v293.css?v=${DESIGN_SYSTEM_REVISION}">`,
    '<link data-dd-products-static-platform="1" rel="stylesheet" href="/css/current-responsive.css?v=current">',
    `<link rel="stylesheet" href="/css/adaptive-shell.css?v=${CURRENT_RELEASE}b143">`,
    `<link rel="stylesheet" href="/css/admin-products-table-layout.css?v=${PRODUCTS_ASSET_REVISION}">`,
    adminQolMarkup(),
    '<script data-dd-products-runtime-v160="1" src="/public/js/admin-products-runtime-v160.js?v=467b160-production-browser-recovery-v1"></script>',
    `<script data-dd-products-request-budget="1" src="/public/js/admin-products-request-budget-v156.js?v=${PRODUCTS_REQUEST_BUDGET_REVISION}"></script>`,
    `<script data-dd-products-auth-ready-recovery="1" src="/public/js/admin-products-auth-ready-recovery-v156.js?v=${PRODUCTS_AUTH_READY_REVISION}"></script>`,
    `<script data-dd-products-cold-start="1" src="/public/js/admin-products-cold-start-recovery.js?v=${PRODUCTS_COLD_START_REVISION}"></script>`,
    `<script data-dd-products-quality-fallback="1" src="/public/js/admin-product-quality-fallback-v156.js?v=${PRODUCTS_QUALITY_FALLBACK_REVISION}"></script>`,
    `<script defer src="/public/js/layout-overflow-guard.js?v=${LAYOUT_ASSET_REVISION}"></script>`,
    '<script defer src="/public/js/packaging-safe-area-guard.js?v=current"></script>',
    `<script defer src="/public/js/product-media-fallback.js?v=${PRODUCTS_MEDIA_FALLBACK_REVISION}"></script>`,
    `<script defer src="/public/js/pwa-platform.js?v=${CURRENT_RELEASE}"></script>`,
    `<script defer src="/public/js/adaptive-shell.js?v=${CURRENT_RELEASE}b143"></script>`,
  ].join('');
}
async function withProductsFastPlatformClient(response) {
  const fallback = response.clone();
  try {
    let html = await response.text();
    html = html.replace(
      /\bsrc="(\/(?:public\/js|js)\/[^"?]+)(?:\?[^\"]*)?"/g,
      (_match, clean) => `src="${clean}?v=${PRODUCTS_ASSET_REVISION}"`,
    );
    if (!html.includes('data-dd-products-static-platform="1"') && html.includes('</head>')) {
      html = html.replace('</head>', `${productsPlatformMarkup()}</head>`);
    }
    const headers = new Headers(response.headers);
    headers.set('X-DND-Products-Render-Path', 'static-fast-path');
    headers.set('X-DND-Products-Asset-Revision', PRODUCTS_ASSET_REVISION);
    headers.set('Cache-Control', 'no-store');
    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  } catch {
    const headers = new Headers(fallback.headers);
    headers.set('X-DND-Products-Render-Path', 'static-fast-path-fallback');
    return new Response(fallback.body, { status: fallback.status, statusText: fallback.statusText, headers });
  }
}
async function withPlatformClient(response, request, env = {}) {
  if (String(request?.method || 'GET').toUpperCase() !== 'GET') return response;
  const contentType = String(response?.headers?.get('Content-Type') || '').toLowerCase();
  if (!contentType.includes('text/html')) return response;
  const pathname = new URL(request.url).pathname;
  const normalizedPath = normalizedPagePath(pathname);
  const isProductsPage = normalizedPath === '/admin/products/';
  if (isProductsPage) {
    if (response.status >= 200 && response.status < 400) return withProductsFastPlatformClient(response);
    return response;
  }
  const productRequest = publicProductRequestInfo(request, pathname);
  const storyRequest = publicStoryRequestInfo(request, pathname);
  const shopRequest = publicShopRequestInfo(request, pathname);
  let searchSeo=null;
  if(productRequest?.slug){
    searchSeo=await loadPublishedProductSeo(env?.DB||env?.DD_DB,productRequest.slug).catch(()=>null);
  }else if(storyRequest?.slug){
    searchSeo=await loadPublishedStorySeo(env?.DB||env?.DD_DB,storyRequest.slug).catch(()=>null);
  }
  try {
    let rewriter = new HTMLRewriter()
      .on('head', {
        element(element) {
          element.prepend(styleNonceBootstrapMarkup(), { html: true });
          element.append(`<link data-dd-design-system-v293="1" rel="stylesheet" href="/css/design-system-v293.css?v=${DESIGN_SYSTEM_REVISION}">`, { html: true });
          element.append('<link rel="stylesheet" href="/css/current-responsive.css?v=current">', { html: true });
          element.append(`<link rel="stylesheet" href="/css/adaptive-shell.css?v=${CURRENT_RELEASE}b143">`, { html: true });
          element.append('<script defer src="/public/js/layout-overflow-guard.js?v=current"></script>', { html: true });
          element.append('<script defer src="/public/js/packaging-safe-area-guard.js?v=current"></script>', { html: true });
          element.append('<script defer src="/public/js/product-media-fallback.js?v=62"></script>', { html: true });
          element.append(`<script defer src="/public/js/pwa-platform.js?v=${CURRENT_RELEASE}"></script>`, { html: true });
          element.append(`<script defer src="/public/js/adaptive-shell.js?v=${CURRENT_RELEASE}b143"></script>`, { html: true });
          if (isAdminRuntimePath(pathname)) {
            element.append(adminQolMarkup(), { html: true });
          }
          if (isPublicRuntimeIntelligencePath(pathname)) {
            element.append('<link data-dd-context-help-style="true" rel="stylesheet" href="/css/admin-context-help.css?v=467b234-workflow-help"><script defer src="/public/js/admin-context-help.js?v=467b234-workflow-help"></script>', { html: true });
            element.append('<script defer src="/public/js/public-heading-guard.js?v=467b292-observer-budget-v1"></script>', { html: true });
            element.append(`<script defer src="/public/js/runtime-intelligence.js?v=${CURRENT_RELEASE}"></script>`, { html: true });
          }
          if (isStorefrontDiscoveryPath(pathname)) {
            element.append(`<link rel="stylesheet" href="/css/storefront-discovery.css?v=${STOREFRONT_DISCOVERY_REVISION}"><script defer src="/public/js/storefront-discovery-runtime.js?v=${STOREFRONT_DISCOVERY_REVISION}"></script>`, { html: true });
          }
          if(searchSeo?.kind==='product'){
            element.append(`<script id="build297InitialProductSnapshot" type="application/json">${safeJsonForHtml({product:searchSeo.product,images:searchSeo.images,storefront_images:searchSeo.images})}</script><script id="build297InitialProductJsonLd" type="application/ld+json">${safeJsonForHtml(searchSeo.structured_data)}</script>`,{html:true});
          }
          if(searchSeo?.kind==='story'){
            element.append(`<script id="build297InitialStorySnapshot" type="application/json">${safeJsonForHtml({item:searchSeo.item})}</script>`,{html:true});
          }
        },
      });
    if (productRequest) {
      rewriter = rewriter
        .on('meta[name="robots"]', { element(element) { element.setAttribute('content', productRequest.slug ? 'index,follow' : 'noindex,follow'); } })
        .on('link[rel="canonical"]', { element(element) { element.setAttribute('href', productRequest.canonical); } })
        .on('meta[property="og:url"]', { element(element) { element.setAttribute('content', productRequest.canonical); } });
    }
    if (productRequest?.slug) {
      const published=searchSeo?.kind==='product';
      const canonical=published?searchSeo.canonical:'https://devilndove.com/shop/product/';
      rewriter=rewriter
        .on('meta[name="robots"]',{element(element){element.setAttribute('content',published?'index,follow':'noindex,follow');}})
        .on('link[rel="canonical"]',{element(element){element.setAttribute('href',canonical);}})
        .on('meta[property="og:url"]',{element(element){element.setAttribute('content',canonical);}});
      if(published){
        rewriter=rewriter
          .on('title',{element(element){element.setInnerContent(searchSeo.title);}})
          .on('meta[name="description"]',{element(element){element.setAttribute('content',searchSeo.description);}})
          .on('meta[property="og:title"]',{element(element){element.setAttribute('content',searchSeo.title);}})
          .on('meta[property="og:description"]',{element(element){element.setAttribute('content',searchSeo.description);}})
          .on('meta[property="og:image"]',{element(element){if(searchSeo.image)element.setAttribute('content',searchSeo.image);}})
          .on('meta[name="twitter:title"]',{element(element){element.setAttribute('content',searchSeo.title);}})
          .on('meta[name="twitter:description"]',{element(element){element.setAttribute('content',searchSeo.description);}})
          .on('meta[name="twitter:image"]',{element(element){if(searchSeo.image)element.setAttribute('content',searchSeo.image);}})
          .on('#pageH1',{element(element){element.setInnerContent(searchSeo.h1);}})
          .on('#pageIntro',{element(element){element.setInnerContent(searchSeo.description);}})
          .on('#productBreadcrumbLabel',{element(element){element.setInnerContent(String(searchSeo.product?.name||searchSeo.h1));}});
        const productDiscoveryMarkup=discoveryLinksMarkup(searchSeo.discovery_links);
        if(productDiscoveryMarkup)rewriter=rewriter.on('#productDetail',{element(element){element.after(productDiscoveryMarkup,{html:true});}});
      }
    }
    if (storyRequest) {
      const published=Boolean(storyRequest.slug&&searchSeo?.kind==='story');
      const canonical=published?searchSeo.canonical:'https://devilndove.com/workshop-journal/story/';
      rewriter=rewriter
        .on('meta[name="robots"]',{element(element){element.setAttribute('content',published?'index,follow':'noindex,follow');}})
        .on('link[rel="canonical"]',{element(element){element.setAttribute('href',canonical);}})
        .on('meta[property="og:url"]',{element(element){element.setAttribute('content',canonical);}});
      if(published){
        rewriter=rewriter
          .on('title',{element(element){element.setInnerContent(searchSeo.title);}})
          .on('meta[name="description"]',{element(element){element.setAttribute('content',searchSeo.description);}})
          .on('meta[property="og:title"]',{element(element){element.setAttribute('content',searchSeo.title);}})
          .on('meta[property="og:description"]',{element(element){element.setAttribute('content',searchSeo.description);}})
          .on('meta[property="og:image"]',{element(element){if(searchSeo.image)element.setAttribute('content',searchSeo.image);}})
          .on('meta[name="twitter:title"]',{element(element){element.setAttribute('content',searchSeo.title);}})
          .on('meta[name="twitter:description"]',{element(element){element.setAttribute('content',searchSeo.description);}})
          .on('meta[name="twitter:image"]',{element(element){if(searchSeo.image)element.setAttribute('content',searchSeo.image);}})
          .on('#journalStoryStructuredData',{element(element){element.setAttribute('data-search-first-seo','build297');element.setInnerContent(safeJsonForHtml(searchSeo.structured_data),{html:true});}})
          .on('[data-workshop-journal-story] h1',{element(element){element.setInnerContent(searchSeo.h1);}})
          .on('[data-workshop-journal-story] .hero p',{element(element){element.setInnerContent(searchSeo.description);}});
        const storyDiscoveryMarkup=discoveryLinksMarkup(searchSeo.discovery_links);
        if(storyDiscoveryMarkup)rewriter=rewriter.on('[data-workshop-journal-story]',{element(element){element.after(storyDiscoveryMarkup,{html:true});}});
      }
    }
    if (shopRequest?.filtered) {
      rewriter=rewriter
        .on('meta[name="robots"]',{element(element){element.setAttribute('content','noindex,follow');}})
        .on('link[rel="canonical"]',{element(element){element.setAttribute('href',shopRequest.canonical);}})
        .on('meta[property="og:url"]',{element(element){element.setAttribute('content',shopRequest.canonical);}});
    }
    return rewriter.transform(response);
  } catch {
    return response;
  }
}
function randomCspNonce() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function cspForNonce(nonce) {
  return [
    "default-src 'self'",
    "img-src 'self' " + 'data' + ": blob: https:",
    // Legacy fallback remains for older engines. Modern engines use the narrower
    // style-src-elem/style-src-attr directives below.
    "style-src 'self' 'unsafe-inline'",
    "style-src-elem 'self' 'nonce-" + nonce + "'",
    "style-src-attr 'unsafe-inline'",
    "script-src 'self' 'nonce-" + nonce + "' https://static.cloudflareinsights.com",
    "script-src-attr 'unsafe-inline'",
    "connect-src 'self' https:",
    "font-src 'self' " + 'data' + ":",
    "media-src 'self' https: blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');
}
function cspReportOnlyForNonce(nonce) {
  return [
    "default-src 'self'",
    "img-src 'self' " + 'data' + ": blob: https:",
    "style-src 'self'",
    "style-src-elem 'self' 'nonce-" + nonce + "'",
    "style-src-attr 'unsafe-inline'",
    "script-src 'self' 'nonce-" + nonce + "' https://static.cloudflareinsights.com",
    "script-src-attr 'unsafe-inline'",
    "connect-src 'self' https:",
    "font-src 'self' " + 'data' + ":",
    "media-src 'self' https: blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');
}
function styleNonceBootstrapMarkup() {
  return '<script data-dd-style-nonce-bootstrap-v251="1">(function(){var s=document.currentScript,n=s&&s.nonce;if(!n||window.DDCspStyleNonceV251)return;var original=Document.prototype.createElement;Document.prototype.createElement=function(name,options){var el=original.call(this,name,options);if(String(name||"").toLowerCase()==="style")el.setAttribute("nonce",n);return el;};window.DDCspStyleNonceV251=Object.freeze({build:251,style_element_nonce:true,style_attribute_compatibility:true});})();<\/script>';
}
function withScriptNonceCsp(response, request) {
  if (String(request?.method || 'GET').toUpperCase() !== 'GET') return response;
  const contentType = String(response?.headers?.get('Content-Type') || '').toLowerCase();
  if (!contentType.includes('text/html')) return response;
  const nonce = randomCspNonce();
  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', cspForNonce(nonce));
  headers.set('Content-Security-Policy-Report-Only', cspReportOnlyForNonce(nonce));
  headers.set('X-DND-CSP-Revision', '467b251-style-nonce-v1');
  const secured = new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  try {
    return new HTMLRewriter()
      .on('script', { element(element) { element.setAttribute('nonce', nonce); } })
      .on('style', { element(element) { element.setAttribute('nonce', nonce); } })
      .transform(secured);
  } catch {
    return secured;
  }
}
async function finish(response, request, guard = null, env = {}) {
  const guarded = guard ? withGuardHeaders(response, guard) : response;
  const platform = await withPlatformClient(guarded, request, env);
  return withScriptNonceCsp(platform, request);
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
  const mutationOriginDenied = protectMutationOrigin(request);
  if (mutationOriginDenied) return mutationOriginDenied;
  if (pathname === '/sitemap.xml' && String(request.method || 'GET').toUpperCase() === 'GET') {
    return dynamicSitemapResponse(await context.next(), env);
  }
  if (shouldBypass(pathname)) {
    const response = await context.next();
    return finish(isAdminClientAssetPath(pathname) ? withAdminClientNoStore(response) : response, request, null, env);
  }
  const sharedContract = sharedServiceContractForPath(pathname);
  if (sharedContract) {
    const resolvedUser = await resolveGuardUser(request, env, pathname);
    if (resolvedUser instanceof Response) return finish(resolvedUser, request, { contractPath: sharedContract.path }, env);
    const sharedAccess = await sharedServiceAccessForRequest(request, env, sharedContract, { user: resolvedUser });
    context.data.ddSharedServiceAccess = sharedAccess;
    context.data.ddModuleRelease = CURRENT_RELEASE;
    if (!sharedAccess.allowed) return finish(sharedServiceUnavailableResponse(sharedAccess), request, { contractPath: sharedContract.path }, env);
    return finish(await context.next(), request, { contractPath: sharedContract.path }, env);
  }
  const moduleKey = moduleKeyForPath(pathname);
  if (!moduleKey) return finish(await context.next(), request, null, env);
  const resolvedUser = await resolveGuardUser(request, env, pathname);
  if (resolvedUser instanceof Response) return finish(resolvedUser, request, { moduleKey }, env);
  const access = await moduleAccessForRequest(request, env, moduleKey, { user: resolvedUser });
  context.data.ddModuleAccess = access;
  context.data.ddModuleRelease = CURRENT_RELEASE;
  if (!access.allowed) return finish(moduleUnavailableResponse(access, { api: isApiPath(pathname) }), request, { moduleKey }, env);
  if (isApiPath(pathname) && access.access_level === 'read' && !isReadMethod(request.method)) {
    return finish(readOnlyDeniedResponse(access), request, { moduleKey }, env);
  }
  return finish(await context.next(), request, { moduleKey }, env);
}
