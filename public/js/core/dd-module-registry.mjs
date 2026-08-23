// Devil n Dove Build 281 modular application foundation.
// This file is intentionally passive: importing it creates no timers, fetches,
// polling loops, database calls, or automatic module activation.

export const MODULE_STATES = Object.freeze({
  REGISTERED: 'registered',
  LOADING: 'loading',
  LOADED: 'loaded',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  FAILED: 'failed',
});

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeId(value) {
  const id = normalizeText(value).toLowerCase();
  if (!/^[a-z][a-z0-9-]*$/.test(id)) {
    throw new Error(`Invalid module id: ${value}`);
  }
  return id;
}

function normalizePath(value) {
  const raw = normalizeText(value) || '/';
  const path = raw.split(/[?#]/, 1)[0] || '/';
  if (path === '/') return '/';
  return `/${path.replace(/^\/+|\/+$/g, '')}`;
}

function freezeStrings(values) {
  return Object.freeze(
    [...new Set((Array.isArray(values) ? values : []).map(normalizeText).filter(Boolean))]
  );
}

function normalizeDefinition(input) {
  if (!input || typeof input !== 'object') {
    throw new TypeError('Module definition must be an object.');
  }

  const id = normalizeId(input.id);
  const roles = freezeStrings((input.roles || []).map((role) => String(role).toLowerCase()));
  const exactRoutes = freezeStrings((input.exactRoutes || []).map(normalizePath));
  const routePrefixes = freezeStrings((input.routePrefixes || []).map(normalizePath));
  const capabilities = freezeStrings(input.capabilities || []);
  const consumes = freezeStrings(input.consumes || []);

  return Object.freeze({
    id,
    label: normalizeText(input.label) || id,
    description: normalizeText(input.description),
    kind: normalizeText(input.kind) || 'domain',
    roles,
    exactRoutes,
    routePrefixes,
    capabilities,
    consumes,
    entry: normalizeText(input.entry) || null,
    lazy: input.lazy !== false,
    enabled: input.enabled !== false,
  });
}

function roleFromUser(user) {
  return normalizeText(user?.role).toLowerCase();
}

function routeScore(definition, pathname) {
  const path = normalizePath(pathname);
  if (definition.exactRoutes.includes(path)) return 100000 + path.length;

  let best = -1;
  for (const prefix of definition.routePrefixes) {
    if (prefix === '/') continue;
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      best = Math.max(best, prefix.length);
    }
  }
  return best;
}

export class DDModuleRegistry {
  constructor() {
    this._definitions = new Map();
    this._runtime = new Map();
    this._services = new Map();
  }

  register(definition) {
    const normalized = normalizeDefinition(definition);
    if (this._definitions.has(normalized.id)) {
      throw new Error(`Module already registered: ${normalized.id}`);
    }

    this._definitions.set(normalized.id, normalized);
    this._runtime.set(normalized.id, {
      state: MODULE_STATES.REGISTERED,
      namespace: null,
      error: null,
      activeContext: null,
    });
    return normalized;
  }

  registerMany(definitions) {
    return (definitions || []).map((definition) => this.register(definition));
  }

  has(moduleId) {
    return this._definitions.has(normalizeId(moduleId));
  }

  get(moduleId) {
    return this._definitions.get(normalizeId(moduleId)) || null;
  }

  list() {
    return [...this._definitions.values()];
  }

  state(moduleId) {
    const id = normalizeId(moduleId);
    const runtime = this._runtime.get(id);
    return runtime ? runtime.state : null;
  }

  canAccess(moduleId, user) {
    const definition = this.get(moduleId);
    if (!definition || !definition.enabled) return false;
    if (definition.roles.length === 0) return true;
    return definition.roles.includes(roleFromUser(user));
  }

  resolve(pathname, user = null) {
    const candidates = this.list()
      .map((definition) => ({ definition, score: routeScore(definition, pathname) }))
      .filter(({ definition, score }) => score >= 0 && this.canAccess(definition.id, user))
      .sort((a, b) => b.score - a.score || a.definition.id.localeCompare(b.definition.id));

    return candidates.length ? candidates[0].definition : null;
  }

  registerService(name, value, ownerModuleId = 'core') {
    const key = normalizeText(name);
    if (!key) throw new Error('Service name is required.');
    if (this._services.has(key)) throw new Error(`Service already registered: ${key}`);
    this._services.set(key, Object.freeze({ ownerModuleId: normalizeText(ownerModuleId) || 'core', value }));
    return value;
  }

  service(name) {
    return this._services.get(normalizeText(name))?.value ?? null;
  }

  async load(moduleId, context = {}) {
    const id = normalizeId(moduleId);
    const definition = this.get(id);
    const runtime = this._runtime.get(id);

    if (!definition || !runtime) throw new Error(`Unknown module: ${id}`);
    if (!definition.enabled) throw new Error(`Module disabled: ${id}`);
    if (!this.canAccess(id, context.user || null)) throw new Error(`Module access denied: ${id}`);

    if ([MODULE_STATES.LOADED, MODULE_STATES.ACTIVE, MODULE_STATES.INACTIVE].includes(runtime.state)) {
      return runtime.namespace;
    }
    if (!definition.entry) {
      throw new Error(`Module ${id} has no runtime entry point yet.`);
    }

    runtime.state = MODULE_STATES.LOADING;
    runtime.error = null;
    try {
      runtime.namespace = await import(definition.entry);
      runtime.state = MODULE_STATES.LOADED;
      if (typeof runtime.namespace?.onLoad === 'function') {
        await runtime.namespace.onLoad({ registry: this, definition, ...context });
      }
      return runtime.namespace;
    } catch (error) {
      runtime.state = MODULE_STATES.FAILED;
      runtime.error = error;
      throw error;
    }
  }

  async activate(moduleId, context = {}) {
    const id = normalizeId(moduleId);
    const definition = this.get(id);
    const runtime = this._runtime.get(id);
    if (!definition || !runtime) throw new Error(`Unknown module: ${id}`);
    if (!this.canAccess(id, context.user || null)) throw new Error(`Module access denied: ${id}`);

    const namespace = await this.load(id, context);
    if (typeof namespace?.onActivate === 'function') {
      await namespace.onActivate({ registry: this, definition, ...context });
    }
    runtime.activeContext = context;
    runtime.state = MODULE_STATES.ACTIVE;
    return namespace;
  }

  async deactivate(moduleId, context = {}) {
    const id = normalizeId(moduleId);
    const definition = this.get(id);
    const runtime = this._runtime.get(id);
    if (!definition || !runtime) return false;
    if (runtime.state !== MODULE_STATES.ACTIVE) return false;

    if (typeof runtime.namespace?.onDeactivate === 'function') {
      await runtime.namespace.onDeactivate({ registry: this, definition, ...context });
    }
    runtime.activeContext = null;
    runtime.state = MODULE_STATES.INACTIVE;
    return true;
  }

  snapshot() {
    return this.list().map((definition) => ({
      id: definition.id,
      label: definition.label,
      enabled: definition.enabled,
      lazy: definition.lazy,
      state: this.state(definition.id),
      hasRuntimeEntry: Boolean(definition.entry),
    }));
  }
}

export function createModuleRegistry(definitions = []) {
  const registry = new DDModuleRegistry();
  registry.registerMany(definitions);
  return registry;
}
