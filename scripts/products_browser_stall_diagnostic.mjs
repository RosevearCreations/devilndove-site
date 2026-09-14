#!/usr/bin/env node
// Diagnostic-branch-only Release 467 Build 155 Product renderer stall locator.
// GET/DOM/debugger observation only. Never submit forms or call mutation APIs.
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

if (!baseUrl || !rawCookie) {
  console.error('STALL DIAGNOSTIC: missing base URL or admin session cookie');
  process.exit(2);
}

const chromeBin = findChrome();
if (!chromeBin) {
  console.error('STALL DIAGNOSTIC: no Chrome/Chromium binary');
  process.exit(2);
}
console.log('STALL_DIAGNOSTIC_CHROME_BIN', chromeBin);
try {
  const version = spawnSync(chromeBin, ['--version'], { encoding: 'utf8', timeout: 5000 });
  console.log('STALL_DIAGNOSTIC_CHROME_VERSION', String(version.stdout || version.stderr || '').trim());
} catch {}

const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-products-stall-'));
const port = 9600 + (process.pid % 1000);
const chromeLog = path.join(profileDir, 'chrome.log');
const chromeFd = fs.openSync(chromeLog, 'w');
const chrome = spawn(chromeBin, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--disable-background-networking', '--disable-component-update', '--disable-default-apps',
  '--disable-extensions', '--disable-sync', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`, 'about:blank',
], { stdio: ['ignore', chromeFd, chromeFd] });

let ws = null;
let nextId = 1;
const pending = new Map();
const waiters = new Set();
const scriptUrls = new Map();
const consoleRows = [];
const failedRequests = [];

function cleanup() {
  try { ws?.close(); } catch {}
  try { chrome.kill('SIGKILL'); } catch {}
  try { fs.closeSync(chromeFd); } catch {}
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
}
process.on('exit', cleanup);

async function browserVersion() {
  const endpoint = `http://127.0.0.1:${port}/json/version`;
  let lastError = null;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (chrome.exitCode != null) break;
    try {
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(800) });
      if (response.ok) return await response.json();
    } catch (error) { lastError = error; }
    await sleep(100);
  }
  let log = '';
  try { log = fs.readFileSync(chromeLog, 'utf8').slice(-6000); } catch {}
  throw new Error(`Chromium DevTools endpoint did not start: ${lastError?.message || 'unavailable'}; exit=${chrome.exitCode}; chrome_log=${log}`);
}

function command(method, params = {}, sessionId = null, timeoutMs = 10000) {
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

function waitForEvent(method, sessionId = null, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const waiter = { method, sessionId, resolve, reject, timer: null };
    waiter.timer = setTimeout(() => {
      waiters.delete(waiter);
      reject(new Error(`CDP event timed out: ${method}`));
    }, timeoutMs);
    waiters.add(waiter);
  });
}

