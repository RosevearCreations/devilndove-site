// Devil n Dove Build 440 — Admin asset URL presentation safety.
// Inventory data may contain legacy R2 object names with literal # characters.
// A browser treats # as a fragment delimiter, so normalize the public asset URL
// before any Admin workspace renders it. Stored D1/R2 identities are unchanged.

(() => {
  if (!window.DDAuth || window.DDAssetUrl?.installed) return;

  const PUBLIC_ASSET_HOST = 'assets.devilndove.com';

  function safe(value) {
    const raw = String(value ?? '').trim();
    if (!raw || !raw.includes('#')) return raw;

    // Escape the object-key # before URL parsing; parsing first would discard the
    // remainder as a fragment and make recovery impossible.
    const escaped = raw.replace(/#/g, '%23');
    try {
      const parsed = new URL(escaped, window.location.origin);
      if (parsed.hostname !== PUBLIC_ASSET_HOST) return raw;
      return parsed.toString();
    } catch {
      return raw;
    }
  }

  function normalizePayload(value, seen = new WeakSet()) {
    if (typeof value === 'string') {
      return value.includes(PUBLIC_ASSET_HOST) && value.includes('#') ? safe(value) : value;
    }
    if (Array.isArray(value)) return value.map((item) => normalizePayload(item, seen));
    if (!value || typeof value !== 'object') return value;
    if (seen.has(value)) return value;
    seen.add(value);
    for (const key of Object.keys(value)) {
      value[key] = normalizePayload(value[key], seen);
    }
    return value;
  }

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

  window.DDAssetUrl = Object.freeze({
    installed: true,
    safe,
    normalizePayload,
    publicAssetHost: PUBLIC_ASSET_HOST,
  });
})();
