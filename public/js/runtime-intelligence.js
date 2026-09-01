(() => {
  'use strict';

  const ENDPOINT = '/api/runtime-telemetry';
  const RUM_SAMPLE_RATE = 0.15;
  const MAX_ERROR_EVENTS = 12;
  const seen = new Set();
  let sentErrors = 0;
  let rumSent = false;
  const metrics = { LCP_ms: null, INP_ms: null, CLS: null, FCP_ms: null, TTFB_ms: null };

  function releaseNumber() {
    const script = document.currentScript || document.querySelector('script[src*="runtime-intelligence.js"]');
    if (!script) return 466;
    try { return Number(new URL(script.src, location.href).searchParams.get('v')) || 466; } catch { return 466; }
  }
  const RELEASE = releaseNumber();

  function cleanText(value, max = 700) {
    return String(value == null ? '' : value)
      .replace(/https?:\/\/[^\s?#]+\?[^\s#]*/gi, (match) => match.split('?')[0])
      .replace(/[\r\n\t]+/g, ' ')
      .trim()
      .slice(0, max);
  }

  function cleanResource(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
      const url = new URL(raw, location.href);
      return url.origin === location.origin ? url.pathname.slice(0, 500) : `${url.protocol}//${url.host}${url.pathname}`.slice(0, 500);
    } catch {
      return cleanText(raw, 500).split('?')[0].split('#')[0];
    }
  }

  function connectionType() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return cleanText(connection?.effectiveType || '', 32);
  }

  function basePayload(kind) {
    return {
      kind,
      release: RELEASE,
      page_path: location.pathname || '/',
      viewport_width: Math.max(0, Math.round(window.innerWidth || 0)),
      viewport_height: Math.max(0, Math.round(window.innerHeight || 0)),
      connection_type: connectionType(),
    };
  }

  function transmit(payload) {
    const body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon) {
        const accepted = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
        if (accepted) return;
      }
    } catch {}
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }

  function sendError(kind, data = {}) {
    if (sentErrors >= MAX_ERROR_EVENTS) return;
    const signature = [kind, data.message, data.source, data.line, data.column].map((value) => cleanText(value, 180)).join('|');
    if (seen.has(signature)) return;
    seen.add(signature);
    sentErrors += 1;
    transmit({
      ...basePayload(kind),
      message: cleanText(data.message, 700),
      source: cleanResource(data.source),
      line: Number.isFinite(Number(data.line)) ? Number(data.line) : null,
      column: Number.isFinite(Number(data.column)) ? Number(data.column) : null,
      stack: cleanText(data.stack, 1800),
      resource_type: cleanText(data.resource_type, 64),
    });
  }

  window.addEventListener('error', (event) => {
    const target = event.target;
    if (target && target !== window && (target.src || target.href)) {
      sendError('resource_error', {
        message: `Resource failed: ${String(target.tagName || 'resource').toLowerCase()}`,
        source: target.src || target.href,
        resource_type: String(target.tagName || '').toLowerCase(),
      });
      return;
    }
    sendError('error', {
      message: event.message || event.error?.message || 'Uncaught JavaScript error.',
      source: event.filename || '',
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack || '',
    });
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    sendError('unhandled_rejection', {
      message: reason?.message || (typeof reason === 'string' ? reason : 'Unhandled promise rejection.'),
      stack: reason?.stack || '',
    });
  });

  function observe(type, callback, options = { buffered: true }) {
    try {
      const observer = new PerformanceObserver((list) => callback(list.getEntries()));
      observer.observe({ type, ...options });
      return observer;
    } catch {
      return null;
    }
  }

  try {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) metrics.TTFB_ms = Math.max(0, Math.round(navigation.responseStart));
  } catch {}

  observe('paint', (entries) => {
    for (const entry of entries) if (entry.name === 'first-contentful-paint') metrics.FCP_ms = Math.round(entry.startTime);
  });

  observe('largest-contentful-paint', (entries) => {
    const entry = entries[entries.length - 1];
    if (entry) metrics.LCP_ms = Math.round(entry.startTime);
  });

  let clsValue = 0;
  let clsWindowValue = 0;
  let clsWindowStart = 0;
  let clsWindowEnd = 0;
  observe('layout-shift', (entries) => {
    for (const entry of entries) {
      if (entry.hadRecentInput) continue;
      if (clsWindowStart && entry.startTime - clsWindowEnd < 1000 && entry.startTime - clsWindowStart < 5000) {
        clsWindowValue += entry.value;
        clsWindowEnd = entry.startTime;
      } else {
        clsWindowStart = clsWindowEnd = entry.startTime;
        clsWindowValue = entry.value;
      }
      clsValue = Math.max(clsValue, clsWindowValue);
      metrics.CLS = Number(clsValue.toFixed(4));
    }
  });

  const interactionDurations = new Map();
  function updateInp(entries) {
    for (const entry of entries) {
      const id = Number(entry.interactionId || 0);
      if (!id) continue;
      const duration = Math.max(0, Number(entry.duration || 0));
      interactionDurations.set(id, Math.max(duration, interactionDurations.get(id) || 0));
    }
    const values = [...interactionDurations.values()].sort((a, b) => b - a);
    if (!values.length) return;
    const index = Math.min(Math.floor(values.length / 50), values.length - 1);
    metrics.INP_ms = Math.round(values[index]);
  }
  observe('event', updateInp, { buffered: true, durationThreshold: 40 });

  const rumAllowed = !(navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1');
  const rumSampled = rumAllowed && Math.random() < RUM_SAMPLE_RATE;

  function sendRum() {
    if (rumSent || !rumSampled) return;
    if (Object.values(metrics).every((value) => value == null)) return;
    rumSent = true;
    transmit({ ...basePayload('web_vitals'), metrics, sample_rate: RUM_SAMPLE_RATE });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendRum();
  });
  window.addEventListener('pagehide', sendRum, { once: true });
})();