function sanitizeUrl(value) {
  const raw = String(value || '');
  return raw.replace(/([?&](?:token|meta|kid|build155_browser_probe)=)[^&#]+/gi, '$1<redacted>');
}

async function sourceContext(sessionId, frame) {
  try {
    const scriptId = frame?.location?.scriptId;
    if (!scriptId) return null;
    const payload = await command('Debugger.getScriptSource', { scriptId }, sessionId, 5000);
    const lines = String(payload?.scriptSource || '').split(/\r?\n/);
    const line = Number(frame.location.lineNumber || 0);
    const start = Math.max(0, line - 5);
    const end = Math.min(lines.length, line + 8);
    return {
      url: sanitizeUrl(scriptUrls.get(scriptId) || frame.url || ''),
      line_1_based: line + 1,
      context: lines.slice(start, end).map((text, idx) => `${start + idx + 1}: ${text.slice(0, 500)}`),
    };
  } catch (error) {
    return { error: error?.message || String(error) };
  }
}

try {
  const version = await browserVersion();
  ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('CDP websocket open timed out')), 5000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP websocket failed to open')); }, { once: true });
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
      scriptUrls.set(message.params.scriptId, message.params.url || '');
    }
    if (message.method === 'Runtime.consoleAPICalled' && consoleRows.length < 30) {
      consoleRows.push({ type: message.params?.type, values: (message.params?.args || []).slice(0, 4).map((x) => String(x.value ?? x.description ?? '').slice(0, 300)) });
    }
    if (message.method === 'Network.loadingFailed' && failedRequests.length < 30) {
      failedRequests.push({ errorText: message.params?.errorText, type: message.params?.type, canceled: message.params?.canceled });
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
  await command('Network.enable', {}, sessionId);
  await command('Page.enable', {}, sessionId);
  await command('Runtime.enable', {}, sessionId);
  await command('Debugger.enable', {}, sessionId);
  await command('Network.setCacheDisabled', { cacheDisabled: true }, sessionId);
  await command('Network.clearBrowserCache', {}, sessionId);
  const headers = { 'Cache-Control': 'no-cache' };
  if (accessId && accessSecret) {
    headers['CF-Access-Client-Id'] = accessId;
    headers['CF-Access-Client-Secret'] = accessSecret;
  }
  await command('Network.setExtraHTTPHeaders', { headers }, sessionId);
  const cookie = parseCookie(rawCookie);
  await command('Network.setCookie', { name: cookie.name, value: cookie.value, url: `${baseUrl}/`, secure: true }, sessionId);

  const url = `${baseUrl}/admin/products/?build155_stall_diag=${encodeURIComponent(expectedSha || 'current')}`;
  const loaded = waitForEvent('Page.loadEventFired', sessionId, 30000);
  await command('Page.navigate', { url }, sessionId, 15000);
  await loaded;
  console.log('STALL_DIAGNOSTIC_LOAD_EVENT PASS');
  await sleep(1500);

  try {
    const heartbeat = await command('Runtime.evaluate', {
      expression: `({title:document.title,href:location.href,ready:document.readyState,now:performance.now(),products:document.querySelectorAll('#productsTableBody [data-edit-product-id]').length})`,
      returnByValue: true,
    }, sessionId, 4000);
    console.log('STALL_DIAGNOSTIC_RUNTIME_RESPONSIVE', JSON.stringify({ ...heartbeat?.result?.value, href: sanitizeUrl(heartbeat?.result?.value?.href) }));
    console.log('STALL_DIAGNOSTIC_CONSOLE', JSON.stringify(consoleRows));
    console.log('STALL_DIAGNOSTIC_NETWORK_FAILURES', JSON.stringify(failedRequests));
    process.exitCode = 3;
  } catch (error) {
    console.log('STALL_DIAGNOSTIC_RUNTIME_EVALUATE_TIMEOUT', error?.message || String(error));
    const pausedPromise = waitForEvent('Debugger.paused', sessionId, 8000);
    await command('Debugger.pause', {}, sessionId, 8000);
    const paused = await pausedPromise;
    const frames = (paused?.callFrames || []).slice(0, 12).map((frame) => ({
      functionName: frame.functionName || '(anonymous)',
      url: sanitizeUrl(frame.url || scriptUrls.get(frame.location?.scriptId) || ''),
      line_1_based: Number(frame.location?.lineNumber || 0) + 1,
      column_1_based: Number(frame.location?.columnNumber || 0) + 1,
      scriptId: frame.location?.scriptId,
    }));
    console.log('STALL_DIAGNOSTIC_PAUSE_REASON', paused?.reason || 'unknown');
    console.log('STALL_DIAGNOSTIC_CALL_FRAMES', JSON.stringify(frames, null, 2));
    if (paused?.callFrames?.[0]) {
      console.log('STALL_DIAGNOSTIC_TOP_SOURCE', JSON.stringify(await sourceContext(sessionId, paused.callFrames[0]), null, 2));
    }
    console.log('STALL_DIAGNOSTIC_CONSOLE', JSON.stringify(consoleRows));
    console.log('STALL_DIAGNOSTIC_NETWORK_FAILURES', JSON.stringify(failedRequests));
    process.exitCode = 1;
  }
} catch (error) {
  console.error('STALL_DIAGNOSTIC_FATAL', error?.stack || error?.message || String(error));
  process.exitCode = 2;
} finally {
  cleanup();
}
