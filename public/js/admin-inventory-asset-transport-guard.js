// Devil n Dove Build 440 — Inventory Operations asset URL transport guard.
// Narrowly scoped to /admin/inventory-operations/. Legacy R2 object names may contain
// literal # characters. Browsers treat # as a fragment delimiter, so encode those
// characters before API data or generated HTML reaches an image/link transport.
// Stored D1 values and R2 object identities are never mutated here.

(() => {
  if (!window.location.pathname.startsWith('/admin/inventory-operations')) return;

  const HOST = 'assets.devilndove.com';
  const HOST_PREFIX = `https://${HOST}/`;
  const PATCH_FLAG = Symbol.for('dd.inventory.asset.transport.guard.v2');

  function safeAssetUrl(value) {
    const raw = String(value ?? '').trim();
    if (!raw || !raw.includes(HOST) || !raw.includes('#')) return raw;

    // Escape object-key fragment characters before URL parsing. Parsing first would
    // discard everything after the first # and make the original key unrecoverable.
    const escaped = raw.replace(/#/g, '%23');
    try {
      const parsed = new URL(escaped, window.location.origin);
      if (parsed.hostname !== HOST) return raw;
      return parsed.toString();
    } catch {
      return raw;
    }
  }

  function normalizePayload(value, seen = new WeakSet()) {
    if (typeof value === 'string') {
      return value.includes(HOST) && value.includes('#') ? safeAssetUrl(value) : value;
    }
    if (Array.isArray(value)) return value.map((item) => normalizePayload(item, seen));
    if (!value || typeof value !== 'object') return value;
    if (seen.has(value)) return value;
    seen.add(value);
    for (const key of Object.keys(value)) value[key] = normalizePayload(value[key], seen);
    return value;
  }

  function sanitizeGeneratedHtml(value) {
    const html = String(value ?? '');
    if (!html.includes(HOST_PREFIX) || !html.includes('#')) return html;

    // Inventory templates use double-quoted src/href attributes. Match only the
    // public asset host and stop at a double quote/markup boundary so unrelated
    // anchors, IDs and ordinary # characters are untouched.
    return html.replace(/https:\/\/assets\.devilndove\.com\/[^"<>\r\n]*/g, (match) => safeAssetUrl(match));
  }

  function installApiBoundary() {
    if (!window.DDAuth || window.DDAuth[PATCH_FLAG]) return;

    const originalReadApiJson = typeof window.DDAuth.readApiJson === 'function'
      ? window.DDAuth.readApiJson.bind(window.DDAuth)
      : null;
    if (originalReadApiJson) {
      window.DDAuth.readApiJson = async (...args) => normalizePayload(await originalReadApiJson(...args));
    }

    const originalApiJson = typeof window.DDAuth.apiJson === 'function'
      ? window.DDAuth.apiJson.bind(window.DDAuth)
      : null;
    if (originalApiJson) {
      window.DDAuth.apiJson = async (...args) => normalizePayload(await originalApiJson(...args));
    }

    Object.defineProperty(window.DDAuth, PATCH_FLAG, { value: true, configurable: false });
  }

  function installGeneratedHtmlBoundary() {
    if (!window.Element || Element.prototype[PATCH_FLAG]) return;

    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (descriptor?.get && descriptor?.set && descriptor.configurable) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        get: descriptor.get,
        set(value) {
          return descriptor.set.call(this, sanitizeGeneratedHtml(value));
        },
      });
    }

    const originalInsertAdjacentHTML = Element.prototype.insertAdjacentHTML;
    if (typeof originalInsertAdjacentHTML === 'function') {
      Element.prototype.insertAdjacentHTML = function guardedInsertAdjacentHTML(position, html) {
        return originalInsertAdjacentHTML.call(this, position, sanitizeGeneratedHtml(html));
      };
    }

    Object.defineProperty(Element.prototype, PATCH_FLAG, { value: true, configurable: false });
  }

  function installDirectUrlPropertyBoundary(proto, property) {
    if (!proto) return;
    const flag = Symbol.for(`dd.inventory.asset.transport.guard.${property}`);
    if (proto[flag]) return;
    const descriptor = Object.getOwnPropertyDescriptor(proto, property);
    if (!descriptor?.get || !descriptor?.set || !descriptor.configurable) return;
    Object.defineProperty(proto, property, {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      get: descriptor.get,
      set(value) {
        return descriptor.set.call(this, safeAssetUrl(value));
      },
    });
    Object.defineProperty(proto, flag, { value: true, configurable: false });
  }

  installApiBoundary();
  installGeneratedHtmlBoundary();
  installDirectUrlPropertyBoundary(window.HTMLImageElement?.prototype, 'src');
  installDirectUrlPropertyBoundary(window.HTMLAnchorElement?.prototype, 'href');

  window.DDInventoryAssetTransportGuard = Object.freeze({
    installed: true,
    host: HOST,
    safeAssetUrl,
    normalizePayload,
    sanitizeGeneratedHtml,
  });
})();
