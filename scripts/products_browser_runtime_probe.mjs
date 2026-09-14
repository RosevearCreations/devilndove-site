#!/usr/bin/env node
// Release 467 Build 155 — dependency-free Chromium/CDP Products browser responsiveness probe.
// GET-only browser acceptance. It never submits Product forms or calls mutation actions.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const baseUrl = String(process.env.DND_BASE_URL || '').trim().replace(/\/$/, '');
const expectedSha = String(process.env.EXPECTED_SOURCE_SHA || '').trim();
const rawCookie = String(process.env.DND_SESSION_COOKIE || '').trim();
const accessId = String(process.env.CF_ACCESS_CLIENT_ID || '').trim();
const accessSecret = String(process.env.CF_ACCESS_CLIENT_SECRET || '').trim();
const expectedRevision = '467-b155-products-client-responsiveness';

function fail(message, detail = null) {
  console.error(`PRODUCTS BROWSER RUNTIME PROBE: FAIL — ${message}`);
  if (detail != null) console.error(JSON.stringify(detail, null, 2));
  process.exitCode = 1;
}

if (!baseUrl || !/^https:\/\//i.test(baseUrl)) {
  fail('DND_BASE_URL must be an https URL.');
  process.exit();
}
if (!rawCookie) {
  fail('DND_SESSION_COOKIE is required; the probe never creates an administrator session.');
  process.exit();
}

function findChrome() {
  const explicit = String(process.env.CHROME_BIN || '').trim();
  if (explicit && fs.existsSync(explicit)) return explicit;
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const result = spawnSync('which', [name], { encoding: 'utf8' });
    const found = String(result.stdout || '').trim();
    if (result.status === 0 && found) return found;
  }
  return '';
}

function parseCookie(value) {
  const cleaned = String(value || '').replace(/^Cookie:\s*/i, '').trim();
  const first = cleaned.split(';').map((part) => part.trim()).find(Boolean) || '';
  if (!first.includes('=')) return { name: 'dd_auth_token', value: first };
  const [name, ...rest] = first.split('=');
  return { name: String(name || '').trim() || 'dd_auth_token', value: rest.join('=').trim() };
}

function sanitizeUrl(value) {
  return String(value || '').replace(/([?&](?:meta|kid|token|build155_browser_probe)=)[^&#]+/gi, '$1<redacted>');
}

const chromeBin = findChrome();
if (!chromeBin) {
  fail('No Chromium/Chrome binary is available on this runner.');
  process.exit();
}

const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-products-build155-'));
const port = 9222 + (process.pid % 3000);
const chrome = spawn(chromeBin, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-sync',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  'about:blank',
], { stdio: 'ignore' });

let ws = null;
let nextId = 1;
const pending = new Map();
const waiters = new Set();
const scriptUrls = new Map();
let pageSessionId = null;

function cleanup() {
  try { ws?.close(); } catch {}
  try { chrome.kill('SIGKILL'); } catch {}
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
}
process.on('exit', cleanup);
process.on('SIGTERM', () => { cleanup(); process.exit(143); });
process.on('SIGINT', () => { cleanup(); process.exit(130); });

async function browserVersion() {
  const endpoint = `http://127.0.0.1:${port}/json/version`;
  let lastError = null;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return await response.json();
    } catch (error) { lastError = error; }
    await sleep(100);
  }
  throw new Error(`Chromium DevTools endpoint did not start: ${lastError?.message || 'unavailable'}`);
}

