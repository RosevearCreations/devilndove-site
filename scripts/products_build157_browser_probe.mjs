#!/usr/bin/env node
// Release 467 Build 157 — focused Products Quality/media real-browser acceptance.
// Build 159 extends the proof to returning-browser cache/runtime coherence and the Product Editor timeout.
// Browser actions are GET/DOM observation only; no Product, R2, provider, payment, refund, or accounting mutation.
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

function stop(message, detail = null) {
  console.error(`BUILD 157 PRODUCTS BROWSER PROBE: FAIL — ${message}`);
  if (detail != null) console.error(JSON.stringify(detail, null, 2));
  process.exitCode = 1;
}

if (!baseUrl || !/^https:\/\//i.test(baseUrl)) {
  stop('DND_BASE_URL must be an https URL.');
  process.exit();
}
if (!rawCookie) {
  stop('DND_SESSION_COOKIE is required.');
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

const chromeBin = findChrome();
if (!chromeBin) {
  stop('No Chromium/Chrome binary is available on this runner.');
  process.exit();
}

const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-products-build157-'));
const port = 12000 + (process.pid % 2000);
const chrome = spawn(chromeBin, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--disable-background-networking', '--disable-component-update', '--disable-default-apps',
  '--disable-extensions', '--disable-sync', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`, 'about:blank',
], { stdio: 'ignore' });

let ws = null;
let nextId = 1;
let pageSessionId = null;
const pending = new Map();
const waiters = new Set();
const responses = [];

function cleanup() {
  try { ws?.close(); } catch {}
  try { chrome.kill('SIGKILL'); } catch {}
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
}
process.on('exit', cleanup);
process.on('SIGTERM', () => { cleanup(); process.exit(143); });
process.on('SIGINT', () => { cleanup(); process.exit(130); });

async function browserVersion() {
  let lastError = null;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(1000) });
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

function evaluate(expression, sessionId, timeoutMs = 20000) {
  return command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId, timeoutMs)
    .then((payload) => {
      if (payload?.exceptionDetails) throw new Error(`Browser evaluation failed: ${payload.exceptionDetails?.text || 'exception'}`);
      return payload?.result?.value;
    });
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
    if (message.method === 'Network.responseReceived' && (!pageSessionId || message.sessionId === pageSessionId)) {
      const response = message.params?.response || {};
      responses.push({ url: String(response.url || ''), status: Number(response.status || 0) });
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
    name: cookie.name, value: cookie.value, url: `${baseUrl}/`, secure: true,
  }, sessionId);
  if (cookieResult?.success === false) throw new Error('Chromium rejected the administrator session cookie.');

  const probeUrl = `${baseUrl}/admin/products/?build157_browser_probe=${encodeURIComponent(expectedSha || 'current')}`;
  const navigation = await command('Page.navigate', { url: probeUrl }, sessionId, 20000);
  if (navigation?.errorText) throw new Error(`Page navigation failed: ${navigation.errorText}`);

  let interactive = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const state = await evaluate(`({readyState:document.readyState,href:location.href})`, sessionId, 3000);
    if (['interactive', 'complete'].includes(String(state?.readyState || '')) && String(state?.href || '').includes('/admin/products/')) {
      interactive = true;
      break;
    }
    await sleep(100);
  }
  if (!interactive) throw new Error('Product document did not reach interactive readiness.');

  const result = await evaluate(`(async()=>{
    const badQuality=/Product quality view unavailable|Product startup request timed out|Loading Product Release Quality Command Center/i;
    const deadline=Date.now()+12000;
    while(Date.now()<deadline){
      const select=document.getElementById('existingProductSelect');
      const rows=document.querySelectorAll('#productsTableBody [data-edit-product-id]').length;
      const quality=String(document.getElementById('productQualityCommandCenterMount')?.textContent||'').replace(/\\s+/g,' ').trim();
      if((select?.options?.length||0)>1&&rows>0&&quality&&!badQuality.test(quality)) break;
      await new Promise((resolve)=>setTimeout(resolve,100));
    }
    window.scrollTo(0,document.body?.scrollHeight||0);
    await new Promise((resolve)=>setTimeout(resolve,1200));
    window.scrollTo(0,0);
    await new Promise((resolve)=>setTimeout(resolve,800));
    const heartbeatStart=performance.now();
    await new Promise((resolve)=>setTimeout(resolve,1200));
    const select=document.getElementById('existingProductSelect');
    const quality=String(document.getElementById('productQualityCommandCenterMount')?.textContent||'').replace(/\\s+/g,' ').trim();
    const editorMessage=String(document.getElementById('createProductMessage')?.textContent||'').replace(/\\s+/g,' ').trim();
    const bodyText=String(document.body?.innerText||'');
    const scriptSrcs=[...document.scripts].map((script)=>String(script.src||''));
    return {
      ready_state:document.readyState,
      logged_in:Boolean(window.DDAuth?.isLoggedIn?.()),
      option_count:select?.options?.length||0,
      rendered_product_rows:document.querySelectorAll('#productsTableBody [data-edit-product-id]').length,
      quality_text:quality.slice(0,500),
      quality_unavailable:/Product quality view unavailable|Product startup request timed out/i.test(quality),
      quality_still_loading:/Loading Product Release Quality Command Center/i.test(quality),
      editor_message:editorMessage.slice(0,300),
      editor_startup_timeout_6000:/Product startup request timed out after 6000 ms/i.test(editorMessage)||/Product startup request timed out after 6000 ms/i.test(bodyText),
      request_budget_version:String(window.DDProductsRequestBudgetHealth?.version||''),
      editor_startup_version:String(window.DDProductsEditorStartupHealth?.version||''),
      media_fallback_version:Number(window.DDProductMediaFallback?.version||0),
      media_build159_patch:Number(window.DDProductMediaFallback?.build159_admin_cache_patch||0),
      admin_data_delivery_version:String(window.DDAdminDataDeliveryHealth?.version||''),
      has_build159_product_asset:scriptSrcs.some((src)=>src.includes('467-b159-products-returning-browser-cache-v1')),
      has_build159_request_budget_loader:scriptSrcs.some((src)=>src.includes('467b159-request-budget-loader-v1')),
      has_build159_media_loader:scriptSrcs.some((src)=>src.includes('467-b159-products-media-admin-cache-v1')),
      has_build159_editor_helper:scriptSrcs.some((src)=>src.includes('467b159-editor-startup-cache-v2')),
      body_has_1102:/Error 1102|Worker exceeded resource limits/i.test(bodyText),
      heartbeat_elapsed_ms:performance.now()-heartbeatStart
    };
  })()`, sessionId, 30000);

  await sleep(750);
  const baseOrigin = new URL(baseUrl).origin;
  const media404 = responses.filter((row) => {
    try {
      const url = new URL(row.url);
      return url.origin === baseOrigin && url.pathname === '/api/product-media' && row.status === 404;
    } catch { return false; }
  });
  const media404Unique = new Set(media404.map((row) => row.url)).size;
  const evidence = {
    ready_state: result?.ready_state,
    logged_in: result?.logged_in,
    option_count: Number(result?.option_count || 0),
    rendered_product_rows: Number(result?.rendered_product_rows || 0),
    quality_unavailable: Boolean(result?.quality_unavailable),
    quality_still_loading: Boolean(result?.quality_still_loading),
    quality_text: String(result?.quality_text || ''),
    editor_message: String(result?.editor_message || ''),
    editor_startup_timeout_6000: Boolean(result?.editor_startup_timeout_6000),
    request_budget_version: String(result?.request_budget_version || ''),
    editor_startup_version: String(result?.editor_startup_version || ''),
    media_fallback_version: Number(result?.media_fallback_version || 0),
    media_build159_patch: Number(result?.media_build159_patch || 0),
    admin_data_delivery_version: String(result?.admin_data_delivery_version || ''),
    has_build159_product_asset: Boolean(result?.has_build159_product_asset),
    has_build159_request_budget_loader: Boolean(result?.has_build159_request_budget_loader),
    has_build159_media_loader: Boolean(result?.has_build159_media_loader),
    has_build159_editor_helper: Boolean(result?.has_build159_editor_helper),
    same_origin_product_media_404_count: media404.length,
    same_origin_product_media_404_unique: media404Unique,
    body_has_1102: Boolean(result?.body_has_1102),
    heartbeat_elapsed_ms: Number(result?.heartbeat_elapsed_ms || 0),
  };
  console.log('BUILD 157 PRODUCTS BROWSER EVIDENCE');
  console.log(JSON.stringify(evidence, null, 2));

  const failures = [];
  if (!result?.logged_in) failures.push('administrator session was not active');
  if (Number(result?.option_count || 0) < 2) failures.push('existing Product picker did not populate');
  if (Number(result?.rendered_product_rows || 0) < 1) failures.push('Product table rendered zero rows');
  if (!String(result?.quality_text || '').trim()) failures.push('Product Quality view rendered no settled content');
  if (result?.quality_unavailable) failures.push('Product Quality reported unavailable/startup timeout');
  if (result?.quality_still_loading) failures.push('Product Quality remained in its loading state');
  if (result?.editor_startup_timeout_6000) failures.push('Product Editor reported the legacy 6000 ms startup timeout');
  if (String(result?.request_budget_version || '') !== 'R467B159_REQUEST_BUDGET_V3') failures.push(`Build 159 request budget runtime missing (${result?.request_budget_version || 'none'})`);
  if (!String(result?.editor_startup_version || '').startsWith('R467B158_EDITOR_STARTUP')) failures.push(`Product Editor startup helper missing (${result?.editor_startup_version || 'none'})`);
  if (Number(result?.media_fallback_version || 0) < 63) failures.push(`Product media fallback runtime is stale (${result?.media_fallback_version || 0})`);
  if (Number(result?.media_build159_patch || 0) < 159) failures.push('Build 159 Admin media cache patch is not installed');
  if (!result?.has_build159_product_asset) failures.push('Build 159 Product asset generation is absent from rendered script URLs');
  if (!result?.has_build159_request_budget_loader) failures.push('Build 159 request-budget loader URL is absent');
  if (!result?.has_build159_media_loader) failures.push('Build 159 Product media loader URL is absent');
  if (!result?.has_build159_editor_helper) failures.push('Build 159 Product Editor helper cache generation is absent');
  if (media404.length > 0) failures.push(`/api/product-media returned ${media404.length} Admin recovery 404 response(s)`);
  if (result?.body_has_1102) failures.push('page contains Worker resource-limit evidence');
  if (Number(result?.heartbeat_elapsed_ms || 0) < 1000) failures.push('browser event-loop heartbeat did not complete normally');

  if (failures.length) stop(failures.join('; '), evidence);
  else {
    console.log('BUILD 157 PRODUCTS BROWSER PROBE: PASS');
    console.log('Product Quality: SETTLED / NO STARTUP TIMEOUT');
    console.log('Product Editor legacy 6000 ms timeout: ZERO');
    console.log('Admin Product media recovery 404s: ZERO');
    console.log('Build 159 cache/runtime contract: INSTALLED');
  }
} catch (error) {
  stop(error?.message || String(error));
} finally {
  cleanup();
}
