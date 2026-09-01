import { captureRuntimeIncident, jsonResponse, normalizeText } from './_lib/adminAudit.js';

const MAX_BODY_BYTES = 24576;
const MAX_MESSAGE = 700;
const MAX_STACK = 1800;
const ALLOWED_KINDS = new Set(['error', 'unhandled_rejection', 'resource_error', 'web_vitals']);

function clampText(value, maxLength) {
  const clean = normalizeText(value);
  return clean.length > maxLength ? clean.slice(0, maxLength) : clean;
}

function safePath(value) {
  const raw = normalizeText(value);
  if (!raw || !raw.startsWith('/')) return '/';
  const path = raw.split('?')[0].split('#')[0];
  return path.slice(0, 500) || '/';
}

function safeNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(min, Math.min(max, number));
}

function sameOriginRequest(request) {
  const target = new URL(request.url);
  const origin = normalizeText(request.headers.get('Origin'));
  if (origin) {
    try {
      if (new URL(origin).origin !== target.origin) return false;
    } catch {
      return false;
    }
  }
  const fetchSite = normalizeText(request.headers.get('Sec-Fetch-Site')).toLowerCase();
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) return false;
  return true;
}

function runtimePayload(body) {
  const kind = normalizeText(body?.kind).toLowerCase();
  if (!ALLOWED_KINDS.has(kind)) return null;
  const pagePath = safePath(body?.page_path);
  const release = Math.max(0, Math.round(Number(body?.release || 0)));
  const common = {
    page_path: pagePath,
    release,
    viewport_width: safeNumber(body?.viewport_width, 0, 10000),
    viewport_height: safeNumber(body?.viewport_height, 0, 10000),
    connection_type: clampText(body?.connection_type, 32),
  };

  if (kind === 'web_vitals') {
    const metrics = body?.metrics && typeof body.metrics === 'object' ? body.metrics : {};
    const cleanMetrics = {
      LCP_ms: safeNumber(metrics.LCP_ms, 0, 120000),
      INP_ms: safeNumber(metrics.INP_ms, 0, 120000),
      CLS: safeNumber(metrics.CLS, 0, 100),
      FCP_ms: safeNumber(metrics.FCP_ms, 0, 120000),
      TTFB_ms: safeNumber(metrics.TTFB_ms, 0, 120000),
    };
    if (cleanMetrics.LCP_ms == null && cleanMetrics.INP_ms == null && cleanMetrics.CLS == null && cleanMetrics.FCP_ms == null && cleanMetrics.TTFB_ms == null) return null;
    return {
      incident_scope: 'real_user_performance',
      incident_code: 'rum_web_vitals',
      severity: 'info',
      message: 'Real-user performance sample.',
      details: { ...common, metrics: cleanMetrics, sample_rate: safeNumber(body?.sample_rate, 0, 1) },
    };
  }

  const message = clampText(body?.message, MAX_MESSAGE) || 'Client runtime error.';
  const details = {
    ...common,
    source: clampText(body?.source, 500),
    line: safeNumber(body?.line, 0, 10000000),
    column: safeNumber(body?.column, 0, 10000000),
    stack: clampText(body?.stack, MAX_STACK),
    resource_type: clampText(body?.resource_type, 64),
  };
  const map = {
    error: ['client_js_error', 'error'],
    unhandled_rejection: ['client_unhandled_rejection', 'error'],
    resource_error: ['client_resource_error', 'warning'],
  };
  return {
    incident_scope: 'client_runtime',
    incident_code: map[kind][0],
    severity: map[kind][1],
    message,
    details,
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!sameOriginRequest(request)) return jsonResponse({ ok: false, error: 'Cross-origin telemetry is not accepted.' }, 403, { 'Cache-Control': 'no-store' });

  const declaredLength = Number(request.headers.get('Content-Length') || 0);
  if (declaredLength > MAX_BODY_BYTES) return jsonResponse({ ok: false, error: 'Telemetry payload is too large.' }, 413, { 'Cache-Control': 'no-store' });

  let raw = '';
  try {
    raw = await request.text();
  } catch {
    return jsonResponse({ ok: false, error: 'Telemetry body could not be read.' }, 400, { 'Cache-Control': 'no-store' });
  }
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return jsonResponse({ ok: false, error: 'Telemetry payload is too large.' }, 413, { 'Cache-Control': 'no-store' });

  let body = null;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    return jsonResponse({ ok: false, error: 'Telemetry JSON is invalid.' }, 400, { 'Cache-Control': 'no-store' });
  }
  const payload = runtimePayload(body);
  if (!payload) return jsonResponse({ ok: false, error: 'Telemetry payload is unsupported.' }, 400, { 'Cache-Control': 'no-store' });

  const recorded = await captureRuntimeIncident(env, request, payload);
  if (!recorded) return jsonResponse({ ok: false, error: 'Runtime telemetry is temporarily unavailable.' }, 503, { 'Cache-Control': 'no-store', 'Retry-After': '60' });
  return jsonResponse({ ok: true, recorded: true }, 202, { 'Cache-Control': 'no-store' });
}

export async function onRequestGet() {
  return jsonResponse({ ok: true, accepts: ['client_runtime', 'real_user_performance'], mutation_scope: 'operational_telemetry_only' }, 200, { 'Cache-Control': 'no-store' });
}