function command(method, params = {}, sessionId = null, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP command timed out: ${method}`));
    }, timeoutMs);
    pending.set(id, { resolve, reject, timer, method });
    const message = { id, method, params };
    if (sessionId) message.sessionId = sessionId;
    ws.send(JSON.stringify(message));
  });
}

function waitForEvent(method, sessionId = null, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const waiter = { method, sessionId, resolve, reject, timer: null };
    waiter.timer = setTimeout(() => {
      waiters.delete(waiter);
      reject(new Error(`CDP event timed out: ${method}`));
    }, timeoutMs);
    waiters.add(waiter);
  });
}

function evaluate(expression, sessionId, timeoutMs = 20000) {
  return command('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: false,
  }, sessionId, timeoutMs).then((payload) => {
    if (payload?.exceptionDetails) throw new Error(`Browser evaluation failed: ${payload.exceptionDetails?.text || 'exception'}`);
    return payload?.result?.value;
  });
}

async function diagnoseRuntimeStall(sessionId, originalError) {
  if (!sessionId || !/CDP command timed out: Runtime\.evaluate/.test(String(originalError?.message || originalError || ''))) return;
  try {
    const pausedEvent = waitForEvent('Debugger.paused', sessionId, 8000);
    await command('Debugger.pause', {}, sessionId, 8000);
    const paused = await pausedEvent;
    const rawFrames = Array.isArray(paused?.callFrames) ? paused.callFrames.slice(0, 12) : [];
    const frames = rawFrames.map((frame) => ({
      function_name: String(frame?.functionName || '(anonymous)'),
      url: sanitizeUrl(frame?.url || scriptUrls.get(frame?.location?.scriptId) || ''),
      line: Number(frame?.location?.lineNumber || 0) + 1,
      column: Number(frame?.location?.columnNumber || 0) + 1,
      script_id: String(frame?.location?.scriptId || ''),
    }));
    console.error('PRODUCTS BROWSER STALL DIAGNOSTIC');
    console.error(JSON.stringify({ reason: paused?.reason || 'unknown', frames }, null, 2));
    const top = rawFrames[0];
    const scriptId = top?.location?.scriptId;
    if (scriptId) {
      try {
        const sourcePayload = await command('Debugger.getScriptSource', { scriptId }, sessionId, 5000);
        const lines = String(sourcePayload?.scriptSource || '').split(/\r?\n/);
        const line = Number(top?.location?.lineNumber || 0);
        const start = Math.max(0, line - 6);
        const end = Math.min(lines.length, line + 9);
        console.error('PRODUCTS BROWSER STALL SOURCE');
        console.error(JSON.stringify({
          url: sanitizeUrl(scriptUrls.get(scriptId) || top?.url || ''),
          line: line + 1,
          context: lines.slice(start, end).map((text, index) => `${start + index + 1}: ${text.slice(0, 500)}`),
        }, null, 2));
      } catch (sourceError) {
        console.error(`PRODUCTS BROWSER STALL SOURCE UNAVAILABLE — ${sourceError?.message || sourceError}`);
      }
    }
  } catch (diagnosticError) {
    console.error(`PRODUCTS BROWSER STALL DIAGNOSTIC UNAVAILABLE — ${diagnosticError?.message || diagnosticError}`);
  }
}

try {
  const version = await browserVersion();
  if (!version?.webSocketDebuggerUrl) throw new Error('Chromium did not expose a browser websocket URL.');
  ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('CDP websocket open timed out.')), 5000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP websocket failed to open.')); }, { once: true });
  });

  ws.addEventListener('message', (event) => {
    let message;
    try { message = JSON.parse(String(event.data || '')); } catch { return; }
    if (message.id && pending.has(message.id)) {
      const row = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(row.timer);
      if (message.error) row.reject(new Error(`${row.method}: ${message.error.message || 'CDP error'}`));
      else row.resolve(message.result || {});
      return;
    }
    if (message.method === 'Debugger.scriptParsed' && message.params?.scriptId) {
      scriptUrls.set(String(message.params.scriptId), String(message.params.url || ''));
    }
    if (!message.method) return;
    for (const waiter of [...waiters]) {
      if (waiter.method !== message.method) continue;
      if (waiter.sessionId && waiter.sessionId !== message.sessionId) continue;
      waiters.delete(waiter);
      clearTimeout(waiter.timer);
      waiter.resolve(message.params || {});
    }
  });

  const target = await command('Target.createTarget', { url: 'about:blank' });
  const attached = await command('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;
  pageSessionId = sessionId;
  if (!sessionId) throw new Error('Could not attach to Chromium page target.');

  await command('Network.enable', {}, sessionId);
  await command('Page.enable', {}, sessionId);
  await command('Runtime.enable', {}, sessionId);
  await command('Debugger.enable', {}, sessionId);
  await command('Network.setCacheDisabled', { cacheDisabled: true }, sessionId);
  await command('Network.clearBrowserCache', {}, sessionId);

  const extraHeaders = { 'Cache-Control': 'no-cache' };
  if (accessId && accessSecret) {
    extraHeaders['CF-Access-Client-Id'] = accessId;
    extraHeaders['CF-Access-Client-Secret'] = accessSecret;
  }
  await command('Network.setExtraHTTPHeaders', { headers: extraHeaders }, sessionId);

  const cookie = parseCookie(rawCookie);
  if (!cookie.value) throw new Error('Administrator session cookie is empty.');
  const cookieResult = await command('Network.setCookie', {
    name: cookie.name,
    value: cookie.value,
    url: `${baseUrl}/`,
    secure: true,
  }, sessionId);
  if (cookieResult?.success === false) throw new Error('Chromium rejected the administrator session cookie.');

  const probeUrl = `${baseUrl}/admin/products/?build155_browser_probe=${encodeURIComponent(expectedSha || 'current')}`;
  const loaded = waitForEvent('Page.loadEventFired', sessionId, 25000);
  await command('Page.navigate', { url: probeUrl }, sessionId, 20000);
  await loaded;

  const result = await evaluate(`(async () => {
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      const select = document.getElementById('existingProductSelect');
      const health = window.DDProductsMarketplaceReadinessHealth?.snapshot?.();
      const rows = document.querySelectorAll('#productsTableBody [data-edit-product-id]').length;
      if ((select?.options?.length || 0) > 1 && rows > 0 && health?.version === '${expectedRevision}') break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const before = window.DDProductsMarketplaceReadinessHealth?.snapshot?.() || null;
    const heartbeatStart = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const heartbeatElapsedMs = performance.now() - heartbeatStart;
    const after = window.DDProductsMarketplaceReadinessHealth?.snapshot?.() || null;
    const select = document.getElementById('existingProductSelect');
    const options = select ? Array.from(select.options).map((option) => String(option.textContent || '').trim()) : [];
    const rows = document.querySelectorAll('#productsTableBody [data-edit-product-id]').length;
    const cleanupText = String(document.getElementById('productCleanupCenter')?.textContent || '').replace(/\\s+/g, ' ').trim();
    const qualityText = String(document.getElementById('productQualityCommandCenterMount')?.textContent || '').replace(/\\s+/g, ' ').trim();
    return {
      ready_state: document.readyState,
      title: document.title,
      logged_in: Boolean(window.DDAuth?.isLoggedIn?.()),
      option_count: options.length,
      first_options: options.slice(0, 4),
      rendered_product_rows: rows,
      marketplace_before: before,
      marketplace_after: after,
      marketplace_render_delta: before && after ? Number(after.render_count || 0) - Number(before.render_count || 0) : null,
      heartbeat_elapsed_ms: heartbeatElapsedMs,
      cleanup_still_loading: /Loading (draft and archive|cleanup candidates)/i.test(cleanupText),
      quality_still_loading: /Loading Product Release Quality Command Center/i.test(qualityText),
      body_has_1102: /Error 1102|Worker exceeded resource limits/i.test(document.body?.innerText || ''),
      href: location.href,
    };
  })()`, sessionId, 30000);

  const sanitized = {
    ...result,
    href: String(result?.href || '').replace(/([?&]build155_browser_probe=)[^&#]+/, '$1<expected-sha>'),
  };
  console.log('PRODUCTS BROWSER RUNTIME EVIDENCE');
  console.log(JSON.stringify(sanitized, null, 2));

  const failures = [];
  if (result?.ready_state !== 'complete') failures.push(`document.readyState=${result?.ready_state}`);
  if (!result?.logged_in) failures.push('administrator session was not active in the browser');
  if (Number(result?.option_count || 0) < 2) failures.push(`existing Product picker has only ${Number(result?.option_count || 0)} option(s)`);
  if (Number(result?.rendered_product_rows || 0) < 1) failures.push('Product table rendered zero Product rows');
  if (result?.marketplace_after?.version !== expectedRevision) failures.push('Build 155 client-health revision is not active');
  if (!Number.isFinite(Number(result?.marketplace_render_delta))) failures.push('marketplace render stability could not be measured');
  else if (Number(result.marketplace_render_delta) > 2) failures.push(`marketplace renderer repeated ${result.marketplace_render_delta} times during the 1.2s stability window`);
  if (Number(result?.heartbeat_elapsed_ms || 0) < 1000) failures.push('browser event-loop heartbeat did not complete normally');
  if (result?.body_has_1102) failures.push('live page body contains Worker resource-limit evidence');
  if (result?.cleanup_still_loading) failures.push('draft/archive cleanup remained in its loading state');
  if (result?.quality_still_loading) failures.push('Product Release Quality Command Center remained in its loading state');

  if (failures.length) {
    fail(failures.join('; '), sanitized);
  } else {
    console.log('PRODUCTS BROWSER RUNTIME PROBE: PASS');
    console.log(`Client revision: ${expectedRevision}`);
    console.log(`Product picker options: ${result.option_count}`);
    console.log(`Rendered Product rows: ${result.rendered_product_rows}`);
    console.log(`Marketplace render delta over 1.2s: ${result.marketplace_render_delta}`);
    console.log('Browser event loop: RESPONSIVE');
    console.log('Product data population: PROVEN');
  }
} catch (error) {
  await diagnoseRuntimeStall(pageSessionId, error);
  fail(error?.message || String(error));
} finally {
  cleanup();
}

if (process.exitCode) process.exit(process.exitCode);
